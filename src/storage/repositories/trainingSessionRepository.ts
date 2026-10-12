import type { TrainingSession, TrainingSessionDraftState } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalEnvelopeProof, readCanonicalJson, removeCanonicalValue, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { isTrainingSession } from "./trainingModelGuards";
import { clearTrainingSessionResults } from "./trainingSessionResultRepository";
import { clearContentIdentityUnavailableRecords } from "./contentIdentityUnavailableRepository";
import type { StorageRepositoryResult } from "./result";
import { readTrainingSessionsStrict } from "./trainingEvidenceIntegrityRepository";
import { isAcceptedSimulationFinalization, isTrainingSessionDraftState } from "./trainingModelGuards";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim().length > 0);
export function readTrainingSessions(admission: TrackAdmissionContext): StorageRepositoryResult<TrainingSession[]> { return readTrainingSessionsStrict(admission); }
export function readActiveTrainingSession(admission: TrackAdmissionContext): TrainingSession | null { const id = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); if (!id) return null; const session = readCanonicalJson(STORAGE_KEYS.trainingSession(id), (value): value is TrainingSession => isTrainingSession(value, admission)); if (!session) throw new Error(`Active session pointer references missing session ${id}.`); if (session.status !== "active") throw new Error(`Active session pointer references terminal session ${id}.`); return session; }
export async function getTrainingSessions(admission: TrackAdmissionContext): Promise<StorageRepositoryResult<TrainingSession[]>> { return readTrainingSessions(admission); }
export function readTrainingSessionEnvelopeProof(sessionId: string, admission: TrackAdmissionContext): Readonly<{ session: TrainingSession; revision: number; digest: string }> | null {
  const proof = readCanonicalEnvelopeProof(STORAGE_KEYS.trainingSession(sessionId), (value): value is TrainingSession => isTrainingSession(value, admission));
  if (!proof || proof.envelope.payload.id !== sessionId) return null;
  return Object.freeze({ session: proof.envelope.payload, revision: proof.envelope.revision, digest: proof.digest });
}
export async function getActiveTrainingSession(admission: TrackAdmissionContext): Promise<TrainingSession | null> { return readActiveTrainingSession(admission); }
export async function getActiveTrainingSessionId(): Promise<string | null> { return readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); }
export async function clearActiveTrainingSession(sessionId: string, admission: TrackAdmissionContext): Promise<void> { const activeSessionId = await getActiveTrainingSessionId(); if (activeSessionId === sessionId) { const session = readCanonicalJson(STORAGE_KEYS.trainingSession(sessionId), (value): value is TrainingSession => isTrainingSession(value, admission)); if (session) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); } }
export async function saveTrainingSession(session: TrainingSession, admission: TrackAdmissionContext): Promise<void> {
  await writeTrainingSession(session, admission);
}

/** Read-only equivalent used before the journal executor applies captured exact writes. */
export async function assertTrainingSessionJournalWrite(session: TrainingSession, admission: TrackAdmissionContext): Promise<void> {
  await validateTrainingSessionWrite(session, false, admission);
}

/** Applies the session family steps owned by this repository after journal preflight. */
export function materializeTrainingSessionJournalSteps(sessionIds: readonly string[], clearSessionIds: readonly string[], steps: readonly CanonicalPhysicalWrite[], admission: TrackAdmissionContext): void {
  const expected = sessionIds.flatMap((id) => [`session:${id}`, "session_index"]);
  if (sessionIds.length > 0 || clearSessionIds.length > 0) expected.push("active_session");
  if (new Set(expected).size !== expected.length || steps.length !== 1 || !expected.includes(steps[0]!.target)) throw new Error("Training session step does not match its exact journal plan.");
  for (const step of steps) {
    if (step.target.startsWith("session:") && step.after.kind === "present" && !isTrainingSession(step.after.envelope.payload, admission)) throw new Error("Training session journal step has an unadmitted track.");
    applyCanonicalPhysicalWrite(step);
  }
}

async function writeTrainingSession(session: TrainingSession, admission: TrackAdmissionContext): Promise<void> {
  assertNoAcceptedSimulationFinalization(admission);
  const { active, existing } = await validateTrainingSessionWrite(session, true, admission);
  // Validation awaits the active-session owner; acceptance may have won while
  // that check was pending, so fence again in the same synchronous write lane.
  assertNoAcceptedSimulationFinalization(admission);
  if (!existing || JSON.stringify(existing) !== JSON.stringify(session)) writeCanonicalJson(STORAGE_KEYS.trainingSession(session.id), session);
  const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? [];
  if (!ids.includes(session.id)) writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session.id, ...ids]);
  if (session.status === "active") writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
  else if (active?.id === session.id) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
}

function assertNoAcceptedSimulationFinalization(admission: TrackAdmissionContext): void {
  const state = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, (value): value is TrainingSessionDraftState => isTrainingSessionDraftState(value, admission));
  if (state && isAcceptedSimulationFinalization(state, admission)) throw new Error("An accepted simulation finalization owns the active session until its exact journal is applied.");
}

