import type { TrackDisplay, TrainingSession } from "../../domain";
import type { CodingInterviewDashboard } from "./codingInterviewContracts";
import { ALGORITHM_MODE_IDS, isAlgorithmModeId } from "../../tracks/coding-interview/domain";
import type { HomeRecommendationProjection as HomeRecommendationModel } from "../homePracticeProjection";

export function projectCodingHomeRecommendation(input: Readonly<{ activeTrack: TrackDisplay; activeSession?: TrainingSession | null; algorithmsDashboard: CodingInterviewDashboard | null; dashboardError: string | null }>, currentNodeId: string): HomeRecommendationModel[] {
  if (input.activeTrack.id !== "coding-interview-dsa-problem-solving") return [];
  if (input.dashboardError) {
    return [{ action: { kind: "unavailable", reason: input.dashboardError }, detail: input.dashboardError, enabled: false, icon: "alert-triangle", label: "Unavailable", primaryLabel: "Unavailable", title: "Recommendation unavailable", tone: "warning", unavailableReason: input.dashboardError }];
  }
  const dashboard = input.algorithmsDashboard;
  if (!dashboard) return [];
  const active = input.activeSession;
  if (active?.status === "active" && active.trackId === input.activeTrack.id) {
    if (dashboard.activeSessionId !== active.id || !isAlgorithmModeId(active.modeId)) return [unavailableCodingResumeRecommendation()];
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
  if (dashboard.manualReviewCount > 0) return [{
    action: { kind: "start_supported_mode", trackId: input.activeTrack.id, modeId: ALGORITHM_MODE_IDS.weakAreaReview, evidenceSources: ["due_queue"], reviewSource: "manual_request" },
    detail: `${dashboard.manualReviewCount} question${dashboard.manualReviewCount === 1 ? " is" : "s are"} ready for a manual review request before its scheduled date.`,
    enabled: true, icon: "cpu", label: "Review now", primaryLabel: "Start review", title: "Requested review", tone: "primary",
  }];
  return [{
    action: { kind: "start_supported_mode", trackId: input.activeTrack.id, modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: currentNodeId },
    detail: "Practice the track's current mental units with guided feedback.",
    enabled: true, icon: "cpu", label: "Recommended", primaryLabel: "Start session", title: "Guided Practice", tone: "info",
  }];
}

function unavailableCodingResumeRecommendation(): HomeRecommendationModel {
  const reason = "This saved practice session is incomplete and cannot be resumed.";
  return { action: { kind: "unavailable", reason }, detail: reason, enabled: false, icon: "alert-triangle", label: "Unavailable", primaryLabel: "Unavailable", title: "Saved Coding Interview session unavailable", tone: "warning", unavailableReason: reason };
}
