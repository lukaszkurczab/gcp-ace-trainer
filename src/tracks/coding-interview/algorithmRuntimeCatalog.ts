import type { ContentItemRef, ContentPackagePin } from "../../domain/learning";
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
import type { SessionCapacityResolution } from "../../content/application/verifiedSessionCapacity";

/** Closed catalog contract supplied only by an exact verified content package. */
export interface AlgorithmRuntimeCatalog {
  getContentVersion(): string; getPackagePin(): ContentPackagePin; getItems(): readonly AlgorithmQuestion[]; getItemsForMentalUnit(mentalUnitId: string): readonly AlgorithmQuestion[]; getItemById(itemId: string): AlgorithmQuestion; toContentItemRef(item: AlgorithmQuestion): ContentItemRef;
  getPracticeBlueprint(modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined; resolveSessionCapacity(modeId: string, requestedLength: number, eligibleItemCount: number): SessionCapacityResolution; assertModeAvailable(modeId: string, requestedLength: number, scope?: Readonly<{ roadmapNodeId?: string; mentalUnitId?: string }>): void; getCompatibilitySets(): readonly PublishedAlgorithmsCompatibilitySet[]; getCompatibilitySet(id: string): PublishedAlgorithmsCompatibilitySet | undefined; getRecognitionSets(): readonly PublishedAlgorithmsRecognitionSet[]; getContrastSets(): readonly PublishedAlgorithmsContrastSet[]; getInterleavedScopes(): readonly PublishedAlgorithmsInterleavedScope[]; getSimulationPool(poolId: string): PublishedAlgorithmsSimulationPool | undefined; getSimulationProfile(profileId: string): PublishedAlgorithmsSimulationProfile | undefined;
}
