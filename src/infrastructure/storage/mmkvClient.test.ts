import assert from "node:assert/strict";
import test from "node:test";

import {
  activatePreparedProfile,
  getActiveStorageProfileOrNull,
  getKeyValueStorage,
  initializeKeyValueStorage,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
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

async function preparedFixture(): Promise<{ base: MemoryKeyValueStorage; router: ProfileStorageRouter }> {
  const base = new MemoryKeyValueStorage();
  const router = await openProfileStorageRouter(base, new MemoryControlStore(), {
    identity: { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: GUEST_ID }; } },
  });
  return { base, router };
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

test("concurrent transitional initializers share one prepare and activation", async () => {
  const fixture = await preparedFixture();
  let openCount = 0;
  let release!: (value: typeof fixture) => void;
  const opened = new Promise<typeof fixture>((resolve) => { release = resolve; });
  setProfileStoragePreparationFactoryForTests(() => { openCount += 1; return opened; });

  const first = initializeKeyValueStorage();
  const second = initializeKeyValueStorage();
  assert.equal(openCount, 1);
  release(fixture);
  const [firstStorage, secondStorage] = await Promise.all([first, second]);
  assert.equal(firstStorage, secondStorage);
  assert.equal(getActiveStorageProfileOrNull()?.id, GUEST_ID);
});

test("an explicit prepare supersedes an in-flight transitional activation", async () => {
  const fixture = await preparedFixture();
  let release!: (value: typeof fixture) => void;
  const opened = new Promise<typeof fixture>((resolve) => { release = resolve; });
  setProfileStoragePreparationFactoryForTests(() => opened);

  const initialization = initializeKeyValueStorage();
  const expectedSupersession = assert.rejects(initialization, /storage_initialization_superseded/u);
  const profilePromise = prepareProfileStorage();
  release(fixture);
  const profile = await profilePromise;
  await expectedSupersession;
  assert.equal(profile.id, GUEST_ID);
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.throws(() => getKeyValueStorage(), /encrypted_storage_not_initialized/u);
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
