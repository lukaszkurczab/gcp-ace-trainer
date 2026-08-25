import { isRegisteredTrackId, type TrainingAttempt, type TrainingSession, type TrainingSessionResult, type ReviewQueueEntry } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { getGuestInstallation } from "./guestInstallationRepository";
import { getActiveMutationJournal } from "./mutationJournalRepository";
import { getActiveTrackId } from "./activeTrackRepository";
import { clearActiveTrackId, saveActiveTrackId } from "./activeTrackRepository";
import { addReviewQueueItems, clearReviewQueueItems, getReviewQueueItems } from "./reviewQueueRepository";
import { clearTrainingAttempts, getTrainingAttempts, addTrainingAttempt } from "./trainingAttemptRepository";
import { getTrainingSessionResult, saveTrainingSessionResult } from "./trainingSessionResultRepository";
import { clearTrainingSessions, getTrainingSessions, saveTrainingSession } from "./trainingSessionRepository";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionResult } from "./trainingModelGuards";

export const ACCOUNT_DATA_PROTOCOL_VERSION = 1 as const;
export const SYNCABLE_RECORD_TYPES = ["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry"] as const;
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
  guestSnapshotVersion: number;
  guestUserId: string;
  records: readonly AccountDataRecord[];
  activeSession: boolean;
  pendingJournal: boolean;
}>;

export type AccountSyncState = Readonly<{
  protocolVersion: typeof ACCOUNT_DATA_PROTOCOL_VERSION;
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
  materialization: Readonly<{ operationId: string; previewFingerprint: string }> | null;
  pendingConfirmation: Readonly<{ operationId: string; previewFingerprint: string; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] }> | null;
}>;

export type AccountAcknowledgedRecord = Readonly<{ fingerprint: string; recordId: string; recordType: SyncableRecordType; remoteVersion: number; trackId: string }>;
export type AccountOutboxEntry = Readonly<AccountDataRecord & { mutationId: string; expectedVersion: number | null; attemptCount: number; lastErrorCode: string | null; status: "pending" | "retrying" | "failed" }>;

const emptyState = (): AccountSyncState => Object.freeze({ protocolVersion: ACCOUNT_DATA_PROTOCOL_VERSION, accountId: null, status: "initialSyncRequired", localDatasetVersion: 0, localDatasetFingerprint: null, remoteAccountRevision: 0, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged: Object.freeze({}), outbox: Object.freeze([]), materialization: null, pendingConfirmation: null });

