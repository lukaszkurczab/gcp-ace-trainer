import {
  type EvidenceRef,
  type ReviewQueueEntry,
  type TrainingAttempt,
} from "../../domain";
import {
  getAlgorithmQuestionEntries,
  getRoadmapNodesWithActiveItems,
  type AlgorithmQuestionEntry,
} from "./algorithmItems";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import {
  getAlgorithmAttemptStatus,
  type AlgorithmScoringStatus,
} from "./algorithmScoring";

export type AlgorithmRoadmapNodeProgressStatus =
  | "not_started"
  | "practicing"
  | "review_due";

export type AlgorithmRoadmapNodeProgress = {
  uniquePracticedItemCount: number;
  itemCount: number;
  label: string;
  nodeId: AlgorithmRoadmapNodeId;
  status: AlgorithmRoadmapNodeProgressStatus;
  itemCoveragePercent: number;
  sampledCoreSkillAtomCount: number;
  coreSkillAtomCount: number;
  dueReviewCount: number;
  remediationDueCount: number;
  criticalRemediationDueCount: number;
};

export type AlgorithmProgressFacts = {
  activeRoadmapNode: { id: AlgorithmRoadmapNodeId; label: string };
  contentVersion: string;
  correctCount: number;
  incorrectCount: number;
  itemsCompleted: number;
  nodeProgress: AlgorithmRoadmapNodeProgress[];
  partialCount: number;
  roadmapNodesStarted: number;
};

export type AlgorithmWeakAreaRecommendation = {
  candidateItemIds: readonly string[];
  reasonLabel: string;
  selectedMistakeTypes: readonly string[];
  selectedRoadmapNodeId: AlgorithmRoadmapNodeId;
};

export type BuildAlgorithmProgressFactsInput = Readonly<{
  attempts: readonly TrainingAttempt[];
  content?: Readonly<{
    contentVersion: string;
    items: readonly AlgorithmQuestion[];
  }>;
  now?: string;
  reviewQueueItems?: readonly ReviewQueueEntry[];
  roadmapNodes?: readonly AlgorithmRoadmapNode[];
}>;

export function buildAlgorithmProgressFacts(
  input: BuildAlgorithmProgressFactsInput,
): AlgorithmProgressFacts {
  const content = input.content ?? getInstalledAlgorithmProgressContent();
  const items = content.items;
  const contentVersion = content.contentVersion;
  const roadmapNodes = input.roadmapNodes ?? ALGORITHM_ROADMAP.nodes;
  const reviewQueueItems = input.reviewQueueItems ?? [];
  const now = input.now ?? new Date().toISOString();
  const entries = getKnownRoadmapEntries(items, roadmapNodes);
  const questionIds = new Set(entries.map((entry) => entry.question.id));
  const algorithmAttempts = input.attempts.filter((attempt) =>
    attempt.trackId === "coding-interview-dsa-problem-solving" &&
    attempt.item.contentVersion === contentVersion &&
    questionIds.has(attempt.item.itemId),
  );
  const latestAttemptByItemId = getLatestAttemptByItemId(algorithmAttempts);
  const nodeProgress = getRoadmapNodesWithActiveItems(items)
    .filter((node) => roadmapNodes.some((candidate) => candidate.id === node.id))
    .map((node) => buildNodeProgress(
      node,
      entries,
      latestAttemptByItemId,
      reviewQueueItems,
      contentVersion,
      now,
    ));
  const activeNode = getActiveNode(nodeProgress, entries, algorithmAttempts);
  const statusCounts = countLatestStatuses(latestAttemptByItemId);

  return {
    activeRoadmapNode: { id: activeNode.nodeId, label: activeNode.label },
    contentVersion,
    correctCount: statusCounts.correct,
    incorrectCount: statusCounts.incorrect,
    itemsCompleted: latestAttemptByItemId.size,
    nodeProgress,
    partialCount: statusCounts.partial,
    roadmapNodesStarted: nodeProgress.filter((node) => node.status !== "not_started").length,
  };
}

