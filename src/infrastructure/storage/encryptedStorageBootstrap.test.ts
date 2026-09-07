import assert from "node:assert/strict";
import test from "node:test";

import {
  ENCRYPTED_STORAGE_IDS,
  EncryptedStorageBootstrapError,
  LEGACY_STORAGE_ID,
  STORAGE_MIGRATION_MARKER_KEY,
  openEncryptedStorage,
  requestEncryptedStorageKeyRotation,
  resetUnavailableEncryptedStorage,
  type EncryptedStoragePlatform,
  type StorageManifestStore,
  type StorageSlot,
} from "./encryptedStorageBootstrap";

class MemoryManifestStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  setCount = 0;
  failOnSet: number | null = null;
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) {
    this.setCount += 1;
    if (this.failOnSet === this.setCount) throw new Error("injected_secure_store_failure");
    this.values.set(key, value);
  }
  async remove(key: string) { this.values.delete(key); }
}

class MemorySlot implements StorageSlot {
  readonly values = new Map<string, string>();
  encryptionKey: string | null;
  constructor(readonly id: string, key?: string) { this.encryptionKey = key ?? null; }
  get isEncrypted() { return this.encryptionKey !== null; }
  getString(key: string) { return this.values.get(key); }
  setString(key: string, value: string) { this.values.set(key, value); }
  remove(key: string) { this.values.delete(key); }
  getAllKeys() { return [...this.values.keys()]; }
  clearAll() { this.values.clear(); }
  encrypt(key: string) { this.encryptionKey = key; }
  trim() { return undefined; }
}

class MemoryPlatform implements EncryptedStoragePlatform {
  readonly manifestStore = new MemoryManifestStore();
  readonly slots = new Map<string, MemorySlot>();
  currentBootId = "boot-1";
  keySequence = 0;
  async createKey() { this.keySequence += 1; return String(this.keySequence).padStart(32, "k"); }
  exists(id: string) { return this.slots.has(id); }
  open(id: string, key?: string): StorageSlot {
    const existing = this.slots.get(id);
    if (!existing) {
      const created = new MemorySlot(id, key);
      this.slots.set(id, created);
      return created;
    }
    if (existing.encryptionKey !== null && key !== undefined && existing.encryptionKey !== key) throw new Error(`wrong_key:${id}`);
    if (existing.encryptionKey === null && key) throw new Error(`unexpected_key:${id}`);
    return existing;
  }
  delete(id: string) { this.slots.delete(id); }
  bootId() { return this.currentBootId; }
  reboot() { this.currentBootId = `boot-${Number(this.currentBootId.slice(5)) + 1}`; }
}

function legacyPlatform(): MemoryPlatform {
  const platform = new MemoryPlatform();
  const legacy = new MemorySlot(LEGACY_STORAGE_ID);
  legacy.setString("patternly:canonical:v1:metadata", "metadata");
  legacy.setString("patternly:canonical:v1:session:1", "session");
  platform.slots.set(LEGACY_STORAGE_ID, legacy);
  return platform;
}

test("a fresh install creates only an encrypted canonical slot", async () => {
  const platform = new MemoryPlatform();
  const opened = await openEncryptedStorage(platform);
  assert.equal(opened.storage.isEncrypted, true);
  assert.equal(opened.migrated, false);
  assert.equal(opened.cleanupPending, false);
  assert.equal(platform.exists(LEGACY_STORAGE_ID), false);
  assert.equal(opened.storage.getString(STORAGE_MIGRATION_MARKER_KEY)?.length, 64);
});

test("legacy data is copied, verified and encrypted before ready, then purged after a cold reopen", async () => {
  const platform = legacyPlatform();
  const first = await openEncryptedStorage(platform);
  assert.equal(first.migrated, true);
  assert.equal(first.cleanupPending, true);
  assert.equal(first.storage.getString("patternly:canonical:v1:session:1"), "session");
  assert.equal(platform.slots.get(LEGACY_STORAGE_ID)?.isEncrypted, true);

  platform.reboot();
  const second = await openEncryptedStorage(platform);
  assert.equal(second.cleanupPending, false);
  assert.equal(second.storage.getString("patternly:canonical:v1:metadata"), "metadata");
  assert.equal(platform.exists(LEGACY_STORAGE_ID), false);
});

