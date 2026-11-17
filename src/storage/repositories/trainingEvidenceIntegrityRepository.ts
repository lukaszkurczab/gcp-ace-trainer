import type { ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionResult } from "../../domain";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { CanonicalEvidenceIntegrityError } from "../errors";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { parseCanonicalRecordEnvelope, readCanonicalEnvelope, readCanonicalNamespaceKeys, readCanonicalRawValue, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../errors";
import { captureActiveProfileStorageLease, getKeyValueStorage, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionResult } from "./trainingModelGuards";
import type { StorageRepositoryResult } from "./result";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

type EvidenceKind = "session" | "attempt" | "review";
type EvidenceValue = TrainingSession | TrainingAttempt<unknown> | ReviewQueueEntry;
type FamilySpec<T extends EvidenceValue> = Readonly<{
  indexKey: string;
  recordPrefix: string;
  keyFor: (id: string) => string;
  guard: (value: unknown, admission: TrackAdmissionContext) => value is T;
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

/**
 * T2.1 (D5): a strict family read still fetches every stored value and checks
 * every index/key rule on each call. Only the JSON parse and record guard of
 * bytes identical to an earlier accepted read on the same storage owner and
 * admission context are reused; their payload is frozen so it cannot drift
 * from those bytes. Track admission is re-evaluated on every reuse.
 * Command paths only: `assertTrainingEvidenceIntegrity` (opening-storage,
 * account recovery, reset, export) always validates every byte and clears the memo.
 */
/** Upper bound of retained stored text (UTF-16 units); above it the memo is dropped, never trimmed partially. */
const EVIDENCE_MEMO_MAX_CHARS = 6_000_000;
type MemoEntry = Readonly<{ raw: string; envelope: CanonicalRecordEnvelope<unknown> }>;
type EvidenceMemo = { storage: object; lease: string; admission: object; entries: Map<string, MemoEntry>; chars: number };
let evidenceMemo: EvidenceMemo | null = null;
const evidenceMemoCounters = { hits: 0, misses: 0, clears: 0 };
export function readTrainingEvidenceMemoCountersForTests(): Readonly<typeof evidenceMemoCounters> { return { ...evidenceMemoCounters }; }
export function resetTrainingEvidenceMemoCountersForTests(): void { evidenceMemoCounters.hits = 0; evidenceMemoCounters.misses = 0; evidenceMemoCounters.clears = 0; }
/** Drops every reused parse. Full-integrity, recovery and profile transitions start from bytes alone. */
export function clearTrainingEvidenceMemo(): void { if (evidenceMemo) evidenceMemoCounters.clears += 1; evidenceMemo = null; }

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
function leaseKey(): string | null {
  const lease = captureActiveProfileStorageLease();
  return lease ? JSON.stringify([lease.profile.id, lease.profile.kind, lease.profile.accountId, lease.generation]) : null;
}
/** The memo is bound to one storage owner, one profile lease (profile, actor, generation) and one admission context. */
function memoFor(admission: object): EvidenceMemo | null {
  const storage = getKeyValueStorage();
  const lease = leaseKey();
  if (lease === null && !(storage instanceof MemoryKeyValueStorage)) { clearTrainingEvidenceMemo(); return null; }
  const key = lease ?? "unprofiled-test-storage";
  if (!evidenceMemo || evidenceMemo.storage !== storage || evidenceMemo.lease !== key || evidenceMemo.admission !== admission) {
    clearTrainingEvidenceMemo();
    evidenceMemo = { storage, lease: key, admission, entries: new Map(), chars: 0 };
  }
  return evidenceMemo;
}
/** Same result and errors as `readCanonicalEnvelope(key, guard)`; identical bytes skip parse and guard. */
function readEvidenceEnvelope<T>(key: string, guard: (value: unknown) => value is T, admission: TrackAdmissionContext, trackIdOf: ((value: T) => string) | null, useMemo: boolean): CanonicalRecordEnvelope<T> | null {
  const memo = useMemo ? memoFor(admission) : null;
  if (!memo) return readCanonicalEnvelope(key, guard);
  const raw = readCanonicalRawValue(key);
  const cached = memo.entries.get(key);
  if (raw === undefined) { if (cached) { memo.entries.delete(key); memo.chars -= cached.raw.length; } return null; }
  if (cached && cached.raw === raw) {
    const payload = cached.envelope.payload as T;
    if (!trackIdOf || admission.isAdmittedTrackId(trackIdOf(payload))) { evidenceMemoCounters.hits += 1; return cached.envelope as CanonicalRecordEnvelope<T>; }
  }
  evidenceMemoCounters.misses += 1;
  if (cached) { memo.entries.delete(key); memo.chars -= cached.raw.length; }
  const envelope = parseCanonicalRecordEnvelope(raw, key);
  if (!envelope || !guard(envelope.payload)) throw new UnsupportedStoredRecordError(key);
  const frozen = deepFreeze(envelope) as CanonicalRecordEnvelope<T>;
  // Keeps a reference to the string storage already returned; no second copy.
  memo.entries.set(key, Object.freeze({ raw, envelope: frozen }));
  memo.chars += raw.length;
  if (memo.chars > EVIDENCE_MEMO_MAX_CHARS) clearTrainingEvidenceMemo();
  return frozen;
}
const trackIdOfEvidence = (value: { trackId: string }) => value.trackId;

function readIndexedFamily<T extends EvidenceValue>(
  family: FamilySpec<T>,
  namespaceKeys: readonly string[],
  admission: TrackAdmissionContext,
  allowedUnindexed: ReadonlyMap<string, unknown> = new Map(),
  useMemo = true,
): IndexedSnapshot<T> {
  const indexEnvelope = readEvidenceEnvelope(family.indexKey, isIds, admission, null, useMemo);
  const ids = indexEnvelope?.payload ?? [];
  if (new Set(ids).size !== ids.length) integrityFailure();

  const indexedIds = new Set(ids);
  const physicalKeys = new Set(namespaceKeys.filter((key) => key.startsWith(family.recordPrefix)));
  const values: T[] = [];
  const revisions: Record<string, number> = {};
  for (const id of ids) {
    const key = family.keyFor(id);
    if (!physicalKeys.has(key)) integrityFailure();
    const envelope = readEvidenceEnvelope(key, (value): value is T => family.guard(value, admission), admission, trackIdOfEvidence, useMemo);
    if (!envelope || family.getId(envelope.payload) !== id) integrityFailure();
    values.push(envelope.payload);
    revisions[id] = envelope.revision;
  }

  for (const key of physicalKeys) {
    const id = key.slice(family.recordPrefix.length);
    if (!id.trim() || family.keyFor(id) !== key) integrityFailure();
    if (indexedIds.has(id)) continue;
    const envelope = readEvidenceEnvelope(key, (value): value is T => family.guard(value, admission), admission, trackIdOfEvidence, useMemo);
    const expected = allowedUnindexed.get(key);
    if (!envelope || expected === undefined || !samePersistedPayload(envelope.payload, expected)
      || family.getId(envelope.payload) !== id) integrityFailure();
    values.push(envelope.payload);
    revisions[id] = envelope.revision;
  }

  return Object.freeze({ values: Object.freeze(values), revisions: Object.freeze(revisions), indexRevision: indexEnvelope?.revision ?? null });
}

function readResultRecords(namespaceKeys: readonly string[], admission: TrackAdmissionContext, useMemo = true): readonly TrainingSessionResult[] {
  const results: TrainingSessionResult[] = [];
  const seenSessionIds = new Set<string>();
  for (const key of namespaceKeys.filter((candidate) => candidate.startsWith(resultPrefix))) {
    const sessionId = key.slice(resultPrefix.length);
    if (!sessionId.trim() || STORAGE_KEYS.trainingSessionResult(sessionId) !== key || seenSessionIds.has(sessionId)) integrityFailure();
    const envelope = readEvidenceEnvelope(key, (value): value is TrainingSessionResult => isTrainingSessionResult(value, admission), admission, trackIdOfEvidence, useMemo);
    if (!envelope || envelope.payload.sessionId !== sessionId) integrityFailure();
    seenSessionIds.add(sessionId);
    results.push(envelope.payload);
  }
  return Object.freeze(results);
}

export function readTrainingSessionsStrict(admission: TrackAdmissionContext): StorageRepositoryResult<TrainingSession[]> {
  const snapshot = readIndexedFamily(sessionFamily, readCanonicalNamespaceKeys(), admission);
  return { ok: true, value: [...snapshot.values] };
}

/** Journal-only read for a session target after assertTrainingEvidenceJournalPreflight. */
export function readTrainingSessionForJournal(target: TrainingSession, admission: TrackAdmissionContext): TrainingSession | null {
  const allowed = new Map([[STORAGE_KEYS.trainingSession(target.id), target]]);
  return readIndexedFamily(sessionFamily, readCanonicalNamespaceKeys(), admission, allowed).values.find((session) => session.id === target.id) ?? null;
}

export function readTrainingAttemptsStrict(admission: TrackAdmissionContext): StorageRepositoryResult<TrainingAttempt<unknown>[]> {
  const snapshot = readIndexedFamily(attemptFamily, readCanonicalNamespaceKeys(), admission);
  return { ok: true, value: [...snapshot.values] };
}

export function readReviewQueueStrict(admission: TrackAdmissionContext): Readonly<{
  result: StorageRepositoryResult<ReviewQueueEntry[]>;
  revisions: Readonly<Record<string, number>>;
  indexRevision: number | null;
}> {
  const snapshot = readIndexedFamily(reviewFamily, readCanonicalNamespaceKeys(), admission);
  return Object.freeze({
    result: { ok: true as const, value: [...snapshot.values] },
    revisions: snapshot.revisions,
    indexRevision: snapshot.indexRevision,
  });
}

/** Journal-only read for materialization after assertTrainingEvidenceJournalPreflight. */
export function readReviewQueueForJournal(targets: readonly ReviewQueueEntry[], admission: TrackAdmissionContext): readonly ReviewQueueEntry[] {
  const allowed = new Map(targets.map((entry) => [STORAGE_KEYS.reviewEntry(entry.id), entry]));
  return readIndexedFamily(reviewFamily, readCanonicalNamespaceKeys(), admission, allowed).values;
}

/** Fresh full evidence read, including result ownership: every stored byte is re-read on each call (only identical bytes reuse their parse). */
export function readTrainingEvidenceSnapshotStrict(admission: TrackAdmissionContext, useMemo = true): Readonly<{
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
}> {
  const keys = readCanonicalNamespaceKeys();
  const sessions = readIndexedFamily(sessionFamily, keys, admission, undefined, useMemo).values;
  const attempts = readIndexedFamily(attemptFamily, keys, admission, undefined, useMemo).values;
  const reviews = readIndexedFamily(reviewFamily, keys, admission, undefined, useMemo).values;
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  for (const result of readResultRecords(keys, admission, useMemo)) {
    const session = sessionsById.get(result.sessionId);
    if (!session || session.status !== "completed" || session.trackId !== result.trackId) integrityFailure();
  }
  return Object.freeze({ sessions, attempts, reviews });
}

/** Full post-replay/account-materialization gate, including result ownership. Never uses the memo (D5). */
export function assertTrainingEvidenceIntegrity(admission: TrackAdmissionContext): void {
  clearTrainingEvidenceMemo();
  readTrainingEvidenceSnapshotStrict(admission, false);
}

/** The same gate for a new local learning command; identical bytes reuse their accepted parse (T2.1). */
export function assertTrainingEvidenceIntegrityForCommand(admission: TrackAdmissionContext): void {
  readTrainingEvidenceSnapshotStrict(admission);
}

/**
 * Read-only journal preflight. Only exact record-before-index or
 * index-before-delete prefixes named by this immutable journal are allowed.
 */
export function assertTrainingEvidenceJournalPreflight(journal: JournalEvidenceLike, admission: TrackAdmissionContext): void {
  const expected = new Map<EvidenceKind, Map<string, unknown>>([
    ["session", new Map()], ["attempt", new Map()], ["review", new Map()],
  ]);
  const pendingSessionWrites = new Map<string, TrainingSession>();
  const expectedResults = new Map<string, TrainingSessionResult>();
  for (const write of journal.writes) {
    const value = write.record;
    if (write.kind === "put_session" && isTrainingSession(value, admission)) {
      expected.get("session")!.set(STORAGE_KEYS.trainingSession(value.id), value);
      pendingSessionWrites.set(value.id, value);
    } else if (write.kind === "put_attempt" && isTrainingAttempt(value, admission)) {
      expected.get("attempt")!.set(STORAGE_KEYS.trainingAttempt(value.id), value);
    } else if (["put_review_entry", "put_review_entry_for_attempt", "update_review_entry"].includes(write.kind) && isReviewQueueEntry(value, admission)) {
      expected.get("review")!.set(STORAGE_KEYS.reviewEntry(value.id), value);
    } else if (["delete_review_entry", "delete_review_entry_for_attempt"].includes(write.kind) && isReviewQueueEntry(value, admission)) {
      expected.get("review")!.set(STORAGE_KEYS.reviewEntry(value.id), value);
    } else if (write.kind === "put_session_result" && isTrainingSessionResult(value, admission)) {
      expectedResults.set(value.sessionId, value);
    }
  }

  const keys = readCanonicalNamespaceKeys();
  const sessions = readIndexedFamily(sessionFamily, keys, admission, expected.get("session")).values;
  const attempts = readIndexedFamily(attemptFamily, keys, admission, expected.get("attempt")).values;
  const reviews = readIndexedFamily(reviewFamily, keys, admission, expected.get("review")).values;
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const reviewsById = new Map(reviews.map((entry) => [entry.id, entry]));
  const immutableReview = (entry: ReviewQueueEntry) => ({ id: entry.id, trackId: entry.trackId, sourceAttemptId: entry.sourceAttemptId, sourceSessionId: entry.sourceSessionId, sourceItem: entry.sourceItem, taxonomyOrSkillRefs: entry.taxonomyOrSkillRefs, createdAt: entry.createdAt });
  for (const write of journal.writes) {
    const value = write.record;
    if (write.kind === "put_attempt" && isTrainingAttempt(value, admission)) {
      const existing = attemptsById.get(value.id);
      if (existing && !samePersistedPayload(existing, value)) integrityFailure();
    }
    if (isReviewQueueEntry(value, admission) && ["put_review_entry", "put_review_entry_for_attempt", "update_review_entry", "delete_review_entry", "delete_review_entry_for_attempt"].includes(write.kind)) {
      const existing = reviewsById.get(value.id);
      if (existing && !samePersistedPayload(immutableReview(existing), immutableReview(value))) integrityFailure();
      if (write.kind === "update_review_entry" && !existing) integrityFailure();
    }
  }
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  for (const result of readResultRecords(keys, admission)) {
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

export function readTrainingSessionResultById(sessionId: string, admission: TrackAdmissionContext): TrainingSessionResult | null {
  const envelope: CanonicalRecordEnvelope<TrainingSessionResult> | null = readCanonicalEnvelope(
    STORAGE_KEYS.trainingSessionResult(sessionId), (value): value is TrainingSessionResult => isTrainingSessionResult(value, admission),
  );
  if (!envelope) return null;
  if (envelope.payload.sessionId !== sessionId) integrityFailure();
  return envelope.payload;
}
