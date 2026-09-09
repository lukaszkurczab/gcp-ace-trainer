import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  enableLearningPlanReminders,
  disableLearningPlanReminders,
  reconcileLearningPlanReminders,
  retryLearningPlanReminders,
  type LearningPlanReminderFailure,
  type LearningPlanReminderResult,
  type NotificationPermission,
  type PracticeReminderCopy,
} from "../application/notificationPreferences";
import { expoNotificationPlatform } from "../infrastructure/notifications/expoNotificationPlatform";
import { getActiveTrackId, getLearningPlanSnapshot } from "../storage/repositories";
import type { DeviceReminderSlot } from "../storage/repositories/notificationSettingsRepository";
import type { TrackId } from "../domain";
import { createNotificationSettingsRequestGuard, type NotificationSettingsRequestGuard } from "./notificationSettingsState";

export type NotificationSettingsOperation = "disable" | "enable" | "load" | "retry";
export type NotificationSettingsStatus = "loading" | "synced" | "disabled" | LearningPlanReminderFailure;
export type NotificationSettingsError = LearningPlanReminderFailure;
type NotificationSettingsBusyOperation = Exclude<NotificationSettingsOperation, "load">;

type AcceptedPlanSlots = Readonly<{
  trackId: TrackId | null;
  slots: readonly DeviceReminderSlot[];
}>;

export type NotificationSettingsState = Readonly<{
  busy: boolean;
  busyOperation: NotificationSettingsBusyOperation | null;
  clearError: () => void;
  enabled: boolean;
  error: NotificationSettingsError | null;
  loading: boolean;
  pending: boolean;
  permission: NotificationPermission | null;
  planSlots: readonly DeviceReminderSlot[];
  refresh: () => Promise<void>;
  retryReminders: () => Promise<LearningPlanReminderResult | null>;
  status: NotificationSettingsStatus;
  trackId: TrackId | null;
  enableReminders: () => Promise<LearningPlanReminderResult | null>;
  disableReminders: () => Promise<LearningPlanReminderResult | null>;
}>;

const EMPTY_PLAN: AcceptedPlanSlots = Object.freeze({ trackId: null, slots: Object.freeze([]) });

async function readAcceptedPlanSlots(): Promise<AcceptedPlanSlots> {
  const trackId = await getActiveTrackId();
  if (!trackId) return EMPTY_PLAN;
  const snapshot = getLearningPlanSnapshot(trackId);
  if (!snapshot || snapshot.plan.status !== "accepted") return Object.freeze({ trackId, slots: Object.freeze([]) });
  return Object.freeze({
    trackId,
    slots: Object.freeze(snapshot.plan.slots.map((slot) => Object.freeze({ slotId: slot.slotId, day: slot.day, localTime: slot.localTime }))),
  });
}

function errorFromResult(result: LearningPlanReminderResult): NotificationSettingsError | null {
  return result.kind === "synced" || result.kind === "disabled" ? null : result.kind;
}

function applyResult(result: LearningPlanReminderResult, plan: AcceptedPlanSlots, permission: NotificationPermission): Readonly<{
  enabled: boolean;
  error: NotificationSettingsError | null;
  pending: boolean;
  permission: NotificationPermission;
  planSlots: readonly DeviceReminderSlot[];
  status: NotificationSettingsStatus;
  trackId: TrackId | null;
}> {
  const pending = result.status === "pending";
  const enabled = result.kind === "synced" || pending;
  const fallbackSlots = result.kind === "synced"
    ? Object.freeze(result.schedules.map(({ slotId, day, localTime }) => Object.freeze({ slotId, day, localTime })))
    : Object.freeze([]);
  return Object.freeze({
    enabled,
    error: errorFromResult(result),
    pending,
    permission,
    planSlots: plan.slots.length > 0 ? plan.slots : fallbackSlots,
    status: result.kind,
    trackId: plan.trackId,
  });
}

