import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  InvalidPracticeReminderDraftError,
  NotificationPermissionDeniedError,
  disablePracticeReminder,
  formatDailyReminderTime,
  loadNotificationPreferences,
  parseDailyReminderTime,
  reconcilePracticeReminder,
  requestNotificationPermission,
  savePracticeReminder,
  type DailyReminderTime,
  type NotificationPermission,
  type NotificationPlatform,
  type PracticeReminderDraft,
  type ScheduledReminderIdentity,
  type WeeklyReminderRequest,
} from "../application/notificationPreferences";
import { BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, createDefaultGoal, CODING_INTERVIEW_TRACK_ID, type GoalDay } from "../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "../storage/repositories/canonicalRecordCodec";
import { clearActiveTrackId, saveActiveTrackId } from "../storage/repositories/activeTrackRepository";
import { saveGoal } from "../storage/repositories/goalRepository";
import {
  PRACTICE_REMINDER_JOURNAL_VERSION,
  getPracticeReminderJournal,
  getStoredNotificationSettings,
  isCanonicalPracticeReminder,
  type PracticeReminderJournal,
} from "../storage/repositories/notificationSettingsRepository";
import { UnsupportedStoredRecordError } from "../storage/errors";

class NotificationPlatformSpy implements NotificationPlatform {
  permission: NotificationPermission = "undetermined";
  permissionRequests = 0;
  readonly cancelled: string[] = [];
  readonly scheduled: WeeklyReminderRequest[] = [];
  readonly live = new Map<string, ScheduledReminderIdentity & { time: DailyReminderTime; transactionId: string }>();
  cancelFailureId: string | null = null;
  scheduleFailureDay: GoalDay | null = null;

  async cancelReminder(notificationId: string): Promise<void> {
    if (this.cancelFailureId === notificationId) throw new Error("cancel failed");
    this.cancelled.push(notificationId);
    this.live.delete(notificationId);
  }

  async getPermission(): Promise<NotificationPermission> { return this.permission; }
  async requestPermission(): Promise<NotificationPermission> { this.permissionRequests += 1; return this.permission; }
  async listScheduledReminders(transactionId: string): Promise<readonly ScheduledReminderIdentity[]> {
    return [...this.live.values()].filter((entry) => entry.transactionId === transactionId).map(({ day, notificationId }) => ({ day, notificationId }));
  }

  async scheduleWeeklyReminder(request: WeeklyReminderRequest): Promise<string> {
    if (this.scheduleFailureDay === request.day) throw new Error("schedule failed");
    this.scheduled.push(request);
    const notificationId = `notification-${this.scheduled.length}`;
    this.live.set(notificationId, { day: request.day, notificationId, time: request.time, transactionId: request.transactionId });
    return notificationId;
  }

  addLive(entry: ScheduledReminderIdentity & { time: DailyReminderTime; transactionId: string }): void {
    this.live.set(entry.notificationId, entry);
  }
}

const copy = { body: "Choose one focused Patternly practice session.", title: "Time to practise" } as const;
const defaultDays = ["mon", "wed", "sat"] as const;

function time(hour: number, minute = 0): DailyReminderTime {
  return { hour, minute };
}

function sameTimeDraft(commonTime: DailyReminderTime, days: readonly GoalDay[] = defaultDays): PracticeReminderDraft {
  return {
    mode: "same-time",
    commonTime,
    days: days.map((day) => ({ day, time: commonTime })),
  };
}

function byDayDraft(days: readonly { day: GoalDay; time: DailyReminderTime }[]): PracticeReminderDraft {
  return { mode: "by-day", commonTime: null, days };
}

function oldPracticeSettings(hour = 9, minute = 15) {
  return {
    practiceReminder: {
      hour,
      minute,
      schedules: [
        { day: "sat", notificationId: "legacy-sat" },
        { day: "mon", notificationId: "legacy-mon" },
        { day: "wed", notificationId: "legacy-wed" },
      ],
      trackId: CODING_INTERVIEW_TRACK_ID,
      transactionId: "legacy-024-settings",
    },
  } as const;
}

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveActiveTrackId(CODING_INTERVIEW_TRACK_ID);
  await saveGoal(createDefaultGoal(CODING_INTERVIEW_TRACK_ID));
});

