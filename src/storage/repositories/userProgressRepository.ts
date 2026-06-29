import type { TrackId } from "../../domain";
import type { UserProgress } from "../../domain/training";
import {
  failedRepositoryResult,
  mergeRepositoryIssues,
  readRepositoryJson,
  removeRepositoryJson,
  successRepositoryResult,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";
import { isUserProgressArray } from "./trainingModelGuards";

const TRAINING_USER_PROGRESS_KEY = "TRAINING_USER_PROGRESS";

export async function getAllUserProgress(): Promise<StorageRepositoryResult<UserProgress[]>> {
  return readRepositoryJson(TRAINING_USER_PROGRESS_KEY, [], isUserProgressArray);
}

export async function getUserProgressByTrack(
  trackId: TrackId,
): Promise<StorageRepositoryResult<UserProgress | null>> {
  const allProgress = await getAllUserProgress();
  const progress = allProgress.value.find((item) => item.trackId === trackId) ?? null;

  return allProgress.ok
    ? successRepositoryResult(progress, allProgress.issues)
    : failedRepositoryResult(progress, allProgress.issues);
}

export async function saveUserProgress(
  progress: UserProgress,
): Promise<StorageRepositoryResult<UserProgress[]>> {
  const existing = await getAllUserProgress();
  const nextProgress = [
    progress,
    ...existing.value.filter((item) => item.trackId !== progress.trackId),
  ];
  const saved = await writeRepositoryJson(TRAINING_USER_PROGRESS_KEY, nextProgress);
  const issues = mergeRepositoryIssues(existing, saved);

  return issues.length > 0 ? failedRepositoryResult(saved.value, issues) : successRepositoryResult(saved.value);
}

export async function clearUserProgress(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_USER_PROGRESS_KEY);
}
