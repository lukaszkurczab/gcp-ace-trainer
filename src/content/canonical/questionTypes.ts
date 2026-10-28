import type { PackageCompletionRule } from "../../domain/learning/packageCompletionRule";
import type { CanonicalDimension, CanonicalQuestionRelation, CanonicalExamMetadata, CanonicalStatementReviewRow, JsonValue, CanonicalFeedback, CanonicalFeedbackMessage, CanonicalCourseSource, CanonicalOption, CanonicalElement, CanonicalValue, CanonicalComplexityDimension } from "./interactions/shared";
import type { ChoiceSingleQuestion } from "./interactions/choiceSingle";
import type { ChoiceMultipleQuestion } from "./interactions/choiceMultiple";
import type { OrderingQuestion } from "./interactions/ordering";
import type { ComplexityQuestion } from "./interactions/complexity";
import type { DecisionMatrixQuestion } from "./interactions/decisionMatrix";
export type { CanonicalDimension, CanonicalQuestionRelation, CanonicalExamMetadata, CanonicalStatementReviewRow, JsonValue, CanonicalFeedback, CanonicalFeedbackMessage, CanonicalCourseSource, CanonicalOption, CanonicalElement, CanonicalValue, CanonicalComplexityDimension } from "./interactions/shared";
export type { ChoiceSingleQuestion, ChoiceSingleResponse } from "./interactions/choiceSingle";
export type { ChoiceMultipleQuestion, ChoiceMultipleResponse } from "./interactions/choiceMultiple";
export type { OrderingQuestion, OrderingResponse } from "./interactions/ordering";
export type { ComplexityQuestion, ComplexityResponse } from "./interactions/complexity";
export type { DecisionMatrixQuestion, DecisionMatrixResponse } from "./interactions/decisionMatrix";

/** Compatibility view only. Runtime behavior is owned by the registered vertical interaction modules. */
export type QuestionInteractionType = string;
export type Question = ChoiceSingleQuestion | ChoiceMultipleQuestion | OrderingQuestion | ComplexityQuestion | DecisionMatrixQuestion;

export type CanonicalCertificationSimulationConfig = Readonly<{
  schemaVersion: "patternly-certification-simulation-config-v1" | "patternly-certification-simulation-config-v2";
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
  examCoverage?: Readonly<{
    policy: "patternly-ccarp-v1";
    formatMinimums: Readonly<{ choice_single: number; choice_multiple: number; decision_matrix: number }>;
    skillMinimums: Readonly<Record<"knowledge" | "diagnosis" | "prerequisite" | "next_action" | "contextual_choice", number>>;
    provenance?: Readonly<{ decidedDate: string; guideAvailability: string; retainedProfileParameters: string }>;
  }>;
  scoringPolicy?: Readonly<{ policyId: "patternly-ccarp-complete-item-v1"; policyVersion: "1"; method: "complete_correct_item_only" }>;
  nodeDomainMap: Readonly<Record<string, string>>;
  /** Optional predecessor provenance carried by already-admitted bundles; current source uses the exact node/domain map above. */
  nodeDomainMapEvidence?: Readonly<{ artifactPath: string; contentVersion: string; itemCount: number; nodeCount: number; ambiguousNodeCount: number }>;
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
  completionRule?: PackageCompletionRule;
  simulationProfiles?: readonly CanonicalProductSimulationProfile[];
  planningPolicy?: unknown;
}>;

export type CanonicalContentLockRecord = Readonly<{ trackId: string; contentVersion: string; questionCount: number; sha256: string }>;
