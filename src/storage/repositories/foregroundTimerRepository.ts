import { createForegroundTimerState, type ForegroundTimerState } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isForegroundTimerState } from "./trainingModelGuards";

/** Repository boundary for the one active simulation foreground timer. */
export async function getActiveForegroundTimer(): Promise<ForegroundTimerState | null> {
  const value = readCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, isForegroundTimerState);
  return value ? createForegroundTimerState(value) : null;
}

export async function saveActiveForegroundTimer(
  timer: ForegroundTimerState,
  expectedPreviousCheckpointRevision: number | null,
): Promise<ForegroundTimerState> {
  if (!isForegroundTimerState(timer)) throw new Error("Foreground timer is invalid.");
  const active = await getActiveTrainingSession();
  if (!active || active.status !== "active") throw new Error("An active training session is required to save a foreground timer.");
  if (timer.sessionId !== active.id || timer.trackId !== active.trackId) throw new Error("Foreground timer scope does not match the active session.");
  const existing = await getActiveForegroundTimer();
  if (existing && (existing.sessionId !== timer.sessionId || existing.trackId !== timer.trackId || existing.familyId !== timer.familyId)) {
    throw new Error("A different active foreground timer is already durable.");
  }
  const previous = existing?.checkpointRevision ?? null;
  if (previous !== expectedPreviousCheckpointRevision) throw new Error("Foreground timer expected checkpoint revision is stale.");
  const durable = createForegroundTimerState({ ...timer, checkpointRevision: (previous ?? 0) + 1 });
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, durable);
  const verified = await getActiveForegroundTimer();
  if (!verified || canonicalSerialize(verified) !== canonicalSerialize(durable)) throw new Error("Foreground timer durable write could not be verified.");
  return durable;
}

export async function clearActiveForegroundTimer(sessionId: string): Promise<void> {
  const timer = await getActiveForegroundTimer();
  if (timer?.sessionId === sessionId) removeCanonicalValue(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
}

export async function clearForegroundTimers(): Promise<void> {
  removeCanonicalValue(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
}
