import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt, createTrainingSession, createResolvedContentRef, calibrateObservedPlanningTime, type TrainingAttempt, type TrainingSession } from "..";

const TRACK = "coding-interview-dsa-problem-solving";
const VERSION = "catalog-v2";
const SHA = "c".repeat(64);
const POLICY_IDENTITY = { contentVersion: "policy-v2", artifactSha256: "d".repeat(64), policyVersion: "authored-v1" };
const ESTIMATE = "guided-practice-unit-a-v1";
const policy = { policyVersion: "authored-v1", workEstimates: [
  { estimateId: ESTIMATE, modeId: "mode", scopeRefs: [{ nodeId: "node-a", mentalUnitId: "unit-a" }] },
  { estimateId: "guided-practice-unit-b-v1", modeId: "mode", scopeRefs: [{ nodeId: "node-a", mentalUnitId: "unit-b" }] },
] };
const questions = [
  ...Array.from({ length: 4 }, (_, index) => ({ questionId: `q-a-${index}`, nodeId: "node-a", mentalUnitId: "unit-a" })),
  ...Array.from({ length: 4 }, (_, index) => ({ questionId: `q-b-${index}`, nodeId: "node-a", mentalUnitId: "unit-b" })),
];

function sampleSession(index: number, activeForegroundMs: number, mixedFirst = false, unit = "unit-a"): { session: TrainingSession; attempts: TrainingAttempt[] } {
  const sessionId = `session-${unit}-${index}`;
  const selectedQuestions = questions.filter((question) => question.mentalUnitId === unit).slice(0, 4).map((question, itemIndex) => mixedFirst && itemIndex === 0 ? questions.find((candidate) => candidate.mentalUnitId !== unit)! : question);
  const itemOrder = selectedQuestions.map((question, itemIndex) => ({ occurrenceId: `${sessionId}:occ:${itemIndex}`, item: createResolvedContentRef({ trackId: TRACK, questionId: question.questionId, contentVersion: VERSION, artifactSha256: SHA }) }));
  const completedAt = `2026-10-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`;
  const session = createTrainingSession({
    id: sessionId, trackId: TRACK, modeId: "mode", configurationSnapshot: { kind: "practice" },
    requestedLength: 4, actualLength: 4, currentItemIndex: 3, itemOrder, optionOrderByOccurrence: {}, activeForegroundMs,
    contentVersion: VERSION, artifactSha256: SHA, status: "completed", startedAt: "2026-10-01T12:00:00.000Z", completedAt,
  });
  const attempts = itemOrder.map(({ occurrenceId, item }, attemptIndex) => createTrainingAttempt({
    id: `${sessionId}:attempt:${attemptIndex}`, sessionId, trackId: TRACK, modeId: "mode", occurrenceId, item, response: {},
    result: attemptIndex === 0 ? { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } : { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: completedAt, committedAt: completedAt,
  }));
  return { session, attempts };
}

function calibrate(samples: readonly ReturnType<typeof sampleSession>[], estimateId = ESTIMATE, caseFormat?: { caseId: string; caseVersion: string }) {
  return calibrateObservedPlanningTime({ sessions: samples.map(({ session }) => session), attempts: samples.flatMap(({ attempts }) => attempts), questions, policy, estimateId, trackId: TRACK, modeId: "mode", contentVersion: VERSION, artifactSha256: SHA, planningPolicyIdentity: POLICY_IDENTITY, caseFormat });
}

test("uses authored estimate scope and median foreground time including incorrect responses", () => {
  const samples = [0.5, 1, 1.5, 2, 7.5].map((minutes, index) => sampleSession(index, minutes * 4 * 60_000));
  const result = calibrate(samples);
  assert.equal(result.kind, "observed");
  if (result.kind === "observed") {
    assert.equal(result.medianActiveMinutesPerResponse, 1.5);
    assert.equal(result.sessionCount, 5);
    assert.equal(result.answerCount, 20);
    assert.equal(result.observationCount, 20);
    assert.equal(result.estimateId, ESTIMATE);
    assert.equal(result.policyVersion, "authored-v1");
  }
});

test("requires both five comparable sessions and twenty unique answered occurrences", () => {
  assert.deepEqual(calibrate(Array.from({ length: 4 }, (_, index) => sampleSession(index, 60_000))), { kind: "unavailable", reason: "insufficient_comparable_sessions" });
  const tooFewAnswers = Array.from({ length: 5 }, (_, index) => {
    const sample = sampleSession(index, 60_000);
    return { session: { ...sample.session, itemOrder: sample.session.itemOrder.slice(0, 3), actualLength: 3, requestedLength: 3, currentItemIndex: 2 }, attempts: sample.attempts.slice(0, 3) };
  });
  assert.deepEqual(calibrate(tooFewAnswers), { kind: "unavailable", reason: "insufficient_comparable_sessions" });
});

test("uses at most the ten most recent comparable sessions", () => {
  const samples = Array.from({ length: 11 }, (_, index) => sampleSession(index, (index === 0 ? 100 : 2) * 4 * 60_000));
  const result = calibrate(samples);
  assert.equal(result.kind, "observed");
  if (result.kind === "observed") {
    assert.equal(result.sessionCount, 10);
    assert.equal(result.sessionIds.includes("session-0"), false);
    assert.equal(result.medianActiveMinutesPerResponse, 2);
  }
});

test("ignores incomplete or stale-content sessions and does not mix work estimates", () => {
  const good = sampleSession(1, 60_000);
  const mixed = sampleSession(2, 60_000, true);
  const result = calibrate([
    good,
    { session: { ...sampleSession(3, 60_000).session, status: "active", completedAt: undefined }, attempts: sampleSession(3, 60_000).attempts },
    mixed,
    sampleSession(4, 60_000), sampleSession(5, 60_000), sampleSession(6, 60_000), sampleSession(7, 60_000),
  ]);
  assert.equal(result.kind, "observed");
  if (result.kind === "observed") assert.equal(result.sessionCount, 5);
});

test("rejects a session with conflicting committed attempts for one occurrence", () => {
  const samples = Array.from({ length: 5 }, (_, index) => sampleSession(index, 4 * 60_000));
  const first = samples[0]!.attempts[0]!;
  const conflict = createTrainingAttempt({ ...first, id: `${first.id}:conflict`, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } });
  const withConflict = [{ ...samples[0]!, attempts: [...samples[0]!.attempts, conflict] }, ...samples.slice(1)];
  assert.deepEqual(calibrate(withConflict), { kind: "unavailable", reason: "insufficient_comparable_sessions" });
});

