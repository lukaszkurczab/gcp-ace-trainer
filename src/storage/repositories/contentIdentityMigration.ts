import type { KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_NAMESPACE } from "../keys";
import { CANONICAL_RECORD_SCHEMA, withCanonicalWriteLocks } from "./canonicalRecordCodec";

/**
 * This module is deliberately dormant.  It is an opaque raw-byte transaction
 * engine for the later cutover slice; it does not know any learning record
 * schema, does not transform content, and is not imported by bootstrap or the
 * repository barrel.
 */

export const CONTENT_IDENTITY_MIGRATION_NAMESPACE = "patternly:migration:content-identity:v1:" as const;
export const CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION = 1 as const;
export const CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION = 1 as const;
export const CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION = 2 as const;
/** Compatibility name retained for the dormant activation boundary. */
export const CONTENT_IDENTITY_TARGET_RUNTIME_SCHEMA_VERSION = CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION;

const SOURCE_NAMESPACE = STORAGE_NAMESPACE;
const PROTOCOL_IDENTITY = "patternly:migration:content-identity:v1" as const;
const STATE_KEY = `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state`;
const BACKUP_PREFIX = `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:`;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/u;

export type ContentIdentityMigrationRawRecord = Readonly<{
  key: string;
  raw: string;
}>;

export type ContentIdentityMigrationManifestEntry = Readonly<{
  key: string;
  revision: number | null;
  digest: string;
}>;

export type ContentIdentityMigrationManifest = Readonly<{
  entries: readonly ContentIdentityMigrationManifestEntry[];
  keySetDigest: string;
  aggregateDigest: string;
}>;

export type ContentIdentityMigrationPhase =
  | "backup_verified"
  | "publishing"
  | "target_verified"
  | "rollback_verified"
  | "committed";

export type ContentIdentityMigrationState = Readonly<{
  schemaIdentity: typeof PROTOCOL_IDENTITY;
  protocolVersion: typeof CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION;
  verifierVersion: typeof CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION;
  phase: ContentIdentityMigrationPhase;
  targetRuntimeSchemaVersion: typeof CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION;
  planId: string;
  verifierId: string;
  sourceManifest: ContentIdentityMigrationManifest;
  targetManifest: ContentIdentityMigrationManifest;
  backupKeys: readonly string[];
  targetAbsentKeys: readonly string[];
}>;

export type ContentIdentityMigrationErrorCode =
  | "activation_required"
  | "invalid_plan"
  | "invalid_verifier"
  | "unsupported_protocol"
  | "stale_source"
  | "source_snapshot_invalid"
  | "protocol_state_invalid"
  | "backup_incomplete"
  | "blocked_recovery"
  | "target_verification_failed"
  | "manual_recovery_required"
  | "storage_read_failed"
  | "storage_write_failed"
  | "storage_remove_failed"
  | "cleanup_error";

/** Typed failures intentionally contain no key values, payloads, or secrets. */
export class ContentIdentityMigrationError extends Error {
  readonly code: ContentIdentityMigrationErrorCode;

