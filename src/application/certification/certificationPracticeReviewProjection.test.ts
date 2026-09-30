import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import { type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { createCertificationPracticeAnswerFixture } from "../../testing/certificationPracticeAnswerFixture";
import { projectCertificationPracticeReview } from "./certificationPracticeReviewProjection";

const fixturePromise = createCertificationPracticeAnswerFixture();

test("completed practice projector preserves the canonical five-state answer matrix", async () => {
  const fixture = await fixturePromise;
  assert.deepEqual(fixture.projection.items.slice(0, 5).map((item) => item.result), ["correct", "incorrect", "correct", "partial", "incorrect"]);
  assert.deepEqual(fixture.projection.items.slice(0, 5).map((item) => item.selectionMode), ["single", "single", "multiple", "multiple", "multiple"]);
  assert.equal(fixture.projection.total, 10);
  assert.equal(fixture.projection.items[2]?.selectedOptionIds.join(","), "b,d");
  assert.equal(fixture.projection.items[3]?.selectedOptionIds.length, 1);
  assert.deepEqual(fixture.result.evidence.details, { activeForegroundMs: 0, correctCount: 7, partialCount: 1, incorrectCount: 2, pointsEarned: 15, maxPoints: 22 });
});

test("practice review rejects altered identity, coverage, attempts, score, and resolution", async () => {
  const fixture = await fixturePromise;
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(fixture.session.trackId);
  const resolveQuestion = async (item: CompletedTrainingSession["itemOrder"][number]["item"]) => {
    assert.equal(item.trackId, track.trackId);
    assert.equal(item.contentVersion, track.contentVersion);
    assert.equal(item.artifactSha256, track.artifactSha256);
    return track.getQuestion(item.questionId)!;
  };
  const project = (result = fixture.result, attempts: readonly TrainingAttempt<unknown>[] = fixture.attempts, session = fixture.session) => projectCertificationPracticeReview({ attempts, resolveQuestion, result, session });
  await assert.rejects(project({ ...fixture.result, unansweredOccurrenceIds: ["invented"] } as TrainingSessionResult), /completion evidence/i);
  await assert.rejects(project(fixture.result, fixture.attempts.slice(1)), /missing or duplicated/i);
  const assertPreflightRejectsWithoutResolving = async (attempts: readonly TrainingAttempt<unknown>[]) => {
    let resolverCalls = 0;
    await assert.rejects(projectCertificationPracticeReview({
      attempts,
      resolveQuestion: async (item) => { resolverCalls += 1; return track.getQuestion(item.questionId)!; },
      result: fixture.result,
      session: fixture.session,
    }), /immutable session plan/i);
    assert.equal(resolverCalls, 0);
  };
  const lastAttempt = fixture.attempts.at(-1)!;
  const badLastItem = { ...lastAttempt, item: { ...lastAttempt.item, questionId: "CCARP-D01-O01-diagnosis" } } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastItem]);
  const badLastTrack = { ...lastAttempt, trackId: "google-cloud-associate-cloud-engineer" } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastTrack]);
  const badLastMode = { ...lastAttempt, modeId: "certification-diagnostic-baseline" } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastMode]);
  const badScore = { ...fixture.attempts[0]!, result: { ...fixture.attempts[0]!.result, earnedPoints: 0, kind: "incorrect" } } as TrainingAttempt<unknown>;
  await assert.rejects(project(fixture.result, [badScore, ...fixture.attempts.slice(1)]), /invalid result/i);
  const wrongQuestion = { ...fixture.session.itemOrder[0]!.item, questionId: "CCARP-D01-O01-diagnosis" };
  await assert.rejects(project(fixture.result, fixture.attempts, { ...fixture.session, itemOrder: [{ ...fixture.session.itemOrder[0]!, item: wrongQuestion }, ...fixture.session.itemOrder.slice(1)] } as CompletedTrainingSession), /immutable session plan/i);
  await assert.rejects(projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => track.getQuestion(item.questionId === "CCARP-D01-O01-boundary" ? "CCARP-D01-O01-diagnosis" : item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  }), /immutable session plan/i);
});
