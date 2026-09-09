import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  enableLearningPlanReminders,
  reconcileLearningPlanReminders,
  retryLearningPlanReminders,
  type LearningPlanReminderDependencies,
  type LearningPlanReminderPackage,
  type NotificationPlanIdentity,
  type NotificationPermission,
  type NotificationPlatform,
  type PracticeReminderCopy,
  type ScheduledReminderIdentity,
  type WeeklyReminderRequest,
} from "./notificationPreferences";
import {
  createDefaultGoal,
  createLearningPlanSlotId,
  type GoalSnapshot,
  type LearningPlan,
  type LearningPlanSnapshot,
} from "../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";
import { writeCanonicalJson } from "../storage/repositories/canonicalRecordCodec";
import {
  getDeviceReminderJournal,
  getDeviceReminderSettings,
  saveDeviceReminderSettings,
} from "../storage/repositories/notificationSettingsRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const COPY: PracticeReminderCopy = Object.freeze({ body: "A scheduled learning plan session.", title: "Scheduled session" });

class PlatformSpy implements NotificationPlatform {
  permission: NotificationPermission = "granted";
  permissionRequests = 0;
  scheduleFailure = false;
  readonly requests: WeeklyReminderRequest[] = [];
  readonly cancelled: string[] = [];
  readonly live = new Map<string, ScheduledReminderIdentity & { transactionId: string; slotId?: string }>();

  async cancelReminder(notificationId: string): Promise<void> {
    this.cancelled.push(notificationId);
    this.live.delete(notificationId);
  }

  async getPermission(): Promise<NotificationPermission> { return this.permission; }

  async requestPermission(): Promise<NotificationPermission> {
    this.permissionRequests += 1;
    return this.permission;
  }

  async listScheduledReminders(transactionId: string): Promise<readonly ScheduledReminderIdentity[]> {
    return [...this.live.values()].filter((entry) => entry.transactionId === transactionId).map(({ transactionId: _transactionId, ...entry }) => entry);
  }

  async scheduleWeeklyReminder(request: WeeklyReminderRequest): Promise<string> {
    if (this.scheduleFailure) throw new Error("scheduler failed");
    this.requests.push(request);
    const notificationId = `native-${this.requests.length}`;
    this.live.set(notificationId, { commandId: request.commandId, day: request.day, identity: request.identity, notificationId, slotId: request.slotId, transactionId: request.transactionId });
    return notificationId;
  }
}

function plan(overrides: Partial<LearningPlan> = {}): LearningPlan {
  return {
    schemaVersion: 1,
    planId: "plan:one",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "event", targetDate: null },
    createdAt: "2027-01-01T10:00:00.000Z",
    updatedAt: "2027-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:one",
    slots: [
      { slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:05", sessionLength: 10 },
      { slotId: createLearningPlanSlotId("slot:sat"), day: "sat", localTime: "09:30", sessionLength: 10 },
    ],
    ...overrides,
  };
}

function fixture(options: { plan?: LearningPlan | null; timezone?: string; permission?: NotificationPermission } = {}): Readonly<{
  dependencies: LearningPlanReminderDependencies;
  goal: GoalSnapshot;
  platform: PlatformSpy;
  setPlan(next: LearningPlan | null): void;
  setTimezone(next: string): void;
}> {
  let currentPlan = options.plan === undefined ? plan() : options.plan;
  let timezone = options.timezone ?? "Europe/Warsaw";
  const goal: GoalSnapshot = { record: createDefaultGoal(TRACK_ID), revision: 1 };
  const platform = new PlatformSpy();
  if (options.permission) platform.permission = options.permission;
  const packageResult: LearningPlanReminderPackage = { trackId: TRACK_ID, contentVersion: "content-v1", packagePin: TEST_CONTENT_PACKAGE_PIN };
  const dependencies: LearningPlanReminderDependencies = {
    getActiveTrackId: async () => TRACK_ID,
    getDeviceTimezone: () => timezone,
    getGoalSnapshot: async () => goal,
    getLearningPlanSnapshot: () => currentPlan ? ({ plan: currentPlan, revision: currentPlan.planRevision } satisfies LearningPlanSnapshot) : null,
    resolveExact: async () => packageResult,
  };
  return { dependencies, goal, platform, setPlan(next) { currentPlan = next; }, setTimezone(next) { timezone = next; } };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("explicit enable materializes only the exact accepted plan slots and full identity", async () => {
  const f = fixture();
  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "synced");
  assert.deepEqual(f.platform.requests.map((request) => ({ day: request.day, localTime: request.localTime, slotId: request.slotId })), [
    { day: "mon", localTime: "18:05", slotId: "slot:mon" },
    { day: "sat", localTime: "09:30", slotId: "slot:sat" },
  ]);
  assert.equal(f.platform.requests[0]?.commandId, "command:one");
  assert.equal(f.platform.requests[0]?.identity?.storageRevision, 1);
  assert.deepEqual(getDeviceReminderSettings()?.identity, {
    trackId: TRACK_ID,
    goalRevision: 1,
    planId: "plan:one",
    planRevision: 1,
    storageRevision: 1,
    commandId: "command:one",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
  });
});

