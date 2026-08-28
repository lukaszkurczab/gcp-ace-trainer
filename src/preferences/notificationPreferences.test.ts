import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationPermissionDeniedError,
  disableDailyReminder,
  formatDailyReminderTime,
  loadNotificationPreferences,
  parseDailyReminderTime,
  requestNotificationPermission,
  saveDailyReminder,
  type DailyReminderRequest,
  type NotificationPermission,
  type NotificationPlatform,
} from "../application/notificationPreferences";
import {
  MemoryKeyValueStorage,
  installKeyValueStorageForTests,
} from "../infrastructure/storage/mmkvClient";

class NotificationPlatformSpy implements NotificationPlatform {
  permission: NotificationPermission = "undetermined";
  permissionRequests = 0;
  readonly cancelled: string[] = [];
  readonly scheduled: DailyReminderRequest[] = [];

  async cancelDailyReminder(notificationId: string): Promise<void> {
    this.cancelled.push(notificationId);
  }

  async getPermission(): Promise<NotificationPermission> {
    return this.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    this.permissionRequests += 1;
    return this.permission;
  }

  async scheduleDailyReminder(request: DailyReminderRequest): Promise<string> {
    this.scheduled.push(request);
    return `notification-${this.scheduled.length}`;
  }
}

const notification = {
  body: "Choose one focused Patternly practice session.",
  title: "Time to practise",
} as const;

beforeEach(() => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

test("daily reminder time accepts only strict 24-hour input", () => {
  assert.deepEqual(parseDailyReminderTime("05:07"), { hour: 5, minute: 7 });
  assert.equal(formatDailyReminderTime({ hour: 5, minute: 7 }), "05:07");
  assert.throws(() => parseDailyReminderTime("5:07"), /INVALID_DAILY_REMINDER_TIME/);
  assert.throws(() => parseDailyReminderTime("24:00"), /INVALID_DAILY_REMINDER_TIME/);
});

test("permission request delegates to the operating system only when it can still be asked", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  assert.equal(await requestNotificationPermission(platform), "granted");
  assert.equal(platform.permissionRequests, 0);

  platform.permission = "undetermined";
  assert.equal(await requestNotificationPermission(platform), "undetermined");
  assert.equal(platform.permissionRequests, 1);
});

test("saving a reminder schedules exactly one daily native notification and persists its identifier", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";

  const saved = await saveDailyReminder(platform, { hour: 20, minute: 6 }, notification);

  assert.deepEqual(saved, { dailyReminder: { hour: 20, minute: 6, notificationId: "notification-1" } });
  assert.deepEqual(await loadNotificationPreferences(), saved);
  assert.deepEqual(platform.scheduled, [{ ...notification, time: { hour: 20, minute: 6 } }]);
  assert.deepEqual(platform.cancelled, []);
});

test("changing a reminder replaces the old native schedule instead of accumulating schedules", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await saveDailyReminder(platform, { hour: 8, minute: 0 }, notification);

  const saved = await saveDailyReminder(platform, { hour: 19, minute: 30 }, notification);

  assert.deepEqual(saved, { dailyReminder: { hour: 19, minute: 30, notificationId: "notification-2" } });
  assert.deepEqual(platform.cancelled, ["notification-1"]);
  assert.equal(platform.scheduled.length, 2);
});

test("a denied operating-system permission never produces a hidden or mock reminder", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "denied";

  await assert.rejects(
    () => saveDailyReminder(platform, { hour: 20, minute: 0 }, notification),
    NotificationPermissionDeniedError,
  );
  assert.deepEqual(platform.scheduled, []);
  assert.deepEqual(await loadNotificationPreferences(), DEFAULT_NOTIFICATION_SETTINGS);
});

test("disabling a reminder cancels its native schedule and clears the durable setting", async () => {
  const platform = new NotificationPlatformSpy();
  platform.permission = "granted";
  await saveDailyReminder(platform, { hour: 8, minute: 0 }, notification);

  const saved = await disableDailyReminder(platform, notification);

  assert.deepEqual(saved, DEFAULT_NOTIFICATION_SETTINGS);
  assert.deepEqual(platform.cancelled, ["notification-1"]);
  assert.deepEqual(await loadNotificationPreferences(), DEFAULT_NOTIFICATION_SETTINGS);
});
