import { isContentIdentityTombstone, type ContentIdentityTombstone } from "../../domain/learning/resolvedContentRef";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import type { KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { CanonicalWriteConflictError, CorruptStoredRecordError, UnsupportedStoredRecordError } from "../errors";
import type { StorageRepositoryResult } from "./result";

/**
 * These records are the private durable home for content identities which
 * cannot be served by the strict learning repositories.  They are not
 * TrainingSession/ReviewQueueEntry values: those public runtime contracts are
 * intentionally canonical-only and reject tombstones.
 */
export const CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION = 1 as const;

type JsonRecord = Record<string, unknown>;

export type ContentIdentityArchivalHistoryRecord = Readonly<{
  schemaVersion: typeof CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION;
  kind: "archival_history";
  sessionId: string;
  session: JsonRecord;
  attempts: readonly JsonRecord[];
  results: readonly JsonRecord[];
}>;

export type ContentIdentityUnavailableActiveRecord = Readonly<{
  schemaVersion: typeof CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION;
  kind: "unavailable_active";
  sessionId: string;
  session: JsonRecord;
  attempts: readonly JsonRecord[];
  results: readonly JsonRecord[];
}>;

export type ContentIdentityUnavailableReviewRecord = Readonly<{
  schemaVersion: typeof CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION;
  kind: "unavailable_review";
  reviewId: string;
  review: JsonRecord;
}>;

/** Short aliases used by storage callers that do not need the namespace prefix. */
export type ArchivalHistoryRecord = ContentIdentityArchivalHistoryRecord;
export type UnavailableActiveRecord = ContentIdentityUnavailableActiveRecord;
export type UnavailableReviewRecord = ContentIdentityUnavailableReviewRecord;

const LEGACY_IDENTITY_FIELDS = new Set(["packagePin", "contentPackagePin", "itemId"]);

function isPlainRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: JsonRecord, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && [...expected].sort().every((key, index) => keys[index] === key);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isJsonWithoutLegacyIdentity(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((entry) => isJsonWithoutLegacyIdentity(entry, seen));
  if (!isPlainRecord(value)) return false;
  return Object.entries(value).every(([key, child]) => !LEGACY_IDENTITY_FIELDS.has(key) && isJsonWithoutLegacyIdentity(child, seen));
}

function containsTombstone(value: unknown, seen = new Set<unknown>()): boolean {
  if (isContentIdentityTombstone(value)) return true;
  if (value === null || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((entry) => containsTombstone(entry, seen));
  if (!isPlainRecord(value)) return false;
  return Object.values(value).some((child) => containsTombstone(child, seen));
}

function deepFreeze<T>(value: T, seen = new Set<unknown>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) value.forEach((entry) => deepFreeze(entry, seen));
  else Object.values(value).forEach((entry) => deepFreeze(entry, seen));
  return Object.freeze(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(nonEmpty) && new Set(value).size === value.length;
}

function isRecordArray(value: unknown): value is readonly JsonRecord[] {
  return Array.isArray(value) && value.every((entry) => isPlainRecord(entry) && isJsonWithoutLegacyIdentity(entry));
}

function isSessionBundle(value: unknown, sessionId: string, status: "active" | "terminal"): value is Readonly<{ session: JsonRecord; attempts: readonly JsonRecord[]; results: readonly JsonRecord[] }> {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["session", "attempts", "results"]) || !isPlainRecord(value.session) || value.session.id !== sessionId || !isJsonWithoutLegacyIdentity(value.session) || !isRecordArray(value.attempts) || !isRecordArray(value.results)) return false;
  if (status === "active" && value.session.status !== "active") return false;
  if (status === "terminal" && value.session.status !== "completed" && value.session.status !== "abandoned") return false;
  return containsTombstone(value);
}

function isArchivalHistoryRecord(value: unknown): value is ContentIdentityArchivalHistoryRecord {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["schemaVersion", "kind", "sessionId", "session", "attempts", "results"]) || value.schemaVersion !== CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION || value.kind !== "archival_history" || !nonEmpty(value.sessionId)) return false;
  return isSessionBundle({ session: value.session, attempts: value.attempts, results: value.results }, value.sessionId, "terminal");
}

