import type { TrainingAttempt } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { isTrainingAttempt } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export async function getTrainingAttempts(): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> { const ids = readStoredJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, isIds) ?? []; return { ok: true, value: ids.map((id) => { const value = readStoredJson(STORAGE_KEYS.trainingAttempt(id), isTrainingAttempt); if (!value) throw new Error(`Attempt index references missing attempt ${id}.`); return value; }) }; }
export async function addTrainingAttempt(attempt: TrainingAttempt<unknown>): Promise<StorageRepositoryResult<TrainingAttempt<unknown>>> { const old = readStoredJson(STORAGE_KEYS.trainingAttempt(attempt.id), isTrainingAttempt); if (old) { if (JSON.stringify(old) !== JSON.stringify(attempt)) throw new Error(`Attempt ${attempt.id} is immutable.`); return { ok: true, value: old }; } writeStoredJson(STORAGE_KEYS.trainingAttempt(attempt.id), attempt); const ids = readStoredJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, isIds) ?? []; writeStoredJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [attempt.id, ...ids]); return { ok: true, value: attempt }; }
export async function saveTrainingAttempts(attempts: TrainingAttempt<unknown>[]): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> { for (const attempt of attempts) await addTrainingAttempt(attempt); return { ok: true, value: attempts }; }
export async function clearTrainingAttempts(): Promise<void> { const ids = (await getTrainingAttempts()).value.map((attempt) => attempt.id); ids.forEach((id) => removeStoredValue(STORAGE_KEYS.trainingAttempt(id))); removeStoredValue(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX); }
