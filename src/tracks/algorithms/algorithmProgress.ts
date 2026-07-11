import {
  getReviewQueueItemKind,
  type ReviewQueueItem,
  type TrainingAttempt,
  type TrainingItemTaxonomyRef,
} from "../../domain/training";
import {
  getAlgorithmQuestionEntries,
  getRoadmapNodesWithActiveItems,
  type AlgorithmQuestionEntry,
} from "./algorithmItems";
import { algorithmContentGroups, type AlgorithmContentGroup } from "./content";
import type { AlgorithmQuestion, AlgorithmQuestionType } from "./algorithmQuestionTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import {
  getAlgorithmAttemptStatus,
  type AlgorithmScoringStatus,
} from "./algorithmsScoringAdapter";

export type AlgorithmRoadmapNodeProgressStatus =
  | "not_started"
  | "initial_exposure"
  | "in_progress"
  | "eligible_for_next"
  | "mastered"
  | "maintenance";

export type AlgorithmRoadmapNodeProgress = {
  uniquePracticedItemCount: number;
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
  nextRequiredAction:
    | "start"
    | "continue_practice"
    | "cover_core_skills"
    | "remediate"
    | "retention_check"
    | "ready_for_next"
    | "maintenance";
  eligibleRequiredItemCount: number;
  masteryRequiredItemCount: number;
};

