import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { CorruptStoredRecordError } from "..";
import { readCanonicalJson, writeCanonicalJson, writeCanonicalJsonWithOutcome } from "./canonicalRecordCodec";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
test("repository codec distinguishes absence and corrupt JSON", () => { assert.equal(readCanonicalJson("x", (v): v is string => typeof v === "string"), null); writeCanonicalJson("x", "ok"); assert.equal(readCanonicalJson("x", (v): v is string => typeof v === "string"), "ok"); const store = new MemoryKeyValueStorage(); store.setString("bad", "{"); installKeyValueStorageForTests(store); assert.throws(() => readCanonicalJson("bad", (_v): _v is unknown => true), CorruptStoredRecordError); });

test("outcome write verifies an after-effect set failure only by exact readback", () => {
  class WriteThenThrowStorage extends MemoryKeyValueStorage {
    setString(key: string, value: string) { super.setString(key, value); if (key === "outcome") throw new Error("adapter acknowledgement lost"); }
  }
  const storage = new WriteThenThrowStorage();
  installKeyValueStorageForTests(storage);
  const outcome = writeCanonicalJsonWithOutcome("outcome", { value: "saved" }, null, null);
  assert.equal(outcome.kind, "verified");
  assert.equal(JSON.parse(getKeyValueStorage().getString("outcome")!).payload.value, "saved");
});

test("outcome write never treats a post-attempt mismatch or unreadable readback as retry-safe", () => {
  class WrongReadStorage extends MemoryKeyValueStorage {
    getString(key: string) { return key === "outcome" && this.contains(key) ? "wrong readback" : super.getString(key); }
  }
  const wrongRead = new WrongReadStorage();
  installKeyValueStorageForTests(wrongRead);
  const mismatch = writeCanonicalJsonWithOutcome("outcome", { value: "saved" }, null, null);
  assert.equal(mismatch.kind, "conflict");

  class UnreadableReadbackStorage extends MemoryKeyValueStorage {
    private attempted = false;
    setString(key: string, value: string) { super.setString(key, value); if (key === "outcome") this.attempted = true; }
    getString(key: string) { if (key === "outcome" && this.attempted) throw new Error("read unavailable"); return super.getString(key); }
  }
  installKeyValueStorageForTests(new UnreadableReadbackStorage());
  const unavailable = writeCanonicalJsonWithOutcome("outcome", { value: "saved" }, null, null);
  assert.equal(unavailable.kind, "unknown");
});

test("outcome write marks prerequisite transport failures retryable but leaves corrupt bytes blocked", () => {
  class PrerequisiteReadFailureStorage extends MemoryKeyValueStorage {
    failRead = true;
    getString(key: string) {
      if (key === "outcome" && this.failRead) { this.failRead = false; throw new Error("temporary storage read failure"); }
      return super.getString(key);
    }
  }
  const storage = new PrerequisiteReadFailureStorage();
  installKeyValueStorageForTests(storage);
  const unavailable = writeCanonicalJsonWithOutcome("outcome", { value: "saved" }, null, null);
  assert.equal(unavailable.kind, "provenNotApplied");
  assert.equal(storage.contains("outcome"), false, "the failed prerequisite read happens before any write");

  storage.setString("outcome", "{");
  const corrupt = writeCanonicalJsonWithOutcome("outcome", { value: "saved" }, null, null);
  assert.equal(corrupt.kind, "conflict");
  assert.equal(storage.getString("outcome"), "{");
});
