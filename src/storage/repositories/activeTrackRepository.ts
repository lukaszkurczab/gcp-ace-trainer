import { isRegisteredTrackId, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

export async function getActiveTrackId(): Promise<TrackId | null> { return readCanonicalJson(STORAGE_KEYS.ACTIVE_TRACK, (value): value is TrackId => typeof value === "string" && isRegisteredTrackId(value)); }
export async function saveActiveTrackId(trackId: TrackId): Promise<void> {
  if (!isRegisteredTrackId(trackId)) throw new Error(`Active track identity ${trackId} is not registered.`);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRACK, trackId);
}
export async function clearActiveTrackId(): Promise<void> { removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRACK); }
