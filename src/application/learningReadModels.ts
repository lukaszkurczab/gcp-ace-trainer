import type { GoalRecord, GoalSnapshot, TrackId } from "../domain";
import { getTrainingLifecycleUseCases } from "./trainingLifecycle";
import type { CodingInterviewDashboard } from "./coding-interview/codingInterviewContracts";
import {
  getCodingInterviewDeclaredScopeOptions,
  type AlgorithmsDeclaredScopeMode,
} from "./coding-interview/codingInterviewDeclaredScope";
import {
  getActiveTrackId,
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getGoal,
  getGoalSnapshot,
  isGoalOnboardingDismissed,
  getReviewQueueItems,
  getTrainingAttempts,
  saveActiveTrackId,
  saveGoal,
  saveGoalSnapshot,
  dismissGoalOnboarding,
} from "../storage/repositories";
import { getAttempts, getPracticeHistory } from "../storage/queries";
import type { StorageIssue } from "../storage/repositories/result";
import {
  buildCloudCertificationProgressViewModel,
  type CloudCertificationProgressViewModel,
} from "../tracks/certification";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";

/** Application-owned read ports consumed by presentation. */
export type { StorageIssue };

export async function loadActiveTrackId() { return getActiveTrackId(); }
export async function selectActiveTrack(trackId: TrackId) { await saveActiveTrackId(trackId); }
export async function loadGoal(trackId: TrackId): Promise<GoalRecord | null> { return getGoal(trackId); }
export async function persistGoal(goal: GoalRecord): Promise<void> { await saveGoal(goal); }
export async function loadGoalSnapshot(trackId: TrackId): Promise<GoalSnapshot | null> { return getGoalSnapshot(trackId); }
export async function persistGoalSnapshot(goal: GoalRecord, expectedRevision: number | null): Promise<GoalSnapshot> { return saveGoalSnapshot(goal, expectedRevision); }
export function loadGoalOnboardingDismissed(trackId: TrackId): boolean { return isGoalOnboardingDismissed(trackId); }
export function persistGoalOnboardingDismissal(trackId: TrackId): void { dismissGoalOnboarding(trackId); }
export async function loadExamSummaries() { return getAttempts(); }
export async function loadPracticeHistory() { return getPracticeHistory(); }
export async function loadTrainingAttempts() { return getTrainingAttempts(); }
export async function loadReviewQueueItems() { return getReviewQueueItems(); }
export async function loadActiveTrainingSession() { return getActiveTrainingSession(); }
export async function loadActiveTrainingSessionDraft() { return getActiveTrainingSessionDraft(); }

/** Typed Home read. Presentation receives the family dashboard, never its runtime or repositories. */
export async function loadCodingInterviewDashboard(): Promise<CodingInterviewDashboard> {
  const dashboard = await getTrainingLifecycleUseCases().queryDashboard("coding-interview-dsa-problem-solving");
  if (!isCodingInterviewDashboard(dashboard)) throw new Error("Algorithms dashboard returned an unsupported projection.");
  return dashboard;
}

export async function loadAlgorithmsDeclaredScopeOptions(input: Readonly<{ modeId: AlgorithmsDeclaredScopeMode; targetMentalUnitId?: string }>) {
  return getCodingInterviewDeclaredScopeOptions(input);
}

export async function loadCloudCertificationProgress(input: { now?: string; recentAttemptCount?: number } = {}): Promise<CloudCertificationProgressViewModel> {
  const [attempts, reviews] = await Promise.all([getTrainingAttempts(), getReviewQueueItems()]);
  return buildCloudCertificationProgressViewModel({
    attempts: attempts.value,
    issues: [...(attempts.issues ?? []), ...(reviews.issues ?? [])],
    now: input.now,
    packagePin: contentPackageRuntimeOwner.getPreparedDiscovery("google-cloud-associate-cloud-engineer").track.packagePin,
    recentAttemptCount: input.recentAttemptCount,
    reviewQueueItems: reviews.value,
  });
}

function isCodingInterviewDashboard(value: unknown): value is CodingInterviewDashboard {
  if (!value || typeof value !== "object" || !("recommendation" in value)) return false;
  const recommendation = value.recommendation;
  return Boolean(recommendation && typeof recommendation === "object" && "action" in recommendation && "explanation" in recommendation && "reason" in recommendation);
}
