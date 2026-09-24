import assert from "node:assert/strict";
import test from "node:test";

import type { KeyValueStorage } from "../storage/mmkvClient";
import type { StorageProfile } from "../storage/profileStorageRouter";
import { openProfileStorageRouter } from "../storage/profileStorageRouter";
import { MemoryKeyValueStorage } from "../storage/mmkvClient";
import type { StorageManifestStore } from "../storage/encryptedStorageBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";
import { createSmokeOwnerPreservationOracle } from "./ownerPreservationOracleRuntime.smoke";
import { getLegacyOwnerReadOnlyScope, installOwnerPreservationSource } from "./ownerPreservationSourceRuntime.smoke";

const OWNER: StorageProfile = Object.freeze({ id: "private-owner-id", kind: "legacy_owner", accountId: "private-account-id" });
const GUEST: StorageProfile = Object.freeze({ id: "private-guest-id", kind: "guest", accountId: null });
const ORACLE_KEY = "patternly.smoke.owner-preservation-oracle.v1";
const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const DATASET_ID = "00000000-0000-4000-8000-000000000002";
const GUEST_ID = "00000000-0000-4000-8000-000000000003";

class MemorySecureStore {
  readonly values = new Map<string, string>();
  readonly operations: { kind: "get" | "set" | "delete"; key: string }[] = [];
  failure: "get" | "set" | "delete" | null = null;
  corruptReadback = false;

  async getItemAsync(key: string): Promise<string | null> {
    this.operations.push({ kind: "get", key });
    if (this.failure === "get") throw new Error("private injected read error");
    const value = this.values.get(key) ?? null;
    return this.corruptReadback && value !== null ? `${value}corrupt` : value;
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    this.operations.push({ kind: "set", key });
    if (this.failure === "set") throw new Error("private injected write error");
    this.values.set(key, value);
  }

  async deleteItemAsync(key: string): Promise<void> {
    this.operations.push({ kind: "delete", key });
    if (this.failure === "delete") throw new Error("private injected delete error");
    this.values.delete(key);
  }
}

class ReadOnlyOwnerStorage implements KeyValueStorage {
  readonly values = new Map<string, string>([["owner:key-a", "private owner value"], ["owner:key-b", "second private value"]]);
  readonly operations: string[] = [];
  getString(key: string): string | undefined { this.operations.push(`read:${key}`); return this.values.get(key); }
  setString(): void { throw new Error("owner scope must not be written"); }
  remove(): void { throw new Error("owner scope must not be deleted"); }
  contains(key: string): boolean { return this.values.has(key); }
  getAllKeys(): readonly string[] { this.operations.push("keys"); return [...this.values.keys()]; }
}

function makeOracle(storage: KeyValueStorage, profile = OWNER, store = new MemorySecureStore(), now = () => 10_000) {
  let selectedProfile = profile;
  const oracle = createSmokeOwnerPreservationOracle({
    secureStore: store,
    now,
    randomSalt: async () => "a".repeat(64),
    ownerScope: () => ({ profile, selectedProfile, storage }),
  });
  return { oracle, store, select(profile: StorageProfile) { selectedProfile = profile; } };
}

test("arms, survives oracle recreation, and reports owner mutation without exposing snapshot data", async () => {
  const storage = new ReadOnlyOwnerStorage();
  const before = new Map(storage.values);
  const { oracle, store } = makeOracle(storage);
  assert.equal(await oracle.arm(), "unchanged");
  assert.deepEqual(storage.values, before);
  const record = store.values.get(ORACLE_KEY)!;
  assert.ok(record.includes("a".repeat(64)), "the persisted record carries its per-run salt");
  assert.ok(!record.includes("private owner value"));
  assert.ok(!record.includes("private-owner-id"));

  storage.values.set("owner:key-c", "new value");
  const restarted = createSmokeOwnerPreservationOracle({ secureStore: store, now: () => 10_001, ownerScope: () => ({ profile: OWNER, selectedProfile: GUEST, storage }) });
  assert.equal(await restarted.verify(), "changed");
  assert.deepEqual(storage.values.get("owner:key-a"), before.get("owner:key-a"));
  assert.equal(await restarted.verify(), "blocked", "terminal records cannot be reused");
});

