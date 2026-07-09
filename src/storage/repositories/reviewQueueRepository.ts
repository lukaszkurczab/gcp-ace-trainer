import type { TrackId } from "../../domain";
import { getReviewQueueItemKind, type ReviewPriority, type ReviewQueueItem, type ReviewReason, type TrainingItemTaxonomyRef } from "../../domain/training";
import {
  mergeRepositoryReadWriteResult,
  readRepositoryJson,
  removeRepositoryJson,
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
  const reviewQueueItems = mergeReviewQueueItems(existing.value, items);
  const saved = await saveReviewQueueItems(reviewQueueItems);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function getDueReviewQueueItems(
  trackId: TrackId,
  now: string,
): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  const existing = await getReviewQueueItems();
  const canonicalItems = mergeReviewQueueItems(existing.value, []);
  const dueItems = canonicalItems
    .filter((item) => item.trackId === trackId && item.dueAt <= now)
    .sort(compareReviewQueueItems);

  return existing.ok
    ? { ok: true, value: dueItems, issues: existing.issues }
    : { ok: false, value: dueItems, issues: existing.issues };
}

export async function updateReviewQueueItem(
  item: ReviewQueueItem,
): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  const existing = await getReviewQueueItems();
  const itemKey = getReviewQueueMergeKey(item);
  const nextItems = [
    ...existing.value.filter((candidate) => getReviewQueueMergeKey(candidate) !== itemKey),
    item,
  ];
  const saved = await saveReviewQueueItems(nextItems);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function removeReviewQueueItem(
  trackId: TrackId,
  itemId: string,
): Promise<StorageRepositoryResult<ReviewQueueItem[]>> {
  const existing = await getReviewQueueItems();
  const nextItems = existing.value.filter((item) => item.trackId !== trackId || item.itemId !== itemId);
  const saved = await saveReviewQueueItems(nextItems);

  return mergeRepositoryReadWriteResult(existing, saved);
}

export async function clearReviewQueueItems(): Promise<StorageRepositoryResult<void>> {
  return removeRepositoryJson(TRAINING_REVIEW_QUEUE_KEY);
}

function mergeReviewQueueItems(
  existingItems: readonly ReviewQueueItem[],
  incomingItems: readonly ReviewQueueItem[],
): ReviewQueueItem[] {
  const mergedItems: ReviewQueueItem[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of existingItems) {
    upsertReviewQueueItem(mergedItems, indexByKey, item);
  }

  for (const item of incomingItems) {
    upsertReviewQueueItem(mergedItems, indexByKey, item);
  }

  return mergedItems;
}

function upsertReviewQueueItem(
  items: ReviewQueueItem[],
  indexByKey: Map<string, number>,
  item: ReviewQueueItem,
): void {
  const key = getReviewQueueMergeKey(item);
  const existingIndex = indexByKey.get(key);

  if (existingIndex === undefined) {
    indexByKey.set(key, items.length);
    items.push(item);
    return;
  }

  const existing = items[existingIndex];

  if (!existing) {
    indexByKey.set(key, items.length);
    items.push(item);
    return;
  }

  items[existingIndex] = mergeReviewQueueItem(existing, item);
}

function mergeReviewQueueItem(
  existing: ReviewQueueItem,
  incoming: ReviewQueueItem,
): ReviewQueueItem {
  if (getReviewQueueItemKind(incoming) === "retention") {
    return {
      ...incoming,
      lastReviewedAt: latestOptionalIso(existing.lastReviewedAt, incoming.lastReviewedAt),
      retentionPassedAt: latestOptionalIso(existing.retentionPassedAt, incoming.retentionPassedAt),
    };
  }

  const repeatedMistakeReasons = getReviewQueueItemKind(existing) === "remediation" &&
    isReviewAttemptReason(incoming.reasons) &&
    existing.sourceAttemptId !== incoming.sourceAttemptId
    ? ["repeated_mistake" as const]
    : [];

  return {
    ...existing,
    createdAt: earliestIso(existing.createdAt, incoming.createdAt),
    dueAt: earliestIso(existing.dueAt, incoming.dueAt),
    kind: "remediation",
    lastReviewedAt: latestOptionalIso(existing.lastReviewedAt, incoming.lastReviewedAt),
    mistakeTypeRefs: mergeTaxonomyRefs(existing.mistakeTypeRefs, incoming.mistakeTypeRefs),
    priority: maxReviewPriority(existing.priority, incoming.priority),
    reasons: uniqueReasons([...existing.reasons, ...incoming.reasons, ...repeatedMistakeReasons]),
    sourceAttemptId: incoming.sourceAttemptId,
    taxonomyRefs: mergeTaxonomyRefs(existing.taxonomyRefs, incoming.taxonomyRefs),
  };
}

function getReviewQueueMergeKey(item: Pick<ReviewQueueItem, "itemId" | "trackId">): string {
  return `${item.trackId}:${item.itemId}`;
}

function isReviewAttemptReason(reasons: readonly ReviewReason[]): boolean {
  return reasons.some((reason) => reason === "incorrect_attempt" || reason === "partial_credit");
}

function uniqueReasons(reasons: readonly ReviewReason[]): ReviewReason[] {
  return [...new Set(reasons)];
}

function mergeTaxonomyRefs(
  existingRefs: readonly TrainingItemTaxonomyRef[] | undefined,
  incomingRefs: readonly TrainingItemTaxonomyRef[] | undefined,
): TrainingItemTaxonomyRef[] | undefined {
  const refs = [...(existingRefs ?? []), ...(incomingRefs ?? [])];
  const refByKey = new Map<string, TrainingItemTaxonomyRef>();

  for (const ref of refs) {
    refByKey.set(getTaxonomyRefKey(ref), ref);
  }

  return refByKey.size > 0 ? [...refByKey.values()] : undefined;
}

function getTaxonomyRefKey(ref: TrainingItemTaxonomyRef): string {
  return [
    ref.axisId,
    ref.nodeId,
    ref.role ?? "",
    ref.trackId ?? "",
    String(ref.weight ?? ""),
  ].join(":");
}

const reviewPriorityRank: Record<ReviewPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

function maxReviewPriority(left: ReviewPriority, right: ReviewPriority): ReviewPriority {
  return reviewPriorityRank[right] > reviewPriorityRank[left] ? right : left;
}

function compareReviewQueueItems(left: ReviewQueueItem, right: ReviewQueueItem): number {
  return (
    reviewPriorityRank[right.priority] - reviewPriorityRank[left.priority] ||
    left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function earliestIso(left: string, right: string): string {
  return left <= right ? left : right;
}

function latestOptionalIso(left: string | undefined, right: string | undefined): string | undefined {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left >= right ? left : right;
}
