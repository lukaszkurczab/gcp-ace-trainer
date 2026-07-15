import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { CorruptStoredRecordError } from "../src/storage";
import { readStoredJson, writeStoredJson } from "../src/storage/storageCodec";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
test("strict codec distinguishes absence and corrupt JSON", () => { assert.equal(readStoredJson("x", (v): v is string => typeof v === "string"), null); writeStoredJson("x", "ok"); assert.equal(readStoredJson("x", (v): v is string => typeof v === "string"), "ok"); const store = new MemoryKeyValueStorage(); store.setString("bad", "{"); installKeyValueStorageForTests(store); assert.throws(() => readStoredJson("bad", (_v): _v is unknown => true), CorruptStoredRecordError); });
