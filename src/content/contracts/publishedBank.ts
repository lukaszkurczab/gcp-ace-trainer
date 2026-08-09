import type { CertificationQuestion } from "../../tracks/certification/domain";
import type { AlgorithmFeedbackDocument } from "./feedbackDocument";

export type PublishedAlgorithmChoiceInteraction = Readonly<{
  type: "choice";
  selectionMode: "single" | "multiple";
  options: readonly Readonly<{ id: string; text: string }>[];
  acceptedOptionIds: readonly string[];
}>;
export type PublishedAlgorithmOrderingInteraction = Readonly<{
  type: "ordering";
  elements: readonly Readonly<{ id: string; text: string }>[];
  canonicalOrder: readonly string[];
  scoringMethod: "adjacent_relations";
}>;
export type PublishedAlgorithmComplexityInteraction = Readonly<{
  type: "complexity";
  checkedDimensions: readonly string[];
  availableValuesByDimension: Readonly<Record<string, readonly string[]>>;
  acceptedValuesByDimension: Readonly<Record<string, readonly string[]>>;
  normalizedAliasesByDimension: Readonly<Record<string, Readonly<Record<string, string>>>>;
  sharedPresetId?: string;
  maxPoints: number;
}>;
export type PublishedAlgorithmChoiceScoringContract = Readonly<{ type: "choice"; resultSemantics: "exact_selected_set_with_partial_v1" }>;
export type PublishedAlgorithmOrderingScoringContract = Readonly<{ type: "ordering"; maxPoints: number }>;
export type PublishedAlgorithmComplexityScoringContract = Readonly<{ type: "complexity"; maxPoints: number }>;
export type PublishedAlgorithmFeedback = Readonly<{
  reason: string;
  details: AlgorithmFeedbackDocument;
  wrongOptionExplanationsByOptionId?: Readonly<Record<string, string>>;
  omittedCorrectExplanationsByOptionId?: Readonly<Record<string, string>>;
}>;
export type PublishedAlgorithmFeedbackAsset = Readonly<{ id: string; sourcePath: string; sha256: string }>;
export type ResolvedPublishedAlgorithmTaxonomy = Readonly<{
  roadmapNodeId: string;
  primaryMentalUnitId: string;
  patternFamilyId: string;
  patternVariantId?: string;
  problemArchetypeId?: string;
  primarySkillAtomId: string;
  secondarySkillAtomIds: readonly string[];
  learningStage: string;
}>;
export type ResolvedPublishedAlgorithmProvenance = Readonly<{
  author: string;
  createdAt: string;
  contentBatchId: string;
  authoringMethod: "independently_authored";
  externalSources: readonly Readonly<{ sourceId: string; publisher: string; title: string; locator: string; retrievedAt: string; publicationOrRevisionDate?: string; versionOrScope?: string }>[];
}>;
type PublishedAlgorithmItemBase = Readonly<{
  id: string;
  prompt: string;
  constraints?: readonly string[];
  difficulty?: string;
  feedback: PublishedAlgorithmFeedback;
  taxonomy: ResolvedPublishedAlgorithmTaxonomy;
  provenance: ResolvedPublishedAlgorithmProvenance;
  compatibilityMemberships: readonly string[];
  itemFingerprint: string;
}>;
export type PublishedAlgorithmItem =
  | (PublishedAlgorithmItemBase & Readonly<{ interaction: PublishedAlgorithmChoiceInteraction; scoringContract: PublishedAlgorithmChoiceScoringContract }>)
  | (PublishedAlgorithmItemBase & Readonly<{ interaction: PublishedAlgorithmOrderingInteraction; scoringContract: PublishedAlgorithmOrderingScoringContract }>)
  | (PublishedAlgorithmItemBase & Readonly<{ interaction: PublishedAlgorithmComplexityInteraction; scoringContract: PublishedAlgorithmComplexityScoringContract }>);
export type PublishedAlgorithmsPracticeBlueprint = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: string;
  requestedLengths: readonly number[];
  defaultRequestedLength: number;
  shortening: "allowed" | "blueprint_controlled" | "prohibited";
  minimumActualLength: number;
  composition: Readonly<{ kind: "item_ids" | "recognition_sets" | "contrast_sets" | "interleaved_scope" | "simulation_pool"; ids: readonly string[] }>;
  resolvedItemIds: readonly string[];
}>;
export type PublishedAlgorithmsRecognitionSet = Readonly<{ setId: string; setVersion: string; taxonomyScope: Readonly<Record<string, readonly string[]>>; legalLearningStages: readonly string[]; itemIds: readonly string[]; falseHeuristicIds?: readonly string[] }>;
export type PublishedAlgorithmsContrastSet = Readonly<{ setId: string; setVersion: string; primaryMentalUnitId: string; contrastedMentalUnitIds: readonly string[]; falseHeuristicId: string; transferBoundary: string; itemIds: readonly string[] }>;
export type PublishedAlgorithmsInterleavedScopeMinimumDiversity =
  | number
  | Readonly<{ primaryMentalUnitCount: number; interactionTypeCount: number; problemArchetypeCount: number }>
  | Readonly<{ mentalUnitCount: number; interactionTypes: readonly string[] }>
  | Readonly<{ mentalUnits: number; interactionTypes: number; problemArchetypes: number }>;
