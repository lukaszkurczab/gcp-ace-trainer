import type { ReviewQueueEntry, TrackId } from "../../domain";
import { mergeRepositoryReadWriteResult, readRepositoryJson, removeRepositoryJson, writeRepositoryJson, type StorageRepositoryResult } from "./storageResult";
import { isReviewQueueEntryArray } from "./trainingModelGuards";

const TRAINING_REVIEW_QUEUE_KEY = "TRAINING_REVIEW_QUEUE";

export async function getReviewQueueItems(): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  return readRepositoryJson(TRAINING_REVIEW_QUEUE_KEY, [], isReviewQueueEntryArray);
}

export async function saveReviewQueueItems(items: ReviewQueueEntry[]): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  return writeRepositoryJson(TRAINING_REVIEW_QUEUE_KEY, items);
}

export async function addReviewQueueItems(items: ReviewQueueEntry[]): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  const existing = await getReviewQueueItems();
  const byItem = new Map(existing.value.map((entry) => [`${entry.trackId}:${entry.sourceItem.itemId}`, entry]));
  for (const entry of items) byItem.set(`${entry.trackId}:${entry.sourceItem.itemId}`, entry);
  const saved = await saveReviewQueueItems([...byItem.values()]);
  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function getDueReviewQueueItems(trackId: TrackId, now: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  const existing = await getReviewQueueItems();
  const value = existing.value.filter((entry) => entry.trackId === trackId && entry.dueAt <= now)
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.createdAt.localeCompare(right.createdAt));
  return existing.ok ? { ok: true, value, issues: existing.issues } : { ok: false, value, issues: existing.issues };
}

export async function updateReviewQueueItem(item: ReviewQueueEntry): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  return addReviewQueueItems([item]);
}

export async function removeReviewQueueItem(trackId: TrackId, itemId: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  const existing = await getReviewQueueItems();
  const saved = await saveReviewQueueItems(existing.value.filter((entry) => entry.trackId !== trackId || entry.sourceItem.itemId !== itemId));
  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function clearReviewQueueItems(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_REVIEW_QUEUE_KEY);
}
