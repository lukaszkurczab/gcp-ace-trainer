import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import type { ReviewQueueItem, TrainingAttempt } from "../../../domain/training";
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
import { buildPracticeSessionConfig, type PracticeSessionRouteParams } from "../../practice/sessionConfig";

type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

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

export type AlgorithmsProgressNodeModel = {
  completedItemCount: number;
  evidenceLabel: "Limited evidence" | "Needs review" | "Strong recent signal";
  id: string;
  itemCount: number;
  label: string;
  percent: number;
  status: AlgorithmRoadmapNodeProgressStatus;
};

export type AlgorithmsProgressSignal = {
  detail: string;
  id: string;
  label: string;
  tone: "warning" | "danger" | "success" | "info";
};

export type AlgorithmsProgressRecommendation = {
  detail: string;
  label: string;
  mode: "review" | "weakArea" | "practice" | "drill";
};

export type AlgorithmsProgressViewModel = {
  currentRoadmapNode: {
    id: string;
    label: string;
  };
  dueReviewCount: number;
  nodes: AlgorithmsProgressNodeModel[];
  recommendation: AlgorithmsProgressRecommendation;
  resultCounts: {
    correct: number;
    incorrect: number;
    partial: number;
  };
  signals: AlgorithmsProgressSignal[];
};

export type ProgressTabModel = {
  activitySummary: ProgressTabActivitySummary;
  algorithmsProgress?: AlgorithmsProgressViewModel;
  hasData: boolean;
  metrics: ProgressTabMetric[];
  performanceScores: ProgressTabPerformanceScore[];
  performanceSectionTitle: "Performance by domain" | "Performance areas" | "Roadmap nodes";
  reviewAction?: ProgressReviewAction;
  reviewActionEnabled: boolean;
  reviewActionLabel: string;
  reviewQueueCount: number;
  reviewQueueCopy: string;
  warning?: string;
};