test("smoke source retains no mutable owner view and rejects owner writes", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "private owner value");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 1,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "account_bound", accountId: "private-owner-account" },
  }));
  const router = await openProfileStorageRouter(base, new MemoryControlStore(), { identity: identitySequence(DATASET_ID) });
  const before = base.snapshot();
  installOwnerPreservationSource(base, router);
  const scope = getLegacyOwnerReadOnlyScope();
  assert.equal(scope?.storage.getString(STORAGE_KEYS.METADATA), "private owner value");
  assert.throws(() => scope?.storage.setString(STORAGE_KEYS.METADATA, "overwrite"), /read_only/u);
  assert.throws(() => scope?.storage.remove(STORAGE_KEYS.METADATA), /read_only/u);
  assert.deepEqual(base.snapshot(), before);
  installOwnerPreservationSource(null, null);
  assert.equal(getLegacyOwnerReadOnlyScope(), null);
});

test("detects additions, deletions, and value changes with sorted length-delimited inputs", async () => {
  for (const mutate of [
    (storage: ReadOnlyOwnerStorage) => storage.values.set("owner:key-c", "added"),
    (storage: ReadOnlyOwnerStorage) => storage.values.delete("owner:key-a"),
    (storage: ReadOnlyOwnerStorage) => storage.values.set("owner:key-a", "changed"),
  ]) {
    const storage = new ReadOnlyOwnerStorage();
    const { oracle, select } = makeOracle(storage);
    assert.equal(await oracle.arm(), "unchanged");
    mutate(storage);
    select(GUEST);
    assert.equal(await oracle.verify(), "changed");
  }

  const storage = new ReadOnlyOwnerStorage();
  const { oracle, select } = makeOracle(storage);
  assert.equal(await oracle.arm(), "unchanged");
  select(GUEST);
  assert.equal(await oracle.verify(), "unchanged");
  assert.ok(storage.operations.every((operation) => operation === "keys" || operation.startsWith("read:")));
});

test("fails closed for wrong profile, missing, corrupt, stale, and SecureStore failures", async () => {
  const storage = new ReadOnlyOwnerStorage();
  const wrongProfile = makeOracle(storage, GUEST);
  assert.equal(await wrongProfile.oracle.arm(), "blocked");

  const missing = makeOracle(storage);
  missing.select(GUEST);
  assert.equal(await missing.oracle.verify(), "blocked");

  const corrupt = makeOracle(storage);
  assert.equal(await corrupt.oracle.arm(), "unchanged");
  corrupt.select(GUEST);
  corrupt.store.values.set(ORACLE_KEY, "not-json");
  assert.equal(await corrupt.oracle.verify(), "blocked");

  const stale = makeOracle(storage, OWNER, new MemorySecureStore(), () => 20_000_001);
  assert.equal(await stale.oracle.arm(), "unchanged");
  const later = createSmokeOwnerPreservationOracle({ secureStore: stale.store, now: () => 20_000_001 + 15 * 60 * 1000 + 1, ownerScope: () => ({ profile: OWNER, selectedProfile: GUEST, storage }) });
  assert.equal(await later.verify(), "blocked");

  const readFailure = makeOracle(storage);
  readFailure.store.failure = "get";
  assert.equal(await readFailure.oracle.arm(), "blocked");
  const writeFailure = makeOracle(storage);
  writeFailure.store.failure = "set";
  assert.equal(await writeFailure.oracle.arm(), "blocked");
  const readbackFailure = makeOracle(storage);
  readbackFailure.store.corruptReadback = true;
  assert.equal(await readbackFailure.oracle.arm(), "blocked");

  const storageFailure = makeOracle(storage);
  const failingStorage = { ...storage, getAllKeys() { throw new Error("private storage failure"); } } as unknown as KeyValueStorage;
  const failingOracle = createSmokeOwnerPreservationOracle({ secureStore: storageFailure.store, now: () => 10_000, randomSalt: async () => "a".repeat(64), ownerScope: () => ({ profile: OWNER, selectedProfile: OWNER, storage: failingStorage }) });
  assert.equal(await failingOracle.arm(), "blocked");
});

