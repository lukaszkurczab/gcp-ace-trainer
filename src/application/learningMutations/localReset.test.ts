import assert from "node:assert/strict";
import test from "node:test";

import { commitLearningStateReset, installLearningStateResetBarrier, recoverPendingMutation } from "./";
import { createForegroundTimerState, createTrainingSessionDraft, createTrainingSessionResult, type TrainingSessionDraft } from "../../domain";
import {
  addReviewQueueItems,
  addTrainingAttempt,
  getActiveMutationJournal,
  getActiveTrainingSessionDraft,
  getGuestInstallation,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  provisionGuestInstallation,
  saveActiveForegroundTimer,
  saveTrainingSession,
  saveTrainingSessionDraft as persistTrainingSessionDraft,
} from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { CANONICAL_RECORD_SCHEMA, writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { saveTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { createContentIdentityArchivalHistoryRecord, createContentIdentityUnavailableActiveRecord, createContentIdentityUnavailableReviewRecord, saveArchivalHistoryRecord, saveUnavailableActiveRecord, saveUnavailableReviewRecord } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { captureLearningStateResetTargetPlan } from "../../storage/repositories/learningStateResetRepository";
import { saveSettings } from "../../storage/repositories/settingsRepository";
import { installKeyValueStorageForTests, MemoryKeyValueStorage, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { attempt, installMemoryStorage, journal, review, session } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";


installLearningStateResetBarrier(async (reset) => reset());

async function saveTrainingSessionDraft(draft: TrainingSessionDraft) {
  return persistTrainingSessionDraft(draft, (await getActiveTrainingSessionDraft(productionTrackAdmissionContext))?.revision ?? null, productionTrackAdmissionContext);
}

async function seedResettableLearningState() {
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } };
  await saveTrainingSession(active, productionTrackAdmissionContext);
  await saveActiveForegroundTimer(createForegroundTimerState({
    schemaVersion: 1, timerVersion: 1, familyId: "reset-test-family", sessionId: active.id,
    trackId: active.trackId, accumulatedForegroundMs: 1_000, checkpointRevision: 1,
    lastCheckpointAt: active.startedAt, running: true,
  }), null, productionTrackAdmissionContext);
  await saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: active.startedAt }));
  await addTrainingAttempt(attempt(), productionTrackAdmissionContext);
  await addReviewQueueItems([review()], productionTrackAdmissionContext);
}

async function seedAllResetTargets() {
  await seedResettableLearningState();
  const completed = session("completed", "completed-session");
  await saveTrainingSession(completed, productionTrackAdmissionContext);
  await saveTrainingSessionResult(createTrainingSessionResult({
    id: `result:${completed.id}`, sessionId: completed.id, trackId: completed.trackId,
    totalOccurrences: 1, answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [],
    completedAt: completed.completedAt!, evidence: { familyId: "coding-interview", details: {} },
  }), productionTrackAdmissionContext);
  const tombstone = (kind: string, id: string) => ({ kind, trackId: "coding-interview-dsa-problem-solving", questionId: "q1", contentVersion: "old", reason: "unknown_artifact_hash", ...(kind === "unavailable_review" ? { reviewId: id } : { sessionId: id }) });
  await saveArchivalHistoryRecord(createContentIdentityArchivalHistoryRecord({
    schemaVersion: 1, kind: "archival_history", sessionId: "archive-reset",
    session: { id: "archive-reset", trackId: "coding-interview-dsa-problem-solving", status: "completed", completedAt: "2026-01-02T00:00:00Z", itemOrder: [{ occurrenceId: "archive-occurrence", item: tombstone("archival_history", "archive-reset") }] }, attempts: [], results: [],
  }));
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord({
    schemaVersion: 1, kind: "unavailable_active", sessionId: "unavailable-reset",
    session: { id: "unavailable-reset", trackId: "coding-interview-dsa-problem-solving", status: "active", startedAt: "2026-01-01T00:00:00Z", itemOrder: [{ occurrenceId: "unavailable-occurrence", item: tombstone("unavailable_active", "unavailable-reset") }] }, attempts: [], results: [],
  }));
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord({
    schemaVersion: 1, kind: "unavailable_review", reviewId: "unavailable-review-reset",
    review: { id: "unavailable-review-reset", trackId: "coding-interview-dsa-problem-solving", sourceAttemptId: "a1", sourceSessionId: "s1", sourceItem: tombstone("unavailable_review", "unavailable-review-reset"), reasons: ["incorrect"], dueAt: "2026-01-02T00:00:00Z", createdAt: "2026-01-01T00:00:00Z", persistent: true },
  }));
  await saveSettings({ appearance: "dark", language: "en" });
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { practiceReminder: null });
}

