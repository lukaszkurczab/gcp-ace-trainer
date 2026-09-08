import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { CanonicalWriteConflictError, CorruptStoredRecordError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../errors";

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

export function readCanonicalJson<T>(key: string, guard: StorageValueGuard<T>): T | null {
  return readCanonicalEnvelope(key, guard)?.payload ?? null;
}

export function writeCanonicalJson<T>(key: string, value: T, expectedRevision?: number | null): CanonicalRecordEnvelope<T> {
  return withCanonicalWriteLocks([key], () => writeCanonicalJsonUnlocked(key, value, expectedRevision));
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

export function removeCanonicalValue(key: string): void {
  try { getKeyValueStorage().remove(key); } catch (error) { throw new StorageDeleteError(key, error); }
}
