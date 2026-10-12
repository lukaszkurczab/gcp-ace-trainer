import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS } from "../keys";
import { attempt, installMemoryStorage } from "../../testing/journalTestSupport";
import { addTrainingAttempt } from "./trainingAttemptRepository";
import {
  assertLearningStateResetPlanBeforeJournal,
  assertLearningStateResetMaterialized,
  assertLearningStateResetReplayState,
  captureLearningStateResetTargetPlan,
  materializeLearningStateReset,
} from "./learningStateResetRepository";
import { captureActiveProfileStorageLease, getKeyValueStorage, installKeyValueStorageForTests, isActiveProfileStorageLeaseCurrent, MemoryKeyValueStorage, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { saveSettings } from "./settingsRepository";
import {
  createContentIdentityArchivalHistoryRecord,
  createContentIdentityUnavailableActiveRecord,
  createContentIdentityUnavailableReviewRecord,
  saveArchivalHistoryRecord,
  saveUnavailableActiveRecord,
  saveUnavailableReviewRecord,
} from "./contentIdentityUnavailableRepository";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";


test("reset captures a closed exact physical set and deletes a validated partial prefix", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  assert.ok(plan.targets.some((entry) => entry.key === STORAGE_KEYS.trainingAttempt("attempt-1")));
  assert.ok(plan.targets.some((entry) => entry.key === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX));
  assertLearningStateResetPlanBeforeJournal(plan, productionTrackAdmissionContext);

  const firstTarget = plan.targets[0];
  assert.ok(firstTarget);
  storage.remove(firstTarget.key);
  assertLearningStateResetReplayState(plan);
  materializeLearningStateReset(plan);
  assert.deepEqual(storage.getAllKeys().filter((key) => plan.targets.some((target) => target.key === key)), []);
  assert.deepEqual(storage.getString(STORAGE_KEYS.METADATA) !== undefined, true);
});

test("new reset rejects corrupt indexed evidence before journal authorization", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  storage.remove(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX);
  const before = storage.snapshot();

  assert.throws(() => captureLearningStateResetTargetPlan(productionTrackAdmissionContext));
  assert.deepEqual(storage.snapshot(), before);
});

test("new reset rejects malformed active-state pointers and checkpoints without changing bytes", () => {
  for (const key of [STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER]) {
    const storage = installMemoryStorage();
    storage.setString(key, "not-json");
    const before = storage.snapshot();
    assert.throws(() => captureLearningStateResetTargetPlan(productionTrackAdmissionContext), (error: unknown) => error instanceof Error, key);
    assert.deepEqual(storage.snapshot(), before, `${key} must remain byte-identical after rejection`);
  }
});

test("new reset rejects an orphan active-session pointer before authorization", () => {
  const storage = installMemoryStorage();
  storage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, JSON.stringify({ schemaIdentity: "patternly.canonical-record.v1", revision: 1, payload: "missing-session" }));
  const before = storage.snapshot();
  assert.throws(() => captureLearningStateResetTargetPlan(productionTrackAdmissionContext));
  assert.deepEqual(storage.snapshot(), before);
});

test("replay rejects changed or newly appeared physical targets before deleting any other target", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  storage.setString(STORAGE_KEYS.trainingSession("unexpected"), "unexpected target");
  const before = storage.snapshot();
  assert.throws(() => materializeLearningStateReset(plan));
  assert.deepEqual(storage.snapshot(), before);

  storage.remove(STORAGE_KEYS.trainingSession("unexpected"));
  storage.setString(STORAGE_KEYS.trainingAttempt("attempt-1"), "changed target bytes");
  const changed = storage.snapshot();
  assert.throws(() => materializeLearningStateReset(plan));
  assert.deepEqual(storage.snapshot(), changed);
});

