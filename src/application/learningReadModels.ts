import { projectLearningEvidence } from "./learningPlan/learningEvidenceProjection";
import { LearningProjectionUnavailableError } from "./learningProjectionFailure";
import type { GoalRecord, GoalSnapshot, TrackId, TrainingAttempt, ReviewQueueEntry, TrainingSession } from "../domain";
import { requireGoalPolicy } from "../domain/tracks/trackGoalPolicies";
import type { CodingInterviewDashboard } from "./coding-interview/codingInterviewContracts";
import {
  getCodingInterviewDeclaredScopeOptions,
  type AlgorithmsDeclaredScopeMode,
} from "./coding-interview/codingInterviewDeclaredScope";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getGoal,
  getGoalSnapshot,
  getLearningPlanSnapshot,
  isGoalOnboardingDismissed,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  getTrainingSessionResult,
  dismissGoalOnboarding,
} from "../storage/repositories";
import { readActiveTrackId as readActiveTrackIdFromStorage } from "../storage/repositories/activeTrackRepository";
import { readLearningPlanStorageScope as readLearningPlanStorageScopeFromStorage } from "../storage/repositories/learningPlanInputSnapshot";
import { commitActiveTrackSelection, loadSettledActiveTrackSelection } from "./account/accountDataService";
import { getAttempts, getPracticeHistory } from "../storage/queries";
import type { StorageIssue } from "../storage/repositories/result";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { transitionGoalPlanStatus } from "./learningPlan/goalPlanLifecycle";
import { productionTrackAdmissionContext } from "./tracks/trackAdmissionContext";

/** Application-owned read ports consumed by presentation. */
export type { StorageIssue };

/** Synchronous opaque owner reads used by presentation to reject stale snapshots. */
export function readLearningPlanStorageScope(): object { return readLearningPlanStorageScopeFromStorage(); }
export function readActiveTrackId(): TrackId | null { return readActiveTrackIdFromStorage(); }
export async function loadActiveTrackId() { return loadSettledActiveTrackSelection(); }
export async function selectActiveTrack(trackId: TrackId) { await commitActiveTrackSelection(trackId); }
export async function loadGoal(trackId: TrackId): Promise<GoalRecord | null> { return getGoal(trackId, requireGoalPolicy(trackId)); }
export async function persistGoalPlanStatus(trackId: TrackId) { return transitionGoalPlanStatus(trackId); }
export async function loadGoalSnapshot(trackId: TrackId): Promise<GoalSnapshot | null> { return getGoalSnapshot(trackId, requireGoalPolicy(trackId)); }
export async function loadLearningPlan(trackId: TrackId) { return getLearningPlanSnapshot(trackId, requireGoalPolicy(trackId)); }
export function loadGoalOnboardingDismissed(trackId: TrackId): boolean { return isGoalOnboardingDismissed(trackId); }
export function persistGoalOnboardingDismissal(trackId: TrackId): void { dismissGoalOnboarding(trackId); }
export async function loadExamSummaries() { return getAttempts(productionTrackAdmissionContext); }
export async function loadPracticeHistory() { return getPracticeHistory(productionTrackAdmissionContext); }
export async function loadTrainingAttempts() { return getTrainingAttempts(productionTrackAdmissionContext); }
export async function loadReviewQueueItems() { return getReviewQueueItems(productionTrackAdmissionContext); }
export async function loadActiveTrainingSession() { return getActiveTrainingSession(productionTrackAdmissionContext); }
export async function loadActiveTrainingSessionDraft() { return getActiveTrainingSessionDraft(productionTrackAdmissionContext); }
export async function loadTrainingSession(sessionId: string) { return (await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === sessionId) ?? null; }
export async function loadTrainingSessionResult(sessionId: string) { return getTrainingSessionResult(sessionId, productionTrackAdmissionContext); }

/** Typed Home read. Presentation receives the family dashboard, never its runtime or repositories. */
export async function loadCodingInterviewDashboard(input: Readonly<{ attempts: readonly TrainingAttempt[]; reviews: readonly ReviewQueueEntry[]; activeSession: TrainingSession | null; now: string }>): Promise<CodingInterviewDashboard> {
  const resolved = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  const evidence = projectLearningEvidence({ profile: resolved.track, attempts: input.attempts, reviews: input.reviews, now: input.now });
  const dashboard = await resolved.runtime.queryDashboard({ trackId: "coding-interview-dsa-problem-solving", attempts: evidence.attempts, reviews: evidence.reviews, activeSession: input.activeSession, now: input.now });
  if (!isCodingInterviewDashboard(dashboard)) throw new LearningProjectionUnavailableError("coding_dashboard");
  return dashboard;
}

export async function loadAlgorithmsDeclaredScopeOptions(input: Readonly<{ modeId: AlgorithmsDeclaredScopeMode; targetMentalUnitId?: string }>) {
  return getCodingInterviewDeclaredScopeOptions(input);
}

function isCodingInterviewDashboard(value: unknown): value is CodingInterviewDashboard {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const dashboard = value as Record<string, unknown>;
  return dashboard.trackId === "coding-interview-dsa-problem-solving"
    && Number.isSafeInteger(dashboard.attemptCount) && Number(dashboard.attemptCount) >= 0
    && Number.isSafeInteger(dashboard.dueReviewCount) && Number(dashboard.dueReviewCount) >= 0
    && Number.isSafeInteger(dashboard.manualReviewCount) && Number(dashboard.manualReviewCount) >= 0
    && (dashboard.activeSessionId === undefined || (typeof dashboard.activeSessionId === "string" && dashboard.activeSessionId.length > 0));
}
