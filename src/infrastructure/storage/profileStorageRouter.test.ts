import assert from "node:assert/strict";
import test from "node:test";

import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { MemoryKeyValueStorage } from "./mmkvClient";
import { openProfileStorageRouter, ProfileStorageError, ProfileTransitionActiveError } from "./profileStorageRouter";
import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../identity/sha256";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const DATASET_ID = "00000000-0000-4000-8000-000000000002";
const GUEST_ID = "00000000-0000-4000-8000-000000000003";
const ACCOUNT_ID = "owner-account-1";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  failNextSet = false;
  failSetKeyOnce: string | null = null;
  failGetKeyOccurrence: { key: string; occurrence: number } | null = null;
  failNextRemove = false;
  private readonly getCounts = new Map<string, number>();
  private assertValidKey(key: string) { assert.match(key, /^[\w.-]+$/u, "SecureStore keys may only contain alphanumeric characters, '.', '-', and '_'"); }
  async get(key: string) { this.assertValidKey(key); const count = (this.getCounts.get(key) ?? 0) + 1; this.getCounts.set(key, count); if (this.failGetKeyOccurrence?.key === key && this.failGetKeyOccurrence.occurrence === count) { this.failGetKeyOccurrence = null; throw new Error("injected_control_read_failure"); } return this.values.get(key) ?? null; }
  getCount(key: string) { return this.getCounts.get(key) ?? 0; }
  async set(key: string, value: string) { this.assertValidKey(key); if (this.failNextSet || this.failSetKeyOnce === key) { this.failNextSet = false; this.failSetKeyOnce = null; throw new Error("injected_control_commit_failure"); } this.values.set(key, value); }
  async remove(key: string) { this.assertValidKey(key); if (this.failNextRemove) { this.failNextRemove = false; throw new Error("injected_control_remove_failure"); } this.values.delete(key); }
}

function identitySequence(...ids: string[]) {
  let index = 0;
  return { async create() { const id = ids[index++]!; return { installationId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, localDatasetId: id }; } };
}

function uuidAt(number: number): string { return `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`; }
function hashedEntries(base: MemoryKeyValueStorage, keys: readonly string[]): string {
  return sha256Utf8(JSON.stringify([...keys].sort().map((key) => [sha256Utf8(key), sha256Utf8(base.getString(key)!)])));
}
function profileInventory(profiles: readonly { id: string; kind: string; accountId: string | null }[]): string {
  const identities = profiles.map((profile) => ({ idSha256: sha256Utf8(profile.id), kind: profile.kind, accountIdSha256: profile.accountId === null ? null : sha256Utf8(profile.accountId) }))
    .sort((left, right) => left.idSha256.localeCompare(right.idSha256));
  return sha256Utf8(JSON.stringify(identities));
}

async function guestRemovalFixture() {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const accountProfileIds = Array.from({ length: 9 }, (_, index) => uuidAt(100 + index));
  const replacementId = uuidAt(200);
  const identity = identitySequence(GUEST_ID, uuidAt(99), ...accountProfileIds, replacementId);
  let router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  for (let index = 0; index < accountProfileIds.length; index += 1) {
    router = await openProfileStorageRouter(base, control, { identity });
    await router.selectAccount(`protected-account-${index + 1}`);
  }
  router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  let transitionActive = false;
  router = await openProfileStorageRouter(base, control, { identity, isTransitionActive: () => transitionActive, onBeforeProfileCommit: () => { transitionActive = true; } });
  const accountProfiles = router.registry.profiles.filter((profile) => profile.kind === "account");
  for (let index = 0; index < accountProfiles.length; index += 1) {
    base.setString(`patternly:profile:v1:${accountProfiles[index]!.id}:${encodeURIComponent(STORAGE_KEYS.SETTINGS)}`, `account-data-${index + 1}`);
  }
  router.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "original-guest-track");
  base.setString("patternly:global:removal-test", "global-control");
  const pairs = Array.from({ length: 6 }, (_, index) => ({ uid: `logout-uid-${index + 1}`, operationId: `logout-operation-${index + 1}` }));
  const logoutRaw = JSON.stringify({ version: 2, blocked: null, pending: pairs, completed: [] });
  control.values.set("patternly.local-logout-control.v2", logoutRaw);
  const profiles = router.registry.profiles;
  const allKeys = base.getAllKeys();
  const accountPrefixes = accountProfiles.map((profile) => `patternly:profile:v1:${profile.id}:`);
  const accountKeys = allKeys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = allKeys.filter((key) => !key.startsWith("patternly:profile:v1:"));
  const targetPrefix = `patternly:profile:v1:${GUEST_ID}:`;
  const expected = {
    datasetIdSha256: sha256Utf8(GUEST_ID),
    installationIdSha256: sha256Utf8(uuidAt(2)),
    profileIdentityInventorySha256: profileInventory(profiles),
    accountStateSha256: hashedEntries(base, accountKeys),
    globalStateSha256: hashedEntries(base, globalKeys),
    pendingPairInventorySha256: sha256Utf8(JSON.stringify(pairs.map((pair) => sha256Utf8(JSON.stringify(pair))).sort())),
    pendingUidInventorySha256: sha256Utf8(JSON.stringify(pairs.map((pair) => sha256Utf8(pair.uid)).sort())),
    guestKeyCount: allKeys.filter((key) => key.startsWith(targetPrefix)).length,
  };
  return { base, control, router, expected, transitionActive: () => transitionActive, replacementId, targetPrefix, accountKeys, globalKeys, logoutRaw };
}

