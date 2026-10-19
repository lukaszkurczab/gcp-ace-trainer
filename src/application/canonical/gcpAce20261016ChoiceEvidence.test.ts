import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion, type ChoiceSingleQuestion } from "../../content/canonical";
import { prepareCanonicalOptionOrder, projectCanonicalQuestionInSessionOrder, isCanonicalOptionOrder } from "./canonicalOptionOrder";
import { buildCanonicalInteractionViewModel, projectCanonicalChoiceFeedbackMessages } from "./canonicalInteractionPresentation";

// Independent current cases from the 2026-10-16 audit, including the explicit
// B05-010 → B05-019 semantic replacement accepted on 2026-10-18.
const AUDITED_IDS = [
  "gcp-ace-gcpace-n02-b01-001",
  "gcp-ace-gcpace-n02-b01-002",
  "gcp-ace-gcpace-n02-b01-003",
  "gcp-ace-gcpace-n02-b01-004",
  "gcp-ace-gcpace-n02-b01-005",
  "gcp-ace-gcpace-n02-b01-006",
  "gcp-ace-gcpace-n02-b01-007",
  "gcp-ace-gcpace-n02-b01-008",
  "gcp-ace-gcpace-n02-b01-009",
  "gcp-ace-gcpace-n02-b01-010",
  "gcp-ace-gcpace-n02-b01-011",
  "gcp-ace-gcpace-n02-b01-012",
  "gcp-ace-gcpace-n02-b01-013",
  "gcp-ace-gcpace-n02-b01-014",
  "gcp-ace-gcpace-n02-b01-015",
  "gcp-ace-gcpace-n02-b01-016",
  "gcp-ace-gcpace-n02-b01-017",
  "gcp-ace-gcpace-n02-b01-018",
  "gcp-ace-gcpace-n02-b02-001",
  "gcp-ace-gcpace-n02-b02-002",
  "gcp-ace-gcpace-n02-b02-003",
  "gcp-ace-gcpace-n02-b02-004",
  "gcp-ace-gcpace-n02-b02-005",
  "gcp-ace-gcpace-n02-b02-006",
  "gcp-ace-gcpace-n02-b02-007",
  "gcp-ace-gcpace-n02-b02-008",
  "gcp-ace-gcpace-n02-b02-009",
  "gcp-ace-gcpace-n02-b02-010",
  "gcp-ace-gcpace-n02-b02-011",
  "gcp-ace-gcpace-n02-b02-012",
  "gcp-ace-gcpace-n02-b02-013",
  "gcp-ace-gcpace-n02-b02-014",
  "gcp-ace-gcpace-n02-b02-015",
  "gcp-ace-gcpace-n02-b02-016",
  "gcp-ace-gcpace-n02-b02-017",
  "gcp-ace-gcpace-n02-b02-018",
  "gcp-ace-gcpace-n02-b03-001",
  "gcp-ace-gcpace-n02-b03-002",
  "gcp-ace-gcpace-n02-b03-003",
  "gcp-ace-gcpace-n02-b03-004",
  "gcp-ace-gcpace-n02-b03-005",
  "gcp-ace-gcpace-n02-b03-006",
  "gcp-ace-gcpace-n02-b03-007",
  "gcp-ace-gcpace-n02-b03-008",
  "gcp-ace-gcpace-n02-b03-009",
  "gcp-ace-gcpace-n02-b03-010",
  "gcp-ace-gcpace-n02-b03-011",
  "gcp-ace-gcpace-n02-b03-012",
  "gcp-ace-gcpace-n02-b03-013",
  "gcp-ace-gcpace-n02-b03-014",
  "gcp-ace-gcpace-n02-b03-015",
  "gcp-ace-gcpace-n02-b03-016",
  "gcp-ace-gcpace-n02-b03-017",
  "gcp-ace-gcpace-n02-b03-018",
  "gcp-ace-gcpace-n02-b04-001",
  "gcp-ace-gcpace-n02-b04-002",
  "gcp-ace-gcpace-n02-b04-003",
  "gcp-ace-gcpace-n02-b04-004",
  "gcp-ace-gcpace-n02-b04-005",
  "gcp-ace-gcpace-n02-b04-006",
  "gcp-ace-gcpace-n02-b04-007",
  "gcp-ace-gcpace-n02-b04-008",
  "gcp-ace-gcpace-n02-b04-009",
  "gcp-ace-gcpace-n02-b04-010",
  "gcp-ace-gcpace-n02-b04-011",
  "gcp-ace-gcpace-n02-b04-012",
  "gcp-ace-gcpace-n02-b04-013",
  "gcp-ace-gcpace-n02-b04-014",
  "gcp-ace-gcpace-n02-b04-015",
  "gcp-ace-gcpace-n02-b04-016",
  "gcp-ace-gcpace-n02-b04-017",
  "gcp-ace-gcpace-n02-b04-018",
  "gcp-ace-gcpace-n02-b04-019",
  "gcp-ace-gcpace-n02-b04-020",
  "gcp-ace-gcpace-n02-b05-001",
  "gcp-ace-gcpace-n02-b05-002",
  "gcp-ace-gcpace-n02-b05-003",
  "gcp-ace-gcpace-n02-b05-004",
  "gcp-ace-gcpace-n02-b05-005",
  "gcp-ace-gcpace-n02-b05-006",
  "gcp-ace-gcpace-n02-b05-007",
  "gcp-ace-gcpace-n02-b05-008",
  "gcp-ace-gcpace-n02-b05-009",
  "gcp-ace-gcpace-n02-b05-019",
  "gcp-ace-gcpace-n02-b05-011",
  "gcp-ace-gcpace-n02-b05-012",
  "gcp-ace-gcpace-n02-b05-013",
  "gcp-ace-gcpace-n02-b05-014",
  "gcp-ace-gcpace-n02-b05-015",
  "gcp-ace-gcpace-n02-b05-016",
  "gcp-ace-gcpace-n02-b05-017",
  "gcp-ace-gcpace-n02-b05-018",
  "gcp-ace-gcpace-n02-b06-001",
  "gcp-ace-gcpace-n02-b06-002",
  "gcp-ace-gcpace-n02-b06-003",
  "gcp-ace-gcpace-n02-b06-004",
  "gcp-ace-gcpace-n02-b06-005",
  "gcp-ace-gcpace-n02-b06-006",
  "gcp-ace-gcpace-n02-b06-007",
  "gcp-ace-gcpace-n02-b06-008",
  "gcp-ace-gcpace-n02-b06-009",
  "gcp-ace-gcpace-n02-b06-010",
  "gcp-ace-gcpace-n02-b06-011",
  "gcp-ace-gcpace-n02-b06-012",
  "gcp-ace-gcpace-n02-b06-013",
  "gcp-ace-gcpace-n02-b06-014",
  "gcp-ace-gcpace-n02-b06-015",
  "gcp-ace-gcpace-n02-b06-016",
  "gcp-ace-gcpace-n02-b06-017",
  "gcp-ace-gcpace-n02-b06-018",
  "gcp-ace-gcpace-n02-b06-019",
  "gcp-ace-gcpace-n02-b06-020",
  "gcp-ace-gcpace-n02-b07-001",
  "gcp-ace-gcpace-n02-b07-002",
  "gcp-ace-gcpace-n02-b07-003",
  "gcp-ace-gcpace-n02-b07-004",
  "gcp-ace-gcpace-n02-b07-005",
  "gcp-ace-gcpace-n02-b07-006",
  "gcp-ace-gcpace-n02-b07-007",
  "gcp-ace-gcpace-n02-b07-008",
  "gcp-ace-gcpace-n02-b07-009",
  "gcp-ace-gcpace-n02-b07-010",
  "gcp-ace-gcpace-n02-b07-011",
  "gcp-ace-gcpace-n02-b07-012",
  "gcp-ace-gcpace-n02-b07-013",
  "gcp-ace-gcpace-n02-b07-014",
  "gcp-ace-gcpace-n02-b07-015",
  "gcp-ace-gcpace-n02-b07-016",
  "gcp-ace-gcpace-n02-b07-017",
  "gcp-ace-gcpace-n02-b07-018",
] as const;

