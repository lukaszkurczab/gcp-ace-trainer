import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import {
  abandonUnavailableActiveSession,
  createContentIdentityArchivalHistoryRecord,
  createContentIdentityUnavailableActiveRecord,
  createContentIdentityUnavailableReviewRecord,
  getArchivalHistoryRecords,
  getUnavailableActiveRecords,
  getUnavailableReviewRecords,
  removeUnavailableReviewEntry,
  saveUnavailableActiveRecord,
  saveUnavailableReviewRecord,
} from "./contentIdentityUnavailableRepository";
import { clearTrainingSessions } from "./trainingSessionRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const SHA = "a".repeat(64);

function tombstone(kind: "archival_history" | "unavailable_active" | "unavailable_review", id: string): Record<string, unknown> {
  return {
    kind,
    trackId: TRACK_ID,
    questionId: "question-1",
    contentVersion: "content-v0",
    reason: "unknown_artifact_hash",
    migrationVersion: 1,
    legacyIdentityDigest: SHA,
    ...(kind === "unavailable_review" ? { reviewId: id } : { sessionId: id }),
  };
}

function activeRecord(sessionId: string): Parameters<typeof createContentIdentityUnavailableActiveRecord>[0] {
  return {
    schemaVersion: 1,
    kind: "unavailable_active",
    sessionId,
    session: {
      id: sessionId,
      trackId: TRACK_ID,
      status: "active",
      startedAt: "2026-01-01T00:00:00.000Z",
      itemOrder: [{ occurrenceId: "occurrence-1", item: tombstone("unavailable_active", sessionId) }],
    },
    attempts: [{ id: `${sessionId}:attempt`, committedAt: "2026-01-01T00:01:00.000Z", result: { kind: "correct" } }],
    results: [],
  };
}

function reviewRecord(reviewId: string): Parameters<typeof createContentIdentityUnavailableReviewRecord>[0] {
  return {
    schemaVersion: 1,
    kind: "unavailable_review",
    reviewId,
    review: {
      id: reviewId,
      trackId: TRACK_ID,
      sourceAttemptId: `${reviewId}:attempt`,
      sourceSessionId: `${reviewId}:session`,
      sourceItem: tombstone("unavailable_review", reviewId),
      reasons: ["incorrect"],
      dueAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      persistent: true,
    },
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("typed stores keep unavailable records outside strict runtime keys and reject legacy identity fields", async () => {
  const active = createContentIdentityUnavailableActiveRecord(activeRecord("session-unavailable"));
  const review = createContentIdentityUnavailableReviewRecord(reviewRecord("review-unavailable"));
  await saveUnavailableActiveRecord(active);
  await saveUnavailableReviewRecord(review);

  assert.equal((await getUnavailableActiveRecords()).value[0]?.sessionId, "session-unavailable");
  assert.equal((await getUnavailableReviewRecords()).value[0]?.reviewId, "review-unavailable");
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.trainingSession("session-unavailable")), undefined);
  assert.equal(JSON.stringify(active).includes("packagePin"), false);
  assert.equal(JSON.stringify(active).includes("itemId"), false);
  assert.throws(() => createContentIdentityUnavailableActiveRecord({ ...active, session: { ...active.session, itemId: "legacy" } }), /invalid/);
});

test("abandon unavailable active writes terminal archival history before removing the tombstone", async () => {
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord(activeRecord("session-abandon")));
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  storage.resetCounters();

  const result = await abandonUnavailableActiveSession("session-abandon", "2026-01-03T00:00:00.000Z");
  assert.equal(result.value.kind, "archival_history");
  assert.equal(result.value.session.status, "abandoned");
  assert.equal(result.value.session.completedAt, "2026-01-03T00:00:00.000Z");
  assert.equal((await getUnavailableActiveRecords()).value.length, 0);
  assert.equal((await getArchivalHistoryRecords()).value.length, 1);
  const archiveWrite = storage.operations.findIndex((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.archivalHistory("session-abandon"));
  const tombstoneRemove = storage.operations.findIndex((operation) => operation.kind === "remove" && operation.key === STORAGE_KEYS.unavailableActive("session-abandon"));
  assert.ok(archiveWrite >= 0 && tombstoneRemove > archiveWrite);
});

test("removing an unavailable review removes only that entry", async () => {
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(reviewRecord("review-one")));
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(reviewRecord("review-two")));
  await removeUnavailableReviewEntry("review-one");
  assert.deepEqual((await getUnavailableReviewRecords()).value.map((entry) => entry.reviewId), ["review-two"]);
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.unavailableReview("review-one")), undefined);
  assert.notEqual(getKeyValueStorage().getString(STORAGE_KEYS.unavailableReview("review-two")), undefined);
});

test("stored unavailable indexes fail closed when a record is malformed", async () => {
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX, ["review-bad"]);
  writeCanonicalJson(STORAGE_KEYS.unavailableReview("review-bad"), { schemaVersion: 1, kind: "unavailable_review", reviewId: "review-bad", review: { id: "review-bad", itemId: "legacy" } });
  await assert.rejects(() => getUnavailableReviewRecords(), /unsupported/);
});

test("learning-state reset clears all three private content-identity stores", async () => {
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord(activeRecord("session-reset")));
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(reviewRecord("review-reset")));
  await clearTrainingSessions();
  assert.equal((await getUnavailableActiveRecords()).value.length, 0);
  assert.equal((await getUnavailableReviewRecords()).value.length, 0);
  assert.equal((await getArchivalHistoryRecords()).value.length, 0);
});
