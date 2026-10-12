import type { AttemptResult } from "../../../domain/learning/attemptResult";

export type JsonValue = string | number | boolean | null | readonly JsonValue[] | Readonly<{ [key: string]: JsonValue }>;
export type CanonicalOption = Readonly<{ optionId: string; text: string; explanation?: string }>;
export type CanonicalElement = Readonly<{ elementId: string; text: string }>;
export type CanonicalValue = Readonly<{ valueId: string; text: string }>;
export type CanonicalDimension = Readonly<{
  dimensionId: string;
  label: string;
  values: readonly CanonicalValue[];
  acceptedValueIds: readonly string[];
}>;
export type CanonicalComplexityDimension = CanonicalDimension & Readonly<{ aliases?: Readonly<Record<string, string>> }>;
export type CanonicalFeedbackMessage = Readonly<{ kind: string; targetId: string; text: string }>;
export type CanonicalFeedbackProjection = CanonicalFeedback | null;
export type CanonicalCourseSource = Readonly<{ title: string; url: string; section?: string; requiresAccount: boolean }>;
export type CanonicalFeedback<T extends string = string> = Readonly<{
  type: T;
  reason: string;
  details: JsonValue;
  course?: CanonicalCourseSource;
  messages?: readonly CanonicalFeedbackMessage[];
}>;
export type CanonicalQuestionRelation = Readonly<{
  counterpartQuestionId: string;
  kind: "near_variant" | "condition_contrast";
  changedCondition: string;
  decisionBoundary: string;
}>;
export type QuestionBase<T extends string = string> = Readonly<{
  questionId: string;
  trackId: string;
  nodeId: string;
  mentalUnitId: string;
  prompt: string;
  constraints?: readonly string[];
  difficulty: string | null;
  sourceRefs?: readonly string[];
  contentDomainId?: string;
  questionRelation?: CanonicalQuestionRelation;
  feedback: CanonicalFeedback<T>;
}>;

/** A handler result is computed once and carries the exact authored feedback selected for that response. */
export type InteractionEvaluation = Readonly<{
  complete: boolean;
  result: AttemptResult | null;
  diagnostics: unknown;
  feedback: CanonicalFeedback | null;
}>;

/** Private exact-owner projection for terminal review; it never contains authored answers. */
export type ReviewInteractionPresentation = Readonly<{
  interactionType: string;
  model: unknown;
  diagnostics: unknown;
  feedback: CanonicalFeedback | null;
}>;

export type InteractionHandler<Q = unknown> = Readonly<{
  type: string;
  validate(question: unknown): readonly string[];
  /** Stable IDs and order policy needed by session planning without exposing the question union. */
  controlIds(question: Q): readonly string[];
  randomizeControlOrder: boolean;
  /** Neutral display data owned by the interaction module; the UI binds it to a renderer. */
  present(question: Q, response: unknown, displayOrder: readonly string[]): unknown;
  projectDiagnostics(question: Q, response: unknown): unknown;
  /** Builds terminal review controls from the saved response, or privately from the answer when unanswered. */
  presentReview(question: Q, response: unknown | null, displayOrder: readonly string[]): ReviewInteractionPresentation;
  /** Reprojects authored response feedback without recomputing the durable score. */
  projectFeedback(question: Q, response: unknown): CanonicalFeedbackProjection;
  isComplete(question: Q, response: unknown): boolean;
  score(question: Q, response: unknown): AttemptResult;
  evaluate(question: Q, response: unknown): InteractionEvaluation;
}>;
