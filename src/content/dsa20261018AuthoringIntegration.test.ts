import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isCanonicalResponseComplete,
  scoreCanonicalQuestion,
  validateQuestion,
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

type ProofItem = Readonly<{ questionId: string; currentQuestion: Question }>;
const proof = JSON.parse(readFileSync(new URL("../../../patternly-content/evidence/business-quality/dsa-20261018-targeted-corrections.json", import.meta.url), "utf8")) as { items: ProofItem[] };
const currentQuestions = proof.items.map((item) => item.currentQuestion);

function permutations<T>(values: readonly T[]): T[][] {
  return values.length === 0 ? [[]] : values.flatMap((value, index) => permutations(values.filter((_, position) => position !== index).map((entry) => entry)).map((tail) => [value, ...tail]));
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
      const selected = question.answer.optionIds.slice(0, -1);
      return { type: "choice_multiple", optionIds: selected };
  }
  if (isOrdering(question)) {
      const orderedElementIds = [...question.answer.orderedElementIds];
      const first = orderedElementIds[0], second = orderedElementIds[1];
      assert.ok(first && second, `${question.questionId} needs at least two ordered elements`);
      orderedElementIds.splice(0, 2, second, first);
      return { type: "ordering", orderedElementIds };
  }
  if (isComplexity(question)) {
      const selectedValueIdsByDimension: Record<string, readonly string[]> = { ...question.answer.selectedValueIdsByDimension };
      const dimension = question.interaction.dimensions[0];
      assert.ok(dimension, `${question.questionId} needs at least one dimension`);
      const alternative = dimension.values.find(({ valueId }) => !dimension.acceptedValueIds.includes(valueId));
      assert.ok(alternative, `${question.questionId} needs a wrong value`);
      selectedValueIdsByDimension[dimension.dimensionId] = [alternative.valueId];
      return { type: "complexity", selectedValueIdsByDimension };
  }
  if (isDecisionMatrix(question)) {
      const selectedValueIdsByDimension: Record<string, readonly string[]> = { ...question.answer.selectedValueIdsByDimension };
      const dimension = question.interaction.dimensions[0];
      assert.ok(dimension, `${question.questionId} needs at least one dimension`);
      const alternative = dimension.values.find(({ valueId }) => !dimension.acceptedValueIds.includes(valueId));
      assert.ok(alternative, `${question.questionId} needs a wrong value`);
      selectedValueIdsByDimension[dimension.dimensionId] = [alternative.valueId];
      return { type: "decision_matrix", selectedValueIdsByDimension };
  }
  throw new Error("Unsupported canonical question type.");
}

test("all corrected source questions validate, score through production handlers, and project authored feedback", () => {
  assert.ok(currentQuestions.length >= 16);
  for (const question of currentQuestions) {
    assert.deepEqual(validateQuestion(question), [], question.questionId);
    const correct = scoreCanonicalQuestion(question, question.answer);
    assert.equal(correct.kind, "correct", `${question.questionId} correct answer`);
    assert.equal(isCanonicalResponseComplete(question, question.answer), true);

    const incorrectResponse = wrongCompleteResponse(question);
    const incorrect = scoreCanonicalQuestion(question, incorrectResponse);
    assert.notEqual(incorrect.kind, "correct", `${question.questionId} wrong answer`);
    assert.equal(isCanonicalResponseComplete(question, incorrectResponse), true);
    const localResponse = canonicalResponseToPracticeLocalResponse(incorrectResponse);
    assert.ok(localResponse, `${question.questionId} response projection`);
    const feedback = composeCanonicalFeedback(question, incorrectResponse, incorrect);
    assert.equal(feedback.reason, question.feedback.reason);
    assert.deepEqual(feedback.details, question.feedback.details);
    assert.ok(detailLines(feedback.details).length > 0, `${question.questionId} renders feedback details`);

    const preSubmit = toCanonicalQuestionViewModel(question);
    assert.equal(preSubmit.itemId, question.questionId);
    assert.equal(preSubmit.prompt, question.prompt);
    assert.equal(JSON.stringify(preSubmit).includes(question.feedback.reason), false, `${question.questionId} must not expose feedback before submission`);
  }
});

test("choice display permutations retain stable IDs and selection projection", () => {
  for (const question of currentQuestions.filter(isChoiceSingle)) {
    const ids = question.interaction.options.map(({ optionId }) => optionId);
    for (const order of permutations(ids)) {
      const view = buildCanonicalInteractionViewModel(question, { type: "choice_single", optionId: question.answer.optionId }, order);
      const model = view.model as { renderer: { options: readonly { id: string; selected: boolean }[] } };
      assert.deepEqual(model.renderer.options.map(({ id }) => id), order);
      assert.deepEqual(model.renderer.options.filter(({ selected }) => selected).map(({ id }) => id), [question.answer.optionId]);
      assert.deepEqual(canonicalResponseToPracticeLocalResponse({ type: "choice_single", optionId: question.answer.optionId }), { kind: "choice", selectedOptionIds: [question.answer.optionId] });
    }
  }
});

test("ordering display shuffle keeps the authored element identities and submitted arrangement", () => {
  const question = currentQuestions.find(isOrdering);
  assert.ok(question);
  const displayOrder = [...question.interaction.elements].map(({ elementId }) => elementId).reverse();
  const view = buildCanonicalInteractionViewModel(question, null, displayOrder);
  const model = view.model as { renderer: { elements: readonly { id: string }[] }; accessibility: { controls: readonly { id: string }[] } };
  assert.deepEqual(model.renderer.elements.map(({ id }) => id), displayOrder);
  assert.deepEqual(model.accessibility.controls.map(({ id }) => id), displayOrder);
  assert.deepEqual(canonicalResponseToPracticeLocalResponse({ type: "ordering", orderedElementIds: question.answer.orderedElementIds }), { kind: "ordering", orderedSubgoalIds: question.answer.orderedElementIds });
});

test("partial multi-choice response receives production partial score and remains a complete submission", () => {
  const question = currentQuestions.find(isChoiceMultiple);
  assert.ok(question);
  const response = { type: "choice_multiple" as const, optionIds: question.answer.optionIds.slice(0, -1) };
  const result = scoreCanonicalQuestion(question, response);
  assert.equal(result.kind, "partial");
  assert.ok(result.earnedPoints > 0 && result.earnedPoints < result.maxPoints);
  assert.equal(isCanonicalResponseComplete(question, response), true);
});

test("partial complexity response is scored per dimension and remains a complete submission", () => {
  const question = currentQuestions.find(isComplexity);
  assert.ok(question);
  assert.ok(question.interaction.dimensions.length > 1);
  const selectedValueIdsByDimension: Record<string, readonly string[]> = { ...question.answer.selectedValueIdsByDimension };
  const dimension = question.interaction.dimensions[0];
  assert.ok(dimension);
  const alternative = dimension.values.find(({ valueId }) => !dimension.acceptedValueIds.includes(valueId));
  assert.ok(alternative);
  selectedValueIdsByDimension[dimension.dimensionId] = [alternative.valueId];
  const response = { type: "complexity" as const, selectedValueIdsByDimension };
  const result = scoreCanonicalQuestion(question, response);
  assert.equal(result.kind, "partial");
  assert.ok(result.earnedPoints > 0 && result.earnedPoints < result.maxPoints);
  assert.equal(isCanonicalResponseComplete(question, response), true);
});
