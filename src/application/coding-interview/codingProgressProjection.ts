import { CODING_INTERVIEW_TRACK_ID, isActiveReviewQueueEntry, manualRequestIdForEntry, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId } from "../../tracks/coding-interview";
import type { TrainingCatalog, TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import type { LearningEvidenceProjection } from "../learningPlan/learningEvidenceProjection";
import type { ProgressEvidenceModel, AlgorithmsProgressScreenModel, AlgorithmProgressEvidenceState, LearningPriorityModel, CurrentFocusModel, RoadmapSummaryNodeModel, ProgressAction } from "../learningPlan/progressProjectionContracts";
type LearningTone = "danger" | "warning" | "info" | "success" | "muted";

export function projectCodingProgress(
  track: TrainingCatalog,
  evidence: LearningEvidenceProjection,
  now: string,
): Omit<ProgressEvidenceModel, "identity" | "capturedAt" | "hasRecordedActivity" | "emptyState"> {
  const packageItems = track.questions;
  const itemById = new Map(packageItems.map(question => [question.questionId, question]));
  const currentAttempts = evidence.attempts;
  const algorithmsReviewItems = evidence.reviews;
  const dueReviewItems = evidence.dueReviews;
  const dueReviewCount = dueReviewItems.length;
  const manualReviewCount = algorithmsReviewItems.filter(item => isActiveReviewQueueEntry(item) && item.dueAt !== undefined && Date.parse(item.dueAt) > Date.parse(now) && item.reasons.includes("manual_mark") && manualRequestIdForEntry(item) !== undefined).length;
  const facts = buildCanonicalProgressFacts(packageItems, itemById, currentAttempts, dueReviewItems, now, track.contentVersion, track.artifactSha256);
  const algorithmsProgress = buildAlgorithmsProgressScreenModel({
    dueReviewItems,
    facts,
    itemById,
    trainingAttempts: currentAttempts,
  });

  return {
    algorithmsProgress,
    hasData: facts.itemsCompleted > 0,
    metrics: [],
    performanceScores: [],
    performanceSectionTitle: "Roadmap nodes",
    reviewAction: dueReviewCount + manualReviewCount > 0
      ? {
          kind: "practiceSession",
          params: ({
            mode: ALGORITHM_MODE_IDS.weakAreaReview,
            reviewSource: dueReviewCount > 0 ? "due_queue" : "manual_request",
            source: "modeShortcut",
            topicId: facts.activeRoadmapNode.id,
            trackId: CODING_INTERVIEW_TRACK_ID,
          }),
        }
      : undefined,
    reviewActionEnabled: dueReviewCount + manualReviewCount > 0,
    reviewActionLabel: "Review weak areas",
    reviewQueueCount: dueReviewCount + manualReviewCount,
    reviewQueueCopy: formatAlgorithmsReviewQueueCopy(dueReviewCount, algorithmsReviewItems.length, manualReviewCount),
    ...(dueReviewCount > 0 && manualReviewCount > 0 ? { reviewQueueCopyParams: { dueCount: dueReviewCount, manualCount: manualReviewCount } } : {}),
    ...(dueReviewCount === 0 && manualReviewCount > 0 ? { reviewQueueCopyParams: { count: manualReviewCount } } : {}),
  };
}

type CanonicalNodeProgress = {
  uniquePracticedItemCount: number;
  itemCount: number;
  label: string;
  nodeId: string;
  status: "not_started" | "practicing" | "review_due";
  itemCoveragePercent: number;
  dueReviewCount: number;
  remediationDueCount: number;
  criticalRemediationDueCount: number;
};
type CanonicalProgressFacts = {
  activeRoadmapNode: { id: string; label: string };
  contentVersion: string;
  correctCount: number;
  incorrectCount: number;
  itemsCompleted: number;
  nodeProgress: CanonicalNodeProgress[];
  partialCount: number;
  roadmapNodesStarted: number;
};

function buildCanonicalProgressFacts(
  questions: readonly TrainingQuestionSummary[],
  itemById: ReadonlyMap<string, TrainingQuestionSummary>,
  attempts: readonly TrainingAttempt[],
  reviews: readonly ReviewQueueEntry[],
  now: string,
  contentVersion: string,
  artifactSha256: string,
): CanonicalProgressFacts {
  const current = attempts;
  const practicedIds = new Set(current.map((attempt) => attempt.item.questionId));
  const dueByNode = new Map<string, number>();
  for (const review of reviews) {
    if (!isActiveReviewQueueEntry(review) || review.dueAt === undefined || Date.parse(review.dueAt) > Date.parse(now) || review.sourceItem.artifactSha256 !== artifactSha256) continue;
    const nodeId = itemById.get(review.sourceItem.questionId)?.nodeId;
    if (nodeId !== undefined) dueByNode.set(nodeId, (dueByNode.get(nodeId) ?? 0) + 1);
  }
  const byNode = new Map<string, TrainingQuestionSummary[]>();
  for (const question of questions) (byNode.get(question.nodeId) ?? (byNode.set(question.nodeId, []), byNode.get(question.nodeId)!)).push(question);
  const nodeProgress = [...byNode].map(([nodeId, nodeQuestions]) => {
    const practiced = nodeQuestions.filter((question) => practicedIds.has(question.questionId)).length;
    const nodeReviews = reviews.filter(review => itemById.get(review.sourceItem.questionId)?.nodeId === nodeId);
    const remediationDueCount = nodeReviews.filter(review => review.persistent).length;
    const criticalRemediationDueCount = nodeReviews.filter(review => review.persistent && review.reasons.includes("repeated_mistake")).length;
    const due = dueByNode.get(nodeId) ?? 0;
    const status: CanonicalNodeProgress["status"] = due > 0 ? "review_due" : practiced > 0 ? "practicing" : "not_started";
    return { uniquePracticedItemCount: practiced, itemCount: nodeQuestions.length, label: nodeId, nodeId, status, itemCoveragePercent: nodeQuestions.length ? Math.round(practiced / nodeQuestions.length * 100) : 0, dueReviewCount: due, remediationDueCount, criticalRemediationDueCount };
  });
  const active = nodeProgress.find((node) => node.uniquePracticedItemCount > 0) ?? nodeProgress[0] ?? { nodeId: "", label: "", itemCount: 0 };
  return { activeRoadmapNode: { id: active.nodeId, label: active.label }, contentVersion, correctCount: current.filter((a) => a.result.kind === "correct").length, incorrectCount: current.filter((a) => a.result.kind === "incorrect").length, partialCount: current.filter((a) => a.result.kind === "partial").length, itemsCompleted: practicedIds.size, roadmapNodesStarted: nodeProgress.filter((node) => node.uniquePracticedItemCount > 0).length, nodeProgress };
}

type AlgorithmsRemediationState = {
  attentionNodeId?: string;
  attentionNodeLabel?: string;
  criticalRemediationCount: number;
  dueNodeLabels: readonly string[];
  remediationCount: number;
  remediationNodeLabels: readonly string[];
};

function getAlgorithmsRemediationState(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  nodeProgress: CanonicalProgressFacts["nodeProgress"];
}): AlgorithmsRemediationState {
  const remediationItems = input.dueReviewItems.filter(
    (item) => item.persistent,
  );
  const dueNodes = input.nodeProgress.filter((node) => node.dueReviewCount > 0);
  const remediationNodes = input.nodeProgress.filter((node) => node.remediationDueCount > 0);
  const criticalRemediationCount = remediationItems.filter(
    (item) =>
      item.reasons.includes("repeated_mistake"),
  ).length;
  const attentionNode = criticalRemediationCount > 0
    ? input.nodeProgress.find((node) => node.criticalRemediationDueCount > 0)
    : input.nodeProgress.find((node) => node.remediationDueCount > 0) ??
      input.nodeProgress.find((node) => node.dueReviewCount > 0);

  return {
    attentionNodeId: attentionNode?.nodeId,
    attentionNodeLabel: attentionNode?.label,
    criticalRemediationCount,
    dueNodeLabels: dueNodes.map((node) => node.label),
    remediationCount: remediationItems.length,
    remediationNodeLabels: remediationNodes.map((node) => node.label),
  };
}

