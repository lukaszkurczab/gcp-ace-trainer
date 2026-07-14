import { MissingContentItemError, type ContentItemRef } from "../../domain/learning";
import { ALGORITHMS_TRACK_ID } from "../../domain/tracks";
import { getAlgorithmMode } from "./domain";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";

export type AlgorithmContentGroup = {
  id: AlgorithmRoadmapNodeId;
  questions: readonly AlgorithmQuestion[];
  roadmapNodeId: AlgorithmRoadmapNodeId;
};

export class AlgorithmContentCatalog {
  private readonly questions: readonly AlgorithmQuestion[];
  private readonly questionsById: ReadonlyMap<string, AlgorithmQuestion>;
  private readonly groupsByItemId: ReadonlyMap<string, AlgorithmContentGroup>;
  private readonly groupsByRoadmapNodeId: ReadonlyMap<AlgorithmRoadmapNodeId, AlgorithmContentGroup>;

  constructor(private readonly groups: readonly AlgorithmContentGroup[]) {
    this.questions = groups.flatMap((group) => group.questions);
    this.questionsById = new Map(this.questions.map((question) => [question.id, question]));
    this.groupsByItemId = new Map(groups.flatMap((group) => group.questions.map((question) => [question.id, group])));
    this.groupsByRoadmapNodeId = new Map(groups.map((group) => [group.roadmapNodeId, group]));
  }

  getContentVersion(): string { return this.questions[0]?.contentVersion ?? ""; }
  getGroups(): readonly AlgorithmContentGroup[] { return this.groups; }
  getItems(): readonly AlgorithmQuestion[] { return this.questions; }
  getGroupForItemId(itemId: string): AlgorithmContentGroup | undefined { return this.groupsByItemId.get(itemId); }
  getItemsForRoadmapNode(nodeId: AlgorithmRoadmapNodeId): readonly AlgorithmQuestion[] { return this.groupsByRoadmapNodeId.get(nodeId)?.questions ?? []; }
  getItemsForMode(modeId: string): readonly AlgorithmQuestion[] {
    const mode = getAlgorithmMode(modeId);
    return this.questions.filter((question) => mode.itemTypes.includes(question.type));
  }
  getItemById(itemId: string): AlgorithmQuestion {
    const item = this.questionsById.get(itemId);
    if (!item) throw new MissingContentItemError(ALGORITHMS_TRACK_ID, itemId);
    return item;
  }
  toContentItemRef(item: AlgorithmQuestion): ContentItemRef {
    return { contentVersion: item.contentVersion, itemId: item.id, trackId: ALGORITHMS_TRACK_ID };
  }
}
