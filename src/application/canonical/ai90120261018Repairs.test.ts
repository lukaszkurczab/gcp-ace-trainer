import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createCanonicalQuestionCatalog } from "../../content/canonical/questionCatalog";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import { validateQuestion } from "../../content/canonical/questionValidation";
import type { Question, CanonicalContentLockRecord } from "../../content/canonical/questionTypes";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { prepareCanonicalOptionOrder, projectCanonicalQuestionInSessionOrder, isCanonicalOptionOrder } from "./canonicalOptionOrder";
import { buildCanonicalInteractionViewModel, projectCanonicalChoiceFeedbackMessages } from "./canonicalInteractionPresentation";

const trackId = "microsoft-azure-ai-fundamentals-ai-901";
const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? path.resolve(process.cwd(), "../patternly-content");
const unitRoot = path.join(contentRoot, "content", trackId, "responsible_ai_model_foundations_and_deployment_choices");
const repaired = [1, 2, 3].flatMap(unit => JSON.parse(readFileSync(path.join(unitRoot, `AI901-N01-B0${unit}.json`), "utf8")) as Question[]);
const expectedIds = [1, 2, 3].flatMap(unit => Array.from({ length: 12 }, (_, index) => `AI901-N01-B0${unit}-Q${String(index + 13).padStart(3, "0")}`));
const track = JSON.parse(readFileSync(path.join(contentRoot, "content/catalog.json"), "utf8")).tracks.find((entry: { trackId: string }) => entry.trackId === trackId);

function verifyBoundary(questions: readonly Question[], pin: { contentVersion: string; artifactSha256: string }) {
  assert.deepEqual(questions.map(question => question.questionId).sort(), [...expectedIds].sort());
  for (const question of questions) {
    assert.deepEqual(validateQuestion(question), [], question.questionId);
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected single choice");
    const snapshot = JSON.stringify(question);
    const orders = new Set<string>();
    const positions = new Set<number>();
    for (let seed = 0; seed < 16; seed++) {
      const order = prepareCanonicalOptionOrder(question, `ai901-repairs:${seed}:${question.questionId}`, pin);
      assert.ok(isCanonicalOptionOrder(question, order));
      assert.deepEqual(order, prepareCanonicalOptionOrder(question, `ai901-repairs:${seed}:${question.questionId}`, pin));
      orders.add(order.join(","));
      positions.add(order.indexOf(question.answer.optionId));
      // Persist and restore the actual occurrence order and response by ID.
      const resumedOrder = JSON.parse(JSON.stringify(order));
      const displayed = projectCanonicalQuestionInSessionOrder(question, resumedOrder);
      const model = buildCanonicalInteractionViewModel(displayed, null).model as {
        accessibility: { controls: { checked: boolean; id: string; label: string; role: string }[] };
        renderer: { kind: string; options: { id: string; text: string; selected: boolean }[] };
      };
      assert.deepEqual(Object.keys(model).sort(), ["accessibility", "renderer"]);
      assert.deepEqual(Object.keys(model.renderer).sort(), ["kind", "options"]);
      assert.deepEqual(model.renderer.options.map(option => option.id), order);
      assert.ok(model.accessibility.controls.every(control => !control.checked));
      for (const option of model.renderer.options) {
        assert.deepEqual(Object.keys(option).sort(), ["id", "selected", "text"]);
        assert.equal(option.selected, false);
        assert.equal(option.text, question.interaction.options.find(authored => authored.optionId === option.id)!.text);
      }
      for (const option of question.interaction.options) {
        const response = { type: "choice_single" as const, optionId: option.optionId };
        const resumedResponse = JSON.parse(JSON.stringify(response));
        const result = scoreCanonicalQuestion(displayed, resumedResponse);
        assert.equal(result.earnedPoints, option.optionId === question.answer.optionId ? 1 : 0);
        assert.equal(result.maxPoints, 1);
        assert.deepEqual(result, scoreCanonicalQuestion(question, response));
        const messages = question.feedback.messages!.filter(message => message.kind === "wrong_option" && message.targetId === option.optionId);
        assert.equal(messages.length, option.optionId === question.answer.optionId ? 0 : 1);
        assert.deepEqual(projectCanonicalChoiceFeedbackMessages(displayed, resumedResponse), messages);
      }
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, order.map(() => order[0])), /Saved control order/);
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, [...order.slice(1), "foreign"]), /Saved control order/);
    }
    assert.ok(orders.size > 1, `${question.questionId}: multiple orders`);
    assert.ok(positions.size > 1, `${question.questionId}: answer moves`);
    assert.equal(JSON.stringify(question), snapshot);
  }
}

test("AI901 repaired source uses production presentation, scoring and saved-order resume without pre-submit answer evidence", () => {
  verifyBoundary(repaired, { contentVersion: track.contentVersion, artifactSha256: "a".repeat(64) });
});

test("AI901 isolated candidate passes the app catalog integrity boundary and contains the exact repaired source", { skip: !process.env.AI901_REPAIR_ARTIFACT_ROOT }, async () => {
  const artifactRoot = process.env.AI901_REPAIR_ARTIFACT_ROOT!;
  const artifact = JSON.parse(readFileSync(path.join(artifactRoot, `${trackId}.json`), "utf8"));
  const lock = JSON.parse(readFileSync(path.join(artifactRoot, "content-lock.json"), "utf8")).tracks.find((entry: CanonicalContentLockRecord) => entry.trackId === trackId) as CanonicalContentLockRecord;
  const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async value => sha256Utf8(value));
  const selected = expectedIds.map(id => { const question = catalog.getQuestionById(id); assert.ok(question, id); return question; });
  for (const question of repaired) assert.deepEqual(catalog.getQuestionById(question.questionId), question);
  assert.equal(catalog.questions.length, 752);
  for (const unit of [1, 2, 3]) for (let index = 1; index <= 12; index++) {
    assert.equal(catalog.getQuestionById(`AI901-N01-B0${unit}-Q${String(index).padStart(3, "0")}`), undefined);
  }
  verifyBoundary(selected, catalog);
});
