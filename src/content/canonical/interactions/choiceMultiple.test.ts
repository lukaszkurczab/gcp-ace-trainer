import assert from "node:assert/strict";
import test from "node:test";
import { choiceMultipleHandler, isChoiceMultipleResponseValidPartial, type ChoiceMultipleQuestion } from "./choiceMultiple";

const question: ChoiceMultipleQuestion = {
  questionId: "multi-review", trackId: "claude-certified-architect-professional-certification", nodeId: "domain-1", mentalUnitId: "unit-1", prompt: "Choose exactly two.", difficulty: null,
  interaction: { type: "choice_multiple", scoringMethod: "exact_selected_set", requiredSelectionCount: 2, options: [{ optionId: "a", text: "Correct A" }, { optionId: "b", text: "Correct B" }, { optionId: "c", text: "Wrong C" }] },
  answer: { type: "choice_multiple", optionIds: ["a", "b"] },
  feedback: { type: "choice_multiple", reason: "Exact set.", details: "Both correct options are required.", messages: [{ kind: "wrong_option", targetId: "c", text: "C is incorrect." }, { kind: "omitted_option", targetId: "b", text: "B is missing." }] },
};

test("partial multiple choice keeps selected options and diagnostics in review without a submitted score", () => {
  const partial = { type: "choice_multiple" as const, optionIds: ["c"] };
  assert.equal(choiceMultipleHandler.isComplete(question, partial), false);
  assert.equal(choiceMultipleHandler.evaluate(question, partial).feedback, null);
  const review = choiceMultipleHandler.presentReview(question, partial, []);
  assert.ok(review.feedback);
  assert.deepEqual(review.diagnostics, [{ id: "a", state: "omitted_correct" }, { id: "b", state: "omitted_correct" }, { id: "c", state: "incorrect" }]);
  assert.deepEqual((review.model as { renderer: { options: readonly { id: string; selected: boolean }[] } }).renderer.options.filter((option) => option.selected).map((option) => option.id), ["c"]);
});

test("CCAR-P multiple choice partials reject duplicate, unknown and over-limit values", () => {
  assert.equal(isChoiceMultipleResponseValidPartial(question, { type: "choice_multiple", optionIds: ["a", "a"] }), false);
  assert.equal(isChoiceMultipleResponseValidPartial(question, { type: "choice_multiple", optionIds: ["unknown"] }), false);
  assert.equal(isChoiceMultipleResponseValidPartial(question, { type: "choice_multiple", optionIds: ["a", "b", "c"] }), false);
});
