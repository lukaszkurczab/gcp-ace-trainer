import type { IconName } from "../../components";
import {
  CODING_INTERVIEW_TRACK_ID,
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
import type { CertificationModeId } from "../../tracks/certification";
import { getDesignModeTitle } from "../../tracks/design-interview";
import { getDomainLabel } from "../../utils";
import type { AnalyticsData } from "../analytics/analyticsService";
import type { PracticeSessionMode } from "./sessionConfig";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { AlgorithmQuestion } from "../../tracks/coding-interview/algorithmQuestionTypes";
import { getTrackRoadmapCatalog } from "./trackRoadmapCatalog";

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
  status: "completed" | "current" | "available" | "locked";
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

type PracticeFlowTrack =
  | Readonly<{ display: TrackDisplay; kind: "coding_interview" }>
  | Readonly<{ display: TrackDisplay; kind: "certification" }>
  | Readonly<{ display: TrackDisplay; kind: "design_interview" }>;

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
      if (registration.id === "google-cloud-associate-cloud-engineer") return "certification";
      try {
        contentPackageRuntimeOwner.getPreparedDiscovery(registration.id);
        return "certification";
      } catch {
        throw new UnsupportedTrackError(
          registration.id,
          "Certification practice presentation",
        );
      }
    case "design_interview":
      try {
        contentPackageRuntimeOwner.getPreparedDiscovery(registration.id);
        return "design_interview";
      } catch {
        throw new UnsupportedTrackError(
          registration.id,
          "Design Interview practice presentation",
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
          key: "Practice solving algorithmic problems.",
          kind: "key",
        },
        id: freeNode.id,
        title: {
          kind: "authored",
          value: freeNode.label,
        },
      };
    }
    case "certification": {
      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile.freeNodeId;
      const knownTopic = getTrackRoadmapCatalog(activeTrack.id).find((topic) => topic.id === freeNodeId);
      return {
        detail: {
          key: "Practice this topic in",
          kind: "track-context",
          trackTitle: track.display.shortTitle,
        },
        id: freeNodeId,
        title: { kind: "authored", value: knownTopic?.title ?? getDomainLabel(freeNodeId) },
      };
    }
    case "design_interview": {
      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile.freeNodeId;
      return {
        detail: {
          key: "Practice designing solutions in",
          kind: "track-context",
          trackTitle: track.display.shortTitle,
        },
        id: freeNodeId,
        title: { kind: "authored", value: getTrackRoadmapCatalog(activeTrack.id).find((topic) => topic.id === freeNodeId)?.title ?? getDomainLabel(freeNodeId) },
      };
    }
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
    case "design_interview":
      return input.trainingAttempts.some((attempt) => attempt.trackId === track.display.id);
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
        { detail: "Learn how to solve problems in this topic.", enabled: availability(ALGORITHM_MODE_IDS.learnApproach), icon: "practice", mode: ALGORITHM_MODE_IDS.learnApproach, title: getAlgorithmMode(ALGORITHM_MODE_IDS.learnApproach).title, tone: "primary" },
        { detail: "Practice this topic with explanations after each answer.", enabled: availability(ALGORITHM_MODE_IDS.guidedPractice), icon: "practice", mode: ALGORITHM_MODE_IDS.guidedPractice, title: getAlgorithmMode(ALGORITHM_MODE_IDS.guidedPractice).title, tone: "success" },
        { detail: "Set up your session and choose when to see explanations.", enabled: availability(ALGORITHM_MODE_IDS.customPractice), icon: "clipboard", mode: ALGORITHM_MODE_IDS.customPractice, title: getAlgorithmMode(ALGORITHM_MODE_IDS.customPractice).title, tone: "info" },
        { detail: "Review questions that are ready to revisit.", enabled: availability(ALGORITHM_MODE_IDS.weakAreaReview), unavailableReason: hasReviewEvidence ? undefined : "There are no questions to review right now.", icon: "rotate-ccw", mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review", tone: "danger" },
      ];
    case "certification":
      {
        const diagnosticMode = profile.modes.find((mode) => mode.modeId === "certification-diagnostic-baseline");
        return [
          { detail: "Practice questions from this topic.", enabled: availability("certification-focus-practice"), icon: "practice", mode: "certification-focus-practice", title: "Focus Practice", tone: "primary" },
          ...(diagnosticMode ? [{ detail: "Check your knowledge of this topic with 40 questions.", enabled: availability(diagnosticMode.modeId), icon: "clipboard" as const, mode: diagnosticMode.modeId as CertificationModeId, title: "Diagnostic Baseline", tone: "info" as const }] : []),
          { detail: "Review questions that are ready to revisit.", enabled: availability("certification-weak-area-review"), unavailableReason: hasReviewEvidence ? undefined : "There are no questions to review right now.", icon: "rotate-ccw", mode: "certification-weak-area-review", title: "Weak Area Review", tone: "danger" },
          { detail: "Review a short set of questions that are ready to revisit.", enabled: availability("certification-quick-review"), unavailableReason: hasReviewEvidence ? undefined : "There are no questions to review right now.", icon: "rotate-ccw", mode: "certification-quick-review", title: "Quick Review", tone: "danger" },
        ];
      }
    case "design_interview":
      return [
        { detail: "Learn a step-by-step approach to designing a solution.", enabled: availability("design-interview-learn-framework"), icon: "practice", mode: "design-interview-learn-framework", title: getDesignModeTitle("design-interview-learn-framework"), tone: "primary" },
        { detail: "Practice choosing solutions and weighing architectural tradeoffs.", enabled: availability("design-interview-tradeoff-practice"), icon: "clipboard", mode: "design-interview-tradeoff-practice", title: getDesignModeTitle("design-interview-tradeoff-practice"), tone: "success" },
        { detail: "Review questions that are ready to revisit.", enabled: availability("design-interview-weak-area-review"), unavailableReason: hasReviewEvidence ? undefined : "There are no questions to review right now.", icon: "rotate-ccw", mode: "design-interview-weak-area-review", title: getDesignModeTitle("design-interview-weak-area-review"), tone: "danger" },
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
    case "design_interview": {
      const attemptCount = input.trainingAttempts.filter((attempt) => attempt.trackId === track.display.id).length;
      return {
        detail: { key: "Progress, weak areas, and local Design Interview practice history.", kind: "key" },
        metricLabel: "Answered",
        metricValue: String(attemptCount),
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
    case "design_interview": {
      const answered = input.trainingAttempts.filter((attempt) => attempt.trackId === track.display.id).length;
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
      const attempts = input.trainingAttempts.filter((attempt) => attempt.trackId === input.activeTrackId);
      return getTrackRoadmapCatalog(input.activeTrackId).map((node) => {
        const isFreeNode = node.id === freeNodeId;
        const practiced = isFreeNode ? attempts.filter((attempt) => attempt.item.itemId).length : 0;
        const status = isFreeNode ? "current" : "locked" as const;
        return {
          detail: { description: node.description, kind: "authored" as const },
          id: node.id,
          label: isFreeNode ? (practiced > 0 ? "Practiced" : "Current") : "Locked",
          progress: isFreeNode ? Math.min(1, practiced / 50) : 0,
          status,
          title: node.title,
          tone: getTopicTone(status),
        };
      });
    }
    case "design_interview": {
      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(input.activeTrackId).profile.freeNodeId;
      const practiced = input.trainingAttempts.filter((attempt) => attempt.trackId === input.activeTrackId && attempt.item.itemId).length;
      return getTrackRoadmapCatalog(input.activeTrackId).map((node) => {
        const isFreeNode = node.id === freeNodeId;
        const status = isFreeNode ? "current" : "locked" as const;
        return {
          detail: { description: node.description, kind: "authored" as const },
          id: node.id,
          label: isFreeNode ? (practiced > 0 ? "Practiced" : "Current") : "Locked",
          progress: isFreeNode ? Math.min(1, practiced / 50) : 0,
          status,
          title: node.title,
          tone: getTopicTone(status),
        };
      });
    }
    case "coding_interview": {
      const content = codingPackageContent();
      const progress = buildAlgorithmProgressFacts({ attempts: input.trainingAttempts, content });

      const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(input.activeTrackId).profile.freeNodeId;
      return getTrackRoadmapCatalog(input.activeTrackId).map((node) => {
        const itemCount = getAlgorithmItemsForRoadmapNode(node.id, content.items).length;
        const nodeProgress = progress.nodeProgress.find((item) => item.nodeId === node.id);
        const isFreeNode = node.id === freeNodeId;
        const status = isFreeNode ? "current" : "locked" as const;
        return {
          detail: {
            description: node.description,
            itemCount,
            kind: "algorithm-progress" as const,
            practicedItemCount: nodeProgress?.uniquePracticedItemCount ?? 0,
            skillCount: nodeProgress?.coreSkillAtomCount ?? ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === node.id)?.skillAtomIds?.length ?? 0,
            skillsTriedCount: nodeProgress?.sampledCoreSkillAtomCount ?? 0,
          },
          id: node.id,
          label: isFreeNode ? "Recommended" : "Locked",
          progress: isFreeNode && nodeProgress && nodeProgress.itemCount > 0 ? nodeProgress.uniquePracticedItemCount / nodeProgress.itemCount : 0,
          status,
          title: node.title,
          tone: getTopicTone(status),
        };
      });
    }
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
    case "locked":
      return "muted";
  }
}
