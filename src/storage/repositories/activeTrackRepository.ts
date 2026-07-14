import { isRegisteredTrackId, type TrackId } from "../../domain";
import {
  readRepositoryJson,
  removeRepositoryJson,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";

const ACTIVE_TRACK_KEY = "ACTIVE_TRACK";

export async function getActiveTrackRepositoryValue(): Promise<StorageRepositoryResult<TrackId | null>> {
  return readRepositoryJson(
    ACTIVE_TRACK_KEY,
    null,
    (value): value is TrackId | null => value === null || (typeof value === "string" && isRegisteredTrackId(value)),
  );
}

export async function saveActiveTrackRepositoryValue(
  trackId: TrackId,
): Promise<StorageRepositoryResult<TrackId>> {
  return writeRepositoryJson(ACTIVE_TRACK_KEY, trackId);
}

export async function clearActiveTrackRepositoryValue(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(ACTIVE_TRACK_KEY);
}
