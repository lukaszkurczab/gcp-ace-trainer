import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../../content/canonical";
import { toCanonicalPracticeResponse } from "./codingInterviewSessionFacade";

const base = { questionId: "q", trackId: "coding-interview-dsa-problem-solving", nodeId: "n", mentalUnitId: "m", prompt: "Prompt", difficulty: null, feedback: { reason: "Reason", details: "Details" } } as const;

test("coding facade converts every supported UI response into the canonical response union", () => {
  const single = { ...base, interaction: { type: "choice_single", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { optionId: "a" } } as unknown as Question;
  const multiple = { ...base, interaction: { type: "choice_multiple", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { optionIds: ["a"] } } as unknown as Question;
  const ordering = { ...base, interaction: { type: "ordering", elements: [{ elementId: "a", text: "A" }, { elementId: "b", text: "B" }] }, answer: { orderedElementIds: ["a", "b"] } } as unknown as Question;
  const complexity = { ...base, interaction: { type: "complexity", dimensions: [{ dimensionId: "time", values: [{ valueId: "n", text: "O(n)" }, { valueId: "n2", text: "O(n²)" }] }] }, answer: { selectedValueIdsByDimension: { time: ["n", "n2"] } } } as unknown as Question;
  const matrix = { ...base, interaction: { type: "decision_matrix", dimensions: [{ dimensionId: "cost", values: [{ valueId: "low", text: "Low" }, { valueId: "medium", text: "Medium" }] }] }, answer: { selectedValueIdsByDimension: { cost: ["low", "medium"] } } } as unknown as Question;

  assert.deepEqual(toCanonicalPracticeResponse(single.interaction.type, { kind: "choice", selectedOptionIds: ["a"] }), { type: "choice_single", optionId: "a" });
  assert.deepEqual(toCanonicalPracticeResponse(multiple.interaction.type, { kind: "choice", selectedOptionIds: ["a", "b"] }), { type: "choice_multiple", optionIds: ["a", "b"] });
  assert.deepEqual(toCanonicalPracticeResponse(ordering.interaction.type, { kind: "ordering", orderedSubgoalIds: ["b", "a"] }), { type: "ordering", orderedElementIds: ["b", "a"] });
  assert.deepEqual(toCanonicalPracticeResponse(complexity.interaction.type, { kind: "complexity", selectedValuesByDimension: { time: ["n", "n2"] } }), { type: "complexity", selectedValueIdsByDimension: { time: ["n", "n2"] } });
  assert.deepEqual(toCanonicalPracticeResponse(matrix.interaction.type, { kind: "complexity", selectedValuesByDimension: { cost: ["low", "medium"] } }), { type: "decision_matrix", selectedValueIdsByDimension: { cost: ["low", "medium"] } });
  assert.throws(() => toCanonicalPracticeResponse(single.interaction.type, { kind: "ordering", orderedSubgoalIds: ["a"] }), /does not match/);
});