test("clear local history is one journaled learning-state mutation", async () => {
  installMemoryStorage();
  await seedResettableLearningState();

  await commitLearningStateReset(new Date().toISOString());

  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value, []);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, []);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
  assert.equal(await getActiveTrainingSessionDraft(productionTrackAdmissionContext), null);
});

test("clear local history preserves the one guest installation and local dataset identity", async () => {
  installMemoryStorage();
  const identity = Object.freeze({
    installationId: "11111111-1111-4111-8111-111111111111",
    localDatasetId: "22222222-2222-4222-8222-222222222222",
  });
  const guestInstallation = await provisionGuestInstallation({ async create() { return identity; } });
  await seedResettableLearningState();

  await commitLearningStateReset(new Date().toISOString());

  assert.deepEqual(await getGuestInstallation(), guestInstallation);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value, []);
});

test("reset recovers a pending command before deleting its fully materialized learning state", async () => {
  installMemoryStorage();
  const { persistMutationJournal } = await import("../../storage/repositories/mutationJournalRepository");
  await persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext);

  await commitLearningStateReset(new Date().toISOString());

  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value, []);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, []);
});

test("durable reset replay keeps latest settings and reminder bytes across a fresh lifecycle", async () => {
  const storage = installMemoryStorage();
  await seedResettableLearningState();
  await saveSettings({ appearance: "light", language: "en" });
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { practiceReminder: null });
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  const firstTarget = plan.targets[0];
  assert.ok(firstTarget);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: firstTarget.key });
  const profile = { id: "guest-test-profile", kind: "guest" as const, accountId: null };
  const originalSet = storage.setString.bind(storage);
  let restarted = false;
  let latestSettingsBytes: string | undefined;
  let latestReminderBytes: string | undefined;
  storage.setString = (key: string, value: string) => {
    originalSet(key, value);
    if (key !== STORAGE_KEYS.ACTIVE_JOURNAL || restarted) return;
    restarted = true;
    writeCanonicalJson(STORAGE_KEYS.SETTINGS, { appearance: "dark", language: "pl" });
    writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { practiceReminder: {
      mode: "same-time", commonTime: { hour: 19, minute: 30 },
      schedules: [{ day: "mon", time: { hour: 19, minute: 30 }, notificationId: "reset-preserved-reminder" }],
      trackId: "coding-interview-dsa-problem-solving", transactionId: "reset-preserved-reminder",
    } });
    latestSettingsBytes = storage.getString(STORAGE_KEYS.SETTINGS);
    latestReminderBytes = storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    installKeyValueStorageForTests(storage);
    setActiveProfileLeaseForTests(profile);
  };

  await assert.rejects(commitLearningStateReset(new Date().toISOString()));

  assert.equal(restarted, true);
  storage.setFailurePlan(null);
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(profile);
  await recoverPendingMutation();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(profile);
  await recoverPendingMutation();
  assert.deepEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.equal(storage.getString(STORAGE_KEYS.SETTINGS), latestSettingsBytes);
  assert.equal(storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS), latestReminderBytes);
  assert.deepEqual(storage.getAllKeys().filter((key) => plan.targets.some((target) => target.key === key)), []);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value, []);
});

test("durable reset rejects changed or new physical targets before deleting and keeps journal bytes", async () => {
  for (const injectedTarget of [STORAGE_KEYS.trainingAttempt("attempt-1"), STORAGE_KEYS.trainingSession("unexpected-reset-target")]) {
    const storage = installMemoryStorage();
    await seedResettableLearningState();
    const originalSet = storage.setString.bind(storage);
    let injected = false;
    let afterInjection: ReadonlyMap<string, string> | null = null;
    storage.setString = (key: string, value: string) => {
      originalSet(key, value);
      if (key !== STORAGE_KEYS.ACTIVE_JOURNAL || injected) return;
      injected = true;
      originalSet(injectedTarget, "unexpected target bytes");
      installKeyValueStorageForTests(storage);
      setActiveProfileLeaseForTests({ id: "guest-test-profile", kind: "guest", accountId: null });
      afterInjection = storage.snapshot();
    };

    await assert.rejects(commitLearningStateReset(new Date().toISOString()), injectedTarget);
    assert.equal(injected, true);
    assert.ok(afterInjection);
    assert.deepEqual(storage.snapshot(), afterInjection);
    assert.ok(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL));
    assert.equal(storage.getString(injectedTarget), "unexpected target bytes");
  }
});

