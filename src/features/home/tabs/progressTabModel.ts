import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import { getReviewQueueItemKind, type ReviewQueueItem, type TrainingAttempt } from "../../../domain/training";
import {
  buildAlgorithmProgressFacts,
  buildAlgorithmWeakAreaRecommendation,
  type AlgorithmRoadmapNodeProgressStatus,
} from "../../../tracks/algorithms";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import type {
  AttemptSummary,
  ExamDomain,
  PracticeAnswerRecord,
} from "../../../types";
import { getDomainLabel } from "../../../utils";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  buildPracticeSessionConfig,
  type PracticeSessionMode,
  type PracticeSessionRouteParams,
} from "../../practice/sessionConfig";

type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
type LearningTone = "danger" | "warning" | "info" | "success" | "muted";

export type ProgressTabMetric = {
  label: string;
  tone: MetricTone;
  value: number;
};

export type ProgressTabActivitySummary = {
  detail: string;
  label: string;
  value: number;
};

export type ProgressTabPerformanceScore = {
  correct: number;
  detail?: string;
  id: string;
  label: string;
  percent: number;
  total: number;
};

export type LearningPriorityModel = {
  detail: string;
  label: string;
  primaryAction: ProgressAction;
  primaryActionLabel: string;
  primaryActionMode: PracticeSessionMode;
  secondaryAction?: ProgressAction;
  secondaryActionLabel?: string;
  secondaryActionMode?: PracticeSessionMode;
  title: string;
  tone: LearningTone;
};

export type CurrentFocusModel = {
  coreSkillsLabel: string;
  explanation: string;
  nodeId: string;
  practicedLabel: string;
  progressPercent: number;
  scoreLabel: string;
  statusLabel: string;
  statusTone: LearningTone;
  title: string;
};

export type NextTopicReadinessModel = {
  detail: string;
  nodeId: string;
  requirements: readonly {
    label: string;
    met: boolean;
  }[];
  state: "locked" | "available" | "ready";
  title: string;
};

export type RoadmapSummaryNodeModel = {
  id: string;
  label: string;
  progressPercent: number;
  showProgress: boolean;
  title: string;
  tone: LearningTone;
};

export type RoadmapSummaryModel = {
  allNodes: readonly RoadmapSummaryNodeModel[];
  nodes: readonly RoadmapSummaryNodeModel[];
  showAllActionLabel: string;
};

export type ProgressDiagnosticsModel = {
  collapsedByDefault: true;
  metrics: readonly ProgressTabMetric[];
  mistakeSummary?: string;
};

export type AlgorithmsProgressScreenModel = {
  currentFocus: CurrentFocusModel;
  diagnostics: ProgressDiagnosticsModel;
  nextTopic: NextTopicReadinessModel | null;
  priority: LearningPriorityModel;
  roadmapSummary: RoadmapSummaryModel;
};

export type ProgressTabModel = {
  activitySummary: ProgressTabActivitySummary;
  algorithmsProgress?: AlgorithmsProgressScreenModel;
  hasData: boolean;
  metrics: ProgressTabMetric[];
  performanceScores: ProgressTabPerformanceScore[];
  performanceSectionTitle: "Performance by domain" | "Performance areas" | "Roadmap nodes";
  reviewAction?: ProgressAction;
  reviewActionEnabled: boolean;
  reviewActionLabel: string;
  reviewQueueCount: number;
  reviewQueueCopy: string;
  warning?: string;
};

export type ProgressAction =
  | {
      kind: "legacyMistakesReview";
    }
  | {
      kind: "practiceSession";
      params: PracticeSessionRouteParams;
    };

