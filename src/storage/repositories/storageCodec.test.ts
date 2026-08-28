import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { CorruptStoredRecordError } from "..";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
test("repository codec distinguishes absence and corrupt JSON", () => { assert.equal(readCanonicalJson("x", (v): v is string => typeof v === "string"), null); writeCanonicalJson("x", "ok"); assert.equal(readCanonicalJson("x", (v): v is string => typeof v === "string"), "ok"); const store = new MemoryKeyValueStorage(); store.setString("bad", "{"); installKeyValueStorageForTests(store); assert.throws(() => readCanonicalJson("bad", (_v): _v is unknown => true), CorruptStoredRecordError); });
