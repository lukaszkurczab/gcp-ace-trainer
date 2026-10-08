import type { ReviewQueueEntry, TrackId } from "../../domain";
import { resolvedContentRefKey } from "../../domain/learning/resolvedContentRef";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, writeCanonicalJson, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { isReviewQueueEntry } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
import { isActiveReviewQueueEntry } from "../../domain/learning/reviewQueueEntry";
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string");
export type ReviewQueueSnapshot = Readonly<{ entries: readonly ReviewQueueEntry[]; revisions: Readonly<Record<string, number>>; indexRevision: number | null }>;
function reviewQueueItemIdentity(entry: Pick<ReviewQueueEntry, "trackId" | "sourceItem">): string {
  return `${entry.trackId}:${resolvedContentRefKey(entry.sourceItem)}`;
}
export function readReviewQueueSnapshot(): StorageRepositoryResult<ReviewQueueSnapshot> {
  const indexEnvelope = readCanonicalEnvelope(STORAGE_KEYS.REVIEW_INDEX, isIds);
  const ids = indexEnvelope?.payload ?? [];
  if (new Set(ids).size !== ids.length) throw new Error("Review index contains duplicate record IDs.");
  const revisions: Record<string, number> = {};
  const entries = ids.map((id) => {
    const envelope = readCanonicalEnvelope(STORAGE_KEYS.reviewEntry(id), isReviewQueueEntry);
    if (!envelope) throw new Error(`Review index references missing entry ${id}.`);
    revisions[id] = envelope.revision;
    return envelope.payload;
  });
  validateActiveReviewIdentity(entries);
  return { ok: true, value: Object.freeze({ entries: Object.freeze(entries), revisions: Object.freeze(revisions), indexRevision: indexEnvelope?.revision ?? null }) };
}
export function readReviewQueueItems(): StorageRepositoryResult<ReviewQueueEntry[]> { return { ok: true, value: [...readReviewQueueSnapshot().value.entries] }; }
export async function getReviewQueueItems(): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { return readReviewQueueItems(); }
export async function getReviewQueueSnapshot(): Promise<StorageRepositoryResult<ReviewQueueSnapshot>> { return readReviewQueueSnapshot(); }
export async function addReviewQueueItems(items: ReviewQueueEntry[]): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  if (!items.every((item) => isReviewQueueEntry(item) && item.trackId === item.sourceItem.trackId)) {
    throw new Error("Review queue entry is invalid.");
  }
  const current = (await getReviewQueueItems()).value;
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const item of items) {
    const identity = reviewQueueItemIdentity(item);
    const existing = byId.get(item.id);
    if (existing) {
      const immutableExisting = { id: existing.id, trackId: existing.trackId, sourceAttemptId: existing.sourceAttemptId, sourceSessionId: existing.sourceSessionId, sourceItem: existing.sourceItem, taxonomyOrSkillRefs: existing.taxonomyOrSkillRefs, createdAt: existing.createdAt };
      const immutableNext = { id: item.id, trackId: item.trackId, sourceAttemptId: item.sourceAttemptId, sourceSessionId: item.sourceSessionId, sourceItem: item.sourceItem, taxonomyOrSkillRefs: item.taxonomyOrSkillRefs, createdAt: item.createdAt };
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Review entry ${item.id} has conflicting immutable evidence.`);
    }
    if (isActiveReviewQueueEntry(item) && [...byId.values()].some((entry) => entry.id !== item.id && isActiveReviewQueueEntry(entry) && reviewQueueItemIdentity(entry) === identity)) throw new Error(`Review item ${item.id} would create a second active cycle for its exact content reference.`);
    byId.set(item.id, item);
  }
  const values = [...byId.values()];
  values.forEach((item) => writeCanonicalJson(STORAGE_KEYS.reviewEntry(item.id), item));
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, values.map((item) => item.id));
  return { ok: true, value: values };
}
export async function getDueReviewQueueItems(trackId: TrackId, now: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { return { ok: true, value: (await getReviewQueueItems()).value.filter((entry) => isActiveReviewQueueEntry(entry) && entry.trackId === trackId && entry.dueAt !== undefined && entry.dueAt <= now).sort((a,b) => a.dueAt!.localeCompare(b.dueAt!) || a.createdAt.localeCompare(b.createdAt)) }; }
export async function removeReviewQueueEntry(id: string): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { const values = (await getReviewQueueItems()).value.filter((entry) => entry.id !== id); writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, values.map((entry) => entry.id)); removeCanonicalValue(STORAGE_KEYS.reviewEntry(id)); return { ok: true, value: values }; }
export async function hasReviewQueueEntryRecord(id: string): Promise<boolean> { return readCanonicalJson(STORAGE_KEYS.reviewEntry(id), isReviewQueueEntry) !== null; }
export async function clearReviewQueueItems(): Promise<void> { const ids = readCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, isIds) ?? []; ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.reviewEntry(id))); removeCanonicalValue(STORAGE_KEYS.REVIEW_INDEX); }

function validateActiveReviewIdentity(entries: readonly ReviewQueueEntry[]): void {
  const active = entries.filter(isActiveReviewQueueEntry);
  const identities = new Set<string>();
  for (const entry of active) {
    const identity = reviewQueueItemIdentity(entry);
    if (identities.has(identity)) throw new Error("Review queue contains multiple active cycles for one exact content reference.");
    identities.add(identity);
  }
}
