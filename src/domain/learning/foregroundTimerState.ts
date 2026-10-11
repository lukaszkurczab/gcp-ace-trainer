import type { TrackFamilyId, TrackId } from "./trackIdentity";
import type { TrainingSession } from "./trainingSession";

/**
 * The sole durable clock for a foreground-timed session. Wall-clock time
 * identifies checkpoints only; elapsed work is accumulated from a monotonic
 * in-memory segment before each checkpoint.
 */
export type ForegroundTimerState = Readonly<{
  schemaVersion: 1;
  timerVersion: 1;
  familyId: string;
  sessionId: string;
  trackId: TrackId;
  accumulatedForegroundMs: number;
  checkpointRevision: number;
  lastCheckpointAt: string;
  running: boolean;
}>;

export const FOREGROUND_TIMER_CHECKPOINT_INTERVAL_MS = 15_000;
export const FOREGROUND_TIMER_MAX_DRIFT_MS = 1_000;

/** Canonical initial timer derived from a new foreground-timed session; deadline sessions have no foreground timer. */
export function initialForegroundTimerForSession(
  session: Pick<TrainingSession, "id" | "trackId" | "activeForegroundMs" | "startedAt" | "configurationSnapshot">,
  familyId: TrackFamilyId,
): ForegroundTimerState | null {
  const timer = session.configurationSnapshot.timer;
  if (timer !== "elapsedForeground" && timer !== "countdownForeground") return null;
  return createForegroundTimerState({
    schemaVersion: 1,
    timerVersion: 1,
    familyId,
    sessionId: session.id,
    trackId: session.trackId,
    accumulatedForegroundMs: session.activeForegroundMs,
    checkpointRevision: 1,
    lastCheckpointAt: session.startedAt,
    running: false,
  });
}

export function createForegroundTimerState(state: ForegroundTimerState): ForegroundTimerState {
  if (state.schemaVersion !== 1 || state.timerVersion !== 1) throw new Error("Foreground timer schema is unsupported.");
  if (!state.familyId.trim() || !state.sessionId.trim() || !state.trackId.trim()) throw new Error("Foreground timer identity is required.");
  if (!Number.isSafeInteger(state.accumulatedForegroundMs) || state.accumulatedForegroundMs < 0) throw new Error("Foreground timer accumulated duration is invalid.");
  if (!Number.isSafeInteger(state.checkpointRevision) || state.checkpointRevision < 1) throw new Error("Foreground timer checkpoint revision is invalid.");
  if (!state.lastCheckpointAt.trim() || Number.isNaN(Date.parse(state.lastCheckpointAt))) throw new Error("Foreground timer checkpoint time is invalid.");
  if (typeof state.running !== "boolean") throw new Error("Foreground timer running state is invalid.");
  return Object.freeze({ ...state });
}
