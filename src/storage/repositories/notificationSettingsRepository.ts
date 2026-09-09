import { GOAL_DAY_IDS, createContentPackagePin, createLearningPlanSlotId, isRegisteredTrackId, type ContentPackagePin, type GoalDay, type LearningPlanSlotId, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

export const PRACTICE_REMINDER_JOURNAL_VERSION = 2 as const;
export const DEFAULT_PRACTICE_REMINDER_TIME = Object.freeze({ hour: 20, minute: 0 });

type PracticeReminderMode = "same-time" | "by-day";
type ReminderTime = Readonly<{ hour: number; minute: number }>;
type PracticeReminderDay = Readonly<{ day: GoalDay; time: ReminderTime }>;
type ScheduledPracticeReminder = Readonly<PracticeReminderDay & { notificationId: string }>;
type PracticeReminder = Readonly<{
  mode: PracticeReminderMode;
  commonTime: ReminderTime | null;
  schedules: readonly ScheduledPracticeReminder[];
  trackId: TrackId;
  transactionId: string;
}>;
type NotificationSettings = Readonly<{ practiceReminder: PracticeReminder | null }>;
type LegacyDailyReminder = Readonly<{ hour: number; minute: number; notificationId: string }>;
type LegacyNotificationSettings = Readonly<{ dailyReminder: LegacyDailyReminder | null }>;
type StoredNotificationSettings = NotificationSettings | LegacyNotificationSettings;
type PracticeReminderTarget = Readonly<{
  mode: PracticeReminderMode;
  commonTime: ReminderTime | null;
  days: readonly PracticeReminderDay[];
  trackId: TrackId;
}>;
type PracticeReminderJournal = Readonly<{
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

async function getStoredNotificationSettings(): Promise<StoredNotificationSettings | null> {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isStoredNotificationSettings);
  if (!envelope) return null;
  const normalized = normalizeStoredSettings(envelope.payload);
  if (!isSameJson(envelope.payload, normalized)) writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalized, envelope.revision);
  return normalized;
}

async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  if (!isStoredNotificationSettings(settings) || hasExactKeys(settings, ["dailyReminder"])) throw new Error("INVALID_NOTIFICATION_SETTINGS: expected canonical practice reminder settings.");
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalizeStoredSettings(settings));
}

async function getPracticeReminderJournal(): Promise<PracticeReminderJournal | null> {
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

async function savePracticeReminderJournal(journal: PracticeReminderJournal): Promise<void> {
  if (!isPracticeReminderJournal(journal) || !valueHasJournalVersion(journal)) throw new Error("INVALID_PRACTICE_REMINDER_JOURNAL: unsupported journal.");
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, normalizeJournal(journal));
}

async function clearPracticeReminderJournal(): Promise<void> {
  removeCanonicalValue(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL);
}

function isCanonicalPracticeReminder(value: unknown): value is PracticeReminder {
  return isPracticeReminder(value);
}

function isCanonicalPracticeReminderTarget(value: unknown): value is PracticeReminderTarget {
  return isPracticeReminderTarget(value);
}

function isLegacyNotificationSettings(value: StoredNotificationSettings | null): value is LegacyNotificationSettings {
  return Boolean(value && hasExactKeys(value, ["dailyReminder"]));
}

/**
 * The ODK034 record is deliberately separate from the ODK024/025 shape above.
 * Previous settings can be read as an enabled migration marker, but they never
 * provide a schedule.  Every native schedule is materialised from this record
 * and the accepted LearningPlan identity below.
 */
export const DEVICE_REMINDER_SETTINGS_VERSION = 1 as const;
export const DEVICE_REMINDER_JOURNAL_VERSION = 1 as const;

export type NotificationPlanIdentity = Readonly<{
  trackId: TrackId;
  goalRevision: number;
  planId: string;
  planRevision: number;
  storageRevision: number;
  commandId: string;
  timezone: string;
  contentVersion: string;
  contentPackagePin: ContentPackagePin;
}>;

export type DeviceReminderSlot = Readonly<{
  slotId: LearningPlanSlotId;
  day: GoalDay;
  localTime: string;
}>;

