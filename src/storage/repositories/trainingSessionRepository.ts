import type { TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { isTrainingSession } from "./trainingModelGuards";
import { clearTrainingSessionResults } from "./trainingSessionResultRepository";
import { clearContentIdentityUnavailableRecords } from "./contentIdentityUnavailableRepository";
import type { StorageRepositoryResult } from "./result";

const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export async function getTrainingSessions(): Promise<StorageRepositoryResult<TrainingSession[]>> { const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; return { ok: true, value: ids.map((id) => { const session = readCanonicalJson(STORAGE_KEYS.trainingSession(id), isTrainingSession); if (!session) throw new Error(`Session index references missing session ${id}.`); return session; }) }; }
export async function getActiveTrainingSession(): Promise<TrainingSession | null> { const id = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); if (!id) return null; const session = readCanonicalJson(STORAGE_KEYS.trainingSession(id), isTrainingSession); if (!session) throw new Error(`Active session pointer references missing session ${id}.`); if (session.status !== "active") throw new Error(`Active session pointer references terminal session ${id}.`); return session; }
export async function getActiveTrainingSessionId(): Promise<string | null> { return readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); }
export async function clearActiveTrainingSession(sessionId: string): Promise<void> { const activeSessionId = await getActiveTrainingSessionId(); if (activeSessionId === sessionId) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); }
export async function saveTrainingSession(session: TrainingSession): Promise<void> {
  if (!isTrainingSession(session)) throw new Error("Training session is invalid.");
  // A journal can materialize a terminal session before it clears its pointer.
  // Preserve that recoverable intermediate state here; public reads stay strict.
  const activeId = await getActiveTrainingSessionId();
  const active = activeId ? readCanonicalJson(STORAGE_KEYS.trainingSession(activeId), isTrainingSession) : null;
  if (activeId && !active) throw new Error(`Active session pointer references missing session ${activeId}.`);
  if (session.status === "active" && active && active.id !== session.id) throw new Error(`Active session ${active.id} must be completed or abandoned first.`);
  const existing = readCanonicalJson(STORAGE_KEYS.trainingSession(session.id), isTrainingSession);
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
  writeCanonicalJson(STORAGE_KEYS.trainingSession(session.id), session);
  const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? [];
  if (!ids.includes(session.id)) writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session.id, ...ids]);
  if (session.status === "active") writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
  else if (active?.id === session.id) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
}

function assertConditionalReinsertResolution(existing: TrainingSession, next: TrainingSession): void {
  const previousSlots = existing.conditionalReinsertSlots ?? [];
  const nextSlots = next.conditionalReinsertSlots ?? [];
  const nextSlotIds = new Set(nextSlots.map((slot) => slot.slotId));
  const resolvedSlots = previousSlots.filter((slot) => !nextSlotIds.has(slot.slotId));
  if (!resolvedSlots.length || nextSlots.some((slot) => !previousSlots.some((previous) => previous.slotId === slot.slotId && JSON.stringify(previous) === JSON.stringify(slot))) ||
    JSON.stringify(nextSlots) !== JSON.stringify(previousSlots.filter((slot) => nextSlotIds.has(slot.slotId)))) {
    throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
  }

  const expectedOrder = [...existing.itemOrder];
  const expectedOptions = { ...existing.optionOrderByOccurrence };
  const changedIndices = new Set<number>();
  for (const slot of resolvedSlots) {
    const targetIndex = existing.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === slot.ordinaryBranch.occurrence.occurrenceId);
    const alternative = slot.reviewedVariantBranch ?? slot.exactSourceBranch;
    if (targetIndex < 0 || !alternative || changedIndices.has(targetIndex)) throw new Error(`Session ${existing.id} has an invalid conditional reinsert resolution.`);
    expectedOrder[targetIndex] = alternative.occurrence;
    changedIndices.add(targetIndex);
    delete expectedOptions[slot.ordinaryBranch.occurrence.occurrenceId];
    expectedOptions[alternative.occurrence.occurrenceId] = alternative.optionOrder;
  }
  const actualChangedIndices = new Set<number>();
  if (next.itemOrder.length !== existing.itemOrder.length) throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
  for (let index = 0; index < existing.itemOrder.length; index += 1) {
    if (JSON.stringify(existing.itemOrder[index]) !== JSON.stringify(next.itemOrder[index])) actualChangedIndices.add(index);
  }
  if (JSON.stringify([...actualChangedIndices].sort()) !== JSON.stringify([...changedIndices].sort()) ||
    JSON.stringify(expectedOrder) !== JSON.stringify(next.itemOrder) || JSON.stringify(expectedOptions) !== JSON.stringify(next.optionOrderByOccurrence)) {
    throw new Error(`Session ${existing.id} has a conflicting conditional reinsert plan.`);
  }
}
export async function clearTrainingSessions(): Promise<void> { const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; await clearTrainingSessionResults(ids); ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.trainingSession(id))); removeCanonicalValue(STORAGE_KEYS.TRAINING_SESSION_INDEX); removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); await clearContentIdentityUnavailableRecords(); }
