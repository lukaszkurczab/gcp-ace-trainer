import assert from "node:assert/strict";
import test from "node:test";

import { scoreAlgorithmQuestion, type AlgorithmQuestion } from "../src/tracks/algorithms";

const feedbackModel = { mentalModelCorrection: "Review.", mistakeTypes: [], nextAction: "Continue.", result: "correct" as const, decisionSignal: "Signal." };
const base = { contentVersion: "algorithms-core", difficulty: "core", learningStage: "foundations", primarySkillAtomId: "skill", prompt: "Prompt", feedbackModel } as const;
const choice = { ...base, id: "choice", type: "single_choice" as const, options: [{ id: "a", text: "A", isCorrect: true }, { id: "b", text: "B", isCorrect: true }, { id: "x", text: "X", isCorrect: false }] } satisfies AlgorithmQuestion;
const ordering = { ...base, id: "ordering", type: "subgoal_ordering" as const, subgoals: ["a", "b", "c", "d"].map((id) => ({ id, text: id })), correctOrder: ["a", "b", "c", "d"] } satisfies AlgorithmQuestion;
const complexity = { ...base, id: "complexity", type: "complexity_check" as const, correctComplexity: { dimensions: [{ id: "time" as const, values: ["O(n)", "O(n^2)"], acceptedValues: ["O(n)"], acceptedAliases: ["linear"] }, { id: "space" as const, values: ["O(1)", "O(n)"], acceptedValues: ["O(1)"] }] } } satisfies AlgorithmQuestion;

test("Algorithms choice scores full set, proper subset, empty, and any wrong option canonically", () => {
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a", "b"] }).result.kind, "correct");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a"] }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: [] }).result.kind, "incorrect");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a", "x"] }).result.kind, "incorrect");
});

test("Algorithms ordering scores canonical adjacent relations", () => {
  assert.deepEqual(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "b", "c", "d"] }).result, { kind: "correct", earnedPoints: 3, maxPoints: 3, components: undefined });
  assert.equal(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "b", "d", "c"] }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["d", "c", "b", "a"] }).result.kind, "incorrect");
});

test("Algorithms complexity scores dimensions and accepts content-defined aliases", () => {
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(n)", space: "O(1)" } }).result.kind, "correct");
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "linear", space: "O(n)" } }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(n^2)", space: "O(n)" } }).result.kind, "incorrect");
});

test("Algorithms scorer rejects response-kind, ordering, and complexity payload mismatches", () => {
  assert.throws(() => scoreAlgorithmQuestion(choice, { kind: "ordering", orderedSubgoalIds: [] }));
  assert.throws(() => scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "a", "c", "d"] }));
  assert.throws(() => scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(log n)", space: "O(1)" } }));
});
