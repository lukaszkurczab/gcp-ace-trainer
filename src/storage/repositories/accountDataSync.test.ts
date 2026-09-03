import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { completeTrainingSession, createTrainingSession, createTrainingSessionResult } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  accountDataRecordFingerprint,
  applyRemoteAccountData,
  assertValidAccountDataRecords,
  buildAccountDataSnapshot,
  ensureAccountOutboxFromLocalDataset,
  finishAccountMaterialization,
  getAccountSyncState,
  isDeletedAccountDataRecord,
  saveAccountSyncState,
} from "./accountDataRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "./guestInstallationRepository";
import { clearActiveTrackId, saveActiveTrackId } from "./activeTrackRepository";
import { saveTrainingSession } from "./trainingSessionRepository";
import { getTrainingSessionResult, saveTrainingSessionResult } from "./trainingSessionResultRepository";

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
  assert.equal(acknowledged.acknowledged["active_track:current"]?.fingerprint, accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state: { trackId }, trackId }));
  await clearActiveTrackId();
  const afterDeletion = await ensureAccountOutboxFromLocalDataset();
  assert.equal(afterDeletion.outbox.length, 1);
  assert.equal(isDeletedAccountDataRecord(afterDeletion.outbox[0]!), true);
});

test("mutation IDs include the expected remote version so returning to a prior value is a new command", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const first = await ensureAccountOutboxFromLocalDataset();
  const firstId = first.outbox[0]!.mutationId;
  await acknowledgeOutbox(first.outbox, 1);

  await saveActiveTrackId(alternateTrackId);
  const second = await ensureAccountOutboxFromLocalDataset();
  const secondId = second.outbox[0]!.mutationId;
  assert.equal(second.outbox[0]!.expectedVersion, 1);
  await acknowledgeOutbox(second.outbox, 2);

  await saveActiveTrackId(trackId);
  const returned = await ensureAccountOutboxFromLocalDataset();
  assert.equal(returned.outbox[0]!.expectedVersion, 2);
  assert.notEqual(firstId, secondId);
  assert.notEqual(firstId, returned.outbox[0]!.mutationId);
  assert.notEqual(secondId, returned.outbox[0]!.mutationId);
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
