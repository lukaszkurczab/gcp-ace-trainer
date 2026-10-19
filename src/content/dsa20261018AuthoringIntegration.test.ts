import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import {
  isCanonicalResponseComplete,
  scoreCanonicalQuestion,
  type CanonicalQuestionResponse,
  type ChoiceMultipleQuestion,
  type ChoiceSingleQuestion,
  type ComplexityQuestion,
  type DecisionMatrixQuestion,
  type OrderingQuestion,
  type Question,
} from "./canonical";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback } from "../application/canonical/canonicalInteractionPresentation";
import { canonicalResponseToPracticeLocalResponse, toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../features/practice/feedbackDetails";

const trackId = "coding-interview-dsa-problem-solving";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
const selectedIds = [
  "alg-arrays-frequency-state-001", "alg-arrays-frequency-state-003", "alg-arrays-frequency-state-017",
  "alg-arrays-frequency-state-016", "alg-arrays-frequency-state-020", "alg-arrays-output-space-016",
  "alg-arrays-duplicate-handling-006", "alg-arrays-duplicate-handling-011", "alg-arrays-duplicate-handling-017",
  "alg-arrays-duplicate-handling-013", "alg-backtracking-base-contract-017", "alg-arrays-frequency-state-011",
  "alg-arrays-normalization-comparison-002", "alg-arrays-normalization-comparison-010", "alg-arrays-normalization-comparison-004",
  "alg-arrays-sequence-shape-017", "alg-arrays-normalization-comparison-019", "alg-arrays-output-space-021",
  "alg-arrays-stable-compaction-022", "alg-arrays-duplicate-handling-019", "alg-arrays-duplicate-handling-020",
  "alg-arrays-frequency-state-021", "alg-arrays-stable-compaction-023",
] as const;

const currentQuestionsPromise = (async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-dsa-current-source-"));
  try {
    const { buildAll } = await import(pathToFileURL(path.join(contentRoot, "scripts/build.mjs")).href);
    const producer = await buildAll({ rootDirectory: contentRoot, outputRoot });
    const source = producer.artifacts.find((entry: { trackId: string }) => entry.trackId === trackId);
    assert.ok(source, `current content source builds ${trackId}`);
    const artifact = JSON.parse(await readFile(path.join(outputRoot, `${trackId}.json`), "utf8")) as unknown;
    const lock = producer.lock.tracks.find((entry: { trackId: string }) => entry.trackId === trackId);
    assert.ok(lock, `current content build emits a lock for ${trackId}`);
    const require = createRequire(import.meta.url);
    const { createCanonicalQuestionCatalog } = require("./canonical/questionCatalog.ts");
    const { sha256Utf8 } = require("../infrastructure/identity/sha256.ts");
    const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async (value: string) => sha256Utf8(value));
    return selectedIds.map((questionId) => {
      const question = catalog.getQuestionById(questionId);
      assert.ok(question, `current DSA source retains the named correction case ${questionId}`);
      return question as Question;
    });
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
})();

function permutations<T>(values: readonly T[]): T[][] {
  return values.length === 0 ? [[]] : values.flatMap((value, index) => permutations(values.filter((_, position) => position !== index)).map((tail) => [value, ...tail]));
}
function isChoiceSingle(question: Question): question is ChoiceSingleQuestion { return question.interaction.type === "choice_single"; }
function isChoiceMultiple(question: Question): question is ChoiceMultipleQuestion { return question.interaction.type === "choice_multiple"; }
function isOrdering(question: Question): question is OrderingQuestion { return question.interaction.type === "ordering"; }
function isComplexity(question: Question): question is ComplexityQuestion { return question.interaction.type === "complexity"; }
function isDecisionMatrix(question: Question): question is DecisionMatrixQuestion { return question.interaction.type === "decision_matrix"; }

function wrongCompleteResponse(question: Question): CanonicalQuestionResponse {
  if (isChoiceSingle(question)) {
    const option = question.interaction.options.find(({ optionId }) => optionId !== question.answer.optionId);
    assert.ok(option, `${question.questionId} needs a distractor`);
    return { type: "choice_single", optionId: option.optionId };
  }
  if (isChoiceMultiple(question)) {
    const omitted = question.answer.optionIds.at(-1);
    assert.ok(omitted, `${question.questionId} needs an accepted choice to omit`);
    return { type: "choice_multiple", optionIds: question.answer.optionIds.filter((optionId) => optionId !== omitted) };
  }
  if (isOrdering(question)) {
    const orderedElementIds = [...question.answer.orderedElementIds];
    const first = orderedElementIds[0], second = orderedElementIds[1];
    assert.ok(first && second, `${question.questionId} needs at least two ordered elements`);
    orderedElementIds.splice(0, 2, second, first);
    return { type: "ordering", orderedElementIds };
  }
  if (isComplexity(question) || isDecisionMatrix(question)) {
    const selectedValueIdsByDimension: Record<string, readonly string[]> = { ...question.answer.selectedValueIdsByDimension };
    const dimension = question.interaction.dimensions[0];
    assert.ok(dimension, `${question.questionId} needs at least one dimension`);
    const alternative = dimension.values.find(({ valueId }) => !dimension.acceptedValueIds.includes(valueId));
    assert.ok(alternative, `${question.questionId} needs an incorrect alternative`);
    selectedValueIdsByDimension[dimension.dimensionId] = [alternative.valueId];
    return { type: question.interaction.type, selectedValueIdsByDimension };
  }
  throw new Error("Unsupported canonical question type.");
}