test("reminder time accepts only strict 24-hour input", () => {
  assert.deepEqual(parseDailyReminderTime("05:07"), { hour: 5, minute: 7 });
  assert.deepEqual(parseDailyReminderTime(" 05:07 "), { hour: 5, minute: 7 });
  assert.equal(formatDailyReminderTime({ hour: 5, minute: 7 }), "05:07");
  assert.throws(() => parseDailyReminderTime("5:07"), /INVALID_PRACTICE_REMINDER_TIME/);
  assert.throws(() => parseDailyReminderTime("24:00"), /INVALID_PRACTICE_REMINDER_TIME/);
});

test("permission request delegates only while permission is undetermined", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  assert.equal(await requestNotificationPermission(platform), "granted");
  assert.equal(platform.permissionRequests, 0);
  platform.permission = "undetermined";
  assert.equal(await requestNotificationPermission(platform), "undetermined");
  assert.equal(platform.permissionRequests, 1);
});

test("same-time draft persists one canonical commonTime and complete per-day times", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await savePracticeReminder(platform, sameTimeDraft(time(20, 6), ["sat", "mon", "wed"]), copy);
  assert.deepEqual(platform.scheduled.map((entry) => [entry.day, entry.time]), [["mon", time(20, 6)], ["wed", time(20, 6)], ["sat", time(20, 6)]]);
  assert.equal(saved.practiceReminder?.mode, "same-time");
  assert.deepEqual(saved.practiceReminder?.commonTime, time(20, 6));
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(20, 6) }, { day: "wed", time: time(20, 6) }, { day: "sat", time: time(20, 6) },
  ]);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("by-day draft schedules each selected day at its own time", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await savePracticeReminder(platform, byDayDraft([
    { day: "sat", time: time(22, 30) },
    { day: "mon", time: time(8) },
    { day: "wed", time: time(13, 45) },
  ]), copy);
  assert.equal(saved.practiceReminder?.mode, "by-day");
  assert.equal(saved.practiceReminder?.commonTime, null);
  assert.deepEqual(platform.scheduled.map((entry) => ({ day: entry.day, time: entry.time })), [
    { day: "mon", time: time(8) }, { day: "wed", time: time(13, 45) }, { day: "sat", time: time(22, 30) },
  ]);
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(8) }, { day: "wed", time: time(13, 45) }, { day: "sat", time: time(22, 30) },
  ]);
});

test("legacy ODK024 practice record migrates to same-time and is persisted canonically", async () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, oldPracticeSettings());
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.practiceReminder?.mode, "same-time");
  assert.deepEqual(saved.practiceReminder?.commonTime, time(9, 15));
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(9, 15) }, { day: "wed", time: time(9, 15) }, { day: "sat", time: time(9, 15) },
  ]);
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, (value): value is { practiceReminder: unknown } => typeof value === "object" && value !== null && "practiceReminder" in value);
  const canonicalReminder = envelope?.payload.practiceReminder ?? null;
  assert.equal(canonicalReminder && isCanonicalPracticeReminder(canonicalReminder) ? canonicalReminder.mode : null, "same-time");
  assert.equal(canonicalReminder && typeof canonicalReminder === "object" ? "hour" in canonicalReminder : false, false);
  assert.deepEqual(platform.scheduled, []);
});

