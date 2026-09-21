import assert from "node:assert/strict";
import test from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "./canonicalRecordCodec";
import {
  createContentIdentityArchivalHistoryRecord,
  createContentIdentityUnavailableActiveRecord,
  getUnavailableActiveRecords,
} from "./contentIdentityUnavailableRepository";
import {
  CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER,
  ContentIdentityMigrationBootstrapStep,
  migrateContentIdentityBeforeRepositoryOpen,
} from "./contentIdentityMigrationBootstrap";
import { createCommittedStorageMetadataV2, createPendingStorageMetadataV2, isCommittedStorageMetadataV2, StorageMetadataError, validateStorageMetadata } from "./storageMetadataRepository";
import { isTrainingSession } from "./trainingModelGuards";

const SHA = "a".repeat(64);
const TRACK = "coding-interview-dsa-problem-solving";
const VERSION = "content-v1";
const RELEASE = "canonical-content-v1";
const pin = { packageIdentity: SHA, packageVersion: VERSION, contentReleaseId: RELEASE };
const artifacts = Object.freeze(Array.from({ length: 9 }, (_, index) => Object.freeze({
  trackId: index === 0 ? TRACK : `track-${index}`,
  contentVersion: index === 0 ? VERSION : `version-${index}`,
  artifactSha256: index === 0 ? SHA : `${index}`.repeat(64),
  contentReleaseId: RELEASE,
  questionIds: Object.freeze([index === 0 ? "question-1" : `question-${index}`]),
})));

async function installLegacyFixture(storage: MemoryKeyValueStorage): Promise<void> {
  await validateStorageMetadata();
  const legacyRef = { trackId: TRACK, itemId: "question-1", contentVersion: VERSION, packagePin: pin };
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["session-1"]);
  writeCanonicalJson(STORAGE_KEYS.trainingSession("session-1"), {
    id: "session-1", trackId: TRACK, modeId: "guided", configurationSnapshot: { kind: "practice" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: legacyRef }], optionOrderByOccurrence: {}, conditionalReinsertSlots: [],
    activeForegroundMs: 0, contentVersion: VERSION, packagePin: pin, status: "abandoned",
    startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:01:00.000Z",
  });
}

function unavailableActiveRecord(sessionId: string): Parameters<typeof createContentIdentityUnavailableActiveRecord>[0] {
  return {
    schemaVersion: 1,
    kind: "unavailable_active",
    sessionId,
    session: {
      id: sessionId,
      trackId: TRACK,
      status: "active",
      itemOrder: [{ occurrenceId: `${sessionId}:occurrence`, item: { kind: "unavailable_active", trackId: TRACK, questionId: "question-1", contentVersion: VERSION, reason: "unknown_artifact_hash", migrationVersion: 1, legacyIdentityDigest: SHA, sessionId } }],
    },
    attempts: [],
    results: [],
  };
}

function archivalHistoryRecord(sessionId: string): Parameters<typeof createContentIdentityArchivalHistoryRecord>[0] {
  return {
    schemaVersion: 1,
    kind: "archival_history",
    sessionId,
    session: {
      id: sessionId,
      trackId: TRACK,
      status: "completed",
      completedAt: "2026-01-02T00:00:00.000Z",
      itemOrder: [{ occurrenceId: `${sessionId}:occurrence`, item: { kind: "archival_history", trackId: TRACK, questionId: "question-1", contentVersion: VERSION, reason: "unknown_artifact_hash", migrationVersion: 1, legacyIdentityDigest: SHA, sessionId } }],
    },
    attempts: [],
    results: [],
  };
}

test("repository bootstrap migrates legacy identity once and later launches preserve public writes", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await installLegacyFixture(storage);

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts });
  const migrated = readCanonicalEnvelope(STORAGE_KEYS.trainingSession("session-1"), isTrainingSession);
  assert.equal(migrated?.payload.artifactSha256, SHA);
  assert.equal(migrated?.payload.itemOrder[0]?.item.questionId, "question-1");
  assert.equal(storage.getString(STORAGE_KEYS.trainingSession("session-1"))?.includes("packagePin"), false);
  assert.equal(isCommittedStorageMetadataV2((await validateStorageMetadata())), true);

  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRACK, TRACK);
  const activeTrackRaw = storage.getString(STORAGE_KEYS.ACTIVE_TRACK);
  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts });
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRACK), activeTrackRaw);
});