test("reconcile never requests permission and returns permission_denied as pending", async () => {
  const f = fixture({ permission: "undetermined" });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const result = await reconcileLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "permission_denied");
  assert.equal(result.status, "pending");
  assert.equal(f.platform.permissionRequests, 0);
  assert.deepEqual(f.platform.requests, []);
});

test("explicit enable is the only path that requests permission and persists a denied retry", async () => {
  const f = fixture({ permission: "undetermined" });

  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "permission_denied");
  assert.equal(result.status, "pending");
  assert.equal(f.platform.permissionRequests, 1);
  assert.equal(getDeviceReminderSettings()?.pending?.reason, "permission_denied");
  assert.equal(getDeviceReminderJournal(), null);
});

test("permission pending retains existing native IDs for a later retry", async () => {
  const f = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await enableLearningPlanReminders(f.platform, COPY, f.dependencies)).kind, "synced");
  const existingIds = [...f.platform.live.keys()];

  f.platform.permission = "undetermined";
  const pending = await reconcileLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(pending.kind, "permission_denied");
  assert.deepEqual(getDeviceReminderSettings()?.legacyNotificationIds, existingIds);
  assert.deepEqual([...f.platform.live.keys()], existingIds);

  f.platform.permission = "granted";
  const retry = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(retry.kind, "synced");
  assert.deepEqual([...f.platform.live.keys()], existingIds);
});

test("timezone mismatch clears durable and native schedules without publishing", async () => {
  const f = fixture({ timezone: "America/New_York" });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: ["legacy-native"], pending: null }, null);

  const result = await reconcileLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "timezone_mismatch");
  assert.equal(result.status, "cleared");
  assert.deepEqual(f.platform.cancelled, ["legacy-native"]);
  assert.deepEqual(getDeviceReminderSettings()?.schedules, []);
});

test("source absence and terminal plan states are separate closed outcomes", async () => {
  const missing = fixture({ plan: null });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(missing.platform, COPY, missing.dependencies)).kind, "missing_plan");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const paused = fixture({ plan: plan({ status: "paused" }) });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(paused.platform, COPY, paused.dependencies)).kind, "plan_paused");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const completed = fixture({ plan: plan({ status: "completed" }) });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(completed.platform, COPY, completed.dependencies)).kind, "plan_completed");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const missingTrack = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(missingTrack.platform, COPY, { ...missingTrack.dependencies, getActiveTrackId: async () => null })).kind, "missing_track");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const missingGoal = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(missingGoal.platform, COPY, { ...missingGoal.dependencies, getGoalSnapshot: async () => null })).kind, "missing_goal");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const noSlots = fixture({ plan: plan({ slots: [] }) });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await reconcileLearningPlanReminders(noSlots.platform, COPY, noSlots.dependencies)).kind, "no_slots");
});

test("a paused goal is a separate closed outcome and clears native schedules", async () => {
  const f = fixture();
  const pausedGoal: GoalSnapshot = { ...f.goal, record: { ...f.goal.record, status: "paused" } };
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: ["old-goal-reminder"], pending: null }, null);

  const result = await reconcileLearningPlanReminders(f.platform, COPY, {
    ...f.dependencies,
    getGoalSnapshot: async () => pausedGoal,
  });

  assert.equal(result.kind, "goal_paused");
  assert.equal(result.status, "cleared");
  assert.deepEqual(f.platform.cancelled, ["old-goal-reminder"]);
  assert.equal(getDeviceReminderSettings()?.pending, null);
});

