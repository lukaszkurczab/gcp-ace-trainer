import type { TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { isTrainingSession } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";

const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export async function getTrainingSessions(): Promise<StorageRepositoryResult<TrainingSession[]>> { const ids = readStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; return { ok: true, value: ids.map((id) => { const session = readStoredJson(STORAGE_KEYS.trainingSession(id), isTrainingSession); if (!session) throw new Error(`Session index references missing session ${id}.`); return session; }) }; }
export async function getActiveTrainingSession(): Promise<TrainingSession | null> { const id = readStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); if (!id) return null; const session = readStoredJson(STORAGE_KEYS.trainingSession(id), isTrainingSession); if (!session) throw new Error(`Active session pointer references missing session ${id}.`); return session; }
export async function getActiveTrainingSessionId(): Promise<string | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); }
export async function clearActiveTrainingSession(sessionId: string): Promise<void> { const activeSessionId = await getActiveTrainingSessionId(); if (activeSessionId === sessionId) removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); }
export async function saveTrainingSession(session: TrainingSession): Promise<void> {
  if (!isTrainingSession(session)) throw new Error("Training session is invalid.");
  const active = await getActiveTrainingSession();
  if (session.status === "active" && active && active.id !== session.id) throw new Error(`Active session ${active.id} must be completed or abandoned first.`);
  const existing = readStoredJson(STORAGE_KEYS.trainingSession(session.id), isTrainingSession);
  if (existing) {
    if (existing.status !== "active") {
      if (JSON.stringify(existing) !== JSON.stringify(session)) throw new Error(`Terminal session ${session.id} is immutable.`);
    } else {
      const immutableExisting = {
        id: existing.id, trackId: existing.trackId, modeId: existing.modeId, configurationSnapshot: existing.configurationSnapshot, requestedLength: existing.requestedLength,
        actualLength: existing.actualLength, itemOrder: existing.itemOrder, optionOrderByItem: existing.optionOrderByItem,
        contentVersion: existing.contentVersion, startedAt: existing.startedAt,
      };
      const immutableNext = {
        id: session.id, trackId: session.trackId, modeId: session.modeId, configurationSnapshot: session.configurationSnapshot, requestedLength: session.requestedLength,
        actualLength: session.actualLength, itemOrder: session.itemOrder, optionOrderByItem: session.optionOrderByItem,
        contentVersion: session.contentVersion, startedAt: session.startedAt,
      };
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Session ${session.id} has conflicting immutable fields.`);
      if (session.currentItemIndex < existing.currentItemIndex) throw new Error(`Session ${session.id} cannot move backward.`);
      if (session.activeForegroundMs < existing.activeForegroundMs) throw new Error(`Session ${session.id} foreground time cannot decrease.`);
    }
  }
  writeStoredJson(STORAGE_KEYS.trainingSession(session.id), session);
  const ids = readStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? [];
  if (!ids.includes(session.id)) writeStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session.id, ...ids]);
  if (session.status === "active") writeStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
  else if (active?.id === session.id) removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
}
export async function clearTrainingSessions(): Promise<void> { const ids = readStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; ids.forEach((id) => removeStoredValue(STORAGE_KEYS.trainingSession(id))); removeStoredValue(STORAGE_KEYS.TRAINING_SESSION_INDEX); removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); }