export type BuildProgressTabModelInput = {
  activeTrackId: TrackDefinition["id"];
  analytics: AnalyticsData;
  attempts: readonly AttemptSummary[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  now?: string;
  practiceHistory: readonly PracticeAnswerRecord[];
  reviewQueueItems?: readonly ReviewQueueItem[];
  trainingAttempts?: readonly TrainingAttempt[];
};

export function buildProgressTabModel(input: BuildProgressTabModelInput): ProgressTabModel {
  if (input.activeTrackId === CLOUD_CERTIFICATION_TRACK_ID && input.cloudProgress) {
    return buildCloudProgressTabModel(input.cloudProgress);
  }

  if (input.activeTrackId === ALGORITHMS_TRACK_ID) {
    return buildAlgorithmsProgressTabModel(
      input.trainingAttempts ?? [],
      input.reviewQueueItems ?? [],
      input.now ?? new Date().toISOString(),
    );
  }

  return buildLegacyProgressTabModel(input);
}

function buildCloudProgressTabModel(progress: CloudCertificationProgressViewModel): ProgressTabModel {
  return {
    activitySummary: {
      detail:
        progress.totalAttempts > 0
          ? `${progress.practiceAttemptCount} practice answers and ${progress.examAttemptCount} exam answers recorded.`
          : "Practice activity appears after local sessions are completed.",
      label: "Local attempts",
      value: progress.totalAttempts,
    },
    hasData: progress.totalAttempts > 0,
    metrics: [
      {
        label: "Total attempts",
        tone: "info",
        value: progress.totalAttempts,
      },
      {
        label: "Practice answers",
        tone: "primary",
        value: progress.practiceAttemptCount,
      },
      {
        label: "Exam answers",
        tone: "neutral",
        value: progress.examAttemptCount,
      },
    ],
    performanceScores: progress.taxonomyPerformance
      .filter((score) => score.axisId === "cloud-domain" && score.totalAttempts > 0)
      .map((score) => ({
        correct: score.correctCount,
        id: score.nodeId,
        label: getCloudDomainLabel(score.nodeId),
        percent: score.percent,
        total: score.totalAttempts,
      })),
    performanceSectionTitle: "Performance by domain",
    reviewAction: progress.dueReviewCount > 0 ? { kind: "legacyMistakesReview" } : undefined,
    reviewActionEnabled: progress.dueReviewCount > 0,
    reviewActionLabel: progress.dueReviewCount > 0 ? "Open review queue" : "Review from Progress is not available yet.",
    reviewQueueCount: progress.dueReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(
      progress.dueReviewCount,
      progress.highPriorityReviewCount,
      progress.scheduledReviewCount,
    ),
    warning: progress.degraded ? "Some local progress data may be incomplete." : undefined,
  };
}

function buildAlgorithmsProgressTabModel(
  trainingAttempts: readonly TrainingAttempt[],
  reviewQueueItems: readonly ReviewQueueItem[],
  now: string,
): ProgressTabModel {
  const facts = buildAlgorithmProgressFacts(trainingAttempts, undefined, undefined, reviewQueueItems, now);
  const algorithmsReviewItems = reviewQueueItems.filter((item) => item.trackId === ALGORITHMS_TRACK_ID);
  const dueReviewItems = algorithmsReviewItems.filter((item) => item.dueAt <= now);
  const dueReviewCount = dueReviewItems.length;
  const algorithmsProgress = buildAlgorithmsProgressScreenModel({
    dueReviewItems,
    facts,
    trainingAttempts,
  });

  return {
    activitySummary: {
      detail: `Current roadmap node: ${facts.activeRoadmapNode.label}.`,
      label: "Items practiced",
      value: facts.itemsCompleted,
    },
    algorithmsProgress,
    hasData: facts.itemsCompleted > 0,
    metrics: [],
    performanceScores: [],
    performanceSectionTitle: "Roadmap nodes",
    reviewAction: dueReviewCount > 0
      ? {
          kind: "practiceSession",
          params: buildPracticeSessionConfig({
            feedbackMode: "afterEachAnswer",
            mode: "review",
            reviewSource: "dueQueue",
            source: "modeShortcut",
            topicId: facts.activeRoadmapNode.id,
            trackId: ALGORITHMS_TRACK_ID,
          }),
        }
      : undefined,
    reviewActionEnabled: dueReviewCount > 0,
    reviewActionLabel: dueReviewCount > 0 ? "Open review queue" : "Review from Progress is not available yet.",
    reviewQueueCount: dueReviewCount,
    reviewQueueCopy: formatAlgorithmsReviewQueueCopy(dueReviewCount, algorithmsReviewItems.length),
  };
}

type AlgorithmsRemediationState = {
  attentionNodeId?: string;
  attentionNodeLabel?: string;
  criticalRemediationCount: number;
  remediationCount: number;
};

function getAlgorithmsRemediationState(input: {
  dueReviewItems: readonly ReviewQueueItem[];
  nodeProgress: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"];
}): AlgorithmsRemediationState {
  const remediationItems = input.dueReviewItems.filter(
    (item) => getReviewQueueItemKind(item) === "remediation",
  );
  const criticalRemediationCount = remediationItems.filter(
    (item) =>
      item.priority === "high" ||
      item.priority === "urgent" ||
      item.reasons.includes("repeated_mistake"),
  ).length;
  const attentionNode = criticalRemediationCount > 0
    ? input.nodeProgress.find((node) => node.criticalRemediationDueCount > 0)
    : input.nodeProgress.find((node) => node.remediationDueCount > 0);

  return {
    attentionNodeId: attentionNode?.nodeId,
    attentionNodeLabel: attentionNode?.label,
    criticalRemediationCount,
    remediationCount: remediationItems.length,
  };
}

function buildAlgorithmsProgressScreenModel(input: {
  dueReviewItems: readonly ReviewQueueItem[];
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressScreenModel {
  const activeIndex = input.facts.nodeProgress.findIndex(
    (node) => node.nodeId === input.facts.activeRoadmapNode.id,
  );
  const activeNode = input.facts.nodeProgress[activeIndex] ?? input.facts.nodeProgress[0];

  if (!activeNode) {
    throw new Error("No Algorithms roadmap progress is available.");
  }

  const previousNode = input.facts.nodeProgress[activeIndex - 1];
  const focusNode = activeNode.uniquePracticedItemCount === 0 && previousNode?.eligibleForNext
    ? previousNode
    : activeNode;
  const focusIndex = input.facts.nodeProgress.indexOf(focusNode);
  const nextNode = input.facts.nodeProgress[focusIndex + 1];
  const remediationState = getAlgorithmsRemediationState({
    dueReviewItems: input.dueReviewItems,
    nodeProgress: input.facts.nodeProgress,
  });
  const weakRecommendation = buildAlgorithmWeakAreaRecommendation(
    input.trainingAttempts,
    undefined,
    undefined,
    focusNode.nodeId,
  );
  const focusStatus = getCurrentFocusStatus(focusNode);
  const nextTopicAvailable = focusNode.eligibleForNext &&
    remediationState.criticalRemediationCount === 0;

  return {
    priority: buildLearningPriority({
      dueReviewItems: input.dueReviewItems,
      focusNode,
      nextNode,
      remediationState,
    }),
    currentFocus: {
      coreSkillsLabel: `${focusNode.coveredCoreSkillAtomCount} / ${focusNode.coreSkillAtomCount}`,
      explanation: buildFocusExplanation(focusNode),
      nodeId: focusNode.nodeId,
      practicedLabel: `${focusNode.uniquePracticedItemCount} / ${focusNode.itemCount}`,
      progressPercent: focusNode.itemCoveragePercent,
      scoreLabel: `${focusNode.scorePercent}%`,
      statusLabel: focusStatus.label,
      statusTone: focusStatus.tone,
      title: focusNode.label,
    },
    nextTopic: nextNode
      ? buildNextTopicReadiness(focusNode, nextNode, remediationState)
      : null,
    roadmapSummary: {
      allNodes: buildRoadmapNodes(input.facts.nodeProgress, focusIndex, nextTopicAvailable),
      nodes: buildRoadmapSummary(input.facts.nodeProgress, focusIndex, nextTopicAvailable),
      showAllActionLabel: "View all roadmap nodes",
    },
    diagnostics: {
      collapsedByDefault: true,
      metrics: [
        { label: "Correct", tone: "success", value: input.facts.correctCount },
        { label: "Partial", tone: "info", value: input.facts.partialCount },
        { label: "Incorrect", tone: "warning", value: input.facts.incorrectCount },
        { label: "Nodes started", tone: "primary", value: input.facts.roadmapNodesStarted },
        { label: "Nodes mastered", tone: "neutral", value: input.facts.roadmapNodesMastered },
      ],
      mistakeSummary: weakRecommendation.selectedMistakeTypes.length > 0
        ? `${weakRecommendation.reasonLabel}: ${weakRecommendation.selectedMistakeTypes
            .map(formatAlgorithmSignalLabel)
            .join(", ")}.`
        : undefined,
    },
  };
}

function buildLearningPriority(input: {
  dueReviewItems: readonly ReviewQueueItem[];
  focusNode: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number];
  nextNode?: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number];
  remediationState: AlgorithmsRemediationState;
}): LearningPriorityModel {
  const retentionItems = input.dueReviewItems.filter(
    (item) => getReviewQueueItemKind(item) === "retention",
  );

  if (input.remediationState.remediationCount > 0) {
    const remediationCount = input.remediationState.remediationCount;
    const remediationNodeId = input.remediationState.attentionNodeId ?? input.focusNode.nodeId;
    const remediationNodeLabel = input.remediationState.attentionNodeLabel ?? input.focusNode.label;
    return {
      detail: `Your recent ${remediationNodeLabel} attempts show ${remediationCount === 1 ? "a mistake pattern that needs" : "mistake patterns that need"} repair before more new work.`,
      label: input.remediationState.criticalRemediationCount > 0 ? "Critical remediation" : "Needs attention",
      primaryAction: buildAlgorithmsAction("review", remediationNodeId, "dueQueue"),
      primaryActionLabel: "Review remediation",
      primaryActionMode: "review",
      secondaryAction: buildAlgorithmsAction("drill", input.focusNode.nodeId),
      secondaryActionLabel: "Continue practice",
      secondaryActionMode: "drill",
      title: `Review ${remediationCount} remediation ${remediationCount === 1 ? "item" : "items"}`,
      tone: input.remediationState.criticalRemediationCount > 0 ? "danger" : "warning",
    };
  }

  if (input.focusNode.uniquePracticedItemCount > 0 && !input.focusNode.eligibleForNext) {
    return {
      detail: buildBreadthPriorityDetail(input.focusNode),
      label: "Build evidence",
      primaryAction: buildAlgorithmsAction("drill", input.focusNode.nodeId),
      primaryActionLabel: `Continue ${input.focusNode.label} practice`,
      primaryActionMode: "drill",
      title: input.focusNode.coreSkillAtomCoveragePercent < 80
        ? "Build core-skill breadth"
        : "Strengthen your current evidence",
      tone: "warning",
    };
  }

  if (input.focusNode.eligibleForNext && retentionItems.length > 0) {
    return {
      detail: "This is a scheduled memory check. It does not block the next topic.",
      label: "Scheduled check",
      primaryAction: buildAlgorithmsAction("review", input.focusNode.nodeId, "dueQueue"),
      primaryActionLabel: "Run retention check",
      primaryActionMode: "review",
      secondaryAction: input.nextNode
        ? buildAlgorithmsAction("drill", input.nextNode.nodeId)
        : buildAlgorithmsAction("drill", input.focusNode.nodeId),
      secondaryActionLabel: "Continue practice",
      secondaryActionMode: "drill",
      title: "Retention check pending",
      tone: "info",
    };
  }

  if (input.focusNode.eligibleForNext && input.nextNode) {
    return {
      detail: `You can start ${input.nextNode.label}. Mastery of ${input.focusNode.label} can still be confirmed later through retention checks.`,
      label: "Ready for next",
      primaryAction: buildAlgorithmsAction("drill", input.nextNode.nodeId),
      primaryActionLabel: `Start ${input.nextNode.label}`,
      primaryActionMode: "drill",
      secondaryAction: buildAlgorithmsAction("drill", input.focusNode.nodeId),
      secondaryActionLabel: "Review current topic",
      secondaryActionMode: "drill",
      title: "Ready for next topic",
      tone: "success",
    };
  }

  if (input.focusNode.mastered || input.focusNode.status === "maintenance") {
    return {
      detail: input.focusNode.status === "maintenance"
        ? "Keep this topic durable with its scheduled maintenance work."
        : "This topic has the required practice, breadth, accuracy, and retention evidence.",
      label: input.focusNode.status === "maintenance" ? "Maintenance" : "Mastered",
      primaryAction: buildAlgorithmsAction("drill", input.focusNode.nodeId),
      primaryActionLabel: input.focusNode.status === "maintenance" ? "Continue maintenance" : "Continue practice",
      primaryActionMode: "drill",
      title: input.focusNode.status === "maintenance" ? "Maintenance is due" : "Topic mastered",
      tone: "success",
    };
  }

  return {
    detail: "Practice items to build evidence for your first roadmap node.",
    label: "Get started",
    primaryAction: buildAlgorithmsAction("drill", input.focusNode.nodeId),
    primaryActionLabel: "Start practice",
    primaryActionMode: "drill",
    title: "Start your first Algorithms session",
    tone: "info",
  };
}

function buildAlgorithmsAction(
  mode: PracticeSessionMode,
  topicId: string,
  reviewSource?: "dueQueue",
): ProgressAction {
  return {
    kind: "practiceSession",
    params: buildPracticeSessionConfig({
      feedbackMode: "afterEachAnswer",
      mode,
      reviewSource,
      source: "modeShortcut",
      topicId,
      trackId: ALGORITHMS_TRACK_ID,
    }),
  };
}

function buildBreadthPriorityDetail(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
): string {
  if (node.coreSkillAtomCoveragePercent < 80) {
    return `You practiced ${node.uniquePracticedItemCount} ${node.uniquePracticedItemCount === 1 ? "item" : "items"}, but ${node.coveredCoreSkillAtomCount}/${node.coreSkillAtomCount} core skills are covered. Practice more varied items before the next topic is recommended.`;
  }

  if (node.uniquePracticedItemCount < node.eligibleRequiredItemCount) {
    return `Practice at least ${node.eligibleRequiredItemCount} varied items to build enough evidence for the next topic.`;
  }

  return `Your current score is ${node.scorePercent}%. Reach 80% while maintaining broad core-skill coverage before the next topic is recommended.`;
}

function buildFocusExplanation(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
): string {
  if (node.remediationDueCount > 0) {
    return "Repair due mistakes, then continue building accurate and varied evidence.";
  }

  if (node.eligibleForNext && !node.mastered) {
    return "You can move forward now; later retention checks can still confirm mastery.";
  }

  if (node.mastered) {
    return "Your practice, core-skill coverage, accuracy, and retention evidence meet mastery requirements.";
  }

  if (node.uniquePracticedItemCount === 0) {
    return "Start practicing this topic to build learning evidence.";
  }

  return "You need stronger accuracy and broader core-skill coverage before the next topic is recommended.";
}

function buildNextTopicReadiness(
  currentNode: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
  nextNode: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
  remediationState: AlgorithmsRemediationState,
): NextTopicReadinessModel {
  const state = remediationState.criticalRemediationCount > 0
    ? "locked"
    : currentNode.mastered
      ? "ready"
      : currentNode.eligibleForNext
        ? "available"
        : "locked";

  return {
    detail: state === "locked"
      ? "Complete the requirements below to unlock this topic."
      : `You can start this topic. ${currentNode.label} mastery can still be confirmed later through retention checks.`,
    nodeId: nextNode.nodeId,
    requirements: state === "locked"
      ? [
          {
            label: `Practice at least ${currentNode.eligibleRequiredItemCount} items`,
            met: currentNode.uniquePracticedItemCount >= currentNode.eligibleRequiredItemCount,
          },
          {
            label: "Score at least 80%",
            met: currentNode.scorePercent >= 80,
          },
          {
            label: "Cover 80% of core skills",
            met: currentNode.coreSkillAtomCoveragePercent >= 80,
          },
          {
            label: "Clear critical remediation",
            met: remediationState.criticalRemediationCount === 0,
          },
        ]
      : [],
    state,
    title: nextNode.label,
  };
}

function buildRoadmapSummary(
  nodes: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"],
  focusIndex: number,
  nextTopicAvailable: boolean,
): RoadmapSummaryNodeModel[] {
  const startIndex = Math.max(0, focusIndex - 1);
  return buildRoadmapNodes(nodes, focusIndex, nextTopicAvailable)
    .slice(startIndex, focusIndex + 3);
}

function buildRoadmapNodes(
  nodes: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"],
  focusIndex: number,
  nextTopicAvailable: boolean,
): RoadmapSummaryNodeModel[] {
  return nodes.map((node, index) => {
    if (index === focusIndex) {
      return {
        id: node.nodeId,
        label: getNodeEvidenceLabel(node),
        progressPercent: node.itemCoveragePercent,
        showProgress: true,
        title: node.label,
        tone: getNodeTone(node.status),
      };
    }

    if (index === focusIndex + 1) {
      return {
        id: node.nodeId,
        label: node.uniquePracticedItemCount > 0 || nextTopicAvailable
          ? "Next"
          : "Next · Locked",
        progressPercent: node.itemCoveragePercent,
        showProgress: node.itemCoveragePercent > 0,
        title: node.label,
        tone: nextTopicAvailable ? "success" : "muted",
      };
    }

    if (index > focusIndex + 1) {
      return {
        id: node.nodeId,
        label: "Later",
        progressPercent: node.itemCoveragePercent,
        showProgress: node.itemCoveragePercent > 0,
        title: node.label,
        tone: "muted",
      };
    }

    return {
      id: node.nodeId,
      label: getNodeEvidenceLabel(node),
      progressPercent: node.itemCoveragePercent,
      showProgress: node.itemCoveragePercent > 0,
      title: node.label,
      tone: getNodeTone(node.status),
    };
  });
}

function getNodeTone(status: AlgorithmRoadmapNodeProgressStatus): LearningTone {
  if (status === "eligible_for_next" || status === "mastered" || status === "maintenance") {
    return "success";
  }

  if (status === "initial_exposure" || status === "in_progress") {
    return "info";
  }

  return "muted";
}

function getCurrentFocusStatus(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
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
  status: AlgorithmRoadmapNodeProgressStatus;
}): CurrentFocusModel["statusLabel"] {
  const labels: Record<AlgorithmRoadmapNodeProgressStatus, CurrentFocusModel["statusLabel"]> = {
    not_started: "New", initial_exposure: "First pass", in_progress: "Practicing",
    eligible_for_next: "Ready for next", mastered: "Mastered", maintenance: "Maintenance",
  };
  return labels[node.status];
}

