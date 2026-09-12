import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "../../application/bootstrap";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import {
  COMMITTED_STORAGE_SCHEMA_VERSION,
  PENDING_STORAGE_SCHEMA_VERSION,
  STORAGE_IDENTITY_MIGRATION_PROTOCOL,
  StorageMetadataError,
  createCommittedStorageMetadataV2,
  createPendingStorageMetadataV2,
  isCanonicalStorageMetadataV1,
  validateStorageMetadata,
} from "./storageMetadataRepository";

let storage: MemoryKeyValueStorage;

beforeEach(() => {
  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
});

const binding = {
  sourceManifestDigest: "a".repeat(64),
  targetManifestDigest: "b".repeat(64),
  targetKeySetDigest: "c".repeat(64),
};

function errorCode(error: unknown): string | undefined {
  return error instanceof StorageMetadataError ? error.code : undefined;
}

test("v1 metadata is an exact payload shape and initialization is the only write", async () => {
  assert.equal(isCanonicalStorageMetadataV1({ namespace: STORAGE_NAMESPACE, schemaVersion: 1 }), true);
  assert.equal(isCanonicalStorageMetadataV1({ namespace: STORAGE_NAMESPACE, schemaVersion: 1, extra: true }), false);
  assert.equal(isCanonicalStorageMetadataV1({ namespace: STORAGE_NAMESPACE, schemaVersion: "1" }), false);

  const metadata = await validateStorageMetadata();
  assert.deepEqual(metadata, { namespace: STORAGE_NAMESPACE, schemaVersion: 1 });
  assert.equal(storage.operations.filter((operation) => operation.kind === "write").length, 1);
  storage.resetCounters();
  assert.deepEqual(await validateStorageMetadata(), metadata);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("pending and committed v2 metadata are exact, protocol-bound, and typed", async () => {
  const pending = createPendingStorageMetadataV2(binding);
  const committed = createCommittedStorageMetadataV2(binding);
  assert.equal(pending.schemaVersion, PENDING_STORAGE_SCHEMA_VERSION);
  assert.equal(committed.schemaVersion, COMMITTED_STORAGE_SCHEMA_VERSION);
  assert.equal(pending.migrationProtocol, STORAGE_IDENTITY_MIGRATION_PROTOCOL);
  assert.equal(committed.migrationProtocol, STORAGE_IDENTITY_MIGRATION_PROTOCOL);
  assert.equal(Object.keys(pending).length, 6);
  assert.equal(Object.keys(committed).length, 6);

  writeCanonicalJson(STORAGE_KEYS.METADATA, pending);
  await assert.rejects(validateStorageMetadata(), (error: unknown) => errorCode(error) === "storage_migration_pending");
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.METADATA, committed);
  await assert.rejects(validateStorageMetadata(), (error: unknown) => errorCode(error) === "unsupported_newer_storage_schema");
});

test("historical malformed metadata remains a typed fail-closed rejection", async () => {
  writeCanonicalJson(STORAGE_KEYS.METADATA, { namespace: STORAGE_NAMESPACE, schemaVersion: 1, extra: true });
  await assert.rejects(validateStorageMetadata(), (error: unknown) => errorCode(error) === "storage_metadata_invalid");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.METADATA, null);
  await assert.rejects(validateStorageMetadata(), (error: unknown) => errorCode(error) === "storage_metadata_invalid");
});

test("current bootstrap blocks pending/newer metadata before lifecycle or content work", async () => {
  for (const [metadata, reason] of [
    [createPendingStorageMetadataV2(binding), "storage_migration_pending"],
    [createCommittedStorageMetadataV2(binding), "unsupported_newer_storage_schema"],
  ] as const) {
    storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    writeCanonicalJson(STORAGE_KEYS.METADATA, metadata);
    storage.resetCounters();
    const events: string[] = [];
    const result = await bootstrapApplication(
      async () => { events.push("content"); },
      async () => { events.push("resolve"); },
    );
    assert.deepEqual(result, { kind: "blocking", reason });
    assert.deepEqual(events, []);
    assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
  }
});

