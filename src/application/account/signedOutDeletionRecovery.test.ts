import assert from "node:assert/strict";
import test from "node:test";
import { resumeSelectedAccountDeletionWithoutAuth } from "./accountDataService";
import { MemoryKeyValueStorage, activatePreparedProfile, captureActiveProfileStorageLease, closeActiveProfileStorage, getActiveStorageProfileOrNull, getKeyValueStorage, installKeyValueStorageForTests, onKeyValueStorageReady, prepareProfileStorage, selectPreparedAccountProfile, selectPreparedGuestProfile, setProfileStoragePreparationFactoryForTests, writeActiveAccountIdentityBinding } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { beginAccountDeletion, getPreparedAccountDeletionState, updateAccountDeletionState } from "../../storage/repositories/accountLifecycleRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";

const accountId = "deletion-account";
const uid = "removed-firebase-user";
const proofId = "proof-exact";
const prepareNoopRemoteDeletion = async (_accountId: string) => undefined;

test.afterEach(() => {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

async function fixture(bindingUid: string | null = uid) {
  const base = new MemoryKeyValueStorage();
  const values = new Map<string, string>();
  let next = 10;
  const uuid = () => `00000000-0000-4000-8000-${String(next++).padStart(12, "0")}`;
  const control = {
    async get(key: string) { return values.get(key) ?? null; },
    async set(key: string, value: string) { values.set(key, value); },
    async remove(key: string) { values.delete(key); },
  };
  const identity = { async create() { return { installationId: uuid(), localDatasetId: uuid() }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  router.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "guest-preserved");
  const foreign = await router.selectAccount("foreign-account");
  router = await openProfileStorageRouter(base, control, { identity });
  router.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "foreign-preserved");
  const selected = await router.selectAccount(accountId);
  router = await openProfileStorageRouter(base, control, { identity });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  activatePreparedProfile(selected.id, "account");
  if (bindingUid) await writeActiveAccountIdentityBinding({ lease: captureActiveProfileStorageLease()!, accountId, firebaseUid: bindingUid, canContinue: () => true });
  const storage = getKeyValueStorage();
  storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "learning-a");
  storage.setString(STORAGE_KEYS.goal("fixture"), "learning-b");
  storage.setString(STORAGE_KEYS.SETTINGS, "settings-preserved");
  const marker = beginAccountDeletion(accountId, uid);
  const protectedEntries = base.getAllKeys().filter(key => !key.includes(selected.id)).map(key => [key, base.getString(key)]);
  closeActiveProfileStorage();
  const calls: string[] = [];
  const api: Pick<PatternlyApiClient, "getDeletionOperationStatus" | "getDeletionProof"> = {
    async getDeletionOperationStatus(id, secret) {
      assert.equal(getActiveStorageProfileOrNull(), null);
      assert.equal(id, marker.operationId);
      assert.equal(secret, marker.operationSecret);
      calls.push("status");
      return { status: "complete", operationId: id, proofId };
    },
    async getDeletionProof(id) {
      assert.equal(getActiveStorageProfileOrNull(), null);
      assert.equal(id, proofId);
      calls.push("proof");
      return { status: "deleted", operationId: marker.operationId, proofId };
    },
  };
  const learningKeys = () => base.getAllKeys().filter(key => key.includes(selected.id) && (key.endsWith(encodeURIComponent(STORAGE_KEYS.ACTIVE_TRACK)) || key.endsWith(encodeURIComponent(STORAGE_KEYS.goal("fixture")))));
  const assertProtected = () => assert.deepEqual(base.getAllKeys().filter(key => !key.includes(selected.id)).map(key => [key, base.getString(key)]), protectedEntries);
  return { base, router, selected, foreign, marker, api, calls, learningKeys, assertProtected };
}

for (const binding of [uid, null]) test(`proof-only cleanup with ${binding ? "verified" : "missing"} binding closes scope and preserves other profiles`, async () => {
  const f = await fixture(binding);
  let ready = 0;
  const unsubscribe = onKeyValueStorageReady(() => { ready += 1; });
  let preparation = 0;
  try {
    const result = await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => { preparation += 1; return true; }, async () => { f.calls.push("detach"); }, () => true);
    assert.deepEqual(result, { accountId, result: { ok: true, proofId } });
    assert.deepEqual(f.calls, ["detach", "status", "proof"], "the SDK is detached before the status endpoint can resume provider deletion");
    assert.equal(preparation, 1);
    assert.equal(ready, 0);
    assert.equal(getActiveStorageProfileOrNull(), null);
    assert.equal(f.learningKeys().length, 0);
    assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), { ...f.marker, status: "complete", proofId });
    f.assertProtected();
    assert.equal(await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, prepareNoopRemoteDeletion, () => true), null);
    assert.equal(f.calls.length, 3, "the completed marker still drains the local SDK lane but does not request status again");
  } finally { unsubscribe(); }
});

