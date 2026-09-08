import { GOAL_DAY_IDS, type GoalDay, type TrackId } from "../domain";
import { getActiveTrackId, getGoal } from "../storage/repositories";
import {
  DEFAULT_PRACTICE_REMINDER_TIME,
  clearPracticeReminderJournal,
  getPracticeReminderJournal,
  getStoredNotificationSettings,
  isCanonicalPracticeReminderTarget,
  saveNotificationSettings,
  savePracticeReminderJournal,
  type LegacyNotificationSettings,
  type NotificationSettings,
  type PracticeReminder,
  type PracticeReminderDay,
  type PracticeReminderJournal,
  type PracticeReminderMode,
  type PracticeReminderTarget,
  type ReminderTime,
  type ScheduledPracticeReminder,
  type StoredNotificationSettings,
} from "../storage/repositories/notificationSettingsRepository";

export type {
  NotificationSettings,
  PracticeReminder,
  PracticeReminderDay,
  PracticeReminderMode,
  ReminderTime,
} from "../storage/repositories/notificationSettingsRepository";

export type NotificationPermission = "denied" | "granted" | "undetermined";
export type DailyReminderTime = ReminderTime;
export type PracticeReminderCopy = Readonly<{ body: string; title: string }>;
export type PracticeReminderDraft = Readonly<{
  mode: PracticeReminderMode;
  commonTime?: DailyReminderTime | null;
  days: readonly PracticeReminderDay[];
}>;
export type PracticeReminderScheduleDraft = PracticeReminderDraft;
export type WeeklyReminderRequest = Readonly<{
  body: string;
  day: GoalDay;
  time: DailyReminderTime;
  title: string;
  trackId: TrackId;
  transactionId: string;
}>;
export type ScheduledReminderIdentity = Readonly<{ day: GoalDay; notificationId: string }>;
export type NotificationPlatform = Readonly<{
  cancelReminder: (notificationId: string) => Promise<void>;
  getPermission: () => Promise<NotificationPermission>;
  listScheduledReminders: (transactionId: string) => Promise<readonly ScheduledReminderIdentity[]>;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleWeeklyReminder: (request: WeeklyReminderRequest) => Promise<string>;
}>;
export type ReminderGoalStatus = "active" | "missing-goal" | "missing-track" | "no-days" | "paused";
export type ReminderContext = Readonly<{
  preferredDays: readonly GoalDay[];
  status: ReminderGoalStatus;
  trackId: TrackId | null;
}>;
export type NotificationPreferencesSnapshot = Readonly<NotificationSettings & { context: ReminderContext }>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = Object.freeze({ practiceReminder: null });

export class NotificationPermissionDeniedError extends Error {
  constructor() { super("NOTIFICATION_PERMISSION_DENIED: practice reminder requires notification permission."); }
}
export class ReminderGoalUnavailableError extends Error {
  constructor(status: Exclude<ReminderGoalStatus, "active">) { super(`REMINDER_GOAL_UNAVAILABLE: ${status}.`); }
}
export class InvalidPracticeReminderDraftError extends Error {
  constructor() { super("INVALID_PRACTICE_REMINDER_DRAFT: provide one complete schedule for the current goal days."); }
}

let transactionSequence = 0;
let coordinatorTail: Promise<void> = Promise.resolve();

function coordinate<T>(operation: () => Promise<T>): Promise<T> {
  const run = coordinatorTail.then(operation, operation);
  coordinatorTail = run.then(() => undefined, () => undefined);
  return run;
}

function nextTransactionId(): string {
  transactionSequence += 1;
  return `practice-reminder-${Date.now().toString(36)}-${transactionSequence.toString(36)}`;
}

function isTime(value: unknown): value is DailyReminderTime {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2 && Number.isInteger(record.hour) && Number(record.hour) >= 0 && Number(record.hour) <= 23 &&
    Number.isInteger(record.minute) && Number(record.minute) >= 0 && Number(record.minute) <= 59;
}

function copyTime(value: DailyReminderTime): DailyReminderTime {
  return Object.freeze({ hour: value.hour, minute: value.minute });
}

function sameTime(left: DailyReminderTime | null | undefined, right: DailyReminderTime | null | undefined): boolean {
  return left?.hour === right?.hour && left?.minute === right?.minute;
}

function dayIndex(day: GoalDay): number {
  return GOAL_DAY_IDS.indexOf(day);
}

function orderDays<T extends { day: GoalDay }>(days: readonly T[]): readonly T[] {
  return Object.freeze([...days].sort((left, right) => dayIndex(left.day) - dayIndex(right.day)));
}

function orderGoalDays(days: readonly GoalDay[]): readonly GoalDay[] {
  return Object.freeze(GOAL_DAY_IDS.filter((day) => days.includes(day)));
}

