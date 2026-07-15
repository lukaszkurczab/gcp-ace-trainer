import assert from "node:assert/strict";
import test from "node:test";
import { InvalidAttemptResultError, InvalidTrainingSessionError, REVIEW_REASONS, createAttemptResult, createTrainingAttempt, createTrainingSession } from "../src/domain";

const ref = { trackId: "future-certification", itemId: "item-1", contentVersion: "v1" };
test("kernel accepts open track ids and enforces canonical session invariants", () => {
  const session = createTrainingSession({ id: "s1", trackId: ref.trackId, modeId: "practice", configurationSnapshot: { kind: "practice" }, requestedLength: 3, actualLength: 1, currentItemIndex: 0, itemOrder: [ref], optionOrderByItem: { "item-1": ["b", "a"] }, activeForegroundMs: 0, contentVersion: "v1", status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(session.requestedLength, 3); assert.deepEqual(session.optionOrderByItem["item-1"], ["b", "a"]); assert.equal(session.currentItemIndex, 0); assert.equal("response" in session, false);
  assert.throws(() => createTrainingSession({ ...session, actualLength: 2 }), InvalidTrainingSessionError);
  assert.throws(() => createTrainingSession({ ...session, requestedLength: 0 }), InvalidTrainingSessionError);
  assert.throws(() => createTrainingSession({ ...session, status: "expired" as "active" }), InvalidTrainingSessionError);
});

test("attempt result constructor enforces kind, range, and component totals", () => {
  assert.deepEqual(createAttemptResult({ kind: "correct", earnedPoints: 2, maxPoints: 2 }).kind, "correct");
  assert.deepEqual(createAttemptResult({ kind: "partial", earnedPoints: 1, maxPoints: 2 }).kind, "partial");
  assert.deepEqual(createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: 2 }).kind, "incorrect");
  for (const result of [{ kind: "correct", earnedPoints: 1, maxPoints: 2 }, { kind: "incorrect", earnedPoints: 1, maxPoints: 2 }, { kind: "partial", earnedPoints: 0, maxPoints: 2 }, { kind: "partial", earnedPoints: 2, maxPoints: 2 }, { kind: "incorrect", earnedPoints: -1, maxPoints: 2 }, { kind: "correct", earnedPoints: 3, maxPoints: 2 }, { kind: "incorrect", earnedPoints: 0, maxPoints: 0 }] as const) assert.throws(() => createAttemptResult(result), InvalidAttemptResultError);
  assert.throws(() => createAttemptResult({ kind: "partial", earnedPoints: 1, maxPoints: 2, components: [{ id: "a", earnedPoints: 1, maxPoints: 1 }] }), InvalidAttemptResultError);
});

test("attempt, evidence, reasons, and learning evidence stay family neutral", () => {
  const result = createAttemptResult({ kind: "correct", earnedPoints: 1, maxPoints: 1 });
  const attempt = createTrainingAttempt({ id: "a1", sessionId: "s1", trackId: ref.trackId, modeId: "practice", item: ref, response: { selected: "a" }, result, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "skill", nodeId: "one" }] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(Object.isFrozen(attempt), true);
  assert.deepEqual(REVIEW_REASONS, ["incorrect", "partial", "hint_used", "wrong_pattern", "wrong_strategy", "complexity_error", "repeated_mistake", "scheduled_retrieval", "weak_taxonomy_area", "manual_mark"]);
});
