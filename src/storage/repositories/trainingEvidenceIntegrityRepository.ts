import type { ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionResult } from "../../domain";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { CanonicalEvidenceIntegrityError } from "../errors";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { parseCanonicalRecordEnvelope, readCanonicalEnvelope, readCanonicalKeyPresence, readCanonicalNamespaceKeys, readCanonicalRawValue, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../errors";
import { captureActiveProfileStorageLease, getKeyValueStorage, isKeyValueWriteObservable, MemoryKeyValueStorage, onKeyValueWrite } from "../../infrastructure/storage/mmkvClient";
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
 * J1 (D5a, owner decision D17a): single writer + store epoch.
 *
 * Every write to the active profile store goes through the published
 * `KeyValueStorage`, which reports it to `onKeyValueWrite` (T2.6). On such an
 * observable store this memo is an incrementally maintained evidence index: a
 * key read and validated once is trusted until a write to that key is
 * reported; command paths read and re-validate only the written keys, and the
 * index/key rules are re-checked whenever a family changed. A family snapshot
 * with no write since it was built is reused as a whole (track admission is
 * re-evaluated on every reuse).
 *
 * Full validation (`assertTrainingEvidenceIntegrity`: opening storage,
 * account materialization and recovery, reset, export) drops the memo and
 * reads and validates every byte, which rebuilds the index. Recovery of a
 * pending mutation also drops it. A store that does not report its writes
 * keeps the T2.1 rule: every byte is read on every call and only identical
 * bytes reuse their parse.
 */
/** Upper bound of retained stored text (UTF-16 units); above it the memo is dropped, never trimmed partially. */
const EVIDENCE_MEMO_MAX_CHARS = 6_000_000;
type MemoEntry = Readonly<{ raw: string; envelope: CanonicalRecordEnvelope<unknown> }>;
type FamilyName = EvidenceKind | "result";
type CachedFamily = Readonly<{ version: number; snapshot: IndexedSnapshot<EvidenceValue> }>;
type EvidenceMemo = {
  storage: object; lease: string; admission: object;
  /** The store reports every write: unwritten keys are trusted without a read. */
  trusted: boolean;
  /** Validated envelope per key; `null` is a key read as absent. */
  entries: Map<string, MemoEntry | null>; chars: number;
  /** Keys written since their last read. */
  dirty: Set<string>;
  /** Sorted evidence record keys present in the store, and keys whose presence may have changed. */
  keys: readonly string[] | null; keysDirty: Set<string>;
  versions: Map<FamilyName, number>;
  families: Map<FamilyName, CachedFamily>;
  results: Readonly<{ version: number; values: readonly TrainingSessionResult[] }> | null;
};
let evidenceMemo: EvidenceMemo | null = null;
const evidenceMemoCounters = { hits: 0, misses: 0, clears: 0, reads: 0, familyHits: 0 };
export function readTrainingEvidenceMemoCountersForTests(): Readonly<typeof evidenceMemoCounters> { return { ...evidenceMemoCounters }; }
export function resetTrainingEvidenceMemoCountersForTests(): void { for (const key of Object.keys(evidenceMemoCounters) as (keyof typeof evidenceMemoCounters)[]) evidenceMemoCounters[key] = 0; }
/** Drops the evidence index. Full-integrity, recovery and profile transitions start from bytes alone. */
export function clearTrainingEvidenceMemo(): void { if (evidenceMemo) evidenceMemoCounters.clears += 1; evidenceMemo = null; }

const resultIndexFree = "result";
function familyOfKey(key: string): FamilyName | null {
  if (key.startsWith(resultPrefix)) return resultIndexFree;
  if (key === sessionFamily.indexKey || key.startsWith(sessionFamily.recordPrefix)) return "session";
  if (key === attemptFamily.indexKey || key.startsWith(attemptFamily.recordPrefix)) return "attempt";
  if (key === reviewFamily.indexKey || key.startsWith(reviewFamily.recordPrefix)) return "review";
  return null;
}
function isEvidenceRecordKey(key: string): boolean {
  return key.startsWith(sessionFamily.recordPrefix) || key.startsWith(attemptFamily.recordPrefix) || key.startsWith(reviewFamily.recordPrefix) || key.startsWith(resultPrefix);
}
// The store epoch: every reported write to an evidence key invalidates exactly that key and its family.
onKeyValueWrite((storage, key) => {
  const memo = evidenceMemo;
  if (!memo || memo.storage !== storage) return;
  const family = familyOfKey(key);
  if (family === null) return;
  memo.dirty.add(key);
  if (isEvidenceRecordKey(key)) memo.keysDirty.add(key);
  memo.versions.set(family, (memo.versions.get(family) ?? 0) + 1);
});

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
    evidenceMemo = {
      storage, lease: key, admission, trusted: isKeyValueWriteObservable(storage),
      entries: new Map(), chars: 0, dirty: new Set(), keys: null, keysDirty: new Set(), versions: new Map(), families: new Map(), results: null,
    };
  }
  return evidenceMemo;
}
/** The memo of this storage owner, lease and admission context, without creating or dropping one. */
function currentMemo(admission: object): EvidenceMemo | null {
  const memo = evidenceMemo;
  if (!memo) return null;
  let storage: object;
  try { storage = getKeyValueStorage(); } catch { return null; }
  return memo.storage === storage && memo.lease === (leaseKey() ?? (storage instanceof MemoryKeyValueStorage ? "unprofiled-test-storage" : null)) && memo.admission === admission ? memo : null;
}

