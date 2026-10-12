import { createAttemptResult, type AttemptResult } from "../../../domain/learning/attemptResult";
import type { InteractionEvaluation, InteractionHandler, QuestionBase } from "./shared";
import { canonicalEvaluation, exactResponse, isDenseArray } from "./utils";
import { exact, uniqueIds, validateFeedback, validateQuestionBase } from "./validation";

export type OrderingQuestion = QuestionBase<"ordering"> & Readonly<{
  interaction: Readonly<{ type: "ordering"; scoringMethod: "adjacent_relations"; elements: readonly Readonly<{ elementId: string; text: string }>[] }>;
  answer: Readonly<{ type: "ordering"; orderedElementIds: readonly string[] }>;
}>;
export type OrderingResponse = Readonly<{ type: "ordering"; orderedElementIds: readonly string[] }>;

export function validateOrderingQuestion(value: unknown): readonly string[] {
  const errors: string[] = [], question = validateQuestionBase(value, "ordering", errors);
  if (!question) return Object.freeze(errors);
  const refs: string[] = [], interaction = question.interaction as Record<string, unknown>;
  if (exact(interaction, ["type", "scoringMethod", "elements"], ["type", "scoringMethod", "elements"], "question.interaction", errors)) {
    if (interaction.scoringMethod !== "adjacent_relations") errors.push("question.interaction.scoringMethod: invalid method");
    if (!Array.isArray(interaction.elements)) errors.push("question.interaction.elements: must be an array");
    else {
      if (interaction.elements.length < 2) errors.push("question.interaction.elements: must contain at least two elements");
      for (const [i, element] of interaction.elements.entries()) if (exact(element, ["elementId", "text"], ["elementId", "text"], `question.interaction.elements[${i}]`, errors)) {
        if (typeof element.elementId === "string") refs.push(element.elementId); else errors.push(`question.interaction.elements[${i}].elementId: must be an identity`);
        if (typeof element.text !== "string" || element.text.trim().length === 0) errors.push(`question.interaction.elements[${i}].text: must contain text`);
      }
      if (new Set(refs).size !== refs.length) errors.push("question.interaction.elements: element IDs must be unique");
    }
  }
  const answer = question.answer;
  if (exact(answer, ["type", "orderedElementIds"], ["type", "orderedElementIds"], "question.answer", errors)) {
    if (answer.type !== "ordering") errors.push("question.answer.type: mismatched type");
    const ordered = uniqueIds(answer.orderedElementIds, "question.answer.orderedElementIds", errors, 2);
    if (ordered.length !== refs.length || new Set(ordered).size !== refs.length || refs.some((id) => !ordered.includes(id))) errors.push("question.answer.orderedElementIds: must contain exactly the interaction elements");
  }
  const submitted = answer && typeof answer === "object" && Array.isArray((answer as Record<string, unknown>).orderedElementIds) ? (answer as { orderedElementIds: unknown[] }).orderedElementIds : [];
  const relations = new Set(submitted.slice(0, -1).map((entry, index) => `${entry}->${submitted[index + 1]}`));
  validateFeedback(question.feedback, "ordering", ["wrong_element", "broken_relation"], (kind, target) => kind === "wrong_element" ? refs.includes(target) : kind === "broken_relation" && relations.has(target), errors);
  return Object.freeze(errors);
}

export function isOrderingResponseComplete(question: OrderingQuestion, response: unknown): response is OrderingResponse {
  const expected = question.answer.orderedElementIds;
  return exactResponse(response, "ordering", "orderedElementIds") && Array.isArray(response.orderedElementIds) && isDenseArray(response.orderedElementIds) && response.orderedElementIds.length === expected.length && new Set(response.orderedElementIds).size === response.orderedElementIds.length && response.orderedElementIds.every((id) => typeof id === "string" && expected.includes(id));
}

export function scoreOrderingResponse(question: OrderingQuestion, response: unknown): AttemptResult {
  const expected = question.answer.orderedElementIds, maxPoints = expected.length - 1;
  if (!exactResponse(response, "ordering", "orderedElementIds") || !Array.isArray(response.orderedElementIds) || new Set(response.orderedElementIds).size !== response.orderedElementIds.length || response.orderedElementIds.some((id) => typeof id !== "string" || !expected.includes(id))) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints });
  const submitted = response.orderedElementIds as string[];
  const relations = new Set(expected.slice(0, -1).map((id, index) => `${id}->${expected[index + 1]}`));
  const earnedPoints = submitted.slice(0, -1).filter((id, index) => relations.has(`${id}->${submitted[index + 1]}`)).length;
  return createAttemptResult({ kind: earnedPoints === maxPoints ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", earnedPoints, maxPoints });
}

export function orderingDiagnostics(question: OrderingQuestion, response: unknown) {
  if (!isOrderingResponseComplete(question, response)) return Object.freeze([]);
  const submitted = new Set(response.orderedElementIds.slice(0, -1).map((id, index) => `${id}->${response.orderedElementIds[index + 1]}`));
  return Object.freeze((question.feedback.messages ?? []).filter((message) => message.kind === "broken_relation" && !submitted.has(message.targetId)));
}

export const orderingHandler: InteractionHandler<OrderingQuestion> = Object.freeze({
  type: "ordering",
  validate: validateOrderingQuestion,
  controlIds: (question) => Object.freeze(question.interaction.elements.map((element) => element.elementId)),
  randomizeControlOrder: false,
  present(question, response, displayOrder) {
    const ids = isOrderingResponseComplete(question, response) ? response.orderedElementIds : displayOrder.length ? displayOrder : question.interaction.elements.map((element) => element.elementId);
    if (ids.length !== question.interaction.elements.length || new Set(ids).size !== ids.length || ids.some((id) => !question.interaction.elements.some((element) => element.elementId === id))) throw new Error(`Canonical ordering is invalid for ${question.questionId}.`);
    const elements = Object.freeze(ids.map((id) => { const element = question.interaction.elements.find((entry) => entry.elementId === id)!; return Object.freeze({ id, text: element.text }); }));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(elements.map((entry) => Object.freeze({ id: entry.id, label: entry.text, role: "option" as const }))), interactionKind: "ordering", label: question.prompt }),
      renderer: Object.freeze({ kind: "ordering", elements }),
    });
  },
  presentReview(question, response, displayOrder) {
    const reviewResponse = response ?? Object.freeze({ type: "ordering" as const, orderedElementIds: Object.freeze([...question.answer.orderedElementIds]) });
    const diagnostics = orderingDiagnostics(question, reviewResponse);
    const { messages: _messages, ...unansweredFeedback } = question.feedback;
    return Object.freeze({ interactionType: "ordering", model: orderingHandler.present(question, reviewResponse, displayOrder), diagnostics,
      feedback: response === null ? Object.freeze(unansweredFeedback) : orderingHandler.projectFeedback(question, reviewResponse) });
  },
  projectDiagnostics: orderingDiagnostics,
  projectFeedback(question, response) {
    if (!isOrderingResponseComplete(question, response)) return null;
    return Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: orderingDiagnostics(question, response) }) });
  },
  isComplete: isOrderingResponseComplete,
  score: scoreOrderingResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isOrderingResponseComplete(question, response);
    const diagnostics = orderingDiagnostics(question, response);
    const feedback = complete ? Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: diagnostics }) }) : null;
    return canonicalEvaluation(question, response, complete, complete ? scoreOrderingResponse(question, response) : null, diagnostics, feedback);
  },
});