test("calibrates each authored estimate class independently when recent classes are interleaved", () => {
  const a = Array.from({ length: 5 }, (_, index) => sampleSession(index, (index + 1) * 4 * 60_000, false, "unit-a"));
  const b = Array.from({ length: 5 }, (_, index) => sampleSession(index, (index + 2) * 4 * 60_000, false, "unit-b"));
  assert.equal(calibrate([...a, ...b], ESTIMATE).kind, "observed");
  assert.equal(calibrate([...a, ...b], "guided-practice-unit-b-v1").kind, "observed");
});

function caseSample(index: number, caseId = "case-a") {
  const sample = sampleSession(index, 4 * 60_000);
  const session: TrainingSession = { ...sample.session, configurationSnapshot: { ...sample.session.configurationSnapshot, preset: "single_case" }, caseState: { policyVersion: "claude-case-evidence-v1", caseId, caseVersion: "1", priorExposedStepIds: [], hintShownStepIds: [], solutionExposedStepIds: [] } };
  return { ...sample, session };
}

test("ordinary same-pin sessions cannot unlock whole-case calibration or inherit its rate", () => {
  const ordinary = Array.from({ length: 5 }, (_, index) => sampleSession(index, 60_000));
  assert.equal(calibrate(ordinary, ESTIMATE, { caseId: "case-a", caseVersion: "1" }).kind, "unavailable");
  const cases = Array.from({ length: 5 }, (_, index) => caseSample(index));
  assert.equal(calibrate(cases).kind, "unavailable");
  const result = calibrate(cases, ESTIMATE, { caseId: "case-a", caseVersion: "1" });
  assert.equal(result.kind, "observed");
  if (result.kind === "observed") { assert.equal(result.sessionCount, 5); assert.equal(result.answerCount, 20); assert.equal(result.medianActiveMinutesPerResponse, 1); }
  assert.equal(calibrate(cases, ESTIMATE, { caseId: "case-b", caseVersion: "1" }).kind, "unavailable");
  assert.equal(calibrate(cases, ESTIMATE, { caseId: "case-a", caseVersion: "2" }).kind, "unavailable");
});

test("mixed case-block timers are not apportioned into standalone response calibration", () => {
  const samples = Array.from({ length: 5 }, (_, index) => {
    const sample = caseSample(index);
    const { caseState, ...session } = sample.session;
    return { ...sample, session: { ...session, configurationSnapshot: { kind: "practice", caseBlockPolicy: "claude-case-blocks-v1" }, caseStates: [caseState!] } };
  });
  assert.equal(calibrate(samples).kind, "unavailable");
  assert.equal(calibrate(samples, ESTIMATE, { caseId: "case-a", caseVersion: "1" }).kind, "unavailable");
});
