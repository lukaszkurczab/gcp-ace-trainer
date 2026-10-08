import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createPatternlyApiClient, PatternlyApiClientError, type AdoptionPreviewResponseDto, type PatternlyApiClient, type ProgressMutationDto, type ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { AccountDataFailure } from "../../storage/errors";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { clearAccountDeletionOwnedLocalData, clearAccountIdentityDenialAfterProof, confirmAccountDataAdoption, deleteBoundAccount, dismissAccountLearningPlanRecovery, loadAccountDataSession, readLocalAccountDataSession, retryAccountDataSync, retryPendingAccountDataSync, retryPendingAccountDeletion } from "./accountDataService";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  beginAccountDeletion,
  getAccountDeletionState,
  markAccountDeletionComplete,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, clearGuestAccountBinding, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";

const accountId = "55555555-5555-4555-8555-555555555555";
const uid = "firebase-fixture-uid";
const TEST_ARTIFACT_SHA256 = "a".repeat(64);
const prepareDeletionLocalState = async () => true;

function api(overrides: Partial<PatternlyApiClient> = {}): PatternlyApiClient {
  return {
    availability: "available",
    getHealth: async () => ({ status: "ok", service: "patternly-backend" }),
    getReady: async () => ({ status: "ready", checks: { database: true, authentication: true, providerReader: true } }),
    getOpenApi: async () => ({ openapi: "3.0.3", paths: {} }),
    getMe: async () => ({ user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", acceptedTermsVersion: "1", identity: { provider: "firebase", subject: uid, email: null, emailVerified: true } } }),
    exchangeAccountSession: async () => ({ customToken: "custom-token-fixture" }),
    registerAccount: async () => ({ registration: { created: true, user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", acceptedTermsVersion: "1", identity: { provider: "firebase", subject: uid, email: null, emailVerified: true } }, acceptance: null } }),
    recordLegalAcceptance: async (termsVersion) => ({ acceptance: { termsVersion, acceptedAt: "2026-01-01T00:00:00.000Z" } }),
    recordPurchaseConfirmation: async (input) => ({ confirmation: { confirmationId: input.confirmationId, acceptedAt: "2026-01-01T00:00:00.000Z" } }),
    getEntitlements: async () => ({ serverObservedAt: "2026-09-21T00:00:00.000Z", entitlements: [] }),
    getProgress: async () => ({ accountRevision: 0, records: [] }),
    getContentPackage: async () => ({ status: 404, headers: new Headers(), bytes: new Uint8Array() }),
    exportAccountData: async () => { throw new Error("unused"); },
    createPrivacyRequest: async () => { throw new Error("unused"); },
    getPrivacyRequests: async () => ({ requests: [] }),
    getPrivacyRequest: async () => { throw new Error("unused"); },
    createGuestPrivacyRequest: async () => { throw new Error("unused"); },
    resendGuestPrivacyCode: async () => { throw new Error("unused"); },
    verifyGuestPrivacyCode: async () => { throw new Error("unused"); },
    readGuestPrivacyResponse: async () => { throw new Error("unused"); },
    createLegalRequest: async () => { throw new Error("unused"); },
    createPublicLegalRequest: async () => { throw new Error("unused"); },
    getLegalRequests: async () => ({ requests: [] }),
    getLegalRequest: async () => { throw new Error("unused"); },
    syncProgress: async () => ({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }),
    previewAccountAdoption: async () => { throw new Error("unused"); },
    confirmAccountAdoption: async () => { throw new Error("unused"); },
    issueRecoveryCodes: async (operationId) => ({ operationId, status: "result_available", generationId: "generation-fixture", authorizationGeneration: 1, codes: [
      "ABCD-EFGH-IJKL-MNOP", "BCDE-FGHI-JKLM-NPQR", "CDEF-GHIJ-KLMN-PQRS", "DEFG-HIJK-LMNO-QRST", "EFGH-IJKL-MNOP-RSTU",
      "FGHI-JKLM-NOPQ-STUV", "GHIJ-KLMN-OPQR-TUVW", "HIJK-LMNO-PQRS-UVWX", "IJKL-MNOP-QRST-VWXY", "JKLM-NOPQ-RSTU-WXYZ",
    ] }),
    getRecoveryCodeIssueStatus: async (operationId) => ({ operationId, status: "in_progress", authorizationGeneration: 1 }),
    acknowledgeRecoveryCodesSaved: async (operationId) => ({ operationId, status: "acknowledged", authorizationGeneration: 1 }),
    consumeRecoveryCode: async (operationId) => ({ operationId, status: "result_available", firebaseUid: uid, authorizationGeneration: 1, customToken: "custom-token-fixture" }),
    getRecoveryCodeConsumeStatus: async (operationId) => ({ operationId, status: "in_progress", authorizationGeneration: 1 }),
    acknowledgeRecoveryCodeConsumption: async (operationId) => ({ operationId, status: "acknowledged", authorizationGeneration: 1 }),
    revokeSessions: async (operationId) => ({ status: "revoked", operationId, customToken: "replacement-token" }),
    deleteAccount: async (operationId) => ({ status: "deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: "operation-fixture", proofId }),
    getDeletionOperationStatus: async (operationId) => ({ status: "remote_deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    getTracks: async () => ({ tracks: [] }),
    getContentVersions: async () => ({ versions: [] }),
    createContentReport: async () => { throw new Error("unused"); },
    getAdminContentReports: async () => ({ reports: [] }),
    transitionAdminContentReport: async () => { throw new Error("unused"); },
    ...overrides,
  };
}

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
});

test("account sync preserves known validation failures without persisting arbitrary error messages", async () => {
  for (const [message, expected] of [["account_data_fingerprint_invalid", "account_data_fingerprint_invalid"], ["sensitive unexpected detail", "remoteFailure"]]) {
    const result = await loadAccountDataSession(api({ getProgress: async () => { throw message === "account_data_fingerprint_invalid" ? new AccountDataFailure(message) : new Error(message); } }), accountId);
    assert.equal(result.lastFailureCode, expected);
    assert.equal((await getAccountSyncState()).lastFailureCode, expected);
  }
  assert.equal((await loadAccountDataSession(api(), accountId)).status, "synced");
});

test("local offline account projection is read-only and requires the exact bound account", async () => {
  let apiCalls = 0;
  const client = api({
    getProgress: async () => { apiCalls += 1; return { accountRevision: 0, records: [] }; },
    syncProgress: async () => { apiCalls += 1; return { accountRevision: 0, applied: [], duplicates: [], conflicts: [] }; },
  });
  const online = await loadAccountDataSession(client, accountId);
  assert.equal(online.status, "synced");
  const before = await getAccountSyncState();
  const callsBeforeRead = apiCalls;

  const local = await readLocalAccountDataSession(accountId);
  assert.equal(local?.status, "offlinePending");
  assert.equal(local?.pendingMutationCount, before.pendingMutationCount);
  assert.equal(local?.lastSuccessfulSyncAt, before.lastSuccessfulSyncAt);
  assert.equal(apiCalls, callsBeforeRead);
  assert.deepEqual(await getAccountSyncState(), before);

  assert.equal(await readLocalAccountDataSession("99999999-9999-4999-8999-999999999999"), null);
  await clearGuestAccountBinding();
  assert.equal(await readLocalAccountDataSession(accountId), null);
  assert.equal(apiCalls, callsBeforeRead);
});

test("current identity proof admits an unmaterialized profile without changing its data, then loads the account", async () => {
  await clearGuestAccountBinding();
  const installation = await getGuestInstallation();
  const state = await getAccountSyncState();
  assert.equal(state.accountId, null);
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), true);
  assert.deepEqual(await getGuestInstallation(), installation);
  assert.deepEqual(await getAccountSyncState(), state);
  let requests = 0;
  const loaded = await loadAccountDataSession(api({ getProgress: async () => {
    requests += 1;
    return { accountRevision: 0, records: [] };
  } }), accountId, { guestAdoption: "discard" });
  assert.equal(loaded.status, "synced");
  assert.equal(requests, 1);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal((await getAccountSyncState()).accountId, accountId);
});

test("proof without a denial still rejects stale scope and foreign account projections", async () => {
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => false }), false);
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId: "foreign-account", firebaseUid: uid, canContinue: () => true }), false);
  await clearGuestAccountBinding();
  saveAccountSyncState({ ...await getAccountSyncState(), accountId: "foreign-account" });
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), false);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId: null, lastFailureCode: "identity_denial:401:authentication_required" });
  const denied = await getAccountSyncState();
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), false);
  assert.deepEqual(await getAccountSyncState(), denied, "a denial in an unbound projection is never cleared");
  saveAccountSyncState({ ...denied, lastFailureCode: null });
  let checks = 0;
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => ++checks === 1 }), false);
});

test("a persisted authoritative identity denial is not converted to offline success, while App Check and recent-auth denials remain scoped", async () => {
  const deleted = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 404, "account_not_found"); },
  }), accountId);
  assert.equal(deleted.status, "failed");
  assert.equal(deleted.lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal((await getAccountSyncState()).lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal(await readLocalAccountDataSession(accountId), null, "a later cold transport fallback cannot mask a known missing identity");

  let retryCalls = 0;
  const retried = await retryAccountDataSync(api({ getProgress: async () => { retryCalls += 1; throw new PatternlyApiClientError("transport_failed"); } }), accountId);
  assert.equal(retried.lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal(retryCalls, 0, "a transport retry cannot clear or replace the durable identity-denial marker");
  assert.equal(await readLocalAccountDataSession(accountId), null);
  saveAccountSyncState({ ...await getAccountSyncState(), status: "offlinePending" });
  const pendingRetry = await retryPendingAccountDataSync(api({ getProgress: async () => { retryCalls += 1; throw new PatternlyApiClientError("transport_failed"); } }), accountId);
  assert.equal(pendingRetry?.lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal(retryCalls, 0, "Home's pending retry also checks the marker before entering the network path");
  assert.equal(await readLocalAccountDataSession(accountId), null);
  const positiveSyncWithoutIdentityProof = await retryAccountDataSync(api({
    getProgress: async () => { retryCalls += 1; return { accountRevision: 0, records: [] }; },
  }), accountId);
  assert.equal(positiveSyncWithoutIdentityProof.lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal(retryCalls, 0, "a progress response cannot clear an identity denial without a fresh /me proof");

  let currentProof = false;
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => currentProof }), false);
  assert.equal((await getAccountSyncState()).lastFailureCode, "identity_denial:404:account_not_found");
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId: "different-account", firebaseUid: uid, canContinue: () => true }), false);
  assert.equal((await getAccountSyncState()).lastFailureCode, "identity_denial:404:account_not_found");
  currentProof = true;
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => currentProof }), true);
  assert.equal((await getAccountSyncState()).lastFailureCode, null, "only an explicit current proof callback clears the marker");

  const appCheck = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 401, "app_check_invalid"); },
  }), accountId);
  assert.equal(appCheck.lastFailureCode, "app_check_invalid");
  assert.equal((await readLocalAccountDataSession(accountId))?.status, "offlinePending", "App Check denial is not treated as account revocation");

  const recentAuthentication = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 401, "recent_reauthentication_required"); },
  }), accountId);
  assert.equal(recentAuthentication.lastFailureCode, "reauthentication_required");
  assert.equal((await readLocalAccountDataSession(accountId))?.status, "offlinePending", "a recent-auth requirement for another command is not global identity revocation");

  const clientAuthenticationRequired = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("authentication_required"); },
  }), accountId);
  assert.equal(clientAuthenticationRequired.lastFailureCode, "authentication_required");
  assert.equal((await getAccountSyncState()).lastFailureCode, "authentication_required", "client-only auth absence is not mislabeled as an authoritative server denial");
  assert.equal((await readLocalAccountDataSession(accountId))?.status, "offlinePending");

  const serverAuthenticationRequired = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 401, "authentication_required"); },
  }), accountId);
  assert.equal(serverAuthenticationRequired.lastFailureCode, "identity_denial:401:authentication_required");
  assert.equal(await readLocalAccountDataSession(accountId), null, "the same code from an authoritative server 401 is fail-closed");
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), true);

  const wrongStatusIdentityCode = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 404, "authentication_required"); },
  }), accountId);
  assert.equal(wrongStatusIdentityCode.lastFailureCode, "authentication_required");
  assert.equal((await readLocalAccountDataSession(accountId))?.status, "offlinePending", "a code/status mismatch is not treated as an identity denial");

  const wrongDeletionStatus = await loadAccountDataSession(api({
    getProgress: async () => { throw new PatternlyApiClientError("server_error", 404, "account_deleted"); },
  }), accountId);
  assert.equal(wrongDeletionStatus.lastFailureCode, "account_deleted");
  assert.equal((await readLocalAccountDataSession(accountId))?.status, "offlinePending", "only the authoritative account_deleted status revokes the local projection");

  saveAccountSyncState({ ...await getAccountSyncState(), status: "offlinePending", lastFailureCode: "revokedSession" });
  assert.equal(await readLocalAccountDataSession(accountId), null, "legacy revokedSession state has no preserved issuer and remains fail-closed");
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => false }), false);
  assert.equal((await getAccountSyncState()).lastFailureCode, "revokedSession", "a stale proof cannot clear the legacy fail-closed marker");
  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), true);
  assert.equal((await getAccountSyncState()).lastFailureCode, null, "a current exact proof owner may clear the legacy marker");
});

