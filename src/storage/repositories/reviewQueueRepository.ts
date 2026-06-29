import type { ReviewQueueItem } from "../../domain/training";
import {
  failedRepositoryResult,
  mergeRepositoryIssues,
  readRepositoryJson,
  removeRepositoryJson,
  successRepositoryResult,
  writeRepositoryJson,
  type StorageRepositoryResult,
} from "./storageResult";
import { isReviewQueueItemArray } from "./trainingModelGuards";

const TRAINING_REVIEW_QUEUE_KEY = "TRAINING_REVIEW_QUEUE";

export async function getReviewQueueItems(): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  return readRepositoryJson(TRAINING_REVIEW_QUEUE_KEY, [], isReviewQueueItemArray);
}

export async function saveReviewQueueItems(
  items: ReviewQueueItem[],
): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  return writeRepositoryJson(TRAINING_REVIEW_QUEUE_KEY, items);
}

export async function addReviewQueueItems(
  items: ReviewQueueItem[],
): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  const existing = await getReviewQueueItems();
  const reviewQueueItems = [...items, ...existing.value];
  const saved = await saveReviewQueueItems(reviewQueueItems);
  const issues = mergeRepositoryIssues(existing, saved);

  return issues.length > 0 ? failedRepositoryResult(saved.value, issues) : successRepositoryResult(saved.value);
}

export async function clearReviewQueueItems(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_REVIEW_QUEUE_KEY);
}