function isUnavailableActiveRecord(value: unknown): value is ContentIdentityUnavailableActiveRecord {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["schemaVersion", "kind", "sessionId", "session", "attempts", "results"]) || value.schemaVersion !== CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION || value.kind !== "unavailable_active" || !nonEmpty(value.sessionId)) return false;
  return isSessionBundle({ session: value.session, attempts: value.attempts, results: value.results }, value.sessionId, "active");
}

function isUnavailableReviewRecord(value: unknown): value is ContentIdentityUnavailableReviewRecord {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["schemaVersion", "kind", "reviewId", "review"]) || value.schemaVersion !== CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION || value.kind !== "unavailable_review" || !nonEmpty(value.reviewId) || !isPlainRecord(value.review) || value.review.id !== value.reviewId || !isJsonWithoutLegacyIdentity(value.review)) return false;
  return containsTombstone(value.review);
}

export function createContentIdentityArchivalHistoryRecord(value: unknown): ContentIdentityArchivalHistoryRecord {
  if (!isArchivalHistoryRecord(value)) throw new TypeError("Archival history record is invalid.");
  return deepFreeze(cloneJson(value));
}

export function createContentIdentityUnavailableActiveRecord(value: unknown): ContentIdentityUnavailableActiveRecord {
  if (!isUnavailableActiveRecord(value)) throw new TypeError("Unavailable active record is invalid.");
  return deepFreeze(cloneJson(value));
}

export function createContentIdentityUnavailableReviewRecord(value: unknown): ContentIdentityUnavailableReviewRecord {
  if (!isUnavailableReviewRecord(value)) throw new TypeError("Unavailable review record is invalid.");
  return deepFreeze(cloneJson(value));
}

export { isArchivalHistoryRecord, isUnavailableActiveRecord, isUnavailableReviewRecord };

function recordIds(key: string): readonly string[] {
  return readCanonicalJson(key, isStringArray) ?? [];
}

function readByIndex<T>(indexKey: string, recordKey: (id: string) => string, guard: (value: unknown) => value is T): readonly T[] {
  return recordIds(indexKey).map((id) => {
    const value = readCanonicalJson(recordKey(id), guard);
    if (!value) throw new Error(`Index ${indexKey} references missing content identity record ${id}.`);
    return value;
  });
}

function upsertIndexed<T>(input: Readonly<{ value: T; id: string; indexKey: string; recordKey: (id: string) => string; guard: (value: unknown) => value is T }>): T {
  if (!input.guard(input.value)) throw new TypeError("Content identity record is invalid.");
  const existing = readCanonicalJson(input.recordKey(input.id), input.guard);
  if (existing && canonicalSerialize(existing) !== canonicalSerialize(input.value)) throw new Error(`Content identity record ${input.id} is immutable.`);
  if (!existing) writeCanonicalJson(input.recordKey(input.id), input.value);
  const ids = recordIds(input.indexKey);
  if (!ids.includes(input.id)) writeCanonicalJson(input.indexKey, [input.id, ...ids]);
  return existing ?? input.value;
}

function removeIndexed(indexKey: string, recordKey: (id: string) => string, id: string): void {
  const ids = recordIds(indexKey);
  if (ids.includes(id)) writeCanonicalJson(indexKey, ids.filter((candidate) => candidate !== id));
  removeCanonicalValue(recordKey(id));
}

export async function getArchivalHistoryRecords(): Promise<StorageRepositoryResult<readonly ContentIdentityArchivalHistoryRecord[]>> {
  return { ok: true, value: readByIndex(STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX, STORAGE_KEYS.archivalHistory, isArchivalHistoryRecord) };
}

export async function getArchivalHistoryRecord(sessionId: string): Promise<ContentIdentityArchivalHistoryRecord | null> {
  if (!nonEmpty(sessionId)) throw new TypeError("Archival history session ID is required.");
  return readCanonicalJson(STORAGE_KEYS.archivalHistory(sessionId), isArchivalHistoryRecord);
}

export async function saveArchivalHistoryRecord(record: ContentIdentityArchivalHistoryRecord): Promise<ContentIdentityArchivalHistoryRecord> {
  return upsertIndexed({ value: createContentIdentityArchivalHistoryRecord(record), id: record.sessionId, indexKey: STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX, recordKey: STORAGE_KEYS.archivalHistory, guard: isArchivalHistoryRecord });
}

