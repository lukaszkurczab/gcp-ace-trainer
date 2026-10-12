import type { ResolvedContentRef, ReviewQueueEntry, TrackId } from "../../domain";
import { resolvedContentRefKey, resolvedContentRefsEqual } from "../../domain/learning/resolvedContentRef";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalEnvelopeProof, readCanonicalJson, removeCanonicalValue, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { isReviewQueueEntry } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
import { isActiveReviewQueueEntry } from "../../domain/learning/reviewQueueEntry";
import { readReviewQueueForJournal, readReviewQueueStrict } from "./trainingEvidenceIntegrityRepository";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";
export type ReviewQueueSnapshot = Readonly<{ entries: readonly ReviewQueueEntry[]; revisions: Readonly<Record<string, number>>; indexRevision: number | null }>;
function reviewQueueItemIdentity(entry: Pick<ReviewQueueEntry, "trackId" | "sourceItem">): string {
  return `${entry.trackId}:${resolvedContentRefKey(entry.sourceItem)}`;
}
export function readReviewQueueSnapshot(admission: TrackAdmissionContext): StorageRepositoryResult<ReviewQueueSnapshot> {
  const { result, revisions, indexRevision } = readReviewQueueStrict(admission);
  const entries = result.value;
  validateActiveReviewIdentity(entries);
  return { ok: true, value: Object.freeze({ entries: Object.freeze(entries), revisions, indexRevision }) };
}

