import { isActiveReviewQueueEntry, manualRequestIdForEntry, type ReviewQueueEntry, type TrainingAttempt } from "../../../domain";
import { projectWeeklyAnsweredActivity } from "../../../application/activityReadModels";
import { modeLabel, relativeDay } from "./activityPresentation";

export type HomeOverviewMetric = Readonly<{
  label: string;
  value: string;
  count?: number;
  dueCount?: number;
  manualCount?: number;
}>;

/** Maps application activity facts; due/latest rows retain their existing meaning. */
export function buildHomeOverviewMetrics(input: Readonly<{
  trackId: string;
  reviewQueueItems: readonly ReviewQueueEntry[];
  trainingAttempts: readonly TrainingAttempt[];
  activeSessionId?: string;
  now?: string;
  timezone?: string;
}>): readonly HomeOverviewMetric[] {
  const now = new Date(input.now ?? Date.now());
  const weekly = projectWeeklyAnsweredActivity(input.trainingAttempts, {
    trackId: input.trackId,
    now: input.now ?? now.toISOString(),
    timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    activeSessionId: input.activeSessionId,
  });
  const trackAttempts = input.trainingAttempts.filter(attempt => attempt.trackId === input.trackId && attempt.sessionId !== input.activeSessionId);
  const dueReviews = input.reviewQueueItems.filter(entry => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.trackId === input.trackId && Date.parse(entry.dueAt) <= now.getTime()).length;
  const manualRequests = input.reviewQueueItems.filter(entry => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.trackId === input.trackId && Date.parse(entry.dueAt) > now.getTime() && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined).length;
  const latestAttempt = [...trackAttempts].sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))[0];
  const week: HomeOverviewMetric = weekly.kind === "unavailable"
    ? { label: "This week", value: "home.week.unavailable" }
    : weekly.answeredCount > 0
      ? { label: "This week", value: "home.week.answersRecorded", count: weekly.answeredCount }
      : { label: "This week", value: "No activity yet" };
  const reviewValue = !Number.isFinite(now.getTime())
    ? "Review unavailable"
    : dueReviews && manualRequests
      ? "home.review.dueAndManual"
      : dueReviews
        ? `${dueReviews} due`
        : manualRequests
          ? "home.review.manualReady"
          : "Nothing due";
  const latestValue = weekly.kind === "unavailable"
    ? "Activity unavailable"
    : latestAttempt ? `${modeLabel(latestAttempt.modeId)} · ${relativeDay(latestAttempt.answeredAt, now)}` : "No activity yet";
  return [
    week,
    {
      label: "Review",
      value: reviewValue,
      ...(dueReviews && manualRequests ? { dueCount: dueReviews, manualCount: manualRequests } : {}),
      ...(!dueReviews && manualRequests ? { count: manualRequests } : {}),
    },
    { label: "Last session", value: latestValue },
  ];
}
