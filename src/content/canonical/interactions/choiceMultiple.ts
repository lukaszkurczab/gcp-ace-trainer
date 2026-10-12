import { createAttemptResult, type AttemptResult } from "../../../domain/learning/attemptResult";
import type { CanonicalFeedback, InteractionEvaluation, InteractionHandler, QuestionBase } from "./shared";
import { canonicalEvaluation, exactResponse, isDenseArray } from "./utils";
import { exact, uniqueIds, validateChoiceOptions, validateFeedback, validateQuestionBase } from "./validation";

export type ChoiceMultipleQuestion = QuestionBase<"choice_multiple"> & Readonly<{
  interaction: Readonly<{ type: "choice_multiple"; scoringMethod: "exact_selected_set"; options: readonly Readonly<{ optionId: string; text: string; explanation?: string }>[] }>;
  answer: Readonly<{ type: "choice_multiple"; optionIds: readonly string[] }>;
}>;
export type ChoiceMultipleResponse = Readonly<{ type: "choice_multiple"; optionIds: readonly string[] }>;

export function validateChoiceMultipleQuestion(value: unknown): readonly string[] {
  const errors: string[] = [], question = validateQuestionBase(value, "choice_multiple", errors);
  if (!question) return Object.freeze(errors);
  const refs = validateChoiceOptions(question.interaction as Record<string, unknown>, "choice_multiple", errors), answer = question.answer;
  if (exact(answer, ["type", "optionIds"], ["type", "optionIds"], "question.answer", errors)) {
    if (answer.type !== "choice_multiple") errors.push("question.answer.type: mismatched type");
    const selected = uniqueIds(answer.optionIds, "question.answer.optionIds", errors, 1);
    if (selected.some((entry) => !refs.includes(entry))) errors.push("question.answer.optionIds: unknown option");
  }
  validateFeedback(question.feedback, "choice_multiple", ["wrong_option", "omitted_option"], (kind, target) => (kind === "wrong_option" || kind === "omitted_option") && refs.includes(target), errors);
  return Object.freeze(errors);
}

export function isChoiceMultipleResponseComplete(question: ChoiceMultipleQuestion, response: unknown): response is ChoiceMultipleResponse {
  return exactResponse(response, "choice_multiple", "optionIds") && Array.isArray(response.optionIds) && isDenseArray(response.optionIds) && response.optionIds.length > 0 && new Set(response.optionIds).size === response.optionIds.length && response.optionIds.every((id) => typeof id === "string" && question.interaction.options.some((option) => option.optionId === id));
}

export function scoreChoiceMultipleResponse(question: ChoiceMultipleQuestion, response: unknown): AttemptResult {
  const optionIds = question.interaction.options.map((option) => option.optionId);
  if (!exactResponse(response, "choice_multiple", "optionIds") || !Array.isArray(response.optionIds) || new Set(response.optionIds).size !== response.optionIds.length || response.optionIds.some((id) => typeof id !== "string" || !optionIds.includes(id))) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: optionIds.length });
  const selected = new Set(response.optionIds as string[]), expected = new Set(question.answer.optionIds);
  if (selected.size === 0 || [...selected].some((id) => !expected.has(id))) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: optionIds.length });
  const earnedPoints = optionIds.filter((id) => expected.has(id) ? selected.has(id) : !selected.has(id)).length;
  return createAttemptResult({ kind: earnedPoints === optionIds.length ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", earnedPoints, maxPoints: optionIds.length });
}

export const choiceMultipleHandler: InteractionHandler<ChoiceMultipleQuestion> = Object.freeze({
  type: "choice_multiple",
  validate: validateChoiceMultipleQuestion,
  controlIds: (question) => Object.freeze(question.interaction.options.map((option) => option.optionId)),
  randomizeControlOrder: true,
  present(question, response, displayOrder) {
    const selected = isChoiceMultipleResponseComplete(question, response) ? new Set(response.optionIds) : new Set<string>();
    const ids = displayOrder.length ? displayOrder : question.interaction.options.map((option) => option.optionId);
    if (ids.length !== question.interaction.options.length || new Set(ids).size !== ids.length || ids.some((id) => !question.interaction.options.some((option) => option.optionId === id))) throw new Error(`Canonical display order is invalid for ${question.questionId}.`);
    const options = Object.freeze(ids.map((id) => { const option = question.interaction.options.find((entry) => entry.optionId === id)!; return Object.freeze({ id, text: option.text, selected: selected.has(id) }); }));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(options.map((option) => Object.freeze({ checked: option.selected, id: option.id, label: option.text, role: "checkbox" as const }))), interactionKind: "choice", label: question.prompt }),
      renderer: Object.freeze({ kind: "choice", options }),
    });
  },
  presentReview(question, response, displayOrder) {
    const reviewResponse = response ?? Object.freeze({ type: "choice_multiple" as const, optionIds: Object.freeze([...question.answer.optionIds]) });
    const diagnostics = choiceDiagnostics(question, reviewResponse);
    const { messages: _messages, ...unansweredFeedback } = question.feedback;
    return Object.freeze({ interactionType: "choice_multiple", model: choiceMultipleHandler.present(question, reviewResponse, displayOrder), diagnostics,
      feedback: response === null ? Object.freeze(unansweredFeedback) : choiceFeedbackFromDiagnostics(question, true, diagnostics) });
  },
  projectDiagnostics: choiceDiagnostics,
  projectFeedback(question, response) { return choiceFeedback(question, response); },
  isComplete: isChoiceMultipleResponseComplete,
  score: scoreChoiceMultipleResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isChoiceMultipleResponseComplete(question, response);
    const diagnostics = choiceDiagnostics(question, response);
    const feedback = choiceFeedbackFromDiagnostics(question, complete, diagnostics);
    return canonicalEvaluation(question, response, complete, complete ? scoreChoiceMultipleResponse(question, response) : null, diagnostics, feedback);
  },
});

function choiceFeedback(question: ChoiceMultipleQuestion, response: unknown): CanonicalFeedback | null {
  const complete = isChoiceMultipleResponseComplete(question, response);
  return choiceFeedbackFromDiagnostics(question, complete, choiceDiagnostics(question, response));
}

function choiceFeedbackFromDiagnostics(question: ChoiceMultipleQuestion, complete: boolean, diagnostics: readonly Readonly<{ id: string; state: string }>[]): CanonicalFeedback | null {
  if (!complete) return null;
  const messages = (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option" ? diagnostics.some((entry) => entry.id === message.targetId && entry.state === "incorrect") : message.kind === "omitted_option" && diagnostics.some((entry) => entry.id === message.targetId && entry.state === "omitted_correct"));
  return Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: Object.freeze(messages) }) });
}

export function choiceDiagnostics(question: ChoiceMultipleQuestion, response: unknown) {
  if (!isChoiceMultipleResponseComplete(question, response)) return Object.freeze([]);
  const selected = new Set(response.optionIds), expected = new Set(question.answer.optionIds);
  return Object.freeze(question.interaction.options.map(({ optionId }) => Object.freeze({ id: optionId, state: selected.has(optionId) ? expected.has(optionId) ? "correct" as const : "incorrect" as const : expected.has(optionId) ? "omitted_correct" as const : "neutral" as const })));
}