test("migration bootstrap reports exact phases and skips runtime artifact loading when artifacts are supplied", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await installLegacyFixture(storage);
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts, onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MetadataRead,
    ContentIdentityMigrationBootstrapStep.MetadataDecode,
    ContentIdentityMigrationBootstrapStep.SnapshotCapture,
    ContentIdentityMigrationBootstrapStep.MigrationPlan,
    ContentIdentityMigrationBootstrapStep.MigrationApply,
    ContentIdentityMigrationBootstrapStep.PostMigrationCleanup,
  ]);
  assert.deepEqual(CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MigrationRecovery,
    ContentIdentityMigrationBootstrapStep.MetadataRead,
    ContentIdentityMigrationBootstrapStep.MetadataInitialization,
    ContentIdentityMigrationBootstrapStep.MetadataDecode,
    ContentIdentityMigrationBootstrapStep.CommittedCleanup,
    ContentIdentityMigrationBootstrapStep.SnapshotCapture,
    ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad,
    ContentIdentityMigrationBootstrapStep.MigrationPlan,
    ContentIdentityMigrationBootstrapStep.MigrationApply,
    ContentIdentityMigrationBootstrapStep.PostMigrationCleanup,
  ]);
  assert.deepEqual(steps, CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER.filter((step) => step !== ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad && step !== ContentIdentityMigrationBootstrapStep.MigrationRecovery && step !== ContentIdentityMigrationBootstrapStep.MetadataInitialization && step !== ContentIdentityMigrationBootstrapStep.CommittedCleanup));
});

test("migration bootstrap isolates a throwing observer and preserves typed failures", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  storage.setString(STORAGE_KEYS.METADATA, "malformed payload=session-123");
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await assert.rejects(
    () => migrateContentIdentityBeforeRepositoryOpen(storage, {
      artifacts,
      onStep: (step) => {
        steps.push(step);
        throw new Error("observer payload=question-456");
      },
    }),
    (error: unknown) => error instanceof StorageMetadataError && error.code === "storage_metadata_invalid",
  );
  assert.deepEqual(steps, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MetadataRead,
    ContentIdentityMigrationBootstrapStep.MetadataDecode,
  ]);
});

test("migration bootstrap reports runtime artifact loading only when dependencies omit artifacts", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await installLegacyFixture(storage);
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await migrateContentIdentityBeforeRepositoryOpen(storage, { onStep: (step) => { steps.push(step); } });

  assert.equal(steps.includes(ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad), true);
  assert.equal(steps.indexOf(ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad), steps.indexOf(ContentIdentityMigrationBootstrapStep.SnapshotCapture) + 1);
});

test("migration bootstrap reports metadata initialization when the metadata record is absent", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts, onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MetadataRead,
    ContentIdentityMigrationBootstrapStep.MetadataInitialization,
    ContentIdentityMigrationBootstrapStep.MetadataDecode,
    ContentIdentityMigrationBootstrapStep.SnapshotCapture,
    ContentIdentityMigrationBootstrapStep.MigrationPlan,
    ContentIdentityMigrationBootstrapStep.MigrationApply,
    ContentIdentityMigrationBootstrapStep.PostMigrationCleanup,
  ]);
});

test("migration bootstrap reports committed cleanup without reopening migration", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.METADATA, createCommittedStorageMetadataV2({
    sourceManifestDigest: "b".repeat(64),
    targetManifestDigest: "c".repeat(64),
    targetKeySetDigest: "d".repeat(64),
  }));
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts, onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MetadataRead,
    ContentIdentityMigrationBootstrapStep.MetadataDecode,
    ContentIdentityMigrationBootstrapStep.CommittedCleanup,
  ]);
});

test("committed bootstrap repairs a mixed unavailable-active index before the public getter runs", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.METADATA, createCommittedStorageMetadataV2({
    sourceManifestDigest: "b".repeat(64),
    targetManifestDigest: "c".repeat(64),
    targetKeySetDigest: "d".repeat(64),
  }));
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["active-one", "archive-one"]);
  writeCanonicalJson(STORAGE_KEYS.unavailableActive("active-one"), createContentIdentityUnavailableActiveRecord(unavailableActiveRecord("active-one")));
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-one"), createContentIdentityArchivalHistoryRecord(archivalHistoryRecord("archive-one")));

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts });

  assert.deepEqual((await getUnavailableActiveRecords()).value.map((record) => record.sessionId), ["active-one"]);
  assert.notEqual(storage.getString(STORAGE_KEYS.archivalHistory("archive-one")), undefined);
});

test("pending v2 metadata never repairs the unavailable-active index", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.METADATA, createPendingStorageMetadataV2({
    sourceManifestDigest: "b".repeat(64),
    targetManifestDigest: "c".repeat(64),
    targetKeySetDigest: "d".repeat(64),
  }));
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["archive-one"]);
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-one"), createContentIdentityArchivalHistoryRecord(archivalHistoryRecord("archive-one")));
  const before = storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX);
  storage.resetCounters();

  await assert.rejects(
    () => migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts }),
    (error: unknown) => error instanceof StorageMetadataError && error.code === "storage_migration_pending",
  );

  assert.equal(storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX), before);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("migration bootstrap reports recovery before cleanup for an already committed marker", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await installLegacyFixture(storage);
  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts });
  const steps: ContentIdentityMigrationBootstrapStep[] = [];

  await migrateContentIdentityBeforeRepositoryOpen(storage, { artifacts, onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, [
    ContentIdentityMigrationBootstrapStep.MigrationStateRead,
    ContentIdentityMigrationBootstrapStep.MigrationRecovery,
    ContentIdentityMigrationBootstrapStep.CommittedCleanup,
  ]);
});
