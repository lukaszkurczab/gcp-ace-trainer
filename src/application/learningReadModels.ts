import type { TrackId } from "../domain";
import {
  getActiveTrackId,
  getActiveTrainingSession,
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
