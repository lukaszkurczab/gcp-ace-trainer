import { isContentIdentityResolution, isContentIdentityTombstone, isLearningPlanV1ForTrack, isRegisteredTrackId, isResolvedContentRef, normalizeLearningPlan, type GoalRecord, type LearningPlan, type TrainingAttempt, type TrainingSession, type TrainingSessionResult, type ReviewQueueEntry } from "../../domain";
import { isGoalRecordShapeForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { canonicalJsonV1, canonicalJsonV1ByteLength, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { CANONICAL_RECORD_SCHEMA, readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, restoreCanonicalEnvelopeUnlocked, withCanonicalWriteLocks, writeCanonicalJson } from "./canonicalRecordCodec";
import { getGuestInstallation } from "./guestInstallationRepository";
import { getActiveMutationJournal } from "./mutationJournalRepository";
import { getActiveTrackId } from "./activeTrackRepository";
import { clearActiveTrackId, saveActiveTrackId } from "./activeTrackRepository";
import { addReviewQueueItems, clearReviewQueueItems, getReviewQueueItems } from "./reviewQueueRepository";
import { clearTrainingAttempts, getTrainingAttempts, addTrainingAttempt } from "./trainingAttemptRepository";
import { getTrainingSessionResult, saveTrainingSessionResult } from "./trainingSessionResultRepository";
import { clearTrainingSessions, getActiveTrainingSessionId, getTrainingSessions, saveTrainingSession } from "./trainingSessionRepository";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionResult } from "./trainingModelGuards";
import { AccountDataFailure } from "../errors";

export const SYNCABLE_RECORD_TYPES = ["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan"] as const;
export type SyncableRecordType = (typeof SYNCABLE_RECORD_TYPES)[number];

export type AccountDataRecord = Readonly<{
  fingerprint: string;
  recordId: string;
  recordType: SyncableRecordType;
  state: Readonly<Record<string, unknown>>;
  trackId: string;
  version: number;
}>;

export type AccountSyncPlanItem = Readonly<{
  sequence: number;
  recordKey: string;
  mutationId: string;
  expectedVersion: number | null;
  payload: AccountDataRecord;
  groupId: string | null;
  status: "pending" | "sent" | "acked";
}>;

export type AccountSyncPlan = Readonly<{
  planId: string;
  snapshotVersion: number;
  expectedAccountRevision: number;
  highWatermark: number;
  items: readonly AccountSyncPlanItem[];
}>;

export type AccountDataSnapshot = Readonly<{
  guestSnapshotVersion: number;
  guestUserId: string;
  records: readonly AccountDataRecord[];
  activeSession: boolean;
  pendingJournal: boolean;
}>;

export type AccountSyncState = Readonly<{
  accountId: string | null;
  status: "initialSyncRequired" | "syncing" | "synced" | "offlinePending" | "conflict" | "failed";
  localDatasetVersion: number;
  localDatasetFingerprint: string | null;
  remoteAccountRevision: number;
  lastSuccessfulSyncAt: string | null;
  pendingMutationCount: number;
  blockingConflictCode: string | null;
  lastFailureCode: string | null;
  acknowledged: Readonly<Record<string, AccountAcknowledgedRecord>>;
  outbox: readonly AccountOutboxEntry[];
  materialization: AccountMaterialization | null;
  pendingConfirmation: Readonly<{ operationId: string; previewFingerprint: string; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }> | null;
  syncPlan: AccountSyncPlan | null;
  outboxSequence: number;
  highWatermark: number;
  resetGuard: AccountResetGuard | null;
}>;

export type AccountResetGuard = Readonly<{
  accountId: string;
  createdAt: string;
  operationId: string;
  phase: "localResetPending" | "remoteRestorePending";
}>;

export type AccountMaterialization = Readonly<
  | { operationId: string; previewFingerprint: string }
  | { kind: "discardGuest"; accountId: string; installationId?: string; phase?: "prepared" | "applying"; guestBackup?: readonly GuestOwnedLocalDataBackupEntry[] }
>;

export type GuestOwnedLocalDataBackupEntry = Readonly<{ key: string; value: string }>;

export type AccountAcknowledgedRecord = Readonly<{ fingerprint: string; recordId: string; recordType: SyncableRecordType; remoteVersion: number; trackId: string }>;
export type AccountOutboxEntry = Readonly<AccountDataRecord & { mutationId: string; expectedVersion: number | null; attemptCount: number; lastErrorCode: string | null; status: "pending" | "retrying" | "failed"; sequence: number }>;

const emptyState = (): AccountSyncState => Object.freeze({ accountId: null, status: "initialSyncRequired", localDatasetVersion: 0, localDatasetFingerprint: null, remoteAccountRevision: 0, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged: Object.freeze({}), outbox: Object.freeze([]), materialization: null, pendingConfirmation: null, syncPlan: null, outboxSequence: 0, highWatermark: 0, resetGuard: null });

const LEARNING_FIXED_KEYS = [
  STORAGE_KEYS.ACTIVE_TRACK,
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
  STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
  STORAGE_KEYS.TRAINING_SESSION_INDEX,
  STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
  STORAGE_KEYS.REVIEW_INDEX,
  STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX,
  STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX,
  STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX,
  STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
] as const;

const LEARNING_RECORD_PREFIXES = [
  `${STORAGE_NAMESPACE}training-session:`,
  `${STORAGE_NAMESPACE}training-session-result:`,
  `${STORAGE_NAMESPACE}training-attempt:`,
  `${STORAGE_NAMESPACE}review-entry:`,
  `${STORAGE_NAMESPACE}archival-history:`,
  `${STORAGE_NAMESPACE}unavailable-active:`,
  `${STORAGE_NAMESPACE}unavailable-review:`,
  `${STORAGE_NAMESPACE}goal:`,
  `${STORAGE_NAMESPACE}learning-plan:`,
] as const;

function clearCanonicalLearningNamespace(includeAccountSync: boolean): void {
  const fixedKeys: ReadonlySet<string> = new Set(includeAccountSync ? [...LEARNING_FIXED_KEYS, STORAGE_KEYS.ACCOUNT_SYNC] : LEARNING_FIXED_KEYS);
  for (const key of getKeyValueStorage().getAllKeys()) {
    if (fixedKeys.has(key) || LEARNING_RECORD_PREFIXES.some((prefix) => key.startsWith(prefix))) removeCanonicalValue(key);
  }
}

export function isGuestOwnedLearningKey(key: string): boolean {
  return (LEARNING_FIXED_KEYS as readonly string[]).includes(key) || LEARNING_RECORD_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isGuestOwnedLocalDataBackupEntry(value: unknown): value is GuestOwnedLocalDataBackupEntry {
  return isRecord(value) && typeof value.key === "string" && isGuestOwnedLearningKey(value.key) && typeof value.value === "string";
}

function isSyncableRecordType(value: unknown): value is SyncableRecordType { return typeof value === "string" && (SYNCABLE_RECORD_TYPES as readonly string[]).includes(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function assertCanonicalContentIdentityState(value: unknown): void {
  const seen = new Set<unknown>();
  const visit = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (seen.has(candidate)) throw new AccountDataFailure("content_identity_schema_conflict");
    seen.add(candidate);
    if (Array.isArray(candidate)) { candidate.forEach(visit); return; }
    if (!isRecord(candidate)) throw new AccountDataFailure("content_identity_schema_conflict");
    const keys = Object.keys(candidate);
    if (keys.some((key) => key === "protocolVersion" || key === "contentIdentitySchema" || key === "packagePin" || key === "contentPackagePin" || key === "migrationVersion" || key === "legacyIdentityDigest")) {
      throw new AccountDataFailure("content_identity_schema_conflict");
    }
    if (candidate.kind === "resolved" || candidate.kind === "tombstone") {
      if (!isContentIdentityResolution(candidate)) throw new AccountDataFailure("content_identity_schema_conflict");
      return;
    }
    if (isResolvedContentRef(candidate) || isContentIdentityTombstone(candidate)) return;
    if (keys.includes("questionId") && (keys.includes("contentVersion") || keys.includes("artifactSha256"))) {
      throw new AccountDataFailure("content_identity_schema_conflict");
    }
    Object.values(candidate).forEach(visit);
  };
  visit(value);
}

function hasOnlyKeys(value: Record<string, unknown>, required: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === required.length && required.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}
function isAccountSyncPlanItem(value: unknown): value is AccountSyncPlanItem {
  if (!isRecord(value) || !Number.isSafeInteger(value.sequence) || Number(value.sequence) < 1 || typeof value.recordKey !== "string" || typeof value.mutationId !== "string" || (value.expectedVersion !== null && (!Number.isSafeInteger(value.expectedVersion) || Number(value.expectedVersion) < 0)) || !isCanonicalAccountDataRecord(value.payload) || (value.groupId !== null && typeof value.groupId !== "string") || !["pending", "sent", "acked"].includes(value.status as string)) return false;
  return value.recordKey === accountDataRecordKey(value.payload);
}

function isAccountSyncPlan(value: unknown): value is AccountSyncPlan {
  return isRecord(value)
    && hasOnlyKeys(value, ["planId", "snapshotVersion", "expectedAccountRevision", "highWatermark", "items"])
    && typeof value.planId === "string"
    && value.planId.length > 0
    && Number.isSafeInteger(value.snapshotVersion)
    && Number(value.snapshotVersion) >= 0
    && Number.isSafeInteger(value.expectedAccountRevision)
    && Number(value.expectedAccountRevision) >= 0
    && Number.isSafeInteger(value.highWatermark)
    && Number(value.highWatermark) >= 0
    && Array.isArray(value.items)
    && value.items.every(isAccountSyncPlanItem);
}

function isAccountSyncState(value: unknown): value is AccountSyncState {
  if (!isRecord(value) || !hasOnlyKeys(value, ["accountId", "status", "localDatasetVersion", "localDatasetFingerprint", "remoteAccountRevision", "lastSuccessfulSyncAt", "pendingMutationCount", "blockingConflictCode", "lastFailureCode", "acknowledged", "outbox", "materialization", "pendingConfirmation", "syncPlan", "outboxSequence", "highWatermark", "resetGuard"]) || (value.accountId !== null && typeof value.accountId !== "string") || !["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed"].includes(value.status as string) || !Number.isSafeInteger(value.localDatasetVersion) || Number(value.localDatasetVersion) < 0 || (value.localDatasetFingerprint !== null && typeof value.localDatasetFingerprint !== "string") || !Number.isSafeInteger(value.remoteAccountRevision) || Number(value.remoteAccountRevision) < 0 || !Number.isSafeInteger(value.pendingMutationCount) || Number(value.pendingMutationCount) < 0 || (value.lastSuccessfulSyncAt !== null && typeof value.lastSuccessfulSyncAt !== "string") || (value.blockingConflictCode !== null && typeof value.blockingConflictCode !== "string") || (value.lastFailureCode !== null && typeof value.lastFailureCode !== "string") || !Array.isArray(value.outbox) || !isRecord(value.acknowledged) || (value.syncPlan !== null && !isAccountSyncPlan(value.syncPlan)) || !Number.isSafeInteger(value.outboxSequence) || Number(value.outboxSequence) < 0 || !Number.isSafeInteger(value.highWatermark) || Number(value.highWatermark) < 0 || (value.resetGuard !== null && !isAccountResetGuard(value.resetGuard))) return false;
  const pending = value.pendingConfirmation;
  const pendingValid = pending === null || (isRecord(pending) && hasOnlyKeys(pending, ["operationId", "previewFingerprint", "resolutions", "groupChoices"]) && typeof pending.operationId === "string" && typeof pending.previewFingerprint === "string" && Array.isArray(pending.resolutions) && pending.resolutions.every(isResolution) && Array.isArray(pending.groupChoices) && pending.groupChoices.every(isGroupChoice));
  const acknowledgedEntries = Object.entries(value.acknowledged);
  return value.outbox.every(isOutboxEntry)
    && acknowledgedEntries.every(([key, record]) => isAcknowledgedRecord(record) && key === accountDataRecordKey(record))
    && (value.materialization === null || isAccountMaterialization(value.materialization))
    && pendingValid;
}
function isResolution(value: unknown): boolean { return isRecord(value) && typeof value.conflictId === "string" && (value.resolution === "keep_guest" || value.resolution === "keep_account"); }
function isGroupChoice(value: unknown): boolean { return isRecord(value) && typeof value.groupId === "string" && (value.resolution === "keep_guest" || value.resolution === "keep_account"); }
function isAccountMaterialization(value: unknown): value is AccountMaterialization {
  if (!isRecord(value)) return false;
  if ("kind" in value) {
    if (value.kind !== "discardGuest" || typeof value.accountId !== "string" || value.accountId.trim().length === 0) return false;
    if (value.installationId === undefined && value.phase === undefined && value.guestBackup === undefined) return true;
    return typeof value.installationId === "string" && value.installationId.trim().length > 0
      && (value.phase === "prepared" || value.phase === "applying")
      && Array.isArray(value.guestBackup) && value.guestBackup.every(isGuestOwnedLocalDataBackupEntry);
  }
  return typeof value.operationId === "string" && value.operationId.trim().length > 0 && typeof value.previewFingerprint === "string" && value.previewFingerprint.trim().length > 0;
}
function isAccountResetGuard(value: unknown): value is AccountResetGuard {
  return isRecord(value)
    && typeof value.accountId === "string"
    && value.accountId.trim().length > 0
    && typeof value.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt))
    && typeof value.operationId === "string"
    && value.operationId.trim().length > 0
    && (value.phase === "localResetPending" || value.phase === "remoteRestorePending");
}
function isAcknowledgedRecord(value: unknown): value is AccountAcknowledgedRecord { return isRecord(value) && hasOnlyKeys(value, ["fingerprint", "recordId", "recordType", "remoteVersion", "trackId"]) && typeof value.fingerprint === "string" && typeof value.recordId === "string" && isSyncableRecordType(value.recordType) && Number.isSafeInteger(value.remoteVersion) && Number(value.remoteVersion) >= 0 && typeof value.trackId === "string"; }
function isOutboxEntry(value: unknown): value is AccountOutboxEntry {
  if (!isRecord(value) || !isAccountDataRecord(value)) return false;
  const candidate = value as AccountOutboxEntry;
  return typeof candidate.mutationId === "string" && (candidate.expectedVersion === null || (typeof candidate.expectedVersion === "number" && Number.isSafeInteger(candidate.expectedVersion))) && typeof candidate.attemptCount === "number" && Number.isSafeInteger(candidate.attemptCount) && ["pending", "retrying", "failed"].includes(candidate.status) && Number.isSafeInteger(candidate.sequence) && candidate.sequence >= 1;
}
function isAccountDataRecord(value: unknown): value is AccountDataRecord {
  if (!isRecord(value) || !["fingerprint", "recordId", "recordType", "state", "trackId", "version"].every((key) => Object.hasOwn(value, key)) || typeof value.fingerprint !== "string" || !/^[a-f0-9]{64}$/u.test(value.fingerprint) || typeof value.recordId !== "string" || !isSyncableRecordType(value.recordType) || !isRecord(value.state) || typeof value.trackId !== "string" || typeof value.version !== "number") return false;
  return Number.isSafeInteger(value.version) && value.version >= 0;
}

function isCanonicalAccountDataRecord(value: unknown, exact = true): value is AccountDataRecord {
  if (!isAccountDataRecord(value) || (exact && !hasOnlyKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version"])) || value.recordId.trim().length === 0 || !isRegisteredTrackId(value.trackId)) return false;
  try {
    assertCanonicalContentIdentityState(value.state);
    return accountDataRecordFingerprint(value) === value.fingerprint;
  } catch {
    return false;
  }
}

function isCanonicalOutboxEntry(value: unknown): value is AccountOutboxEntry {
  if (!isOutboxEntry(value) || !isRecord(value) || !hasOnlyKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version", "mutationId", "expectedVersion", "attemptCount", "lastErrorCode", "status", "sequence"]) || !isCanonicalAccountDataRecord(value, false)) return false;
  const entry = value as AccountOutboxEntry;
  return typeof entry.mutationId === "string" && entry.mutationId.trim().length > 0 &&
    (entry.expectedVersion === null || (Number.isSafeInteger(entry.expectedVersion) && entry.expectedVersion >= 0)) &&
    Number.isSafeInteger(entry.attemptCount) && entry.attemptCount >= 0 &&
    (entry.lastErrorCode === null || (typeof entry.lastErrorCode === "string" && entry.lastErrorCode.trim().length > 0)) &&
    (Number.isSafeInteger(entry.sequence) && entry.sequence >= 1);
}

function isCanonicalAcknowledgedRecord(value: unknown): value is AccountAcknowledgedRecord {
  return isAcknowledgedRecord(value) && isRecord(value) && /^[a-f0-9]{64}$/u.test(value.fingerprint) && value.recordId.trim().length > 0 && isRegisteredTrackId(value.trackId) && value.remoteVersion >= 0;
}

function isCanonicalSyncPlanItem(value: unknown): value is AccountSyncPlanItem {
  if (!isAccountSyncPlanItem(value) || !isRecord(value) || !hasOnlyKeys(value, ["sequence", "recordKey", "mutationId", "expectedVersion", "payload", "groupId", "status"]) || !isCanonicalAccountDataRecord(value.payload)) return false;
  return value.recordKey === accountDataRecordKey(value.payload) && value.mutationId.trim().length > 0 &&
    (value.expectedVersion === null || (Number.isSafeInteger(value.expectedVersion) && value.expectedVersion >= 0)) &&
    (value.groupId === null || value.groupId.trim().length > 0);
}

function isCanonicalPendingConfirmation(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ["operationId", "previewFingerprint", "resolutions", "groupChoices"]) || typeof value.operationId !== "string" || value.operationId.trim().length === 0 || typeof value.previewFingerprint !== "string" || value.previewFingerprint.trim().length === 0) return false;
  if (!Array.isArray(value.resolutions) || !value.resolutions.every((entry) => isRecord(entry) && hasOnlyKeys(entry, ["conflictId", "resolution"]) && isResolution(entry))) return false;
  if (!Array.isArray(value.groupChoices) || !value.groupChoices.every((entry) => isRecord(entry) && hasOnlyKeys(entry, ["groupId", "resolution"]) && isGroupChoice(entry))) return false;
  return true;
}

function isCanonicalMaterialization(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if ("kind" in value) {
    if ((!hasOnlyKeys(value, ["kind", "accountId"]) && !hasOnlyKeys(value, ["kind", "accountId", "installationId", "phase", "guestBackup"])) || value.kind !== "discardGuest" || typeof value.accountId !== "string" || value.accountId.trim().length === 0) return false;
    const hasBackup = value.installationId !== undefined || value.phase !== undefined || value.guestBackup !== undefined;
    if (!hasBackup) return Object.keys(value).length === 2;
    return typeof value.installationId === "string" && value.installationId.trim().length > 0 && (value.phase === "prepared" || value.phase === "applying") && Array.isArray(value.guestBackup) && value.guestBackup.every((entry) => isRecord(entry) && hasOnlyKeys(entry, ["key", "value"]) && typeof entry.key === "string" && isGuestOwnedLearningKey(entry.key) && typeof entry.value === "string");
  }
  return hasOnlyKeys(value, ["operationId", "previewFingerprint"]) && typeof value.operationId === "string" && value.operationId.trim().length > 0 && typeof value.previewFingerprint === "string" && value.previewFingerprint.trim().length > 0;
}

/** Pure, current account-sync validation used by read-only state checks. */
export function isCanonicalAccountSyncState(value: unknown): boolean {
  if (!isRecord(value) || !isAccountSyncState(value)) return false;
  const state = value as AccountSyncState;
  try {
    assertValidAccountDataRecords(state.outbox);
    for (const item of state.syncPlan?.items ?? []) assertValidAccountDataRecords([item.payload]);
  } catch { return false; }
  if ((state.accountId !== null && state.accountId.trim().length === 0) || state.localDatasetVersion < 0 || state.remoteAccountRevision < 0 || !Number.isSafeInteger(state.pendingMutationCount) || state.pendingMutationCount < 0 || !Number.isSafeInteger(state.outboxSequence) || state.outboxSequence < 0 || !Number.isSafeInteger(state.highWatermark) || state.highWatermark < 0 || (state.localDatasetFingerprint !== null && !/^[a-f0-9]{64}$/u.test(state.localDatasetFingerprint)) || (state.lastSuccessfulSyncAt !== null && (typeof state.lastSuccessfulSyncAt !== "string" || Number.isNaN(Date.parse(state.lastSuccessfulSyncAt)))) || (state.blockingConflictCode !== null && (typeof state.blockingConflictCode !== "string" || state.blockingConflictCode.trim().length === 0)) || (state.lastFailureCode !== null && (typeof state.lastFailureCode !== "string" || state.lastFailureCode.trim().length === 0))) return false;
  if (!state.outbox.every(isCanonicalOutboxEntry) || !Object.values(state.acknowledged).every(isCanonicalAcknowledgedRecord) || !isCanonicalMaterialization(state.materialization) || !isCanonicalPendingConfirmation(state.pendingConfirmation) || (state.resetGuard !== undefined && state.resetGuard !== null && (!isAccountResetGuard(state.resetGuard) || !hasOnlyKeys(state.resetGuard, ["accountId", "createdAt", "operationId", "phase"])))) return false;
  if (state.syncPlan && !state.syncPlan.items.every(isCanonicalSyncPlanItem)) return false;
  return true;
}

type AccountDataRecordIdentity = Pick<AccountDataRecord, "recordType" | "recordId" | "trackId">;

/** Collision-safe, canonical key for one logical account record. */
export function accountDataRecordKey(record: AccountDataRecordIdentity): string {
  return canonicalJsonV1({ recordId: record.recordId, recordType: record.recordType, trackId: record.trackId });
}
export function accountDataRecordFingerprint(record: Readonly<{ recordId: string; recordType: SyncableRecordType; state: Readonly<Record<string, unknown>>; trackId: string }>): string {
  return sha256Utf8(canonicalSerialize({ recordId: record.recordId, recordType: record.recordType, state: record.state, trackId: record.trackId }));
}
export function isDeletedAccountDataRecord(record: Pick<AccountDataRecord, "state">): boolean { return record.state.deleted === true; }

function accountMutationId(accountId: string, record: Pick<AccountDataRecord, "recordType" | "recordId" | "trackId" | "fingerprint">, expectedVersion: number | null): string {
  return `mutation_${sha256Utf8(canonicalSerialize({ accountId, key: accountDataRecordKey(record), expectedVersion, fingerprint: record.fingerprint }))}`;
}

export const MAX_SYNC_ENVELOPE_UTF8_BYTES = 512 * 1024;

function syncMutationPayload(entry: AccountOutboxEntry): Readonly<Record<string, unknown>> {
  return Object.freeze({
    mutationId: entry.mutationId,
    kind: entry.recordType === "training_attempt" || entry.recordType === "review_queue_entry" ? "item" : "node",
    recordType: entry.recordType,
    trackId: entry.trackId,
    targetId: entry.recordId,
    expectedVersion: entry.expectedVersion,
    fingerprint: entry.fingerprint,
    state: entry.state,
  });
}

function syncGroupId(entry: Pick<AccountDataRecord, "recordType" | "trackId">): string | null {
  return entry.recordType === "goal" || entry.recordType === "learning_plan" ? `track:${entry.trackId}` : null;
}

function cloneAndFreezeJson(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreezeJson));
  if (isRecord(value)) return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneAndFreezeJson(child)])));
  return value;
}