test("every interrupted manifest transition resumes without losing the legacy source", async () => {
  for (const failingSet of [3, 4, 5, 6, 7]) {
    const platform = legacyPlatform();
    platform.manifestStore.failOnSet = failingSet;
    await assert.rejects(openEncryptedStorage(platform), (error) => error instanceof EncryptedStorageBootstrapError && error.code === "secure_store_temporarily_unavailable");
    platform.manifestStore.failOnSet = null;
    try { await openEncryptedStorage(platform); }
    catch (error) { throw new Error(`resume failed after secure-store set ${failingSet}`, { cause: error }); }
    platform.reboot();
    const recovered = await openEncryptedStorage(platform);
    assert.equal(recovered.storage.getString("patternly:canonical:v1:session:1"), "session", `set ${failingSet}`);
  }
});

test("requested key rotation switches slots without losing data and removes the old key after a cold reopen", async () => {
  const platform = new MemoryPlatform();
  const first = await openEncryptedStorage(platform);
  first.storage.setString("patternly:canonical:v1:session:rotation", "preserved");
  const oldKey = platform.manifestStore.values.get("patternly.storage.key.a");

  await requestEncryptedStorageKeyRotation(platform);
  platform.reboot();
  const rotated = await openEncryptedStorage(platform);
  assert.equal(rotated.cleanupPending, true);
  assert.equal(rotated.storage.getString("patternly:canonical:v1:session:rotation"), "preserved");
  assert.notEqual(platform.manifestStore.values.get("patternly.storage.key.b"), oldKey);

  platform.reboot();
  const cleaned = await openEncryptedStorage(platform);
  assert.equal(cleaned.cleanupPending, false);
  assert.equal(cleaned.storage.getString("patternly:canonical:v1:session:rotation"), "preserved");
  assert.equal(platform.exists(ENCRYPTED_STORAGE_IDS[0]), false);
  assert.equal(platform.manifestStore.values.has("patternly.storage.key.a"), false);
});

test("missing keys and corrupt manifests fail closed", async () => {
  const missingKey = new MemoryPlatform();
  await openEncryptedStorage(missingKey);
  missingKey.manifestStore.values.delete("patternly.storage.key.a");
  await assert.rejects(openEncryptedStorage(missingKey), (error) => error instanceof EncryptedStorageBootstrapError && error.code === "encrypted_storage_key_missing");

  const corrupt = new MemoryPlatform();
  corrupt.slots.set(ENCRYPTED_STORAGE_IDS[0], new MemorySlot(ENCRYPTED_STORAGE_IDS[0], "k".repeat(32)));
  await assert.rejects(openEncryptedStorage(corrupt), (error) => error instanceof EncryptedStorageBootstrapError && error.code === "storage_manifest_corrupt");

  const orphanedKey = new MemoryPlatform();
  orphanedKey.manifestStore.values.set("patternly.storage.key.a", "k".repeat(32));
  await assert.rejects(openEncryptedStorage(orphanedKey), (error) => error instanceof EncryptedStorageBootstrapError && error.code === "storage_manifest_corrupt");
});

test("a completed store still requires its immutable transfer marker", async () => {
  const platform = new MemoryPlatform();
  const opened = await openEncryptedStorage(platform);
  opened.storage.remove(STORAGE_MIGRATION_MARKER_KEY);
  await assert.rejects(openEncryptedStorage(platform), (error) => error instanceof EncryptedStorageBootstrapError && error.code === "storage_migration_incomplete");
});

test("explicit unavailable-data reset removes slots, manifests and keys", async () => {
  const platform = legacyPlatform();
  await openEncryptedStorage(platform);
  await resetUnavailableEncryptedStorage(platform);
  assert.equal(platform.slots.size, 0);
  assert.equal(platform.manifestStore.values.size, 0);
});
