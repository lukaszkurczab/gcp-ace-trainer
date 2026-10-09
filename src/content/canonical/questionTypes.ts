import type { PackageCompletionRuleV2 } from "../../domain/learning/packageCompletionRule";
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

export type CanonicalQuestionRelation = Readonly<{
  counterpartQuestionId: string;
  kind: "near_variant" | "condition_contrast";
  changedCondition: string;
  decisionBoundary: string;
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
  contentDomainId?: string;
  questionRelation?: CanonicalQuestionRelation;
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

export type CanonicalCertificationSimulationConfig = Readonly<{
  schemaVersion: "patternly-certification-simulation-config-v1";
  source: Readonly<{ url: string; checkedDate: string; guideVersion: string }>;
  durationMinutes: number;
  questionCount: Readonly<{ kind: "range"; minimum: number; maximum: number }>;
  blueprint: Readonly<{ kind: "weighted_sections"; sections: readonly Readonly<{ id: string; contentDomainId: string; weightPercent: number }>[] }>;
  interactionPolicy: Readonly<{
    schemaVersion: "patternly-certification-simulation-policy-v1";
    policyId: string;
    policyVersion: "1";
    owner: "patternly_product";
    navigation: "free";
    answerChanges: "until_final_submission";
    flagging: "available";
    navigator: "available";
    sections: "blueprint_visible";
    timeout: "absolute_deadline";
    feedbackTiming: "after_verified_finalization";
  }>;
  nodeDomainMap: Readonly<Record<string, string>>;
  nodeDomainMapEvidence: Readonly<{ artifactPath: string; contentVersion: string; itemCount: number; nodeCount: number; ambiguousNodeCount: number }>;
}>;

export type CanonicalCodingInterviewSimulationConfig = Readonly<{
  schemaVersion: "patternly-coding-interview-simulation-config-v1";
  blueprintId: "coding-interview-interview-simulation-v1";
  blueprintVersion: "1";
  requestedLength: 40;
  actualLength: 40;
  shorteningPolicy: "prohibited";
  uniqueItemsRequired: 40;
  timerKind: "foreground_countdown";
  durationMinutes: 45;
  navigationPolicy: "free_navigation";
  answerChangePolicy: "editable_until_finalization";
  reinsertPolicy: "disabled";
  feedbackTiming: "after_verified_finalization";
  learningStages: readonly ["simulation"];
  selectionPolicy: Readonly<{
    requireUniqueItemIds: true;
    requireDeclaredSimulationEligibility: true;
    requireMultipleMentalUnits: true;
    requireMultiplePatternFamilies: true;
    requireEveryActiveInteractionTypeRepresented: true;
    prohibitConsecutiveSameMentalUnitWhenAlternativeExists: true;
    prohibitDuplicateContentIdentity: true;
    prohibitTaxonomyWidening: true;
    prohibitFallbackItems: true;
  }>;
  poolId: "algorithms-interview-simulation-v1";
  poolVersion: "1";
  eligibleQuestionIds: readonly string[];
}>;

export type CanonicalSimulationProfile = Readonly<{
  schemaVersion: "patternly-simulation-profile-envelope-v1";
  profileId: string;
  profileVersion: string;
  familyId: "certification";
  modeId: "certification-exam-simulation";
  familyConfig: CanonicalCertificationSimulationConfig;
}>;

export type CanonicalCodingInterviewSimulationProfile = Readonly<{
  schemaVersion: "patternly-simulation-profile-envelope-v1";
  profileId: "algorithms-interview-simulation-v1";
  profileVersion: "1";
  familyId: "coding_interview";
  modeId: "coding-interview-simulation";
  familyConfig: CanonicalCodingInterviewSimulationConfig;
}>;

export type CanonicalDesignInterviewSimulationConfig = Readonly<{
  schemaVersion: "patternly-design-interview-simulation-config-v1";
  caseId: string;
  caseVersion: "1";
  title: string;
  brief: string;
  timer: Readonly<{ kind: "absolute_deadline"; durationSeconds: number }>;
  stages: readonly Readonly<{ stageId: "requirements" | "architecture" | "tradeoffs" | "final_answer"; title: string; response: Readonly<{ type: "text"; required: true; minimumCharacters: 1 }> }>[];
  reviewCriteria: readonly Readonly<{ criterionId: string; stageId: "requirements" | "architecture" | "tradeoffs" | "final_answer"; description: string }>[];
  rubric: Readonly<{ kind: "self_assessment_reference_only"; dimensions: readonly Readonly<{ dimensionId: string; title: string; levels: readonly Readonly<{ level: number; label: string; description: string }>[] }>[] }>;
  outcomeEvaluation: Readonly<{ machineEvaluable: readonly ["response_completeness"]; semanticScoring: "not_evaluated" }>;
}>;

export type CanonicalDesignInterviewSimulationProfile = Readonly<{
  schemaVersion: "patternly-simulation-profile-envelope-v1";
  profileId: string;
  profileVersion: "1";
  familyId: "design_interview";
  modeId: "design-interview-simulation";
  familyConfig: CanonicalDesignInterviewSimulationConfig;
}>;

export type CanonicalProductSimulationProfile = CanonicalSimulationProfile | CanonicalCodingInterviewSimulationProfile | CanonicalDesignInterviewSimulationProfile;

export type CanonicalQuestionResponse =
  | Readonly<{ type: "choice_single"; optionId: string }>
  | Readonly<{ type: "choice_multiple"; optionIds: readonly string[] }>
  | Readonly<{ type: "ordering"; orderedElementIds: readonly string[] }>
  | Readonly<{ type: "complexity"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>
  | Readonly<{ type: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;

export type CanonicalArtifact = Readonly<{
  schemaVersion: "patternly-content-artifact-v1" | "patternly-content-artifact-v2";
  trackId: string;
  contentVersion: string;
  questions: readonly Question[];
  completionRule?: PackageCompletionRuleV2;
  simulationProfiles?: readonly CanonicalProductSimulationProfile[];
  planningPolicy?: unknown;
}>;

export type CanonicalContentLockRecord = Readonly<{ trackId: string; contentVersion: string; questionCount: number; sha256: string }>;
