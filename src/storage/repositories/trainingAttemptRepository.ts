import type { TrainingAttempt } from "../../domain";
import {
  mergeRepositoryReadWriteResult,
  readRepositoryJson,
  removeRepositoryJson,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";
import { isTrainingAttemptArray } from "./trainingModelGuards";

const TRAINING_ATTEMPTS_KEY = "TRAINING_ATTEMPTS";

export async function getTrainingAttempts(): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> {
  return readRepositoryJson(TRAINING_ATTEMPTS_KEY, [], isTrainingAttemptArray);
}

export async function saveTrainingAttempts(
  attempts: TrainingAttempt<unknown>[],
): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> {
  return writeRepositoryJson(TRAINING_ATTEMPTS_KEY, attempts);
}

export async function addTrainingAttempt(
  attempt: TrainingAttempt<unknown>,
): Promise<StorageRepositoryResult<TrainingAttempt<unknown>[]>> {
  const existing = await getTrainingAttempts();
  const attempts = [attempt, ...existing.value];
  const saved = await saveTrainingAttempts(attempts);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function clearTrainingAttempts(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_ATTEMPTS_KEY);
}
