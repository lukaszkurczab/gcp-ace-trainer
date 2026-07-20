import type { TrackId } from "../domain";
import { getTrainingLifecycleUseCases } from "./trainingLifecycle";
import { getAlgorithmsDeclaredScopeOptions, type AlgorithmsDashboard, type AlgorithmsDeclaredScopeMode } from "./algorithms";
import {
  getActiveTrackId,
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  saveActiveTrackId,
} from "../storage/repositories";
import { getAttempts, getPracticeHistory } from "../storage/queries";
import type { StorageIssue } from "../storage/repositories/result";
import {
  buildCloudCertificationProgressViewModel,
  type CloudCertificationProgressViewModel,
} from "../tracks/cloud-certification";

/** Application-owned read ports consumed by presentation. */
export type { StorageIssue };

export async function loadActiveTrackId() { return getActiveTrackId(); }
export async function selectActiveTrack(trackId: TrackId) { await saveActiveTrackId(trackId); }
export async function loadExamSummaries() { return getAttempts(); }
export async function loadPracticeHistory() { return getPracticeHistory(); }
export async function loadTrainingAttempts() { return getTrainingAttempts(); }
export async function loadReviewQueueItems() { return getReviewQueueItems(); }
export async function loadActiveTrainingSession() { return getActiveTrainingSession(); }
export async function loadActiveTrainingSessionDraft() { return getActiveTrainingSessionDraft(); }

/** Typed Home read. Presentation receives the family dashboard, never its runtime or repositories. */
export async function loadAlgorithmsDashboard(): Promise<AlgorithmsDashboard> {
  const dashboard = await getTrainingLifecycleUseCases().queryDashboard("algorithms");
  if (!isAlgorithmsDashboard(dashboard)) throw new Error("Algorithms dashboard returned an unsupported projection.");
  return dashboard;
}

export async function loadAlgorithmsDeclaredScopeOptions(input: Readonly<{ modeId: AlgorithmsDeclaredScopeMode; targetMentalUnitId?: string }>) {
  return getAlgorithmsDeclaredScopeOptions(input);
}

export async function loadCloudCertificationProgress(input: { now?: string; recentAttemptCount?: number } = {}): Promise<CloudCertificationProgressViewModel> {
  const [attempts, reviews] = await Promise.all([getTrainingAttempts(), getReviewQueueItems()]);
  return buildCloudCertificationProgressViewModel({
    attempts: attempts.value,
    issues: [...(attempts.issues ?? []), ...(reviews.issues ?? [])],
    now: input.now,
    recentAttemptCount: input.recentAttemptCount,
    reviewQueueItems: reviews.value,
  });
}

function isAlgorithmsDashboard(value: unknown): value is AlgorithmsDashboard {
  if (!value || typeof value !== "object" || !("recommendation" in value)) return false;
  const recommendation = value.recommendation;
  return Boolean(recommendation && typeof recommendation === "object" && "action" in recommendation && "explanation" in recommendation && "reason" in recommendation);
}
