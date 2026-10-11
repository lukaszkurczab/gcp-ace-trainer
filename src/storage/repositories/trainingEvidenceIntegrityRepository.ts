import type { ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionResult } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { CanonicalEvidenceIntegrityError } from "../errors";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { readCanonicalEnvelope, readCanonicalNamespaceKeys, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionResult } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";

type EvidenceKind = "session" | "attempt" | "review";
type EvidenceValue = TrainingSession | TrainingAttempt<unknown> | ReviewQueueEntry;
type FamilySpec<T extends EvidenceValue> = Readonly<{
  indexKey: string;
  recordPrefix: string;
  keyFor: (id: string) => string;
  guard: (value: unknown) => value is T;
  getId: (value: T) => string;
}>;
type IndexedSnapshot<T> = Readonly<{ values: readonly T[]; revisions: Readonly<Record<string, number>>; indexRevision: number | null }>;
type JournalWriteLike = Readonly<{ kind: string; record?: unknown }>;
type JournalEvidenceLike = Readonly<{ writes: readonly JournalWriteLike[] }>;

const sessionFamily: FamilySpec<TrainingSession> = {
  indexKey: STORAGE_KEYS.TRAINING_SESSION_INDEX,
  recordPrefix: `${STORAGE_NAMESPACE}training-session:`, keyFor: STORAGE_KEYS.trainingSession,
  guard: isTrainingSession, getId: (value) => value.id,
};
const attemptFamily: FamilySpec<TrainingAttempt<unknown>> = {
  indexKey: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
  recordPrefix: `${STORAGE_NAMESPACE}training-attempt:`, keyFor: STORAGE_KEYS.trainingAttempt,
  guard: isTrainingAttempt, getId: (value) => value.id,
};
const reviewFamily: FamilySpec<ReviewQueueEntry> = {
  indexKey: STORAGE_KEYS.REVIEW_INDEX,
  recordPrefix: `${STORAGE_NAMESPACE}review-entry:`, keyFor: STORAGE_KEYS.reviewEntry,
  guard: isReviewQueueEntry, getId: (value) => value.id,
};
const resultPrefix = `${STORAGE_NAMESPACE}training-session-result:`;

function integrityFailure(): never { throw new CanonicalEvidenceIntegrityError(); }
function isIds(value: unknown): value is string[] { return Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim().length > 0); }
function samePersistedPayload(left: unknown, right: unknown): boolean {
  try {
    const leftJson = JSON.stringify(left);
    const rightJson = JSON.stringify(right);
    if (leftJson === undefined || rightJson === undefined) return false;
    return canonicalSerialize(JSON.parse(leftJson)) === canonicalSerialize(JSON.parse(rightJson));
  } catch {
    return false;
  }
}

function readIndexedFamily<T extends EvidenceValue>(
  family: FamilySpec<T>,
  namespaceKeys: readonly string[],
  allowedUnindexed: ReadonlyMap<string, unknown> = new Map(),
): IndexedSnapshot<T> {
  const indexEnvelope = readCanonicalEnvelope(family.indexKey, isIds);
  const ids = indexEnvelope?.payload ?? [];
  if (new Set(ids).size !== ids.length) integrityFailure();

  const indexedIds = new Set(ids);
  const physicalKeys = namespaceKeys.filter((key) => key.startsWith(family.recordPrefix));
  const values: T[] = [];
  const revisions: Record<string, number> = {};
  for (const id of ids) {
    const key = family.keyFor(id);
    if (!physicalKeys.includes(key)) integrityFailure();
    const envelope = readCanonicalEnvelope(key, family.guard);
    if (!envelope || family.getId(envelope.payload) !== id) integrityFailure();
    values.push(envelope.payload);
    revisions[id] = envelope.revision;
  }

  for (const key of physicalKeys) {
    const id = key.slice(family.recordPrefix.length);
    if (!id.trim() || family.keyFor(id) !== key) integrityFailure();
    if (indexedIds.has(id)) continue;
    const envelope = readCanonicalEnvelope(key, family.guard);
    const expected = allowedUnindexed.get(key);
    if (!envelope || expected === undefined || !samePersistedPayload(envelope.payload, expected)
      || family.getId(envelope.payload) !== id) integrityFailure();
    values.push(envelope.payload);
    revisions[id] = envelope.revision;
  }

  return Object.freeze({ values: Object.freeze(values), revisions: Object.freeze(revisions), indexRevision: indexEnvelope?.revision ?? null });
}

