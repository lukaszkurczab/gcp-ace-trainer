import {
  PatternlyApiClientError,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type {
  AdoptionConfirmationDto,
  AdoptionPreviewResponseDto,
  PatternlyApiClient,
  SyncResponseDto,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";
import {
  accountDataRecordKey,
  applyRemoteAccountData,
  assertValidAccountDataRecords,
  buildAccountDataSnapshot,
  clearAccountOwnedLocalData,
  clearGuestOwnedLocalData,
  ensureAccountOutboxFromLocalDataset,
  finishAccountMaterialization,
  getAccountSyncState,
  markAccountMaterializationPending,
  markGuestDiscardMaterializationPending,
  saveAccountSyncState,
  type AccountDataRecord,
  type AccountDataSnapshot,
  type AccountSyncState,
} from "../../storage/repositories/accountDataRepository";
import {
  beginAccountDeletion,
  beginAccountSignOut,
  clearAccountDeletionState,
  clearAccountSignOutState,
  getAccountDeletionState,
  getAccountSignOutState,
  markAccountDeletionComplete,
  updateAccountDeletionState,
  updateAccountSignOutState,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, clearGuestAccountBinding, getGuestInstallation, markGuestInstallationAdoptionPending } from "../../storage/repositories/guestInstallationRepository";
import { getActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { AccountDataFailure } from "../../storage/errors";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

export { accountDataRecordFingerprint } from "../../storage/repositories/accountDataRepository";

export type AccountDataSession = Readonly<{
  status: "initialSyncRequired" | "previewReady" | "syncing" | "synced" | "resumeRequired" | "offlinePending" | "conflict" | "failed" | "signOutPending" | "remoteDeletionPending" | "localCleanupPending";
  preview: AdoptionPreviewResponseDto | null;
  lastSuccessfulSyncAt: string | null;
  pendingMutationCount: number;
  blockingConflictCode: string | null;
  lastFailureCode: string | null;
  activeSessionBlocked: boolean;
}>;

export type AccountSignOutResult = Readonly<{ ok: true } | { ok: false; failure: "journalRecoveryFailure" | "pendingSyncRequiresNetwork" | "conflict" | "localDeletionFailure" | "remoteFailure" | "signOutPending" }>;
export type AccountDeletionResult = Readonly<{ ok: true; proofId: string } | { ok: false; failure: "journalRecoveryFailure" | "pendingSyncRequiresNetwork" | "conflict" | "remoteDeletionPending" | "localCleanupFailure" | "reauthenticationRequired" }>;

const nowIso = () => new Date().toISOString();

const CLASSIFIABLE_ACCOUNT_DATA_FAILURE_CODES: readonly string[] = [
  "account_sync_state_invalid", "guest_installation_required", "account_binding_mismatch",
  "account_adoption_pending", "account_materialization_in_progress", "active_session_adoption_blocked",
  "account_data_records_invalid", "account_data_record_invalid", "account_data_fingerprint_invalid",
  "account_data_track_invalid", "account_data_session_invalid", "account_data_result_invalid",
  "account_data_attempt_invalid", "account_data_review_invalid",
];

let accountDataOperationLane: Promise<void> = Promise.resolve();

function withAccountDataOperation<T>(operation: () => Promise<T>): Promise<T> {
  const previous = accountDataOperationLane;
  const current = previous.then(operation, operation);
  accountDataOperationLane = current.then(() => undefined, () => undefined);
  return current;
}

export function loadAccountDataSession(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return withAccountDataOperation(() => loadAccountDataSessionUnlocked(api, accountId));
}

async function loadAccountDataSessionUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  try {
    const initialInstallation = await getGuestInstallation();
    if (!initialInstallation) throw new AccountDataFailure("guest_installation_required");
    if (initialInstallation.accountId !== null && initialInstallation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    const state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    if (state.materialization) {
      const targetAccountId = materializationTargetAccountId(state);
      if (targetAccountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
      if (state.pendingConfirmation !== null) return explicitFailureSession(state, "account_adoption_pending", false);
      const remote = await api.getProgress();
      return await materializeRemoteAccountData(accountId, remote.records, remote.accountRevision, "kind" in state.materialization && state.materialization.kind === "discardGuest");
    }
    const installation = initialInstallation;
    const pendingConfirmation = await getAccountSyncState();
    if (pendingConfirmation.pendingConfirmation && installation.accountId === null) {
      const snapshot = await buildAccountDataSnapshot();
      const blocked = learningSyncGuardSession(pendingConfirmation, snapshot, false);
      if (blocked) return blocked;
      const confirmation: AdoptionConfirmationDto = {
        operationId: pendingConfirmation.pendingConfirmation.operationId,
        previewFingerprint: pendingConfirmation.pendingConfirmation.previewFingerprint,
        protocolVersion: 1,
        resolutions: pendingConfirmation.pendingConfirmation.resolutions,
      };
      try {
        const executed = await api.confirmAccountAdoption({ deviceId: installation.installationId, snapshot, confirmation });
        await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint, accountId);
        return await materializeRemoteAccountData(accountId, executed.records, executed.accountRevision, false);
      } catch (error) {
        const currentState = await getAccountSyncState();
        return failureSession(await recordFailure(currentState, classifyDataFailure(error)), false);
      }
    }
    if (installation.accountId === null) {
      await markGuestInstallationAdoptionPending();
      const snapshot = await buildAccountDataSnapshot();
      if (snapshot.activeSession || snapshot.pendingJournal) {
        return Object.freeze({ status: "failed", preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: snapshot.activeSession ? "active_session_adoption_blocked" : "journal_recovery_required", lastFailureCode: null, activeSessionBlocked: snapshot.activeSession });
      }
      try {
        const preview = await api.previewAccountAdoption(snapshot);
        return Object.freeze({ status: "previewReady", preview, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: preview.plan.conflictRecordIds.length > 0 ? "adoption_conflict" : null, lastFailureCode: null, activeSessionBlocked: false });
      } catch (error) {
        return failureSession(await recordFailure(state, classifyDataFailure(error)), false);
      }
    }
    return synchronizeBoundAccount(api, accountId);
  } catch (error) {
    const state = await getAccountSyncState().catch(() => null);
    return failureSession(state ? await recordFailure(state, classifyDataFailure(error)) : null, false);
  }
}

export function confirmAccountDataAdoption(api: PatternlyApiClient, accountId: string, preview: AdoptionPreviewResponseDto, resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] ): Promise<AccountDataSession> {
  return withAccountDataOperation(() => confirmAccountDataAdoptionUnlocked(api, accountId, preview, resolutions));
}

async function confirmAccountDataAdoptionUnlocked(api: PatternlyApiClient, accountId: string, preview: AdoptionPreviewResponseDto, resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] ): Promise<AccountDataSession> {
  const current = await getAccountSyncState();
  await readDiscardGuards(accountId);
  const snapshot = await buildAccountDataSnapshot();
  const pendingConfirmation = { operationId: preview.preview.operationId, previewFingerprint: preview.preview.fingerprint, resolutions } as const;
  await saveAccountSyncState({ ...current, accountId, pendingConfirmation, status: "syncing", lastFailureCode: null });
  const confirmation: AdoptionConfirmationDto = { operationId: pendingConfirmation.operationId, previewFingerprint: pendingConfirmation.previewFingerprint, protocolVersion: 1, resolutions };
  try {
    const executed = await api.confirmAccountAdoption({ deviceId: snapshot.guestUserId, snapshot, confirmation });
    await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint, accountId);
    return await materializeRemoteAccountData(accountId, executed.records, executed.accountRevision, false);
  } catch (error) {
    const state = await getAccountSyncState();
    return failureSession(await recordFailure(state, classifyDataFailure(error)), false);
  }
}

