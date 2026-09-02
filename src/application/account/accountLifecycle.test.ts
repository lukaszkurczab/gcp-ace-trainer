import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { PatternlyApiClientError, type PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { deleteBoundAccount, prepareAccountSignOut } from "./accountDataService";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import {
  getAccountDeletionState,
  getAccountSignOutState,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";

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

// The discard path uses the real repositories and injected durable storage faults.
import { createTrainingSession } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import { discardGuestDataAndLoadAccount, loadAccountDataSession } from "./accountDataService";
import { clearGuestAccountBinding } from "../../storage/repositories/guestInstallationRepository";
import { getActiveTrackId, saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { buildAccountDataSnapshot, ensureAccountOutboxFromLocalDataset, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";

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
