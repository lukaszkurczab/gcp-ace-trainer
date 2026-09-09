import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type {
  NotificationPermission,
  NotificationPlatform,
} from "../../application/notificationPreferences";
import { GOAL_DAY_IDS, type GoalDay } from "../../domain";

const PRACTICE_REMINDER_CHANNEL_ID = "patternly-practice-reminder";
const EXPO_WEEKDAY: Readonly<Record<GoalDay, number>> = Object.freeze({
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
});

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
  await Notifications.setNotificationChannelAsync(PRACTICE_REMINDER_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "Practice reminders",
    sound: null,
    vibrationPattern: [0],
  });
}

function toPermission(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
}

export const expoNotificationPlatform: NotificationPlatform = {
  async cancelReminder(notificationId) {
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

  async listScheduledReminders(transactionId) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.flatMap((request) => {
      const data = request.content.data;
      const day = data?.day;
      return data?.source === "practice-reminder" && data.transactionId === transactionId &&
        typeof day === "string" && GOAL_DAY_IDS.includes(day as GoalDay)
        ? [{
          commandId: typeof data.commandId === "string" ? data.commandId : undefined,
          day: day as GoalDay,
          identity: typeof data.identity === "object" && data.identity !== null ? data.identity as import("../../storage/repositories/notificationSettingsRepository").NotificationPlanIdentity : undefined,
          notificationId: request.identifier,
          slotId: typeof data.slotId === "string" ? data.slotId : undefined,
        }]
        : [];
    });
  },

  async scheduleWeeklyReminder({ body, commandId, day, identity, slotId, time: { hour, minute }, title, trackId, transactionId }) {
    await ensureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        body,
        data: { commandId: commandId ?? identity?.commandId, day, identity, slotId, source: "practice-reminder", trackId, transactionId },
        sound: false,
        title,
      },
      trigger: {
        channelId: Platform.OS === "android" ? PRACTICE_REMINDER_CHANNEL_ID : undefined,
        hour,
        minute,
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: EXPO_WEEKDAY[day],
      },
    });
  },
};

export function goalDayToExpoWeekday(day: GoalDay): number { return EXPO_WEEKDAY[day]; }
