import type { IconName } from "../../../components";
import type { TrackDisplay, TrainingAttempt, TrainingSession } from "../../../domain";
import type { CodingInterviewDashboard, HomeRecommendationAction as CanonicalHomeRecommendationAction } from "../../../application/coding-interview";
import { ALGORITHM_MODE_IDS, isAlgorithmModeId } from "../../../tracks/coding-interview/domain";
import { getCertificationMode, isCertificationPracticeModeId, type CertificationPracticeModeId } from "../../../tracks/certification";
import { isDesignInterviewModeId, type DesignInterviewModeId } from "../../../tracks/design-interview";
import { buildCertificationPracticeResumeRoute, buildDesignInterviewPracticeResumeRoute } from "../../practice/sessionConfig";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  getCurrentPracticeTopic,
  type PracticeTopicDetail,
  type PracticeTopicTitle,
} from "../../practice/practiceFlowModel";

type HomeRecommendationTone = "info" | "primary" | "warning";

export type CertificationPracticeResumeAction = Readonly<{
  kind: "resume_certification_practice";
  modeId: CertificationPracticeModeId;
  sessionId: string;
  trackId?: TrackDisplay["id"];
}>;

export type DesignInterviewPracticeResumeAction = Readonly<{
  kind: "resume_design_interview";
  modeId: DesignInterviewModeId;
  sessionId: string;
}>;

export type HomeRecommendationAction = CanonicalHomeRecommendationAction | CertificationPracticeResumeAction | DesignInterviewPracticeResumeAction;

export type HomeRecommendationModel = {
  detail: string;
  enabled: boolean;
  icon: IconName;
  label: string;
  primaryLabel: string;
  action: HomeRecommendationAction;
  title: string;
  tone: HomeRecommendationTone;
  unavailableReason?: string;
};

export type HomeTabModel = {
  focusTitle: string;
  heroSubtitle: PracticeTopicDetail;
  heroTitle: PracticeTopicTitle;
  primaryLabel: string;
  recommendations: HomeRecommendationModel[];
  topicId: string;
};

export type BuildHomeTabModelInput = {
  activeTrack: TrackDisplay;
  activeSession?: TrainingSession | null;
  analytics: AnalyticsData;
  algorithmsDashboard: CodingInterviewDashboard | null;
  dashboardError: string | null;
  trainingAttempts: readonly TrainingAttempt[];
};

export function buildHomeTabModel(input: BuildHomeTabModelInput): HomeTabModel {
  const topic = getCurrentPracticeTopic(input.activeTrack, input.trainingAttempts);
  const certificationResume = buildCertificationResumeRecommendation(input);
  const recommendations = certificationResume ? [certificationResume] : buildAlgorithmsRecommendations(input, topic.id);
  const hasProgress = input.trainingAttempts.some((attempt) => attempt.trackId === input.activeTrack.id)
    || (input.activeSession?.status === "active" && input.activeSession.trackId === input.activeTrack.id);
  const learningLabel = hasProgress ? "Continue learning" : "Start learning";

  return {
    focusTitle: input.activeTrack.title,
    heroSubtitle: topic.detail,
    heroTitle: topic.title,
    primaryLabel: learningLabel,
    recommendations,
    topicId: topic.id,
  };
}

function buildCertificationResumeRecommendation(input: BuildHomeTabModelInput): HomeRecommendationModel | null {
  const session = input.activeSession;
  if (!session || session.status !== "active" || session.trackId !== input.activeTrack.id) return null;
  if (input.activeTrack.familyId === "certification" && isCertificationPracticeModeId(session.modeId)) {
    const modeTitle = getCertificationMode(session.modeId).title;
    try {
      buildCertificationPracticeResumeRoute(session);
    } catch {
      return unavailableResumeRecommendation(modeTitle);
    }
    return {
      action: {
        kind: "resume_certification_practice",
        modeId: session.modeId,
        sessionId: session.id,
        ...(input.activeTrack.id === "google-cloud-associate-cloud-engineer" ? {} : { trackId: input.activeTrack.id }),
      },
      detail: `Resume this exact saved ${modeTitle} session at its current question.`,
      enabled: true,
      icon: "practice",
      label: "Continue",
      primaryLabel: "Continue session",
      title: `Continue ${modeTitle}`,
      tone: "primary",
    };
  }
  if (input.activeTrack.familyId !== "design_interview" || !isDesignInterviewModeId(session.modeId)) return null;
  const modeTitle = titleForDesignMode(session.modeId);
  try {
    buildDesignInterviewPracticeResumeRoute(session);
  } catch {
    return unavailableResumeRecommendation(modeTitle);
  }
  return {
    action: { kind: "resume_design_interview", modeId: session.modeId, sessionId: session.id },
    detail: `Resume this exact saved ${modeTitle} session at its current question.`,
    enabled: true,
    icon: "practice",
    label: "Continue",
    primaryLabel: "Continue session",
    title: `Continue ${modeTitle}`,
    tone: "primary",
  };
}

function unavailableResumeRecommendation(modeTitle: string): HomeRecommendationModel {
    const reason = "This saved practice session is incomplete and cannot be resumed.";
    return {
      action: { kind: "unavailable", reason },
      detail: reason,
      enabled: false,
      icon: "alert-triangle",
      label: "Unavailable",
      primaryLabel: "Unavailable",
      title: `Saved ${modeTitle} session unavailable`,
      tone: "warning",
      unavailableReason: reason,
    };
}

function titleForDesignMode(modeId: DesignInterviewModeId): string {
  return modeId.replace(/^design-interview-/, "").replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildAlgorithmsRecommendations(input: BuildHomeTabModelInput, currentNodeId: string): HomeRecommendationModel[] {
  if (input.activeTrack.id !== "coding-interview-dsa-problem-solving") return [];
  if (input.dashboardError) {
    return [{ action: { kind: "unavailable", reason: input.dashboardError }, detail: input.dashboardError, enabled: false, icon: "alert-triangle", label: "Unavailable", primaryLabel: "Unavailable", title: "Recommendation unavailable", tone: "warning", unavailableReason: input.dashboardError }];
  }
  const dashboard = input.algorithmsDashboard;
  if (!dashboard) return [];
  const active = input.activeSession;
  if (active?.status === "active" && active.trackId === input.activeTrack.id) {
    if (dashboard.activeSessionId !== active.id || !isAlgorithmModeId(active.modeId)) return [unavailableResumeRecommendation("Coding Interview")];
    return [{
      action: { kind: "resume_active_practice", sessionId: active.id, trackId: input.activeTrack.id, modeId: active.modeId },
      detail: "Resume the saved Coding Interview session at its current question.",
      enabled: true, icon: "play", label: "Continue", primaryLabel: "Continue session", title: "Continue active session", tone: "primary",
    }];
  }
  if (dashboard.dueReviewCount > 0) return [{
    action: { kind: "start_supported_mode", trackId: input.activeTrack.id, modeId: ALGORITHM_MODE_IDS.weakAreaReview, evidenceSources: ["due_queue"] },
    detail: `${dashboard.dueReviewCount} question${dashboard.dueReviewCount === 1 ? " is" : "s are"} due for review in this track.`,
    enabled: true, icon: "cpu", label: "Due review", primaryLabel: "Start review", title: "Weak Area Review", tone: "primary",
  }];
  return [{
    action: { kind: "start_supported_mode", trackId: input.activeTrack.id, modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: currentNodeId },
    detail: "Practice the track's current mental units with guided feedback.",
    enabled: true, icon: "cpu", label: "Recommended", primaryLabel: "Start session", title: "Guided Practice", tone: "info",
  }];
}
