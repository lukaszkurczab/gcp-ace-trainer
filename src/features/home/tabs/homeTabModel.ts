import type { IconName } from "../../../components";
import type { TrackDefinition } from "../../../domain";
import type { TrainingAttempt } from "../../../domain/training";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  buildRecommendedPracticeModes,
  getCurrentPracticeTopic,
} from "../../practice/practiceFlowModel";
import type { PracticeSessionMode } from "../../practice/sessionConfig";

type HomeRecommendationTone = "info" | "primary" | "warning";

export type HomeRecommendationModel = {
  detail: string;
  enabled: boolean;
  icon: IconName;
  label: string;
  mode: PracticeSessionMode;
  title: string;
  tone: HomeRecommendationTone;
  unavailableReason?: string;
};

export type HomeTabModel = {
  focusTitle: string;
  heroEyebrow: string;
  heroSubtitle: string;
  heroTitle: string;
  primaryLabel: string;
  recommendations: HomeRecommendationModel[];
  topicId: string;
};

export type BuildHomeTabModelInput = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  trainingAttempts: readonly TrainingAttempt[];
};

export function buildHomeTabModel(input: BuildHomeTabModelInput): HomeTabModel {
  const topic = getCurrentPracticeTopic(input.activeTrack, input.trainingAttempts);
  const recommendations = buildRecommendedPracticeModes(input).map((item) => ({
    detail: item.detail,
    enabled: item.enabled,
    icon: item.icon,
    label: item.label,
    mode: item.mode,
    title: item.title,
    tone: item.tone === "danger" || item.tone === "muted" || item.tone === "success"
      ? "warning"
      : item.tone,
    unavailableReason: item.unavailableReason,
  }));
  const hasProgress = recommendations.length > 0;

  return {
    focusTitle: input.activeTrack.title,
    heroEyebrow: "Continue learning",
    heroSubtitle: topic.detail,
    heroTitle: topic.title,
    primaryLabel: hasProgress ? "Continue learning" : "Start learning",
    recommendations,
    topicId: topic.id,
  };
}
