import type { TrainingAttempt } from "../../domain/training";
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
