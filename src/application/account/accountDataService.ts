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
  buildAccountDataSnapshot,
  clearAccountOwnedLocalData,
  ensureAccountOutboxFromLocalDataset,
  finishAccountMaterialization,
  getAccountSyncState,
  markAccountMaterializationPending,
  saveAccountSyncState,
  type AccountDataRecord,
  type AccountDataSnapshot,
  type AccountSyncState,
  type SyncableRecordType,
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
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

export { accountDataRecordFingerprint } from "../../storage/repositories/accountDataRepository";

export type AccountDataSession = Readonly<{
  status: "initialSyncRequired" | "previewReady" | "syncing" | "synced" | "offlinePending" | "conflict" | "failed" | "signOutPending" | "remoteDeletionPending" | "localCleanupPending";
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

export async function loadAccountDataSession(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  try {
    const initialInstallation = await getGuestInstallation();
    if (!initialInstallation) throw new Error("guest_installation_required");
    let installation = initialInstallation;
    const state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new Error("account_binding_mismatch");
    if (state.materialization) {
      const remote = await api.getProgress();
      await applyRemoteAccountData(toLocalRecords(remote.records));
      await bindGuestInstallationToAccount(accountId);
      await finishAccountMaterialization(toLocalRecords(remote.records), accountId, remote.accountRevision, nowIso());
      const refreshedInstallation = await getGuestInstallation();
      if (!refreshedInstallation) throw new Error("guest_installation_required");
      installation = refreshedInstallation;
    }
    const pendingConfirmation = await getAccountSyncState();
    if (pendingConfirmation.pendingConfirmation && installation.accountId === null) {
      const snapshot = await buildAccountDataSnapshot();
      const confirmation: AdoptionConfirmationDto = {
        operationId: pendingConfirmation.pendingConfirmation.operationId,
        previewFingerprint: pendingConfirmation.pendingConfirmation.previewFingerprint,
        protocolVersion: 1,
        resolutions: pendingConfirmation.pendingConfirmation.resolutions,
      };
      try {
        const executed = await api.confirmAccountAdoption({ deviceId: installation.installationId, snapshot, confirmation });
        await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint);
        await applyRemoteAccountData(toLocalRecords(executed.records));
        await bindGuestInstallationToAccount(accountId);
        const finished = await finishAccountMaterialization(toLocalRecords(executed.records), accountId, executed.accountRevision, nowIso());
        return sessionFromState(finished, false);
      } catch (error) {
        return failureSession(await recordFailure(pendingConfirmation, classifyDataFailure(error)), false);
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

export async function confirmAccountDataAdoption(api: PatternlyApiClient, accountId: string, preview: AdoptionPreviewResponseDto, resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] ): Promise<AccountDataSession> {
  const current = await getAccountSyncState();
  const snapshot = await buildAccountDataSnapshot();
  const pendingConfirmation = { operationId: preview.preview.operationId, previewFingerprint: preview.preview.fingerprint, resolutions } as const;
  await saveAccountSyncState({ ...current, pendingConfirmation, status: "syncing", lastFailureCode: null });
  const confirmation: AdoptionConfirmationDto = { operationId: pendingConfirmation.operationId, previewFingerprint: pendingConfirmation.previewFingerprint, protocolVersion: 1, resolutions };
  try {
    const executed = await api.confirmAccountAdoption({ deviceId: snapshot.guestUserId, snapshot, confirmation });
    await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint);
    await applyRemoteAccountData(toLocalRecords(executed.records));
    await bindGuestInstallationToAccount(accountId);
    const finished = await finishAccountMaterialization(toLocalRecords(executed.records), accountId, executed.accountRevision, nowIso());
    return sessionFromState(finished, false);
  } catch (error) {
    const state = await getAccountSyncState();
    return failureSession(await recordFailure(state, classifyDataFailure(error)), false);
  }
}

export async function retryAccountDataSync(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return loadAccountDataSession(api, accountId);
}

export async function prepareAccountSignOut(api: PatternlyApiClient, accountId: string): Promise<AccountSignOutResult> {
  const pending = getAccountSignOutState() ?? beginAccountSignOut(accountId);
  try {
    if (await getActiveMutationJournal()) return { ok: false, failure: "journalRecoveryFailure" };
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId) {
      await api.revokeSessions(pending.operationId);
      clearAccountSignOutState();
      return { ok: true };
    }
    const state = await getAccountSyncState();
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

export async function completeRemoteRevokedSignOut(): Promise<boolean> {
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

export async function deleteBoundAccount(api: PatternlyApiClient, accountId: string, uid: string): Promise<AccountDeletionResult> {
  const pending = getAccountDeletionState() ?? beginAccountDeletion(accountId, uid);
  try {
    if (await getActiveMutationJournal()) {
      updateAccountDeletionState(pending, { status: "failed", lastFailureCode: "journal_recovery_required" });
      return { ok: false, failure: "journalRecoveryFailure" };
    }
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId) throw new Error("account_binding_mismatch");
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
    if (!proofId) throw new Error("remote_deletion_pending");
    const proof = await api.getDeletionProof(proofId);
    if (proof.status !== "deleted" || proof.operationId !== operationId) throw new Error("remote_deletion_pending");
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
        return deleteBoundAccount(api, accountId, uid);
      }
    }
    updateAccountDeletionState(pending, { status: failure === "remote_deletion_pending" ? "remotePending" : "failed", lastFailureCode: failure });
    if (failure === "offline") return { ok: false, failure: "pendingSyncRequiresNetwork" };
    if (failure === "account_revision_conflict" || failure === "version_conflict" || failure === "adoption_conflict") return { ok: false, failure: "conflict" };
    return { ok: false, failure: "remoteDeletionPending" };
  }
}

async function synchronizeBoundAccount(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  let state = await ensureAccountOutboxFromLocalDataset();
  state = saveAccountSyncState({ ...state, accountId, status: "syncing", lastFailureCode: null });
  try {
    let response: SyncResponseDto | null = null;
    if (state.outbox.length > 0) {
      response = await api.syncProgress({
        expectedAccountRevision: state.remoteAccountRevision,
        deviceId: (await getGuestInstallation())?.installationId ?? null,
        mutations: state.outbox.map((entry) => ({ mutationId: entry.mutationId, kind: entry.recordType === "training_attempt" || entry.recordType === "review_queue_entry" ? "item" as const : "node" as const, recordType: entry.recordType, trackId: entry.trackId, targetId: entry.recordId, expectedVersion: entry.expectedVersion, fingerprint: entry.fingerprint, state: entry.state })),
      });
    }
    const remote = await api.getProgress();
    const snapshot = await buildAccountDataSnapshot();
    if (snapshot.activeSession) {
      const failed = await recordFailure({ ...state, remoteAccountRevision: response?.accountRevision ?? state.remoteAccountRevision }, "active_session_sync_deferred");
      return failureSession(failed, true);
    }
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

async function recordFailure(state: AccountSyncState, code: string): Promise<AccountSyncState> {
  const status = code === "account_revision_conflict" || code === "version_conflict" || code === "adoption_conflict" ? "conflict" as const : code === "offline" ? "offlinePending" as const : "failed" as const;
  return saveAccountSyncState({ ...state, status, blockingConflictCode: status === "conflict" ? code : state.blockingConflictCode, lastFailureCode: code });
}

function sessionFromState(state: AccountSyncState, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state.status, preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: state.blockingConflictCode, lastFailureCode: state.lastFailureCode, activeSessionBlocked });
}

function failureSession(state: AccountSyncState | null, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state?.status ?? "failed", preview: null, lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null, pendingMutationCount: state?.pendingMutationCount ?? 0, blockingConflictCode: state?.blockingConflictCode ?? null, lastFailureCode: state?.lastFailureCode ?? "account_data_unavailable", activeSessionBlocked });
}

function toLocalRecords(records: readonly Readonly<{ fingerprint: string; recordId?: string; recordType: string; state: Readonly<Record<string, unknown>>; trackId: string; targetId?: string; version: number }>[]): readonly AccountDataRecord[] {
  return Object.freeze(records.map((record) => Object.freeze({ fingerprint: record.fingerprint, recordId: record.recordId ?? record.targetId!, recordType: record.recordType as SyncableRecordType, state: record.state, trackId: record.trackId, version: record.version })));
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
  return "remoteFailure";
}

function isApiError(error: unknown): error is PatternlyApiClientError { return error instanceof PatternlyApiClientError; }