export type AlgorithmProgressFacts = {
  activeRoadmapNode: { id: AlgorithmRoadmapNodeId; label: string };
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
  groups: readonly AlgorithmContentGroup[] = algorithmContentGroups,
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
  reviewQueueItems: readonly ReviewQueueItem[] = [],
  now = new Date().toISOString(),
): AlgorithmProgressFacts {
  const entries = getKnownRoadmapEntries(groups, roadmapNodes);
  const questionIds = new Set(entries.map((entry) => entry.question.id));
  const algorithmAttempts = attempts.filter((attempt) =>
    attempt.trackId === "algorithms" && questionIds.has(attempt.itemId),
  );
  const latestAttemptByItemId = getLatestAttemptByItemId(algorithmAttempts);
  const nodeProgress = getRoadmapNodesWithActiveItems(groups)
    .filter((node) => roadmapNodes.some((candidate) => candidate.id === node.id))
    .map((node) => buildNodeProgress(
      node,
      entries,
      algorithmAttempts,
      latestAttemptByItemId,
      reviewQueueItems,
      now,
    ));
  const activeNode = getActiveNode(nodeProgress, roadmapNodes);
  const statusCounts = countLatestStatuses(latestAttemptByItemId);

  return {
    activeRoadmapNode: { id: activeNode.nodeId, label: activeNode.label },
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
  groups: readonly AlgorithmContentGroup[] = algorithmContentGroups,
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
  preferredRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmWeakAreaRecommendation {
  const entries = getKnownRoadmapEntries(groups, roadmapNodes);
  const defaultNodeId = getDefaultRoadmapNodeId(entries, roadmapNodes, preferredRoadmapNodeId);
  const latestAttemptByItemId = getLatestAttemptByItemId(
    attempts.filter((attempt) => attempt.trackId === "algorithms"),
  );
  const statsByNodeId = buildWeakAreaStats(entries, latestAttemptByItemId);
  const selectedStats = [...statsByNodeId.values()]
    .filter((stats) => stats.weakScore > 0)
    .sort((left, right) =>
      right.weakScore - left.weakScore ||
      right.incorrectCount - left.incorrectCount ||
      right.partialCount - left.partialCount ||
      getRoadmapNodeOrder(left.nodeId, roadmapNodes) -
        getRoadmapNodeOrder(right.nodeId, roadmapNodes),
    )[0];
  const selectedNodeId = selectedStats?.nodeId ?? defaultNodeId;
  const selectedNode = roadmapNodes.find((node) => node.id === selectedNodeId);
  const selectedMistakeTypes = selectedStats
    ? getTopMistakeTypes(selectedStats.mistakeTypeCounts)
    : [];

  return {
    candidateItemIds: getWeakAreaCandidateItemIds(
      entries,
      selectedStats?.missedItemTypes ?? new Set(),
      selectedNodeId,
      selectedMistakeTypes,
    ),
    reasonLabel: `Weak area: ${selectedNode?.label ?? selectedNodeId}`,
    selectedMistakeTypes,
    selectedRoadmapNodeId: selectedNodeId,
  };
}

function getKnownRoadmapEntries(
  groups: readonly AlgorithmContentGroup[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): readonly AlgorithmQuestionEntry[] {
  const knownNodeIds = new Set(roadmapNodes.map((node) => node.id));
  return getAlgorithmQuestionEntries(groups).filter((entry) =>
    knownNodeIds.has(entry.group.roadmapNodeId),
  );
}

function buildNodeProgress(
  node: AlgorithmRoadmapNode,
  entries: readonly AlgorithmQuestionEntry[],
  attempts: readonly TrainingAttempt[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
  reviewQueueItems: readonly ReviewQueueItem[],
  now: string,
): AlgorithmRoadmapNodeProgress {
  const questions = entries
    .filter((entry) => entry.group.roadmapNodeId === node.id)
    .map((entry) => entry.question);
  const latestNodeAttempts = questions.flatMap((question) => {
    const attempt = latestAttemptByItemId.get(question.id);
    return attempt ? [attempt] : [];
  });
  const uniquePracticedItemCount = latestNodeAttempts.length;
  const itemCount = questions.length;
  const scorePercent = getNodeScorePercent(latestNodeAttempts);
  const eligibleRequiredItemCount = Math.min(
    itemCount,
    Math.min(40, Math.max(25, Math.ceil(itemCount * 0.35))),
  );
  const masteryRequiredItemCount = Math.min(
    itemCount,
    Math.min(70, Math.max(35, Math.ceil(itemCount * 0.6))),
  );
  const coreSkillAtomIds = [...new Set(questions.map((question) => question.primarySkillAtomId))];
  const coveredCoreSkillAtomCount = coreSkillAtomIds.filter((skillId) =>
    isCoreSkillCovered(skillId, questions, latestAttemptByItemId),
  ).length;
  const coreSkillAtomCount = coreSkillAtomIds.length;
  const coreSkillAtomCoveragePercent = coreSkillAtomCount === 0
    ? 100
    : Math.round((coveredCoreSkillAtomCount / coreSkillAtomCount) * 100);
  const questionIds = new Set(questions.map((question) => question.id));
  const dueReviews = reviewQueueItems.filter((item) =>
    item.trackId === "algorithms" && questionIds.has(item.itemId) && item.dueAt <= now,
  );
  const remediationDue = dueReviews.filter((item) =>
    getReviewQueueItemKind(item) === "remediation",
  );
  const retentionDueCount = dueReviews.filter((item) =>
    getReviewQueueItemKind(item) === "retention",
  ).length;
  const criticalRemediationDueCount = remediationDue.filter((item) =>
    item.priority === "high" ||
    item.priority === "urgent" ||
    item.reasons.includes("repeated_mistake"),
  ).length;
  const retainedSkills = getRetainedSkills(reviewQueueItems, questions);
  const retentionPassedCount = coreSkillAtomIds.filter((skillId) =>
    retainedSkills.has(skillId),
  ).length;
  const eligibleForNext =
    uniquePracticedItemCount >= eligibleRequiredItemCount &&
    coreSkillAtomCoveragePercent >= 80 &&
    scorePercent >= 80 &&
    criticalRemediationDueCount === 0;
  const mastered =
    uniquePracticedItemCount >= masteryRequiredItemCount &&
    coreSkillAtomCoveragePercent === 100 &&
    scorePercent >= 85 &&
    remediationDue.length === 0 &&
    retentionPassedCount === coreSkillAtomCount &&
    !hasRepeatedCriticalMistake(
      attempts.filter((attempt) => questionIds.has(attempt.itemId)),
    );
  const status = mastered
    ? retentionDueCount > 0 ? "maintenance" : "mastered"
    : eligibleForNext ? "eligible_for_next"
    : getPreEligibilityStatus(uniquePracticedItemCount, itemCount, scorePercent);

  return {
    uniquePracticedItemCount,
    itemCount,
    label: node.label,
    nodeId: node.id,
    scorePercent,
    status,
    itemCoveragePercent: itemCount > 0
      ? Math.round((uniquePracticedItemCount / itemCount) * 100)
      : 0,
    coreSkillAtomCoveragePercent,
    coveredCoreSkillAtomCount,
    coreSkillAtomCount,
    remediationDueCount: remediationDue.length,
    criticalRemediationDueCount,
    retentionDueCount,
    retentionPassedCount,
    eligibleForNext,
    mastered,
    nextRequiredAction: mastered
      ? "maintenance"
      : remediationDue.length > 0
        ? "remediate"
        : eligibleForNext && retentionPassedCount < coreSkillAtomCount
          ? "retention_check"
          : eligibleForNext
            ? "ready_for_next"
            : uniquePracticedItemCount === 0
              ? "start"
              : coreSkillAtomCoveragePercent < 80
                ? "cover_core_skills"
                : "continue_practice",
    eligibleRequiredItemCount,
    masteryRequiredItemCount,
  };
}

function getRetainedSkills(
  reviewQueueItems: readonly ReviewQueueItem[],
  questions: readonly AlgorithmQuestion[],
): ReadonlySet<string> {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const retained = new Set<string>();

  for (const review of reviewQueueItems) {
    if (!review.retentionPassedAt) continue;
    const question = questionsById.get(review.itemId);
    if (!question) continue;
    retained.add(question.primarySkillAtomId);
  }

  return retained;
}

function isCoreSkillCovered(
  skillId: string,
  questions: readonly AlgorithmQuestion[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): boolean {
  const linkedQuestions = questions.filter((question) =>
    question.primarySkillAtomId === skillId,
  );
  const attempts = linkedQuestions.flatMap((question) => {
    const attempt = latestAttemptByItemId.get(question.id);
    return attempt ? [attempt] : [];
  });
  const required = Math.min(2, linkedQuestions.length);

  return required > 0 &&
    attempts.length >= required &&
    attempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) /
      attempts.length >= 0.75;
}

function getPreEligibilityStatus(
  uniquePracticedItemCount: number,
  itemCount: number,
  scorePercent: number,
): AlgorithmRoadmapNodeProgressStatus {
  if (uniquePracticedItemCount === 0) return "not_started";
  const exposureCount = Math.min(itemCount, Math.min(5, Math.ceil(itemCount * 0.1)));
  return uniquePracticedItemCount >= exposureCount && scorePercent >= 60
    ? "initial_exposure"
    : "in_progress";
}

export function isRoadmapPrerequisiteSatisfied(
  status: AlgorithmRoadmapNodeProgressStatus,
): boolean {
  return status === "eligible_for_next" || status === "mastered" || status === "maintenance";
}

function getNodeScorePercent(attempts: readonly TrainingAttempt[]): number {
  if (attempts.length === 0) return 0;
  return Math.round(
    attempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) /
      attempts.length * 100,
  );
}

function getAttemptScore(attempt: TrainingAttempt): number {
  const status = getAlgorithmAttemptStatus(attempt.result);
  return status === "correct" ? 1 : status === "partial" ? 0.5 : 0;
}

function getActiveNode(
  nodeProgress: readonly AlgorithmRoadmapNodeProgress[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): AlgorithmRoadmapNodeProgress {
  const satisfiedIds = new Set(
    nodeProgress
      .filter((node) => isRoadmapPrerequisiteSatisfied(node.status))
      .map((node) => node.nodeId),
  );
  const firstIncompleteNode = nodeProgress.find((progress) => {
    if (isRoadmapPrerequisiteSatisfied(progress.status)) return false;
    const node = roadmapNodes.find((candidate) => candidate.id === progress.nodeId);
    return node?.prerequisiteNodeIds.every((id) => satisfiedIds.has(id)) ?? false;
  });
  const active = firstIncompleteNode ?? nodeProgress[nodeProgress.length - 1];

  if (!active) {
    throw new Error("No Algorithms roadmap nodes with questions are available.");
  }

  return active;
}

function getLatestAttemptByItemId(
  attempts: readonly TrainingAttempt[],
): Map<string, TrainingAttempt> {
  const latest = new Map<string, TrainingAttempt>();

  for (const attempt of [...attempts].sort((left, right) =>
    right.answeredAt.localeCompare(left.answeredAt),
  )) {
    if (!latest.has(attempt.itemId)) latest.set(attempt.itemId, attempt);
  }

  return latest;
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
    if (status) counts[status] += 1;
  }

  return counts;
}

type WeakAreaNodeStats = {
  incorrectCount: number;
  missedItemTypes: Set<AlgorithmQuestionType>;
  mistakeTypeCounts: Map<string, number>;
  nodeId: AlgorithmRoadmapNodeId;
  partialCount: number;
  weakScore: number;
};

function buildWeakAreaStats(
  entries: readonly AlgorithmQuestionEntry[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): Map<AlgorithmRoadmapNodeId, WeakAreaNodeStats> {
  const entriesById = new Map(entries.map((entry) => [entry.question.id, entry]));
  const statsByNodeId = new Map<AlgorithmRoadmapNodeId, WeakAreaNodeStats>();

  for (const [itemId, attempt] of latestAttemptByItemId) {
    const entry = entriesById.get(itemId);
    const status = getAlgorithmAttemptStatus(attempt.result);

    if (!entry || !status || status === "correct") continue;

    const nodeId = entry.group.roadmapNodeId;
    const stats = statsByNodeId.get(nodeId) ?? {
      incorrectCount: 0,
      missedItemTypes: new Set<AlgorithmQuestionType>(),
      mistakeTypeCounts: new Map<string, number>(),
      nodeId,
      partialCount: 0,
      weakScore: 0,
    };
    const baseScore = status === "incorrect" ? 3 : 1;
    stats.weakScore += baseScore;
    stats.missedItemTypes.add(entry.question.type);
    status === "incorrect" ? stats.incorrectCount += 1 : stats.partialCount += 1;

    for (const mistakeType of getMistakeTypeIds(attempt.mistakeTypeRefs ?? [])) {
      const nextCount = (stats.mistakeTypeCounts.get(mistakeType) ?? 0) + 1;
      stats.mistakeTypeCounts.set(mistakeType, nextCount);
      if (nextCount > 1) stats.weakScore += 1;
    }

    statsByNodeId.set(nodeId, stats);
  }

  return statsByNodeId;
}

function getMistakeTypeIds(
  refs: readonly TrainingItemTaxonomyRef[],
): readonly string[] {
  return refs
    .filter((ref) => ref.role === "mistake_type" || ref.axisId === "mistake_type")
    .map((ref) => ref.nodeId);
}

function getTopMistakeTypes(
  mistakeTypeCounts: ReadonlyMap<string, number>,
): readonly string[] {
  return [...mistakeTypeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([mistakeType]) => mistakeType)
    .slice(0, 3);
}

function getDefaultRoadmapNodeId(
  entries: readonly AlgorithmQuestionEntry[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
  preferredRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmRoadmapNodeId {
  if (preferredRoadmapNodeId && entries.some(
    (entry) => entry.group.roadmapNodeId === preferredRoadmapNodeId,
  )) {
    return preferredRoadmapNodeId;
  }

  const firstNode = roadmapNodes.find((node) =>
    entries.some((entry) => entry.group.roadmapNodeId === node.id),
  );

  if (!firstNode) {
    throw new Error("No Algorithms weak-area questions are available.");
  }

  return firstNode.id;
}

function getWeakAreaCandidateItemIds(
  entries: readonly AlgorithmQuestionEntry[],
  missedItemTypes: ReadonlySet<AlgorithmQuestionType>,
  roadmapNodeId: AlgorithmRoadmapNodeId,
  selectedMistakeTypes: readonly string[],
): readonly string[] {
  const mistakeTypes = new Set(selectedMistakeTypes);

  return entries
    .filter((entry) => entry.group.roadmapNodeId === roadmapNodeId)
    .map((entry, index) => ({
      entry,
      index,
      score:
        (missedItemTypes.has(entry.question.type) ? 2 : 0) +
        (entry.question.feedbackModel.mistakeTypes.some((mistakeType) =>
          mistakeTypes.has(mistakeType),
        ) ? 1 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ entry }) => entry.question.id);
}

function hasRepeatedCriticalMistake(attempts: readonly TrainingAttempt[]): boolean {
  const misses = new Map<string, number>();

  for (const attempt of attempts) {
    if (getAttemptScore(attempt) >= 0.75) continue;
    misses.set(attempt.itemId, (misses.get(attempt.itemId) ?? 0) + 1);
  }

  return [...misses.values()].some((count) => count >= 2);
}

function getRoadmapNodeOrder(
  nodeId: AlgorithmRoadmapNodeId,
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): number {
  return roadmapNodes.find((node) => node.id === nodeId)?.order ?? Number.MAX_SAFE_INTEGER;
}