function buildAlgorithmsProgressScreenModel(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  facts: CanonicalProgressFacts;
  itemById: ReadonlyMap<string, TrainingQuestionSummary>;
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressScreenModel {
  const activeIndex = input.facts.nodeProgress.findIndex(
    (node) => node.nodeId === input.facts.activeRoadmapNode.id,
  );
  const activeNode = input.facts.nodeProgress[activeIndex] ?? input.facts.nodeProgress[0];

  if (!activeNode) {
    throw new Error("No Algorithms roadmap progress is available.");
  }

  const focusNode = activeNode;
  const focusIndex = input.facts.nodeProgress.indexOf(focusNode);
  const nextNode = input.facts.nodeProgress[focusIndex + 1];
  const remediationState = getAlgorithmsRemediationState({
    dueReviewItems: input.dueReviewItems,
    nodeProgress: input.facts.nodeProgress,
  });
  const focusStatus = getCurrentFocusStatus(focusNode);
  return {
    priority: buildLearningPriority({
      dueReviewItems: input.dueReviewItems,
      focusNode,
      nextNode,
      remediationState,
    }),
    currentFocus: {
      explanation: buildFocusExplanation(focusNode),
      nodeId: focusNode.nodeId,
      practicedLabel: focusNode.uniquePracticedItemCount === 0
        ? "No attempts"
        : `${focusNode.uniquePracticedItemCount} of ${focusNode.itemCount}`,
      progressPercent: focusNode.itemCoveragePercent,
      showProgress: focusNode.uniquePracticedItemCount > 0,
      statusLabel: focusStatus.label,
      statusTone: focusStatus.tone,
      title: focusNode.label,
    },
    nextTopic: nextNode
      ? {
          detail: "All roadmap topics are available. Choose this topic whenever it fits your practice goal.",
          nodeId: nextNode.nodeId,
          title: nextNode.label,
        }
      : null,
    roadmapSummary: {
      allNodes: buildRoadmapNodes(input.facts.nodeProgress, focusIndex),
      nodes: buildRoadmapSummary(input.facts.nodeProgress, focusIndex),
      showAllActionLabel: "View all roadmap nodes",
    },
    ...buildAlgorithmEvidenceModel({
      facts: input.facts,
      focusNode,
      itemById: input.itemById,
      trainingAttempts: input.trainingAttempts,
    }),
    diagnostics: {
      collapsedByDefault: true,
      hideActionLabel: "Hide details",
      mistakePatterns: null,
      outcomeSummary: [
        { label: "Correct", value: input.facts.correctCount },
        { label: "Partial", value: input.facts.partialCount },
        { label: "Incorrect", value: input.facts.incorrectCount },
      ],
      roadmapFacts: [
        { label: "Nodes started", value: input.facts.roadmapNodesStarted },
        { label: "Items practiced", value: input.facts.itemsCompleted },
      ],
      showActionLabel: "Show details",
      subtitle: "Evidence behind this priority.",
      title: "Why this recommendation?",
    },
  };
}

const ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW = 20;
const ALGORITHM_NODE_EFFECTIVENESS_MIN_RESPONSES = 10;
const ALGORITHM_TREND_MIN_RESPONSES = 20;
const ALGORITHM_TREND_WINDOW = 40;
const ALGORITHM_TREND_POINT_COUNT = 4;

function buildAlgorithmEvidenceModel(input: {
  facts: CanonicalProgressFacts;
  focusNode: CanonicalProgressFacts["nodeProgress"][number];
  itemById: ReadonlyMap<string, TrainingQuestionSummary>;
  trainingAttempts: readonly TrainingAttempt[];
}): Pick<AlgorithmsProgressScreenModel, "effectivenessTrend" | "evidenceSummary" | "trackNodes"> {
  const scoredAttempts = sortAttemptsChronologically(input.trainingAttempts).filter((attempt) =>
    attempt.result.maxPoints > 0 && Boolean(input.itemById.get(attempt.item.questionId)?.nodeId),
  );
  const attemptsByNode = groupOrderedAlgorithmAttemptsByNode(scoredAttempts, input.itemById);
  const focusAttempts = attemptsByNode.get(input.focusNode.nodeId) ?? [];
  const focusWindow = focusAttempts.slice(-ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
  const focusState = getEvidenceState(focusAttempts.length, ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
  const focusPercent = focusState === "established" ? calculateEffectiveness(focusWindow) : undefined;
  const trendWindow = scoredAttempts.slice(-ALGORITHM_TREND_WINDOW);
  const trendAvailable = scoredAttempts.length >= ALGORITHM_TREND_MIN_RESPONSES;

  return {
    evidenceSummary: {
      ...(focusState === "building"
        ? { buildingCopy: "More practice is needed before recurring patterns can be identified." }
        : {}),
      currentFocus: {
        detail: focusState === "established"
          ? `Last ${focusWindow.length} responses`
          : focusState === "building"
            ? `${focusAttempts.length} scored responses`
            : "No evidence yet",
        label: focusState === "established"
          ? "Recent effectiveness"
          : focusState === "building"
            ? "Building evidence"
            : "No evidence yet",
        ...(focusPercent === undefined ? {} : { percent: focusPercent }),
        responseCount: focusState === "established" ? focusWindow.length : focusAttempts.length,
        state: focusState,
      },
      state: focusState,
    },
    effectivenessTrend: {
      available: trendAvailable,
      copy: trendAvailable
        ? `Last ${trendWindow.length} scored responses`
        : "More scored responses are needed before a trend can be shown.",
      points: trendAvailable ? buildEffectivenessTrendPoints(trendWindow) : [],
      responseCount: trendAvailable ? trendWindow.length : scoredAttempts.length,
    },
    trackNodes: input.facts.nodeProgress.map((node) => {
      const nodeAttempts = attemptsByNode.get(node.nodeId) ?? [];
      const nodeState = getEvidenceState(nodeAttempts.length, ALGORITHM_NODE_EFFECTIVENESS_MIN_RESPONSES);
      const nodeWindow = nodeAttempts.slice(-ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
      const effectivenessPercent = nodeState === "established" ? calculateEffectiveness(nodeWindow) : undefined;
      return {
        detail: formatTrackNodeEvidence(nodeState, nodeAttempts.length, effectivenessPercent, nodeWindow.length),
        ...(effectivenessPercent === undefined ? {} : { effectivenessPercent }),
        id: node.nodeId,
        isFocus: node.nodeId === input.focusNode.nodeId,
        responseCount: nodeAttempts.length,
        state: nodeState,
        title: node.label,
      };
    }),
  };
}

function groupOrderedAlgorithmAttemptsByNode(
  attempts: readonly TrainingAttempt[],
  itemById: ReadonlyMap<string, TrainingQuestionSummary>,
): Map<string, TrainingAttempt[]> {
  const attemptsByNode = new Map<string, TrainingAttempt[]>();

  for (const attempt of attempts) {
    const nodeId = itemById.get(attempt.item.questionId)?.nodeId;
    if (!nodeId) continue;
    const nodeAttempts = attemptsByNode.get(nodeId) ?? [];
    nodeAttempts.push(attempt);
    attemptsByNode.set(nodeId, nodeAttempts);
  }

  return attemptsByNode;
}

function sortAttemptsChronologically(attempts: readonly TrainingAttempt[]): TrainingAttempt[] {
  return [...attempts].sort((left, right) =>
    left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id),
  );
}

function getEvidenceState(
  responseCount: number,
  establishedResponseCount: number,
): AlgorithmProgressEvidenceState {
  if (responseCount === 0) return "no_evidence";
  return responseCount >= establishedResponseCount ? "established" : "building";
}

function calculateEffectiveness(attempts: readonly TrainingAttempt[]): number | undefined {
  const maxPoints = attempts.reduce((total, attempt) => total + attempt.result.maxPoints, 0);
  if (maxPoints <= 0) return undefined;
  const earnedPoints = attempts.reduce((total, attempt) => total + overallScoreCredit(attempt.result), 0);
  return Math.round((earnedPoints / maxPoints) * 100);
}

function buildEffectivenessTrendPoints(attempts: readonly TrainingAttempt[]): number[] {
  return Array.from({ length: ALGORITHM_TREND_POINT_COUNT }, (_, index) => {
    const start = Math.floor((index * attempts.length) / ALGORITHM_TREND_POINT_COUNT);
    const end = Math.floor(((index + 1) * attempts.length) / ALGORITHM_TREND_POINT_COUNT);
    const percent = calculateEffectiveness(attempts.slice(start, end));
    if (percent === undefined) throw new Error("Effectiveness evidence is unavailable.");
    return percent;
  });
}

function formatTrackNodeEvidence(
  state: AlgorithmProgressEvidenceState,
  responseCount: number,
  effectivenessPercent: number | undefined,
  windowCount: number,
): string {
  if (state === "no_evidence") return "No evidence yet";
  if (state === "building") return `Building evidence · ${responseCount} responses`;
  if (effectivenessPercent === undefined) throw new Error("Node effectiveness evidence is unavailable.");
  return `${effectivenessPercent}% · ${windowCount === ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW ? `Last ${windowCount} responses` : `${windowCount} responses`}`;
}

function buildLearningPriority(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  focusNode: CanonicalProgressFacts["nodeProgress"][number];
  nextNode?: CanonicalProgressFacts["nodeProgress"][number];
  remediationState: AlgorithmsRemediationState;
}): LearningPriorityModel {
  if (input.remediationState.remediationCount > 0) {
    const remediationCount = input.remediationState.remediationCount;
    const remediationNodeId = input.remediationState.attentionNodeId ?? input.focusNode.nodeId;
    const remediationNodeLabel = input.remediationState.attentionNodeLabel ?? input.focusNode.label;
    const spansMultipleTopics = input.remediationState.remediationNodeLabels.length > 1;
    return {
      detail: spansMultipleTopics
        ? `${remediationCount} due ${remediationCount === 1 ? "review item comes" : "review items come"} from earlier practice across multiple topics. Review is recommended; every topic remains available.`
        : `Recent ${remediationNodeLabel} attempts created ${remediationCount} due ${remediationCount === 1 ? "review item" : "review items"}. Review is recommended; every topic remains available.`,
      label: input.remediationState.criticalRemediationCount > 0 ? "Repeated mistake" : "Review due",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.weakAreaReview, remediationNodeId, "due_queue"),
      primaryActionLabel: "Review due items",
      primaryActionMode: ALGORITHM_MODE_IDS.weakAreaReview,
      secondaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      secondaryActionLabel: "Continue practice",
      secondaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      title: spansMultipleTopics ? "Review due items" : `Review ${remediationNodeLabel}`,
      tone: input.remediationState.criticalRemediationCount > 0 ? "danger" : "warning",
    };
  }

  if (input.dueReviewItems.length > 0) {
    const reviewNodeId = input.remediationState.attentionNodeId ?? input.focusNode.nodeId;
    const reviewNodeLabel = input.remediationState.attentionNodeLabel ?? input.focusNode.label;
    const spansMultipleTopics = input.remediationState.dueNodeLabels.length > 1;
    return {
      detail: spansMultipleTopics
        ? `${input.dueReviewItems.length} review items are due from earlier practice across multiple topics. Review is recommended; every topic remains available.`
        : `${input.dueReviewItems.length} ${input.dueReviewItems.length === 1 ? "item is" : "items are"} due from earlier ${reviewNodeLabel} practice. Review is recommended; every topic remains available.`,
      label: "Review due",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.weakAreaReview, reviewNodeId, "due_queue"),
      primaryActionLabel: "Review due items",
      primaryActionMode: ALGORITHM_MODE_IDS.weakAreaReview,
      secondaryAction: input.nextNode
        ? buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.nextNode.nodeId)
        : buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      secondaryActionLabel: input.nextNode ? `Practice ${input.nextNode.label}` : "Continue practice",
      secondaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      title: "Return to due review",
      tone: "info",
    };
  }

  if (input.focusNode.uniquePracticedItemCount > 0) {
    return {
      detail: buildContinuePriorityDetail(input.focusNode),
      label: "Recommended from recent practice",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      primaryActionLabel: `Continue ${input.focusNode.label}`,
      primaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      secondaryAction: input.nextNode
        ? buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.nextNode.nodeId)
        : undefined,
      secondaryActionLabel: input.nextNode ? `Practice ${input.nextNode.label}` : undefined,
      secondaryActionMode: input.nextNode ? ALGORITHM_MODE_IDS.guidedPractice : undefined,
      title: `Continue ${input.focusNode.label}`,
      tone: "info",
    };
  }

  return {
    detail: `No attempts are recorded yet. Start with ${input.focusNode.label}, or choose any other available topic.`,
    label: "Get started",
    primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
    primaryActionLabel: "Start practice",
    primaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
    title: "Start your first Coding Interview session",
    tone: "info",
  };
}

