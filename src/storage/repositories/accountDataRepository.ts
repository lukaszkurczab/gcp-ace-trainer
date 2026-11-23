import { isAccountWireState } from "../../domain/account/accountWireState";
import { projectTerminalSession, materializeTerminalSession } from "../contracts/terminalSessionWire";
import { isContentIdentityResolution, isContentIdentityTombstone, isLearningPlanV1ForTrack, isResolvedContentRef, normalizeLearningPlan, type GoalRecord, type LearningPlan, type TrainingAttempt, type TrainingSession, type TrainingSessionResult, type ReviewQueueEntry } from "../../domain";
import { isGoalRecordForPolicy, normalizeGoalRecord, type GoalPolicyResolver } from "../../domain/goals/goalContracts";
import { resolveGoalPolicy } from "../../domain/goals/goalPolicy";
import { canonicalJsonV1, canonicalJsonV1ByteLength, canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { accountDataRecordFingerprint } from "../../domain/identity/recordFingerprint";
import { SYNCABLE_RECORD_TYPES, type SyncableRecordType } from "../../domain/account/accountDataRecordIdentity";
import { applyActiveForegroundTimerRaw, captureActiveProfileStorageLease, pauseActiveForegroundClock, getKeyValueStorage, isKeyValueWriteObservable, onKeyValueWrite } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { createCooperativeSlice } from "../../infrastructure/scheduling/cooperativeSlice";
import { CANONICAL_RECORD_SCHEMA, readCanonicalEnvelope, readCanonicalJson, readCanonicalRawValue, removeCanonicalValue, restoreCanonicalEnvelopeUnlocked, withCanonicalWriteLocks, writeCanonicalJson, writeCanonicalJsonUnlocked } from "./canonicalRecordCodec";
import { getGuestInstallation } from "./guestInstallationRepository";
import { getActiveMutationJournal } from "./mutationJournalRepository";
import { getActiveTrackId } from "./activeTrackRepository";
import { clearActiveTrackId, saveActiveTrackId } from "./activeTrackRepository";
import { addReviewQueueItems, clearReviewQueueItems, getReviewQueueItems } from "./reviewQueueRepository";
import { clearTrainingAttempts, getTrainingAttempts, addTrainingAttemptsBatch } from "./trainingAttemptRepository";
import { getTrainingSessionResult, saveTrainingSessionResult } from "./trainingSessionResultRepository";
import { assertTrainingEvidenceIntegrity } from "./trainingEvidenceIntegrityRepository";
import { clearTrainingSessions, getActiveTrainingSessionId, getTrainingSessions, saveTerminalTrainingSessionsBatch } from "./trainingSessionRepository";
import { isForegroundTimerState, isReviewQueueEntry, isTrainingAttempt, isTrainingSessionResult } from "./trainingModelGuards";
import { AccountDataFailure, StorageReadError } from "../errors";
import { acceptedTargetFromGoal } from "../../domain/learning/learningPlan";
import { isTrackAdmitted, type LearningDataAdmissionContext, type TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

export { SYNCABLE_RECORD_TYPES, type SyncableRecordType } from "../../domain/account/accountDataRecordIdentity";
export { accountDataRecordFingerprint } from "../../domain/identity/recordFingerprint";

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
  guestAdoptionChoice: "transfer" | "discard";
  status: "initialSyncRequired" | "syncing" | "synced" | "offlinePending" | "conflict" | "failed";
  localDatasetVersion: number;
  localDatasetFingerprint: string | null;
  remoteAccountRevision: number;
  lastSuccessfulSyncAt: string | null;
  pendingMutationCount: number;
  blockingConflictCode: string | null;
  /** A confirmed sync 409 is durable and gates every automatic POST until explicit resolution. */
  syncConflict?: AccountSyncConflict | null;
  lastFailureCode: string | null;
  acknowledged: Readonly<Record<string, AccountAcknowledgedRecord>>;
  outbox: readonly AccountOutboxEntry[];
  materialization: AccountMaterialization | null;
  pendingConfirmation: Readonly<{ operationId: string; previewFingerprint: string; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }> | null;
  syncPlan: AccountSyncPlan | null;
  outboxSequence: number;
  highWatermark: number;
  resetGuard: AccountResetGuard | null;
  learningPlanRecovery: LearningPlanRecoveryIncident | null;
}>;

export type LearningPlanRecoveryIncident = Readonly<{
  attemptCount: number;
  accountId: string;
  dismissed: boolean;
  fingerprint: string;
  generation: number;
  incidentId: string;
  recordId: string;
  remoteVersion: number;
  nextRetryAt: string | null;
  trackId: string;
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
export type AccountSyncConflict = Readonly<{
  schemaVersion: 1;
  conflictId: string;
  code: "account_revision_conflict" | "version_conflict" | "content_identity_schema_conflict";
  planId: string;
  batchId: string;
  batchIndex: number;
  expectedAccountRevision: number;
  requestFingerprint: string;
  mutationIds: readonly string[];
  recordKeys: readonly string[];
  trackIds: readonly string[];
  occurredAt: string;
}>;
export type AccountMutationAcknowledgement = Readonly<{ mutationId: string; record: AccountDataRecord }>;
export type AccountOutboxEntry = Readonly<AccountDataRecord & { mutationId: string; expectedVersion: number | null; attemptCount: number; lastErrorCode: string | null; status: "pending" | "retrying" | "failed"; sequence: number }>;

/*
 * T1.2 (D5): validation moves to the write boundary and the validated sync
 * state is memoized in memory. Trust model:
 * - A frozen sync state is reused only while the exact stored bytes (which
 *   include the envelope revision), the storage owner, the active profile
 *   lease and the admission context ("actor") are all unchanged. Any other
 *   writer, a profile switch or a tampered value forces full revalidation; a
 *   cold start has an empty memo, so it always revalidates everything.
 * - A record fingerprint is re-hashed only for state objects this module did
 *   not deep-freeze itself after a verified hash. Within one synchronous
 *   validation pass, a record object is hashed at most once.
 */

type FingerprintIdentity = Readonly<{ fingerprint: string; recordId: string; recordType: SyncableRecordType; trackId: string }>;
type FingerprintSubject = Readonly<{ recordId: string; recordType: SyncableRecordType; state: Readonly<Record<string, unknown>>; trackId: string }>;
/** Deep-frozen state objects created by this module (immutable by construction). */
const ownFrozenStates = new WeakSet<object>();
/** Verified fingerprint identity for an own deep-frozen state object. */
const verifiedFrozenStates = new WeakMap<object, FingerprintIdentity>();
/** Hashes computed within the current synchronous validation pass. */
let validationPassFingerprints: WeakMap<object, string> | null = null;

type AccountSyncStateMemo = Readonly<{
  storage: object;
  lease: string;
  trackAdmission: TrackAdmissionContext;
  goalPolicyResolver: GoalPolicyResolver;
  raw: string;
  state: AccountSyncState;
  /** J3: reported ACCOUNT_SYNC writes on `storage` when the memo was taken; null when the store does not report writes. */
  writes: number | null;
}>;
let accountSyncStateMemo: AccountSyncStateMemo | null = null;
/** J3 (D5a): writes to ACCOUNT_SYNC reported by each storage owner. */
const accountSyncWrites = new WeakMap<object, number>();
onKeyValueWrite((storage, key) => {
  if (key === STORAGE_KEYS.ACCOUNT_SYNC) accountSyncWrites.set(storage, (accountSyncWrites.get(storage) ?? 0) + 1);
});
function accountSyncWriteCount(storage: object): number | null {
  return isKeyValueWriteObservable(storage) ? accountSyncWrites.get(storage) ?? 0 : null;
}

const accountDataPerfCounters = { fingerprintComputations: 0, fullStateValidations: 0, stateMemoHits: 0, stateEpochHits: 0 };

/** Test-only: observes how much verification work the repository performs. */
export function readAccountDataPerfCountersForTests(): Readonly<typeof accountDataPerfCounters> { return Object.freeze({ ...accountDataPerfCounters }); }
export function resetAccountDataPerfCountersForTests(): void {
  accountDataPerfCounters.fingerprintComputations = 0;
  accountDataPerfCounters.fullStateValidations = 0;
  accountDataPerfCounters.stateMemoHits = 0;
  accountDataPerfCounters.stateEpochHits = 0;
}
/** Drops the in-memory sync-state memo; the next read fully revalidates the stored bytes. */
export function invalidateAccountSyncStateMemo(): void { accountSyncStateMemo = null; }

function computeRecordFingerprint(record: FingerprintSubject): string {
  accountDataPerfCounters.fingerprintComputations += 1;
  return accountDataRecordFingerprint(record);
}

function recordFingerprintMatches(record: FingerprintSubject & Readonly<{ fingerprint: string }>): boolean {
  const known = verifiedFrozenStates.get(record.state);
  if (known && known.fingerprint === record.fingerprint && known.recordId === record.recordId && known.recordType === record.recordType && known.trackId === record.trackId) return true;
  const pass = validationPassFingerprints;
  const cached = pass?.get(record);
  if (cached !== undefined) return cached === record.fingerprint;
  const computed = computeRecordFingerprint(record);
  pass?.set(record, computed);
  if (computed === record.fingerprint) rememberVerifiedFingerprint(record);
  return computed === record.fingerprint;
}

function rememberVerifiedFingerprint(record: FingerprintSubject & Readonly<{ fingerprint: string }>): void {
  if (!ownFrozenStates.has(record.state)) return;
  verifiedFrozenStates.set(record.state, Object.freeze({ fingerprint: record.fingerprint, recordId: record.recordId, recordType: record.recordType, trackId: record.trackId }));
}

/** Runs `work` inside the given fingerprint pass (several slices of one validation share it). */
function withValidationPassMap<T>(pass: WeakMap<object, string>, work: () => T): T {
  if (validationPassFingerprints !== null) return work();
  validationPassFingerprints = pass;
  try { return work(); } finally { validationPassFingerprints = null; }
}

function withValidationPass<T>(work: () => T): T {
  if (validationPassFingerprints !== null) return work();
  validationPassFingerprints = new WeakMap();
  try { return work(); } finally { validationPassFingerprints = null; }
}

function deepFreezeJsonInPlace(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreezeJsonInPlace(child);
}

/** Deep-frozen, identity-stable copy of a record state; reuses states this module already froze. */
function freezeRecordState(state: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  if (ownFrozenStates.has(state)) return state;
  const frozen = cloneAndFreezeJson(state) as Readonly<Record<string, unknown>>;
  ownFrozenStates.add(frozen);
  return frozen;
}

function captureLeaseKey(): string {
  const lease = captureActiveProfileStorageLease();
  return lease ? `${lease.generation}\u0000${lease.profile.kind}\u0000${lease.profile.id}\u0000${lease.profile.accountId ?? ""}` : "none";
}

function readAccountSyncRaw(): Readonly<{ storage: object; raw: string | undefined }> {
  const storage = getKeyValueStorage();
  let raw: string | undefined;
  try { raw = storage.getString(STORAGE_KEYS.ACCOUNT_SYNC); } catch (error) { throw new StorageReadError(STORAGE_KEYS.ACCOUNT_SYNC, error); }
  return { storage, raw };
}

function memoizedAccountSyncState(storage: object, raw: string, context: LearningDataAdmissionContext): AccountSyncState | null {
  const memo = accountSyncStateMemo;
  if (!memo) return null;
  if (memo.storage !== storage || memo.raw !== raw || memo.trackAdmission !== context.trackAdmission || memo.goalPolicyResolver !== context.goalPolicyResolver || memo.lease !== captureLeaseKey()) return null;
  accountDataPerfCounters.stateMemoHits += 1;
  return memo.state;
}

/** Marks every outbox and plan payload of an already validated, frozen state as fingerprint-verified. */
function rememberValidatedStateRecords(state: AccountSyncState): void {
  for (const entry of state.outbox) rememberVerifiedFingerprint(entry);
  for (const item of state.syncPlan?.items ?? []) rememberVerifiedFingerprint(item.payload);
}

function storeAccountSyncStateMemo(storage: object, raw: string, context: LearningDataAdmissionContext, state: AccountSyncState): void {
  rememberValidatedStateRecords(state);
  accountSyncStateMemo = Object.freeze({ storage, lease: captureLeaseKey(), trackAdmission: context.trackAdmission, goalPolicyResolver: context.goalPolicyResolver, raw, state, writes: accountSyncWriteCount(storage) });
}

/**
 * The single validated read of ACCOUNT_SYNC. A memo hit requires the same
 * storage owner, profile lease and admission context, and either no reported
 * write to ACCOUNT_SYNC since the memo (J3, D5a: no read at all on a store that
 * reports its writes) or identical stored bytes.
 */
function readValidatedAccountSyncStateMemoized(context: LearningDataAdmissionContext): AccountSyncState {
  const memo = accountSyncStateMemo;
  if (memo && memo.writes !== null) {
    const storage = getKeyValueStorage();
    if (memo.storage === storage && accountSyncWriteCount(storage) === memo.writes && memo.trackAdmission === context.trackAdmission
      && memo.goalPolicyResolver === context.goalPolicyResolver && memo.lease === captureLeaseKey()) {
      accountDataPerfCounters.stateEpochHits += 1;
      return memo.state;
    }
  }
  const { storage, raw } = readAccountSyncRaw();
  if (raw === undefined) {
    accountSyncStateMemo = null;
    return emptyState();
  }
  const hit = memoizedAccountSyncState(storage, raw, context);
  if (hit) return hit;
  accountSyncStateMemo = null;
  const storedValue = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is Record<string, unknown> => isRecord(value));
  if (storedValue === null) return emptyState();
  if (!isCanonicalAccountSyncState(storedValue, context)) throw new AccountDataFailure("account_sync_state_invalid");
  const stored = storedValue as AccountSyncState;
  const state = freezeSyncState({ ...stored, learningPlanRecovery: stored.learningPlanRecovery ?? null, syncConflict: stored.syncConflict ?? null });
  storeAccountSyncStateMemo(storage, raw, context, state);
  return state;
}

const emptyState = (): AccountSyncState =>Object.freeze({ accountId: null, guestAdoptionChoice: "transfer", status: "initialSyncRequired", localDatasetVersion: 0, localDatasetFingerprint: null, remoteAccountRevision: 0, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, syncConflict: null, acknowledged: Object.freeze({}), outbox: Object.freeze([]), materialization: null, pendingConfirmation: null, syncPlan: null, outboxSequence: 0, highWatermark: 0, resetGuard: null, learningPlanRecovery: null });

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
  pauseActiveForegroundClock();
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
    // Both identity shapes require an own `questionId` key; checking it first
    // avoids throwing and catching a validator error for every nested object.
    if (Object.hasOwn(candidate, "questionId") && (isResolvedContentRef(candidate) || isContentIdentityTombstone(candidate))) return;
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
function isAccountSyncPlanItem(value: unknown, admission: TrackAdmissionContext): value is AccountSyncPlanItem {
  if (!isRecord(value) || !Number.isSafeInteger(value.sequence) || Number(value.sequence) < 1 || typeof value.recordKey !== "string" || typeof value.mutationId !== "string" || (value.expectedVersion !== null && (!Number.isSafeInteger(value.expectedVersion) || Number(value.expectedVersion) < 0)) || !isCanonicalAccountDataRecord(value.payload, admission) || (value.groupId !== null && typeof value.groupId !== "string") || !["pending", "sent", "acked"].includes(value.status as string)) return false;
  return value.recordKey === accountDataRecordKey(value.payload);
}

function isAccountSyncPlan(value: unknown, admission: TrackAdmissionContext): value is AccountSyncPlan {
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
    && value.items.every((item) => isAccountSyncPlanItem(item, admission));
}

function isAccountSyncState(value: unknown, admission: TrackAdmissionContext): value is AccountSyncState {
  const keys = ["accountId", "guestAdoptionChoice", "status", "localDatasetVersion", "localDatasetFingerprint", "remoteAccountRevision", "lastSuccessfulSyncAt", "pendingMutationCount", "blockingConflictCode", "lastFailureCode", "acknowledged", "outbox", "materialization", "pendingConfirmation", "syncPlan", "outboxSequence", "highWatermark", "resetGuard"];
  if (!isRecord(value)) return false;
  const allowedKeys = [...keys, ...(Object.hasOwn(value, "learningPlanRecovery") ? ["learningPlanRecovery"] : []), ...(Object.hasOwn(value, "syncConflict") ? ["syncConflict"] : [])];
  if (!hasOnlyKeys(value, allowedKeys) || (value.accountId !== null && typeof value.accountId !== "string") || (value.guestAdoptionChoice !== "transfer" && value.guestAdoptionChoice !== "discard") || !["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed"].includes(value.status as string) || !Number.isSafeInteger(value.localDatasetVersion) || Number(value.localDatasetVersion) < 0 || (value.localDatasetFingerprint !== null && typeof value.localDatasetFingerprint !== "string") || !Number.isSafeInteger(value.remoteAccountRevision) || Number(value.remoteAccountRevision) < 0 || !Number.isSafeInteger(value.pendingMutationCount) || Number(value.pendingMutationCount) < 0 || (value.lastSuccessfulSyncAt !== null && typeof value.lastSuccessfulSyncAt !== "string") || (value.blockingConflictCode !== null && typeof value.blockingConflictCode !== "string") || (value.lastFailureCode !== null && typeof value.lastFailureCode !== "string") || !Array.isArray(value.outbox) || !isRecord(value.acknowledged) || (value.syncPlan !== null && !isAccountSyncPlan(value.syncPlan, admission)) || !Number.isSafeInteger(value.outboxSequence) || Number(value.outboxSequence) < 0 || !Number.isSafeInteger(value.highWatermark) || Number(value.highWatermark) < 0 || (value.resetGuard !== null && !isAccountResetGuard(value.resetGuard))) return false;
  const pending = value.pendingConfirmation;
  const pendingValid = pending === null || (isRecord(pending) && hasOnlyKeys(pending, ["operationId", "previewFingerprint", "resolutions", "groupChoices"]) && typeof pending.operationId === "string" && typeof pending.previewFingerprint === "string" && Array.isArray(pending.resolutions) && pending.resolutions.every(isResolution) && Array.isArray(pending.groupChoices) && pending.groupChoices.every(isGroupChoice));
  const acknowledgedEntries = Object.entries(value.acknowledged);
  return value.outbox.every((entry) => isCanonicalOutboxEntry(entry, admission))
    && acknowledgedEntries.every(([key, record]) => isCanonicalAcknowledgedRecord(record, admission) && key === accountDataRecordKey(record))
    && (value.materialization === null || isAccountMaterialization(value.materialization))
    && (value.learningPlanRecovery === undefined || value.learningPlanRecovery === null || isLearningPlanRecoveryIncident(value.learningPlanRecovery, admission))
    && (value.syncConflict === undefined || value.syncConflict === null || isAccountSyncConflict(value.syncConflict, admission))
    && pendingValid;
}

/** Structural envelope check only; callers making policy decisions must use the resolver-backed validator. */
export function isAccountSyncStateShape(value: unknown, admission: TrackAdmissionContext): value is AccountSyncState { return isAccountSyncState(value, admission); }
function isAccountSyncConflict(value: unknown, admission: TrackAdmissionContext): value is AccountSyncConflict {
  return isRecord(value) && hasOnlyKeys(value, ["schemaVersion", "conflictId", "code", "planId", "batchId", "batchIndex", "expectedAccountRevision", "requestFingerprint", "mutationIds", "recordKeys", "trackIds", "occurredAt"])
    && value.schemaVersion === 1 && typeof value.conflictId === "string" && /^[a-f0-9]{64}$/u.test(value.conflictId)
    && ["account_revision_conflict", "version_conflict", "content_identity_schema_conflict"].includes(value.code as string)
    && typeof value.planId === "string" && value.planId.trim().length > 0 && typeof value.batchId === "string" && value.batchId.trim().length > 0
    && Number.isSafeInteger(value.batchIndex) && Number(value.batchIndex) >= 0
    && Number.isSafeInteger(value.expectedAccountRevision) && Number(value.expectedAccountRevision) >= 0
    && typeof value.requestFingerprint === "string" && /^[a-f0-9]{64}$/u.test(value.requestFingerprint)
    && Array.isArray(value.mutationIds) && value.mutationIds.length > 0 && value.mutationIds.every((id) => typeof id === "string" && id.trim().length > 0)
    && new Set(value.mutationIds).size === value.mutationIds.length
    && Array.isArray(value.recordKeys) && value.recordKeys.length === value.mutationIds.length && value.recordKeys.every((key) => typeof key === "string" && key.length > 0)
    && Array.isArray(value.trackIds) && value.trackIds.length > 0 && value.trackIds.every((id) => typeof id === "string" && isTrackAdmitted(admission, id))
    && new Set(value.trackIds).size === value.trackIds.length
    && typeof value.occurredAt === "string" && !Number.isNaN(Date.parse(value.occurredAt));
}
function isLearningPlanRecoveryIncident(value: unknown, admission: TrackAdmissionContext): value is LearningPlanRecoveryIncident {
  return isRecord(value)
    && hasOnlyKeys(value, ["accountId", "attemptCount", "dismissed", "fingerprint", "generation", "incidentId", "recordId", "remoteVersion", "nextRetryAt", "trackId"])
    && Number.isSafeInteger(value.attemptCount) && Number(value.attemptCount) >= 0
    && typeof value.accountId === "string" && value.accountId.trim().length > 0
    && typeof value.dismissed === "boolean"
    && typeof value.fingerprint === "string" && /^[a-f0-9]{64}$/u.test(value.fingerprint)
    && Number.isSafeInteger(value.generation) && Number(value.generation) >= 0
    && typeof value.incidentId === "string" && /^[a-f0-9]{64}$/u.test(value.incidentId)
    && typeof value.recordId === "string" && value.recordId.trim().length > 0
    && Number.isSafeInteger(value.remoteVersion) && Number(value.remoteVersion) >= 0
    && (value.nextRetryAt === null || (typeof value.nextRetryAt === "string" && !Number.isNaN(Date.parse(value.nextRetryAt))))
    && typeof value.trackId === "string" && isTrackAdmitted(admission, value.trackId)
    && value.recordId === value.trackId;
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
function isOutboxEntry(value: unknown, _admission: TrackAdmissionContext): value is AccountOutboxEntry {
  if (!isRecord(value) || !isAccountDataRecord(value)) return false;
  const candidate = value as AccountOutboxEntry;
  return typeof candidate.mutationId === "string" && (candidate.expectedVersion === null || (typeof candidate.expectedVersion === "number" && Number.isSafeInteger(candidate.expectedVersion))) && typeof candidate.attemptCount === "number" && Number.isSafeInteger(candidate.attemptCount) && ["pending", "retrying", "failed"].includes(candidate.status) && Number.isSafeInteger(candidate.sequence) && candidate.sequence >= 1;
}
function isAccountDataRecord(value: unknown): value is AccountDataRecord {
  if (!isRecord(value) || !["fingerprint", "recordId", "recordType", "state", "trackId", "version"].every((key) => Object.hasOwn(value, key)) || typeof value.fingerprint !== "string" || !/^[a-f0-9]{64}$/u.test(value.fingerprint) || typeof value.recordId !== "string" || !isSyncableRecordType(value.recordType) || !isRecord(value.state) || typeof value.trackId !== "string" || typeof value.version !== "number") return false;
  return Number.isSafeInteger(value.version) && value.version >= 0;
}

function isCanonicalAccountDataRecord(value: unknown, admission: TrackAdmissionContext, exact = true): value is AccountDataRecord {
  if (!isAccountDataRecord(value) || (exact && !hasOnlyKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version"])) || value.recordId.trim().length === 0 || !isTrackAdmitted(admission, value.trackId)) return false;
  try {
    assertCanonicalContentIdentityState(value.state);
    return isAccountWireState(value.recordType, value.recordId, value.trackId, value.state) && recordFingerprintMatches(value);
  } catch {
    return false;
  }
}

function isCanonicalOutboxEntry(value: unknown, admission: TrackAdmissionContext): value is AccountOutboxEntry {
  if (!isOutboxEntry(value, admission) || !isRecord(value) || !hasOnlyKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version", "mutationId", "expectedVersion", "attemptCount", "lastErrorCode", "status", "sequence"]) || !isCanonicalAccountDataRecord(value, admission, false)) return false;
  const entry = value as AccountOutboxEntry;
  return typeof entry.mutationId === "string" && entry.mutationId.trim().length > 0 &&
    (entry.expectedVersion === null || (Number.isSafeInteger(entry.expectedVersion) && entry.expectedVersion >= 0)) &&
    Number.isSafeInteger(entry.attemptCount) && entry.attemptCount >= 0 &&
    (entry.lastErrorCode === null || (typeof entry.lastErrorCode === "string" && entry.lastErrorCode.trim().length > 0)) &&
    (Number.isSafeInteger(entry.sequence) && entry.sequence >= 1);
}

function isCanonicalAcknowledgedRecord(value: unknown, admission: TrackAdmissionContext): value is AccountAcknowledgedRecord {
  return isAcknowledgedRecord(value) && isRecord(value) && /^[a-f0-9]{64}$/u.test(value.fingerprint) && value.recordId.trim().length > 0 && isTrackAdmitted(admission, value.trackId) && value.remoteVersion >= 0;
}

function isCanonicalSyncPlanItem(value: unknown, admission: TrackAdmissionContext): value is AccountSyncPlanItem {
  if (!isAccountSyncPlanItem(value, admission) || !isRecord(value) || !hasOnlyKeys(value, ["sequence", "recordKey", "mutationId", "expectedVersion", "payload", "groupId", "status"]) || !isCanonicalAccountDataRecord(value.payload, admission)) return false;
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
export function isCanonicalAccountSyncState(value: unknown, context: LearningDataAdmissionContext): boolean {
  accountDataPerfCounters.fullStateValidations += 1;
  return withValidationPass(() => isCanonicalAccountSyncStateUnchecked(value, context));
}

function isCanonicalAccountSyncStateUnchecked(value: unknown, context: LearningDataAdmissionContext): boolean {
  if (!isRecord(value) || !isAccountSyncState(value, context.trackAdmission)) return false;
  const state = value as AccountSyncState;
  try {
    assertValidAccountDataRecords(state.outbox, context);
    assertValidAccountDataRecords(state.syncPlan?.items.map((item) => item.payload) ?? [], context);
  } catch { return false; }
  if ((state.accountId !== null && state.accountId.trim().length === 0) || state.localDatasetVersion < 0 || state.remoteAccountRevision < 0 || !Number.isSafeInteger(state.pendingMutationCount) || state.pendingMutationCount < 0 || !Number.isSafeInteger(state.outboxSequence) || state.outboxSequence < 0 || !Number.isSafeInteger(state.highWatermark) || state.highWatermark < 0 || (state.localDatasetFingerprint !== null && !/^[a-f0-9]{64}$/u.test(state.localDatasetFingerprint)) || (state.lastSuccessfulSyncAt !== null && (typeof state.lastSuccessfulSyncAt !== "string" || Number.isNaN(Date.parse(state.lastSuccessfulSyncAt)))) || (state.blockingConflictCode !== null && (typeof state.blockingConflictCode !== "string" || state.blockingConflictCode.trim().length === 0)) || (state.lastFailureCode !== null && (typeof state.lastFailureCode !== "string" || state.lastFailureCode.trim().length === 0))) return false;
  if (!state.outbox.every((entry) => isCanonicalOutboxEntry(entry, context.trackAdmission)) || !Object.values(state.acknowledged).every((entry) => isCanonicalAcknowledgedRecord(entry, context.trackAdmission)) || !isCanonicalMaterialization(state.materialization) || !isCanonicalPendingConfirmation(state.pendingConfirmation) || (state.resetGuard !== undefined && state.resetGuard !== null && (!isAccountResetGuard(state.resetGuard) || !hasOnlyKeys(state.resetGuard, ["accountId", "createdAt", "operationId", "phase"]))) || (state.learningPlanRecovery !== undefined && state.learningPlanRecovery !== null && (!isLearningPlanRecoveryIncident(state.learningPlanRecovery, context.trackAdmission) || state.learningPlanRecovery.accountId !== state.accountId))) return false;
  if (state.syncPlan && !state.syncPlan.items.every((item) => isCanonicalSyncPlanItem(item, context.trackAdmission))) return false;
  if (state.syncConflict) {
    const plan = state.syncPlan;
    if (!plan || state.status !== "conflict" || state.blockingConflictCode !== state.syncConflict.code
      || state.remoteAccountRevision !== state.syncConflict.expectedAccountRevision
      || plan.planId !== state.syncConflict.planId) return false;
    const byId = new Map(plan.items.map((item) => [item.mutationId, item]));
    const conflictTracks = new Set(state.syncConflict.trackIds);
    if (state.syncConflict.mutationIds.some((id, index) => {
      const item = byId.get(id);
      return !item || item.recordKey !== state.syncConflict!.recordKeys[index] || !conflictTracks.has(item.payload.trackId);
    })) return false;
  }
  return true;
}

type AccountDataRecordIdentity = Pick<AccountDataRecord, "recordType" | "recordId" | "trackId">;

/** Collision-safe, canonical key for one logical account record. */
export function accountDataRecordKey(record: AccountDataRecordIdentity): string {
  const { recordId, recordType, trackId } = record;
  // The key is a pure function of three strings; memoize it so per-record
  // loops, sorts and validations do not re-canonicalize the same identity.
  if (typeof recordId !== "string" || typeof recordType !== "string" || typeof trackId !== "string") {
    return canonicalJsonV1({ recordId, recordType, trackId });
  }
  let byTrack = recordKeyMemo.get(recordType);
  if (!byTrack) { byTrack = new Map(); recordKeyMemo.set(recordType, byTrack); }
  let byId = byTrack.get(trackId);
  if (!byId) { byId = new Map(); byTrack.set(trackId, byId); }
  const cached = byId.get(recordId);
  if (cached !== undefined) return cached;
  if (recordKeyMemoSize >= RECORD_KEY_MEMO_LIMIT) { recordKeyMemo.clear(); recordKeyMemoSize = 0; return accountDataRecordKey(record); }
  const key = canonicalJsonV1({ recordId, recordType, trackId });
  byId.set(recordId, key);
  recordKeyMemoSize += 1;
  return key;
}
const RECORD_KEY_MEMO_LIMIT = 50_000;
const recordKeyMemo = new Map<string, Map<string, Map<string, string>>>();
let recordKeyMemoSize = 0;
export function isDeletedAccountDataRecord(record: Pick<AccountDataRecord, "state">): boolean { return record.state.deleted === true; }

function accountMutationId(accountId: string, record: Pick<AccountDataRecord, "recordType" | "recordId" | "trackId" | "fingerprint">, expectedVersion: number | null): string {
  return `mutation_${sha256Utf8(canonicalSerialize({ accountId, key: accountDataRecordKey(record), expectedVersion, fingerprint: record.fingerprint }))}`;
}

/** Builds a selected record's outbox intent against the freshly-read remote version. */
export function createConflictResolutionOutboxEntry(input: Readonly<{
  accountId: string;
  record: AccountDataRecord;
  expectedVersion: number | null;
  sequence: number;
  previous?: AccountOutboxEntry;
}>): AccountOutboxEntry {
  if (!input.accountId.trim() || !Number.isSafeInteger(input.sequence) || input.sequence < 1
    || (input.expectedVersion !== null && (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1))) {
    throw new AccountDataFailure("account_sync_state_invalid");
  }
  const record = immutableSyncPayload(input.record);
  return Object.freeze({
    ...record,
    mutationId: accountMutationId(input.accountId, record, input.expectedVersion),
    expectedVersion: input.expectedVersion,
    attemptCount: input.previous?.attemptCount ?? 0,
    lastErrorCode: null,
    status: "pending",
    sequence: input.previous?.sequence ?? input.sequence,
  });
}

/** Rebuilds only the plan envelope while retaining already-ACKed item states. */
export function rebuildConflictResolutionSyncPlan(input: Readonly<{
  accountId: string;
  snapshotVersion: number;
  remoteAccountRevision: number;
  highWatermark: number;
  outbox: readonly AccountOutboxEntry[];
  previous: AccountSyncPlan | null;
}>, context: LearningDataAdmissionContext): AccountSyncPlan | null {
  const rebuilt = createSyncPlan(input.accountId, input.snapshotVersion, input.remoteAccountRevision, input.highWatermark, input.outbox, context);
  if (!rebuilt || !input.previous) return rebuilt;
  const previousStatus = new Map(input.previous.items.map((item) => [item.mutationId, item.status]));
  return Object.freeze({
    ...rebuilt,
    items: Object.freeze(rebuilt.items.map((item) => previousStatus.get(item.mutationId) === "acked" ? Object.freeze({ ...item, status: "acked" as const }) : item)),
  });
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
    state: freezeRecordState(entry.state),
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
}>, context: LearningDataAdmissionContext): readonly (readonly AccountOutboxEntry[])[] {
  assertValidAccountDataRecords(input.entries, context);
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

function createSyncPlan(accountId: string, snapshotVersion: number, expectedAccountRevision: number, highWatermark: number, entries: readonly AccountOutboxEntry[], context: LearningDataAdmissionContext): AccountSyncPlan | null {
  if (entries.length === 0) return null;
  assertValidAccountDataRecords(entries, context);
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

export async function getAccountSyncState(context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  return readValidatedAccountSyncStateMemoized(context);
}

export function readAccountSyncStateEnvelope(context: LearningDataAdmissionContext): import("./canonicalRecordCodec").CanonicalRecordEnvelope<AccountSyncState> | null {
  return readCanonicalEnvelope(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is AccountSyncState => isCanonicalAccountSyncState(value, context));
}

function freezeSyncState(state: AccountSyncState): AccountSyncState {
  const pending = state.pendingConfirmation;
  const syncPlan = state.syncPlan;
  return Object.freeze({
    ...state,
    acknowledged: Object.freeze(Object.fromEntries(Object.entries(state.acknowledged).map(([key, record]) => [key, Object.freeze({ ...record })]))),
    outbox: Object.freeze(state.outbox.map((entry) => Object.freeze({ ...entry, state: freezeRecordState(entry.state) }))),
    pendingConfirmation: pending === null ? null : Object.freeze({
      ...pending,
      resolutions: Object.freeze(pending.resolutions.map((entry) => Object.freeze({ ...entry }))),
      groupChoices: Object.freeze(pending.groupChoices.map((entry) => Object.freeze({ ...entry }))),
    }),
    syncPlan: syncPlan === null ? null : Object.freeze({
      ...syncPlan,
      items: Object.freeze(syncPlan.items.map((item) => Object.freeze({ ...item, payload: immutableSyncPayload(item.payload) }))),
    }),
    learningPlanRecovery: state.learningPlanRecovery === null ? null : Object.freeze({ ...state.learningPlanRecovery }),
    syncConflict: state.syncConflict == null ? null : Object.freeze({ ...state.syncConflict, mutationIds: Object.freeze([...state.syncConflict.mutationIds]), recordKeys: Object.freeze([...state.syncConflict.recordKeys]), trackIds: Object.freeze([...state.syncConflict.trackIds]) }),
  });
}

export function saveAccountSyncState(state: AccountSyncState, context: LearningDataAdmissionContext, expectedRevision?: number | null): AccountSyncState {
  if (!isCanonicalAccountSyncState(state, context)) throw new AccountDataFailure("account_sync_state_invalid");
  accountSyncStateMemo = null;
  const saved = writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, state, expectedRevision);
  // Validated at this write boundary: memoize exactly what a fresh read of
  // the verified bytes would return, keyed by those bytes.
  const { storage, raw } = readAccountSyncRaw();
  if (raw !== undefined) storeAccountSyncStateMemo(storage, raw, context, freezeSyncState({ ...state, learningPlanRecovery: state.learningPlanRecovery ?? null, syncConflict: state.syncConflict ?? null }));
  return saved.payload;
}

/**
 * Retains exact upload acknowledgements without clearing the local outbox.
 * The persisted sync-plan mutation ID binds each remote version to the exact
 * payload that the server acknowledged; a later local edit therefore gets a
 * new outbox entry based on this confirmed remote version.
 */
export function recordAccountMutationAcknowledgements(input: Readonly<{
  accountId: string;
  planId: string;
  remoteAccountRevision: number;
  acknowledgements: readonly AccountMutationAcknowledgement[];
}>, context: LearningDataAdmissionContext): AccountSyncState {
  assertTrainingEvidenceIntegrityUnlessUnchanged(context);
  if (!input.accountId.trim() || !input.planId.trim() || !Number.isSafeInteger(input.remoteAccountRevision) || input.remoteAccountRevision < 0) {
    throw new AccountDataFailure("account_sync_state_invalid");
  }
  const current = readValidatedAccountSyncState(context);
  const plan = current.syncPlan;
  if (current.accountId !== input.accountId || !plan || plan.planId !== input.planId) throw new AccountDataFailure("account_sync_state_invalid");
  assertValidAccountDataRecords(input.acknowledgements.map((acknowledgement) => acknowledgement.record), context);
  const itemsByMutationId = new Map(plan.items.map((item) => [item.mutationId, item]));
  const acknowledged = { ...current.acknowledged };
  const seen = new Set<string>();
  for (const { mutationId, record } of input.acknowledgements) {
    const item = itemsByMutationId.get(mutationId);
    if (!item || seen.has(mutationId)
      || item.recordKey !== accountDataRecordKey(record)
      || item.payload.fingerprint !== record.fingerprint
      || item.payload.recordType !== record.recordType
      || item.payload.recordId !== record.recordId
      || item.payload.trackId !== record.trackId
      || (item.expectedVersion !== null && record.version <= item.expectedVersion)
      || (item.expectedVersion === null && record.version < 1)) {
      throw new AccountDataFailure("account_sync_state_invalid");
    }
    seen.add(mutationId);
    acknowledged[item.recordKey] = Object.freeze({
      fingerprint: record.fingerprint,
      recordId: record.recordId,
      recordType: record.recordType,
      remoteVersion: record.version,
      trackId: record.trackId,
    });
  }
  const acknowledgedPlan = Object.freeze({
    ...plan,
    items: Object.freeze(plan.items.map((item) => seen.has(item.mutationId) ? Object.freeze({ ...item, status: "acked" as const }) : item)),
  });
  return saveAccountSyncState({
    ...current,
    remoteAccountRevision: input.remoteAccountRevision,
    acknowledged: Object.freeze(acknowledged),
    syncPlan: acknowledgedPlan,
  }, context);
}

export function dismissLearningPlanRecovery(accountId: string, incidentId: string, context: LearningDataAdmissionContext): AccountSyncState {
  const current = readValidatedAccountSyncStateMemoized(context);
  const incident = current.learningPlanRecovery;
  if (!incident || current.accountId !== accountId || incident.accountId !== accountId || incident.incidentId !== incidentId) {
    throw new AccountDataFailure("account_binding_mismatch");
  }
  return saveAccountSyncState({ ...current, learningPlanRecovery: Object.freeze({ ...incident, dismissed: true }) }, context);
}

/** Reserves one durable read attempt before any recovery request can start. */
export function reserveLearningPlanRecoveryAttempt(
  accountId: string,
  incidentId: string,
  now: Date,
  nextRetryAt: (attemptCount: number, now: Date) => string,
  isDue: (nextRetryAt: string | null, now: Date) => boolean,
  context: LearningDataAdmissionContext,
): AccountSyncState | null {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Recovery clock must be a valid date.");
  return withCanonicalWriteLocks([STORAGE_KEYS.ACCOUNT_SYNC], () => {
    const current = readValidatedAccountSyncState(context);
    const incident = current.learningPlanRecovery;
    if (current.accountId !== accountId || !incident || incident.accountId !== accountId || incident.incidentId !== incidentId || !isDue(incident.nextRetryAt, now)) return null;
    const attemptCount = incident.attemptCount + 1;
    const reserved = Object.freeze({ ...incident, attemptCount, nextRetryAt: nextRetryAt(attemptCount, now) });
    return writeCanonicalJsonUnlocked(STORAGE_KEYS.ACCOUNT_SYNC, { ...current, learningPlanRecovery: reserved }).payload;
  });
}

/** Commits only the exact valid replacement under one plan + ACCOUNT_SYNC lock. */
export function completeLearningPlanRecovery(
  accountId: string,
  incidentId: string,
  record: AccountDataRecord,
  context: LearningDataAdmissionContext,
): AccountSyncState | null {
  if (!isCanonicalAccountDataRecord(record, context.trackAdmission)
    || record.recordType !== "learning_plan"
    || record.recordId !== record.trackId) return null;
  const planState = parseLearningPlanCloudState(record.state, record.trackId);
  if (!planState || planState.plan.trackId !== record.trackId) return null;
  const planKey = STORAGE_KEYS.learningPlan(record.trackId);
  const goalKey = STORAGE_KEYS.goal(record.trackId);
  return withCanonicalWriteLocks([planKey, STORAGE_KEYS.ACCOUNT_SYNC], () => {
    const current = readValidatedAccountSyncState(context);
    const incident = current.learningPlanRecovery;
    if (current.accountId !== accountId || !incident || incident.accountId !== accountId || incident.incidentId !== incidentId
      || incident.recordId !== record.recordId || incident.trackId !== record.trackId || record.version <= incident.remoteVersion) return null;
    const goal = readCanonicalEnvelope(goalKey, (value): value is GoalRecord => isGoalRecordForPolicy(value, resolveGoalPolicy(context.goalPolicyResolver, record.trackId)));
    if (!goal || planState.plan.goalRevision !== goal.revision) return null;
    const priorPlan = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, record.trackId));
    const priorSync = readCanonicalEnvelope(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is Record<string, unknown> => isRecord(value));
    const key = accountDataRecordKey(record);
    const acknowledged = Object.freeze({
      ...current.acknowledged,
      [key]: Object.freeze({ fingerprint: record.fingerprint, recordId: record.recordId, recordType: "learning_plan" as const, remoteVersion: record.version, trackId: record.trackId }),
    });
    // This read-only recovery materializes exactly one plan. Advancing the
    // account-wide revision would incorrectly acknowledge unrelated remote
    // records that were fetched but deliberately not applied here.
    const next = { ...current, acknowledged, learningPlanRecovery: null };
    if (!isCanonicalAccountSyncState(next, context)) throw new AccountDataFailure("account_sync_state_invalid");
    try {
      restoreCanonicalEnvelopeUnlocked(planKey, { schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: planState.revision, payload: planState.plan });
      writeCanonicalJsonUnlocked(STORAGE_KEYS.ACCOUNT_SYNC, next);
      return freezeSyncState(next);
    } catch (error) {
      if (priorPlan) restoreCanonicalEnvelopeUnlocked(planKey, priorPlan);
      else removeCanonicalValue(planKey);
      if (priorSync) restoreCanonicalEnvelopeUnlocked(STORAGE_KEYS.ACCOUNT_SYNC, priorSync);
      else removeCanonicalValue(STORAGE_KEYS.ACCOUNT_SYNC);
      throw error;
    }
  });
}

function readValidatedAccountSyncState(context: LearningDataAdmissionContext): AccountSyncState {
  return readValidatedAccountSyncStateMemoized(context);
}

export async function saveGuestAdoptionChoice(choice: "transfer" | "discard", context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  const current = await getAccountSyncState(context);
  const saved = saveAccountSyncState({ ...current, guestAdoptionChoice: choice }, context);
  if (saved.guestAdoptionChoice !== choice) throw new AccountDataFailure("account_sync_state_invalid");
  return saved;
}

/*
 * T2.6: account snapshots scale with history.
 *
 * One sync used to build four full snapshots of the local account dataset
 * (every record projected, cloned and fingerprinted) plus three guard reads of
 * the whole evidence store. Now:
 * - Local evidence (integrity check, installation, active session, journal and
 *   the projected records) is memoized per storage revision: a counter of
 *   writes to snapshot input keys, reported by the storage owner itself
 *   (`onKeyValueWrite`). The memo key also holds the storage owner, the profile
 *   lease (actor, profile, generation) and the admission context. Writes to
 *   ACCOUNT_SYNC do not change the revision; the sync-state dependent part of a
 *   snapshot (remote versions, tombstones, dataset version) is recomputed from
 *   the current sync state, and the finished snapshot is reused only for the
 *   identical frozen sync state.
 * - A projected record is reused across revisions while the stored bytes of
 *   its source are unchanged, so a snapshot after a quiz projects and
 *   fingerprints only the new records.
 * - The dataset fingerprint hashes (key, record fingerprint, version) lines
 *   instead of the canonical serialization of every record state.
 * - The record pass yields in 50 ms slices; a write that lands during a yield
 *   discards the read and reads again (no torn snapshot).
 * A cold start has empty memos, so the first snapshot verifies every record.
 */
/** Drops the in-memory snapshot memos; the next snapshot verifies every record again. */
export function clearSyncSnapshotMemo(): void {
  localEvidenceMemo = null;
  snapshotMemo = null;
  recordMemo = null;
}

const snapshotPerfCounters = { evidenceMemoHits: 0, snapshotMemoHits: 0, recordMemoHits: 0, recordProjections: 0, tornReads: 0, integritySkips: 0, knownRemoteRecords: 0 };
export function readSyncSnapshotPerfCountersForTests(): Readonly<typeof snapshotPerfCounters> { return Object.freeze({ ...snapshotPerfCounters }); }
export function resetSyncSnapshotPerfCountersForTests(): void { for (const key of Object.keys(snapshotPerfCounters) as (keyof typeof snapshotPerfCounters)[]) snapshotPerfCounters[key] = 0; }

/** Canonical keys that no snapshot or guard reads; every other canonical key is an input. */
const SNAPSHOT_NON_INPUT_KEYS: ReadonlySet<string> = new Set([
  STORAGE_KEYS.ACCOUNT_SYNC,
  STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.NOTIFICATION_SETTINGS,
  STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL,
  STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT,
  STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
  STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES,
  STORAGE_KEYS.GUEST_ACCESS,
  STORAGE_KEYS.ACCOUNT_SIGN_OUT,
  STORAGE_KEYS.ACCOUNT_DELETION,
]);
export function isAccountSnapshotInputKey(key: string): boolean { return key.startsWith(STORAGE_NAMESPACE) && !SNAPSHOT_NON_INPUT_KEYS.has(key); }
const snapshotInputRevisions = new WeakMap<object, number>();
onKeyValueWrite((storage, key) => {
  if (isAccountSnapshotInputKey(key)) snapshotInputRevisions.set(storage, (snapshotInputRevisions.get(storage) ?? 0) + 1);
});

type SnapshotScope = Readonly<{ storage: object; lease: string; revision: number; trackAdmission: TrackAdmissionContext; goalPolicyResolver: GoalPolicyResolver }>;
function captureSnapshotScope(context: LearningDataAdmissionContext): SnapshotScope | null {
  const storage = getKeyValueStorage();
  if (!isKeyValueWriteObservable(storage)) return null;
  return Object.freeze({ storage, lease: captureLeaseKey(), revision: snapshotInputRevisions.get(storage) ?? 0, trackAdmission: context.trackAdmission, goalPolicyResolver: context.goalPolicyResolver });
}
function sameSnapshotScope(left: SnapshotScope, right: SnapshotScope): boolean {
  return left.storage === right.storage && left.lease === right.lease && left.revision === right.revision
    && left.trackAdmission === right.trackAdmission && left.goalPolicyResolver === right.goalPolicyResolver;
}

/** A projected, verified local record without its remote version. */
type BaseRecord = Readonly<{ key: string; fingerprint: string; recordId: string; recordType: SyncableRecordType; state: Readonly<Record<string, unknown>>; trackId: string }>;
type RecordMemoEntry = Readonly<{ source: unknown; base: BaseRecord }>;
type RecordMemo = Readonly<{ storage: object; lease: string; trackAdmission: TrackAdmissionContext; goalPolicyResolver: GoalPolicyResolver; entries: ReadonlyMap<string, RecordMemoEntry> }>;
let recordMemo: RecordMemo | null = null;
/** Last versioned record built for a base record (reused while the version is unchanged). */
const versionedRecords = new WeakMap<BaseRecord, AccountDataRecord>();

type LocalEvidence = Readonly<{
  scope: SnapshotScope | null;
  installationId: string;
  activeSession: boolean;
  pendingJournal: boolean;
  /** Sorted by record key; null when only the guard flags were read. */
  base: readonly BaseRecord[] | null;
}>;
let localEvidenceMemo: LocalEvidence | null = null;
type SnapshotMemo = Readonly<{ evidence: LocalEvidence; state: AccountSyncState; snapshot: AccountDataSnapshot }>;
let snapshotMemo: SnapshotMemo | null = null;

const MAX_EVIDENCE_READS = 3;

/**
 * Integrity, installation, sync-state validity, active session and journal
 * guards, and (with `withRecords`) the projected local records. Same checks
 * and failures, in the same order, as the snapshot path before T2.6.
 */
async function readLocalEvidence(context: LearningDataAdmissionContext, withRecords: boolean): Promise<LocalEvidence> {
  for (let attempt = 1; ; attempt += 1) {
    const scope = captureSnapshotScope(context);
    const memo = localEvidenceMemo;
    const sameScope = scope !== null && memo !== null && memo.scope !== null && sameSnapshotScope(memo.scope, scope);
    let evidence: LocalEvidence;
    if (sameScope && (memo.base !== null || !withRecords)) {
      snapshotPerfCounters.evidenceMemoHits += 1;
      await getAccountSyncState(context);
      return memo;
    }
    const slice = attempt < MAX_EVIDENCE_READS ? createCooperativeSlice() : null;
    if (sameScope) {
      // The guards were already checked at this exact revision; only the records are missing.
      await getAccountSyncState(context);
      evidence = Object.freeze({ ...memo, base: await readLocalBaseRecords(context, slice) });
    } else {
      assertTrainingEvidenceIntegrity(context.trackAdmission);
      const installation = await getGuestInstallation();
      if (!installation) throw new AccountDataFailure("guest_installation_required");
      await getAccountSyncState(context);
      const activeSession = (await getTrainingSessions(context.trackAdmission)).value.some((session) => session.status === "active");
      const activeJournal = await getActiveMutationJournal(context);
      if (activeJournal?.operation === "accept_goal_plan" || activeJournal?.operation === "resolve_account_sync_conflict") throw new AccountDataFailure("journal_recovery_required");
      evidence = Object.freeze({
        scope, installationId: installation.installationId, activeSession, pendingJournal: activeJournal !== null,
        base: withRecords ? await readLocalBaseRecords(context, slice) : null,
      });
    }
    if (scope === null) return evidence;
    const after = captureSnapshotScope(context);
    if (after !== null && sameSnapshotScope(scope, after)) {
      localEvidenceMemo = evidence;
      return evidence;
    }
    // A write landed while the read yielded: it may be torn, so read again
    // (the last attempt does not yield). Never memoize a read that changed.
    snapshotPerfCounters.tornReads += 1;
    if (attempt >= MAX_EVIDENCE_READS) return evidence;
  }
}

/**
 * The full evidence integrity gate, skipped only when this process already
 * passed it under the same storage owner, lease, admission context and
 * snapshot-input revision, i.e. when no input byte was written since.
 */
function assertTrainingEvidenceIntegrityUnlessUnchanged(context: LearningDataAdmissionContext): void {
  const scope = captureSnapshotScope(context);
  const memo = localEvidenceMemo;
  if (scope !== null && memo !== null && memo.scope !== null && sameSnapshotScope(memo.scope, scope)) {
    snapshotPerfCounters.integritySkips += 1;
    return;
  }
  assertTrainingEvidenceIntegrity(context.trackAdmission);
}

/** Record key → fingerprint of local records this process projected and fully validated under `context`. */
function verifiedLocalRecordFingerprints(context: LearningDataAdmissionContext): ReadonlyMap<string, string> {
  const memo = recordMemo;
  const known = new Map<string, string>();
  if (!memo || memo.trackAdmission !== context.trackAdmission || memo.goalPolicyResolver !== context.goalPolicyResolver) return known;
  for (const entry of memo.entries.values()) known.set(entry.base.key, entry.base.fingerprint);
  return known;
}

/** Remote record lists returned by the partition, validated under the mapped context. */
const validatedRemoteRecordLists = new WeakMap<readonly AccountDataRecord[], LearningDataAdmissionContext>();

function recordMemoFor(context: LearningDataAdmissionContext): RecordMemo | null {
  const storage = getKeyValueStorage();
  const lease = captureLeaseKey();
  const memo = recordMemo;
  if (memo && memo.storage === storage && memo.lease === lease && memo.trackAdmission === context.trackAdmission && memo.goalPolicyResolver === context.goalPolicyResolver) return memo;
  return Object.freeze({ storage, lease, trackAdmission: context.trackAdmission, goalPolicyResolver: context.goalPolicyResolver, entries: new Map() });
}

const RECORD_MEMO_LIMIT = 50_000;

/** Every local record, projected and verified once per unchanged stored source; sorted by record key. */
async function readLocalBaseRecords(context: LearningDataAdmissionContext, slice: (() => Promise<void>) | null): Promise<readonly BaseRecord[]> {
  const memo = recordMemoFor(context);
  const entries = new Map<string, RecordMemoEntry>();
  const base: BaseRecord[] = [];
  // Memo slots are keyed by the storage key of the source record (or the record key).
  const add = (slot: string | null, recordType: SyncableRecordType, recordId: string, trackId: string, source: unknown, project: () => Readonly<Record<string, unknown>>): void => {
    const key = accountDataRecordKey({ recordType, recordId, trackId });
    const memoKey = slot ?? key;
    const cached = memo?.entries.get(memoKey);
    if (cached && source !== undefined && cached.source === source && cached.base.key === key) {
      snapshotPerfCounters.recordMemoHits += 1;
      entries.set(memoKey, cached);
      base.push(cached.base);
      return;
    }
    snapshotPerfCounters.recordProjections += 1;
    const record = makeVersionedRecord(recordType, recordId, trackId, project(), 0);
    withValidationPass(() => assertValidAccountDataRecordUnchecked(record, context));
    const entry: RecordMemoEntry = Object.freeze({ source, base: Object.freeze({ key, fingerprint: record.fingerprint, recordId, recordType, state: record.state, trackId }) });
    entries.set(memoKey, entry);
    base.push(entry.base);
  };
  // A memo slot is reused only for the exact stored bytes it was projected from.
  const sourceBytes = (key: string): string | undefined => (memo ? readCanonicalRawValue(key) : undefined);
  const activeTrack = await getActiveTrackId();
  if (activeTrack) add(null, "active_track", "current", activeTrack, activeTrack, () => ({ trackId: activeTrack }));
  const terminalSessions = (await getTrainingSessions(context.trackAdmission)).value.filter((candidate) => candidate.status !== "active");
  for (const session of terminalSessions) {
    const sessionKey = STORAGE_KEYS.trainingSession(session.id);
    add(sessionKey, "training_session_summary", session.id, session.trackId, sourceBytes(sessionKey), () => projectTerminalSession(session));
    if (slice) await slice();
  }
  for (const session of terminalSessions) {
    const resultKey = STORAGE_KEYS.trainingSessionResult(session.id);
    const raw = sourceBytes(resultKey);
    const cached = memo?.entries.get(resultKey);
    if (raw !== undefined && cached && cached.source === raw) {
      add(resultKey, "training_session_result", cached.base.recordId, cached.base.trackId, raw, () => cached.base.state);
      continue;
    }
    const result = await getTrainingSessionResult(session.id, context.trackAdmission);
    if (result !== null) add(resultKey, "training_session_result", result.id, result.trackId, raw, () => result);
    if (slice) await slice();
  }
  for (const attempt of (await getTrainingAttempts(context.trackAdmission)).value) {
    const attemptKey = STORAGE_KEYS.trainingAttempt(attempt.id);
    add(attemptKey, "training_attempt", attempt.id, attempt.trackId, sourceBytes(attemptKey), () => attempt);
    if (slice) await slice();
  }
  for (const review of (await getReviewQueueItems(context.trackAdmission)).value) {
    const reviewKey = STORAGE_KEYS.reviewEntry(review.id);
    add(reviewKey, "review_queue_entry", review.id, review.trackId, sourceBytes(reviewKey), () => review);
    if (slice) await slice();
  }
  for (const key of getKeyValueStorage().getAllKeys().filter((candidate) => candidate.startsWith(`${STORAGE_NAMESPACE}goal:`) || candidate.startsWith(`${STORAGE_NAMESPACE}learning-plan:`)).sort()) {
    if (key.startsWith(`${STORAGE_NAMESPACE}goal:`)) {
      const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}goal:`.length);
      if (!isTrackAdmitted(context.trackAdmission, candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
      const policy = resolveGoalPolicy(context.goalPolicyResolver, candidateTrackId);
      const envelope = readCanonicalEnvelope(key, (value): value is GoalRecord => isGoalRecordForPolicy(value, policy));
      if (!envelope) continue;
      add(null, "goal", candidateTrackId, candidateTrackId, undefined, () => ({ schemaVersion: 1, revision: envelope.revision, record: normalizeGoalRecord(envelope.payload, policy) }));
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`)) {
      const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}learning-plan:`.length);
      if (!isTrackAdmitted(context.trackAdmission, candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
      const envelope = readCanonicalEnvelope(key, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, candidateTrackId));
      if (!envelope) continue;
      add(null, "learning_plan", candidateTrackId, candidateTrackId, undefined, () => ({ schemaVersion: 1, revision: envelope.revision, plan: normalizeLearningPlan(envelope.payload) }));
    }
  }
  assertGoalPlanRecordBundles(base, context.goalPolicyResolver);
  if (memo && entries.size <= RECORD_MEMO_LIMIT) recordMemo = Object.freeze({ ...memo, entries });
  else if (memo) recordMemo = null;
  return Object.freeze(sortByRecordKey(base));
}

/** Adds remote versions and acknowledged tombstones from `state` to the local base records (sorted by key). */
function versionLocalRecords(base: readonly BaseRecord[], state: AccountSyncState, context: LearningDataAdmissionContext): readonly AccountDataRecord[] {
  const records: AccountDataRecord[] = new Array(base.length);
  for (let index = 0; index < base.length; index += 1) {
    const entry = base[index]!;
    const version = state.acknowledged[entry.key]?.remoteVersion ?? 0;
    const previous = versionedRecords.get(entry);
    if (previous && previous.version === version) { records[index] = previous; continue; }
    const record: AccountDataRecord = Object.freeze({ fingerprint: entry.fingerprint, recordId: entry.recordId, recordType: entry.recordType, state: entry.state, trackId: entry.trackId, version });
    versionedRecords.set(entry, record);
    records[index] = record;
  }
  const deletedOutbox = state.outbox.filter(isDeletedAccountDataRecord);
  if (deletedOutbox.length > 0) {
    const localKeys = new Set(base.map((entry) => entry.key));
    const deletedOutboxKeys = new Set(deletedOutbox.map(accountDataRecordKey));
    let added = false;
    for (const tombstone of Object.values(state.acknowledged)) {
      const key = accountDataRecordKey(tombstone);
      if (!localKeys.has(key) && deletedOutboxKeys.has(key)) {
        const record = makeVersionedRecord(tombstone.recordType, tombstone.recordId, tombstone.trackId, { deleted: true }, state.acknowledged[key]?.remoteVersion ?? 0);
        withValidationPass(() => assertValidAccountDataRecordUnchecked(record, context));
        records.push(record);
        localKeys.add(key);
        added = true;
      }
    }
    if (added) {
      assertGoalPlanRecordBundles(records, context.goalPolicyResolver);
      sortByRecordKey(records);
    }
  }
  return Object.freeze(records);
}

/** Dataset identity: every record key with its record fingerprint and remote version. */
function localDatasetFingerprint(records: readonly AccountDataRecord[]): string {
  return sha256Utf8(records.map((record) => `${accountDataRecordKey(record)}\u0000${record.fingerprint}\u0000${record.version}`).join("\n"));
}

function persistSnapshotDatasetVersion(state: AccountSyncState, records: readonly AccountDataRecord[], context: LearningDataAdmissionContext): number {
  const datasetFingerprint = localDatasetFingerprint(records);
  const nextVersion = state.localDatasetFingerprint === datasetFingerprint ? state.localDatasetVersion : state.localDatasetVersion + 1;
  if (nextVersion !== state.localDatasetVersion || state.localDatasetFingerprint !== datasetFingerprint) {
    saveAccountSyncState({ ...state, localDatasetVersion: nextVersion, localDatasetFingerprint: datasetFingerprint }, context);
  }
  return nextVersion;
}

export async function buildAccountDataSnapshot(context: LearningDataAdmissionContext): Promise<AccountDataSnapshot> {
  const evidence = await readLocalEvidence(context, true);
  const state = await getAccountSyncState(context);
  const memo = snapshotMemo;
  if (evidence.scope !== null && memo !== null && memo.evidence === evidence && memo.state === state) {
    snapshotPerfCounters.snapshotMemoHits += 1;
    return memo.snapshot;
  }
  const records = versionLocalRecords(evidence.base!, state, context);
  const nextVersion = persistSnapshotDatasetVersion(state, records, context);
  const snapshot = createAccountDataSnapshot(nextVersion, evidence.installationId, records, evidence.activeSession, evidence.pendingJournal);
  if (evidence.scope !== null) {
    // The frozen sync state is identity-stable until its stored bytes change.
    snapshotMemo = Object.freeze({ evidence, state: await getAccountSyncState(context), snapshot });
  }
  return snapshot;
}

/**
 * The guard part of `buildAccountDataSnapshot` (same integrity and journal
 * checks, same failures) without projecting and fingerprinting every record.
 * Sync guards only need these two flags.
 */
export async function readAccountDataSyncGuardFlags(context: LearningDataAdmissionContext): Promise<Readonly<{ activeSession: boolean; pendingJournal: boolean }>> {
  const evidence = await readLocalEvidence(context, false);
  return Object.freeze({ activeSession: evidence.activeSession, pendingJournal: evidence.pendingJournal });
}

/*
 * T2.6: start sync without snapshots when nothing changed since the last
 * verified unchanged sync. After a full sync that found local evidence equal
 * to the account copy (and nothing left to upload), the repository records a
 * baseline in the profile storage: digests of the raw bytes of every snapshot
 * input key, of the acknowledged map and of the remote records, plus the sync
 * state fields they belong to. A later sync with an empty outbox compares the
 * same digests (raw bytes, no parsing, no record fingerprints); when the local
 * bytes, the sync state and the remote copy are all unchanged, the full path
 * would only rewrite `lastSuccessfulSyncAt`, so that is all it does. Any
 * difference, or any doubt, runs the full path. Bootstrap integrity checks are
 * untouched (D5); the baseline holds digests only, no learning data.
 *
 * T3.3a: the baseline also keeps the server's progress snapshot token of the
 * remote copy it digested. A cold start sends it as a conditional read; only
 * the server's `unchanged` answer for exactly that token (same account,
 * authorization and progress generation, revision and metadata write time are
 * all inside it) skips the paged download. The token is a validator, never
 * data: anything else is a full read compared by digest as before.
 */
const ACCOUNT_SYNC_BASELINE_KEY = "patternly:derived:v1:account-sync-baseline";
const ACCOUNT_SYNC_BASELINE_SCHEMA = 3;

type AccountSyncBaseline = Readonly<{
  schema: typeof ACCOUNT_SYNC_BASELINE_SCHEMA;
  accountId: string;
  remoteAccountRevision: number;
  localDatasetVersion: number;
  localDatasetFingerprint: string;
  acknowledgedDigest: string;
  remoteDigest: string;
  localInputDigest: string;
  remoteSnapshotToken: string | null;
  /** T4.2: number of snapshot input keys the digest covered; a different count is a different byte set. */
  localInputKeyCount: number;
}>;

export type AccountSyncBaselineMatch = Readonly<{ accountId: string; baseline: AccountSyncBaseline; state: AccountSyncState; scope: SnapshotScope | null; localInputDigest: string }>;

function isAccountSyncBaseline(value: unknown): value is AccountSyncBaseline {
  return isRecord(value) && hasOnlyKeys(value, ["schema", "accountId", "remoteAccountRevision", "localDatasetVersion", "localDatasetFingerprint", "acknowledgedDigest", "remoteDigest", "localInputDigest", "remoteSnapshotToken", "localInputKeyCount"])
    && value.schema === ACCOUNT_SYNC_BASELINE_SCHEMA && typeof value.accountId === "string"
    && Number.isSafeInteger(value.remoteAccountRevision) && Number.isSafeInteger(value.localDatasetVersion)
    && Number.isSafeInteger(value.localInputKeyCount) && (value.localInputKeyCount as number) >= 0
    && ["localDatasetFingerprint", "acknowledgedDigest", "remoteDigest", "localInputDigest"].every((key) => typeof value[key] === "string" && /^[a-f0-9]{64}$/u.test(value[key] as string))
    && (value.remoteSnapshotToken === null || (typeof value.remoteSnapshotToken === "string" && /^[a-f0-9]{64}$/u.test(value.remoteSnapshotToken)));
}

type LocalInputDigest = Readonly<{ digest: string; keyCount: number }>;
let localInputDigestMemo: Readonly<{ scope: SnapshotScope; value: LocalInputDigest }> | null = null;

/** T4.2: the snapshot input keys present now; the digest frames exactly these. */
function countLocalInputKeys(): number {
  return getKeyValueStorage().getAllKeys().filter(isAccountSnapshotInputKey).length;
}

/** SHA-256 over the exact stored bytes of every snapshot input key (length-framed, key order). */
async function computeLocalInputDigest(context: LearningDataAdmissionContext): Promise<LocalInputDigest | null> {
  const scope = captureSnapshotScope(context);
  const memo = localInputDigestMemo;
  if (scope && memo && sameSnapshotScope(memo.scope, scope)) return memo.value;
  const storage = getKeyValueStorage();
  const slice = createCooperativeSlice();
  const parts: string[] = [];
  let keyCount = 0;
  const keys = storage.getAllKeys().filter(isAccountSnapshotInputKey).sort();
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!;
    const raw = readCanonicalRawValue(key);
    if (raw !== undefined) { parts.push(`${key.length}:${key}${raw.length}:${raw}`); keyCount += 1; }
    if ((index & 63) === 63) await slice();
  }
  const value: LocalInputDigest = Object.freeze({ digest: sha256Utf8(parts.join("")), keyCount });
  const after = captureSnapshotScope(context);
  if (scope && after && sameSnapshotScope(scope, after)) {
    localInputDigestMemo = Object.freeze({ scope, value });
    return value;
  }
  // A write landed during the read: the digest may be torn. Never match on it.
  return scope ? null : value;
}

function acknowledgedDigest(state: AccountSyncState): string {
  const lines = Object.entries(state.acknowledged).map(([key, record]) => `${key}\u0000${record.fingerprint}\u0000${record.remoteVersion}\u0000${record.recordType}\u0000${record.recordId}\u0000${record.trackId}`);
  lines.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  return sha256Utf8(lines.join("\n"));
}

function remoteRecordsDigest(records: readonly RemoteAccountDataRecord[]): string {
  const lines = records.map((record) => JSON.stringify([record.recordType, record.trackId, record.recordId ?? null, record.targetId ?? null, record.fingerprint, record.version, record.updatedAt]));
  lines.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  return sha256Utf8(lines.join("\n"));
}

/** A sync state the full path would only re-acknowledge: bound, nothing pending, no guard or recovery. */
function isBaselineEligibleState(state: AccountSyncState, accountId: string): boolean {
  return state.accountId === accountId && (state.status === "synced" || state.status === "offlinePending")
    && state.outbox.length === 0 && state.syncPlan === null && state.materialization === null && state.pendingConfirmation === null
    && state.resetGuard === null && state.syncConflict === null && state.learningPlanRecovery === null && state.blockingConflictCode === null
    && state.localDatasetFingerprint !== null;
}

function readAccountSyncBaseline(): AccountSyncBaseline | null {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(ACCOUNT_SYNC_BASELINE_KEY); } catch { return null; }
  if (raw === undefined) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isAccountSyncBaseline(value) ? value : null;
  } catch { return null; }
}

export function clearAccountSyncBaseline(): void {
  try { getKeyValueStorage().remove(ACCOUNT_SYNC_BASELINE_KEY); } catch { /* storage closed: nothing to clear */ }
}

/**
 * Records the baseline after a full sync whose download found local evidence
 * equal to the account copy. Written only when the next full sync would
 * upload nothing (every local record acknowledged with its fingerprint, every
 * other acknowledgement a tombstone) and the dataset version is settled.
 */
export async function recordAccountSyncBaseline(input: Readonly<{ accountId: string; remoteAccountRevision: number; remoteRecords: readonly RemoteAccountDataRecord[]; remoteSnapshotToken: string | null }>, context: LearningDataAdmissionContext): Promise<boolean> {
  clearAccountSyncBaseline();
  const snapshot = await buildAccountDataSnapshot(context);
  const state = await getAccountSyncState(context);
  if (!isBaselineEligibleState(state, input.accountId) || state.status !== "synced" || state.remoteAccountRevision !== input.remoteAccountRevision) return false;
  if (snapshot.activeSession || snapshot.pendingJournal) return false;
  const localKeys = new Set<string>();
  for (const record of snapshot.records) {
    const key = accountDataRecordKey(record);
    localKeys.add(key);
    if (state.acknowledged[key]?.fingerprint !== record.fingerprint) return false;
  }
  for (const acknowledged of Object.values(state.acknowledged)) {
    if (localKeys.has(accountDataRecordKey(acknowledged))) continue;
    const tombstone = computeRecordFingerprint({ recordId: acknowledged.recordId, recordType: acknowledged.recordType, state: { deleted: true }, trackId: acknowledged.trackId });
    if (acknowledged.fingerprint !== tombstone) return false;
  }
  const localInputDigest = await computeLocalInputDigest(context);
  if (localInputDigest === null) return false;
  const latest = await getAccountSyncState(context);
  if (latest !== state && JSON.stringify(latest) !== JSON.stringify(state)) return false;
  const baseline: AccountSyncBaseline = Object.freeze({
    schema: ACCOUNT_SYNC_BASELINE_SCHEMA,
    accountId: input.accountId,
    remoteAccountRevision: state.remoteAccountRevision,
    localDatasetVersion: state.localDatasetVersion,
    localDatasetFingerprint: state.localDatasetFingerprint!,
    acknowledgedDigest: acknowledgedDigest(state),
    remoteDigest: remoteRecordsDigest(input.remoteRecords),
    localInputDigest: localInputDigest.digest,
    localInputKeyCount: localInputDigest.keyCount,
    remoteSnapshotToken: input.remoteSnapshotToken !== null && /^[a-f0-9]{64}$/u.test(input.remoteSnapshotToken) ? input.remoteSnapshotToken : null,
  });
  getKeyValueStorage().setString(ACCOUNT_SYNC_BASELINE_KEY, JSON.stringify(baseline));
  return true;
}

/** The recorded baseline, when the stored sync state and every local input byte still match it. */
export async function readAccountSyncBaselineMatch(accountId: string, context: LearningDataAdmissionContext): Promise<AccountSyncBaselineMatch | null> {
  const state = await getAccountSyncState(context);
  if (!isBaselineEligibleState(state, accountId)) return null;
  const baseline = readAccountSyncBaseline();
  if (!baseline || baseline.accountId !== accountId || baseline.remoteAccountRevision !== state.remoteAccountRevision
    || baseline.localDatasetVersion !== state.localDatasetVersion || baseline.localDatasetFingerprint !== state.localDatasetFingerprint
    || baseline.acknowledgedDigest !== acknowledgedDigest(state)) return null;
  // T4.2: a different number of input keys is a different byte set: no digest
  // (a full read of every input key) is needed to know the baseline misses.
  // After a quiz there are always new keys, so this is the common exit.
  if (countLocalInputKeys() !== baseline.localInputKeyCount) return null;
  const scope = captureSnapshotScope(context);
  const localInput = await computeLocalInputDigest(context);
  if (localInput === null || localInput.digest !== baseline.localInputDigest || localInput.keyCount !== baseline.localInputKeyCount) return null;
  return Object.freeze({ accountId, baseline, state, scope, localInputDigest: localInput.digest });
}

export function isRemoteAccountDataUnchangedSinceBaseline(match: AccountSyncBaselineMatch, remote: Readonly<{ accountRevision: number; records: readonly RemoteAccountDataRecord[] }>): boolean {
  return Array.isArray(remote.records) && remote.accountRevision === match.baseline.remoteAccountRevision && remoteRecordsDigest(remote.records) === match.baseline.remoteDigest;
}

/** T3.3a: the server confirmed the baseline's own snapshot token at the baseline's revision. */
export function isRemoteSnapshotUnchangedSinceBaseline(match: AccountSyncBaselineMatch, read: Readonly<{ accountRevision: number; snapshotToken: string }>): boolean {
  return match.baseline.remoteSnapshotToken !== null && read.snapshotToken === match.baseline.remoteSnapshotToken
    && read.accountRevision === match.baseline.remoteAccountRevision;
}

/**
 * T3.3a: after a full read that digested equal to the baseline (the server
 * token moved, e.g. a metadata rewrite at the same revision), keep the newer
 * token so the next cold start can skip the download. Writes only when the
 * stored baseline is still the matched one.
 */
export function refreshAccountSyncBaselineSnapshotToken(match: AccountSyncBaselineMatch, remoteSnapshotToken: string | null): void {
  if (remoteSnapshotToken === null || remoteSnapshotToken === match.baseline.remoteSnapshotToken || !/^[a-f0-9]{64}$/u.test(remoteSnapshotToken)) return;
  const stored = readAccountSyncBaseline();
  if (!stored || JSON.stringify(stored) !== JSON.stringify(match.baseline)) return;
  try { getKeyValueStorage().setString(ACCOUNT_SYNC_BASELINE_KEY, JSON.stringify({ ...stored, remoteSnapshotToken })); } catch { /* storage closed: the next start reads in full */ }
}

/**
 * Completes an unchanged sync: the same final sync state as the full path
 * (status, revision, cleared failure codes, `lastSuccessfulSyncAt`). Returns
 * null, writing nothing, when the sync state or any local input changed since
 * the match; the caller then runs the full path.
 */
export async function finishUnchangedAccountSync(match: AccountSyncBaselineMatch, syncedAt: string, context: LearningDataAdmissionContext): Promise<AccountSyncState | null> {
  const state = await getAccountSyncState(context);
  if (state !== match.state && JSON.stringify(state) !== JSON.stringify(match.state)) return null;
  const scope = captureSnapshotScope(context);
  const unchangedLocal = match.scope !== null && scope !== null
    ? sameSnapshotScope(match.scope, scope)
    : (await computeLocalInputDigest(context))?.digest === match.localInputDigest;
  if (!unchangedLocal) return null;
  return saveAccountSyncState({ ...state, status: "synced", remoteAccountRevision: match.baseline.remoteAccountRevision, lastSuccessfulSyncAt: syncedAt, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null }, context);
}

function createAccountDataSnapshot(guestSnapshotVersion: number, guestUserId: string, records: readonly AccountDataRecord[], activeSession: boolean, pendingJournal: boolean): AccountDataSnapshot {
  return Object.freeze({ guestSnapshotVersion, guestUserId, records: Object.freeze(records), activeSession, pendingJournal });
}

async function readLocalAccountDataRecords(state: AccountSyncState, context: LearningDataAdmissionContext): Promise<readonly AccountDataRecord[]> {
  const records: AccountDataRecord[] = [];
  const activeTrack = await getActiveTrackId();
  if (activeTrack) records.push(makeRecord("active_track", "current", activeTrack, { trackId: activeTrack }, state));
  const sessions = (await getTrainingSessions(context.trackAdmission)).value;
  for (const session of sessions.filter((candidate) => candidate.status !== "active")) records.push(makeRecord("training_session_summary", session.id, session.trackId, projectTerminalSession(session), state));
  const results = await Promise.all(sessions.filter((session) => session.status !== "active").map((session) => getTrainingSessionResult(session.id, context.trackAdmission)));
  for (const result of results.filter((candidate): candidate is TrainingSessionResult => candidate !== null)) records.push(makeRecord("training_session_result", result.id, result.trackId, result, state));
  for (const attempt of (await getTrainingAttempts(context.trackAdmission)).value) records.push(makeRecord("training_attempt", attempt.id, attempt.trackId, attempt, state));
  for (const review of (await getReviewQueueItems(context.trackAdmission)).value) records.push(makeRecord("review_queue_entry", review.id, review.trackId, review, state));
  {
    for (const key of [...getKeyValueStorage().getAllKeys()].sort()) {
      if (key.startsWith(`${STORAGE_NAMESPACE}goal:`)) {
        const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}goal:`.length);
        if (!isTrackAdmitted(context.trackAdmission, candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
        const policy = resolveGoalPolicy(context.goalPolicyResolver, candidateTrackId);
        const envelope = readCanonicalEnvelope(key, (value): value is GoalRecord => isGoalRecordForPolicy(value, policy));
        if (!envelope) continue;
        records.push(makeRecord("goal", candidateTrackId, candidateTrackId, { schemaVersion: 1, revision: envelope.revision, record: normalizeGoalRecord(envelope.payload, policy) }, state));
      }
      if (key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`)) {
        const candidateTrackId = key.slice(`${STORAGE_NAMESPACE}learning-plan:`.length);
        if (!isTrackAdmitted(context.trackAdmission, candidateTrackId)) throw new AccountDataFailure("account_data_track_invalid");
        const envelope = readCanonicalEnvelope(key, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, candidateTrackId));
        if (!envelope) continue;
        records.push(makeRecord("learning_plan", candidateTrackId, candidateTrackId, { schemaVersion: 1, revision: envelope.revision, plan: normalizeLearningPlan(envelope.payload) }, state));
      }
    }
    assertGoalPlanRecordBundles(records, context.goalPolicyResolver);
  }
  // Linear in history size: one key set for local records and one for deleted
  // outbox entries instead of a scan of both lists per acknowledged record.
  const localKeys = new Set(records.map(accountDataRecordKey));
  const deletedOutboxKeys = new Set(state.outbox.filter(isDeletedAccountDataRecord).map(accountDataRecordKey));
  for (const tombstone of Object.values(state.acknowledged)) {
    const key = accountDataRecordKey(tombstone);
    if (!localKeys.has(key) && deletedOutboxKeys.has(key)) {
      records.push(makeRecord(tombstone.recordType, tombstone.recordId, tombstone.trackId, { deleted: true }, state));
      localKeys.add(key);
    }
  }
  return Object.freeze(sortByRecordKey(records));
}

/** Same order as comparing `accountDataRecordKey(...).localeCompare(...)`, with each key computed once. */
function sortByRecordKey<T extends AccountDataRecordIdentity>(records: T[]): T[] {
  const keyed = records.map((record) => [accountDataRecordKey(record), record] as const);
  keyed.sort(([left], [right]) => left.localeCompare(right));
  for (let index = 0; index < keyed.length; index += 1) records[index] = keyed[index]![1];
  return records;
}

function makeRecord(recordType: SyncableRecordType, recordId: string, trackId: string, state: Readonly<Record<string, unknown>>, syncState: AccountSyncState): AccountDataRecord {
  const acknowledged = syncState.acknowledged[accountDataRecordKey({ recordType, recordId, trackId })];
  return makeVersionedRecord(recordType, recordId, trackId, state, acknowledged?.remoteVersion ?? 0);
}

function makeVersionedRecord(recordType: SyncableRecordType, recordId: string, trackId: string, state: Readonly<Record<string, unknown>>, version: number): AccountDataRecord {
  const copied = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  const fingerprint = computeRecordFingerprint({ recordId, recordType, state: copied, trackId });
  // `copied` is private to this call, so freezing it in place makes the
  // verified hash permanently valid for this exact state object.
  deepFreezeJsonInPlace(copied);
  ownFrozenStates.add(copied);
  verifiedFrozenStates.set(copied, Object.freeze({ fingerprint, recordId, recordType, trackId }));
  return Object.freeze({ fingerprint, recordId, recordType, state: Object.freeze(copied), trackId, version });
}

/** Local commits only mark pending work; account synchronization builds the outbox. */
export async function markAccountDataPending(context: LearningDataAdmissionContext): Promise<void> {
  const installation = await getGuestInstallation();
  if (!installation?.accountId) return;
  const state = await getAccountSyncState(context);
  if (state.accountId !== installation.accountId || state.materialization) return;
  if (state.status === "synced") saveAccountSyncState({ ...state, status: "offlinePending" }, context);
}

export async function ensureAccountOutboxFromLocalDataset(context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  const installation = await getGuestInstallation();
  let state = await getAccountSyncState(context);
  // A local-history reset intentionally removes local records before pulling
  // the account copy back. Never turn that temporary absence into tombstones.
  if (state.resetGuard || state.materialization) return state;
  assertTrainingEvidenceIntegrityUnlessUnchanged(context);
  const boundAccountId = installation?.accountId;
  if (boundAccountId !== null && boundAccountId !== undefined && state.accountId === null) {
    const localRecords = await readLocalAccountDataRecords(state, context);
    if (localRecords.length > 0) throw new AccountDataFailure("account_binding_mismatch");
  }
  if (!boundAccountId || state.accountId !== boundAccountId) return state;
  const snapshot = await buildAccountDataSnapshot(context);
  if (state.lastFailureCode === "mutation_id_reuse" && state.outbox.length > 0) {
    const repairedOutbox = state.outbox.map((entry) => Object.freeze({
      ...entry,
      mutationId: accountMutationId(boundAccountId, entry, entry.expectedVersion),
      status: "pending" as const,
      lastErrorCode: null,
    }));
    state = saveAccountSyncState({ ...state, outbox: Object.freeze(repairedOutbox), pendingMutationCount: repairedOutbox.length }, context);
  }
  const latestState = await getAccountSyncState(context);
  if (latestState.resetGuard || latestState.materialization || latestState.accountId !== installation.accountId) return latestState;
  state = latestState;
  const outbox = [...state.outbox];
  let outboxSequence = state.outboxSequence;
  const byKey = new Map(outbox.map((entry) => [accountDataRecordKey(entry), entry]));
  // First index per key, matching the former `findIndex` lookup.
  const outboxIndexByKey = new Map<string, number>();
  outbox.forEach((entry, index) => { const key = accountDataRecordKey(entry); if (!outboxIndexByKey.has(key)) outboxIndexByKey.set(key, index); });
  for (const record of snapshot.records) {
    const key = accountDataRecordKey(record);
    const acknowledged = state.acknowledged[key];
    if (acknowledged?.fingerprint === record.fingerprint || byKey.get(key)?.fingerprint === record.fingerprint) continue;
    const expectedVersion = acknowledged?.remoteVersion ?? null;
    const existing = byKey.get(key);
    const entry: AccountOutboxEntry = Object.freeze({ ...record, mutationId: accountMutationId(boundAccountId, record, expectedVersion), expectedVersion, attemptCount: existing?.attemptCount ?? 0, lastErrorCode: null, status: "pending", sequence: existing?.sequence ?? ++outboxSequence });
    const existingIndex = outboxIndexByKey.get(key);
    if (existingIndex !== undefined) outbox[existingIndex] = entry;
    else { outboxIndexByKey.set(key, outbox.length); outbox.push(entry); }
    byKey.set(key, entry);
  }
  // Goal and plan records are an atomic server-side bundle. When a newly
  // created replacement plan changes, include its unchanged goal alongside
  // it so the sync plan remains a valid bundle and both versions advance
  // together under the existing account contract.
  for (const planEntry of [...outbox].filter((entry) => entry.recordType === "learning_plan")) {
    const goal = snapshot.records.find((record) => record.recordType === "goal" && record.trackId === planEntry.trackId);
    if (!goal) continue;
    const key = accountDataRecordKey(goal);
    if (byKey.has(key)) continue;
    const acknowledged = state.acknowledged[key];
    const expectedVersion = acknowledged?.remoteVersion ?? null;
    const entry: AccountOutboxEntry = Object.freeze({ ...goal, mutationId: accountMutationId(boundAccountId, goal, expectedVersion), expectedVersion, attemptCount: 0, lastErrorCode: null, status: "pending", sequence: ++outboxSequence });
    outbox.push(entry);
    byKey.set(key, entry);
  }
  const currentKeys = new Set(snapshot.records.map(accountDataRecordKey));
  for (const acknowledged of Object.values(state.acknowledged)) {
    const key = accountDataRecordKey(acknowledged);
    if (currentKeys.has(key) || byKey.has(key)) continue;
    const recovery = state.learningPlanRecovery;
    if (recovery?.accountId === boundAccountId
      && recovery.trackId === acknowledged.trackId
      && recovery.recordId === acknowledged.recordId
      && acknowledged.recordType === "learning_plan") continue;
    const acknowledgedTombstoneFingerprint = computeRecordFingerprint({
      recordId: acknowledged.recordId,
      recordType: acknowledged.recordType,
      state: { deleted: true },
      trackId: acknowledged.trackId,
    });
    if (acknowledged.fingerprint === acknowledgedTombstoneFingerprint) continue;
    const tombstone: Omit<AccountOutboxEntry, "mutationId"> = Object.freeze({
      fingerprint: acknowledgedTombstoneFingerprint,
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
      : createSyncPlan(boundAccountId, snapshot.guestSnapshotVersion, state.remoteAccountRevision, nextBase.highWatermark, outbox, context);
  const next = { ...nextBase, syncPlan };
  saveAccountSyncState(next, context);
  return next;
}

export function setAccountSyncState(input: Partial<AccountSyncState> & Pick<AccountSyncState, "accountId">, context: LearningDataAdmissionContext): AccountSyncState {
  const stored = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is Record<string, unknown> => isRecord(value));
  if (stored !== null && !isCanonicalAccountSyncState(stored, context)) throw new AccountDataFailure("account_sync_state_invalid");
  const current = (stored as AccountSyncState | null) ?? emptyState();
  return saveAccountSyncState({ ...current, ...input, pendingMutationCount: input.outbox?.length ?? current.outbox.length }, context);
}

/** Persists the reset guard before the journaled local deletion starts. */
export async function markAccountResetPending(accountId: string, operationId: string, createdAt: string, context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  if (!operationId.trim() || Number.isNaN(Date.parse(createdAt))) throw new AccountDataFailure("account_sync_state_invalid");
  const current = await getAccountSyncState(context);
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
  }, context);
}

/** Advances the durable reset cursor only after local deletion has completed. */
export async function markAccountResetRemoteRestorePending(accountId: string, operationId: string, context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  const current = await getAccountSyncState(context);
  const guard = current.resetGuard;
  if (!guard || guard.accountId !== accountId || guard.operationId !== operationId) throw new AccountDataFailure("account_sync_state_invalid");
  if (guard.phase === "remoteRestorePending") return current;
  return saveAccountSyncState({ ...current, status: "syncing", lastFailureCode: null, resetGuard: { ...guard, phase: "remoteRestorePending" } }, context);
}

export async function markAccountMaterializationPending(operationId: string, previewFingerprint: string, accountId: string, context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  const current = await getAccountSyncState(context);
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  return saveAccountSyncState({ ...current, accountId, materialization: { operationId, previewFingerprint }, pendingConfirmation: null, status: "syncing" }, context);
}

export async function buildGuestOwnedLocalDataBackup(): Promise<readonly GuestOwnedLocalDataBackupEntry[]> {
  pauseActiveForegroundClock();
  const storage = getKeyValueStorage();
  const entries: GuestOwnedLocalDataBackupEntry[] = [];
  for (const key of [...storage.getAllKeys()].filter(isGuestOwnedLearningKey).sort()) {
    const value = storage.getString(key);
    if (value !== undefined) entries.push(Object.freeze({ key, value }));
  }
  return Object.freeze(entries);
}

export async function restoreGuestOwnedLocalDataBackup(guestBackup: readonly GuestOwnedLocalDataBackupEntry[], admission: TrackAdmissionContext): Promise<void> {
  if (!Array.isArray(guestBackup) || !guestBackup.every(isGuestOwnedLocalDataBackupEntry)) throw new AccountDataFailure("account_data_records_invalid");
  // Validate the backup T before any effect and keep its original bytes.
  for (const entry of guestBackup) {
    if (entry.key !== STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) continue;
    let envelope: unknown;
    try { envelope = JSON.parse(entry.value); } catch { throw new AccountDataFailure("account_data_records_invalid"); }
    if (!isRecord(envelope) || Object.keys(envelope).sort().join(",") !== "payload,revision,schemaIdentity"
      || envelope.schemaIdentity !== CANONICAL_RECORD_SCHEMA || !Number.isSafeInteger(envelope.revision) || Number(envelope.revision) < 1
      || !isForegroundTimerState(envelope.payload, admission)) throw new AccountDataFailure("account_data_records_invalid");
  }
  pauseActiveForegroundClock();
  const storage = getKeyValueStorage();
  const currentKeys = [...storage.getAllKeys()].filter(isGuestOwnedLearningKey);
  const lockedKeys = [...new Set([...currentKeys, ...guestBackup.map((entry) => entry.key)])];
  withCanonicalWriteLocks(lockedKeys, () => {
    for (const entry of guestBackup) {
      if (entry.key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) applyActiveForegroundTimerRaw(storage.getString(entry.key), entry.value);
      else storage.setString(entry.key, entry.value);
    }
    const backupKeys = new Set(guestBackup.map((entry) => entry.key));
    for (const key of currentKeys) if (!backupKeys.has(key)) removeCanonicalValue(key);
    if (guestBackup.some((entry) => storage.getString(entry.key) !== entry.value)) throw new AccountDataFailure("account_materialization_verification_failed");
  });
}

export async function markGuestDiscardMaterializationPending(accountId: string, installationId: string, guestBackup: readonly GuestOwnedLocalDataBackupEntry[], context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  if (!installationId.trim()) throw new AccountDataFailure("guest_installation_required");
  const current = await getAccountSyncState(context);
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (current.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
  if (current.materialization && (!("kind" in current.materialization) || current.materialization.kind !== "discardGuest" || current.materialization.accountId !== accountId)) {
    throw new AccountDataFailure("account_materialization_in_progress");
  }
  if (!Array.isArray(guestBackup) || !guestBackup.every(isGuestOwnedLocalDataBackupEntry)) throw new AccountDataFailure("account_data_records_invalid");
  return saveAccountSyncState({ ...current, accountId, materialization: { kind: "discardGuest", accountId, installationId, phase: "prepared", guestBackup: Object.freeze([...guestBackup]) }, status: "syncing", pendingConfirmation: null }, context);
}

export async function markGuestDiscardMaterializationApplying(accountId: string, context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  const current = await getAccountSyncState(context);
  const materialization = current.materialization;
  if (!materialization || !("kind" in materialization) || materialization.kind !== "discardGuest" || materialization.accountId !== accountId || !materialization.installationId || !materialization.guestBackup) {
    throw new AccountDataFailure("account_materialization_target_required");
  }
  return saveAccountSyncState({ ...current, materialization: { ...materialization, phase: "applying" } }, context);
}

export function assertValidAccountDataRecords(records: unknown, context: LearningDataAdmissionContext): asserts records is readonly AccountDataRecord[] {
  withValidationPass(() => assertValidAccountDataRecordsUnchecked(records, context));
}

function assertValidAccountDataRecordsUnchecked(records: unknown, context: LearningDataAdmissionContext): asserts records is readonly AccountDataRecord[] {
  if (!Array.isArray(records)) throw new AccountDataFailure("account_data_records_invalid");
  for (const record of records) assertValidAccountDataRecordUnchecked(record, context);
  assertGoalPlanRecordBundles(records, context.goalPolicyResolver);
}

/** The per-record part of `assertValidAccountDataRecords` (bundle checks excluded). */
function assertValidAccountDataRecordUnchecked(record: unknown, context: LearningDataAdmissionContext): asserts record is AccountDataRecord {
  {
    if (!isAccountDataRecord(record) || !record.recordId.trim() || !isTrackAdmitted(context.trackAdmission, record.trackId)) throw new AccountDataFailure("account_data_record_invalid");
    assertCanonicalContentIdentityState(record.state);
    if (!isCanonicalAccountDataRecord(record, context.trackAdmission) && !isCanonicalOutboxEntry(record, context.trackAdmission)) throw new AccountDataFailure("account_data_record_invalid");
    if (!recordFingerprintMatches(record)) throw new AccountDataFailure("account_data_fingerprint_invalid");
    if (isDeletedAccountDataRecord(record)) return;
    const state = record.state;
    if (record.recordType !== "goal" && record.recordType !== "learning_plan" && state.trackId !== record.trackId) throw new AccountDataFailure("account_data_track_invalid");
    if (record.recordType === "active_track" && record.recordId !== "current") throw new AccountDataFailure("account_data_track_invalid");
    if (record.recordType === "training_session_summary" && (!materializeTerminalSession(state, context.trackAdmission) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_session_invalid");
    if (record.recordType === "training_session_result" && (!isTrainingSessionResult(state, context.trackAdmission) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_result_invalid");
    if (record.recordType === "training_attempt" && (!isTrainingAttempt(state, context.trackAdmission) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_attempt_invalid");
    if (record.recordType === "review_queue_entry" && (!isReviewQueueEntry(state, context.trackAdmission) || state.id !== record.recordId)) throw new AccountDataFailure("account_data_review_invalid");
    if (record.recordType === "goal") {
      const parsed = parseGoalCloudState(state, record.trackId, context.goalPolicyResolver);
      if (record.recordId !== record.trackId || !parsed) throw new AccountDataFailure("account_data_goal_invalid");
    }
    if (record.recordType === "learning_plan") {
      const parsed = parseLearningPlanCloudState(state, record.trackId);
      if (record.recordId !== record.trackId || !parsed) throw new AccountDataFailure("account_data_plan_invalid");
    }
  }
}

export type RemoteAccountDataRecord = Readonly<{
  fingerprint: string;
  recordId?: string;
  recordType: string;
  state: Readonly<Record<string, unknown>>;
  trackId: string;
  targetId?: string;
  version: number;
  updatedAt: string;
}>;

export type AccountDataRecoveryPartition = Readonly<{
  records: readonly AccountDataRecord[];
  incident: LearningPlanRecoveryIncident | null;
}>;

/**
 * Preserves all-or-nothing validation except for one invalid plan whose
 * account record identity is independently verifiable and whose goal/home
 * context is valid. This never treats a normal no-plan snapshot as recovery.
 */
export async function partitionRemoteAccountDataForRecovery(
  input: Readonly<{ accountId: string; generation: number; records: readonly RemoteAccountDataRecord[] }>,
  context: LearningDataAdmissionContext,
): Promise<AccountDataRecoveryPartition> {
  if (!input.accountId.trim() || !Number.isSafeInteger(input.generation) || input.generation < 0 || !Array.isArray(input.records)) {
    throw new AccountDataFailure("account_data_records_invalid");
  }
  if (input.records.some((record) => record.recordId !== undefined && record.targetId !== undefined && record.recordId !== record.targetId)) {
    throw new AccountDataFailure("account_data_record_invalid");
  }
  if (input.records.some((record) => typeof record.updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u.test(record.updatedAt) || !Number.isFinite(Date.parse(record.updatedAt)) || Date.parse(new Date(Date.parse(record.updatedAt)).toISOString()) !== Date.parse(record.updatedAt))) {
    throw new AccountDataFailure("account_data_record_invalid");
  }
  const activeTracks = input.records.filter((record) => record.recordType === "active_track" && record.state.deleted !== true);
  const currentActiveTrack = [...activeTracks].sort((a, b) => {
    const time = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
    if (time !== 0) return time;
    const identityA = canonicalJsonV1({ recordId: a.recordId ?? a.targetId ?? "", recordType: a.recordType, trackId: a.trackId });
    const identityB = canonicalJsonV1({ recordId: b.recordId ?? b.targetId ?? "", recordType: b.recordType, trackId: b.trackId });
    return identityA < identityB ? -1 : identityA > identityB ? 1 : 0;
  }).at(-1);
  const records = input.records.map((record) => ({
    fingerprint: record.fingerprint,
    recordId: record.recordId ?? record.targetId ?? "",
    recordType: record.recordType,
    state: record.state,
    trackId: record.trackId,
    version: record.version,
  }));
  // T2.6: one validation pass hashes each remote record once (it used to be
  // hashed by this shape check, by the full validation and again by finish).
  // A remote record whose fingerprint (checked here) equals the one of a local
  // record this process already validated in full has the same canonical
  // content, so the content checks below would give the same answer.
  const known = verifiedLocalRecordFingerprints(context);
  const isKnown = (record: AccountDataRecord): boolean => known.size > 0 && known.get(accountDataRecordKey(record)) === record.fingerprint;
  // One fingerprint pass for the whole partition, run in 50 ms slices.
  const slice = createCooperativeSlice();
  const pass = new WeakMap<object, string>();
  const isShapeValid = (record: AccountDataRecord): boolean => (isKnown(record)
    ? isAccountDataRecord(record) && hasOnlyKeys(record, ["fingerprint", "recordId", "recordType", "state", "trackId", "version"]) && record.recordId.trim().length > 0 && isTrackAdmitted(context.trackAdmission, record.trackId) && recordFingerprintMatches(record)
    : isCanonicalAccountDataRecord(record, context.trackAdmission));
  for (let index = 0; index < records.length; index += 1) {
    if (!withValidationPassMap(pass, () => isShapeValid(records[index] as AccountDataRecord))) throw new AccountDataFailure("account_data_record_invalid");
    await slice();
  }
  const invalidPlans = withValidationPassMap(pass, () => {
    const keys = records.map(accountDataRecordKey);
    if (new Set(keys).size !== keys.length) throw new AccountDataFailure("account_data_goal_plan_invalid");
    return records.filter((record) => record.recordType === "learning_plan"
      && !isDeletedAccountDataRecord(record)
      && parseLearningPlanCloudState(record.state, record.trackId) === null);
  });
  if (invalidPlans.length === 0) {
    for (const record of records) {
      if (isKnown(record)) { snapshotPerfCounters.knownRemoteRecords += 1; continue; }
      withValidationPassMap(pass, () => assertValidAccountDataRecordUnchecked(record, context));
      await slice();
    }
    withValidationPassMap(pass, () => assertGoalPlanRecordBundles(records, context.goalPolicyResolver));
  }
  if (invalidPlans.length === 0) {
    const orderedRecords = orderCurrentActiveTrackLast(records, currentActiveTrack);
    const validated = Object.freeze(orderedRecords.map(freezeVerifiedRemoteRecord));
    validatedRemoteRecordLists.set(validated, context);
    return Object.freeze({ records: validated, incident: null });
  }
  if (invalidPlans.length !== 1) throw new AccountDataFailure("account_data_goal_plan_invalid");

  const invalidPlan = invalidPlans[0]!;
  const goal = records.find((record) => record.recordType === "goal" && record.trackId === invalidPlan.trackId);
  const activeTrack = currentActiveTrack ? records.find((record) => record.recordType === "active_track" && record.trackId === currentActiveTrack.trackId && !isDeletedAccountDataRecord(record)) : undefined;
  if (invalidPlan.recordId !== invalidPlan.trackId
    || !goal || isDeletedAccountDataRecord(goal) || parseGoalCloudState(goal.state, invalidPlan.trackId, context.goalPolicyResolver) === null
    || !activeTrack || activeTrack.trackId !== invalidPlan.trackId || activeTrack.state.trackId !== invalidPlan.trackId
    || records.some((record) => record !== invalidPlan && record.recordType === "learning_plan" && record.trackId === invalidPlan.trackId)) {
    throw new AccountDataFailure("account_data_goal_plan_invalid");
  }

  const validRecords = records.filter((record) => record !== invalidPlan);
  assertValidAccountDataRecords(validRecords, context);
  const incidentId = sha256Utf8(canonicalSerialize({
    accountId: input.accountId,
    fingerprint: invalidPlan.fingerprint,
    generation: input.generation,
    recordId: invalidPlan.recordId,
    remoteVersion: invalidPlan.version,
    trackId: invalidPlan.trackId,
  }));
  const current = await getAccountSyncState(context);
  const existing = current.learningPlanRecovery;
  if (existing && (existing.accountId !== input.accountId || existing.incidentId !== incidentId)) {
    throw new AccountDataFailure("account_data_goal_plan_invalid");
  }
  return Object.freeze({
    records: Object.freeze(orderCurrentActiveTrackLast(validRecords, currentActiveTrack).map((record) => Object.freeze(record))),
    incident: Object.freeze({
      accountId: input.accountId,
      attemptCount: existing?.incidentId === incidentId ? existing.attemptCount : 0,
      dismissed: existing?.dismissed ?? false,
      fingerprint: invalidPlan.fingerprint,
      generation: input.generation,
      incidentId,
      recordId: invalidPlan.recordId,
      remoteVersion: invalidPlan.version,
      nextRetryAt: existing?.incidentId === incidentId ? existing.nextRetryAt : null,
      trackId: invalidPlan.trackId,
    }),
  });
}

/**
 * Freezes a validated remote record. Its state is deep-frozen in place and its verified fingerprint remembered, so finish and
 * apply do not hash it again.
 */
function freezeVerifiedRemoteRecord(record: AccountDataRecord): AccountDataRecord {
  if (!ownFrozenStates.has(record.state)) {
    deepFreezeJsonInPlace(record.state);
    ownFrozenStates.add(record.state);
    rememberVerifiedFingerprint(record);
  }
  return Object.freeze(record);
}

function orderCurrentActiveTrackLast<T extends Readonly<{ recordType: string; trackId: string }>>(records: readonly T[], current: RemoteAccountDataRecord | undefined): T[] {
  if (!current) return [...records];
  return [...records.filter((record) => record.recordType !== "active_track"), ...records.filter((record) => record.recordType === "active_track" && record.trackId !== current.trackId), ...records.filter((record) => record.recordType === "active_track" && record.trackId === current.trackId)];
}

export async function applyRemoteAccountData(records: readonly AccountDataRecord[], context: LearningDataAdmissionContext, options: Readonly<{ preserveLocalContext?: boolean }> = {}): Promise<void> {
  const yieldToEventLoop = createCooperativeSlice();
  assertTrainingEvidenceIntegrity(context.trackAdmission);
  assertValidAccountDataRecords(records, context);
  if (await getActiveTrainingSessionId()) throw new AccountDataFailure("active_session_adoption_blocked");
  const preserveLocalContext = options.preserveLocalContext === true;
  if (!preserveLocalContext) await clearActiveTrackId();
  await clearTrainingSessions(context.trackAdmission);
  await clearTrainingAttempts(context.trackAdmission);
  await clearReviewQueueItems(context.trackAdmission);
  // Families are written in bulk (one family read and one index write each),
  // so materialization stays linear in history size.
  const sessions: TrainingSession[] = [];
  const results: TrainingSessionResult[] = [];
  const attempts: TrainingAttempt<unknown>[] = [];
  for (const record of records.filter((candidate) => !isDeletedAccountDataRecord(candidate) && (!preserveLocalContext || ["training_session_summary", "training_session_result", "training_attempt", "review_queue_entry"].includes(candidate.recordType)))) {
    if (record.recordType === "active_track") {
      const trackId = record.state.trackId;
      if (typeof trackId !== "string" || !isTrackAdmitted(context.trackAdmission, trackId)) throw new AccountDataFailure("account_data_track_invalid");
      await saveActiveTrackId(trackId);
    }
    if (record.recordType === "training_session_summary") {
      const session = materializeTerminalSession(record.state, context.trackAdmission);
      if (!session) throw new AccountDataFailure("account_data_session_invalid");
      sessions.push(session);
    }
    if (record.recordType === "training_session_result") {
      if (!isTrainingSessionResult(record.state, context.trackAdmission)) throw new AccountDataFailure("account_data_result_invalid");
      results.push(record.state);
    }
    if (record.recordType === "training_attempt") {
      if (!isTrainingAttempt(record.state, context.trackAdmission)) throw new AccountDataFailure("account_data_attempt_invalid");
      attempts.push(record.state);
    }
  }
  // Yield between families so a large apply does not hold the JS thread in
  // one stretch; callers hold the local learning write lane throughout.
  await yieldToEventLoop();
  await saveTerminalTrainingSessionsBatch(sessions, context.trackAdmission);
  for (const result of results) await saveTrainingSessionResult(result, context.trackAdmission);
  await yieldToEventLoop();
  if (attempts.length > 0) await addTrainingAttemptsBatch(attempts, context.trackAdmission);
  await yieldToEventLoop();
  const reviews: ReviewQueueEntry[] = [];
  for (const record of records.filter((candidate) => candidate.recordType === "review_queue_entry" && !isDeletedAccountDataRecord(candidate))) {
    if (!isReviewQueueEntry(record.state, context.trackAdmission)) throw new AccountDataFailure("account_data_review_invalid");
    reviews.push(record.state);
  }
  if (reviews.length > 0) await addReviewQueueItems(reviews, context.trackAdmission);
  if (!preserveLocalContext) replaceGoalPlanRecords(records, context.goalPolicyResolver);
}

export type GoalCloudState = Readonly<{ schemaVersion: 1; revision: number; record: GoalRecord }>;
export type LearningPlanCloudState = Readonly<{ schemaVersion: 1; revision: number; plan: LearningPlan }>;

export function parseGoalCloudState(value: Readonly<Record<string, unknown>>, track: string, policyResolver: GoalPolicyResolver): GoalCloudState | null {
  const policy = resolveGoalPolicy(policyResolver, track);
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !isGoalRecordForPolicy(value.record, policy) || Object.keys(value).some((key) => !["schemaVersion", "revision", "record"].includes(key))) return null;
  return Object.freeze({ schemaVersion: 1, revision: Number(value.revision), record: normalizeGoalRecord(value.record, policy) });
}

export function parseLearningPlanCloudState(value: Readonly<Record<string, unknown>>, track: string): LearningPlanCloudState | null {
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !isLearningPlanV1ForTrack(value.plan, track) || Object.keys(value).some((key) => !["schemaVersion", "revision", "plan"].includes(key))) return null;
  return Object.freeze({ schemaVersion: 1, revision: Number(value.revision), plan: normalizeLearningPlan(value.plan) });
}

function assertGoalPlanRecordBundles(records: readonly Pick<AccountDataRecord, "recordType" | "recordId" | "trackId" | "state">[], policyResolver: GoalPolicyResolver): void {
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
    const goal = parseGoalCloudState(goalRecord.state, track, policyResolver);
    const plan = parseLearningPlanCloudState(planRecord.state, track);
    if (!goal || !plan || plan.plan.goalRevision > goal.revision) throw new AccountDataFailure("account_data_goal_plan_invalid");
    if (plan.plan.schemaVersion === 2 && (plan.plan.goalRevision !== goal.revision || canonicalSerialize(plan.plan.acceptedTarget) !== canonicalSerialize(acceptedTargetFromGoal(goal.record)))) throw new AccountDataFailure("account_data_goal_plan_invalid");
  }
}

function replaceGoalPlanRecords(records: readonly AccountDataRecord[], policyResolver: GoalPolicyResolver): void {
  const live = records.filter((record) => (record.recordType === "goal" || record.recordType === "learning_plan") && !isDeletedAccountDataRecord(record));
  const existingKeys = getKeyValueStorage().getAllKeys().filter((key) => key.startsWith(`${STORAGE_NAMESPACE}goal:`) || key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`));
  const keys = [...existingKeys, ...live.map((record) => record.recordType === "goal" ? STORAGE_KEYS.goal(record.trackId) : STORAGE_KEYS.learningPlan(record.trackId))];
  withCanonicalWriteLocks(keys, () => {
    for (const key of existingKeys) removeCanonicalValue(key);
    for (const record of live) {
      if (record.recordType === "goal") {
        const parsed = parseGoalCloudState(record.state, record.trackId, policyResolver);
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

export async function finishAccountMaterialization(
  records: readonly AccountDataRecord[],
  accountId: string,
  remoteAccountRevision: number,
  syncedAt: string,
  context: LearningDataAdmissionContext,
  incomingRecovery: LearningPlanRecoveryIncident | null = null,
): Promise<AccountSyncState> {
  assertTrainingEvidenceIntegrityUnlessUnchanged(context);
  if (validatedRemoteRecordLists.get(records) !== context) assertValidAccountDataRecords(records, context);
  const current = await getAccountSyncState(context);
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (incomingRecovery && incomingRecovery.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (incomingRecovery && current.learningPlanRecovery && current.learningPlanRecovery.incidentId !== incomingRecovery.incidentId) {
    throw new AccountDataFailure("account_data_goal_plan_invalid");
  }
  let learningPlanRecovery = incomingRecovery
    ? Object.freeze({ ...incomingRecovery, dismissed: current.learningPlanRecovery?.dismissed ?? incomingRecovery.dismissed })
    : current.learningPlanRecovery;
  if (learningPlanRecovery) {
    const replacement = records.find((record) => record.recordType === "learning_plan"
      && record.trackId === learningPlanRecovery!.trackId
      && record.recordId === learningPlanRecovery!.recordId
      && !isDeletedAccountDataRecord(record)
      && record.version > learningPlanRecovery!.remoteVersion);
    if (replacement) learningPlanRecovery = null;
  }
  // A paged/partial remote response must not erase ACKs for another track.
  // Full identity keys let later reconciliation retain each independent
  // `(recordType, recordId, trackId)` version without cross-track leakage.
  const acknowledgedRecords = Object.fromEntries(records.map((record) => [accountDataRecordKey(record), { fingerprint: record.fingerprint, recordId: record.recordId, recordType: record.recordType, remoteVersion: record.version, trackId: record.trackId }]));
  if (incomingRecovery) {
    const key = accountDataRecordKey({ recordId: incomingRecovery.recordId, recordType: "learning_plan", trackId: incomingRecovery.trackId });
    acknowledgedRecords[key] = {
      fingerprint: incomingRecovery.fingerprint,
      recordId: incomingRecovery.recordId,
      recordType: "learning_plan",
      remoteVersion: incomingRecovery.remoteVersion,
      trackId: incomingRecovery.trackId,
    };
  }
  const acknowledged = Object.freeze({
    ...current.acknowledged,
    ...acknowledgedRecords,
  });
  if (current.resetGuard && current.resetGuard.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  return saveAccountSyncState({ ...current, accountId, status: "synced", remoteAccountRevision, lastSuccessfulSyncAt: syncedAt, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged, outbox: Object.freeze([]), materialization: null, pendingConfirmation: null, syncPlan: null, resetGuard: null, learningPlanRecovery }, context);
}

/** Clears only local guest-owned learning and pending report data. The account sync marker is retained for recovery. */
export async function clearGuestOwnedLocalData(): Promise<void> {
  clearCanonicalLearningNamespace(false);
}

/**
 * Clears the account-owned learning namespace after the remote account has
 * been deleted. The deletion marker, installation identity, preferences,
 * and mutation journal are outside this allow-list and remain durable.
 */
export async function clearAccountDeletionOwnedLocalData(): Promise<void> {
  // Enumerate before removing so a failed individual delete leaves the
  // remaining namespace discoverable for the next retry.  Do not broaden this
  // to the whole canonical namespace: settings, installation, journal, and
  // lifecycle markers have different ownership and recovery semantics.
  clearCanonicalLearningNamespace(true);
}

/**
 * Durable marker written immediately before a sync replaces local learning
 * records with the account copy. It reuses the canonical materialization shape,
 * so an interrupted apply resumes through the existing "materialization
 * pending" path, which pulls the account copy again.
 */
const REMOTE_APPLY_OPERATION_PREFIX = "remote-apply:";
const REMOTE_APPLY_FINGERPRINT = "remote-apply-v1";

export function isRemoteApplyMaterialization(materialization: AccountMaterialization | null): boolean {
  return materialization !== null && !("kind" in materialization)
    && materialization.operationId.startsWith(REMOTE_APPLY_OPERATION_PREFIX) && materialization.previewFingerprint === REMOTE_APPLY_FINGERPRINT;
}

export async function markAccountRemoteApplyPending(accountId: string, context: LearningDataAdmissionContext): Promise<AccountSyncState> {
  const current = await getAccountSyncState(context);
  if (current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (current.materialization && !isRemoteApplyMaterialization(current.materialization)) throw new AccountDataFailure("account_materialization_in_progress");
  if (current.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
  return saveAccountSyncState({ ...current, status: "syncing", materialization: { operationId: `${REMOTE_APPLY_OPERATION_PREFIX}${accountId}`, previewFingerprint: REMOTE_APPLY_FINGERPRINT } }, context);
}

const CONTENT_IDENTITY_FIXED_KEYS: readonly string[] = [STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX, STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX];
const CONTENT_IDENTITY_PREFIXES: readonly string[] = [`${STORAGE_NAMESPACE}archival-history:`, `${STORAGE_NAMESPACE}unavailable-active:`, `${STORAGE_NAMESPACE}unavailable-review:`];

/**
 * True when `applyRemoteAccountData(records)` would only rewrite the local
 * learning records that are already present with the same identity and
 * fingerprint, and would clear nothing else. A sync can then acknowledge the
 * account copy without replacing local storage on every start.
 */
export function isRemoteAccountDataMaterialized(records: readonly AccountDataRecord[], snapshot: AccountDataSnapshot): boolean {
  if (snapshot.activeSession || snapshot.pendingJournal) return false;
  const local = new Map<string, string>();
  for (const record of snapshot.records) {
    if (!isDeletedAccountDataRecord(record)) local.set(accountDataRecordKey(record), record.fingerprint);
  }
  let remoteLive = 0;
  for (const record of records) {
    if (isDeletedAccountDataRecord(record)) continue;
    remoteLive += 1;
    if (local.get(accountDataRecordKey(record)) !== record.fingerprint) return false;
  }
  if (remoteLive !== local.size) return false;
  // The apply path also drops content-identity bookkeeping; keep that behavior.
  return !getKeyValueStorage().getAllKeys().some((key) => CONTENT_IDENTITY_FIXED_KEYS.includes(key) || CONTENT_IDENTITY_PREFIXES.some((prefix) => key.startsWith(prefix)));
}

/** Learning evidence that the account copy fully restores (what `applyRemoteAccountData` clears and rewrites). */
const ACCOUNT_RESTORABLE_FIXED_KEYS: readonly string[] = [
  STORAGE_KEYS.TRAINING_SESSION_INDEX, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, STORAGE_KEYS.REVIEW_INDEX, ...CONTENT_IDENTITY_FIXED_KEYS,
];
const ACCOUNT_RESTORABLE_PREFIXES: readonly string[] = [
  `${STORAGE_NAMESPACE}training-session:`, `${STORAGE_NAMESPACE}training-session-result:`, `${STORAGE_NAMESPACE}training-attempt:`,
  `${STORAGE_NAMESPACE}review-entry:`, ...CONTENT_IDENTITY_PREFIXES,
];

export type InterruptedMaterializationRecovery = "recovered" | "not_applicable";

/**
 * Exit from evidence left inconsistent by an interrupted account apply.
 * Applies only to an account-bound store whose account copy is complete:
 * either the durable remote-apply marker is present, or (stores written
 * before the marker existed) the sync was mid-flight and every local change
 * had been acknowledged by the server. It removes the account-restorable evidence families and leaves the
 * remote-apply marker, so account loading pulls the account copy again.
 * Active sessions, drafts, journals, settings, goals/plans and content reports
 * are never touched; any other state is left for the caller to report.
 */
export async function recoverInterruptedAccountMaterialization(context: LearningDataAdmissionContext): Promise<InterruptedMaterializationRecovery> {
  const storage = getKeyValueStorage();
  if (storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL) !== undefined
    || storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION) !== undefined
    || storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT) !== undefined) return "not_applicable";
  let state: AccountSyncState;
  let installation: Awaited<ReturnType<typeof getGuestInstallation>>;
  try {
    state = await getAccountSyncState(context);
    installation = await getGuestInstallation();
  } catch { return "not_applicable"; }
  if (!installation || installation.bindingState !== "account_bound" || installation.accountId === null || state.accountId !== installation.accountId) return "not_applicable";
  if (state.pendingConfirmation !== null || state.resetGuard || state.syncConflict) return "not_applicable";
  const markerPresent = isRemoteApplyMaterialization(state.materialization);
  // Everything local is already on the account: no outbox, or every outbox
  // entry was acknowledged by the server in the current sync plan.
  const ackedMutationIds = new Set((state.syncPlan?.items ?? []).filter((item) => item.status === "acked").map((item) => item.mutationId));
  const fullyUploaded = state.syncPlan === null
    ? state.outbox.length === 0
    : state.syncPlan.items.every((item) => item.status === "acked") && state.outbox.every((entry) => ackedMutationIds.has(entry.mutationId));
  const legacyInterruptedSync = state.materialization === null && state.status === "syncing" && fullyUploaded;
  if (!markerPresent && !legacyInterruptedSync) return "not_applicable";
  const accountId = state.accountId;
  if (!markerPresent) await markAccountRemoteApplyPending(accountId, context);
  for (const key of storage.getAllKeys()) {
    if (ACCOUNT_RESTORABLE_FIXED_KEYS.includes(key) || ACCOUNT_RESTORABLE_PREFIXES.some((prefix) => key.startsWith(prefix))) removeCanonicalValue(key);
  }
  return "recovered";
}
