import type { IconName } from "../../components";
import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDisplay,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  ALGORITHM_ROADMAP,
  buildAlgorithmProgressFacts,
  getAlgorithmItemsForRoadmapNode,
  isRoadmapPrerequisiteSatisfied,
} from "../../tracks/algorithms";
import type { CloudCertificationProgressViewModel } from "../../tracks/cloud-certification";
import type { CertificationDomain } from "../../tracks/cloud-certification";
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
  activeTrack: TrackDisplay,
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
  activeTrack: TrackDisplay;
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

  if (input.activeTrack.id === ALGORITHMS_TRACK_ID) {
    return [
      {
        detail: "Practice Algorithms review items that are currently due.",
        enabled: true,
        icon: "rotate-ccw",
        label: "Weak area review",
        mode: ALGORITHM_MODE_IDS.weakAreaReview,
        title: "Weak Area Review",
        tone: "primary",
      },
      {
        detail: "Interleave unlocked topics without hints or reinsert.",
        enabled: true,
        icon: "clipboard",
        label: "Independent practice",
        mode: ALGORITHM_MODE_IDS.independentPractice,
        title: "Independent Practice",
        tone: "info",
      },
    ];
  }

  return [
    {
      detail: "Revisit recent misses from the current track.",
      enabled: true,
      icon: "rotate-ccw",
      label: "Review",
      mode: "review",
      title: "Review",
      tone: "primary",
    },
    {
      detail: "Focus on areas where recent answers are weaker.",
      enabled: true,
      icon: "alert-triangle",
      label: "Weak area",
      mode: "weakArea",
      title: "Weak area",
      tone: "warning",
    },
    {
      detail: "Mixed practice session for the selected track.",
      enabled: true,
      icon: "clipboard",
      label: "Practice",
      mode: "practice",
      title: "Practice",
      tone: "info",
    },
  ];
}

export function buildPracticeModes(activeTrack: TrackDisplay): PracticeModeModel[] {
  if (activeTrack.id === ALGORITHMS_TRACK_ID) {
    return [
      { detail: "Study the decision signals and mechanism of an approach.", enabled: true, icon: "book-open", mode: ALGORITHM_MODE_IDS.learnApproach, title: "Learn Approach", tone: "info" },
      { detail: "Practice the current topic with immediate feedback and reinsert.", enabled: true, icon: "zap", mode: ALGORITHM_MODE_IDS.guidedPractice, title: "Guided Practice", tone: "primary" },
      { detail: "Identify the pattern from constraints, signals, and invariants.", enabled: true, icon: "practice", mode: ALGORITHM_MODE_IDS.recognizePatterns, title: "Recognize Patterns", tone: "success" },
      { detail: "Choose between adjacent approaches and explain the tradeoff.", enabled: true, icon: "route", mode: ALGORITHM_MODE_IDS.contrastPractice, title: "Contrast Practice", tone: "warning" },
      { detail: "Practice Algorithms review items that are currently due.", enabled: true, icon: "rotate-ccw", mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review", tone: "danger" },
      { detail: "Interleave unlocked topics without hints or reinsert.", enabled: true, icon: "clipboard", mode: ALGORITHM_MODE_IDS.independentPractice, title: "Independent Practice", tone: "success" },
      { detail: "Forty freely navigable items with feedback after final submission.", enabled: true, icon: "shield-check", mode: ALGORITHM_MODE_IDS.interviewSimulation, title: "Interview Simulation", tone: "warning" },
    ];
  }

  return [
    {
      detail: "Guided explanations after each item with solving hints.",
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
      detail: "Revisit recent misses from the current track.",
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
      detail: "Mixed item session for the selected track.",
      enabled: true,
      icon: "clipboard",
      mode: "practice",
      title: "Practice",
      tone: "success",
    },
  ];
}

export function buildPracticeStatsSummary(input: {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  cloudProgress?: CloudCertificationProgressViewModel | null;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeStatsSummary {
  if (input.activeTrack.id === ALGORITHMS_TRACK_ID) {
    const progress = buildAlgorithmProgressFacts(input.trainingAttempts);

    return {
      detail: `${progress.correctCount} correct, ${progress.partialCount} partial, ${progress.incorrectCount} incorrect.`,
      metricLabel: "Items practiced",
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
  const readyNodeIds = new Set(
    progress.nodeProgress
      .filter((node) => isRoadmapPrerequisiteSatisfied(node.status))
      .map((node) => node.nodeId),
  );

  return ALGORITHM_ROADMAP.nodes.map((node) => {
    const itemCount = getAlgorithmItemsForRoadmapNode(node.id).length;
    const nodeProgress = progress.nodeProgress.find((item) => item.nodeId === node.id);
    const isCurrent = progress.activeRoadmapNode.id === node.id;
    const prerequisitesMet = node.prerequisiteNodeIds.every((nodeId) => readyNodeIds.has(nodeId));
    const enabled = itemCount > 0 && (isCurrent || prerequisitesMet || Boolean(nodeProgress && isRoadmapPrerequisiteSatisfied(nodeProgress.status)));
    const status = getAlgorithmTopicStatus(enabled, isCurrent, nodeProgress?.status);

    return {
      detail: itemCount > 0
        ? `${node.shortDescription} ${nodeProgress?.uniquePracticedItemCount ?? 0}/${itemCount} practiced. Core skills: ${nodeProgress?.coveredCoreSkillAtomCount ?? 0}/${nodeProgress?.coreSkillAtomCount ?? node.skillAtomIds?.length ?? 0} covered.`
        : node.shortDescription,
      enabled,
      id: node.id,
      label: nodeProgress ? formatAlgorithmProgressStatusLabel(nodeProgress.status) : formatTopicStatusLabel(status),
      progress: nodeProgress && nodeProgress.itemCount > 0
        ? nodeProgress.uniquePracticedItemCount / nodeProgress.itemCount
        : 0,
      status,
      title: node.label,
      tone: getTopicTone(status),
    };
  });
}

export function getCloudTopicTitle(topicId: string): string {
  const knownTopic = cloudTopics.find((topic) => topic.id === topicId);

  return knownTopic?.title ?? getDomainLabel(topicId as CertificationDomain);
}

function getAlgorithmTopicStatus(
  enabled: boolean,
  isCurrent: boolean,
  progressStatus?: string,
): TopicRoadmapNodeModel["status"] {
  if (progressStatus === "mastered" || progressStatus === "maintenance") {
    return "completed";
  }

  if (isCurrent) {
    return "current";
  }

  if (enabled) {
    return "available";
  }

  return "locked";
}

function formatAlgorithmProgressStatusLabel(status: string): string {
  switch (status) {
    case "not_started": return "New";
    case "initial_exposure": return "First pass";
    case "in_progress": return "Practicing";
    case "eligible_for_next": return "Ready for next";
    case "mastered": return "Mastered";
    case "maintenance": return "Maintenance";
    default: return "Available";
  }
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
