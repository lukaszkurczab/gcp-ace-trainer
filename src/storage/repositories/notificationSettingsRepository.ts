import { GOAL_DAY_IDS, createArtifactSha256, createLearningPlanSlotId, isArtifactSha256, isRegisteredTrackId, type GoalDay, type LearningPlanSlotId, type TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

function dayIndex(day: GoalDay): number {
  return GOAL_DAY_IDS.indexOf(day);
}

function isGoalDay(value: unknown): value is GoalDay {
  return GOAL_DAY_IDS.includes(value as GoalDay);
}

/** Current device-local reminder persistence. Older practice/daily shapes are unsupported. */
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
  artifactSha256: string;
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
  /** Native IDs retained for cancellation after an uncertain current-plan cleanup. */
  legacyNotificationIds: readonly string[];
  pending: DeviceReminderPending | null;
}>;
export type DeviceReminderSettingsSnapshot = Readonly<{
  settings: DeviceReminderSettings;
  revision: number;
}>;
export type ReminderPreferencesForExport = Readonly<{
  revision: number | null;
  preferences: Readonly<{
    kind: "device";
    enabled: boolean;
    schedules: readonly Readonly<{ day: GoalDay; localTime: string }>[];
    pending: Readonly<{ enabled: boolean; slots: readonly Readonly<{ day: GoalDay; localTime: string }>[]; reason: DeviceReminderPendingReason }> | null;
  }> | null;
  hasPendingJournal: boolean;
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
export type CanonicalNotificationSettingsJournal = DeviceReminderJournal;

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

function isNotificationIdentity(value: unknown): value is NotificationPlanIdentity {
  return isRecord(value) && hasExactKeys(value, ["trackId", "goalRevision", "planId", "planRevision", "storageRevision", "commandId", "timezone", "contentVersion", "artifactSha256"]) &&
    typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) && isPositiveInteger(value.goalRevision) && isNonEmptyString(value.planId) &&
    isPositiveInteger(value.planRevision) && isPositiveInteger(value.storageRevision) && isNonEmptyString(value.commandId) &&
    isTimezone(value.timezone) && isNonEmptyString(value.contentVersion) && isArtifactSha256(value.artifactSha256);
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
  return Object.freeze({ ...value, artifactSha256: createArtifactSha256(value.artifactSha256) });
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

/** Pure owner guards for inventory/preflight callers; they never normalize or write. */
export function isCanonicalNotificationSettings(value: unknown): boolean {
  return isDeviceReminderSettings(value);
}

export function isCanonicalNotificationSettingsJournal(value: unknown): value is CanonicalNotificationSettingsJournal {
  return isDeviceReminderJournal(value);
}

/** Pure export projection: no legacy migration, scheduler IDs, transaction IDs, or journal payload. */
export function readReminderPreferencesForExport(): ReminderPreferencesForExport {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isDeviceReminderSettings);
  const journal = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, isCanonicalNotificationSettingsJournal);
  if (!envelope) return Object.freeze({ revision: null, preferences: null, hasPendingJournal: journal !== null });

  const stored = envelope.payload;
  const preferences = Object.freeze({
    kind: "device" as const,
    enabled: stored.enabled,
    schedules: Object.freeze(normalizeDeviceSlots(stored.schedules).map((entry) => Object.freeze({ day: entry.day, localTime: entry.localTime }))),
    pending: stored.pending ? Object.freeze({
      enabled: stored.pending.enabled,
      slots: Object.freeze(normalizeDeviceSlots(stored.pending.slots).map((entry) => Object.freeze({ day: entry.day, localTime: entry.localTime }))),
      reason: stored.pending.reason,
    }) : null,
  });
  return Object.freeze({ revision: envelope.revision, preferences, hasPendingJournal: journal !== null });
}

/** Reads the current device reminder record without migrating or rewriting it. */
export function getDeviceReminderSettingsSnapshot(): DeviceReminderSettingsSnapshot | null {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isDeviceReminderSettings);
  if (!envelope) return null;
  return Object.freeze({ settings: normalizeDeviceSettings(envelope.payload), revision: envelope.revision });
}

export function getDeviceReminderSettings(): DeviceReminderSettings | null {
  return getDeviceReminderSettingsSnapshot()?.settings ?? null;
}

export function saveDeviceReminderSettings(settings: DeviceReminderSettings, expectedRevision?: number | null): DeviceReminderSettingsSnapshot {
  if (!isDeviceReminderSettings(settings)) throw new Error("INVALID_DEVICE_REMINDER_SETTINGS: unsupported record.");
  readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, isDeviceReminderSettings);
  const saved = writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, normalizeDeviceSettings(settings), expectedRevision);
  return Object.freeze({ settings: normalizeDeviceSettings(saved.payload), revision: saved.revision });
}

export function getDeviceReminderJournal(): DeviceReminderJournal | null {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, isDeviceReminderJournal);
  if (!envelope) return null;
  return normalizeDeviceJournal(envelope.payload);
}

export function saveDeviceReminderJournal(journal: DeviceReminderJournal): void {
  if (!isDeviceReminderJournal(journal)) throw new Error("INVALID_DEVICE_REMINDER_JOURNAL: unsupported journal.");
  readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, isDeviceReminderJournal);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, normalizeDeviceJournal(journal));
}

export function clearDeviceReminderJournal(): void {
  if (!getDeviceReminderJournal()) return;
  removeCanonicalValue(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL);
}

/** Preflights both durable reminder records before any permission or native scheduler side effect. */
export function assertCurrentDeviceReminderRecords(): void {
  getDeviceReminderSettingsSnapshot();
  getDeviceReminderJournal();
}

export function isCanonicalDeviceReminderSettings(value: unknown): value is DeviceReminderSettings { return isDeviceReminderSettings(value); }
export function isCanonicalDeviceReminderJournal(value: unknown): value is DeviceReminderJournal { return isDeviceReminderJournal(value); }

function isLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value);
}
