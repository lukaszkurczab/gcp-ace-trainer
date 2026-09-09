import { contentPackagePinsEqual, createContentPackagePin, type ContentPackagePin, type GoalDay, type GoalSnapshot, type LearningPlan, type LearningPlanSnapshot, type TrackId } from "../domain";
import { getActiveTrackId, getGoalSnapshot, getLearningPlanSnapshot } from "../storage/repositories";
import { contentPackageRuntimeOwner, type ResolvedPackageRuntime } from "./contentPackageRuntimeOwner";
import {
  clearDeviceReminderJournal,
  getDeviceReminderJournal,
  getDeviceReminderSettingsSnapshot,
  saveDeviceReminderJournal,
  saveDeviceReminderSettings,
  type DeviceReminderJournal,
  type DeviceReminderPendingReason,
  type DeviceReminderSchedule,
  type DeviceReminderSettings,
  type DeviceReminderSlot,
  type NotificationPlanIdentity,
} from "../storage/repositories/notificationSettingsRepository";
export type { NotificationPlanIdentity } from "../storage/repositories/notificationSettingsRepository";

export type NotificationPermission = "denied" | "granted" | "undetermined";
export type DailyReminderTime = Readonly<{ hour: number; minute: number }>;
export type PracticeReminderCopy = Readonly<{ body: string; title: string }>;
export type WeeklyReminderRequest = Readonly<{
  body: string;
  commandId?: string;
  day: GoalDay;
  identity?: NotificationPlanIdentity;
  localTime?: string;
  slotId?: string;
  time: DailyReminderTime;
  title: string;
  trackId: TrackId;
  transactionId: string;
}>;
export type ScheduledReminderIdentity = Readonly<{
  commandId?: string;
  day: GoalDay;
  identity?: NotificationPlanIdentity;
  localTime?: string;
  notificationId: string;
  slotId?: string;
}>;
export type NotificationPlatform = Readonly<{
  cancelReminder: (notificationId: string) => Promise<void>;
  getPermission: () => Promise<NotificationPermission>;
  listScheduledReminders: (transactionId: string) => Promise<readonly ScheduledReminderIdentity[]>;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleWeeklyReminder: (request: WeeklyReminderRequest) => Promise<string>;
}>;
export async function requestNotificationPermission(platform: NotificationPlatform): Promise<NotificationPermission> {
  const current = await platform.getPermission();
  return current === "undetermined" ? await platform.requestPermission() : current;
}

// ---------------------------------------------------------------------------
// ODK034: LearningPlan-owned device reminders
// ---------------------------------------------------------------------------

export type LearningPlanReminderFailure =
  | "missing_track"
  | "missing_goal"
  | "missing_plan"
  | "identity_mismatch"
  | "goal_paused"
  | "plan_paused"
  | "plan_completed"
  | "no_slots"
  | "timezone_mismatch"
  | "permission_denied"
  | "scheduler_failure"
  | "concurrent_change";

export type LearningPlanReminderResult =
  | Readonly<{
    kind: "synced";
    status: "synced";
    identity: NotificationPlanIdentity;
    schedules: readonly DeviceReminderSchedule[];
  }>
  | Readonly<{ kind: "disabled"; status: "disabled" }>
  | Readonly<{
    kind: LearningPlanReminderFailure;
    status: "cleared" | "pending";
    commandId?: string;
    identity?: NotificationPlanIdentity;
  }>;

/**
 * Identity captured by a plan mutation.  Retries must use this identity rather
 * than silently switching to whichever track happens to be active later.
 */
export type LearningPlanReminderExpectation = Readonly<{
  trackId: TrackId;
  identity: NotificationPlanIdentity;
}>;

export type LearningPlanReminderExpectedIdentity = NotificationPlanIdentity | LearningPlanReminderExpectation;

export type LearningPlanReminderPackage = Readonly<{
  trackId: TrackId;
  contentVersion: string;
  packagePin: ContentPackagePin;
}> | ResolvedPackageRuntime;

