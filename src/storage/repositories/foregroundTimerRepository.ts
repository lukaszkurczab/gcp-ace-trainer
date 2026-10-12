import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { createForegroundTimerState, getTrackRegistration, initialForegroundTimerForSession, type ForegroundTimerState, type TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalJson, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isAcceptedSimulationFinalization, isForegroundTimerState, isTrainingSession, isTrainingSessionDraftState } from "./trainingModelGuards";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

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
