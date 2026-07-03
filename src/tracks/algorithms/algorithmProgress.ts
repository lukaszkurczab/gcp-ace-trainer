import type { TrainingAttempt } from "../../domain/training";
import type { TrainingItemTaxonomyRef } from "../../domain/training";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import {
  ALGORITHM_TRAINING_ITEMS,
  getRoadmapNodesWithActiveItems,
} from "./algorithmItems";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";
import {
  getAlgorithmAttemptStatus,
  type AlgorithmScoringStatus,
} from "./algorithmsScoringAdapter";

export type AlgorithmRoadmapNodeProgressStatus = "not_started" | "started" | "completed";

export type AlgorithmRoadmapNodeProgress = {
  completedItemCount: number;
  itemCount: number;
  label: string;
  nodeId: AlgorithmRoadmapNodeId;
  scorePercent: number;
  status: AlgorithmRoadmapNodeProgressStatus;
  unlockRequiredItemCount: number;
};

export type AlgorithmProgressFacts = {
  activeRoadmapNode: {
    id: AlgorithmRoadmapNodeId;
    label: string;
  };
  correctCount: number;
  incorrectCount: number;
  itemsCompleted: number;
  nodeProgress: AlgorithmRoadmapNodeProgress[];
  partialCount: number;
  roadmapNodesCompleted: number;
  roadmapNodesStarted: number;
};

export type AlgorithmWeakAreaRecommendation = {
  candidateItemIds: readonly string[];
  reasonLabel: string;
  selectedMistakeTypes: readonly string[];
  selectedRoadmapNodeId: AlgorithmRoadmapNodeId;
};

export function buildAlgorithmProgressFacts(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[] = ALGORITHM_TRAINING_ITEMS,
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
): AlgorithmProgressFacts {
  const activeRoadmapItems = items.filter((item) => item.roadmapNodeId);
  const activeRoadmapItemIds = new Set(activeRoadmapItems.map((item) => item.id));
  const algorithmAttempts = attempts.filter(
    (attempt) => attempt.trackId === "algorithms" && activeRoadmapItemIds.has(attempt.itemId),
  );
  const latestAttemptByItemId = getLatestAttemptByItemId(algorithmAttempts);
  const nodeProgress = getRoadmapNodesWithActiveItems()
    .filter((node) => roadmapNodes.some((candidate) => candidate.id === node.id))
    .map((node) => buildNodeProgress(node, activeRoadmapItems, latestAttemptByItemId));
  const activeNode = getActiveNode(nodeProgress);
  const statusCounts = countLatestStatuses(latestAttemptByItemId);

  return {
    activeRoadmapNode: {
      id: activeNode.nodeId,
      label: activeNode.label,
    },
    correctCount: statusCounts.correct,
    incorrectCount: statusCounts.incorrect,
    itemsCompleted: latestAttemptByItemId.size,
    nodeProgress,
    partialCount: statusCounts.partial,
    roadmapNodesCompleted: nodeProgress.filter((node) => node.status === "completed").length,
    roadmapNodesStarted: nodeProgress.filter((node) => node.status !== "not_started").length,
  };
}

