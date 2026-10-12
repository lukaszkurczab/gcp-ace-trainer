import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
import type { AttemptResult } from "../../domain/learning/attemptResult";
import { canonicalInteractionRegistry } from "../../content/canonical/interactions/registry";

export type CanonicalInteractionViewModel = Readonly<{
  interactionType: string;
  model: unknown;
}>;

export function buildCanonicalInteractionViewModel(question: Question, response: CanonicalQuestionResponse | null, displayOrder: readonly string[] = []): CanonicalInteractionViewModel {
  return canonicalInteractionRegistry.present(question, response, displayOrder);
}

export function composeCanonicalFeedback(question: Question, response: CanonicalQuestionResponse, result: AttemptResult) {
  const feedback = canonicalInteractionRegistry.projectFeedback(question, response);
  if (!feedback) throw new Error("Canonical response is incomplete or invalid.");
  return Object.freeze({ correctness: result.kind, reason: feedback.reason, details: feedback.details, ...(feedback.messages === undefined ? {} : { messages: feedback.messages }) });
}

export type CanonicalChoiceFeedbackState = "correct" | "incorrect" | "omitted_correct" | "neutral";

/** Projects authored answer evidence and the learner response without changing scoring ownership. */
export function projectCanonicalChoiceFeedbackControls(question: Question, response: CanonicalQuestionResponse): readonly Readonly<{ id: string; state: CanonicalChoiceFeedbackState }>[] {
  if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") return Object.freeze([]);
  if (response.type !== question.interaction.type) throw new Error(`Canonical feedback response type does not match ${question.questionId}.`);
  const selected = question.interaction.type === "choice_single"
    ? new Set([(response as Extract<CanonicalQuestionResponse, { type: "choice_single" }>).optionId])
    : new Set((response as Extract<CanonicalQuestionResponse, { type: "choice_multiple" }>).optionIds);
  const correct = question.interaction.type === "choice_single"
    ? new Set([(question as Extract<Question, { interaction: { type: "choice_single" } }>).answer.optionId])
    : new Set((question as Extract<Question, { interaction: { type: "choice_multiple" } }>).answer.optionIds);
  return Object.freeze(question.interaction.options.map((option) => Object.freeze({
    id: option.optionId,
    state: selected.has(option.optionId)
      ? correct.has(option.optionId) ? "correct" as const : "incorrect" as const
      : correct.has(option.optionId) ? "omitted_correct" as const : "neutral" as const,
  })));
}

/** Selects authored ordering relation messages only when the submitted adjacency is absent. */
export function projectCanonicalOrderingFeedbackMessages(question: Question, response: unknown): readonly Readonly<{ kind: string; targetId: string; text: string }>[] | undefined {
  if (question.interaction.type !== "ordering" || !question.feedback.messages) return undefined;
  const feedback = canonicalInteractionRegistry.projectFeedback(question, response);
  if (!feedback) throw new Error("Canonical response is incomplete or invalid.");
  return feedback.messages;
}

/** Selects authored choice messages using the same stable-ID states exposed to answer controls. */
export function projectCanonicalChoiceFeedbackMessages(question: Question, response: CanonicalQuestionResponse): readonly Readonly<{ kind: string; targetId: string; text: string }>[] | undefined {
  if ((question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") || !question.feedback.messages) return undefined;
  const feedback = canonicalInteractionRegistry.projectFeedback(question, response);
  if (!feedback) throw new Error("Canonical response is incomplete or invalid.");
  return feedback.messages;
}
