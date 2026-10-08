import {
  loadActiveTrackId,
  loadReviewQueueItems,
  loadTrainingAttempts,
} from "./learningReadModels";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { isActiveReviewQueueEntry, manualRequestIdForEntry, type ReviewQueueEntry, type TrackId, type TrainingAttempt } from "../domain";

import { StorageReadError } from "../storage/errors";

export const STORED_TRACK_REQUEST_KEY = "stored-track" as const;
export type PracticeRequestKey = TrackId | typeof STORED_TRACK_REQUEST_KEY;

export type PracticeReadData = Readonly<{
  activeTrackId: TrackId | null;
  hasReviewEvidence: boolean;
  reviewSource?: "due_queue" | "manual_request";
  trainingAttempts: readonly TrainingAttempt[];
}>;

export type PracticeReadPorts = Readonly<{
  getActiveTrackId: typeof loadActiveTrackId;
  getReviewQueueItems: typeof loadReviewQueueItems;
  getTrainingAttempts: typeof loadTrainingAttempts;
}>;

const defaultPorts: PracticeReadPorts = {
  getActiveTrackId: loadActiveTrackId,
  getReviewQueueItems: loadReviewQueueItems,
  getTrainingAttempts: loadTrainingAttempts,
};

export async function loadPracticeReadData(
  input: Readonly<{
    includeReviews?: boolean;
    now?: number;
    requestedTrackId?: TrackId;
  }>,
  ports: PracticeReadPorts = defaultPorts,
): Promise<PracticeReadData> {
  const includeReviews = input.includeReviews ?? false;
  const activeTrackIdPromise = input.requestedTrackId
    ? Promise.resolve(input.requestedTrackId)
    : ports.getActiveTrackId();

  const [activeTrackId, trainingAttemptsResult, reviewResult] = await Promise.all([
    activeTrackIdPromise,
    ports.getTrainingAttempts(),
    includeReviews ? ports.getReviewQueueItems() : Promise.resolve(undefined),
  ]);

  assertReadable(trainingAttemptsResult, "training attempts");
  if (reviewResult) assertReadable(reviewResult, "review queue");

  const track = activeTrackId && includeReviews ? contentPackageRuntimeOwner.getPreparedDiscovery(activeTrackId).track : null;
  const now = input.now ?? Date.now();

  const trackReviews = activeTrackId !== null && track !== null && reviewResult !== undefined
    ? reviewResult.value.filter((entry) => entry.trackId === activeTrackId && entry.sourceItem.trackId === activeTrackId &&
      entry.sourceItem.contentVersion === track.contentVersion && entry.sourceItem.artifactSha256 === track.artifactSha256 && isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined)
    : [];
  const dueReview = trackReviews.some((entry) => Date.parse(entry.dueAt!) <= now);
  const manualRequest = !dueReview && trackReviews.some((entry) => Date.parse(entry.dueAt!) > now && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined);
  const reviewSource = dueReview ? "due_queue" : manualRequest ? "manual_request" : undefined;
  return {
    activeTrackId: activeTrackId ?? null,
    hasReviewEvidence: reviewSource !== undefined,
    ...(reviewSource ? { reviewSource } : {}),
    trainingAttempts: trainingAttemptsResult.value,
  };
}

function assertReadable<T>(result: { issues?: readonly { message: string }[]; value: T }, source: string): asserts result is { value: T } {
  if (result.issues && result.issues.length > 0) {
    throw new StorageReadError(source, result.issues);
  }
}
