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
    detail: "Operations, networking, and day-two reliability scenarios.",
    enabled: true,
    id: "operations",
    label: "Practicing",
    progress: 0,
    status: "available",
    title: "Networking",
    tone: "info",
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
    detail: "Scenario practice across the canonical Cloud Certification domains.",
    id: "planning_implementation",
    title: "Planning & implementation",
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

export function buildPracticeModes(activeTrack: TrackDisplay): PracticeModeModel[] {
  if (activeTrack.id === ALGORITHMS_TRACK_ID) {
    return [
      { detail: "Practice Algorithms review items that are currently due.", enabled: true, icon: "rotate-ccw", mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review", tone: "danger" },
      { detail: "Practice random questions from completed topics without hints or reinsert.", enabled: true, icon: "clipboard", mode: ALGORITHM_MODE_IDS.independentPractice, title: "Mixed Practice", tone: "success" },
      { detail: "Forty freely navigable items with feedback after final submission.", enabled: true, icon: "shield-check", mode: ALGORITHM_MODE_IDS.interviewSimulation, title: "Interview Simulation", tone: "warning" },
    ];
  }

  return [
    { detail: "A fixed 40-question baseline across Cloud domains, with feedback after each saved answer.", enabled: true, icon: "clipboard", mode: "certification-diagnostic-baseline", title: "Diagnostic Baseline", tone: "success" },
    { detail: "Choose one Cloud domain and practice 10, 20, or 40 questions without mixing domains.", enabled: true, icon: "practice", mode: "certification-focus-practice", title: "Focus Practice", tone: "primary" },
    { detail: "Choose one competency and practice only its approved scenario questions.", enabled: true, icon: "practice", mode: "certification-scenario-practice", title: "Scenario Practice", tone: "warning" },
    { detail: "Review only saved weak areas whose review time has arrived.", enabled: true, icon: "rotate-ccw", mode: "certification-weak-area-review", title: "Weak Area Review", tone: "danger" },
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
