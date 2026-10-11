import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { createForegroundTimerState, getTrackRegistration, initialForegroundTimerForSession, type ForegroundTimerState, type TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalJson, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isAcceptedSimulationFinalization, isForegroundTimerState, isTrainingSessionDraftState } from "./trainingModelGuards";

/** Pure canonical read used by snapshot consumers; performs no checkpoint or migration. */
export function readActiveForegroundTimer(): ForegroundTimerState | null {
  const value = readCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, isForegroundTimerState);
  return value ? createForegroundTimerState(value) : null;
}

/** Repository boundary for the one active session foreground timer. */
export async function getActiveForegroundTimer(): Promise<ForegroundTimerState | null> {
  return readActiveForegroundTimer();
}

export async function saveActiveForegroundTimer(
  timer: ForegroundTimerState,
  expectedPreviousCheckpointRevision: number | null,
): Promise<ForegroundTimerState> {
  if (!isForegroundTimerState(timer)) throw new Error("Foreground timer is invalid.");
  const accepted = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  if (accepted && isAcceptedSimulationFinalization(accepted) && accepted.acceptance.sessionId === timer.sessionId) {
    throw new Error("An accepted simulation finalization freezes its session timer until recovery completes.");
  }
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
  assertNoAcceptedSimulationFinalization(timer.sessionId);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, durable);
  const verified = await getActiveForegroundTimer();
  if (!verified || canonicalSerialize(verified) !== canonicalSerialize(durable)) throw new Error("Foreground timer durable write could not be verified.");
  return durable;
}

function assertNoAcceptedSimulationFinalization(sessionId: string): void {
  const accepted = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  if (accepted && isAcceptedSimulationFinalization(accepted) && accepted.acceptance.sessionId === sessionId) {
    throw new Error("An accepted simulation finalization freezes its session timer until recovery completes.");
  }
}

/** Exact journal-owned timer removal; terminal verification requires absence. */
export function materializeActiveForegroundTimerJournalStep(hasClearSession: boolean, step: CanonicalPhysicalWrite | undefined): void {
  if (!hasClearSession) {
    if (step) throw new Error("A timer physical step has no clear-session owner.");
    return;
  }
  if (!step || step.target !== "active_foreground_timer" || step.after.kind !== "absent") throw new Error("The clear-session journal has no exact timer-removal step.");
  applyCanonicalPhysicalWrite(step);
}

/** Exact start-owned timer put; ordinary timer checkpoint and terminal-clear APIs keep their own contracts. */
export function materializeStartedForegroundTimerJournalStep(session: TrainingSession | null, step: CanonicalPhysicalWrite | undefined): void {
  if (!session || !step || step.target !== "active_foreground_timer" || step.before.kind !== "absent" || step.after.kind !== "present" || step.after.envelope.revision !== 1) {
    throw new Error("A foreground-timed session start has no exact initial timer step.");
  }
  const expected = initialForegroundTimerForSession(session, getTrackRegistration(session.trackId).familyId);
  const timer = step.after.envelope.payload;
  if (!expected || !isForegroundTimerState(timer) || canonicalSerialize(timer) !== canonicalSerialize(expected)) {
    throw new Error("The initial foreground timer does not match its active session.");
  }
  applyCanonicalPhysicalWrite(step);
}