export type ProgressReviewAction =
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
  const facts = buildAlgorithmProgressFacts(trainingAttempts);
  const algorithmsReviewItems = reviewQueueItems.filter((item) => item.trackId === ALGORITHMS_TRACK_ID);
  const dueReviewCount = algorithmsReviewItems.filter((item) => item.dueAt <= now).length;
  const algorithmsProgress = buildAlgorithmsProgressViewModel({
    dueReviewCount,
    facts,
    reviewQueueItems: algorithmsReviewItems,
    trainingAttempts,
  });

  return {
    activitySummary: {
      detail: `Current roadmap node: ${facts.activeRoadmapNode.label}.`,
      label: "Items completed",
      value: facts.itemsCompleted,
    },
    algorithmsProgress,
    hasData: facts.itemsCompleted > 0,
    metrics: [
      {
        label: "Correct",
        tone: "success",
        value: facts.correctCount,
      },
      {
        label: "Partial",
        tone: "info",
        value: facts.partialCount,
      },
      {
        label: "Incorrect",
        tone: "warning",
        value: facts.incorrectCount,
      },
      {
        label: "Nodes started",
        tone: "primary",
        value: facts.roadmapNodesStarted,
      },
      {
        label: "Nodes completed",
        tone: "neutral",
        value: facts.roadmapNodesCompleted,
      },
    ],
    performanceScores: facts.nodeProgress.map((node) => ({
      correct: node.completedItemCount,
      detail: `${node.completedItemCount}/${node.itemCount} items completed. ${getNodeEvidenceLabel(node)}.`,
      id: node.nodeId,
      label: node.label,
      percent: node.itemCount > 0 ? Math.round((node.completedItemCount / node.itemCount) * 100) : 0,
      total: node.itemCount,
    })),
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

function buildAlgorithmsProgressViewModel(input: {
  dueReviewCount: number;
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  reviewQueueItems: readonly ReviewQueueItem[];
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressViewModel {
  return {
    currentRoadmapNode: input.facts.activeRoadmapNode,
    dueReviewCount: input.dueReviewCount,
    nodes: input.facts.nodeProgress.map((node) => ({
      completedItemCount: node.completedItemCount,
      evidenceLabel: getNodeEvidenceLabel(node),
      id: node.nodeId,
      itemCount: node.itemCount,
      label: node.label,
      percent: node.itemCount > 0 ? Math.round((node.completedItemCount / node.itemCount) * 100) : 0,
      status: node.status,
    })),
    recommendation: buildAlgorithmsProgressRecommendation(input),
    resultCounts: {
      correct: input.facts.correctCount,
      incorrect: input.facts.incorrectCount,
      partial: input.facts.partialCount,
    },
    signals: buildAlgorithmsProgressSignals(input),
  };
}

function buildAlgorithmsProgressRecommendation(input: {
  dueReviewCount: number;
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  reviewQueueItems: readonly ReviewQueueItem[];
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressRecommendation {
  if (input.dueReviewCount > 0) {
    return {
      detail: "Review due items before starting new work.",
      label: "Review missed items",
      mode: "review",
    };
  }

  if (input.facts.incorrectCount + input.facts.partialCount >= 2) {
    return {
      detail: "Focus on the weakest roadmap node from local attempts.",
      label: "Practice weak area",
      mode: "weakArea",
    };
  }

  if (input.facts.itemsCompleted > 0 && input.facts.incorrectCount === 0 && input.facts.partialCount === 0) {
    return {
      detail: "Interleave unlocked nodes after a strong recent signal.",
      label: "Start Mixed practice",
      mode: "practice",
    };
  }

  return {
    detail: `Continue ${input.facts.activeRoadmapNode.label}.`,
    label: "Continue current roadmap node",
    mode: "drill",
  };
}

function buildAlgorithmsProgressSignals(input: {
  dueReviewCount: number;
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  reviewQueueItems: readonly ReviewQueueItem[];
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressSignal[] {
  const signals: AlgorithmsProgressSignal[] = [];
  const weakRecommendation = buildAlgorithmWeakAreaRecommendation(
    input.trainingAttempts,
    undefined,
    undefined,
    input.facts.activeRoadmapNode.id,
  );
  const weakNode = input.facts.nodeProgress.find((node) => node.nodeId === weakRecommendation.selectedRoadmapNodeId);
  const repeatedMistakeCount = input.reviewQueueItems.filter((item) =>
    item.reasons.includes("repeated_mistake"),
  ).length;

  if (input.dueReviewCount > 0) {
    signals.push({
      detail: `${input.dueReviewCount} due ${input.dueReviewCount === 1 ? "item" : "items"} in the local review queue.`,
      id: "due-review",
      label: "Needs review",
      tone: "warning",
    });
  }

  if (repeatedMistakeCount > 0) {
    signals.push({
      detail: `${repeatedMistakeCount} ${repeatedMistakeCount === 1 ? "item has" : "items have"} repeated mistake evidence.`,
      id: "repeated-mistake",
      label: "Repeated mistake",
      tone: "danger",
    });
  }

  if (input.facts.incorrectCount + input.facts.partialCount > 0 && weakNode) {
    signals.push({
      detail: `${weakNode.label}${weakRecommendation.selectedMistakeTypes.length > 0
        ? `: ${weakRecommendation.selectedMistakeTypes.map(formatAlgorithmSignalLabel).join(", ")}`
        : ""}`,
      id: `weak-node:${weakNode.nodeId}`,
      label: "Needs review",
      tone: "warning",
    });
  }

  if (signals.length === 0 && input.facts.itemsCompleted > 0) {
    signals.push({
      detail: `${input.facts.correctCount} correct latest ${input.facts.correctCount === 1 ? "item" : "items"} recorded.`,
      id: "strong-recent-signal",
      label: "Strong recent signal",
      tone: "success",
    });
  }

  if (signals.length === 0) {
    signals.push({
      detail: "Complete a few Algorithms items to show weak areas and review signals.",
      id: "limited-evidence",
      label: "Limited evidence",
      tone: "info",
    });
  }

  return signals;
}

function getNodeEvidenceLabel(node: {
  completedItemCount: number;
  scorePercent: number;
}): AlgorithmsProgressNodeModel["evidenceLabel"] {
  if (node.completedItemCount === 0) {
    return "Limited evidence";
  }

  if (node.scorePercent >= 70) {
    return "Strong recent signal";
  }

  return "Needs review";
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
