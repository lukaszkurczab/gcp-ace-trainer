import type { IconName } from "../../components";
import {
  CODING_INTERVIEW_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  getTrackDisplay,
  getTrackRegistration,
  type TrackDisplay,
  type TrackId,
  type TrackRegistration,
  UnknownTrackFamilyError,
  UnsupportedTrackError,
} from "../../domain";
import type { TrainingAttempt } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  ALGORITHM_ROADMAP,
  buildAlgorithmProgressFacts,
  getAlgorithmMode,
  getAlgorithmItemsForRoadmapNode,
} from "../../tracks/coding-interview";
import type { CloudCertificationProgressViewModel } from "../../tracks/certification";
import type { CertificationDomain, CertificationModeId } from "../../tracks/certification";
import { getDomainLabel } from "../../utils";
import type { AnalyticsData } from "../analytics/analyticsService";
import type { PracticeSessionMode } from "./sessionConfig";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { AlgorithmQuestion } from "../../tracks/coding-interview/algorithmQuestionTypes";

function codingPackageContent() {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery(CODING_INTERVIEW_TRACK_ID);
  return { contentVersion: resolution.package.contentVersion, items: resolution.profile.items as readonly AlgorithmQuestion[], packagePin: resolution.package.packagePin };
}

export type PracticeTopic = {
  detail: PracticeTopicDetail;
  id: string;
  title: PracticeTopicTitle;
};

export type PracticeTopicDetail =
  | TopicRoadmapDetail
  | Readonly<{ key: string; kind: "key" }>
  | Readonly<{
      key: string;
      kind: "track-context";
      trackTitle: string;
    }>;

export type PracticeTopicTitle =
  | Readonly<{ kind: "authored"; value: string }>
  | Readonly<{ key: string; kind: "translation-key" }>;

export type PracticeModeModel = {
  detail: string;
  enabled: boolean;
  icon: IconName;
  mode: PracticeSessionMode | CertificationModeId;
  title: string;
  tone: "danger" | "info" | "muted" | "primary" | "success" | "warning";
  unavailableReason?: string;
};

export type PracticeStatsSummary = {
  detail:
    | Readonly<{ key: string; kind: "key" }>
    | Readonly<{
        correctCount: number;
        incorrectCount: number;
        kind: "algorithm-outcomes";
        partialCount: number;
      }>;
  metricLabel: string;
  metricValue: string;
  trackTitle: string;
};

export type TopicRoadmapNodeModel = {
  detail: TopicRoadmapDetail;
  id: string;
  label: string;
  progress: number;
  status: "completed" | "current" | "available";
  title: string;
  tone: "info" | "muted" | "primary" | "success" | "warning";
};

export type TopicRoadmapDetail =
  | Readonly<{
      description: string;
      kind: "authored";
    }>
  | Readonly<{
      description: string;
      itemCount: number;
      kind: "algorithm-progress";
      practicedItemCount: number;
      skillCount: number;
      skillsTriedCount: number;
    }>;

const cloudTopics: readonly TopicRoadmapNodeModel[] = [
  {
    detail: {
      description: "Environment setup, projects, billing basics, and command-line context.",
      kind: "authored",
    },
    id: "setup_environment",
    label: "Strong",
    progress: 1,
    status: "completed",
    title: "Cloud fundamentals",
    tone: "success",
  },
  {
    detail: {
      description: "Access-control scenarios, IAM roles, and policy decisions.",
      kind: "authored",
    },
    id: "access_security",
    label: "Current",
    progress: 0.42,
    status: "current",
    title: "IAM & Access Control",
    tone: "primary",
  },
  {
    detail: {
      description: "Planning compute resources and implementation tradeoffs.",
      kind: "authored",
    },
    id: "planning_implementation",
    label: "Practicing",
    progress: 0,
    status: "available",
    title: "Compute",
    tone: "info",
  },
  {
    detail: {
      description: "Operations, networking, and day-two reliability scenarios.",
      kind: "authored",
    },
    id: "operations",
    label: "Practicing",
    progress: 0,
    status: "available",
    title: "Networking",
    tone: "info",
  },
];

type PracticeFlowTrack =
  | Readonly<{ display: TrackDisplay; kind: "coding_interview" }>
  | Readonly<{ display: TrackDisplay; kind: "certification" }>;

export function resolvePracticeFlowRegistration(
  registration: TrackRegistration,
): PracticeFlowTrack["kind"] {
  switch (registration.familyId) {
    case "coding_interview":
      switch (registration.id) {
        case CODING_INTERVIEW_TRACK_ID:
          return "coding_interview";
        default:
          throw new UnsupportedTrackError(
            registration.id,
            "Algorithms practice presentation",
          );
      }
    case "certification":
      switch (registration.id) {
        case GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID:
          return "certification";
        default:
          throw new UnsupportedTrackError(
            registration.id,
            "Certification practice presentation",
          );
      }
    default:
      throw new UnknownTrackFamilyError(registration.familyId);
  }
}