function immutableSyncPayload(entry: AccountDataRecord): AccountDataRecord {
  return Object.freeze({
    fingerprint: entry.fingerprint,
    recordId: entry.recordId,
    recordType: entry.recordType,
    state: cloneAndFreezeJson(entry.state) as Readonly<Record<string, unknown>>,
    trackId: entry.trackId,
    version: entry.version,
  });
}

/**
 * Builds deterministic byte-bounded batches from durable outbox entries. A
 * track's goal and learning plan stay together; if a single record or group
 * cannot fit, an explicit failure is returned instead of a partial upload.
 */
export function splitAccountSyncBatches(input: Readonly<{
  entries: readonly AccountOutboxEntry[];
  expectedAccountRevision?: number;
  sessionId?: string;
  highWatermark?: number;
}>): readonly (readonly AccountOutboxEntry[])[] {
  assertValidAccountDataRecords(input.entries);
  const expectedAccountRevision = input.expectedAccountRevision ?? 0;
  const sessionId = input.sessionId ?? "session-placeholder";
  const highWatermark = input.highWatermark ?? Math.max(0, ...input.entries.map((entry) => entry.sequence));
  const sorted = [...input.entries].sort((left, right) => left.sequence - right.sequence || accountDataRecordKey(left).localeCompare(accountDataRecordKey(right)));
  const groups: Array<readonly AccountOutboxEntry[]> = [];
  const groupById = new Map<string, AccountOutboxEntry[]>();
  for (const entry of sorted) {
    const groupId = syncGroupId(entry);
    if (!groupId) groups.push([entry]);
    else {
      const existing = groupById.get(groupId);
      if (existing) existing.push(entry);
      else { const created = [entry]; groupById.set(groupId, created); groups.push(created); }
    }
  }
  const batches: Array<AccountOutboxEntry[]> = [];
  let current: AccountOutboxEntry[] = [];
  const fits = (entries: readonly AccountOutboxEntry[]): boolean => {
    const probe = {
      schema: "canonical-json-v1",
      payload: {
        canonicalVersion: "canonical-json-v1",
        expectedAccountRevision,
        // Reserve the longest legal UUID representation, since the actual
        // request may contain a device id while tests/helpers often omit it.
        deviceId: "00000000-0000-4000-8000-000000000000",
        sessionId,
        // Reserve three decimal digits for the deterministic batch suffix.
        batchId: `${sessionId}:batch:999`,
        highWatermark,
        mutations: entries.map(syncMutationPayload),
      },
    };
    return canonicalJsonV1ByteLength(probe) <= MAX_SYNC_ENVELOPE_UTF8_BYTES;
  };
  for (const group of groups) {
    if (!fits(group)) {
      if (group.length > 1) throw new AccountDataFailure("account_sync_group_too_large");
      throw new AccountDataFailure("account_sync_record_too_large");
    }
    if (current.length > 0 && (current.length + group.length > 100 || !fits([...current, ...group]))) {
      batches.push(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) batches.push(current);
  return Object.freeze(batches.map((batch) => Object.freeze(batch)));
}

function createSyncPlan(accountId: string, snapshotVersion: number, expectedAccountRevision: number, highWatermark: number, entries: readonly AccountOutboxEntry[]): AccountSyncPlan | null {
  if (entries.length === 0) return null;
  assertValidAccountDataRecords(entries);
  const items = entries
    .slice()
    .sort((left, right) => left.sequence - right.sequence || accountDataRecordKey(left).localeCompare(accountDataRecordKey(right)))
    .map((entry) => Object.freeze({ sequence: entry.sequence, recordKey: accountDataRecordKey(entry), mutationId: entry.mutationId, expectedVersion: entry.expectedVersion, payload: immutableSyncPayload(entry), groupId: syncGroupId(entry), status: "pending" as const }));
  const planIdentity = { accountId, snapshotVersion, expectedAccountRevision, highWatermark, items: items.map((item) => ({ sequence: item.sequence, recordKey: item.recordKey, mutationId: item.mutationId, fingerprint: item.payload.fingerprint })) };
  const planId = `plan_${sha256Utf8(canonicalJsonV1(planIdentity))}`;
  return Object.freeze({ planId, snapshotVersion, expectedAccountRevision, highWatermark, items: Object.freeze(items) });
}

function canReuseSyncPlan(plan: AccountSyncPlan | null, entries: readonly AccountOutboxEntry[]): plan is AccountSyncPlan {
  if (!plan || plan.items.length !== entries.length) return false;
  const byMutationId = new Map(entries.map((entry) => [entry.mutationId, entry]));
  return plan.items.every((item) => {
    const entry = byMutationId.get(item.mutationId);
    return entry !== undefined
      && item.sequence === entry.sequence
      && item.expectedVersion === entry.expectedVersion
      && item.recordKey === accountDataRecordKey(entry)
      && item.payload.fingerprint === entry.fingerprint;
  });
}

export async function getAccountSyncState(): Promise<AccountSyncState> {
  const storedValue = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is Record<string, unknown> => isRecord(value));
  if (storedValue !== null && !isCanonicalAccountSyncState(storedValue)) throw new AccountDataFailure("account_sync_state_invalid");
  const stored = storedValue as AccountSyncState | null;
  if (!stored) return emptyState();
  return freezeSyncState(stored);
}

function freezeSyncState(state: AccountSyncState): AccountSyncState {
  const pending = state.pendingConfirmation;
  const syncPlan = state.syncPlan;
  return Object.freeze({
    ...state,
    acknowledged: Object.freeze(Object.fromEntries(Object.entries(state.acknowledged).map(([key, record]) => [key, Object.freeze({ ...record })]))),
    outbox: Object.freeze(state.outbox.map((entry) => Object.freeze({ ...entry, state: cloneAndFreezeJson(entry.state) as Readonly<Record<string, unknown>> }))),
    pendingConfirmation: pending === null ? null : Object.freeze({
      ...pending,
      resolutions: Object.freeze(pending.resolutions.map((entry) => Object.freeze({ ...entry }))),
      groupChoices: Object.freeze(pending.groupChoices.map((entry) => Object.freeze({ ...entry }))),
    }),
    syncPlan: syncPlan === null ? null : Object.freeze({
      ...syncPlan,
      items: Object.freeze(syncPlan.items.map((item) => Object.freeze({ ...item, payload: immutableSyncPayload(item.payload) }))),
    }),
  });
}

export function saveAccountSyncState(state: AccountSyncState): AccountSyncState {
  if (!isCanonicalAccountSyncState(state)) throw new AccountDataFailure("account_sync_state_invalid");
  const saved = writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, state);
  return saved.payload;
}

