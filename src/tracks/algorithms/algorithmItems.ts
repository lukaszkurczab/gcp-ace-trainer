import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import type { AlgorithmContentGroup } from "./algorithmContentCatalog";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";

export const ALGORITHMS_SESSION_MODE_ID = "algorithms-roadmap-basics";

export type AlgorithmQuestionEntry = {
  group: AlgorithmContentGroup;
  question: AlgorithmQuestion;
};

export function getAlgorithmItems(): readonly AlgorithmQuestion[] {
  return getAlgorithmContentCatalog().getItems();
}

export function getAlgorithmItemById(itemId: string): AlgorithmQuestion | undefined {
  return getAlgorithmItems().find((question) => question.id === itemId);
}

export function getAlgorithmQuestionEntries(
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): readonly AlgorithmQuestionEntry[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  );
}

export function getAlgorithmContentGroupForItem(
  itemId: string,
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): AlgorithmContentGroup | undefined {
  return groups.find((group) =>
    group.questions.some((question) => question.id === itemId),
  );
}

export function getAlgorithmItemsForRoadmapNode(
  nodeId: AlgorithmRoadmapNodeId,
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): readonly AlgorithmQuestion[] {
  return groups.find((group) => group.roadmapNodeId === nodeId)?.questions ?? [];
}

export function getRoadmapNodesWithActiveItems(
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): readonly AlgorithmRoadmapNode[] {
  const nodeIdsWithItems = new Set(
    groups
      .filter((group) => group.questions.length > 0)
      .map((group) => group.roadmapNodeId),
  );

  return ALGORITHM_ROADMAP.nodes.filter((node) => nodeIdsWithItems.has(node.id));
}

export function isAlgorithmRoadmapNodeSelectable(
  node: AlgorithmRoadmapNode,
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): boolean {
  return getAlgorithmItemsForRoadmapNode(node.id, groups).length >=
    node.minimumActiveItemCount;
}

export function isAlgorithmItemSelectable(
  question: AlgorithmQuestion,
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): boolean {
  const group = getAlgorithmContentGroupForItem(question.id, groups);

  if (!group) {
    return false;
  }

  const node = ALGORITHM_ROADMAP.nodes.find(
    (candidate) => candidate.id === group.roadmapNodeId,
  );

  return node ? isAlgorithmRoadmapNodeSelectable(node, groups) : false;
}

export function getSelectableAlgorithmItems(
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): readonly AlgorithmQuestion[] {
  return groups.flatMap((group) => {
    const node = ALGORITHM_ROADMAP.nodes.find(
      (candidate) => candidate.id === group.roadmapNodeId,
    );

    return node && isAlgorithmRoadmapNodeSelectable(node, groups)
      ? group.questions
      : [];
  });
}

export function getFirstUsableAlgorithmRoadmapNode(
  groups: readonly AlgorithmContentGroup[] = getAlgorithmContentCatalog().getGroups(),
): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find((candidate) =>
    isAlgorithmRoadmapNodeSelectable(candidate, groups),
  );

  if (!node) {
    throw new Error("No selectable Algorithms roadmap node has questions.");
  }

  return node;
}
