import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import type { IconName } from "../../../components";
import type { AnalyticsData } from "../../analytics/analyticsService";

type HomePrimaryAction = "open_practice_tab" | "start_cloud_practice";
type HomeRecommendationTone = "info" | "primary" | "warning";

export type HomeRecommendationModel = {
  detail: string;
  icon: IconName;
  label: string;
  title: string;
  tone: HomeRecommendationTone;
};

export type HomeTabModel = {
  focusTitle: string;
  heroEyebrow: string;
  heroSubtitle: string;
  heroTitle: string;
  primaryAction: HomePrimaryAction;
  primaryLabel: string;
  recommendations: HomeRecommendationModel[];
};

export type BuildHomeTabModelInput = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
};

export function buildHomeTabModel(input: BuildHomeTabModelInput): HomeTabModel {
  if (input.activeTrack.id === ALGORITHMS_TRACK_ID) {
    return buildAlgorithmsHomeModel(input.activeTrack);
  }

  return buildCloudHomeModel(input.analytics);
}

function buildCloudHomeModel(analytics: AnalyticsData): HomeTabModel {
  const hasPractice = analytics.summary.totalPracticeQuestionsAnswered > 0;
  const hasExams = analytics.summary.totalCompletedExams > 0;

  return {
    focusTitle: "Cloud Certification",
    heroEyebrow: "Continue learning",
    heroSubtitle: "Resume your last Cloud Certification topic or choose another area before starting.",
    heroTitle: "IAM policies",
    primaryAction: "start_cloud_practice",
    primaryLabel: "Start learning",
    recommendations: [
      {
        detail:
          hasPractice || hasExams
            ? "Suggested from local attempts and practice records."
            : "Suggested because of recent practice gaps.",
        icon: "cloud",
        label: "Recommended",
        title: "Review IAM policies",
        tone: "primary",
      },
      {
        detail: "Concepts will appear after practice history is available.",
        icon: "rotate-ccw",
        label: "After practice",
        title: "Due for review",
        tone: "info",
      },
      {
        detail: "Access-control scenarios from Cloud Certification practice.",
        icon: "cloud",
        label: "Focus area",
        title: "IAM roles",
        tone: "warning",
      },
    ],
  };
}

function buildAlgorithmsHomeModel(activeTrack: TrackDefinition): HomeTabModel {
  return {
    focusTitle: activeTrack.title,
    heroEyebrow: "Draft track",
    heroSubtitle: "Pattern recognition and complexity reasoning are being prepared.",
    heroTitle: "Algorithms track",
    primaryAction: "open_practice_tab",
    primaryLabel: "View draft modes",
    recommendations: [
      {
        detail: "Learn core problem-solving patterns before timed practice is enabled.",
        icon: "route",
        label: "Draft",
        title: "Pattern fundamentals",
        tone: "primary",
      },
      {
        detail: "Practice choosing an approach once original Algorithms items are available.",
        icon: "practice",
        label: "Planned",
        title: "Strategy recognition",
        tone: "info",
      },
      {
        detail: "Time and space analysis will appear after Algorithms sessions are implemented.",
        icon: "progress",
        label: "Planned",
        title: "Complexity reasoning",
        tone: "warning",
      },
    ],
  };
}

export function isCloudHomePracticeAction(model: HomeTabModel): boolean {
  return model.primaryAction === "start_cloud_practice";
}

export function isAlgorithmsTrack(track: TrackDefinition): boolean {
  return track.id === ALGORITHMS_TRACK_ID;
}

export function isCloudTrack(track: TrackDefinition): boolean {
  return track.id === CLOUD_CERTIFICATION_TRACK_ID;
}