function daySetEqual(left: readonly GoalDay[], right: readonly GoalDay[]): boolean {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every((day) => leftSet.has(day));
}

function normalizeDraft(context: ReminderContext, draft: PracticeReminderDraft): PracticeReminderTarget {
  if (!context.trackId || typeof draft !== "object" || draft === null || Array.isArray(draft) ||
    (draft.mode !== "same-time" && draft.mode !== "by-day") || !Array.isArray(draft.days)) throw new InvalidPracticeReminderDraftError();
  const days = orderDays(draft.days.map((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry) || !GOAL_DAY_IDS.includes(entry.day) || !isTime(entry.time)) throw new InvalidPracticeReminderDraftError();
    return Object.freeze({ day: entry.day, time: copyTime(entry.time) });
  }));
  if (new Set(days.map((entry) => entry.day)).size !== days.length || !daySetEqual(days.map((entry) => entry.day), context.status === "active" ? context.preferredDays : [])) throw new InvalidPracticeReminderDraftError();
  const commonTime = draft.mode === "same-time" ? (isTime(draft.commonTime) ? copyTime(draft.commonTime) : null) : null;
  if (draft.mode === "same-time" && !commonTime) throw new InvalidPracticeReminderDraftError();
  if (draft.mode === "by-day" && draft.commonTime !== undefined && draft.commonTime !== null) throw new InvalidPracticeReminderDraftError();
  if (draft.mode === "same-time" && !days.every((entry) => sameTime(entry.time, commonTime))) throw new InvalidPracticeReminderDraftError();
  const target: PracticeReminderTarget = Object.freeze({ mode: draft.mode, commonTime, days, trackId: context.trackId });
  if (!isCanonicalPracticeReminderTarget(target)) throw new InvalidPracticeReminderDraftError();
  return target;
}

export function formatDailyReminderTime({ hour, minute }: DailyReminderTime): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function parseDailyReminderTime(value: string): DailyReminderTime {
  const normalized = value.trim();
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/u.exec(normalized);
  if (!match) throw new Error("INVALID_PRACTICE_REMINDER_TIME: use HH:MM in 24-hour time.");
  const [hour, minute] = normalized.split(":").map(Number);
  return { hour: hour!, minute: minute! };
}

export async function requestNotificationPermission(platform: NotificationPlatform): Promise<NotificationPermission> {
  const current = await platform.getPermission();
  return current === "undetermined" ? await platform.requestPermission() : current;
}

export async function loadReminderContext(): Promise<ReminderContext> {
  const trackId = await getActiveTrackId();
  if (!trackId) return { preferredDays: Object.freeze([]), status: "missing-track", trackId: null };
  const goal = await getGoal(trackId);
  if (!goal) return { preferredDays: Object.freeze([]), status: "missing-goal", trackId };
  if (goal.status === "paused") return { preferredDays: Object.freeze([]), status: "paused", trackId };
  if (goal.preferredDays.length === 0) return { preferredDays: Object.freeze([]), status: "no-days", trackId };
  return { preferredDays: orderGoalDays(goal.preferredDays), status: "active", trackId };
}

export async function loadNotificationPreferences(): Promise<NotificationSettings> {
  const stored = await getStoredNotificationSettings();
  return stored && "practiceReminder" in stored ? stored : DEFAULT_NOTIFICATION_SETTINGS;
}

export function legacyReminderTime(stored: StoredNotificationSettings | null): DailyReminderTime | null {
  if (!stored) return null;
  if ("dailyReminder" in stored) return stored.dailyReminder ? copyTime(stored.dailyReminder) : null;
  return stored.practiceReminder?.mode === "same-time" && stored.practiceReminder.commonTime
    ? copyTime(stored.practiceReminder.commonTime)
    : null;
}

function oldNotificationIds(stored: StoredNotificationSettings | null): readonly string[] {
  if (!stored) return Object.freeze([]);
  if ("dailyReminder" in stored) return stored.dailyReminder ? Object.freeze([stored.dailyReminder.notificationId]) : Object.freeze([]);
  return Object.freeze([...new Set(stored.practiceReminder?.schedules.map((entry) => entry.notificationId) ?? [])]);
}

