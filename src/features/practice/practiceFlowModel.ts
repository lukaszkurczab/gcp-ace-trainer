import type { IconName } from "../../components";
import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain/training";
import {
  ALGORITHM_ROADMAP,
  buildAlgorithmProgressFacts,
  getAlgorithmTrainingItemsForRoadmapNode,
} from "../../tracks/algorithms";
import type { CloudCertificationProgressViewModel } from "../../tracks/cloud-certification";
import type { ExamDomain } from "../../types";
import { getDomainLabel } from "../../utils";
import type { AnalyticsData } from "../analytics/analyticsService";
import type { PracticeSessionMode } from "./sessionConfig";

export type PracticeTopic = {
  detail: string;
  id: string;
  title: string;
};

export type PracticeModeModel = {
  detail: string;
  enabled: boolean;
  icon: IconName;
  mode: PracticeSessionMode;
  title: string;
  tone: "danger" | "info" | "muted" | "primary" | "success" | "warning";
  unavailableReason?: string;
};

export type RecommendedPracticeModel = PracticeModeModel & {
  label: string;
};

export type PracticeStatsSummary = {
  detail: string;
  metricLabel: string;
  metricValue: string;
  title: string;
};

export type TopicRoadmapNodeModel = {
  detail: string;
  enabled: boolean;
  id: string;
  label: string;
  progress: number;
  status: "completed" | "current" | "available" | "locked" | "later";
  title: string;
  tone: "info" | "muted" | "primary" | "success" | "warning";
};

const cloudTopics: readonly TopicRoadmapNodeModel[] = [
  {
    detail: "Environment setup, projects, billing basics, and command-line context.",
    enabled: true,
    id: "setup_environment",
    label: "Strong",
    progress: 1,
    status: "completed",
    title: "Cloud fundamentals",
    tone: "success",
  },
  {
    detail: "Access-control scenarios, IAM roles, and policy decisions.",
    enabled: true,
    id: "access_security",
    label: "Current",
    progress: 0.42,
    status: "current",
    title: "IAM & Access Control",
    tone: "primary",
  },
  {
    detail: "Planning compute resources and implementation tradeoffs.",
    enabled: true,
    id: "planning_implementation",
    label: "Practicing",
    progress: 0,
    status: "available",
    title: "Compute",
    tone: "info",
  },
  {
    detail: "Storage service scenarios will unlock after the core domains are grounded.",
    enabled: false,
    id: "cloud_storage",
    label: "New",
    progress: 0,
    status: "locked",
    title: "Storage",
    tone: "muted",
  },
  {
    detail: "Operations, networking, and day-two reliability scenarios.",
    enabled: true,
    id: "operations",
    label: "Practicing",
    progress: 0,
    status: "available",
    title: "Networking",
    tone: "info",
  },
  {
    detail: "Database service scenarios are not available in this topic map yet.",
    enabled: false,
    id: "cloud_databases",
    label: "Locked",
    progress: 0,
    status: "locked",
    title: "Databases",
    tone: "muted",
  },
  {
    detail: "Monitoring scenarios are not available in this topic map yet.",
    enabled: false,
    id: "cloud_monitoring",
    label: "Locked",
    progress: 0,
    status: "locked",
    title: "Monitoring",
    tone: "muted",
  },
  {
    detail: "Billing scenarios are not available in this topic map yet.",
    enabled: false,
    id: "cloud_billing",
    label: "Locked",
    progress: 0,
    status: "locked",
    title: "Billing",
    tone: "muted",
  },
  {
    detail: "Exam scenario practice is available from Practice mode.",
    enabled: false,
    id: "cloud_exam_scenarios",
    label: "Later",
    progress: 0,
    status: "later",
    title: "Exam Scenarios",
    tone: "muted",
  },
];