function buildAlgorithmsAction(
  mode: AlgorithmModeId,
  topicId: string,
  reviewSource?: "due_queue",
): ProgressAction {
  return {
    kind: "practiceSession",
    params: ({
      mode,
      reviewSource,
      source: "modeShortcut",
      topicId,
      trackId: CODING_INTERVIEW_TRACK_ID,
    }),
  };
}

function buildContinuePriorityDetail(
  node: CanonicalProgressFacts["nodeProgress"][number],
): string {
  return `${node.uniquePracticedItemCount} practiced items. Continue here for more varied practice, or choose another topic.`;
}

function buildFocusExplanation(
  node: CanonicalProgressFacts["nodeProgress"][number],
): string {
  if (node.remediationDueCount > 0) {
    return `${node.remediationDueCount} ${node.remediationDueCount === 1 ? "review item is" : "review items are"} due from this topic. This does not restrict other topics.`;
  }

  if (node.uniquePracticedItemCount === 0) {
    return "No attempts are recorded for this topic yet.";
  }

  return `${node.uniquePracticedItemCount} distinct ${node.uniquePracticedItemCount === 1 ? "item has" : "items have"} been practiced in this topic.`;
}

function buildRoadmapSummary(
  nodes: CanonicalProgressFacts["nodeProgress"],
  focusIndex: number,
): RoadmapSummaryNodeModel[] {
  const startIndex = Math.max(0, focusIndex - 1);
  return buildRoadmapNodes(nodes, focusIndex)
    .slice(startIndex, focusIndex + 3);
}

