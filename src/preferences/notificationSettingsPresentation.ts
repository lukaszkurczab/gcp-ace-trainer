import type { LearningPlanReminderFailure } from "../application/notificationPreferences";
import type { NotificationSettingsStatus } from "./useNotificationSettings";

const PENDING_FAILURES = new Set<LearningPlanReminderFailure>([
  "permission_denied",
  "scheduler_failure",
  "concurrent_change",
]);

export type NotificationSettingsPresentation = Readonly<{
  showPermission: boolean;
  showPlanSchedule: boolean;
  showEnable: boolean;
  showDisable: boolean;
  showRetry: boolean;
  showCancelRequest: boolean;
  showPending: boolean;
}>;

export function getNotificationSettingsPresentation(input: Readonly<{
  error: LearningPlanReminderFailure | null;
  loading: boolean;
  pending: boolean;
  planReady: boolean;
  status: NotificationSettingsStatus;
}>): NotificationSettingsPresentation {
  const actionable = !input.loading && input.planReady;
  const pendingFailure = input.error !== null && PENDING_FAILURES.has(input.error);
  const structuralFailure = input.error !== null && !pendingFailure;
  const canPresentReadyPlan = actionable && !structuralFailure;
  const showPending = input.pending || pendingFailure;

  return Object.freeze({
    showPermission: canPresentReadyPlan,
    showPlanSchedule: canPresentReadyPlan,
    showEnable: canPresentReadyPlan && !showPending && input.status === "disabled" && input.error === null,
    showDisable: canPresentReadyPlan && !showPending && input.status === "synced",
    showRetry: canPresentReadyPlan && showPending,
    showCancelRequest: !input.loading && showPending,
    showPending: !input.loading && showPending,
  });
}