export type LearningPlanReminderDependencies = Readonly<{
  getActiveTrackId(): Awaitable<TrackId | null>;
  getDeviceTimezone(): string;
  getGoalSnapshot(trackId: TrackId): Awaitable<GoalSnapshot | null>;
  getLearningPlanSnapshot(trackId: TrackId): Awaitable<LearningPlanSnapshot | null>;
  resolveExact(pin: ContentPackagePin): Promise<LearningPlanReminderPackage>;
}>;

type Awaitable<T> = T | Promise<T>;
type ReminderPackageIdentity = Readonly<{
  trackId: TrackId;
  contentVersion: string;
  packagePin: ContentPackagePin;
}>;
type ReadyReminderSource = Readonly<{
  goal: GoalSnapshot;
  identity: NotificationPlanIdentity;
  planSnapshot: LearningPlanSnapshot;
  slots: readonly DeviceReminderSlot[];
  timezone: string;
}>;

type ReminderSourceRead = Readonly<
  | ({ kind: "ready" } & ReadyReminderSource)
  | { kind: Exclude<LearningPlanReminderFailure, "permission_denied" | "scheduler_failure" | "concurrent_change"> }
  | { kind: "concurrent_change"; expectedIdentity: NotificationPlanIdentity }
>;

const DEFAULT_REMINDER_COPY: PracticeReminderCopy = Object.freeze({
  body: "A learning plan session is scheduled.",
  title: "Scheduled learning session",
});

let learningPlanReminderCoordinatorTail: Promise<void> = Promise.resolve();

function serializeReminderOperation<T>(operation: () => Promise<T>): Promise<T> {
  const run = learningPlanReminderCoordinatorTail.then(operation, operation);
  learningPlanReminderCoordinatorTail = run.then(() => undefined, () => undefined);
  return run;
}

function nextLocalTime(value: string): DailyReminderTime | null {
  const match = /^(?:[01]\d|2[0-3]):([0-5]\d)$/u.exec(value);
  if (!match) return null;
  return { hour: Number(value.slice(0, 2)), minute: Number(match[1]) };
}

function sameReminderSlot(left: DeviceReminderSlot, right: DeviceReminderSlot): boolean {
  return left.slotId === right.slotId && left.day === right.day && left.localTime === right.localTime;
}

function sameReminderIdentity(left: NotificationPlanIdentity | null, right: NotificationPlanIdentity | null): boolean {
  try {
    return Boolean(left && right && left.trackId === right.trackId && left.goalRevision === right.goalRevision &&
      left.planId === right.planId && left.planRevision === right.planRevision && left.storageRevision === right.storageRevision &&
      left.commandId === right.commandId && left.timezone === right.timezone && left.contentVersion === right.contentVersion &&
      contentPackagePinsEqual(left.contentPackagePin, right.contentPackagePin));
  } catch {
    return false;
  }
}

function freezeReminderResult<T extends object>(value: T): Readonly<T> { return Object.freeze(value); }

function sourceFailureResult(kind: Exclude<LearningPlanReminderFailure, "permission_denied" | "scheduler_failure" | "concurrent_change">, identity?: NotificationPlanIdentity): LearningPlanReminderResult {
  return freezeReminderResult({ kind, status: "cleared" as const, ...(identity ? { identity } : {}) });
}

function currentPlanIdentity(
  planSnapshot: LearningPlanSnapshot,
  goal: GoalSnapshot,
  timezone: string,
  packageContext: ReminderPackageIdentity,
): NotificationPlanIdentity {
  return Object.freeze({
    trackId: planSnapshot.plan.trackId,
    goalRevision: goal.revision,
    planId: planSnapshot.plan.planId,
    planRevision: planSnapshot.plan.planRevision,
    storageRevision: planSnapshot.revision,
    commandId: planSnapshot.plan.commandId,
    timezone,
    contentVersion: packageContext.contentVersion,
    contentPackagePin: createContentPackagePin(packageContext.packagePin),
  });
}

