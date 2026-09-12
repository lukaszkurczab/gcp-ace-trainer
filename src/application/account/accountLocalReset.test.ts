import assert from "node:assert/strict";
import test from "node:test";

import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import {
  buildAccountDataSnapshot,
  ensureAccountOutboxFromLocalDataset,
  getAccountSyncState,
  markAccountResetPending,
  saveAccountSyncState,
} from "../../storage/repositories/accountDataRepository";
import { bindGuestInstallationToAccount, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { addReviewQueueItems } from "../../storage/repositories/reviewQueueRepository";
import { saveActiveTrackId, getActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { getReviewQueueItems } from "../../storage/repositories/reviewQueueRepository";
import { getTrainingAttempts } from "../../storage/repositories/trainingAttemptRepository";
import { getTrainingSessions } from "../../storage/repositories/trainingSessionRepository";
import { prepareAccountSignOut, resetAccountLocalLearningHistory } from "./accountDataService";
import { attempt, review, session } from "../../testing/journalTestSupport";

const accountId = "55555555-5555-4555-8555-555555555555";

function client(overrides: Partial<PatternlyApiClient> = {}): PatternlyApiClient {
  return {
    getProgress: async () => ({ accountRevision: 1, records: [] }),
    syncProgress: async () => { throw new Error("syncProgress must not run during local reset"); },
    ...overrides,
  } as PatternlyApiClient;
}

async function prepareBoundAccount(): Promise<MemoryKeyValueStorage> {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  return storage;
}

async function seedHistory() {
  await saveActiveTrackId("coding-interview-dsa-problem-solving");
  await saveTrainingSession(session("abandoned"));
  await addTrainingAttempt(attempt());
  await addReviewQueueItems([review()]);
}

function remoteRecords(snapshot: Awaited<ReturnType<typeof buildAccountDataSnapshot>>) {
  return snapshot.records.map((record) => ({
    ...record,
    kind: record.recordType === "training_attempt" || record.recordType === "review_queue_entry" ? "item" as const : "node" as const,
    targetId: record.recordId,
    lastMutationId: `remote-${record.recordId}`,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
}

test("authenticated reset restores history without uploading tombstones and preserves local context", async () => {
  const storage = await prepareBoundAccount();
  await seedHistory();
  storage.setString(STORAGE_KEYS.SETTINGS, "device settings");
  storage.setString(STORAGE_KEYS.NOTIFICATION_SETTINGS, "device notifications");
  storage.setString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, "report outbox");
  const remote = remoteRecords(await buildAccountDataSnapshot());
  let reads = 0;
  let writes = 0;
  const result = await resetAccountLocalLearningHistory(client({
    getProgress: async () => { reads++; return { accountRevision: 4, records: remote }; },
    syncProgress: async () => { writes++; throw new Error("tombstone upload forbidden"); },
  }), accountId);

  assert.equal(result.status, "synced");
  assert.equal(reads, 1);
  assert.equal(writes, 0);
  assert.equal((await getAccountSyncState()).resetGuard, null);
  assert.equal(await getActiveTrackId(), "coding-interview-dsa-problem-solving");
  assert.equal((await getTrainingSessions()).value.length, 1);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getReviewQueueItems()).value.length, 1);
  assert.equal(storage.getString(STORAGE_KEYS.SETTINGS), "device settings");
  assert.equal(storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS), "device notifications");
  assert.equal(storage.getString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX), "report outbox");
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
});

test("authenticated reset rejects pending account context without changing state or calling the API", async () => {
  await prepareBoundAccount();
  await saveActiveTrackId("coding-interview-dsa-problem-solving");
  const pending = await ensureAccountOutboxFromLocalDataset();
  assert.equal(pending.outbox.length, 1);
  const before = await getAccountSyncState();
  const activeTrackBefore = await getActiveTrackId();
  let getProgressCalls = 0;
  let syncProgressCalls = 0;

  const failed = await resetAccountLocalLearningHistory(client({
    getProgress: async () => { getProgressCalls++; return { accountRevision: 2, records: [] }; },
    syncProgress: async () => { syncProgressCalls++; return { accountRevision: 2, applied: [], conflicts: [], duplicates: [] }; },
  }), accountId);

  assert.equal(failed.status, "failed");
  assert.equal(failed.lastFailureCode, "account_reset_requires_clean_sync");
  assert.equal(getProgressCalls, 0);
  assert.equal(syncProgressCalls, 0);
  assert.deepEqual(await getAccountSyncState(), before);
  assert.equal((await getAccountSyncState()).resetGuard, null);
  assert.equal(await getActiveTrackId(), activeTrackBefore);
});

