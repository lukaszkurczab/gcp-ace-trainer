import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import type { Question } from "../../content/canonical";
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
  assert.equal(fixture.projection.overallPointsEarned, fixture.attempts.filter((attempt) => attempt.result.kind === "correct").reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0));
  assert.ok(fixture.projection.overallPointsEarned < fixture.projection.items.reduce((sum, item) => sum + fixture.attempts.find((attempt) => attempt.occurrenceId === item.occurrenceId)!.result.earnedPoints, 0));
  assert.deepEqual(fixture.result.evidence.details, { activeForegroundMs: 0, correctCount: 7, partialCount: 1, incorrectCount: 2, pointsEarned: 15, maxPoints: 22 });
});

test("completed practice review projects authored wrong and omitted-correct messages from the saved response only", async () => {
  const fixture = await fixturePromise;
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(fixture.session.trackId);
  const authoredMessagesByQuestion = new Map<string, Question>();
  for (const occurrence of fixture.session.itemOrder) {
    const question = track.getQuestion(occurrence.item.questionId)!;
    if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") throw new Error("Expected a canonical choice question.");
    const correctIds = question.answer.type === "choice_single" ? [question.answer.optionId] : question.answer.type === "choice_multiple" ? question.answer.optionIds : [];
    const messages = [
      ...question.interaction.options.filter((option) => !correctIds.includes(option.optionId)).map((option) => ({ kind: "wrong_option" as const, targetId: option.optionId, text: `Wrong option ${option.optionId}.` })),
      ...(question.interaction.type === "choice_multiple" ? correctIds.map((optionId) => ({ kind: "omitted_option" as const, targetId: optionId, text: `Omitted correct option ${optionId}.` })) : []),
    ];
    authoredMessagesByQuestion.set(question.questionId, { ...question, feedback: { ...question.feedback, messages } } as Question);
  }
  const projection = await projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => authoredMessagesByQuestion.get(item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  });

  assert.equal(projection.items[0]?.result, "correct");
  assert.deepEqual(projection.items[0]?.messages, []);
  const wrong = projection.items[1]!;
  assert.equal(wrong.result, "incorrect");
  const wrongSelected = wrong.selectedOptionIds.filter((id) => !wrong.correctOptionIds.includes(id));
  const omittedCorrect = wrong.selectionMode === "multiple" ? wrong.correctOptionIds.filter((id) => !wrong.selectedOptionIds.includes(id)) : [];
  assert.deepEqual(wrong.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId), wrongSelected);
  assert.deepEqual(wrong.messages?.filter((message) => message.kind === "omitted_option").map((message) => message.targetId), omittedCorrect);
  const partial = projection.items[3]!;
  assert.equal(partial.result, "partial");
  assert.deepEqual(partial.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId), partial.selectedOptionIds.filter((id) => !partial.correctOptionIds.includes(id)));
  assert.deepEqual(partial.messages?.filter((message) => message.kind === "omitted_option").map((message) => message.targetId), partial.correctOptionIds.filter((id) => !partial.selectedOptionIds.includes(id)));

  const noAuthoredMessagesId = fixture.session.itemOrder[5]!.item.questionId;
  const noAuthored = track.getQuestion(noAuthoredMessagesId)!;
  const { messages: _messages, ...feedbackWithoutMessages } = noAuthored.feedback;
  authoredMessagesByQuestion.set(noAuthoredMessagesId, { ...noAuthored, feedback: feedbackWithoutMessages } as Question);
  const withoutAuthored = await projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => authoredMessagesByQuestion.get(item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  });
  assert.equal("messages" in withoutAuthored.items[5]!, false);
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