export type DeviceReminderSchedule = Readonly<DeviceReminderSlot & { notificationId: string }>;
export type DeviceReminderPendingReason = "permission_denied" | "scheduler_failure" | "concurrent_change";
export type DeviceReminderPending = Readonly<{
  commandId: string;
  expectedIdentity: NotificationPlanIdentity | null;
  enabled: boolean;
  slots: readonly DeviceReminderSlot[];
  reason: DeviceReminderPendingReason;
}>;
export type DeviceReminderSettings = Readonly<{
  schemaVersion: typeof DEVICE_REMINDER_SETTINGS_VERSION;
  enabled: boolean;
  identity: NotificationPlanIdentity | null;
  schedules: readonly DeviceReminderSchedule[];
  /** Native IDs from ODK024/025, retained only so the next reconciliation can cancel them. */
  legacyNotificationIds: readonly string[];
  pending: DeviceReminderPending | null;
}>;
export type DeviceReminderSettingsSnapshot = Readonly<{
  settings: DeviceReminderSettings;
  revision: number;
}>;
export type DeviceReminderJournal = Readonly<{
  schemaVersion: typeof DEVICE_REMINDER_JOURNAL_VERSION;
  transactionId: string;
  commandId: string;
  expectedIdentity: NotificationPlanIdentity | null;
  enabled: boolean;
  slots: readonly DeviceReminderSlot[];
  created: readonly DeviceReminderSchedule[];
  remainingOldIds: readonly string[];
}>;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimezone(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; }
}

function isContentPin(value: unknown): value is ContentPackagePin {
  if (!isRecord(value) || !hasExactKeys(value, ["packageIdentity", "packageVersion", "contentReleaseId"])) return false;
  try { createContentPackagePin(value as ContentPackagePin); return true; } catch { return false; }
}

function isNotificationIdentity(value: unknown): value is NotificationPlanIdentity {
  return isRecord(value) && hasExactKeys(value, ["trackId", "goalRevision", "planId", "planRevision", "storageRevision", "commandId", "timezone", "contentVersion", "contentPackagePin"]) &&
    isRegisteredTrackId(value.trackId as string) && isPositiveInteger(value.goalRevision) && isNonEmptyString(value.planId) &&
    isPositiveInteger(value.planRevision) && isPositiveInteger(value.storageRevision) && isNonEmptyString(value.commandId) &&
    isTimezone(value.timezone) && isNonEmptyString(value.contentVersion) && isContentPin(value.contentPackagePin);
}

function isDeviceReminderSlot(value: unknown): value is DeviceReminderSlot {
  return isRecord(value) && hasExactKeys(value, ["slotId", "day", "localTime"]) && isNonEmptyString(value.slotId) &&
    isGoalDay(value.day) && isLocalTime(value.localTime);
}

function isDeviceReminderSchedule(value: unknown): value is DeviceReminderSchedule {
  return isRecord(value) && hasExactKeys(value, ["slotId", "day", "localTime", "notificationId"]) &&
    isDeviceReminderSlot({ slotId: value.slotId, day: value.day, localTime: value.localTime }) && isNonEmptyString(value.notificationId);
}

function isDeviceReminderPending(value: unknown): value is DeviceReminderPending {
  return isRecord(value) && hasExactKeys(value, ["commandId", "expectedIdentity", "enabled", "slots", "reason"]) &&
    isNonEmptyString(value.commandId) && (value.expectedIdentity === null || isNotificationIdentity(value.expectedIdentity)) &&
    typeof value.enabled === "boolean" && Array.isArray(value.slots) && value.slots.every(isDeviceReminderSlot) &&
    new Set(value.slots.map((entry) => entry.slotId)).size === value.slots.length && new Set(value.slots.map((entry) => entry.day)).size === value.slots.length &&
    (value.reason === "permission_denied" || value.reason === "scheduler_failure" || value.reason === "concurrent_change");
}

function isDeviceReminderSettings(value: unknown): value is DeviceReminderSettings {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "enabled", "identity", "schedules", "legacyNotificationIds", "pending"]) ||
    value.schemaVersion !== DEVICE_REMINDER_SETTINGS_VERSION || typeof value.enabled !== "boolean" ||
    (value.identity !== null && !isNotificationIdentity(value.identity)) || !Array.isArray(value.schedules) ||
    !value.schedules.every(isDeviceReminderSchedule) || new Set(value.schedules.map((entry) => entry.slotId)).size !== value.schedules.length || new Set(value.schedules.map((entry) => entry.day)).size !== value.schedules.length ||
    Array.isArray(value.legacyNotificationIds) === false || !value.legacyNotificationIds.every(isNonEmptyString) || new Set(value.legacyNotificationIds).size !== value.legacyNotificationIds.length ||
    (value.pending !== null && !isDeviceReminderPending(value.pending))) return false;
  if (value.schedules.length > 0 && value.identity === null) return false;
  if (!value.enabled && (value.identity !== null || value.schedules.length > 0)) return false;
  if (value.pending !== null) {
    if (value.pending.expectedIdentity === null && value.pending.slots.length > 0) return false;
    if (value.pending.expectedIdentity !== null && value.pending.commandId !== value.pending.expectedIdentity.commandId) return false;
  }
  return true;
}

