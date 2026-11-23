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

// T4.2: large envelopes skip re-parsing bytes this module verified, never stale or unverified bytes.
const largePayload = (marker: string) => ({ marker, filler: "x".repeat(20_000) });

test("T4.2: a large write after a verified write keeps exact revisions without re-parsing, and an outside writer is always honoured", () => {
  class CountingParseStorage extends MemoryKeyValueStorage {}
  const storage = new CountingParseStorage();
  installKeyValueStorageForTests(storage);
  assert.equal(writeCanonicalJson("big", largePayload("a")).revision, 1);
  assert.equal(writeCanonicalJson("big", largePayload("b")).revision, 2);
  const parse = JSON.parse;
  let parsedBig = 0;
  JSON.parse = ((text: string, reviver?: Parameters<typeof JSON.parse>[1]) => { if (typeof text === "string" && text.length > 20_000) parsedBig += 1; return parse(text, reviver); }) as typeof JSON.parse;
  try { assert.equal(writeCanonicalJson("big", largePayload("c"), 2).revision, 3); }
  finally { JSON.parse = parse; }
  assert.equal(parsedBig, 0, "the prior bytes were this module's verified bytes: no parse, no re-serialization");
  // Another writer (a restore, a journal apply) puts different bytes there: they are parsed and their revision wins.
  storage.setString("big", JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 10, payload: largePayload("outside") }));
  assert.throws(() => writeCanonicalJson("big", largePayload("d"), 3));
  assert.equal(writeCanonicalJson("big", largePayload("d"), 10).revision, 11);
  assert.equal(readCanonicalJson("big", (v): v is { marker: string } => typeof v === "object")?.marker, "d");
  // Corrupt outside bytes are still rejected.
  storage.setString("big", "{ not json");
  assert.throws(() => writeCanonicalJson("big", largePayload("e")), CorruptStoredRecordError);
});

test("T4.2: a readback that differs from the written bytes takes the full verification and fails when the payload differs", () => {
  class AlteringStorage extends MemoryKeyValueStorage {
    alter = false;
    override getString(key: string) { const raw = super.getString(key); return this.alter && key === "big" && raw !== undefined ? raw.replace('"marker":"b"', '"marker":"z"') : raw; }
  }
  const storage = new AlteringStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson("big", largePayload("a"));
  storage.alter = true;
  assert.throws(() => writeCanonicalJson("big", largePayload("b")), (error: unknown) => error instanceof Error && /could not be verified/u.test(String((error as Error & { cause?: unknown }).cause)));
});
