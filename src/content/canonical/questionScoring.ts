import type { AttemptResult } from "../../domain/learning/attemptResult";
import type { CanonicalQuestionResponse, ChoiceMultipleQuestion, ChoiceSingleQuestion, ComplexityQuestion, DecisionMatrixQuestion, OrderingQuestion, Question } from "./questionTypes";
import { canonicalInteractionRegistry } from "./interactions/registry";
import type { InteractionEvaluation } from "./interactions/shared";
import { scoreChoiceSingleResponse } from "./interactions/choiceSingle";
import { scoreChoiceMultipleResponse } from "./interactions/choiceMultiple";
import { scoreOrderingResponse } from "./interactions/ordering";
import { scoreComplexityResponse } from "./interactions/complexity";
import { scoreDecisionMatrixResponse } from "./interactions/decisionMatrix";

/** Compatibility entry point; scoring and completeness are delegated to the registered vertical handler. */
export function isCanonicalResponseComplete(question: Question, response: unknown): response is CanonicalQuestionResponse {
  return canonicalInteractionRegistry.isComplete(question, response);
}

/** Compatibility entry point retained for existing domain callers. */
export function scoreCanonicalQuestion(question: Question, response: unknown): AttemptResult {
  return canonicalInteractionRegistry.score(question, response);
}

export function evaluateCanonicalQuestion(question: Question, response: unknown): InteractionEvaluation {
  return canonicalInteractionRegistry.evaluate(question, response);
}

export function scoreChoiceSingleQuestion(question: ChoiceSingleQuestion, response: unknown): AttemptResult { return scoreChoiceSingleResponse(question, response); }
export function scoreChoiceMultipleQuestion(question: ChoiceMultipleQuestion, response: unknown): AttemptResult { return scoreChoiceMultipleResponse(question, response); }
export function scoreOrderingQuestion(question: OrderingQuestion, response: unknown): AttemptResult { return scoreOrderingResponse(question, response); }
export function scoreComplexityQuestion(question: ComplexityQuestion, response: unknown): AttemptResult { return scoreComplexityResponse(question, response); }
export function scoreDecisionMatrixQuestion(question: DecisionMatrixQuestion, response: unknown): AttemptResult { return scoreDecisionMatrixResponse(question, response); }
