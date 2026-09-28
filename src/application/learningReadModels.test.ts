import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID } from "../domain";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../infrastructure/storage/mmkvClient";
import { getActiveTrackId } from "../storage/repositories/activeTrackRepository";
import { getAccountSyncState, saveAccountSyncState } from "../storage/repositories/accountDataRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../storage/repositories/guestInstallationRepository";
import { loadAccountDataSession } from "./account/accountDataService";
import type { PatternlyApiClient } from "../infrastructure/clients/PatternlyApiClientAdapter";
import { selectActiveTrack } from "./learningReadModels";

const ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
const INSTALLATION_ID = "66666666-6666-4666-8666-666666666666";
const LOCAL_DATASET_ID = "77777777-7777-4777-8777-777777777777";

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: LOCAL_DATASET_ID }; } });
});

test("selecting a track persists locally and marks a synced account pending", async () => {
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId: ACCOUNT_ID, status: "synced" });

  await selectActiveTrack(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);

  assert.equal(await getActiveTrackId(), GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  assert.equal((await getAccountSyncState()).status, "offlinePending");
});

test("selecting a track on a guest installation persists locally without account sync", async () => {
  await selectActiveTrack("coding-interview-dsa-problem-solving");

  assert.equal(await getActiveTrackId(), "coding-interview-dsa-problem-solving");
  assert.equal((await getAccountSyncState()).accountId, null);
  assert.equal((await getAccountSyncState()).status, "initialSyncRequired");
});

test("track selection waits for earlier account materialization and remains the final local choice", async () => {
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId: ACCOUNT_ID, status: "synced" });

  let releaseProgress!: () => void;
  let signalProgressStarted!: () => void;
  const progressStarted = new Promise<void>((resolve) => { signalProgressStarted = resolve; });
  const progressGate = new Promise<void>((resolve) => { releaseProgress = resolve; });
  const api = {
    async getProgress() {
      signalProgressStarted();
      await progressGate;
      return { records: [], accountRevision: 1, generation: 1 };
    },
  } as unknown as PatternlyApiClient;

  const materialization = loadAccountDataSession(api, ACCOUNT_ID);
  await progressStarted;
  const selection = selectActiveTrack("coding-interview-dsa-problem-solving");
  releaseProgress();
  await materialization;
  await selection;

  assert.equal(await getActiveTrackId(), "coding-interview-dsa-problem-solving");
});