function persistSnapshotDatasetVersion(state: AccountSyncState, records: readonly AccountDataRecord[]): number {
  const datasetFingerprint = sha256Utf8(canonicalSerialize(records));
  const nextVersion = state.localDatasetFingerprint === datasetFingerprint ? state.localDatasetVersion : state.localDatasetVersion + 1;
  if (nextVersion !== state.localDatasetVersion || state.localDatasetFingerprint !== datasetFingerprint) {
    saveAccountSyncState({ ...state, localDatasetVersion: nextVersion, localDatasetFingerprint: datasetFingerprint });
  }
  return nextVersion;
}

export async function buildAccountDataSnapshot(): Promise<AccountDataSnapshot> {
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  const state = await getAccountSyncState();
  const activeSession = (await getTrainingSessions()).value.some((session) => session.status === "active");
  const pendingJournal = (await getActiveMutationJournal()) !== null;
  const records = await readLocalAccountDataRecords(state);
  assertValidAccountDataRecords(records);
  const nextVersion = persistSnapshotDatasetVersion(state, records);
  return createAccountDataSnapshot(nextVersion, installation.installationId, records, activeSession, pendingJournal);
}

function createAccountDataSnapshot(guestSnapshotVersion: number, guestUserId: string, records: readonly AccountDataRecord[], activeSession: boolean, pendingJournal: boolean): AccountDataSnapshot {
  return Object.freeze({ guestSnapshotVersion, guestUserId, records: Object.freeze(records), activeSession, pendingJournal });
}

