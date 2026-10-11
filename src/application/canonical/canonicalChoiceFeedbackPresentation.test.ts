import assert from "node:assert/strict";
import test from "node:test";

import type { ChoiceSingleQuestion, Question } from "../../content/canonical";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion } from "../../content/canonical";
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

// Independent blind review on 2026-10-11 selected these stable IDs. Display positions
// in the external audit were different; the source-supported keys remain unchanged.
const claudeReviewedKeys = [
  ["CCARP-D01-O02-expansion-01", "a"],
  ["CCARP-D01-O02-expansion-02", "c"],
  ["CCARP-D01-O02-expansion-04", "b"],
  ["CCARP-D01-O02-expansion-05", "d"],
  ["CCARP-D01-O02-expansion-06", "b"],
  ["CCARP-D01-O02-expansion-07", "b"],
  ["CCARP-D01-O04-expansion-03", "c"],
  ["CCARP-D01-O04-expansion-04", "b"],
  ["CCARP-D01-O04-expansion-06", "b"],
  ["CCARP-D01-O04-expansion-08", "b"],
  ["CCARP-D01-O04-expansion-09", "b"],
  ["CCARP-D01-O04-expansion-10", "b"],
  ["CCARP-D01-O04-expansion-12", "b"],
  ["CCARP-D01-O04-expansion-13", "b"],
  ["CCARP-D01-O04-expansion-14", "b"],
  ["CCARP-D02-O01-expansion-02", "c"],
  ["CCARP-D02-O01-expansion-03", "b"],
  ["CCARP-D02-O01-expansion-04", "b"],
  ["CCARP-D01-O03-expansion-01", "d"],
  ["CCARP-D01-O03-expansion-02", "c"],
  ["CCARP-D01-O03-expansion-03", "b"],
  ["CCARP-D01-O03-expansion-05", "c"],
  ["CCARP-D01-O03-expansion-07", "a"],
  ["CCARP-D01-O06-expansion-01", "a"],
  ["CCARP-D01-O06-expansion-02", "b"],
  ["CCARP-D01-O06-expansion-03", "b"],
  ["CCARP-D01-O06-expansion-04", "b"],
  ["CCARP-D01-O06-expansion-06", "b"],
  ["CCARP-D01-O05-expansion-01", "a"],
  ["CCARP-D01-O05-expansion-02", "b"],
  ["CCARP-D01-O05-expansion-03", "b"],
  ["CCARP-D01-O05-expansion-04", "b"],
  ["CCARP-D01-O05-expansion-06", "b"],
  ["CCARP-D01-O01-expansion-01", "a"],
  ["CCARP-D01-O01-expansion-02", "b"],
  ["CCARP-D01-O01-expansion-04", "b"],
  ["CCARP-D01-O01-expansion-06", "b"],
  ["CCARP-D02-O04-expansion-14", "a"],
] as const;

function optionPermutations(ids: readonly string[]): string[][] {
  if (ids.length === 0) return [[]];
  return ids.flatMap((id, index) => optionPermutations(ids.filter((_, i) => i !== index)).map(rest => [id, ...rest]));
}

test("38 reviewed Claude items score and present exact selected-option feedback after every option shuffle", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("claude-certified-architect-professional-certification");
  assert.equal(claudeReviewedKeys.length, 38);
  for (const [questionId, acceptedId] of claudeReviewedKeys) {
    const question = track.getQuestion(questionId) as ChoiceSingleQuestion;
    assert.ok(question, questionId);
    assert.equal(question.interaction.type, "choice_single");
    assert.equal(question.answer.optionId, acceptedId, questionId);
    const options = question.interaction.options;
    for (const order of optionPermutations(options.map(option => option.optionId))) {
      const shuffled = { ...question, interaction: { ...question.interaction, options: order.map(id => options.find(option => option.optionId === id)!) } };
      for (const optionId of order) {
        const response = { type: "choice_single" as const, optionId };
        const score = scoreCanonicalQuestion(shuffled, response);
        assert.deepEqual([score.kind, score.earnedPoints, score.maxPoints], optionId === acceptedId ? ["correct", 1, 1] : ["incorrect", 0, 1], `${questionId}/${optionId}`);
        const expected = question.feedback.messages!.filter(message => message.kind === "wrong_option" && message.targetId === optionId);
        assert.equal(expected.length, optionId === acceptedId ? 0 : 1, `${questionId}/${optionId} feedback`);
        assert.deepEqual(projectCanonicalChoiceFeedbackMessages(shuffled, response), expected);
        const controls = projectCanonicalChoiceFeedbackControls(shuffled, response);
        assert.deepEqual(controls.map(control => control.id), order);
        assert.equal(controls.find(control => control.id === optionId)?.state, optionId === acceptedId ? "correct" : "incorrect");
        if (optionId !== acceptedId) assert.equal(controls.find(control => control.id === acceptedId)?.state, "omitted_correct");
      }
    }
  }
  const capacity = track.getQuestion("CCARP-D02-O04-expansion-14") as ChoiceSingleQuestion;
  assert.match(capacity.interaction.options.find(option => option.optionId === "a")!.text, /authorized, meaning-preserving reduction/);
  assert.match(capacity.interaction.options.find(option => option.optionId === "a")!.text, /explicit capacity failure or use an already approved alternate route/);
  assert.match(capacity.feedback.reason, /Do not silently discard mandatory instructions, evidence, or output capacity/);
});
