import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createTrainingSession } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  accountDataRecordFingerprint,
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

const accountId = "55555555-5555-4555-8555-555555555555";
const trackId = "coding-interview-dsa-problem-solving" as const;

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

test("snapshot allowlist excludes an active session from account records while exposing the blocking precondition", async () => {
  await saveActiveTrackId(trackId);
  await saveTrainingSession(activeSession());
  const snapshot = await buildAccountDataSnapshot();
  assert.equal(snapshot.activeSession, true);
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["active_track"]);
  assert.equal(snapshot.records.some((record) => record.recordType === "training_session_summary"), false);
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