test("identity denial retries preserve pending local mutations and an exact proof clear changes no sync facts", async () => {
  const { state: seeded } = await prepareBoundLearningDatasetWithOutbox();
  const denied = saveAccountSyncState({ ...seeded, status: "offlinePending", lastFailureCode: "identity_denial:401:authentication_required" });
  assert.ok(denied.outbox.length > 0);
  let requests = 0;
  const client = api({
    getProgress: async () => { requests += 1; return { accountRevision: 4, records: [] }; },
    syncProgress: async () => { requests += 1; return { accountRevision: 4, applied: [], duplicates: [], conflicts: [] }; },
  });

  const cold = await retryAccountDataSync(client, accountId);
  assert.equal(cold.lastFailureCode, "identity_denial:401:authentication_required");
  const homeRetry = await retryPendingAccountDataSync(client, accountId);
  assert.equal(homeRetry?.lastFailureCode, "identity_denial:401:authentication_required");
  assert.equal(requests, 0, "neither cold sync nor Home retry can send or overwrite denied mutations");
  assert.deepEqual((await getAccountSyncState()).outbox, denied.outbox);

  assert.equal(await clearAccountIdentityDenialAfterProof({ accountId, firebaseUid: uid, canContinue: () => true }), true);
  const afterProof = await getAccountSyncState();
  assert.equal(afterProof.lastFailureCode, null);
  assert.deepEqual(afterProof.outbox, denied.outbox);
  assert.equal(afterProof.localDatasetVersion, denied.localDatasetVersion);
  assert.deepEqual(afterProof.pendingConfirmation, denied.pendingConfirmation);
  assert.equal(afterProof.blockingConflictCode, denied.blockingConflictCode);
  assert.equal(afterProof.remoteAccountRevision, denied.remoteAccountRevision);
});

test("deletion retries after a revoked or stale session and leaves a verified local tombstone", async () => {
  let deleteCalls = 0;
  let statusCalls = 0;
  let observedOperationId = "";
  const client = api({
    deleteAccount: async () => {
      deleteCalls += 1;
      throw new PatternlyApiClientError("server_error", 401, "account_deleted");
    },
    getDeletionOperationStatus: async (operationId, operationSecret) => {
      statusCalls += 1;
      observedOperationId = operationId;
      assert.match(operationSecret, /^[0-9a-f]{64}$/iu);
      return { status: "remote_deleted", operationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: observedOperationId, proofId }),
  });

  const result = await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState);
  assert.deepEqual(result, { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(deleteCalls, 1);
  assert.equal(statusCalls, 1);
  assert.equal(getAccountDeletionState()?.status, "complete");
  assert.equal(getAccountDeletionState()?.accountUidHash, sha256Utf8(uid));
  assert.match(getAccountDeletionState()?.operationSecret ?? "", /^[0-9a-f]{64}$/iu);
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal((await getAccountSyncState()).accountId, null);

  // A later app start can identify this UID as deleted without relying on a stale bearer token.
  assert.equal(getAccountDeletionState()?.status, "complete");
});

test("deletion cleanup removes the complete canonical learning namespace while preserving device records and recovery markers", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const learningKeys = [
    STORAGE_KEYS.ACTIVE_TRACK,
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
    STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
    STORAGE_KEYS.TRAINING_SESSION_INDEX,
    STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
    STORAGE_KEYS.REVIEW_INDEX,
    STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
    STORAGE_KEYS.ACCOUNT_SYNC,
    STORAGE_KEYS.trainingSession("orphan-session"),
    STORAGE_KEYS.trainingSessionResult("orphan-result"),
    STORAGE_KEYS.trainingAttempt("orphan-attempt"),
    STORAGE_KEYS.reviewEntry("orphan-review"),
    STORAGE_KEYS.goal("orphan-goal"),
    STORAGE_KEYS.learningPlan("orphan-plan"),
  ];
  for (const key of learningKeys) storage.setString(key, "learning");
  storage.setString(STORAGE_KEYS.SETTINGS, "device-settings");
  storage.setString(STORAGE_KEYS.NOTIFICATION_SETTINGS, "device-notifications");
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, "journal-must-remain");
  const marker = beginAccountDeletion(accountId, uid);
  const installationBefore = await getGuestInstallation();

  await clearAccountDeletionOwnedLocalData();

  for (const key of learningKeys) assert.equal(storage.contains(key), false, key);
  assert.equal(storage.getString(STORAGE_KEYS.SETTINGS), "device-settings");
  assert.equal(storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS), "device-notifications");
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), "journal-must-remain");
  assert.deepEqual(await getGuestInstallation(), installationBefore);
  assert.deepEqual(getAccountDeletionState(), marker);
});

test("a completed marker from an earlier account does not block a later bound account", async () => {
  const nextAccountId = "88888888-8888-4888-8888-888888888888";
  await clearGuestAccountBinding();
  await bindGuestInstallationToAccount(nextAccountId);
  markAccountDeletionComplete(beginAccountDeletion(accountId, uid));

  const next = await loadAccountDataSession(api(), nextAccountId);

  assert.equal(next.status, "synced");
  assert.equal(getAccountDeletionState(), null);
  assert.equal((await getGuestInstallation())?.accountId, nextAccountId);
});

test("a preflight journal failure does not create a deletion operation and pending retry cannot start one", async () => {
  await persistMutationJournal(makeJournal([
    { kind: "put_attempt", record: journalAttempt() },
    { kind: "put_session", record: journalSession() },
  ]));
  let deleteCalls = 0;
  const client = api({ deleteAccount: async (operationId) => { deleteCalls++; return { status: "deleted", operationId, proofId: "proof_fixture_12345678901234567890" }; } });

  const first = await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState);
  assert.deepEqual(first, { ok: false, failure: "journalRecoveryFailure" });
  assert.equal(getAccountDeletionState(), null);
  assert.equal(await retryPendingAccountDeletion(client, accountId, uid, prepareDeletionLocalState), null);
  assert.equal(deleteCalls, 0);
});

test("response loss resolves a matching remote operation and rejects mismatched status without local cleanup", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const orphanKey = STORAGE_KEYS.trainingSession("response-loss-orphan");
  storage.setString(orphanKey, "orphan");
  let operationId = "";
  let statusCalls = 0;
  const client = api({
    deleteAccount: async (requestedOperationId) => {
      operationId = requestedOperationId;
      throw new PatternlyApiClientError("transport_failed");
    },
    getDeletionOperationStatus: async (requestedOperationId) => {
      statusCalls++;
      return { status: "remote_deleted", operationId: requestedOperationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId, proofId }),
  });

  assert.deepEqual(await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(statusCalls, 1);
  assert.equal(storage.contains(orphanKey), false);
  assert.equal(getAccountDeletionState()?.status, "complete");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
  const mismatchStorage = getKeyValueStorage() as MemoryKeyValueStorage;
  const mismatchKey = STORAGE_KEYS.goal("mismatch-goal");
  mismatchStorage.setString(mismatchKey, "must-remain");
  beginAccountDeletion(accountId, uid);
  let mismatchDeleteCalls = 0;
  const mismatchClient = api({
    deleteAccount: async () => { mismatchDeleteCalls++; throw new PatternlyApiClientError("transport_failed"); },
    getDeletionOperationStatus: async (requestedOperationId) => ({ status: "remote_deleted", operationId: `${requestedOperationId}-other`, proofId: "proof_fixture_12345678901234567890" }),
  });
  const mismatch = await retryPendingAccountDeletion(mismatchClient, accountId, uid, prepareDeletionLocalState);
  assert.deepEqual(mismatch, { ok: false, failure: "pendingSyncRequiresNetwork" });
  assert.equal(mismatchDeleteCalls, 1);
  assert.equal(mismatchStorage.contains(mismatchKey), true);
  assert.notEqual(getAccountDeletionState()?.status, "complete");
});

test("local deletion cleanup resumes after a failed key removal without issuing another remote delete", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const orphanKey = STORAGE_KEYS.trainingSession("cleanup-retry-orphan");
  storage.setString(orphanKey, "orphan");
  let operationId = "";
  let deleteCalls = 0;
  const client = api({
    deleteAccount: async (requestedOperationId) => {
      deleteCalls++;
      operationId = requestedOperationId;
      return { status: "deleted", operationId: requestedOperationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId, proofId }),
  });

  storage.setFailurePlan({ kind: "fail_on_key_remove", key: orphanKey });
  assert.deepEqual(await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState), { ok: false, failure: "localCleanupFailure" });
  assert.equal(getAccountDeletionState()?.status, "localCleanupPending");
  storage.setFailurePlan(null);
  assert.deepEqual(await retryPendingAccountDeletion(client, accountId, uid, prepareDeletionLocalState), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(deleteCalls, 1);
  assert.equal(storage.contains(orphanKey), false);
  assert.equal(getAccountDeletionState()?.status, "complete");
});

test("account deletion remains pending until reminders are disabled and retry does not repeat remote deletion", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const learningKey = STORAGE_KEYS.trainingSession("reminder-cleanup-session");
  storage.setString(learningKey, "must-remain-until-reminders-are-disabled");
  let operationId = "";
  let deleteCalls = 0;
  let preparationCalls = 0;
  const client = api({
    deleteAccount: async (requestedOperationId) => {
      deleteCalls++;
      operationId = requestedOperationId;
      return { status: "deleted", operationId: requestedOperationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId, proofId }),
  });

  const preparationFails = async () => {
    preparationCalls++;
    return false;
  };
  assert.deepEqual(await deleteBoundAccount(client, accountId, uid, preparationFails), { ok: false, failure: "localCleanupFailure" });
  assert.equal(preparationCalls, 1);
  assert.equal(deleteCalls, 1);
  assert.equal(getAccountDeletionState()?.status, "localCleanupPending");
  assert.equal(getAccountDeletionState()?.lastFailureCode, "account_deletion_local_preparation_failed");
  assert.equal(storage.contains(learningKey), true);
  assert.equal((await getGuestInstallation())?.accountId, accountId);

  const preparationSucceeds = async () => {
    preparationCalls++;
    return true;
  };
  assert.deepEqual(await retryPendingAccountDeletion(client, accountId, uid, preparationSucceeds), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(preparationCalls, 2);
  assert.equal(deleteCalls, 1);
  assert.equal(storage.contains(learningKey), false);
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal(getAccountDeletionState()?.status, "complete");
});

test("server reauthentication failures remain reauthentication failures with the pending marker intact", async () => {
  const client = api({ deleteAccount: async () => { throw new PatternlyApiClientError("server_error", 400, "recent_reauthentication_required"); } });
  const result = await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState);
  assert.deepEqual(result, { ok: false, failure: "reauthenticationRequired" });
  assert.equal(getAccountDeletionState()?.status, "remotePending");
});

test("an invalid deletion acknowledgement keeps the same operation pending until an explicit retry verifies proof", async () => {
  const learningSession = guestSession("abandoned");
  const proofId = "proof_abcdefghijklmnopqrstuvwx";
  const deletionRequests: Array<Readonly<{ operationId: string; operationSecret: string }>> = [];
  let deletionStatusCalls = 0;
  let proofCalls = 0;
  const transport = createPatternlyApiClient({
    apiOrigin: "https://api.sandbox.patternly.invalid",
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => "app-check-token",
    fetchImplementation: async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === "/v1/account/deletion") {
        const body = JSON.parse(String(init?.body)) as { operationId: string; operationSecret: string };
        deletionRequests.push(body);
        if (deletionRequests.length === 1) {
          assert.equal(getAccountDeletionState()?.status, "remotePending");
          await saveTrainingSession(learningSession);
          assert.ok((await getTrainingSessions()).value.some((session) => session.id === learningSession.id));
        }
        const response = deletionRequests.length === 1
          ? { status: "pending", operationId: body.operationId, proofId: 17 }
          : { status: "deleted", operationId: body.operationId, proofId };
        return new Response(JSON.stringify(response), { status: 200 });
      }
      if (url.pathname === "/v1/public/deletion-operations/status") {
        deletionStatusCalls += 1;
        return new Response(JSON.stringify({ status: "remote_deleted", operationId: deletionRequests.at(-1)?.operationId, proofId }), { status: 200 });
      }
      if (url.pathname === `/v1/public/deletion-proofs/${proofId}`) {
        proofCalls += 1;
        return new Response(JSON.stringify({ status: "deleted", operationId: deletionRequests.at(-1)?.operationId, proofId }), { status: 200 });
      }
      throw new Error("unexpected deletion transport path");
    },
  });
  const client = api({
    deleteAccount: transport.deleteAccount,
    getDeletionProof: transport.getDeletionProof,
    getDeletionOperationStatus: transport.getDeletionOperationStatus,
  });

  assert.deepEqual(await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState), { ok: false, failure: "remoteDeletionPending" });
  const unresolved = getAccountDeletionState();
  assert.equal(unresolved?.status, "remotePending");
  assert.equal(unresolved?.lastFailureCode, "invalid_response");
  assert.ok((await getTrainingSessions()).value.some((session) => session.id === learningSession.id), "learning progress stays available until proof is verified");
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal(deletionStatusCalls, 0, "a malformed success is not silently reconciled or retried");
  assert.equal(proofCalls, 0, "an unvalidated acknowledgement cannot authorize proof or cleanup");
  assert.equal(deletionRequests.length, 1);

  assert.deepEqual(await retryPendingAccountDeletion(client, accountId, uid, prepareDeletionLocalState), { ok: true, proofId });
  assert.equal(deletionRequests.length, 2, "only the explicit retry sends the idempotent request again");
  assert.deepEqual(deletionRequests[1], deletionRequests[0], "the retry reuses the exact operation ID and secret");
  assert.equal(deletionStatusCalls, 0);
  assert.equal(proofCalls, 1);
  assert.ok(!(await getTrainingSessions()).value.some((session) => session.id === learningSession.id), "verified deletion removes canonical learning progress");
  assert.equal(getAccountDeletionState()?.status, "complete");
});

