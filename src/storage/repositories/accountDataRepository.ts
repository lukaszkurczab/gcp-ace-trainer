import { isLearningPlanV1ForTrack, isRegisteredTrackId, normalizeLearningPlan, type GoalRecord, type LearningPlan, type TrainingAttempt, type TrainingSession, type TrainingSessionResult, type ReviewQueueEntry } from "../../domain";
import { isGoalRecordShapeForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
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

export const ACCOUNT_DATA_PROTOCOL_VERSION = 2 as const;
export const LEGACY_SYNCABLE_RECORD_TYPES = ["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry"] as const;
export const SYNCABLE_RECORD_TYPES = [...LEGACY_SYNCABLE_RECORD_TYPES, "goal", "learning_plan"] as const;
export type SyncableRecordType = (typeof SYNCABLE_RECORD_TYPES)[number];

export type AccountDataRecord = Readonly<{
  fingerprint: string;
  recordId: string;
  recordType: SyncableRecordType;
  state: Readonly<Record<string, unknown>>;
  trackId: string;
  version: number;
}>;

export type AccountDataSnapshot = Readonly<{
  protocolVersion: 1 | 2;
  guestSnapshotVersion: number;
  guestUserId: string;
  records: readonly AccountDataRecord[];
  activeSession: boolean;
  pendingJournal: boolean;
}>;

export type AccountSyncState = Readonly<{
  protocolVersion: 1 | 2;
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
  pendingConfirmation: Readonly<{ operationId: string; previewFingerprint: string; protocolVersion: 1 | 2; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }> | null;
}>;

export type AccountMaterialization = Readonly<
  | { operationId: string; previewFingerprint: string }
  | { kind: "discardGuest"; accountId: string; installationId?: string; phase?: "prepared" | "applying"; guestBackup?: readonly GuestOwnedLocalDataBackupEntry[] }
>;

export type GuestOwnedLocalDataBackupEntry = Readonly<{ key: string; value: string }>;

export type AccountAcknowledgedRecord = Readonly<{ fingerprint: string; recordId: string; recordType: SyncableRecordType; remoteVersion: number; trackId: string }>;
export type AccountOutboxEntry = Readonly<AccountDataRecord & { mutationId: string; expectedVersion: number | null; attemptCount: number; lastErrorCode: string | null; status: "pending" | "retrying" | "failed" }>;

const emptyState = (): AccountSyncState => Object.freeze({ protocolVersion: ACCOUNT_DATA_PROTOCOL_VERSION, accountId: null, status: "initialSyncRequired", localDatasetVersion: 0, localDatasetFingerprint: null, remoteAccountRevision: 0, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged: Object.freeze({}), outbox: Object.freeze([]), materialization: null, pendingConfirmation: null });

const LEARNING_FIXED_KEYS = [
  STORAGE_KEYS.ACTIVE_TRACK,
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
  STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
  STORAGE_KEYS.TRAINING_SESSION_INDEX,
  STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
  STORAGE_KEYS.REVIEW_INDEX,
  STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
] as const;

const LEARNING_RECORD_PREFIXES = [
  `${STORAGE_NAMESPACE}training-session:`,
  `${STORAGE_NAMESPACE}training-session-result:`,
  `${STORAGE_NAMESPACE}training-attempt:`,
  `${STORAGE_NAMESPACE}review-entry:`,
  `${STORAGE_NAMESPACE}goal:`,
  `${STORAGE_NAMESPACE}learning-plan:`,
] as const;

function clearCanonicalLearningNamespace(includeAccountSync: boolean): void {
  const fixedKeys: ReadonlySet<string> = new Set(includeAccountSync ? [...LEARNING_FIXED_KEYS, STORAGE_KEYS.ACCOUNT_SYNC] : LEARNING_FIXED_KEYS);
  for (const key of getKeyValueStorage().getAllKeys()) {
    if (fixedKeys.has(key) || LEARNING_RECORD_PREFIXES.some((prefix) => key.startsWith(prefix))) removeCanonicalValue(key);
  }
}

function isGuestOwnedLearningKey(key: string): boolean {
  return (LEARNING_FIXED_KEYS as readonly string[]).includes(key) || LEARNING_RECORD_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isGuestOwnedLocalDataBackupEntry(value: unknown): value is GuestOwnedLocalDataBackupEntry {
  return isRecord(value) && typeof value.key === "string" && isGuestOwnedLearningKey(value.key) && typeof value.value === "string";
}

function isSyncableRecordType(value: unknown): value is SyncableRecordType { return typeof value === "string" && (SYNCABLE_RECORD_TYPES as readonly string[]).includes(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isAccountSyncState(value: unknown): value is AccountSyncState {
  if (!isRecord(value) || (value.protocolVersion !== 1 && value.protocolVersion !== 2) || (value.accountId !== null && typeof value.accountId !== "string") || !["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed"].includes(value.status as string) || !Number.isSafeInteger(value.localDatasetVersion) || !Number.isSafeInteger(value.remoteAccountRevision) || !Array.isArray(value.outbox) || !isRecord(value.acknowledged)) return false;
  const pending = value.pendingConfirmation;
  const pendingValid = pending === null || (isRecord(pending) && typeof pending.operationId === "string" && typeof pending.previewFingerprint === "string" && (pending.protocolVersion === undefined || pending.protocolVersion === 1 || pending.protocolVersion === 2) && Array.isArray(pending.resolutions) && pending.resolutions.every(isResolution) && (pending.groupChoices === undefined || (Array.isArray(pending.groupChoices) && pending.groupChoices.every(isGroupChoice))));
  return value.outbox.every(isOutboxEntry) && Object.values(value.acknowledged).every(isAcknowledgedRecord) && (value.materialization === null || isAccountMaterialization(value.materialization)) && pendingValid;
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
function isAcknowledgedRecord(value: unknown): value is AccountAcknowledgedRecord { return isRecord(value) && typeof value.fingerprint === "string" && typeof value.recordId === "string" && isSyncableRecordType(value.recordType) && Number.isSafeInteger(value.remoteVersion) && typeof value.trackId === "string"; }
function isOutboxEntry(value: unknown): value is AccountOutboxEntry {
  if (!isRecord(value) || !isAccountDataRecord(value)) return false;
  const candidate = value as AccountOutboxEntry;
  return typeof candidate.mutationId === "string" && (candidate.expectedVersion === null || (typeof candidate.expectedVersion === "number" && Number.isSafeInteger(candidate.expectedVersion))) && typeof candidate.attemptCount === "number" && Number.isSafeInteger(candidate.attemptCount) && ["pending", "retrying", "failed"].includes(candidate.status);
}
function isAccountDataRecord(value: unknown): value is AccountDataRecord {
  if (!isRecord(value) || typeof value.fingerprint !== "string" || !/^[a-f0-9]{64}$/u.test(value.fingerprint) || typeof value.recordId !== "string" || !isSyncableRecordType(value.recordType) || !isRecord(value.state) || typeof value.trackId !== "string" || typeof value.version !== "number") return false;
  return Number.isSafeInteger(value.version) && value.version >= 0;
}

export function accountDataRecordKey(record: Pick<AccountDataRecord, "recordType" | "recordId">): string { return `${record.recordType}:${record.recordId}`; }
export function accountDataRecordFingerprint(record: Readonly<{ recordId: string; recordType: SyncableRecordType; state: Readonly<Record<string, unknown>>; trackId: string }>): string { return sha256Utf8(canonicalSerialize({ recordId: record.recordId, recordType: record.recordType, state: record.state, trackId: record.trackId })); }
export function isDeletedAccountDataRecord(record: Pick<AccountDataRecord, "state">): boolean { return record.state.deleted === true; }

function accountMutationId(accountId: string, record: Pick<AccountDataRecord, "recordType" | "recordId" | "fingerprint">, expectedVersion: number | null): string {
  return `mutation_${sha256Utf8(canonicalSerialize({ accountId, key: accountDataRecordKey(record), expectedVersion, fingerprint: record.fingerprint }))}`;
}

export async function getAccountSyncState(): Promise<AccountSyncState> {
  const stored = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, isAccountSyncState);
  if (!stored) return emptyState();
  const normalized = normalizeSyncState(stored);
  if (normalized.protocolVersion === 1 && normalized.pendingConfirmation === null && normalized.materialization === null) return saveAccountSyncState({ ...normalized, protocolVersion: 2 });
  return normalized;
}

function normalizeSyncState(state: AccountSyncState): AccountSyncState {
  const pending = state.pendingConfirmation;
  if (!pending) return state;
  return Object.freeze({ ...state, pendingConfirmation: Object.freeze({ ...pending, protocolVersion: pending.protocolVersion ?? 1, groupChoices: Object.freeze(pending.groupChoices ?? []) }) });
}

export function saveAccountSyncState(state: AccountSyncState): AccountSyncState {
  if (!isAccountSyncState(state)) throw new AccountDataFailure("account_sync_state_invalid");
  const saved = writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, state);
  return saved.payload;
}

export async function buildAccountDataSnapshot(): Promise<AccountDataSnapshot> {
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  const state = await getAccountSyncState();
  const records = await readLocalAccountDataRecords(state);
  const datasetFingerprint = sha256Utf8(canonicalSerialize(records));
  const nextVersion = state.localDatasetFingerprint === datasetFingerprint ? state.localDatasetVersion : state.localDatasetVersion + 1;
  if (nextVersion !== state.localDatasetVersion || state.localDatasetFingerprint !== datasetFingerprint) saveAccountSyncState({ ...state, localDatasetVersion: nextVersion, localDatasetFingerprint: datasetFingerprint });
  const activeSession = (await getTrainingSessions()).value.some((session) => session.status === "active");
  return Object.freeze({ protocolVersion: state.protocolVersion, guestSnapshotVersion: nextVersion, guestUserId: installation.installationId, records, activeSession, pendingJournal: (await getActiveMutationJournal()) !== null });
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
  if (state.protocolVersion === 2) {
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
  const key = `${recordType}:${recordId}`;
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
  if (state.materialization) return state;
  const boundAccountId = installation?.accountId;
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
  if (latestState.materialization || latestState.accountId !== installation.accountId) return latestState;
  state = latestState;
  const outbox = [...state.outbox];
  const byKey = new Map(outbox.map((entry) => [accountDataRecordKey(entry), entry]));
  for (const record of snapshot.records) {
    const key = accountDataRecordKey(record);
    const acknowledged = state.acknowledged[key];
    if (acknowledged?.fingerprint === record.fingerprint || byKey.get(key)?.fingerprint === record.fingerprint) continue;
    const expectedVersion = acknowledged?.remoteVersion ?? null;
    const entry: AccountOutboxEntry = Object.freeze({ ...record, mutationId: accountMutationId(boundAccountId, record, expectedVersion), expectedVersion, attemptCount: byKey.get(key)?.attemptCount ?? 0, lastErrorCode: null, status: "pending" });
    const existingIndex = outbox.findIndex((candidate) => accountDataRecordKey(candidate) === key);
    if (existingIndex >= 0) outbox[existingIndex] = entry;
    else outbox.push(entry);
    byKey.set(key, entry);
  }
  const currentKeys = new Set(snapshot.records.map(accountDataRecordKey));
  for (const acknowledged of Object.values(state.acknowledged)) {
    const key = accountDataRecordKey(acknowledged);
    if (currentKeys.has(key) || byKey.has(key)) continue;
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
    });
    const tombstoneWithMutationId: AccountOutboxEntry = Object.freeze({ ...tombstone, mutationId: accountMutationId(boundAccountId, tombstone, tombstone.expectedVersion) });
    outbox.push(tombstoneWithMutationId);
    byKey.set(key, tombstoneWithMutationId);
  }
  const next = { ...state, status: outbox.length > 0 ? "offlinePending" as const : state.status, pendingMutationCount: outbox.length, outbox: Object.freeze(outbox) };
  saveAccountSyncState(next);
  return next;
}

export function setAccountSyncState(input: Partial<AccountSyncState> & Pick<AccountSyncState, "accountId">): AccountSyncState {
  const current = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, isAccountSyncState) ?? emptyState();
  return saveAccountSyncState({ ...current, ...input, pendingMutationCount: input.outbox?.length ?? current.outbox.length });
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

export async function applyRemoteAccountData(records: readonly AccountDataRecord[]): Promise<void> {
  assertValidAccountDataRecords(records);
  if (await getActiveTrainingSessionId()) throw new AccountDataFailure("active_session_adoption_blocked");
  await clearActiveTrackId();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
  for (const record of records.filter((candidate) => !isDeletedAccountDataRecord(candidate))) {
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
  replaceGoalPlanRecords(records);
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
  const acknowledged = Object.fromEntries(records.map((record) => [accountDataRecordKey(record), { fingerprint: record.fingerprint, recordId: record.recordId, recordType: record.recordType, remoteVersion: record.version, trackId: record.trackId }]));
  const current = await getAccountSyncState();
  return saveAccountSyncState({ ...current, accountId, status: "synced", remoteAccountRevision, lastSuccessfulSyncAt: syncedAt, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged, outbox: Object.freeze([]), materialization: null, pendingConfirmation: null });
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