function isDeviceReminderJournal(value: unknown): value is DeviceReminderJournal {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "transactionId", "commandId", "expectedIdentity", "enabled", "slots", "created", "remainingOldIds"]) ||
    value.schemaVersion !== DEVICE_REMINDER_JOURNAL_VERSION || !isNonEmptyString(value.transactionId) || !isNonEmptyString(value.commandId) ||
    (value.expectedIdentity !== null && !isNotificationIdentity(value.expectedIdentity)) || typeof value.enabled !== "boolean" ||
    !Array.isArray(value.slots) || !value.slots.every(isDeviceReminderSlot) || new Set(value.slots.map((entry) => entry.slotId)).size !== value.slots.length || new Set(value.slots.map((entry) => entry.day)).size !== value.slots.length ||
    !Array.isArray(value.created) || !value.created.every(isDeviceReminderSchedule) ||
    new Set(value.created.map((entry) => entry.slotId)).size !== value.created.length || new Set(value.created.map((entry) => entry.day)).size !== value.created.length ||
    !Array.isArray(value.remainingOldIds) || !value.remainingOldIds.every(isNonEmptyString) || new Set(value.remainingOldIds).size !== value.remainingOldIds.length) return false;
  if (value.expectedIdentity === null) return !value.enabled && value.slots.length === 0 && value.created.length === 0;
  const slots = value.slots as DeviceReminderSlot[];
  const created = value.created as DeviceReminderSchedule[];
  return value.enabled && value.commandId === value.expectedIdentity.commandId && value.slots.length > 0 &&
    created.every((entry) => slots.some((slot) => slot.slotId === entry.slotId && slot.day === entry.day && slot.localTime === entry.localTime));
}

function normalizeIdentity(value: NotificationPlanIdentity): NotificationPlanIdentity {
  return Object.freeze({ ...value, contentPackagePin: createContentPackagePin(value.contentPackagePin) });
}

function normalizeDeviceSlot(value: DeviceReminderSlot): DeviceReminderSlot {
  return Object.freeze({ slotId: createLearningPlanSlotId(value.slotId), day: value.day, localTime: value.localTime });
}

function normalizeDeviceSlots<T extends DeviceReminderSlot>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values].sort((left, right) => dayIndex(left.day) - dayIndex(right.day)));
}

function normalizeDeviceSettings(value: DeviceReminderSettings): DeviceReminderSettings {
  return Object.freeze({
    schemaVersion: DEVICE_REMINDER_SETTINGS_VERSION,
    enabled: value.enabled,
    identity: value.identity ? normalizeIdentity(value.identity) : null,
    schedules: Object.freeze(normalizeDeviceSlots(value.schedules).map((entry) => Object.freeze({ ...normalizeDeviceSlot(entry), notificationId: entry.notificationId }))),
    legacyNotificationIds: Object.freeze([...new Set(value.legacyNotificationIds)]),
    pending: value.pending ? Object.freeze({
      commandId: value.pending.commandId,
      expectedIdentity: value.pending.expectedIdentity ? normalizeIdentity(value.pending.expectedIdentity) : null,
      enabled: value.pending.enabled,
      slots: Object.freeze(normalizeDeviceSlots(value.pending.slots).map(normalizeDeviceSlot)),
      reason: value.pending.reason,
    }) : null,
  });
}

function normalizeDeviceJournal(value: DeviceReminderJournal): DeviceReminderJournal {
  return Object.freeze({
    schemaVersion: DEVICE_REMINDER_JOURNAL_VERSION,
    transactionId: value.transactionId,
    commandId: value.commandId,
    expectedIdentity: value.expectedIdentity ? normalizeIdentity(value.expectedIdentity) : null,
    enabled: value.enabled,
    slots: Object.freeze(normalizeDeviceSlots(value.slots).map(normalizeDeviceSlot)),
    created: Object.freeze(normalizeDeviceSlots(value.created).map((entry) => Object.freeze({ ...normalizeDeviceSlot(entry), notificationId: entry.notificationId }))),
    remainingOldIds: Object.freeze([...new Set(value.remainingOldIds)]),
  });
}

