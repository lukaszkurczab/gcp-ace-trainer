import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { saveActiveTrackId, getActiveTrackId } from "./activeTrackRepository";
import { clearActiveTrackId } from "./activeTrackRepository";
import { createDefaultGoal, createLearningPlan, createLearningPlanSlotId } from "../../domain";
import { saveGoalSnapshot, getGoalSnapshot } from "./goalRepository";
import { saveLearningPlanAtomically, getLearningPlanSnapshot } from "./learningPlanRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "./guestInstallationRepository";
import {
  accountDataRecordFingerprint,
  applyRemoteAccountData,
  assertValidAccountDataRecords,
  buildAccountDataSnapshot,
  ensureAccountOutboxFromLocalDataset,
  finishAccountMaterialization,
  getAccountSyncState,
  isCanonicalAccountSyncState,
  isDeletedAccountDataRecord,
  saveAccountSyncState,
  splitAccountSyncBatches,
} from "./accountDataRepository";
import { AccountDataFailure } from "../errors";

const ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
const INSTALLATION_ID = "66666666-6666-4666-8666-666666666666";
const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const TEST_ARTIFACT_SHA256 = "a".repeat(64);

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
});

async function bindSyncedAccount(): Promise<void> {
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId: ACCOUNT_ID, status: "synced" });
}

test("active sessions stay local and block account snapshot export", async () => {
  await saveActiveTrackId(TRACK_ID);
  const snapshot = await buildAccountDataSnapshot();
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["active_track"]);
  assert.equal(snapshot.activeSession, false);
  assert.equal(snapshot.records[0]?.state.trackId, TRACK_ID);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot, "protocolVersion"), false);
});

test("canonical account records round trip through remote materialization", async () => {
  await saveActiveTrackId(TRACK_ID);
  const snapshot = await buildAccountDataSnapshot();
  assertValidAccountDataRecords(snapshot.records);

  await applyRemoteAccountData(snapshot.records);
  assert.equal(await getActiveTrackId(), TRACK_ID);
  assert.equal(isCanonicalAccountSyncState(await getAccountSyncState()), true);
});

test("snapshot and materialization preserve one exact goal-plan bundle", async () => {
  const goal = createDefaultGoal(TRACK_ID);
  await saveGoalSnapshot(goal, null);
  const plan = createLearningPlan({
    schemaVersion: 1,
    planId: "plan:sync",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "test",
    artifactSha256: TEST_ARTIFACT_SHA256,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    planRevision: 1,
    commandId: "command:sync",
    slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan, expectedGoalRevision: 1, expectedPlanStorageRevision: null });

  const snapshot = await buildAccountDataSnapshot();
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["goal", "learning_plan"]);
  assertValidAccountDataRecords(snapshot.records);

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "88888888-8888-4888-8888-888888888888" }; } });
  await applyRemoteAccountData(snapshot.records);
  assert.deepEqual(await getGoalSnapshot(TRACK_ID), { record: goal, revision: 1 });
  assert.deepEqual(getLearningPlanSnapshot(TRACK_ID), { plan, revision: 1 });
});

