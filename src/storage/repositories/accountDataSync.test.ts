import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { completeTrainingSession, createDefaultGoal, createLearningPlan, createTrainingSession, createTrainingSessionResult } from "../../domain";
import { createLearningPlanSlotId } from "../../domain/learning/slotIdentity";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { canonicalJsonV1ByteLength } from "../../infrastructure/identity/canonicalSerialization";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  accountDataRecordFingerprint,
  accountDataRecordKey,
  applyRemoteAccountData,
  assertValidAccountDataRecords,
  buildAccountDataSnapshot,
  ensureAccountOutboxFromLocalDataset,
  finishAccountMaterialization,
  getAccountSyncState,
  isDeletedAccountDataRecord,
  saveAccountSyncState,
  splitAccountSyncBatches,
} from "./accountDataRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "./guestInstallationRepository";
import { clearActiveTrackId, saveActiveTrackId } from "./activeTrackRepository";
import { saveTrainingSession } from "./trainingSessionRepository";
import { getTrainingSessionResult, saveTrainingSessionResult } from "./trainingSessionResultRepository";
import { getGoalSnapshot, saveGoal } from "./goalRepository";
import { getLearningPlanSnapshot, saveLearningPlanAtomically } from "./learningPlanRepository";

const accountId = "55555555-5555-4555-8555-555555555555";
const trackId = "coding-interview-dsa-problem-solving" as const;
const alternateTrackId = "object-oriented-design-interview" as const;

function activeSession() {
  const item = { trackId, itemId: "two-sum-001", contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN };
  return createTrainingSession({
    id: "active-session",
    trackId,
    modeId: "guided",
    configurationSnapshot: { kind: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "test",
    packagePin: TEST_CONTENT_PACKAGE_PIN,
    status: "active",
    startedAt: "2026-01-01T00:00:00.000Z",
  });
}

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
});

async function bindSyncedAccount(remoteAccountRevision = 0) {
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced", remoteAccountRevision });
}

async function acknowledgeOutbox(outbox: Awaited<ReturnType<typeof ensureAccountOutboxFromLocalDataset>>["outbox"], remoteAccountRevision: number) {
  return finishAccountMaterialization(outbox.map(({ fingerprint, recordId, recordType, state, trackId }) => ({ fingerprint, recordId, recordType, state, trackId, version: remoteAccountRevision })), accountId, remoteAccountRevision, `2026-01-01T00:0${remoteAccountRevision}:00.000Z`);
}

function legacyMutationId(entry: Awaited<ReturnType<typeof ensureAccountOutboxFromLocalDataset>>["outbox"][number]): string {
  return `mutation_${sha256Utf8(`${accountId}:${entry.recordType}:${entry.recordId}:${entry.fingerprint}`)}`;
}

test("snapshot allowlist excludes an active session from account records while exposing the blocking precondition", async () => {
  await saveActiveTrackId(trackId);
  await saveTrainingSession(activeSession());
  const snapshot = await buildAccountDataSnapshot();
  assert.equal(snapshot.activeSession, true);
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["active_track"]);
  assert.equal(snapshot.records.some((record) => record.recordType === "training_session_summary"), false);
});

test("completed results roundtrip by their own identity while remaining readable by session identity", async () => {
  const completedAt = "2026-01-01T00:01:00.000Z";
  const session = completeTrainingSession(activeSession(), completedAt);
  const result = createTrainingSessionResult({
    id: `${session.id}:result`, sessionId: session.id, trackId,
    totalOccurrences: 1, answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [],
    completedAt, evidence: { familyId: "coding_interview", details: { correctCount: 1 } },
  });
  await saveTrainingSession(session);
  await saveTrainingSessionResult(result);
  const { records } = await buildAccountDataSnapshot();
  const exported = records.find((record) => record.recordType === "training_session_result")!;
  assert.equal(exported.recordId, result.id);
  assert.notEqual(exported.recordId, result.sessionId);
  assertValidAccountDataRecords(records);
  await applyRemoteAccountData(records);
  assert.deepEqual(await getTrainingSessionResult(session.id), result);
  const mismatched = { ...exported, recordId: session.id };
  mismatched.fingerprint = accountDataRecordFingerprint(mismatched);
  assert.throws(() => assertValidAccountDataRecords([mismatched]), /account_data_result_invalid/);
});

