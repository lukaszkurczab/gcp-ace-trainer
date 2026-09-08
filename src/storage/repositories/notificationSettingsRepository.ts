import { GOAL_DAY_IDS, isRegisteredTrackId, type GoalDay, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

export const PRACTICE_REMINDER_JOURNAL_VERSION = 2 as const;
export const DEFAULT_PRACTICE_REMINDER_TIME = Object.freeze({ hour: 20, minute: 0 });

export type PracticeReminderMode = "same-time" | "by-day";
export type ReminderTime = Readonly<{ hour: number; minute: number }>;
export type PracticeReminderDay = Readonly<{ day: GoalDay; time: ReminderTime }>;
export type ScheduledPracticeReminder = Readonly<PracticeReminderDay & { notificationId: string }>;
export type PracticeReminder = Readonly<{
  mode: PracticeReminderMode;
  commonTime: ReminderTime | null;
  schedules: readonly ScheduledPracticeReminder[];
  trackId: TrackId;
  transactionId: string;
}>;
export type NotificationSettings = Readonly<{ practiceReminder: PracticeReminder | null }>;
export type LegacyDailyReminder = Readonly<{ hour: number; minute: number; notificationId: string }>;
export type LegacyNotificationSettings = Readonly<{ dailyReminder: LegacyDailyReminder | null }>;
export type StoredNotificationSettings = NotificationSettings | LegacyNotificationSettings;
export type PracticeReminderTarget = Readonly<{
  mode: PracticeReminderMode;
  commonTime: ReminderTime | null;
  days: readonly PracticeReminderDay[];
  trackId: TrackId;
}>;
export type PracticeReminderJournal = Readonly<{
  version: typeof PRACTICE_REMINDER_JOURNAL_VERSION;
  created: readonly ScheduledPracticeReminder[];
  desired: PracticeReminderTarget | null;
  remainingOldIds: readonly string[];
  transactionId: string;
}>;

type LegacyScheduledPracticeReminder = Readonly<{ day: GoalDay; notificationId: string }>;
type LegacyPracticeReminder = Readonly<{
  hour: number;
  minute: number;
  schedules: readonly LegacyScheduledPracticeReminder[];
  trackId: TrackId;
  transactionId: string;
}>;
type LegacyPracticeNotificationSettings = Readonly<{ practiceReminder: LegacyPracticeReminder | null }>;
type LegacyPracticeReminderTarget = Readonly<{
  days: readonly GoalDay[];
  hour: number;
  minute: number;
  trackId: TrackId;
}>;
type LegacyPracticeReminderJournal = Readonly<{
  created: readonly LegacyScheduledPracticeReminder[];
  desired: LegacyPracticeReminderTarget | null;
  remainingOldIds: readonly string[];
  transactionId: string;
}>;
type RawStoredNotificationSettings = StoredNotificationSettings | LegacyPracticeNotificationSettings;
type RawPracticeReminderJournal = PracticeReminderJournal | LegacyPracticeReminderJournal;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

function isTime(value: unknown): value is ReminderTime {
  if (!isRecord(value) || !hasExactKeys(value, ["hour", "minute"])) return false;
  return Number.isInteger(value.hour) && Number(value.hour) >= 0 && Number(value.hour) <= 23 &&
    Number.isInteger(value.minute) && Number(value.minute) >= 0 && Number(value.minute) <= 59;
}

function freezeTime(value: ReminderTime): ReminderTime {
  return Object.freeze({ hour: value.hour, minute: value.minute });
}

function sameTime(left: ReminderTime | null, right: ReminderTime | null): boolean {
  return left?.hour === right?.hour && left?.minute === right?.minute;
}

function dayIndex(day: GoalDay): number {
  return GOAL_DAY_IDS.indexOf(day);
}

function orderDays<T extends { day: GoalDay }>(days: readonly T[]): readonly T[] {
  return Object.freeze([...days].sort((left, right) => dayIndex(left.day) - dayIndex(right.day)));
}

function isGoalDay(value: unknown): value is GoalDay {
  return GOAL_DAY_IDS.includes(value as GoalDay);
}

function isPracticeReminderDay(value: unknown): value is PracticeReminderDay {
  return isRecord(value) && hasExactKeys(value, ["day", "time"]) && isGoalDay(value.day) && isTime(value.time);
}

function isLegacyScheduledPracticeReminder(value: unknown): value is LegacyScheduledPracticeReminder {
  return isRecord(value) && hasExactKeys(value, ["day", "notificationId"]) && isGoalDay(value.day) &&
    typeof value.notificationId === "string" && value.notificationId.length > 0;
}

function isScheduledPracticeReminder(value: unknown): value is ScheduledPracticeReminder {
  return isRecord(value) && hasExactKeys(value, ["day", "time", "notificationId"]) && isPracticeReminderDay({ day: value.day, time: value.time }) &&
    typeof value.notificationId === "string" && value.notificationId.length > 0;
}

function hasUniqueDays(days: readonly { day: GoalDay }[]): boolean {
  return new Set(days.map((entry) => entry.day)).size === days.length;
}

function hasUniqueGoalDays(days: readonly GoalDay[]): boolean {
  return new Set(days).size === days.length;
}

function hasUniqueIds(ids: readonly string[]): boolean {
  return new Set(ids).size === ids.length;
}

function isPracticeReminderMode(value: unknown): value is PracticeReminderMode {
  return value === "same-time" || value === "by-day";
}

function isPracticeReminderTarget(value: unknown): value is PracticeReminderTarget {
  if (!isRecord(value) || !hasExactKeys(value, ["mode", "commonTime", "days", "trackId"]) ||
    !isPracticeReminderMode(value.mode) || !isRegisteredTrackId(value.trackId as string) || !Array.isArray(value.days) ||
    !value.days.every(isPracticeReminderDay) || !hasUniqueDays(value.days)) return false;
  if (value.mode === "same-time") {
    if (!isTime(value.commonTime)) return false;
    return value.days.every((entry) => sameTime(entry.time, value.commonTime as ReminderTime));
  }
  return value.commonTime === null;
}

function isPracticeReminder(value: unknown): value is PracticeReminder {
  if (!isRecord(value) || !hasExactKeys(value, ["mode", "commonTime", "schedules", "trackId", "transactionId"]) ||
    !isPracticeReminderMode(value.mode) || !isRegisteredTrackId(value.trackId as string) ||
    typeof value.transactionId !== "string" || value.transactionId.length === 0 || !Array.isArray(value.schedules) ||
    !value.schedules.every(isScheduledPracticeReminder) || !hasUniqueDays(value.schedules)) return false;
  if (value.mode === "same-time") {
    if (!isTime(value.commonTime)) return false;
    return value.schedules.every((entry) => sameTime(entry.time, value.commonTime as ReminderTime));
  }
  return value.commonTime === null;
}

function isLegacyPracticeReminder(value: unknown): value is LegacyPracticeReminder {
  if (!isRecord(value) || !hasExactKeys(value, ["hour", "minute", "schedules", "trackId", "transactionId"]) ||
    !isTime({ hour: value.hour, minute: value.minute }) || !isRegisteredTrackId(value.trackId as string) ||
    typeof value.transactionId !== "string" || value.transactionId.length === 0 || !Array.isArray(value.schedules) ||
    !value.schedules.every(isLegacyScheduledPracticeReminder)) return false;
  return hasUniqueDays(value.schedules);
}

function isLegacyDailyReminder(value: unknown): value is LegacyDailyReminder {
  return isRecord(value) && hasExactKeys(value, ["hour", "minute", "notificationId"]) && isTime({ hour: value.hour, minute: value.minute }) &&
    typeof value.notificationId === "string" && value.notificationId.length > 0;
}

function isStoredNotificationSettings(value: unknown): value is RawStoredNotificationSettings {
  if (!isRecord(value)) return false;
  if (hasExactKeys(value, ["dailyReminder"])) return value.dailyReminder === null || isLegacyDailyReminder(value.dailyReminder);
  if (!hasExactKeys(value, ["practiceReminder"])) return false;
  return value.practiceReminder === null || isPracticeReminder(value.practiceReminder) || isLegacyPracticeReminder(value.practiceReminder);
}

function isLegacyPracticeReminderTarget(value: unknown): value is LegacyPracticeReminderTarget {
  return isRecord(value) && hasExactKeys(value, ["days", "hour", "minute", "trackId"]) && isTime({ hour: value.hour, minute: value.minute }) &&
    isRegisteredTrackId(value.trackId as string) && Array.isArray(value.days) && value.days.every(isGoalDay) && hasUniqueGoalDays(value.days);
}

function isPracticeReminderJournal(value: unknown): value is RawPracticeReminderJournal {
  if (!isRecord(value)) return false;
  if (value.version === PRACTICE_REMINDER_JOURNAL_VERSION) {
    if (!hasExactKeys(value, ["version", "created", "desired", "remainingOldIds", "transactionId"]) ||
      !Array.isArray(value.created) || !value.created.every(isScheduledPracticeReminder) ||
      !Array.isArray(value.remainingOldIds) || !value.remainingOldIds.every((id) => typeof id === "string" && id.length > 0) ||
      !hasUniqueIds(value.remainingOldIds) || typeof value.transactionId !== "string" || value.transactionId.length === 0 ||
      !(value.desired === null || isPracticeReminderTarget(value.desired))) return false;
    return true;
  }
  if (!hasExactKeys(value, ["created", "desired", "remainingOldIds", "transactionId"]) ||
    !Array.isArray(value.created) || !value.created.every(isLegacyScheduledPracticeReminder) ||
    !Array.isArray(value.remainingOldIds) || !value.remainingOldIds.every((id) => typeof id === "string" && id.length > 0) ||
    typeof value.transactionId !== "string" || value.transactionId.length === 0 ||
    !(value.desired === null || isLegacyPracticeReminderTarget(value.desired))) return false;
  return true;
}

function normalizeDays<T extends { day: GoalDay }>(days: readonly T[]): readonly T[] {
  return orderDays(days);
}

function normalizeTarget(target: PracticeReminderTarget): PracticeReminderTarget {
  const commonTime = target.mode === "same-time" ? freezeTime(target.commonTime!) : null;
  return Object.freeze({
    mode: target.mode,
    commonTime,
    days: Object.freeze(normalizeDays(target.days).map((entry) => Object.freeze({ day: entry.day, time: freezeTime(entry.time) }))),
    trackId: target.trackId,
  });
}

function normalizePracticeReminder(reminder: PracticeReminder): PracticeReminder {
  const commonTime = reminder.mode === "same-time" ? freezeTime(reminder.commonTime!) : null;
  return Object.freeze({
    mode: reminder.mode,
    commonTime,
    schedules: Object.freeze(normalizeDays(reminder.schedules).map((entry) => Object.freeze({
      day: entry.day,
      time: freezeTime(entry.time),
      notificationId: entry.notificationId,
    }))),
    trackId: reminder.trackId,
    transactionId: reminder.transactionId,
  });
}

function migrateLegacyPracticeReminder(reminder: LegacyPracticeReminder): PracticeReminder {
  const time = freezeTime({ hour: reminder.hour, minute: reminder.minute });
  return normalizePracticeReminder({
    mode: "same-time",
    commonTime: time,
    schedules: reminder.schedules.map((entry) => ({ day: entry.day, time, notificationId: entry.notificationId })),
    trackId: reminder.trackId,
    transactionId: reminder.transactionId,
  });
}

function targetFromLegacy(target: LegacyPracticeReminderTarget): PracticeReminderTarget {
  const time = freezeTime({ hour: target.hour, minute: target.minute });
  return normalizeTarget({
    mode: "same-time",
    commonTime: time,
    days: target.days.map((day) => ({ day, time })),
    trackId: target.trackId,
  });
}

function normalizeStoredSettings(value: RawStoredNotificationSettings): StoredNotificationSettings {
  if (hasExactKeys(value, ["dailyReminder"])) return value as LegacyNotificationSettings;
  const practiceValue = value as NotificationSettings | LegacyPracticeNotificationSettings;
  if (practiceValue.practiceReminder === null) return Object.freeze({ practiceReminder: null });
  return Object.freeze({
    practiceReminder: isLegacyPracticeReminder(practiceValue.practiceReminder)
      ? migrateLegacyPracticeReminder(practiceValue.practiceReminder)
      : normalizePracticeReminder(practiceValue.practiceReminder),
  });
}

function normalizeCreatedEntry(entry: ScheduledPracticeReminder, desired: PracticeReminderTarget | null): ScheduledPracticeReminder {
  const targetEntry = desired?.days.find((candidate) => candidate.day === entry.day);
  const time = targetEntry?.time ?? (desired?.mode === "same-time" ? desired.commonTime : null) ?? entry.time;
  return Object.freeze({ day: entry.day, time: freezeTime(time), notificationId: entry.notificationId });
}

function migrateLegacyJournal(journal: LegacyPracticeReminderJournal): PracticeReminderJournal {
  const desired = journal.desired === null ? null : targetFromLegacy(journal.desired);
  const created = journal.created.map((entry) => normalizeCreatedEntry({
    day: entry.day,
    time: desired?.days.find((candidate) => candidate.day === entry.day)?.time ??
      (desired?.mode === "same-time" ? desired.commonTime! : DEFAULT_PRACTICE_REMINDER_TIME),
    notificationId: entry.notificationId,
  }, desired));
  return Object.freeze({
    version: PRACTICE_REMINDER_JOURNAL_VERSION,
    created: Object.freeze(orderDays(created)),
    desired,
    remainingOldIds: Object.freeze([...new Set(journal.remainingOldIds)]),
    transactionId: journal.transactionId,
  });
}

function normalizeJournal(journal: PracticeReminderJournal): PracticeReminderJournal {
  return Object.freeze({
    version: PRACTICE_REMINDER_JOURNAL_VERSION,
    created: Object.freeze(journal.created.map((entry) => normalizeCreatedEntry(entry, journal.desired))),
    desired: journal.desired === null ? null : normalizeTarget(journal.desired),
    remainingOldIds: Object.freeze([...new Set(journal.remainingOldIds)]),
    transactionId: journal.transactionId,
  });
}

function isSameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function getStoredNotificationSettings(): Promise<StoredNotificationSettings | null> {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isStoredNotificationSettings);
  if (!envelope) return null;
  const normalized = normalizeStoredSettings(envelope.payload);
  if (!isSameJson(envelope.payload, normalized)) writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalized, envelope.revision);
  return normalized;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  if (!isStoredNotificationSettings(settings) || hasExactKeys(settings, ["dailyReminder"])) throw new Error("INVALID_NOTIFICATION_SETTINGS: expected canonical practice reminder settings.");
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalizeStoredSettings(settings));
}