function formatAlgorithmSignalLabel(value: string): string {
  return value.split("_").map(capitalize).join(" ");
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatAlgorithmsReviewQueueCopy(dueCount: number, totalCount: number): string {
  if (dueCount === 0 && totalCount === 0) {
    return "No Algorithms review items right now.";
  }

  if (dueCount === 0) {
    return `${totalCount} scheduled Algorithms ${totalCount === 1 ? "item is" : "items are"} not due yet.`;
  }

  return `${dueCount} due Algorithms ${dueCount === 1 ? "item needs" : "items need"} review.`;
}

function buildLegacyProgressTabModel(input: BuildProgressTabModelInput): ProgressTabModel {
  const hasData = input.attempts.length > 0 || input.practiceHistory.length > 0;
  const reviewQueueCount = input.analytics.summary.totalPracticeQuestionsAnswered;

  return {
    activitySummary: {
      detail:
        input.practiceHistory.length > 0
          ? `${input.practiceHistory.length} local practice ${input.practiceHistory.length === 1 ? "answer" : "answers"} recorded.`
          : "Practice activity appears after local sessions are completed.",
      label: "Local practice",
      value: input.practiceHistory.length,
    },
    hasData,
    metrics: [
      {
        label: "Completed exams",
        tone: "info",
        value: input.analytics.summary.totalCompletedExams,
      },
      {
        label: "Practice answers",
        tone: "primary",
        value: input.analytics.summary.totalPracticeQuestionsAnswered,
      },
    ],
    performanceScores:
      input.activeTrackId === CLOUD_CERTIFICATION_TRACK_ID
        ? input.analytics.domainPerformance
            .filter((score) => score.total > 0)
            .map((score) => ({
              correct: score.correct,
              id: score.id,
              label: score.label,
              percent: score.percent,
              total: score.total,
            }))
        : [],
    performanceSectionTitle:
      input.activeTrackId === CLOUD_CERTIFICATION_TRACK_ID
        ? "Performance by domain"
        : "Performance areas",
    reviewAction: reviewQueueCount > 0 ? { kind: "legacyMistakesReview" } : undefined,
    reviewActionEnabled: reviewQueueCount > 0,
    reviewActionLabel: reviewQueueCount > 0 ? "Open review queue" : "Review from Progress is not available yet.",
    reviewQueueCount,
    reviewQueueCopy: formatLegacyReviewQueueCopy(reviewQueueCount),
  };
}

function formatCanonicalReviewQueueCopy(
  dueCount: number,
  highPriorityCount: number,
  scheduledCount: number,
): string {
  if (dueCount === 0) {
    if (scheduledCount > 0) {
      return `${scheduledCount} scheduled ${scheduledCount === 1 ? "item is" : "items are"} not due yet.`;
    }

    return "No due review items right now.";
  }

  if (highPriorityCount > 0) {
    return `${dueCount} due ${dueCount === 1 ? "item" : "items"}, ${highPriorityCount} high priority.`;
  }

  return `${dueCount} due review ${dueCount === 1 ? "item" : "items"}.`;
}

function formatLegacyReviewQueueCopy(count: number): string {
  if (count === 0) {
    return "No local practice records yet.";
  }

  return `${count} local practice ${count === 1 ? "record" : "records"} available for review.`;
}

function getCloudDomainLabel(nodeId: string): string {
  if (isExamDomain(nodeId)) {
    return getDomainLabel(nodeId);
  }

  return nodeId;
}

function isExamDomain(value: string): value is ExamDomain {
  return (
    value === "setup_environment" ||
    value === "planning_implementation" ||
    value === "operations" ||
    value === "access_security"
  );
}
