import assert from "node:assert/strict";
import test from "node:test";
import { commitMutation } from "./commitMutation";
import { recoverPendingMutation } from "./recoverPendingMutation";
import { attempt, installMemoryStorage, journal, session } from "../../testing/journalTestSupport";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { ensureAccountOutboxFromLocalDataset, getAccountSyncState, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { getActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { getTrainingAttempts } from "../../storage/repositories/trainingAttemptRepository";
import { STORAGE_KEYS } from "../../storage/keys";

async function setup() {
  const storage = installMemoryStorage();
  const accountId = "55555555-5555-4555-8555-555555555555";
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
  return storage;
}

test("local answer commit defers snapshot and outbox construction until account synchronization", async () => {
  await setup();
  const before = await getAccountSyncState();
  await commitMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]));
  const pending = await getAccountSyncState();
  assert.equal(pending.status, "offlinePending");
  assert.equal(pending.localDatasetVersion, before.localDatasetVersion);
  assert.equal(pending.localDatasetFingerprint, before.localDatasetFingerprint);
  assert.deepEqual(pending.outbox, []);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]);
  assert.equal(await getActiveMutationJournal(), null);
  const sync = await ensureAccountOutboxFromLocalDataset();
  assert.equal(sync.outbox.length, 1);
  assert.equal(sync.outbox[0]?.recordId, attempt().id);
});

test("failed pending-sync write retains the verified journal and recovers without duplicating the answer", async () => {
  const storage = await setup();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACCOUNT_SYNC });
  await assert.rejects(commitMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }])));
  assert.equal((await getActiveMutationJournal())?.status, "verified_pending_clear");
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal((await getAccountSyncState()).status, "offlinePending");
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]);
});