  constructor(code: ContentIdentityMigrationErrorCode, cause?: unknown) {
    super(code);
    this.name = "ContentIdentityMigrationError";
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

export interface ContentIdentityMigrationReadOnlyStorage {
  getString(key: string): string | undefined;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

export type ContentIdentityMigrationVerifierContext = Readonly<{
  schemaIdentity: typeof PROTOCOL_IDENTITY;
  protocolVersion: typeof CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION;
  verifierVersion: typeof CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION;
  planId: string;
  targetManifest: ContentIdentityMigrationManifest;
  targetManifestDigest: string;
  storage: ContentIdentityMigrationReadOnlyStorage;
}>;

export type ContentIdentityMigrationVerifier = Readonly<{
  schemaIdentity: typeof PROTOCOL_IDENTITY;
  protocolVersion: typeof CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION;
  verifierVersion: typeof CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION;
  verifierId: string;
  name: string;
}>;

export type ContentIdentityMigrationPlan = Readonly<{
  schemaIdentity: typeof PROTOCOL_IDENTITY;
  protocolVersion: typeof CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION;
  verifierVersion: typeof CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION;
  targetRuntimeSchemaVersion: typeof CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION;
  planId: string;
  verifierId: string;
  sourceManifest: ContentIdentityMigrationManifest;
  targetManifest: ContentIdentityMigrationManifest;
  targetAbsentKeys: readonly string[];
}>;

export type ContentIdentityMigrationActivation = Readonly<{
  targetRuntimeSchemaVersion: typeof CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION;
}>;

export type ContentIdentityMigrationRecoveryResult =
  | Readonly<{ kind: "not_started" }>
  | Readonly<{ kind: "rolled_back" }>
  | Readonly<{ kind: "already_committed"; cleanup: ContentIdentityMigrationCleanupResult }>;

export type ContentIdentityMigrationCleanupResult =
  | Readonly<{ status: "complete"; remainingKeys: readonly string[] }>
  | Readonly<{ status: "pending"; reason: "not_committed"; remainingKeys: readonly string[] }>
  | Readonly<{ status: "error"; code: "cleanup_error"; remainingKeys: readonly string[] }>;

export type ContentIdentityMigrationRunResult = Readonly<{
  kind: "committed";
  state: ContentIdentityMigrationState;
  cleanup: ContentIdentityMigrationCleanupResult;
}>;

type PlanBinding = Readonly<{
  source: readonly ContentIdentityMigrationRawRecord[];
  target: readonly ContentIdentityMigrationRawRecord[];
  verifier: ContentIdentityMigrationVerifier;
}>;

type VerifierBinding = Readonly<{
  verify: (context: ContentIdentityMigrationVerifierContext) => boolean | void;
}>;

const sealedPlans = new WeakSet<object>();
const planBindings = new WeakMap<object, PlanBinding>();
const sealedVerifiers = new WeakSet<object>();
const verifierBindings = new WeakMap<object, VerifierBinding>();
const sealedActivations = new WeakSet<object>();

function fail(code: ContentIdentityMigrationErrorCode, cause?: unknown): never {
  throw new ContentIdentityMigrationError(code, cause);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

function isCanonicalKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(SOURCE_NAMESPACE) && key.length > SOURCE_NAMESPACE.length && !key.startsWith(CONTENT_IDENTITY_MIGRATION_NAMESPACE);
}

function isDigest(value: unknown): value is string {
  return typeof value === "string" && DIGEST_PATTERN.test(value);
}

function sortedUnique(values: readonly string[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1]! < value);
}

function cloneRawRecords(input: readonly ContentIdentityMigrationRawRecord[]): readonly ContentIdentityMigrationRawRecord[] {
  if (!Array.isArray(input)) fail("invalid_plan");
  const records = input.map((record) => {
    if (!isPlainRecord(record) || !exactKeys(record, ["key", "raw"]) || !isCanonicalKey(record.key) || typeof record.raw !== "string") {
      fail("invalid_plan");
    }
    return Object.freeze({ key: record.key, raw: record.raw });
  }).sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
  if (records.some((record, index) => index > 0 && records[index - 1]!.key === record.key)) fail("invalid_plan");
  return Object.freeze(records);
}

function rawRevision(raw: string): number | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed) || parsed.schemaIdentity !== CANONICAL_RECORD_SCHEMA || typeof parsed.revision !== "number" || !Number.isSafeInteger(parsed.revision) || parsed.revision < 1) return null;
    return parsed.revision;
  } catch {
    return null;
  }
}

function digestObject(value: unknown): string {
  return sha256Utf8(canonicalSerialize(value));
}

function computePlanId(input: {
  verifierId: string;
  sourceManifest: ContentIdentityMigrationManifest;
  targetManifest: ContentIdentityMigrationManifest;
  targetAbsentKeys: readonly string[];
}): string {
  return digestObject({
    schemaIdentity: PROTOCOL_IDENTITY,
    protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION,
    verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION,
    targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
    verifierId: input.verifierId,
    sourceManifest: input.sourceManifest,
    targetManifest: input.targetManifest,
    targetAbsentKeys: input.targetAbsentKeys,
  });
}