function resolvePracticeFlowTrack(trackId: TrackId): PracticeFlowTrack {
  const registration = getTrackRegistration(trackId);
  const kind = resolvePracticeFlowRegistration(registration);

  return {
    display: getTrackDisplay(registration.id),
    kind,
  };
}

export function getCurrentPracticeTopic(
  activeTrack: TrackDisplay,
  trainingAttempts: readonly TrainingAttempt[] = [],
): PracticeTopic {
  const track = resolvePracticeFlowTrack(activeTrack.id);

  switch (track.kind) {
    case "coding_interview": {
      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile.freeNodeId;
      const freeNode = ALGORITHM_ROADMAP.nodes.find((node) => node.id === freeNodeId);
      if (!freeNode) throw new Error("Coding Interview Free package node is absent from the roadmap.");

      return {
        detail: {
          key: "Roadmap item practice for algorithmic problem solving.",
          kind: "key",
        },
        id: freeNode.id,
        title: {
          kind: "authored",
          value: freeNode.label,
        },
      };
    }
    case "certification":
      return {
        detail: {
          key: "Scenario practice across the track domains:",
          kind: "track-context",
          trackTitle: track.display.shortTitle,
        },
        id: "setup_environment",
        title: {
          key: "Cloud fundamentals",
          kind: "translation-key",
        },
      };
  }
}

