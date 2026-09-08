import { GOAL_DAY_IDS, isRegisteredTrackId, type GoalDay, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

export type ScheduledPracticeReminder = Readonly<{ day: GoalDay; notificationId: string }>;
export type PracticeReminder = Readonly<{
  hour: number;
  minute: number;
  schedules: readonly ScheduledPracticeReminder[];
  trackId: TrackId;
  transactionId: string;
}>;
export type NotificationSettings = Readonly<{ practiceReminder: PracticeReminder | null }>;
export type LegacyDailyReminder = Readonly<{ hour: number; minute: number; notificationId: string }>;
export type LegacyNotificationSettings = Readonly<{ dailyReminder: LegacyDailyReminder | null }>;
export type StoredNotificationSettings = NotificationSettings | LegacyNotificationSettings;
export type PracticeReminderTarget = Readonly<{
  days: readonly GoalDay[];
  hour: number;
  minute: number;
  trackId: TrackId;
}>;
export type PracticeReminderJournal = Readonly<{
  created: readonly ScheduledPracticeReminder[];
  desired: PracticeReminderTarget | null;
  remainingOldIds: readonly string[];
  transactionId: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTime(record: Record<string, unknown>): boolean {
  return Number.isInteger(record.hour) && Number(record.hour) >= 0 && Number(record.hour) <= 23 &&
    Number.isInteger(record.minute) && Number(record.minute) >= 0 && Number(record.minute) <= 59;
}

function isScheduledPracticeReminder(value: unknown): value is ScheduledPracticeReminder {
  if (!isRecord(value)) return false;
  return Object.keys(value).length === 2 && GOAL_DAY_IDS.includes(value.day as GoalDay) &&
    typeof value.notificationId === "string" && value.notificationId.length > 0;
}

function isPracticeReminder(value: unknown): value is PracticeReminder {
  if (!isRecord(value) || Object.keys(value).length !== 5 || !isTime(value) ||
    typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) || typeof value.transactionId !== "string" || value.transactionId.length === 0 ||
    !Array.isArray(value.schedules) || !value.schedules.every(isScheduledPracticeReminder)) return false;
  const days = value.schedules.map((entry) => entry.day);
  return new Set(days).size === days.length;
}

function isPracticeReminderTarget(value: unknown): value is PracticeReminderTarget {
  if (!isRecord(value) || Object.keys(value).length !== 4 || !isTime(value) || typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) ||
    !Array.isArray(value.days) || !value.days.every((day) => GOAL_DAY_IDS.includes(day as GoalDay))) return false;
  return new Set(value.days).size === value.days.length;
}

function isLegacyDailyReminder(value: unknown): value is LegacyDailyReminder {
  return isRecord(value) && Object.keys(value).length === 3 && isTime(value) &&
    typeof value.notificationId === "string" && value.notificationId.length > 0;
}

function isStoredNotificationSettings(value: unknown): value is StoredNotificationSettings {
  if (!isRecord(value) || Object.keys(value).length !== 1) return false;
  if ("practiceReminder" in value) return value.practiceReminder === null || isPracticeReminder(value.practiceReminder);
  return "dailyReminder" in value && (value.dailyReminder === null || isLegacyDailyReminder(value.dailyReminder));
}

function isPracticeReminderJournal(value: unknown): value is PracticeReminderJournal {
  if (!isRecord(value) || Object.keys(value).length !== 4 || typeof value.transactionId !== "string" || value.transactionId.length === 0 ||
    !Array.isArray(value.created) || !value.created.every(isScheduledPracticeReminder) ||
    !Array.isArray(value.remainingOldIds) || !value.remainingOldIds.every((id) => typeof id === "string" && id.length > 0) ||
    !(value.desired === null || isPracticeReminderTarget(value.desired))) return false;
  return true;
}

export async function getStoredNotificationSettings(): Promise<StoredNotificationSettings | null> {
  return readCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, isStoredNotificationSettings);
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
}

export async function getPracticeReminderJournal(): Promise<PracticeReminderJournal | null> {
  return readCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, isPracticeReminderJournal);
}

export async function savePracticeReminderJournal(journal: PracticeReminderJournal): Promise<void> {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, journal);
}

export async function clearPracticeReminderJournal(): Promise<void> {
  removeCanonicalValue(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL);
}