function makeManifest(records: readonly ContentIdentityMigrationRawRecord[]): ContentIdentityMigrationManifest {
  const entries = records.map((record) => Object.freeze({ key: record.key, revision: rawRevision(record.raw), digest: sha256Utf8(record.raw) }));
  const keySetDigest = digestObject({ schemaIdentity: PROTOCOL_IDENTITY, keys: entries.map((entry) => entry.key) });
  const aggregateDigest = digestObject({ schemaIdentity: PROTOCOL_IDENTITY, entries });
  return Object.freeze({ entries: Object.freeze(entries), keySetDigest, aggregateDigest });
}

function assertManifest(value: unknown, code: ContentIdentityMigrationErrorCode = "protocol_state_invalid"): asserts value is ContentIdentityMigrationManifest {
  if (!isPlainRecord(value) || !exactKeys(value, ["aggregateDigest", "entries", "keySetDigest"]) || !Array.isArray(value.entries) || !isDigest(value.keySetDigest) || !isDigest(value.aggregateDigest)) fail(code);
  const entries = value.entries as unknown[];
  const checkedEntries: Array<{ key: string; revision: number | null; digest: string }> = [];
  let previous = "";
  for (const entry of entries) {
    if (!isPlainRecord(entry) || !exactKeys(entry, ["digest", "key", "revision"])) fail(code);
    const key = entry.key;
    const digest = entry.digest;
    const revision = entry.revision;
    if (!isCanonicalKey(key) || !isDigest(digest) || (revision !== null && (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1)) || (previous && previous >= key)) fail(code);
    previous = key;
    checkedEntries.push({ key, revision, digest });
  }
  const expectedKeySet = digestObject({ schemaIdentity: PROTOCOL_IDENTITY, keys: checkedEntries.map((entry) => entry.key) });
  if (expectedKeySet !== value.keySetDigest) fail(code);
  const expectedAggregate = digestObject({ schemaIdentity: PROTOCOL_IDENTITY, entries: checkedEntries });
  if (expectedAggregate !== value.aggregateDigest) fail(code);
}

function manifestEquals(left: ContentIdentityMigrationManifest, right: ContentIdentityMigrationManifest): boolean {
  return left.keySetDigest === right.keySetDigest && left.aggregateDigest === right.aggregateDigest && canonicalSerialize(left.entries) === canonicalSerialize(right.entries);
}

function assertRawManifest(records: readonly ContentIdentityMigrationRawRecord[], expected: ContentIdentityMigrationManifest, code: ContentIdentityMigrationErrorCode): void {
  const normalized = cloneRawRecords(records);
  assertManifest(expected, code);
  if (!manifestEquals(makeManifest(normalized), expected)) fail(code);
}

function readString(storage: KeyValueStorage, key: string): string | undefined {
  try { return storage.getString(key); } catch (error) { fail("storage_read_failed", error); }
}

function readKeys(storage: KeyValueStorage): readonly string[] {
  try { return Object.freeze([...storage.getAllKeys()].sort()); } catch (error) { fail("storage_read_failed", error); }
}

function writeString(storage: KeyValueStorage, key: string, value: string): void {
  try { storage.setString(key, value); } catch (error) { fail("storage_write_failed", error); }
}

function removeString(storage: KeyValueStorage, key: string): void {
  try { storage.remove(key); } catch (error) { fail("storage_remove_failed", error); }
}

function reservedKeys(storage: KeyValueStorage): readonly string[] {
  return Object.freeze(readKeys(storage).filter((key) => key.startsWith(CONTENT_IDENTITY_MIGRATION_NAMESPACE)));
}

function expectedBackupKey(index: number): string {
  return `${BACKUP_PREFIX}${String(index).padStart(8, "0")}`;
}

function backupKeysForManifest(manifest: ContentIdentityMigrationManifest): readonly string[] {
  return Object.freeze(manifest.entries.map((_entry, index) => expectedBackupKey(index)));
}

function assertProtocolHeader(value: Record<string, unknown>, code: ContentIdentityMigrationErrorCode): void {
  if (value.schemaIdentity !== PROTOCOL_IDENTITY || value.protocolVersion !== CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION || value.verifierVersion !== CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION) fail(code);
}

