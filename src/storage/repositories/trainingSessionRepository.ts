import type { TrainingSession } from "../../domain/training";
import {
  mergeRepositoryReadWriteResult,
  readRepositoryJson,
  writeRepositoryJson,
  removeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";
import { isTrainingSessionArray } from "./trainingModelGuards";

const TRAINING_SESSIONS_KEY = "TRAINING_SESSIONS";

export async function getTrainingSessions(): Promise<StorageRepositoryResult<TrainingSession[]>> {
  return readRepositoryJson(TRAINING_SESSIONS_KEY, [], isTrainingSessionArray);
}

export async function saveTrainingSessions(
  sessions: TrainingSession[],
): Promise<StorageRepositoryResult<TrainingSession[]>> {
  return writeRepositoryJson(TRAINING_SESSIONS_KEY, sessions);
}

export async function addTrainingSession(
  session: TrainingSession,
): Promise<StorageRepositoryResult<TrainingSession[]>> {
  const existing = await getTrainingSessions();
  const sessions = [session, ...existing.value];
  const saved = await saveTrainingSessions(sessions);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function clearTrainingSessions(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_SESSIONS_KEY);
}