/**
 * J1/J2: the validated bytes, ids and revision of one evidence index key when
 * no write to it was reported since they were read; null otherwise (the caller reads the store).
 */
export function readTrustedEvidenceIndex(key: string, admission: TrackAdmissionContext): Readonly<{ raw: string; ids: readonly string[]; revision: number }> | null {
  if (key !== sessionFamily.indexKey && key !== attemptFamily.indexKey && key !== reviewFamily.indexKey) return null;
  const memo = currentMemo(admission);
  if (!memo || !memo.trusted || memo.dirty.has(key)) return null;
  const entry = memo.entries.get(key);
  if (!entry || !isIds(entry.envelope.payload)) return null;
  return Object.freeze({ raw: entry.raw, ids: entry.envelope.payload, revision: entry.envelope.revision });
}

function forget(memo: EvidenceMemo, key: string): void {
  const cached = memo.entries.get(key);
  if (cached) memo.chars -= cached.raw.length;
  memo.entries.delete(key);
}
/** Same result and errors as `readCanonicalEnvelope(key, guard)`; an unwritten key or identical bytes skip parse and guard. */
function readEvidenceEnvelope<T>(key: string, guard: (value: unknown) => value is T, admission: TrackAdmissionContext, trackIdOf: ((value: T) => string) | null, useMemo: boolean): CanonicalRecordEnvelope<T> | null {
  const memo = useMemo ? memoFor(admission) : null;
  if (!memo) return readCanonicalEnvelope(key, guard);
  if (memo.trusted && !memo.dirty.has(key) && memo.entries.has(key)) {
    const trusted = memo.entries.get(key)!;
    if (trusted === null) { evidenceMemoCounters.hits += 1; return null; }
    if (!trackIdOf || admission.isAdmittedTrackId(trackIdOf(trusted.envelope.payload as T))) { evidenceMemoCounters.hits += 1; return trusted.envelope as CanonicalRecordEnvelope<T>; }
  }
  evidenceMemoCounters.reads += 1;
  const raw = readCanonicalRawValue(key);
  memo.dirty.delete(key);
  const cached = memo.entries.get(key);
  if (raw === undefined) {
    forget(memo, key);
    if (memo.trusted) memo.entries.set(key, null);
    return null;
  }
  if (cached && cached.raw === raw) {
    const payload = cached.envelope.payload as T;
    if (!trackIdOf || admission.isAdmittedTrackId(trackIdOf(payload))) { evidenceMemoCounters.hits += 1; return cached.envelope as CanonicalRecordEnvelope<T>; }
  }
  evidenceMemoCounters.misses += 1;
  forget(memo, key);
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

/** Evidence record keys (sorted). On an observable store only keys written since the last call are probed. */
function readEvidenceRecordKeys(admission: TrackAdmissionContext, useMemo: boolean): readonly string[] {
  const memo = useMemo ? memoFor(admission) : null;
  if (!memo || !memo.trusted) return readCanonicalNamespaceKeys();
  if (memo.keys === null) {
    memo.keysDirty.clear();
    memo.keys = Object.freeze(readCanonicalNamespaceKeys().filter(isEvidenceRecordKey));
    return memo.keys;
  }
  if (memo.keysDirty.size > 0) {
    const present = new Set(memo.keys);
    let changed = false;
    for (const key of memo.keysDirty) {
      const exists = readCanonicalKeyPresence(key);
      if (exists !== present.has(key)) { changed = true; if (exists) present.add(key); else present.delete(key); }
    }
    memo.keysDirty.clear();
    if (changed) memo.keys = Object.freeze([...present].sort());
  }
  return memo.keys;
}

function familyName(family: Readonly<{ indexKey: string }>): EvidenceKind {
  return family.indexKey === sessionFamily.indexKey ? "session" : family.indexKey === attemptFamily.indexKey ? "attempt" : "review";
}
/** A family unchanged since its last snapshot (no reported write) is reused after re-checking admission. */
function cachedFamily<T extends EvidenceValue>(family: FamilySpec<T>, admission: TrackAdmissionContext, useMemo: boolean): IndexedSnapshot<T> | null {
  const memo = useMemo ? memoFor(admission) : null;
  if (!memo || !memo.trusted) return null;
  const name = familyName(family);
  const cached = memo.families.get(name);
  if (!cached || cached.version !== (memo.versions.get(name) ?? 0)) return null;
  for (const value of cached.snapshot.values) if (!admission.isAdmittedTrackId(value.trackId)) return null;
  evidenceMemoCounters.familyHits += 1;
  return cached.snapshot as IndexedSnapshot<T>;
}

function readIndexedFamily<T extends EvidenceValue>(
  family: FamilySpec<T>,
  namespaceKeys: readonly string[],
  admission: TrackAdmissionContext,
  allowedUnindexed: ReadonlyMap<string, unknown> = new Map(),
  useMemo = true,
): IndexedSnapshot<T> {
  const reused = cachedFamily(family, admission, useMemo);
  if (reused) return reused;
  const memo = useMemo ? memoFor(admission) : null;
  const name = familyName(family);
  const version = memo?.versions.get(name) ?? 0;
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

  let unindexed = false;
  for (const key of physicalKeys) {
    const id = key.slice(family.recordPrefix.length);
    if (!id.trim() || family.keyFor(id) !== key) integrityFailure();
    if (indexedIds.has(id)) continue;
    unindexed = true;
    const envelope = readEvidenceEnvelope(key, (value): value is T => family.guard(value, admission), admission, trackIdOfEvidence, useMemo);
    const expected = allowedUnindexed.get(key);
    if (!envelope || expected === undefined || !samePersistedPayload(envelope.payload, expected)
      || family.getId(envelope.payload) !== id) integrityFailure();
    values.push(envelope.payload);
    revisions[id] = envelope.revision;
  }

  const snapshot = Object.freeze({ values: Object.freeze(values), revisions: Object.freeze(revisions), indexRevision: indexEnvelope?.revision ?? null });
  // Only a snapshot that no allowance shaped is reusable; nothing was written while it was read (synchronous).
  if (memo && memo === evidenceMemo && memo.trusted && !unindexed && (memo.versions.get(name) ?? 0) === version) {
    memo.families.set(name, Object.freeze({ version, snapshot: snapshot as IndexedSnapshot<EvidenceValue> }));
  }
  return snapshot;
}

function readResultRecords(namespaceKeys: readonly string[], admission: TrackAdmissionContext, useMemo = true): readonly TrainingSessionResult[] {
  const current = useMemo ? memoFor(admission) : null;
  const memo = current?.trusted ? current : null;
  const version = memo?.versions.get("result") ?? 0;
  if (memo?.results && memo.results.version === version && memo.results.values.every((result) => admission.isAdmittedTrackId(result.trackId))) {
    evidenceMemoCounters.familyHits += 1;
    return memo.results.values;
  }
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
  const values = Object.freeze(results);
  if (memo && memo === evidenceMemo && (memo.versions.get("result") ?? 0) === version) memo.results = Object.freeze({ version, values });
  return values;
}

export function readTrainingSessionsStrict(admission: TrackAdmissionContext): StorageRepositoryResult<TrainingSession[]> {
  const snapshot = readIndexedFamily(sessionFamily, readEvidenceRecordKeys(admission, true), admission);
  return { ok: true, value: [...snapshot.values] };
}

/** Journal-only read for a session target after assertTrainingEvidenceJournalPreflight. */
export function readTrainingSessionForJournal(target: TrainingSession, admission: TrackAdmissionContext): TrainingSession | null {
  const allowed = new Map([[STORAGE_KEYS.trainingSession(target.id), target]]);
  return readIndexedFamily(sessionFamily, readEvidenceRecordKeys(admission, true), admission, allowed).values.find((session) => session.id === target.id) ?? null;
}

export function readTrainingAttemptsStrict(admission: TrackAdmissionContext): StorageRepositoryResult<TrainingAttempt<unknown>[]> {
  const snapshot = readIndexedFamily(attemptFamily, readEvidenceRecordKeys(admission, true), admission);
  return { ok: true, value: [...snapshot.values] };
}

export function readReviewQueueStrict(admission: TrackAdmissionContext): Readonly<{
  result: StorageRepositoryResult<ReviewQueueEntry[]>;
  revisions: Readonly<Record<string, number>>;
  indexRevision: number | null;
}> {
  const snapshot = readIndexedFamily(reviewFamily, readEvidenceRecordKeys(admission, true), admission);
  return Object.freeze({
    result: { ok: true as const, value: [...snapshot.values] },
    revisions: snapshot.revisions,
    indexRevision: snapshot.indexRevision,
  });
}

/** Journal-only read for materialization after assertTrainingEvidenceJournalPreflight. */
export function readReviewQueueForJournal(targets: readonly ReviewQueueEntry[], admission: TrackAdmissionContext): readonly ReviewQueueEntry[] {
  const allowed = new Map(targets.map((entry) => [STORAGE_KEYS.reviewEntry(entry.id), entry]));
  return readIndexedFamily(reviewFamily, readEvidenceRecordKeys(admission, true), admission, allowed).values;
}

/** Strict evidence read, including result ownership. On an observable store only written keys are read again (J1); otherwise every byte. */
export function readTrainingEvidenceSnapshotStrict(admission: TrackAdmissionContext, useMemo = true): Readonly<{
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
}> {
  const keys = readEvidenceRecordKeys(admission, useMemo);
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

/**
 * Full post-replay/account-materialization gate, including result ownership (D5).
 * Drops the evidence index, then reads and validates every stored byte; the
 * validated bytes become the new index for later command paths (J1).
 */
export function assertTrainingEvidenceIntegrity(admission: TrackAdmissionContext): void {
  clearTrainingEvidenceMemo();
  readTrainingEvidenceSnapshotStrict(admission, true);
}

/** The same gate for a new local learning command: only keys written since the last validation are read again (J1). */
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

  const keys = readEvidenceRecordKeys(admission, true);
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