export function useNotificationSettings(copy: PracticeReminderCopy): NotificationSettingsState {
  const [status, setStatus] = useState<NotificationSettingsStatus>("loading");
  const [error, setError] = useState<NotificationSettingsError | null>(null);
  const [planSlots, setPlanSlots] = useState<readonly DeviceReminderSlot[]>(EMPTY_PLAN.slots);
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyOperation, setBusyOperation] = useState<NotificationSettingsBusyOperation | null>(null);
  const mountedRef = useRef(true);
  const guardRef = useRef<NotificationSettingsRequestGuard | null>(null);
  if (guardRef.current === null) guardRef.current = createNotificationSettingsRequestGuard();
  const guard = guardRef.current;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const commitResult = useCallback((result: LearningPlanReminderResult, plan: AcceptedPlanSlots, currentPermission: NotificationPermission) => {
    const next = applyResult(result, plan, currentPermission);
    if (!mountedRef.current) return;
    setStatus(next.status);
    setError(next.error);
    setPlanSlots(next.planSlots);
    setTrackId(next.trackId);
    setPermission(next.permission);
    setEnabled(next.enabled);
    setPending(next.pending);
  }, []);

  const refresh = useCallback(async () => {
    const token = guard.beginRead();
    if (token.startedWhileBusy) return;
    if (mountedRef.current) setLoading(true);
    try {
      const [result, currentPermission, plan] = await Promise.all([
        reconcileLearningPlanReminders(expoNotificationPlatform, copy),
        expoNotificationPlatform.getPermission().catch(() => "undetermined" as const),
        readAcceptedPlanSlots(),
      ]);
      if (!guard.canCommitRead(token)) return;
      commitResult(result, plan, currentPermission);
    } catch {
      if (mountedRef.current && guard.canCommitRead(token)) {
        setStatus("scheduler_failure");
        setError("scheduler_failure");
        setPending(true);
      }
    } finally {
      if (mountedRef.current && guard.canCommitRead(token)) setLoading(false);
    }
  }, [commitResult, copy.body, copy.title, guard]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const clearError = useCallback(() => setError(null), []);

  const runMutation = useCallback(async (
    operation: NotificationSettingsBusyOperation,
    action: () => Promise<LearningPlanReminderResult>,
  ): Promise<LearningPlanReminderResult | null> => {
    const revision = guard.beginMutation();
    if (revision === null) return null;
    if (mountedRef.current) {
      setBusy(true);
      setBusyOperation(operation);
      setError(null);
      setLoading(false);
    }
    try {
      const result = await action();
      const [currentPermission, plan] = await Promise.all([
        expoNotificationPlatform.getPermission().catch(() => "undetermined" as const),
        readAcceptedPlanSlots(),
      ]);
      if (mountedRef.current) commitResult(result, plan, currentPermission);
      return result;
    } catch {
      if (mountedRef.current) {
        setStatus("scheduler_failure");
        setError("scheduler_failure");
        setPending(true);
      }
      return null;
    } finally {
      guard.finishMutation(revision);
      if (mountedRef.current) {
        setBusy(false);
        setBusyOperation(null);
      }
    }
  }, [commitResult, guard]);

  const enableReminders = useCallback(() => runMutation("enable", () => enableLearningPlanReminders(expoNotificationPlatform, copy)), [copy, runMutation]);
  const disableReminders = useCallback(() => runMutation("disable", () => disableLearningPlanReminders(expoNotificationPlatform, copy)), [copy, runMutation]);
  const retryReminders = useCallback(() => runMutation("retry", () => retryLearningPlanReminders(expoNotificationPlatform, copy)), [copy, runMutation]);

  return {
    busy,
    busyOperation,
    clearError,
    disableReminders,
    enableReminders,
    enabled,
    error,
    loading,
    pending,
    permission,
    planSlots,
    refresh,
    retryReminders,
    status,
    trackId,
  };
}
