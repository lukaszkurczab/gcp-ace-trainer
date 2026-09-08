import type { GoalDay, TrackId } from "../domain";
import { getActiveTrackId, getGoal } from "../storage/repositories";
import {
  clearPracticeReminderJournal,
  getPracticeReminderJournal,
  getStoredNotificationSettings,
  saveNotificationSettings,
  savePracticeReminderJournal,
  type LegacyNotificationSettings,
  type NotificationSettings,
  type PracticeReminder,
  type PracticeReminderJournal,
  type PracticeReminderTarget,
  type ScheduledPracticeReminder,
  type StoredNotificationSettings,
} from "../storage/repositories/notificationSettingsRepository";

export type { NotificationSettings, PracticeReminder } from "../storage/repositories/notificationSettingsRepository";

export type NotificationPermission = "denied" | "granted" | "undetermined";
export type DailyReminderTime = Readonly<{ hour: number; minute: number }>;
export type PracticeReminderCopy = Readonly<{ body: string; title: string }>;
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
export type ReminderGoalStatus = "active" | "missing-goal" | "missing-track" | "paused";
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

export function formatDailyReminderTime({ hour, minute }: DailyReminderTime): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function parseDailyReminderTime(value: string): DailyReminderTime {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value.trim());
  if (!match) throw new Error("INVALID_PRACTICE_REMINDER_TIME: use HH:MM in 24-hour time.");
  const [hour, minute] = value.split(":").map(Number);
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
  return { preferredDays: goal.preferredDays, status: "active", trackId };
}

export async function loadNotificationPreferences(): Promise<NotificationSettings> {
  const stored = await getStoredNotificationSettings();
  return stored && "practiceReminder" in stored ? stored : DEFAULT_NOTIFICATION_SETTINGS;
}

export function legacyReminderTime(stored: StoredNotificationSettings | null): DailyReminderTime | null {
  if (!stored || !("dailyReminder" in stored) || !stored.dailyReminder) return null;
  return { hour: stored.dailyReminder.hour, minute: stored.dailyReminder.minute };
}

function reminderTime(stored: StoredNotificationSettings | null): DailyReminderTime | null {
  if (!stored) return null;
  if ("dailyReminder" in stored) return legacyReminderTime(stored);
  return stored.practiceReminder ? { hour: stored.practiceReminder.hour, minute: stored.practiceReminder.minute } : null;
}

function oldNotificationIds(stored: StoredNotificationSettings | null): readonly string[] {
  if (!stored) return Object.freeze([]);
  if ("dailyReminder" in stored) return stored.dailyReminder ? Object.freeze([stored.dailyReminder.notificationId]) : Object.freeze([]);
  return Object.freeze(stored.practiceReminder?.schedules.map((entry) => entry.notificationId) ?? []);
}

function targetFor(context: ReminderContext, time: DailyReminderTime): PracticeReminderTarget {
  if (!context.trackId) throw new ReminderGoalUnavailableError("missing-track");
  return Object.freeze({ days: context.status === "active" ? context.preferredDays : Object.freeze([]), ...time, trackId: context.trackId });
}

function sameSchedule(reminder: PracticeReminder | null, target: PracticeReminderTarget): boolean {
  if (!reminder || reminder.trackId !== target.trackId || reminder.hour !== target.hour || reminder.minute !== target.minute) return false;
  const currentDays = reminder.schedules.map((entry) => entry.day).sort();
  const targetDays = [...target.days].sort();
  return currentDays.length === targetDays.length && currentDays.every((day, index) => day === targetDays[index]);
}

async function persistJournal(journal: PracticeReminderJournal): Promise<void> {
  await savePracticeReminderJournal(Object.freeze({
    ...journal,
    created: Object.freeze([...journal.created]),
    remainingOldIds: Object.freeze([...journal.remainingOldIds]),
  }));
}

async function recoverJournal(platform: NotificationPlatform, copy: PracticeReminderCopy): Promise<void> {
  let journal = await getPracticeReminderJournal();
  if (!journal) return;

  const discovered = await platform.listScheduledReminders(journal.transactionId);
  const createdByDay = new Map<GoalDay, ScheduledPracticeReminder>();
  const duplicateIds: string[] = [];
  for (const entry of [...journal.created, ...discovered]) {
    const existing = createdByDay.get(entry.day);
    if (existing && existing.notificationId !== entry.notificationId) duplicateIds.push(entry.notificationId);
    else createdByDay.set(entry.day, entry);
  }
  for (const notificationId of duplicateIds) await platform.cancelReminder(notificationId);
  journal = { ...journal, created: Object.freeze([...createdByDay.values()]) };
  await persistJournal(journal);

  if (journal.desired) {
    const desired = journal.desired;
    for (const day of desired.days) {
      if (createdByDay.has(day)) continue;
      const notificationId = await platform.scheduleWeeklyReminder({
        ...copy,
        day,
        time: { hour: desired.hour, minute: desired.minute },
        trackId: desired.trackId,
        transactionId: journal.transactionId,
      });
      const entry = Object.freeze({ day, notificationId });
      createdByDay.set(day, entry);
      journal = { ...journal, created: Object.freeze([...createdByDay.values()]) };
      await persistJournal(journal);
    }
  }

  for (const notificationId of [...journal.remainingOldIds]) {
    await platform.cancelReminder(notificationId);
    journal = { ...journal, remainingOldIds: Object.freeze(journal.remainingOldIds.filter((id) => id !== notificationId)) };
    await persistJournal(journal);
  }

  const practiceReminder = journal.desired ? Object.freeze({
    hour: journal.desired.hour,
    minute: journal.desired.minute,
    schedules: Object.freeze(journal.desired.days.map((day) => createdByDay.get(day)!).filter(Boolean)),
    trackId: journal.desired.trackId,
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
  const time = reminderTime(stored);
  if (time) {
    const desired = targetFor(context, time);
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
  time: DailyReminderTime,
  copy: PracticeReminderCopy,
): Promise<NotificationPreferencesSnapshot> {
  return coordinate(async () => {
    const permission = await requestNotificationPermission(platform);
    if (permission !== "granted") throw new NotificationPermissionDeniedError();
    await recoverJournal(platform, copy);
    const context = await loadReminderContext();
    if (context.status !== "active") throw new ReminderGoalUnavailableError(context.status);
    const stored = await getStoredNotificationSettings();
    await transact(platform, copy, stored, targetFor(context, time));
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
