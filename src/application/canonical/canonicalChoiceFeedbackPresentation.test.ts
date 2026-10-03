import assert from "node:assert/strict";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import { composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls, projectCanonicalChoiceFeedbackMessages } from "./canonicalInteractionPresentation";

const single = {
  answer: { optionId: "c", type: "choice_single" },
  feedback: { details: "Details", reason: "Reason" },
  interaction: { options: ["a", "b", "c", "d"].map((optionId) => ({ optionId, text: optionId.toUpperCase() })), scoringMethod: "exact_selected_set", type: "choice_single" },
  questionId: "single",
} as unknown as Question;

const multiple = {
  answer: { optionIds: ["a", "c"], type: "choice_multiple" },
  feedback: { details: "Details", reason: "Reason" },
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

test("authored choice messages follow selected incorrect and omitted correct stable IDs in authored order", () => {
  const authored = [
    { kind: "wrong_option", targetId: "d", text: "D explanation" },
    { kind: "wrong_option", targetId: "b", text: "B explanation" },
    { kind: "wrong_option", targetId: "a", text: "A explanation" },
  ] as const;
  const withMessages = { ...single, feedback: { reason: "reason", details: "details", messages: authored } } as unknown as Question;
  const projected = projectCanonicalChoiceFeedbackMessages(withMessages, { optionId: "b", type: "choice_single" });
  assert.deepEqual(projected, [authored[1]]);
  assert.equal(Object.isFrozen(projected), true);
  assert.deepEqual(composeCanonicalFeedback(withMessages, { optionId: "b", type: "choice_single" }).messages, [authored[1]]);
});

test("multiple choice messages include only selected wrong and omitted correct targets regardless of response order", () => {
  const authored = [
    { kind: "omitted_option", targetId: "c", text: "C omitted" },
    { kind: "wrong_option", targetId: "b", text: "B wrong" },
    { kind: "wrong_option", targetId: "d", text: "D wrong" },
    { kind: "omitted_option", targetId: "a", text: "A selected" },
  ] as const;
  const withMessages = { ...multiple, feedback: { reason: "reason", details: "details", messages: authored } } as unknown as Question;
  const first = projectCanonicalChoiceFeedbackMessages(withMessages, { optionIds: ["b", "a", "d"], type: "choice_multiple" });
  const permuted = projectCanonicalChoiceFeedbackMessages(withMessages, { optionIds: ["d", "b", "a"], type: "choice_multiple" });
  assert.deepEqual(first, [authored[0], authored[1], authored[2]]);
  assert.deepEqual(permuted, first);
});

test("message projection preserves absent-message and non-choice behavior, and freezes provided empty results", () => {
  assert.equal(projectCanonicalChoiceFeedbackMessages(single, { optionId: "b", type: "choice_single" }), undefined);
  const noMatches = { ...single, feedback: { reason: "reason", details: "details", messages: [{ kind: "wrong_option", targetId: "a", text: "A" }] } } as unknown as Question;
  const empty = projectCanonicalChoiceFeedbackMessages(noMatches, { optionId: "c", type: "choice_single" });
  assert.deepEqual(empty, []);
  assert.equal(Object.isFrozen(empty), true);
  const ordering = { ...single, interaction: { type: "ordering" } } as unknown as Question;
  assert.equal(projectCanonicalChoiceFeedbackMessages(ordering, { optionId: "b", type: "choice_single" }), undefined);
});

test("real GCP and Coding artifacts deliver exact selected-wrong authored messages", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const cases = [
    { trackId: "google-cloud-associate-cloud-engineer", questionId: "gcp-ace-gcpace-n01-b02-001", selectedId: "B" },
    { trackId: "coding-interview-dsa-problem-solving", questionId: "alg-contrast-binary-scan-correctness-006", selectedId: "binary_without_sort" },
  ] as const;
  for (const entry of cases) {
    const question = catalog.getTrack(entry.trackId).getQuestion(entry.questionId)!;
    assert.ok(question);
    assert.ok(question.feedback.messages?.length);
    const response = { type: "choice_single" as const, optionId: entry.selectedId };
    const expected = question.feedback.messages!.filter((message) => message.kind === "wrong_option" && message.targetId === entry.selectedId);
    assert.ok(expected.length > 0, `${entry.questionId} must have reviewed authored feedback for ${entry.selectedId}`);
    assert.deepEqual(projectCanonicalChoiceFeedbackMessages(question, response), expected);
    assert.deepEqual(composeCanonicalFeedback(question, response).messages, expected);
  }
});
