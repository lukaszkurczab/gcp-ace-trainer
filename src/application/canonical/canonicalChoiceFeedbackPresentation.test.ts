import assert from "node:assert/strict";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls, projectCanonicalChoiceFeedbackMessages } from "./canonicalInteractionPresentation";
import { prepareCanonicalOptionOrder, projectCanonicalQuestionInSessionOrder } from "./canonicalOptionOrder";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";

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

test("the 28 repaired AWS SAA items retain scoring and authored feedback after deterministic option shuffle", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("aws-certified-solutions-architect-associate");
  const suffixes = [
    "N07-B06-012", "N07-B04-005", "N07-B04-006", "N04-B02-006", "N04-B05-011", "N04-B01-015",
    "N07-B01-007", "N07-B01-010", "N07-B02-013", "N07-B07-006",
    "N07-B05-001", "N07-B05-002", "N07-B05-003", "N07-B05-004", "N07-B05-005-saa20261011", "N07-B05-006",
    "N04-B01-011", "N04-B05-015", "N04-B03-016",
    "N04-B06-010", "N04-B06-011", "N04-B06-012", "N04-B06-013", "N04-B06-014", "N04-B06-015", "N04-B06-016", "N04-B06-018", "N04-B07-012",
  ];
  assert.equal(suffixes.length, 28);
  assert.equal(track.getQuestion("aws-saa-c03-AWSSAA-N07-B05-005"), undefined, "the replaced service-fit question cannot be silently rebound to cutover semantics");
  for (const suffix of suffixes) {
    const question = track.getQuestion(`aws-saa-c03-AWSSAA-${suffix}`)!;
    assert.ok(question, suffix);
    assert.equal(question.answer.type, "choice_single");
    if (question.answer.type !== "choice_single") throw new Error(`Unexpected answer type: ${suffix}`);
    assert.equal(question.answer.optionId, "A");
    const orders = new Set<string>();
    const correctPositions = new Set<number>();
    for (let seed = 0; seed < 16; seed += 1) {
      const order = prepareCanonicalOptionOrder(question, `saa-fixes-${suffix}-${seed}`, track);
      orders.add(order.join(","));
      correctPositions.add(order.indexOf("A"));
      assert.deepEqual(order, prepareCanonicalOptionOrder(question, `saa-fixes-${suffix}-${seed}`, track));
      const displayed = projectCanonicalQuestionInSessionOrder(question, order);
      const beforeAnswer = buildCanonicalInteractionViewModel(displayed, null);
      assert.equal(beforeAnswer.renderer.kind, "choice");
      if (beforeAnswer.renderer.kind !== "choice") throw new Error(`Unexpected renderer: ${suffix}`);
      assert.deepEqual(beforeAnswer.renderer.options.map(option => option.id), order);
      assert.ok(beforeAnswer.renderer.options.every(option => !option.selected));
      assert.deepEqual(Object.keys(beforeAnswer).sort(), ["accessibility", "renderer"], "pre-answer model contains no answer or feedback");
      assert.ok("options" in displayed.interaction);
      if (!("options" in displayed.interaction)) throw new Error(`Unexpected interaction: ${suffix}`);
      for (const option of displayed.interaction.options) {
        const response = { type: "choice_single" as const, optionId: option.optionId };
        const score = scoreCanonicalQuestion(displayed, response);
        assert.equal(score.earnedPoints, option.optionId === "A" ? 1 : 0, `${suffix}/${option.optionId}`);
        const expected = question.feedback.messages!.filter(message => message.kind === "wrong_option" && message.targetId === option.optionId);
        if (option.optionId !== "A") assert.equal(expected.length, 1, `${suffix}/${option.optionId} authored feedback`);
        assert.deepEqual(projectCanonicalChoiceFeedbackMessages(displayed, response), expected);
        const feedback = composeCanonicalFeedback(displayed, response);
        assert.equal(feedback.reason, question.feedback.reason);
        assert.deepEqual(feedback.details, question.feedback.details);
        assert.deepEqual(feedback.messages, expected);
      }
    }
    assert.ok(orders.size > 1, `${suffix} must exercise different orders`);
    assert.ok(correctPositions.size > 1, `${suffix} must move the correct option between displayed positions`);
  }
});
