import assert from "node:assert/strict";
import test from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { captureForegroundClockProbeStorage } from "./foregroundClockProbeRepository";

const profile = { id: "probe-guest", kind: "guest" as const, accountId: null };
function install(storage = new MemoryKeyValueStorage()) {
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(profile);
  return storage;
}

test("probe exposes only frozen read operations and preserves exact live bytes without writes", () => {
  const storage = install();
  storage.setString("session", ' { "revision": 7 }\n');
  storage.setString("empty", "");
  storage.resetCounters();
  const probe = captureForegroundClockProbeStorage();
  assert.deepEqual(Object.keys(probe).sort(), ["getAllKeys", "getString"]);
  assert.ok(Object.isFrozen(probe));
  assert.equal(probe.getString("session"), ' { "revision": 7 }\n');
  assert.equal(probe.getString("empty"), "");
  assert.equal(probe.getString("missing"), undefined);
  const keys = probe.getAllKeys();
  assert.deepEqual(keys, ["session", "empty"]);
  assert.ok(storage.operations.every(operation => operation.kind === "read"));
  storage.setString("session", "next");
  assert.equal(probe.getString("session"), "next");
  assert.deepEqual(keys, ["session", "empty"]);
});

test("probe refuses both read methods after a profile lease changes, even to the same profile", () => {
  const storage = install();
  storage.setString("session", "private");
  const probe = captureForegroundClockProbeStorage();
  setActiveProfileLeaseForTests(profile);
  storage.resetCounters();
  assert.throws(() => probe.getString("session"), { message: "probe_profile_unavailable", code: "probe_profile_unavailable" });
  assert.throws(() => probe.getAllKeys(), /probe_profile_unavailable/);
  assert.deepEqual(storage.operations, []);
});

test("probe cannot cross a storage-owner switch or capture an unavailable profile", () => {
  const previous = install();
  const probe = captureForegroundClockProbeStorage();
  const next = install();
  assert.throws(() => probe.getString("session"), /probe_profile_unavailable/);
  assert.deepEqual(previous.operations, []);
  assert.deepEqual(next.operations, []);
  setActiveProfileLeaseForTests(null);
  assert.throws(() => captureForegroundClockProbeStorage(), /probe_profile_unavailable/);
});

test("a lease change during a read refuses the returned bytes", () => {
  class SwitchingStorage extends MemoryKeyValueStorage {
    override getString(key: string) {
      const value = super.getString(key);
      setActiveProfileLeaseForTests(null);
      return value;
    }
  }
  const storage = install(new SwitchingStorage());
  storage.setString("session", "private");
  const probe = captureForegroundClockProbeStorage();
  assert.throws(() => probe.getString("session"), /probe_profile_unavailable/);
});