function packageIdentity(value: LearningPlanReminderPackage): ReminderPackageIdentity {
  if ("package" in value) return Object.freeze({ trackId: value.package.trackId, contentVersion: value.package.contentVersion, packagePin: value.package.packagePin });
  return value;
}

function slotsFromPlan(plan: LearningPlan): readonly DeviceReminderSlot[] {
  return Object.freeze(plan.slots.map((slot) => Object.freeze({ slotId: slot.slotId, day: slot.day, localTime: slot.localTime })));
}

function sameReminderSlots(left: readonly DeviceReminderSlot[], right: readonly DeviceReminderSlot[]): boolean {
  return left.length === right.length && left.every((slot, index) => {
    const other = right[index];
    return other !== undefined && sameReminderSlot(slot, other);
  });
}

function sameReadyReminderSource(left: ReadyReminderSource, right: ReadyReminderSource): boolean {
  return left.planSnapshot.revision === right.planSnapshot.revision &&
    sameReminderIdentity(left.identity, right.identity) &&
    sameReminderSlots(left.slots, right.slots);
}

function defaultLearningPlanReminderDependencies(): LearningPlanReminderDependencies {
  return {
    getActiveTrackId,
    getDeviceTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    getGoalSnapshot,
    getLearningPlanSnapshot,
    resolveExact: (pin) => contentPackageRuntimeOwner.resolveExact(pin),
  };
}

export class LearningPlanReminderCoordinator {
  constructor(private readonly dependencies: LearningPlanReminderDependencies = defaultLearningPlanReminderDependencies()) {}

