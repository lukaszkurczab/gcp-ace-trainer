import assert from "node:assert/strict";
import test from "node:test";
import { REVIEW_REASONS, createTrainingAttempt, type AttemptResult } from "../src/domain";
import { createAlgorithmReviewEntry, updateAlgorithmReviewEntry } from "../src/tracks/algorithms";
import { createCertificationReviewEntry } from "../src/tracks/cloud-certification";

const item = { trackId: "algorithms", itemId: "item", contentVersion: "v1" };
function attempt(kind: AttemptResult["kind"], id: string, sessionId: string, committedAt: string) {
  return createTrainingAttempt({ id, sessionId, trackId: "algorithms", modeId: "review", item, response: { kind: "choice" as const, selectedOptionIds: [] }, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "skill", nodeId: "two-pointers" }, { axisId: "mistake_type", nodeId: "wrong_pattern" }] }, answeredAt: committedAt, committedAt });
}

test("incorrect and partial attempts create remediation entries with source and taxonomy evidence", () => {
  for (const kind of ["incorrect", "partial"] as const) {
    const entry = createAlgorithmReviewEntry(attempt(kind, `attempt-${kind}`, "source-session", "2026-01-01T00:00:00.000Z"));
    assert.deepEqual(entry.reasons, [kind]);
    assert.equal(entry.sourceSessionId, "source-session");
    assert.equal(entry.sourceItem.itemId, "item");
    assert.equal(entry.taxonomyOrSkillRefs.length, 2);
  }
});

test("correct Algorithms attempt creates scheduled retrieval while correct Certification attempt creates none", () => {
  const correct = attempt("correct", "correct", "session", "2026-01-01T00:00:00.000Z");
  assert.deepEqual(createAlgorithmReviewEntry(correct).reasons, ["scheduled_retrieval"]);
  assert.equal(createCertificationReviewEntry({ ...correct, trackId: "cloud-certification", item: { ...item, trackId: "cloud-certification" }, reviewEvidence: { ...correct.reviewEvidence, sourceItem: { ...item, trackId: "cloud-certification" } }, response: { kind: "option_selection", selectedOptionIds: ["a"] } }), undefined);
});

test("review transition counts only after due, resets on incorrect and partial, and resolves after two successes", () => {
  const entry = createAlgorithmReviewEntry(attempt("incorrect", "source", "source-session", "2026-01-01T00:00:00.000Z"), "2026-01-02T00:00:00.000Z");
  assert.equal(updateAlgorithmReviewEntry(entry, attempt("correct", "early", "other", "2026-01-01T12:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  const once = updateAlgorithmReviewEntry(entry, attempt("correct", "one", "other", "2026-01-02T00:00:00.000Z"));
  assert.equal(once?.consecutiveAfterDueSuccesses, 1);
  assert.equal(updateAlgorithmReviewEntry(once!, attempt("incorrect", "wrong", "other", "2026-01-03T00:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  assert.equal(updateAlgorithmReviewEntry(once!, attempt("partial", "partial", "other", "2026-01-03T00:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  assert.equal(updateAlgorithmReviewEntry(once!, attempt("correct", "two", "third", "2026-01-03T00:00:00.000Z")), undefined);
});

test("same-session correction does not resolve persistent review and only canonical reasons exist", () => {
  const entry = createAlgorithmReviewEntry(attempt("incorrect", "opaque-attempt-id", "same-session", "2026-01-01T00:00:00.000Z"), "2026-01-02T00:00:00.000Z");
  assert.equal(updateAlgorithmReviewEntry(entry, attempt("correct", "correction", "same-session", "2026-01-02T00:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  assert.deepEqual(REVIEW_REASONS, ["incorrect", "partial", "hint_used", "wrong_pattern", "wrong_strategy", "complexity_error", "repeated_mistake", "scheduled_retrieval", "weak_taxonomy_area", "manual_mark"]);
});
