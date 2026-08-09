import type { TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { isTrainingSession } from "./trainingModelGuards";
import { clearTrainingSessionResults } from "./trainingSessionResultRepository";
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
      const immutableExisting = {
        id: existing.id, trackId: existing.trackId, modeId: existing.modeId, configurationSnapshot: existing.configurationSnapshot, requestedLength: existing.requestedLength,
        actualLength: existing.actualLength, itemOrder: existing.itemOrder, optionOrderByOccurrence: existing.optionOrderByOccurrence, conditionalReinsertSlots: existing.conditionalReinsertSlots,
        contentVersion: existing.contentVersion, packagePin: existing.packagePin, taxonomyVersion: existing.taxonomyVersion, planFingerprint: existing.planFingerprint, startedAt: existing.startedAt,
      };
      const immutableNext = {
        id: session.id, trackId: session.trackId, modeId: session.modeId, configurationSnapshot: session.configurationSnapshot, requestedLength: session.requestedLength,
        actualLength: session.actualLength, itemOrder: session.itemOrder, optionOrderByOccurrence: session.optionOrderByOccurrence, conditionalReinsertSlots: session.conditionalReinsertSlots,
        contentVersion: session.contentVersion, packagePin: session.packagePin, taxonomyVersion: session.taxonomyVersion, planFingerprint: session.planFingerprint, startedAt: session.startedAt,
      };
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Session ${session.id} has conflicting immutable fields.`);
      if (session.activeForegroundMs < existing.activeForegroundMs) throw new Error(`Session ${session.id} foreground time cannot decrease.`);
    }
  }
  writeCanonicalJson(STORAGE_KEYS.trainingSession(session.id), session);
  const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? [];
  if (!ids.includes(session.id)) writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session.id, ...ids]);
  if (session.status === "active") writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
  else if (active?.id === session.id) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
}
export async function clearTrainingSessions(): Promise<void> { const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; await clearTrainingSessionResults(ids); ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.trainingSession(id))); removeCanonicalValue(STORAGE_KEYS.TRAINING_SESSION_INDEX); removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); }
