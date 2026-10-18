import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
// The app's TS modules use its existing CommonJS/tsx boundary.
const runtimeRequire = createRequire(import.meta.url);
const { createCanonicalQuestionCatalog } = runtimeRequire("../../content/canonical/questionCatalog.ts");
const { scoreCanonicalQuestion } = runtimeRequire("../../content/canonical/questionScoring.ts");
const { validateQuestion } = runtimeRequire("../../content/canonical/questionValidation.ts");
const { sha256Utf8 } = runtimeRequire("../../infrastructure/identity/sha256.ts");
const { findTrackDescriptor, DEFAULT_TRACK_QUESTION_PRESENTATION, isSupportedTrackQuestionPresentation } = runtimeRequire("../../domain/tracks/trackAdmission.ts");
const { toCanonicalQuestionViewModel } = runtimeRequire("../../features/practice/canonicalQuestionViewModel.ts");
const { prepareCanonicalOptionOrder, projectCanonicalQuestionInSessionOrder, isCanonicalOptionOrder } = runtimeRequire("./canonicalOptionOrder.ts");
const { buildCanonicalInteractionViewModel, projectCanonicalChoiceFeedbackMessages } = runtimeRequire("./canonicalInteractionPresentation.ts");

const appRoot = fileURLToPath(new URL("../../../", import.meta.url));
const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? path.resolve(appRoot, "../patternly-content");
const trackId = "backend-system-design-interview";
const proof = JSON.parse(readFileSync(path.join(contentRoot, "evidence/business-quality/besd-n03-20261018-repairs.json"), "utf8"));
const questions = [1, 2, 3, 4].flatMap(unit => JSON.parse(readFileSync(path.join(contentRoot, `content/${trackId}/data_models_storage_selection_indexing_and_transactions/BESD-N03-B0${unit}.json`), "utf8")));
const lineage = new Map(proof.items.map(item => [item.questionId, item]));

// Execute the real card JSX with native components/hooks replaced by inert test
// bindings. This checks its show/hide branches; it is not a native/device test.
function loadQuestionCard() {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const source = readFileSync(path.join(appRoot, "src/features/practice/PracticeQuestionCard.tsx"), "utf8");
  const module = { exports: {} };
  const modules = {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "../../domain/tracks/trackAdmission": { DEFAULT_TRACK_QUESTION_PRESENTATION, isSupportedTrackQuestionPresentation },
    "react-i18next": { useTranslation: () => ({ t: value => value }) },
    "react-native": { Text: "Text", View: "View", StyleSheet: { create: value => value }, useWindowDimensions: () => ({ fontScale: 1 }) },
    "../../preferences": { useThemedStyles: () => new Proxy({}, { get: () => ({}) }) },
    "../../theme": { radius: {}, spacing: {}, typography: {} },
    "../../testing/runtimeSelectors": { runtimeSelectors: { session: { question: id => id } } },
  };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, require: id => {
    assert.ok(Object.hasOwn(modules, id), `Unexpected card dependency ${id}`);
    return modules[id];
  } });
  return module.exports.PracticeQuestionCard;
}

function textNodes(element) {
  if (typeof element === "string" || typeof element === "number") return [String(element)];
  if (Array.isArray(element)) return element.flatMap(textNodes);
  return element?.props ? textNodes(element.props.children) : [];
}

test("BESD N03: actual question-card JSX shows the 72 business invariants without author hints", () => {
  const Card = loadQuestionCard();
  const presentation = findTrackDescriptor(trackId).presentation.practiceQuestion;
  assert.equal(presentation.constraints, "show");
  assert.equal(questions.length, 72);
  for (const question of questions) {
    const model = toCanonicalQuestionViewModel(question);
    const shown = textNodes(Card({ question: model, presentation })).join("\n");
    const invariant = lineage.get(question.questionId).beforeQuestion.constraints[0];
    assert.ok(shown.includes(invariant), question.questionId);
    assert.doesNotMatch(shown, /the primary decision is/i);
    assert.equal(shown.includes(question.interaction.options.find(option => option.optionId === question.answer.optionId).text), false);
    assert.equal(shown.includes(question.feedback.reason), false);
    assert.equal(textNodes(Card({ question: model, presentation })).filter(value => value === "• ").length, question.constraints.length);
    const hidden = textNodes(Card({ question: model, presentation: { ...presentation, constraints: "hide" } }));
    assert.equal(hidden.includes("• "), false);
    const injected = { ...model, constraints: [...model.constraints, lineage.get(question.questionId).beforeQuestion.constraints[2]] };
    assert.match(textNodes(Card({ question: injected, presentation })).join("\n"), /the primary decision is/i,
      "negative control proves the real renderer would expose the old hint");
  }
});

