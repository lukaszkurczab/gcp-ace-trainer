import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt } from "../src/domain";
import { ALGORITHM_CONTENT_VERSION, AlgorithmContentCatalog, createAlgorithmReviewEntry, scoreAlgorithmQuestion, updateAlgorithmReviewEntry, type AlgorithmQuestion } from "../src/tracks/algorithms";
import { scoreCertificationQuestion } from "../src/tracks/cloud-certification";
import { makeQuestion } from "./fixtures";

test("Algorithms family responses preserve choice, ordering, and complexity scoring", () => {
  const feedbackModel = { mentalModelCorrection: "Review.", mistakeTypes: [], nextAction: "Continue.", result: "correct" as const, decisionSignal: "Signal." };
  const choice = { id: "fixture-choice", contentVersion: ALGORITHM_CONTENT_VERSION, difficulty: "core", learningStage: "foundations", primarySkillAtomId: "choice", prompt: "Choose", type: "single_choice", feedbackModel, options: [{ id: "a", text: "A", isCorrect: true }, { id: "b", text: "B", isCorrect: false }] } satisfies AlgorithmQuestion;
  const ordering = { id: "ordering", contentVersion: ALGORITHM_CONTENT_VERSION, difficulty: "core", learningStage: "foundations", primarySkillAtomId: "ordering", prompt: "Order", type: "subgoal_ordering", feedbackModel, subgoals: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctOrder: ["a", "b"] } satisfies AlgorithmQuestion;
  const complexity = { id: "complexity", contentVersion: ALGORITHM_CONTENT_VERSION, difficulty: "core", learningStage: "foundations", primarySkillAtomId: "complexity", prompt: "Complexity", type: "complexity_check", feedbackModel, correctComplexity: { dimensions: [{ id: "time", values: ["O(n)"], acceptedValues: ["O(n)"] }] } } satisfies AlgorithmQuestion;
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: choice.options.filter((option) => option.isCorrect).map((option) => option.id) }).result.kind, "correct");
  assert.equal(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ordering.correctOrder }).result.kind, "correct");
  const values = Object.fromEntries(complexity.correctComplexity.dimensions.map((dimension) => [dimension.id, dimension.acceptedValues[0] ?? ""]));
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: values }).result.kind, "correct");
});

test("Certification family preserves single and multiple selection scoring", () => {
  assert.equal(scoreCertificationQuestion(makeQuestion(), { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "correct");
  const multiple = makeQuestion({ type: "multiple", correctOptionIds: ["a", "c"] });
  assert.equal(scoreCertificationQuestion(multiple, { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "partial");
  assert.equal(scoreCertificationQuestion(multiple, { kind: "option_selection", selectedOptionIds: ["a", "c"] }).kind, "correct");
});

test("review transition preserves due counter, reset, resolution, and same-session protection", () => {
  const item = { id: "fixture-review", contentVersion: ALGORITHM_CONTENT_VERSION, difficulty: "core", learningStage: "foundations", primarySkillAtomId: "review", prompt: "Review", type: "single_choice", feedbackModel: { mentalModelCorrection: "Review.", mistakeTypes: [], nextAction: "Continue.", result: "correct" as const, decisionSignal: "Signal." }, options: [{ id: "a", text: "A", isCorrect: true }] } satisfies AlgorithmQuestion;
  const catalog = new AlgorithmContentCatalog([{ id: "fixture", roadmapNodeId: "fixture", questions: [item] }]);
  const base = (kind: "correct" | "incorrect", id: string, sessionId: string, committedAt: string) => createTrainingAttempt({ id, sessionId, trackId: "algorithms", modeId: "algorithms-review", item: catalog.toContentItemRef(item), response: { kind: "choice" as const, selectedOptionIds: [] }, result: { kind, earnedPoints: kind === "correct" ? 1 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: catalog.toContentItemRef(item), taxonomyOrSkillRefs: [] }, answeredAt: committedAt, committedAt });
  const original = base("incorrect", "attempt:s1:item", "s1", "2026-01-01T00:00:00.000Z");
  const entry = createAlgorithmReviewEntry(original, "2026-01-02T00:00:00.000Z");
  assert.equal(updateAlgorithmReviewEntry(entry, base("correct", "early", "s2", "2026-01-01T12:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  assert.equal(updateAlgorithmReviewEntry(entry, base("correct", "same", "s1", "2026-01-02T00:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
  const once = updateAlgorithmReviewEntry(entry, base("correct", "one", "s2", "2026-01-02T00:00:00.000Z")); assert.equal(once?.consecutiveAfterDueSuccesses, 1);
  assert.equal(updateAlgorithmReviewEntry(once!, base("correct", "two", "s3", "2026-01-03T00:00:00.000Z")), undefined);
  assert.equal(updateAlgorithmReviewEntry(once!, base("incorrect", "wrong", "s3", "2026-01-03T00:00:00.000Z"))?.consecutiveAfterDueSuccesses, 0);
});
