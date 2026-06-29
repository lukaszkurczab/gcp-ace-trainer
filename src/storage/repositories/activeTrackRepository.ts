import { DEFAULT_TRACK_ID, isTrackId, type TrackId } from "../../domain";
import {
  readRepositoryJson,
  removeRepositoryJson,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";

const ACTIVE_TRACK_KEY = "ACTIVE_TRACK";

export async function getActiveTrackRepositoryValue(): Promise<StorageRepositoryResult<TrackId>> {
  return readRepositoryJson(
    ACTIVE_TRACK_KEY,
    DEFAULT_TRACK_ID,
    (value): value is TrackId => typeof value === "string" && isTrackId(value),
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