export async function getUnavailableActiveRecords(): Promise<StorageRepositoryResult<readonly ContentIdentityUnavailableActiveRecord[]>> {
  return { ok: true, value: readByIndex(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, STORAGE_KEYS.unavailableActive, isUnavailableActiveRecord) };
}

export async function getUnavailableActiveRecord(sessionId: string): Promise<ContentIdentityUnavailableActiveRecord | null> {
  if (!nonEmpty(sessionId)) throw new TypeError("Unavailable active session ID is required.");
  return readCanonicalJson(STORAGE_KEYS.unavailableActive(sessionId), isUnavailableActiveRecord);
}

export async function saveUnavailableActiveRecord(record: ContentIdentityUnavailableActiveRecord): Promise<ContentIdentityUnavailableActiveRecord> {
  return upsertIndexed({ value: createContentIdentityUnavailableActiveRecord(record), id: record.sessionId, indexKey: STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, recordKey: STORAGE_KEYS.unavailableActive, guard: isUnavailableActiveRecord });
}

export async function getUnavailableReviewRecords(): Promise<StorageRepositoryResult<readonly ContentIdentityUnavailableReviewRecord[]>> {
  return { ok: true, value: readByIndex(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX, STORAGE_KEYS.unavailableReview, isUnavailableReviewRecord) };
}

export async function getUnavailableReviewRecord(reviewId: string): Promise<ContentIdentityUnavailableReviewRecord | null> {
  if (!nonEmpty(reviewId)) throw new TypeError("Unavailable review ID is required.");
  return readCanonicalJson(STORAGE_KEYS.unavailableReview(reviewId), isUnavailableReviewRecord);
}

export async function saveUnavailableReviewRecord(record: ContentIdentityUnavailableReviewRecord): Promise<ContentIdentityUnavailableReviewRecord> {
  return upsertIndexed({ value: createContentIdentityUnavailableReviewRecord(record), id: record.reviewId, indexKey: STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX, recordKey: STORAGE_KEYS.unavailableReview, guard: isUnavailableReviewRecord });
}

/**
 * Converts an unavailable active session into terminal archival history.  The
 * archive is written first; only a successful archive write permits removal
 * of the unavailable-active tombstone.
 */
export async function abandonUnavailableActiveSession(sessionId: string, abandonedAt = new Date().toISOString()): Promise<StorageRepositoryResult<ContentIdentityArchivalHistoryRecord>> {
  if (!nonEmpty(sessionId) || !nonEmpty(abandonedAt) || Number.isNaN(Date.parse(abandonedAt))) throw new TypeError("A valid unavailable active session and timestamp are required.");
  const active = await getUnavailableActiveRecord(sessionId);
  const existingArchive = await getArchivalHistoryRecord(sessionId);
  if (!active) {
    if (existingArchive) return { ok: true, value: existingArchive };
    throw new Error(`Unavailable active session ${sessionId} was not found.`);
  }
  const terminalSession = { ...cloneJson(active.session), status: "abandoned", completedAt: abandonedAt };
  const archive = createContentIdentityArchivalHistoryRecord({
    schemaVersion: CONTENT_IDENTITY_UNAVAILABLE_RECORD_VERSION,
    kind: "archival_history",
    sessionId,
    session: terminalSession,
    attempts: cloneJson(active.attempts),
    results: cloneJson(active.results),
  });
  if (existingArchive && canonicalSerialize(existingArchive) !== canonicalSerialize(archive)) throw new Error(`Archival history ${sessionId} is immutable.`);
  // This ordering is intentional and is part of the recovery contract.
  if (!existingArchive) await saveArchivalHistoryRecord(archive);
  removeIndexed(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, STORAGE_KEYS.unavailableActive, sessionId);
  return { ok: true, value: existingArchive ?? archive };
}

