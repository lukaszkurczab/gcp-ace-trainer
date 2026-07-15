import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt, type ReviewQueueEntry } from "../src/domain";
import { ALGORITHM_CONTENT_VERSION, buildAlgorithmProgressFacts, buildAlgorithmWeakAreaRecommendation, type AlgorithmContentGroup, type AlgorithmQuestion } from "../src/tracks/algorithms";

const question = { id: "fixture-progress", contentVersion: ALGORITHM_CONTENT_VERSION, difficulty: "core", learningStage: "foundations", primarySkillAtomId: "fixture", prompt: "Fixture", type: "single_choice", feedbackModel: { mentalModelCorrection: "", mistakeTypes: [], nextAction: "", result: "correct", decisionSignal: "" }, options: [{ id: "a", text: "A", isCorrect: true }] } satisfies AlgorithmQuestion;
const groups: readonly AlgorithmContentGroup[] = [{ id: "complexity_and_constraints", roadmapNodeId: "complexity_and_constraints", questions: [question] }];
const ref = { trackId: "algorithms" as const, itemId: question.id, contentVersion: question.contentVersion };
function attempt(kind: "correct" | "partial" | "incorrect", id: string, answeredAt = "2026-01-01T00:00:00.000Z") {
  return createTrainingAttempt({ occurrenceId: "occurrence-1", id, sessionId: "session", trackId: "algorithms", modeId: "guided", item: ref, response: {}, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "mistake_type", nodeId: "wrong_pattern" }] }, answeredAt, committedAt: answeredAt });
}
function review(): ReviewQueueEntry { return { id: "review", trackId: "algorithms", sourceAttemptId: "bad", sourceSessionId: "session", reasons: ["incorrect", "repeated_mistake"], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "mistake_type", nodeId: "wrong_pattern" }] }; }

test("Algorithms progress derives latest item outcome from canonical attempts", () => {
  const facts = buildAlgorithmProgressFacts([attempt("incorrect", "old"), attempt("correct", "new", "2026-01-02T00:00:00.000Z")], groups);
  assert.equal(facts.itemsCompleted, 1);
  assert.equal(facts.correctCount, 1);
  assert.equal(facts.incorrectCount, 0);
});

test("Algorithms progress derives due remediation and repeated-mistake recommendation from canonical review evidence", () => {
  const facts = buildAlgorithmProgressFacts([attempt("incorrect", "bad")], groups, undefined, [review()], "2026-01-03T00:00:00.000Z");
  assert.equal(facts.nodeProgress.some((node) => node.remediationDueCount === 1), true);
  assert.equal(facts.nodeProgress.some((node) => node.criticalRemediationDueCount === 1), true);
  assert.deepEqual(buildAlgorithmWeakAreaRecommendation([attempt("incorrect", "bad")], groups).selectedMistakeTypes, ["wrong_pattern"]);
});

test("Algorithms progress exposes no synthetic readiness, retention percentage, mastery percentage, or confidence", () => {
  const facts = buildAlgorithmProgressFacts([], groups);
  const serialized = JSON.stringify(facts);
  assert.equal(serialized.includes("readinessPercent"), false);
  assert.equal(serialized.includes("retentionPercent"), false);
  assert.equal(serialized.includes("masteryPercent"), false);
  assert.equal(serialized.includes("confidence"), false);
});