function buildRoadmapNodes(
  nodes: CanonicalProgressFacts["nodeProgress"],
  focusIndex: number,
): RoadmapSummaryNodeModel[] {
  return nodes.map((node, index) => {
    if (index === focusIndex) {
      return {
        id: node.nodeId,
        label: getNodeEvidenceLabel(node),
        progressPercent: node.itemCoveragePercent,
        showProgress: node.itemCoveragePercent > 0,
        title: node.label,
        tone: getNodeTone(node.status),
      };
    }

    return {
      id: node.nodeId,
      label: node.uniquePracticedItemCount > 0 ? getNodeEvidenceLabel(node) : "Available",
      progressPercent: node.itemCoveragePercent,
      showProgress: node.itemCoveragePercent > 0,
      title: node.label,
      tone: getNodeTone(node.status),
    };
  });
}

function getNodeTone(status: CanonicalNodeProgress["status"]): LearningTone {
  if (status === "review_due") return "warning";
  if (status === "practicing") return "info";
  return "muted";
}

function getCurrentFocusStatus(
  node: CanonicalProgressFacts["nodeProgress"][number],
): { label: CurrentFocusModel["statusLabel"]; tone: LearningTone } {
  if (node.remediationDueCount > 0) {
    return {
      label: "Needs remediation",
      tone: node.criticalRemediationDueCount > 0 ? "danger" : "warning",
    };
  }

  return {
    label: getNodeEvidenceLabel(node),
    tone: getNodeTone(node.status),
  };
}

function getNodeEvidenceLabel(node: {
  status: CanonicalNodeProgress["status"];
}): CurrentFocusModel["statusLabel"] {
  const labels: Record<CanonicalNodeProgress["status"], CurrentFocusModel["statusLabel"]> = {
    not_started: "Not started",
    practicing: "Practicing",
    review_due: "Review due",
  };
  return labels[node.status];
}

function formatAlgorithmsReviewQueueCopy(dueCount: number, totalCount: number, manualCount = 0): string {
  if (dueCount === 0 && totalCount === 0) {
    return "No Coding Interview review items right now.";
  }

  if (dueCount === 0) {
    if (manualCount > 0) return "home.review.manualReady";
    return `${totalCount} scheduled Coding Interview ${totalCount === 1 ? "item is" : "items are"} not due yet.`;
  }

  const dueCopy = `${dueCount} due Coding Interview ${dueCount === 1 ? "item needs" : "items need"} review`;
  if (manualCount > 0) return "home.review.dueAndManual";
  return `${dueCopy}.`;
}

