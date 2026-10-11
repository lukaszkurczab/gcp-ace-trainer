import { captureActiveProfileStorageLease, getKeyValueStorage, isActiveProfileStorageLeaseCurrent, MemoryKeyValueStorage, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { CanonicalWriteConflictError, CorruptStoredRecordError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../errors";
import { STORAGE_NAMESPACE } from "../keys";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

/**
 * The sole MMKV access boundary.  It intentionally lives with repository
 * implementations: application, content, and presentation code cannot read
 * or write persistence values directly.
 */
export type StorageValueGuard<T> = (value: unknown) => value is T;
export const CANONICAL_RECORD_SCHEMA = "patternly:canonical:v1" as const;
export type CanonicalRecordEnvelope<T> = Readonly<{
  schemaIdentity: typeof CANONICAL_RECORD_SCHEMA;
  revision: number;
  payload: T;
}>;

export type CanonicalPhysicalState = Readonly<{ kind: "absent" }> | Readonly<{
  kind: "present";
  revision: number;
  digest: string;
  payloadDigest: string;
  /** Retained only for ordered index derivation and small ownership keys. */
  envelope?: CanonicalRecordEnvelope<unknown>;
}>;
export type CanonicalPhysicalAfter = Readonly<{ kind: "absent" }> | Readonly<{
  kind: "present";
  envelope: CanonicalRecordEnvelope<unknown>;
  digest: string;
}>;
export type CanonicalPhysicalWrite = Readonly<{
  target: string;
  key: string;
  before: CanonicalPhysicalState;
  after: CanonicalPhysicalAfter;
}>;

/**
 * Write result for the two user-visible operations which must distinguish a
 * pre-write rejection from an uncertain acknowledgement. Other repositories
 * continue to use the ordinary canonical write API below.
 */
export type CanonicalWriteAttempt<T> = Readonly<{
  key: string;
  priorRaw: string | undefined;
  afterRaw: string;
  envelope: CanonicalRecordEnvelope<T>;
  storage: ReturnType<typeof getKeyValueStorage>;
  lease: ActiveProfileStorageLease | null;
}>;
export type CanonicalWriteOutcome<T> =
  | Readonly<{ kind: "verified"; envelope: CanonicalRecordEnvelope<T>; attempt: CanonicalWriteAttempt<T> }>
  | Readonly<{ kind: "provenNotApplied"; cause: unknown; attempt?: CanonicalWriteAttempt<T> }>
  | Readonly<{ kind: "conflict"; cause: unknown; attempt?: CanonicalWriteAttempt<T> }>
  | Readonly<{ kind: "unknown"; cause: unknown; attempt?: CanonicalWriteAttempt<T> }>;

const activeWrites = new Set<string>();

/**
 * Runs a synchronous group of canonical writes while holding every requested
 * key.  Locks are acquired in a deterministic order so callers which touch
 * more than one record cannot deadlock each other.  This is deliberately
 * synchronous: MMKV writes are synchronous and an async callback would make
 * it possible for a caller to accidentally release the lock too early.
 */
export function withCanonicalWriteLocks<T>(keys: readonly string[], work: () => T): T {
  const orderedKeys = [...new Set(keys)].sort();
  if (orderedKeys.some((key) => typeof key !== "string" || !key.trim())) {
    throw new TypeError("Canonical write locks require concrete non-empty keys.");
  }
  const conflict = orderedKeys.find((key) => activeWrites.has(key));
  if (conflict) throw new CanonicalWriteConflictError(conflict);
  for (const key of orderedKeys) activeWrites.add(key);
  try {
    return work();
  } finally {
    for (const key of orderedKeys) activeWrites.delete(key);
  }
}

function isEnvelope(value: unknown): value is CanonicalRecordEnvelope<unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (value as Record<string, unknown>).schemaIdentity === CANONICAL_RECORD_SCHEMA &&
    Number.isSafeInteger((value as Record<string, unknown>).revision) && Number((value as Record<string, unknown>).revision) >= 1 &&
    Object.keys(value).length === 3 && "payload" in value;
}

export function readCanonicalEnvelope<T>(key: string, guard: StorageValueGuard<T>): CanonicalRecordEnvelope<T> | null {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(key); } catch (error) { throw new StorageReadError(key, error); }
  if (raw === undefined) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new CorruptStoredRecordError(key); }
  if (!isEnvelope(value) || !guard(value.payload)) throw new UnsupportedStoredRecordError(key);
  return value as CanonicalRecordEnvelope<T>;
}

