import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { PatternlyApiClientError, type PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { AccountDataFailure } from "../../storage/errors";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { clearAccountDeletionOwnedLocalData, deleteBoundAccount, loadAccountDataSession, prepareAccountSignOut, retryPendingAccountDeletion } from "./accountDataService";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import {
  beginAccountDeletion,
  getAccountDeletionState,
  getAccountSignOutState,
  markAccountDeletionComplete,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, clearGuestAccountBinding, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";

const accountId = "55555555-5555-4555-8555-555555555555";
const uid = "firebase-fixture-uid";

function api(overrides: Partial<PatternlyApiClient> = {}): PatternlyApiClient {
  return {
    availability: "available",
    getHealth: async () => ({ status: "ok", service: "patternly-backend" }),
    getReady: async () => ({ status: "ready", checks: { database: true, authentication: true } }),
    getOpenApi: async () => ({ openapi: "3.0.3", paths: {} }),
    getMe: async () => ({ user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", identity: { provider: "firebase", subject: uid, email: null, emailVerified: true } } }),
    getEntitlements: async () => ({ entitlements: [] }),
    getProgress: async () => ({ accountRevision: 0, records: [] }),
    syncProgress: async () => ({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }),
    previewAccountAdoption: async () => { throw new Error("unused"); },
    confirmAccountAdoption: async () => { throw new Error("unused"); },
    issueRecoveryCodes: async () => ({ generationId: "generation-fixture", codes: [] }),
    consumeRecoveryCode: async () => ({ customToken: "custom-token-fixture" }),
    revokeSessions: async (operationId) => ({ status: "revoked", operationId }),
    deleteAccount: async (operationId) => ({ status: "deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    requestPublicDeletion: async () => ({ status: "accepted" }),
    confirmPublicDeletion: async () => ({ status: "deleted", operationId: "operation-fixture", proofId: "proof_fixture_12345678901234567890" }),
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

test("sign-out keeps the account bound and exposes a durable pending state when revocation fails", async () => {
  let revokeFails = true;
  const client = api({
    revokeSessions: async (operationId) => {
      if (revokeFails) throw new PatternlyApiClientError("server_error", 503, "session_revocation_pending");
      return { status: "revoked", operationId };
    },
  });

  const first = await prepareAccountSignOut(client, accountId);
  assert.deepEqual(first, { ok: false, failure: "signOutPending" });
  assert.equal(getAccountSignOutState()?.status, "pending");
  assert.equal((await getGuestInstallation())?.accountId, accountId);

  revokeFails = false;
  const retry = await prepareAccountSignOut(client, accountId);
  assert.deepEqual(retry, { ok: true });
  assert.equal(getAccountSignOutState(), null);
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal((await getAccountSyncState()).accountId, null);
});

test("sign-out preparation retries after an injected ACCOUNT_SYNC read failure without revoking or clearing", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  let revokeCalls = 0;
  const client = api({
    revokeSessions: async (operationId) => {
      revokeCalls++;
      return { status: "revoked", operationId };
    },
  });

  storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.ACCOUNT_SYNC });
  await assert.rejects(() => prepareAccountSignOut(client, accountId));
  assert.equal(revokeCalls, 0);
  assert.equal((await getGuestInstallation())?.accountId, accountId);

  storage.setFailurePlan(null);
  assert.deepEqual(await prepareAccountSignOut(client, accountId), { ok: true });
  assert.equal(revokeCalls, 1);
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal((await getAccountSyncState()).accountId, null);
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
    getDeletionOperationStatus: async (operationId, accountUidHash) => {
      statusCalls += 1;
      observedOperationId = operationId;
      assert.equal(accountUidHash, sha256Utf8(uid));
      return { status: "remote_deleted", operationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: observedOperationId, proofId }),
  });

  const result = await deleteBoundAccount(client, accountId, uid);
  assert.deepEqual(result, { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(deleteCalls, 1);
  assert.equal(statusCalls, 1);
  assert.equal(getAccountDeletionState()?.status, "complete");
  assert.equal(getAccountDeletionState()?.accountUidHash, sha256Utf8(uid));
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

  const first = await deleteBoundAccount(client, accountId, uid);
  assert.deepEqual(first, { ok: false, failure: "journalRecoveryFailure" });
  assert.equal(getAccountDeletionState(), null);
  assert.equal(await retryPendingAccountDeletion(client, accountId, uid), null);
  assert.equal(deleteCalls, 0);
});

test("response loss resolves a matching remote operation and rejects mismatched status without local cleanup", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const orphanKey = STORAGE_KEYS.goal("response-loss-goal");
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

  assert.deepEqual(await deleteBoundAccount(client, accountId, uid), { ok: true, proofId: "proof_fixture_12345678901234567890" });
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
  const mismatch = await retryPendingAccountDeletion(mismatchClient, accountId, uid);
  assert.deepEqual(mismatch, { ok: false, failure: "pendingSyncRequiresNetwork" });
  assert.equal(mismatchDeleteCalls, 1);
  assert.equal(mismatchStorage.contains(mismatchKey), true);
  assert.notEqual(getAccountDeletionState()?.status, "complete");
});

test("local deletion cleanup resumes after a failed key removal without issuing another remote delete", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const orphanKey = STORAGE_KEYS.goal("cleanup-retry-goal");
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
  assert.deepEqual(await deleteBoundAccount(client, accountId, uid), { ok: false, failure: "localCleanupFailure" });
  assert.equal(getAccountDeletionState()?.status, "localCleanupPending");
  storage.setFailurePlan(null);
  assert.deepEqual(await retryPendingAccountDeletion(client, accountId, uid), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(deleteCalls, 1);
  assert.equal(storage.contains(orphanKey), false);
  assert.equal(getAccountDeletionState()?.status, "complete");
});

test("server reauthentication failures remain reauthentication failures with the pending marker intact", async () => {
  const client = api({ deleteAccount: async () => { throw new PatternlyApiClientError("server_error", 400, "recent_reauthentication_required"); } });
  const result = await deleteBoundAccount(client, accountId, uid);
  assert.deepEqual(result, { ok: false, failure: "reauthenticationRequired" });
  assert.equal(getAccountDeletionState()?.status, "remotePending");
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

  assert.deepEqual(await deleteBoundAccount(client, accountId, uid), { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(statusCalls, 1);
});

// The discard path uses the real repositories and injected durable storage faults.
import { completeTrainingSession, createFamilyEnvelope, createTrainingSession, createTrainingSessionDraft, createTrainingSessionResult } from "../../domain";
import { commitSessionCompletion } from "../learningMutations/commitSessionLifecycle";
import { commitTrainingSessionStart } from "../learningMutations/commitTrainingSessionStart";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import { discardGuestDataAndLoadAccount, retryPendingAccountDataSync } from "./accountDataService";
import { getActiveTrackId, saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { clearTrainingSessions, getActiveTrainingSession, saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { clearActiveTrainingSessionDraft, getActiveTrainingSessionDraft, saveTrainingSessionDraft as persistTrainingSessionDraft } from "../../storage/repositories/trainingSessionDraftRepository";
import { buildAccountDataSnapshot, ensureAccountOutboxFromLocalDataset, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { attempt as journalAttempt, journal as makeJournal, session as journalSession } from "../../testing/journalTestSupport";

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
    itemOrder: [{ occurrenceId: "one", item: { trackId: guestTrack, itemId: "two-sum-001", contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN } }],
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN,
    status, startedAt: "2026-01-01T00:00:00.000Z",
  });
}

function resumableSession() {
  return createTrainingSession({
    id: "resumable-session", trackId: guestTrack, modeId: "guided",
    configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "practice", submission: "manualOrForegroundTimeout" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "resumable-occurrence", item: { trackId: guestTrack, itemId: "two-sum-001", contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN } }],
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN,
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

async function prepareBoundSyncedAccount(): Promise<void> {
  await prepareGuest();
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
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

  let uploads = 0;
  let reads = 0;
  const client = api({
    syncProgress: async (input) => {
      uploads++;
      assert.ok(input.mutations.some((mutation) => mutation.recordType === "training_session_result"));
      return { accountRevision: 7, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] };
    },
    getProgress: async () => {
      reads++;
      return { accountRevision: 7, records: remoteRecords(await buildAccountDataSnapshot()) };
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
    syncProgress: async () => {
      uploads++;
      if (phase === "upload") {
        networkStarted();
        await networkPaused;
      }
      return { accountRevision: 7, applied: [], duplicates: [], conflicts: [] };
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

  const resumed = await retryPendingAccountDataSync(api({
    syncProgress: async () => { uploads++; return { accountRevision: 8, applied: [], duplicates: [], conflicts: [] }; },
    getProgress: async () => ({ accountRevision: 8, records: remoteRecords(await buildAccountDataSnapshot()) }),
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

  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "offlinePending", materialization: null, pendingConfirmation: { operationId: "pending", previewFingerprint: "fingerprint", resolutions: [] } });
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
  const client = api({
    syncProgress: async (input) => {
      uploads++;
      uploadedExpectedRevision = input.expectedAccountRevision;
      if (!allowRemote) throw new Error("deferred active session must not upload");
      return { accountRevision: 5, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] };
    },
    getProgress: async () => {
      reads++;
      if (!allowRemote) throw new Error("deferred active session must not read");
      return { accountRevision: 5, records: remoteRecords(await buildAccountDataSnapshot()) };
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
  const synced = await loadAccountDataSession(client, accountId);

  assert.equal(synced.status, "synced");
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
  storage.setString(STORAGE_KEYS.goal("removed-track"), "guest goal");
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
  assert.equal(storage.contains(STORAGE_KEYS.goal("removed-track")), false);
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

test("failed account fetch keeps guest data and releases the operation lane for retry", async () => {
  await prepareGuest();
  const failed = await discardGuestDataAndLoadAccount(api({ getProgress: async () => { throw new Error("offline"); } }), accountId);
  assert.notEqual(failed.status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal((await getAccountSyncState()).materialization, null);
  assert.equal((await discardGuestDataAndLoadAccount(api(), accountId)).status, "synced");
});

for (const fault of ["partial-index", "binding", "finish"] as const) {
  test(`discard resumes after ${fault} failure without reconstructing a guest upload`, async () => {
    const storage = await prepareGuest();
    await saveTrainingSession(guestSession("abandoned"));
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
    assert.deepEqual((await getAccountSyncState()).materialization, { kind: "discardGuest", accountId });
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
  saveAccountSyncState({ ...state, pendingConfirmation: { operationId: "pending", previewFingerprint: "fingerprint", resolutions: [] } });
  assert.notEqual((await discardGuestDataAndLoadAccount(api(), accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
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

test("malformed remote records are rejected before the guest dataset or marker changes", async () => {
  await prepareGuest();
  const invalid = { accountRevision: 1, records: [{ recordType: "active_track", state: { trackId: "unknown" } }] } as unknown as Awaited<ReturnType<PatternlyApiClient["getProgress"]>>;
  assert.notEqual((await discardGuestDataAndLoadAccount(api({ getProgress: async () => invalid }), accountId)).status, "synced");
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.equal((await getAccountSyncState()).materialization, null);
});

test("pending materialization blocks lifecycle revoke and deletion without losing the marker", async () => {
  await prepareGuest();
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, materialization: { kind: "discardGuest", accountId } });
  let calls = 0;
  const forbidden = async (): Promise<never> => { calls++; throw new Error("lifecycle forbidden while materializing"); };
  const client = api({ revokeSessions: forbidden, deleteAccount: forbidden });
  assert.equal((await prepareAccountSignOut(client, accountId)).ok, false);
  assert.equal((await deleteBoundAccount(client, accountId, uid)).ok, false);
  assert.equal(calls, 0);
  assert.equal(await getActiveTrackId(), guestTrack);
  assert.deepEqual((await getAccountSyncState()).materialization, { kind: "discardGuest", accountId });
});

test("signout queued with discard runs after materialization and cannot be followed by a stale bind", async () => {
  await prepareGuest();
  const events: string[] = [];
  const client = api({
    getProgress: async () => { events.push("read"); return { accountRevision: 0, records: [] }; },
    revokeSessions: async (operationId) => { events.push("revoke"); assert.equal((await getAccountSyncState()).materialization, null); return { status: "revoked", operationId }; },
  });
  const [discard, signout] = await Promise.all([discardGuestDataAndLoadAccount(client, accountId), prepareAccountSignOut(client, accountId)]);
  assert.equal(discard.status, "synced");
  assert.equal(signout.ok, true);
  assert.deepEqual(events, ["read", "revoke"]);
  assert.equal((await getGuestInstallation())?.accountId, null);
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


test("sign-out discovers locally committed answers before clearing account data even when the outbox has not been built", async () => {
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  const { commitMutation } = await import("../learningMutations/commitMutation");
  await commitMutation(makeJournal([
    { kind: "put_attempt", record: journalAttempt() },
    { kind: "put_session", record: journalSession() },
  ]));
  assert.equal((await getAccountSyncState()).outbox.length, 0);
  await saveTrainingSession(journalSession("completed"));
  let uploads = 0;
  let revocations = 0;
  const result = await prepareAccountSignOut(api({
    syncProgress: async (input) => {
      uploads++;
      assert.ok(input.mutations.some((entry) => entry.recordType === "training_attempt"));
      throw new Error("offline");
    },
    revokeSessions: async () => { revocations++; throw new Error("must not revoke before sync"); },
  }), accountId);
  assert.equal(result.ok, false);
  assert.equal(uploads, 1);
  assert.equal(revocations, 0);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.ok((await getAccountSyncState()).outbox.some((entry) => entry.recordType === "training_attempt"));
});
