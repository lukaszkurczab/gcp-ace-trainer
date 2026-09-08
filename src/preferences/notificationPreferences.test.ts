import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationPermissionDeniedError,
  disablePracticeReminder,
  formatDailyReminderTime,
  loadNotificationPreferences,
  parseDailyReminderTime,
  reconcilePracticeReminder,
  requestNotificationPermission,
  savePracticeReminder,
  type NotificationPermission,
  type NotificationPlatform,
  type ScheduledReminderIdentity,
  type WeeklyReminderRequest,
} from "../application/notificationPreferences";
import { BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, createDefaultGoal, CODING_INTERVIEW_TRACK_ID } from "../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";
import { writeCanonicalJson } from "../storage/repositories/canonicalRecordCodec";
import { saveActiveTrackId } from "../storage/repositories/activeTrackRepository";
import { saveGoal } from "../storage/repositories/goalRepository";
import { getPracticeReminderJournal } from "../storage/repositories/notificationSettingsRepository";

class NotificationPlatformSpy implements NotificationPlatform {
  permission: NotificationPermission = "undetermined";
  permissionRequests = 0;
  readonly cancelled: string[] = [];
  readonly scheduled: WeeklyReminderRequest[] = [];
  readonly live = new Map<string, ScheduledReminderIdentity & { transactionId: string }>();
  cancelFailureId: string | null = null;
  scheduleFailureDay: string | null = null;

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
    this.live.set(notificationId, { day: request.day, notificationId, transactionId: request.transactionId });
    return notificationId;
  }
}

const copy = { body: "Choose one focused Patternly practice session.", title: "Time to practise" } as const;

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveActiveTrackId(CODING_INTERVIEW_TRACK_ID);
  await saveGoal(createDefaultGoal(CODING_INTERVIEW_TRACK_ID));
});

test("reminder time accepts only strict 24-hour input", () => {
  assert.deepEqual(parseDailyReminderTime("05:07"), { hour: 5, minute: 7 });
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

test("saving schedules one weekly notification for each preferred day", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await savePracticeReminder(platform, { hour: 20, minute: 6 }, copy);
  assert.deepEqual(platform.scheduled.map((entry) => entry.day), ["mon", "wed", "sat"]);
  assert.equal(saved.practiceReminder?.trackId, CODING_INTERVIEW_TRACK_ID);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["mon", "wed", "sat"]);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("changing preferred days replaces the complete old native schedule", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, { hour: 8, minute: 0 }, copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), preferredDays: ["tue", "sun"], weeklySessionTarget: 2 });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["tue", "sun"]);
  assert.deepEqual(platform.cancelled, ["notification-1", "notification-2", "notification-3"]);
});

test("legacy daily reminder migrates without retaining a DAILY identifier", async () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, { dailyReminder: { hour: 9, minute: 15, notificationId: "legacy-daily" } });
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(platform.cancelled, ["legacy-daily"]);
  assert.equal(saved.practiceReminder?.hour, 9);
  assert.equal("dailyReminder" in await loadNotificationPreferences(), false);
});

test("paused goal keeps the preference but removes all scheduled days", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, { hour: 8, minute: 0 }, copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), status: "paused" });
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.equal(saved.context.status, "paused");
  assert.deepEqual(saved.practiceReminder?.schedules, []);
  assert.equal(saved.practiceReminder?.hour, 8);
});

test("changing the active track clears old days and then follows that track's goal", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, { hour: 8, minute: 0 }, copy);
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

test("a denied permission never produces a hidden reminder", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "denied";
  await assert.rejects(() => savePracticeReminder(platform, { hour: 20, minute: 0 }, copy), NotificationPermissionDeniedError);
  assert.deepEqual(platform.scheduled, []);
  assert.deepEqual(await loadNotificationPreferences(), DEFAULT_NOTIFICATION_SETTINGS);
});

test("partial scheduling failure remains journaled and resumes without duplicates", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  platform.scheduleFailureDay = "wed";
  await assert.rejects(() => savePracticeReminder(platform, { hour: 20, minute: 0 }, copy), /schedule failed/);
  assert.notEqual(await getPracticeReminderJournal(), null);
  platform.scheduleFailureDay = null;
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["mon", "wed", "sat"]);
  assert.equal(platform.scheduled.filter((entry) => entry.day === "mon").length, 1);
});

test("cancel failure remains journaled and retry finishes cleanup", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, { hour: 8, minute: 0 }, copy);
  await saveGoal({ ...createDefaultGoal(CODING_INTERVIEW_TRACK_ID), preferredDays: ["tue"], weeklySessionTarget: 1 });
  platform.cancelFailureId = "notification-2";
  await assert.rejects(() => reconcilePracticeReminder(platform, copy), /cancel failed/);
  assert.notEqual(await getPracticeReminderJournal(), null);
  platform.cancelFailureId = null;
  const saved = await reconcilePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder?.schedules.map((entry) => entry.day), ["tue"]);
  assert.equal(await getPracticeReminderJournal(), null);
});

test("disable uses the same journaled cleanup and clears the preference", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await savePracticeReminder(platform, { hour: 8, minute: 0 }, copy);
  const saved = await disablePracticeReminder(platform, copy);
  assert.deepEqual(saved.practiceReminder, null);
  assert.deepEqual(platform.cancelled, ["notification-1", "notification-2", "notification-3"]);
});

test("the shared coordinator serializes concurrent saves and leaves only the latest schedule live", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  const [first, second] = await Promise.all([
    savePracticeReminder(platform, { hour: 8, minute: 0 }, copy),
    savePracticeReminder(platform, { hour: 21, minute: 30 }, copy),
  ]);
  assert.equal(first.practiceReminder?.hour, 8);
  assert.equal(second.practiceReminder?.hour, 21);
  assert.equal((await loadNotificationPreferences()).practiceReminder?.minute, 30);
  assert.equal(platform.live.size, 3);
  assert.deepEqual([...platform.live.values()].map((entry) => entry.day), ["mon", "wed", "sat"]);
});
