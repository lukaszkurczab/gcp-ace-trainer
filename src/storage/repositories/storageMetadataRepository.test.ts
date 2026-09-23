import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import {
  CANONICAL_STORAGE_SCHEMA_VERSION,
  StorageMetadataError,
  isCanonicalStorageMetadata,
  validateStorageMetadata,
} from "./storageMetadataRepository";

let storage: MemoryKeyValueStorage;

beforeEach(() => {
  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
});

test("initializes and reuses the exact canonical metadata payload", async () => {
  assert.equal(isCanonicalStorageMetadata({ namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION }), true);
  assert.equal(isCanonicalStorageMetadata({ namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION, extra: true }), false);

  const metadata = await validateStorageMetadata();
  assert.deepEqual(metadata, { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION });
  assert.equal(storage.operations.filter((operation) => operation.kind === "write").length, 1);
  storage.resetCounters();
  assert.deepEqual(await validateStorageMetadata(), metadata);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("fails closed when stored metadata has an unknown shape or newer schema", async () => {
  writeCanonicalJson(STORAGE_KEYS.METADATA, { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION, extra: true });
  await assert.rejects(validateStorageMetadata(), (error: unknown) => error instanceof StorageMetadataError && error.code === "storage_metadata_invalid");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.METADATA, { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION + 1 });
  await assert.rejects(validateStorageMetadata(), (error: unknown) => error instanceof StorageMetadataError && error.code === "storage_metadata_invalid");
});