function targetFromStored(context: ReminderContext, stored: StoredNotificationSettings): PracticeReminderTarget {
  if (!context.trackId) throw new ReminderGoalUnavailableError("missing-track");
  const legacyTime = legacyReminderTime(stored);
  if ("dailyReminder" in stored) {
    if (!legacyTime) throw new Error("INVALID_NOTIFICATION_SETTINGS: legacy reminder time is unavailable.");
    return Object.freeze({
      mode: "same-time",
      commonTime: legacyTime,
      days: Object.freeze((context.status === "active" ? orderGoalDays(context.preferredDays) : []).map((day) => Object.freeze({ day, time: legacyTime }))),
      trackId: context.trackId,
    });
  }
  const reminder = stored.practiceReminder;
  if (!reminder) throw new Error("INVALID_NOTIFICATION_SETTINGS: practice reminder is unavailable.");
  const activeDays = context.status === "active" ? orderGoalDays(context.preferredDays) : Object.freeze([] as GoalDay[]);
  if (reminder.mode === "same-time") {
    const commonTime = copyTime(reminder.commonTime!);
    return Object.freeze({
      mode: "same-time",
      commonTime,
      days: Object.freeze(activeDays.map((day) => Object.freeze({ day, time: commonTime }))),
      trackId: context.trackId,
    });
  }
  const existingByDay = new Map(reminder.schedules.map((entry) => [entry.day, entry.time] as const));
  const donor = orderDays(reminder.schedules).find((entry) => isTime(entry.time))?.time;
  const fallback = copyTime(DEFAULT_PRACTICE_REMINDER_TIME);
  return Object.freeze({
    mode: "by-day",
    commonTime: null,
    days: Object.freeze(activeDays.map((day) => Object.freeze({ day, time: copyTime(existingByDay.get(day) ?? donor ?? fallback) }))),
    trackId: context.trackId,
  });
}

function sameSchedule(reminder: PracticeReminder | null, target: PracticeReminderTarget): boolean {
  if (!reminder || reminder.trackId !== target.trackId || reminder.mode !== target.mode || !sameTime(reminder.commonTime, target.commonTime)) return false;
  const currentDays = orderDays(reminder.schedules);
  const targetDays = orderDays(target.days);
  return currentDays.length === targetDays.length && currentDays.every((entry, index) => entry.day === targetDays[index]?.day && sameTime(entry.time, targetDays[index]?.time));
}

async function persistJournal(journal: PracticeReminderJournal): Promise<void> {
  await savePracticeReminderJournal(Object.freeze({
    ...journal,
    created: Object.freeze([...journal.created]),
    remainingOldIds: Object.freeze([...journal.remainingOldIds]),
  }));
}

function targetTime(target: PracticeReminderTarget | null, day: GoalDay): DailyReminderTime | null {
  return target?.days.find((entry) => entry.day === day)?.time ?? (target?.mode === "same-time" ? target.commonTime : null);
}

function candidateKey(entry: ScheduledPracticeReminder): string {
  return `${entry.day}\u0000${entry.notificationId}`;
}

async function recoverJournal(platform: NotificationPlatform, copy: PracticeReminderCopy): Promise<void> {
  let journal = await getPracticeReminderJournal();
  if (!journal) return;

  const desired = journal.desired;
  const desiredByDay = new Map(desired?.days.map((entry) => [entry.day, entry]));
  const discovered = await platform.listScheduledReminders(journal.transactionId);
  const candidates = new Map<string, ScheduledPracticeReminder>();
  const discoveredIds = new Set(discovered.map((entry) => entry.notificationId));
  for (const entry of journal.created) if (discoveredIds.has(entry.notificationId)) candidates.set(candidateKey(entry), entry);
  for (const entry of discovered) {
    const time = targetTime(desired, entry.day) ?? DEFAULT_PRACTICE_REMINDER_TIME;
    candidates.set(candidateKey({ day: entry.day, time, notificationId: entry.notificationId }), Object.freeze({ day: entry.day, time: copyTime(time), notificationId: entry.notificationId }));
  }

  const candidatesById = new Map<string, ScheduledPracticeReminder[]>();
  for (const entry of candidates.values()) candidatesById.set(entry.notificationId, [...(candidatesById.get(entry.notificationId) ?? []), entry]);
  const keptByDay = new Map<GoalDay, ScheduledPracticeReminder>();
  const duplicateIds = new Set<string>();
  for (const [notificationId, entries] of candidatesById) {
    if (entries.length !== 1) {
      duplicateIds.add(notificationId);
      continue;
    }
    const entry = entries[0]!;
    const expected = desiredByDay.get(entry.day);
    if (!expected || !sameTime(entry.time, expected.time) || keptByDay.has(entry.day)) duplicateIds.add(notificationId);
    else keptByDay.set(entry.day, entry);
  }
  for (const notificationId of duplicateIds) {
    await platform.cancelReminder(notificationId);
    journal = { ...journal, created: Object.freeze(journal.created.filter((entry) => entry.notificationId !== notificationId)) };
    await persistJournal(journal);
  }
  journal = { ...journal, created: Object.freeze([...keptByDay.values()]) };
  await persistJournal(journal);

  if (desired) {
    for (const targetDay of desired.days) {
      if (keptByDay.has(targetDay.day)) continue;
      const notificationId = await platform.scheduleWeeklyReminder({
        ...copy,
        day: targetDay.day,
        time: copyTime(targetDay.time),
        trackId: desired.trackId,
        transactionId: journal.transactionId,
      });
      const entry = Object.freeze({ day: targetDay.day, time: copyTime(targetDay.time), notificationId });
      keptByDay.set(targetDay.day, entry);
      journal = { ...journal, created: Object.freeze([...keptByDay.values()]) };
      await persistJournal(journal);
    }
  }

  const createdIds = new Set([...keptByDay.values()].map((entry) => entry.notificationId));
  for (const notificationId of [...journal.remainingOldIds]) {
    if (createdIds.has(notificationId)) {
      journal = { ...journal, remainingOldIds: Object.freeze(journal.remainingOldIds.filter((id) => id !== notificationId)) };
      await persistJournal(journal);
      continue;
    }
    await platform.cancelReminder(notificationId);
    journal = { ...journal, remainingOldIds: Object.freeze(journal.remainingOldIds.filter((id) => id !== notificationId)) };
    await persistJournal(journal);
  }

  const practiceReminder = desired ? Object.freeze({
    mode: desired.mode,
    commonTime: desired.mode === "same-time" ? copyTime(desired.commonTime!) : null,
    schedules: Object.freeze(desired.days.map(({ day, time }) => Object.freeze({ day, time: copyTime(time), notificationId: keptByDay.get(day)!.notificationId }))),
    trackId: desired.trackId,
    transactionId: journal.transactionId,
  }) : null;
  await saveNotificationSettings({ practiceReminder });
  await clearPracticeReminderJournal();
}

