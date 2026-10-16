import type { ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import { projectHomeOverviewEvidence } from "../../../application/homeOverviewProjection";
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
  const { weekly, dueReviews, manualRequests, latestAttempt } = projectHomeOverviewEvidence({ ...input, now: input.now ?? now.toISOString(), timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone });
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