  reconcile(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, expected?: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult> {
    return serializeReminderOperation(() => this.reconcileLatest(platform, copy, normalizeExpectedIdentity(expected)));
  }

  enable(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, expected?: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult> {
    return serializeReminderOperation(() => this.enableLatest(platform, copy, normalizeExpectedIdentity(expected)));
  }

  disable(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY): Promise<LearningPlanReminderResult> {
    return serializeReminderOperation(async () => {
      const source = await this.readSource();
      const cancellation = await this.cancelAll(platform);
      if (!cancellation.ok) {
        if (source.kind === "ready") await this.persistPending(source, "scheduler_failure");
        else await this.persistGenericPending("scheduler_failure");
        return this.pendingResult("scheduler_failure", source.kind === "ready" ? source : undefined);
      }
      try {
        const current = getDeviceReminderSettingsSnapshot();
        if (current) saveDeviceReminderSettings({ schemaVersion: 1, enabled: false, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, current.revision);
        return freezeReminderResult({ kind: "disabled" as const, status: "disabled" as const });
      } catch {
        return this.pendingResult("scheduler_failure", source.kind === "ready" ? source : undefined);
      }
    });
  }

  retry(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, expected?: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult> {
    return serializeReminderOperation(async () => {
      let persisted: NotificationPlanIdentity | undefined;
      if (!expected) {
        try { persisted = getDeviceReminderSettingsSnapshot()?.settings.pending?.expectedIdentity ?? undefined; } catch { persisted = undefined; }
      }
      return this.enableLatest(platform, copy, normalizeExpectedIdentity(expected ?? persisted));
    });
  }

  private async enableLatest(platform: NotificationPlatform, copy: PracticeReminderCopy, expected?: NotificationPlanIdentity): Promise<LearningPlanReminderResult> {
    const source = await this.readSource(expected);
    if (source.kind === "concurrent_change") {
      await this.persistPendingIdentity(source.expectedIdentity, "concurrent_change");
      return this.pendingResult("concurrent_change", undefined, source.expectedIdentity);
    }
    if (source.kind !== "ready") return await this.clearForSource(platform, source.kind);
    let permission: NotificationPermission;
    try { permission = await requestNotificationPermission(platform); } catch {
      await this.persistPending(source, "permission_denied");
      return this.pendingResult("permission_denied", source);
    }
    if (permission !== "granted") {
      await this.persistPending(source, "permission_denied");
      return this.pendingResult("permission_denied", source);
    }
    return await this.materialize(platform, copy, source);
  }

  private async reconcileLatest(platform: NotificationPlatform, copy: PracticeReminderCopy, expected?: NotificationPlanIdentity): Promise<LearningPlanReminderResult> {
    const source = await this.readSource(expected);
    if (source.kind === "concurrent_change") {
      await this.persistPendingIdentity(source.expectedIdentity, "concurrent_change");
      return this.pendingResult("concurrent_change", undefined, source.expectedIdentity);
    }
    if (source.kind !== "ready") return await this.clearForSource(platform, source.kind);
    let settings: ReturnType<typeof getDeviceReminderSettingsSnapshot>;
    try {
      settings = getDeviceReminderSettingsSnapshot();
    } catch {
      await this.persistGenericPending("scheduler_failure");
      return this.pendingResult("scheduler_failure", source);
    }
    if (!settings?.settings.enabled) {
      const cancellation = await this.cancelAll(platform);
      if (!cancellation.ok) return this.pendingResult("scheduler_failure", source);
      return freezeReminderResult({ kind: "disabled" as const, status: "disabled" as const });
    }
    const permission = await platform.getPermission().catch(() => "undetermined" as const);
    if (permission !== "granted") {
      await this.persistPending(source, "permission_denied");
      return this.pendingResult("permission_denied", source);
    }
    return await this.materialize(platform, copy, source);
  }

  private async readSource(expected?: NotificationPlanIdentity): Promise<ReminderSourceRead> {
    const trackId = await Promise.resolve(this.dependencies.getActiveTrackId()).catch(() => null);
    if (!trackId) return { kind: "missing_track" };
    if (expected && trackId !== expected.trackId) return { kind: "concurrent_change", expectedIdentity: expected };
    const goal = await Promise.resolve(this.dependencies.getGoalSnapshot(trackId)).catch(() => null);
    if (!goal) return { kind: "missing_goal" };
    if (goal.record.status === "paused") return { kind: "goal_paused" };
    const planSnapshot = await Promise.resolve(this.dependencies.getLearningPlanSnapshot(trackId)).catch(() => null);
    if (!planSnapshot) return { kind: "missing_plan" };
    if (planSnapshot.plan.trackId !== trackId || planSnapshot.plan.goalRevision !== goal.revision) return { kind: "identity_mismatch" };
    if (expected && (
      expected.planId !== planSnapshot.plan.planId ||
      expected.planRevision !== planSnapshot.plan.planRevision ||
      expected.storageRevision !== planSnapshot.revision ||
      expected.commandId !== planSnapshot.plan.commandId ||
      expected.goalRevision !== goal.revision ||
      expected.contentVersion !== planSnapshot.plan.contentVersion ||
      !contentPackagePinsEqual(expected.contentPackagePin, planSnapshot.plan.contentPackagePin) ||
      expected.timezone !== planSnapshot.plan.timezone
    )) return { kind: "concurrent_change", expectedIdentity: expected };
    const timezone = this.dependencies.getDeviceTimezone();
    if (planSnapshot.plan.timezone !== timezone) return { kind: "timezone_mismatch" };
    if (planSnapshot.plan.status === "paused") return { kind: "plan_paused" };
    if (planSnapshot.plan.status === "completed") return { kind: "plan_completed" };
    if (planSnapshot.plan.slots.length === 0) return { kind: "no_slots" };
    let packageContext: ReminderPackageIdentity;
    try {
      packageContext = packageIdentity(await this.dependencies.resolveExact(planSnapshot.plan.contentPackagePin));
      if (packageContext.trackId !== trackId || packageContext.contentVersion !== planSnapshot.plan.contentVersion || !contentPackagePinsEqual(packageContext.packagePin, planSnapshot.plan.contentPackagePin)) return { kind: "identity_mismatch" };
    } catch {
      return { kind: "identity_mismatch" };
    }
    const ready: ReadyReminderSource = {
      goal,
      identity: currentPlanIdentity(planSnapshot, goal, timezone, packageContext),
      planSnapshot,
      slots: slotsFromPlan(planSnapshot.plan),
      timezone,
    };
    if (expected && !sameReminderIdentity(ready.identity, expected)) return { kind: "concurrent_change", expectedIdentity: expected };
    return { kind: "ready", ...ready };
  }

  private async materialize(platform: NotificationPlatform, copy: PracticeReminderCopy, source: ReadyReminderSource): Promise<LearningPlanReminderResult> {
    let current: ReturnType<typeof getDeviceReminderSettingsSnapshot>;
    let existing: DeviceReminderSettings | undefined;
    let pendingJournal: DeviceReminderJournal | null;
    try {
      current = getDeviceReminderSettingsSnapshot();
      existing = current?.settings;
      pendingJournal = getDeviceReminderJournal();
    } catch {
      await this.persistPending(source, "scheduler_failure");
      return this.pendingResult("scheduler_failure", source);
    }
    if (!pendingJournal && existing && existing.pending === null && sameReminderIdentity(existing.identity, source.identity) && existing.legacyNotificationIds.length === 0 && existing.schedules.length === source.slots.length && existing.schedules.every((entry, index) => sameReminderSlot(entry, source.slots[index]!))) {
      const postRead = await this.readSource();
      if (postRead.kind === "ready" && sameReadyReminderSource(postRead, source)) return freezeReminderResult({ kind: "synced" as const, status: "synced" as const, identity: source.identity, schedules: existing.schedules });
      return await this.persistConcurrentChange(source);
    }

    let journal: Awaited<ReturnType<typeof this.prepareJournal>>;
    try {
      journal = await this.prepareJournal(platform, source, existing);
    } catch {
      await this.persistPending(source, "scheduler_failure");
      return this.pendingResult("scheduler_failure", source);
    }
    if (journal.kind !== "ready") return journal.result;
    let activeJournal = journal.journal;
    const existingIds = new Set([...activeJournal.remainingOldIds]);
    try {
      const discovered = await platform.listScheduledReminders(activeJournal.transactionId);
      const discoveredById = new Map(discovered.map((entry) => [entry.notificationId, entry] as const));
      const createdBySlot = new Map<string, DeviceReminderSchedule>();
      for (const created of activeJournal.created) {
        const native = discoveredById.get(created.notificationId);
        const matchesJournalIdentity = native !== undefined &&
          native.notificationId === created.notificationId &&
          native.slotId === created.slotId &&
          native.day === created.day &&
          native.commandId === source.identity.commandId &&
          native.identity !== undefined &&
          sameReminderIdentity(native.identity, source.identity) &&
          native.slotId !== undefined;
        if (matchesJournalIdentity) {
          createdBySlot.set(created.slotId, Object.freeze({ ...created }));
        } else if (native) {
          // A journal entry is not proof that this native notification belongs
          // to the current plan.  A found but mismatched native entry must be
          // cancelled and replaced below.
          existingIds.add(native.notificationId);
        }
      }
      const discoveredBySlot = new Map<string, ScheduledReminderIdentity[]>();
      for (const entry of discovered) {
        const slotId = entry.slotId;
        const expectedSlot = slotId ? source.slots.find((slot) => slot.slotId === slotId) : undefined;
        if (!slotId || !expectedSlot || entry.commandId !== source.identity.commandId || !entry.identity || !sameReminderIdentity(entry.identity, source.identity) || entry.day !== expectedSlot.day || (entry.localTime !== undefined && entry.localTime !== expectedSlot.localTime)) {
          existingIds.add(entry.notificationId);
          continue;
        }
        if (createdBySlot.get(slotId)?.notificationId === entry.notificationId) continue;
        discoveredBySlot.set(slotId, [...(discoveredBySlot.get(slotId) ?? []), entry]);
      }
      for (const entries of discoveredBySlot.values()) for (const duplicate of entries.slice(1)) existingIds.add(duplicate.notificationId);
      for (const slot of source.slots) {
        if (createdBySlot.has(slot.slotId)) continue;
        const recovered = discoveredBySlot.get(slot.slotId)?.[0];
        if (recovered) {
          createdBySlot.set(slot.slotId, Object.freeze({ ...slot, notificationId: recovered.notificationId }));
          continue;
        }
        const time = nextLocalTime(slot.localTime);
        if (!time) return this.pendingResult("scheduler_failure", source);
        const notificationId = await platform.scheduleWeeklyReminder({
          body: copy.body,
          commandId: source.identity.commandId,
          day: slot.day,
          identity: source.identity,
          localTime: slot.localTime,
          slotId: slot.slotId,
          time,
          title: copy.title,
          trackId: source.identity.trackId,
          transactionId: activeJournal.transactionId,
        });
        const created: DeviceReminderSchedule = Object.freeze({ ...slot, notificationId });
        createdBySlot.set(slot.slotId, created);
        activeJournal = Object.freeze({ ...activeJournal, created: Object.freeze([...createdBySlot.values()]) });
        saveDeviceReminderJournal(activeJournal);
      }
      const schedules = Object.freeze(source.slots.map((slot) => createdBySlot.get(slot.slotId)!));
      for (const notificationId of [...existingIds]) {
        if (schedules.some((entry) => entry.notificationId === notificationId)) continue;
        await platform.cancelReminder(notificationId);
        activeJournal = Object.freeze({ ...activeJournal, remainingOldIds: Object.freeze(activeJournal.remainingOldIds.filter((id) => id !== notificationId)) });
        saveDeviceReminderJournal(activeJournal);
      }
      const postRead = await this.readSource();
      if (postRead.kind !== "ready" || !sameReadyReminderSource(postRead, source)) return await this.persistConcurrentChange(source);
      const latest = getDeviceReminderSettingsSnapshot();
      saveDeviceReminderSettings({ schemaVersion: 1, enabled: true, identity: source.identity, schedules, legacyNotificationIds: [], pending: null }, latest?.revision ?? null);
      clearDeviceReminderJournal();
      return freezeReminderResult({ kind: "synced" as const, status: "synced" as const, identity: source.identity, schedules });
    } catch {
      await this.persistPending(source, "scheduler_failure");
      return this.pendingResult("scheduler_failure", source);
    }
  }

  private async prepareJournal(platform: NotificationPlatform, source: ReadyReminderSource, existing: DeviceReminderSettings | undefined): Promise<Readonly<{ kind: "ready"; journal: DeviceReminderJournal } | { kind: "error"; result: LearningPlanReminderResult }>> {
    const prior = getDeviceReminderJournal();
    if (prior) {
      const priorIds = [...prior.remainingOldIds, ...prior.created.map((entry) => entry.notificationId)];
      const priorCreatedMatchesSlots = prior.created.every((entry) => prior.slots.some((slot) => sameReminderSlot(slot, entry)));
      if (prior.expectedIdentity === null || prior.commandId !== source.identity.commandId || !sameReminderIdentity(prior.expectedIdentity, source.identity) || !sameReminderSlots(prior.slots, source.slots) || !priorCreatedMatchesSlots) {
        try {
          for (const id of new Set(priorIds)) await platform.cancelReminder(id);
          clearDeviceReminderJournal();
        } catch {
          await this.persistPending(source, "scheduler_failure");
          return { kind: "error", result: this.pendingResult("scheduler_failure", source) };
        }
      } else {
        return { kind: "ready", journal: prior };
      }
    }
    const oldIds = [...(existing?.legacyNotificationIds ?? []), ...(existing?.schedules.map((entry) => entry.notificationId) ?? [])];
    const journal: DeviceReminderJournal = {
      schemaVersion: 1,
      transactionId: `learning-plan-reminder:${source.identity.commandId}`,
      commandId: source.identity.commandId,
      expectedIdentity: source.identity,
      enabled: true,
      slots: source.slots,
      created: [],
      remainingOldIds: [...new Set(oldIds)],
    };
    try { saveDeviceReminderJournal(journal); return { kind: "ready", journal }; } catch { return { kind: "error", result: this.pendingResult("scheduler_failure", source) }; }
  }

  private async clearForSource(platform: NotificationPlatform, kind: Exclude<LearningPlanReminderFailure, "permission_denied" | "scheduler_failure" | "concurrent_change">): Promise<LearningPlanReminderResult> {
    const cancellation = await this.cancelAll(platform);
    if (!cancellation.ok) {
      await this.persistGenericPending("scheduler_failure");
      return this.pendingResult("scheduler_failure");
    }
    try {
      const current = getDeviceReminderSettingsSnapshot();
      if (current) saveDeviceReminderSettings({ schemaVersion: 1, enabled: current.settings.enabled, identity: null, schedules: [], legacyNotificationIds: [], pending: null }, current.revision);
    } catch {
      return this.pendingResult("scheduler_failure");
    }
    return sourceFailureResult(kind);
  }

  private async cancelAll(platform: NotificationPlatform): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false }>> {
    try {
      const ids = new Set<string>();
      const current = getDeviceReminderSettingsSnapshot();
      for (const id of current?.settings.legacyNotificationIds ?? []) ids.add(id);
      for (const entry of current?.settings.schedules ?? []) ids.add(entry.notificationId);
      const journal = getDeviceReminderJournal();
      for (const id of journal?.remainingOldIds ?? []) ids.add(id);
      for (const entry of journal?.created ?? []) ids.add(entry.notificationId);
      for (const id of ids) await platform.cancelReminder(id);
      if (journal) clearDeviceReminderJournal();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  private async persistPending(source: ReadyReminderSource, reason: DeviceReminderPendingReason): Promise<void> {
    try {
      const current = getDeviceReminderSettingsSnapshot();
      const retainedIds = [...(current?.settings.legacyNotificationIds ?? []), ...(current?.settings.schedules.map((entry) => entry.notificationId) ?? [])];
      saveDeviceReminderSettings({
        schemaVersion: 1,
        enabled: true,
        identity: source.identity,
        schedules: [],
        legacyNotificationIds: [...new Set(retainedIds)],
        pending: { commandId: source.identity.commandId, expectedIdentity: source.identity, enabled: true, slots: source.slots, reason },
      }, current?.revision ?? null);
    } catch {
      // The journal remains the durable source of truth when this write fails.
    }
  }

  private async persistPendingIdentity(identity: NotificationPlanIdentity, reason: DeviceReminderPendingReason): Promise<void> {
    try {
      const current = getDeviceReminderSettingsSnapshot();
      const retainedIds = [...(current?.settings.legacyNotificationIds ?? []), ...(current?.settings.schedules.map((entry) => entry.notificationId) ?? [])];
      saveDeviceReminderSettings({
        schemaVersion: 1,
        enabled: true,
        identity,
        schedules: [],
        legacyNotificationIds: [...new Set(retainedIds)],
        pending: { commandId: identity.commandId, expectedIdentity: identity, enabled: true, slots: [], reason },
      }, current?.revision ?? null);
    } catch {
      // The caller still receives a pending result; a later latest-plan
      // reconciliation can recover any native IDs left by this uncertainty.
    }
  }

  private async persistGenericPending(reason: DeviceReminderPendingReason): Promise<void> {
    try {
      const current = getDeviceReminderSettingsSnapshot();
      if (!current) return;
      const commandId = current.settings.pending?.commandId ?? "learning-plan-reminder:cleanup";
      const retainedIds = [...current.settings.legacyNotificationIds, ...current.settings.schedules.map((entry) => entry.notificationId)];
      saveDeviceReminderSettings({
        schemaVersion: 1,
        enabled: current.settings.enabled,
        identity: current.settings.identity,
        schedules: [],
        legacyNotificationIds: [...new Set(retainedIds)],
        pending: { commandId, expectedIdentity: current.settings.identity, enabled: current.settings.enabled, slots: [], reason },
      }, current.revision);
    } catch {
      // Leave the journal in place when the settings record itself cannot be updated.
    }
  }

  private async persistConcurrentChange(source: ReadyReminderSource): Promise<LearningPlanReminderResult> {
    await this.persistPending(source, "concurrent_change");
    return this.pendingResult("concurrent_change", source);
  }

  private pendingResult(kind: "permission_denied" | "scheduler_failure" | "concurrent_change", source?: ReadyReminderSource, identity?: NotificationPlanIdentity): LearningPlanReminderResult {
    const expectedIdentity = source?.identity ?? identity;
    return freezeReminderResult({ kind, status: "pending" as const, ...(expectedIdentity ? { identity: expectedIdentity, commandId: expectedIdentity.commandId } : {}) });
  }
}

export const learningPlanReminderCoordinator = new LearningPlanReminderCoordinator();

type ReminderOperationArgument = LearningPlanReminderDependencies | LearningPlanReminderExpectedIdentity;

function isReminderDependencies(value: ReminderOperationArgument | undefined): value is LearningPlanReminderDependencies {
  return Boolean(value && typeof value === "object" && "getActiveTrackId" in value);
}

function normalizeExpectedIdentity(value: LearningPlanReminderExpectedIdentity | undefined): NotificationPlanIdentity | undefined {
  if (!value) return undefined;
  if ("identity" in value) return value.trackId === value.identity.trackId ? value.identity : undefined;
  return value;
}

function operationParts(
  first?: ReminderOperationArgument,
  second?: ReminderOperationArgument,
): Readonly<{ dependencies?: LearningPlanReminderDependencies; expected?: NotificationPlanIdentity }> {
  const dependencies = isReminderDependencies(first) ? first : isReminderDependencies(second) ? second : undefined;
  const expectedValue = isReminderDependencies(first) ? second : first;
  return Object.freeze({ dependencies, expected: normalizeExpectedIdentity(expectedValue as LearningPlanReminderExpectedIdentity | undefined) });
}

export function reconcileLearningPlanReminders(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, dependenciesOrExpected?: ReminderOperationArgument, expectedOrDependencies?: ReminderOperationArgument): Promise<LearningPlanReminderResult> {
  const parts = operationParts(dependenciesOrExpected, expectedOrDependencies);
  return (parts.dependencies ? new LearningPlanReminderCoordinator(parts.dependencies) : learningPlanReminderCoordinator).reconcile(platform, copy, parts.expected);
}

export function enableLearningPlanReminders(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, dependenciesOrExpected?: ReminderOperationArgument, expectedOrDependencies?: ReminderOperationArgument): Promise<LearningPlanReminderResult> {
  const parts = operationParts(dependenciesOrExpected, expectedOrDependencies);
  return (parts.dependencies ? new LearningPlanReminderCoordinator(parts.dependencies) : learningPlanReminderCoordinator).enable(platform, copy, parts.expected);
}

export function disableLearningPlanReminders(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, dependencies?: LearningPlanReminderDependencies): Promise<LearningPlanReminderResult> {
  return (dependencies ? new LearningPlanReminderCoordinator(dependencies) : learningPlanReminderCoordinator).disable(platform, copy);
}

export function retryLearningPlanReminders(platform: NotificationPlatform, copy: PracticeReminderCopy = DEFAULT_REMINDER_COPY, dependenciesOrExpected?: ReminderOperationArgument, expectedOrDependencies?: ReminderOperationArgument): Promise<LearningPlanReminderResult> {
  const parts = operationParts(dependenciesOrExpected, expectedOrDependencies);
  return (parts.dependencies ? new LearningPlanReminderCoordinator(parts.dependencies) : learningPlanReminderCoordinator).retry(platform, copy, parts.expected);
}