async function readLocalAccountDataRecords(state: AccountSyncState): Promise<readonly AccountDataRecord[]> {
  const records: AccountDataRecord[] = [];
  const activeTrack = await getActiveTrackId();
  if (activeTrack) records.push(makeRecord("active_track", "current", activeTrack, { trackId: activeTrack }, state));
  const sessions = (await getTrainingSessions()).value;
  for (const session of sessions.filter((candidate) => candidate.status !== "active")) records.push(makeRecord("training_session_summary", session.id, session.trackId, session, state));
  const results = await Promise.all(sessions.filter((session) => session.status !== "active").map((session) => getTrainingSessionResult(session.id)));
  for (const result of results.filter((candidate): candidate is TrainingSessionResult => candidate !== null)) records.push(makeRecord("training_session_result", result.id, result.trackId, result, state));
  for (const attempt of (await getTrainingAttempts()).value) records.push(makeRecord("training_attempt", attempt.id, attempt.trackId, attempt, state));
  for (const review of (await getReviewQueueItems()).value) records.push(makeRecord("review_queue_entry", review.id, review.trackId, review, state));
  {
    for (const key of [...getKeyValueStorage().getAllKeys()].sort()) {
      if (key.startsWith(`${STORAGE_NAMESPACE}goal:`)) {
        const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}goal:`.length);
        if (!isRegisteredTrackId(candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
        const envelope = readCanonicalEnvelope(key, (value): value is GoalRecord => isGoalRecordShapeForTrack(value, candidateTrackId));
        if (!envelope) continue;
        records.push(makeRecord("goal", candidateTrackId, candidateTrackId, { schemaVersion: 1, revision: envelope.revision, record: normalizeGoalRecord(envelope.payload) }, state));
      }
      if (key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`)) {
        const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}learning-plan:`.length);
        if (!isRegisteredTrackId(candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
        const envelope = readCanonicalEnvelope(key, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, candidateTrackId));
        if (!envelope) continue;
        records.push(makeRecord("learning_plan", candidateTrackId, candidateTrackId, { schemaVersion: 1, revision: envelope.revision, plan: normalizeLearningPlan(envelope.payload) }, state));
      }
    }
    assertGoalPlanRecordBundles(records);
  }
  for (const tombstone of Object.values(state.acknowledged)) {
    if (!records.some((record) => accountDataRecordKey(record) === accountDataRecordKey(tombstone)) && state.outbox.some((entry) => accountDataRecordKey(entry) === accountDataRecordKey(tombstone) && isDeletedAccountDataRecord(entry))) {
      records.push(makeRecord(tombstone.recordType, tombstone.recordId, tombstone.trackId, { deleted: true }, state));
    }
  }
  return Object.freeze(records.sort((left, right) => accountDataRecordKey(left).localeCompare(accountDataRecordKey(right))));
}

function makeRecord(recordType: SyncableRecordType, recordId: string, trackId: string, state: Readonly<Record<string, unknown>>, syncState: AccountSyncState): AccountDataRecord {
  const key = accountDataRecordKey({ recordType, recordId, trackId });
  const acknowledged = syncState.acknowledged[key];
  const copied = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  const fingerprint = accountDataRecordFingerprint({ recordId, recordType, state: copied, trackId });
  return Object.freeze({ fingerprint, recordId, recordType, state: Object.freeze(copied), trackId, version: acknowledged?.remoteVersion ?? 0 });
}

/** Local commits only mark pending work; account synchronization builds the outbox. */
export async function markAccountDataPending(): Promise<void> {
  const installation = await getGuestInstallation();
  if (!installation?.accountId) return;
  const state = await getAccountSyncState();
  if (state.accountId !== installation.accountId || state.materialization) return;
  if (state.status === "synced") saveAccountSyncState({ ...state, status: "offlinePending" });
}

export async function ensureAccountOutboxFromLocalDataset(): Promise<AccountSyncState> {
  const installation = await getGuestInstallation();
  let state = await getAccountSyncState();
  // A local-history reset intentionally removes local records before pulling
  // the account copy back. Never turn that temporary absence into tombstones.
  if (state.resetGuard || state.materialization) return state;
  const boundAccountId = installation?.accountId;
  if (boundAccountId !== null && boundAccountId !== undefined && state.accountId === null) {
    const localRecords = await readLocalAccountDataRecords(state);
    if (localRecords.length > 0) throw new AccountDataFailure("account_binding_mismatch");
  }
  if (!boundAccountId || state.accountId !== boundAccountId) return state;
  if (state.lastFailureCode === "mutation_id_reuse" && state.outbox.length > 0) {
    const repairedOutbox = state.outbox.map((entry) => Object.freeze({
      ...entry,
      mutationId: accountMutationId(boundAccountId, entry, entry.expectedVersion),
      status: "pending" as const,
      lastErrorCode: null,
    }));
    state = saveAccountSyncState({ ...state, outbox: Object.freeze(repairedOutbox), pendingMutationCount: repairedOutbox.length });
  }
  const snapshot = await buildAccountDataSnapshot();
  const latestState = await getAccountSyncState();
  if (latestState.resetGuard || latestState.materialization || latestState.accountId !== installation.accountId) return latestState;
  state = latestState;
  const outbox = [...state.outbox];
  let outboxSequence = state.outboxSequence;
  const byKey = new Map(outbox.map((entry) => [accountDataRecordKey(entry), entry]));
  for (const record of snapshot.records) {
    const key = accountDataRecordKey(record);
    const acknowledged = state.acknowledged[key];
    if (acknowledged?.fingerprint === record.fingerprint || byKey.get(key)?.fingerprint === record.fingerprint) continue;
    const expectedVersion = acknowledged?.remoteVersion ?? null;
    const existing = byKey.get(key);
    const entry: AccountOutboxEntry = Object.freeze({ ...record, mutationId: accountMutationId(boundAccountId, record, expectedVersion), expectedVersion, attemptCount: existing?.attemptCount ?? 0, lastErrorCode: null, status: "pending", sequence: existing?.sequence ?? ++outboxSequence });
    const existingIndex = outbox.findIndex((candidate) => accountDataRecordKey(candidate) === key);
    if (existingIndex >= 0) outbox[existingIndex] = entry;
    else outbox.push(entry);
    byKey.set(key, entry);
  }
  const currentKeys = new Set(snapshot.records.map(accountDataRecordKey));
  const hasCurrentActiveTrack = snapshot.records.some((record) => record.recordType === "active_track");
  for (const acknowledged of Object.values(state.acknowledged)) {
    const key = accountDataRecordKey(acknowledged);
    if (currentKeys.has(key) || byKey.has(key)) continue;
    // `active_track` is a local selector, not a durable deletion when the
    // learner switches to another track. Only emit its tombstone when the
    // selector is actually cleared (no current active-track record).
    if (acknowledged.recordType === "active_track" && hasCurrentActiveTrack) continue;
    const acknowledgedTombstoneFingerprint = accountDataRecordFingerprint({
      recordId: acknowledged.recordId,
      recordType: acknowledged.recordType,
      state: { deleted: true },
      trackId: acknowledged.trackId,
    });
    if (acknowledged.fingerprint === acknowledgedTombstoneFingerprint) continue;
    const tombstone: Omit<AccountOutboxEntry, "mutationId"> = Object.freeze({
      fingerprint: accountDataRecordFingerprint({ recordId: acknowledged.recordId, recordType: acknowledged.recordType, state: { deleted: true }, trackId: acknowledged.trackId }),
      recordId: acknowledged.recordId,
      recordType: acknowledged.recordType,
      state: Object.freeze({ deleted: true }),
      trackId: acknowledged.trackId,
      version: acknowledged.remoteVersion,
      expectedVersion: acknowledged.remoteVersion,
      attemptCount: 0,
      lastErrorCode: null,
      status: "pending",
      sequence: ++outboxSequence,
    });
    const tombstoneWithMutationId: AccountOutboxEntry = Object.freeze({ ...tombstone, mutationId: accountMutationId(boundAccountId, tombstone, tombstone.expectedVersion) });
    outbox.push(tombstoneWithMutationId);
    byKey.set(key, tombstoneWithMutationId);
  }
  const nextBase = { ...state, status: outbox.length > 0 ? "offlinePending" as const : state.status, pendingMutationCount: outbox.length, outbox: Object.freeze(outbox), outboxSequence, highWatermark: Math.max(state.highWatermark, outboxSequence) };
  const syncPlan = outbox.length === 0
    ? null
    : canReuseSyncPlan(state.syncPlan, outbox)
      ? state.syncPlan
      : createSyncPlan(boundAccountId, snapshot.guestSnapshotVersion, state.remoteAccountRevision, nextBase.highWatermark, outbox);
  const next = { ...nextBase, syncPlan };
  saveAccountSyncState(next);
  return next;
}

export function setAccountSyncState(input: Partial<AccountSyncState> & Pick<AccountSyncState, "accountId">): AccountSyncState {
  const stored = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is Record<string, unknown> => isRecord(value));
  if (stored !== null && !isCanonicalAccountSyncState(stored)) throw new AccountDataFailure("account_sync_state_invalid");
  const current = (stored as AccountSyncState | null) ?? emptyState();
  return saveAccountSyncState({ ...current, ...input, pendingMutationCount: input.outbox?.length ?? current.outbox.length });
}

/** Persists the reset guard before the journaled local deletion starts. */
export async function markAccountResetPending(accountId: string, operationId: string, createdAt: string): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  if (!operationId.trim() || Number.isNaN(Date.parse(createdAt))) throw new AccountDataFailure("account_sync_state_invalid");
  const current = await getAccountSyncState();
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (current.materialization) throw new AccountDataFailure("account_materialization_in_progress");
  if (current.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
  if (current.resetGuard) {
    if (current.resetGuard.accountId !== accountId || current.resetGuard.operationId !== operationId) throw new AccountDataFailure("account_binding_mismatch");
    return current;
  }
  if (
    current.accountId !== accountId
    || current.status !== "synced"
    || current.pendingMutationCount !== 0
    || current.outbox.length > 0
    || current.syncPlan !== null
    || current.blockingConflictCode !== null
    || current.lastFailureCode !== null
  ) throw new AccountDataFailure("account_reset_requires_clean_sync");
  return saveAccountSyncState({
    ...current,
    accountId,
    status: "syncing",
    lastFailureCode: null,
    outbox: Object.freeze([]),
    pendingMutationCount: 0,
    syncPlan: null,
    resetGuard: { accountId, createdAt, operationId, phase: "localResetPending" },
  });
}

/** Advances the durable reset cursor only after local deletion has completed. */
export async function markAccountResetRemoteRestorePending(accountId: string, operationId: string): Promise<AccountSyncState> {
  const current = await getAccountSyncState();
  const guard = current.resetGuard;
  if (!guard || guard.accountId !== accountId || guard.operationId !== operationId) throw new AccountDataFailure("account_sync_state_invalid");
  if (guard.phase === "remoteRestorePending") return current;
  return saveAccountSyncState({ ...current, status: "syncing", lastFailureCode: null, resetGuard: { ...guard, phase: "remoteRestorePending" } });
}

export async function markAccountMaterializationPending(operationId: string, previewFingerprint: string, accountId: string): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  const current = await getAccountSyncState();
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  return saveAccountSyncState({ ...current, accountId, materialization: { operationId, previewFingerprint }, pendingConfirmation: null, status: "syncing" });
}

export async function buildGuestOwnedLocalDataBackup(): Promise<readonly GuestOwnedLocalDataBackupEntry[]> {
  const storage = getKeyValueStorage();
  const entries: GuestOwnedLocalDataBackupEntry[] = [];
  for (const key of [...storage.getAllKeys()].filter(isGuestOwnedLearningKey).sort()) {
    const value = storage.getString(key);
    if (value !== undefined) entries.push(Object.freeze({ key, value }));
  }
  return Object.freeze(entries);
}

export async function restoreGuestOwnedLocalDataBackup(guestBackup: readonly GuestOwnedLocalDataBackupEntry[]): Promise<void> {
  if (!Array.isArray(guestBackup) || !guestBackup.every(isGuestOwnedLocalDataBackupEntry)) throw new AccountDataFailure("account_data_records_invalid");
  const storage = getKeyValueStorage();
  const currentKeys = [...storage.getAllKeys()].filter(isGuestOwnedLearningKey);
  const lockedKeys = [...new Set([...currentKeys, ...guestBackup.map((entry) => entry.key)])];
  withCanonicalWriteLocks(lockedKeys, () => {
    for (const entry of guestBackup) storage.setString(entry.key, entry.value);
    const backupKeys = new Set(guestBackup.map((entry) => entry.key));
    for (const key of currentKeys) if (!backupKeys.has(key)) storage.remove(key);
    if (guestBackup.some((entry) => storage.getString(entry.key) !== entry.value)) throw new AccountDataFailure("account_materialization_verification_failed");
  });
}

export async function markGuestDiscardMaterializationPending(accountId: string, installationId: string, guestBackup: readonly GuestOwnedLocalDataBackupEntry[]): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  if (!installationId.trim()) throw new AccountDataFailure("guest_installation_required");
  const current = await getAccountSyncState();
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (current.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
  if (current.materialization && (!("kind" in current.materialization) || current.materialization.kind !== "discardGuest" || current.materialization.accountId !== accountId)) {
    throw new AccountDataFailure("account_materialization_in_progress");
  }
  if (!Array.isArray(guestBackup) || !guestBackup.every(isGuestOwnedLocalDataBackupEntry)) throw new AccountDataFailure("account_data_records_invalid");
  return saveAccountSyncState({ ...current, accountId, materialization: { kind: "discardGuest", accountId, installationId, phase: "prepared", guestBackup: Object.freeze([...guestBackup]) }, status: "syncing", pendingConfirmation: null });
}

export async function markGuestDiscardMaterializationApplying(accountId: string): Promise<AccountSyncState> {
  const current = await getAccountSyncState();
  const materialization = current.materialization;
  if (!materialization || !("kind" in materialization) || materialization.kind !== "discardGuest" || materialization.accountId !== accountId || !materialization.installationId || !materialization.guestBackup) {
    throw new AccountDataFailure("account_materialization_target_required");
  }
  return saveAccountSyncState({ ...current, materialization: { ...materialization, phase: "applying" } });
}

export function assertValidAccountDataRecords(records: unknown): asserts records is readonly AccountDataRecord[] {
  if (!Array.isArray(records)) throw new AccountDataFailure("account_data_records_invalid");
  for (const record of records) {
    if (!isAccountDataRecord(record) || !record.recordId.trim() || !isRegisteredTrackId(record.trackId)) throw new AccountDataFailure("account_data_record_invalid");
    assertCanonicalContentIdentityState(record.state);
    if (!isCanonicalAccountDataRecord(record) && !isCanonicalOutboxEntry(record)) throw new AccountDataFailure("account_data_record_invalid");
    if (record.fingerprint !== accountDataRecordFingerprint(record)) throw new AccountDataFailure("account_data_fingerprint_invalid");
    if (isDeletedAccountDataRecord(record)) continue;
    const state = record.state;
    if (record.recordType !== "goal" && record.recordType !== "learning_plan" && state.trackId !== record.trackId) throw new AccountDataFailure("account_data_track_invalid");
    if (record.recordType === "active_track" && record.recordId !== "current") throw new AccountDataFailure("account_data_track_invalid");
    if (record.recordType === "training_session_summary" && (!isTrainingSession(state) || state.status === "active" || state.id !== record.recordId)) throw new AccountDataFailure("account_data_session_invalid");
    if (record.recordType === "training_session_result" && (!isTrainingSessionResult(state) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_result_invalid");
    if (record.recordType === "training_attempt" && (!isTrainingAttempt(state) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_attempt_invalid");
    if (record.recordType === "review_queue_entry" && (!isReviewQueueEntry(state) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_review_invalid");
    if (record.recordType === "goal") {
      const parsed = parseGoalCloudState(state, record.trackId);
      if (record.recordId !== record.trackId || !parsed) throw new AccountDataFailure("account_data_goal_invalid");
    }
    if (record.recordType === "learning_plan") {
      const parsed = parseLearningPlanCloudState(state, record.trackId);
      if (record.recordId !== record.trackId || !parsed) throw new AccountDataFailure("account_data_plan_invalid");
    }
  }
  assertGoalPlanRecordBundles(records);
}

export async function applyRemoteAccountData(records: readonly AccountDataRecord[], options: Readonly<{ preserveLocalContext?: boolean }> = {}): Promise<void> {
  assertValidAccountDataRecords(records);
  if (await getActiveTrainingSessionId()) throw new AccountDataFailure("active_session_adoption_blocked");
  const preserveLocalContext = options.preserveLocalContext === true;
  if (!preserveLocalContext) await clearActiveTrackId();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
  for (const record of records.filter((candidate) => !isDeletedAccountDataRecord(candidate) && (!preserveLocalContext || ["training_session_summary", "training_session_result", "training_attempt", "review_queue_entry"].includes(candidate.recordType)))) {
    if (record.recordType === "active_track") {
      const trackId = record.state.trackId;
      if (typeof trackId !== "string" || !isRegisteredTrackId(trackId)) throw new AccountDataFailure("account_data_track_invalid");
      await saveActiveTrackId(trackId);
    }
    if (record.recordType === "training_session_summary") {
      if (!isTrainingSession(record.state)) throw new AccountDataFailure("account_data_session_invalid");
      await saveTrainingSession(record.state);
    }
    if (record.recordType === "training_session_result") {
      if (!isTrainingSessionResult(record.state)) throw new AccountDataFailure("account_data_result_invalid");
      await saveTrainingSessionResult(record.state);
    }
    if (record.recordType === "training_attempt") {
      if (!isTrainingAttempt(record.state)) throw new AccountDataFailure("account_data_attempt_invalid");
      await addTrainingAttempt(record.state);
    }
  }
  const reviews: ReviewQueueEntry[] = [];
  for (const record of records.filter((candidate) => candidate.recordType === "review_queue_entry" && !isDeletedAccountDataRecord(candidate))) {
    if (!isReviewQueueEntry(record.state)) throw new AccountDataFailure("account_data_review_invalid");
    reviews.push(record.state);
  }
  if (reviews.length > 0) await addReviewQueueItems(reviews);
  if (!preserveLocalContext) replaceGoalPlanRecords(records);
}

type GoalCloudState = Readonly<{ schemaVersion: 1; revision: number; record: GoalRecord }>;
type LearningPlanCloudState = Readonly<{ schemaVersion: 1; revision: number; plan: LearningPlan }>;

function parseGoalCloudState(value: Readonly<Record<string, unknown>>, track: string): GoalCloudState | null {
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !isGoalRecordShapeForTrack(value.record, track) || Object.keys(value).some((key) => !["schemaVersion", "revision", "record"].includes(key))) return null;
  return Object.freeze({ schemaVersion: 1, revision: Number(value.revision), record: normalizeGoalRecord(value.record) });
}

function parseLearningPlanCloudState(value: Readonly<Record<string, unknown>>, track: string): LearningPlanCloudState | null {
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !isLearningPlanV1ForTrack(value.plan, track) || Object.keys(value).some((key) => !["schemaVersion", "revision", "plan"].includes(key))) return null;
  return Object.freeze({ schemaVersion: 1, revision: Number(value.revision), plan: normalizeLearningPlan(value.plan) });
}

function assertGoalPlanRecordBundles(records: readonly AccountDataRecord[]): void {
  const goalPlan = records.filter((record) => record.recordType === "goal" || record.recordType === "learning_plan");
  const keys = new Set<string>();
  for (const record of goalPlan) {
    const key = accountDataRecordKey(record);
    if (keys.has(key) || record.recordId !== record.trackId) throw new AccountDataFailure("account_data_goal_plan_invalid");
    keys.add(key);
    if (isDeletedAccountDataRecord(record) && Object.keys(record.state).length !== 1) throw new AccountDataFailure("account_data_goal_plan_invalid");
  }
  for (const track of new Set(goalPlan.map((record) => record.trackId))) {
    const goalRecord = goalPlan.find((record) => record.recordType === "goal" && record.trackId === track && !isDeletedAccountDataRecord(record));
    const planRecord = goalPlan.find((record) => record.recordType === "learning_plan" && record.trackId === track && !isDeletedAccountDataRecord(record));
    if (!planRecord) continue;
    if (!goalRecord) throw new AccountDataFailure("account_data_goal_plan_invalid");
    const goal = parseGoalCloudState(goalRecord.state, track);
    const plan = parseLearningPlanCloudState(planRecord.state, track);
    if (!goal || !plan || plan.plan.goalRevision > goal.revision) throw new AccountDataFailure("account_data_goal_plan_invalid");
  }
}

function replaceGoalPlanRecords(records: readonly AccountDataRecord[]): void {
  const live = records.filter((record) => (record.recordType === "goal" || record.recordType === "learning_plan") && !isDeletedAccountDataRecord(record));
  const existingKeys = getKeyValueStorage().getAllKeys().filter((key) => key.startsWith(`${STORAGE_NAMESPACE}goal:`) || key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`));
  const keys = [...existingKeys, ...live.map((record) => record.recordType === "goal" ? STORAGE_KEYS.goal(record.trackId) : STORAGE_KEYS.learningPlan(record.trackId))];
  withCanonicalWriteLocks(keys, () => {
    for (const key of existingKeys) removeCanonicalValue(key);
    for (const record of live) {
      if (record.recordType === "goal") {
        const parsed = parseGoalCloudState(record.state, record.trackId);
        if (!parsed) throw new AccountDataFailure("account_data_goal_invalid");
        restoreCanonicalEnvelopeUnlocked(STORAGE_KEYS.goal(record.trackId), { schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: parsed.revision, payload: parsed.record });
      } else {
        const parsed = parseLearningPlanCloudState(record.state, record.trackId);
        if (!parsed) throw new AccountDataFailure("account_data_plan_invalid");
        restoreCanonicalEnvelopeUnlocked(STORAGE_KEYS.learningPlan(record.trackId), { schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: parsed.revision, payload: parsed.plan });
      }
    }
  });
}

