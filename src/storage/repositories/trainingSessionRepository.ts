import type { TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { isTrainingSession } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";

const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export async function getTrainingSessions(): Promise<StorageRepositoryResult<TrainingSession[]>> { const ids = readStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? []; return { ok: true, value: ids.map((id) => { const session = readStoredJson(STORAGE_KEYS.trainingSession(id), isTrainingSession); if (!session) throw new Error(`Session index references missing session ${id}.`); return session; }) }; }
export async function getActiveTrainingSession(): Promise<TrainingSession | null> { const id = readStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, (value): value is string => typeof value === "string"); return id ? readStoredJson(STORAGE_KEYS.trainingSession(id), isTrainingSession) : null; }
export async function saveTrainingSession(session: TrainingSession): Promise<void> {
  const active = await getActiveTrainingSession();
  if (session.status === "active" && active && active.id !== session.id) throw new Error(`Active session ${active.id} must be completed or abandoned first.`);
  writeStoredJson(STORAGE_KEYS.trainingSession(session.id), session);
  const ids = readStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, isIds) ?? [];
  if (!ids.includes(session.id)) writeStoredJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session.id, ...ids]);
  if (session.status === "active") writeStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
  else if (active?.id === session.id) removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
}
export async function addTrainingSession(session: TrainingSession): Promise<StorageRepositoryResult<TrainingSession>> { await saveTrainingSession(session); return { ok: true, value: session }; }
export async function saveTrainingSessions(sessions: TrainingSession[]): Promise<StorageRepositoryResult<TrainingSession[]>> { for (const session of sessions) await saveTrainingSession(session); return { ok: true, value: sessions }; }
export async function clearTrainingSessions(): Promise<void> { const ids = (await getTrainingSessions()).value.map((session) => session.id); ids.forEach((id) => removeStoredValue(STORAGE_KEYS.trainingSession(id))); removeStoredValue(STORAGE_KEYS.TRAINING_SESSION_INDEX); removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION); }