for (const scenario of ["offline", "pending", "wrong-operation", "wrong-proof", "proof-offline", "binding-mismatch"]) test(`unresolved ${scenario} retains intent and data without activation`, async () => {
  const f = await fixture(scenario === "binding-mismatch" ? "another-uid" : uid);
  const api = { ...f.api };
  if (scenario === "offline") api.getDeletionOperationStatus = async () => { throw Error("offline"); };
  if (scenario === "pending") api.getDeletionOperationStatus = async () => ({ status: "pending", operationId: f.marker.operationId, proofId: null });
  if (scenario === "wrong-operation") api.getDeletionOperationStatus = async () => ({ status: "complete", operationId: "other-operation", proofId });
  if (scenario === "wrong-proof") api.getDeletionProof = async () => ({ status: "deleted", operationId: f.marker.operationId, proofId: "different-proof" });
  if (scenario === "proof-offline") api.getDeletionProof = async () => { throw Error("offline"); };
  let preparations = 0;
  const result = await resumeSelectedAccountDeletionWithoutAuth(api, async () => { preparations += 1; return true; }, prepareNoopRemoteDeletion, () => true);
  assert.equal(result?.result.ok, false);
  assert.equal(preparations, 0);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), f.marker);
  assert.equal(f.learningKeys().length, 2);
  f.assertProtected();
});

test("an auth/selection change during status resolution fences cleanup", async () => {
  const f = await fixture();
  let current = true;
  const api = { ...f.api, getDeletionOperationStatus: async () => { current = false; return { status: "complete" as const, operationId: f.marker.operationId, proofId }; } };
  assert.equal((await resumeSelectedAccountDeletionWithoutAuth(api, async () => true, prepareNoopRemoteDeletion, () => current))?.result.ok, false);
  assert.equal(f.learningKeys().length, 2);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), f.marker);
});

test("failed RevenueCat detach prevents signed-out deletion status resolution", async () => {
  const f = await fixture();
  const result = await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, async () => { throw Error("RevenueCat logout failed"); }, () => true);
  assert.deepEqual(result, { accountId, result: { ok: false, failure: "remoteDeletionPending" } });
  assert.deepEqual(f.calls, []);
  assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), f.marker);
  f.assertProtected();
});

test("a replaced marker during proof resolution is preserved", async () => {
  const f = await fixture();
  let replacement = f.marker;
  const api = { ...f.api, getDeletionProof: async () => {
    activatePreparedProfile(f.selected.id, "account", { deferReadyNotification: true });
    replacement = beginAccountDeletion(accountId, uid);
    closeActiveProfileStorage();
    return { status: "deleted" as const, operationId: f.marker.operationId, proofId };
  } };
  assert.equal((await resumeSelectedAccountDeletionWithoutAuth(api, async () => true, prepareNoopRemoteDeletion, () => true))?.result.ok, false);
  assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), replacement);
  assert.equal(f.learningKeys().length, 2);
});

test("cleanup failure retains proof and exact ID for a cold preparation retry", async () => {
  const f = await fixture();
  const failure = await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => false, prepareNoopRemoteDeletion, () => true);
  assert.deepEqual(failure, { accountId, result: { ok: false, failure: "localCleanupFailure" } });
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.deepEqual(getPreparedAccountDeletionState(f.selected.id), { ...f.marker, status: "localCleanupPending", proofId, lastFailureCode: "local_cleanup_failure" });
  await prepareProfileStorage();
  assert.deepEqual(await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, prepareNoopRemoteDeletion, () => true), { accountId, result: { ok: true, proofId } });
  assert.equal(f.learningKeys().length, 0);
  f.assertProtected();
});

test("missing marker and a selected Guest never request status or create deletion", async () => {
  const f = await fixture();
  activatePreparedProfile(f.selected.id, "account");
  updateAccountDeletionState(f.marker, { status: "failed" });
  closeActiveProfileStorage();
  assert.equal(await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, prepareNoopRemoteDeletion, () => true), null);
  await selectPreparedAccountProfile("foreign-account");
  assert.equal(await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, prepareNoopRemoteDeletion, () => true), null);
  await selectPreparedGuestProfile();
  assert.equal(await resumeSelectedAccountDeletionWithoutAuth(f.api, async () => true, prepareNoopRemoteDeletion, () => true), null);
  assert.deepEqual(f.calls, []);
  assert.equal(f.learningKeys().length, 2);
  assert.equal(getActiveStorageProfileOrNull(), null);
});