function assertState(value: unknown): asserts value is ContentIdentityMigrationState {
  if (!isPlainRecord(value) || !exactKeys(value, ["backupKeys", "phase", "planId", "protocolVersion", "schemaIdentity", "sourceManifest", "targetAbsentKeys", "targetManifest", "targetRuntimeSchemaVersion", "verifierId", "verifierVersion"])) fail("protocol_state_invalid");
  assertProtocolHeader(value, "protocol_state_invalid");
  if (value.targetRuntimeSchemaVersion !== CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION || typeof value.planId !== "string" || !isDigest(value.planId) || typeof value.verifierId !== "string" || !isDigest(value.verifierId) || !["backup_verified", "publishing", "target_verified", "rollback_verified", "committed"].includes(value.phase as string) || !Array.isArray(value.backupKeys) || !Array.isArray(value.targetAbsentKeys)) fail("protocol_state_invalid");
  if (!value.backupKeys.every((key): key is string => typeof key === "string" && key.startsWith(BACKUP_PREFIX)) || !sortedUnique(value.backupKeys) || !value.targetAbsentKeys.every((key): key is string => isCanonicalKey(key)) || !sortedUnique(value.targetAbsentKeys)) fail("protocol_state_invalid");
  assertManifest(value.sourceManifest, "protocol_state_invalid");
  assertManifest(value.targetManifest, "protocol_state_invalid");
  const expectedBackups = backupKeysForManifest(value.sourceManifest);
  if (canonicalSerialize(expectedBackups) !== canonicalSerialize(value.backupKeys)) fail("protocol_state_invalid");
  const sourceKeys = new Set(value.sourceManifest.entries.map((entry) => entry.key));
  const targetKeys = new Set(value.targetManifest.entries.map((entry) => entry.key));
  const expectedAbsent = [...sourceKeys].filter((key) => !targetKeys.has(key)).sort();
  if (canonicalSerialize(expectedAbsent) !== canonicalSerialize(value.targetAbsentKeys) || computePlanId({ verifierId: value.verifierId, sourceManifest: value.sourceManifest, targetManifest: value.targetManifest, targetAbsentKeys: value.targetAbsentKeys }) !== value.planId) fail("protocol_state_invalid");
}

function parseState(storage: KeyValueStorage): ContentIdentityMigrationState | null {
  const raw = readString(storage, STATE_KEY);
  if (raw === undefined) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch (error) { fail("protocol_state_invalid", error); }
  assertState(value);
  return value;
}

function freezeState(input: {
  phase: ContentIdentityMigrationPhase;
  plan: ContentIdentityMigrationPlan;
  backupKeys: readonly string[];
}): ContentIdentityMigrationState {
  const state = {
    schemaIdentity: PROTOCOL_IDENTITY,
    protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION,
    verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION,
    phase: input.phase,
    targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
    planId: input.plan.planId,
    verifierId: input.plan.verifierId,
    sourceManifest: input.plan.sourceManifest,
    targetManifest: input.plan.targetManifest,
    backupKeys: Object.freeze([...input.backupKeys]),
    targetAbsentKeys: input.plan.targetAbsentKeys,
  } as const;
  assertState(state);
  return Object.freeze(state);
}

function writeState(storage: KeyValueStorage, state: ContentIdentityMigrationState): void {
  assertState(state);
  const raw = canonicalSerialize(state);
  writeString(storage, STATE_KEY, raw);
  if (readString(storage, STATE_KEY) !== raw) fail("protocol_state_invalid");
}

function assertSealedVerifier(value: unknown): asserts value is ContentIdentityMigrationVerifier {
  if (typeof value !== "object" || value === null || !sealedVerifiers.has(value) || !isPlainRecord(value)) fail("invalid_verifier");
  if (!exactKeys(value, ["name", "protocolVersion", "schemaIdentity", "verifierId", "verifierVersion"]) || typeof value.name !== "string" || !value.name.trim() || value.schemaIdentity !== PROTOCOL_IDENTITY || value.protocolVersion !== CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION || value.verifierVersion !== CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION || !isDigest(value.verifierId)) fail("invalid_verifier");
  const expectedId = digestObject({ schemaIdentity: PROTOCOL_IDENTITY, protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION, verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION, name: value.name });
  if (expectedId !== value.verifierId || !verifierBindings.has(value)) fail("invalid_verifier");
}

