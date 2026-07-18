import type { CertificationQuestion } from "../../tracks/cloud-certification/domain";

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
  details: string;
  wrongOptionExplanationsByOptionId?: Readonly<Record<string, string>>;
  omittedCorrectExplanationsByOptionId?: Readonly<Record<string, string>>;
}>;
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
  trackId: "algorithms";
  familyId: "algorithms";
  contentVersion: string;
  items: readonly PublishedAlgorithmItem[];
  practiceBlueprints: readonly PublishedAlgorithmsPracticeBlueprint[];
  recognitionSets: readonly PublishedAlgorithmsRecognitionSet[];
  contrastSets: readonly PublishedAlgorithmsContrastSet[];
  interleavedScopes: readonly PublishedAlgorithmsInterleavedScope[];
  compatibilitySets: readonly PublishedAlgorithmsCompatibilitySet[];
  simulationPools: readonly PublishedAlgorithmsSimulationPool[];
  simulationProfiles: readonly PublishedAlgorithmsSimulationProfile[];
  approvalActivationIdentity: string;
}>;

export type PublishedCertificationBank = {
  formatVersion: 1;
  trackId: "cloud-certification";
  familyId: "certification";
  contentVersion: string;
  items: readonly CertificationQuestion[];
};
