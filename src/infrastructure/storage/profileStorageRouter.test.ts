import assert from "node:assert/strict";
import test from "node:test";

import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { MemoryKeyValueStorage } from "./mmkvClient";
import { openProfileStorageRouter, ProfileStorageError, ProfileTransitionActiveError } from "./profileStorageRouter";
import { STORAGE_KEYS } from "../../storage/keys";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const DATASET_ID = "00000000-0000-4000-8000-000000000002";
const GUEST_ID = "00000000-0000-4000-8000-000000000003";
const ACCOUNT_ID = "owner-account-1";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  failNextSet = false;
  private assertValidKey(key: string) { assert.match(key, /^[\w.-]+$/u, "SecureStore keys may only contain alphanumeric characters, '.', '-', and '_'"); }
  async get(key: string) { this.assertValidKey(key); return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.assertValidKey(key); if (this.failNextSet) { this.failNextSet = false; throw new Error("injected_control_commit_failure"); } this.values.set(key, value); }
  async remove(key: string) { this.assertValidKey(key); this.values.delete(key); }
}

function identitySequence(...ids: string[]) {
  let index = 0;
  return { async create() { const id = ids[index++]!; return { installationId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, localDatasetId: id }; } };
}

function legacyOwnerStorage(): MemoryKeyValueStorage {
  const storage = new MemoryKeyValueStorage();
  storage.setString(STORAGE_KEYS.METADATA, "owner-metadata-bytes");
  storage.setString("patternly:canonical:v1:synthetic-owner-record", "owner-record-bytes");
  storage.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 1,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "account_bound", accountId: ACCOUNT_ID },
  }));
  return storage;
}

test("legacy owner remains byte-for-byte visible only through its own logical scope", async () => {
  const base = legacyOwnerStorage();
  const before = base.snapshot();
  const router = await openProfileStorageRouter(base, new MemoryControlStore(), { identity: identitySequence(DATASET_ID) });
  assert.equal(router.profile.kind, "legacy_owner");
  assert.equal(router.profile.accountId, ACCOUNT_ID);
  assert.deepEqual(base.snapshot(), before);
  assert.deepEqual([...router.storage.getAllKeys()].sort(), [...before.keys()].sort());
});

test("valid adoption-pending legacy guest marker remains readable during profile registry migration", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "pending-guest-metadata-bytes");
  base.setString("patternly:canonical:v1:synthetic-pending-record", "pending-guest-record-bytes");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 3,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "adoption_pending", accountId: null },
  }));
  const before = base.snapshot();
  const router = await openProfileStorageRouter(base, new MemoryControlStore(), { identity: identitySequence(DATASET_ID) });
  assert.equal(router.profile.kind, "legacy_guest");
  assert.deepEqual(base.snapshot(), before);
  assert.deepEqual([...router.storage.getAllKeys()].sort(), [...before.keys()].sort());
});

test("a selected guest receives an isolated, durable namespace without changing legacy bytes", async () => {
  const base = legacyOwnerStorage();
  const ownerBefore = base.snapshot();
  const control = new MemoryControlStore();
  let transitioning = false;
  const router = await openProfileStorageRouter(base, control, {
    identity: identitySequence(DATASET_ID, GUEST_ID),
    onBeforeProfileCommit: () => { transitioning = true; },
    isTransitionActive: () => transitioning,
  });

  const guest = await router.selectGuest();
  assert.equal(transitioning, true);
  assert.equal(guest.kind, "guest");
  assert.throws(() => router.storage.getAllKeys(), ProfileTransitionActiveError);
  assert.throws(() => router.storage.getString(STORAGE_KEYS.METADATA), ProfileTransitionActiveError);
  assert.throws(() => router.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "must-not-write"), ProfileTransitionActiveError);
  assert.deepEqual(base.snapshot().get(STORAGE_KEYS.GUEST_INSTALLATION), ownerBefore.get(STORAGE_KEYS.GUEST_INSTALLATION));
  for (const [key, value] of ownerBefore) assert.equal(base.getString(key), value, key);

  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.profile.id, GUEST_ID);
  assert.equal(restarted.profile.kind, "guest");
  assert.deepEqual(restarted.storage.getAllKeys(), [STORAGE_KEYS.GUEST_ACCESS]);
  restarted.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "synthetic-guest-track");
  assert.equal(restarted.storage.getString(STORAGE_KEYS.ACTIVE_TRACK), "synthetic-guest-track");
  assert.equal(base.getString(STORAGE_KEYS.ACTIVE_TRACK), undefined);
  assert.equal(restarted.storage.getAllKeys().some((key) => key.includes("synthetic-owner")), false);
  for (const [key, value] of ownerBefore) assert.equal(base.getString(key), value, key);
});

test("a later exact owner login selects the unchanged legacy scope before local reads", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID, GUEST_ID) });
  await router.selectGuest();
  const guestRouter = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  const owner = await guestRouter.selectAccount(ACCOUNT_ID);
  assert.equal(owner.id, DATASET_ID);
  assert.equal(owner.kind, "legacy_owner");
  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.profile.id, DATASET_ID);
  assert.equal(restarted.storage.getString("patternly:canonical:v1:synthetic-owner-record"), "owner-record-bytes");
});

test("malformed profile registry blocks instead of choosing a storage namespace", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  control.values.set("patternly.profile-root.v1.a", "not-json");
  await assert.rejects(openProfileStorageRouter(base, control), (error) => error instanceof ProfileStorageError && error.code === "profile_registry_corrupt");
});

test("concurrent guest selections claim one transition and cannot commit competing profiles", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID, GUEST_ID) });
  const results = await Promise.allSettled([router.selectGuest(), router.selectGuest()]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.profile.id, GUEST_ID);
});

test("an existing guest can be reselected with the same profile ID and stored data", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID, GUEST_ID) });
  const originalGuest = await first.selectGuest();
  const afterFirst = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID, "00000000-0000-4000-8000-000000000004") });
  afterFirst.storage.setString("guest-preserved", "same-profile-data");
  const secondGuest = await afterFirst.selectGuest();
  assert.notEqual(secondGuest.id, originalGuest.id);

  const reselector = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  const selected = await reselector.selectExistingGuest(originalGuest.id);
  assert.deepEqual(selected, originalGuest);
  const reopened = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(reopened.profile.id, originalGuest.id);
  assert.equal(reopened.storage.getString("guest-preserved"), "same-profile-data");
  assert.equal(reopened.registry.profiles.length, 3);
});

test("existing guest reselection rejects non-guest IDs without changing the registry", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID) });
  const before = [...control.values];
  await assert.rejects(router.selectExistingGuest(DATASET_ID), (error) => error instanceof ProfileStorageError && error.code === "profile_scope_unavailable");
  assert.deepEqual([...control.values], before);
});

test("failed existing guest registry commit leaves the current scope closed", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID, GUEST_ID, "00000000-0000-4000-8000-000000000004") });
  const guest = await first.selectGuest();
  const second = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID, "00000000-0000-4000-8000-000000000004") });
  await second.selectGuest();
  let transitionActive = false;
  const reselector = await openProfileStorageRouter(base, control, {
    identity: identitySequence(OWNER_ID),
    isTransitionActive: () => transitionActive,
    onBeforeProfileCommit: () => { transitionActive = true; },
  });
  control.failNextSet = true;
  await assert.rejects(reselector.selectExistingGuest(guest.id), /injected_control_commit_failure/u);
  assert.throws(() => reselector.storage.getString(STORAGE_KEYS.METADATA), ProfileTransitionActiveError);
  const unchanged = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.notEqual(unchanged.profile.id, guest.id);
});