function assertSealedActivation(value: unknown): asserts value is ContentIdentityMigrationActivation {
  if (typeof value !== "object" || value === null || !sealedActivations.has(value) || !isPlainRecord(value) || !exactKeys(value, ["targetRuntimeSchemaVersion"]) || value.targetRuntimeSchemaVersion !== CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION) fail("activation_required");
}

function assertSealedPlan(value: unknown): asserts value is ContentIdentityMigrationPlan {
  if (typeof value !== "object" || value === null || !sealedPlans.has(value) || !isPlainRecord(value)) fail("invalid_plan");
  if (!exactKeys(value, ["planId", "protocolVersion", "schemaIdentity", "sourceManifest", "targetAbsentKeys", "targetManifest", "targetRuntimeSchemaVersion", "verifierId", "verifierVersion"]) || value.schemaIdentity !== PROTOCOL_IDENTITY || value.protocolVersion !== CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION || value.verifierVersion !== CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION || value.targetRuntimeSchemaVersion !== CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION || !isDigest(value.planId) || !isDigest(value.verifierId) || !Array.isArray(value.targetAbsentKeys)) fail("invalid_plan");
  assertManifest(value.sourceManifest, "invalid_plan");
  assertManifest(value.targetManifest, "invalid_plan");
  if (!sortedUnique(value.targetAbsentKeys) || !value.targetAbsentKeys.every((key): key is string => isCanonicalKey(key))) fail("invalid_plan");
  const sourceKeys = new Set(value.sourceManifest.entries.map((entry) => entry.key));
  const targetKeys = new Set(value.targetManifest.entries.map((entry) => entry.key));
  const expectedAbsent = [...sourceKeys].filter((key) => !targetKeys.has(key)).sort();
  if (canonicalSerialize(expectedAbsent) !== canonicalSerialize(value.targetAbsentKeys) || computePlanId({ verifierId: value.verifierId, sourceManifest: value.sourceManifest, targetManifest: value.targetManifest, targetAbsentKeys: value.targetAbsentKeys }) !== value.planId || !planBindings.has(value)) fail("invalid_plan");
}

function assertPlanVerifier(plan: ContentIdentityMigrationPlan, verifier: ContentIdentityMigrationVerifier): PlanBinding {
  assertSealedPlan(plan);
  assertSealedVerifier(verifier);
  const binding = planBindings.get(plan);
  if (!binding || binding.verifier !== verifier || plan.verifierId !== verifier.verifierId) fail("invalid_verifier");
  return binding;
}

function readOnlyStorage(storage: KeyValueStorage): ContentIdentityMigrationReadOnlyStorage {
  return Object.freeze({
    getString: (key: string) => storage.getString(key),
    contains: (key: string) => storage.contains(key),
    getAllKeys: () => Object.freeze([...storage.getAllKeys()].sort()),
  });
}

function verifyTarget(storage: KeyValueStorage, state: ContentIdentityMigrationState, verifier: ContentIdentityMigrationVerifier): void {
  assertState(state);
  assertSealedVerifier(verifier);
  if (state.verifierId !== verifier.verifierId) fail("invalid_verifier");
  const current = captureContentIdentityMigrationSnapshot(storage);
  assertRawManifest(current, state.targetManifest, "target_verification_failed");
  const callback = verifierBindings.get(verifier)?.verify;
  if (!callback) fail("invalid_verifier");
  const context: ContentIdentityMigrationVerifierContext = Object.freeze({
    schemaIdentity: PROTOCOL_IDENTITY,
    protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION,
    verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION,
    planId: state.planId,
    targetManifest: state.targetManifest,
    targetManifestDigest: state.targetManifest.aggregateDigest,
    storage: readOnlyStorage(storage),
  });
  try {
    if (callback(context) === false) fail("target_verification_failed");
  } catch (error) {
    if (error instanceof ContentIdentityMigrationError) throw error;
    fail("target_verification_failed", error);
  }
}

