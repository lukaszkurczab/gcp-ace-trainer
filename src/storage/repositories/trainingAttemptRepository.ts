import type { TrainingAttempt } from "../../domain/training";
import {
  mergeRepositoryReadWriteResult,
  readRepositoryJson,
  removeRepositoryJson,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";
import { isTrainingAttemptArray } from "./trainingModelGuards";

const TRAINING_ATTEMPTS_KEY = "TRAINING_ATTEMPTS";

export async function getTrainingAttempts(): Promise<StorageRepositoryResult<TrainingAttempt[]>> {
  return readRepositoryJson(TRAINING_ATTEMPTS_KEY, [], isTrainingAttemptArray);
}

export async function saveTrainingAttempts(
  attempts: TrainingAttempt[],
): Promise<StorageRepositoryResult<TrainingAttempt[]>> {
  return writeRepositoryJson(TRAINING_ATTEMPTS_KEY, attempts);
}

export async function addTrainingAttempt(
  attempt: TrainingAttempt,
): Promise<StorageRepositoryResult<TrainingAttempt[]>> {
  const existing = await getTrainingAttempts();
  const attempts = [attempt, ...existing.value];
  const saved = await saveTrainingAttempts(attempts);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function clearTrainingAttempts(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_ATTEMPTS_KEY);
}