test("an incomplete ODK024 journal is versioned and migrated before resuming", async () => {
  const legacyJournal = {
    created: [{ day: "sat", notificationId: "journal-sat" }, { day: "mon", notificationId: "journal-mon" }],
    desired: {
      days: ["sat", "mon", "wed"],
      hour: 18,
      minute: 20,
      trackId: CODING_INTERVIEW_TRACK_ID,
    },
    remainingOldIds: ["old-1"],
    transactionId: "legacy-024-journal",
  } as const;
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, legacyJournal);
  const journal = await getPracticeReminderJournal();
  assert.equal(journal?.version, PRACTICE_REMINDER_JOURNAL_VERSION);
  assert.equal(journal?.desired?.mode, "same-time");
  assert.deepEqual(journal?.desired?.days, [
    { day: "mon", time: time(18, 20) }, { day: "wed", time: time(18, 20) }, { day: "sat", time: time(18, 20) },
  ]);
  assert.deepEqual(journal?.created.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(18, 20) }, { day: "sat", time: time(18, 20) },
  ]);
  const migratedEnvelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, (value): value is PracticeReminderJournal => typeof value === "object" && value !== null && (value as { version?: unknown }).version === 2);
  assert.equal(migratedEnvelope?.payload.version, 2);

  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  platform.addLive({ day: "mon", notificationId: "journal-mon", time: time(18, 20), transactionId: "legacy-024-journal" });
  platform.addLive({ day: "sat", notificationId: "journal-sat", time: time(18, 20), transactionId: "legacy-024-journal" });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["mon", "wed", "sat"]);
  assert.deepEqual(platform.scheduled.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [{ day: "wed", time: time(18, 20) }]);
  assert.deepEqual(platform.cancelled, ["old-1"]);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("by-day reconciliation preserves existing times, inherits new days from the first mon-sun day, and removes old days", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, byDayDraft([
    { day: "mon", time: time(8) }, { day: "wed", time: time(10) }, { day: "sat", time: time(12) },
  ]), copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), preferredDays: ["sun", "wed", "tue"], weeklySessionTarget: 3 });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "tue", time: time(8) }, { day: "wed", time: time(10) }, { day: "sun", time: time(8) },
  ]);
  assert.deepEqual(platform.scheduled.slice(3).map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "tue", time: time(8) }, { day: "wed", time: time(10) }, { day: "sun", time: time(8) },
  ]);
  assert.deepEqual(platform.cancelled, ["notification-1", "notification-2", "notification-3"]);
});

test("by-day reconciliation uses 20:00 when there is no existing day and emits mon-sun order", async () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    practiceReminder: {
      mode: "by-day",
      commonTime: null,
      schedules: [],
      trackId: CODING_INTERVIEW_TRACK_ID,
      transactionId: "empty-by-day",
    },
  });
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(platform.scheduled.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(20) }, { day: "wed", time: time(20) }, { day: "sat", time: time(20) },
  ]);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["mon", "wed", "sat"]);
});

test("switching modes repeatedly replaces the complete native schedule and keeps only the selected contract", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const same = await savePracticeReminder(platform, sameTimeDraft(time(8)), copy);
  assert.equal(same.practiceReminder?.mode, "same-time");
  const byDay = await savePracticeReminder(platform, byDayDraft([
    { day: "mon", time: time(7) }, { day: "wed", time: time(11) }, { day: "sat", time: time(19) },
  ]), copy);
  assert.equal(byDay.practiceReminder?.mode, "by-day");
  const sameAgain = await savePracticeReminder(platform, sameTimeDraft(time(21, 30)), copy);
  assert.equal(sameAgain.practiceReminder?.mode, "same-time");
  assert.deepEqual(sameAgain.practiceReminder?.schedules.map((entry) => entry.day), ["mon", "wed", "sat"]);
  assert.equal(platform.live.size, 3);
  assert.deepEqual(platform.cancelled, ["notification-1", "notification-2", "notification-3", "notification-4", "notification-5", "notification-6"]);
});

test("an invalid draft with foreign, duplicate, or incomplete days is rejected before scheduling", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await assert.rejects(() => savePracticeReminder(platform, {
    mode: "by-day",
    commonTime: null,
    days: [{ day: "mon", time: time(8) }, { day: "mon", time: time(9) }, { day: "fri", time: time(10) }],
  }, copy), InvalidPracticeReminderDraftError);
  assert.deepEqual(platform.scheduled, []);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("conflicting canonical settings and journals are rejected rather than silently repaired", async () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    practiceReminder: {
      mode: "same-time",
      commonTime: time(8),
      schedules: [{ day: "mon", time: time(9), notificationId: "conflict" }],
      trackId: CODING_INTERVIEW_TRACK_ID,
      transactionId: "conflicting-settings",
    },
  });
  await assert.rejects(() => getStoredNotificationSettings(), UnsupportedStoredRecordError);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    version: PRACTICE_REMINDER_JOURNAL_VERSION,
    created: [],
    desired: {
      mode: "by-day",
      commonTime: null,
      days: [{ day: "mon", time: time(8) }, { day: "mon", time: time(9) }],
      trackId: CODING_INTERVIEW_TRACK_ID,
    },
    remainingOldIds: [],
    transactionId: "conflicting-journal",
  });
  await assert.rejects(() => getPracticeReminderJournal(), UnsupportedStoredRecordError);
});

