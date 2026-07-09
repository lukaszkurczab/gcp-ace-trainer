import { getReviewQueueItemKind, type ReviewQueueItem, type TrainingAttempt } from "../../domain/training";
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

export type AlgorithmRoadmapNodeProgressStatus =
  | "not_started" | "initial_exposure" | "in_progress"
  | "eligible_for_next" | "mastered" | "maintenance";

export type AlgorithmRoadmapNodeProgress = {
  completedItemCount: number;
  itemCount: number;
  label: string;
  nodeId: AlgorithmRoadmapNodeId;
  scorePercent: number;
  status: AlgorithmRoadmapNodeProgressStatus;
  itemCoveragePercent: number;
  coreSkillAtomCoveragePercent: number;
  coveredCoreSkillAtomCount: number;
  coreSkillAtomCount: number;
  remediationDueCount: number;
  criticalRemediationDueCount: number;
  retentionDueCount: number;
  retentionPassedCount: number;
  eligibleForNext: boolean;
  mastered: boolean;
  nextRequiredAction: "start" | "continue_practice" | "cover_core_skills" | "remediate" |
    "retention_check" | "ready_for_next" | "maintenance";
  eligibleRequiredItemCount: number;
  masteryRequiredItemCount: number;
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
  roadmapNodesMastered: number;
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
  reviewQueueItems: readonly ReviewQueueItem[] = [],
  now = new Date().toISOString(),
): AlgorithmProgressFacts {
  const activeRoadmapItems = items.filter((item) => item.roadmapNodeId);
  const activeRoadmapItemIds = new Set(activeRoadmapItems.map((item) => item.id));
  const algorithmAttempts = attempts.filter(
    (attempt) => attempt.trackId === "algorithms" && activeRoadmapItemIds.has(attempt.itemId),
  );
  const latestAttemptByItemId = getLatestAttemptByItemId(algorithmAttempts);
  const nodeProgress = getRoadmapNodesWithActiveItems()
    .filter((node) => roadmapNodes.some((candidate) => candidate.id === node.id))
    .map((node) => buildNodeProgress(node, activeRoadmapItems, algorithmAttempts, latestAttemptByItemId, reviewQueueItems, now));
  const activeNode = getActiveNode(nodeProgress, roadmapNodes);
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
    roadmapNodesMastered: nodeProgress.filter((node) => node.mastered).length,
    roadmapNodesStarted: nodeProgress.filter((node) => node.status !== "not_started").length,
  };
}