test("current DSA correction cases score and project production feedback through APP handlers", async () => {
  const currentQuestions = await currentQuestionsPromise;
  assert.equal(currentQuestions.length, selectedIds.length);
  assert.ok(currentQuestions.some(isChoiceMultiple), "selected cases include multi-choice scoring");
  assert.ok(currentQuestions.some(isOrdering), "selected cases include ordering");
  assert.ok(currentQuestions.some(isComplexity), "selected cases include dimension-based complexity");

  for (const question of currentQuestions) {
    const correct = scoreCanonicalQuestion(question, question.answer);
    assert.equal(correct.kind, "correct", `${question.questionId} accepts its independently checked current response shape`);
    assert.equal(isCanonicalResponseComplete(question, question.answer), true);

    const incorrectResponse = wrongCompleteResponse(question);
    const incorrect = scoreCanonicalQuestion(question, incorrectResponse);
    assert.notEqual(incorrect.kind, "correct", `${question.questionId} rejects a concrete wrong response`);
    assert.equal(isCanonicalResponseComplete(question, incorrectResponse), true);
    assert.ok(canonicalResponseToPracticeLocalResponse(incorrectResponse), `${question.questionId} response reaches the APP practice model`);
    const feedback = composeCanonicalFeedback(question, incorrectResponse, incorrect);
    assert.equal(feedback.reason, question.feedback.reason);
    assert.deepEqual(feedback.details, question.feedback.details);
    assert.ok(detailLines(feedback.details).length > 0, `${question.questionId} has rendered correction details`);

    const preSubmit = toCanonicalQuestionViewModel(question);
    assert.equal(preSubmit.itemId, question.questionId);
    assert.equal(preSubmit.prompt, question.prompt);
    assert.equal(JSON.stringify(preSubmit).includes(question.feedback.reason), false, `${question.questionId} keeps rationale after submission`);
  }
});

test("current DSA choice permutations preserve stable IDs and submitted selection", async () => {
  const currentQuestions = await currentQuestionsPromise;
  for (const question of currentQuestions.filter(isChoiceSingle)) {
    const ids = question.interaction.options.map(({ optionId }) => optionId);
    for (const order of permutations(ids)) {
      const view = buildCanonicalInteractionViewModel(question, { type: "choice_single", optionId: question.answer.optionId }, order);
      const model = view.model as { renderer: { options: readonly { id: string; selected: boolean }[] } };
      assert.deepEqual(model.renderer.options.map(({ id }) => id), order);
      assert.deepEqual(model.renderer.options.filter(({ selected }) => selected).map(({ id }) => id), [question.answer.optionId]);
    }
  }
});

test("current DSA ordering keeps authored element identities when displayed in reverse", async () => {
  const question = (await currentQuestionsPromise).find(isOrdering);
  assert.ok(question);
  const displayOrder = [...question.interaction.elements].map(({ elementId }) => elementId).reverse();
  const view = buildCanonicalInteractionViewModel(question, null, displayOrder);
  const model = view.model as { renderer: { elements: readonly { id: string }[] }; accessibility: { controls: readonly { id: string }[] } };
  assert.deepEqual(model.renderer.elements.map(({ id }) => id), displayOrder);
  assert.deepEqual(model.accessibility.controls.map(({ id }) => id), displayOrder);
});

test("current DSA multi-choice omission remains a complete, non-correct submission", async () => {
  const question = (await currentQuestionsPromise).find(isChoiceMultiple);
  assert.ok(question);
  const response = wrongCompleteResponse(question);
  const result = scoreCanonicalQuestion(question, response);
  assert.equal(result.kind, "partial");
  assert.ok(result.earnedPoints > 0 && result.earnedPoints < result.maxPoints);
  assert.equal(isCanonicalResponseComplete(question, response), true);
});

test("current DSA complexity scoring remains dimension-aware for a wrong dimension", async () => {
  const question = (await currentQuestionsPromise).find(isComplexity);
  assert.ok(question);
  assert.ok(question.interaction.dimensions.length > 1);
  const response = wrongCompleteResponse(question);
  const result = scoreCanonicalQuestion(question, response);
  assert.equal(result.kind, "partial");
  assert.ok(result.earnedPoints > 0 && result.earnedPoints < result.maxPoints);
  assert.equal(isCanonicalResponseComplete(question, response), true);
});