test("v2 snapshot and materialization preserve one exact goal-plan bundle", async () => {
  const goal = createDefaultGoal(trackId);
  await saveGoal(goal);
  const plan = createLearningPlan({
    schemaVersion: 1, planId: "plan:sync", trackId, goalRevision: 1, status: "accepted",
    timezone: "Europe/Warsaw", contentVersion: "test", contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "none", targetDate: null }, createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z", planRevision: 1, commandId: "command:sync",
    slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically(trackId, plan, 1, null);

  const snapshot = await buildAccountDataSnapshot();
  assert.equal(snapshot.protocolVersion, 2);
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["goal", "learning_plan"]);
  assertValidAccountDataRecords(snapshot.records);

  await applyRemoteAccountData(snapshot.records);
  assert.deepEqual(await getGoalSnapshot(trackId), { record: goal, revision: 1 });
  assert.deepEqual(getLearningPlanSnapshot(trackId), { plan, revision: 1 });
});

test("bound account outbox is deterministic and creates an explicit tombstone for a deleted acknowledged record", async () => {
  await saveActiveTrackId(trackId);
  const initial = await buildAccountDataSnapshot();
  const state = await getAccountSyncState();
  await bindGuestInstallationToAccount(accountId);
  const bound = saveAccountSyncState({ ...state, accountId, status: "synced" });
  await finishAccountMaterialization(initial.records, accountId, 1, "2026-01-01T00:00:00.000Z");
  const first = await ensureAccountOutboxFromLocalDataset();
  assert.equal(first.outbox.length, 0);
  const acknowledged = await getAccountSyncState();
  assert.equal(acknowledged.acknowledged[accountDataRecordKey({ recordId: "current", recordType: "active_track", trackId })]?.fingerprint, accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state: { trackId }, trackId }));
  await clearActiveTrackId();
  const afterDeletion = await ensureAccountOutboxFromLocalDataset();
  assert.equal(afterDeletion.outbox.length, 1);
  assert.equal(isDeletedAccountDataRecord(afterDeletion.outbox[0]!), true);
  await acknowledgeOutbox(afterDeletion.outbox, 2);
  const afterConfirmedDeletion = await ensureAccountOutboxFromLocalDataset();
  assert.equal(afterConfirmedDeletion.outbox.length, 0);
  assert.equal(afterConfirmedDeletion.remoteAccountRevision, 2);
});

test("legacy acknowledged keys migrate to the full record identity without losing version", async () => {
  await saveActiveTrackId(trackId);
  const snapshot = await buildAccountDataSnapshot();
  const active = snapshot.records[0]!;
  await bindGuestInstallationToAccount(accountId);
  const current = await getAccountSyncState();
  saveAccountSyncState({
    ...current,
    accountId,
    status: "synced",
    acknowledged: Object.freeze({
      "active_track:current": Object.freeze({ fingerprint: active.fingerprint, recordId: active.recordId, recordType: active.recordType, remoteVersion: 7, trackId: active.trackId }),
    }),
  });

  const migrated = await getAccountSyncState();
  const key = accountDataRecordKey(active);
  assert.equal(migrated.acknowledged[key]?.remoteVersion, 7);
  assert.equal(migrated.acknowledged["active_track:current"], undefined);
  const afterMigration = await buildAccountDataSnapshot();
  assert.equal(afterMigration.records[0]?.version, 7);
});

test("legacy durable plan keys migrate without changing the retry plan identity", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const pending = await ensureAccountOutboxFromLocalDataset();
  const plan = pending.syncPlan!;
  const legacyPlan = Object.freeze({
    ...plan,
    items: Object.freeze(plan.items.map((item) => Object.freeze({ ...item, recordKey: "active_track:current" }))),
  });
  saveAccountSyncState({ ...pending, syncPlan: legacyPlan });

  const migrated = await getAccountSyncState();
  assert.equal(migrated.syncPlan?.planId, plan.planId);
  assert.equal(migrated.syncPlan?.items[0]?.recordKey, accountDataRecordKey(pending.outbox[0]!));
});

