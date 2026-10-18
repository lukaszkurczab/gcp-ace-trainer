export { getForegroundTimerStorageAuthority } from "../../infrastructure/storage/mmkvClient";
import { getActiveForegroundClock } from "../../infrastructure/storage/mmkvClient";
import type { ForegroundClockCapability } from "../../infrastructure/storage/foregroundClockCapability";

import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { createForegroundTimerState, getTrackRegistration, initialForegroundTimerForSession, type ForegroundTimerState, type TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { CANONICAL_RECORD_SCHEMA, applyCanonicalPhysicalWrite, readCanonicalJson, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { readActiveTrainingSession, getActiveTrainingSession } from "./trainingSessionRepository";
import { isAcceptedSimulationFinalization, isForegroundTimerState, isTrainingSession, isTrainingSessionDraftState } from "./trainingModelGuards";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

/** Read-only view of the existing native owner; preserves owner identity. */
export function getActiveForegroundClockForProbe(): Pick<ForegroundClockCapability, "read" | "elapsed" | "metrics"> {
  return getActiveForegroundClock();
}

/** Pure canonical read used by snapshot consumers; performs no checkpoint or migration. */
export function readActiveForegroundTimer(admission: TrackAdmissionContext): ForegroundTimerState | null {
  const value = readCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, (candidate): candidate is ForegroundTimerState => isForegroundTimerState(candidate, admission));
  return value ? createForegroundTimerState(value) : null;
}

/** Repository boundary for the one active session foreground timer. */
export async function getActiveForegroundTimer(admission: TrackAdmissionContext): Promise<ForegroundTimerState | null> {
  return readActiveForegroundTimer(admission);
}

export async function saveActiveForegroundTimer(
  timer: ForegroundTimerState,
  expectedPreviousCheckpointRevision: number | null,
  admission: TrackAdmissionContext,
): Promise<ForegroundTimerState> {
  if (!isForegroundTimerState(timer, admission)) throw new Error("Foreground timer is invalid.");
  const accepted = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, (value): value is import("../../domain").TrainingSessionDraftState => isTrainingSessionDraftState(value, admission));
  if (accepted && isAcceptedSimulationFinalization(accepted, admission) && accepted.acceptance.sessionId === timer.sessionId) {
    throw new Error("An accepted simulation finalization freezes its session timer until recovery completes.");
  }
  const active = await getActiveTrainingSession(admission);
  if (!active || active.status !== "active") throw new Error("An active training session is required to save a foreground timer.");
  if (timer.sessionId !== active.id || timer.trackId !== active.trackId) throw new Error("Foreground timer scope does not match the active session.");
  const existing = await getActiveForegroundTimer(admission);
  if (existing && (existing.sessionId !== timer.sessionId || existing.trackId !== timer.trackId || existing.familyId !== timer.familyId)) {
    throw new Error("A different active foreground timer is already durable.");
  }
  const previous = existing?.checkpointRevision ?? null;
  if (previous !== expectedPreviousCheckpointRevision) throw new Error("Foreground timer expected checkpoint revision is stale.");
  const durable = createForegroundTimerState({ ...timer, checkpointRevision: (previous ?? 0) + 1 });
  assertNoAcceptedSimulationFinalization(timer.sessionId, admission);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, durable);
  const verified = await getActiveForegroundTimer(admission);
  if (!verified || canonicalSerialize(verified) !== canonicalSerialize(durable)) throw new Error("Foreground timer durable write could not be verified.");
  return durable;
}

function assertNoAcceptedSimulationFinalization(sessionId: string, admission: TrackAdmissionContext): void {
  const accepted = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, (value): value is import("../../domain").TrainingSessionDraftState => isTrainingSessionDraftState(value, admission));
  if (accepted && isAcceptedSimulationFinalization(accepted, admission) && accepted.acceptance.sessionId === sessionId) {
    throw new Error("An accepted simulation finalization freezes its session timer until recovery completes.");
  }
}

