import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import type {
  AttemptSummary,
  ExamDomain,
  PracticeAnswerRecord,
} from "../../../types";
import { getDomainLabel } from "../../../utils";
import type { AnalyticsData } from "../../analytics/analyticsService";

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
  id: string;
  label: string;
  percent: number;
  total: number;
};

export type ProgressTabModel = {
  activitySummary: ProgressTabActivitySummary;
  hasData: boolean;
  metrics: ProgressTabMetric[];
  performanceScores: ProgressTabPerformanceScore[];
  performanceSectionTitle: "Performance by domain" | "Performance areas";
  reviewActionEnabled: false;
  reviewActionLabel: string;
  reviewQueueCount: number;
  reviewQueueCopy: string;
  warning?: string;
};

export type BuildProgressTabModelInput = {
  activeTrackId: TrackDefinition["id"];
  analytics: AnalyticsData;
  attempts: readonly AttemptSummary[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  practiceHistory: readonly PracticeAnswerRecord[];
};

export function buildProgressTabModel(input: BuildProgressTabModelInput): ProgressTabModel {
  if (input.activeTrackId === CLOUD_CERTIFICATION_TRACK_ID && input.cloudProgress) {
    return buildCloudProgressTabModel(input.cloudProgress);
  }

  if (input.activeTrackId === ALGORITHMS_TRACK_ID) {
    return buildAlgorithmsProgressTabModel();
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
    reviewActionEnabled: false,
    reviewActionLabel: "Review from Progress is not available yet.",
    reviewQueueCount: progress.dueReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(progress.dueReviewCount, progress.highPriorityReviewCount),
    warning: progress.degraded ? "Some local progress data may be incomplete." : undefined,
  };
}

function buildAlgorithmsProgressTabModel(): ProgressTabModel {
  return {
    activitySummary: {
      detail: "Algorithms activity will appear after pattern and strategy sessions are implemented.",
      label: "Algorithm attempts",
      value: 0,
    },
    hasData: false,
    metrics: [
      {
        label: "Pattern drills",
        tone: "primary",
        value: 0,
      },
      {
        label: "Strategy checks",
        tone: "info",
        value: 0,
      },
      {
        label: "Complexity reviews",
        tone: "neutral",
        value: 0,
      },
    ],
    performanceScores: [],
    performanceSectionTitle: "Performance areas",
    reviewActionEnabled: false,
    reviewActionLabel: "Algorithms review is not available yet.",
    reviewQueueCount: 0,
    reviewQueueCopy: "Algorithm review queue will appear after Algorithms sessions are implemented.",
  };
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
    reviewActionEnabled: false,
    reviewActionLabel: "Review from Progress is not available yet.",
    reviewQueueCount,
    reviewQueueCopy: formatLegacyReviewQueueCopy(reviewQueueCount),
  };
}

function formatCanonicalReviewQueueCopy(dueCount: number, highPriorityCount: number): string {
  if (dueCount === 0) {
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