function getInstalledAlgorithmProgressContent(): NonNullable<BuildAlgorithmProgressFactsInput["content"]> {
  const catalog = getAlgorithmContentCatalog();

  return {
    contentVersion: catalog.getContentVersion(),
    items: catalog.getItems(),
  };
}

export function buildAlgorithmWeakAreaRecommendation(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmQuestion[] = getAlgorithmContentCatalog().getItems(),
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
  preferredRoadmapNodeId?: AlgorithmRoadmapNodeId,
): AlgorithmWeakAreaRecommendation {
  const entries = getKnownRoadmapEntries(items, roadmapNodes);
  const contentVersion = getAlgorithmContentCatalog().getContentVersion();
  const defaultNodeId = getDefaultRoadmapNodeId(entries, roadmapNodes, preferredRoadmapNodeId);
  const latestAttemptByItemId = getLatestAttemptByItemId(
    attempts.filter((attempt) =>
      attempt.trackId === "coding-interview-dsa-problem-solving" &&
      attempt.item.contentVersion === contentVersion,
    ),
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
      selectedStats?.missedInteractionTypes ?? new Set(),
      selectedNodeId,
      selectedMistakeTypes,
    ),
    reasonLabel: `Weak area: ${selectedNode?.label ?? selectedNodeId}`,
    selectedMistakeTypes,
    selectedRoadmapNodeId: selectedNodeId,
  };
}