export function discardGuestDataAndLoadAccount(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return withAccountDataOperation(() => discardGuestDataAndLoadAccountUnlocked(api, accountId));
}

async function discardGuestDataAndLoadAccountUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  try {
    const installation = await getGuestInstallation();
    if (!installation) throw new AccountDataFailure("guest_installation_required");
    const state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    if (state.materialization) {
      if (!("kind" in state.materialization) || state.materialization.kind !== "discardGuest" || state.materialization.accountId !== accountId) throw new AccountDataFailure("account_materialization_in_progress");
      const remote = await api.getProgress();
      return await materializeRemoteAccountData(accountId, remote.records, remote.accountRevision, true);
    }
    if (installation.accountId !== null) {
      if (installation.accountId !== accountId || state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
      return state.status === "synced" ? sessionFromState(state, false) : await loadAccountDataSessionUnlocked(api, accountId);
    }
    if (state.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
    if (state.outbox.length > 0) throw new AccountDataFailure("account_outbox_pending");

    await readDiscardGuards(accountId);
    const remote = await api.getProgress();
    toLocalRecords(remote.records);
    await readDiscardGuards(accountId);
    await markGuestDiscardMaterializationPending(accountId);
    return await materializeRemoteAccountData(accountId, remote.records, remote.accountRevision, true);
  } catch (error) {
    const failure = accountDataFailureCode(error) ?? "remoteFailure";
    const state = await getAccountSyncState().catch(() => null);
    if (isDiscardGuardFailure(failure)) return explicitFailureSession(state, failure, failure === "active_session_adoption_blocked");
    return failureSession(state ? await recordFailure(state, failure) : null, false);
  }
}

export function retryAccountDataSync(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return withAccountDataOperation(() => loadAccountDataSessionUnlocked(api, accountId));
}

function materializationTargetAccountId(state: AccountSyncState): string | null {
  const materialization = state.materialization;
  if (!materialization) return null;
  return "kind" in materialization ? materialization.accountId : state.accountId;
}

async function assertMaterializationGuards(accountId: string): Promise<void> {
  await assertMaterializationTarget(accountId);
  if (await getActiveMutationJournal()) throw new AccountDataFailure("journal_recovery_required");
}

/**
 * Checks only the durable materialization marker and binding. Discard recovery
 * must run this before cleanup because the partially cleared local indexes may
 * no longer be readable by buildAccountDataSnapshot.
 */
async function assertMaterializationTarget(accountId: string): Promise<void> {
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  if (installation.accountId !== null && installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  const state = await getAccountSyncState();
  if (state.accountId !== accountId || !state.materialization || materializationTargetAccountId(state) !== accountId) throw new AccountDataFailure("account_materialization_target_required");
  if (state.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
}

async function readDiscardGuards(accountId: string): Promise<void> {
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  if (installation.accountId !== null) throw new AccountDataFailure("account_binding_mismatch");
  const state = await getAccountSyncState();
  if (state.accountId !== null) throw new AccountDataFailure("account_binding_mismatch");
  if (state.materialization !== null) throw new AccountDataFailure("account_materialization_in_progress");
  if (state.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
  if (state.outbox.length > 0) throw new AccountDataFailure("account_outbox_pending");
  const snapshot = await buildAccountDataSnapshot();
  if (snapshot.activeSession) throw new AccountDataFailure("active_session_adoption_blocked");
  if (snapshot.pendingJournal) throw new AccountDataFailure("journal_recovery_required");
  const latestInstallation = await getGuestInstallation();
  const latestState = await getAccountSyncState();
  if (latestState.accountId !== null && latestState.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (!latestInstallation || latestInstallation.accountId !== null || latestState.accountId !== null || latestState.materialization !== null || latestState.pendingConfirmation !== null || latestState.outbox.length > 0) {
    throw new AccountDataFailure("account_binding_mismatch");
  }
}

async function materializeRemoteAccountData(accountId: string, records: readonly Readonly<{ fingerprint: string; recordId?: string; recordType: string; state: Readonly<Record<string, unknown>>; trackId: string; targetId?: string; version: number }>[], remoteAccountRevision: number, discardGuest: boolean): Promise<AccountDataSession> {
  const localRecords = toLocalRecords(records);
  if (discardGuest) {
    await assertMaterializationGuards(accountId);
    await clearGuestOwnedLocalData();
    await assertMaterializationGuards(accountId);
  } else {
    await assertMaterializationGuards(accountId);
  }
  await applyRemoteAccountData(localRecords);
  await assertMaterializationGuards(accountId);
  await bindGuestInstallationToAccount(accountId);
  const finished = await finishAccountMaterialization(localRecords, accountId, remoteAccountRevision, nowIso());
  return sessionFromState(finished, false);
}

function isDiscardGuardFailure(message: string): boolean {
  return ["active_session_adoption_blocked", "journal_recovery_required", "account_adoption_pending", "account_outbox_pending", "account_materialization_in_progress", "account_binding_mismatch", "account_materialization_target_required"].includes(message);
}

function explicitFailureSession(state: AccountSyncState | null, failure: string, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: "failed", preview: null, lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null, pendingMutationCount: state?.pendingMutationCount ?? 0, blockingConflictCode: state?.blockingConflictCode ?? null, lastFailureCode: failure, activeSessionBlocked });
}

export function prepareAccountSignOut(api: PatternlyApiClient, accountId: string): Promise<AccountSignOutResult> {
  return withAccountDataOperation(() => prepareAccountSignOutUnlocked(api, accountId));
}

async function prepareAccountSignOutUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountSignOutResult> {
  if ((await getAccountSyncState()).materialization) return { ok: false, failure: "pendingSyncRequiresNetwork" };
  const pending = getAccountSignOutState() ?? beginAccountSignOut(accountId);
  try {
    if (await getActiveMutationJournal()) return { ok: false, failure: "journalRecoveryFailure" };
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId) {
      await api.revokeSessions(pending.operationId);
      clearAccountSignOutState();
      return { ok: true };
    }
    const state = await ensureAccountOutboxFromLocalDataset();
    if (state.outbox.length > 0 || state.status === "offlinePending" || state.status === "conflict") {
      const synced = await synchronizeBoundAccount(api, accountId);
      if (synced.status === "conflict") return { ok: false, failure: "conflict" };
      if (synced.status !== "synced") return { ok: false, failure: "pendingSyncRequiresNetwork" };
    }
    await api.revokeSessions(pending.operationId);
    updateAccountSignOutState(pending, { status: "remoteRevoked", lastFailureCode: null });
    await clearAccountOwnedLocalData();
    await clearGuestAccountBinding();
    clearAccountSignOutState();
    return { ok: true };
  } catch (error) {
    const failure = classifyDataFailure(error);
    updateAccountSignOutState(pending, { status: pending.status === "remoteRevoked" ? "localCleanupPending" : "pending", lastFailureCode: failure });
    if (failure === "offline") return { ok: false, failure: "pendingSyncRequiresNetwork" };
    if (failure === "session_revocation_pending") return { ok: false, failure: "signOutPending" };
    return { ok: false, failure: "localDeletionFailure" };
  }
}

export function completeRemoteRevokedSignOut(): Promise<boolean> {
  return withAccountDataOperation(() => completeRemoteRevokedSignOutUnlocked());
}

async function completeRemoteRevokedSignOutUnlocked(): Promise<boolean> {
  if ((await getAccountSyncState()).materialization) return false;
  const pending = getAccountSignOutState();
  if (!pending || pending.status !== "remoteRevoked") return false;
  try {
    await clearAccountOwnedLocalData();
    await clearGuestAccountBinding();
    clearAccountSignOutState();
    return true;
  } catch {
    updateAccountSignOutState(pending, { status: "localCleanupPending", lastFailureCode: "localDeletionFailure" });
    return false;
  }
}

export function deleteBoundAccount(api: PatternlyApiClient, accountId: string, uid: string): Promise<AccountDeletionResult> {
  return withAccountDataOperation(() => deleteBoundAccountUnlocked(api, accountId, uid));
}

async function deleteBoundAccountUnlocked(api: PatternlyApiClient, accountId: string, uid: string): Promise<AccountDeletionResult> {
  if ((await getAccountSyncState()).materialization) return { ok: false, failure: "conflict" };
  const pending = getAccountDeletionState() ?? beginAccountDeletion(accountId, uid);
  try {
    if (await getActiveMutationJournal()) {
      updateAccountDeletionState(pending, { status: "failed", lastFailureCode: "journal_recovery_required" });
      return { ok: false, failure: "journalRecoveryFailure" };
    }
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    let proofId = pending.proofId;
    let operationId = pending.operationId;
    if (pending.status !== "remoteDeleted" && pending.status !== "localCleanupPending") {
      const synced = await synchronizeBoundAccount(api, accountId);
      if (synced.status === "conflict") return { ok: false, failure: "conflict" };
      if (synced.status !== "synced") return { ok: false, failure: "pendingSyncRequiresNetwork" };
      const remote = await api.deleteAccount(pending.operationId);
      proofId = remote.proofId;
      operationId = remote.operationId;
      updateAccountDeletionState(pending, { status: "remoteDeleted", proofId, lastFailureCode: null });
    }
    if (!proofId) throw new AccountDataFailure("remote_deletion_pending");
    const proof = await api.getDeletionProof(proofId);
    if (proof.status !== "deleted" || proof.operationId !== operationId) throw new AccountDataFailure("remote_deletion_pending");
    try {
      await clearAccountOwnedLocalData();
      await clearGuestAccountBinding();
    } catch {
      updateAccountDeletionState(pending, { status: "localCleanupPending", proofId, lastFailureCode: "local_cleanup_failure" });
      return { ok: false, failure: "localCleanupFailure" };
    }
    markAccountDeletionComplete(getAccountDeletionState() ?? { ...pending, proofId });
    return { ok: true, proofId };
  } catch (error) {
    const failure = classifyDataFailure(error);
    if (failure === "revokedSession" && pending.status !== "complete") {
      const status = await api.getDeletionOperationStatus(pending.operationId, sha256Utf8(uid)).catch(() => null);
      if (status?.proofId && (status.status === "remote_deleted" || status.status === "complete")) {
        updateAccountDeletionState(pending, { status: "remoteDeleted", proofId: status.proofId, lastFailureCode: null });
        return deleteBoundAccountUnlocked(api, accountId, uid);
      }
    }
    updateAccountDeletionState(pending, { status: failure === "remote_deletion_pending" ? "remotePending" : "failed", lastFailureCode: failure });
    if (failure === "offline") return { ok: false, failure: "pendingSyncRequiresNetwork" };
    if (failure === "account_revision_conflict" || failure === "version_conflict" || failure === "adoption_conflict") return { ok: false, failure: "conflict" };
    return { ok: false, failure: "remoteDeletionPending" };
  }
}

async function synchronizeBoundAccount(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  const initialGuard = await readBoundSyncGuard(accountId);
  if (initialGuard) return initialGuard;

  let state = await ensureAccountOutboxFromLocalDataset();
  state = saveAccountSyncState({ ...state, accountId, status: "syncing", lastFailureCode: null });
  try {
    const uploadGuard = await readBoundSyncGuard(accountId);
    if (uploadGuard) return uploadGuard;
    state = await getAccountSyncState();
    let response: SyncResponseDto | null = null;
    if (state.outbox.length > 0) {
      response = await api.syncProgress({
        expectedAccountRevision: state.remoteAccountRevision,
        deviceId: (await getGuestInstallation())?.installationId ?? null,
        mutations: state.outbox.map((entry) => ({ mutationId: entry.mutationId, kind: entry.recordType === "training_attempt" || entry.recordType === "review_queue_entry" ? "item" as const : "node" as const, recordType: entry.recordType, trackId: entry.trackId, targetId: entry.recordId, expectedVersion: entry.expectedVersion, fingerprint: entry.fingerprint, state: entry.state })),
      });
    }
    if (response) {
      state = saveAccountSyncState({ ...await getAccountSyncState(), remoteAccountRevision: response.accountRevision });
    }
    const materializationGuard = await readBoundSyncGuard(accountId);
    if (materializationGuard) return materializationGuard;
    const remote = await api.getProgress();
    const records = toLocalRecords(remote.records);
    await applyRemoteAccountData(records);
    const finished = await finishAccountMaterialization(records, accountId, remote.accountRevision, nowIso());
    return sessionFromState(finished, false);
  } catch (error) {
    const failure = classifyDataFailure(error);
    const failed = await recordFailure(state, failure);
    return failureSession(failed, failure === "offline");
  }
}

async function readBoundSyncGuard(accountId: string): Promise<AccountDataSession | null> {
  const installation = await getGuestInstallation();
  if (!installation || installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  const state = await getAccountSyncState();
  if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (state.materialization) return explicitFailureSession(state, "account_materialization_in_progress", false);
  if (state.pendingConfirmation !== null) return explicitFailureSession(state, "account_adoption_pending", false);
  const snapshot = await buildAccountDataSnapshot();
  return learningSyncGuardSession(state, snapshot, true, accountId);
}

function learningSyncGuardSession(state: AccountSyncState, snapshot: AccountDataSnapshot, allowResume: boolean, boundAccountId?: string): AccountDataSession | null {
  if (snapshot.pendingJournal) return explicitFailureSession(state, "journal_recovery_required", snapshot.activeSession);
  if (snapshot.activeSession) {
    if (allowResume && state.accountId !== boundAccountId) return explicitFailureSession(state, "account_binding_mismatch", true);
    return allowResume ? resumeRequiredSession(state) : explicitFailureSession(state, "active_session_adoption_blocked", true);
  }
  return null;
}

async function recordFailure(state: AccountSyncState, code: string): Promise<AccountSyncState> {
  const status = code === "account_revision_conflict" || code === "version_conflict" || code === "adoption_conflict" ? "conflict" as const : code === "offline" ? "offlinePending" as const : "failed" as const;
  return saveAccountSyncState({ ...state, status, blockingConflictCode: status === "conflict" ? code : state.blockingConflictCode, lastFailureCode: code });
}

function sessionFromState(state: AccountSyncState, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state.status, preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: state.blockingConflictCode, lastFailureCode: state.lastFailureCode, activeSessionBlocked });
}

function resumeRequiredSession(state: AccountSyncState): AccountDataSession {
  return Object.freeze({ status: "resumeRequired", preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: state.blockingConflictCode, lastFailureCode: null, activeSessionBlocked: true });
}

function failureSession(state: AccountSyncState | null, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state?.status ?? "failed", preview: null, lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null, pendingMutationCount: state?.pendingMutationCount ?? 0, blockingConflictCode: state?.blockingConflictCode ?? null, lastFailureCode: state?.lastFailureCode ?? "account_data_unavailable", activeSessionBlocked });
}

