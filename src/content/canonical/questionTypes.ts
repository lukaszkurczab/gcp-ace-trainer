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
export type CanonicalFeedback<T extends QuestionInteractionType> = Readonly<{
  type: T;
  reason: string;
  details: JsonValue;
  messages?: readonly CanonicalFeedbackMessage[];
}>;

type QuestionBase<T extends QuestionInteractionType> = Readonly<{
  questionId: string;
  trackId: string;
  nodeId: string;
  mentalUnitId: string;
  prompt: string;
  constraints?: readonly string[];
  difficulty: string | null;
  sourceRefs?: readonly string[];
  feedback: CanonicalFeedback<T>;
}>;

export type ChoiceSingleQuestion = QuestionBase<"choice_single"> & Readonly<{
  interaction: Readonly<{ type: "choice_single"; scoringMethod: "exact_selected_set"; options: readonly CanonicalOption[] }>;
  answer: Readonly<{ type: "choice_single"; optionId: string }>;
}>;
export type ChoiceMultipleQuestion = QuestionBase<"choice_multiple"> & Readonly<{
  interaction: Readonly<{ type: "choice_multiple"; scoringMethod: "exact_selected_set"; options: readonly CanonicalOption[] }>;
  answer: Readonly<{ type: "choice_multiple"; optionIds: readonly string[] }>;
}>;
export type OrderingQuestion = QuestionBase<"ordering"> & Readonly<{
  interaction: Readonly<{ type: "ordering"; scoringMethod: "adjacent_relations"; elements: readonly CanonicalElement[] }>;
  answer: Readonly<{ type: "ordering"; orderedElementIds: readonly string[] }>;
}>;
export type ComplexityQuestion = QuestionBase<"complexity"> & Readonly<{
  interaction: Readonly<{ type: "complexity"; scoringMethod: "dimension_exact"; dimensions: readonly CanonicalComplexityDimension[] }>;
  answer: Readonly<{ type: "complexity"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;
}>;
export type DecisionMatrixQuestion = QuestionBase<"decision_matrix"> & Readonly<{
  interaction: Readonly<{ type: "decision_matrix"; scoringMethod: "dimension_exact"; dimensions: readonly CanonicalDimension[] }>;
  answer: Readonly<{ type: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;
}>;

export type QuestionInteractionType = "choice_single" | "choice_multiple" | "ordering" | "complexity" | "decision_matrix";
export type Question = ChoiceSingleQuestion | ChoiceMultipleQuestion | OrderingQuestion | ComplexityQuestion | DecisionMatrixQuestion;

export type CanonicalQuestionResponse =
  | Readonly<{ type: "choice_single"; optionId: string }>
  | Readonly<{ type: "choice_multiple"; optionIds: readonly string[] }>
  | Readonly<{ type: "ordering"; orderedElementIds: readonly string[] }>
  | Readonly<{ type: "complexity"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>
  | Readonly<{ type: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;

export type CanonicalArtifact = Readonly<{
  schemaVersion: "patternly-content-artifact-v1";
  trackId: string;
  contentVersion: string;
  questions: readonly Question[];
}>;

export type CanonicalContentLockRecord = Readonly<{ trackId: string; contentVersion: string; questionCount: number; sha256: string }>;
