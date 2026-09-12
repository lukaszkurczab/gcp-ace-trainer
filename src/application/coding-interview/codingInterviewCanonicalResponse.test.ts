import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../../content/canonical";
import { toCanonicalPracticeResponse } from "./codingInterviewSessionFacade";

const base = { questionId: "q", trackId: "coding-interview-dsa-problem-solving", nodeId: "n", mentalUnitId: "m", prompt: "Prompt", difficulty: null, feedback: { reason: "Reason", details: "Details" } } as const;

test("coding facade converts every supported UI response into the canonical response union", () => {
  const single = { ...base, interaction: { type: "choice_single", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { optionId: "a" } } as unknown as Question;
  const multiple = { ...base, interaction: { type: "choice_multiple", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { optionIds: ["a"] } } as unknown as Question;
  const ordering = { ...base, interaction: { type: "ordering", elements: [{ elementId: "a", text: "A" }, { elementId: "b", text: "B" }] }, answer: { orderedElementIds: ["a", "b"] } } as unknown as Question;
  const complexity = { ...base, interaction: { type: "complexity", dimensions: [{ dimensionId: "time", values: [{ valueId: "n", text: "O(n)" }] }] }, answer: { acceptedValueIdsByDimension: { time: ["n"] } } } as unknown as Question;
  const matrix = { ...base, interaction: { type: "decision_matrix", dimensions: [{ dimensionId: "cost", values: [{ valueId: "low", text: "Low" }] }] }, answer: { acceptedValueIdsByDimension: { cost: ["low"] } } } as unknown as Question;

  assert.deepEqual(toCanonicalPracticeResponse(single, { kind: "choice", selectedOptionIds: ["a"] }), { type: "choice_single", optionId: "a" });
  assert.deepEqual(toCanonicalPracticeResponse(multiple, { kind: "choice", selectedOptionIds: ["a", "b"] }), { type: "choice_multiple", optionIds: ["a", "b"] });
  assert.deepEqual(toCanonicalPracticeResponse(ordering, { kind: "ordering", orderedSubgoalIds: ["b", "a"] }), { type: "ordering", orderedElementIds: ["b", "a"] });
  assert.deepEqual(toCanonicalPracticeResponse(complexity, { kind: "complexity", selectedValuesByDimension: { time: "n" } }), { type: "complexity", selectedValueIdsByDimension: { time: ["n"] } });
  assert.deepEqual(toCanonicalPracticeResponse(matrix, { kind: "complexity", selectedValuesByDimension: { cost: "low" } }), { type: "decision_matrix", selectedValueIdsByDimension: { cost: ["low"] } });
  assert.throws(() => toCanonicalPracticeResponse(single, { kind: "ordering", orderedSubgoalIds: ["a"] }), /does not match/);
});
