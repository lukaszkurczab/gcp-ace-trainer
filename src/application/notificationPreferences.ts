import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "../storage/repositories/notificationSettingsRepository";

export type { DailyReminder, NotificationSettings } from "../storage/repositories/notificationSettingsRepository";

export type NotificationPermission = "denied" | "granted" | "undetermined";

export type NotificationPlatform = Readonly<{
  cancelDailyReminder: (notificationId: string) => Promise<void>;
  getPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleDailyReminder: (request: DailyReminderRequest) => Promise<string>;
}>;

export type DailyReminderTime = Readonly<{
  hour: number;
  minute: number;
}>;

export type DailyReminderRequest = Readonly<{
  body: string;
  time: DailyReminderTime;
  title: string;
}>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = Object.freeze({
  dailyReminder: null,
});

export class NotificationPermissionDeniedError extends Error {
  constructor() {
    super("NOTIFICATION_PERMISSION_DENIED: daily reminder requires notification permission.");
  }
}

export function formatDailyReminderTime({ hour, minute }: DailyReminderTime): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function parseDailyReminderTime(value: string): DailyReminderTime {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value.trim());
  if (!match) throw new Error("INVALID_DAILY_REMINDER_TIME: use HH:MM in 24-hour time.");
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour!, minute: minute! };
}

export async function loadNotificationPreferences(): Promise<NotificationSettings> {
  return await getNotificationSettings() ?? DEFAULT_NOTIFICATION_SETTINGS;
}

export async function requestNotificationPermission(platform: NotificationPlatform): Promise<NotificationPermission> {
  const current = await platform.getPermission();
  return current === "undetermined" ? await platform.requestPermission() : current;
}

export async function saveDailyReminder(
  platform: NotificationPlatform,
  time: DailyReminderTime,
  notification: Omit<DailyReminderRequest, "time">,
): Promise<NotificationSettings> {
  const permission = await requestNotificationPermission(platform);
  if (permission !== "granted") throw new NotificationPermissionDeniedError();

  const current = await loadNotificationPreferences();
  const notificationId = await platform.scheduleDailyReminder({ ...notification, time });
  const next: NotificationSettings = { dailyReminder: { ...time, notificationId } };

  try {
    await saveNotificationSettings(next);
  } catch (error) {
    await platform.cancelDailyReminder(notificationId);
    throw error;
  }

  if (!current.dailyReminder) return next;

  try {
    await platform.cancelDailyReminder(current.dailyReminder.notificationId);
    return next;
  } catch (error) {
    await platform.cancelDailyReminder(notificationId);
    await saveNotificationSettings(current);
    throw error;
  }
}

export async function disableDailyReminder(
  platform: NotificationPlatform,
  notification: Omit<DailyReminderRequest, "time">,
): Promise<NotificationSettings> {
  const current = await loadNotificationPreferences();
  if (!current.dailyReminder) return current;

  await platform.cancelDailyReminder(current.dailyReminder.notificationId);
  const next: NotificationSettings = { dailyReminder: null };
  try {
    await saveNotificationSettings(next);
    return next;
  } catch (error) {
    const restoredId = await platform.scheduleDailyReminder({
      ...notification,
      time: current.dailyReminder,
    });
    const restored: NotificationSettings = {
      dailyReminder: { ...current.dailyReminder, notificationId: restoredId },
    };
    await saveNotificationSettings(restored);
    throw error;
  }
}
