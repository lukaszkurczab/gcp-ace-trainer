import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidTrainingSessionError,
  abandonTrainingSession,
  advanceTrainingSession,
  completeTrainingSession,
  createTrainingSession,
  getCurrentSessionItem,
  moveTrainingSessionToIndex,
} from "../src/domain";

const refs = ["one", "two", "three"].map((itemId) => ({ trackId: "algorithms", itemId, contentVersion: "v1" }));
const occurrences = refs.map((item, index) => ({ occurrenceId: `occurrence-${index}`, item }));
function active() {
  return createTrainingSession({ id: "session", trackId: "algorithms", modeId: "guided", configurationSnapshot: { kind: "practice" }, requestedLength: 5, actualLength: 3, currentItemIndex: 0, itemOrder: occurrences, optionOrderByOccurrence: { "occurrence-0": ["b", "a"] }, activeForegroundMs: 12, contentVersion: "v1", status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
}

test("session creation preserves requested and actual lengths, immutable item order, option order, and no response", () => {
  const session = active();
  assert.equal(session.requestedLength, 5);
  assert.equal(session.actualLength, 3);
  assert.deepEqual(session.itemOrder, occurrences);
  assert.deepEqual(session.optionOrderByOccurrence["occurrence-0"], ["b", "a"]);
  assert.equal("response" in session, false);
});

test("active session advances and persisted current position resumes deterministically", () => {
  const advanced = advanceTrainingSession(active());
  assert.equal(advanced.currentItemIndex, 1);
  assert.equal(getCurrentSessionItem(advanced).itemId, "two");
  assert.equal(createTrainingSession({ ...advanced }).currentItemIndex, 1);
});

test("session supports valid direct navigation but rejects an invalid item index", () => {
  assert.equal(moveTrainingSessionToIndex(active(), 2).currentItemIndex, 2);
  assert.throws(() => moveTrainingSessionToIndex(active(), -1), InvalidTrainingSessionError);
  assert.throws(() => moveTrainingSessionToIndex(active(), 3), InvalidTrainingSessionError);
});

test("completion fixes position at the final item and cannot advance", () => {
  const completed = completeTrainingSession(active(), "2026-01-01T01:00:00.000Z");
  assert.equal(completed.status, "completed");
  assert.equal(completed.currentItemIndex, 2);
  assert.throws(() => advanceTrainingSession(completed), InvalidTrainingSessionError);
});

test("abandonment preserves committed position and cannot advance", () => {
  const abandoned = abandonTrainingSession(advanceTrainingSession(active()));
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.currentItemIndex, 1);
  assert.throws(() => advanceTrainingSession(abandoned), InvalidTrainingSessionError);
});

test("session rejects mismatched track, content version, duplicate references, and invalid completion position", () => {
  const session = active();
  assert.throws(() => createTrainingSession({ ...session, itemOrder: [{ ...occurrences[0]!, item: { ...refs[0]!, trackId: "cloud-certification" } }, occurrences[1]!, occurrences[2]!] }), InvalidTrainingSessionError);
  assert.throws(() => createTrainingSession({ ...session, itemOrder: [{ ...occurrences[0]!, item: { ...refs[0]!, contentVersion: "v2" } }, occurrences[1]!, occurrences[2]!] }), InvalidTrainingSessionError);
  assert.throws(() => createTrainingSession({ ...session, itemOrder: [occurrences[0]!, occurrences[0]!, occurrences[2]!] }), InvalidTrainingSessionError);
  assert.throws(() => createTrainingSession({ ...session, status: "completed", currentItemIndex: 1 }), InvalidTrainingSessionError);
});