/** Exact journal-owned timer removal; terminal verification requires absence. */
export function materializeActiveForegroundTimerJournalStep(hasClearSession: boolean, step: CanonicalPhysicalWrite | undefined, admission: TrackAdmissionContext): void {
  if (!hasClearSession) {
    if (step) throw new Error("A timer physical step has no clear-session owner.");
    return;
  }
  if (!step || step.target !== "active_foreground_timer" || step.after.kind !== "absent") throw new Error("The clear-session journal has no exact timer-removal step.");
  if (step.before.kind === "present" && (!step.before.envelope || !isForegroundTimerState(step.before.envelope.payload, admission))) throw new Error("The timer journal before-state has an unadmitted track.");
  applyCanonicalPhysicalWrite(step);
}

/** Exact start-owned timer put; ordinary timer checkpoint and terminal-clear APIs keep their own contracts. */
export function materializeStartedForegroundTimerJournalStep(session: TrainingSession | null, step: CanonicalPhysicalWrite | undefined, admission: TrackAdmissionContext): void {
  if (!session || !isTrainingSession(session, admission) || !step || step.target !== "active_foreground_timer" || step.before.kind !== "absent" || step.after.kind !== "present" || step.after.envelope.revision !== 1) {
    throw new Error("A foreground-timed session start has no exact initial timer step.");
  }
  const expected = initialForegroundTimerForSession(session, getTrackRegistration(session.trackId).familyId);
  const timer = step.after.envelope.payload;
  if (!expected || !isForegroundTimerState(timer, admission) || canonicalSerialize(timer) !== canonicalSerialize(expected)) {
    throw new Error("The initial foreground timer does not match its active session.");
  }
  applyCanonicalPhysicalWrite(step);
}

/** Grants the admitted active session to the existing profile-native owner.
 * Returned operations carry no storage handle, key, grant token or raw apply. */
export function bindActiveForegroundTimerClock(session: TrainingSession, admission: TrackAdmissionContext) {
  if (!isTrainingSession(session, admission) || session.status !== "active") throw new Error("foreground_clock_session_invalid");
  const timerKind = session.configurationSnapshot.timer;
  if (timerKind !== "elapsedForeground" && timerKind !== "countdownForeground") throw new Error("foreground_clock_session_invalid");
  const active = readActiveTrainingSession(admission);
  if (!active || active.id !== session.id || active.trackId !== session.trackId) throw new Error("foreground_clock_session_stale");
  assertNoAcceptedSimulationFinalization(session.id, admission);
  const familyId = getTrackRegistration(session.trackId).familyId;
  const decode = (raw: string | undefined): ForegroundTimerState => {
    let value: unknown;
    try { value = raw === undefined ? null : JSON.parse(raw); } catch { throw new Error("foreground_clock_record_invalid"); }
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("foreground_clock_record_invalid");
    const envelope = value as Record<string, unknown>;
    if (Object.keys(envelope).sort().join(",") !== "payload,revision,schemaIdentity" || envelope.schemaIdentity !== CANONICAL_RECORD_SCHEMA
      || !Number.isSafeInteger(envelope.revision) || Number(envelope.revision) < 1
      || !isForegroundTimerState(envelope.payload, admission)) throw new Error("foreground_clock_record_invalid");
    const state = envelope.payload;
    if (state.familyId !== familyId || state.sessionId !== session.id || state.trackId !== session.trackId
      || state.accumulatedForegroundMs < session.activeForegroundMs) throw new Error("foreground_clock_scope_invalid");
    return state;
  };
  const clock = getActiveForegroundClock();
  const raw = clock.read();
  decode(raw);
  const duration = session.configurationSnapshot.timerDurationMs;
  if (timerKind === "countdownForeground" && (typeof duration !== "number" || !Number.isSafeInteger(duration) || duration <= 0)) throw new Error("foreground_clock_countdown_invalid");
  clock.arm({ expectedRaw: raw!, familyId, sessionId: session.id, trackId: session.trackId,
    ...(timerKind === "countdownForeground" ? { countdownMs: typeof duration === "number" ? duration : undefined } : {}),
  });
  return Object.freeze({
    readState: () => decode(clock.read()), elapsed: () => clock.elapsed(),
    enter: () => decode(clock.enter()), checkpoint: () => decode(clock.checkpoint()), pause: () => decode(clock.pause()),
  });
}
