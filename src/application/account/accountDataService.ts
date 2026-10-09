import {
  PatternlyApiClientError,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type {
  AdoptionConfirmationDto,
  AdoptionPreviewResponseDto,
  GuestMergeRecordDto,
  GuestMergeSnapshotRequestDto,
  PatternlyApiClient,
  ProgressRecordDto,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";
import {
  accountDataRecordKey,
  applyRemoteAccountData,
  assertValidAccountDataRecords,
  buildAccountDataSnapshot,
  buildGuestOwnedLocalDataBackup,
  clearAccountDeletionOwnedLocalData,
  clearGuestOwnedLocalData,
  createConflictResolutionOutboxEntry,
  rebuildConflictResolutionSyncPlan,
  ensureAccountOutboxFromLocalDataset,
  completeLearningPlanRecovery,
  finishAccountMaterialization,
  getAccountSyncState,
  readAccountSyncStateEnvelope,
  parseGoalCloudState,
  parseLearningPlanCloudState,
  isDeletedAccountDataRecord,
  markAccountDataPending,
  markAccountResetPending,
  markAccountResetRemoteRestorePending,
  markAccountMaterializationPending,
  markGuestDiscardMaterializationApplying,
  markGuestDiscardMaterializationPending,
  partitionRemoteAccountDataForRecovery,
  recordAccountMutationAcknowledgements,
  reserveLearningPlanRecoveryAttempt,
  dismissLearningPlanRecovery as dismissPersistedLearningPlanRecovery,
  restoreGuestOwnedLocalDataBackup,
  saveAccountSyncState,
  saveGuestAdoptionChoice,
  splitAccountSyncBatches,
  type AccountDataRecord,
  type AccountOutboxEntry,
  type AccountSyncPlanItem,
  type AccountDataSnapshot,
  type AccountMutationAcknowledgement,
  type AccountSyncState,
  type AccountSyncConflict,
  type AccountSyncPlan,
  type LearningPlanRecoveryIncident,
  type RemoteAccountDataRecord,
  type SyncableRecordType,
} from "../../storage/repositories/accountDataRepository";
import { isLearningPlanRecoveryRetryDue, nextLearningPlanRecoveryRetryAt } from "./learningPlanRecoveryRetryPolicy";
import {
  beginAccountDeletion,
  clearAccountDeletionState,
  getAccountDeletionState,
  markAccountDeletionComplete,
  updateAccountDeletionState,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, clearGuestAccountBinding, getGuestInstallation, markGuestInstallationAdoptionPending } from "../../storage/repositories/guestInstallationRepository";
import { getActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { AccountDataFailure } from "../../storage/errors";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { withLocalLearningWriteOperation } from "../learningMutations/localLearningWriteOperation";
import { readLearningPlanStorageScope } from "../../storage/repositories/learningPlanInputSnapshot";
import { commitLearningStateReset } from "../learningMutations";
import type { TrackId } from "../../domain";
import { getActiveTrackId, saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { captureActiveProfileStorageLease, getActiveStorageProfileOrNull, isActiveProfileStorageLeaseCurrent, readActiveAccountIdentityBinding } from "../../storage/repositories/profileStorageRepository";
import { getGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { commitMutationAfterPreflight } from "../learningMutations/commitMutation";
import { buildMutationJournal } from "../learningMutations/mutationJournalBuilder";
import { getActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { normalizeLearningPlan } from "../../domain";
import type { GoalRecord, LearningPlan } from "../../domain";
import { isGoalRecordShapeForTrack } from "../../domain/goals/goalContracts";
import { isLearningPlanV1ForTrack } from "../../domain";
import { readCanonicalEnvelope, type CanonicalRecordEnvelope } from "../../storage/repositories/canonicalRecordCodec";
import { STORAGE_KEYS } from "../../storage/keys";
import type { AccountSyncConflictResolutionRecord } from "../../storage/repositories/mutationJournalRepository";
import { isRegisteredTrackId } from "../../domain";

export { accountDataRecordFingerprint } from "../../storage/repositories/accountDataRepository";
export { clearAccountDeletionOwnedLocalData } from "../../storage/repositories/accountDataRepository";

function transportGuestMergeSnapshot(snapshot: AccountDataSnapshot): GuestMergeSnapshotRequestDto {
  return {
    guestSnapshotVersion: snapshot.guestSnapshotVersion,
    guestUserId: snapshot.guestUserId,
    records: snapshot.records,
    activeSession: snapshot.activeSession,
    pendingJournal: snapshot.pendingJournal,
  };
}

export type AccountDataSession = Readonly<{
  status: "initialSyncRequired" | "previewReady" | "syncing" | "synced" | "resumeRequired" | "offlinePending" | "conflict" | "failed" | "signOutPending" | "remoteDeletionPending" | "localCleanupPending";
  preview: AdoptionPreviewResponseDto | null;
  lastSuccessfulSyncAt: string | null;
  pendingMutationCount: number;
  blockingConflictCode: string | null;
  lastFailureCode: string | null;
  activeSessionBlocked: boolean;
  guestAdoptionChoice: "transfer" | "discard";
  syncConflict?: AccountSyncConflict | null;
  learningPlanRecovery?: LearningPlanRecoveryIncident;
}>;

export type AccountSyncConflictPreview = Readonly<{
  conflictId: string;
  kind: "rebase_available" | "pair_choice_required" | "unsupported_changes";
  remoteAccountRevision: number;
  changedPairTrackIds: readonly TrackId[];
  changedOtherRecordCount: number;
}>;

export { saveGuestAdoptionChoice };

export function dismissAccountLearningPlanRecovery(accountId: string, incidentId: string): void {
  dismissPersistedLearningPlanRecovery(accountId, incidentId);
}

export type AccountDeletionResult = Readonly<{ ok: true; proofId: string } | { ok: false; failure: "journalRecoveryFailure" | "pendingSyncRequiresNetwork" | "conflict" | "remoteDeletionPending" | "localCleanupFailure" | "reauthenticationRequired" }>;

const nowIso = () => new Date().toISOString();
const GUEST_MERGE_PARTITION_TIMESTAMP = "1970-01-01T00:00:00.000Z";

function syncPlanItemAsOutboxEntry(item: AccountSyncPlanItem): AccountOutboxEntry {
  return Object.freeze({
    ...item.payload,
    mutationId: item.mutationId,
    expectedVersion: item.expectedVersion,
    attemptCount: 0,
    lastErrorCode: null,
    status: "pending",
    sequence: item.sequence,
  });
}

const CLASSIFIABLE_ACCOUNT_DATA_FAILURE_CODES: readonly string[] = [
  "account_sync_state_invalid", "guest_installation_required", "account_binding_mismatch",
  "account_adoption_pending", "content_identity_schema_conflict", "account_reset_requires_clean_sync", "account_materialization_in_progress", "active_session_adoption_blocked",
  "account_data_records_invalid", "account_data_record_invalid", "account_data_fingerprint_invalid",
  "account_data_track_invalid", "account_data_session_invalid", "account_data_result_invalid",
  "account_data_attempt_invalid", "account_data_review_invalid",
  "account_data_goal_invalid", "account_data_plan_invalid", "account_data_goal_plan_invalid",
  "account_sync_record_too_large", "account_sync_group_too_large",
  "account_materialization_verification_failed",
  "account_deletion_local_preparation_failed",
];

const AUTHORITATIVE_LOCAL_IDENTITY_DENIAL_CODES = new Set([
  "account_deleted",
  "account_not_found",
  "authentication_required",
  "authorization_generation_invalid",
  "authorization_generation_required",
  "authorization_generation_stale",
  "firebase_authorization_generation_invalid",
  "user_not_found",
]);

function authoritativeLocalIdentityDenialCode(error: PatternlyApiClientError): string | null {
  const code = error.serverCode;
  if (!code || !AUTHORITATIVE_LOCAL_IDENTITY_DENIAL_CODES.has(code)) return null;
  const validStatus = code === "account_not_found" || code === "user_not_found"
    ? error.status === 404
    : error.status === 401;
  return validStatus ? `identity_denial:${error.status}:${code}` : null;
}

function isPersistedIdentityDenial(value: string | null): boolean {
  if (value === "revokedSession") return true; // Older persisted marker predates issuer/status preservation.
  const match = /^identity_denial:(401|404):([a-z_]+)$/u.exec(value ?? "");
  if (!match) return false;
  const status = Number(match[1]);
  const code = match[2]!;
  if (!AUTHORITATIVE_LOCAL_IDENTITY_DENIAL_CODES.has(code)) return false;
  return code === "account_not_found" || code === "user_not_found"
    ? status === 404
    : status === 401;
}

let accountDataOperationLane: Promise<void> = Promise.resolve();
const pendingHomeSyncAttempts = new Map<string, Promise<AccountDataSession | null>>();
const pendingLocalResetAttempts = new Map<string, Promise<AccountDataSession>>();
const pendingLearningPlanRecoveryAttempts = new Map<string, Promise<AccountDataSession | null>>();

const LOCAL_HISTORY_RECORD_TYPES = new Set<SyncableRecordType>([
  "training_session_summary",
  "training_session_result",
  "training_attempt",
  "review_queue_entry",
]);

function withAccountDataOperation<T>(operation: () => Promise<T>): Promise<T> {
  const previous = accountDataOperationLane;
  const current = previous.then(operation, operation);
  accountDataOperationLane = current.then(() => undefined, () => undefined);
  return current;
}

/** Persists an active track choice after any earlier account materialization finishes. */
export function commitActiveTrackSelection(trackId: TrackId): Promise<void> {
  return withAccountDataOperation(async () => {
    await saveActiveTrackId(trackId);
    await markAccountDataPending();
  });
}

/** Reads the active track only after any earlier account materialization finishes. */
export function loadSettledActiveTrackSelection(): Promise<TrackId | null> {
  return withAccountDataOperation(() => getActiveTrackId());
}

export function loadAccountDataSession(
  api: PatternlyApiClient,
  accountId: string,
  options: Readonly<{ guestAdoption?: "allow" | "discard" }> = {},
): Promise<AccountDataSession> {
  return withAccountDataOperation(() => loadAccountDataSessionUnlocked(api, accountId, options));
}

/** Reads the already-bound local account projection without contacting the API or changing sync state. */
export function readLocalAccountDataSession(accountId: string): Promise<AccountDataSession | null> {
  return withAccountDataOperation(async () => {
    if (!accountId.trim()) return null;
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId || installation.bindingState !== "account_bound") return null;
    const state = await getAccountSyncState();
    if (state.accountId !== accountId || state.materialization || state.pendingConfirmation !== null || state.resetGuard) return null;
    // A prior authoritative identity denial must not be hidden by a later
    // transport failure and projected as an ordinary offline session.
    if (isPersistedIdentityDenial(state.lastFailureCode)) return null;
    return Object.freeze({
      status: "offlinePending" as const,
      preview: null,
      lastSuccessfulSyncAt: state.lastSuccessfulSyncAt,
      pendingMutationCount: state.pendingMutationCount,
      blockingConflictCode: state.blockingConflictCode,
      lastFailureCode: "offline",
      activeSessionBlocked: false,
      guestAdoptionChoice: state.guestAdoptionChoice,
      ...(state.learningPlanRecovery ? { learningPlanRecovery: Object.freeze({ ...state.learningPlanRecovery }) } : {}),
    });
  });
}

/** Clears only a durable identity-denial marker after the caller revalidates the exact online identity. */
export function clearAccountIdentityDenialAfterProof(input: Readonly<{
  accountId: string;
  firebaseUid: string;
  canContinue: () => boolean | Promise<boolean>;
}>): Promise<boolean> {
  return withAccountDataOperation(async () => {
    if (!input.accountId.trim() || !input.firebaseUid.trim() || !await input.canContinue()) return false;
    let storageScope: object;
    try { storageScope = readLearningPlanStorageScope(); } catch { return false; }
    const installation = await getGuestInstallation();
    const state = await getAccountSyncState();
    if (!await input.canContinue() || readLearningPlanStorageScope() !== storageScope
      || !installation
      || (installation.accountId !== null && installation.accountId !== input.accountId)
      || (state.accountId !== null && state.accountId !== input.accountId)) return false;
    // A freshly opened account profile has an unbound installation and an
    // empty sync projection until account loading materializes it. With no
    // denial to clear, the exact current identity proof may proceed without
    // mutating or prematurely binding that projection.
    if (!isPersistedIdentityDenial(state.lastFailureCode)) return true;
    if (installation.accountId !== input.accountId || installation.bindingState !== "account_bound"
      || state.accountId !== input.accountId) return false;
    const next = saveAccountSyncState({ ...state, lastFailureCode: null });
    const verified = await getAccountSyncState();
    return await input.canContinue() && readLearningPlanStorageScope() === storageScope
      && verified.accountId === input.accountId && verified.lastFailureCode === null
      && verified.localDatasetVersion === next.localDatasetVersion
      && JSON.stringify(verified.outbox) === JSON.stringify(next.outbox)
      && verified.pendingMutationCount === next.pendingMutationCount
      && verified.blockingConflictCode === next.blockingConflictCode
      && JSON.stringify(verified.pendingConfirmation) === JSON.stringify(next.pendingConfirmation)
      && JSON.stringify(verified.syncPlan) === JSON.stringify(next.syncPlan);
  });
}

async function loadAccountDataSessionUnlocked(
  api: PatternlyApiClient,
  accountId: string,
  options: Readonly<{ guestAdoption?: "allow" | "discard" }> = {},
): Promise<AccountDataSession> {
  try {
    const initialInstallation = await getGuestInstallation();
    if (!initialInstallation) throw new AccountDataFailure("guest_installation_required");
    if (initialInstallation.accountId !== null && initialInstallation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    const completedDeletion = getAccountDeletionState();
    // A terminal deletion marker is scoped to the deleted account. Clear it
    // when a later account session resolves a different account so it cannot
    // block that account's own lifecycle. Resumable markers stay durable until
    // their matching operation is explicitly recovered.
    if (completedDeletion?.status === "complete" && completedDeletion.accountId !== accountId) clearAccountDeletionState();
    const state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    if (state.accountId === accountId && state.syncConflict) return failureSession(state, false);
    if (isPersistedIdentityDenial(state.lastFailureCode)) return failureSession(state, false);
    if (state.resetGuard) return await resumeAccountLocalHistoryReset(api, accountId, state);
    if (state.materialization) {
      const targetAccountId = materializationTargetAccountId(state);
      if (targetAccountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
      if (state.pendingConfirmation !== null) return explicitFailureSession(state, "account_adoption_pending", false);
      const discardGuest = "kind" in state.materialization && state.materialization.kind === "discardGuest";
      return await withLocalLearningWriteOperation(async () => {
        if (discardGuest && "kind" in state.materialization! && state.materialization.guestBackup) await restoreGuestOwnedLocalDataBackup(state.materialization.guestBackup);
        try {
          const remote = await api.getProgress();
          return await materializeRemoteAccountDataUnlocked(accountId, remote.records, remote.accountRevision, discardGuest, remote.generation ?? 0);
        } catch (error) {
          if (discardGuest && "kind" in state.materialization! && state.materialization.guestBackup) await restoreGuestOwnedLocalDataBackup(state.materialization.guestBackup);
          throw error;
        }
      });
    }
    const installation = initialInstallation;
    const pendingConfirmation = await getAccountSyncState();
    if (pendingConfirmation.pendingConfirmation && installation.accountId === null) {
      const snapshot = await buildAccountDataSnapshot();
      const transportSnapshot = transportGuestMergeSnapshot(snapshot);
      const blocked = learningSyncGuardSession(pendingConfirmation, snapshot, false);
      if (blocked) return blocked;
      const saved = pendingConfirmation.pendingConfirmation;
      const confirmation: AdoptionConfirmationDto = { operationId: saved.operationId, previewFingerprint: saved.previewFingerprint, resolutions: saved.resolutions, groupChoices: saved.groupChoices };
      try {
        const executed = await api.confirmAccountAdoption({ deviceId: installation.installationId, snapshot: transportSnapshot, confirmation });
        await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint, accountId);
        return await materializeGuestMergeResult(accountId, executed.records, executed.accountRevision);
      } catch (error) {
        const currentState = await getAccountSyncState();
        if (isStaleAdoptionPreview(error)) {
          const reset = saveAccountSyncState({ ...currentState, accountId: null, status: "initialSyncRequired", blockingConflictCode: null, lastFailureCode: "adoption_conflict", pendingConfirmation: null });
          return failureSession(reset, false);
        }
        return failureSession(await recordFailure(currentState, classifyDataFailure(error)), false);
      }
    }
    if (installation.accountId === null && options.guestAdoption === "discard") {
      const guestBackup = await buildGuestOwnedLocalDataBackup();
      await markGuestDiscardMaterializationPending(accountId, installation.installationId, guestBackup);
      const remote = await api.getProgress();
      return await materializeRemoteAccountDataUnlocked(accountId, remote.records, remote.accountRevision, true, remote.generation ?? 0);
    }
    if (installation.accountId === null) {
      await markGuestInstallationAdoptionPending();
      const snapshot = await buildAccountDataSnapshot();
      const transportSnapshot = transportGuestMergeSnapshot(snapshot);
      if (snapshot.activeSession || snapshot.pendingJournal) {
        return Object.freeze({ status: "failed", preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: snapshot.activeSession ? "active_session_adoption_blocked" : "journal_recovery_required", lastFailureCode: null, activeSessionBlocked: snapshot.activeSession, guestAdoptionChoice: state.guestAdoptionChoice });
      }
      try {
        const preview = await api.previewAccountAdoption(transportSnapshot);
        return Object.freeze({ status: "previewReady", preview, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: preview.plan.conflictRecordIds.length > 0 || preview.preview.goalPlanConflictGroups.length > 0 ? "adoption_conflict" : null, lastFailureCode: null, activeSessionBlocked: false, guestAdoptionChoice: state.guestAdoptionChoice });
      } catch (error) {
        return failureSession(await recordFailure(state, classifyDataFailure(error)), false);
      }
    }
    return await synchronizeBoundAccount(api, accountId);
  } catch (error) {
    const state = await getAccountSyncState().catch(() => null);
    if (state?.accountId === accountId && isPersistedIdentityDenial(state.lastFailureCode)) return failureSession(state, false);
    return failureSession(state ? await recordFailure(state, classifyDataFailure(error)) : null, false);
  }
}

/**
 * Clears only the local learning-history records for the current account and
 * then restores that history from the account copy. The reset cursor is
 * written before the journaled deletion and is deliberately cleared only by
 * finishAccountMaterialization after the remote materialization succeeds.
 */
export function resetAccountLocalLearningHistory(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  const existing = pendingLocalResetAttempts.get(accountId);
  if (existing) return existing;
  const attempt = withAccountDataOperation(() => resetAccountLocalLearningHistoryUnlocked(api, accountId));
  pendingLocalResetAttempts.set(accountId, attempt);
  void attempt.then(
    () => { if (pendingLocalResetAttempts.get(accountId) === attempt) pendingLocalResetAttempts.delete(accountId); },
    () => { if (pendingLocalResetAttempts.get(accountId) === attempt) pendingLocalResetAttempts.delete(accountId); },
  );
  return attempt;
}

async function resetAccountLocalLearningHistoryUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  try {
    const installation = await getGuestInstallation();
    if (!installation || installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    let state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    let guard = state.resetGuard;
    if (!guard) {
      if (
        state.accountId !== accountId
        || state.status !== "synced"
        || state.pendingMutationCount !== 0
        || state.outbox.length > 0
        || state.syncPlan !== null
        || state.materialization !== null
        || state.pendingConfirmation !== null
        || state.blockingConflictCode !== null
        || state.lastFailureCode !== null
      ) throw new AccountDataFailure("account_reset_requires_clean_sync");
      const createdAt = nowIso();
      const operationId = `local-history-reset:${accountId}:${createdAt}`;
      state = await markAccountResetPending(accountId, operationId, createdAt);
      guard = state.resetGuard;
    }
    if (!guard || guard.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    return await resumeAccountLocalHistoryReset(api, accountId, state);
  } catch (error) {
    const state = await getAccountSyncState().catch(() => null);
    const failure = classifyDataFailure(error);
    if (failure === "account_reset_requires_clean_sync") return explicitFailureSession(state, failure, false);
    return failureSession(state ? await recordFailure(state, failure) : null, false);
  }
}

async function resumeAccountLocalHistoryReset(api: PatternlyApiClient, accountId: string, state: AccountSyncState): Promise<AccountDataSession> {
  const guard = state.resetGuard;
  if (!guard || guard.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  try {
    if (guard.phase === "localResetPending") {
      // commitLearningStateReset recovers any durable reset journal before it
      // creates/replays the reset itself, so a crash at any deletion boundary
      // remains retryable under the same guard.
      await commitLearningStateReset(guard.createdAt);
      await markAccountResetRemoteRestorePending(accountId, guard.operationId);
    }
    return await withLocalLearningWriteOperation(async () => {
      const remote = await api.getProgress();
      const records = toLocalRecords(remote.records);
      const historyRecords = records.filter((record) => LOCAL_HISTORY_RECORD_TYPES.has(record.recordType));
      const current = await getAccountSyncState();
      if (!current.resetGuard || current.resetGuard.accountId !== accountId || current.resetGuard.operationId !== guard.operationId) {
        throw new AccountDataFailure("account_sync_state_invalid");
      }
      // Reset never imports account context into the local reset scope and
      // never uploads the temporary absence as a tombstone.
      await applyRemoteAccountData(records, { preserveLocalContext: true });
      const localSnapshot = await buildAccountDataSnapshot();
      const localContextRecords = localSnapshot.records.filter((record) => !LOCAL_HISTORY_RECORD_TYPES.has(record.recordType));
      const finished = await finishAccountMaterialization([...historyRecords, ...localContextRecords], accountId, remote.accountRevision, nowIso());
      return sessionFromState(finished, false);
    });
  } catch (error) {
    const current = await getAccountSyncState().catch(() => state);
    return failureSession(await recordFailure(current, classifyDataFailure(error)), false);
  }
}

export function confirmAccountDataAdoption(api: PatternlyApiClient, accountId: string, preview: AdoptionPreviewResponseDto, resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[], groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[]): Promise<AccountDataSession> {
  return withAccountDataOperation(() => withLocalLearningWriteOperation(() => confirmAccountDataAdoptionUnlocked(api, accountId, preview, resolutions, groupChoices)));
}

async function confirmAccountDataAdoptionUnlocked(api: PatternlyApiClient, accountId: string, preview: AdoptionPreviewResponseDto, resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[], groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[]): Promise<AccountDataSession> {
  const current = await getAccountSyncState();
  await readDiscardGuards(accountId);
  const snapshot = await buildAccountDataSnapshot();
  const transportSnapshot = transportGuestMergeSnapshot(snapshot);
  const pendingConfirmation = { operationId: preview.preview.operationId, previewFingerprint: preview.preview.fingerprint, resolutions, groupChoices } as const;
  await saveAccountSyncState({ ...current, accountId, pendingConfirmation, status: "syncing", lastFailureCode: null });
  const confirmation: AdoptionConfirmationDto = { operationId: pendingConfirmation.operationId, previewFingerprint: pendingConfirmation.previewFingerprint, resolutions, groupChoices };
  try {
    const executed = await api.confirmAccountAdoption({ deviceId: snapshot.guestUserId, snapshot: transportSnapshot, confirmation });
    await markAccountMaterializationPending(executed.operationId, confirmation.previewFingerprint, accountId);
    return await materializeGuestMergeResultUnlocked(accountId, executed.records, executed.accountRevision);
  } catch (error) {
    const state = await getAccountSyncState();
    if (isStaleAdoptionPreview(error)) {
      const reset = saveAccountSyncState({ ...state, accountId: null, status: "initialSyncRequired", blockingConflictCode: null, lastFailureCode: "adoption_conflict", pendingConfirmation: null });
      return failureSession(reset, false);
    }
    return failureSession(await recordFailure(state, classifyDataFailure(error)), false);
  }
}

export function discardGuestDataAndLoadAccount(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return withAccountDataOperation(() => withLocalLearningWriteOperation(() => discardGuestDataAndLoadAccountUnlocked(api, accountId)));
}

async function discardGuestDataAndLoadAccountUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  try {
    const installation = await getGuestInstallation();
    if (!installation) throw new AccountDataFailure("guest_installation_required");
    const state = await getAccountSyncState();
    if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
    if (state.materialization) {
      if (!("kind" in state.materialization) || state.materialization.kind !== "discardGuest" || state.materialization.accountId !== accountId) throw new AccountDataFailure("account_materialization_in_progress");
      if (!state.materialization.guestBackup || !state.materialization.installationId) {
        await markGuestDiscardMaterializationPending(accountId, installation.installationId, await buildGuestOwnedLocalDataBackup());
      }
      const remote = await api.getProgress();
      return await materializeRemoteAccountDataUnlocked(accountId, remote.records, remote.accountRevision, true, remote.generation ?? 0);
    }
    if (installation.accountId !== null) {
      if (installation.accountId !== accountId || state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
      return state.status === "synced" ? sessionFromState(state, false) : await loadAccountDataSessionUnlocked(api, accountId);
    }
    if (state.pendingConfirmation !== null) throw new AccountDataFailure("account_adoption_pending");
    if (state.outbox.length > 0) throw new AccountDataFailure("account_outbox_pending");

    await readDiscardGuards(accountId);
    const guestBackup = await buildGuestOwnedLocalDataBackup();
    await markGuestDiscardMaterializationPending(accountId, installation.installationId, guestBackup);
    const remote = await api.getProgress();
    toLocalRecords(remote.records);
    return await materializeRemoteAccountDataUnlocked(accountId, remote.records, remote.accountRevision, true, remote.generation ?? 0);
  } catch (error) {
    const failure = accountDataFailureCode(error) ?? "remoteFailure";
    const state = await getAccountSyncState().catch(() => null);
    if (state?.materialization && "kind" in state.materialization && state.materialization.kind === "discardGuest" && state.materialization.guestBackup) {
      try {
        await restoreGuestOwnedLocalDataBackup(state.materialization.guestBackup);
      } catch (restoreError) {
        return failureSession(await recordFailure(state, classifyDataFailure(restoreError)), false);
      }
    }
    if (isDiscardGuardFailure(failure)) return explicitFailureSession(state, failure, failure === "active_session_adoption_blocked");
    return failureSession(state ? await recordFailure(state, failure) : null, false);
  }
}

export function retryAccountDataSync(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  return withAccountDataOperation(() => loadAccountDataSessionUnlocked(api, accountId));
}

/**
 * Retries only durable learning data left pending by a local terminal commit.
 * Home can call this whenever it becomes visible; all remote work remains on
 * the account operation lane and concurrent calls for one account share the
 * same attempt, including a failed attempt.
 */
export function retryPendingAccountDataSync(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession | null> {
  const existing = pendingHomeSyncAttempts.get(accountId);
  if (existing) return existing;

  const attempt = withAccountDataOperation(() => retryPendingAccountDataSyncUnlocked(api, accountId));
  pendingHomeSyncAttempts.set(accountId, attempt);
  void attempt.then(
    () => {
      if (pendingHomeSyncAttempts.get(accountId) === attempt) pendingHomeSyncAttempts.delete(accountId);
    },
    () => {
      if (pendingHomeSyncAttempts.get(accountId) === attempt) pendingHomeSyncAttempts.delete(accountId);
    },
  );
  return attempt;
}

/** Runs one deduplicated, read-only repair attempt on the account operation lane. */
export function retryLearningPlanRecovery(api: PatternlyApiClient, accountId: string, now: Date = new Date()): Promise<AccountDataSession | null> {
  const current = pendingLearningPlanRecoveryAttempts.get(accountId);
  if (current) return current;
  const attempt = withAccountDataOperation(async () => {
    const installation = await getGuestInstallation();
    const before = await getAccountSyncState();
    const incident = before.learningPlanRecovery;
    if (!installation || installation.accountId !== accountId || before.accountId !== accountId || !incident || incident.accountId !== accountId) return null;
    const reserved = reserveLearningPlanRecoveryAttempt(accountId, incident.incidentId, now, nextLearningPlanRecoveryRetryAt, isLearningPlanRecoveryRetryDue);
    if (!reserved) return null;
    try {
      const remote = await api.getProgress();
      const latestInstallation = await getGuestInstallation();
      const latest = await getAccountSyncState();
      if (!latestInstallation || latestInstallation.accountId !== accountId || latest.accountId !== accountId
        || latest.learningPlanRecovery?.incidentId !== incident.incidentId) return null;
      if (remote.generation !== incident.generation) return sessionFromState(latest, false);
      const candidates = remote.records.filter((record) => record.recordType === "learning_plan"
        && record.targetId === incident.recordId
        && record.trackId === incident.trackId);
      if (candidates.length !== 1) return sessionFromState(latest, false);
      const candidateRow = candidates[0]!;
      const candidate: AccountDataRecord = {
        fingerprint: candidateRow.fingerprint,
        recordId: candidateRow.targetId,
        recordType: candidateRow.recordType,
        state: candidateRow.state,
        trackId: candidateRow.trackId,
        version: candidateRow.version,
      };
      if (candidate.version <= incident.remoteVersion) return sessionFromState(latest, false);
      const completed = completeLearningPlanRecovery(accountId, incident.incidentId, candidate);
      return completed ? sessionFromState(completed, false) : sessionFromState(await getAccountSyncState(), false);
    } catch {
      return sessionFromState(await getAccountSyncState(), false);
    }
  });
  pendingLearningPlanRecoveryAttempts.set(accountId, attempt);
  void attempt.then(
    () => { if (pendingLearningPlanRecoveryAttempts.get(accountId) === attempt) pendingLearningPlanRecoveryAttempts.delete(accountId); },
    () => { if (pendingLearningPlanRecoveryAttempts.get(accountId) === attempt) pendingLearningPlanRecoveryAttempts.delete(accountId); },
  );
  return attempt;
}

async function retryPendingAccountDataSyncUnlocked(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession | null> {
  const installation = await getGuestInstallation();
  const state = await getAccountSyncState();
  if (!installation || installation.accountId !== accountId || state.accountId !== accountId) return null;
  if (isPersistedIdentityDenial(state.lastFailureCode)) return failureSession(state, false);
  if (state.syncConflict) return failureSession(state, false);
  if (state.status !== "offlinePending") return null;
  if (state.materialization) return explicitFailureSession(state, "account_materialization_in_progress", false);
  if (state.pendingConfirmation !== null) return explicitFailureSession(state, "account_adoption_pending", false);

  const guard = await readBoundSyncGuard(accountId);
  if (guard) return guard;

  // Local learning commits do not use the account operation lane. Re-check
  // durable identity and eligibility immediately before the network path so a
  // concurrent commit or recovery transition cannot be uploaded by Home.
  const latestInstallation = await getGuestInstallation();
  const latestState = await getAccountSyncState();
  if (!latestInstallation || latestInstallation.accountId !== accountId || latestState.accountId !== accountId) return null;
  if (isPersistedIdentityDenial(latestState.lastFailureCode)) return failureSession(latestState, false);
  if (latestState.status !== "offlinePending") return null;
  if (latestState.materialization) return explicitFailureSession(latestState, "account_materialization_in_progress", false);
  if (latestState.pendingConfirmation !== null) return explicitFailureSession(latestState, "account_adoption_pending", false);
  return synchronizeBoundAccount(api, accountId);
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
  if ("kind" in state.materialization && state.materialization.kind === "discardGuest") {
    const installation = await getGuestInstallation();
    if (!state.materialization.installationId || !state.materialization.guestBackup || installation?.installationId !== state.materialization.installationId) throw new AccountDataFailure("account_materialization_target_required");
  }
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

async function materializeGuestMergeResult(accountId: string, records: readonly GuestMergeRecordDto[], remoteAccountRevision: number): Promise<AccountDataSession> {
  return withLocalLearningWriteOperation(async () => {
    return materializeGuestMergeResultUnlocked(accountId, records, remoteAccountRevision);
  });
}

async function materializeGuestMergeResultUnlocked(accountId: string, records: readonly GuestMergeRecordDto[], remoteAccountRevision: number): Promise<AccountDataSession> {
  const partition = await partitionRemoteAccountDataForRecovery({
    accountId,
    generation: 0,
    records: toGuestMergePartitionRecords(records),
  });
  const localRecords = partition.records;
  const snapshot = await buildAccountDataSnapshot();
  if (snapshot.activeSession) throw new AccountDataFailure("active_session_adoption_blocked");
  if (snapshot.pendingJournal) throw new AccountDataFailure("journal_recovery_required");
  await assertMaterializationGuards(accountId);
  await applyRemoteAccountData(localRecords);
  await assertMaterializationGuards(accountId);
  await bindGuestInstallationToAccount(accountId);
  const finished = await finishAccountMaterialization(localRecords, accountId, remoteAccountRevision, nowIso(), partition.incident);
  return sessionFromState(finished, false);
}

async function materializeRemoteAccountData(accountId: string, records: readonly RemoteAccountDataRecord[], remoteAccountRevision: number, discardGuest: boolean): Promise<AccountDataSession> {
  return withLocalLearningWriteOperation(async () => {
    try {
      return await materializeRemoteAccountDataUnlocked(accountId, records, remoteAccountRevision, discardGuest);
    } catch (error) {
      if (discardGuest) {
        const state = await getAccountSyncState();
        if (state.materialization && "kind" in state.materialization && state.materialization.kind === "discardGuest" && state.materialization.guestBackup) {
          await restoreGuestOwnedLocalDataBackup(state.materialization.guestBackup);
        }
      }
      throw error;
    }
  });
}

async function materializeRemoteAccountDataUnlocked(accountId: string, records: readonly RemoteAccountDataRecord[], remoteAccountRevision: number, discardGuest: boolean, generation = 0): Promise<AccountDataSession> {
  const partition = await partitionRemoteAccountDataForRecovery({ accountId, generation, records });
  const localRecords = partition.records;
  const snapshot = await buildAccountDataSnapshot();
  if (snapshot.activeSession) throw new AccountDataFailure("active_session_adoption_blocked");
  if (snapshot.pendingJournal) throw new AccountDataFailure("journal_recovery_required");
  if (discardGuest) {
    await assertMaterializationGuards(accountId);
    await markGuestDiscardMaterializationApplying(accountId);
    await clearGuestOwnedLocalData();
    await assertMaterializationGuards(accountId);
  } else {
    await assertMaterializationGuards(accountId);
  }
  await applyRemoteAccountData(localRecords);
  await assertMaterializationGuards(accountId);
  await bindGuestInstallationToAccount(accountId);
  const finished = await finishAccountMaterialization(localRecords, accountId, remoteAccountRevision, nowIso(), partition.incident);
  return sessionFromState(finished, false);
}

export function toGuestMergePartitionRecords(records: readonly GuestMergeRecordDto[]): readonly RemoteAccountDataRecord[] {
  if (records.filter((record) => record.recordType === "active_track" && record.state.deleted !== true).length > 1) {
    throw new AccountDataFailure("account_data_track_invalid");
  }
  return Object.freeze(records.map((record) => Object.freeze({
    fingerprint: record.fingerprint,
    recordId: record.recordId,
    recordType: record.recordType,
    state: record.state,
    trackId: record.trackId,
    version: record.version,
    updatedAt: GUEST_MERGE_PARTITION_TIMESTAMP,
  })));
}

function isDiscardGuardFailure(message: string): boolean {
  return ["active_session_adoption_blocked", "journal_recovery_required", "account_adoption_pending", "account_outbox_pending", "account_materialization_in_progress", "account_binding_mismatch", "account_materialization_target_required"].includes(message);
}

function explicitFailureSession(state: AccountSyncState | null, failure: string, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: "failed", preview: null, lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null, pendingMutationCount: state?.pendingMutationCount ?? 0, blockingConflictCode: state?.blockingConflictCode ?? null, lastFailureCode: failure, activeSessionBlocked, guestAdoptionChoice: state?.guestAdoptionChoice ?? "transfer" });
}

export type PrepareAccountDeletionLocalState = () => Promise<boolean>;

export function deleteBoundAccount(api: PatternlyApiClient, accountId: string, uid: string, prepareLocalState: PrepareAccountDeletionLocalState): Promise<AccountDeletionResult> {
  return withAccountDataOperation(() => deleteBoundAccountUnlocked(api, accountId, uid, true, prepareLocalState));
}

/**
 * Resumes only a durable deletion operation for this exact account and UID.
 * A missing, failed, completed, or mismatched marker is not a deletion
 * request and must never cause a new remote operation to be created.
 */
export function retryPendingAccountDeletion(api: PatternlyApiClient, accountId: string, uid: string, prepareLocalState: PrepareAccountDeletionLocalState): Promise<AccountDeletionResult | null> {
  return withAccountDataOperation(() => retryPendingAccountDeletionUnlocked(api, accountId, uid, prepareLocalState));
}

async function retryPendingAccountDeletionUnlocked(api: PatternlyApiClient, accountId: string, uid: string, prepareLocalState: PrepareAccountDeletionLocalState): Promise<AccountDeletionResult | null> {
  const pending = getAccountDeletionState();
  if (!pending || pending.accountId !== accountId || pending.accountUidHash !== sha256Utf8(uid) || !isResumableDeletionState(pending)) return null;
  return deleteBoundAccountUnlocked(api, accountId, uid, false, prepareLocalState);
}

type DeletionRemoteResolution = Readonly<{ pending: NonNullable<ReturnType<typeof getAccountDeletionState>>; proofId: string | null }>;

function isResumableDeletionState(state: NonNullable<ReturnType<typeof getAccountDeletionState>>): boolean {
  return state.status === "remotePending" || state.status === "remoteDeleted" || state.status === "localCleanupPending";
}

function deletionResultForFailure(failure: string): AccountDeletionResult {
  if (failure === "journal_recovery_required") return { ok: false, failure: "journalRecoveryFailure" };
  if (failure === "offline") return { ok: false, failure: "pendingSyncRequiresNetwork" };
  if (failure === "account_revision_conflict" || failure === "version_conflict" || failure === "adoption_conflict" || failure === "active_session_adoption_blocked") return { ok: false, failure: "conflict" };
  if (failure === "reauthentication_required") return { ok: false, failure: "reauthenticationRequired" };
  return { ok: false, failure: "remoteDeletionPending" };
}

function shouldResolveDeletionStatus(failure: string): boolean {
  return failure === "revokedSession"
    || failure.startsWith("identity_denial:")
    || failure === "offline"
    || failure === "remoteFailure"
    || failure === "server_error"
    || failure === "internal_error"
    || failure === "backend_unavailable"
    || failure === "remote_deletion_pending";
}

async function readVerifiedDeletionStatus(api: PatternlyApiClient, pending: NonNullable<ReturnType<typeof getAccountDeletionState>>, uid: string): Promise<DeletionRemoteResolution | null> {
  try {
    const status = await api.getDeletionOperationStatus(pending.operationId, pending.operationSecret);
    if (status.operationId !== pending.operationId) return null;
    if ((status.status === "remote_deleted" || status.status === "complete") && status.proofId) {
      const next = updateAccountDeletionState(pending, { status: "remoteDeleted", proofId: status.proofId, lastFailureCode: null });
      return { pending: next, proofId: status.proofId };
    }
    if (status.status === "pending") {
      const next = updateAccountDeletionState(pending, { status: "remotePending", lastFailureCode: "remote_deletion_pending" });
      return { pending: next, proofId: null };
    }
  } catch {
    // The original failure is more useful to the caller. The durable marker
    // remains available for a later explicit retry.
  }
  return null;
}

async function assertDeletionCleanupGuards(accountId: string): Promise<void> {
  if (await getActiveMutationJournal()) throw new AccountDataFailure("journal_recovery_required");
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  if (installation.accountId !== null && installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
}

async function clearDeletionOwnedLocalDataAndBinding(accountId: string): Promise<void> {
  await assertDeletionCleanupGuards(accountId);
  await clearAccountDeletionOwnedLocalData();
  // A journal is never part of the deletion allow-list. If one appears while
  // cleanup is in progress, leave the deletion marker durable for recovery.
  await assertDeletionCleanupGuards(accountId);
  const installation = await getGuestInstallation();
  if (!installation) throw new AccountDataFailure("guest_installation_required");
  if (installation.accountId === accountId) await clearGuestAccountBinding();
  else if (installation.accountId !== null) throw new AccountDataFailure("account_binding_mismatch");
}

async function deleteBoundAccountUnlocked(api: PatternlyApiClient, accountId: string, uid: string, allowBegin: boolean, prepareLocalState: PrepareAccountDeletionLocalState): Promise<AccountDeletionResult> {
  if ((await getAccountSyncState()).materialization) return { ok: false, failure: "conflict" };
  const uidHash = sha256Utf8(uid);
  let pending = getAccountDeletionState();

  // A marker for another account must remain untouched. This guard is checked
  // before any local deletion and before replacing a failed marker.
  if (pending && (pending.accountId !== accountId || pending.accountUidHash !== uidHash)) return { ok: false, failure: "remoteDeletionPending" };
  if (!allowBegin && (!pending || !isResumableDeletionState(pending))) return { ok: false, failure: "remoteDeletionPending" };
  if (pending?.status === "complete") return pending.proofId ? { ok: true, proofId: pending.proofId } : { ok: false, failure: "remoteDeletionPending" };

  try {
    // Existing remote markers already represent an authorized/requested
    // operation. A new deletion marker is created only after all preflight
    // checks and synchronization have completed.
    if (await getActiveMutationJournal()) return { ok: false, failure: "journalRecoveryFailure" };
    const installation = await getGuestInstallation();
    const existingRemoteMarker = pending !== null && isResumableDeletionState(pending);
    if (!existingRemoteMarker && (!installation || installation.accountId !== accountId)) throw new AccountDataFailure("account_binding_mismatch");
    if (existingRemoteMarker && installation && installation.accountId !== null && installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");

    if (!existingRemoteMarker) {
      const synced = await synchronizeBoundAccount(api, accountId);
      if (synced.status === "conflict") return { ok: false, failure: "conflict" };
      if (synced.status !== "synced") return { ok: false, failure: "pendingSyncRequiresNetwork" };
    }

    if (pending?.status === "failed") {
      clearAccountDeletionState();
      pending = null;
    }
    if (!pending) pending = beginAccountDeletion(accountId, uid);

    let proofId = pending.proofId;
    if (pending.status === "remotePending") {
      try {
        const remote = await api.deleteAccount(pending.operationId, pending.operationSecret);
        if (remote.operationId !== pending.operationId || !remote.proofId) throw new AccountDataFailure("remote_deletion_pending");
        proofId = remote.proofId;
        pending = updateAccountDeletionState(pending, { status: "remoteDeleted", proofId, lastFailureCode: null });
      } catch (error) {
        const failure = classifyDataFailure(error);
        if (shouldResolveDeletionStatus(failure)) {
          const resolved = await readVerifiedDeletionStatus(api, pending, uid);
          if (resolved?.proofId) {
            pending = resolved.pending!;
            proofId = resolved.proofId;
          } else {
            if (resolved?.pending) pending = resolved.pending!;
            else pending = updateAccountDeletionState(pending, { status: "remotePending", lastFailureCode: failure });
            return deletionResultForFailure(failure);
          }
        } else if (failure === "invalid_response") {
          // A malformed 2xx may follow a completed remote deletion. Keep the
          // same operation identity resumable; never mark it failed or create
          // a fresh operation from an unvalidated acknowledgement.
          pending = updateAccountDeletionState(pending, { status: "remotePending", lastFailureCode: failure });
          return deletionResultForFailure(failure);
        } else {
          pending = updateAccountDeletionState(pending, { status: failure === "reauthentication_required" ? "remotePending" : "failed", lastFailureCode: failure });
          return deletionResultForFailure(failure);
        }
      }
    }

    if (!proofId) {
      const resolved = await readVerifiedDeletionStatus(api, pending, uid);
      if (!resolved?.proofId) return { ok: false, failure: "remoteDeletionPending" };
      pending = resolved.pending!;
      proofId = resolved.proofId;
    }

    try {
      const proof = await api.getDeletionProof(proofId);
      if (proof.status !== "deleted" || proof.operationId !== pending.operationId || proof.proofId !== proofId) throw new AccountDataFailure("remote_deletion_pending");
    } catch (error) {
      const failure = classifyDataFailure(error);
      if (shouldResolveDeletionStatus(failure)) {
        const resolved = await readVerifiedDeletionStatus(api, pending, uid);
        if (resolved?.proofId) {
          pending = resolved.pending!;
          proofId = resolved.proofId;
          const proof = await api.getDeletionProof(proofId);
          if (proof.status !== "deleted" || proof.operationId !== pending.operationId || proof.proofId !== proofId) return { ok: false, failure: "remoteDeletionPending" };
        } else {
          pending = resolved?.pending ?? updateAccountDeletionState(pending, { status: "remoteDeleted", proofId, lastFailureCode: failure });
          return deletionResultForFailure(failure);
        }
      } else {
        pending = updateAccountDeletionState(pending, { status: "remoteDeleted", proofId, lastFailureCode: failure });
        return deletionResultForFailure(failure);
      }
    }

    try {
      if (!(await prepareLocalState())) throw new AccountDataFailure("account_deletion_local_preparation_failed");
      await clearDeletionOwnedLocalDataAndBinding(accountId);
    } catch (error) {
      const failure = classifyDataFailure(error);
      try {
        pending = updateAccountDeletionState(pending, { status: "localCleanupPending", proofId, lastFailureCode: failure });
      } catch {
        // Keep the last verified marker state if the lifecycle record itself
        // cannot be written. A later retry can still inspect remoteDeleted or
        // localCleanupPending and continue the idempotent cleanup.
      }
      if (failure === "journal_recovery_required") return { ok: false, failure: "journalRecoveryFailure" };
      return { ok: false, failure: "localCleanupFailure" };
    }

    try {
      markAccountDeletionComplete(getAccountDeletionState() ?? { ...pending, proofId });
    } catch {
      // The remote proof and local allow-list cleanup are complete. Keep the
      // remote-deleted marker so the next explicit retry only persists the
      // terminal state and never starts another remote request.
      try {
        updateAccountDeletionState(pending, { status: "localCleanupPending", proofId, lastFailureCode: "local_cleanup_failure" });
      } catch {
        // The existing remoteDeleted marker remains safe to retry.
      }
      return { ok: false, failure: "localCleanupFailure" };
    }
    return { ok: true, proofId };
  } catch (error) {
    const failure = classifyDataFailure(error);
    // Do not mutate a marker that failed the account/UID ownership check.
    const current = getAccountDeletionState();
    if (current && current.accountId === accountId && current.accountUidHash === uidHash && current.status !== "complete") {
      const preservedRemotePhase = current.status === "remoteDeleted" || current.status === "localCleanupPending";
      try {
        updateAccountDeletionState(current, { status: preservedRemotePhase ? current.status : shouldResolveDeletionStatus(failure) ? "remotePending" : failure === "reauthentication_required" ? "remotePending" : "failed", lastFailureCode: failure });
      } catch {
        // Preserve the durable marker as-is if lifecycle storage is currently
        // unavailable; the caller will receive the same safe pending result.
      }
    }
    return deletionResultForFailure(failure);
  }
}

async function synchronizeBoundAccount(api: PatternlyApiClient, accountId: string): Promise<AccountDataSession> {
  let state = await getAccountSyncState();
  if (state.accountId === accountId && isPersistedIdentityDenial(state.lastFailureCode)) return failureSession(state, false);
  if (state.accountId === accountId && state.syncConflict) return failureSession(state, false);
  const initialGuard = await readBoundSyncGuard(accountId);
  if (initialGuard) return initialGuard;
  let baseline: BoundSyncBaseline | null = null;
  let confirmedConflict: AccountSyncConflict | null = null;
  try {
    const planned = await withLocalLearningWriteOperation(async () => {
      const storageScope = readLearningPlanStorageScope();
      const uploadGuard = await readBoundSyncGuard(accountId);
      if (uploadGuard) return Object.freeze({ kind: "blocked" as const, guard: uploadGuard });
      const installation = await getGuestInstallation();
      if (!installation || installation.accountId !== accountId || installation.bindingState !== "account_bound") throw new AccountDataFailure("account_binding_mismatch");
      await ensureAccountOutboxFromLocalDataset();
      const snapshot = await buildAccountDataSnapshot();
      const currentInstallation = await getGuestInstallation();
      const currentState = await getAccountSyncState();
      if (currentState.accountId === accountId && isPersistedIdentityDenial(currentState.lastFailureCode)) {
        return Object.freeze({ kind: "identity_denied" as const, session: failureSession(currentState, false) });
      }
      if (readLearningPlanStorageScope() !== storageScope
        || !currentInstallation
        || currentInstallation.installationId !== installation.installationId
        || currentInstallation.localDatasetId !== installation.localDatasetId
        || currentInstallation.accountId !== accountId
        || currentInstallation.bindingState !== "account_bound"
        || (currentState.accountId !== null && currentState.accountId !== accountId)) throw new AccountDataFailure("account_binding_mismatch");
      const snapshotGuard = learningSyncGuardSession(currentState, snapshot, true, accountId);
      if (snapshotGuard) return Object.freeze({ kind: "blocked" as const, guard: snapshotGuard });
      const syncing = saveAccountSyncState({ ...currentState, accountId, status: "syncing", lastFailureCode: null });
      return Object.freeze({
        kind: "ready" as const,
        state: syncing,
        baseline: Object.freeze({
          accountId,
          installationId: installation.installationId,
          localDatasetId: installation.localDatasetId,
          storageScope,
          localDatasetVersion: currentState.localDatasetVersion,
          snapshotFingerprint: localAccountSnapshotFingerprint(snapshot),
        }),
      });
    });
    if (planned.kind === "blocked") return preservePendingSyncGuard(accountId, planned.guard);
    if (planned.kind === "identity_denied") return planned.session;
    state = planned.state;
    baseline = planned.baseline;
    let postUploadDatasetVersion = baseline.localDatasetVersion;
    const duplicateMutationIds = new Set<string>();
    if (state.outbox.length > 0) {
      const plan = state.syncPlan;
      if (!plan) throw new AccountDataFailure("account_sync_state_invalid");
      const planEntries = plan.items.map(syncPlanItemAsOutboxEntry);
      const batches = splitAccountSyncBatches({ entries: planEntries, expectedAccountRevision: state.remoteAccountRevision, sessionId: plan.planId, highWatermark: plan.highWatermark });
      const planItemsByMutationId = new Map(plan.items.map((item) => [item.mutationId, item]));
      const installation = await getGuestInstallation();
      if (!installation) throw new AccountDataFailure("guest_installation_required");
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const batch = batches[batchIndex]!;
        const batchId = `${plan.planId}:batch:${batchIndex}`;
        // A successful response and the updated remote revision are persisted
        // together. On a later retry, do not replay an already acknowledged
        // batch with the newer revision: the server's durable batch marker is
        // bound to the original request revision and must remain untouched.
        if (batch.every((entry) => planItemsByMutationId.get(entry.mutationId)?.status === "acked")) continue;
        const current = await getAccountSyncState();
        if (current.syncPlan?.planId !== plan.planId) throw new AccountDataFailure("account_sync_state_invalid");
        const request = {
          canonicalVersion: "canonical-json-v1",
          expectedAccountRevision: current.remoteAccountRevision,
          deviceId: installation.installationId,
          sessionId: plan.planId,
          batchId,
          highWatermark: plan.highWatermark,
          mutations: batch.map((entry) => ({ mutationId: entry.mutationId, kind: entry.recordType === "training_attempt" || entry.recordType === "review_queue_entry" ? "item" as const : "node" as const, recordType: entry.recordType, trackId: entry.trackId, targetId: entry.recordId, expectedVersion: entry.expectedVersion, fingerprint: entry.fingerprint, state: entry.state })),
        } as const;
        let response: Awaited<ReturnType<PatternlyApiClient["syncProgress"]>>;
        try {
          response = await api.syncProgress(request);
        } catch (error) {
          const conflictCode = confirmedSyncConflictCode(error);
          if (conflictCode) confirmedConflict = buildConfirmedSyncConflict({ code: conflictCode, request, planId: plan.planId, batchId, batchIndex, batch });
          throw error;
        }
        if (response.accountRevisionConflict) {
          confirmedConflict = buildConfirmedSyncConflict({ code: response.accountRevisionConflict.code, request, planId: plan.planId, batchId, batchIndex, batch });
          throw new PatternlyApiClientError("server_error", 409, response.accountRevisionConflict.code);
        }
        if (response.conflicts.length > 0) {
          const conflictCode = response.conflicts[0]?.code ?? "version_conflict";
          confirmedConflict = buildConfirmedSyncConflict({ code: conflictCode, request, planId: plan.planId, batchId, batchIndex, batch });
          throw new PatternlyApiClientError("server_error", 409, conflictCode);
        }
        const batchMutationIds = new Set(batch.map((entry) => entry.mutationId));
        if (response.applied.some((record) => !batchMutationIds.has(record.lastMutationId))
          || response.duplicates.some((mutationId) => !batchMutationIds.has(mutationId))
          || response.applied.some((record) => response.duplicates.includes(record.lastMutationId))
          || new Set(response.applied.map((record) => record.lastMutationId)).size !== response.applied.length
          || new Set(response.duplicates).size !== response.duplicates.length) {
          throw new PatternlyApiClientError("invalid_response");
        }
        const acknowledgedMutationIds = new Set([
          ...response.applied.map((record) => record.lastMutationId),
          ...response.duplicates,
        ]);
        if (acknowledgedMutationIds.size !== batchMutationIds.size
          || [...batchMutationIds].some((mutationId) => !acknowledgedMutationIds.has(mutationId))) {
          throw new PatternlyApiClientError("invalid_response");
        }
        response.duplicates.forEach((mutationId) => duplicateMutationIds.add(mutationId));
        const acknowledgements: AccountMutationAcknowledgement[] = response.applied.map((record) => ({
          mutationId: record.lastMutationId,
          record: Object.freeze({
            fingerprint: record.fingerprint,
            recordId: record.targetId,
            recordType: record.recordType,
            state: record.state,
            trackId: record.trackId,
            version: record.version,
          }),
        }));
        state = await withLocalLearningWriteOperation(async () => {
          await assertBoundSyncIdentity(baseline!);
          return recordAccountMutationAcknowledgements({ accountId, planId: plan.planId, remoteAccountRevision: response.accountRevision, acknowledgements });
        });
      }
    }
    const materializationGuard = await readBoundSyncGuard(accountId);
    if (materializationGuard) return preservePendingSyncGuard(accountId, materializationGuard);
    const postUploadCheck = await withLocalLearningWriteOperation(async () => {
      await assertBoundSyncIdentity(baseline!);
      const currentState = await getAccountSyncState();
      if (currentState.accountId !== accountId) return Object.freeze({ kind: "scope_changed" as const });
      const snapshot = await buildAccountDataSnapshot();
      if (localAccountSnapshotFingerprint(snapshot) !== baseline!.snapshotFingerprint) {
        const pending = saveAccountSyncState({ ...await getAccountSyncState(), status: "offlinePending", blockingConflictCode: null, lastFailureCode: "local_dataset_changed_during_sync" });
        return Object.freeze({ kind: "local_changed" as const, session: failureSession(pending, false) });
      }
      const latest = await getAccountSyncState();
      if (latest.accountId !== accountId) return Object.freeze({ kind: "scope_changed" as const });
      return Object.freeze({ kind: "ready" as const, localDatasetVersion: latest.localDatasetVersion });
    });
    if (postUploadCheck.kind === "scope_changed") return failureSession(state, false);
    if (postUploadCheck.kind === "local_changed") return postUploadCheck.session;
    postUploadDatasetVersion = postUploadCheck.localDatasetVersion;
    const remote = await api.getProgress();
    const partition = await partitionRemoteAccountDataForRecovery({ accountId, generation: remote.generation ?? 0, records: remote.records });
    const materialized = await withLocalLearningWriteOperation(async () => {
      if (!isBoundStorageScopeCurrent(baseline!)) return Object.freeze({ kind: "scope_changed" as const });
      const downloadGuard = await readBoundSyncGuard(accountId);
      if (downloadGuard) return Object.freeze({ kind: "blocked" as const, guard: downloadGuard });
      const installation = await getGuestInstallation();
      if (!installation
        || installation.installationId !== baseline!.installationId
        || installation.localDatasetId !== baseline!.localDatasetId
        || installation.accountId !== accountId
        || installation.bindingState !== "account_bound") return Object.freeze({ kind: "scope_changed" as const });
      let latestState = await getAccountSyncState();
      if (latestState.accountId !== accountId) return Object.freeze({ kind: "scope_changed" as const });
      if (latestState.localDatasetVersion !== postUploadDatasetVersion) {
        const pending = saveAccountSyncState({ ...latestState, status: "offlinePending", blockingConflictCode: null, lastFailureCode: "local_dataset_changed_during_sync" });
        return Object.freeze({ kind: "local_changed" as const, session: failureSession(pending, false) });
      }
      const latestSnapshot = await buildAccountDataSnapshot();
      latestState = await getAccountSyncState();
      // The post-upload snapshot captured any expected version changes from
      // exact ACKs. From here, compare that version again after materialization
      // while the lane excludes new local commits.
      const materializationDatasetVersion = latestState.localDatasetVersion;
      const duplicateCheck = duplicateMutationAcknowledgements(duplicateMutationIds, latestState.syncPlan, remote.records);
      await assertBoundSyncIdentity(baseline!);
      latestState = await getAccountSyncState();
      if (latestState.accountId !== accountId) return Object.freeze({ kind: "scope_changed" as const });
      if (latestState.localDatasetVersion !== materializationDatasetVersion) {
        return Object.freeze({ kind: "scope_changed" as const });
      }
      if (duplicateCheck.acknowledgements.length > 0) {
        latestState = recordAccountMutationAcknowledgements({
          accountId,
          planId: latestState.syncPlan!.planId,
          remoteAccountRevision: remote.accountRevision,
          acknowledgements: duplicateCheck.acknowledgements,
        });
      }
      if (duplicateCheck.unconfirmed.length > 0) {
        const conflict = saveAccountSyncState({ ...latestState, status: "conflict", blockingConflictCode: "duplicate_ack_unverified", lastFailureCode: "duplicate_ack_unverified" });
        return Object.freeze({ kind: "duplicate_unverified" as const, session: failureSession(conflict, false) });
      }
      if (localAccountSnapshotFingerprint(latestSnapshot) !== baseline!.snapshotFingerprint) {
        const pending = saveAccountSyncState({ ...latestState, status: "offlinePending", blockingConflictCode: null, lastFailureCode: "local_dataset_changed_during_sync" });
        return Object.freeze({ kind: "local_changed" as const, session: failureSession(pending, false) });
      }
      await assertBoundSyncIdentity(baseline!);
      await applyRemoteAccountData(partition.records);
      await assertBoundSyncIdentity(baseline!);
      const stateBeforeFinish = await getAccountSyncState();
      if (stateBeforeFinish.accountId !== accountId || stateBeforeFinish.localDatasetVersion !== materializationDatasetVersion) {
        return Object.freeze({ kind: "scope_changed" as const });
      }
      const finished = await finishAccountMaterialization(partition.records, accountId, remote.accountRevision, nowIso(), partition.incident);
      return Object.freeze({ kind: "synced" as const, session: sessionFromState(finished, false) });
    });
    if (materialized.kind === "blocked") return preservePendingSyncGuard(accountId, materialized.guard);
    if (materialized.kind === "scope_changed") return failureSession(state, false);
    return materialized.session;
  } catch (error) {
    if (baseline && !isBoundStorageScopeCurrent(baseline)) return failureSession(state, false);
    const latest = await getAccountSyncState().catch(() => null);
    if (latest?.accountId === accountId && isPersistedIdentityDenial(latest.lastFailureCode)) return failureSession(latest, false);
    const failure = classifyDataFailure(error);
    if (failure === "active_session_adoption_blocked" || failure === "journal_recovery_required") {
      const guard = await readBoundSyncGuard(accountId);
      if (guard) return preservePendingSyncGuard(accountId, guard);
    }
    const failed = confirmedConflict
      ? await persistConfirmedSyncConflict(accountId, confirmedConflict)
      : await recordFailure(state, failure);
    return failureSession(failed, failure === "offline");
  }
}

type BoundSyncBaseline = Readonly<{
  accountId: string;
  installationId: string;
  localDatasetId: string;
  storageScope: object;
  localDatasetVersion: number;
  snapshotFingerprint: string;
}>;

function localAccountSnapshotFingerprint(snapshot: AccountDataSnapshot): string {
  // The repository's versioned snapshot also includes acknowledged remote
  // record versions. Those versions may advance from this sync's exact upload
  // ACKs; compare local record identity/content while the write lane protects
  // the snapshot from concurrent app mutations.
  const localRecords = snapshot.records
    .map((record) => [accountDataRecordKey(record), record.fingerprint] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  return sha256Utf8(JSON.stringify(localRecords));
}

function isBoundStorageScopeCurrent(baseline: BoundSyncBaseline): boolean {
  try {
    return readLearningPlanStorageScope() === baseline.storageScope;
  } catch {
    return false;
  }
}

function assertBoundStorageScope(baseline: BoundSyncBaseline): void {
  if (!isBoundStorageScopeCurrent(baseline)) throw new AccountDataFailure("account_binding_mismatch");
}

async function assertBoundSyncIdentity(baseline: BoundSyncBaseline): Promise<void> {
  assertBoundStorageScope(baseline);
  const installation = await getGuestInstallation();
  if (!installation
    || installation.installationId !== baseline.installationId
    || installation.localDatasetId !== baseline.localDatasetId
    || installation.accountId !== baseline.accountId
    || installation.bindingState !== "account_bound"
    || !isBoundStorageScopeCurrent(baseline)) throw new AccountDataFailure("account_binding_mismatch");
}

function duplicateMutationAcknowledgements(
  duplicateMutationIds: ReadonlySet<string>,
  plan: AccountSyncState["syncPlan"],
  remoteRecords: readonly ProgressRecordDto[],
): Readonly<{ acknowledgements: readonly AccountMutationAcknowledgement[]; unconfirmed: readonly string[] }> {
  const acknowledgements: AccountMutationAcknowledgement[] = [];
  const unconfirmed: string[] = [];
  for (const mutationId of duplicateMutationIds) {
    const item = plan?.items.find((candidate) => candidate.mutationId === mutationId);
    const matchingRemote = remoteRecords.filter((record) => record.lastMutationId === mutationId);
    const remote = matchingRemote.length === 1 ? matchingRemote[0] : null;
    if (!item || !remote
      || remote.recordType !== item.payload.recordType
      || remote.targetId !== item.payload.recordId
      || remote.trackId !== item.payload.trackId
      || remote.fingerprint !== item.payload.fingerprint) {
      unconfirmed.push(mutationId);
      continue;
    }
    acknowledgements.push(Object.freeze({
      mutationId,
      record: Object.freeze({
        fingerprint: remote.fingerprint,
        recordId: remote.targetId,
        recordType: remote.recordType,
        state: remote.state,
        trackId: remote.trackId,
        version: remote.version,
      }),
    }));
  }
  return Object.freeze({ acknowledgements: Object.freeze(acknowledgements), unconfirmed: Object.freeze(unconfirmed) });
}

async function preservePendingSyncGuard(accountId: string, guard: AccountDataSession): Promise<AccountDataSession> {
  if (guard.status !== "resumeRequired" && guard.lastFailureCode !== "journal_recovery_required") return guard;
  const current = await getAccountSyncState();
  if (current.accountId !== accountId || current.status !== "syncing") return guard;
  const pending = saveAccountSyncState({ ...current, status: "offlinePending", lastFailureCode: guard.lastFailureCode });
  if (guard.status === "resumeRequired") return resumeRequiredSession(pending);
  return explicitFailureSession(pending, guard.lastFailureCode ?? "journal_recovery_required", guard.activeSessionBlocked);
}

async function readBoundSyncGuard(accountId: string): Promise<AccountDataSession | null> {
  const installation = await getGuestInstallation();
  if (!installation || installation.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  const state = await getAccountSyncState();
  if (state.accountId !== null && state.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (state.accountId === accountId && state.syncConflict) return failureSession(state, false);
  if (state.resetGuard) return explicitFailureSession(state, "local_reset_pending", false);
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
  const status = code === "account_revision_conflict" || code === "version_conflict" || code === "content_identity_schema_conflict" || code === "adoption_conflict" ? "conflict" as const : code === "offline" ? "offlinePending" as const : "failed" as const;
  return saveAccountSyncState({ ...state, status, blockingConflictCode: status === "conflict" ? code : state.blockingConflictCode, lastFailureCode: code });
}

const CONFIRMED_SYNC_CONFLICTS = new Set(["account_revision_conflict", "version_conflict", "content_identity_schema_conflict"]);
function confirmedSyncConflictCode(error: unknown): AccountSyncConflict["code"] | null {
  return error instanceof PatternlyApiClientError && error.status === 409 && error.serverCode && CONFIRMED_SYNC_CONFLICTS.has(error.serverCode)
    ? error.serverCode as AccountSyncConflict["code"]
    : null;
}

function buildConfirmedSyncConflict(input: Readonly<{
  code: string;
  request: Readonly<Record<string, unknown>>;
  planId: string;
  batchId: string;
  batchIndex: number;
  batch: readonly AccountOutboxEntry[];
}>): AccountSyncConflict {
  if (!CONFIRMED_SYNC_CONFLICTS.has(input.code)) throw new AccountDataFailure("account_sync_state_invalid");
  const requestFingerprint = sha256Utf8(canonicalSerialize(input.request));
  const mutationIds = input.batch.map((entry) => entry.mutationId);
  const recordKeys = input.batch.map((entry) => accountDataRecordKey(entry));
  const trackIds = [...new Set(input.batch.map((entry) => entry.trackId))].sort();
  const occurredAt = nowIso();
  const code = input.code as AccountSyncConflict["code"];
  const conflictId = sha256Utf8(canonicalSerialize({ batchId: input.batchId, code, planId: input.planId, requestFingerprint }));
  return Object.freeze({ schemaVersion: 1, conflictId, code, planId: input.planId, batchId: input.batchId, batchIndex: input.batchIndex,
    expectedAccountRevision: Number((input.request as { expectedAccountRevision?: unknown }).expectedAccountRevision), requestFingerprint,
    mutationIds: Object.freeze(mutationIds), recordKeys: Object.freeze(recordKeys), trackIds: Object.freeze(trackIds), occurredAt });
}

async function persistConfirmedSyncConflict(accountId: string, conflict: AccountSyncConflict): Promise<AccountSyncState> {
  return withLocalLearningWriteOperation(async () => {
    const installation = await getGuestInstallation();
    const current = await getAccountSyncState();
    if (!installation || installation.accountId !== accountId || installation.bindingState !== "account_bound"
      || current.accountId !== accountId || current.materialization || current.pendingConfirmation !== null || current.resetGuard
      || (current.syncPlan?.planId !== conflict.planId && !current.syncConflict)) {
      throw new AccountDataFailure("account_binding_mismatch");
    }
    if (current.syncConflict && current.syncConflict.conflictId !== conflict.conflictId) throw new AccountDataFailure("account_sync_state_invalid");
    const saved = saveAccountSyncState({ ...current, status: "conflict", blockingConflictCode: conflict.code, lastFailureCode: conflict.code, syncConflict: conflict });
    const verified = await getAccountSyncState();
    if (verified.accountId !== accountId || verified.syncConflict?.conflictId !== conflict.conflictId
      || verified.syncPlan?.planId !== conflict.planId) throw new AccountDataFailure("account_sync_state_invalid");
    return saved;
  });
}

type ConflictReadContext = Readonly<{
  accountId: string;
  conflict: AccountSyncConflict;
  installationId: string;
  localDatasetId: string;
  profileId: string;
  lease: NonNullable<ReturnType<typeof captureActiveProfileStorageLease>>;
  storageScope: object;
  syncEnvelopeRevision: number;
  localDatasetVersion: number;
  localDatasetFingerprint: string | null;
}>;

type ConflictAnalysis = Readonly<{ changedPairTrackIds: readonly TrackId[]; changedOtherRecordCount: number }>;

/** Explicit conflict entry is the only path that reads the latest cloud revision before a rebase/choice. */
export function inspectAccountSyncConflict(api: PatternlyApiClient, accountId: string): Promise<AccountSyncConflictPreview> {
  return withAccountDataOperation(async () => {
    const context = await captureConflictReadContext(accountId);
    const remote = await api.getProgress(); // Deliberately outside the local learning write lane.
    const remoteRecords = toLocalRecords(remote.records);
    assertValidAccountDataRecords(remoteRecords);
    return withLocalLearningWriteOperation(async () => {
      const { snapshot, state } = await validateConflictReadContext(context);
      void snapshot;
      const analysis = analyzeConflict(state, remoteRecords);
      return Object.freeze({
        conflictId: context.conflict.conflictId,
        kind: analysis.changedOtherRecordCount > 0 ? "unsupported_changes" as const
          : analysis.changedPairTrackIds.length > 0 ? "pair_choice_required" as const : "rebase_available" as const,
        remoteAccountRevision: remote.accountRevision,
        changedPairTrackIds: analysis.changedPairTrackIds,
        changedOtherRecordCount: analysis.changedOtherRecordCount,
      });
    });
  });
}

export function resolveAccountSyncConflict(input: Readonly<{
  api: PatternlyApiClient;
  accountId: string;
  conflictId: string;
  resolution: "rebase" | "keep_local" | "keep_account";
  trackId?: TrackId;
}>): Promise<AccountDataSession> {
  return withAccountDataOperation(async () => {
    const resolution = input.resolution;
    const context = await captureConflictReadContext(input.accountId);
    if (context.conflict.conflictId !== input.conflictId) throw new AccountDataFailure("account_sync_conflict_stale");
    const remote = await input.api.getProgress(); // Never hold the local write lane across network I/O.
    const remoteRecords = toLocalRecords(remote.records);
    assertValidAccountDataRecords(remoteRecords);
    if (resolution === "rebase") {
      return withLocalLearningWriteOperation(async () => {
        const { state } = await validateConflictReadContext(context);
        const analysis = analyzeConflict(state, remoteRecords);
        if (analysis.changedPairTrackIds.length > 0 || analysis.changedOtherRecordCount > 0) throw new AccountDataFailure("account_sync_conflict_stale");
        const next = stateAfterConflictRebase(state, input.accountId, remote.accountRevision);
        const saved = saveAccountSyncState(next, context.syncEnvelopeRevision);
        return sessionFromState(saved, false);
      });
    }
    if (!input.trackId) throw new AccountDataFailure("account_sync_conflict_choice_required");
    await commitMutationAfterPreflight(async () => {
      const { snapshot, state, syncEnvelope } = await validateConflictReadContext(context);
      const analysis = analyzeConflict(state, remoteRecords);
      if (!analysis.changedPairTrackIds.includes(input.trackId!)) throw new AccountDataFailure("account_sync_conflict_stale");
      if (analysis.changedOtherRecordCount > 0) throw new AccountDataFailure("account_sync_conflict_unsupported_changes");
      const pair = await resolvePairForChoice({ state, snapshot, remoteRecords, remoteAccountRevision: remote.accountRevision, accountId: input.accountId, trackId: input.trackId!, resolution });
      const goalSnapshot = await getGoalSnapshot(input.trackId!);
      const planSnapshot = getLearningPlanSnapshot(input.trackId!);
      const afterState = stateAfterPairChoice({ state, snapshot, accountId: input.accountId, trackId: input.trackId!, remoteRecords, remoteAccountRevision: remote.accountRevision, pair, resolution });
      const record: AccountSyncConflictResolutionRecord = Object.freeze({
        conflictId: input.conflictId,
        accountId: input.accountId,
        profileId: context.profileId,
        trackId: input.trackId!,
        resolution,
        expectedGoalRevision: goalSnapshot?.revision ?? null,
        expectedPlanStorageRevision: planSnapshot?.revision ?? null,
        expectedSyncStateRevision: syncEnvelope?.revision ?? null,
        afterGoalRevision: pair.afterGoalRevision,
        afterPlanStorageRevision: pair.afterPlanStorageRevision,
        beforeGoal: goalSnapshot ? Object.freeze({ schemaIdentity: "patternly:canonical:v1" as const, revision: goalSnapshot.revision, payload: goalSnapshot.record }) : null,
        beforePlan: planSnapshot ? Object.freeze({ schemaIdentity: "patternly:canonical:v1" as const, revision: planSnapshot.revision, payload: planSnapshot.plan }) : null,
        beforeSyncState: syncEnvelope,
        afterGoal: pair.afterGoal,
        afterPlan: pair.afterPlan,
        afterSyncState: afterState,
      });
      return buildMutationJournal({ operation: "resolve_account_sync_conflict", conflictId: input.conflictId, trackId: input.trackId!, identity: { accountId: input.accountId, resolution, remoteAccountRevision: remote.accountRevision, profileId: context.profileId, syncStateRevision: syncEnvelope?.revision ?? null }, writes: [{ kind: "resolve_account_sync_conflict", record }], createdAt: nowIso() });
    }, () => assertConflictContextCurrent(context));
    return failureSession(await getAccountSyncState(), false);
  });
}

async function captureConflictReadContext(accountId: string): Promise<ConflictReadContext> {
  const lease = captureActiveProfileStorageLease();
  const profile = getActiveStorageProfileOrNull();
  const installation = await getGuestInstallation();
  const state = await getAccountSyncState();
  const syncEnvelope = readAccountSyncStateEnvelope();
  if (!lease || !profile || profile.id !== lease.profile.id || !installation || installation.accountId !== accountId
    || installation.bindingState !== "account_bound" || state.accountId !== accountId || !state.syncConflict || !syncEnvelope
    || state.materialization || state.pendingConfirmation || state.resetGuard) throw new AccountDataFailure("account_sync_conflict_unavailable");
  const binding = await readActiveAccountIdentityBinding(lease);
  if (binding.kind !== "verified" || binding.binding.profileId !== profile.id || binding.binding.accountId !== accountId
    || !isActiveProfileStorageLeaseCurrent(lease) || getActiveStorageProfileOrNull()?.id !== profile.id) throw new AccountDataFailure("account_binding_mismatch");
  return Object.freeze({ accountId, conflict: state.syncConflict, installationId: installation.installationId, localDatasetId: installation.localDatasetId,
    profileId: profile.id, lease, storageScope: readLearningPlanStorageScope(), syncEnvelopeRevision: syncEnvelope.revision,
    localDatasetVersion: state.localDatasetVersion, localDatasetFingerprint: state.localDatasetFingerprint });
}

async function validateConflictReadContext(context: ConflictReadContext): Promise<Readonly<{ snapshot: AccountDataSnapshot; state: AccountSyncState; syncEnvelope: ReturnType<typeof readAccountSyncStateEnvelope> }>> {
  assertConflictContextCurrent(context);
  const installation = await getGuestInstallation();
  const binding = await readActiveAccountIdentityBinding(context.lease);
  if (!installation || installation.installationId !== context.installationId || installation.localDatasetId !== context.localDatasetId
    || installation.accountId !== context.accountId || installation.bindingState !== "account_bound"
    || binding.kind !== "verified" || binding.binding.accountId !== context.accountId || binding.binding.profileId !== context.profileId) {
    throw new AccountDataFailure("account_sync_conflict_stale");
  }
  const activeJournal = await getActiveMutationJournal();
  if (activeJournal) throw new AccountDataFailure("journal_recovery_required");
  const snapshot = await buildAccountDataSnapshot();
  const state = await getAccountSyncState();
  const syncEnvelope = readAccountSyncStateEnvelope();
  if (snapshot.activeSession || snapshot.pendingJournal || !syncEnvelope || syncEnvelope.revision !== context.syncEnvelopeRevision
    || state.localDatasetVersion !== context.localDatasetVersion || state.localDatasetFingerprint !== context.localDatasetFingerprint
    || state.accountId !== context.accountId || state.syncConflict?.conflictId !== context.conflict.conflictId
    || state.materialization || state.pendingConfirmation || state.resetGuard) throw new AccountDataFailure("account_sync_conflict_stale");
  assertConflictContextCurrent(context);
  return Object.freeze({ snapshot, state, syncEnvelope });
}

function assertConflictContextCurrent(context: ConflictReadContext): void {
  if (!isActiveProfileStorageLeaseCurrent(context.lease) || getActiveStorageProfileOrNull()?.id !== context.profileId
    || readLearningPlanStorageScope() !== context.storageScope) throw new AccountDataFailure("account_sync_conflict_stale");
}

function analyzeConflict(state: AccountSyncState, remoteRecords: readonly AccountDataRecord[]): ConflictAnalysis {
  const remoteByKey = new Map(remoteRecords.map((record) => [accountDataRecordKey(record), record]));
  const pairTracks = new Set<TrackId>();
  let changedOtherRecordCount = 0;
  for (const entry of state.outbox) {
    const current = remoteByKey.get(accountDataRecordKey(entry));
    const unchangedVersion = entry.expectedVersion === null ? current === undefined : current?.version === entry.expectedVersion;
    if (unchangedVersion) continue;
    if (entry.recordType === "goal" || entry.recordType === "learning_plan") pairTracks.add(entry.trackId as TrackId);
    else changedOtherRecordCount += 1;
  }
  for (const trackId of pairTracks) {
    for (const recordType of ["goal", "learning_plan"] as const) {
      const key = accountDataRecordKey({ recordType, recordId: trackId, trackId });
      const baseline = state.acknowledged[key];
      const latest = remoteByKey.get(key);
      if (baseline === undefined ? latest !== undefined : latest === undefined || latest.version !== baseline.remoteVersion || latest.fingerprint !== baseline.fingerprint) {
        pairTracks.add(trackId);
      }
    }
  }
  return Object.freeze({ changedPairTrackIds: Object.freeze([...pairTracks].sort()), changedOtherRecordCount });
}

type ResolvedConflictPair = Readonly<{ afterGoal: GoalRecord | null; afterPlan: LearningPlan | null; afterGoalRevision: number | null; afterPlanStorageRevision: number | null; localPairRecords: readonly AccountDataRecord[] }>;

async function resolvePairForChoice(input: Readonly<{
  state: AccountSyncState; snapshot: AccountDataSnapshot; remoteRecords: readonly AccountDataRecord[]; remoteAccountRevision: number; accountId: string; trackId: TrackId; resolution: "keep_local" | "keep_account";
}>): Promise<ResolvedConflictPair> {
  const goal = await getGoalSnapshot(input.trackId);
  const plan = getLearningPlanSnapshot(input.trackId);
  if (input.resolution === "keep_local") {
    const localRecords = input.snapshot.records.filter((record) => record.trackId === input.trackId && (record.recordType === "goal" || record.recordType === "learning_plan"));
    let localPairRecords = localRecords;
    if (localPairRecords.length === 0) {
      localPairRecords = input.state.outbox.filter((entry) => entry.trackId === input.trackId && (entry.recordType === "goal" || entry.recordType === "learning_plan") && isDeletedAccountDataRecord(entry));
    }
    if (localPairRecords.length !== 2 || !localPairRecords.some((record) => record.recordType === "goal") || !localPairRecords.some((record) => record.recordType === "learning_plan")) throw new AccountDataFailure("account_sync_conflict_unsupported_changes");
    const deletedPair = localPairRecords.every(isDeletedAccountDataRecord);
    if (!deletedPair && (!goal || !plan || localPairRecords.some(isDeletedAccountDataRecord))) throw new AccountDataFailure("account_sync_conflict_unsupported_changes");
    return Object.freeze({ afterGoal: goal?.record ?? null, afterPlan: plan?.plan ?? null,
      afterGoalRevision: goal?.revision ?? null, afterPlanStorageRevision: plan?.revision ?? null, localPairRecords: Object.freeze(localPairRecords) });
  }
  const remotePair = readRemoteGoalPlanPair(input.remoteRecords, input.trackId);
  if (remotePair.kind === "deleted") return Object.freeze({ afterGoal: null, afterPlan: null, afterGoalRevision: null, afterPlanStorageRevision: null, localPairRecords: Object.freeze([]) });
  const localPairRecords = input.remoteRecords.filter((record) => record.trackId === input.trackId && (record.recordType === "goal" || record.recordType === "learning_plan"));
  return Object.freeze({ afterGoal: remotePair.goal.record, afterPlan: remotePair.plan.plan,
    afterGoalRevision: remotePair.goal.revision, afterPlanStorageRevision: remotePair.plan.revision, localPairRecords: Object.freeze(localPairRecords) });
}

function readRemoteGoalPlanPair(records: readonly AccountDataRecord[], trackId: TrackId):
  | Readonly<{ kind: "deleted" }>
  | Readonly<{ kind: "live"; goal: NonNullable<ReturnType<typeof parseGoalCloudState>>; plan: NonNullable<ReturnType<typeof parseLearningPlanCloudState>> }> {
  const goal = records.find((record) => record.recordType === "goal" && record.trackId === trackId);
  const plan = records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
  const goalDeleted = !goal || isDeletedAccountDataRecord(goal);
  const planDeleted = !plan || isDeletedAccountDataRecord(plan);
  if (goalDeleted && planDeleted) return Object.freeze({ kind: "deleted" });
  if (goalDeleted || planDeleted || !goal || !plan) throw new AccountDataFailure("account_sync_conflict_unsupported_changes");
  const parsedGoal = parseGoalCloudState(goal.state, trackId);
  const parsedPlan = parseLearningPlanCloudState(plan.state, trackId);
  if (!parsedGoal || !parsedPlan || parsedPlan.plan.goalRevision !== parsedGoal.revision) throw new AccountDataFailure("account_sync_conflict_unsupported_changes");
  return Object.freeze({ kind: "live", goal: parsedGoal, plan: parsedPlan });
}

function stateAfterPairChoice(input: Readonly<{
  state: AccountSyncState; snapshot: AccountDataSnapshot; accountId: string; trackId: TrackId; remoteRecords: readonly AccountDataRecord[]; remoteAccountRevision: number; pair: ResolvedConflictPair; resolution: "keep_local" | "keep_account";
}>): AccountSyncState {
  assertValidAccountDataRecords(input.pair.localPairRecords);
  const remoteByKey = new Map(input.remoteRecords.map((record) => [accountDataRecordKey(record), record]));
  const pairEntries = input.state.outbox.filter((entry) => entry.trackId === input.trackId && (entry.recordType === "goal" || entry.recordType === "learning_plan"));
  const otherEntries = input.state.outbox.filter((entry) => !pairEntries.includes(entry));
  const acknowledged: Record<string, AccountSyncState["acknowledged"][string]> = { ...input.state.acknowledged };
  for (const recordType of ["goal", "learning_plan"] as const) {
    const key = accountDataRecordKey({ recordType, recordId: input.trackId, trackId: input.trackId });
    const remote = remoteByKey.get(key);
    if (remote) acknowledged[key] = Object.freeze({ fingerprint: remote.fingerprint, recordId: remote.recordId, recordType, remoteVersion: remote.version, trackId: input.trackId });
    else delete acknowledged[key];
  }
  let outbox: AccountOutboxEntry[];
  let outboxSequence = input.state.outboxSequence;
  if (input.resolution === "keep_local") {
    outbox = otherEntries.slice();
    for (const record of input.pair.localPairRecords) {
      const key = accountDataRecordKey(record);
      const latest = remoteByKey.get(key);
      const previous = pairEntries.find((entry) => accountDataRecordKey(entry) === key);
      const entry = createConflictResolutionOutboxEntry({ accountId: input.accountId, record, expectedVersion: latest?.version ?? null, sequence: ++outboxSequence, ...(previous ? { previous } : {}) });
      outbox.push(entry);
    }
  } else {
    outbox = otherEntries.slice();
  }
  const candidate = { ...input.state, acknowledged: Object.freeze(acknowledged), outbox: Object.freeze(outbox), outboxSequence,
    highWatermark: Math.max(input.state.highWatermark, outboxSequence), pendingMutationCount: outbox.length };
  const remaining = analyzeConflict(candidate, input.remoteRecords);
  const canFinish = remaining.changedPairTrackIds.length === 0 && remaining.changedOtherRecordCount === 0;
  if (!canFinish) return Object.freeze({ ...candidate, status: "conflict", remoteAccountRevision: input.state.remoteAccountRevision, blockingConflictCode: input.state.syncConflict?.code ?? input.state.blockingConflictCode, syncConflict: input.state.syncConflict, syncPlan: input.state.syncPlan, lastFailureCode: input.state.syncConflict?.code ?? input.state.lastFailureCode });
  const plan = rebuildConflictResolutionSyncPlan({ accountId: input.accountId, snapshotVersion: input.snapshot.guestSnapshotVersion, remoteAccountRevision: input.remoteAccountRevision,
    highWatermark: Math.max(input.state.highWatermark, outboxSequence), outbox, previous: input.state.syncPlan });
  return Object.freeze({ ...candidate, remoteAccountRevision: input.remoteAccountRevision, status: outbox.length > 0 ? "offlinePending" : "synced",
    blockingConflictCode: null, lastFailureCode: null, syncConflict: null, syncPlan: plan });
}

function stateAfterConflictRebase(state: AccountSyncState, accountId: string, remoteAccountRevision: number): AccountSyncState {
  const acknowledgedMutationIds = new Set(state.syncPlan?.items.filter((item) => item.status === "acked").map((item) => item.mutationId) ?? []);
  const outbox = state.outbox.filter((entry) => !acknowledgedMutationIds.has(entry.mutationId));
  const syncPlan = rebuildConflictResolutionSyncPlan({ accountId, snapshotVersion: state.localDatasetVersion, remoteAccountRevision,
    highWatermark: state.highWatermark, outbox, previous: null });
  return Object.freeze({ ...state, remoteAccountRevision, outbox: Object.freeze(outbox), pendingMutationCount: outbox.length,
    syncPlan, status: outbox.length > 0 ? "offlinePending" : "synced", blockingConflictCode: null, lastFailureCode: null, syncConflict: null });
}

function sessionFromState(state: AccountSyncState, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state.status, preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: state.blockingConflictCode, lastFailureCode: state.lastFailureCode, activeSessionBlocked, guestAdoptionChoice: state.guestAdoptionChoice, syncConflict: state.syncConflict ?? null, ...(state.learningPlanRecovery ? { learningPlanRecovery: state.learningPlanRecovery } : {}) });
}

function resumeRequiredSession(state: AccountSyncState): AccountDataSession {
  return Object.freeze({ status: "resumeRequired", preview: null, lastSuccessfulSyncAt: state.lastSuccessfulSyncAt, pendingMutationCount: state.pendingMutationCount, blockingConflictCode: state.blockingConflictCode, lastFailureCode: null, activeSessionBlocked: true, guestAdoptionChoice: state.guestAdoptionChoice });
}

function failureSession(state: AccountSyncState | null, activeSessionBlocked: boolean): AccountDataSession {
  return Object.freeze({ status: state?.status ?? "failed", preview: null, lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null, pendingMutationCount: state?.pendingMutationCount ?? 0, blockingConflictCode: state?.blockingConflictCode ?? null, lastFailureCode: state?.lastFailureCode ?? "account_data_unavailable", activeSessionBlocked, guestAdoptionChoice: state?.guestAdoptionChoice ?? "transfer", syncConflict: state?.syncConflict ?? null });
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
    const identityDenial = authoritativeLocalIdentityDenialCode(error);
    if (identityDenial) return identityDenial;
    if (error.code === "transport_failed" || error.code === "request_timeout") return "offline";
    return error.serverCode ?? error.code;
  }
  const accountDataCode = accountDataFailureCode(error);
  if (accountDataCode && CLASSIFIABLE_ACCOUNT_DATA_FAILURE_CODES.includes(accountDataCode)) return accountDataCode;
  return "remoteFailure";
}

function isStaleAdoptionPreview(error: unknown): boolean {
  return isApiError(error) && error.serverCode === "merge_preview_mismatch";
}

function accountDataFailureCode(error: unknown): string | null {
  return error instanceof AccountDataFailure ? error.code : null;
}

function isApiError(error: unknown): error is PatternlyApiClientError { return error instanceof PatternlyApiClientError; }
