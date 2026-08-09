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

/** Closed catalog contract supplied only by an exact verified content package. */
export interface AlgorithmRuntimeCatalog {
  getContentVersion(): string; getPackagePin(): ContentPackagePin; getItems(): readonly AlgorithmQuestion[]; getItemsForMentalUnit(mentalUnitId: string): readonly AlgorithmQuestion[]; getItemById(itemId: string): AlgorithmQuestion; toContentItemRef(item: AlgorithmQuestion): ContentItemRef;
  getPracticeBlueprint(modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined; assertModeAvailable(modeId: string, requestedLength: number): void; getCompatibilitySets(): readonly PublishedAlgorithmsCompatibilitySet[]; getCompatibilitySet(id: string): PublishedAlgorithmsCompatibilitySet | undefined; getRecognitionSets(): readonly PublishedAlgorithmsRecognitionSet[]; getContrastSets(): readonly PublishedAlgorithmsContrastSet[]; getInterleavedScopes(): readonly PublishedAlgorithmsInterleavedScope[]; getSimulationPool(poolId: string): PublishedAlgorithmsSimulationPool | undefined; getSimulationProfile(profileId: string): PublishedAlgorithmsSimulationProfile | undefined;
}
