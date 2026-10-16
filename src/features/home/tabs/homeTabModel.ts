import { projectCodingHomeRecommendation } from "../../../application/coding-interview/codingHomeRecommendation";
import type { IconName } from "../../../components";
import type { TrackDisplay, TrainingAttempt, TrainingSession } from "../../../domain";
import type { CodingInterviewDashboard, HomeRecommendationAction as CanonicalHomeRecommendationAction } from "../../../application/coding-interview";
import { getCertificationMode, isCertificationPracticeModeId, type CertificationPracticeModeId } from "../../../tracks/certification";
import { isDesignInterviewModeId, type DesignInterviewModeId } from "../../../tracks/design-interview";
import { buildCertificationPracticeResumeRoute, buildDesignInterviewPracticeResumeRoute, buildDesignInterviewSimulationResumeRoute } from "../../practice/sessionConfig";
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

export type HomeRecommendationAction = Readonly<{ kind: "start_certification_due_review"; trackId: TrackDisplay["id"] }> | Readonly<{ kind: "start_single_case"; caseId: string; nodeId: string; decisionCount: number }> | CanonicalHomeRecommendationAction | CertificationPracticeResumeAction | DesignInterviewPracticeResumeAction;

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
  currentNodeId?: string;
  activeSession?: TrainingSession | null;
  algorithmsDashboard: CodingInterviewDashboard | null;
  dashboardError: string | null;
  dueReviewRecommendation?: HomeRecommendationModel | null;
  singleCaseRecommendation?: HomeRecommendationModel | null;
  trainingAttempts: readonly TrainingAttempt[];
};

export function buildHomeTabModel(input: BuildHomeTabModelInput): HomeTabModel {
  const topic = getCurrentPracticeTopic(input.activeTrack, input.trainingAttempts);
  const certificationResume = buildCertificationResumeRecommendation(input);
  const recommendations = certificationResume ? [certificationResume] : input.dueReviewRecommendation ? [input.dueReviewRecommendation] : input.singleCaseRecommendation ? [input.singleCaseRecommendation] : projectCodingHomeRecommendation(input, input.currentNodeId ?? topic.id);
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
  if (session.modeId === "design-interview-simulation") {
    try {
      buildDesignInterviewSimulationResumeRoute(session);
    } catch {
      return unavailableResumeRecommendation(modeTitle);
    }
  }
  try {
    if (session.modeId !== "design-interview-simulation") buildDesignInterviewPracticeResumeRoute(session);
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

export function homePlanPlacement(input: Readonly<{ hasActiveSession: boolean; hasPracticeRecommendation: boolean; planKind: "ready" | "unavailable" | "none" | undefined }>): "primary" | "secondary" | "hidden" {
  if (input.hasActiveSession || !input.planKind || input.planKind === "none") return "hidden";
  return input.hasPracticeRecommendation ? "secondary" : "primary";
}
