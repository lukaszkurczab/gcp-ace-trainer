import assert from "node:assert/strict";
import test from "node:test";

import {
  activatePreparedProfile,
  beginAccountIdentityProofBarrier,
  beginProfileTransition,
  captureActiveProfileStorageLease,
  capturePreparedProfileStorageLease,
  closeActiveProfileStorage,
  getActiveStorageProfileOrNull,
  getKeyValueStorage,
  inspectPreparedQ13StorageReadiness,
  inspectPreparedQ13StorageInventory,
  invalidateActiveAccountIdentityBinding,
  isActiveProfileStorageLeaseCurrent,
  isPreparedProfileStorageLeaseCurrent,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  readActiveAccountIdentityBinding,
  readPreparedAccountIdentityBinding,
  resolveAccountIdentityProofBarrier,
  inspectPreparedProfileState,
  onKeyValueStorageReady,
  notifyProfileStorageReady,
  selectPreparedAccountProfile,
  selectPreparedGuestProfile,
  setProfileStoragePreparationFactoryForTests,
  setProfileTransitionReloadForTests,
  validatePreparedGuestAccess,
  writeActiveAccountIdentityBinding,
} from "./mmkvClient";
import { openProfileStorageRouter, type ProfileStorageRouter } from "./profileStorageRouter";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../identity/sha256";

const GUEST_ID = "00000000-0000-4000-8000-000000000021";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  gets = 0;
  sets = 0;
  failNextSetReadback = false;
  private failReadKey: string | null = null;
  async get(key: string) {
    this.gets += 1;
    if (this.failReadKey === key) { this.failReadKey = null; throw new Error("injected_control_readback_failure"); }
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.sets += 1;
    this.values.set(key, value);
    if (this.failNextSetReadback) { this.failNextSetReadback = false; this.failReadKey = key; }
  }
  async remove(key: string) { this.values.delete(key); }
}

function addRegisteredGuest(control: MemoryControlStore, id: string): void {
  const slots = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];
  const registries = slots.map((key) => ({ key, raw: control.values.get(key) ?? null, registry: JSON.parse(control.values.get(key) ?? "null") as Record<string, unknown> | null }));
  const current = registries.filter((entry) => entry.raw !== null && entry.registry !== null).sort((left, right) => Number(right.registry!.generation) - Number(left.registry!.generation))[0]!;
  const registry = current.registry!;
  const profiles = [...registry.profiles as Array<Record<string, unknown>>, { id, kind: "guest", accountId: null }];
  const body = { version: 1, generation: Number(registry.generation) + 1, profiles, legacyProfileId: registry.legacyProfileId, selectedProfileId: registry.selectedProfileId };
  control.values.set(slots.find((key) => key !== current.key)!, JSON.stringify({ ...body, checksum: sha256Utf8(JSON.stringify(body)) }));
}

async function preparedFixture(): Promise<{ base: MemoryKeyValueStorage; control: MemoryControlStore; router: ProfileStorageRouter }> {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const profileIds = [GUEST_ID, "00000000-0000-4000-8000-000000000023", "00000000-0000-4000-8000-000000000024"];
  let nextProfileId = 0;
  const router = await openProfileStorageRouter(base, control, {
    identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: profileIds[nextProfileId++]! }; } },
  });
  return { base, control, router };
}

test("prepare opens the router without publishing or reading a scoped key", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  setProfileStoragePreparationFactoryForTests(async () => ({
    base,
    router: await openProfileStorageRouter(base, control, {
      identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID }; } },
    }),
  }));

  const profile = await prepareProfileStorage();
  assert.equal(profile.id, GUEST_ID);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  assert.equal(base.operations.some((operation) => operation.kind === "read" && operation.key.startsWith("patternly:profile:v1:")), false);
});

