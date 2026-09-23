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
  ContentIdentityUnavailableActiveIndexRepairError,
  getArchivalHistoryRecords,
  getUnavailableActiveRecords,
  getUnavailableReviewRecords,
  repairUnavailableActiveIndex,
  removeUnavailableReviewEntry,
  saveArchivalHistoryRecord,
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

function archivalRecord(sessionId: string): Parameters<typeof createContentIdentityArchivalHistoryRecord>[0] {
  return {
    schemaVersion: 1,
    kind: "archival_history",
    sessionId,
    session: {
      id: sessionId,
      trackId: TRACK_ID,
      status: "completed",
      completedAt: "2026-01-02T00:00:00.000Z",
      itemOrder: [{ occurrenceId: "occurrence-1", item: tombstone("archival_history", sessionId) }],
    },
    attempts: [],
    results: [],
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

class RevisionConflictStorage extends MemoryKeyValueStorage {
  private indexReads = 0;

  override getString(key: string): string | undefined {
    const value = super.getString(key);
    if (key !== STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX || value === undefined) return value;
    this.indexReads += 1;
    if (this.indexReads !== 2) return value;
    const envelope = JSON.parse(value) as { schemaIdentity: string; revision: number; payload: unknown };
    return JSON.stringify({ ...envelope, revision: envelope.revision + 1 });
  }

  resetRace(): void {
    this.indexReads = 0;
  }
}

class VerificationFailureStorage extends MemoryKeyValueStorage {
  private indexReads = 0;

  override getString(key: string): string | undefined {
    const value = super.getString(key);
    if (key !== STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX || value === undefined) return value;
    this.indexReads += 1;
    if (this.indexReads !== 4) return value;
    const envelope = JSON.parse(value) as { schemaIdentity: string; revision: number; payload: unknown };
    return JSON.stringify({ ...envelope, payload: ["verification-stale"] });
  }

  resetRace(): void {
    this.indexReads = 0;
  }
}

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

test("committed unavailable-active repair preserves active order and removes only archive IDs from the index", () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const active = createContentIdentityUnavailableActiveRecord(activeRecord("active-one"));
  const archive = createContentIdentityArchivalHistoryRecord(archivalRecord("archive-one"));
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["active-one", "archive-one"]);
  writeCanonicalJson(STORAGE_KEYS.unavailableActive("active-one"), active);
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-one"), archive);
  storage.resetCounters();

  repairUnavailableActiveIndex(storage);

  const writes = storage.operations.filter((operation) => operation.kind === "write");
  const removes = storage.operations.filter((operation) => operation.kind === "remove");
  assert.deepEqual(writes.map((operation) => operation.key), [STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX]);
  assert.deepEqual(removes, []);
  assert.deepEqual(JSON.parse(storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)!).payload, ["active-one"]);
  assert.notEqual(storage.getString(STORAGE_KEYS.unavailableActive("active-one")), undefined);
  assert.notEqual(storage.getString(STORAGE_KEYS.archivalHistory("archive-one")), undefined);
});

test("committed unavailable-active repair is an idempotent no-op for an already exact active index", () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["active-one"]);
  writeCanonicalJson(STORAGE_KEYS.unavailableActive("active-one"), createContentIdentityUnavailableActiveRecord(activeRecord("active-one")));
  storage.resetCounters();

  repairUnavailableActiveIndex(storage);

  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("committed unavailable-active repair treats an expected-revision race as a typed conflict without retry or partial write", () => {
  const storage = new RevisionConflictStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["archive-race"]);
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-race"), createContentIdentityArchivalHistoryRecord(archivalRecord("archive-race")));
  storage.resetCounters();
  storage.resetRace();
  const before = storage.snapshot();

  assert.throws(
    () => repairUnavailableActiveIndex(storage),
    (error: unknown) => error instanceof ContentIdentityUnavailableActiveIndexRepairError && error.code === "write_conflict",
  );
  assert.deepEqual(storage.snapshot(), before);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("committed unavailable-active repair reports a verification mismatch after one index write without retry", () => {
  const storage = new VerificationFailureStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["archive-verification"]);
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-verification"), createContentIdentityArchivalHistoryRecord(archivalRecord("archive-verification")));
  storage.resetCounters();
  storage.resetRace();

  assert.throws(
    () => repairUnavailableActiveIndex(storage),
    (error: unknown) => error instanceof ContentIdentityUnavailableActiveIndexRepairError && error.code === "write_verification_failed",
  );
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove").map((operation) => operation.key), [STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX]);
  assert.deepEqual(JSON.parse(storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)!).payload, []);
});