function getKnownRoadmapEntries(
  items: readonly AlgorithmQuestion[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): readonly AlgorithmQuestionEntry[] {
  const knownNodeIds = new Set(roadmapNodes.map((node) => node.id));
  return getAlgorithmQuestionEntries(items).filter((entry) =>
    knownNodeIds.has(entry.roadmapNodeId),
  );
}

function buildNodeProgress(
  node: AlgorithmRoadmapNode,
  entries: readonly AlgorithmQuestionEntry[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
  reviewQueueItems: readonly ReviewQueueEntry[],
  contentVersion: string,
  now: string,
): AlgorithmRoadmapNodeProgress {
  const questions = entries
    .filter((entry) => entry.roadmapNodeId === node.id)
    .map((entry) => entry.question);
  const latestNodeAttempts = questions.flatMap((question) => {
    const attempt = latestAttemptByItemId.get(question.id);
    return attempt ? [attempt] : [];
  });
  const uniquePracticedItemCount = latestNodeAttempts.length;
  const itemCount = questions.length;
  const coreSkillAtomIds = [...new Set(questions.map((question) => question.taxonomy.primarySkillAtomId))];
  const sampledCoreSkillAtomCount = coreSkillAtomIds.filter((skillId) =>
    isCoreSkillSampled(skillId, questions, latestAttemptByItemId),
  ).length;
  const coreSkillAtomCount = coreSkillAtomIds.length;
  const questionIds = new Set(questions.map((question) => question.id));
  const dueReviews = reviewQueueItems.filter((item) =>
    item.trackId === "coding-interview-dsa-problem-solving" &&
    item.sourceItem.trackId === "coding-interview-dsa-problem-solving" &&
    item.sourceItem.contentVersion === contentVersion &&
    questionIds.has(item.sourceItem.itemId) &&
    item.dueAt <= now,
  );
  const remediationDue = dueReviews.filter((item) => item.persistent);
  const criticalRemediationDueCount = remediationDue.filter((item) =>
    item.reasons.includes("repeated_mistake"),
  ).length;
  const status: AlgorithmRoadmapNodeProgressStatus = dueReviews.length > 0
    ? "review_due"
    : uniquePracticedItemCount > 0
      ? "practicing"
      : "not_started";

  return {
    uniquePracticedItemCount,
    itemCount,
    label: node.label,
    nodeId: node.id,
    status,
    itemCoveragePercent: itemCount > 0
      ? Math.round((uniquePracticedItemCount / itemCount) * 100)
      : 0,
    sampledCoreSkillAtomCount,
    coreSkillAtomCount,
    dueReviewCount: dueReviews.length,
    remediationDueCount: remediationDue.length,
    criticalRemediationDueCount,
  };
}

function isCoreSkillSampled(
  skillId: string,
  questions: readonly AlgorithmQuestion[],
  latestAttemptByItemId: ReadonlyMap<string, TrainingAttempt>,
): boolean {
  const linkedQuestions = questions.filter((question) =>
    question.taxonomy.primarySkillAtomId === skillId,
  );
  const attempts = linkedQuestions.flatMap((question) => {
    const attempt = latestAttemptByItemId.get(question.id);
    return attempt ? [attempt] : [];
  });
  return attempts.length > 0;
}

function getActiveNode(
  nodeProgress: readonly AlgorithmRoadmapNodeProgress[],
  entries: readonly AlgorithmQuestionEntry[],
  attempts: readonly TrainingAttempt[],
): AlgorithmRoadmapNodeProgress {
  const latestAttempt = [...attempts].sort((left, right) =>
    right.answeredAt.localeCompare(left.answeredAt),
  )[0];
  const latestEntry = latestAttempt
    ? entries.find((entry) => entry.question.id === latestAttempt.item.itemId)
    : undefined;
  const active = latestEntry
    ? nodeProgress.find((progress) => progress.nodeId === latestEntry.roadmapNodeId)
    : nodeProgress[0];

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
    if (!latest.has(attempt.item.itemId)) latest.set(attempt.item.itemId, attempt);
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
  missedInteractionTypes: Set<AlgorithmQuestion["interaction"]["type"]>;
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

    const nodeId = entry.roadmapNodeId as AlgorithmRoadmapNodeId;
    const stats = statsByNodeId.get(nodeId) ?? {
      incorrectCount: 0,
      missedInteractionTypes: new Set<AlgorithmQuestion["interaction"]["type"]>(),
      mistakeTypeCounts: new Map<string, number>(),
      nodeId,
      partialCount: 0,
      weakScore: 0,
    };
    const baseScore = status === "incorrect" ? 3 : 1;
    stats.weakScore += baseScore;
    stats.missedInteractionTypes.add(entry.question.interaction.type);
    status === "incorrect" ? stats.incorrectCount += 1 : stats.partialCount += 1;

    for (const mistakeType of getMistakeTypeIds(attempt.reviewEvidence.taxonomyOrSkillRefs)) {
      const nextCount = (stats.mistakeTypeCounts.get(mistakeType) ?? 0) + 1;
      stats.mistakeTypeCounts.set(mistakeType, nextCount);
      if (nextCount > 1) stats.weakScore += 1;
    }

    statsByNodeId.set(nodeId, stats);
  }

  return statsByNodeId;
}

function getMistakeTypeIds(
  refs: readonly EvidenceRef[],
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
    (entry) => entry.roadmapNodeId === preferredRoadmapNodeId,
  )) {
    return preferredRoadmapNodeId;
  }

  const firstNode = roadmapNodes.find((node) =>
    entries.some((entry) => entry.roadmapNodeId === node.id),
  );

  if (!firstNode) {
    throw new Error("No Algorithms weak-area questions are available.");
  }

  return firstNode.id;
}

function getWeakAreaCandidateItemIds(
  entries: readonly AlgorithmQuestionEntry[],
  missedInteractionTypes: ReadonlySet<AlgorithmQuestion["interaction"]["type"]>,
  roadmapNodeId: AlgorithmRoadmapNodeId,
  selectedMistakeTypes: readonly string[],
): readonly string[] {
  const mistakeTypes = new Set(selectedMistakeTypes);

  return entries
    .filter((entry) => entry.roadmapNodeId === roadmapNodeId)
    .map((entry, index) => ({
      entry,
      index,
      score:
        (missedInteractionTypes.has(entry.question.interaction.type) ? 2 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ entry }) => entry.question.id);
}

function getRoadmapNodeOrder(
  nodeId: AlgorithmRoadmapNodeId,
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): number {
  return roadmapNodes.find((node) => node.id === nodeId)?.order ?? Number.MAX_SAFE_INTEGER;
}