export function getCurrentPracticeTopic(
  activeTrack: TrackDefinition,
  trainingAttempts: readonly TrainingAttempt[] = [],
): PracticeTopic {
  if (activeTrack.id === ALGORITHMS_TRACK_ID) {
    const progress = buildAlgorithmProgressFacts(trainingAttempts);

    return {
      detail: "Roadmap item practice for algorithmic problem solving.",
      id: progress.activeRoadmapNode.id,
      title: progress.activeRoadmapNode.label,
    };
  }

  return {
    detail: "Access-control scenarios for Cloud Certification practice.",
    id: "access_security",
    title: "IAM policies",
  };
}

export function hasTrackProgress(input: {
  activeTrackId: TrackId;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
}): boolean {
  if (input.activeTrackId === ALGORITHMS_TRACK_ID) {
    return input.trainingAttempts.some((attempt) => attempt.trackId === ALGORITHMS_TRACK_ID);
  }

  return (
    input.analytics.summary.totalPracticeQuestionsAnswered > 0 ||
    input.analytics.summary.totalCompletedExams > 0
  );
}

export function buildRecommendedPracticeModes(input: {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
}): RecommendedPracticeModel[] {
  if (!hasTrackProgress({
    activeTrackId: input.activeTrack.id,
    analytics: input.analytics,
    trainingAttempts: input.trainingAttempts,
  })) {
    return [];
  }

  const practiceAvailable = input.activeTrack.id !== ALGORITHMS_TRACK_ID;

  return [
    {
      detail: "Random questions from completed topics.",
      enabled: true,
      icon: "rotate-ccw",
      label: "Review",
      mode: "review",
      title: "Review",
      tone: "primary",
    },
    {
      detail: "Questions from areas that need more attention.",
      enabled: true,
      icon: "alert-triangle",
      label: "Weak area",
      mode: "weakArea",
      title: "Weak area",
      tone: "warning",
    },
    {
      detail: practiceAvailable
        ? "Assessment-style session for the selected track."
        : "Mock exam mode is not available for Algorithms yet.",
      enabled: practiceAvailable,
      icon: "clipboard",
      label: practiceAvailable ? "Practice" : "Unavailable",
      mode: "practice",
      title: "Practice",
      tone: practiceAvailable ? "info" : "muted",
      unavailableReason: practiceAvailable ? undefined : "Unavailable for Algorithms",
    },
  ];
}

export function buildPracticeModes(activeTrack: TrackDefinition): PracticeModeModel[] {
  const practiceAvailable = activeTrack.id !== ALGORITHMS_TRACK_ID;

  return [
    {
      detail: "Guided explanations after each question with solving hints.",
      enabled: true,
      icon: "book-open",
      mode: "learn",
      title: "Learn",
      tone: "info",
    },
    {
      detail: "Repeated and interleaved tasks for the current topic.",
      enabled: true,
      icon: "zap",
      mode: "drill",
      title: "Drill",
      tone: "primary",
    },
    {
      detail: "Random questions from completed topics.",
      enabled: true,
      icon: "rotate-ccw",
      mode: "review",
      title: "Review",
      tone: "warning",
    },
    {
      detail: "Focus on areas where recent answers are weaker.",
      enabled: true,
      icon: "alert-triangle",
      mode: "weakArea",
      title: "Weak area",
      tone: "danger",
    },
    {
      detail: practiceAvailable
        ? "Mock exam/test mode for certification readiness."
        : "Mock exam mode is not available for Algorithms yet.",
      enabled: practiceAvailable,
      icon: "clipboard",
      mode: "practice",
      title: "Practice",
      tone: practiceAvailable ? "success" : "muted",
      unavailableReason: practiceAvailable ? undefined : "Unavailable for Algorithms",
    },
  ];
}