/** Capture an immutable physical write description at command preflight. */
export function captureCanonicalPhysicalWrite(
  target: string,
  key: string,
  desiredInput: Readonly<{ kind: "write"; payload: unknown }> | Readonly<{ kind: "remove" }> |
    ((before: CanonicalRecordEnvelope<unknown> | null) => Readonly<{ kind: "write"; payload: unknown }> | Readonly<{ kind: "remove" }>),
  retainBeforeEnvelope = false,
): CanonicalPhysicalWrite {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(key); } catch (error) { throw new StorageReadError(key, error); }
  const current = parseEnvelope(raw, key);
  const before: CanonicalPhysicalState = current === null
    ? Object.freeze({ kind: "absent" })
    : Object.freeze({ kind: "present", revision: current.revision, digest: sha256Utf8(raw!), payloadDigest: sha256Utf8(JSON.stringify(current.payload)), ...(retainBeforeEnvelope ? { envelope: current } : {}) });
  const desired = typeof desiredInput === "function" ? desiredInput(current) : desiredInput;
  let after: CanonicalPhysicalAfter;
  if (desired.kind === "remove") {
    after = Object.freeze({ kind: "absent" });
  } else {
    const unchanged = current !== null && JSON.stringify(current.payload) === JSON.stringify(desired.payload);
    const envelope = Object.freeze({
      schemaIdentity: CANONICAL_RECORD_SCHEMA,
      revision: unchanged ? current.revision : (current?.revision ?? 0) + 1,
      payload: desired.payload,
    });
    after = Object.freeze({ kind: "present", envelope, digest: unchanged ? (before.kind === "present" ? before.digest : "") : sha256Utf8(JSON.stringify(envelope)) });
  }
  return Object.freeze({ target, key, before, after });
}

export function canonicalPhysicalWriteRelation(write: CanonicalPhysicalWrite): "before" | "after" | "conflict" {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(write.key); } catch (error) { throw new StorageReadError(write.key, error); }
  const isBeforeState = (state: CanonicalPhysicalState): boolean => {
    if (state.kind === "absent") return raw === undefined;
    if (raw === undefined || sha256Utf8(raw) !== state.digest) return false;
    try {
      const envelope = parseEnvelope(raw, write.key);
      return envelope !== null && envelope.revision === state.revision && sha256Utf8(JSON.stringify(envelope.payload)) === state.payloadDigest;
    } catch { return false; }
  };
  const beforeMatches = isBeforeState(write.before);
  const afterMatches = isAfterState(raw, write.after);
  if (beforeMatches) return "before";
  if (afterMatches) return "after";
  return "conflict";
}

/** Fresh exact-after check, including raw digest, revision and required absence. */
export function isCanonicalPhysicalWriteAfter(write: CanonicalPhysicalWrite): boolean {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(write.key); } catch (error) { throw new StorageReadError(write.key, error); }
  return isAfterState(raw, write.after);
}

/** All physical keys must represent a legal ordered prefix before a replay writes anything. */
export function assertCanonicalPhysicalPrefix(writes: readonly CanonicalPhysicalWrite[]): void {
  let firstUnapplied = false;
  for (const write of writes) {
    const relation = canonicalPhysicalWriteRelation(write);
    if (relation === "conflict") throw new CanonicalWriteConflictError(write.key);
    const isNoop = samePhysicalStates(write.before, write.after);
    if (isNoop) continue;
    if (relation === "before") firstUnapplied = true;
    else if (firstUnapplied) throw new CanonicalWriteConflictError(write.key);
  }
}