function verifyScoringAndPresentation(selected, pin) {
  for (const question of selected) {
    assert.deepEqual(validateQuestion(question), [], question.questionId);
    const original = JSON.stringify(question);
    const positions = new Set();
    for (let seed = 0; seed < 16; seed++) {
      const order = prepareCanonicalOptionOrder(question, `besd-n03:${question.questionId}:${seed}`, pin);
      assert.ok(isCanonicalOptionOrder(question, order));
      assert.deepEqual(order, prepareCanonicalOptionOrder(question, `besd-n03:${question.questionId}:${seed}`, pin));
      positions.add(order.indexOf(question.answer.optionId));
      const savedOrder = JSON.parse(JSON.stringify(order));
      const displayed = projectCanonicalQuestionInSessionOrder(question, savedOrder);
      const preSubmit = buildCanonicalInteractionViewModel(displayed, null).model;
      assert.deepEqual(Object.keys(preSubmit).sort(), ["accessibility", "renderer"]);
      assert.ok(preSubmit.accessibility.controls.every(control => !control.checked));
      assert.deepEqual(preSubmit.renderer.options.map(option => option.id), savedOrder);
      for (const option of question.interaction.options) {
        const response = JSON.parse(JSON.stringify({ type: "choice_single", optionId: option.optionId }));
        const expectedCorrect = option.optionId === question.answer.optionId;
        const result = scoreCanonicalQuestion(displayed, response);
        assert.equal(result.earnedPoints, expectedCorrect ? 1 : 0, `${question.questionId}/${option.optionId}`);
        assert.equal(result.kind, expectedCorrect ? "correct" : "incorrect");
        const messages = question.feedback.messages.filter(message => message.kind === "wrong_option" && message.targetId === option.optionId);
        assert.equal(messages.length, expectedCorrect ? 0 : 1);
        assert.deepEqual(projectCanonicalChoiceFeedbackMessages(displayed, response), messages);
        const selectedModel = buildCanonicalInteractionViewModel(displayed, response).model;
        assert.deepEqual(selectedModel.renderer.options.filter(entry => entry.selected).map(entry => entry.id), [option.optionId]);
      }
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, order.map(() => order[0])), /Saved control order/);
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, [...order.slice(1), "foreign"]), /Saved control order/);
    }
    assert.ok(positions.size > 1, `${question.questionId}: accepted option moves`);
    assert.equal(JSON.stringify(question), original);
  }
}

test("BESD N03: 72 source questions preserve scoring, selection and option-specific feedback through saved shuffles", () => {
  verifyScoringAndPresentation(questions, { contentVersion: proof.contentVersion, artifactSha256: "a".repeat(64) });
});

test("BESD N03: isolated artifact passes the production app catalog boundary with exact source and retired identities", { skip: !process.env.BESD_N03_ARTIFACT_ROOT }, async () => {
  const output = process.env.BESD_N03_ARTIFACT_ROOT;
  const artifact = JSON.parse(readFileSync(path.join(output, `${trackId}.json`), "utf8"));
  const lock = JSON.parse(readFileSync(path.join(output, "content-lock.json"), "utf8")).tracks.find(entry => entry.trackId === trackId);
  const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async value => sha256Utf8(value));
  assert.equal(catalog.questions.length, 1569);
  assert.equal(catalog.contentVersion, proof.contentVersion);
  assert.equal(catalog.artifactSha256, proof.artifactSha256);
  for (const question of questions) assert.deepEqual(catalog.getQuestionById(question.questionId), question);
  for (const item of proof.items.filter(entry => entry.beforeQuestionId !== entry.questionId)) {
    assert.equal(catalog.getQuestionById(item.beforeQuestionId), undefined);
    const oldResponse = { type: "choice_single", optionId: item.beforeQuestion.answer.optionId };
    assert.equal(scoreCanonicalQuestion(item.currentQuestion, oldResponse).kind, "incorrect");
    assert.equal(scoreCanonicalQuestion(item.beforeQuestion, oldResponse).kind, "correct");
  }
  verifyScoringAndPresentation(questions, catalog);
});
