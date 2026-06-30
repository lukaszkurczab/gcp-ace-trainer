import type { TrainingAttempt } from "../../domain/training";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import {
  ALGORITHM_TRAINING_ITEMS,
  getSeededAlgorithmRoadmapNodes,
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
  status: AlgorithmRoadmapNodeProgressStatus;
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
  const seededItems = items.filter((item) => item.roadmapNodeId);
  const seededItemIds = new Set(seededItems.map((item) => item.id));
  const algorithmAttempts = attempts.filter(
    (attempt) => attempt.trackId === "algorithms" && seededItemIds.has(attempt.itemId),
  );
  const latestAttemptByItemId = getLatestAttemptByItemId(algorithmAttempts);
  const nodeProgress = getSeededAlgorithmRoadmapNodes()
    .filter((node) => roadmapNodes.some((candidate) => candidate.id === node.id))
    .map((node) => buildNodeProgress(node, seededItems, latestAttemptByItemId));
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
  const completedItemCount = nodeItems.filter((item) => latestAttemptByItemId.has(item.id)).length;
  const itemCount = nodeItems.length;

  return {
    completedItemCount,
    itemCount,
    label: node.label,
    nodeId: node.id,
    status: getNodeStatus(completedItemCount, itemCount),
  };
}

function getNodeStatus(
  completedItemCount: number,
  itemCount: number,
): AlgorithmRoadmapNodeProgressStatus {
  if (itemCount > 0 && completedItemCount >= itemCount) {
    return "completed";
  }

  return completedItemCount > 0 ? "started" : "not_started";
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
    throw new Error("No seeded Algorithms roadmap nodes are available.");
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