/** Removes only the requested unavailable review; other tombstones remain. */
export async function removeUnavailableReviewEntry(reviewId: string): Promise<StorageRepositoryResult<readonly ContentIdentityUnavailableReviewRecord[]>> {
  if (!nonEmpty(reviewId)) throw new TypeError("Unavailable review ID is required.");
  removeIndexed(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX, STORAGE_KEYS.unavailableReview, reviewId);
  return getUnavailableReviewRecords();
}

export async function clearContentIdentityUnavailableRecords(): Promise<void> {
  for (const id of recordIds(STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX)) removeCanonicalValue(STORAGE_KEYS.archivalHistory(id));
  for (const id of recordIds(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)) removeCanonicalValue(STORAGE_KEYS.unavailableActive(id));
  for (const id of recordIds(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX)) removeCanonicalValue(STORAGE_KEYS.unavailableReview(id));
  removeCanonicalValue(STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX);
  removeCanonicalValue(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX);
  removeCanonicalValue(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX);
}

// Explicit aliases make the command/read boundary discoverable without
// exposing the strict runtime repository types as a union.
export const getArchivalHistory = getArchivalHistoryRecords;
export const getUnavailableActiveSessions = getUnavailableActiveRecords;
export const getUnavailableReviews = getUnavailableReviewRecords;
export const removeUnavailableReview = removeUnavailableReviewEntry;

export type ContentIdentityTombstoneRecord = ContentIdentityTombstone;

export type ContentIdentityUnavailableActiveIndexRepairCode =
  | "index_invalid"
  | "record_invalid"
  | "record_missing"
  | "record_conflict"
  | "write_conflict"
  | "write_verification_failed";

/** Bounded unavailable-active index repair failures; no storage key or record payload crosses this boundary. */
export class ContentIdentityUnavailableActiveIndexRepairError extends Error {
  readonly code: ContentIdentityUnavailableActiveIndexRepairCode;

  constructor(code: ContentIdentityUnavailableActiveIndexRepairCode) {
    super(code);
    this.name = "ContentIdentityUnavailableActiveIndexRepairError";
    this.code = code;
  }
}

function repairError(code: ContentIdentityUnavailableActiveIndexRepairCode): ContentIdentityUnavailableActiveIndexRepairError {
  return new ContentIdentityUnavailableActiveIndexRepairError(code);
}

function readRepairIndex(storage: KeyValueStorage): { revision: number; ids: readonly string[] } | null {
  try {
    const envelope = readCanonicalEnvelope(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, isStringArray);
    return envelope === null ? null : { revision: envelope.revision, ids: envelope.payload };
  } catch (error) {
    if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) throw repairError("index_invalid");
    throw error;
  }
}

function readRepairRecord<T>(key: string, guard: (value: unknown) => value is T): T | null {
  try {
    return readCanonicalJson(key, guard);
  } catch (error) {
    if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) throw repairError("record_invalid");
    throw error;
  }
}

/**
 * Repairs only the private unavailable-active index.  The
 * active/archive records are read directly so a malformed public index read
 * cannot recurse into the public unavailable-record getter.  Records are
 * never written or removed here; only the filtered index may change.
 */
export function repairUnavailableActiveIndex(storage: KeyValueStorage): void {
  const current = readRepairIndex(storage);
  if (current === null || current.ids.length === 0) return;

  const retained: string[] = [];
  for (const id of current.ids) {
    const active = readRepairRecord(STORAGE_KEYS.unavailableActive(id), isUnavailableActiveRecord);
    const archive = readRepairRecord(STORAGE_KEYS.archivalHistory(id), isArchivalHistoryRecord);
    if ((active && active.sessionId !== id) || (archive && archive.sessionId !== id)) throw repairError("record_invalid");
    if (active && archive) throw repairError("record_conflict");
    if (!active && !archive) throw repairError("record_missing");
    if (active) retained.push(id);
  }

  if (retained.length === current.ids.length) return;

  let written: { revision: number };
  try {
    written = writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, retained, current.revision);
  } catch (error) {
    if (error instanceof CanonicalWriteConflictError || error instanceof UnsupportedStoredRecordError) throw repairError("write_conflict");
    throw error;
  }
  const verified = readRepairIndex(storage);
  if (verified === null || verified.revision !== written.revision || canonicalSerialize(verified.ids) !== canonicalSerialize(retained)) {
    throw repairError("write_verification_failed");
  }
}