export function buildAlgorithmWeakAreaRecommendation(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[] = ALGORITHM_TRAINING_ITEMS,
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
  fallbackRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmWeakAreaRecommendation {
  const selectableItems = getSelectableItems(items, roadmapNodes);
  const fallbackNodeId = getFallbackRoadmapNodeId(selectableItems, roadmapNodes, fallbackRoadmapNodeId);
  const latestAttemptByItemId = getLatestAttemptByItemId(
    attempts.filter((attempt) => attempt.trackId === "algorithms"),
  );
  const statsByNodeId = buildWeakAreaStats(selectableItems, latestAttemptByItemId);
  const selectedStats = [...statsByNodeId.values()]
    .filter((stats) => stats.weakScore > 0)
    .sort((left, right) =>
      right.weakScore - left.weakScore ||
      right.incorrectCount - left.incorrectCount ||
      right.partialCount - left.partialCount ||
      getRoadmapNodeOrder(left.nodeId, roadmapNodes) - getRoadmapNodeOrder(right.nodeId, roadmapNodes),
    )[0];
  const selectedNodeId = selectedStats?.nodeId ?? fallbackNodeId;
  const selectedNode = roadmapNodes.find((node) => node.id === selectedNodeId);
  const selectedMistakeTypes = selectedStats ? getTopMistakeTypes(selectedStats.mistakeTypeCounts) : [];
  const candidateItemIds = getWeakAreaCandidateItemIds({
    items: selectableItems,
    missedItemTypes: selectedStats?.missedItemTypes ?? new Set(),
    roadmapNodeId: selectedNodeId,
    selectedMistakeTypes,
  });

  return {
    candidateItemIds,
    reasonLabel: `Weak area: ${selectedNode?.label ?? selectedNodeId}`,
    selectedMistakeTypes,
    selectedRoadmapNodeId: selectedNodeId,
  };
}

function buildNodeProgress(
  node: AlgorithmRoadmapNode,
  items: readonly AlgorithmTrainingItem[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): AlgorithmRoadmapNodeProgress {
  const nodeItems = items.filter((item) => item.roadmapNodeId === node.id);
  const latestNodeAttempts = nodeItems.flatMap((item) => {
    const attempt = latestAttemptByItemId.get(item.id);
    return attempt ? [attempt] : [];
  });
  const completedItemCount = latestNodeAttempts.length;
  const itemCount = nodeItems.length;
  const scorePercent = getNodeScorePercent(latestNodeAttempts);
  const unlockRequiredItemCount = getNodeUnlockRequiredItemCount(itemCount);

  return {
    completedItemCount,
    itemCount,
    label: node.label,
    nodeId: node.id,
    scorePercent,
    status: getNodeStatus(completedItemCount, unlockRequiredItemCount, scorePercent),
    unlockRequiredItemCount,
  };
}

function getNodeStatus(
  completedItemCount: number,
  unlockRequiredItemCount: number,
  scorePercent: number,
): AlgorithmRoadmapNodeProgressStatus {
  if (
    unlockRequiredItemCount > 0 &&
    completedItemCount >= unlockRequiredItemCount &&
    scorePercent >= 70
  ) {
    return "completed";
  }

  return completedItemCount > 0 ? "started" : "not_started";
}

function getNodeUnlockRequiredItemCount(itemCount: number): number {
  return Math.min(10, itemCount);
}

function getNodeScorePercent(attempts: readonly TrainingAttempt[]): number {
  if (attempts.length === 0) {
    return 0;
  }

  const earnedPoints = attempts.reduce((sum, attempt) => {
    const status = getAlgorithmAttemptStatus(attempt.result);

    if (status === "correct") return sum + 1;
    if (status === "partial") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((earnedPoints / attempts.length) * 100);
}

function getActiveNode(
  nodeProgress: readonly AlgorithmRoadmapNodeProgress[],
): AlgorithmRoadmapNodeProgress {
  const firstIncompleteNode = nodeProgress.find((node) => node.status !== "completed");

  if (firstIncompleteNode) {
    return firstIncompleteNode;
  }

  const finalNode = nodeProgress[nodeProgress.length - 1];

  if (!finalNode) {
    throw new Error("No Algorithms roadmap nodes with active items are available.");
  }

  return finalNode;
}

function getLatestAttemptByItemId(
  attempts: readonly TrainingAttempt[],
): Map<string, TrainingAttempt> {
  const sortedAttempts = [...attempts].sort((left, right) =>
    right.answeredAt.localeCompare(left.answeredAt),
  );
  const latestByItemId = new Map<string, TrainingAttempt>();

  for (const attempt of sortedAttempts) {
    if (!latestByItemId.has(attempt.itemId)) {
      latestByItemId.set(attempt.itemId, attempt);
    }
  }

  return latestByItemId;
}

function countLatestStatuses(
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): Record<AlgorithmScoringStatus, number> {
  const counts: Record<AlgorithmScoringStatus, number> = {
    correct: 0,
    incorrect: 0,
    partial: 0,
  };

  for (const attempt of latestAttemptByItemId.values()) {
    const status = getAlgorithmAttemptStatus(attempt.result);

    if (status) {
      counts[status] += 1;
    }
  }

  return counts;
}

type WeakAreaNodeStats = {
  incorrectCount: number;
  missedItemTypes: Set<AlgorithmTrainingItem["type"]>;
  mistakeTypeCounts: Map<string, number>;
  nodeId: AlgorithmRoadmapNodeId;
  partialCount: number;
  weakScore: number;
};

function getSelectableItems(
  items: readonly AlgorithmTrainingItem[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): readonly AlgorithmTrainingItem[] {
  const availableNodeIds = new Set(
    roadmapNodes
      .filter((node) => node.status === "available")
      .map((node) => node.id),
  );

  return items.filter((item) =>
    item.status === "active" &&
    typeof item.roadmapNodeId === "string" &&
    availableNodeIds.has(item.roadmapNodeId as AlgorithmRoadmapNodeId),
  );
}

function getFallbackRoadmapNodeId(
  selectableItems: readonly AlgorithmTrainingItem[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
  fallbackRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmRoadmapNodeId {
  if (
    fallbackRoadmapNodeId &&
    selectableItems.some((item) => item.roadmapNodeId === fallbackRoadmapNodeId)
  ) {
    return fallbackRoadmapNodeId;
  }

  const firstSelectableNode = roadmapNodes.find((node) =>
    node.status === "available" &&
    selectableItems.some((item) => item.roadmapNodeId === node.id),
  );

  if (!firstSelectableNode) {
    throw new Error("No selectable Algorithms weak-area items are available.");
  }

  return firstSelectableNode.id;
}

function buildWeakAreaStats(
  items: readonly AlgorithmTrainingItem[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): Map<AlgorithmRoadmapNodeId, WeakAreaNodeStats> {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const statsByNodeId = new Map<AlgorithmRoadmapNodeId, WeakAreaNodeStats>();

  for (const [itemId, attempt] of latestAttemptByItemId) {
    const item = itemById.get(itemId);
    const nodeId = item?.roadmapNodeId as AlgorithmRoadmapNodeId | undefined;
    const status = getAlgorithmAttemptStatus(attempt.result);

    if (!item || !nodeId || !status || status === "correct") {
      continue;
    }

    const stats = getOrCreateWeakAreaNodeStats(statsByNodeId, nodeId);
    const mistakeTypeRefs = attempt.mistakeTypeRefs ?? [];
    const baseScore = status === "incorrect" ? 3 : 1;

    stats.weakScore += baseScore;
    stats.missedItemTypes.add(item.type);

    if (status === "incorrect") {
      stats.incorrectCount += 1;
    } else {
      stats.partialCount += 1;
    }

    for (const mistakeType of getMistakeTypeIds(mistakeTypeRefs)) {
      const nextCount = (stats.mistakeTypeCounts.get(mistakeType) ?? 0) + 1;
      stats.mistakeTypeCounts.set(mistakeType, nextCount);

      if (nextCount > 1) {
        stats.weakScore += 1;
      }
    }
  }

  return statsByNodeId;
}

function getOrCreateWeakAreaNodeStats(
  statsByNodeId: Map<AlgorithmRoadmapNodeId, WeakAreaNodeStats>,
  nodeId: AlgorithmRoadmapNodeId,
): WeakAreaNodeStats {
  const current = statsByNodeId.get(nodeId);

  if (current) {
    return current;
  }

  const next: WeakAreaNodeStats = {
    incorrectCount: 0,
    missedItemTypes: new Set(),
    mistakeTypeCounts: new Map(),
    nodeId,
    partialCount: 0,
    weakScore: 0,
  };

  statsByNodeId.set(nodeId, next);
  return next;
}

function getMistakeTypeIds(refs: readonly TrainingItemTaxonomyRef[]): readonly string[] {
  return refs
    .filter((ref) => ref.role === "mistake_type" || ref.axisId === "mistake_type")
    .map((ref) => ref.nodeId);
}

function getTopMistakeTypes(mistakeTypeCounts: ReadonlyMap<string, number>): readonly string[] {
  return [...mistakeTypeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([mistakeType]) => mistakeType)
    .slice(0, 3);
}

function getWeakAreaCandidateItemIds(input: {
  items: readonly AlgorithmTrainingItem[];
  missedItemTypes: ReadonlySet<AlgorithmTrainingItem["type"]>;
  roadmapNodeId: AlgorithmRoadmapNodeId;
  selectedMistakeTypes: readonly string[];
}): readonly string[] {
  const selectedMistakeTypes = new Set(input.selectedMistakeTypes);

  return input.items
    .filter((item) => item.roadmapNodeId === input.roadmapNodeId)
    .map((item, index) => ({
      index,
      item,
      score:
        (input.missedItemTypes.has(item.type) ? 2 : 0) +
        (hasMistakeTypeOverlap(item, selectedMistakeTypes) ? 1 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.item.id);
}

function hasMistakeTypeOverlap(
  item: AlgorithmTrainingItem,
  selectedMistakeTypes: ReadonlySet<string>,
): boolean {
  if (selectedMistakeTypes.size === 0) {
    return false;
  }

  const itemMistakeTypes = [
    ...(item.feedbackModel?.mistakeTypes ?? []),
    ...((item.staticMicroChecks ?? []).flatMap((check) => check.mistakeTypes)),
  ];

  return itemMistakeTypes.some((mistakeType) => selectedMistakeTypes.has(mistakeType));
}

function getRoadmapNodeOrder(
  nodeId: AlgorithmRoadmapNodeId,
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): number {
  return roadmapNodes.find((node) => node.id === nodeId)?.order ?? Number.MAX_SAFE_INTEGER;
}
