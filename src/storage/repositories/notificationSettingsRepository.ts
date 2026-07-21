import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

export type DailyReminder = Readonly<{
  hour: number;
  minute: number;
  notificationId: string;
}>;

export type NotificationSettings = Readonly<{
  dailyReminder: DailyReminder | null;
}>;

const isDailyReminder = (value: unknown): value is DailyReminder => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 3 &&
    typeof record.notificationId === "string" && record.notificationId.length > 0 &&
    Number.isInteger(record.hour) && Number(record.hour) >= 0 && Number(record.hour) <= 23 &&
    Number.isInteger(record.minute) && Number(record.minute) >= 0 && Number(record.minute) <= 59;
};

const isNotificationSettings = (value: unknown): value is NotificationSettings => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && (record.dailyReminder === null || isDailyReminder(record.dailyReminder));
};

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  return readCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, isNotificationSettings);
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
}