function addRegisteredGuest(control: MemoryControlStore, id: string): void {
  const slots = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];
  const current = slots
    .map((key) => ({ key, raw: control.values.get(key) ?? null, registry: JSON.parse(control.values.get(key) ?? "null") as Record<string, unknown> | null }))
    .filter((entry): entry is { key: string; raw: string; registry: Record<string, unknown> } => entry.raw !== null && entry.registry !== null)
    .sort((left, right) => Number(right.registry.generation) - Number(left.registry.generation))[0]!;
  const profiles = [...current.registry.profiles as Array<Record<string, unknown>>, { id, kind: "guest", accountId: null }];
  const body = { version: 1, generation: Number(current.registry.generation) + 1, profiles, legacyProfileId: current.registry.legacyProfileId, selectedProfileId: current.registry.selectedProfileId };
  const target = slots.find((key) => key !== current.key)!;
  control.values.set(target, JSON.stringify({ ...body, checksum: sha256Utf8(JSON.stringify(body)) }));
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
  assert.equal(router.isFreshInstallation, false);
  assert.deepEqual(base.snapshot(), before);
  assert.deepEqual([...router.storage.getAllKeys()].sort(), [...before.keys()].sort());
});

test("an unchosen empty welcome profile stays fresh across restarts until guest markers are written", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  assert.equal(first.isFreshInstallation, true);

  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.isFreshInstallation, true);
  await restarted.selectExistingGuest(GUEST_ID);

  const afterChoice = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(afterChoice.isFreshInstallation, false);
});

test("an existing storage key prevents missing registry metadata from being classified as fresh", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString("patternly:unknown:preserved-data", "existing");

  const router = await openProfileStorageRouter(base, new MemoryControlStore(), { identity: identitySequence(GUEST_ID) });

  assert.equal(router.isFreshInstallation, false);
});

test("explicit selection of the initial guest provisions its unbound access markers", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID, OWNER_ID) });

  const selected = await router.selectExistingGuest(GUEST_ID);

  assert.equal(selected.id, GUEST_ID);
  assert.equal(router.hasValidGuestAccess(GUEST_ID), true);
  assert.equal(base.getString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`) !== undefined, true);
  assert.equal(base.getString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_ACCESS)}`) !== undefined, true);
});