function readResultRecords(namespaceKeys: readonly string[]): readonly TrainingSessionResult[] {
  const results: TrainingSessionResult[] = [];
  const seenSessionIds = new Set<string>();
  for (const key of namespaceKeys.filter((candidate) => candidate.startsWith(resultPrefix))) {
    const sessionId = key.slice(resultPrefix.length);
    if (!sessionId.trim() || STORAGE_KEYS.trainingSessionResult(sessionId) !== key || seenSessionIds.has(sessionId)) integrityFailure();
    const envelope = readCanonicalEnvelope(key, isTrainingSessionResult);
    if (!envelope || envelope.payload.sessionId !== sessionId) integrityFailure();
    seenSessionIds.add(sessionId);
    results.push(envelope.payload);
  }
  return Object.freeze(results);
}

export function readTrainingSessionsStrict(): StorageRepositoryResult<TrainingSession[]> {
  const snapshot = readIndexedFamily(sessionFamily, readCanonicalNamespaceKeys());
  return { ok: true, value: [...snapshot.values] };
}

/** Journal-only read for a session target after assertTrainingEvidenceJournalPreflight. */
export function readTrainingSessionForJournal(target: TrainingSession): TrainingSession | null {
  const allowed = new Map([[STORAGE_KEYS.trainingSession(target.id), target]]);
  return readIndexedFamily(sessionFamily, readCanonicalNamespaceKeys(), allowed).values.find((session) => session.id === target.id) ?? null;
}

export function readTrainingAttemptsStrict(): StorageRepositoryResult<TrainingAttempt<unknown>[]> {
  const snapshot = readIndexedFamily(attemptFamily, readCanonicalNamespaceKeys());
  return { ok: true, value: [...snapshot.values] };
}

export function readReviewQueueStrict(): Readonly<{
  result: StorageRepositoryResult<ReviewQueueEntry[]>;
  revisions: Readonly<Record<string, number>>;
  indexRevision: number | null;
}> {
  const snapshot = readIndexedFamily(reviewFamily, readCanonicalNamespaceKeys());
  return Object.freeze({
    result: { ok: true as const, value: [...snapshot.values] },
    revisions: snapshot.revisions,
    indexRevision: snapshot.indexRevision,
  });
}

/** Journal-only read for materialization after assertTrainingEvidenceJournalPreflight. */
export function readReviewQueueForJournal(targets: readonly ReviewQueueEntry[]): readonly ReviewQueueEntry[] {
  const allowed = new Map(targets.map((entry) => [STORAGE_KEYS.reviewEntry(entry.id), entry]));
  return readIndexedFamily(reviewFamily, readCanonicalNamespaceKeys(), allowed).values;
}

/** Full post-replay/account-materialization gate, including result ownership. */
export function assertTrainingEvidenceIntegrity(): void {
  const keys = readCanonicalNamespaceKeys();
  const sessions = readIndexedFamily(sessionFamily, keys).values;
  readIndexedFamily(attemptFamily, keys);
  readIndexedFamily(reviewFamily, keys);
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  for (const result of readResultRecords(keys)) {
    const session = sessionsById.get(result.sessionId);
    if (!session || session.status !== "completed" || session.trackId !== result.trackId) integrityFailure();
  }
}

/**
 * Read-only journal preflight. Only exact record-before-index or
 * index-before-delete prefixes named by this immutable journal are allowed.
 */
