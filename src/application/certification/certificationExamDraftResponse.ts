import type { TrainingPresentationPort, TrainingQuestionSummary } from "../trainingLifecycle/contracts";

/** Accepts only exact, non-empty partial exam answers; complete answers stay with the canonical validator. */
export function isValidCertificationExamDraftResponse(question: Pick<TrainingQuestionSummary, "questionId" | "interactionType" | "requiredSelectionCount">, response: unknown, interactions: TrainingPresentationPort): boolean {
  if (interactions.isComplete(question.questionId, response)) return true;
  if (!isRecord(response) || response.type !== question.interactionType) return false;

  if (question.interactionType === "choice_multiple") {
    if (!hasExactKeys(response, ["type", "optionIds"]) || !Array.isArray(response.optionIds) || response.optionIds.length === 0) return false;
    const required = question.requiredSelectionCount;
    const optionIds = interactions.controlIds(question.questionId);
    return Number.isSafeInteger(required) && required! > 1 && response.optionIds.length < required! &&
      new Set(response.optionIds).size === response.optionIds.length && response.optionIds.every((id) => typeof id === "string" && optionIds.includes(id));
  }

  if (question.interactionType === "decision_matrix") {
    if (!hasExactKeys(response, ["type", "selectedValueIdsByDimension"]) || !isRecord(response.selectedValueIdsByDimension)) return false;
    const presentation = interactions.present(question.questionId, response).model as { renderer?: { dimensions?: readonly Readonly<{ id: string; values: readonly Readonly<{ id: string }>[] }>[] } };
    const dimensions = presentation.renderer?.dimensions;
    if (!Array.isArray(dimensions) || Object.keys(response.selectedValueIdsByDimension).length === 0) return false;
    const dimensionById = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
    return Object.entries(response.selectedValueIdsByDimension).every(([id, values]) => {
      const dimension = dimensionById.get(id);
      return dimension !== undefined && Array.isArray(values) && values.length === 1 && typeof values[0] === "string" && dimension.values.some((value: Readonly<{ id: string }>) => value.id === values[0]);
    });
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean { return Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key)); }