export function resolvePracticeTopic(input: {
  activeTrackId: TrackId;
  routeTopicId?: string;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeTopic {
  if (input.routeTopicId) {
    const roadmapTopic = buildTopicRoadmapNodes(input).find(
      (candidate) => candidate.id === input.routeTopicId,
    );

    if (roadmapTopic) {
      return {
        detail: roadmapTopic.detail,
        id: roadmapTopic.id,
        title: {
          kind: "authored",
          value: roadmapTopic.title,
        },
      };
    }
  }

  return getCurrentPracticeTopic(
    getTrackDisplay(input.activeTrackId),
    input.trainingAttempts,
  );
}

export function hasTrackProgress(input: {
  activeTrackId: TrackId;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
}): boolean {
  const track = resolvePracticeFlowTrack(input.activeTrackId);

  switch (track.kind) {
    case "coding_interview":
      return input.trainingAttempts.some(
        (attempt) => attempt.trackId === track.display.id,
      );
    case "certification":
      return (
        input.analytics.summary.totalPracticeQuestionsAnswered > 0 ||
        input.analytics.summary.totalCompletedExams > 0
      );
  }
}

export function buildPracticeModes(activeTrack: TrackDisplay, hasReviewEvidence = false): PracticeModeModel[] {
  const track = resolvePracticeFlowTrack(activeTrack.id);
  const profile = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile;
  const availability = (modeId: string) => {
    const mode = profile.getMode(modeId);
    return mode.availability === "immediate" || hasReviewEvidence;
  };

  switch (track.kind) {
    case "coding_interview":
      return [
        { detail: "Learn the approach through the bundled Free node.", enabled: availability(ALGORITHM_MODE_IDS.learnApproach), icon: "practice", mode: ALGORITHM_MODE_IDS.learnApproach, title: getAlgorithmMode(ALGORITHM_MODE_IDS.learnApproach).title, tone: "primary" },
        { detail: "Practice the bundled Free node with guided feedback.", enabled: availability(ALGORITHM_MODE_IDS.guidedPractice), icon: "practice", mode: ALGORITHM_MODE_IDS.guidedPractice, title: getAlgorithmMode(ALGORITHM_MODE_IDS.guidedPractice).title, tone: "success" },
        { detail: "Choose a mental unit and feedback timing within the bundled Free node.", enabled: availability(ALGORITHM_MODE_IDS.customPractice), icon: "clipboard", mode: ALGORITHM_MODE_IDS.customPractice, title: getAlgorithmMode(ALGORITHM_MODE_IDS.customPractice).title, tone: "info" },
        { detail: "Practice Coding Interview review items that are currently due.", enabled: availability(ALGORITHM_MODE_IDS.weakAreaReview), unavailableReason: hasReviewEvidence ? undefined : "No eligible review evidence is available in this Free node.", icon: "rotate-ccw", mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review", tone: "danger" },
      ];
    case "certification":
      return [
        { detail: "Practice the bundled setup-environment node in 10, 20, or 40 questions.", enabled: availability("certification-focus-practice"), icon: "practice", mode: "certification-focus-practice", title: "Focus Practice", tone: "primary" },
        { detail: "Review only saved weak areas whose review time has arrived.", enabled: availability("certification-weak-area-review"), unavailableReason: hasReviewEvidence ? undefined : "No eligible review evidence is available in this Free node.", icon: "rotate-ccw", mode: "certification-weak-area-review", title: "Weak Area Review", tone: "danger" },
        { detail: "Review up to 10 saved weak areas whose review time has arrived.", enabled: availability("certification-quick-review"), unavailableReason: hasReviewEvidence ? undefined : "No due review evidence is available in this Free node.", icon: "rotate-ccw", mode: "certification-quick-review", title: "Quick Review", tone: "danger" },
      ];
  }
}

export function buildPracticeStatsSummary(input: {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  cloudProgress?: CloudCertificationProgressViewModel | null;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeStatsSummary {
  const track = resolvePracticeFlowTrack(input.activeTrack.id);

  switch (track.kind) {
    case "coding_interview": {
      const progress = buildAlgorithmProgressFacts({ attempts: input.trainingAttempts, content: codingPackageContent() });

      return {
        detail: {
          correctCount: progress.correctCount,
          incorrectCount: progress.incorrectCount,
          kind: "algorithm-outcomes",
          partialCount: progress.partialCount,
        },
        metricLabel: "Items practiced",
        metricValue: String(progress.itemsCompleted),
        trackTitle: track.display.shortTitle,
      };
    }
    case "certification": {
      const totalAttempts = input.cloudProgress?.totalAttempts ??
        input.analytics.summary.totalPracticeQuestionsAnswered;

      return {
        detail: {
          key: "Progress, weak areas, and local practice history.",
          kind: "key",
        },
        metricLabel: "Answered",
        metricValue: String(totalAttempts),
        trackTitle: track.display.shortTitle,
      };
    }
  }
}

export function buildTrackProgressPercent(input: {
  activeTrackId: TrackId;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
}): number {
  const track = resolvePracticeFlowTrack(input.activeTrackId);

  switch (track.kind) {
    case "coding_interview": {
      const progress = buildAlgorithmProgressFacts({ attempts: input.trainingAttempts, content: codingPackageContent() });
      const totalItems = progress.nodeProgress.reduce(
        (sum, node) => sum + node.itemCount,
        0,
      );

      return totalItems > 0
        ? Math.round((progress.itemsCompleted / totalItems) * 100)
        : 0;
    }
    case "certification": {
      const answered = input.analytics.summary.totalPracticeQuestionsAnswered;

      return Math.min(100, Math.round((answered / 50) * 100));
    }
  }
}

export function buildTopicRoadmapNodes(input: {
  activeTrackId: TrackId;
  trainingAttempts: readonly TrainingAttempt[];
}): TopicRoadmapNodeModel[] {
  const track = resolvePracticeFlowTrack(input.activeTrackId);

  switch (track.kind) {
    case "certification": {
      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(input.activeTrackId).profile.freeNodeId;
      return cloudTopics.filter((topic) => topic.id === freeNodeId);
    }
    case "coding_interview": {
      const content = codingPackageContent();
      const progress = buildAlgorithmProgressFacts({ attempts: input.trainingAttempts, content });

      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(input.activeTrackId).profile.freeNodeId;
      return ALGORITHM_ROADMAP.nodes.filter((node) => node.id === freeNodeId).flatMap((node) => {
        const itemCount = getAlgorithmItemsForRoadmapNode(node.id, content.items).length;
        if (itemCount === 0) return [];

        const nodeProgress = progress.nodeProgress.find(
          (item) => item.nodeId === node.id,
        );
        const isCurrent = progress.activeRoadmapNode.id === node.id;
        const status = isCurrent ? "current" : "available";

        return {
          detail: {
            description: node.shortDescription,
            itemCount,
            kind: "algorithm-progress",
            practicedItemCount: nodeProgress?.uniquePracticedItemCount ?? 0,
            skillCount:
              nodeProgress?.coreSkillAtomCount ??
              node.skillAtomIds?.length ??
              0,
            skillsTriedCount:
              nodeProgress?.sampledCoreSkillAtomCount ??
              0,
          },
          id: node.id,
          label: isCurrent
            ? "Recommended"
            : nodeProgress && nodeProgress.uniquePracticedItemCount > 0
              ? "Practiced"
              : "Available",
          progress: nodeProgress && nodeProgress.itemCount > 0
            ? nodeProgress.uniquePracticedItemCount / nodeProgress.itemCount
            : 0,
          status,
          title: node.label,
          tone: getTopicTone(status),
        };
      });
    }
  }
}

export function getCloudTopicTitle(topicId: string): string {
  const knownTopic = cloudTopics.find((topic) => topic.id === topicId);

  return knownTopic?.title ?? getDomainLabel(topicId as CertificationDomain);
}

function getTopicTone(status: TopicRoadmapNodeModel["status"]): TopicRoadmapNodeModel["tone"] {
  switch (status) {
    case "completed":
      return "success";
    case "current":
      return "primary";
    case "available":
      return "info";
  }
}