export type PublishedAlgorithmsInterleavedScope = Readonly<{ scopeId: string; scopeVersion: string; mentalUnitIds: readonly string[]; itemIds: readonly string[]; legalLearningStages: readonly string[]; minimumDiversity?: PublishedAlgorithmsInterleavedScopeMinimumDiversity }>;
export type PublishedAlgorithmsCompatibilitySet = Readonly<{ id: string; version: string; relation: "same_mechanism" | "reviewed_variant" | "compatible_contrast" | "repair"; direction: "symmetric" | "directed"; sourceItemIds: readonly string[]; targetItemIds: readonly string[] }>;
export type PublishedAlgorithmsSimulationPool = Readonly<{ poolId: string; poolVersion: string; itemIds: readonly string[] }>;
export type PublishedAlgorithmsSimulationProfile = Readonly<{ profileId: string; profileVersion: string; profileKind: "internal_learning_profile"; totalOccurrences: 40; foregroundDurationMs: 2_700_000; poolId: string; distributions: readonly Readonly<{ dimension: string; buckets: readonly Readonly<{ valueId: string; minimum: number; target: number; maximum: number }>[] }>[]; selectionPolicy: Readonly<{ uniqueItems: true; replacement: false; deterministic: true; algorithmVersion: "sha256-ranked-constraints-v1" }> }>;

export type PublishedAlgorithmsBank = Readonly<{
  formatVersion: 1;
  trackId: "coding-interview-dsa-problem-solving";
  familyId: "coding_interview";
  contentVersion: string;
  feedbackAssets: readonly PublishedAlgorithmFeedbackAsset[];
  items: readonly PublishedAlgorithmItem[];
  practiceBlueprints: readonly PublishedAlgorithmsPracticeBlueprint[];
  recognitionSets: readonly PublishedAlgorithmsRecognitionSet[];
  contrastSets: readonly PublishedAlgorithmsContrastSet[];
  interleavedScopes: readonly PublishedAlgorithmsInterleavedScope[];
  compatibilitySets: readonly PublishedAlgorithmsCompatibilitySet[];
  simulationPools: readonly PublishedAlgorithmsSimulationPool[];
  simulationProfiles: readonly PublishedAlgorithmsSimulationProfile[];
}>;

export type PublishedCertificationQuestion = CertificationQuestion & Readonly<{ itemFingerprint?: string }>;

export type PublishedCertificationExamExperienceProfile = Readonly<{
  schemaVersion: "exam-experience-profile-v2";
  profileId: string;
  profileVersion: string;
  source: Readonly<{ url: string; checkedDate: string; guideVersion: string }>;
  durationMinutes: number;
  questionCount: Readonly<{ kind: "range"; minimum: number; maximum: number }>;
  blueprint: Readonly<{ kind: "weighted_sections"; sections: readonly Readonly<{ id: string; contentDomainId: "setup_environment" | "planning_implementation" | "operations" | "access_security"; weightPercent: number }>[] }>;
  interactionPolicy: Readonly<{
    schemaVersion: "patternly-certification-simulation-policy-v1";
    policyId: "patternly-certification-simulation-v1";
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
}>;

export type PublishedCertificationDiagnosticBaseline = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-diagnostic-baseline";
  requestedLength: 40;
  actualLength: 40;
  shortening: "prohibited";
  uniqueItemsRequired: 40;
  timerKind: "elapsed_foreground";
  feedbackTiming: "after_each_durable_submit";
  reinsertPolicy: "disabled";
  itemIds: readonly string[];
}>;

export type PublishedCertificationFocusPractice = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-focus-practice";
  requestedLengths: readonly (10 | 20 | 40)[];
  shortening: "allowed_within_topic";
  selectionScope: "cloud_domain";
  topicIds: readonly string[];
}>;

export type PublishedCertificationScenarioPractice = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-scenario-practice";
  requestedLengths: readonly (10 | 20 | 40)[];
  shortening: "allowed_within_competency";
  selectionScope: "explicit_tag_competency";
  competencies: readonly Readonly<{ id: string; label: string; scenarioItemIds: readonly string[] }>[];
}>;

export type PublishedCertificationWeakAreaReview = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-weak-area-review";
  requestedLengths: readonly (10 | 20)[];
  shortening: "allowed_within_eligible_review_evidence";
  selectionScope: "eligible_due_review_evidence";
  persistentResolutionPolicy: "two_consecutive_due_review_successes";
}>;

export type PublishedCertificationMixedPractice = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-mixed-practice";
  requestedLengths: readonly (10 | 20 | 40)[];
  shortening: "allowed_within_interleaved_blueprint";
  selectionScope: "unique_interleaved_blueprint";
  itemIds: readonly string[];
}>;

export type PublishedCertificationQuickReview = Readonly<{
  blueprintId: string;
  blueprintVersion: string;
  modeId: "certification-quick-review";
  maximumLength: 10;
  shortening: "allowed_within_eligible_review_evidence";
  selectionScope: "eligible_due_review_evidence";
  persistentResolutionPolicy: "two_consecutive_due_review_successes";
}>;

export type PublishedCertificationBank = {
  formatVersion: 1;
  trackId: "google-cloud-associate-cloud-engineer";
  familyId: "certification";
  contentVersion: string;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Diagnostic Baseline. */
  diagnosticBaseline?: PublishedCertificationDiagnosticBaseline;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Focus Practice. */
  focusPractice?: PublishedCertificationFocusPractice;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Scenario Practice. */
  scenarioPractice?: PublishedCertificationScenarioPractice;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Weak Area Review. */
  weakAreaReview?: PublishedCertificationWeakAreaReview;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Mixed Practice. */
  mixedPractice?: PublishedCertificationMixedPractice;
  /** Required at the immutable published-artifact boundary; catalog fixtures may omit it when they do not exercise Quick Review. */
  quickReview?: PublishedCertificationQuickReview;
  examExperienceProfile: PublishedCertificationExamExperienceProfile;
  items: readonly PublishedCertificationQuestion[];
};