test("an uncertain server deletion failure resolves through the bound operation status", async () => {
  let operationId = "";
  let statusCalls = 0;
  const client = api({
    deleteAccount: async (requestedOperationId) => {
      operationId = requestedOperationId;
      throw new PatternlyApiClientError("server_error", 500, "internal_error");
    },
    getDeletionOperationStatus: async (requestedOperationId) => {
      statusCalls++;
      return { status: "remote_deleted", operationId: requestedOperationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId, proofId }),
  });

  assert.deepEqual(await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(statusCalls, 1);
});

// The discard path uses the real repositories and injected durable storage faults.
import { abandonTrainingSession, acceptedTargetFromGoal, completeTrainingSession, createDefaultGoal, createFamilyEnvelope, createLearningPlan, createLearningPlanSlotId, createTrainingSession, createTrainingSessionDraft, createTrainingSessionResult } from "../../domain";
import { commitSessionCompletion } from "../learningMutations/commitSessionLifecycle";
import { commitTrainingSessionStart } from "../learningMutations/commitTrainingSessionStart";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import { discardGuestDataAndLoadAccount, retryLearningPlanRecovery } from "./accountDataService";
import { persistGoal } from "../learningReadModels";
import { LearningPlanEditorCoordinator } from "../learningPlan/LearningPlanEditorCoordinator";
import type { LearningPlanProposalCoordinator } from "../learningPlan/LearningPlanProposalCoordinator";
import { getActiveTrackId, saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { clearTrainingSessions, getActiveTrainingSession, getTrainingSessions, saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { addTrainingAttempt, getTrainingAttempts } from "../../storage/repositories/trainingAttemptRepository";
import { getTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { clearActiveTrainingSessionDraft, getActiveTrainingSessionDraft, saveTrainingSessionDraft as persistTrainingSessionDraft } from "../../storage/repositories/trainingSessionDraftRepository";
import { accountDataRecordFingerprint, buildAccountDataSnapshot, ensureAccountOutboxFromLocalDataset, getAccountSyncState, isCanonicalAccountSyncState, saveAccountSyncState, saveGuestAdoptionChoice } from "../../storage/repositories/accountDataRepository";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { getGoalSnapshot, readGoalSnapshot, saveGoal, saveGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot, saveLearningPlanAtomically } from "../../storage/repositories/learningPlanRepository";
import { readLearningPlanStorageScope } from "../../storage/repositories/learningPlanInputSnapshot";
import { attempt as journalAttempt, journal as makeJournal, session as journalSession } from "../../testing/journalTestSupport";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { Question } from "../../content/canonical/questionTypes";
import { commitSessionAbandonment, commitTrainingOutcome } from "../learningMutations";
import { getReviewQueueItems } from "../../storage/repositories/reviewQueueRepository";

const guestTrack = "coding-interview-dsa-problem-solving" as const;
async function prepareGuest() {
  await clearGuestAccountBinding();
  await saveActiveTrackId(guestTrack);
  return getKeyValueStorage() as MemoryKeyValueStorage;
}
function guestSession(status: "active" | "abandoned") {
  return createTrainingSession({
    id: "guest-session", trackId: guestTrack, modeId: "guided", configurationSnapshot: { kind: "practice" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "one", item: { trackId: guestTrack, questionId: "two-sum-001", contentVersion: "test", artifactSha256: TEST_ARTIFACT_SHA256 } }],
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test", artifactSha256: TEST_ARTIFACT_SHA256,
    status, startedAt: "2026-01-01T00:00:00.000Z",
  });
}

function resumableSession() {
  return createTrainingSession({
    id: "resumable-session", trackId: guestTrack, modeId: "guided",
    configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "practice", submission: "manualOrForegroundTimeout" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "resumable-occurrence", item: { trackId: guestTrack, questionId: "two-sum-001", contentVersion: "test", artifactSha256: TEST_ARTIFACT_SHA256 } }],
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test", artifactSha256: TEST_ARTIFACT_SHA256,
    status: "active", startedAt: "2026-01-01T00:00:00.000Z",
  });
}

async function persistResumableAnswer(session: ReturnType<typeof resumableSession>) {
  return persistTrainingSessionDraft(createTrainingSessionDraft({
    sessionId: session.id, trackId: session.trackId,
    responsesByOccurrenceId: { "resumable-occurrence": { selectedOptionIds: ["option-a"] } },
    flaggedOccurrenceIds: [], updatedAt: "2026-01-01T00:01:00.000Z",
  }), null);
}

function remoteRecords(snapshot: Awaited<ReturnType<typeof buildAccountDataSnapshot>>) {
  return snapshot.records.map((record) => ({
    ...record,
    kind: record.recordType === "training_attempt" || record.recordType === "review_queue_entry" ? "item" as const : "node" as const,
    targetId: record.recordId,
    lastMutationId: `remote-${record.recordId}`,
    updatedAt: "2026-01-01T00:02:00.000Z",
  }));
}

function makeAppliedRecords(mutations: readonly ProgressMutationDto[]): ProgressRecordDto[] {
  return mutations.map((mutation) => ({
    kind: mutation.recordType === "training_attempt" || mutation.recordType === "review_queue_entry" ? "item" : "node",
    recordType: mutation.recordType,
    trackId: mutation.trackId,
    targetId: mutation.targetId,
    version: (mutation.expectedVersion ?? 0) + 1,
    fingerprint: mutation.fingerprint,
    state: mutation.state,
    lastMutationId: mutation.mutationId,
    updatedAt: "2026-10-08T10:00:00.000Z",
  }));
}

function apiWithAppliedUpload(readRemote: () => Promise<{ accountRevision: number; generation?: number; records: readonly ProgressRecordDto[] }>): PatternlyApiClient {
  let applied: ProgressRecordDto[] = [];
  return api({
    syncProgress: async (input) => {
      applied = makeAppliedRecords(input.mutations);
      return { accountRevision: input.expectedAccountRevision + applied.length, applied, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      const remote = await readRemote();
      const acknowledgedByKey = new Map(applied.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      return { ...remote, records: remote.records.map((record) => acknowledgedByKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record) };
    },
  });
}

function realPlanEditorForTest(): LearningPlanEditorCoordinator {
  let editorSequence = 0;
  const contentContext = (trackId: typeof guestTrack) => {
    const snapshot = getLearningPlanSnapshot(trackId);
    if (!snapshot) throw new Error("P18 plan fixture is missing.");
    return Object.freeze({ contentVersion: snapshot.plan.contentVersion, artifactSha256: snapshot.plan.artifactSha256, timezone: snapshot.plan.timezone });
  };
  return new LearningPlanEditorCoordinator({
    proposalCoordinator: {} as unknown as LearningPlanProposalCoordinator,
    readStorageScope: readLearningPlanStorageScope,
    readGoalSnapshot,
    peekContentContext: contentContext,
    loadGoalSnapshot: getGoalSnapshot,
    loadLearningPlanSnapshot: getLearningPlanSnapshot,
    loadContentContext: async (trackId) => contentContext(trackId as typeof guestTrack),
    saveLearningPlan: saveLearningPlanAtomically,
    createEditorId: () => `p18-editor:${++editorSequence}`,
    now: () => "2026-10-08T10:00:00.000Z",
  });
}

function adoptionPreview(
  snapshot: Awaited<ReturnType<typeof buildAccountDataSnapshot>>,
  conflictRecord = snapshot.records[0],
): AdoptionPreviewResponseDto {
  if (!conflictRecord) throw new Error("adoption preview requires a guest record");
  const records = remoteRecords(snapshot);
  return {
    preview: {
      accountSnapshotVersion: 4,
      accountUserId: accountId,
      conflicts: [{
        accountVersion: 3,
        conflictId: "active-track-conflict",
        guestVersion: conflictRecord.version,
        recordId: conflictRecord.recordId,
        recordType: conflictRecord.recordType,
      }],
      fingerprint: "profile-04-preview-fingerprint",
      guestSnapshotVersion: snapshot.guestSnapshotVersion,
      guestUserId: snapshot.guestUserId,
      operationId: "profile-04-adoption-operation",
      goalPlanConflictGroups: [],
    },
    plan: {
      caseId: "divergentRecord",
      localRecordCount: snapshot.records.length,
      remoteRecordCount: records.length,
      uploadRecordIds: [],
      restoreRecordIds: [],
      deduplicatedRecordIds: [],
      conflictRecordIds: ["active-track-conflict"],
      blockingReason: null,
    },
    remoteRecords: records,
  };
}

async function prepareBoundSyncedAccount(): Promise<void> {
  await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
}

async function prepareBoundLearningDatasetWithOutbox() {
  await prepareBoundSyncedAccount();
  const { completed } = await commitTerminalLearningOutcome();
  const attempt = journalAttempt("p18-sync-attempt", completed.id);
  const item = Object.freeze({ ...completed.itemOrder[0]!.item });
  await addTrainingAttempt(Object.freeze({
    ...attempt,
    modeId: completed.modeId,
    occurrenceId: completed.itemOrder[0]!.occurrenceId,
    item,
    reviewEvidence: Object.freeze({ ...attempt.reviewEvidence, sourceItem: item }),
  }));
  const goal = createDefaultGoal(guestTrack);
  const goalSnapshot = await saveGoalSnapshot(goal, null);
  const plan = createLearningPlan({
    schemaVersion: 1,
    planId: "plan:p18-ack-coverage",
    trackId: guestTrack,
    goalRevision: goalSnapshot.revision,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "p18-fixture",
    artifactSha256: TEST_ARTIFACT_SHA256,
    acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: "2026-10-08T09:00:00.000Z",
    updatedAt: "2026-10-08T09:00:00.000Z",
    planRevision: 1,
    commandId: "command:p18-ack-coverage",
    slots: [{ slotId: createLearningPlanSlotId("p18-ack-coverage-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan, expectedGoalRevision: goalSnapshot.revision, expectedPlanStorageRevision: null });
  await ensureAccountOutboxFromLocalDataset();
  const snapshot = await buildAccountDataSnapshot();
  assert.ok(snapshot.records.some((record) => record.recordType === "training_attempt"));
  assert.ok(snapshot.records.some((record) => record.recordType === "goal"));
  assert.ok(snapshot.records.some((record) => record.recordType === "learning_plan"));
  assert.ok(snapshot.records.some((record) => record.recordType === "training_session_result"));
  const state = await getAccountSyncState();
  assert.ok(state.outbox.length > 1, "the fixture must have multiple upload mutations to check complete ACK coverage");
  return { snapshot, state };
}

async function commitTerminalLearningOutcome() {
  const active = resumableSession();
  await saveTrainingSession(active);
  const completed = completeTrainingSession(active, "2026-01-01T00:03:00.000Z");
  const result = createTrainingSessionResult({
    id: `${completed.id}:result`,
    sessionId: completed.id,
    trackId: completed.trackId,
    totalOccurrences: completed.actualLength,
    answeredOccurrenceIds: completed.itemOrder.map((occurrence) => occurrence.occurrenceId),
    unansweredOccurrenceIds: [],
    completedAt: completed.completedAt!,
    evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { source: "account-lifecycle-test" } }),
  });
  await commitSessionCompletion(completed, result, completed.completedAt!);
  return { active, completed, result };
}

test("a durable terminal learning commit uploads once when Home retries pending data", async () => {
  await prepareBoundSyncedAccount();
  const { completed } = await commitTerminalLearningOutcome();
  const durable = await buildAccountDataSnapshot();
  assert.equal(durable.activeSession, false);
  assert.ok(durable.records.some((record) => record.recordType === "training_session_result" && record.recordId === `${completed.id}:result`));
  assert.equal((await getAccountSyncState()).status, "offlinePending");
  const remoteSnapshot = await buildAccountDataSnapshot();

  let uploads = 0;
  let reads = 0;
  let duplicateRecords: ProgressRecordDto[] = [];
  const client = api({
    syncProgress: async (input) => {
      uploads++;
      assert.ok(input.mutations.some((mutation) => mutation.recordType === "training_session_result"));
      duplicateRecords = makeAppliedRecords(input.mutations).map((record) => ({ ...record, version: 7 }));
      return { accountRevision: 7, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] };
    },
    getProgress: async () => {
      reads++;
      const byKey = new Map(duplicateRecords.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      const records = remoteRecords(remoteSnapshot).map((record) => {
        const duplicate = byKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`);
        return duplicate ? { ...record, ...duplicate } : record;
      });
      return { accountRevision: 7, records };
    },
  });

  const first = await retryPendingAccountDataSync(client, accountId);
  const second = await retryPendingAccountDataSync(client, accountId);
  assert.equal(first?.status, "synced");
  assert.equal(second, null);
  assert.equal(uploads, 1);
  assert.equal(reads, 1);
  assert.equal((await getAccountSyncState()).status, "synced");
  assert.equal((await getAccountSyncState()).outbox.length, 0);
  assert.ok(Object.values((await getAccountSyncState()).acknowledged).some((record) => record.remoteVersion === 7), "a duplicate is acknowledged only from its exact server record/version");
});

test("concurrent Home retries share one offline attempt and preserve durable pending state", async () => {
  await prepareBoundSyncedAccount();
  await commitTerminalLearningOutcome();

  let uploads = 0;
  let releaseUpload!: () => void;
  const uploadStarted = new Promise<void>((resolve) => { releaseUpload = resolve; });
  const client = api({
    syncProgress: async () => {
      uploads++;
      await uploadStarted;
      throw new PatternlyApiClientError("transport_failed");
    },
    getProgress: async () => { throw new Error("offline retry must not continue to a remote read"); },
  });

  const firstAttempt = retryPendingAccountDataSync(client, accountId);
  const secondAttempt = retryPendingAccountDataSync(client, accountId);
  assert.equal(secondAttempt, firstAttempt);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.equal(uploads, 1);
  releaseUpload();
  const [first, second] = await Promise.all([firstAttempt, secondAttempt]);
  assert.equal(first?.status, "offlinePending");
  assert.equal(second?.status, "offlinePending");
  assert.equal((await getAccountSyncState()).status, "offlinePending");
});

test("an unconfirmed duplicate upload stays explicit and keeps its outbox", async () => {
  await prepareBoundSyncedAccount();
  await commitTerminalLearningOutcome();
  await ensureAccountOutboxFromLocalDataset();
  const remoteSnapshot = await buildAccountDataSnapshot();
  const before = await getAccountSyncState();
  const result = await retryPendingAccountDataSync(api({
    syncProgress: async (input) => ({ accountRevision: 9, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] }),
    // The records omit the duplicate mutation IDs, so a fresh GET cannot
    // prove which exact versions the server accepted.
    getProgress: async () => ({ accountRevision: 9, records: remoteRecords(remoteSnapshot) }),
  }), accountId);

  assert.equal(result?.status, "conflict");
  assert.equal(result?.lastFailureCode, "duplicate_ack_unverified");
  const after = await getAccountSyncState();
  assert.ok(after.outbox.length > 0);
  assert.deepEqual(after.outbox, before.outbox);
  assert.equal(after.lastSuccessfulSyncAt, null);
});

test("bound sync stops on an account revision conflict before acknowledging, downloading, or materializing", async () => {
  const { snapshot, state: beforeState } = await prepareBoundLearningDatasetWithOutbox();
  let uploads = 0;
  let downloads = 0;
  const result = await retryPendingAccountDataSync(api({
    syncProgress: async () => {
      uploads++;
      return {
        accountRevision: 7,
        applied: [],
        duplicates: [],
        conflicts: [],
        accountRevisionConflict: { code: "account_revision_conflict", currentAccountRevision: 8 },
      };
    },
    getProgress: async () => { downloads++; throw new Error("account revision conflict must stop before GET"); },
  }), accountId);

  assert.equal(result?.status, "conflict");
  assert.equal(result?.lastFailureCode, "account_revision_conflict");
  assert.equal(result?.blockingConflictCode, "account_revision_conflict");
  assert.equal(uploads, 1);
  assert.equal(downloads, 0);
  const afterState = await getAccountSyncState();
  assert.equal(afterState.status, "conflict");
  assert.equal(afterState.materialization, null);
  assert.deepEqual(afterState.outbox, beforeState.outbox);
  assert.ok(afterState.outbox.length > 0);
  assert.deepEqual((await buildAccountDataSnapshot()).records, snapshot.records);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getTrainingSessions()).value.some((session) => session.id === "resumable-session" && session.status === "completed"), true);
  assert.equal(getLearningPlanSnapshot(guestTrack)?.plan.planId, "plan:p18-ack-coverage");
  assert.equal((await getGoalSnapshot(guestTrack))?.record.trackId, guestTrack);
});

test("bound sync rejects incomplete applied and duplicate ACK coverage before GET or local ACK writes", async () => {
  const { snapshot, state: beforeState } = await prepareBoundLearningDatasetWithOutbox();
  let downloads = 0;
  let uploadedMutationCount = 0;
  const result = await retryPendingAccountDataSync(api({
    syncProgress: async (input) => {
      uploadedMutationCount = input.mutations.length;
      assert.ok(uploadedMutationCount > 1);
      return { accountRevision: 1, applied: makeAppliedRecords(input.mutations.slice(0, 1)), duplicates: [], conflicts: [] };
    },
    getProgress: async () => { downloads++; throw new Error("incomplete ACK coverage must stop before GET"); },
  }), accountId);

  assert.equal(result?.status, "failed");
  assert.equal(result?.lastFailureCode, "invalid_response");
  assert.equal(uploadedMutationCount, beforeState.outbox.length);
  assert.equal(downloads, 0);
  const afterState = await getAccountSyncState();
  assert.equal(afterState.materialization, null);
  assert.deepEqual(afterState.outbox, beforeState.outbox);
  assert.ok(afterState.outbox.length > 0);
  assert.ok(afterState.syncPlan?.items.every((item) => item.status === "pending"), "partial server ACKs cannot be persisted as local acknowledgements");
  assert.deepEqual((await buildAccountDataSnapshot()).records, snapshot.records);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getTrainingSessions()).value.some((session) => session.id === "resumable-session" && session.status === "completed"), true);
  assert.equal(getLearningPlanSnapshot(guestTrack)?.plan.planId, "plan:p18-ack-coverage");
  assert.equal((await getGoalSnapshot(guestTrack))?.record.trackId, guestTrack);
});

async function assertConcurrentLocalSessionStartKeepsHomeSyncRetryable(phase: "upload" | "download"): Promise<void> {
  await prepareBoundSyncedAccount();
  await commitTerminalLearningOutcome();

  let uploads = 0;
  let releaseNetwork!: () => void;
  let networkStarted!: () => void;
  const networkReady = new Promise<void>((resolve) => { networkStarted = resolve; });
  const networkPaused = new Promise<void>((resolve) => { releaseNetwork = resolve; });
  const remote = remoteRecords(await buildAccountDataSnapshot());
  const client = api({
    syncProgress: async (input) => {
      uploads++;
      if (phase === "upload") {
        networkStarted();
        await networkPaused;
      }
      return { accountRevision: 7, applied: makeAppliedRecords(input.mutations), duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      if (phase === "download") {
        networkStarted();
        await networkPaused;
      }
      return { accountRevision: 7, records: remote };
    },
  });

  const retry = retryPendingAccountDataSync(client, accountId);
  await networkReady;
  assert.equal(uploads, 1);

  const nextSession = createTrainingSession({ ...resumableSession(), id: "concurrent-session", configurationSnapshot: { kind: "practice" } });
  await commitTrainingSessionStart({ session: nextSession, draft: null, createdAt: nextSession.startedAt });
  releaseNetwork();

  const interrupted = await retry;
  assert.equal(interrupted?.status, "resumeRequired");
  assert.equal((await getAccountSyncState()).status, "offlinePending");
  assert.deepEqual(await getActiveTrainingSession(), nextSession);

  const completed = completeTrainingSession(nextSession, "2026-01-01T00:04:00.000Z");
  await commitSessionCompletion(completed, createTrainingSessionResult({
    id: `${completed.id}:result`,
    sessionId: completed.id,
    trackId: completed.trackId,
    totalOccurrences: completed.actualLength,
    answeredOccurrenceIds: completed.itemOrder.map((occurrence) => occurrence.occurrenceId),
    unansweredOccurrenceIds: [],
    completedAt: completed.completedAt!,
    evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { source: "concurrent-session-test" } }),
  }), completed.completedAt!);

  let resumedApplied: ProgressRecordDto[] = [];
  const resumed = await retryPendingAccountDataSync(api({
    syncProgress: async (input) => { uploads++; resumedApplied = makeAppliedRecords(input.mutations); return { accountRevision: 8, applied: resumedApplied, duplicates: [], conflicts: [] }; },
    getProgress: async () => {
      const acknowledgedByKey = new Map(resumedApplied.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      const records = remoteRecords(await buildAccountDataSnapshot()).map((record) => acknowledgedByKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record);
      return { accountRevision: 8, records };
    },
  }), accountId);
  assert.equal(resumed?.status, "synced");
  assert.equal((await getAccountSyncState()).status, "synced");
  assert.equal(uploads, 2);
}

test("a concurrent local session start during upload keeps the interrupted Home sync retryable", async () => {
  await assertConcurrentLocalSessionStartKeepsHomeSyncRetryable("upload");
});

test("a concurrent local session start during download keeps the interrupted Home sync retryable", async () => {
  await assertConcurrentLocalSessionStartKeepsHomeSyncRetryable("download");
});

test("bound sync keeps session, goal, and plan commits made during GET and carries exact upload versions forward", async () => {
  await prepareBoundSyncedAccount();
  const initialGoal = createDefaultGoal(guestTrack);
  const goalSnapshot = await saveGoalSnapshot(initialGoal, null);
  const initialPlan = createLearningPlan({
    schemaVersion: 1,
    planId: "plan:p18-race",
    trackId: guestTrack,
    goalRevision: goalSnapshot.revision,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "p18-fixture",
    artifactSha256: TEST_ARTIFACT_SHA256,
    acceptedTarget: acceptedTargetFromGoal(initialGoal),
    createdAt: "2026-10-08T09:00:00.000Z",
    updatedAt: "2026-10-08T09:00:00.000Z",
    planRevision: 1,
    commandId: "command:p18-race-initial",
    slots: [{ slotId: createLearningPlanSlotId("p18-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan: initialPlan, expectedGoalRevision: goalSnapshot.revision, expectedPlanStorageRevision: null });
  saveAccountSyncState({ ...await getAccountSyncState(), status: "offlinePending" });
  const baseline = await buildAccountDataSnapshot();

  let releaseGet!: () => void;
  let signalGet!: () => void;
  const getGate = new Promise<void>((resolve) => { releaseGet = resolve; });
  const getStarted = new Promise<void>((resolve) => { signalGet = resolve; });
  let uploaded: ReturnType<typeof makeAppliedRecords> = [];
  const client = api({
    syncProgress: async (input) => {
      uploaded = makeAppliedRecords(input.mutations);
      return { accountRevision: 7, applied: uploaded, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      signalGet();
      await getGate;
      const byKey = new Map(uploaded.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      const records = remoteRecords(baseline).map((record) => {
        const acknowledged = byKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`);
        return acknowledged ? { ...record, ...acknowledged } : record;
      });
      return { accountRevision: 7, records };
    },
  });

  const sync = retryPendingAccountDataSync(client, accountId);
  await getStarted;
  assert.ok(uploaded.length > 0, "the sync should upload the captured local dataset before GET");

  const concurrentSession = createTrainingSession({ ...resumableSession(), id: "p18-session-during-get", configurationSnapshot: { kind: "practice" } });
  await commitTrainingSessionStart({ session: concurrentSession, draft: null, createdAt: concurrentSession.startedAt });
  const completed = completeTrainingSession(concurrentSession, "2026-10-08T10:01:00.000Z");
  const result = createTrainingSessionResult({
    id: `${completed.id}:result`,
    sessionId: completed.id,
    trackId: completed.trackId,
    totalOccurrences: completed.actualLength,
    answeredOccurrenceIds: completed.itemOrder.map((occurrence) => occurrence.occurrenceId),
    unansweredOccurrenceIds: [],
    completedAt: completed.completedAt!,
    evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { source: "p18-get-race" } }),
  });
  await commitSessionCompletion(completed, result, completed.completedAt!);

  const editor = realPlanEditorForTest();
  const started = await editor.startExistingEdit(guestTrack);
  assert.equal(started.kind, "ready", started.kind === "stale" ? started.reason : started.kind);
  if (started.kind !== "ready") throw new Error("P18 plan editor fixture did not open.");
  assert.equal(editor.updateSlotTime(started.session.editorId, guestTrack, "mon", "20:00").kind, "updated");
  const planCommit = await editor.commit(started.session.editorId, guestTrack);
  assert.equal(planCommit.kind, "saved");

  const changedGoal = Object.freeze({ ...initialGoal, preferredDays: Object.freeze(["tue", "thu"] as const), weeklySessionTarget: 2 });
  await persistGoal(changedGoal);
  releaseGet();

  const syncResult = await sync;
  assert.equal(syncResult?.status, "offlinePending");
  assert.equal(syncResult?.lastFailureCode, "local_dataset_changed_during_sync");
  assert.equal(await getActiveTrainingSession(), null);
  assert.ok((await getTrainingSessions()).value.some((session) => session.id === completed.id && session.status === "completed"));
  assert.deepEqual(await getTrainingSessionResult(completed.id), result);
  assert.deepEqual((await getGoalSnapshot(guestTrack))?.record, changedGoal);
  assert.equal(getLearningPlanSnapshot(guestTrack)?.plan.slots[0]?.localTime, "20:00");

  const preserved = await getAccountSyncState();
  assert.equal(preserved.status, "offlinePending");
  assert.ok(preserved.outbox.length > 0, "the old outbox must not be cleared by a stale GET");
  assert.ok(preserved.syncPlan, "the captured upload and its exact mutation IDs remain available for the next safe sync");
  assert.ok(Object.values(preserved.acknowledged).some((record) => record.remoteVersion === 1), "applied ACK versions survive the local edit");

  const nextPlan = await ensureAccountOutboxFromLocalDataset();
  const goalEntry = nextPlan.outbox.find((entry) => entry.recordType === "goal" && entry.trackId === guestTrack);
  const planEntry = nextPlan.outbox.find((entry) => entry.recordType === "learning_plan" && entry.trackId === guestTrack);
  assert.equal(goalEntry?.expectedVersion, 1);
  assert.equal(planEntry?.expectedVersion, 1);
});

test("a stale sync GET preserves a terminal review cycle and a new repair, then retries the full snapshot without reviving history", async () => {
  await prepareBoundSyncedAccount();
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(guestTrack);
  const runtime = new CanonicalTrainingRuntime(track);

  function wrongResponse(question: Question) {
    const { answer, interaction } = question;
    if (answer.type === "choice_single" && interaction.type === "choice_single") return { type: "choice_single" as const, optionId: interaction.options.find((option) => option.optionId !== answer.optionId)!.optionId };
    if (answer.type === "choice_multiple" && interaction.type === "choice_multiple") return { type: "choice_multiple" as const, optionIds: [interaction.options.find((option) => !answer.optionIds.includes(option.optionId))!.optionId] };
    if (answer.type === "ordering" && interaction.type === "ordering") return { type: "ordering" as const, orderedElementIds: [...answer.orderedElementIds].reverse() };
    if ((answer.type === "complexity" || answer.type === "decision_matrix") && (interaction.type === "complexity" || interaction.type === "decision_matrix")) {
      return { type: answer.type, selectedValueIdsByDimension: Object.fromEntries(interaction.dimensions.map((dimension) => [dimension.dimensionId, [dimension.values[0]!.valueId]])) };
    }
    throw new Error("The selected canonical question requires a supported answer interaction.");
  }

  async function answer({ id, at, review, incorrect = false }: { id: string; at: string; review?: Awaited<ReturnType<typeof getReviewQueueItems>>["value"][number]; incorrect?: boolean }) {
    const reviews = (await getReviewQueueItems()).value;
    const attempts = (await getTrainingAttempts()).value;
    const mode = track.getMode(review ? "coding-interview-weak-area-review" : "coding-interview-learn-approach");
    const prepared = await runtime.prepare({
      trackId: guestTrack,
      modeId: mode.modeId,
      request: { sessionId: id, requestedLength: mode.requestedLengths[0]!, ...(review ? { reviewSource: "due_queue" } : {}) },
      attempts,
      reviews,
      now: at,
    });
    const occurrence = prepared.session.itemOrder[0]!;
    const question = track.getQuestion(occurrence.item.questionId)!;
    await commitTrainingSessionStart({ session: prepared.session, draft: null, createdAt: at });
    const outcome = await runtime.submitPractice({
      session: prepared.session,
      response: incorrect ? wrongResponse(question) : question.answer,
      attempts: (await getTrainingAttempts()).value,
      reviews,
      now: at,
    });
    await commitTrainingOutcome({
      attempt: outcome.attempt,
      session: outcome.session,
      reviews: outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry),
      resolvedReviews: outcome.reviewMutations.filter((mutation) => mutation.kind === "remove").map((mutation) => mutation.entry),
      reviewBaseline: outcome.reviewBaseline,
      reviewSnapshotConflict: outcome.reviewSnapshotConflict,
      createdAt: at,
    });
    await commitSessionAbandonment(abandonTrainingSession(outcome.session, at), at);
    return outcome;
  }

  const start = "2026-10-01T12:00:00.000Z";
  let outcome = await answer({ id: "r27-cycle-error", at: start, incorrect: true });
  let review = (await getReviewQueueItems()).value[0]!;
  for (const [index, at] of ["2026-10-02T12:00:00.000Z", "2026-10-09T12:00:00.000Z", "2026-10-23T12:00:00.000Z", "2026-11-20T12:00:00.000Z"].entries()) {
    outcome = await answer({ id: `r27-cycle-due-${index}`, at, review });
    review = (await getReviewQueueItems()).value.find((entry) => entry.id === review.id)!;
  }
  assert.equal(review.status, "completed", "A is a terminal record produced by real canonical due answers and durable commits");
  const terminalA = review;
  await ensureAccountOutboxFromLocalDataset();
  saveAccountSyncState({ ...await getAccountSyncState(), status: "offlinePending" });
  const baseline = await buildAccountDataSnapshot();

  let releaseGet!: () => void;
  let signalGet!: () => void;
  const getGate = new Promise<void>((resolve) => { releaseGet = resolve; });
  const getStarted = new Promise<void>((resolve) => { signalGet = resolve; });
  let uploaded: ProgressRecordDto[] = [];
  let uploadCount = 0;
  let readCount = 0;
  const staleClient = api({
    syncProgress: async (input) => {
      uploadCount++;
      uploaded = makeAppliedRecords(input.mutations);
      return { accountRevision: input.expectedAccountRevision + uploaded.length, applied: uploaded, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      readCount++;
      signalGet();
      await getGate;
      const byKey = new Map(uploaded.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      const records = remoteRecords(baseline).map((record) => byKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record);
      return { accountRevision: 7, records };
    },
  });

  const staleSync = retryPendingAccountDataSync(staleClient, accountId);
  await getStarted;
  assert.ok(uploaded.length > 0, "the sync uploads A and its terminal cycle before the full-state read");
  const newError = await answer({ id: "r27-new-error-during-get", at: "2026-11-21T12:00:00.000Z", incorrect: true });
  const repairB = newError.reviewMutations.find((mutation) => mutation.kind === "upsert")?.entry;
  assert.ok(repairB, "a new canonical incorrect answer starts cycle B during the GET barrier");
  assert.notEqual(repairB.id, terminalA.id);
  releaseGet();

  const staleResult = await staleSync;
  assert.equal(staleResult?.status, "offlinePending");
  assert.equal(staleResult?.lastFailureCode, "local_dataset_changed_during_sync");
  assert.equal(uploadCount, 1);
  assert.equal(readCount, 1);
  assert.deepEqual((await getReviewQueueItems()).value.find((entry) => entry.id === terminalA.id), terminalA);
  assert.deepEqual((await getReviewQueueItems()).value.find((entry) => entry.id === repairB.id), repairB);
  assert.ok((await getAccountSyncState()).outbox.length > 0, "the stale GET cannot clear the exact outbox containing B");

  let retryApplied: ProgressRecordDto[] = [];
  const retryResult = await retryPendingAccountDataSync(api({
    syncProgress: async (input) => {
      uploadCount++;
      retryApplied = makeAppliedRecords(input.mutations);
      return { accountRevision: input.expectedAccountRevision + retryApplied.length, applied: retryApplied, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      readCount++;
      const local = await buildAccountDataSnapshot();
      const byKey = new Map(retryApplied.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      const records = remoteRecords(local).map((record) => byKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record);
      return { accountRevision: 7 + retryApplied.length, records };
    },
  }), accountId);

  assert.equal(retryResult?.status, "synced");
  assert.equal(uploadCount, 2);
  assert.equal(readCount, 2);
  assert.equal((await getAccountSyncState()).outbox.length, 0);
  const finalReviews = (await getReviewQueueItems()).value;
  assert.deepEqual(finalReviews.find((entry) => entry.id === terminalA.id), terminalA, "sync roundtrip cannot revive or rewrite terminal history A");
  assert.deepEqual(finalReviews.find((entry) => entry.id === repairB.id), repairB, "sync roundtrip preserves the distinct active repair B");
  assert.equal(finalReviews.filter((entry) => entry.trackId === guestTrack).length, 2);
});

test("bound sync does not materialize into a replacement storage profile after GET", async () => {
  await prepareBoundSyncedAccount();
  await commitTerminalLearningOutcome();
  await ensureAccountOutboxFromLocalDataset();
  const remoteSnapshot = await buildAccountDataSnapshot();
  const originalStorage = getKeyValueStorage() as MemoryKeyValueStorage;
  let releaseGet!: () => void;
  let signalGet!: () => void;
  const getGate = new Promise<void>((resolve) => { releaseGet = resolve; });
  const getStarted = new Promise<void>((resolve) => { signalGet = resolve; });
  const client = api({
    syncProgress: async (input) => ({ accountRevision: 7, applied: makeAppliedRecords(input.mutations), duplicates: [], conflicts: [] }),
    getProgress: async () => { signalGet(); await getGate; return { accountRevision: 7, records: remoteRecords(remoteSnapshot) }; },
  });

  const sync = retryPendingAccountDataSync(client, accountId);
  await getStarted;
  const replacementStorage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(replacementStorage);
  releaseGet();
  const result = await sync;

  assert.notEqual(result?.status, "synced");
  assert.equal(replacementStorage.getString(STORAGE_KEYS.ACCOUNT_SYNC), undefined, "the old profile's response must not write into the newly selected profile");
  assert.ok(originalStorage.getString(STORAGE_KEYS.ACCOUNT_SYNC), "the captured profile's sync marker remains in its original store");
});

test("Home pending retry honors binding, state, and durable recovery guards without remote calls", async () => {
  let remoteCalls = 0;
  const forbidden = async (): Promise<never> => { remoteCalls++; throw new Error("Home guard must block remote account data"); };
  const client = api({ getProgress: forbidden, syncProgress: forbidden });

  await prepareGuest();
  assert.equal(await retryPendingAccountDataSync(client, accountId), null);

  await prepareBoundSyncedAccount();
  assert.equal(await retryPendingAccountDataSync(client, accountId), null);

  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "offlinePending" });
  await clearGuestAccountBinding();
  assert.equal(await retryPendingAccountDataSync(client, accountId), null);

  await bindGuestInstallationToAccount(accountId);
  await saveTrainingSession(resumableSession());
  const active = await retryPendingAccountDataSync(client, accountId);
  assert.equal(active?.status, "resumeRequired");
  await clearTrainingSessions();

  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  await persistMutationJournal(makeJournal([
    { kind: "put_attempt", record: journalAttempt() },
    { kind: "put_session", record: journalSession() },
  ]));
  const journalBlocked = await retryPendingAccountDataSync(client, accountId);
  assert.equal(journalBlocked?.lastFailureCode, "journal_recovery_required");
  storage.remove(STORAGE_KEYS.ACTIVE_JOURNAL);

  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "offlinePending", materialization: { kind: "discardGuest", accountId } });
  const materializationBlocked = await retryPendingAccountDataSync(client, accountId);
  assert.equal(materializationBlocked?.lastFailureCode, "account_materialization_in_progress");

  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "offlinePending", materialization: null, pendingConfirmation: { operationId: "pending", previewFingerprint: "fingerprint", resolutions: [], groupChoices: [] } });
  const confirmationBlocked = await retryPendingAccountDataSync(client, accountId);
  assert.equal(confirmationBlocked?.lastFailureCode, "account_adoption_pending");
  assert.equal(remoteCalls, 0);
});