test("partial by-day scheduling remains versioned and resumes without duplicate notifications", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  platform.scheduleFailureDay = "wed";
  const draft = byDayDraft([{ day: "mon", time: time(20) }, { day: "wed", time: time(21) }, { day: "sat", time: time(22) }]);
  await assert.rejects(() => savePracticeReminder(platform, draft, copy), /schedule failed/);
  const pending = await getPracticeReminderJournal();
  assert.equal(pending?.version, PRACTICE_REMINDER_JOURNAL_VERSION);
  assert.deepEqual(pending?.desired?.days, draft.days);
  platform.scheduleFailureDay = null;
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [
    { day: "mon", time: time(20) }, { day: "wed", time: time(21) }, { day: "sat", time: time(22) },
  ]);
  assert.equal(platform.scheduled.filter((entry) => entry.day === "mon").length, 1);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("duplicate native entries for one transaction are cleaned before materialization", async () => {
  const journal: PracticeReminderJournal = {
    version: PRACTICE_REMINDER_JOURNAL_VERSION,
    created: [
      { day: "mon", time: time(8), notificationId: "duplicate-a" },
      { day: "mon", time: time(8), notificationId: "duplicate-b" },
    ],
    desired: {
      mode: "same-time",
      commonTime: time(8),
      days: defaultDays.map((day) => ({ day, time: time(8) })),
      trackId: CODING_INTERVIEW_TRACK_ID,
    },
    remainingOldIds: [],
    transactionId: "duplicate-transaction",
  };
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, journal);
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  platform.addLive({ day: "mon", notificationId: "duplicate-a", time: time(8), transactionId: journal.transactionId });
  platform.addLive({ day: "mon", notificationId: "duplicate-b", time: time(8), transactionId: journal.transactionId });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(platform.cancelled, ["duplicate-b"]);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), [...defaultDays]);
  assert.equal(platform.live.size, 3);
});

test("duplicate cleanup persists each success and retry ignores native ids that are already gone", async () => {
  const journal: PracticeReminderJournal = {
    version: PRACTICE_REMINDER_JOURNAL_VERSION,
    created: [
      { day: "mon", time: time(8), notificationId: "keep" },
      { day: "mon", time: time(8), notificationId: "remove-first" },
      { day: "sun", time: time(8), notificationId: "remove-second" },
    ],
    desired: { mode: "same-time", commonTime: time(8), days: defaultDays.map((day) => ({ day, time: time(8) })), trackId: CODING_INTERVIEW_TRACK_ID },
    remainingOldIds: [],
    transactionId: "cleanup-progress",
  };
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, journal);
  const platform = new NotificationPlatformSpy();
  for (const entry of journal.created) platform.addLive({ ...entry, transactionId: journal.transactionId });
  platform.cancelFailureId = "remove-second";
  await assert.rejects(() => reconcilePracticeReminder(platform, copy), /cancel failed/);
  assert.equal((await getPracticeReminderJournal())?.created.some((entry) => entry.notificationId === "remove-first"), false);
  platform.cancelFailureId = null;
  await reconcilePracticeReminder(platform, copy);
  assert.equal(platform.cancelled.filter((id) => id === "remove-first").length, 1);
});