test("bound account sync validates a goal and learning plan as one sync-plan bundle", async () => {
  await bindSyncedAccount();
  const goal = createDefaultGoal(TRACK_ID);
  await saveGoalSnapshot(goal, null);
  const plan = createLearningPlan({
    schemaVersion: 1,
    planId: "plan:pending-sync",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "test",
    artifactSha256: TEST_ARTIFACT_SHA256,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    planRevision: 1,
    commandId: "command:pending-sync",
    slots: [{ slotId: createLearningPlanSlotId("slot:tue"), day: "tue", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan, expectedGoalRevision: 1, expectedPlanStorageRevision: null });

  const pending = await ensureAccountOutboxFromLocalDataset();

  assert.deepEqual(pending.outbox.map((record) => record.recordType), ["goal", "learning_plan"]);
  assert.deepEqual(pending.syncPlan?.items.map((item) => item.payload.recordType), ["goal", "learning_plan"]);
  assert.equal(isCanonicalAccountSyncState(pending), true);
  assert.deepEqual((await getAccountSyncState()).syncPlan, pending.syncPlan);
});

test("bound account sync builds one retryable canonical outbox and acknowledges it", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(TRACK_ID);
  const pending = await ensureAccountOutboxFromLocalDataset();
  assert.equal(pending.outbox.length, 1);
  assert.equal(pending.outbox[0]?.expectedVersion, null);
  assert.equal(pending.syncPlan?.items[0]?.recordKey, pending.outbox[0] && JSON.stringify({ recordId: "current", recordType: "active_track", trackId: TRACK_ID }));
  const batches = splitAccountSyncBatches({ entries: pending.outbox, expectedAccountRevision: 0, sessionId: "session-canonical", highWatermark: pending.highWatermark });
  assert.equal(batches.length, 1);

  const acknowledged = await finishAccountMaterialization(pending.outbox.map(({ fingerprint, recordId, recordType, state, trackId }) => ({ fingerprint, recordId, recordType, state, trackId, version: 1 })), ACCOUNT_ID, 1, "2026-01-01T00:00:00.000Z");
  assert.equal(acknowledged.status, "synced");
  assert.equal(acknowledged.outbox.length, 0);
  assert.equal(acknowledged.acknowledged[Object.keys(acknowledged.acknowledged)[0] ?? ""]?.remoteVersion, 1);
});

test("bound account outbox creates an explicit tombstone for a deleted acknowledged record", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(TRACK_ID);
  const created = await ensureAccountOutboxFromLocalDataset();
  await finishAccountMaterialization(created.outbox.map(({ fingerprint, recordId, recordType, state, trackId }) => ({ fingerprint, recordId, recordType, state, trackId, version: 1 })), ACCOUNT_ID, 1, "2026-01-01T00:00:00.000Z");

  await clearActiveTrackId();
  const afterDeletion = await ensureAccountOutboxFromLocalDataset();
  assert.equal(afterDeletion.outbox.length, 1);
  assert.equal(isDeletedAccountDataRecord(afterDeletion.outbox[0]!), true);
  assert.deepEqual(afterDeletion.outbox[0]?.state, { deleted: true });
});

test("pending mutation IDs stay stable across an uncertain retry", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(TRACK_ID);
  const first = await ensureAccountOutboxFromLocalDataset();
  const firstEntry = first.outbox[0]!;
  saveAccountSyncState({ ...first, status: "offlinePending", lastFailureCode: "offline" });

  const retry = await ensureAccountOutboxFromLocalDataset();
  assert.equal(retry.outbox[0]?.mutationId, firstEntry.mutationId);
  assert.equal(retry.outbox[0]?.expectedVersion, firstEntry.expectedVersion);
  assert.deepEqual(retry.outbox[0]?.state, firstEntry.state);
});

test("removed identity metadata is rejected before persistence", async () => {
  const state = await getAccountSyncState();
  const record = {
    fingerprint: accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state: { trackId: TRACK_ID }, trackId: TRACK_ID }),
    recordId: "current",
    recordType: "active_track" as const,
    state: { trackId: TRACK_ID, protocolVersion: 4 },
    trackId: TRACK_ID,
    version: 0,
  };
  assert.throws(() => assertValidAccountDataRecords([record]), (error: unknown) => error instanceof AccountDataFailure && error.code === "content_identity_schema_conflict");
  const invalidState = { ...state, protocolVersion: 4, contentIdentitySchema: "patternly:content-identity:v1" } as never;
  assert.equal(isCanonicalAccountSyncState(invalidState), false);
  assert.throws(() => saveAccountSyncState(invalidState), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_sync_state_invalid");
});

test("deleted records keep their exact durable identity and tombstone state", async () => {
  const record = {
    fingerprint: accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state: { deleted: true }, trackId: TRACK_ID }),
    recordId: "current",
    recordType: "active_track" as const,
    state: { deleted: true },
    trackId: TRACK_ID,
    version: 2,
  };
  assert.equal(isDeletedAccountDataRecord(record), true);
  assertValidAccountDataRecords([record]);
});
