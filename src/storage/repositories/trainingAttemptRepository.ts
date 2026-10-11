import type { TrainingAttempt } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalJson, removeCanonicalValue, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { isTrainingAttempt } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
import { readTrainingAttemptsStrict } from "./trainingEvidenceIntegrityRepository";
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim().length > 0);
export function readTrainingAttempts(): StorageRepositoryResult<TrainingAttempt<unknown>[]> { return readTrainingAttemptsStrict(); }
export async function getTrainingAttempts(): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> { return readTrainingAttempts(); }
export async function addTrainingAttempt(attempt: TrainingAttempt<unknown>): Promise<StorageRepositoryResult<TrainingAttempt<unknown>>> { return writeTrainingAttempt(attempt); }
/** Journal batch replay: all records in journal order, then the single derived index step. */
export function materializeTrainingAttemptBatch(attempts: readonly TrainingAttempt<unknown>[], physicalWrites: readonly CanonicalPhysicalWrite[]): void {
  if (!attempts.every(isTrainingAttempt)) throw new Error("Training attempt batch is invalid.");
  const expectedTargets = [...attempts.map((attempt) => `attempt:${attempt.id}`), ...(attempts.length ? ["attempt_index"] : [])];
  if (physicalWrites.length !== expectedTargets.length || physicalWrites.some((write, index) => write.target !== expectedTargets[index])) throw new Error("Training attempt batch does not match its exact journal physical plan.");
  for (const write of physicalWrites) applyCanonicalPhysicalWrite(write);
}
async function writeTrainingAttempt(attempt: TrainingAttempt<unknown>): Promise<StorageRepositoryResult<TrainingAttempt<unknown>>> { if (!isTrainingAttempt(attempt)) throw new Error("Training attempt is invalid."); readTrainingAttemptsStrict(); const old = readCanonicalJson(STORAGE_KEYS.trainingAttempt(attempt.id), isTrainingAttempt); if (old && JSON.stringify(old) !== JSON.stringify(attempt)) throw new Error(`Attempt ${attempt.id} is immutable.`); if (!old) writeCanonicalJson(STORAGE_KEYS.trainingAttempt(attempt.id), attempt); const ids = readCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, isIds) ?? []; if (!ids.includes(attempt.id)) writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [attempt.id, ...ids]); return { ok: true, value: old ?? attempt }; }
export async function clearTrainingAttempts(): Promise<void> { const ids = readTrainingAttemptsStrict().value.map((attempt) => attempt.id); ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.trainingAttempt(id))); removeCanonicalValue(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX); }
