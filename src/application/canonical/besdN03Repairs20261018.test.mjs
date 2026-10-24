import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const contentRoot = process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content");
const trackId = "backend-system-design-interview";
const currentTrackPromise = (async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-besd-n03-current-source-"));
  try {
    const { buildAll } = await import(pathToFileURL(path.join(contentRoot, "scripts/build.mjs")).href);
    const source = await buildAll({ rootDirectory: contentRoot, outputRoot });
    const artifact = JSON.parse(await readFile(path.join(outputRoot, `${trackId}.json`), "utf8"));
    const lock = source.lock.tracks.find((entry) => entry.trackId === trackId);
    assert.ok(lock, `current content build emits a ${trackId} lock`);
    const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async (value) => sha256Utf8(value));
    assert.deepEqual(catalog.questions, artifact.questions, "APP catalog preserves the current source-built question values");
    const currentUnits = ["BESD-N03-B01", "BESD-N03-B02", "BESD-N03-B03", "BESD-N03-B04"];
    const questions = catalog.questions.filter((question) => currentUnits.includes(question.mentalUnitId));
    return { artifact, lock, catalog, questions };
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
})();

// Execute the real card JSX with native components/hooks replaced by inert test
// bindings. This checks its rendered text; it is not a native/device test.
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

function assertNoAnswerLeak(view, question) {
  const accepted = question.interaction.options.find((option) => option.optionId === question.answer.optionId);
  assert.ok(accepted, `${question.questionId} accepted option exists`);
  assert.equal(JSON.stringify(view.constraints).includes(accepted.text), false, `${question.questionId} does not disclose the accepted option in author hints`);
  const interaction = view.interaction.model;
  assert.ok(interaction.renderer.options.every((option) => option.selected === false), `${question.questionId} does not mark the accepted choice before submission`);
  assert.equal(JSON.stringify(view).includes(question.feedback.reason), false, `${question.questionId} keeps its correction rationale after submission`);
}

test("BESD N03: APP card JSX preserves current B01-B04 prompts without supplementary hints", async () => {
  const { questions } = await currentTrackPromise;
  const Card = loadQuestionCard();
  const presentation = findTrackDescriptor(trackId).presentation.practiceQuestion;
  for (const unit of ["BESD-N03-B01", "BESD-N03-B02", "BESD-N03-B03", "BESD-N03-B04"]) {
    assert.ok(questions.some((question) => question.mentalUnitId === unit), `${unit} has current invariant questions`);
  }
  for (const question of questions) {
    const model = toCanonicalQuestionViewModel(question);
    const shown = textNodes(Card({ question: model, presentation })).join("\n");
    assert.ok(shown.includes(question.prompt), `${question.questionId} preserves the complete authored prompt`);
    assert.doesNotMatch(shown, /the primary decision is/i);
    assertNoAnswerLeak(model, question);
    assert.equal(textNodes(Card({ question: model, presentation })).includes("• "), false);

    const acceptedText = question.interaction.options.find((option) => option.optionId === question.answer.optionId).text;
    const legacyModel = { ...model, constraints: [...question.constraints, acceptedText] };
    assert.throws(() => assertNoAnswerLeak(legacyModel, question), /does not disclose the accepted option/,
      "the source-contract check still rejects a correct choice embedded in authored constraints");
    assert.deepEqual(textNodes(Card({ question: legacyModel, presentation })), textNodes(Card({ question: model, presentation })),
      "even legacy inputs containing the accepted choice cannot reveal a supplementary hint");
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
        const messages = (question.feedback.messages ?? []).filter(message => message.kind === "wrong_option" && message.targetId === option.optionId);
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

test("BESD N03: all current business invariants preserve score and option feedback under saved shuffles", async () => {
  const { questions, catalog } = await currentTrackPromise;
  verifyScoringAndPresentation(questions, catalog);
});

test("BESD N03: current source artifact passes the production APP catalog boundary", async () => {
  const { artifact, lock, catalog, questions } = await currentTrackPromise;
  assert.equal(catalog.contentVersion, artifact.contentVersion);
  assert.equal(catalog.artifactSha256, lock.sha256);
  for (const question of questions) assert.deepEqual(catalog.getQuestionById(question.questionId), question);
});
