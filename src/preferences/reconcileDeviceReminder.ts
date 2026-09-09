import { reconcileLearningPlanReminders, type LearningPlanReminderResult, type PracticeReminderCopy } from "../application/notificationPreferences";
import { expoNotificationPlatform } from "../infrastructure/notifications/expoNotificationPlatform";

export async function reconcileDeviceReminder(copy?: PracticeReminderCopy): Promise<LearningPlanReminderResult> {
  return reconcileLearningPlanReminders(expoNotificationPlatform, copy);
}

export function reminderNeedsAttention(result: LearningPlanReminderResult): result is LearningPlanReminderResult & { status: "pending"; kind: Exclude<LearningPlanReminderResult["kind"], "synced" | "disabled"> } {
  return result.status === "pending";
}