test("reset recovers after every physical target deletion boundary across fresh lifecycle instances and double replay", async () => {
  const profile = { id: "guest-test-profile", kind: "guest" as const, accountId: null };
  installMemoryStorage();
  await seedAllResetTargets();
  const seededPlan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  const requiredTargets = [
    STORAGE_KEYS.trainingSession("session-1"), STORAGE_KEYS.trainingSession("completed-session"),
    STORAGE_KEYS.trainingSessionResult("completed-session"), STORAGE_KEYS.TRAINING_SESSION_INDEX,
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
    STORAGE_KEYS.trainingAttempt("attempt-1"), STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
    STORAGE_KEYS.reviewEntry("review-1"), STORAGE_KEYS.REVIEW_INDEX,
    STORAGE_KEYS.archivalHistory("archive-reset"), STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX,
    STORAGE_KEYS.unavailableActive("unavailable-reset"), STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX,
    STORAGE_KEYS.unavailableReview("unavailable-review-reset"), STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX,
  ];
  for (const key of requiredTargets) assert.ok(seededPlan.targets.some((target) => target.key === key), `matrix fixture must include ${key}`);
  const boundaries = [
    { label: "journal-write-before-effect", failure: { kind: "fail_on_key_write_occurrence" as const, key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 1 }, retry: "new-command" as const },
    ...seededPlan.targets.map((target) => ({ label: `target-remove:${target.key}`, failure: { kind: "fail_on_key_remove" as const, key: target.key }, retry: "recover" as const })),
    { label: "all-targets-removed-before-materialized-phase", failure: { kind: "fail_on_key_write_occurrence" as const, key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 }, retry: "recover" as const },
    { label: "verified-before-pending-clear-phase", failure: { kind: "fail_on_key_write_occurrence" as const, key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 3 }, retry: "recover" as const },
    { label: "verified-pending-clear-before-journal-remove", failure: { kind: "fail_on_key_remove" as const, key: STORAGE_KEYS.ACTIVE_JOURNAL }, retry: "recover" as const },
  ];
  for (const boundary of boundaries) {
    const storage = installMemoryStorage();
    await seedAllResetTargets();
    const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
    const preservedBefore = new Map(plan.preserved.map(({ key }) => [key, storage.snapshot().get(key)]));
    const bytesBeforeAttempt = storage.snapshot();
    storage.setFailurePlan(boundary.failure);
    await assert.rejects(commitLearningStateReset(new Date().toISOString()), boundary.label);
    storage.setFailurePlan(null);
    if (boundary.retry === "new-command") {
      assert.deepEqual(storage.snapshot(), bytesBeforeAttempt, boundary.label);
      await commitLearningStateReset(new Date().toISOString());
    } else {
      if (boundary.failure.kind === "fail_on_key_write_occurrence") {
        assert.ok(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), boundary.label);
        assert.deepEqual(storage.getAllKeys().filter((key) => plan.targets.some((target) => target.key === key)), [], boundary.label);
      }
      installKeyValueStorageForTests(storage);
      setActiveProfileLeaseForTests(profile);
      await recoverPendingMutation();
      installKeyValueStorageForTests(storage);
      setActiveProfileLeaseForTests(profile);
      await recoverPendingMutation();
    }
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, boundary.label);
    assert.deepEqual(storage.getAllKeys().filter((key) => plan.targets.some((target) => target.key === key)), [], boundary.label);
    for (const [key, value] of preservedBefore) assert.equal(storage.getString(key), value, `${boundary.label}: preserved ${key}`);
  }
});

test("legacy reset journals without an exact target plan fail closed and remain byte-identical", async () => {
  const storage = installMemoryStorage();
  await seedResettableLearningState();
  const legacyPayload = {
    journalId: "journal:legacy-reset",
    operation: "reset_learning_state",
    status: "journal_durable",
    createdAt: "2026-10-10T00:00:00.000Z",
    sessionId: "learning-state-reset",
    trackId: "coding-interview-dsa-problem-solving",
    artifactSha256: null,
    commandIdentity: { version: 1, fingerprint: "a".repeat(64) },
    expectedRevisions: [],
    planFingerprint: "b".repeat(64),
    writes: [{ kind: "clear_learning_state" }],
  };
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: 1, payload: legacyPayload }));
  const before = storage.snapshot();
  await assert.rejects(() => recoverPendingMutation());
  assert.deepEqual(storage.snapshot(), before);
  assert.ok(storage.getString(STORAGE_KEYS.trainingSession("session-1")));
  assert.ok(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL));
});

