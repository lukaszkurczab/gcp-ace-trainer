import test from "node:test";
import assert from "node:assert/strict";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, applyActiveForegroundTimerRaw } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, captureCanonicalPhysicalWrite, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { restoreGuestOwnedLocalDataBackup } from "./accountDataRepository";

// Explicit memory owner models atomic CAS and injected IO only. It does not
// prove native serialization, admission, scheduler behavior or durability.
test("timer raw CAS rejects stale bytes and exact-after replay does not repeat an effect", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  applyActiveForegroundTimerRaw(undefined, "before");
  storage.resetCounters();
  applyActiveForegroundTimerRaw("stale", "before");
  assert.equal(storage.operations.filter(operation => operation.kind === "write").length, 0);
  assert.throws(() => applyActiveForegroundTimerRaw("stale", "after"), /conflict/);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), "before");
});

test("journal and deletion use the same timer CAS while other canonical keys keep their adapter", () => {
  class TrackingOwner extends MemoryKeyValueStorage {
    effects = 0;
    override applyForegroundTimerRaw(before: string | undefined, after: string | undefined) {
      this.effects++;
      super.applyForegroundTimerRaw(before, after);
    }
  }
  const storage = new TrackingOwner();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, { synthetic: "initial" });
  assert.equal(storage.effects, 1);
  const clear = captureCanonicalPhysicalWrite("active_foreground_timer", STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, { kind: "remove" }, true);
  applyCanonicalPhysicalWrite(clear);
  applyCanonicalPhysicalWrite(clear);
  assert.equal(storage.effects, 2);
  removeCanonicalValue(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  assert.equal(storage.effects, 3);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRACK, "synthetic-track");
  assert.equal(storage.effects, 3);
});

test("a native-style change between repository read and CAS cannot be overwritten", () => {
  class RacingOwner extends MemoryKeyValueStorage {
    override applyForegroundTimerRaw(before: string | undefined, after: string | undefined) {
      this.setString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, "concurrent-native-checkpoint");
      super.applyForegroundTimerRaw(before, after);
    }
  }
  const storage = new RacingOwner();
  installKeyValueStorageForTests(storage);
  assert.throws(() => writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, { synthetic: "stale" }), /Unable to write/);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), "concurrent-native-checkpoint");
});

test("a generic adapter cannot become a production timer fallback", () => {
  const memory = new MemoryKeyValueStorage();
  installKeyValueStorageForTests({
    getString: key => memory.getString(key), setString: (key, value) => memory.setString(key, value),
    remove: key => memory.remove(key), contains: key => memory.contains(key), getAllKeys: () => memory.getAllKeys(),
  });
  assert.throws(() => applyActiveForegroundTimerRaw(undefined, "candidate"), /storage_owner_unavailable/);
  assert.equal(memory.operations.filter(operation => operation.kind === "write").length, 0);
});

test("Guest backup rejects an unadmitted timer before restoring any entry", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const raw = JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: {
    schemaVersion: 1, timerVersion: 1, familyId: "coding_interview", sessionId: "synthetic-session", trackId: "unadmitted-track",
    accumulatedForegroundMs: 0, checkpointRevision: 1, running: false, lastCheckpointAt: "2026-10-13T12:00:00.000Z",
  } });
  await assert.rejects(restoreGuestOwnedLocalDataBackup([
    { key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION, value: "must-not-be-restored" },
    { key: STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, value: raw },
  ], { isAdmittedTrackId: () => false }), /account_data_records_invalid/);
  assert.equal(storage.operations.filter(operation => operation.kind === "write").length, 0);
});
