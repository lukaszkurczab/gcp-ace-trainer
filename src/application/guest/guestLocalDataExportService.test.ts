import assert from "node:assert/strict";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import test from "node:test";

import { closeActiveProfileStorage, activatePreparedProfile, prepareProfileStorage, setProfileStoragePreparationFactoryForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { foregroundTimerPhysicalKey, openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { CANONICAL_RECORD_SCHEMA } from "../../storage/repositories/canonicalRecordCodec";
import { STORAGE_KEYS } from "../../storage/keys";
import { createDefaultGoal, createFamilyEnvelope, createForegroundTimerState, createLearningPlanSlotId, createTrainingSession, createTrainingSessionDraft, createTrainingSessionResult } from "../../domain";
import { saveSettings } from "../../storage/repositories/settingsRepository";
import { saveDeviceReminderSettings } from "../../storage/repositories/notificationSettingsRepository";
import { dismissGoalOnboarding } from "../../storage/repositories/goalOnboardingPreferenceRepository";
import { saveGoalSnapshot } from "../../storage/repositories/goalRepository";
import { saveLearningPlanAtomically } from "../../storage/repositories/learningPlanRepository";
import { upsertContentReportOutboxEntry } from "../../storage/repositories/contentReportOutboxRepository";
import { saveActiveForegroundTimer } from "../../storage/repositories/foregroundTimerRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { saveTrainingSessionDraft } from "../../storage/repositories/trainingSessionDraftRepository";
import {
  createContentIdentityArchivalHistoryRecord,
  createContentIdentityUnavailableActiveRecord,
  createContentIdentityUnavailableReviewRecord,
  saveArchivalHistoryRecord,
  saveUnavailableActiveRecord,
  saveUnavailableReviewRecord,
} from "../../storage/repositories/contentIdentityUnavailableRepository";
import {
  cleanupOrphanedGuestLocalDataExports,
  exportGuestLocalData,
  GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX,
} from "./guestLocalDataExportService";
import type { ProfileExportFile, ProfileExportFileStore } from "../account/profileExportFileStore";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";


const INSTALLATION_ID = "11111111-1111-4111-8111-111111111111";
const MARKER_DATASET_ID = "22222222-2222-4222-8222-222222222222";
const ROUTER_PROFILE_ID = "33333333-3333-4333-8333-333333333333";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

function envelope(payload: unknown, revision = 1): string {
  return JSON.stringify({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision, payload });
}

function scopedKey(profileId: string, key: string): string {
  return `patternly:profile:v1:${profileId}:${encodeURIComponent(key)}`;
}

async function activateGuest(markerDatasetId: string) {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const router = await openProfileStorageRouter(base, control, {
    identity: { async create() { return { installationId: INSTALLATION_ID, localDatasetId: ROUTER_PROFILE_ID }; } },
  });
  const profile = router.profile;
  await router.selectExistingGuest(profile.id);
  if (markerDatasetId !== profile.id) base.setString(scopedKey(profile.id, STORAGE_KEYS.GUEST_INSTALLATION), envelope({ installationId: INSTALLATION_ID, localDatasetId: markerDatasetId, bindingState: "guest", accountId: null }, 4));
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router, foregroundTimerCasForTests: (before, after) => base.applyForegroundTimerRaw(before, after, foregroundTimerPhysicalKey(profile.id)) }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  return { base, profile };
}

function fileStore(onWrite?: () => void, options: Readonly<{ failWrite?: boolean; failDelete?: boolean }> = {}) {
  let contents = "";
  let exists = false;
  let created = 0;
  let deleted = 0;
  const file: ProfileExportFile = {
    name: "guest-export.json",
    uri: "file:///cache/guest-export.json",
    write(value) { contents = value; exists = true; onWrite?.(); if (options.failWrite) throw new Error("write failed"); },
    exists: () => exists,
    delete() { if (options.failDelete) throw new Error("delete failed"); deleted += 1; exists = false; },
  };
  const store: ProfileExportFileStore = {
    createCacheFile(name) { created += 1; return { ...file, name }; },
    listCacheFiles: () => [file],
  };
  return { store, file, get contents() { return contents; }, get created() { return created; }, get deleted() { return deleted; } };
}

function dependencies(files: ProfileExportFileStore, share: () => Promise<"sharedAction" | "dismissedAction">) {
  return { files, share, createExportId: () => "guest-export-12345678", now: () => new Date("2026-10-09T12:00:00.000Z") };
}

test("exports only the active current Guest profile without exposing its identifiers", async () => {
  closeActiveProfileStorage();
  const { base, profile } = await activateGuest(ROUTER_PROFILE_ID);
  try {
    const before = base.snapshot();
    const files = fileStore();
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "dismissedAction"; }));
    assert.deepEqual(result, { kind: "handoff", disposition: "dismissed" });
    assert.equal(shares, 1);
    assert.equal(files.created, 1);
    assert.equal(files.deleted, 1);
    assert.deepEqual(base.snapshot(), before, "the export reads but does not mutate the selected profile");
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.equal(document.schemaVersion, "patternly-local-guest-export-v1");
    assert.deepEqual(document.profile, { kind: "local_guest" });
    assert.equal(document.learning.activeSessionId, null);
    assert.ok(document.manifest.included.includes("sessions and saved draft"));
    assert.ok(document.manifest.omitted.some((entry: { category: string }) => entry.category === "report delivery identifiers and transport state"));
    assert.equal(JSON.stringify(document).includes(INSTALLATION_ID), false);
    assert.equal(JSON.stringify(document).includes(profile.id), false);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("rejects a modern Guest marker whose dataset ID does not match its profile before file creation", async () => {
  closeActiveProfileStorage();
  await activateGuest(MARKER_DATASET_ID);
  try {
    const files = fileStore();
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "guestProfileUnavailable" });
    assert.equal(files.created, 0);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("exports an empty new Guest profile with explicit empty categories", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const files = fileStore();
    const result = await exportGuestLocalData(dependencies(files.store, async () => "dismissedAction"));
    assert.deepEqual(result, { kind: "handoff", disposition: "dismissed" });
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.equal(document.activeTrackId, null);
    assert.deepEqual(document.settings, { application: null, goalOnboardingDismissedTrackIds: null, reminders: null });
    assert.deepEqual(document.learning, {
      sessions: [], activeSessionId: null, activeSessionDraft: null, foregroundTimer: null,
      attempts: [], results: [], reviews: [], goals: [], acceptedPlans: [],
      retainedContentHistory: { archivalSessions: [], unavailableActiveSessions: [], unavailableReviews: [] },
    });
    assert.deepEqual(document.userReports, []);
    assert.ok(document.manifest.included.length > 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

function retainedHistoryRecords(suffix: string) {
  const trackId = "coding-interview-dsa-problem-solving";
  const tombstone = (kind: string, id: string) => ({ kind, trackId, questionId: "retained-question", contentVersion: "old-content", reason: "unknown_artifact_hash", ...(kind === "unavailable_review" ? { reviewId: id } : { sessionId: id }) });
  return {
    archival: createContentIdentityArchivalHistoryRecord({ schemaVersion: 1, kind: "archival_history", sessionId: `archive-${suffix}`, session: { id: `archive-${suffix}`, trackId, status: "completed", completedAt: "2026-10-09T11:00:00.000Z", itemOrder: [{ occurrenceId: `archive-occurrence-${suffix}`, item: tombstone("archival_history", `archive-${suffix}`) }] }, attempts: [], results: [] }),
    active: createContentIdentityUnavailableActiveRecord({ schemaVersion: 1, kind: "unavailable_active", sessionId: `unavailable-${suffix}`, session: { id: `unavailable-${suffix}`, trackId, status: "active", startedAt: "2026-10-09T11:00:00.000Z", itemOrder: [{ occurrenceId: `active-occurrence-${suffix}`, item: tombstone("unavailable_active", `unavailable-${suffix}`) }] }, attempts: [], results: [] }),
    review: createContentIdentityUnavailableReviewRecord({ schemaVersion: 1, kind: "unavailable_review", reviewId: `review-${suffix}`, review: { id: `review-${suffix}`, trackId, sourceAttemptId: `attempt-${suffix}`, sourceSessionId: `session-${suffix}`, sourceItem: tombstone("unavailable_review", `review-${suffix}`), reasons: ["incorrect"], dueAt: "2026-10-10T11:00:00.000Z", createdAt: "2026-10-09T11:00:00.000Z", persistent: true } }),
  };
}

test("exports all validated retained history families and describes unavailable question text", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const records = retainedHistoryRecords("export");
    await saveArchivalHistoryRecord(records.archival);
    await saveUnavailableActiveRecord(records.active);
    await saveUnavailableReviewRecord(records.review);
    const files = fileStore();
    assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => "sharedAction")), { kind: "handoff", disposition: "shared" });
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.deepEqual(document.learning.retainedContentHistory, {
      archivalSessions: [records.archival], unavailableActiveSessions: [records.active], unavailableReviews: [records.review],
    });
    assert.ok(document.manifest.included.includes("retained history whose original question content is unavailable"));
    assert.ok(document.manifest.omitted.some((entry: { category: string }) => entry.category === "unavailable question content"));
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("changed retained history during file writing prevents sharing and removes the file", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const records = retainedHistoryRecords("changed");
    await saveUnavailableReviewRecord(records.review);
    const files = fileStore(() => writeCanonicalJson(STORAGE_KEYS.unavailableReview("review-changed"), { ...records.review, review: { ...records.review.review, dueAt: "2026-10-11T11:00:00.000Z" } }));
    let shares = 0;
    assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; })), { kind: "failure", failure: "sourceChanged" });
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});
test("includes user settings, reminder preferences, and report text without transport metadata", async () => {
  closeActiveProfileStorage();
  const { base } = await activateGuest(ROUTER_PROFILE_ID);
  try {
    await saveSettings({ appearance: "dark", language: "pl" });
    saveDeviceReminderSettings({ schemaVersion: 1, enabled: false, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
    upsertContentReportOutboxEntry({
      input: {
        clientSubmissionId: "private-transport-id",
        trackId: "coding-interview-dsa-problem-solving",
        contentVersion: "content-v1",
        itemId: "question-1",
        reason: "incorrect_answer",
        description: "The explanation describes the wrong boundary condition.",
        context: {
          releasePackageId: "private-release-id",
          trackNode: "arrays",
          modeRoute: "answer_review",
          locale: "en",
          appBuild: "private-build",
          platform: "ios",
          occurredAt: "2026-10-09T11:00:00.000Z",
        },
        linkAccount: true,
        contactEmail: "learner@example.test",
      },
      status: "retrying",
      attemptCount: 4,
      createdAt: "2026-10-09T11:00:00.000Z",
      updatedAt: "2026-10-09T11:01:00.000Z",
      lastErrorCode: "private-transport-error",
    });
    const before = base.snapshot();
    const files = fileStore();
    assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => "sharedAction")), { kind: "handoff", disposition: "shared" });
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.deepEqual(document.settings.application, { appearance: "dark", language: "pl" });
    assert.deepEqual(document.settings.reminders, { kind: "device", enabled: false, schedules: [], pending: null });
    assert.equal(document.userReports.length, 1);
    assert.equal(document.userReports[0].description, "The explanation describes the wrong boundary condition.");
    assert.equal(document.userReports[0].contactEmail, "learner@example.test");
    assert.equal(document.userReports[0].context.trackNode, "arrays");
    const exported = JSON.stringify(document);
    for (const omitted of ["private-transport-id", "private-release-id", "private-build", "private-transport-error", "attemptCount", "linkAccount"]) {
      assert.equal(exported.includes(omitted), false, `export must omit ${omitted}`);
    }
    assert.deepEqual(base.snapshot(), before, "export preserves every source record");
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("includes goal onboarding preferences and their explicit manifest category", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    dismissGoalOnboarding("coding-interview-dsa-problem-solving");
    const files = fileStore();
    assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => "sharedAction")), { kind: "handoff", disposition: "shared" });
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.deepEqual(document.settings.goalOnboardingDismissedTrackIds, ["coding-interview-dsa-problem-solving"]);
    assert.ok(document.manifest.included.includes("app and goal onboarding preferences"));
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("exports the active session, persisted draft, and canonical foreground checkpoint", async () => {
  closeActiveProfileStorage();
  const { base } = await activateGuest(ROUTER_PROFILE_ID);
  try {
    const trackId = "coding-interview-dsa-problem-solving" as const;
    const session = createTrainingSession({
      id: "guest-export-active-session",
      trackId,
      modeId: "coding-interview-simulation",
      configurationSnapshot: {
        answerChanges: "untilFinalSubmission",
        feedbackMode: "atSessionEnd",
        kind: "coding_interview",
        submission: "manualOrForegroundTimeout",
        timer: "countdownForeground",
      },
      requestedLength: 1,
      actualLength: 1,
      currentItemIndex: 0,
      itemOrder: [{ occurrenceId: "guest-export-occurrence", item: { trackId, contentVersion: "content-v1", artifactSha256: "a".repeat(64), questionId: "question-1" } }],
      optionOrderByOccurrence: {},
      activeForegroundMs: 1_234,
      contentVersion: "content-v1",
      artifactSha256: "a".repeat(64),
      status: "active",
      startedAt: "2026-10-09T11:00:00.000Z",
    });
    await saveTrainingSession(session, productionTrackAdmissionContext);
    const draft = createTrainingSessionDraft({
      sessionId: session.id,
      trackId,
      responsesByOccurrenceId: { "guest-export-occurrence": { selectedOptionIds: ["option-a"] } },
      updatedAt: "2026-10-09T11:01:00.000Z",
    });
    await saveTrainingSessionDraft(draft, null, productionTrackAdmissionContext);
    await saveActiveForegroundTimer(createForegroundTimerState({
      schemaVersion: 1,
      timerVersion: 1,
      familyId: "coding_interview",
      sessionId: session.id,
      trackId,
      accumulatedForegroundMs: 1_234,
      checkpointRevision: 1,
      lastCheckpointAt: "2026-10-09T11:01:00.000Z",
      running: true,
    }), null, productionTrackAdmissionContext);

    const before = base.snapshot();
    const files = fileStore();
    const result = await exportGuestLocalData(dependencies(files.store, async () => "sharedAction"));
    assert.deepEqual(result, { kind: "handoff", disposition: "shared" });
    const document = JSON.parse(files.contents) as Record<string, any>;
    assert.equal(document.learning.activeSessionId, session.id);
    assert.deepEqual(document.learning.sessions, [session]);
    assert.deepEqual(document.learning.activeSessionDraft, draft);
    assert.equal(document.learning.foregroundTimer.sessionId, session.id);
    assert.equal(document.learning.foregroundTimer.accumulatedForegroundMs, 1_234);
    assert.deepEqual(base.snapshot(), before, "exporting the active checkpoint does not advance or clear it");
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("removes the temporary export and refuses sharing if the profile lease changes during file writing", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const files = fileStore(() => closeActiveProfileStorage());
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "sourceChanged" });
    assert.equal(files.created, 1);
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("removes the temporary export when included user data changes during file writing", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const files = fileStore(() => { void saveSettings({ appearance: "dark", language: "pl" }); });
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "sourceChanged" });
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("removes the temporary export when the Guest marker is rebound during file writing", async () => {
  closeActiveProfileStorage();
  const { base, profile } = await activateGuest(ROUTER_PROFILE_ID);
  try {
    const files = fileStore(() => base.setString(scopedKey(profile.id, STORAGE_KEYS.GUEST_INSTALLATION), envelope({
      installationId: "44444444-4444-4444-8444-444444444444",
      localDatasetId: MARKER_DATASET_ID,
      bindingState: "guest",
      accountId: null,
    }, 5)));
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "guestProfileUnavailable" });
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("fails closed when an unsupported reminder journal appears during file writing", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const files = fileStore(() => writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
      created: [], desired: null, remainingOldIds: [], transactionId: "legacy-pending-reminder",
    }));
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "sourceChanged" });
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("fails closed when an accepted plan no longer matches its goal during file writing", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const trackId = "coding-interview-dsa-problem-solving" as const;
    const goal = createDefaultGoal(requireGoalPolicy(trackId));
    await saveGoalSnapshot(goal, null, requireGoalPolicy(goal.trackId));
    saveLearningPlanAtomically({ policy: requireGoalPolicy({
        schemaVersion: 1,
        planId: "guest-export-plan",
        trackId,
        goalRevision: 1,
        status: "accepted",
        timezone: "Europe/Warsaw",
        contentVersion: "content-v1",
        artifactSha256: "a".repeat(64),
        acceptedTarget: { meaning: "event", targetDate: null },
        createdAt: "2026-10-09T11:00:00.000Z",
        updatedAt: "2026-10-09T11:00:00.000Z",
        planRevision: 1,
        commandId: "guest-export-plan-command",
        slots: [{ slotId: createLearningPlanSlotId("guest-export-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
      }.trackId),
      plan: {
        schemaVersion: 1,
        planId: "guest-export-plan",
        trackId,
        goalRevision: 1,
        status: "accepted",
        timezone: "Europe/Warsaw",
        contentVersion: "content-v1",
        artifactSha256: "a".repeat(64),
        acceptedTarget: { meaning: "event", targetDate: null },
        createdAt: "2026-10-09T11:00:00.000Z",
        updatedAt: "2026-10-09T11:00:00.000Z",
        planRevision: 1,
        commandId: "guest-export-plan-command",
        slots: [{ slotId: createLearningPlanSlotId("guest-export-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
      },
      expectedGoalRevision: 1,
      expectedPlanStorageRevision: null,
    });
    const files = fileStore(() => writeCanonicalJson(STORAGE_KEYS.goal(trackId), { ...goal, status: "paused" }));
    let shares = 0;
    const result = await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; }));
    assert.deepEqual(result, { kind: "failure", failure: "sourceInvalid" });
    assert.equal(files.deleted, 1);
    assert.equal(shares, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("fails closed when a completed session has no persisted result", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const trackId = "coding-interview-dsa-problem-solving" as const;
    await saveTrainingSession(createTrainingSession({
      id: "guest-export-completed-without-result",
      trackId,
      modeId: "coding-interview-simulation",
      configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" },
      requestedLength: 1,
      actualLength: 1,
      currentItemIndex: 0,
      itemOrder: [{ occurrenceId: "guest-export-completed-occurrence", item: { trackId, contentVersion: "content-v1", artifactSha256: "a".repeat(64), questionId: "question-1" } }],
      optionOrderByOccurrence: {},
      activeForegroundMs: 1_234,
      contentVersion: "content-v1",
      artifactSha256: "a".repeat(64),
      status: "completed",
      startedAt: "2026-10-09T11:00:00.000Z",
      completedAt: "2026-10-09T11:01:00.000Z",
    }), productionTrackAdmissionContext);
    const files = fileStore();
    const result = await exportGuestLocalData(dependencies(files.store, async () => "sharedAction"));
    assert.deepEqual(result, { kind: "failure", failure: "sourceInvalid" });
    assert.equal(files.created, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("fails closed on corrupt canonical data without creating a file", async () => {
  closeActiveProfileStorage();
  const { base } = await activateGuest(ROUTER_PROFILE_ID);
  try {
  base.setString(scopedKey(ROUTER_PROFILE_ID, STORAGE_KEYS.TRAINING_SESSION_INDEX), "not-json");
    const files = fileStore();
    const result = await exportGuestLocalData(dependencies(files.store, async () => "sharedAction"));
    assert.deepEqual(result, { kind: "failure", failure: "sourceInvalid" });
    assert.equal(files.created, 0);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("orphan results fail the full evidence gate before file creation and remain unchanged on repeat", async () => {
  closeActiveProfileStorage();
  const { base } = await activateGuest(ROUTER_PROFILE_ID);
  try {
    const trackId = "coding-interview-dsa-problem-solving" as const;
    const orphan = createTrainingSessionResult({
      id: "orphan-result", sessionId: "orphan-result", trackId, totalOccurrences: 1,
      answeredOccurrenceIds: [], unansweredOccurrenceIds: ["occurrence-1"], completedAt: "2026-10-09T11:01:00.000Z",
      evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { total: 1 } }),
    });
    writeCanonicalJson(STORAGE_KEYS.trainingSessionResult("orphan-result"), orphan);
    const before = base.snapshot();
    const files = fileStore();
    let shares = 0;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; })), { kind: "failure", failure: "sourceInvalid" });
    }
    assert.equal(files.created, 0);
    assert.equal(shares, 0);
    assert.deepEqual(base.snapshot(), before);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("corrupt attempt, review, archive, and unavailable indexes fail before file creation with unchanged bytes", async () => {
  const corruptibleKeys = [
    STORAGE_KEYS.TRAINING_SESSION_INDEX,
    STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
    STORAGE_KEYS.REVIEW_INDEX,
    STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX,
    STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX,
    STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX,
  ];
  for (const key of corruptibleKeys) {
    closeActiveProfileStorage();
    const { base } = await activateGuest(ROUTER_PROFILE_ID);
    try {
      base.setString(scopedKey(ROUTER_PROFILE_ID, key), "not-json");
      const before = base.snapshot();
      const files = fileStore();
      let shares = 0;
      assert.deepEqual(await exportGuestLocalData(dependencies(files.store, async () => { shares += 1; return "sharedAction"; })), { kind: "failure", failure: "sourceInvalid" }, key);
      assert.equal(files.created, 0, key);
      assert.equal(shares, 0, key);
      assert.deepEqual(base.snapshot(), before, key);
    } finally {
      closeActiveProfileStorage();
      setProfileStoragePreparationFactoryForTests(null);
    }
  }
});

test("reports file, share, and cleanup failures and removes temporary data whenever possible", async () => {
  closeActiveProfileStorage();
  await activateGuest(ROUTER_PROFILE_ID);
  try {
    const writeFailureFiles = fileStore(undefined, { failWrite: true });
    assert.deepEqual(await exportGuestLocalData(dependencies(writeFailureFiles.store, async () => "sharedAction")), { kind: "failure", failure: "fileFailure" });
    assert.equal(writeFailureFiles.deleted, 1);

    const shareFailureFiles = fileStore();
    assert.deepEqual(await exportGuestLocalData(dependencies(shareFailureFiles.store, async () => { throw new Error("share failed"); })), { kind: "failure", failure: "sharingFailed" });
    assert.equal(shareFailureFiles.deleted, 1);

    const cleanupFailureFiles = fileStore(undefined, { failDelete: true });
    assert.deepEqual(await exportGuestLocalData(dependencies(cleanupFailureFiles.store, async () => "dismissedAction")), { kind: "failure", failure: "cleanupFailed" });
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("orphan cleanup deletes only Guest export files for the selected profile", () => {
  const deleted: string[] = [];
  const file = (name: string): ProfileExportFile => ({ name, uri: `file:///cache/${name}`, exists: () => true, write: () => undefined, delete: () => { deleted.push(name); } });
  cleanupOrphanedGuestLocalDataExports({ listCacheFiles: () => [
    file(`${GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX}${ROUTER_PROFILE_ID}-old.json`),
    file(`${GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX}${MARKER_DATASET_ID}-other.json`),
    file("unrelated.json"),
  ] }, { id: ROUTER_PROFILE_ID, kind: "guest", accountId: null });
  assert.deepEqual(deleted, [`${GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX}${ROUTER_PROFILE_ID}-old.json`]);
});