type AnyNotificationSettings = StoredNotificationSettings | DeviceReminderSettings;
function isAnyNotificationSettings(value: unknown): value is AnyNotificationSettings {
  return isStoredNotificationSettings(value) || isDeviceReminderSettings(value);
}

function legacyNotificationIds(value: StoredNotificationSettings): readonly string[] {
  if (isLegacyNotificationSettings(value)) return value.dailyReminder ? Object.freeze([value.dailyReminder.notificationId]) : Object.freeze([]);
  return Object.freeze([...new Set(value.practiceReminder?.schedules.map((entry) => entry.notificationId) ?? [])]);
}

/** Reads the ODK034 record with its canonical envelope revision. */
export function getDeviceReminderSettingsSnapshot(): DeviceReminderSettingsSnapshot | null {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isAnyNotificationSettings);
  if (!envelope) return null;
  if (isDeviceReminderSettings(envelope.payload)) return Object.freeze({ settings: normalizeDeviceSettings(envelope.payload), revision: envelope.revision });
  const legacy = envelope.payload;
  const enabled = isLegacyNotificationSettings(legacy)
    ? legacy.dailyReminder !== null
    : legacy.practiceReminder !== null;
  const settings = normalizeDeviceSettings({ schemaVersion: DEVICE_REMINDER_SETTINGS_VERSION, enabled, identity: null, schedules: [], legacyNotificationIds: legacyNotificationIds(legacy), pending: null });
  const migrated = writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings, envelope.revision);
  return Object.freeze({ settings, revision: migrated.revision });
}

export function getDeviceReminderSettings(): DeviceReminderSettings | null {
  return getDeviceReminderSettingsSnapshot()?.settings ?? null;
}

export function saveDeviceReminderSettings(settings: DeviceReminderSettings, expectedRevision?: number | null): DeviceReminderSettingsSnapshot {
  if (!isDeviceReminderSettings(settings)) throw new Error("INVALID_DEVICE_REMINDER_SETTINGS: unsupported record.");
  const saved = writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalizeDeviceSettings(settings), expectedRevision);
  return Object.freeze({ settings: normalizeDeviceSettings(saved.payload), revision: saved.revision });
}

export function getDeviceReminderJournal(): DeviceReminderJournal | null {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, (value): value is DeviceReminderJournal | PracticeReminderJournal | LegacyPracticeReminderJournal => isDeviceReminderJournal(value) || isPracticeReminderJournal(value));
  if (!envelope) return null;
  if (isDeviceReminderJournal(envelope.payload)) return normalizeDeviceJournal(envelope.payload);

  // ODK024/025 journals contain no accepted-plan identity.  They can only be
  // migrated into a cancellation-only journal; their desired times/days are
  // deliberately discarded so a later retry cannot resurrect an older plan.
  const legacyIds = isPracticeReminderJournal(envelope.payload) && valueHasJournalVersion(envelope.payload)
    ? [...envelope.payload.created.map((entry) => entry.notificationId), ...envelope.payload.remainingOldIds]
    : [...envelope.payload.created.map((entry) => entry.notificationId), ...envelope.payload.remainingOldIds];
  const migrated = normalizeDeviceJournal({
    schemaVersion: DEVICE_REMINDER_JOURNAL_VERSION,
    transactionId: `legacy:${envelope.payload.transactionId}`,
    commandId: `legacy:${envelope.payload.transactionId}`,
    expectedIdentity: null,
    enabled: false,
    slots: [],
    created: [],
    remainingOldIds: [...new Set(legacyIds)],
  });
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, migrated, envelope.revision);
  return migrated;
}

export function saveDeviceReminderJournal(journal: DeviceReminderJournal): void {
  if (!isDeviceReminderJournal(journal)) throw new Error("INVALID_DEVICE_REMINDER_JOURNAL: unsupported journal.");
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, normalizeDeviceJournal(journal));
}

export function clearDeviceReminderJournal(): void {
  removeCanonicalValue(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL);
}

export function isCanonicalDeviceReminderSettings(value: unknown): value is DeviceReminderSettings { return isDeviceReminderSettings(value); }
export function isCanonicalDeviceReminderJournal(value: unknown): value is DeviceReminderJournal { return isDeviceReminderJournal(value); }

function isLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value);
}
