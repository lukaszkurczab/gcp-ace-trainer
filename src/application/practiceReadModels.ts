import {
  loadActiveTrackId,
  loadReviewQueueItems,
  loadTrainingAttempts,
} from "./learningReadModels";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { contentPackagePinsEqual, type ContentPackagePin, type ReviewQueueEntry, type TrackId, type TrainingAttempt } from "../domain";

import { StorageReadError } from "../storage/errors";

export const STORED_TRACK_REQUEST_KEY = "stored-track" as const;
export type PracticeRequestKey = TrackId | typeof STORED_TRACK_REQUEST_KEY;

export type PracticeReadData = Readonly<{
  activeTrackId: TrackId | null;
  hasReviewEvidence: boolean;
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

  const packagePin = activeTrackId && includeReviews
    ? contentPackageRuntimeOwner.getPreparedDiscovery(activeTrackId).package.packagePin
    : null;
  const now = input.now ?? Date.now();

  return {
    activeTrackId: activeTrackId ?? null,
    hasReviewEvidence: activeTrackId !== null && packagePin !== null && reviewResult !== undefined
      ? reviewResult.value.some((entry) => isDueReviewForTrack(entry, activeTrackId, packagePin, now))
      : false,
    trainingAttempts: trainingAttemptsResult.value,
  };
}

function assertReadable<T>(result: { issues?: readonly { message: string }[]; value: T }, source: string): asserts result is { value: T } {
  if (result.issues && result.issues.length > 0) {
    throw new StorageReadError(source, result.issues);
  }
}

function isDueReviewForTrack(
  entry: ReviewQueueEntry,
  activeTrackId: TrackId,
  packagePin: ContentPackagePin,
  now: number,
): boolean {
  return entry.trackId === activeTrackId &&
    contentPackagePinsEqual(entry.sourceItem.packagePin, packagePin) &&
    Date.parse(entry.dueAt) <= now;
}