test("track-scoped ACK/version state does not leak the active record across tracks", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const first = await ensureAccountOutboxFromLocalDataset();
  const firstId = first.outbox[0]!.mutationId;
  await acknowledgeOutbox(first.outbox, 1);

  await saveActiveTrackId(alternateTrackId);
  const second = await ensureAccountOutboxFromLocalDataset();
  assert.equal(second.outbox[0]!.expectedVersion, null);
  const secondId = second.outbox[0]!.mutationId;
  await acknowledgeOutbox(second.outbox, 2);

  await saveActiveTrackId(trackId);
  const returned = await ensureAccountOutboxFromLocalDataset();
  assert.equal(returned.outbox.length, 0);
  assert.equal(returned.acknowledged[accountDataRecordKey({ recordId: "current", recordType: "active_track", trackId })]?.remoteVersion, 1);
  assert.equal(returned.acknowledged[accountDataRecordKey({ recordId: "current", recordType: "active_track", trackId: alternateTrackId })]?.remoteVersion, 2);
  assert.notEqual(firstId, secondId);
});

test("pending mutation IDs stay stable across an uncertain retry", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const first = await ensureAccountOutboxFromLocalDataset();
  const firstEntry = first.outbox[0]!;
  saveAccountSyncState({ ...first, status: "offlinePending", lastFailureCode: "offline" });

  const retry = await ensureAccountOutboxFromLocalDataset();
  assert.equal(retry.outbox[0]!.mutationId, firstEntry.mutationId);
  assert.equal(retry.outbox[0]!.expectedVersion, firstEntry.expectedVersion);
  assert.deepEqual(retry.outbox[0]!.state, firstEntry.state);
});

test("a partially acknowledged plan keeps its identity and original revision across reload", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const planned = await ensureAccountOutboxFromLocalDataset();
  const plan = planned.syncPlan!;
  const acknowledgedItem = Object.freeze({ ...plan.items[0]!, status: "acked" as const });
  saveAccountSyncState({
    ...planned,
    status: "offlinePending",
    remoteAccountRevision: 1,
    syncPlan: Object.freeze({ ...plan, items: Object.freeze([acknowledgedItem, ...plan.items.slice(1)]) }),
  });

  const reloaded = await ensureAccountOutboxFromLocalDataset();
  assert.equal(reloaded.syncPlan?.planId, plan.planId);
  assert.equal(reloaded.syncPlan?.expectedAccountRevision, plan.expectedAccountRevision);
  assert.equal(reloaded.syncPlan?.items[0]?.status, "acked");
});

test("delete, recreate, and delete again use distinct version-bound tombstone IDs", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const created = await ensureAccountOutboxFromLocalDataset();
  await acknowledgeOutbox(created.outbox, 1);

  await clearActiveTrackId();
  const firstDeletion = await ensureAccountOutboxFromLocalDataset();
  const firstDeletionId = firstDeletion.outbox[0]!.mutationId;
  assert.equal(firstDeletion.outbox[0]!.expectedVersion, 1);
  await acknowledgeOutbox(firstDeletion.outbox, 2);

  await saveActiveTrackId(trackId);
  const recreated = await ensureAccountOutboxFromLocalDataset();
  await acknowledgeOutbox(recreated.outbox, 3);

  await clearActiveTrackId();
  const secondDeletion = await ensureAccountOutboxFromLocalDataset();
  assert.equal(secondDeletion.outbox[0]!.expectedVersion, 3);
  assert.notEqual(firstDeletionId, secondDeletion.outbox[0]!.mutationId);
});

test("only a confirmed mutation_id_reuse rekeys the rejected outbox command and preserves its payload and version", async () => {
  await saveActiveTrackId(trackId);
  const initial = await buildAccountDataSnapshot();
  await bindSyncedAccount();
  await finishAccountMaterialization(initial.records.map((record) => ({ ...record, version: 3 })), accountId, 3, "2026-01-01T00:03:00.000Z");

  await saveActiveTrackId(alternateTrackId);
  const pending = await ensureAccountOutboxFromLocalDataset();
  const original = pending.outbox[0]!;
  const rejectedId = legacyMutationId(original);
  const rejected = Object.freeze({ ...original, mutationId: rejectedId });
  saveAccountSyncState({ ...pending, status: "failed", lastFailureCode: "mutation_id_reuse", outbox: Object.freeze([rejected]) });

  const repaired = await ensureAccountOutboxFromLocalDataset();
  const repairedEntry = repaired.outbox[0]!;
  assert.notEqual(repairedEntry.mutationId, rejectedId);
  assert.equal(repairedEntry.expectedVersion, original.expectedVersion);
  assert.equal(repairedEntry.version, original.version);
  assert.equal(repairedEntry.recordId, original.recordId);
  assert.equal(repairedEntry.recordType, original.recordType);
  assert.equal(repairedEntry.trackId, original.trackId);
  assert.deepEqual(repairedEntry.state, original.state);

  const stable = await ensureAccountOutboxFromLocalDataset();
  assert.equal(stable.outbox[0]!.mutationId, repairedEntry.mutationId);
});

