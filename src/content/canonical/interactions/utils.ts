import type { AttemptResult } from "../../../domain/learning/attemptResult";
import type { InteractionEvaluation, CanonicalFeedback } from "./shared";

export function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function exactResponse(value: unknown, type: string, key: string): value is Record<string, unknown> { return isRecord(value) && value.type === type && Object.keys(value).length === 2 && Object.hasOwn(value, key); }
export function isDenseArray(value: readonly unknown[]): boolean { for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index)) return false; return true; }
export function canonicalEvaluation(question: Readonly<{ feedback: CanonicalFeedback }>, _response: unknown, complete: boolean, result: AttemptResult | null, diagnostics: unknown, feedback: CanonicalFeedback | null = complete ? question.feedback : null): InteractionEvaluation {
  return Object.freeze({ complete, result, diagnostics, feedback });
}