/** Apply one exact step. An exact-after state is a no-op and keeps its revision. */
export function applyCanonicalPhysicalWrite(write: CanonicalPhysicalWrite): void {
  withCanonicalWriteLocks([write.key], () => {
    const relation = canonicalPhysicalWriteRelation(write);
    if (samePhysicalStates(write.before, write.after)) {
      if (relation !== "before") throw new CanonicalWriteConflictError(write.key);
      return;
    }
    if (relation === "after") return;
    if (relation !== "before") throw new CanonicalWriteConflictError(write.key);
    const storage = getKeyValueStorage();
    if (write.after.kind === "absent") {
      try { storage.remove(write.key); } catch (error) { throw new StorageDeleteError(write.key, error); }
      let observed: string | undefined;
      try { observed = storage.getString(write.key); } catch (error) { throw new StorageReadError(write.key, error); }
      if (observed !== undefined) throw new StorageDeleteError(write.key, new Error("Canonical removal did not reach its exact absent state."));
      return;
    }
    const raw = JSON.stringify(write.after.envelope);
    try { storage.setString(write.key, raw); } catch (error) { throw new StorageWriteError(write.key, error); }
    let observed: string | undefined;
    try { observed = storage.getString(write.key); } catch (error) { throw new StorageReadError(write.key, error); }
    if (observed !== raw) throw new StorageWriteError(write.key, new Error("Canonical write did not reach its exact intended envelope."));
  });
}

function isAfterState(raw: string | undefined, state: CanonicalPhysicalAfter): boolean {
  if (state.kind === "absent") return raw === undefined;
  if (raw === undefined || sha256Utf8(raw) !== state.digest) return false;
  try {
    const envelope = parseEnvelope(raw, "physical-after");
    return envelope?.revision === state.envelope.revision && JSON.stringify(envelope.payload) === JSON.stringify(state.envelope.payload);
  } catch { return false; }
}

function samePhysicalStates(before: CanonicalPhysicalState, after: CanonicalPhysicalAfter): boolean {
  if (before.kind !== after.kind) return false;
  if (before.kind === "absent" && after.kind === "absent") return true;
  if (before.kind === "present" && after.kind === "present") return before.revision === after.envelope.revision && before.digest === after.digest;
  return false;
}

export function readCanonicalJson<T>(key: string, guard: StorageValueGuard<T>): T | null {
  return readCanonicalEnvelope(key, guard)?.payload ?? null;
}

/** Enumerates only current-profile keys owned by the canonical namespace. */
export function readCanonicalNamespaceKeys(): readonly string[] {
  try {
    return Object.freeze(getKeyValueStorage().getAllKeys().filter((key) => key.startsWith(STORAGE_NAMESPACE)).sort());
  } catch (error) {
    throw new StorageReadError(STORAGE_NAMESPACE, error);
  }
}

/** Read the exact raw values for one selected profile namespace through the codec owner. */
export function readCanonicalNamespaceEntries(): readonly Readonly<{ key: string; rawValue: string }>[] {
  try {
    const storage = getKeyValueStorage();
    return Object.freeze(storage.getAllKeys().filter((key) => key.startsWith(STORAGE_NAMESPACE)).sort().map((key) => {
      const rawValue = storage.getString(key);
      if (rawValue === undefined) throw new Error("Canonical namespace changed during snapshot.");
      return Object.freeze({ key, rawValue });
    }));
  } catch (error) {
    throw new StorageReadError(STORAGE_NAMESPACE, error);
  }
}

export function writeCanonicalJson<T>(key: string, value: T, expectedRevision?: number | null): CanonicalRecordEnvelope<T> {
  return withCanonicalWriteLocks([key], () => writeCanonicalJsonUnlocked(key, value, expectedRevision));
}

/**
 * Attempts one canonical write and only reports it verified when exact bytes
 * are read back from the same storage owner under the same active profile
 * lease. This is intentionally opt-in for journal and simulation-draft writes.
 */
