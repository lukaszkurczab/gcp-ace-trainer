import type { ResolvedContentRef } from "../../domain/learning";
import type {
  PublishedAlgorithmsCompatibilitySet,
  PublishedAlgorithmsContrastSet,
  PublishedAlgorithmsInterleavedScope,
  PublishedAlgorithmsPracticeBlueprint,
  PublishedAlgorithmsRecognitionSet,
  PublishedAlgorithmsSimulationPool,
  PublishedAlgorithmsSimulationProfile,
} from "../../content/contracts";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
export type SessionCapacityResolution = Readonly<{ kind: "exact"; actualLength: number }> | Readonly<{ kind: "shortened"; actualLength: number; requestedLength: number }> | Readonly<{ kind: "shortfall"; requestedLength: number; eligibleItemCount: number; missingItemCount: number }>;

/** Closed catalog contract supplied only by an exact verified content package. */
export interface AlgorithmRuntimeCatalog {
  getContentVersion(): string; getArtifactSha256(): ResolvedContentRef["artifactSha256"]; getItems(): readonly AlgorithmQuestion[]; getItemsForMentalUnit(mentalUnitId: string): readonly AlgorithmQuestion[]; getItemById(questionId: string): AlgorithmQuestion; toResolvedContentRef(item: AlgorithmQuestion): ResolvedContentRef;
  getPracticeBlueprint(modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined; resolveSessionCapacity(modeId: string, requestedLength: number, eligibleItemCount: number): SessionCapacityResolution; assertModeAvailable(modeId: string, requestedLength: number, scope?: Readonly<{ roadmapNodeId?: string; mentalUnitId?: string }>): void; getCompatibilitySets(): readonly PublishedAlgorithmsCompatibilitySet[]; getCompatibilitySet(id: string): PublishedAlgorithmsCompatibilitySet | undefined; getRecognitionSets(): readonly PublishedAlgorithmsRecognitionSet[]; getContrastSets(): readonly PublishedAlgorithmsContrastSet[]; getInterleavedScopes(): readonly PublishedAlgorithmsInterleavedScope[]; getSimulationPool(poolId: string): PublishedAlgorithmsSimulationPool | undefined; getSimulationProfile(profileId: string): PublishedAlgorithmsSimulationProfile | undefined;
}