function validateFullBackup(storage: KeyValueStorage, state: ContentIdentityMigrationState): readonly ContentIdentityMigrationRawRecord[] {
  assertState(state);
  const reserved = reservedKeys(storage);
  const expectedReserved = Object.freeze([STATE_KEY, ...state.backupKeys].sort());
  if (canonicalSerialize(reserved) !== canonicalSerialize(expectedReserved)) fail("backup_incomplete");
  const backup: ContentIdentityMigrationRawRecord[] = [];
  for (let index = 0; index < state.sourceManifest.entries.length; index += 1) {
    const entry = state.sourceManifest.entries[index]!;
    const backupKey = state.backupKeys[index]!;
    if (backupKey !== expectedBackupKey(index)) fail("backup_incomplete");
    const raw = readString(storage, backupKey);
    if (raw === undefined) fail("backup_incomplete");
    backup.push(Object.freeze({ key: entry.key, raw }));
  }
  assertRawManifest(backup, state.sourceManifest, "backup_incomplete");
  return Object.freeze(backup);
}

function protocolCleanup(storage: KeyValueStorage, state: ContentIdentityMigrationState, removeState = false): ContentIdentityMigrationCleanupResult {
  const remaining = () => reservedKeys(storage);
  for (const key of state.backupKeys) {
    try { if (readString(storage, key) !== undefined) removeString(storage, key); } catch { return Object.freeze({ status: "error", code: "cleanup_error", remainingKeys: remaining() }); }
  }
  if (removeState) {
    try { if (readString(storage, STATE_KEY) !== undefined) removeString(storage, STATE_KEY); } catch { return Object.freeze({ status: "error", code: "cleanup_error", remainingKeys: remaining() }); }
  }
  return Object.freeze({ status: "complete", remainingKeys: remaining() });
}

function cleanupUnlocked(storage: KeyValueStorage): ContentIdentityMigrationCleanupResult {
  const state = parseState(storage);
  const reserved = reservedKeys(storage);
  if (!state) {
    if (reserved.length === 0) return Object.freeze({ status: "complete", remainingKeys: [] });
    return Object.freeze({ status: "error", code: "cleanup_error", remainingKeys: reserved });
  }
  const allowedReserved = new Set([STATE_KEY, ...state.backupKeys]);
  if (reserved.some((key) => !allowedReserved.has(key))) return Object.freeze({ status: "error", code: "cleanup_error", remainingKeys: reserved });
  if (state.phase === "rollback_verified") {
    assertRawManifest(captureContentIdentityMigrationSnapshot(storage), state.sourceManifest, "blocked_recovery");
    return protocolCleanup(storage, state, true);
  }
  if (state.phase !== "committed") return Object.freeze({ status: "pending", reason: "not_committed", remainingKeys: reserved });
  return protocolCleanup(storage, state);
}

function recoverUnlocked(storage: KeyValueStorage, verifier: ContentIdentityMigrationVerifier): ContentIdentityMigrationRecoveryResult {
  const state = parseState(storage);
  const reserved = reservedKeys(storage);
  if (!state) {
    if (reserved.length !== 0) fail("blocked_recovery");
    return { kind: "not_started" };
  }
  assertSealedVerifier(verifier);
  if (state.verifierId !== verifier.verifierId) fail("invalid_verifier");
  if (state.phase === "committed") {
    try { verifyTarget(storage, state, verifier); } catch (error) { if (error instanceof ContentIdentityMigrationError && error.code === "invalid_verifier") throw error; fail("manual_recovery_required", error); }
    return Object.freeze({ kind: "already_committed", cleanup: cleanupUnlocked(storage) });
  }
  if (state.phase === "rollback_verified") {
    assertRawManifest(captureContentIdentityMigrationSnapshot(storage), state.sourceManifest, "blocked_recovery");
    protocolCleanup(storage, state, true);
    return { kind: "rolled_back" };
  }
  const backup = validateFullBackup(storage, state);
  const current = captureContentIdentityMigrationSnapshot(storage);
  const sourceKeys = new Set(state.sourceManifest.entries.map((entry) => entry.key));
  for (const record of current) if (!sourceKeys.has(record.key)) removeString(storage, record.key);
  for (const record of backup) writeString(storage, record.key, record.raw);
  const restored = captureContentIdentityMigrationSnapshot(storage);
  assertRawManifest(restored, state.sourceManifest, "blocked_recovery");
  const rollbackVerified = Object.freeze({ ...state, phase: "rollback_verified" as const });
  writeState(storage, rollbackVerified);
  protocolCleanup(storage, rollbackVerified, true);
  return { kind: "rolled_back" };
}

