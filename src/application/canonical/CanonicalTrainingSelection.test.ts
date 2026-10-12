import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";
import { selectPracticeQuestions } from "./practiceQuestionSelector";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { TrainingAttempt } from "../../domain";

const NOW = "2026-09-23T00:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();

function attemptFor(track: CanonicalTrackRuntime, questionId: string, id: string, overrides: Partial<TrainingAttempt<unknown>> = {}): TrainingAttempt<unknown> {
  const item = { trackId: track.trackId, questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  return {
    id, sessionId: `prior:${id}`, trackId: track.trackId, modeId: "prior", occurrenceId: `prior:${id}:occurrence`, item,
    response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: NOW, committedAt: NOW,
    ...overrides,
  } as TrainingAttempt<unknown>;
}

function questionIds(track: CanonicalTrackRuntime, session: Awaited<ReturnType<ReturnType<typeof createCanonicalTrainingFamilyRuntime>["prepare"]>>["session"]): string[] {
  return session.itemOrder.map((entry) => entry.item.questionId);
}

test("ordinary sessions expand practiced coverage across coding, design and certification pools", async () => {
  const catalog = await catalogPromise;
  const families = [
    ["coding-interview-dsa-problem-solving", "coding-interview-learn-approach"],
    ["backend-system-design-interview", "design-interview-learn-framework"],
    ["google-cloud-associate-cloud-engineer", "certification-focus-practice"],
  ] as const;
  for (const [trackId, modeId] of families) {
    const track = catalog.getTrack(trackId);
    const pool = track.getPool(modeId);
    const runtime = createCanonicalTrainingFamilyRuntime(track);
    let priorAttempts: TrainingAttempt<unknown>[] = [];
    const allSelected = new Set<string>();
    let previousCoverage = 0;
    for (let round = 0; round < 3; round += 1) {
      const prepared = await runtime.prepare({ trackId, modeId, request: { sessionId: `${trackId}:round:${round}`, requestedLength: 10 }, attempts: priorAttempts, reviews: [], now: NOW });
      const ids = questionIds(track, prepared.session);
      const coverage = new Set(priorAttempts.filter((attempt) => pool.some((question) => question.questionId === attempt.item.questionId)).map((attempt) => attempt.item.questionId)).size;
      assert.ok(coverage >= previousCoverage, `${trackId} historical pool coverage regressed`);
      previousCoverage = coverage;
      assert.equal(new Set(ids).size, ids.length, `${trackId} repeated within a plan`);
      assert.ok(ids.every((id) => pool.some((question) => question.questionId === id)), `${trackId} escaped mode/free pool`);
      assert.ok(ids.some((id) => !allSelected.has(id)), `${trackId} did not expand the pool in round ${round}`);
      ids.forEach((id) => allSelected.add(id));
      priorAttempts = [...priorAttempts, ...ids.map((id, index) => attemptFor(track, id, `${round}:${index}`))];
      const repeated = await runtime.prepare({ trackId, modeId, request: { sessionId: `${trackId}:same-input`, requestedLength: 10 }, attempts: priorAttempts.slice(0, 3), reviews: [], now: NOW });
      const repeatedAgain = await runtime.prepare({ trackId, modeId, request: { sessionId: `${trackId}:same-input-2`, requestedLength: 10 }, attempts: priorAttempts.slice(0, 3), reviews: [], now: NOW });
      assert.deepEqual(questionIds(track, repeated.session), questionIds(track, repeatedAgain.session));
      await runtime.validateResume({ session: prepared.session, draft: null });
    }
    assert.ok(allSelected.size >= 10, `${trackId} should cover a complete eligible plan`);
  }
});

test("selection ignores attempts outside its pool or exact content pin and handles exhaustion", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const modeId = "certification-focus-practice";
  const pool = track.getPool(modeId).slice(0, 4);
  const unrelated = attemptFor(track, pool[0]!.questionId, "old-version", { item: { ...attemptFor(track, pool[0]!.questionId, "item").item, contentVersion: "old" } });
  const wrongTrack = attemptFor(track, pool[0]!.questionId, "wrong-track", { trackId: "other-track" });
  assert.deepEqual(selectPracticeQuestions(pool, [unrelated, wrongTrack], track, 4).map((q) => q.questionId), pool.map((q) => q.questionId));
  assert.equal(selectPracticeQuestions(pool, [], track, 20).length, 4);
  assert.throws(() => selectPracticeQuestions(pool, [], track, -1), /count is invalid/u);
});

test("a never-attempted question stays uncovered even when its unit has attempt history", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const eligible = track.getPool("coding-interview-learn-approach");
  const first = eligible[0]!;
  const pool = eligible.filter((question) => question.mentalUnitId === first.mentalUnitId);
  const freshInSameUnit = pool.find((question) => question.questionId !== first.questionId);
  assert.ok(freshInSameUnit, "fixture needs two questions in the selected unit");
  const attempts = [attemptFor(track, first.questionId, "attempted-question")];
  assert.equal(selectPracticeQuestions(pool, attempts, track, 1)[0]!.questionId, freshInSameUnit.questionId);
});