test("bound restart exposes a projection for a locally saved session without remote reads or writes", async () => {
  await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const active = resumableSession();
  await saveTrainingSession(active);
  const draft = await persistResumableAnswer(active);
  const beforeState = await getAccountSyncState();
  let reads = 0;
  let uploads = 0;
  const forbidden = async (): Promise<never> => { throw new Error("remote account data must not be touched while resuming"); };
  const result = await loadAccountDataSession(api({
    getProgress: async () => { reads++; return forbidden(); },
    syncProgress: async () => { uploads++; return forbidden(); },
  }), accountId);

  assert.equal(result.status, "resumeRequired");
  assert.equal(result.activeSessionBlocked, true);
  assert.equal(reads, 0);
  assert.equal(uploads, 0);
  assert.deepEqual(await getActiveTrainingSession(), active);
  assert.deepEqual(await getActiveTrainingSessionDraft(), draft);
  assert.deepEqual((await getAccountSyncState()).outbox, beforeState.outbox);
  assert.equal((await getAccountSyncState()).status, "synced");
});

test("resume requires matching installation and account-state bindings", async () => {
  await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  const active = resumableSession();
  await saveTrainingSession(active);
  let remoteCalls = 0;
  const forbidden = async (): Promise<never> => { remoteCalls++; throw new Error("remote account data must not be touched with an unbound sync state"); };
  const result = await loadAccountDataSession(api({ getProgress: forbidden, syncProgress: forbidden }), accountId);

  assert.equal(result.status, "failed");
  assert.equal(result.lastFailureCode, "account_binding_mismatch");
  assert.equal(result.activeSessionBlocked, true);
  assert.equal(remoteCalls, 0);
  assert.deepEqual(await getActiveTrainingSession(), active);
});

