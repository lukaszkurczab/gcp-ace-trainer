import { createAttemptResult, type AttemptResult } from "../../../domain/learning/attemptResult";
import type { CanonicalFeedback, InteractionEvaluation, InteractionHandler, QuestionBase } from "./shared";
import { canonicalEvaluation, exactResponse } from "./utils";
import { exact, id, uniqueIds, validateChoiceOptions, validateFeedback, validateQuestionBase } from "./validation";

export type ChoiceSingleQuestion = QuestionBase<"choice_single"> & Readonly<{
  interaction: Readonly<{ type: "choice_single"; scoringMethod: "exact_selected_set"; options: readonly Readonly<{ optionId: string; text: string; explanation?: string }>[] }>;
  answer: Readonly<{ type: "choice_single"; optionId: string }>;
}>;
export type ChoiceSingleResponse = Readonly<{ type: "choice_single"; optionId: string }>;

export function validateChoiceSingleQuestion(value: unknown): readonly string[] {
  const errors: string[] = [], question = validateQuestionBase(value, "choice_single", errors);
  if (!question) return Object.freeze(errors);
  const refs = validateChoiceOptions(question.interaction as Record<string, unknown>, "choice_single", errors);
  const answer = question.answer;
  if (exact(answer, ["type", "optionId"], ["type", "optionId"], "question.answer", errors)) {
    if (answer.type !== "choice_single") errors.push("question.answer.type: mismatched type");
    if (id(answer.optionId, "question.answer.optionId", errors) && !refs.includes(answer.optionId)) errors.push("question.answer.optionId: unknown option");
  }
  validateFeedback(question.feedback, "choice_single", ["wrong_option"], (kind, target) => kind === "wrong_option" && refs.includes(target), errors);
  return Object.freeze(errors);
}

export function isChoiceSingleResponseComplete(question: ChoiceSingleQuestion, response: unknown): response is ChoiceSingleResponse {
  return exactResponse(response, "choice_single", "optionId") && typeof response.optionId === "string" && question.interaction.options.some((option) => option.optionId === response.optionId);
}

export function scoreChoiceSingleResponse(question: ChoiceSingleQuestion, response: unknown): AttemptResult {
  return createAttemptResult({ kind: isChoiceSingleResponseComplete(question, response) && response.optionId === question.answer.optionId ? "correct" : "incorrect", earnedPoints: isChoiceSingleResponseComplete(question, response) && response.optionId === question.answer.optionId ? 1 : 0, maxPoints: 1 });
}

export const choiceSingleHandler: InteractionHandler<ChoiceSingleQuestion> = Object.freeze({
  type: "choice_single",
  validate: validateChoiceSingleQuestion,
  controlIds: (question) => Object.freeze(question.interaction.options.map((option) => option.optionId)),
  randomizeControlOrder: true,
  present(question, response, displayOrder) {
    const selected = isChoiceSingleResponseComplete(question, response) ? response.optionId : null;
    const ids = displayOrder.length ? displayOrder : question.interaction.options.map((option) => option.optionId);
    if (ids.length !== question.interaction.options.length || new Set(ids).size !== ids.length || ids.some((id) => !question.interaction.options.some((option) => option.optionId === id))) throw new Error(`Canonical display order is invalid for ${question.questionId}.`);
    const options = Object.freeze(ids.map((id) => { const option = question.interaction.options.find((entry) => entry.optionId === id)!; return Object.freeze({ id, text: option.text, selected: selected === id }); }));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(options.map((option) => Object.freeze({ checked: option.selected, id: option.id, label: option.text, role: "radio" as const }))), interactionKind: "choice", label: question.prompt }),
      renderer: Object.freeze({ kind: "choice", options }),
    });
  },
  presentReview(question, response, displayOrder) {
    const reviewResponse = response ?? Object.freeze({ type: "choice_single" as const, optionId: question.answer.optionId });
    const diagnostics = choiceDiagnostics(question, reviewResponse);
    const { messages: _messages, ...unansweredFeedback } = question.feedback;
    return Object.freeze({ interactionType: "choice_single", model: choiceSingleHandler.present(question, reviewResponse, displayOrder), diagnostics,
      feedback: response === null ? Object.freeze(unansweredFeedback) : choiceFeedbackFromDiagnostics(question, true, diagnostics) });
  },
  projectDiagnostics: choiceDiagnostics,
  projectFeedback(question, response) { return choiceFeedback(question, response); },
  isComplete: isChoiceSingleResponseComplete,
  score: scoreChoiceSingleResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isChoiceSingleResponseComplete(question, response);
    const diagnostics = choiceDiagnostics(question, response);
    const feedback = choiceFeedbackFromDiagnostics(question, complete, diagnostics);
    return canonicalEvaluation(question, response, complete, complete ? scoreChoiceSingleResponse(question, response) : null, diagnostics, feedback);
  },
});

function choiceFeedback(question: ChoiceSingleQuestion, response: unknown): CanonicalFeedback | null {
  const complete = isChoiceSingleResponseComplete(question, response);
  return choiceFeedbackFromDiagnostics(question, complete, choiceDiagnostics(question, response));
}

function choiceFeedbackFromDiagnostics(question: ChoiceSingleQuestion, complete: boolean, diagnostics: readonly Readonly<{ id: string; state: string }>[]): CanonicalFeedback | null {
  if (!complete) return null;
  const messages = (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option" ? diagnostics.some((entry) => entry.id === message.targetId && entry.state === "incorrect") : message.kind === "omitted_option" && diagnostics.some((entry) => entry.id === message.targetId && entry.state === "omitted_correct"));
  return Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: Object.freeze(messages) }) });
}

export function choiceDiagnostics(question: ChoiceSingleQuestion, response: unknown) {
  if (!isChoiceSingleResponseComplete(question, response)) return Object.freeze([]);
  const selected = response.optionId;
  return Object.freeze(question.interaction.options.map(({ optionId }) => Object.freeze({
    id: optionId,
    state: optionId === selected ? optionId === question.answer.optionId ? "correct" as const : "incorrect" as const : optionId === question.answer.optionId ? "omitted_correct" as const : "neutral" as const,
  })));
}

