import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain/tracks";
import type { PublishedAlgorithmsBank } from "../../content/contracts";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";

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
  getItemById(itemId: string): AlgorithmQuestion { const item = this.itemsById.get(itemId); if (!item) throw new MissingContentItemError(CODING_INTERVIEW_TRACK_ID, itemId); return item; }
  getCompatibilitySet(id: string) { return this.bank.compatibilitySets.find((entry) => entry.id === id); }
  getSimulationPool(poolId: string) { return this.bank.simulationPools.find((entry) => entry.poolId === poolId); }
  getSimulationProfile(profileId: string) { return this.bank.simulationProfiles.find((entry) => entry.profileId === profileId); }
  toContentItemRef(item: AlgorithmQuestion): ContentItemRef { return { contentVersion: this.bank.contentVersion, itemId: item.id, trackId: CODING_INTERVIEW_TRACK_ID }; }
}