test("a pending learning journal blocks bound account sync without clearing the journal", async () => {
  const storage = await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const active = journalSession();
  await saveTrainingSession(active);
  await persistMutationJournal(makeJournal([
    { kind: "put_attempt", record: journalAttempt() },
    { kind: "put_session", record: active },
  ]));
  let remoteCalls = 0;
  const forbidden = async (): Promise<never> => { remoteCalls++; throw new Error("pending journal must block remote account data"); };
  const result = await loadAccountDataSession(api({ getProgress: forbidden, syncProgress: forbidden }), accountId);

  assert.equal(result.status, "failed");
  assert.equal(result.lastFailureCode, "journal_recovery_required");
  assert.equal(result.activeSessionBlocked, true);
  assert.equal(remoteCalls, 0);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);
  assert.deepEqual(await getActiveTrainingSession(), active);
});

test("a deferred upload state resumes locally and syncs idempotently after finalization", async () => {
  await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const beforeSession = resumableSession();
  const pendingOutbox = await ensureAccountOutboxFromLocalDataset();
  assert.equal(pendingOutbox.outbox.length, 1);
  await saveTrainingSession(beforeSession);
  const draft = await persistResumableAnswer(beforeSession);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "failed", lastFailureCode: "active_session_sync_deferred", remoteAccountRevision: 4 });

  let allowRemote = false;
  let reads = 0;
  let uploads = 0;
  let uploadedExpectedRevision: number | null = null;
  let appliedRecords: ProgressRecordDto[] = [];
  const client = api({
    syncProgress: async (input) => {
      uploads++;
      uploadedExpectedRevision = input.expectedAccountRevision;
      if (!allowRemote) throw new Error("deferred active session must not upload");
      appliedRecords = makeAppliedRecords(input.mutations);
      return { accountRevision: 5, applied: appliedRecords, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      reads++;
      if (!allowRemote) throw new Error("deferred active session must not read");
      const byKey = new Map(appliedRecords.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      return { accountRevision: 5, records: remoteRecords(remoteSnapshot).map((record) => {
        const acknowledged = byKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`);
        return acknowledged ? { ...record, ...acknowledged } : record;
      }) };
    },
  });

  const resumed = await loadAccountDataSession(client, accountId);
  assert.equal(resumed.status, "resumeRequired");
  assert.equal(reads, 0);
  assert.equal(uploads, 0);
  assert.deepEqual(await getActiveTrainingSession(), beforeSession);
  assert.deepEqual(await getActiveTrainingSessionDraft(), draft);
  assert.deepEqual((await getAccountSyncState()).outbox, pendingOutbox.outbox);

  allowRemote = true;
  await saveTrainingSession(completeTrainingSession(beforeSession, "2026-01-01T00:03:00.000Z"));
  await clearActiveTrainingSessionDraft(beforeSession.id);
  const remoteSnapshot = await buildAccountDataSnapshot();
  const synced = await loadAccountDataSession(client, accountId);

  assert.equal(synced.status, "synced", synced.lastFailureCode ?? "no failure code");
  assert.equal(uploads, 1);
  assert.equal(reads, 1);
  assert.equal(uploadedExpectedRevision, 4);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal((await getAccountSyncState()).remoteAccountRevision, 5);
  assert.equal((await getAccountSyncState()).outbox.length, 0);
});

test("discard deletes guest records and goals but preserves device preferences and performs no remote writes", async () => {
  const storage = await prepareGuest();
  await saveGoal(createDefaultGoal(guestTrack));
  storage.setString(STORAGE_KEYS.trainingSessionResult("orphan"), "guest result");
  storage.setString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, "guest reports");
  storage.setString(STORAGE_KEYS.SETTINGS, "device settings");
  storage.setString(STORAGE_KEYS.NOTIFICATION_SETTINGS, "device notifications");
  const forbidden = async (): Promise<never> => { throw new Error("remote write forbidden"); };
  const client = api({ syncProgress: forbidden, confirmAccountAdoption: forbidden, previewAccountAdoption: forbidden, deleteAccount: forbidden });
  const result = await discardGuestDataAndLoadAccount(client, accountId);
  assert.equal(result.status, "synced");
  assert.equal(await getActiveTrackId(), null);
  assert.equal((await buildAccountDataSnapshot()).records.length, 0);
  assert.equal(storage.contains(STORAGE_KEYS.goal(guestTrack)), false);
  assert.equal(storage.contains(STORAGE_KEYS.trainingSessionResult("orphan")), false);
  assert.equal(storage.contains(STORAGE_KEYS.CONTENT_REPORT_OUTBOX), false);
  assert.equal(storage.getString(STORAGE_KEYS.SETTINGS), "device settings");
  assert.equal(storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS), "device notifications");
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
});

test("discard restores existing account records unchanged without uploading guest data", async () => {
  await prepareGuest();
  const records = (await buildAccountDataSnapshot()).records.map((record) => ({ ...record, version: 3, kind: "node" as const, targetId: record.recordId, lastMutationId: "remote-mutation", updatedAt: "2026-01-01T00:00:00.000Z" }));
  const remote = { accountRevision: 7, records };
  const before = JSON.stringify(remote);
  let writes = 0;
  const client = api({ getProgress: async () => remote, syncProgress: async () => { writes++; throw new Error("must not upload"); } });
  assert.equal((await discardGuestDataAndLoadAccount(client, accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal((await getAccountSyncState()).remoteAccountRevision, 7);
  assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
  assert.equal(JSON.stringify(remote), before);
  assert.equal(writes, 0);
});

test("failed account fetch keeps guest data and the approved discard plan for retry", async () => {
  await prepareGuest();
  const failed = await discardGuestDataAndLoadAccount(api({ getProgress: async () => { throw new Error("offline"); } }), accountId);
  assert.notEqual(failed.status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  const pending = (await getAccountSyncState()).materialization;
  assert.equal(pending && "kind" in pending ? pending.kind : null, "discardGuest");
  assert.equal(pending && "kind" in pending ? pending.accountId : null, accountId);
  assert.equal(pending && "kind" in pending ? pending.phase : null, "prepared");
  assert.ok(pending && "kind" in pending && pending.guestBackup && pending.guestBackup.length > 0);
  assert.equal((await discardGuestDataAndLoadAccount(api(), accountId)).status, "synced");
});

test("existing-account login restores remote data without offering or uploading guest adoption", async () => {
  await prepareGuest();
  const records = (await buildAccountDataSnapshot()).records.map((record) => ({ ...record, version: 4, kind: "node" as const, targetId: record.recordId, lastMutationId: "existing-account", updatedAt: "2026-01-01T00:00:00.000Z" }));
  let previews = 0;
  let confirmations = 0;
  let uploads = 0;
  const result = await loadAccountDataSession(api({
    getProgress: async () => ({ accountRevision: 9, records }),
    previewAccountAdoption: async () => { previews++; throw new Error("adoption preview forbidden"); },
    confirmAccountAdoption: async () => { confirmations++; throw new Error("adoption confirmation forbidden"); },
    syncProgress: async () => { uploads++; throw new Error("guest upload forbidden"); },
  }), accountId, { guestAdoption: "discard" });

  assert.equal(result.status, "synced");
  assert.equal((await getAccountSyncState()).remoteAccountRevision, 9);
  assert.equal(previews, 0);
  assert.equal(confirmations, 0);
  assert.equal(uploads, 0);
  assert.equal((await getAccountSyncState()).materialization, null);
});

test("one separable invalid remote plan restores Home data, quarantines its version, and resolves after replacement sync", async () => {
  await prepareGuest();
  await saveGoal(createDefaultGoal(guestTrack));
  const { completed, result } = await commitTerminalLearningOutcome();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const homeRecords = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
  const invalidPlanState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
  const invalidPlan = {
    kind: "node" as const,
    recordType: "learning_plan" as const,
    recordId: guestTrack,
    trackId: guestTrack,
    targetId: guestTrack,
    version: 7,
    fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: invalidPlanState, trackId: guestTrack }),
    state: invalidPlanState,
    lastMutationId: "remote-invalid-plan",
    updatedAt: "2026-01-01T00:02:00.000Z",
  };
  const brokenSnapshot = { accountRevision: 10, generation: 4, records: [...homeRecords, invalidPlan] };
  let initialAcknowledgements: ProgressRecordDto[] = [];
  const restored = await loadAccountDataSession(api({
    syncProgress: async (input) => {
      initialAcknowledgements = makeAppliedRecords(input.mutations);
      return { accountRevision: 10, applied: initialAcknowledgements, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      const acknowledgedByKey = new Map(initialAcknowledgements.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      return { ...brokenSnapshot, records: brokenSnapshot.records.map((record) => acknowledgedByKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record) };
    },
  }), accountId);

  assert.equal(restored.status, "synced", restored.lastFailureCode ?? "missing failure code");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.deepEqual(await getGoalSnapshot(guestTrack), { record: createDefaultGoal(guestTrack), revision: 1 });
  assert.ok((await getTrainingSessions()).value.some((session) => session.id === completed.id && session.status === "completed"));
  assert.equal((await getTrainingSessionResult(completed.id))?.id, result.id);
  assert.equal(getLearningPlanSnapshot(guestTrack), null);
  assert.equal(restored.learningPlanRecovery?.trackId, guestTrack);
  assert.equal(restored.learningPlanRecovery?.remoteVersion, 7);
  assert.equal(restored.learningPlanRecovery?.generation, 4);
  assert.match(restored.learningPlanRecovery?.incidentId ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(isCanonicalAccountSyncState(await getAccountSyncState()), true);
  assert.equal((await getAccountSyncState()).acknowledged[JSON.stringify({ recordId: guestTrack, recordType: "learning_plan", trackId: guestTrack })]?.remoteVersion, 7);

  const incidentId = restored.learningPlanRecovery!.incidentId;
  dismissAccountLearningPlanRecovery(accountId, incidentId);
  const persisted = await getAccountSyncState();
  assert.equal(persisted.learningPlanRecovery?.dismissed, true);
  assert.equal(isCanonicalAccountSyncState(persisted), true);
  assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0, "quarantined absence must not create a tombstone");
  const restarted = await loadAccountDataSession(api({ getProgress: async () => brokenSnapshot }), accountId);
  assert.equal(restarted.learningPlanRecovery?.incidentId, incidentId);
  assert.equal(restarted.learningPlanRecovery?.dismissed, true, "dismissal must survive reloading the account materialization");

  const replacement = createLearningPlan({
    schemaVersion: 1,
    planId: "plan:recovered",
    trackId: guestTrack,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "test",
    artifactSha256: TEST_ARTIFACT_SHA256,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:03:00.000Z",
    planRevision: 1,
    commandId: "command:recovered",
    slots: [{ slotId: createLearningPlanSlotId("slot:recovered"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan: replacement, expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  const replacementOutbox = await ensureAccountOutboxFromLocalDataset();
  const replacementEntry = replacementOutbox.outbox.find((entry) => entry.recordType === "learning_plan");
  assert.equal(replacementEntry?.expectedVersion, 7);
  assert.equal(replacementEntry?.state.plan && (replacementEntry.state.plan as { planId?: string }).planId, "plan:recovered");

  let uploads = 0;
  const synced = await loadAccountDataSession(api({
    syncProgress: async (input) => {
      uploads++;
      assert.equal(input.mutations.length, 2);
      const planMutation = input.mutations.find((mutation) => mutation.recordType === "learning_plan")!;
      const goalMutation = input.mutations.find((mutation) => mutation.recordType === "goal")!;
      assert.equal(planMutation.expectedVersion, 7);
      assert.equal(goalMutation.expectedVersion, 2);
      return { accountRevision: 12, applied: input.mutations.map((mutation) => ({ ...mutation, version: mutation.recordType === "learning_plan" ? 8 : 3, lastMutationId: mutation.mutationId, updatedAt: "2026-01-01T00:04:00.000Z" })), duplicates: [], conflicts: [] };
    },
    getProgress: async () => ({
      accountRevision: 12,
      generation: 4,
      records: remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: record.recordType === "learning_plan" ? 8 : 3 })),
    }),
  }), accountId);
  assert.equal(uploads, 1);
  assert.equal(synced.status, "synced");
  assert.equal((await getAccountSyncState()).learningPlanRecovery, null);
  assert.equal((await getAccountSyncState()).acknowledged[JSON.stringify({ recordId: guestTrack, recordType: "learning_plan", trackId: guestTrack })]?.remoteVersion, 8);
});

test("normal no-plan remote state creates no recovery incident", async () => {
  await prepareGuest();
  await saveGoal(createDefaultGoal(guestTrack));
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const records = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
  let acknowledgements: ProgressRecordDto[] = [];
  const restored = await loadAccountDataSession(api({
    syncProgress: async (input) => {
      acknowledgements = makeAppliedRecords(input.mutations);
      return { accountRevision: 2, applied: acknowledgements, duplicates: [], conflicts: [] };
    },
    getProgress: async () => {
      const acknowledgedByKey = new Map(acknowledgements.map((record) => [`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`, record]));
      return { accountRevision: 2, generation: 1, records: records.map((record) => acknowledgedByKey.get(`${record.recordType}\u0000${record.trackId}\u0000${record.targetId}`) ?? record) };
    },
  }), accountId);
  assert.equal(restored.status, "synced", restored.lastFailureCode ?? "missing failure code");
  assert.equal(restored.learningPlanRecovery, undefined);
  assert.equal((await getAccountSyncState()).learningPlanRecovery, null);
});

test("learning plan recovery reserves before a read and commits the replacement with its ACK", async () => {
  await prepareGuest();
  await saveGoal(createDefaultGoal(guestTrack));
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const home = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
  const invalidState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
  const invalidRecord = { kind: "node" as const, recordType: "learning_plan" as const, recordId: guestTrack, targetId: guestTrack, trackId: guestTrack, version: 7, fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: invalidState, trackId: guestTrack }), state: invalidState, lastMutationId: "invalid-plan", updatedAt: "2026-01-01T00:02:00.000Z" };
  const initial = await loadAccountDataSession(apiWithAppliedUpload(async () => ({ accountRevision: 10, generation: 4, records: [...home, invalidRecord] })), accountId);
  const incident = initial.learningPlanRecovery!;
  dismissAccountLearningPlanRecovery(accountId, incident.incidentId);

  const replacement = createLearningPlan({ schemaVersion: 1, planId: "plan:background-recovery", trackId: guestTrack, goalRevision: 1, status: "accepted", timezone: "Europe/Warsaw", contentVersion: "test", artifactSha256: TEST_ARTIFACT_SHA256, acceptedTarget: { meaning: "none", targetDate: null }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:03:00.000Z", planRevision: 1, commandId: "command:background-recovery", slots: [{ slotId: createLearningPlanSlotId("slot:background"), day: "mon", localTime: "18:00", sessionLength: 10 }] });
  const replacementState = { schemaVersion: 1, revision: 1, plan: replacement };
  const replacementRecord = { kind: "node" as const, recordType: "learning_plan" as const, recordId: guestTrack, targetId: guestTrack, trackId: guestTrack, version: 8, fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: replacementState, trackId: guestTrack }), state: replacementState, lastMutationId: "valid-plan", updatedAt: "2026-01-01T00:03:00.000Z" };
  const now = new Date("2026-09-26T10:00:00.000Z");
  let finishRead!: (value: { accountRevision: number; generation: number; records: typeof replacementRecord[] }) => void;
  let readStarted!: () => void;
  const response = new Promise<{ accountRevision: number; generation: number; records: typeof replacementRecord[] }>((resolve) => { finishRead = resolve; });
  const started = new Promise<void>((resolve) => { readStarted = resolve; });
  let reads = 0;
  let writes = 0;
  const client = api({
    getProgress: async () => { reads++; readStarted(); const state = await getAccountSyncState(); assert.equal(state.learningPlanRecovery?.attemptCount, 1); assert.equal(state.learningPlanRecovery?.nextRetryAt, "2026-09-26T10:00:30.000Z"); return response; },
    syncProgress: async () => { writes++; throw new Error("recovery must never call syncProgress"); },
  });
  const first = retryLearningPlanRecovery(client, accountId, now);
  const duplicate = retryLearningPlanRecovery(client, accountId, now);
  assert.strictEqual(first, duplicate);
  await started;
  finishRead({ accountRevision: 11, generation: 4, records: [replacementRecord] });
  await Promise.all([first, duplicate]);
  assert.equal(reads, 1);
  assert.equal(writes, 0);
  assert.deepEqual(getLearningPlanSnapshot(guestTrack)?.plan, replacement);
  const state = await getAccountSyncState();
  assert.equal(state.learningPlanRecovery, null);
  assert.equal(state.remoteAccountRevision, 10, "single-plan recovery must not advance the account-wide revision");
  assert.equal(state.acknowledged[JSON.stringify({ recordId: guestTrack, recordType: "learning_plan", trackId: guestTrack })]?.remoteVersion, 8);
});

test("learning plan recovery persists failed attempts and respects the durable due time", async () => {
  await prepareGuest();
  await saveGoal(createDefaultGoal(guestTrack));
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const home = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
  const invalidState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
  const invalidRecord = { kind: "node" as const, recordType: "learning_plan" as const, recordId: guestTrack, targetId: guestTrack, trackId: guestTrack, version: 7, fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: invalidState, trackId: guestTrack }), state: invalidState, lastMutationId: "invalid-plan", updatedAt: "2026-01-01T00:02:00.000Z" };
  await loadAccountDataSession(apiWithAppliedUpload(async () => ({ accountRevision: 10, generation: 4, records: [...home, invalidRecord] })), accountId);
  let reads = 0;
  const offline = api({ getProgress: async () => { reads++; throw new Error("offline"); } });
  const now = new Date("2026-09-26T10:00:00.000Z");
  await retryLearningPlanRecovery(offline, accountId, now);
  assert.equal((await getAccountSyncState()).learningPlanRecovery?.attemptCount, 1);
  assert.equal((await getAccountSyncState()).learningPlanRecovery?.nextRetryAt, "2026-09-26T10:00:30.000Z");
  await retryLearningPlanRecovery(offline, accountId, now);
  assert.equal(reads, 1, "an early foreground or reconnect signal must not bypass durable backoff");
  const previousStorage = getKeyValueStorage();
  const restartedStorage = new MemoryKeyValueStorage();
  for (const key of previousStorage.getAllKeys()) {
    const value = previousStorage.getString(key);
    if (value !== undefined) restartedStorage.setString(key, value);
  }
  installKeyValueStorageForTests(restartedStorage);
  assert.equal((await getAccountSyncState()).learningPlanRecovery?.attemptCount, 1, "the reserved attempt survives a storage-process restart");
  await retryLearningPlanRecovery(offline, accountId, new Date("2026-09-26T10:00:30.000Z"));
  assert.equal(reads, 2, "the durable due time survives a later retry invocation");
  assert.equal((await getAccountSyncState()).learningPlanRecovery?.attemptCount, 2);
  assert.equal((await getAccountSyncState()).learningPlanRecovery?.nextRetryAt, "2026-09-26T10:01:30.000Z");
});

test("learning plan recovery drops stale responses after a generation, incident, or account ownership change", async () => {
  for (const mode of ["generation", "incident", "ownership"] as const) {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
    await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
    await prepareGuest();
    await saveGoal(createDefaultGoal(guestTrack));
    await bindGuestInstallationToAccount(accountId);
    saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
    const home = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
    const invalidState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
    const invalidRecord = { kind: "node" as const, recordType: "learning_plan" as const, recordId: guestTrack, targetId: guestTrack, trackId: guestTrack, version: 7, fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: invalidState, trackId: guestTrack }), state: invalidState, lastMutationId: "invalid-plan", updatedAt: "2026-01-01T00:02:00.000Z" };
    const initial = await loadAccountDataSession(apiWithAppliedUpload(async () => ({ accountRevision: 10, generation: 4, records: [...home, invalidRecord] })), accountId);
    let finishRead!: (value: { accountRevision: number; generation: number; records: [] }) => void;
    let readStarted!: () => void;
    const response = new Promise<{ accountRevision: number; generation: number; records: [] }>((resolve) => { finishRead = resolve; });
    const started = new Promise<void>((resolve) => { readStarted = resolve; });
    const request = retryLearningPlanRecovery(api({ getProgress: async () => { readStarted(); return response; }, syncProgress: async () => { throw new Error("read recovery cannot upload"); } }), accountId, new Date("2026-09-26T10:00:00.000Z"));
    await started;
    const state = await getAccountSyncState();
    if (mode === "incident") {
      saveAccountSyncState({ ...state, learningPlanRecovery: { ...state.learningPlanRecovery!, attemptCount: 0, incidentId: "b".repeat(64), nextRetryAt: null } });
    } else if (mode === "ownership") {
      await clearGuestAccountBinding();
      await bindGuestInstallationToAccount("another-account");
      saveAccountSyncState({ ...await getAccountSyncState(), accountId: "another-account", learningPlanRecovery: null });
    }
    finishRead({ accountRevision: 11, generation: mode === "generation" ? 5 : 4, records: [] });
    await request;
    const after = await getAccountSyncState();
    assert.equal(after.accountId, mode === "ownership" ? "another-account" : accountId, mode);
    assert.equal(after.learningPlanRecovery?.incidentId, mode === "incident" ? "b".repeat(64) : mode === "generation" ? initial.learningPlanRecovery?.incidentId : undefined, mode);
    assert.equal(after.acknowledged[JSON.stringify({ recordId: guestTrack, recordType: "learning_plan", trackId: guestTrack })]?.remoteVersion, 7, mode);
    assert.equal(initial.learningPlanRecovery?.attemptCount, 0, mode);
  }
});

test("invalid plan recovery fails closed on bad envelope, duplicate identity, uncertain goal, or ownership", async () => {
  for (const mode of ["fingerprint", "version", "identity", "duplicate", "goal", "ownership"] as const) {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
    await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
    await prepareGuest();
    await saveGoal(createDefaultGoal(guestTrack));
    await bindGuestInstallationToAccount(accountId);
    saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
    const validHomeRecords = remoteRecords(await buildAccountDataSnapshot()).map((record) => ({ ...record, version: 2 }));
    const planState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
    const invalidPlan = {
      kind: "node" as const,
      recordType: "learning_plan" as const,
      recordId: guestTrack,
      trackId: guestTrack,
      targetId: guestTrack,
      version: 7,
      fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: planState, trackId: guestTrack }),
      state: planState,
      lastMutationId: "remote-invalid-plan",
      updatedAt: "2026-01-01T00:02:00.000Z",
    };
    const uncertainIdentityPlan = {
      ...invalidPlan,
      targetId: "another-track",
    };
    const rows = mode === "duplicate" ? [...validHomeRecords, invalidPlan, invalidPlan]
      : validHomeRecords.map((record) => mode === "goal" && record.recordType === "goal"
        ? { ...record, state: { schemaVersion: 1 }, fingerprint: accountDataRecordFingerprint({ recordId: record.targetId, recordType: "goal", state: { schemaVersion: 1 }, trackId: record.trackId }) }
        : record).concat(mode === "identity" ? uncertainIdentityPlan : invalidPlan);
    const responseRows = mode === "fingerprint" ? rows.map((record) => record.recordType === "learning_plan" ? { ...record, fingerprint: "f".repeat(64) } : record)
      : mode === "version" ? rows.map((record) => record.recordType === "learning_plan" ? { ...record, version: -1 } : record)
        : rows;
    if (mode === "ownership") saveAccountSyncState({ ...await getAccountSyncState(), accountId: "another-account" });
    const restored = await loadAccountDataSession(api({
      syncProgress: async (input) => {
        const applied = makeAppliedRecords(input.mutations);
        return { accountRevision: input.expectedAccountRevision + applied.length, applied, duplicates: [], conflicts: [] };
      },
      getProgress: async () => ({ accountRevision: 10, generation: 4, records: responseRows }),
    }), accountId);
    assert.equal(restored.status, "failed", mode);
    assert.equal(await getActiveTrackId(), guestTrack, `${mode}: fail-closed validation must not clear local Home state`);
    assert.equal((await getAccountSyncState()).learningPlanRecovery, null, mode);
  }
});

test("transfer applies an explicit guest conflict resolution once and completes durably", async () => {
  await prepareGuest();
  await saveGuestAdoptionChoice("transfer");
  const guestSnapshot = await buildAccountDataSnapshot();
  const preview = adoptionPreview(guestSnapshot);
  const executedRecords = remoteRecords(guestSnapshot);
  let previews = 0;
  let confirmations = 0;
  let uploads = 0;
  const client = api({
    previewAccountAdoption: async (snapshot) => {
      previews++;
      assert.equal(snapshot.guestUserId, guestSnapshot.guestUserId);
      assert.ok(snapshot.records.some((record) => record.recordType === "active_track"));
      return preview;
    },
    confirmAccountAdoption: async (input) => {
      confirmations++;
      assert.equal(input.confirmation.operationId, preview.preview.operationId);
      assert.equal(input.confirmation.previewFingerprint, preview.preview.fingerprint);
      assert.deepEqual(input.confirmation.resolutions, [{ conflictId: "active-track-conflict", resolution: "keep_guest" }]);
      assert.deepEqual(input.confirmation.groupChoices, []);
      return { accountRevision: 5, operationId: preview.preview.operationId, mutationIds: ["adoption-mutation"], records: executedRecords };
    },
    syncProgress: async () => { uploads++; throw new Error("transfer must not create a second guest upload"); },
    getProgress: async () => ({ accountRevision: 5, records: executedRecords }),
  });

  const offered = await loadAccountDataSession(client, accountId);
  assert.equal(offered.status, "previewReady");
  assert.equal(offered.guestAdoptionChoice, "transfer");
  assert.deepEqual(offered.preview?.plan.conflictRecordIds, ["active-track-conflict"]);
  const confirmed = await confirmAccountDataAdoption(client, accountId, offered.preview!, [{ conflictId: "active-track-conflict", resolution: "keep_guest" }], []);

  assert.equal(confirmed.status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  const completed = await getAccountSyncState();
  assert.equal(completed.guestAdoptionChoice, "transfer");
  assert.equal(completed.pendingConfirmation, null);
  assert.equal(completed.materialization, null);
  assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
  assert.equal((await loadAccountDataSession(client, accountId)).status, "synced");
  assert.equal(previews, 1);
  assert.equal(confirmations, 1);
  assert.equal(uploads, 0);
});

test("guest adoption quarantines one invalid plan while materializing its goal and unambiguous active track", async () => {
  await prepareGuest();
  await saveGuestAdoptionChoice("transfer");
  await saveGoal(createDefaultGoal(guestTrack));
  const guestSnapshot = await buildAccountDataSnapshot();
  const invalidPlanState = { schemaVersion: 1, revision: 4, plan: { schemaVersion: 99, trackId: guestTrack } };
  const guestMergeRecords = [
    ...guestSnapshot.records.map(({ fingerprint, recordId, recordType, state, trackId, version }) => ({ fingerprint, recordId, recordType, state, trackId, version })),
    {
      fingerprint: accountDataRecordFingerprint({ recordId: guestTrack, recordType: "learning_plan", state: invalidPlanState, trackId: guestTrack }),
      recordId: guestTrack,
      recordType: "learning_plan" as const,
      state: invalidPlanState,
      trackId: guestTrack,
      version: 7,
    },
  ];
  const preview = adoptionPreview(guestSnapshot);
  const client = api({
    previewAccountAdoption: async () => preview,
    confirmAccountAdoption: async () => ({ accountRevision: 8, operationId: preview.preview.operationId, mutationIds: ["adoption-mutation"], records: guestMergeRecords }),
  });

  const offered = await loadAccountDataSession(client, accountId);
  assert.equal(offered.status, "previewReady");
  const confirmed = await confirmAccountDataAdoption(client, accountId, offered.preview!, [{ conflictId: "active-track-conflict", resolution: "keep_guest" }], []);

  assert.equal(confirmed.status, "synced", confirmed.lastFailureCode ?? "missing failure code");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.deepEqual(await getGoalSnapshot(guestTrack), { record: createDefaultGoal(guestTrack), revision: 1 });
  assert.equal(getLearningPlanSnapshot(guestTrack), null);
  assert.equal(confirmed.learningPlanRecovery?.trackId, guestTrack);
  assert.equal(confirmed.learningPlanRecovery?.remoteVersion, 7);
  assert.equal((await getAccountSyncState()).acknowledged[JSON.stringify({ recordId: guestTrack, recordType: "learning_plan", trackId: guestTrack })]?.remoteVersion, 7);
});

test("offline transfer retry reuses the durable confirmation and never uploads a duplicate guest snapshot", async () => {
  await prepareGuest();
  await saveGuestAdoptionChoice("transfer");
  const guestSnapshot = await buildAccountDataSnapshot();
  const preview = adoptionPreview(guestSnapshot);
  const resolution = [{ conflictId: "active-track-conflict", resolution: "keep_guest" }] as const;
  const offered = await loadAccountDataSession(api({ previewAccountAdoption: async () => preview }), accountId);
  assert.equal(offered.status, "previewReady");

  let confirmations = 0;
  let uploads = 0;
  const first = await confirmAccountDataAdoption(api({
    confirmAccountAdoption: async (input) => {
      confirmations++;
      assert.deepEqual(input.confirmation, {
        operationId: preview.preview.operationId,
        previewFingerprint: preview.preview.fingerprint,
        resolutions: resolution,
        groupChoices: [],
      });
      throw new PatternlyApiClientError("transport_failed");
    },
    syncProgress: async () => { uploads++; throw new Error("guest upload forbidden"); },
  }), accountId, offered.preview!, resolution, []);

  assert.equal(first.status, "offlinePending");
  assert.equal(first.lastFailureCode, "offline");
  assert.equal(await getActiveTrackId(), guestTrack);
  const interrupted = await getAccountSyncState();
  assert.equal(interrupted.guestAdoptionChoice, "transfer");
  assert.deepEqual(interrupted.pendingConfirmation, {
    operationId: preview.preview.operationId,
    previewFingerprint: preview.preview.fingerprint,
    resolutions: resolution,
    groupChoices: [],
  });
  assert.equal(interrupted.materialization, null);

  const executedRecords = remoteRecords(await buildAccountDataSnapshot());
  const retried = await loadAccountDataSession(api({
    confirmAccountAdoption: async (input) => {
      confirmations++;
      assert.deepEqual(input.confirmation, interrupted.pendingConfirmation);
      assert.ok(input.snapshot.records.some((record) => record.recordType === "active_track"));
      return { accountRevision: 6, operationId: preview.preview.operationId, mutationIds: ["adoption-mutation"], records: executedRecords };
    },
    syncProgress: async () => { uploads++; throw new Error("guest upload forbidden"); },
  }), accountId);

  assert.equal(retried.status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  const completed = await getAccountSyncState();
  assert.equal(completed.guestAdoptionChoice, "transfer");
  assert.equal(completed.pendingConfirmation, null);
  assert.equal(completed.materialization, null);
  assert.equal(confirmations, 2);
  assert.equal(uploads, 0);
});

for (const fault of ["partial-index", "binding", "finish"] as const) {
  test(`discard resumes after ${fault} failure without reconstructing a guest upload`, async () => {
    const storage = await prepareGuest();
    await saveTrainingSession(guestSession("abandoned"));
    storage.setString(STORAGE_KEYS.trainingSessionResult("backup-orphan"), "guest orphan result");
    storage.setString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, "guest report outbox");
    storage.resetCounters();
    if (fault === "partial-index") storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.TRAINING_SESSION_INDEX });
    if (fault === "binding") storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.GUEST_INSTALLATION });
    const write = storage.setString.bind(storage);
    let failFinish = fault === "finish";
    storage.setString = (key, value) => {
      if (failFinish && key === STORAGE_KEYS.ACCOUNT_SYNC && JSON.parse(value).payload.status === "synced") {
        failFinish = false;
        throw new Error("Injected finish write failure");
      }
      write(key, value);
    };
    const first = await discardGuestDataAndLoadAccount(api(), accountId);
    assert.notEqual(first.status, "synced");
    storage.setFailurePlan(null);
    assert.equal(storage.getString(STORAGE_KEYS.trainingSessionResult("backup-orphan")), "guest orphan result");
    assert.equal(storage.getString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX), "guest report outbox");
    const pendingMaterialization = (await getAccountSyncState()).materialization;
    assert.equal(pendingMaterialization && "kind" in pendingMaterialization ? pendingMaterialization.kind : null, "discardGuest");
    assert.equal(pendingMaterialization && "kind" in pendingMaterialization ? pendingMaterialization.accountId : null, accountId);
    assert.equal(pendingMaterialization && "kind" in pendingMaterialization ? pendingMaterialization.installationId : null, "66666666-6666-4666-8666-666666666666");
    assert.equal(pendingMaterialization && "kind" in pendingMaterialization ? pendingMaterialization.phase : null, "applying");
    assert.ok(pendingMaterialization && "kind" in pendingMaterialization && pendingMaterialization.guestBackup && pendingMaterialization.guestBackup.length > 0);
    const backupKeys = pendingMaterialization && "kind" in pendingMaterialization ? pendingMaterialization.guestBackup?.map((entry) => entry.key) : [];
    assert.ok(backupKeys?.includes(STORAGE_KEYS.trainingSessionResult("backup-orphan")));
    assert.ok(backupKeys?.includes(STORAGE_KEYS.CONTENT_REPORT_OUTBOX));
    assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
    let uploads = 0;
    const retried = await loadAccountDataSession(api({ syncProgress: async () => { uploads++; throw new Error("guest upload forbidden"); } }), accountId);
    assert.equal(retried.status, "synced");
    assert.equal((await buildAccountDataSnapshot()).records.length, 0);
    assert.equal((await getAccountSyncState()).materialization, null);
    assert.equal(uploads, 0);
  });
}

test("discard rejects another account and pending adoption without changing guest data", async () => {
  await prepareGuest();
  const state = await getAccountSyncState();
  saveAccountSyncState({ ...state, accountId: "other-account", materialization: { kind: "discardGuest", accountId: "other-account" } });
  assert.notEqual((await discardGuestDataAndLoadAccount(api(), accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  saveAccountSyncState({ ...state, pendingConfirmation: { operationId: "pending", previewFingerprint: "fingerprint", resolutions: [], groupChoices: [] } });
  assert.notEqual((await discardGuestDataAndLoadAccount(api(), accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
});

test("a stale adoption confirmation is cleared so retry can request a fresh preview", async () => {
  await prepareGuest();
  const state = await getAccountSyncState();
  saveAccountSyncState({ ...state, accountId, status: "syncing", pendingConfirmation: { operationId: "stale-operation", previewFingerprint: "stale-fingerprint", resolutions: [], groupChoices: [] } });
  const result = await loadAccountDataSession(api({ confirmAccountAdoption: async () => {
    throw new PatternlyApiClientError("server_error", 409, "merge_preview_mismatch");
  } }), accountId);
  assert.equal(result.lastFailureCode, "adoption_conflict");
  const reset = await getAccountSyncState();
  assert.equal(reset.pendingConfirmation, null);
  assert.equal(reset.accountId, null);
  assert.equal(reset.status, "initialSyncRequired");
});

test("discard blocks an active guest session before fetching or deleting data", async () => {
  await prepareGuest();
  await saveTrainingSession(guestSession("active"));
  let reads = 0;
  const result = await discardGuestDataAndLoadAccount(api({ getProgress: async () => { reads++; return { accountRevision: 0, records: [] }; } }), accountId);
  assert.equal(result.activeSessionBlocked, true);
  assert.equal(reads, 0);
  assert.equal(await getActiveTrackId(), guestTrack);
});

test("concurrent discard calls make one transition and keep the guest outbox empty before fetching", async () => {
  await prepareGuest();
  let reads = 0;
  const client = api({ getProgress: async () => { reads++; assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0); return { accountRevision: 0, records: [] }; } });
  const results = await Promise.all([discardGuestDataAndLoadAccount(client, accountId), discardGuestDataAndLoadAccount(client, accountId)]);
  assert.deepEqual(results.map((result) => result.status), ["synced", "synced"]);
  assert.equal(reads, 1);
});

test("a session start requested while discard fetches waits and is preserved after materialization", async () => {
  await prepareGuest();
  let releaseFetch!: () => void;
  let fetchStarted!: () => void;
  const fetchReady = new Promise<void>((resolve) => { fetchStarted = resolve; });
  const fetchPaused = new Promise<void>((resolve) => { releaseFetch = resolve; });
  const discard = discardGuestDataAndLoadAccount(api({ getProgress: async () => {
    fetchStarted();
    await fetchPaused;
    return { accountRevision: 0, records: [] };
  } }), accountId);
  await fetchReady;
  const session = guestSession("active");
  let sessionStarted = false;
  const start = commitTrainingSessionStart({ session, draft: null, createdAt: session.startedAt }).then(() => { sessionStarted = true; });
  await Promise.resolve();
  assert.equal(sessionStarted, false);
  releaseFetch();
  const result = await discard;
  await start;
  assert.equal(result.status, "synced");
  assert.deepEqual(await getActiveTrainingSession(), session);
  assert.equal((await getAccountSyncState()).status, "offlinePending");
});

test("malformed remote records keep the guest dataset and durable approved discard plan", async () => {
  await prepareGuest();
  const invalid = { accountRevision: 1, records: [{ recordType: "active_track", state: { trackId: "unknown" } }] } as unknown as Awaited<ReturnType<PatternlyApiClient["getProgress"]>>;
  assert.notEqual((await discardGuestDataAndLoadAccount(api({ getProgress: async () => invalid }), accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  const pending = (await getAccountSyncState()).materialization;
  assert.equal(pending && "kind" in pending ? pending.kind : null, "discardGuest");
  assert.equal(pending && "kind" in pending ? pending.accountId : null, accountId);
  assert.equal(pending && "kind" in pending ? pending.phase : null, "prepared");
  assert.ok(pending && "kind" in pending && pending.guestBackup && pending.guestBackup.length > 0);
});

test("pending materialization blocks lifecycle account deletion without losing the marker", async () => {
  await prepareGuest();
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, materialization: { kind: "discardGuest", accountId } });
  let calls = 0;
  const forbidden = async (): Promise<never> => { calls++; throw new Error("deletion forbidden while materializing"); };
  const client = api({ deleteAccount: forbidden });
  assert.equal((await deleteBoundAccount(client, accountId, uid, prepareDeletionLocalState)).ok, false);
  assert.equal(calls, 0);
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.deepEqual((await getAccountSyncState()).materialization, { kind: "discardGuest", accountId });
});

test("a durable adoption confirmation blocks a new learning commit", async () => {
  await prepareGuest();
  const state = await getAccountSyncState();
  saveAccountSyncState({ ...state, accountId, pendingConfirmation: { operationId: "pending", previewFingerprint: "fingerprint", resolutions: [], groupChoices: [] } });
  await assert.rejects(() => commitTrainingSessionStart({ session: guestSession("active"), draft: null, createdAt: "2026-01-01T00:00:00.000Z" }));
  assert.equal(await getActiveTrainingSession(), null);
  assert.notEqual((await getAccountSyncState()).pendingConfirmation, null);
});

test("unreadable mutation journal blocks discard before deleting guest data", async () => {
  const storage = await prepareGuest();
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, "unreadable pending operation");
  let reads = 0;
  assert.notEqual((await discardGuestDataAndLoadAccount(api({ getProgress: async () => { reads++; return { accountRevision: 0, records: [] }; } }), accountId)).status, "synced");
  assert.equal(reads, 0);
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);
});
