import assert from "node:assert/strict";
import test from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "./canonicalRecordCodec";
import { migrateContentIdentityBeforeRepositoryOpen } from "./contentIdentityMigrationBootstrap";
import { isCommittedStorageMetadataV2, validateStorageMetadata } from "./storageMetadataRepository";
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

test("repository bootstrap migrates legacy identity once and later launches preserve public writes", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
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
