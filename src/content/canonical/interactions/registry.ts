import type { AttemptResult } from "../../../domain/learning/attemptResult";
import type { CanonicalFeedbackProjection, InteractionEvaluation, InteractionHandler, ReviewInteractionPresentation } from "./shared";
import { choiceSingleHandler } from "./choiceSingle";
import { approachChoiceHandler } from "./approachChoice";
import { choiceMultipleHandler } from "./choiceMultiple";
import { orderingHandler } from "./ordering";
import { complexityHandler } from "./complexity";
import { decisionMatrixHandler } from "./decisionMatrix";

export type InteractionQuestionLike = Readonly<{ interaction: Readonly<{ type: string }> }>;
export type CanonicalInteractionRegistry = Readonly<{
  interactionTypes: readonly string[];
  has(type: string): boolean;
  validate(question: unknown): readonly string[];
  controlIds(question: InteractionQuestionLike): readonly string[];
  randomizeControlOrder(question: InteractionQuestionLike): boolean;
  present(question: InteractionQuestionLike, response: unknown, displayOrder?: readonly string[]): Readonly<{ interactionType: string; model: unknown }>;
  projectDiagnostics(question: InteractionQuestionLike, response: unknown): unknown;
  presentReview(question: InteractionQuestionLike, response: unknown | null, displayOrder?: readonly string[]): ReviewInteractionPresentation;
  projectFeedback(question: InteractionQuestionLike, response: unknown): CanonicalFeedbackProjection;
  isComplete(question: InteractionQuestionLike, response: unknown): boolean;
  score(question: InteractionQuestionLike, response: unknown): AttemptResult;
  evaluate(question: InteractionQuestionLike, response: unknown): InteractionEvaluation;
}>;

type ErasedHandler = Readonly<{
  type: string;
  validate(question: unknown): readonly string[];
  controlIds(question: unknown): readonly string[];
  randomizeControlOrder: boolean;
  present(question: unknown, response: unknown, displayOrder: readonly string[]): unknown;
  projectDiagnostics(question: unknown, response: unknown): unknown;
  presentReview(question: unknown, response: unknown | null, displayOrder: readonly string[]): ReviewInteractionPresentation;
  projectFeedback(question: unknown, response: unknown): CanonicalFeedbackProjection;
  isComplete(question: unknown, response: unknown): boolean;
  score(question: unknown, response: unknown): AttemptResult;
  evaluate(question: unknown, response: unknown): InteractionEvaluation;
}>;

/** Explicit handler composition. New interactions register a module here without extending a switch or a shared payload union. */
export function createCanonicalInteractionRegistry(handlers: readonly InteractionHandler<unknown>[]): CanonicalInteractionRegistry {
  const byType = new Map<string, ErasedHandler>();
  for (const handler of handlers) {
    if (!handler || typeof handler.type !== "string" || handler.type.length === 0
      || typeof handler.validate !== "function"
      || typeof handler.controlIds !== "function"
      || typeof handler.present !== "function"
      || typeof handler.projectDiagnostics !== "function"
      || typeof handler.presentReview !== "function"
      || typeof handler.projectFeedback !== "function"
      || typeof handler.isComplete !== "function"
      || typeof handler.score !== "function"
      || typeof handler.evaluate !== "function"
      || typeof handler.randomizeControlOrder !== "boolean") {
      throw new Error("Canonical interaction handler is invalid.");
    }
    if (byType.has(handler.type)) throw new Error(`Canonical interaction handler is duplicated: ${handler.type}.`);
    byType.set(handler.type, eraseHandler(handler));
  }
  function resolve(question: InteractionQuestionLike): ErasedHandler {
    const handler = byType.get(question.interaction.type);
    if (!handler) throw new Error(`Canonical interaction handler is unavailable for ${question.interaction.type}.`);
    return handler;
  }
  function resolveValue(question: unknown): ErasedHandler | undefined {
    if (!question || typeof question !== "object" || Array.isArray(question)) return undefined;
    const interaction = (question as Record<string, unknown>).interaction;
    if (!interaction || typeof interaction !== "object" || Array.isArray(interaction)) return undefined;
    const type = (interaction as Record<string, unknown>).type;
    return typeof type === "string" ? byType.get(type) : undefined;
  }
  return Object.freeze({
    interactionTypes: Object.freeze([...byType.keys()]),
    has: (type) => byType.has(type),
    validate: (question) => resolveValue(question)?.validate(question) ?? Object.freeze(["question.interaction.type: unsupported interaction"]),
    controlIds: (question) => Object.freeze([...resolve(question).controlIds(question)]),
    randomizeControlOrder: (question) => resolve(question).randomizeControlOrder,
    present: (question, response, displayOrder = []) => Object.freeze({ interactionType: resolve(question).type, model: resolve(question).present(question, response, displayOrder) }),
    projectDiagnostics: (question, response) => resolve(question).projectDiagnostics(question, response),
    presentReview: (question, response, displayOrder = []) => resolve(question).presentReview(question, response, displayOrder),
    projectFeedback: (question, response) => resolve(question).projectFeedback(question, response),
    isComplete: (question, response) => resolve(question).isComplete(question, response),
    score: (question, response) => resolve(question).score(question, response),
    evaluate: (question, response) => resolve(question).evaluate(question, response),
  });
}

function eraseHandler<Q>(handler: InteractionHandler<Q>): ErasedHandler {
  return Object.freeze({
    type: handler.type,
    validate: (question) => handler.validate(question),
    controlIds: (question) => handler.controlIds(question as Q),
    randomizeControlOrder: handler.randomizeControlOrder,
    present: (question, response, displayOrder) => handler.present(question as Q, response, displayOrder),
    projectDiagnostics: (question, response) => handler.projectDiagnostics(question as Q, response),
    presentReview: (question, response, displayOrder) => handler.presentReview(question as Q, response, displayOrder),
    projectFeedback: (question, response) => handler.projectFeedback(question as Q, response),
    isComplete: (question, response) => handler.isComplete(question as Q, response),
    score: (question, response) => handler.score(question as Q, response),
    evaluate: (question, response) => handler.evaluate(question as Q, response),
  });
}

export const canonicalInteractionRegistry = createCanonicalInteractionRegistry([
  approachChoiceHandler,
  choiceSingleHandler,
  choiceMultipleHandler,
  orderingHandler,
  complexityHandler,
  decisionMatrixHandler,
]);
