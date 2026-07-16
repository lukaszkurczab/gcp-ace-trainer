import type { ReviewQueueEntry, TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { isReviewQueueEntry } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export async function getReviewQueueItems(): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { const ids = readCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, isIds) ?? []; return { ok: true, value: ids.map((id) => { const entry = readCanonicalJson(STORAGE_KEYS.reviewEntry(id), isReviewQueueEntry); if (!entry) throw new Error(`Review index references missing entry ${id}.`); return entry; }) }; }
export async function addReviewQueueItems(items: ReviewQueueEntry[]): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  const current = (await getReviewQueueItems()).value;
  const byIdentity = new Map(current.map((entry) => [`${entry.trackId}:${entry.sourceItem.itemId}`, entry]));
  for (const item of items) {
    const identity = `${item.trackId}:${item.sourceItem.itemId}`;
    const existingByIdentity = byIdentity.get(identity);
    if (existingByIdentity && existingByIdentity.id !== item.id) throw new Error(`Review item ${item.sourceItem.itemId} must retain its durable review identity.`);
    const existing = current.find((entry) => entry.id === item.id);
    if (existing) {
      const immutableExisting = { id: existing.id, trackId: existing.trackId, sourceAttemptId: existing.sourceAttemptId, sourceSessionId: existing.sourceSessionId, sourceItem: existing.sourceItem, taxonomyOrSkillRefs: existing.taxonomyOrSkillRefs, createdAt: existing.createdAt };
      const immutableNext = { id: item.id, trackId: item.trackId, sourceAttemptId: item.sourceAttemptId, sourceSessionId: item.sourceSessionId, sourceItem: item.sourceItem, taxonomyOrSkillRefs: item.taxonomyOrSkillRefs, createdAt: item.createdAt };
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Review entry ${item.id} has conflicting immutable evidence.`);
    }
    byIdentity.set(identity, item);
  }
  const values = [...byIdentity.values()];
  values.forEach((item) => writeCanonicalJson(STORAGE_KEYS.reviewEntry(item.id), item));
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, values.map((item) => item.id));
  return { ok: true, value: values };
}
export async function getDueReviewQueueItems(trackId: TrackId, now: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { return { ok: true, value: (await getReviewQueueItems()).value.filter((entry) => entry.trackId === trackId && entry.dueAt <= now).sort((a,b) => a.dueAt.localeCompare(b.dueAt) || a.createdAt.localeCompare(b.createdAt)) }; }
export async function removeReviewQueueEntry(id: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { const values = (await getReviewQueueItems()).value.filter((entry) => entry.id !== id); writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, values.map((entry) => entry.id)); removeCanonicalValue(STORAGE_KEYS.reviewEntry(id)); return { ok: true, value: values }; }
export async function hasReviewQueueEntryRecord(id: string): Promise<boolean> { return readCanonicalJson(STORAGE_KEYS.reviewEntry(id), isReviewQueueEntry) !== null; }
export async function clearReviewQueueItems(): Promise<void> { const ids = readCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, isIds) ?? []; ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.reviewEntry(id))); removeCanonicalValue(STORAGE_KEYS.REVIEW_INDEX); }
