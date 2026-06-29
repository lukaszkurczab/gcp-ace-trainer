import type { TrainingAttempt } from "../../domain/training";
import {
  failedRepositoryResult,
  mergeRepositoryIssues,
  readRepositoryJson,
  removeRepositoryJson,
  successRepositoryResult,
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
  const issues = mergeRepositoryIssues(existing, saved);

  return issues.length > 0 ? failedRepositoryResult(saved.value, issues) : successRepositoryResult(saved.value);
}

export async function clearTrainingAttempts(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_ATTEMPTS_KEY);
}