test("an offline or otherwise uncertain retry preserves an old pending mutation ID", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const pending = await ensureAccountOutboxFromLocalDataset();
  const entry = pending.outbox[0]!;
  const uncertain = Object.freeze({ ...entry, mutationId: legacyMutationId(entry) });
  saveAccountSyncState({ ...pending, status: "offlinePending", lastFailureCode: "offline", outbox: Object.freeze([uncertain]) });

  const retry = await ensureAccountOutboxFromLocalDataset();
  assert.equal(retry.outbox[0]!.mutationId, uncertain.mutationId);
  assert.equal(retry.outbox[0]!.expectedVersion, uncertain.expectedVersion);
});

test("protocol-v3 splitter is deterministic and byte bounded", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const base = (await ensureAccountOutboxFromLocalDataset()).outbox[0]!;
  const makeEntry = (index: number, stateSize: number) => {
    const state = { trackId, payload: "x".repeat(stateSize) };
    const record = { ...base, recordId: `record-${index}`, state, fingerprint: accountDataRecordFingerprint({ recordId: `record-${index}`, recordType: base.recordType, state, trackId }), mutationId: `mutation_${String(index).padStart(16, "0")}`, sequence: index + 1 } as const;
    return record;
  };
  const entries = [makeEntry(0, 280_000), makeEntry(1, 280_000)];
  const input = { entries, expectedAccountRevision: 4, sessionId: "plan_test", highWatermark: 2 } as const;
  const batches = splitAccountSyncBatches(input);
  assert.equal(batches.length, 2);
  for (const batch of batches) {
    const envelope = { schema: "canonical-json-v1", payload: { protocolVersion: 3, canonicalVersion: "canonical-json-v1", expectedAccountRevision: 4, deviceId: "00000000-0000-4000-8000-000000000000", sessionId: "plan_test", batchId: "plan_test:batch:999", planVersion: 3, highWatermark: 2, mutations: batch.map((entry) => ({ mutationId: entry.mutationId, kind: "node", recordType: entry.recordType, trackId: entry.trackId, targetId: entry.recordId, expectedVersion: entry.expectedVersion, fingerprint: entry.fingerprint, state: entry.state })) } };
    assert.ok(canonicalJsonV1ByteLength(envelope) <= 512 * 1024);
  }
  assert.deepEqual(splitAccountSyncBatches({ ...input, entries: [...entries].reverse() }).map((batch) => batch.map((entry) => entry.mutationId)), batches.map((batch) => batch.map((entry) => entry.mutationId)));
});

test("protocol-v3 splitter rejects an individual record above the full envelope budget", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const base = (await ensureAccountOutboxFromLocalDataset()).outbox[0]!;
  const state = { trackId, payload: "x".repeat(530_000) };
  const oversized = { ...base, state, fingerprint: accountDataRecordFingerprint({ recordId: base.recordId, recordType: base.recordType, state, trackId }) };
  assert.throws(() => splitAccountSyncBatches({ entries: [oversized] }), /account_sync_record_too_large/u);
});

test("protocol-v3 durable plan keeps an immutable payload snapshot across reload", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const planned = await ensureAccountOutboxFromLocalDataset();
  const item = planned.syncPlan?.items[0];
  assert.ok(item);
  assert.notEqual(item.payload, planned.outbox[0]);
  assert.equal(Object.isFrozen(item), true);
  assert.equal(Object.isFrozen(item.payload), true);
  assert.equal(Object.isFrozen(item.payload.state), true);
  const payloadFingerprint = item.payload.fingerprint;
  const reloaded = await getAccountSyncState();
  assert.equal(reloaded.syncPlan?.items[0]?.payload.fingerprint, payloadFingerprint);
  assert.equal(Object.isFrozen(reloaded.syncPlan?.items[0]?.payload.state), true);
  const mutableView = reloaded.syncPlan!.items[0]!.payload.state as Record<string, unknown>;
  assert.equal(Reflect.set(mutableView, "tampered", true), false);
  assert.equal("tampered" in mutableView, false);
});