test("an expected identity from another active track stays pending and is persisted for retry", async () => {
  const f = fixture();
  const expected: NotificationPlanIdentity = {
    trackId: "google-cloud-associate-cloud-engineer",
    goalRevision: 1,
    planId: "plan:other-track",
    planRevision: 2,
    storageRevision: 9,
    commandId: "command:other-track",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
  };

  const result = await reconcileLearningPlanReminders(f.platform, COPY, expected, f.dependencies);

  assert.equal(result.kind, "concurrent_change");
  assert.equal(result.status, "pending");
  assert.deepEqual(getDeviceReminderSettings()?.pending?.expectedIdentity, expected);
  assert.deepEqual(f.platform.requests, []);
  const retry = await retryLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(retry.kind, "concurrent_change");
  assert.deepEqual(getDeviceReminderSettings()?.pending?.expectedIdentity, expected);
});

test("full source identity mismatch is fail-closed before scheduling", async () => {
  const f = fixture();
  const mismatchedPin = { ...TEST_CONTENT_PACKAGE_PIN, contentReleaseId: "different-release" };
  const dependencies: LearningPlanReminderDependencies = {
    ...f.dependencies,
    resolveExact: async () => ({ trackId: TRACK_ID, contentVersion: "content-v1", packagePin: mismatchedPin }),
  };
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const result = await reconcileLearningPlanReminders(f.platform, COPY, dependencies);

  assert.equal(result.kind, "identity_mismatch");
  assert.deepEqual(f.platform.requests, []);
});

test("legacy cancellation-only journal is cancelled before the current plan is scheduled", async () => {
  const f = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    version: 2,
    created: [{ day: "mon", time: { hour: 8, minute: 0 }, notificationId: "old-native" }],
    desired: { mode: "same-time", commonTime: { hour: 8, minute: 0 }, days: [{ day: "mon", time: { hour: 8, minute: 0 } }], trackId: TRACK_ID },
    remainingOldIds: [],
    transactionId: "old-transaction",
  });

  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "synced");
  assert.deepEqual(f.platform.cancelled, ["old-native"]);
  assert.deepEqual(f.platform.requests.map((request) => request.slotId), ["slot:mon", "slot:sat"]);
  assert.equal(getDeviceReminderJournal(), null);
});

test("journal-created slots are trusted only when the discovered native identity and day match", async () => {
  const f = fixture();
  const identity: NotificationPlanIdentity = {
    trackId: TRACK_ID,
    goalRevision: 1,
    planId: "plan:one",
    planRevision: 1,
    storageRevision: 1,
    commandId: "command:one",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
  };
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    schemaVersion: 1,
    transactionId: "learning-plan-reminder:command:one",
    commandId: "command:one",
    expectedIdentity: identity,
    enabled: true,
    slots: [
      { slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:05" },
      { slotId: createLearningPlanSlotId("slot:sat"), day: "sat", localTime: "09:30" },
    ],
    created: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:05", notificationId: "foreign-native" }],
    remainingOldIds: [],
  });
  f.platform.live.set("foreign-native", {
    commandId: "command:one",
    day: "tue",
    identity,
    notificationId: "foreign-native",
    slotId: "slot:mon",
    transactionId: "learning-plan-reminder:command:one",
  });

  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "synced");
  assert.deepEqual(f.platform.cancelled, ["foreign-native"]);
  assert.deepEqual(f.platform.requests.map((request) => request.slotId), ["slot:mon", "slot:sat"]);
});