async function transact(
  platform: NotificationPlatform,
  copy: PracticeReminderCopy,
  stored: StoredNotificationSettings | null,
  desired: PracticeReminderTarget | null,
): Promise<void> {
  const journal: PracticeReminderJournal = Object.freeze({
    version: 2,
    created: Object.freeze([]),
    desired,
    remainingOldIds: oldNotificationIds(stored),
    transactionId: nextTransactionId(),
  });
  await persistJournal(journal);
  await recoverJournal(platform, copy);
}

async function reconcileLatest(platform: NotificationPlatform, copy: PracticeReminderCopy): Promise<NotificationPreferencesSnapshot> {
  await recoverJournal(platform, copy);
  const context = await loadReminderContext();
  const stored = await getStoredNotificationSettings();
  if (stored && ("dailyReminder" in stored ? stored.dailyReminder : stored.practiceReminder)) {
    if (context.status === "missing-track") {
      await transact(platform, copy, stored, null);
      return { ...(await loadNotificationPreferences()), context };
    }
    const desired = targetFromStored(context, stored);
    const current = stored && "practiceReminder" in stored ? stored.practiceReminder : null;
    if (!sameSchedule(current, desired)) await transact(platform, copy, stored, desired);
  } else if (stored && "dailyReminder" in stored) {
    await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
  }
  return { ...(await loadNotificationPreferences()), context };
}

export function reconcilePracticeReminder(platform: NotificationPlatform, copy: PracticeReminderCopy): Promise<NotificationPreferencesSnapshot> {
  return coordinate(() => reconcileLatest(platform, copy));
}

export function savePracticeReminder(
  platform: NotificationPlatform,
  draft: PracticeReminderDraft,
  copy: PracticeReminderCopy,
): Promise<NotificationPreferencesSnapshot> {
  return coordinate(async () => {
    const permission = await requestNotificationPermission(platform);
    if (permission !== "granted") throw new NotificationPermissionDeniedError();
    await recoverJournal(platform, copy);
    const context = await loadReminderContext();
    if (context.status !== "active") throw new ReminderGoalUnavailableError(context.status);
    const stored = await getStoredNotificationSettings();
    const desired = normalizeDraft(context, draft);
    await transact(platform, copy, stored, desired);
    return { ...(await loadNotificationPreferences()), context };
  });
}

export function disablePracticeReminder(platform: NotificationPlatform, copy: PracticeReminderCopy): Promise<NotificationPreferencesSnapshot> {
  return coordinate(async () => {
    await recoverJournal(platform, copy);
    const stored = await getStoredNotificationSettings();
    if (stored && ("dailyReminder" in stored ? stored.dailyReminder : stored.practiceReminder)) await transact(platform, copy, stored, null);
    return { ...(await loadNotificationPreferences()), context: await loadReminderContext() };
  });
}

export function isLegacyNotificationSettings(value: StoredNotificationSettings | null): value is LegacyNotificationSettings {
  return Boolean(value && "dailyReminder" in value);
}