function runUnlocked(storage: KeyValueStorage, plan: ContentIdentityMigrationPlan, verifier: ContentIdentityMigrationVerifier, binding: PlanBinding): ContentIdentityMigrationRunResult {
  const existing = parseState(storage);
  const reserved = reservedKeys(storage);
  if (!existing && reserved.length !== 0) fail("blocked_recovery");
  if (existing) {
    if (existing.planId !== plan.planId || existing.verifierId !== plan.verifierId || !manifestEquals(existing.sourceManifest, plan.sourceManifest) || !manifestEquals(existing.targetManifest, plan.targetManifest)) fail("invalid_plan");
    if (existing.phase === "committed") {
      try { verifyTarget(storage, existing, verifier); } catch (error) { if (error instanceof ContentIdentityMigrationError && error.code === "invalid_verifier") throw error; fail("manual_recovery_required", error); }
      return Object.freeze({ kind: "committed", state: existing, cleanup: cleanupUnlocked(storage) });
    }
    recoverUnlocked(storage, verifier);
    if (parseState(storage) !== null || reservedKeys(storage).length !== 0) fail("cleanup_error");
  }
  const current = captureContentIdentityMigrationSnapshot(storage);
  assertRawManifest(current, plan.sourceManifest, "stale_source");
  const backupKeys = backupKeysForManifest(plan.sourceManifest);
  for (let index = 0; index < binding.source.length; index += 1) writeString(storage, backupKeys[index]!, binding.source[index]!.raw);
  const backupVerified = freezeState({ phase: "backup_verified", plan, backupKeys });
  writeState(storage, backupVerified);
  validateFullBackup(storage, backupVerified);
  const publishing = freezeState({ phase: "publishing", plan, backupKeys });
  writeState(storage, publishing);
  for (const record of binding.target) writeString(storage, record.key, record.raw);
  for (const key of plan.targetAbsentKeys) removeString(storage, key);
  verifyTarget(storage, publishing, verifier);
  const targetVerified = freezeState({ phase: "target_verified", plan, backupKeys });
  writeState(storage, targetVerified);
  const committed = freezeState({ phase: "committed", plan, backupKeys });
  writeState(storage, committed);
  return Object.freeze({ kind: "committed", state: committed, cleanup: cleanupUnlocked(storage) });
}

/** Creates a sealed, version-bound read-only verifier descriptor. */
export function createContentIdentityMigrationVerifier(input: {
  name: string;
  verify: (context: ContentIdentityMigrationVerifierContext) => boolean | void;
}): ContentIdentityMigrationVerifier {
  if (!isPlainRecord(input) || typeof input.name !== "string" || !input.name.trim() || typeof input.verify !== "function") fail("invalid_verifier");
  const verifier = Object.freeze({
    schemaIdentity: PROTOCOL_IDENTITY,
    protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION,
    verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION,
    verifierId: digestObject({ schemaIdentity: PROTOCOL_IDENTITY, protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION, verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION, name: input.name }),
    name: input.name,
  });
  sealedVerifiers.add(verifier);
  verifierBindings.set(verifier, Object.freeze({ verify: input.verify }));
  return verifier;
}

/** Explicit activation capability; the current bootstrap has no import or token. */
export function createContentIdentityMigrationActivation(targetRuntimeSchemaVersion: number): ContentIdentityMigrationActivation {
  if (targetRuntimeSchemaVersion !== CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION) fail("activation_required");
  const activation = Object.freeze({ targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION });
  sealedActivations.add(activation);
  return activation;
}