export function buildAlgorithmWeakAreaRecommendation(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[] = ALGORITHM_TRAINING_ITEMS,
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
  preferredRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmWeakAreaRecommendation {
  const selectableItems = getSelectableItems(items, roadmapNodes);
  const defaultNodeId = getDefaultRoadmapNodeId(selectableItems, roadmapNodes, preferredRoadmapNodeId);
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
  const selectedNodeId = selectedStats?.nodeId ?? defaultNodeId;
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
  attempts: readonly TrainingAttempt[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
  reviewQueueItems: readonly ReviewQueueItem[],
  now: string,
): AlgorithmRoadmapNodeProgress {
  const nodeItems = items.filter((item) => item.roadmapNodeId === node.id);
  const latestNodeAttempts = nodeItems.flatMap((item) => {
    const attempt = latestAttemptByItemId.get(item.id);
    return attempt ? [attempt] : [];
  });
  const completedItemCount = latestNodeAttempts.length;
  const itemCount = nodeItems.length;
  const scorePercent = getNodeScorePercent(latestNodeAttempts);
  const eligibleRequiredItemCount = Math.min(itemCount, Math.min(40, Math.max(25, Math.ceil(itemCount * 0.35))));
  const masteryRequiredItemCount = Math.min(itemCount, Math.min(70, Math.max(35, Math.ceil(itemCount * 0.6))));
  const coreSkillAtomIds = node.skillAtomIds ?? [];
  const coveredCoreSkillAtomCount = coreSkillAtomIds.filter((id) =>
    isCoreSkillAtomCovered(id, nodeItems, latestAttemptByItemId)).length;
  const coreSkillAtomCount = coreSkillAtomIds.length;
  const coreSkillAtomCoveragePercent = coreSkillAtomCount === 0
    ? 100 : Math.round((coveredCoreSkillAtomCount / coreSkillAtomCount) * 100);
  const nodeItemIds = new Set(nodeItems.map((item) => item.id));
  const dueReviews = reviewQueueItems.filter((item) =>
    item.trackId === "algorithms" && nodeItemIds.has(item.itemId) && item.dueAt <= now);
  const remediationDue = dueReviews.filter((item) => getReviewQueueItemKind(item) === "remediation");
  const retentionDueCount = dueReviews.filter((item) => getReviewQueueItemKind(item) === "retention").length;
  const criticalRemediationDueCount = remediationDue.filter((item) =>
    item.priority === "high" || item.priority === "urgent" || item.reasons.includes("repeated_mistake")).length;
  const retainedSkillAtoms = new Set<string>();
  for (const review of reviewQueueItems) {
    if (!review.retentionPassedAt || !nodeItemIds.has(review.itemId)) continue;
    const item = nodeItems.find((candidate) => candidate.id === review.itemId);
    for (const id of getItemSkillAtomIds(item)) retainedSkillAtoms.add(id);
  }
  const retentionPassedCount = coreSkillAtomIds.filter((id) => retainedSkillAtoms.has(id)).length;
  const eligibleForNext = completedItemCount >= eligibleRequiredItemCount &&
    coreSkillAtomCoveragePercent >= 80 && scorePercent >= 80 && criticalRemediationDueCount === 0;
  const mastered = completedItemCount >= masteryRequiredItemCount &&
    coreSkillAtomCoveragePercent === 100 && scorePercent >= 85 && remediationDue.length === 0 &&
    retentionPassedCount === coreSkillAtomCount &&
    !hasRepeatedCriticalMistake(attempts.filter((attempt) => nodeItemIds.has(attempt.itemId)));
  const status = mastered
    ? (retentionDueCount > 0 ? "maintenance" : "mastered")
    : eligibleForNext ? "eligible_for_next"
    : getPreEligibilityStatus(completedItemCount, itemCount, scorePercent);

  return {
    completedItemCount,
    itemCount,
    label: node.label,
    nodeId: node.id,
    scorePercent,
    status,
    itemCoveragePercent: itemCount > 0 ? Math.round((completedItemCount / itemCount) * 100) : 0,
    coreSkillAtomCoveragePercent,
    coveredCoreSkillAtomCount,
    coreSkillAtomCount,
    remediationDueCount: remediationDue.length,
    criticalRemediationDueCount,
    retentionDueCount,
    retentionPassedCount,
    eligibleForNext,
    mastered,
    nextRequiredAction: mastered ? "maintenance"
      : remediationDue.length > 0 ? "remediate"
      : eligibleForNext && retentionPassedCount < coreSkillAtomCount ? "retention_check"
      : eligibleForNext ? "ready_for_next"
      : completedItemCount === 0 ? "start"
      : coreSkillAtomCoveragePercent < 80 ? "cover_core_skills"
      : "continue_practice",
    eligibleRequiredItemCount,
    masteryRequiredItemCount,
  };
}

function getPreEligibilityStatus(
  completedItemCount: number,
  itemCount: number,
  scorePercent: number,
): AlgorithmRoadmapNodeProgressStatus {
  if (completedItemCount === 0) return "not_started";
  const exposureCount = Math.min(itemCount, Math.min(5, Math.ceil(itemCount * 0.1)));
  return completedItemCount >= exposureCount && scorePercent >= 60 ? "initial_exposure" : "in_progress";
}

export function isRoadmapPrerequisiteSatisfied(status: AlgorithmRoadmapNodeProgressStatus): boolean {
  return status === "eligible_for_next" || status === "mastered" || status === "maintenance";
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
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): AlgorithmRoadmapNodeProgress {
  const satisfiedIds = new Set(nodeProgress.filter((node) => isRoadmapPrerequisiteSatisfied(node.status)).map((node) => node.nodeId));
  const firstIncompleteNode = nodeProgress.find((progress) => {
    if (isRoadmapPrerequisiteSatisfied(progress.status)) return false;
    const node = roadmapNodes.find((candidate) => candidate.id === progress.nodeId);
    return node?.prerequisiteNodeIds.every((id) => satisfiedIds.has(id)) ?? false;
  });

  if (firstIncompleteNode) {
    return firstIncompleteNode;
  }

  const finalNode = nodeProgress[nodeProgress.length - 1];

  if (!finalNode) {
    throw new Error("No Algorithms roadmap nodes with active items are available.");
  }

  return finalNode;
}

function getAttemptScore(attempt: TrainingAttempt): number {
  const status = getAlgorithmAttemptStatus(attempt.result);
  return status === "correct" ? 1 : status === "partial" ? 0.5 : 0;
}

function getItemSkillAtomIds(item: AlgorithmTrainingItem | undefined): readonly string[] {
  if (!item) return [];
  return [...new Set([item.primarySkillAtomId, ...(item.secondarySkillAtomIds ?? []),
    ...item.taxonomyRefs.filter((ref) => ref.axisId === "skill_atom").map((ref) => ref.nodeId)])];
}

function isCoreSkillAtomCovered(
  skillAtomId: string,
  items: readonly AlgorithmTrainingItem[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): boolean {
  const linkedItems = items.filter((item) => getItemSkillAtomIds(item).includes(skillAtomId));
  const attempts = linkedItems.flatMap((item) => {
    const attempt = latestAttemptByItemId.get(item.id);
    return attempt ? [attempt] : [];
  });
  const required = Math.min(2, linkedItems.length);
  return required > 0 && attempts.length >= required &&
    attempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) / attempts.length >= 0.75;
}

function hasRepeatedCriticalMistake(attempts: readonly TrainingAttempt[]): boolean {
  const misses = new Map<string, number>();
  for (const attempt of attempts) {
    if (getAttemptScore(attempt) >= 0.75) continue;
    misses.set(attempt.itemId, (misses.get(attempt.itemId) ?? 0) + 1);
  }
  return [...misses.values()].some((count) => count >= 2);
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
  const roadmapNodeIds = new Set(roadmapNodes.map((node) => node.id));

  return items.filter((item) =>
    item.status === "active" &&
    typeof item.roadmapNodeId === "string" &&
    roadmapNodeIds.has(item.roadmapNodeId as AlgorithmRoadmapNodeId),
  );
}

function getDefaultRoadmapNodeId(
  selectableItems: readonly AlgorithmTrainingItem[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
  preferredRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmRoadmapNodeId {
  if (
    preferredRoadmapNodeId &&
    selectableItems.some((item) => item.roadmapNodeId === preferredRoadmapNodeId)
  ) {
    return preferredRoadmapNodeId;
  }

  const firstSelectableNode = roadmapNodes.find((node) =>
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