export async function finishAccountMaterialization(records: readonly AccountDataRecord[], accountId: string, remoteAccountRevision: number, syncedAt: string): Promise<AccountSyncState> {
  assertValidAccountDataRecords(records);
  const current = await getAccountSyncState();
  // A paged/partial remote response must not erase ACKs for another track.
  // Full identity keys let later reconciliation retain each independent
  // `(recordType, recordId, trackId)` version without cross-track leakage.
  const acknowledged = Object.freeze({
    ...current.acknowledged,
    ...Object.fromEntries(records.map((record) => [accountDataRecordKey(record), { fingerprint: record.fingerprint, recordId: record.recordId, recordType: record.recordType, remoteVersion: record.version, trackId: record.trackId }])),
  });
  if (current.resetGuard && current.resetGuard.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  return saveAccountSyncState({ ...current, accountId, status: "synced", remoteAccountRevision, lastSuccessfulSyncAt: syncedAt, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged, outbox: Object.freeze([]), materialization: null, pendingConfirmation: null, syncPlan: null, resetGuard: null });
}

/** Clears only local guest-owned learning and pending report data. The account sync marker is retained for recovery. */
export async function clearGuestOwnedLocalData(): Promise<void> {
  clearCanonicalLearningNamespace(false);
}

/**
 * Clears the account-owned learning namespace after the remote account has
 * been deleted.  This intentionally has a separate entry point from
 * clearAccountOwnedLocalData: sign-out must retain pending learning state so
 * it can be synchronized on the next account session, while deletion must
 * remove every learning record, including records no longer present in an
 * index.  The deletion marker, installation identity, preferences, and
 * mutation journal are outside this allow-list and remain durable.
 */
export async function clearAccountDeletionOwnedLocalData(): Promise<void> {
  // Enumerate before removing so a failed individual delete leaves the
  // remaining namespace discoverable for the next retry.  Do not broaden this
  // to the whole canonical namespace: settings, installation, journal, and
  // lifecycle markers have different ownership and recovery semantics.
  clearCanonicalLearningNamespace(true);
}

export async function clearAccountOwnedLocalData(): Promise<void> {
  await clearActiveTrackId();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
  removeCanonicalValue(STORAGE_KEYS.ACCOUNT_SYNC);
}
