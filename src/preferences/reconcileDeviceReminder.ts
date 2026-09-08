import { reconcilePracticeReminder, type PracticeReminderCopy } from "../application/notificationPreferences";
import { expoNotificationPlatform } from "../infrastructure/notifications/expoNotificationPlatform";

export async function reconcileDeviceReminder(copy: PracticeReminderCopy): Promise<void> {
  await reconcilePracticeReminder(expoNotificationPlatform, copy);
}
