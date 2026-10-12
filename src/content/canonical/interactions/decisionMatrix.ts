import type { InteractionEvaluation, InteractionHandler, QuestionBase, CanonicalDimension } from "./shared";
import { canonicalEvaluation, isDenseArray, isRecord } from "./utils";
import { scoreDimensions, validateDimensionQuestion } from "./complexity";
import { exactResponse } from "./utils";

export type DecisionMatrixQuestion = QuestionBase<"decision_matrix"> & Readonly<{
  interaction: Readonly<{ type: "decision_matrix"; scoringMethod: "dimension_exact"; dimensions: readonly CanonicalDimension[] }>;
  answer: Readonly<{ type: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;
}>;
export type DecisionMatrixResponse = Readonly<{ type: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;

export function validateDecisionMatrixQuestion(value: unknown): readonly string[] { return validateDimensionQuestion(value, "decision_matrix", false); }

export function isDecisionMatrixResponseComplete(question: DecisionMatrixQuestion, response: unknown): response is DecisionMatrixResponse {
  if (!exactResponse(response, "decision_matrix", "selectedValueIdsByDimension") || !isRecord(response.selectedValueIdsByDimension)) return false;
  const selected = response.selectedValueIdsByDimension, dimensions = question.interaction.dimensions;
  return !Object.keys(selected).some((id) => !dimensions.some((dimension) => dimension.dimensionId === id)) && dimensions.every((dimension) => {
    const values = selected[dimension.dimensionId];
    return Object.hasOwn(selected, dimension.dimensionId) && Array.isArray(values) && isDenseArray(values) && values.length > 0 && values.every((value) => typeof value === "string" && dimension.values.some((entry) => entry.valueId === value)) && new Set(values).size === values.length;
  });
}

export function scoreDecisionMatrixResponse(question: DecisionMatrixQuestion, response: unknown) {
  return scoreDimensions(question.interaction.dimensions, response, "decision_matrix", () => ({}));
}

export function decisionMatrixDiagnostics(question: DecisionMatrixQuestion, response: unknown) {
  if (!isDecisionMatrixResponseComplete(question, response)) return Object.freeze([]);
  const selected = response.selectedValueIdsByDimension;
  return Object.freeze(question.interaction.dimensions.flatMap((dimension) => {
    const values = selected[dimension.dimensionId]!, accepted = new Set(dimension.acceptedValueIds);
    return (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_value" && message.targetId.startsWith(`${dimension.dimensionId}|`) && !values.includes(message.targetId.slice(dimension.dimensionId.length + 1)) || message.kind === "omitted_dimension" && message.targetId === dimension.dimensionId && values.length !== accepted.size);
  }));
}

export const decisionMatrixHandler: InteractionHandler<DecisionMatrixQuestion> = Object.freeze({
  type: "decision_matrix",
  validate: validateDecisionMatrixQuestion,
  controlIds: (question) => Object.freeze(question.interaction.dimensions.map((dimension) => dimension.dimensionId)),
  randomizeControlOrder: false,
  present(question, response) {
    const selected = response && typeof response === "object" && (response as Record<string, unknown>).type === question.interaction.type
      ? (response as { selectedValueIdsByDimension?: Record<string, readonly string[]> }).selectedValueIdsByDimension ?? {}
      : {};
    const dimensions = Object.freeze(question.interaction.dimensions.map((dimension) => Object.freeze({ id: dimension.dimensionId, label: dimension.label, selectedValues: Object.freeze([...(selected[dimension.dimensionId] ?? [])]), values: Object.freeze(dimension.values.map((value) => Object.freeze({ id: value.valueId, text: value.text }))) })));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(dimensions.map((entry) => Object.freeze({ id: entry.id, label: entry.id, role: "select" as const }))), interactionKind: "complexity", label: question.prompt }),
      renderer: Object.freeze({ kind: "complexity", dimensions }),
    });
  },
  presentReview(question, response, displayOrder) {
    const reviewResponse = response ?? Object.freeze({ type: "decision_matrix" as const, selectedValueIdsByDimension: question.answer.selectedValueIdsByDimension });
    const diagnostics = decisionMatrixDiagnostics(question, reviewResponse);
    const { messages: _messages, ...unansweredFeedback } = question.feedback;
    return Object.freeze({ interactionType: "decision_matrix", model: decisionMatrixHandler.present(question, reviewResponse, displayOrder), diagnostics,
      feedback: response === null ? Object.freeze(unansweredFeedback) : decisionMatrixHandler.projectFeedback(question, reviewResponse) });
  },
  projectDiagnostics: decisionMatrixDiagnostics,
  projectFeedback(question, response) {
    if (!isDecisionMatrixResponseComplete(question, response)) return null;
    return Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: decisionMatrixDiagnostics(question, response) }) });
  },
  isComplete: isDecisionMatrixResponseComplete,
  score: scoreDecisionMatrixResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isDecisionMatrixResponseComplete(question, response), diagnostics = decisionMatrixDiagnostics(question, response);
    const feedback = complete ? Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: diagnostics }) }) : null;
    return canonicalEvaluation(question, response, complete, complete ? scoreDecisionMatrixResponse(question, response) : null, diagnostics, feedback);
  },
});