export function writeCanonicalJsonWithOutcome<T>(key: string, value: T, expectedRevision: number | null, lease: ActiveProfileStorageLease | null): CanonicalWriteOutcome<T> {
  try {
    return withCanonicalWriteLocks([key], () => {
      let storage: ReturnType<typeof getKeyValueStorage>;
      try { storage = getKeyValueStorage(); }
      catch (cause) { return { kind: "provenNotApplied", cause } as const; }
      if (!isWriteContextCurrent(storage, lease)) return { kind: "provenNotApplied", cause: new Error("Canonical write profile lease is unavailable or stale.") } as const;

      let priorRaw: string | undefined;
      let priorEnvelope: CanonicalRecordEnvelope<unknown> | null;
      try { priorRaw = storage.getString(key); }
      catch (cause) { return { kind: "provenNotApplied", cause } as const; }
      try { priorEnvelope = parseEnvelope(priorRaw, key); }
      catch (cause) {
        // Bytes that are corrupt or from an unsupported schema must remain
        // blocked. They are different from a transport failure before set.
        return { kind: "conflict", cause } as const;
      }
      if ((priorEnvelope?.revision ?? null) !== expectedRevision) {
        return { kind: "provenNotApplied", cause: new Error("Canonical write expected revision is stale.") } as const;
      }

      const envelope: CanonicalRecordEnvelope<T> = {
        schemaIdentity: CANONICAL_RECORD_SCHEMA,
        revision: (priorEnvelope?.revision ?? 0) + 1,
        payload: value,
      };
      let afterRaw: string;
      try {
        afterRaw = JSON.stringify(envelope);
        if (typeof afterRaw !== "string") throw new TypeError("Canonical write payload could not be serialized.");
      } catch (cause) {
        return { kind: "provenNotApplied", cause } as const;
      }
      const attempt: CanonicalWriteAttempt<T> = Object.freeze({ key, priorRaw, afterRaw, envelope, storage, lease });
      if (!isWriteContextCurrent(storage, lease)) return { kind: "provenNotApplied", cause: new Error("Canonical write profile lease changed before write.") } as const;

      let writeFailure: unknown;
      try { storage.setString(key, afterRaw); }
      catch (cause) { writeFailure = cause; }

      let observedRaw: string | undefined;
      try { observedRaw = storage.getString(key); }
      catch (cause) { return { kind: "unknown", cause, attempt } as const; }

      if (!isWriteContextCurrent(storage, lease)) {
        return { kind: "conflict", cause: writeFailure ?? new Error("Canonical write profile lease changed after write attempt."), attempt } as const;
      }
      if (observedRaw === afterRaw) return { kind: "verified", envelope, attempt } as const;
      if (observedRaw === priorRaw) return { kind: "conflict", cause: writeFailure ?? new Error("Canonical write remained at its prior bytes after write attempt."), attempt } as const;
      return { kind: "conflict", cause: writeFailure ?? new Error("Canonical write read-back differs from its exact intended bytes."), attempt } as const;
    });
  } catch (cause) {
    // A held same-key lock prevents the callback from starting, so no write
    // was attempted and the immutable command can be retried after the lane.
    return { kind: "provenNotApplied", cause };
  }
}

/** Read-only reconciliation of one exact prior attempt; it never reconstructs or rewrites the target. */
export function reconcileCanonicalWriteAttempt<T>(attempt: CanonicalWriteAttempt<T>): CanonicalWriteOutcome<T> {
  try {
    return withCanonicalWriteLocks([attempt.key], () => {
      if (!isWriteContextCurrent(attempt.storage, attempt.lease)) return { kind: "unknown", cause: new Error("Canonical write owner or lease changed before reconciliation."), attempt } as const;
      let observedRaw: string | undefined;
      try { observedRaw = attempt.storage.getString(attempt.key); }
      catch (cause) { return { kind: "unknown", cause, attempt } as const; }
      if (!isWriteContextCurrent(attempt.storage, attempt.lease)) return { kind: "unknown", cause: new Error("Canonical write owner or lease changed during reconciliation."), attempt } as const;
      if (observedRaw === attempt.afterRaw) return { kind: "verified", envelope: attempt.envelope, attempt } as const;
      return { kind: "conflict", cause: new Error("Canonical storage no longer contains the exact attempted envelope."), attempt } as const;
    });
  } catch (cause) { return { kind: "unknown", cause, attempt }; }
}