test("post-read plan change is concurrent_change and leaves a retryable journal", async () => {
  const f = fixture();
  let reads = 0;
  const changed = plan({ planRevision: 2, commandId: "command:two", updatedAt: "2027-01-02T10:00:00.000Z" });
  const dependencies: LearningPlanReminderDependencies = {
    ...f.dependencies,
    getLearningPlanSnapshot: () => {
      reads += 1;
      const current = reads === 1 ? plan() : changed;
      return { plan: current, revision: current.planRevision };
    },
  };
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const result = await enableLearningPlanReminders(f.platform, COPY, dependencies);

  assert.equal(result.kind, "concurrent_change");
  assert.equal(result.status, "pending");
  assert.equal(getDeviceReminderJournal()?.commandId, "command:one");
  assert.equal(getDeviceReminderSettings()?.pending?.reason, "concurrent_change");
});

test("post-read device timezone change is concurrent_change and does not publish", async () => {
  const f = fixture();
  let reads = 0;
  const dependencies: LearningPlanReminderDependencies = {
    ...f.dependencies,
    getDeviceTimezone: () => {
      reads += 1;
      return reads === 1 ? "Europe/Warsaw" : "America/New_York";
    },
  };
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const result = await enableLearningPlanReminders(f.platform, COPY, dependencies);

  assert.equal(result.kind, "concurrent_change");
  assert.equal(result.status, "pending");
  assert.equal(getDeviceReminderSettings()?.pending?.reason, "concurrent_change");
  assert.equal(getDeviceReminderJournal()?.commandId, "command:one");
});

test("scheduler failure is pending and never reports synced", async () => {
  const f = fixture();
  f.platform.scheduleFailure = true;
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "scheduler_failure");
  assert.equal(result.status, "pending");
  assert.notEqual(result.kind, "synced");
  assert.equal(getDeviceReminderJournal()?.commandId, "command:one");
});

test("serialized duplicate enables schedule each accepted slot only once", async () => {
  const f = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const results = await Promise.all([
    enableLearningPlanReminders(f.platform, COPY, f.dependencies),
    enableLearningPlanReminders(f.platform, COPY, f.dependencies),
  ]);

  assert.deepEqual(results.map((result) => result.kind), ["synced", "synced"]);
  assert.deepEqual(f.platform.requests.map((request) => request.slotId), ["slot:mon", "slot:sat"]);
});

test("retry resumes a durable journal after scheduler failure", async () => {
  const f = fixture();
  f.platform.scheduleFailure = true;
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);

  const first = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(first.kind, "scheduler_failure");
  assert.ok(getDeviceReminderJournal());

  f.platform.scheduleFailure = false;
  const second = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(second.kind, "synced");
  assert.equal(getDeviceReminderJournal(), null);
  assert.equal(getDeviceReminderSettings()?.pending, null);
});

test("retry reuses a native schedule when journal persistence failed after scheduling", async () => {
  const f = fixture();
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, occurrence: 2 });

  const first = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(first.kind, "scheduler_failure");
  assert.equal(f.platform.requests.length, 1);
  assert.ok(getDeviceReminderJournal());

  storage.setFailurePlan(null);
  const second = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);
  assert.equal(second.kind, "synced");
  assert.equal(f.platform.requests.length, 2);
  assert.deepEqual(f.platform.requests.map((request) => request.slotId), ["slot:mon", "slot:sat"]);
  assert.equal(getDeviceReminderJournal(), null);
});

test("a newer accepted plan replaces schedules and cancels the previous native IDs", async () => {
  const f = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  assert.equal((await enableLearningPlanReminders(f.platform, COPY, f.dependencies)).kind, "synced");
  const previousIds = [...f.platform.live.keys()];

  f.setPlan(plan({ planRevision: 2, commandId: "command:two", slots: [{ slotId: createLearningPlanSlotId("slot:tue"), day: "tue", localTime: "19:45", sessionLength: 10 }] }));
  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "synced");
  assert.deepEqual(f.platform.cancelled, previousIds);
  assert.deepEqual(f.platform.requests.map((request) => request.slotId), ["slot:mon", "slot:sat", "slot:tue"]);
  assert.equal(getDeviceReminderSettings()?.identity?.planRevision, 2);
});

test("corrupt durable journal becomes scheduler_failure instead of publishing", async () => {
  const f = fixture();
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, null);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, { corrupt: true });

  const result = await enableLearningPlanReminders(f.platform, COPY, f.dependencies);

  assert.equal(result.kind, "scheduler_failure");
  assert.equal(result.status, "pending");
  assert.deepEqual(f.platform.requests, []);
});