test("reset plan replay ignores historical preserved hashes while preserving the current settings and reminder bytes", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  await saveSettings({ appearance: "dark", language: "pl" });
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { practiceReminder: null });
  const settingsBytes = storage.getString(STORAGE_KEYS.SETTINGS);
  const reminderBytes = storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS);

  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests({ id: "guest-test-profile", kind: "guest", accountId: null });
  assertLearningStateResetReplayState(plan);
  materializeLearningStateReset(plan);

  assert.equal(storage.getString(STORAGE_KEYS.SETTINGS), settingsBytes);
  assert.equal(storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS), reminderBytes);
  assertLearningStateResetMaterialized(plan);
});

test("one reset invocation detects preserved bytes changed during target deletion", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  await saveSettings({ appearance: "dark", language: "en" });
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  const remove = storage.remove.bind(storage);
  let changed = false;
  storage.remove = (key: string) => {
    remove(key);
    if (!changed) {
      changed = true;
      writeCanonicalJson(STORAGE_KEYS.SETTINGS, { appearance: "light", language: "en" });
    }
  };

  assert.throws(() => materializeLearningStateReset(plan));
  assert.equal(changed, true);
});

test("replay is fenced to the captured selected profile identity", async () => {
  const storage = installMemoryStorage();
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  setActiveProfileLeaseForTests({ id: "other-selected-profile", kind: "guest", accountId: null });
  const before = storage.snapshot();
  assert.throws(() => materializeLearningStateReset(plan));
  assert.deepEqual(storage.snapshot(), before);
});

test("reset captures and removes every validated retained content-history family", async () => {
  installMemoryStorage();
  const tombstone = (kind: string, id: string) => ({ kind, trackId: "coding-interview-dsa-problem-solving", questionId: "q1", contentVersion: "old", reason: "unknown_artifact_hash", ...(kind === "unavailable_review" ? { reviewId: id } : { sessionId: id }) });
  await saveArchivalHistoryRecord(createContentIdentityArchivalHistoryRecord({
    schemaVersion: 1, kind: "archival_history", sessionId: "archive-1",
    session: { id: "archive-1", trackId: "coding-interview-dsa-problem-solving", status: "completed", completedAt: "2026-01-02T00:00:00Z", itemOrder: [{ occurrenceId: "o1", item: tombstone("archival_history", "archive-1") }] }, attempts: [], results: [],
  }));
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord({
    schemaVersion: 1, kind: "unavailable_active", sessionId: "unavailable-1",
    session: { id: "unavailable-1", trackId: "coding-interview-dsa-problem-solving", status: "active", startedAt: "2026-01-01T00:00:00Z", itemOrder: [{ occurrenceId: "o2", item: tombstone("unavailable_active", "unavailable-1") }] }, attempts: [], results: [],
  }));
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord({
    schemaVersion: 1, kind: "unavailable_review", reviewId: "unavailable-review-1",
    review: { id: "unavailable-review-1", trackId: "coding-interview-dsa-problem-solving", sourceAttemptId: "a1", sourceSessionId: "s1", sourceItem: tombstone("unavailable_review", "unavailable-review-1"), reasons: ["incorrect"], dueAt: "2026-01-02T00:00:00Z", createdAt: "2026-01-01T00:00:00Z", persistent: true },
  }));
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  assert.ok(plan.targets.some((entry) => entry.key === STORAGE_KEYS.archivalHistory("archive-1")));
  assert.ok(plan.targets.some((entry) => entry.key === STORAGE_KEYS.unavailableActive("unavailable-1")));
  assert.ok(plan.targets.some((entry) => entry.key === STORAGE_KEYS.unavailableReview("unavailable-review-1")));
  materializeLearningStateReset(plan);
  assert.equal(storage.getString(STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX), undefined);
});

test("test profile lease fencing invalidates a same-profile lease after reinstallation", () => {
  const storage = installMemoryStorage();
  const lease = captureActiveProfileStorageLease()!;
  installMemoryStorage();
  assert.equal(isActiveProfileStorageLeaseCurrent(lease), false);
  assert.notEqual(storage, getKeyValueStorage());
});
