import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { ApplicationBootstrapStage, bootstrapApplication } from "./applicationBootstrap";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { createContentIdentityUnavailableActiveRecord, saveUnavailableActiveRecord } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { createCommittedStorageMetadataV2, createPendingStorageMetadataV2 } from "../../storage/repositories/storageMetadataRepository";
import { CanonicalRepositoryBootstrapStep } from "../../storage/repositories/canonicalRepositories";
import { ContentIdentityMigrationBootstrapStep } from "../../storage/repositories/contentIdentityMigrationBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const ARTIFACT_SHA = "a".repeat(64);

class FailsUnavailableActiveReadAfterMigrationStorage extends MemoryKeyValueStorage {
  private migrationCommitted = false;

  override getString(key: string): string | undefined {
    const value = super.getString(key);
    if (key === STORAGE_KEYS.METADATA && value?.includes("committed_v2")) this.migrationCommitted = true;
    if (key === STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX && this.migrationCommitted) throw new Error("post-migration read payload=session-123");
    return value;
  }
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("bootstrap surfaces unavailable active sessions before recovery, content verification, or resume", async () => {
  const sessionId = "unavailable-active-session";
  writeCanonicalJson(STORAGE_KEYS.METADATA, createCommittedStorageMetadataV2({
    sourceManifestDigest: "b".repeat(64),
    targetManifestDigest: "c".repeat(64),
    targetKeySetDigest: "d".repeat(64),
  }));
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord({
    schemaVersion: 1,
    kind: "unavailable_active",
    sessionId,
    session: {
      id: sessionId,
      itemOrder: [{
        occurrenceId: `${sessionId}:0`,
        item: {
          kind: "unavailable_active",
          trackId: TRACK_ID,
          questionId: "question-1",
          contentVersion: "content-v0",
          reason: "unknown_artifact_hash",
          migrationVersion: 1,
          legacyIdentityDigest: ARTIFACT_SHA,
          sessionId,
        },
      }],
      status: "active",
      trackId: TRACK_ID,
    },
    attempts: [],
    results: [],
  }));

  const events: string[] = [];
  const result = await bootstrapApplication(
    async () => { events.push("content"); },
    async () => { events.push("resume"); },
    async () => { events.push("recovery"); },
  );

  assert.deepEqual(result, { kind: "content_identity_unavailable", sessionIds: [sessionId] });
  assert.deepEqual(events, []);
});

test("bootstrap emits exactly one bounded diagnostic for a content-stage failure", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => { throw new Error("content payload=session-123 answer=secret-option"); },
    async () => undefined,
    undefined,
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{ stage: ApplicationBootstrapStage.VerifyingContent, operationalCode: "LOCAL_OPERATION_FAILED", errorKind: "error" }]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /content payload|session-123|answer=|secret-option/);
});

test("bootstrap keeps its blocking result when the diagnostic observer throws", async () => {
  const result = await bootstrapApplication(
    async () => { throw new Error("content payload=session-123"); },
    async () => undefined,
    undefined,
    { diagnosticObserver: () => { throw new Error("observer payload=session-456"); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
});

test("bootstrap preserves a generic repository error and reports its last opening step", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    undefined,
    {
      diagnosticObserver: (event) => { diagnostics.push(event); },
      repositories: {
        guestInstallationIdentity: {
          async create() { throw new Error("identity payload=session-123"); },
        },
      },
    },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /identity payload|session-123/);
});

test("bootstrap preserves a typed repository error and reports its current migration step", async () => {
  writeCanonicalJson(STORAGE_KEYS.METADATA, createPendingStorageMetadataV2({
    sourceManifestDigest: "b".repeat(64),
    targetManifestDigest: "c".repeat(64),
    targetKeySetDigest: "d".repeat(64),
  }));
  const diagnostics: unknown[] = [];

  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    undefined,
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "storage_migration_pending" });
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MetadataDecode,
    contentIdentityMigrationFailureCode: "metadata:storage_migration_pending",
    errorKind: "error",
  }]);
});

test("bootstrap clears migration phase context after repository migration succeeds", async () => {
  const storage = new FailsUnavailableActiveReadAfterMigrationStorage();
  installKeyValueStorageForTests(storage);
  const diagnostics: unknown[] = [];

  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    undefined,
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [STORAGE_READ_FAILED]" });
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "STORAGE_READ_FAILED",
    errorKind: "error",
  }]);
});