test("legacy clean synced state remains eligible for the guarded reset", async () => {
  await prepareBoundAccount();
  const state = await getAccountSyncState();
  saveAccountSyncState({ ...state, resetGuard: undefined as never });
  let getProgressCalls = 0;

  const result = await resetAccountLocalLearningHistory(client({
    getProgress: async () => { getProgressCalls++; return { accountRevision: 2, records: [] }; },
  }), accountId);

  assert.equal(result.status, "synced");
  assert.equal(getProgressCalls, 1);
  assert.equal((await getAccountSyncState()).resetGuard, null);
});

test("authenticated reset exposes the remote-restore guard and keeps it after a fetch failure", async () => {
  await prepareBoundAccount();
  await seedHistory();
  let guardAtFetch: Awaited<ReturnType<typeof getAccountSyncState>>["resetGuard"] = null;
  const failed = await resetAccountLocalLearningHistory(client({
    getProgress: async () => {
      guardAtFetch = (await getAccountSyncState()).resetGuard;
      assert.equal((await ensureAccountOutboxFromLocalDataset()).outbox.length, 0);
      throw new Error("offline");
    },
  }), accountId);

  assert.notEqual(failed.status, "synced");
  const observedGuardAtFetch = guardAtFetch as NonNullable<Awaited<ReturnType<typeof getAccountSyncState>>["resetGuard"]> | null;
  assert.equal(observedGuardAtFetch?.phase, "remoteRestorePending");
  assert.equal((await getAccountSyncState()).resetGuard?.phase, "remoteRestorePending");
  assert.equal((await getTrainingSessions()).value.length, 0);
});

test("sign-out cannot clear a reset guard after remote restore fails", async () => {
  await prepareBoundAccount();
  await seedHistory();
  let revokeCalls = 0;
  const api = client({
    getProgress: async () => { throw new Error("offline"); },
    revokeSessions: async (operationId) => {
      revokeCalls++;
      return { status: "revoked", operationId };
    },
  });

  const failed = await resetAccountLocalLearningHistory(api, accountId);
  assert.notEqual(failed.status, "synced");
  const guard = (await getAccountSyncState()).resetGuard;
  assert.equal(guard?.phase, "remoteRestorePending");

  assert.deepEqual(await prepareAccountSignOut(api, accountId), { ok: false, failure: "pendingSyncRequiresNetwork" });
  assert.deepEqual((await getAccountSyncState()).resetGuard, guard);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal(revokeCalls, 0);
});

test("a failed local reset keeps the pre-reset marker and retries the same journal safely", async () => {
  const storage = await prepareBoundAccount();
  await seedHistory();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  const failed = await resetAccountLocalLearningHistory(client(), accountId);
  assert.notEqual(failed.status, "synced");
  assert.equal((await getAccountSyncState()).resetGuard?.phase, "localResetPending");
  storage.setFailurePlan(null);

  const snapshot = await buildAccountDataSnapshot();
  const retried = await resetAccountLocalLearningHistory(client({ getProgress: async () => ({ accountRevision: 2, records: remoteRecords(snapshot) }) }), accountId);
  assert.equal(retried.status, "synced");
  assert.equal((await getAccountSyncState()).resetGuard, null);
});

test("concurrent authenticated reset requests share one guarded operation", async () => {
  await prepareBoundAccount();
  await seedHistory();
  const snapshot = await buildAccountDataSnapshot();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  let reads = 0;
  const api = client({
    getProgress: async () => { reads++; await blocked; return { accountRevision: 3, records: remoteRecords(snapshot) }; },
  });
  const first = resetAccountLocalLearningHistory(api, accountId);
  const second = resetAccountLocalLearningHistory(api, accountId);
  assert.equal(first, second);
  release();
  assert.equal((await first).status, "synced");
  assert.equal(reads, 1);
});

test("reset guard blocks outbox synthesis for a legacy acknowledged record", async () => {
  await prepareBoundAccount();
  await saveActiveTrackId("coding-interview-dsa-problem-solving");
  const state = await getAccountSyncState();
  saveAccountSyncState({
    ...state,
    acknowledged: {
      ["active_track:current"]: {
        fingerprint: "a".repeat(64),
        recordId: "current",
        recordType: "active_track",
        remoteVersion: 1,
        trackId: "coding-interview-dsa-problem-solving",
      },
    },
    resetGuard: {
      accountId,
      createdAt: "2026-01-01T00:00:00.000Z",
      operationId: "reset-guard",
      phase: "remoteRestorePending",
    },
  });
  const guarded = await ensureAccountOutboxFromLocalDataset();
  assert.equal(guarded.outbox.length, 0);
  assert.equal(guarded.resetGuard?.operationId, "reset-guard");
});
