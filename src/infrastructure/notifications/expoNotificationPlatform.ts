import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type {
  NotificationPermission,
  NotificationPlatform,
} from "../../application/notificationPreferences";

const DAILY_REMINDER_CHANNEL_ID = "patternly-daily-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "Daily learning reminder",
    sound: null,
    vibrationPattern: [0],
  });
}

function toPermission(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
}

export const expoNotificationPlatform: NotificationPlatform = {
  async cancelDailyReminder(notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async getPermission() {
    return toPermission(await Notifications.getPermissionsAsync());
  },

  async requestPermission() {
    await ensureAndroidChannel();
    return toPermission(await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    }));
  },

  async scheduleDailyReminder({ body, time: { hour, minute }, title }) {
    await ensureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        body,
        data: { source: "daily-reminder" },
        sound: false,
        title,
      },
      trigger: {
        channelId: Platform.OS === "android" ? DAILY_REMINDER_CHANNEL_ID : undefined,
        hour,
        minute,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });
  },
};
