import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  CODING_INTERVIEW_TRACK_ID,
  createDefaultGoal,
  createFamilyEnvelope,
  createLearningPlanSlotId,
  createTrainingSessionResult,
  type LearningPlan,
} from "../domain";
import { captureHomeShellReadFence } from "./homeShellReadFence";
import { dismissGoalOnboarding } from "../storage/repositories/goalOnboardingPreferenceRepository";
import {
  addTrainingAttempt,
  addReviewQueueItems,
  clearActiveTrainingSession,
  clearActiveTrackId,
  persistMutationJournal,
  saveActiveTrackId,
  saveDeviceReminderSettings,
  saveGoalSnapshot,
  saveLearningPlanAtomically,
  saveTrainingSession,
  saveTrainingSessionResult,
} from "../storage/repositories";
import {
  getKeyValueStorage,
  installKeyValueStorageForTests,
  MemoryKeyValueStorage,
} from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";
import { attempt, journal, review, session, timestamp } from "../testing/journalTestSupport";

const TRACK_ID = CODING_INTERVIEW_TRACK_ID;
const ARTIFACT = "a".repeat(64);

function acceptedPlan(overrides: Partial<Extract<LearningPlan, { schemaVersion: 1 }>> = {}): LearningPlan {
  return {
    schemaVersion: 1,
    planId: "plan:home-fence",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    artifactSha256: ARTIFACT,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-07-15T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:home-fence-1",
    slots: [{ slotId: createLearningPlanSlotId("home-fence-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
    ...overrides,
  };
}

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveActiveTrackId(TRACK_ID);
});

test("Home fence rejects persisted goal and accepted-plan changes", async () => {
  const goal = createDefaultGoal(TRACK_ID);
  await saveGoalSnapshot(goal, null);
  const beforeGoalUpdate = captureHomeShellReadFence(TRACK_ID);
  await saveGoalSnapshot({ ...goal, status: "paused" }, 1);
  assert.throws(beforeGoalUpdate, /Home learning sources changed/);

  saveLearningPlanAtomically({ plan: acceptedPlan({ goalRevision: 2 }), expectedGoalRevision: 2, expectedPlanStorageRevision: null });
  const beforePlanUpdate = captureHomeShellReadFence(TRACK_ID);
  const nextPlan = acceptedPlan({
    goalRevision: 2,
    planRevision: 2,
    commandId: "command:home-fence-2",
    updatedAt: "2026-07-16T10:00:00.000Z",
    slots: [{ slotId: createLearningPlanSlotId("home-fence-slot"), day: "mon", localTime: "19:00", sessionLength: 10 }],
  });
  saveLearningPlanAtomically({ plan: nextPlan, expectedGoalRevision: 2, expectedPlanStorageRevision: 1 });
  assert.throws(beforePlanUpdate, /Home learning sources changed/);
});

test("Home fence rejects persisted review and attempt additions", async () => {
  const beforeReview = captureHomeShellReadFence(TRACK_ID);
  await addReviewQueueItems([review()]);
  assert.throws(beforeReview, /Home learning sources changed/);

  const beforeAttempt = captureHomeShellReadFence(TRACK_ID);
  await addTrainingAttempt(attempt("fence-attempt", "session-1"));
  assert.throws(beforeAttempt, /Home learning sources changed/);
});

test("Home fence rejects terminal, active, and result-only session evidence writes", async () => {
  const terminalFence = captureHomeShellReadFence(TRACK_ID);
  await saveTrainingSession(session("completed", "completed-without-result"));
  assert.throws(terminalFence, /Home learning sources changed/);

  const resultFence = captureHomeShellReadFence(TRACK_ID);
  await saveTrainingSessionResult(createTrainingSessionResult({
    id: "result-only",
    sessionId: "completed-without-result",
    trackId: TRACK_ID,
    totalOccurrences: 1,
    answeredOccurrenceIds: [],
    unansweredOccurrenceIds: ["occurrence-1"],
    completedAt: timestamp,
    evidence: createFamilyEnvelope({ familyId: "future-family", details: { total: 1 } }),
  }));
  assert.throws(resultFence, /Home learning sources changed/);

  const activeFence = captureHomeShellReadFence(TRACK_ID);
  await saveTrainingSession(session("active", "new-active-session"));
  assert.throws(activeFence, /Home learning sources changed/);

  const activePointerFence = captureHomeShellReadFence(TRACK_ID);
  await clearActiveTrainingSession("new-active-session");
  // Clearing only the pointer leaves an indexed active session unreachable;
  // the canonical reader rejects that inconsistent state before the fence compares it.
  assert.throws(activePointerFence, /active-session pointer is inconsistent/);
});

test("Home fence observes selected-track changes, including from a null-track snapshot", async () => {
  const selectedFence = captureHomeShellReadFence(TRACK_ID);
  await clearActiveTrackId();
  assert.throws(selectedFence, /Home selected track changed/);

  const stillNullFence = captureHomeShellReadFence(null);
  assert.doesNotThrow(stillNullFence);
  const nullTrackFence = captureHomeShellReadFence(null);
  await saveActiveTrackId(TRACK_ID);
  assert.throws(nullTrackFence, /Home selected track changed/);
});

test("Home fence preserves onboarding fallback and ignores unrelated reminder settings", async () => {
  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  const beforeOnboardingDismissal = captureHomeShellReadFence(TRACK_ID);
  dismissGoalOnboarding(TRACK_ID);
  assert.throws(beforeOnboardingDismissal, /Home learning sources changed/);
  const preferenceKey = STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES;
  storage.setFailurePlan({ kind: "fail_on_key_read", key: preferenceKey });
  const optionalFallbackFence = captureHomeShellReadFence(TRACK_ID);
  assert.doesNotThrow(optionalFallbackFence, "the same optional onboarding read failure uses the same existing fallback");

  storage.setFailurePlan(null);
  const unrelatedPreferenceFence = captureHomeShellReadFence(TRACK_ID);
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.doesNotThrow(unrelatedPreferenceFence);
});

test("Home fence fails closed for active journals and corrupt canonical session indexes", async () => {
  const beforeJournal = captureHomeShellReadFence(TRACK_ID);
  await persistMutationJournal(journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]));
  assert.throws(beforeJournal, /materialized/);
  assert.throws(() => captureHomeShellReadFence(TRACK_ID), /materialized/);

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveActiveTrackId(TRACK_ID);
  const beforeCorruption = captureHomeShellReadFence(TRACK_ID);
  getKeyValueStorage().setString(STORAGE_KEYS.TRAINING_SESSION_INDEX, "{");
  assert.throws(beforeCorruption, /Corrupt|unsupported/i);
  assert.throws(() => captureHomeShellReadFence(TRACK_ID), /Corrupt|unsupported/i);
});