export function isCanonicalWriteAttemptCurrent<T>(attempt: CanonicalWriteAttempt<T>): boolean {
  return isWriteContextCurrent(attempt.storage, attempt.lease);
}

function parseEnvelope(raw: string | undefined, key: string): CanonicalRecordEnvelope<unknown> | null {
  if (raw === undefined) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new CorruptStoredRecordError(key); }
  if (!isEnvelope(value)) throw new UnsupportedStoredRecordError(key);
  return value;
}

function isWriteContextCurrent(storage: ReturnType<typeof getKeyValueStorage>, lease: ActiveProfileStorageLease | null): boolean {
  try {
    if (getKeyValueStorage() !== storage) return false;
    if (lease) return isActiveProfileStorageLeaseCurrent(lease);
    // Unprofiled MemoryKeyValueStorage is used only by logical repository
    // tests. Production storage always requires a captured active lease.
    return storage instanceof MemoryKeyValueStorage && captureActiveProfileStorageLease() === null;
  } catch { return false; }
}

/**
 * Low-level canonical write used by a caller which already owns all locks it
 * needs.  Keeping this separate is important for compound writes: taking a
 * second lock for the plan key from inside a goal+plan lock would look like a
 * reentrant write and would make the compound operation impossible.
 */
export function writeCanonicalJsonUnlocked<T>(key: string, value: T, expectedRevision?: number | null): CanonicalRecordEnvelope<T> {
  const current = readCanonicalEnvelope(key, (_value): _value is unknown => true);
  if (expectedRevision === null) {
    if (current !== null) throw new UnsupportedStoredRecordError(key);
  } else if (expectedRevision !== undefined && current?.revision !== expectedRevision) {
    throw new UnsupportedStoredRecordError(key);
  }
  const envelope: CanonicalRecordEnvelope<T> = {
    schemaIdentity: CANONICAL_RECORD_SCHEMA,
    revision: (current?.revision ?? 0) + 1,
    payload: value,
  };
  try { getKeyValueStorage().setString(key, JSON.stringify(envelope)); } catch (error) { throw new StorageWriteError(key, error); }
  const verified = readCanonicalEnvelope(key, (_value): _value is T => true);
  if (!verified || verified.schemaIdentity !== envelope.schemaIdentity || verified.revision !== envelope.revision || JSON.stringify(verified.payload) !== JSON.stringify(envelope.payload)) {
    throw new StorageWriteError(key, new Error("Canonical record write could not be verified."));
  }
  return envelope;
}

/** Restores an already validated cloud envelope while the caller owns the key lock. */
export function restoreCanonicalEnvelopeUnlocked<T>(key: string, envelope: CanonicalRecordEnvelope<T>): CanonicalRecordEnvelope<T> {
  if (envelope.schemaIdentity !== CANONICAL_RECORD_SCHEMA || !Number.isSafeInteger(envelope.revision) || envelope.revision < 1) throw new UnsupportedStoredRecordError(key);
  try { getKeyValueStorage().setString(key, JSON.stringify(envelope)); } catch (error) { throw new StorageWriteError(key, error); }
  const verified = readCanonicalEnvelope(key, (_value): _value is T => true);
  if (!verified || verified.schemaIdentity !== envelope.schemaIdentity || verified.revision !== envelope.revision || JSON.stringify(verified.payload) !== JSON.stringify(envelope.payload)) throw new StorageWriteError(key, new Error("Canonical envelope restore could not be verified."));
  return verified;
}

export function removeCanonicalValue(key: string): void {
  try { getKeyValueStorage().remove(key); } catch (error) { throw new StorageDeleteError(key, error); }
}
