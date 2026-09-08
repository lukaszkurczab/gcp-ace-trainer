import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  disablePracticeReminder,
  NotificationPermissionDeniedError,
  reconcilePracticeReminder,
  requestNotificationPermission,
  savePracticeReminder,
  type DailyReminderTime,
  type NotificationPermission,
  type PracticeReminder,
  type PracticeReminderCopy,
  type ReminderContext,
  type NotificationSettings,
} from "../application/notificationPreferences";
import { expoNotificationPlatform } from "../infrastructure/notifications/expoNotificationPlatform";
import { createNotificationSettingsRequestGuard, type NotificationSettingsRequestGuard } from "./notificationSettingsState";

export type NotificationSettingsOperation = "disable" | "load" | "request" | "save";
type NotificationSettingsBusyOperation = Exclude<NotificationSettingsOperation, "load">;

type NotificationSettingsState = Readonly<{
  context: ReminderContext;
  practiceReminder: PracticeReminder | null;
  error: NotificationSettingsOperation | null;
  loading: boolean;
  busy: boolean;
  busyOperation: NotificationSettingsBusyOperation | null;
  permission: NotificationPermission | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  saveReminder: (
    time: DailyReminderTime,
    notification: PracticeReminderCopy,
  ) => Promise<boolean>;
  disableReminder: (notification: PracticeReminderCopy) => Promise<boolean>;
}>;

const EMPTY_CONTEXT: ReminderContext = Object.freeze({ preferredDays: Object.freeze([]), status: "missing-track", trackId: null });

export function useNotificationSettings(copy: PracticeReminderCopy): NotificationSettingsState {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [context, setContext] = useState<ReminderContext>(EMPTY_CONTEXT);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<NotificationSettingsOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyOperation, setBusyOperation] = useState<NotificationSettingsBusyOperation | null>(null);
  const mountedRef = useRef(true);
  const guardRef = useRef<NotificationSettingsRequestGuard | null>(null);
  if (guardRef.current === null) guardRef.current = createNotificationSettingsRequestGuard();
  const guard = guardRef.current;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const token = guard.beginRead();
    if (token.startedWhileBusy) return;
    if (mountedRef.current) setLoading(true);
    try {
      const [stored, currentPermission] = await Promise.all([reconcilePracticeReminder(expoNotificationPlatform, copy), expoNotificationPlatform.getPermission()]);
      if (!mountedRef.current || !guard.canCommitRead(token)) return;
      setSettings(stored);
      setContext(stored.context);
      setPermission(currentPermission);
      setError(null);
    } catch {
      if (mountedRef.current && guard.canCommitRead(token)) setError("load");
    } finally {
      if (mountedRef.current && guard.canCommitRead(token)) setLoading(false);
    }
  }, [copy.body, copy.title, guard]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestPermission = useCallback(async () => {
    const revision = guard.beginMutation();
    if (revision === null) return permission ?? "undetermined";
    if (mountedRef.current) {
      setBusy(true);
      setBusyOperation("request");
      setError(null);
      setLoading(false);
    }
    try {
      const nextPermission = await requestNotificationPermission(expoNotificationPlatform);
      if (mountedRef.current) setPermission(nextPermission);
      return nextPermission;
    } catch (caught) {
      if (mountedRef.current) setError("request");
      throw caught;
    } finally {
      guard.finishMutation(revision);
      if (mountedRef.current) {
        setBusy(false);
        setBusyOperation(null);
      }
    }
  }, [guard, permission]);

  const saveReminder = useCallback(async (
    time: DailyReminderTime,
    notification: PracticeReminderCopy,
  ) => {
    const revision = guard.beginMutation();
    if (revision === null) return false;
    if (mountedRef.current) {
      setBusy(true);
      setBusyOperation("save");
      setError(null);
      setLoading(false);
    }
    try {
      const next = await savePracticeReminder(expoNotificationPlatform, time, notification);
      if (mountedRef.current) {
        setSettings(next);
        setContext(next.context);
        setPermission("granted");
      }
      return true;
    } catch (caught) {
      if (mountedRef.current) {
        setError("save");
        if (caught instanceof NotificationPermissionDeniedError) {
          try {
            const currentPermission = await expoNotificationPlatform.getPermission();
            if (mountedRef.current) setPermission(currentPermission);
          } catch {
            // Preserve the original operation error when the follow-up permission read fails.
          }
        }
      }
      throw caught;
    } finally {
      guard.finishMutation(revision);
      if (mountedRef.current) {
        setBusy(false);
        setBusyOperation(null);
      }
    }
  }, [guard]);

  const disableReminder = useCallback(async (notification: PracticeReminderCopy) => {
    const revision = guard.beginMutation();
    if (revision === null) return false;
    if (mountedRef.current) {
      setBusy(true);
      setBusyOperation("disable");
      setError(null);
      setLoading(false);
    }
    try {
      const next = await disablePracticeReminder(expoNotificationPlatform, notification);
      if (mountedRef.current) {
        setSettings(next);
        setContext(next.context);
      }
      return true;
    } catch (caught) {
      if (mountedRef.current) setError("disable");
      throw caught;
    } finally {
      guard.finishMutation(revision);
      if (mountedRef.current) {
        setBusy(false);
        setBusyOperation(null);
      }
    }
  }, [guard]);

  return {
    context,
    practiceReminder: settings.practiceReminder,
    disableReminder,
    error,
    loading,
    busy,
    busyOperation,
    permission,
    clearError,
    refresh,
    requestPermission,
    saveReminder,
  };
}