function toLocalRecords(records: readonly Readonly<{ fingerprint: string; recordId?: string; recordType: string; state: Readonly<Record<string, unknown>>; trackId: string; targetId?: string; version: number }>[]): readonly AccountDataRecord[] {
  if (!Array.isArray(records)) throw new AccountDataFailure("account_data_records_invalid");
  const localRecords = records.map((record) => ({ fingerprint: record.fingerprint, recordId: record.recordId ?? record.targetId, recordType: record.recordType, state: record.state, trackId: record.trackId, version: record.version }));
  assertValidAccountDataRecords(localRecords);
  return Object.freeze(localRecords.map((record) => Object.freeze(record)));
}

function classifyDataFailure(error: unknown): string {
  if (isApiError(error)) {
    if (error.serverCode === "account_revision_conflict" || error.serverCode === "version_conflict") return error.serverCode;
    if (error.serverCode === "merge_preview_mismatch" || error.serverCode === "adoption_conflict") return "adoption_conflict";
    if (error.serverCode === "session_revocation_pending") return "session_revocation_pending";
    if (error.serverCode === "remote_deletion_pending") return "remote_deletion_pending";
    if (error.serverCode === "recent_reauthentication_required") return "reauthentication_required";
    if (error.status === 401 || error.serverCode === "account_deleted") return "revokedSession";
    if (error.code === "transport_failed" || error.code === "request_timeout") return "offline";
    return error.serverCode ?? error.code;
  }
  const accountDataCode = accountDataFailureCode(error);
  if (accountDataCode && CLASSIFIABLE_ACCOUNT_DATA_FAILURE_CODES.includes(accountDataCode)) return accountDataCode;
  return "remoteFailure";
}

function accountDataFailureCode(error: unknown): string | null {
  return error instanceof AccountDataFailure ? error.code : null;
}

function isApiError(error: unknown): error is PatternlyApiClientError { return error instanceof PatternlyApiClientError; }