test("coverage-deficit targeting selects only required-unit questions without a latest correct answer", async () => {
  const track = (await catalogPromise).getTrack("claude-certified-architect-professional-certification");
  const pool = track.getPool("certification-focus-practice");
  const unitQuestions = pool.filter((question) => question.mentalUnitId === pool[0]!.mentalUnitId);
  assert.ok(unitQuestions.length >= 4, "fixture needs four distinct questions in the required unit");
  const targetQuestion = unitQuestions[2]!;
  const otherUnitQuestion = pool.find((question) => question.mentalUnitId !== targetQuestion.mentalUnitId)!;
  const attempts = [
    ...unitQuestions.slice(0, 4).filter((question) => question.questionId !== targetQuestion.questionId).map((question, index) => attemptFor(track, question.questionId, `coverage-correct-${index}`)),
    attemptFor(track, targetQuestion.questionId, "coverage-latest-wrong", { result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, answeredAt: "2026-09-24T00:00:00.000Z" } as Partial<TrainingAttempt<unknown>>),
    attemptFor(track, otherUnitQuestion.questionId, "coverage-other-unit"),
  ];
  const ordinary = selectPracticeQuestions(pool, attempts, track, 1);
  assert.notEqual(ordinary[0]!.questionId, targetQuestion.questionId, "global balance deprioritizes the required latest-wrong question behind another unit");
  const selected = selectPracticeQuestions(
    unitQuestions,
    attempts,
    track,
    4,
    new Set([targetQuestion.questionId]),
  );
  assert.equal(selected.length, 4);
  assert.equal(selected[0]!.questionId, targetQuestion.questionId, "coverage deficits lead the focused session");
  assert.ok(selected.every((question) => question.mentalUnitId === targetQuestion.mentalUnitId), "the selector fills only from the requested unit pool");
});

test("near-variant penalty is an exact-pin final tie-break for history and the current ordered plan", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const sameUnit = track.getPool("certification-focus-practice").reduce((groups, question) => {
    const key = `${question.nodeId}:${question.mentalUnitId}`;
    groups.set(key, [...(groups.get(key) ?? []), question]);
    return groups;
  }, new Map<string, typeof track.questions>()).values().next().value as typeof track.questions;
  assert.ok(sameUnit && sameUnit.length >= 3, "fixture needs three questions in one unit");
  const relation = (counterpartQuestionId: string, kind: "near_variant" | "condition_contrast" = "near_variant") => ({
    counterpartQuestionId, kind, changedCondition: "The caller can retry.", decisionBoundary: "Retry is safe only for idempotent operations.",
  });
  const candidate = { ...sameUnit[0]!, questionRelation: relation(sameUnit[1]!.questionId) };
  const unrelated = sameUnit[2]!;
  const currentPinPool = [
    { ...sameUnit[0]!, questionRelation: relation(sameUnit[1]!.questionId) },
    { ...sameUnit[1]!, questionRelation: relation(sameUnit[0]!.questionId) },
    sameUnit[2]!,
  ];
  const exactPinPeerAttempt = attemptFor(track, sameUnit[1]!.questionId, "near-peer-history");
  assert.deepEqual(selectPracticeQuestions([candidate, unrelated], [exactPinPeerAttempt], track, 1).map((question) => question.questionId), [unrelated.questionId]);
  const stalePeerAttempt = { ...exactPinPeerAttempt, item: { ...exactPinPeerAttempt.item, contentVersion: "older-version" } } as TrainingAttempt<unknown>;
  assert.deepEqual(selectPracticeQuestions([candidate, unrelated], [stalePeerAttempt], track, 1).map((question) => question.questionId), [candidate.questionId]);
  const foreignTrackPeerAttempt = { ...exactPinPeerAttempt, trackId: "other-track", item: { ...exactPinPeerAttempt.item, trackId: "other-track" } } as TrainingAttempt<unknown>;
  const staleShaPeerAttempt = { ...exactPinPeerAttempt, item: { ...exactPinPeerAttempt.item, artifactSha256: "b".repeat(64) } } as TrainingAttempt<unknown>;
  assert.deepEqual(selectPracticeQuestions([candidate, unrelated], [foreignTrackPeerAttempt, staleShaPeerAttempt], track, 1).map((question) => question.questionId), [candidate.questionId]);
  assert.deepEqual(selectPracticeQuestions(currentPinPool, [], track, 2).map((question) => question.questionId), [currentPinPool[0]!.questionId, currentPinPool[2]!.questionId]);

  const contrastPool = [
    { ...sameUnit[0]!, questionRelation: relation(sameUnit[1]!.questionId, "condition_contrast") },
    { ...sameUnit[1]!, questionRelation: relation(sameUnit[0]!.questionId, "condition_contrast") },
    sameUnit[2]!,
  ];
  assert.deepEqual(selectPracticeQuestions(contrastPool, [], track, 2).map((question) => question.questionId), [contrastPool[0]!.questionId, contrastPool[1]!.questionId]);
});