export async function getPracticeReminderJournal(): Promise<PracticeReminderJournal | null> {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, isPracticeReminderJournal);
  if (!envelope) return null;
  const payload = envelope.payload;
  const normalized = valueHasJournalVersion(payload) ? normalizeJournal(payload) : migrateLegacyJournal(payload);
  if (!isSameJson(payload, normalized)) writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, normalized, envelope.revision);
  return normalized;
}

function valueHasJournalVersion(value: RawPracticeReminderJournal): value is PracticeReminderJournal {
  return isRecord(value) && "version" in value && value.version === PRACTICE_REMINDER_JOURNAL_VERSION;
}

export async function savePracticeReminderJournal(journal: PracticeReminderJournal): Promise<void> {
  if (!isPracticeReminderJournal(journal) || !valueHasJournalVersion(journal)) throw new Error("INVALID_PRACTICE_REMINDER_JOURNAL: unsupported journal.");
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, normalizeJournal(journal));
}

export async function clearPracticeReminderJournal(): Promise<void> {
  removeCanonicalValue(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL);
}

export function isCanonicalPracticeReminder(value: unknown): value is PracticeReminder {
  return isPracticeReminder(value);
}

export function isCanonicalPracticeReminderTarget(value: unknown): value is PracticeReminderTarget {
  return isPracticeReminderTarget(value);
}

export function isLegacyNotificationSettings(value: StoredNotificationSettings | null): value is LegacyNotificationSettings {
  return Boolean(value && hasExactKeys(value, ["dailyReminder"]));
}
