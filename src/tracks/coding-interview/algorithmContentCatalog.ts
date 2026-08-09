import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain/tracks";
import type { PublishedAlgorithmsBank, PublishedAlgorithmsCompatibilitySet, PublishedAlgorithmsContrastSet, PublishedAlgorithmsInterleavedScope, PublishedAlgorithmsPracticeBlueprint, PublishedAlgorithmsRecognitionSet, PublishedAlgorithmsSimulationPool, PublishedAlgorithmsSimulationProfile } from "../../content/contracts";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";
import { getAlgorithmMode } from "./domain/algorithmModes";

/** Direct index of one validated published bank. Groups are not a runtime representation. */
export class AlgorithmContentCatalog {
  private readonly itemsById: ReadonlyMap<string, AlgorithmQuestion>;
  private readonly itemsByMentalUnitId: ReadonlyMap<string, readonly AlgorithmQuestion[]>;
  private readonly itemsByRoadmapNodeId: ReadonlyMap<string, readonly AlgorithmQuestion[]>;
  constructor(readonly bank: PublishedAlgorithmsBank) {
    this.itemsById = new Map(bank.items.map((item) => [item.id, item]));
    this.itemsByMentalUnitId = new Map([...new Set(bank.items.map((item) => item.taxonomy.primaryMentalUnitId))].map((mentalUnitId) => [mentalUnitId, bank.items.filter((item) => item.taxonomy.primaryMentalUnitId === mentalUnitId)]));
    this.itemsByRoadmapNodeId = new Map([...new Set(bank.items.map((item) => item.taxonomy.roadmapNodeId))].map((nodeId) => [nodeId, bank.items.filter((item) => item.taxonomy.roadmapNodeId === nodeId)]));
  }
  getContentVersion(): string { return this.bank.contentVersion; }
  getItems(): readonly AlgorithmQuestion[] { return this.bank.items; }
  getItemsForMentalUnit(mentalUnitId: string): readonly AlgorithmQuestion[] { return this.itemsByMentalUnitId.get(mentalUnitId) ?? []; }
  getItemsForRoadmapNode(nodeId: AlgorithmRoadmapNodeId): readonly AlgorithmQuestion[] { return this.itemsByRoadmapNodeId.get(nodeId) ?? []; }
  getItemsForMode(modeId: string): readonly AlgorithmQuestion[] { const blueprint = this.bank.practiceBlueprints.find((entry) => entry.modeId === modeId); return blueprint ? blueprint.resolvedItemIds.map((id) => this.getItemById(id)) : []; }
  getPracticeBlueprint(modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined { return this.bank.practiceBlueprints.find((entry) => entry.modeId === modeId); }
  assertModeAvailable(modeId: string, requestedLength: number): void { const blueprint = this.getPracticeBlueprint(getAlgorithmMode(modeId).contentBlueprintModeId); if (!blueprint || !blueprint.requestedLengths.includes(requestedLength)) throw new Error(`Algorithms mode ${modeId} is unavailable for ${requestedLength} items.`); }
  getCompatibilitySets(): readonly PublishedAlgorithmsCompatibilitySet[] { return this.bank.compatibilitySets; }
  getRecognitionSets(): readonly PublishedAlgorithmsRecognitionSet[] { return this.bank.recognitionSets; }
  getContrastSets(): readonly PublishedAlgorithmsContrastSet[] { return this.bank.contrastSets; }
  getInterleavedScopes(): readonly PublishedAlgorithmsInterleavedScope[] { return this.bank.interleavedScopes; }
  getItemById(itemId: string): AlgorithmQuestion { const item = this.itemsById.get(itemId); if (!item) throw new MissingContentItemError(CODING_INTERVIEW_TRACK_ID, itemId); return item; }
  getCompatibilitySet(id: string) { return this.bank.compatibilitySets.find((entry) => entry.id === id); }
  getSimulationPool(poolId: string) { return this.bank.simulationPools.find((entry) => entry.poolId === poolId); }
  getSimulationProfile(profileId: string) { return this.bank.simulationProfiles.find((entry) => entry.profileId === profileId); }
  toContentItemRef(item: AlgorithmQuestion): ContentItemRef { return { contentVersion: this.bank.contentVersion, itemId: item.id, trackId: CODING_INTERVIEW_TRACK_ID }; }
}

export interface AlgorithmRuntimeCatalog {
  getContentVersion(): string; getItems(): readonly AlgorithmQuestion[]; getItemsForMentalUnit(mentalUnitId: string): readonly AlgorithmQuestion[]; getItemById(itemId: string): AlgorithmQuestion; toContentItemRef(item: AlgorithmQuestion): ContentItemRef;
  getPracticeBlueprint(modeId: string): PublishedAlgorithmsPracticeBlueprint | undefined; assertModeAvailable(modeId: string, requestedLength: number): void; getCompatibilitySets(): readonly PublishedAlgorithmsCompatibilitySet[]; getCompatibilitySet(id: string): PublishedAlgorithmsCompatibilitySet | undefined; getRecognitionSets(): readonly PublishedAlgorithmsRecognitionSet[]; getContrastSets(): readonly PublishedAlgorithmsContrastSet[]; getInterleavedScopes(): readonly PublishedAlgorithmsInterleavedScope[]; getSimulationPool(poolId: string): PublishedAlgorithmsSimulationPool | undefined; getSimulationProfile(profileId: string): PublishedAlgorithmsSimulationProfile | undefined;
}