/** Pure, opaque planner. It records only raw manifests; it never reads or writes storage. */
export function planContentIdentityMigration(input: {
  source: readonly ContentIdentityMigrationRawRecord[];
  target: readonly ContentIdentityMigrationRawRecord[];
  verifier: ContentIdentityMigrationVerifier;
  targetRuntimeSchemaVersion: number;
}): ContentIdentityMigrationPlan {
  if (!isPlainRecord(input)) fail("invalid_plan");
  assertSealedVerifier(input.verifier);
  if (input.targetRuntimeSchemaVersion !== CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION) fail("unsupported_protocol");
  const source = cloneRawRecords(input.source);
  const target = cloneRawRecords(input.target);
  const sourceManifest = makeManifest(source);
  const targetManifest = makeManifest(target);
  const targetKeys = new Set(target.map((record) => record.key));
  const targetAbsentKeys = Object.freeze(source.map((record) => record.key).filter((key) => !targetKeys.has(key)).sort());
  const planId = computePlanId({ verifierId: input.verifier.verifierId, sourceManifest, targetManifest, targetAbsentKeys });
  const plan = Object.freeze({ schemaIdentity: PROTOCOL_IDENTITY, protocolVersion: CONTENT_IDENTITY_MIGRATION_PROTOCOL_VERSION, verifierVersion: CONTENT_IDENTITY_MIGRATION_VERIFIER_VERSION, targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION, planId, verifierId: input.verifier.verifierId, sourceManifest, targetManifest, targetAbsentKeys });
  sealedPlans.add(plan);
  planBindings.set(plan, Object.freeze({ source, target, verifier: input.verifier }));
  return plan;
}

/** Read-only canonical snapshot used by the later planner integration. */
export function captureContentIdentityMigrationSnapshot(storage: KeyValueStorage): readonly ContentIdentityMigrationRawRecord[] {
  const records: ContentIdentityMigrationRawRecord[] = [];
  for (const key of readKeys(storage).filter((candidate) => isCanonicalKey(candidate))) {
    const raw = readString(storage, key);
    if (raw === undefined) fail("source_snapshot_invalid");
    records.push(Object.freeze({ key, raw }));
  }
  return Object.freeze(records);
}

/** Runs one sealed transaction. No caller can forge a plan or activate it accidentally. */
export function migrateContentIdentityStorage(input: {
  storage: KeyValueStorage;
  plan: ContentIdentityMigrationPlan;
  verifier: ContentIdentityMigrationVerifier;
  activation: ContentIdentityMigrationActivation;
}): ContentIdentityMigrationRunResult {
  if (!isPlainRecord(input)) fail("invalid_plan");
  assertSealedActivation(input.activation);
  const binding = assertPlanVerifier(input.plan, input.verifier);
  const currentKeys = readKeys(input.storage).filter((key) => isCanonicalKey(key));
  const locks = [STATE_KEY, ...reservedKeys(input.storage), ...currentKeys, ...binding.source.map((record) => record.key), ...binding.target.map((record) => record.key)];
  return withCanonicalWriteLocks(locks, () => runUnlocked(input.storage, input.plan, input.verifier, binding));
}

/** Rolls pre-commit state back only after a complete semantic backup validation. */
export function recoverContentIdentityMigration(input: { storage: KeyValueStorage; verifier: ContentIdentityMigrationVerifier }): ContentIdentityMigrationRecoveryResult {
  if (!isPlainRecord(input)) fail("invalid_verifier");
  assertSealedVerifier(input.verifier);
  const currentKeys = readKeys(input.storage).filter((key) => isCanonicalKey(key));
  const locks = [STATE_KEY, ...reservedKeys(input.storage), ...currentKeys];
  return withCanonicalWriteLocks(locks, () => recoverUnlocked(input.storage, input.verifier));
}

/** Cleanup is idempotent: committed state remains as the no-rollback marker. */
export function cleanupContentIdentityMigration(storage: KeyValueStorage): ContentIdentityMigrationCleanupResult {
  const locks = [STATE_KEY, ...reservedKeys(storage)];
  return withCanonicalWriteLocks(locks, () => cleanupUnlocked(storage));
}

/** Read the protocol marker without exposing any backed-up raw payload. */
export function readContentIdentityMigrationState(storage: KeyValueStorage): ContentIdentityMigrationState | null {
  return parseState(storage);
}