test("GCP audit's exact 130 IDs preserve scoring, authored feedback and pre-submit option order across seeds", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("google-cloud-associate-cloud-engineer");
  assert.equal(track.getQuestion("gcp-ace-gcpace-n02-b05-010"), undefined, "old semantic identity is not aliased to the current question");
  assert.deepEqual(track.getQuestion("gcp-ace-gcpace-n02-b05-019")?.answer, { optionId: "revoke_subject_sessions", type: "choice_single" });
  assert.equal(AUDITED_IDS.length, 130);
  assert.equal(new Set(AUDITED_IDS).size, 130);
  for (const id of AUDITED_IDS) {
    const question = track.getQuestion(id) as ChoiceSingleQuestion | undefined;
    assert.ok(question, id);
    assert.equal(question.interaction.type, "choice_single");
    assert.equal(question.answer.type, "choice_single");
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error(id);
    const snapshot = JSON.stringify(question);
    const orders = new Set<string>();
    const positions = new Set<number>();
    for (let seed = 0; seed < 16; seed++) {
      const occurrenceId = `gcp-audit-20261016:${seed}:${id}`;
      const order = prepareCanonicalOptionOrder(question, occurrenceId, track);
      assert.ok(isCanonicalOptionOrder(question, order));
      assert.deepEqual(order, prepareCanonicalOptionOrder(question, occurrenceId, track));
      orders.add(order.join(","));
      positions.add(order.indexOf(question.answer.optionId));
      // A restored occurrence consumes its saved IDs; it does not shuffle again.
      const restored = JSON.parse(JSON.stringify(order));
      const displayed = projectCanonicalQuestionInSessionOrder(question, restored);
      const { model } = buildCanonicalInteractionViewModel(displayed, null);
      const renderer = model as { renderer: { options: readonly { id: string; selected: boolean }[] } };
      assert.deepEqual(renderer.renderer.options.map(option => option.id), order);
      assert.ok(renderer.renderer.options.every(option => !option.selected));
      assert.deepEqual(Object.keys(renderer).sort(), ["accessibility", "renderer"]);
      const options: readonly { optionId: string; text: string }[] = question.interaction.options;
      for (const option of options) {
        const response: { type: "choice_single"; optionId: string } = { type: "choice_single", optionId: option.optionId };
        assert.deepEqual(scoreCanonicalQuestion(displayed, response), scoreCanonicalQuestion(question, response));
        assert.equal(scoreCanonicalQuestion(displayed, response).earnedPoints, option.optionId === question.answer.optionId ? 1 : 0);
        const expected: NonNullable<ChoiceSingleQuestion["feedback"]["messages"]> = question.feedback.messages!.filter(message => message.kind === "wrong_option" && message.targetId === option.optionId);
        assert.equal(expected.length, option.optionId === question.answer.optionId ? 0 : 1);
        assert.deepEqual(projectCanonicalChoiceFeedbackMessages(displayed, response), expected);
      }
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, order.map(() => order[0])), /Saved control order/);
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, [...order.slice(1), "foreign"]), /Saved control order/);
    }
    assert.ok(orders.size > 1, `${id}: distinct legal orders`);
    assert.ok(positions.size > 1, `${id}: accepted option moves`);
    assert.equal(JSON.stringify(question), snapshot);
  }
});
