import { isRegisteredTrackId, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";

export async function getActiveTrackId(): Promise<TrackId | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_TRACK, (value): value is TrackId => typeof value === "string" && isRegisteredTrackId(value)); }
export async function saveActiveTrackId(trackId: TrackId): Promise<void> { writeStoredJson(STORAGE_KEYS.ACTIVE_TRACK, trackId); }
export async function clearActiveTrackId(): Promise<void> { removeStoredValue(STORAGE_KEYS.ACTIVE_TRACK); }
