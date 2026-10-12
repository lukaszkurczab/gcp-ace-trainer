import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import {
  buildAccountDataSnapshot,
  ensureAccountOutboxFromLocalDataset,
  getAccountSyncState,
  isCanonicalAccountSyncState,
  saveAccountSyncState,
  saveGuestAdoptionChoice,
  splitAccountSyncBatches,
} from "../../storage/repositories/accountDataRepository";
import { AccountDataFailure } from "../../storage/errors";
import { STORAGE_KEYS } from "../../storage/keys";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";


const ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
const INSTALLATION_ID = "66666666-6666-4666-8666-666666666666";
const TRACK_ID = "coding-interview-dsa-problem-solving" as const;

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
});

test("account snapshot and outbox use one exact canonical identity contract", async () => {
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(productionLearningDataAdmissionContext), accountId: ACCOUNT_ID, status: "synced" }, productionLearningDataAdmissionContext);
  await saveActiveTrackId(TRACK_ID);

  const snapshot = await buildAccountDataSnapshot(productionLearningDataAdmissionContext);
  assert.deepEqual(Object.keys(snapshot).sort(), ["activeSession", "guestSnapshotVersion", "guestUserId", "pendingJournal", "records"]);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot, "protocolVersion"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot, "contentIdentitySchema"), false);
  assert.deepEqual(snapshot.records.map((record) => record.recordType), ["active_track"]);

  const state = await ensureAccountOutboxFromLocalDataset(productionLearningDataAdmissionContext);
  assert.equal(state.outbox.length, 1);
  assert.equal(isCanonicalAccountSyncState(state, productionLearningDataAdmissionContext), true);
  assert.equal(state.syncPlan?.items[0]?.payload.recordType, "active_track");
  assert.equal(state.syncPlan && Object.prototype.hasOwnProperty.call(state.syncPlan, "protocolVersion"), false);

  const batches = splitAccountSyncBatches({ entries: state.outbox, expectedAccountRevision: state.remoteAccountRevision, sessionId: "session-canonical", highWatermark: state.highWatermark }, productionLearningDataAdmissionContext);
  assert.equal(batches.length, 1);
  assert.equal(batches[0]?.[0]?.recordType, "active_track");
});

test("stored account state rejects removed protocol and content schema fields", async () => {
  const state = await getAccountSyncState(productionLearningDataAdmissionContext);
  const invalid = { ...state, protocolVersion: 4, contentIdentitySchema: "patternly:content-identity:v1" } as unknown;
  assert.equal(isCanonicalAccountSyncState(invalid, productionLearningDataAdmissionContext), false);
  assert.throws(() => saveAccountSyncState(invalid as never, productionLearningDataAdmissionContext), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_sync_state_invalid");
});

test("guest adoption choice is canonical and survives a durable reread", async () => {
  assert.equal((await getAccountSyncState(productionLearningDataAdmissionContext)).guestAdoptionChoice, "transfer");
  await saveGuestAdoptionChoice("discard", productionLearningDataAdmissionContext);
  assert.equal((await getAccountSyncState(productionLearningDataAdmissionContext)).guestAdoptionChoice, "discard");
  const invalid = { ...await getAccountSyncState(productionLearningDataAdmissionContext), guestAdoptionChoice: "later" } as never;
  assert.equal(isCanonicalAccountSyncState(invalid, productionLearningDataAdmissionContext), false);
  assert.throws(() => saveAccountSyncState(invalid, productionLearningDataAdmissionContext), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_sync_state_invalid");
});

test("stored account state fails closed instead of assigning missing outbox sequence", async () => {
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(productionLearningDataAdmissionContext), accountId: ACCOUNT_ID, status: "synced" }, productionLearningDataAdmissionContext);
  await saveActiveTrackId(TRACK_ID);
  const current = await ensureAccountOutboxFromLocalDataset(productionLearningDataAdmissionContext);
  const entry = current.outbox[0];
  assert.ok(entry);
  const { sequence: _sequence, ...legacyEntry } = entry;
  const legacyState = { ...current, outbox: [legacyEntry], outboxSequence: 0, highWatermark: 0 };
  getKeyValueStorage().setString(STORAGE_KEYS.ACCOUNT_SYNC, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 99, payload: legacyState }));
  await assert.rejects(() => getAccountSyncState(productionLearningDataAdmissionContext), (error: unknown) => error instanceof AccountDataFailure && error.code === "account_sync_state_invalid");
});
