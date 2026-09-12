import { createAttemptResult, type AttemptResult } from "../../domain/learning";
import type { CanonicalQuestionResponse, ChoiceMultipleQuestion, ChoiceSingleQuestion, ComplexityQuestion, DecisionMatrixQuestion, OrderingQuestion, Question } from "./questionTypes";

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const exactResponse = (value: unknown, type: string, key: string): value is Record<string, unknown> => record(value) && value.type === type && Object.keys(value).length === 2 && Object.hasOwn(value, key);
const result = (maxPoints: number, earnedPoints: number): AttemptResult => createAttemptResult({ kind: earnedPoints === maxPoints ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", earnedPoints, maxPoints });
const isDenseArray = (value: readonly unknown[]): boolean => {
  for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index)) return false;
  return true;
};
const single = (question: Question): question is ChoiceSingleQuestion => question.interaction.type === "choice_single";
const multiple = (question: Question): question is ChoiceMultipleQuestion => question.interaction.type === "choice_multiple";
const ordering = (question: Question): question is OrderingQuestion => question.interaction.type === "ordering";
const complexity = (question: Question): question is ComplexityQuestion => question.interaction.type === "complexity";

export function isCanonicalResponseComplete(question: Question, response: unknown): response is CanonicalQuestionResponse {
  const type = question.interaction.type;
  if (single(question)) return exactResponse(response, type, "optionId") && typeof response.optionId === "string" && question.interaction.options.some((x) => x.optionId === response.optionId);
  if (multiple(question)) return exactResponse(response, type, "optionIds") && Array.isArray(response.optionIds) && response.optionIds.length > 0 && new Set(response.optionIds).size === response.optionIds.length && response.optionIds.every((x) => typeof x === "string" && question.interaction.options.some((o) => o.optionId === x));
  if (ordering(question)) return exactResponse(response, type, "orderedElementIds") && Array.isArray(response.orderedElementIds) && response.orderedElementIds.length === question.answer.orderedElementIds.length && new Set(response.orderedElementIds).size === response.orderedElementIds.length && response.orderedElementIds.every((x) => typeof x === "string" && question.answer.orderedElementIds.includes(x));
  if (!exactResponse(response, type, "selectedValueIdsByDimension") || !record(response.selectedValueIdsByDimension)) return false;
  const dimensions = question.interaction.dimensions; const selected = response.selectedValueIdsByDimension;
  if (Object.keys(selected).some((x) => !dimensions.some((d) => d.dimensionId === x))) return false;
  return dimensions.every((dimension) => {
    const values = selected[dimension.dimensionId];
    if (!Object.hasOwn(selected, dimension.dimensionId) || !Array.isArray(values) || values.length === 0 || !isDenseArray(values) || new Set(values).size !== values.length) return false;
    const legal = new Set(dimension.values.map((entry) => entry.valueId));
    const aliases = (complexity(question) && "aliases" in dimension ? (dimension.aliases ?? {}) : {}) as Readonly<Record<string, string>>;
    if (!values.every((value) => typeof value === "string" && (legal.has(value) || Object.hasOwn(aliases, value)))) return false;
    const normalized = values.map((value) => aliases[value as string] ?? value);
    return new Set(normalized).size === normalized.length;
  });
}

export function scoreCanonicalQuestion(question: Question, response: unknown): AttemptResult {
  const type = question.interaction.type;
  if (single(question)) return scoreChoiceSingleQuestion(question, response);
  if (multiple(question)) return scoreChoiceMultipleQuestion(question, response);
  if (ordering(question)) return scoreOrderingQuestion(question, response);
  if (complexity(question)) return scoreComplexityQuestion(question, response);
  return scoreDecisionMatrixQuestion(question as DecisionMatrixQuestion, response);
}

export function scoreChoiceSingleQuestion(question: ChoiceSingleQuestion, response: unknown): AttemptResult { return result(1, exactResponse(response, "choice_single", "optionId") && response.optionId === question.answer.optionId ? 1 : 0); }
export function scoreChoiceMultipleQuestion(question: ChoiceMultipleQuestion, response: unknown): AttemptResult {
  const optionIds = question.interaction.options.map((x) => x.optionId); if (!exactResponse(response, "choice_multiple", "optionIds") || !Array.isArray(response.optionIds) || new Set(response.optionIds).size !== response.optionIds.length || response.optionIds.some((x) => typeof x !== "string" || !optionIds.includes(x))) return result(optionIds.length, 0);
  const selected = new Set(response.optionIds as string[]), expected = new Set(question.answer.optionIds); return result(optionIds.length, optionIds.filter((x) => expected.has(x) ? selected.has(x) : !selected.has(x)).length);
}
export function scoreOrderingQuestion(question: OrderingQuestion, response: unknown): AttemptResult {
  const expected = question.answer.orderedElementIds, max = expected.length - 1; if (!exactResponse(response, "ordering", "orderedElementIds") || !Array.isArray(response.orderedElementIds) || new Set(response.orderedElementIds).size !== response.orderedElementIds.length || response.orderedElementIds.some((x) => typeof x !== "string" || !expected.includes(x))) return result(max, 0);
  const relations = new Set(expected.slice(0, -1).map((x, i) => `${x}->${expected[i + 1]}`)); const submitted = response.orderedElementIds as string[]; return result(max, submitted.slice(0, -1).filter((x, i) => relations.has(`${x}->${submitted[i + 1]}`)).length);
}
export function scoreComplexityQuestion(question: ComplexityQuestion, response: unknown): AttemptResult { return scoreDimensionQuestion(question, response); }
export function scoreDecisionMatrixQuestion(question: DecisionMatrixQuestion, response: unknown): AttemptResult { return scoreDimensionQuestion(question, response); }
function scoreDimensionQuestion(dimensionQuestion: ComplexityQuestion | DecisionMatrixQuestion, response: unknown): AttemptResult {
  const type = dimensionQuestion.interaction.type;
  const dimensions = dimensionQuestion.interaction.dimensions; if (!exactResponse(response, type, "selectedValueIdsByDimension") || !record(response.selectedValueIdsByDimension) || Object.keys(response.selectedValueIdsByDimension).some((x) => !dimensions.some((d) => d.dimensionId === x))) return result(dimensions.length, 0);
  let earned = 0; for (const dimension of dimensions) { if (!Object.hasOwn(response.selectedValueIdsByDimension, dimension.dimensionId)) continue; const selected = response.selectedValueIdsByDimension[dimension.dimensionId]; const aliases: Readonly<Record<string, string>> = complexity(dimensionQuestion) && "aliases" in dimension ? (dimension.aliases ?? {}) : {}; const legal = new Set(dimension.values.map((x) => x.valueId)); if (!Array.isArray(selected) || !isDenseArray(selected) || new Set(selected).size !== selected.length || selected.some((x) => typeof x !== "string" || (!legal.has(x) && !Object.hasOwn(aliases, x)))) return result(dimensions.length, 0); const normalized = selected.map((x) => aliases[x] ?? x); if (new Set(normalized).size !== normalized.length) return result(dimensions.length, 0); const accepted = new Set(dimension.acceptedValueIds); if (normalized.length === accepted.size && normalized.every((x) => accepted.has(x))) earned += 1; }
  return result(dimensions.length, earned);
}