test("prepared inspection exposes registry metadata and freshness without opening profile storage", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  const before = fixture.base.operations.length;

  const state = await inspectPreparedProfileState();

  assert.deepEqual(state.profiles.map((profile) => profile.id), [GUEST_ID]);
  assert.equal(state.selectedProfile.id, GUEST_ID);
  assert.equal(state.isFreshInstallation, true);
  assert.equal(fixture.base.operations.length, before);
  assert.equal(getActiveStorageProfileOrNull(), null);
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared storage lease fences the exact already-prepared profile without opening or writing", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  fixture.base.resetCounters();

  const lease = capturePreparedProfileStorageLease();
  assert.ok(lease);
  assert.equal(lease!.profile.id, GUEST_ID);
  assert.equal(isPreparedProfileStorageLeaseCurrent(lease!), true);
  assert.deepEqual(fixture.base.operations, []);

  activatePreparedProfile(GUEST_ID, "guest");
  assert.equal(isPreparedProfileStorageLeaseCurrent(lease!), false);
  closeActiveProfileStorage();
  assert.equal(isPreparedProfileStorageLeaseCurrent(lease!), true, "closing the same activated prepared profile republishes the still-current prepared lease");
  assert.deepEqual(fixture.base.operations, []);
  setProfileStoragePreparationFactoryForTests(null);
});