test("arm requires owner selected; verify reopens the registered owner scope after guest selection", async () => {
  const base = new MemoryKeyValueStorage();
  base.setString(STORAGE_KEYS.METADATA, "unchanged owner metadata");
  base.setString("patternly:canonical:v1:synthetic-owner-record", "unchanged owner record");
  base.setString(STORAGE_KEYS.GUEST_INSTALLATION, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 1,
    payload: { installationId: OWNER_ID, localDatasetId: DATASET_ID, bindingState: "account_bound", accountId: "private-owner-account" },
  }));
  const control = new MemoryControlStore();
  const identity = identitySequence(DATASET_ID, GUEST_ID);
  const ownerRouter = await openProfileStorageRouter(base, control, { identity });
  const store = new MemorySecureStore();
  const oracle = createSmokeOwnerPreservationOracle({ secureStore: store, now: () => 30_000, randomSalt: async () => "b".repeat(64), ownerScope: getLegacyOwnerReadOnlyScope });
  const before = base.snapshot();
  installOwnerPreservationSource(base, ownerRouter);
  assert.equal(await oracle.arm(), "unchanged");

  await ownerRouter.selectGuest();
  const guestRouter = await openProfileStorageRouter(base, control, { identity: identitySequence(OWNER_ID) });
  assert.equal(guestRouter.profile.kind, "guest");
  installOwnerPreservationSource(base, guestRouter);
  assert.equal(await oracle.verify(), "unchanged");
  assert.deepEqual(base.snapshot().get(STORAGE_KEYS.METADATA), before.get(STORAGE_KEYS.METADATA));
  for (const [key, value] of before) assert.equal(base.getString(key), value, key);

  const guestScopeOracle = createSmokeOwnerPreservationOracle({ secureStore: new MemorySecureStore(), now: () => 30_001, randomSalt: async () => "c".repeat(64), ownerScope: getLegacyOwnerReadOnlyScope });
  assert.equal(await guestScopeOracle.arm(), "blocked");
  installOwnerPreservationSource(null, null);
});

test("verify blocks while the owner remains selected", async () => {
  const storage = new ReadOnlyOwnerStorage();
  const { oracle, select } = makeOracle(storage);
  assert.equal(await oracle.arm(), "unchanged");
  assert.equal(await oracle.verify(), "blocked");
  select(GUEST);
  assert.equal(await oracle.verify(), "unchanged");
});

test("explicit cleanup deletes only the oracle SecureStore key", async () => {
  const store = new MemorySecureStore();
  store.values.set(ORACLE_KEY, "record");
  store.values.set("patternly.owner.unrelated", "preserve");
  const { oracle } = makeOracle(new ReadOnlyOwnerStorage(), OWNER, store);
  assert.equal(await oracle.cleanup(), "unchanged");
  assert.deepEqual([...store.values], [["patternly.owner.unrelated", "preserve"]]);
  assert.deepEqual(store.operations.filter((operation) => operation.kind === "delete").map((operation) => operation.key), [ORACLE_KEY]);

  store.failure = "delete";
  assert.equal(await oracle.cleanup(), "blocked");
});

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

function identitySequence(...ids: string[]) {
  let index = 0;
  return { async create() { const id = ids[index++]!; return { installationId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, localDatasetId: id }; } };
}