test("exact modern-guest preflight requires selected registered identity, exact hashes, and an unbound guest marker", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  await router.selectExistingGuest(GUEST_ID);
  const before = base.snapshot();
  const installationHash = sha256Utf8("00000000-0000-4000-8000-000000000002");
  const datasetHash = sha256Utf8(GUEST_ID);

  assert.equal(router.hasExactUnboundModernGuest(GUEST_ID, installationHash, datasetHash), true);
  assert.equal(router.hasExactUnboundModernGuest(GUEST_ID, "0".repeat(64), datasetHash), false);
  assert.equal(router.hasExactUnboundModernGuest(GUEST_ID, installationHash, "0".repeat(64)), false);
  assert.equal(router.hasExactUnboundModernGuest("00000000-0000-4000-8000-000000000099", installationHash, datasetHash), false);
  assert.deepEqual(base.snapshot(), before);

  base.setString(`patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1", revision: 2,
    payload: { installationId: OWNER_ID, localDatasetId: GUEST_ID, bindingState: "adoption_pending", accountId: null },
  }));
  const pending = await openProfileStorageRouter(base, control);
  assert.equal(pending.hasExactUnboundModernGuest(GUEST_ID, installationHash, datasetHash), false);
});

test("a selected modern guest keeps its earlier independent dataset identity and scoped data", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  const scope = `patternly:profile:v1:${GUEST_ID}:`;
  const installation = JSON.stringify({
    schemaIdentity: "patternly:canonical:v1", revision: 2,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "guest", accountId: null },
  });
  const access = JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { mode: "guest" } });
  base.setString(`${scope}${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`, installation);
  base.setString(`${scope}${encodeURIComponent(STORAGE_KEYS.GUEST_ACCESS)}`, access);
  base.setString(`${scope}${encodeURIComponent(STORAGE_KEYS.ACTIVE_TRACK)}`, "preserved-guest-track");
  const before = base.snapshot();

  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(router.hasValidGuestAccess(GUEST_ID), true);
  assert.equal((await router.selectExistingGuest(GUEST_ID)).id, GUEST_ID);
  assert.equal(router.storage.getString(STORAGE_KEYS.ACTIVE_TRACK), "preserved-guest-track");
  assert.deepEqual(base.snapshot(), before);
});

test("a completed modern guest adoption promotes only its matching account and permits a new guest", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID, OWNER_ID) });
  await first.selectExistingGuest(GUEST_ID);
  const key = `patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`;
  base.setString(key, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 1,
    payload: { installationId: OWNER_ID, localDatasetId: GUEST_ID, bindingState: "account_bound", accountId: ACCOUNT_ID },
  }));

  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID) });
  assert.equal(restarted.profile.kind, "guest");
  assert.equal(restarted.registry.profiles.filter((profile) => profile.kind === "guest").length, 1);
  await assert.rejects(restarted.selectGuest(), (error) => error instanceof ProfileStorageError && error.code === "profile_scope_unavailable");
  assert.equal(await restarted.promoteSelectedBoundGuest("other-account"), null);
  assert.equal((await restarted.promoteSelectedBoundGuest(ACCOUNT_ID))?.kind, "account");
  const promoted = await openProfileStorageRouter(base, control, { identity: identitySequence(DATASET_ID, OWNER_ID) });
  assert.equal(promoted.profile.id, GUEST_ID);
  assert.equal(promoted.profile.kind, "account");
  assert.equal(promoted.profile.accountId, ACCOUNT_ID);
  assert.equal(promoted.registry.profiles.filter((profile) => profile.kind === "guest").length, 0);
  assert.equal((await promoted.selectGuest()).id, DATASET_ID);
  const freshGuest = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(freshGuest.profile.id, DATASET_ID);
  assert.equal(freshGuest.hasValidGuestAccess(DATASET_ID), true);
  assert.equal(freshGuest.registry.profiles.filter((profile) => profile.kind === "guest").length, 1);
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

test("legacy guest migration keeps the verified marker dataset ID despite a different generated identity", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "preserved-legacy-guest-metadata");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 4,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "guest", accountId: null },
  }));
  base.setString(STORAGE_KEYS.GUEST_ACCESS, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 2,
    payload: { mode: "guest" },
  }));
  const before = base.snapshot();

  const router = await openProfileStorageRouter(base, new MemoryControlStore(), { identity: identitySequence(GUEST_ID) });

  assert.equal(router.profile.id, DATASET_ID);
  assert.notEqual(router.profile.id, GUEST_ID);
  assert.equal(router.profile.kind, "legacy_guest");
  assert.equal(router.hasValidGuestAccess(DATASET_ID), true);
  assert.equal(router.storage.getString(STORAGE_KEYS.METADATA), "preserved-legacy-guest-metadata");
  assert.deepEqual(base.snapshot(), before);
});

test("a persisted mismatched legacy guest ID still validates its raw unbound guest markers", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "legacy-guest-data");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 4,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "guest", accountId: null },
  }));
  base.setString(STORAGE_KEYS.GUEST_ACCESS, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 2,
    payload: { mode: "guest" },
  }));
  const control = new MemoryControlStore();
  const registryBody = {
    version: 1,
    generation: 1,
    profiles: [{ id: GUEST_ID, kind: "legacy_guest", accountId: null }],
    legacyProfileId: GUEST_ID,
    selectedProfileId: GUEST_ID,
  };
  const persistedRegistry = { ...registryBody, checksum: sha256Utf8(JSON.stringify(registryBody)) };
  control.values.set("patternly.profile-root.v1.b", JSON.stringify(persistedRegistry));

  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });

  const selected = await router.selectExistingGuest(GUEST_ID);

  assert.equal(selected.id, GUEST_ID);
  assert.equal(router.profile.id, GUEST_ID);
  assert.equal(router.profile.kind, "legacy_guest");
  assert.equal(router.profile.accountId, null);
  assert.equal(router.hasValidGuestAccess(GUEST_ID), true);
  assert.equal(router.storage.getString(STORAGE_KEYS.METADATA), "legacy-guest-data");
  assert.equal(base.getAllKeys().some((key) => key.startsWith("patternly:profile:v1:")), false);
});

test("a selected guest receives an isolated, durable namespace without changing legacy bytes", async () => {
  const base = legacyOwnerStorage();
  const ownerBefore = base.snapshot();
  const control = new MemoryControlStore();
  let transitioning = false;
  const router = await openProfileStorageRouter(base, control, {
    identity: identitySequence(GUEST_ID),
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
  assert.equal(restarted.hasValidGuestAccess(GUEST_ID), true);
  assert.deepEqual(restarted.storage.getAllKeys(), [STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.GUEST_ACCESS]);
  restarted.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "synthetic-guest-track");
  assert.equal(restarted.storage.getString(STORAGE_KEYS.ACTIVE_TRACK), "synthetic-guest-track");
  assert.equal(base.getString(STORAGE_KEYS.ACTIVE_TRACK), undefined);
  assert.equal(restarted.storage.getAllKeys().some((key) => key.includes("synthetic-owner")), false);
  for (const [key, value] of ownerBefore) assert.equal(base.getString(key), value, key);
});

test("a later exact owner login selects the unchanged legacy scope before local reads", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  await router.selectGuest();
  const guestRouter = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  const owner = await guestRouter.selectAccount(ACCOUNT_ID);
  assert.equal(owner.id, DATASET_ID);
  assert.equal(owner.kind, "legacy_owner");
  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.profile.id, DATASET_ID);
  assert.equal(restarted.storage.getString("patternly:canonical:v1:synthetic-owner-record"), "owner-record-bytes");
});

test("switching away from a modern account never reads its scoped payload", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID, DATASET_ID) });
  const firstAccount = await first.selectAccount("account-a");
  const firstAccountRouter = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  firstAccountRouter.storage.setString(STORAGE_KEYS.METADATA, "account-a-private-data");
  base.resetCounters();

  const secondAccount = await firstAccountRouter.selectAccount("account-b");

  assert.notEqual(secondAccount.id, firstAccount.id);
  assert.equal(base.operations.some((operation) => operation.kind === "read" && operation.key.startsWith(`patternly:profile:v1:${firstAccount.id}:`)), false);
  assert.equal(base.getString(`patternly:profile:v1:${firstAccount.id}:${encodeURIComponent(STORAGE_KEYS.METADATA)}`), "account-a-private-data");
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
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  const results = await Promise.allSettled([router.selectGuest(), router.selectGuest()]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  const restarted = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(restarted.profile.id, GUEST_ID);
});

test("selectGuest reuses the selected guest with the same profile ID and stored data", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  const originalGuest = await first.selectGuest();
  const afterFirst = await openProfileStorageRouter(base, control, { identity: identitySequence("00000000-0000-4000-8000-000000000004") });
  afterFirst.storage.setString("guest-preserved", "same-profile-data");
  const secondGuest = await afterFirst.selectGuest();
  assert.deepEqual(secondGuest, originalGuest);

  const reopened = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(reopened.profile.id, originalGuest.id);
  assert.equal(reopened.storage.getString("guest-preserved"), "same-profile-data");
  assert.equal(reopened.registry.profiles.length, 2);
});

test("selectGuest fails closed when the selected guest marker cannot be verified", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  const markerKey = `patternly:profile:v1:${GUEST_ID}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`;
  base.setString(markerKey, "corrupt-marker");
  const registryBefore = [...control.values];
  const storageBefore = base.snapshot();

  await assert.rejects(router.selectGuest(), (error) => error instanceof ProfileStorageError && error.code === "profile_scope_unavailable");

  assert.deepEqual([...control.values], registryBefore);
  assert.deepEqual(base.snapshot(), storageBefore);
});

test("selectGuest returns a typed ambiguity error without writing when multiple guests are preserved", async () => {
  const base = legacyOwnerStorage();
  const control = new MemoryControlStore();
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  await first.selectGuest();
  await (await openProfileStorageRouter(base, control)).selectAccount("account-with-multiple-guests");
  addRegisteredGuest(control, "00000000-0000-4000-8000-000000000004");
  let identityCalls = 0;
  const ambiguous = await openProfileStorageRouter(base, control, { identity: { async create() { identityCalls += 1; return { installationId: OWNER_ID, localDatasetId: DATASET_ID }; } } });
  const registryBefore = [...control.values];
  const storageBefore = base.snapshot();

  await assert.rejects(ambiguous.selectGuest(), (error) => error instanceof ProfileStorageError && error.code === "prepared_guest_choice_required");

  assert.equal(identityCalls, 0);
  assert.deepEqual([...control.values], registryBefore);
  assert.deepEqual(base.snapshot(), storageBefore);
  assert.equal(ambiguous.registry.profiles.filter((profile) => profile.kind === "guest").length, 2);
});

test("one canonical guest and two account scopes survive restart without cross-scope access", async () => {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const ids = identitySequence(GUEST_ID, DATASET_ID, OWNER_ID, "00000000-0000-4000-8000-000000000004");
  const prefix = (profileId: string) => `patternly:profile:v1:${profileId}:`;
  const assertOnlyProfileAccessed = (profileId: string) => {
    const scopedOperations = base.operations.filter((operation) => operation.key.startsWith("patternly:profile:v1:"));
    assert.equal(scopedOperations.length > 0, true);
    assert.equal(scopedOperations.every((operation) => operation.key.startsWith(prefix(profileId))), true);
  };
  const writeFixture = (router: Awaited<ReturnType<typeof openProfileStorageRouter>>, owner: string) => {
    router.storage.setString(STORAGE_KEYS.METADATA, `${owner}-metadata`);
    router.storage.setString(STORAGE_KEYS.ACTIVE_TRACK, `${owner}-track`);
    router.storage.setString(STORAGE_KEYS.SETTINGS, `${owner}-settings`);
    router.storage.setString(`exclusive:${owner}`, `${owner}-only`);
  };
  const assertFixture = (router: Awaited<ReturnType<typeof openProfileStorageRouter>>, owner: string, otherOwners: readonly string[]) => {
    assert.equal(router.storage.getString(STORAGE_KEYS.METADATA), `${owner}-metadata`);
    assert.equal(router.storage.getString(STORAGE_KEYS.ACTIVE_TRACK), `${owner}-track`);
    assert.equal(router.storage.getString(STORAGE_KEYS.SETTINGS), `${owner}-settings`);
    assert.equal(router.storage.getString(`exclusive:${owner}`), `${owner}-only`);
    assert.equal(router.storage.contains(`exclusive:${owner}`), true);
    const visibleKeys = router.storage.getAllKeys();
    assert.equal(visibleKeys.includes(`exclusive:${owner}`), true);
    for (const other of otherOwners) {
      assert.equal(router.storage.contains(`exclusive:${other}`), false);
      assert.equal(visibleKeys.includes(`exclusive:${other}`), false);
    }
  };
  const initial = await openProfileStorageRouter(base, control, { identity: ids });
  const guest = await initial.selectGuest();
  let router = await openProfileStorageRouter(base, control, { identity: ids });
  writeFixture(router, "guest");

  base.resetCounters();
  const accountA = await router.selectAccount("exact-account-A");
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(guest.id))), false);
  router = await openProfileStorageRouter(base, control, { identity: ids });
  writeFixture(router, "account-A");
  base.resetCounters();
  const returnedGuestA = await router.selectGuest();
  assert.equal(returnedGuestA.id, guest.id);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountA.id))), false);
  router = await openProfileStorageRouter(base, control, { identity: ids });
  base.resetCounters();
  assertFixture(router, "guest", ["account-A", "account-B"]);
  assertOnlyProfileAccessed(guest.id);

  base.resetCounters();
  const accountB = await router.selectAccount("exact-account-B");
  assert.notEqual(accountB.id, accountA.id);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(guest.id))), false);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountA.id))), false);
  router = await openProfileStorageRouter(base, control, { identity: ids });
  writeFixture(router, "account-B");
  base.resetCounters();
  assert.equal((await router.selectGuest()).id, guest.id);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountA.id))), false);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountB.id))), false);

  const restartedGuest = await openProfileStorageRouter(base, control, { identity: ids });
  assert.equal(restartedGuest.profile.id, guest.id);
  assert.equal(restartedGuest.registry.profiles.filter((profile) => profile.kind === "guest" || profile.kind === "legacy_guest").length, 1);
  assert.equal(restartedGuest.registry.profiles.filter((profile) => profile.accountId === "exact-account-A").length, 1);
  assert.equal(restartedGuest.registry.profiles.filter((profile) => profile.accountId === "exact-account-B").length, 1);
  base.resetCounters();
  assertFixture(restartedGuest, "guest", ["account-A", "account-B"]);
  assertOnlyProfileAccessed(guest.id);

  base.resetCounters();
  const restartedA = await restartedGuest.selectAccount("exact-account-A");
  assert.equal(restartedA.id, accountA.id);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(guest.id))), false);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountB.id))), false);
  const reopenedA = await openProfileStorageRouter(base, control, { identity: ids });
  base.resetCounters();
  assertFixture(reopenedA, "account-A", ["guest", "account-B"]);
  assertOnlyProfileAccessed(accountA.id);

  base.resetCounters();
  const restartedB = await reopenedA.selectAccount("exact-account-B");
  assert.equal(restartedB.id, accountB.id);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(guest.id))), false);
  assert.equal(base.operations.some((operation) => operation.key.startsWith(prefix(accountA.id))), false);
  const reopenedB = await openProfileStorageRouter(base, control, { identity: ids });
  base.resetCounters();
  assertFixture(reopenedB, "account-B", ["guest", "account-A"]);
  assertOnlyProfileAccessed(accountB.id);
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
  const first = await openProfileStorageRouter(base, control, { identity: identitySequence(GUEST_ID) });
  const guest = await first.selectGuest();
  const second = await openProfileStorageRouter(base, control, { identity: identitySequence("00000000-0000-4000-8000-000000000004") });
  await second.selectAccount("account-with-existing-guest");
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

test("Guest removal replaces only the exact modern Guest, commits both registry slots, and preserves account/global/logout state", async () => {
  const fixture = await guestRemovalFixture();
  const accountBefore = fixture.accountKeys.map((key) => [key, fixture.base.getString(key)]);
  const globalBefore = fixture.globalKeys.map((key) => [key, fixture.base.getString(key)]);
  const slots = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];

  const receipt = await fixture.router.removeOriginalGuest34(fixture.expected);

  assert.equal(receipt.result, "passed");
  assert.equal(receipt.stage, "complete");
  assert.equal(receipt.removedProfileIdSha256, fixture.expected.datasetIdSha256);
  assert.equal(receipt.replacementProfileIdSha256, sha256Utf8(fixture.replacementId));
  assert.equal(receipt.protectedAccountStateSha256, fixture.expected.accountStateSha256);
  assert.equal(receipt.protectedGlobalStateSha256, fixture.expected.globalStateSha256);
  assert.equal(receipt.logoutControlSha256, sha256Utf8(fixture.logoutRaw));
  assert.equal(receipt.removedKeyCount, fixture.expected.guestKeyCount);
  assert.equal(JSON.stringify(receipt).includes(GUEST_ID), false);
  assert.equal(JSON.stringify(receipt).includes(fixture.replacementId), false);
  assert.equal(fixture.transitionActive(), true);
  assert.equal(fixture.base.getAllKeys().some((key) => key.startsWith(fixture.targetPrefix)), false);
  assert.deepEqual(fixture.control.values.has("patternly.profile-removal.v1"), false);
  for (const key of slots) {
    const registry = JSON.parse(fixture.control.values.get(key)!) as { profiles: { id: string }[]; selectedProfileId: string };
    assert.equal(registry.profiles.some((profile) => profile.id === GUEST_ID), false);
    assert.equal(registry.profiles.some((profile) => profile.id === fixture.replacementId), true);
    assert.equal(registry.selectedProfileId, fixture.replacementId);
  }
  assert.deepEqual(fixture.accountKeys.map((key) => [key, fixture.base.getString(key)]), accountBefore);
  assert.deepEqual(fixture.globalKeys.map((key) => [key, fixture.base.getString(key)]), globalBefore);
  assert.equal(fixture.control.values.get("patternly.local-logout-control.v2"), fixture.logoutRaw);

  const reopened = await openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) });
  assert.equal(reopened.profile.id, fixture.replacementId);
  assert.equal(reopened.profile.kind, "guest");
  assert.equal(reopened.hasValidGuestAccess(fixture.replacementId), true);
  assert.equal(reopened.registry.profiles.filter((profile) => profile.kind === "account").length, 9);
});

test("Guest removal refuses a wrong dataset hash and active learning work without mutation", async () => {
  const fixture = await guestRemovalFixture();
  const before = fixture.base.snapshot();
  const registries = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"].map((key) => fixture.control.values.get(key));
  const wrong = await fixture.router.removeOriginalGuest34({ ...fixture.expected, datasetIdSha256: "0".repeat(64) });
  assert.equal(wrong.result, "failed");
  assert.equal(fixture.transitionActive(), false);
  assert.deepEqual(fixture.base.snapshot(), before);
  assert.deepEqual(["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"].map((key) => fixture.control.values.get(key)), registries);

  fixture.router.storage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, "active-session");
  const activeBefore = fixture.base.snapshot();
  const active = await fixture.router.removeOriginalGuest34({ ...fixture.expected, guestKeyCount: fixture.expected.guestKeyCount + 1 });
  assert.equal(active.result, "failed");
  assert.equal(active.stage, "active_learning_work_present");
  assert.equal(fixture.transitionActive(), false);
  assert.deepEqual(fixture.base.snapshot(), activeBefore);
  assert.deepEqual(["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"].map((key) => fixture.control.values.get(key)), registries);
});

test("Guest removal recovers the same journal after marker, either registry-slot, or prefix-removal failure", async () => {
  for (const failureBoundary of ["marker", "first-registry", "second-registry", "prefix-remove"] as const) {
    const fixture = await guestRemovalFixture();
    const rootKeys = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];
    const parsed = rootKeys.map((key) => ({ key, value: JSON.parse(fixture.control.values.get(key)!) as { generation: number } }));
    const latest = [...parsed].sort((left, right) => right.value.generation - left.value.generation)[0]!;
    const stale = parsed.find((slot) => slot.key !== latest.key)!;
    if (failureBoundary === "marker") fixture.base.setFailurePlan({ kind: "fail_on_key_write", key: `patternly:profile:v1:${fixture.replacementId}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}` });
    if (failureBoundary === "first-registry") fixture.control.failSetKeyOnce = stale.key;
    if (failureBoundary === "second-registry") fixture.control.failSetKeyOnce = latest.key;
    if (failureBoundary === "prefix-remove") fixture.base.setFailurePlan({ kind: "fail_on_remove_number", removeNumber: 1 });

    const first = await fixture.router.removeOriginalGuest34(fixture.expected);
    assert.equal(first.result, "failed", failureBoundary);
    assert.equal(fixture.control.values.has("patternly.profile-removal.v1"), true, failureBoundary);
    fixture.base.setFailurePlan(null);

    const recovered = await openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) });
    assert.equal(recovered.profile.id, fixture.replacementId, failureBoundary);
    assert.equal(fixture.base.getAllKeys().some((key) => key.startsWith(fixture.targetPrefix)), false, failureBoundary);
    assert.equal(fixture.control.values.has("patternly.profile-removal.v1"), false, failureBoundary);
    for (const key of rootKeys) {
      const registry = JSON.parse(fixture.control.values.get(key)!) as { profiles: { id: string }[]; selectedProfileId: string };
      assert.equal(registry.profiles.some((profile) => profile.id === GUEST_ID), false, failureBoundary);
      assert.equal(registry.selectedProfileId, fixture.replacementId, failureBoundary);
    }
  }
});

test("Guest removal keeps a durable journal and blocks router publication if journal clearing fails", async () => {
  const fixture = await guestRemovalFixture();
  fixture.control.failNextRemove = true;
  const failed = await fixture.router.removeOriginalGuest34(fixture.expected);
  assert.equal(failed.result, "failed");
  assert.equal(fixture.control.values.has("patternly.profile-removal.v1"), true);
  assert.equal(fixture.base.getAllKeys().some((key) => key.startsWith(fixture.targetPrefix)), false);
  const recovered = await openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) });
  assert.equal(recovered.profile.id, fixture.replacementId);
  assert.equal(fixture.control.values.has("patternly.profile-removal.v1"), false);
});

test("Guest removal refuses a checksummed journal with a malformed retained profile before publishing or mutating", async () => {
  const fixture = await guestRemovalFixture();
  fixture.base.setFailurePlan({ kind: "fail_on_key_write", key: `patternly:profile:v1:${fixture.replacementId}:${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}` });
  const interrupted = await fixture.router.removeOriginalGuest34(fixture.expected);
  assert.equal(interrupted.result, "failed");
  const journalKey = "patternly.profile-removal.v1";
  const journal = JSON.parse(fixture.control.values.get(journalKey)!) as { checksum: string; retainedProfiles: { id: string; kind: string; accountId: string | null }[]; [key: string]: unknown };
  journal.retainedProfiles[0]!.kind = "legacy_owner";
  const body = Object.fromEntries(Object.entries(journal).filter(([key]) => key !== "checksum"));
  journal.checksum = sha256Utf8(JSON.stringify(body));
  fixture.control.values.set(journalKey, JSON.stringify(journal));
  const storageBefore = fixture.base.snapshot();

  await assert.rejects(openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) }),
    (error) => error instanceof ProfileStorageError && error.code === "profile_removal_recovery_required");

  assert.deepEqual(fixture.base.snapshot(), storageBefore);
  assert.equal(fixture.control.values.has(journalKey), true);
});

test("Guest removal keeps cleanup monotonic across repeated interruption after old markers are deleted", async () => {
  const fixture = await guestRemovalFixture();
  const rootKeys = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];
  const assertReplacementSelected = () => {
    for (const key of rootKeys) {
      const registry = JSON.parse(fixture.control.values.get(key)!) as { profiles: { id: string }[]; selectedProfileId: string };
      assert.equal(registry.profiles.some((profile) => profile.id === GUEST_ID), false);
      assert.equal(registry.profiles.some((profile) => profile.id === fixture.replacementId), true);
      assert.equal(registry.selectedProfileId, fixture.replacementId);
    }
  };
  const targetInstallationKey = `${fixture.targetPrefix}${encodeURIComponent(STORAGE_KEYS.GUEST_INSTALLATION)}`;
  const targetAccessKey = `${fixture.targetPrefix}${encodeURIComponent(STORAGE_KEYS.GUEST_ACCESS)}`;
  const accountBefore = fixture.accountKeys.map((key) => [key, fixture.base.getString(key)]);
  const globalBefore = fixture.globalKeys.map((key) => [key, fixture.base.getString(key)]);
  const logoutBefore = fixture.control.values.get("patternly.local-logout-control.v2");
  fixture.base.resetCounters();
  fixture.base.setFailurePlan({ kind: "fail_on_remove_number", removeNumber: 3 });

  const first = await fixture.router.removeOriginalGuest34(fixture.expected);
  assert.equal(first.result, "failed");
  assert.equal(fixture.base.getString(targetInstallationKey), undefined);
  assert.equal(fixture.base.getString(targetAccessKey), undefined);
  assert.equal(JSON.parse(fixture.control.values.get("patternly.profile-removal.v1")!).stage, "cleanup");
  assertReplacementSelected();

  fixture.base.setFailurePlan(null);
  const rootA = "patternly.profile-root.v1.a";
  fixture.control.failGetKeyOccurrence = { key: rootA, occurrence: fixture.control.getCount(rootA) + 2 };
  await assert.rejects(openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) }),
    (error) => error instanceof ProfileStorageError && error.code === "profile_removal_recovery_required");
  assert.equal(JSON.parse(fixture.control.values.get("patternly.profile-removal.v1")!).stage, "cleanup");
  assert.deepEqual(fixture.base.getAllKeys().some((key) => key.startsWith(fixture.targetPrefix)), true);
  assertReplacementSelected();

  const recovered = await openProfileStorageRouter(fixture.base, fixture.control, { identity: identitySequence(uuidAt(300)) });
  assert.equal(recovered.profile.id, fixture.replacementId);
  assert.equal(fixture.base.getAllKeys().some((key) => key.startsWith(fixture.targetPrefix)), false);
  assert.equal(fixture.control.values.has("patternly.profile-removal.v1"), false);
  assertReplacementSelected();
  assert.deepEqual(fixture.accountKeys.map((key) => [key, fixture.base.getString(key)]), accountBefore);
  assert.deepEqual(fixture.globalKeys.map((key) => [key, fixture.base.getString(key)]), globalBefore);
  assert.equal(fixture.control.values.get("patternly.local-logout-control.v2"), logoutBefore);
  assert.equal(first.stage, "recovery_failed");
});