test("a prepared-profile tombstone readback failure prevents every following proof call", async () => {
  const fixture = await preparedFixture();
  const accountId = "prepared-proof-account";
  const selected = await fixture.router.selectAccount(accountId);
  const router = await fixture.router.refresh();
  const binding = await router.writeVerifiedSelectedAccountIdentityBinding({ firebaseUid: "prepared-proof-uid", accountId, canContinue: () => true });
  setProfileStoragePreparationFactoryForTests(async () => ({ base: fixture.base, router }));
  try {
    await prepareProfileStorage();
    const lease = capturePreparedProfileStorageLease();
    assert.ok(lease);
    assert.equal(lease!.profile.id, selected.id);
    assert.equal(getActiveStorageProfileOrNull(), null, "the receipt path stays on the existing prepared profile");
    assert.deepEqual(await readPreparedAccountIdentityBinding(selected.id), { kind: "verified", binding });

    let proofCalls = 0;
    fixture.control.failNextSetReadback = true;
    try {
      const barrier = await beginAccountIdentityProofBarrier({
        profileId: selected.id,
        accountId,
        firebaseUid: "prepared-proof-uid",
        verificationRevision: binding.verificationRevision,
        canContinue: () => isPreparedProfileStorageLeaseCurrent(lease!),
      });
      if (!barrier) throw new Error("prepared_identity_barrier_missing");
      proofCalls += 1;
    } catch {
      // A missing/torn barrier is a hard stop before any auth/API proof callback.
    }
    assert.equal(proofCalls, 0);
    assert.deepEqual(await readPreparedAccountIdentityBinding(selected.id), { kind: "invalidated" });
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("active account binding operations require the exact published profile-storage lease", async () => {
  const fixture = await preparedFixture();
  const selected = await fixture.router.selectAccount("account-binding-lease");
  const router = await fixture.router.refresh();
  setProfileStoragePreparationFactoryForTests(async () => ({ base: fixture.base, router }));
  const prepared = await prepareProfileStorage();
  assert.equal(prepared.id, selected.id);
  activatePreparedProfile(selected.id, selected.kind);
  const lease = captureActiveProfileStorageLease();
  assert.ok(lease);
  assert.equal(isActiveProfileStorageLeaseCurrent(lease!), true);
  const beforeBinding = await inspectPreparedQ13StorageInventory();
  assert.equal(beforeBinding.kind, "observed");
  if (beforeBinding.kind !== "observed" || beforeBinding.control?.kind !== "observed") throw new Error("Q13 control inventory unavailable");
  assert.equal(beforeBinding.control.accountBindingState, "absent");
  const binding = await writeActiveAccountIdentityBinding({ lease: lease!, accountId: "account-binding-lease", firebaseUid: "firebase-binding-lease", canContinue: () => true });
  assert.equal(binding.profileId, selected.id);
  assert.deepEqual(await readActiveAccountIdentityBinding(lease!), { kind: "verified", binding });
  const withBinding = await inspectPreparedQ13StorageInventory();
  assert.equal(withBinding.kind, "observed");
  if (withBinding.kind !== "observed" || withBinding.control?.kind !== "observed") throw new Error("Q13 control inventory unavailable");
  assert.equal(withBinding.control.accountBindingState, "present");
  assert.notEqual(withBinding.control.slotInventorySha256, beforeBinding.control.slotInventorySha256);
  const barrier = await beginAccountIdentityProofBarrier({
    profileId: selected.id, accountId: binding.accountId, firebaseUid: binding.firebaseUid,
    verificationRevision: binding.verificationRevision, lease: lease!, canContinue: () => true,
  });
  assert.ok(barrier);
  assert.deepEqual(await readActiveAccountIdentityBinding(lease!), { kind: "invalidated" });
  const restored = await resolveAccountIdentityProofBarrier({ receipt: barrier, lease: lease!, canContinue: () => true });
  assert.equal(restored.verificationRevision, binding.verificationRevision + 2);
  assert.deepEqual(await readActiveAccountIdentityBinding(lease!), { kind: "verified", binding: restored });
  await invalidateActiveAccountIdentityBinding({ lease: lease!, canContinue: () => true });
  assert.deepEqual(await readActiveAccountIdentityBinding(lease!), { kind: "invalidated" });
  const invalidatedBinding = await inspectPreparedQ13StorageInventory();
  assert.equal(invalidatedBinding.kind, "observed");
  if (invalidatedBinding.kind !== "observed" || invalidatedBinding.control?.kind !== "observed") throw new Error("Q13 control inventory unavailable");
  assert.equal(invalidatedBinding.control.accountBindingState, "present", "the tombstone remains observable as preserved lifecycle data");
  assert.notEqual(invalidatedBinding.control.slotInventorySha256, withBinding.control.slotInventorySha256);

  closeActiveProfileStorage();
  assert.equal(isActiveProfileStorageLeaseCurrent(lease!), false);
  await assert.rejects(readActiveAccountIdentityBinding(lease!), /profile_transition_cancelled/u);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 readiness probes only already prepared refs and performs no storage mutation", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  fixture.base.setString("probe-key", "probe-value");
  fixture.base.resetCounters();

  assert.deepEqual(inspectPreparedQ13StorageReadiness(), {
    kind: "ready",
    registeredProfileCount: 1,
    physicalKeyCount: 1,
  });
  assert.deepEqual(fixture.base.operations, []);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 readiness reports missing prepared refs without invoking storage preparation", () => {
  let preparationCalls = 0;
  setProfileStoragePreparationFactoryForTests(async () => {
    preparationCalls += 1;
    throw new Error("preparation must not run from the Q13 probe");
  });

  assert.deepEqual(inspectPreparedQ13StorageReadiness(), { kind: "unavailable", reason: "prepared_storage_missing" });
  assert.equal(preparationCalls, 0);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 full inventory includes registered inactive profiles and global categories without writes", async () => {
  const fixture = await preparedFixture();
  const registeredGuestIds = [
    "00000000-0000-4000-8000-000000000099",
    "00000000-0000-4000-8000-000000000100",
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
  ];
  for (const id of registeredGuestIds) addRegisteredGuest(fixture.control, id);
  const router = await openProfileStorageRouter(fixture.base, fixture.control);
  fixture.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.ACTIVE_TRACK)}`, "guest-track");
  fixture.base.setString(`patternly:profile:v1:${registeredGuestIds[0]}:${encodeURIComponent(STORAGE_KEYS.SETTINGS)}`, "inactive-settings");
  fixture.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.TRAINING_SESSION_INDEX)}`, "[]");
  for (const id of [GUEST_ID, ...registeredGuestIds]) {
    fixture.base.setString(`patternly:profile:v1:${id}:${encodeURIComponent("patternly:premium-cache:v1")}`, "private-profile-premium-state");
  }
  fixture.base.setString(`patternly:profile:v1:${registeredGuestIds[1]}:${encodeURIComponent("patternly:test-runtime:v1:premium-access")}`, "private-profile-test-state");
  fixture.base.setString("patternly:premium-cache:v1", "private-premium-state");
  setProfileStoragePreparationFactoryForTests(async () => ({ base: fixture.base, router }));
  await prepareProfileStorage();
  fixture.base.resetCounters();

  const snapshot = await inspectPreparedQ13StorageInventory();

  assert.equal(snapshot.kind, "observed");
  assert.equal(snapshot.profileCount, 5);
  assert.equal(snapshot.profileInventories?.length, 5);
  assert.equal(snapshot.profileInventories?.reduce((sum, profile) => sum + profile.keyCount, 0), 9);
  assert.deepEqual(snapshot.profileInventories?.[0]?.categoryInventories.map(({ category }) => category), ["learningProgress", "settings", "profileLifecycle", "packagePointers", "premiumCache", "premiumTestRuntime"]);
  assert.equal(snapshot.profileInventories?.reduce((sum, profile) => sum + (profile.categoryInventories.find((entry) => entry.category === "learningProgress")?.keyCount ?? 0), 0), 2);
  assert.equal(snapshot.profileInventories?.reduce((sum, profile) => sum + (profile.categoryInventories.find((entry) => entry.category === "settings")?.keyCount ?? 0), 0), 1);
  assert.equal(snapshot.profileInventories?.reduce((sum, profile) => sum + (profile.categoryInventories.find((entry) => entry.category === "premiumCache")?.keyCount ?? 0), 0), 5);
  assert.equal(snapshot.profileInventories?.reduce((sum, profile) => sum + (profile.categoryInventories.find((entry) => entry.category === "premiumTestRuntime")?.keyCount ?? 0), 0), 1);
  assert.equal(snapshot.profileInventories?.every((profile) => profile.categoryInventories.find((entry) => entry.category === "learningProgress")?.inventorySha256.length === 64), true);
  assert.deepEqual(snapshot.globalInventories?.map((entry) => entry.category), ["premium_cache", "premium_test_runtime"]);
  assert.equal(snapshot.physicalKeyCount, 10);
  assert.deepEqual(fixture.base.operations.filter((operation) => operation.kind !== "read"), []);
  assert.equal(JSON.stringify(snapshot).includes("private-premium-state"), false);
  assert.equal(JSON.stringify(snapshot).includes("private-profile-premium-state"), false);
  assert.equal(JSON.stringify(snapshot).includes("private-profile-test-state"), false);
  assert.equal(JSON.stringify(snapshot).includes(GUEST_ID), false);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 full inventory reports unknown physical keys unavailable instead of omitting them", async () => {
  const fixture = await preparedFixture();
  const unregisteredId = "00000000-0000-4000-8000-000000000099";
  fixture.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent("patternly:canonical:v1:future-record:registered")}`, "private-registered-value");
  fixture.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent("patternly:premium-cache:future-version")}`, "private-registered-cache-value");
  fixture.base.setString(`patternly:profile:v1:${unregisteredId}:${encodeURIComponent("patternly:canonical:v1:future-record:unregistered")}`, "private-unregistered-value");
  fixture.base.setString("patternly:unknown:protected-key", "private-value");
  fixture.base.setString("patternly:premium-cache:future-version", "private-global-value");
  fixture.base.setString("patternly:profile:v1:malformed-one", "private-malformed-one");
  fixture.base.setString("patternly:profile:v1:malformed-two", "private-malformed-two");
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  fixture.base.resetCounters();

  const snapshot = await inspectPreparedQ13StorageInventory();

  assert.equal(snapshot.kind, "unavailable");
  assert.equal(snapshot.complete, false);
  assert.equal(snapshot.reason, "unclassified_key");
  assert.equal(snapshot.physicalKeyCount, 7);
  assert.equal(snapshot.physicalInventorySha256?.length, 64);
  assert.deepEqual(snapshot.unclassifiedKeys?.scopeCounts.map(({ scope, count }) => [scope, count]), [
    ["registered_profile", 2], ["unregistered_profile", 3], ["legacy_profile", 0], ["global", 1], ["unscoped", 1],
  ]);
  assert.equal(snapshot.unclassifiedKeys?.fingerprints.every((entry) => entry.keySha256.length === 64), true);
  const malformedFingerprints = snapshot.unclassifiedKeys?.fingerprints.filter((entry) => entry.scope === "unregistered_profile").map((entry) => entry.keySha256);
  assert.equal(new Set(malformedFingerprints).size, 3);
  assert.deepEqual((await inspectPreparedQ13StorageInventory()).unclassifiedKeys, snapshot.unclassifiedKeys);
  assert.deepEqual(fixture.base.operations.filter((operation) => operation.kind !== "read"), []);
  for (const raw of [GUEST_ID, unregisteredId, "patternly:profile:v1:malformed-one", "patternly:profile:v1:malformed-two", "patternly:canonical:v1:future-record:registered", "private-value", "private-registered-value", "private-registered-cache-value", "private-unregistered-value", "private-global-value", "private-malformed-one", "private-malformed-two"]) {
    assert.equal(JSON.stringify(snapshot).includes(raw), false);
  }
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 inventory preserves global logout pending while applying pending status only to the matching UID hash", async () => {
  const fixture = await preparedFixture();
  const ownUid = "q13-owned-actor-uid";
  const foreignUid = "other-account-uid";
  fixture.control.values.set("patternly.local-logout-control.v2", JSON.stringify({
    version: 2,
    blocked: null,
    pending: [{ uid: foreignUid, operationId: "4f8508d5-10b0-4db2-886d-1a4a88ab1d56" }],
    completed: [{ uid: "completed-account-uid", operationId: "8a01ca30-36b8-4421-a803-ec71cf7a3d02" }],
  }));
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  const initialControlReads = fixture.control.gets;
  const initialControlWrites = fixture.control.sets;
  const initialBaseOperations = fixture.base.operations.length;

  const foreignForActor = await inspectPreparedQ13StorageInventory(sha256Utf8(ownUid));
  const ownPendingActor = await inspectPreparedQ13StorageInventory(sha256Utf8(foreignUid));

  assert.equal(foreignForActor.kind, "observed");
  assert.equal(ownPendingActor.kind, "observed");
  assert.equal(foreignForActor.control?.kind, "observed");
  assert.equal(ownPendingActor.control?.kind, "observed");
  if (foreignForActor.control?.kind !== "observed" || ownPendingActor.control?.kind !== "observed") throw new Error("Q13 control inventory unavailable");
  assert.equal(foreignForActor.control.logoutGlobalStatus, "pending");
  assert.equal(foreignForActor.control.logoutActorStatus, "clear");
  assert.equal(ownPendingActor.control.logoutGlobalStatus, "pending");
  assert.equal(ownPendingActor.control.logoutActorStatus, "pending");
  assert.equal(foreignForActor.control.slotInventorySha256, ownPendingActor.control.slotInventorySha256);
  assert.equal(fixture.control.gets - initialControlReads, 12);
  assert.equal(fixture.control.sets, initialControlWrites);
  assert.equal(fixture.base.operations.slice(initialBaseOperations).some((operation) => operation.kind !== "read"), false);
  assert.equal(JSON.stringify(foreignForActor).includes(ownUid), false);
  assert.equal(JSON.stringify(foreignForActor).includes(foreignUid), false);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 inventory keeps global pending visible and actor unavailable without a UID context", async () => {
  const fixture = await preparedFixture();
  fixture.control.values.set("patternly.local-logout-control.v2", JSON.stringify({
    version: 2,
    blocked: { uid: "private-pending-uid", operationId: "4f8508d5-10b0-4db2-886d-1a4a88ab1d56" },
    pending: [{ uid: "private-pending-uid", operationId: "4f8508d5-10b0-4db2-886d-1a4a88ab1d56" }],
    completed: [],
  }));
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();

  const snapshot = await inspectPreparedQ13StorageInventory(null);

  assert.equal(snapshot.kind, "observed");
  assert.equal(snapshot.control?.kind, "observed");
  if (snapshot.control?.kind !== "observed") throw new Error("Q13 control inventory unavailable");
  assert.equal(snapshot.control.logoutGlobalStatus, "pending");
  assert.equal(snapshot.control.logoutActorStatus, "unavailable");
  assert.equal(JSON.stringify(snapshot).includes("private-pending-uid"), false);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 profile categories classify active-track, goal and learning-plan producer keys as learning progress", async () => {
  const fixture = await preparedFixture();
  for (const key of [STORAGE_KEYS.ACTIVE_TRACK, STORAGE_KEYS.goal("track-example"), STORAGE_KEYS.learningPlan("track-example")]) {
    fixture.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(key)}`, "private-learning-value");
  }
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();

  const snapshot = await inspectPreparedQ13StorageInventory();

  assert.equal(snapshot.kind, "observed");
  assert.deepEqual(snapshot.profileInventories?.[0]?.categoryInventories.map((entry) => [entry.category, entry.keyCount]), [
    ["learningProgress", 3], ["settings", 0], ["profileLifecycle", 0], ["packagePointers", 0], ["premiumCache", 0], ["premiumTestRuntime", 0],
  ]);
  assert.equal(JSON.stringify(snapshot).includes("private-learning-value"), false);
  setProfileStoragePreparationFactoryForTests(null);
});

test("Q13 full inventory assigns canonical legacy keys to the proven legacy owner", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "legacy-meta");
  base.setString(STORAGE_KEYS.ACTIVE_TRACK, "legacy-track");
  base.setString("patternly:premium-cache:v1", "legacy-cache-state");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID, bindingState: "guest", accountId: null } }));
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID }; } } });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  base.resetCounters();

  const snapshot = await inspectPreparedQ13StorageInventory();

  assert.equal(snapshot.kind, "observed");
  assert.deepEqual(snapshot.profileInventories?.map((profile) => [profile.kind, profile.keyCount]), [["legacy_guest", 3]]);
  assert.deepEqual(snapshot.profileInventories?.[0]?.categoryInventories.map((entry) => [entry.category, entry.keyCount]), [
    ["learningProgress", 1], ["settings", 0], ["profileLifecycle", 2], ["packagePointers", 0], ["premiumCache", 0], ["premiumTestRuntime", 0],
  ]);
  assert.equal(snapshot.globalInventories?.find((entry) => entry.category === "premium_cache")?.keyCount, 1);
  assert.deepEqual(base.operations.filter((operation) => operation.kind !== "read"), []);
  base.setString("patternly:canonical:v1:historical-future-record:private-id", "private-legacy-value");
  base.resetCounters();
  const unknownLegacy = await inspectPreparedQ13StorageInventory();
  assert.equal(unknownLegacy.kind, "unavailable");
  assert.deepEqual(unknownLegacy.unclassifiedKeys?.scopeCounts.map(({ scope, count }) => [scope, count]), [
    ["registered_profile", 0], ["unregistered_profile", 0], ["legacy_profile", 1], ["global", 0], ["unscoped", 0],
  ]);
  assert.equal(JSON.stringify(unknownLegacy).includes("private-legacy-value"), false);
  assert.deepEqual(base.operations.filter((operation) => operation.kind !== "read"), []);
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared guest validation reads only access markers without publishing storage", async () => {
  const seed = await preparedFixture();
  const selected = await seed.router.selectGuest();
  const router = await openProfileStorageRouter(seed.base, seed.control);
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();
  seed.base.resetCounters();
  let readyEvents = 0;
  const unsubscribe = onKeyValueStorageReady(() => { readyEvents += 1; });

  const valid = await validatePreparedGuestAccess(selected.id);

  assert.equal(valid, true);
  assert.deepEqual(seed.base.operations.map((operation) => operation.key), [
    `patternly:profile:v1:${selected.id}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`,
    `patternly:profile:v1:${selected.id}:${encodeURIComponent(STORAGE_KEYS.GUEST_ACCESS)}`,
  ]);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  assert.equal(readyEvents, 0);
  unsubscribe();
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared authenticated recovery promotes only a matching bound guest", async () => {
  const seed = await preparedFixture();
  await seed.router.selectGuest();
  const accountId = "adopted-account";
  seed.base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1", revision: 1,
    payload: { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID, bindingState: "account_bound", accountId },
  }));
  const router = await openProfileStorageRouter(seed.base, seed.control);
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();

  const selected = await selectPreparedAccountProfile(accountId, () => true, { recoverBoundGuest: true });
  assert.deepEqual(selected, { profile: { id: GUEST_ID, kind: "account", accountId }, changed: true });
  assert.equal((await inspectPreparedProfileState()).selectedProfile.kind, "account");
  activatePreparedProfile(GUEST_ID, "account");
  assert.equal(getActiveStorageProfileOrNull()?.accountId, accountId);
  setProfileStoragePreparationFactoryForTests(null);
});

test("closing an active profile revokes returned clients and preserves prepared metadata", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  let readyEvents = 0;
  const unsubscribe = onKeyValueStorageReady(() => { readyEvents += 1; });
  const published = activatePreparedProfile(GUEST_ID, "guest");
  const readyBeforeClose = readyEvents;

  closeActiveProfileStorage();

  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  assert.throws(() => published.getString(STORAGE_KEYS.ACTIVE_TRACK), /profile_transition_active/u);
  assert.equal(readyEvents, readyBeforeClose);
  assert.equal((await inspectPreparedProfileState()).selectedProfile.id, GUEST_ID);
  unsubscribe();
  setProfileStoragePreparationFactoryForTests(null);
});

test("deferred activation does not wake preferences until the caller approves the profile scope", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  let readyEvents = 0;
  const unsubscribe = onKeyValueStorageReady(() => { readyEvents += 1; });

  activatePreparedProfile(GUEST_ID, "guest", { deferReadyNotification: true });
  assert.equal(readyEvents, 0);
  notifyProfileStorageReady();
  assert.equal(readyEvents, 1);
  notifyProfileStorageReady();
  assert.equal(readyEvents, 1);

  unsubscribe();
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared account selection commits and reloads while keeping scoped storage closed", async () => {
  const seed = await preparedFixture();
  const accountId = "backend-account-01";
  await seed.router.selectAccount(accountId);
  const router = await openProfileStorageRouter(seed.base, seed.control, {
    onBeforeProfileCommit: beginProfileTransition,
  });
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();
  let reloads = 0;
  setProfileTransitionReloadForTests(async () => { reloads += 1; });

  const result = await selectPreparedAccountProfile(accountId);

  assert.equal(result.profile.accountId, accountId);
  assert.equal(result.changed, false);
  assert.equal(reloads, 0);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  setProfileTransitionReloadForTests(null);
  setProfileStoragePreparationFactoryForTests(null);
});

test("changed prepared account selection can activate the refreshed profile without app reload", async () => {
  const seed = await preparedFixture();
  const router = await openProfileStorageRouter(seed.base, seed.control, {
    identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000026", localDatasetId: "00000000-0000-4000-8000-000000000025" }; } },
    onBeforeProfileCommit: beginProfileTransition,
  });
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();
  let reloads = 0;
  setProfileTransitionReloadForTests(async () => { reloads += 1; });

  const result = await selectPreparedAccountProfile("backend-account-activation");

  assert.equal(result.changed, true);
  assert.equal(result.profile.accountId, "backend-account-activation");
  assert.equal(reloads, 0);
  assert.equal(getActiveStorageProfileOrNull(), null);
  const storage = activatePreparedProfile(result.profile.id, result.profile.kind);
  storage.setString(STORAGE_KEYS.METADATA, "selected-account-scope");
  assert.equal(storage.getString(STORAGE_KEYS.METADATA), "selected-account-scope");
  assert.equal(seed.base.getString(STORAGE_KEYS.METADATA), undefined);
  setProfileTransitionReloadForTests(null);
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared account selection refuses Auth that becomes stale before the registry commit", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  let checks = 0;

  await assert.rejects(selectPreparedAccountProfile("backend-account-stale", () => ++checks < 2), /profile_transition_cancelled/u);

  const current = await inspectPreparedProfileState();
  assert.equal(current.selectedProfile.id, GUEST_ID);
  assert.equal(current.profiles.some((profile) => profile.accountId === "backend-account-stale"), false);
  assert.equal(getActiveStorageProfileOrNull(), null);
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepared guest selection refreshes metadata and activates after commit without app reload", async () => {
  const seed = await preparedFixture();
  await seed.router.selectAccount("backend-account-02");
  const router = await openProfileStorageRouter(seed.base, seed.control, {
    onBeforeProfileCommit: beginProfileTransition,
  });
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();
  let reloads = 0;
  setProfileTransitionReloadForTests(async () => { reloads += 1; });

  const result = await selectPreparedGuestProfile();
  const committed = await openProfileStorageRouter(seed.base, seed.control);

  assert.equal(result.profile.id, GUEST_ID);
  assert.equal(result.changed, true);
  assert.equal(reloads, 0);
  assert.equal(committed.profile.id, GUEST_ID);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  const storage = activatePreparedProfile(result.profile.id, result.profile.kind);
  storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "activated-after-staged-guest-selection");
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRACK), "activated-after-staged-guest-selection");
  setProfileTransitionReloadForTests(null);
  setProfileStoragePreparationFactoryForTests(null);
});

test("implicit prepared guest selection fails closed when multiple preserved guests exist", async () => {
  const seed = await preparedFixture();
  await seed.router.selectGuest();
  await (await openProfileStorageRouter(seed.base, seed.control)).selectAccount("backend-account-03");
  addRegisteredGuest(seed.control, "00000000-0000-4000-8000-000000000027");
  const router = await openProfileStorageRouter(seed.base, seed.control, {
    onBeforeProfileCommit: beginProfileTransition,
  });
  setProfileStoragePreparationFactoryForTests(async () => ({ base: seed.base, router }));
  await prepareProfileStorage();
  let reloads = 0;
  setProfileTransitionReloadForTests(async () => { reloads += 1; });

  await assert.rejects(selectPreparedGuestProfile(), /prepared_guest_choice_required/u);

  assert.equal(reloads, 0);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  setProfileTransitionReloadForTests(null);
  setProfileStoragePreparationFactoryForTests(null);
});

for (const scenario of [
  { name: "legacy owner", bindingState: "account_bound", accountId: "legacy-account-1", expectedKind: "legacy_owner" },
  { name: "legacy guest", bindingState: "guest", accountId: null, expectedKind: "legacy_guest" },
] as const) {
  test(`prepare for an existing ${scenario.name} reads only migration metadata`, async () => {
    const base = new MemoryKeyValueStorage();
    base.setString(STORAGE_KEYS.METADATA, "legacy-metadata-payload");
    base.setString(STORAGE_KEYS.ACTIVE_TRACK, "legacy-learning-payload");
    base.setString(STORAGE_KEYS.SETTINGS, "legacy-settings-payload");
    base.setString(STORAGE_KEYS.ACCOUNT_SYNC, "legacy-account-outbox-payload");
    base.setString(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, "legacy-report-outbox-payload");
    base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
      schemaIdentity: "patternly:canonical:v1",
      revision: 1,
      payload: {
        installationId: "00000000-0000-4000-8000-000000000022",
        localDatasetId: GUEST_ID,
        bindingState: scenario.bindingState,
        accountId: scenario.accountId,
      },
    }));
    const control = new MemoryControlStore();
    setProfileStoragePreparationFactoryForTests(async () => ({
      base,
      router: await openProfileStorageRouter(base, control, {
        identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID }; } },
      }),
    }));
    base.resetCounters();

    const profile = await prepareProfileStorage();

    assert.equal(profile.kind, scenario.expectedKind);
    assert.equal(getActiveStorageProfileOrNull(), null);
    assert.deepEqual(base.operations.filter((operation) => operation.kind === "read").map((operation) => operation.key), [STORAGE_KEYS.GUEST_INSTALLATION]);
    const payloadKeys = new Set<string>([
      STORAGE_KEYS.METADATA,
      STORAGE_KEYS.ACTIVE_TRACK,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.ACCOUNT_SYNC,
      STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
    ]);
    assert.equal(base.operations.some((operation) => operation.kind === "read" && payloadKeys.has(operation.key)), false);
    setProfileStoragePreparationFactoryForTests(null);
  });
}

test("activation is required and publishes only matching prepared profile metadata", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);

  const storage = activatePreparedProfile(GUEST_ID, "guest");
  assert.equal(getActiveStorageProfileOrNull()?.id, GUEST_ID);
  storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "prepared-guest-data");
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRACK), "prepared-guest-data");
});

test("mismatched activation fails closed", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();

  assert.throws(() => activatePreparedProfile(GUEST_ID, "account"), /prepared_profile_mismatch/u);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
});

test("prepare failure clears any previously published scoped client", async () => {
  const fixture = await preparedFixture();
  setProfileStoragePreparationFactoryForTests(async () => fixture);
  await prepareProfileStorage();
  activatePreparedProfile(GUEST_ID, "guest");

  setProfileStoragePreparationFactoryForTests(async () => { throw new Error("injected_prepare_failure"); });
  await assert.rejects(prepareProfileStorage(), /injected_prepare_failure/u);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
  setProfileStoragePreparationFactoryForTests(null);
});

test("prepare revokes previously returned scoped storage references", async () => {
  const firstFixture = await preparedFixture();
  const secondFixture = await preparedFixture();
  let current = firstFixture;
  setProfileStoragePreparationFactoryForTests(async () => current);
  await prepareProfileStorage();
  const previouslyPublished = activatePreparedProfile(GUEST_ID, "guest");

  current = secondFixture;
  await prepareProfileStorage();
  assert.throws(() => previouslyPublished.getString(STORAGE_KEYS.ACTIVE_TRACK), /profile_transition_active/u);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
});
