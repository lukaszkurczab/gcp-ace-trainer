import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt, type ReviewQueueEntry } from "../src/domain";
import { algorithmContentCatalog, buildAlgorithmProgressFacts, buildAlgorithmWeakAreaRecommendation } from "../src/tracks/algorithms";

const question = algorithmContentCatalog.getItems()[0]!;
const ref = algorithmContentCatalog.toContentItemRef(question);
function attempt(kind: "correct" | "partial" | "incorrect", id: string, answeredAt = "2026-01-01T00:00:00.000Z") {
  return createTrainingAttempt({ id, sessionId: "session", trackId: "algorithms", modeId: "guided", item: ref, response: {}, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "mistake_type", nodeId: "wrong_pattern" }] }, answeredAt, committedAt: answeredAt });
}
function review(): ReviewQueueEntry { return { id: "review", trackId: "algorithms", sourceAttemptId: "bad", sourceSessionId: "session", reasons: ["incorrect", "repeated_mistake"], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "mistake_type", nodeId: "wrong_pattern" }] }; }

test("Algorithms progress derives latest item outcome from canonical attempts", () => {
  const facts = buildAlgorithmProgressFacts([attempt("incorrect", "old"), attempt("correct", "new", "2026-01-02T00:00:00.000Z")]);
  assert.equal(facts.itemsCompleted, 1);
  assert.equal(facts.correctCount, 1);
  assert.equal(facts.incorrectCount, 0);
});

test("Algorithms progress derives due remediation and repeated-mistake recommendation from canonical review evidence", () => {
  const facts = buildAlgorithmProgressFacts([attempt("incorrect", "bad")], undefined, undefined, [review()], "2026-01-03T00:00:00.000Z");
  assert.equal(facts.nodeProgress.some((node) => node.remediationDueCount === 1), true);
  assert.equal(facts.nodeProgress.some((node) => node.criticalRemediationDueCount === 1), true);
  assert.deepEqual(buildAlgorithmWeakAreaRecommendation([attempt("incorrect", "bad")]).selectedMistakeTypes, ["wrong_pattern"]);
});

test("Algorithms progress exposes no synthetic readiness, retention percentage, mastery percentage, or confidence", () => {
  const facts = buildAlgorithmProgressFacts([]);
  const serialized = JSON.stringify(facts);
  assert.equal(serialized.includes("readinessPercent"), false);
  assert.equal(serialized.includes("retentionPercent"), false);
  assert.equal(serialized.includes("masteryPercent"), false);
  assert.equal(serialized.includes("confidence"), false);
});