async function validateTrainingSessionWrite(session: TrainingSession, requireStrictRead: boolean, admission: TrackAdmissionContext): Promise<{ active: TrainingSession | null; existing: TrainingSession | null }> {
  if (!isTrainingSession(session, admission)) throw new Error("Training session is invalid.");
  if (requireStrictRead) readTrainingSessionsStrict(admission);
  // A journal can materialize a terminal session before it clears its pointer.
  // Preserve that recoverable intermediate state here; public reads stay strict.
  const activeId = await getActiveTrainingSessionId();
  const active = activeId ? readCanonicalJson(STORAGE_KEYS.trainingSession(activeId), (value): value is TrainingSession => isTrainingSession(value, admission)) : null;
  if (activeId && !active) throw new Error(`Active session pointer references missing session ${activeId}.`);
  if (session.status === "active" && active && active.id !== session.id) throw new Error(`Active session ${active.id} must be completed or abandoned first.`);
  const existing = readCanonicalJson(STORAGE_KEYS.trainingSession(session.id), (value): value is TrainingSession => isTrainingSession(value, admission));
  if (existing) {
    if (existing.status !== "active") {
      if (JSON.stringify(existing) !== JSON.stringify(session)) throw new Error(`Terminal session ${session.id} is immutable.`);
    } else {
      const { currentItemIndex: _existingIndex, activeForegroundMs: _existingTime, status: _existingStatus, completedAt: _existingCompletion, itemOrder: existingOrder, optionOrderByOccurrence: existingOptions, conditionalReinsertSlots: existingSlots, planFingerprint: existingFingerprint, ...immutableExisting } = existing;
      const { currentItemIndex: _nextIndex, activeForegroundMs: _nextTime, status: _nextStatus, completedAt: _nextCompletion, itemOrder: nextOrder, optionOrderByOccurrence: nextOptions, conditionalReinsertSlots: nextSlots, planFingerprint: nextFingerprint, ...immutableNext } = session;
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Session ${session.id} has conflicting immutable fields.`);
      if (session.activeForegroundMs < existing.activeForegroundMs) throw new Error(`Session ${session.id} foreground time cannot decrease.`);
      if (JSON.stringify(existingOrder) !== JSON.stringify(nextOrder) || JSON.stringify(existingOptions) !== JSON.stringify(nextOptions) || JSON.stringify(existingSlots ?? []) !== JSON.stringify(nextSlots ?? [])) {
        assertConditionalReinsertResolution(existing, session);
        if (!nextFingerprint || nextFingerprint === existingFingerprint) throw new Error(`Session ${session.id} must update its plan fingerprint when resolving a conditional reinsert.`);
      } else if (existingFingerprint !== nextFingerprint) {
        throw new Error(`Session ${session.id} cannot change its plan fingerprint without resolving a conditional reinsert.`);
      }
    }
  }
  return { active, existing };
}

function assertConditionalReinsertResolution(existing: TrainingSession, next: TrainingSession): void {
  const previousSlots = existing.conditionalReinsertSlots ?? [];
  const nextSlots = next.conditionalReinsertSlots ?? [];
  const expectedOrder = [...existing.itemOrder];
  const expectedOptions = { ...existing.optionOrderByOccurrence };
  if (next.itemOrder.length !== existing.itemOrder.length) throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
  const changedIndices: number[] = [];
  for (let index = 0; index < existing.itemOrder.length; index += 1) {
    if (JSON.stringify(existing.itemOrder[index]) !== JSON.stringify(next.itemOrder[index])) changedIndices.push(index);
  }

  const resolvedSlots = new Set<(typeof previousSlots)[number]>();
  for (const index of changedIndices) {
    const matchingSlots = previousSlots.filter((slot) => existing.itemOrder[index]?.occurrenceId === slot.ordinaryBranch.occurrence.occurrenceId);
    if (matchingSlots.length !== 1) throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
    const slot = matchingSlots[0]!;
    const alternative = slot.reviewedVariantBranch ?? slot.exactSourceBranch;
    if (!alternative || JSON.stringify(next.itemOrder[index]) !== JSON.stringify(alternative.occurrence) || resolvedSlots.has(slot)) {
      throw new Error(`Session ${existing.id} has an invalid conditional reinsert resolution.`);
    }
    expectedOrder[index] = alternative.occurrence;
    resolvedSlots.add(slot);
    delete expectedOptions[slot.ordinaryBranch.occurrence.occurrenceId];
    expectedOptions[alternative.occurrence.occurrenceId] = alternative.optionOrder;
  }

  const occurrenceIds = new Set(expectedOrder.map((occurrence) => occurrence.occurrenceId));
  const expectedSlots = previousSlots.filter((slot) =>
    !resolvedSlots.has(slot) && occurrenceIds.has(slot.sourceOccurrenceId) && occurrenceIds.has(slot.ordinaryBranch.occurrence.occurrenceId),
  );
  if (JSON.stringify(expectedOrder) !== JSON.stringify(next.itemOrder) || JSON.stringify(expectedOptions) !== JSON.stringify(next.optionOrderByOccurrence) ||
    JSON.stringify(expectedSlots) !== JSON.stringify(nextSlots)) {
    throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
  }
}
export async function clearTrainingSessions(admission: TrackAdmissionContext): Promise<void> { const ids = readTrainingSessionsStrict(admission).value.map((session) => session.id); await clearTrainingSessionResults(ids, admission); ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.trainingSession(id))); removeCanonicalValue(STORAGE_KEYS.TRAINING_SESSION_INDEX); removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); await clearContentIdentityUnavailableRecords(); }