export function buildPracticeStatsSummary(input: {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  cloudProgress?: CloudCertificationProgressViewModel | null;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeStatsSummary {
  if (input.activeTrack.id === ALGORITHMS_TRACK_ID) {
    const progress = buildAlgorithmProgressFacts(input.trainingAttempts);

    return {
      detail: `${progress.correctCount} correct, ${progress.partialCount} partial, ${progress.incorrectCount} incorrect.`,
      metricLabel: "Items completed",
      metricValue: String(progress.itemsCompleted),
      title: `${input.activeTrack.title} stats`,
    };
  }

  const totalAttempts = input.cloudProgress?.totalAttempts ??
    input.analytics.summary.totalPracticeQuestionsAnswered;

  return {
    detail: "Progress, weak areas, and local practice history.",
    metricLabel: "Answered",
    metricValue: String(totalAttempts),
    title: "Cloud Certification stats",
  };
}

export function buildTrackProgressPercent(input: {
  activeTrackId: TrackId;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
}): number {
  if (input.activeTrackId === ALGORITHMS_TRACK_ID) {
    const progress = buildAlgorithmProgressFacts(input.trainingAttempts);
    const totalItems = progress.nodeProgress.reduce((sum, node) => sum + node.itemCount, 0);

    return totalItems > 0 ? Math.round((progress.itemsCompleted / totalItems) * 100) : 0;
  }

  const answered = input.analytics.summary.totalPracticeQuestionsAnswered;

  return Math.min(100, Math.round((answered / 50) * 100));
}

export function buildTopicRoadmapNodes(input: {
  activeTrackId: TrackId;
  trainingAttempts: readonly TrainingAttempt[];
}): TopicRoadmapNodeModel[] {
  if (input.activeTrackId === CLOUD_CERTIFICATION_TRACK_ID) {
    return [...cloudTopics];
  }

  const progress = buildAlgorithmProgressFacts(input.trainingAttempts);

  return ALGORITHM_ROADMAP.nodes.map((node) => {
    const itemCount = getAlgorithmTrainingItemsForRoadmapNode(node.id).length;
    const enabled = node.status === "available" && itemCount > 0;
    const nodeProgress = progress.nodeProgress.find((item) => item.nodeId === node.id);
    const isCurrent = progress.activeRoadmapNode.id === node.id;
    const status = getAlgorithmTopicStatus(node.status, enabled, isCurrent, nodeProgress?.status);

    return {
      detail: itemCount > 0
        ? `${node.shortDescription} ${itemCount} ${itemCount === 1 ? "item" : "items"} available.`
        : node.shortDescription,
      enabled,
      id: node.id,
      label: formatTopicStatusLabel(status),
      progress: nodeProgress && nodeProgress.itemCount > 0
        ? nodeProgress.completedItemCount / nodeProgress.itemCount
        : 0,
      status,
      title: node.label,
      tone: getTopicTone(status),
    };
  });
}

export function getCloudTopicTitle(topicId: string): string {
  const knownTopic = cloudTopics.find((topic) => topic.id === topicId);

  return knownTopic?.title ?? getDomainLabel(topicId as ExamDomain);
}

function getAlgorithmTopicStatus(
  roadmapStatus: string,
  enabled: boolean,
  isCurrent: boolean,
  progressStatus?: string,
): TopicRoadmapNodeModel["status"] {
  if (progressStatus === "completed") {
    return "completed";
  }

  if (isCurrent) {
    return "current";
  }

  if (enabled) {
    return "available";
  }

  return roadmapStatus === "coming_later" ? "later" : "locked";
}

function formatTopicStatusLabel(status: TopicRoadmapNodeModel["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "current":
      return "Current";
    case "available":
      return "Available";
    case "later":
      return "Later";
    case "locked":
      return "Locked";
  }
}

function getTopicTone(status: TopicRoadmapNodeModel["status"]): TopicRoadmapNodeModel["tone"] {
  switch (status) {
    case "completed":
      return "success";
    case "current":
      return "primary";
    case "available":
      return "info";
    case "later":
      return "muted";
    case "locked":
      return "warning";
  }
}
