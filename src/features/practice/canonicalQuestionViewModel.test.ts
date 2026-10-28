import assert from "node:assert/strict";
import test from "node:test";

import { isCanonicalResponseComplete, scoreCanonicalQuestion, type Question } from "../../content/canonical";
import { canonicalResponseToPracticeLocalResponse, toCanonicalQuestionViewModel, toCertificationQuestionViewModel } from "./canonicalQuestionViewModel";
import { toggleDimensionSelection } from "./practiceSessionPresentation";

const question = {
  questionId: "complexity-multi-value",
  trackId: "coding-interview-dsa-problem-solving",
  nodeId: "complexity_and_constraints",
  mentalUnitId: "complexity",
  prompt: "Select all valid values.",
  difficulty: null,
  constraints: [],
  interaction: {
    type: "complexity",
    scoringMethod: "dimension_exact",
    dimensions: [
      { dimensionId: "time", label: "Time", values: [{ valueId: "linear", text: "O(n)" }, { valueId: "quadratic", text: "O(n²)" }], acceptedValueIds: ["linear", "quadratic"] },
      { dimensionId: "space", label: "Space", values: [{ valueId: "constant", text: "O(1)" }, { valueId: "linear-space", text: "O(n)" }], acceptedValueIds: ["constant"] },
    ],
  },
  answer: { type: "complexity", selectedValueIdsByDimension: { time: ["linear", "quadratic"], space: ["constant"] } },
  feedback: { type: "complexity", reason: "Reason", details: "Details" },
} as unknown as Question;

test("dimension checkbox selections keep stable IDs, round-trip, and preserve legal partial scoring", () => {
  const renderer = toCanonicalQuestionViewModel(question).interaction;
  assert.equal(renderer.interactionType, "complexity");
  const rendererModel = (renderer.model as { renderer: { kind: string; dimensions: readonly { id: string; values: readonly { id: string; text: string }[] }[] } }).renderer;
  assert.deepEqual(rendererModel.dimensions[0]?.values, [{ id: "linear", text: "O(n)" }, { id: "quadratic", text: "O(n²)" }]);

  let selected = toggleDimensionSelection({}, "time", "linear");
  selected = toggleDimensionSelection(selected, "time", "quadratic");
  selected = toggleDimensionSelection(selected, "space", "constant");
  const canonical = { type: "complexity" as const, selectedValueIdsByDimension: selected };
  assert.deepEqual(canonical, { type: "complexity", selectedValueIdsByDimension: { time: ["linear", "quadratic"], space: ["constant"] } });
  assert.equal(isCanonicalResponseComplete(question, canonical), true);
  assert.equal(scoreCanonicalQuestion(question, canonical).kind, "correct");
  assert.deepEqual(canonicalResponseToPracticeLocalResponse(canonical), { kind: "complexity", selectedValuesByDimension: selected });

  const partialSelection = toggleDimensionSelection(selected, "time", "quadratic");
  const partialCanonical = { type: "complexity" as const, selectedValueIdsByDimension: partialSelection };
  assert.equal(isCanonicalResponseComplete(question, partialCanonical), true);
  assert.equal(scoreCanonicalQuestion(question, partialCanonical).kind, "partial");

  const emptySelection = toggleDimensionSelection(partialSelection, "time", "linear");
  assert.deepEqual(emptySelection.time, []);
  assert.equal(isCanonicalResponseComplete(question, { type: "complexity", selectedValueIdsByDimension: emptySelection }), false);
});

test("certification statement controls project allowed values without requiring or revealing an answer key", () => {
  const model = toCertificationQuestionViewModel({ questionId: "statement-fixture", nodeId: "tools", prompt: "Assess each statement.", interaction: { type: "decision_matrix", dimensions: [{ dimensionId: "row-1", label: "Tool access requires authorization.", values: [{ valueId: "yes", text: "Yes" }, { valueId: "no", text: "No" }] }] } });
  assert.equal(model.interaction.interactionType, "decision_matrix");
  assert.deepEqual(model.interaction.model, { renderer: { kind: "complexity", dimensions: [{ id: "row-1", label: "Tool access requires authorization.", values: [{ id: "yes", text: "Yes" }, { id: "no", text: "No" }] }] } });
  assert.doesNotMatch(JSON.stringify(model), /answer|acceptedValueIds|correctValueIds/);
});
