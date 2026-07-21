import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  disableDailyReminder,
  loadNotificationPreferences,
  NotificationPermissionDeniedError,
  requestNotificationPermission,
  saveDailyReminder,
  type DailyReminder,
  type DailyReminderRequest,
  type DailyReminderTime,
  type NotificationPermission,
  type NotificationSettings,
} from "../application/notificationPreferences";
import { expoNotificationPlatform } from "../infrastructure/notifications/expoNotificationPlatform";

type NotificationSettingsState = Readonly<{
  dailyReminder: DailyReminder | null;
  permission: NotificationPermission | null;
  requestPermission: () => Promise<NotificationPermission>;
  saveReminder: (
    time: DailyReminderTime,
    notification: Omit<DailyReminderRequest, "time">,
  ) => Promise<void>;
  disableReminder: (notification: Omit<DailyReminderRequest, "time">) => Promise<void>;
}>;

export function useNotificationSettings(): NotificationSettingsState {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  const refresh = useCallback(async () => {
    const [stored, currentPermission] = await Promise.all([
      loadNotificationPreferences(),
      expoNotificationPlatform.getPermission(),
    ]);
    setSettings(stored);
    setPermission(currentPermission);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestPermission = useCallback(async () => {
    const nextPermission = await requestNotificationPermission(expoNotificationPlatform);
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  const saveReminder = useCallback(async (
    time: DailyReminderTime,
    notification: Omit<DailyReminderRequest, "time">,
  ) => {
    try {
      const next = await saveDailyReminder(expoNotificationPlatform, time, notification);
      setSettings(next);
      setPermission("granted");
    } catch (error) {
      if (error instanceof NotificationPermissionDeniedError) {
        setPermission(await expoNotificationPlatform.getPermission());
      }
      throw error;
    }
  }, []);

  const disableReminder = useCallback(async (notification: Omit<DailyReminderRequest, "time">) => {
    const next = await disableDailyReminder(expoNotificationPlatform, notification);
    setSettings(next);
  }, []);

  return {
    dailyReminder: settings.dailyReminder,
    disableReminder,
    permission,
    requestPermission,
    saveReminder,
  };
}
