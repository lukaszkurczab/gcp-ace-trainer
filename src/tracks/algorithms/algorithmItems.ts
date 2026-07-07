import type { TrainingItem } from "../../domain/training";
import { algorithmContentItems } from "./content";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";

export const ALGORITHMS_SESSION_MODE_ID = "algorithms-roadmap-basics";

export const ALGORITHM_TRAINING_ITEMS =
  algorithmContentItems satisfies readonly (AlgorithmTrainingItem & TrainingItem)[];

export function getAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS;
}

export function getActiveAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter((item) => item.status === "active");
}

export function getAlgorithmTrainingItemById(itemId: string): AlgorithmTrainingItem | undefined {
  return ALGORITHM_TRAINING_ITEMS.find((item) => item.id === itemId);
}

export function getAlgorithmTrainingItemsForRoadmapNode(
  nodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmTrainingItem[] {
  return getActiveAlgorithmTrainingItems().filter((item) => item.roadmapNodeId === nodeId);
}

export function getRoadmapNodesWithActiveItems(): readonly AlgorithmRoadmapNode[] {
  const nodeIdsWithActiveItems = new Set<string>(
    getActiveAlgorithmTrainingItems()
      .map((item) => item.roadmapNodeId)
      .filter((nodeId): nodeId is string => typeof nodeId === "string"),
  );
  return ALGORITHM_ROADMAP.nodes.filter((node) => nodeIdsWithActiveItems.has(node.id));
}

export function isAlgorithmRoadmapNodeSelectable(node: AlgorithmRoadmapNode): boolean {
  return getAlgorithmTrainingItemsForRoadmapNode(node.id).length >= node.minimumActiveItemCount;
}

export function isAlgorithmTrainingItemSelectable(item: AlgorithmTrainingItem): boolean {
  if (item.status !== "active") return false;
  if (!item.roadmapNodeId) return false;

  const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === item.roadmapNodeId);
  if (!node) return false;

  return isAlgorithmRoadmapNodeSelectable(node);
}

export function getSelectableAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter(isAlgorithmTrainingItemSelectable);
}

export function getFirstUsableAlgorithmRoadmapNode(): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find(isAlgorithmRoadmapNodeSelectable);

  if (!node) {
    throw new Error("No selectable Algorithms roadmap node has active items.");
  }

  return node;
}