export function assertTrainingEvidenceJournalPreflight(journal: JournalEvidenceLike): void {
  const expected = new Map<EvidenceKind, Map<string, unknown>>([
    ["session", new Map()], ["attempt", new Map()], ["review", new Map()],
  ]);
  const pendingSessionWrites = new Map<string, TrainingSession>();
  const expectedResults = new Map<string, TrainingSessionResult>();
  for (const write of journal.writes) {
    const value = write.record;
    if (write.kind === "put_session" && isTrainingSession(value)) {
      expected.get("session")!.set(STORAGE_KEYS.trainingSession(value.id), value);
      pendingSessionWrites.set(value.id, value);
    } else if (write.kind === "put_attempt" && isTrainingAttempt(value)) {
      expected.get("attempt")!.set(STORAGE_KEYS.trainingAttempt(value.id), value);
    } else if (["put_review_entry", "put_review_entry_for_attempt", "update_review_entry"].includes(write.kind) && isReviewQueueEntry(value)) {
      expected.get("review")!.set(STORAGE_KEYS.reviewEntry(value.id), value);
    } else if (["delete_review_entry", "delete_review_entry_for_attempt"].includes(write.kind) && isReviewQueueEntry(value)) {
      expected.get("review")!.set(STORAGE_KEYS.reviewEntry(value.id), value);
    } else if (write.kind === "put_session_result" && isTrainingSessionResult(value)) {
      expectedResults.set(value.sessionId, value);
    }
  }

  const keys = readCanonicalNamespaceKeys();
  const sessions = readIndexedFamily(sessionFamily, keys, expected.get("session")).values;
  const attempts = readIndexedFamily(attemptFamily, keys, expected.get("attempt")).values;
  const reviews = readIndexedFamily(reviewFamily, keys, expected.get("review")).values;
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const reviewsById = new Map(reviews.map((entry) => [entry.id, entry]));
  const immutableReview = (entry: ReviewQueueEntry) => ({ id: entry.id, trackId: entry.trackId, sourceAttemptId: entry.sourceAttemptId, sourceSessionId: entry.sourceSessionId, sourceItem: entry.sourceItem, taxonomyOrSkillRefs: entry.taxonomyOrSkillRefs, createdAt: entry.createdAt });
  for (const write of journal.writes) {
    const value = write.record;
    if (write.kind === "put_attempt" && isTrainingAttempt(value)) {
      const existing = attemptsById.get(value.id);
      if (existing && !samePersistedPayload(existing, value)) integrityFailure();
    }
    if (isReviewQueueEntry(value) && ["put_review_entry", "put_review_entry_for_attempt", "update_review_entry", "delete_review_entry", "delete_review_entry_for_attempt"].includes(write.kind)) {
      const existing = reviewsById.get(value.id);
      if (existing && !samePersistedPayload(immutableReview(existing), immutableReview(value))) integrityFailure();
      if (write.kind === "update_review_entry" && !existing) integrityFailure();
    }
  }
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  for (const result of readResultRecords(keys)) {
    const session = sessionsById.get(result.sessionId);
    const pending = pendingSessionWrites.get(result.sessionId);
    const expectedResult = expectedResults.get(result.sessionId);
    if (expectedResult && !samePersistedPayload(expectedResult, result)) integrityFailure();
    if ((!session || session.status !== "completed" || session.trackId !== result.trackId)
      && (!pending || pending.status !== "completed" || pending.trackId !== result.trackId || !expectedResult)) integrityFailure();
  }
  for (const [sessionId, result] of expectedResults) {
    const parent = pendingSessionWrites.get(sessionId) ?? sessionsById.get(sessionId);
    if (!parent || parent.status !== "completed" || parent.trackId !== result.trackId) integrityFailure();
  }
}

export function readTrainingSessionResultById(sessionId: string): TrainingSessionResult | null {
  const envelope: CanonicalRecordEnvelope<TrainingSessionResult> | null = readCanonicalEnvelope(
    STORAGE_KEYS.trainingSessionResult(sessionId), isTrainingSessionResult,
  );
  if (!envelope) return null;
  if (envelope.payload.sessionId !== sessionId) integrityFailure();
  return envelope.payload;
}
