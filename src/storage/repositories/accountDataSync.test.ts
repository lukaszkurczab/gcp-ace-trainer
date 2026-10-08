import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { saveActiveTrackId, getActiveTrackId } from "./activeTrackRepository";
import { clearActiveTrackId } from "./activeTrackRepository";
import { createDefaultGoal, createLearningPlan, createLearningPlanSlotId, createResolvedContentRef, type ReviewQueueEntry } from "../../domain";
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
  partitionRemoteAccountDataForRecovery,
  saveAccountSyncState,
  splitAccountSyncBatches,
} from "./accountDataRepository";
import { AccountDataFailure } from "../errors";
import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID } from "../../domain";
import { addReviewQueueItems, getReviewQueueItems } from "./reviewQueueRepository";

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

test("review cycle history and active obligations survive account snapshot materialization without advancing", async () => {
  const item = createResolvedContentRef({ trackId: TRACK_ID, questionId: "sync-review-item", contentVersion: "sync-fixture-v1", artifactSha256: TEST_ARTIFACT_SHA256 });
  const shared = {
    trackId: TRACK_ID,
    sourceSessionId: "sync-review-session",
    sourceItem: item,
    taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: "sync-unit", role: "primary" }],
    createdAt: "2026-10-01T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
  } as const;
  const active: ReviewQueueEntry = {
    ...shared,
    id: "review-sync-active",
    sourceAttemptId: "attempt-sync-active",
    reasons: ["incorrect"],
    persistent: true,
    dueAt: "2026-10-08T12:00:00.000Z",
    policyVersion: "bizq04-v1",
    stage: "repair24",
    status: "active",
  };
  const completed: ReviewQueueEntry = {
    ...shared,
    id: "review-sync-completed",
    sourceAttemptId: "attempt-sync-completed",
    reasons: ["scheduled_retrieval"],
    persistent: false,
    policyVersion: "bizq04-v1",
    stage: "retention28",
    status: "completed",
    completedAt: "2026-10-08T12:00:00.000Z",
    completedByAttemptId: "attempt-sync-completed",
  };
  const priorCompleted: ReviewQueueEntry = {
    ...completed,
    id: "review-sync-completed-prior",
    sourceAttemptId: "attempt-sync-completed-prior-source",
    completedAt: "2026-10-01T12:00:00.000Z",
    completedByAttemptId: "attempt-sync-completed-prior",
  };
  await addReviewQueueItems([active, priorCompleted, completed]);
  const snapshot = await buildAccountDataSnapshot();
  const reviewRecords = snapshot.records.filter((record) => record.recordType === "review_queue_entry");
  assert.equal(reviewRecords.length, 3);
  assertValidAccountDataRecords(reviewRecords);

  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "88888888-8888-4888-8888-888888888888" }; } });
  await applyRemoteAccountData(reviewRecords);

  const restored = (await getReviewQueueItems()).value;
  assert.deepEqual(restored, [active, priorCompleted, completed]);
  assert.equal(restored.find((entry) => entry.id === completed.id)?.dueAt, undefined);
  assert.equal(restored.find((entry) => entry.id === completed.id)?.completedByAttemptId, "attempt-sync-completed");
  assert.equal(restored.find((entry) => entry.status === "active")?.dueAt, active.dueAt);
});

test("remote materialization keeps the newest active track independent of input order and acknowledges both records", async () => {
  const older = remoteActiveTrack(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "2026-01-01T10:00:00.000Z");
  const newer = remoteActiveTrack(TRACK_ID, "2026-01-02T10:00:00.000Z");
  for (const records of [[older, newer], [newer, older]]) {
    const storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
    const partition = await partitionRemoteAccountDataForRecovery({ accountId: ACCOUNT_ID, generation: 0, records });
    await applyRemoteAccountData(partition.records);
    const completed = await finishAccountMaterialization(partition.records, ACCOUNT_ID, 2, "2026-01-03T10:00:00.000Z", partition.incident);
    assert.equal(completed.acknowledged[JSON.stringify({ recordId: "current", recordType: "active_track", trackId: TRACK_ID })]?.remoteVersion, 1);
    assert.equal(completed.acknowledged[JSON.stringify({ recordId: "current", recordType: "active_track", trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID })]?.remoteVersion, 1);
    // Reinstalling the adapter models a fresh repository instance over persisted storage.
    installKeyValueStorageForTests(storage);
    assert.equal(await getActiveTrackId(), TRACK_ID);
  }
});

test("remote materialization rejects missing or invalid updatedAt", async () => {
  const record = remoteActiveTrack(TRACK_ID, "2026-01-01T10:00:00.000Z");
  await assert.rejects(partitionRemoteAccountDataForRecovery({ accountId: ACCOUNT_ID, generation: 0, records: [{ ...record, updatedAt: undefined } as never] }), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_data_record_invalid");
  await assert.rejects(partitionRemoteAccountDataForRecovery({ accountId: ACCOUNT_ID, generation: 0, records: [{ ...record, updatedAt: "yesterday" }] }), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_data_record_invalid");
});

test("equal updatedAt selects the same active track using canonical identity", async () => {
  const records = [remoteActiveTrack(TRACK_ID, "2026-01-01T10:00:00.000Z"), remoteActiveTrack(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "2026-01-01T10:00:00.000Z")];
  const first = await partitionRemoteAccountDataForRecovery({ accountId: ACCOUNT_ID, generation: 0, records });
  const second = await partitionRemoteAccountDataForRecovery({ accountId: ACCOUNT_ID, generation: 0, records: [...records].reverse() });
  assert.equal(first.records.at(-1)?.trackId, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  assert.equal(second.records.at(-1)?.trackId, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
});

function remoteActiveTrack(trackId: string, updatedAt: string) {
  const record = { recordId: "current", recordType: "active_track" as const, state: { trackId }, trackId, version: 1 };
  return { ...record, fingerprint: accountDataRecordFingerprint(record), updatedAt };
}

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

test("reselecting an acknowledged active track tombstones the previously acknowledged track", async () => {
  await bindSyncedAccount();
  const otherTrackId = GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;
  const records = [TRACK_ID, otherTrackId].map((trackId, index) => {
    const { updatedAt, ...record } = remoteActiveTrack(trackId, `2026-01-0${index + 1}T00:00:00.000Z`);
    return record;
  });
  const acknowledged = await finishAccountMaterialization(records, ACCOUNT_ID, 2, "2026-01-02T00:00:00.000Z");
  assert.equal(acknowledged.outbox.length, 0);

  await saveActiveTrackId(TRACK_ID);
  const pending = await ensureAccountOutboxFromLocalDataset();

  assert.equal(pending.outbox.length, 1);
  assert.equal(pending.outbox[0]?.recordType, "active_track");
  assert.equal(pending.outbox[0]?.trackId, otherTrackId);
  assert.equal(isDeletedAccountDataRecord(pending.outbox[0]!), true);
  assert.deepEqual(pending.outbox[0]?.state, { deleted: true });
  assert.deepEqual(pending.syncPlan?.items.map((item) => item.payload.trackId), [otherTrackId]);
  assert.deepEqual(pending.syncPlan?.items.map((item) => item.payload.state), [{ deleted: true }]);
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