export function readReviewQueueFinalizationProofs(refs: readonly ResolvedContentRef[], admission: TrackAdmissionContext): Readonly<{ entries: readonly ReviewQueueEntry[]; proofs: readonly Readonly<{ id: string; revision: number; digest: string }>[] }> {
  const snapshot = readReviewQueueSnapshot(admission).value;
  const selected = snapshot.entries.filter((entry) => refs.some((ref) => resolvedContentRefsEqual(ref, entry.sourceItem)));
  const proofs = selected.map((entry) => {
    const proof = readCanonicalEnvelopeProof(STORAGE_KEYS.reviewEntry(entry.id), (value): value is ReviewQueueEntry => isReviewQueueEntry(value, admission));
    if (!proof || proof.envelope.revision !== snapshot.revisions[entry.id] || resolvedContentRefsEqual(proof.envelope.payload.sourceItem, entry.sourceItem) === false ||
      JSON.stringify(proof.envelope.payload) !== JSON.stringify(entry)) throw new Error("The exact review evidence changed while its finalization baseline was captured.");
    return Object.freeze({ id: entry.id, revision: proof.envelope.revision, digest: proof.digest });
  }).sort((left, right) => left.id.localeCompare(right.id));
  return Object.freeze({ entries: Object.freeze(selected), proofs: Object.freeze(proofs) });
}
export function readReviewQueueItems(admission: TrackAdmissionContext): StorageRepositoryResult<ReviewQueueEntry[]> { return { ok: true, value: [...readReviewQueueSnapshot(admission).value.entries] }; }
export async function getReviewQueueItems(admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { return readReviewQueueItems(admission); }
export async function getReviewQueueSnapshot(admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueSnapshot>> { return readReviewQueueSnapshot(admission); }
export async function addReviewQueueItems(items: ReviewQueueEntry[], admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  const current = readReviewQueueStrict(admission).result.value;
  return writeReviewQueueItems(items, current, admission);
}

/** Journal replay entry point; the caller must first run the journal preflight. */
export async function materializeReviewQueueItems(items: ReviewQueueEntry[], admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  return writeReviewQueueItems(items, readReviewQueueForJournal(items, admission), admission);
}

/** Journal batch replay: changed records, one exact derived index, then deletes. */
export function materializeReviewQueueBatch(puts: readonly ReviewQueueEntry[], deletes: readonly ReviewQueueEntry[], physicalWrites: readonly CanonicalPhysicalWrite[], admission: TrackAdmissionContext): void {
  if (![...puts, ...deletes].every((entry) => isReviewQueueEntry(entry, admission) && entry.trackId === entry.sourceItem.trackId)) throw new Error("Review queue batch is invalid.");
  const current = readReviewQueueForJournal([...puts, ...deletes], admission);
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const item of puts) {
    const existing = byId.get(item.id);
    if (existing) {
      const immutableExisting = { id: existing.id, trackId: existing.trackId, sourceAttemptId: existing.sourceAttemptId, sourceSessionId: existing.sourceSessionId, sourceItem: existing.sourceItem, taxonomyOrSkillRefs: existing.taxonomyOrSkillRefs, createdAt: existing.createdAt };
      const immutableNext = { id: item.id, trackId: item.trackId, sourceAttemptId: item.sourceAttemptId, sourceSessionId: item.sourceSessionId, sourceItem: item.sourceItem, taxonomyOrSkillRefs: item.taxonomyOrSkillRefs, createdAt: item.createdAt };
      if (JSON.stringify(immutableExisting) !== JSON.stringify(immutableNext)) throw new Error(`Review entry ${item.id} has conflicting immutable evidence.`);
    }
    if (isActiveReviewQueueEntry(item) && [...byId.values()].some((entry) => entry.id !== item.id && isActiveReviewQueueEntry(entry) && reviewQueueItemIdentity(entry) === reviewQueueItemIdentity(item))) throw new Error(`Review item ${item.id} would create a second active cycle for its exact content reference.`);
    byId.set(item.id, item);
  }
  for (const item of deletes) {
    const existing = byId.get(item.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) throw new Error(`Review delete ${item.id} conflicts with its durable review identity.`);
  }
  const expectedTargets = [...puts.map((entry) => `review:${entry.id}`), ...(puts.length || deletes.length ? ["review_index"] : []), ...deletes.map((entry) => `review:${entry.id}`)];
  if (physicalWrites.length !== expectedTargets.length || physicalWrites.some((write, index) => write.target !== expectedTargets[index])) throw new Error("Review queue batch does not match its exact journal physical plan.");
  for (const write of physicalWrites) applyCanonicalPhysicalWrite(write);
}

async function writeReviewQueueItems(items: ReviewQueueEntry[], current: readonly ReviewQueueEntry[], admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> {
  if (!items.every((item) => isReviewQueueEntry(item, admission) && item.trackId === item.sourceItem.trackId)) {
    throw new Error("Review queue entry is invalid.");
  }
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
  const existingById = new Map(current.map((entry) => [entry.id, entry]));
  values.forEach((item) => {
    if (JSON.stringify(existingById.get(item.id)) !== JSON.stringify(item)) writeCanonicalJson(STORAGE_KEYS.reviewEntry(item.id), item);
  });
  const nextIds = values.map((item) => item.id);
  const currentIds = readCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, (value): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim().length > 0));
  if (JSON.stringify(currentIds ?? []) !== JSON.stringify(nextIds)) writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, nextIds);
  return { ok: true, value: values };
}
export async function getDueReviewQueueItems(trackId: TrackId, now: string, admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { return { ok: true, value: (await getReviewQueueItems(admission)).value.filter((entry) => isActiveReviewQueueEntry(entry) && entry.trackId === trackId && entry.dueAt !== undefined && entry.dueAt <= now).sort((a,b) => a.dueAt!.localeCompare(b.dueAt!) || a.createdAt.localeCompare(b.createdAt)) }; }
export async function removeReviewQueueEntry(id: string, admission: TrackAdmissionContext): Promise<StorageRepositoryResult<ReviewQueueEntry[]>> { const values = (await getReviewQueueItems(admission)).value.filter((entry) => entry.id !== id); writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, values.map((entry) => entry.id)); removeCanonicalValue(STORAGE_KEYS.reviewEntry(id)); return { ok: true, value: values }; }
export async function hasReviewQueueEntryRecord(id: string, admission: TrackAdmissionContext): Promise<boolean> { return readCanonicalJson(STORAGE_KEYS.reviewEntry(id), (value): value is ReviewQueueEntry => isReviewQueueEntry(value, admission)) !== null; }
export async function clearReviewQueueItems(admission: TrackAdmissionContext): Promise<void> { const ids = readReviewQueueStrict(admission).result.value.map((entry) => entry.id); ids.forEach((id) => removeCanonicalValue(STORAGE_KEYS.reviewEntry(id))); removeCanonicalValue(STORAGE_KEYS.REVIEW_INDEX); }

function validateActiveReviewIdentity(entries: readonly ReviewQueueEntry[]): void {
  const active = entries.filter(isActiveReviewQueueEntry);
  const identities = new Set<string>();
  for (const entry of active) {
    const identity = reviewQueueItemIdentity(entry);
    if (identities.has(identity)) throw new Error("Review queue contains multiple active cycles for one exact content reference.");
    identities.add(identity);
  }
}