function isSyncableRecordType(value: unknown): value is SyncableRecordType { return typeof value === "string" && (SYNCABLE_RECORD_TYPES as readonly string[]).includes(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isAccountSyncState(value: unknown): value is AccountSyncState {
  if (!isRecord(value) || value.protocolVersion !== ACCOUNT_DATA_PROTOCOL_VERSION || (value.accountId !== null && typeof value.accountId !== "string") || !["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed"].includes(value.status as string) || !Number.isSafeInteger(value.localDatasetVersion) || !Number.isSafeInteger(value.remoteAccountRevision) || !Array.isArray(value.outbox) || !isRecord(value.acknowledged)) return false;
  return value.outbox.every(isOutboxEntry) && Object.values(value.acknowledged).every(isAcknowledgedRecord) && (value.materialization === null || (isRecord(value.materialization) && typeof value.materialization.operationId === "string" && typeof value.materialization.previewFingerprint === "string")) && (value.pendingConfirmation === null || (isRecord(value.pendingConfirmation) && typeof value.pendingConfirmation.operationId === "string" && typeof value.pendingConfirmation.previewFingerprint === "string" && Array.isArray(value.pendingConfirmation.resolutions) && value.pendingConfirmation.resolutions.every((resolution) => isRecord(resolution) && typeof resolution.conflictId === "string" && (resolution.resolution === "keep_guest" || resolution.resolution === "keep_account"))));
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

export async function getAccountSyncState(): Promise<AccountSyncState> {
  return readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, isAccountSyncState) ?? emptyState();
}

export function saveAccountSyncState(state: AccountSyncState): AccountSyncState {
  if (!isAccountSyncState(state)) throw new Error("account_sync_state_invalid");
  const saved = writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, state);
  return saved.payload;
}

export async function buildAccountDataSnapshot(): Promise<AccountDataSnapshot> {
  const installation = await getGuestInstallation();
  if (!installation) throw new Error("guest_installation_required");
  const state = await getAccountSyncState();
  const records = await readLocalAccountDataRecords(state);
  const datasetFingerprint = sha256Utf8(canonicalSerialize(records));
  const nextVersion = state.localDatasetFingerprint === datasetFingerprint ? state.localDatasetVersion : state.localDatasetVersion + 1;
  if (nextVersion !== state.localDatasetVersion || state.localDatasetFingerprint !== datasetFingerprint) saveAccountSyncState({ ...state, localDatasetVersion: nextVersion, localDatasetFingerprint: datasetFingerprint });
  const activeSession = (await getTrainingSessions()).value.some((session) => session.status === "active");
  return Object.freeze({ guestSnapshotVersion: nextVersion, guestUserId: installation.installationId, records, activeSession, pendingJournal: (await getActiveMutationJournal()) !== null });
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

export async function ensureAccountOutboxFromLocalDataset(): Promise<AccountSyncState> {
  const installation = await getGuestInstallation();
  const state = await getAccountSyncState();
  if (!installation?.accountId || state.accountId !== installation.accountId) return state;
  const snapshot = await buildAccountDataSnapshot();
  const outbox = [...state.outbox];
  const byKey = new Map(outbox.map((entry) => [accountDataRecordKey(entry), entry]));
  for (const record of snapshot.records) {
    const key = accountDataRecordKey(record);
    const acknowledged = state.acknowledged[key];
    if (acknowledged?.fingerprint === record.fingerprint || byKey.get(key)?.fingerprint === record.fingerprint) continue;
    const entry: AccountOutboxEntry = Object.freeze({ ...record, mutationId: `mutation_${sha256Utf8(`${installation.accountId}:${key}:${record.fingerprint}`)}`, expectedVersion: acknowledged?.remoteVersion ?? null, attemptCount: byKey.get(key)?.attemptCount ?? 0, lastErrorCode: null, status: "pending" });
    const existingIndex = outbox.findIndex((candidate) => accountDataRecordKey(candidate) === key);
    if (existingIndex >= 0) outbox[existingIndex] = entry;
    else outbox.push(entry);
    byKey.set(key, entry);
  }
  const currentKeys = new Set(snapshot.records.map(accountDataRecordKey));
  for (const acknowledged of Object.values(state.acknowledged)) {
    const key = accountDataRecordKey(acknowledged);
    if (currentKeys.has(key) || byKey.has(key)) continue;
    const tombstone: AccountOutboxEntry = Object.freeze({
      fingerprint: accountDataRecordFingerprint({ recordId: acknowledged.recordId, recordType: acknowledged.recordType, state: { deleted: true }, trackId: acknowledged.trackId }),
      recordId: acknowledged.recordId,
      recordType: acknowledged.recordType,
      state: Object.freeze({ deleted: true }),
      trackId: acknowledged.trackId,
      version: acknowledged.remoteVersion,
      mutationId: `mutation_${sha256Utf8(`${installation.accountId}:${key}:deleted`)}`,
      expectedVersion: acknowledged.remoteVersion,
      attemptCount: 0,
      lastErrorCode: null,
      status: "pending",
    });
    outbox.push(tombstone);
    byKey.set(key, tombstone);
  }
  const next = { ...state, status: outbox.length > 0 ? "offlinePending" as const : state.status, pendingMutationCount: outbox.length, outbox: Object.freeze(outbox) };
  saveAccountSyncState(next);
  return next;
}

export function setAccountSyncState(input: Partial<AccountSyncState> & Pick<AccountSyncState, "accountId">): AccountSyncState {
  const current = readCanonicalJson(STORAGE_KEYS.ACCOUNT_SYNC, isAccountSyncState) ?? emptyState();
  return saveAccountSyncState({ ...current, ...input, pendingMutationCount: input.outbox?.length ?? current.outbox.length });
}

export async function markAccountMaterializationPending(operationId: string, previewFingerprint: string): Promise<AccountSyncState> {
  const current = await getAccountSyncState();
  return saveAccountSyncState({ ...current, materialization: { operationId, previewFingerprint }, status: "syncing" });
}

export async function applyRemoteAccountData(records: readonly AccountDataRecord[]): Promise<void> {
  if ((await getTrainingSessions()).value.some((session) => session.status === "active")) throw new Error("active_session_adoption_blocked");
  await clearActiveTrackId();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
  for (const record of records.filter((candidate) => !isDeletedAccountDataRecord(candidate))) {
    if (record.recordType === "active_track") {
      const trackId = record.state.trackId;
      if (typeof trackId !== "string" || !isRegisteredTrackId(trackId)) throw new Error("account_data_track_invalid");
      await saveActiveTrackId(trackId);
    }
    if (record.recordType === "training_session_summary") {
      if (!isTrainingSession(record.state)) throw new Error("account_data_session_invalid");
      await saveTrainingSession(record.state);
    }
    if (record.recordType === "training_session_result") {
      if (!isTrainingSessionResult(record.state)) throw new Error("account_data_result_invalid");
      await saveTrainingSessionResult(record.state);
    }
    if (record.recordType === "training_attempt") {
      if (!isTrainingAttempt(record.state)) throw new Error("account_data_attempt_invalid");
      await addTrainingAttempt(record.state);
    }
  }
  const reviews: ReviewQueueEntry[] = [];
  for (const record of records.filter((candidate) => candidate.recordType === "review_queue_entry" && !isDeletedAccountDataRecord(candidate))) {
    if (!isReviewQueueEntry(record.state)) throw new Error("account_data_review_invalid");
    reviews.push(record.state);
  }
  if (reviews.length > 0) await addReviewQueueItems(reviews);
}

export async function finishAccountMaterialization(records: readonly AccountDataRecord[], accountId: string, remoteAccountRevision: number, syncedAt: string): Promise<AccountSyncState> {
  const acknowledged = Object.fromEntries(records.map((record) => [accountDataRecordKey(record), { fingerprint: record.fingerprint, recordId: record.recordId, recordType: record.recordType, remoteVersion: record.version, trackId: record.trackId }]));
  const current = await getAccountSyncState();
  return saveAccountSyncState({ ...current, accountId, status: "synced", remoteAccountRevision, lastSuccessfulSyncAt: syncedAt, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, acknowledged, outbox: Object.freeze([]), materialization: null, pendingConfirmation: null });
}

export async function clearAccountOwnedLocalData(): Promise<void> {
  await clearActiveTrackId();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
  removeCanonicalValue(STORAGE_KEYS.ACCOUNT_SYNC);
}