test("cancel failure leaves the by-day journal intact and retry finishes cleanup", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, byDayDraft([{ day: "mon", time: time(8) }, { day: "wed", time: time(10) }, { day: "sat", time: time(12) }]), copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), preferredDays: ["tue"], weeklySessionTarget: 1 });
  platform.cancelFailureId = "notification-2";
  await assert.rejects(() => reconcilePracticeReminder(platform, copy), /cancel failed/);
  assert.equal((await getPracticeReminderJournal())?.version, PRACTICE_REMINDER_JOURNAL_VERSION);
  platform.cancelFailureId = null;
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map(({ day, time: reminderTime }) => ({ day, time: reminderTime })), [{ day: "tue", time: time(8) }]);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("disable uses the journaled by-day cleanup and clears the preference", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, byDayDraft([{ day: "mon", time: time(8) }, { day: "wed", time: time(10) }, { day: "sat", time: time(12) }]), copy);
  const saved = await disablePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder, null);
  assert.deepEqual(platform.cancelled, ["notification-1", "notification-2", "notification-3"]);
});

test("the shared coordinator serializes concurrent complete-draft saves and leaves only the latest schedule live", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const [first, second] = await Promise.all([
    savePracticeReminder(platform, sameTimeDraft(time(8)), copy),
    savePracticeReminder(platform, sameTimeDraft(time(21, 30)), copy),
  ]);
  assert.equal(first.practiceReminder?.commonTime?.hour, 8);
  assert.equal(second.practiceReminder?.commonTime?.hour, 21);
  assert.equal((await loadNotificationPreferences()).practiceReminder?.commonTime?.minute, 30);
  assert.equal(platform.live.size, 3);
  assert.deepEqual([...platform.live.values()].map((entry) => entry.day), ["mon", "wed", "sat"]);
});

test("a denied permission never produces a hidden reminder", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "denied";
  await assert.rejects(() => savePracticeReminder(platform, sameTimeDraft(time(20)), copy), NotificationPermissionDeniedError);
  assert.deepEqual(platform.scheduled, []);
  assert.deepEqual(await loadNotificationPreferences(), DEFAULT_NOTIFICATION_SETTINGS);
});

test("legacy daily reminder still migrates through the same-time transaction", async () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { dailyReminder: { hour: 9, minute: 15, notificationId: "legacy-daily" } });
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.practiceReminder?.mode, "same-time");
  assert.deepEqual(saved.practiceReminder?.commonTime, time(9, 15));
  assert.deepEqual(platform.cancelled, ["legacy-daily"]);
  assert.equal("dailyReminder" in await loadNotificationPreferences(), false);
});

test("paused goals keep the selected mode and time data while removing active schedules", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, byDayDraft([{ day: "mon", time: time(8) }, { day: "wed", time: time(10) }, { day: "sat", time: time(12) }]), copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), status: "paused" });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.context.status, "paused");
  assert.equal(saved.practiceReminder?.mode, "by-day");
  assert.deepEqual(saved.practiceReminder?.schedules, []);
  assert.equal(platform.live.size, 0);
});

test("changing the active track clears old schedules before following the new track goal", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, sameTimeDraft(time(8)), copy);
  await saveActiveTrackId(BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID);
  const withoutGoal = await reconcilePracticeReminder(platform, copy);
  assert.equal(withoutGoal.context.status, "missing-goal");
  assert.equal(withoutGoal.practiceReminder?.trackId, BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID);
  assert.deepEqual(withoutGoal.practiceReminder?.schedules, []);
  await saveGoal({ ...createDefaultGoal(BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID), preferredDays: ["thu", "sun"], weeklySessionTarget: 2 });
  const withGoal = await reconcilePracticeReminder(platform, copy);
  assert.equal(withGoal.context.status, "active");
  assert.deepEqual(withGoal.practiceReminder?.schedules.map((entry) => entry.day), ["thu", "sun"]);
});

test("missing active track cancels the previous native schedule and returns an explicit empty state", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, sameTimeDraft(time(8)), copy);
  await clearActiveTrackId();
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.context.status, "missing-track");
  assert.equal(saved.practiceReminder, null);
  assert.equal(platform.live.size, 0);
});

test("an active goal without preferred days is exposed as no-days and keeps no native schedule", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, sameTimeDraft(time(8)), copy);
  writeCanonicalJson(STORAGE_KEYS.goal(CODING_INTERVIEW_TRACK_ID), { ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), preferredDays: [], weeklySessionTarget: 0 });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.context.status, "no-days");
  assert.deepEqual(saved.practiceReminder?.schedules, []);
  assert.equal(platform.live.size, 0);
});
