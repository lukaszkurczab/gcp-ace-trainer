import assert from "node:assert/strict";
import test from "node:test";

import {
  activatePreparedProfile,
  beginProfileTransition,
  closeActiveProfileStorage,
  getActiveStorageProfileOrNull,
  getKeyValueStorage,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  inspectPreparedProfileState,
  onKeyValueStorageReady,
  notifyProfileStorageReady,
  selectPreparedAccountProfile,
  selectPreparedGuestProfile,
  setProfileStoragePreparationFactoryForTests,
  setProfileTransitionReloadForTests,
  validatePreparedGuestAccess,
} from "./mmkvClient";
import { openProfileStorageRouter, type ProfileStorageRouter } from "./profileStorageRouter";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";

const GUEST_ID = "00000000-0000-4000-8000-000000000021";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
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
