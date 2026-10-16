import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTrainingSessionError,
  createTrainingSession,
  type TrainingSession,
} from "../../domain";
import { getTrainingSessionProgress } from "../trainingSessions";

const ARTIFACT_SHA256 = "a".repeat(64);

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return createTrainingSession({
    id: "session-1",
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-learn-approach",
    configurationSnapshot: { feedbackMode: "afterEachAnswer", kind: "practice", mode: "coding-interview-learn-approach", timer: "elapsedForeground", topicId: "arrays" },
    requestedLength: 2,
    actualLength: 2,
    currentItemIndex: 0,
    itemOrder: ["one", "two"].map((questionId) => ({ occurrenceId: `occurrence-${questionId}`, item: { trackId: "coding-interview-dsa-problem-solving", questionId, contentVersion: "v1", artifactSha256: ARTIFACT_SHA256 } })),
    optionOrderByOccurrence: { "occurrence-one": ["b", "a"], "occurrence-two": ["d", "c"] },
    activeForegroundMs: 100,
    contentVersion: "v1", artifactSha256: ARTIFACT_SHA256,
    status: "active",
    startedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  });
}

test("configuration snapshot is validated and frozen for deterministic resume", () => {
  const configured = session();
  assert.deepEqual(configured.configurationSnapshot, {
    feedbackMode: "afterEachAnswer", kind: "practice", mode: "coding-interview-learn-approach", timer: "elapsedForeground", topicId: "arrays",
  });
  assert.ok(Object.isFrozen(configured.configurationSnapshot));
  assert.throws(() => createTrainingSession({ ...session(), configurationSnapshot: {} }), InvalidTrainingSessionError);
});

test("durable progress hydrates prior attempts and the answered current item in plan order", () => {
  const active = session({ currentItemIndex: 1 });
  const makeAttempt = (id: string, questionId: string) => ({
    id, sessionId: active.id, trackId: active.trackId, modeId: active.modeId,
    occurrenceId: `occurrence-${questionId}`,
    item: active.itemOrder.find((occurrence) => occurrence.item.questionId === questionId)!.item, response: { selectedOptionIds: ["a"] },
    result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder.find((occurrence) => occurrence.item.questionId === questionId)!.item, taxonomyOrSkillRefs: [] },
    answeredAt: active.startedAt, committedAt: active.startedAt,
  });
  const prior = makeAttempt("a1", "one");
  const current = makeAttempt("a2", "two");
  const other = { ...prior, id: "other", sessionId: "another-session" };
  const progress = getTrainingSessionProgress(active, [current, other, prior]);
  assert.deepEqual(progress.attempts.map((attempt) => attempt.id), ["a1", "a2"]);
  assert.equal(progress.currentAttempt?.id, "a2");
  assert.throws(() => getTrainingSessionProgress(active, [current, { ...current, id: "duplicate" }]), /multiple committed attempts/);
  assert.throws(() => getTrainingSessionProgress(active, [{ ...current, item: { ...current.item, trackId: "outside-track" } }]), /does not belong/);
});

test("duplicate exact content items are distinct through immutable occurrence identities", () => {
  const duplicatePlan = session({
    itemOrder: ["first", "second"].map((suffix) => ({ occurrenceId: `occurrence-${suffix}`, item: { trackId: "coding-interview-dsa-problem-solving", questionId: "one", contentVersion: "v1", artifactSha256: ARTIFACT_SHA256 } })),
    optionOrderByOccurrence: { "occurrence-first": ["a", "b"], "occurrence-second": ["a", "b"] },
  });
  const makeAttempt = (id: string, occurrenceId: string) => ({ id, occurrenceId, sessionId: duplicatePlan.id, trackId: duplicatePlan.trackId, modeId: duplicatePlan.modeId, item: duplicatePlan.itemOrder[0]!.item, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: duplicatePlan.itemOrder[0]!.item, taxonomyOrSkillRefs: [] }, answeredAt: duplicatePlan.startedAt, committedAt: duplicatePlan.startedAt });
  assert.equal(getTrainingSessionProgress(duplicatePlan, [makeAttempt("a1", "occurrence-first"), makeAttempt("a2", "occurrence-second")]).attempts.length, 2);
  assert.throws(() => createTrainingSession({ ...duplicatePlan, itemOrder: [duplicatePlan.itemOrder[0]!, duplicatePlan.itemOrder[0]!] }), /occurrence identities/);
  assert.throws(() => getTrainingSessionProgress(duplicatePlan, [makeAttempt("a1", "occurrence-first"), makeAttempt("a2", "occurrence-first")]), /multiple committed attempts/);
  assert.throws(() => getTrainingSessionProgress(duplicatePlan, [{ ...makeAttempt("a1", "occurrence-first"), item: { ...duplicatePlan.itemOrder[0]!.item, contentVersion: "outside-content" } }]), /does not belong/);
});