function survivingDisk(snapshot: ReadonlyMap<string, string>): MemoryKeyValueStorage {
  const disk = new MemoryKeyValueStorage();
  for (const [key, value] of snapshot) disk.setString(key, value);
  disk.resetCounters();
  return disk;
}

test("17.2 process death after the first reset target delete and before the next keeps the plan, then two cold recoveries finish it", async () => {
  const profile = { id: "guest-test-profile", kind: "guest" as const, accountId: null };
  const storage = installMemoryStorage();
  await seedAllResetTargets();
  const plan = captureLearningStateResetTargetPlan(productionTrackAdmissionContext);
  const targetKeys = plan.targets.map((target) => target.key);
  assert.ok(targetKeys.length >= 2);
  const before = storage.snapshot();
  assert.equal(before.has(STORAGE_KEYS.ACTIVE_JOURNAL), false);

  // Cut RESET-FIRST-DELETE-BEFORE-NEXT: the process dies when the second target delete is attempted.
  const originalRemove = storage.remove.bind(storage);
  const originalSet = storage.setString.bind(storage);
  const removedTargets: string[] = [];
  let cutDisk: ReadonlyMap<string, string> | null = null;
  const dead = () => { throw new Error("simulated process death"); };
  storage.setString = (key: string, value: string) => { if (cutDisk) dead(); originalSet(key, value); };
  storage.remove = (key: string) => {
    if (cutDisk) dead();
    if (targetKeys.includes(key) && removedTargets.length === 1) { cutDisk = storage.snapshot(); dead(); }
    originalRemove(key);
    if (targetKeys.includes(key)) removedTargets.push(key);
  };
  await assert.rejects(commitLearningStateReset(new Date().toISOString()));
  assert.ok(cutDisk, "the cut was reached");
  const disk: ReadonlyMap<string, string> = cutDisk;

  // State at the cut: durable journal, exactly one target absent, every other byte unchanged.
  const journalBytes = disk.get(STORAGE_KEYS.ACTIVE_JOURNAL);
  assert.ok(journalBytes, "J is physically present at the cut");
  const journalPayload = (JSON.parse(journalBytes) as { payload: { operation: string; status: string } }).payload;
  assert.equal(journalPayload.operation, "reset_learning_state");
  assert.equal(journalPayload.status, "journal_durable");
  assert.equal(removedTargets.length, 1);
  assert.equal(disk.has(removedTargets[0]!), false);
  const changedKeys = [...new Set([...before.keys(), ...disk.keys()])].filter((key) => before.get(key) !== disk.get(key)).sort();
  assert.deepEqual(changedKeys, [STORAGE_KEYS.ACTIVE_JOURNAL, removedTargets[0]!].sort());

  // RESET-READ-UNKNOWN-01: an unreadable remaining target blocks recovery without fake success or further deletes.
  const unknownRead = survivingDisk(disk);
  const remainingTarget = targetKeys.find((key) => key !== removedTargets[0])!;
  installKeyValueStorageForTests(unknownRead);
  setActiveProfileLeaseForTests(profile);
  unknownRead.setFailurePlan({ kind: "fail_on_key_read", key: remainingTarget });
  await assert.rejects(recoverPendingMutation());
  unknownRead.setFailurePlan(null);
  assert.deepEqual(unknownRead.snapshot(), disk, "an unknown read preserves J and every store byte");

  // Two cold recoveries on the surviving disk complete the same journaled plan.
  const survivor = survivingDisk(disk);
  const recoveries: ReadonlyMap<string, string>[] = [];
  for (let launch = 0; launch < 2; launch += 1) {
    installKeyValueStorageForTests(survivor);
    setActiveProfileLeaseForTests(profile);
    await recoverPendingMutation();
    recoveries.push(survivor.snapshot());
  }
  assert.deepEqual(recoveries[1], recoveries[0], "the second cold recovery is a no-op");
  assert.equal(survivor.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
  assert.deepEqual(survivor.getAllKeys().filter((key) => targetKeys.includes(key)), []);
  for (const { key } of plan.preserved) assert.equal(survivor.getString(key), before.get(key), `preserved ${key}`);
  const unrelated = [...before.keys()].filter((key) => !targetKeys.includes(key));
  for (const key of unrelated) assert.equal(survivor.getString(key), before.get(key), `unrelated ${key}`);
});