test("committed unavailable-active repair fails typed and makes no partial write for invalid index or record state", () => {
  const cases: readonly { name: string; setup: (storage: MemoryKeyValueStorage) => void; code: ContentIdentityUnavailableActiveIndexRepairError["code"] }[] = [
    { name: "malformed index", setup: (storage) => { storage.setString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, "not-json"); }, code: "index_invalid" },
    { name: "invalid envelope version", setup: (storage) => { storage.setString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 0, payload: [] })); }, code: "index_invalid" },
    { name: "duplicate IDs", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["active-one", "active-one"]); }, code: "index_invalid" },
    { name: "neither record", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["missing-one"]); }, code: "record_missing" },
    { name: "invalid active record", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["invalid-one"]); writeCanonicalJson(STORAGE_KEYS.unavailableActive("invalid-one"), { invalid: true }); }, code: "record_invalid" },
    { name: "active record ID mismatch", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["indexed-active"]); writeCanonicalJson(STORAGE_KEYS.unavailableActive("indexed-active"), createContentIdentityUnavailableActiveRecord(activeRecord("actual-active"))); }, code: "record_invalid" },
    { name: "archive record ID mismatch", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["indexed-archive"]); writeCanonicalJson(STORAGE_KEYS.archivalHistory("indexed-archive"), createContentIdentityArchivalHistoryRecord(archivalRecord("actual-archive"))); }, code: "record_invalid" },
    { name: "both active and archive records", setup: (storage) => { writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["conflict-one"]); writeCanonicalJson(STORAGE_KEYS.unavailableActive("conflict-one"), createContentIdentityUnavailableActiveRecord(activeRecord("conflict-one"))); writeCanonicalJson(STORAGE_KEYS.archivalHistory("conflict-one"), createContentIdentityArchivalHistoryRecord(archivalRecord("conflict-one"))); }, code: "record_conflict" },
  ];

  for (const current of cases) {
    const storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    current.setup(storage);
    const before = storage.snapshot();
    storage.resetCounters();
    assert.throws(
      () => repairUnavailableActiveIndex(storage),
      (error: unknown) => error instanceof ContentIdentityUnavailableActiveIndexRepairError && error.code === current.code,
      current.name,
    );
    assert.deepEqual(storage.snapshot(), before, current.name);
    assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), [], current.name);
  }
});

test("committed unavailable-active repair removes archive-only IDs while preserving their records", () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  writeCanonicalJson(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, ["archive-only"]);
  writeCanonicalJson(STORAGE_KEYS.archivalHistory("archive-only"), createContentIdentityArchivalHistoryRecord(archivalRecord("archive-only")));
  storage.resetCounters();

  repairUnavailableActiveIndex(storage);

  assert.deepEqual(JSON.parse(storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)!).payload, []);
  assert.notEqual(storage.getString(STORAGE_KEYS.archivalHistory("archive-only")), undefined);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write").map((operation) => operation.key), [STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX]);
});

test("learning-state reset clears all three private content-identity stores", async () => {
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord(activeRecord("session-reset")));
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(reviewRecord("review-reset")));
  await clearTrainingSessions();
  assert.equal((await getUnavailableActiveRecords()).value.length, 0);
  assert.equal((await getUnavailableReviewRecords()).value.length, 0);
  assert.equal((await getArchivalHistoryRecords()).value.length, 0);
});
