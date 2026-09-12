import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "./applicationBootstrap";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { createContentIdentityUnavailableActiveRecord, saveUnavailableActiveRecord } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { createCommittedStorageMetadataV2 } from "../../storage/repositories/storageMetadataRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const ARTIFACT_SHA = "a".repeat(64);

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
