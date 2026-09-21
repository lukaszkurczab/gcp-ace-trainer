import assert from "node:assert/strict";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { projectCanonicalChoiceFeedbackControls } from "./canonicalInteractionPresentation";

const single = {
  answer: { optionId: "c", type: "choice_single" },
  interaction: { options: ["a", "b", "c", "d"].map((optionId) => ({ optionId, text: optionId.toUpperCase() })), scoringMethod: "exact_selected_set", type: "choice_single" },
  questionId: "single",
} as unknown as Question;

const multiple = {
  answer: { optionIds: ["a", "c"], type: "choice_multiple" },
  interaction: { options: ["a", "b", "c", "d"].map((optionId) => ({ optionId, text: optionId.toUpperCase() })), scoringMethod: "exact_selected_set", type: "choice_multiple" },
  questionId: "multiple",
} as unknown as Question;

test("single choice feedback exposes selected incorrect, omitted correct and remaining neutral", () => {
  assert.deepEqual(projectCanonicalChoiceFeedbackControls(single, { optionId: "b", type: "choice_single" }), [
    { id: "a", state: "neutral" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "omitted_correct" },
    { id: "d", state: "neutral" },
  ]);
});

test("multi choice feedback preserves every selected and correct combination", () => {
  assert.deepEqual(projectCanonicalChoiceFeedbackControls(multiple, { optionIds: ["a", "b"], type: "choice_multiple" }), [
    { id: "a", state: "correct" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "omitted_correct" },
    { id: "d", state: "neutral" },
  ]);
});

test("choice feedback rejects a mismatched response contract", () => {
  assert.throws(() => projectCanonicalChoiceFeedbackControls(single, { optionIds: ["c"], type: "choice_multiple" }), /does not match single/u);
});
