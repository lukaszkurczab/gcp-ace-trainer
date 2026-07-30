import type { IconName } from "../../../components";
import type { TrackDisplay, TrainingAttempt } from "../../../domain";
import type { AlgorithmsRecommendationAction, AlgorithmsDashboard } from "../../../application/algorithms";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  getCurrentPracticeTopic,
  type PracticeTopicDetail,
  type PracticeTopicTitle,
} from "../../practice/practiceFlowModel";

type HomeRecommendationTone = "info" | "primary" | "warning";

export type HomeRecommendationModel = {
  detail: string;
  enabled: boolean;
  icon: IconName;
  label: string;
  primaryLabel: string;
  action: AlgorithmsRecommendationAction;
  title: string;
  tone: HomeRecommendationTone;
  unavailableReason?: string;
};

export type HomeTabModel = {
  focusTitle: string;
  heroEyebrow: string;
  heroSubtitle: PracticeTopicDetail;
  heroTitle: PracticeTopicTitle;
  primaryLabel: string;
  recommendations: HomeRecommendationModel[];
  topicId: string;
};

export type BuildHomeTabModelInput = {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  algorithmsDashboard: AlgorithmsDashboard | null;
  dashboardError: string | null;
  trainingAttempts: readonly TrainingAttempt[];
};

export function buildHomeTabModel(input: BuildHomeTabModelInput): HomeTabModel {
  const topic = getCurrentPracticeTopic(input.activeTrack, input.trainingAttempts);
  const recommendations = buildAlgorithmsRecommendations(input);
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

function buildAlgorithmsRecommendations(input: BuildHomeTabModelInput): HomeRecommendationModel[] {
  if (input.activeTrack.id !== "algorithms") return [];
  if (input.dashboardError) {
    return [{ action: { kind: "unavailable", reason: input.dashboardError }, detail: input.dashboardError, enabled: false, icon: "alert-triangle", label: "Unavailable", primaryLabel: "Unavailable", title: "Recommendation unavailable", tone: "warning", unavailableReason: input.dashboardError }];
  }
  const recommendation = input.algorithmsDashboard?.recommendation;
  if (!recommendation) return [];
  const unavailableReason = recommendation.action.kind === "unavailable" ? recommendation.action.reason : undefined;
  return [{
    action: recommendation.action,
    detail: recommendation.explanation,
    enabled: !unavailableReason,
    icon: iconFor(recommendation.reason),
    label: labelFor(recommendation.reason),
    primaryLabel: primaryLabelFor(recommendation.reason),
    title: titleFor(recommendation.reason),
    tone: recommendation.reason === "active_session" || recommendation.reason === "overdue_review" || recommendation.reason === "repeated_mistake" ? "primary" : "info",
    unavailableReason,
  }];
}

function primaryLabelFor(reason: AlgorithmsDashboard["recommendation"]["reason"]): string {
  if (reason === "active_session") return "Continue session";
  if (reason === "overdue_review" || reason === "repeated_mistake") return "Start review";
  if (reason === "learn_approach") return "Start learning";
  if (reason === "guided_practice") return "Start guided practice";
  if (reason === "contrast_practice") return "Start contrast practice";
  if (reason === "recognize_patterns") return "Start pattern practice";
  return "Choose practice scope";
}

function iconFor(reason: AlgorithmsDashboard["recommendation"]["reason"]): IconName {
  if (reason === "active_session") return "practice";
  if (reason === "overdue_review" || reason === "repeated_mistake") return "rotate-ccw";
  return "route";
}

function labelFor(reason: AlgorithmsDashboard["recommendation"]["reason"]): string {
  if (reason === "active_session") return "Continue";
  if (reason === "overdue_review") return "Due review";
  if (reason === "repeated_mistake") return "Priority review";
  return "Recommended";
}

function titleFor(reason: AlgorithmsDashboard["recommendation"]["reason"]): string {
  if (reason === "active_session") return "Continue active session";
  if (reason === "overdue_review" || reason === "repeated_mistake") return "Weak Area Review";
  if (reason === "learn_approach") return "Learn Approach";
  if (reason === "guided_practice") return "Guided Practice";
  if (reason === "contrast_practice") return "Contrast Practice";
  if (reason === "recognize_patterns") return "Recognize Patterns";
  return "Independent Practice";
}
