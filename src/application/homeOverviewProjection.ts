import { isActiveReviewQueueEntry, manualRequestIdForEntry, type ReviewQueueEntry, type TrainingAttempt } from "../domain";
import { projectWeeklyAnsweredActivity } from "./activityReadModels";

/** Activity counts are distinct from completion/performance evidence, with one captured clock. */
export function projectHomeOverviewEvidence(input: Readonly<{ trackId: string; reviewQueueItems: readonly ReviewQueueEntry[]; trainingAttempts: readonly TrainingAttempt[]; activeSessionId?: string; now: string; timezone: string }>) {
  const now = new Date(input.now);
  const weekly = projectWeeklyAnsweredActivity(input.trainingAttempts, {
    trackId: input.trackId,
    now: input.now,
    timezone: input.timezone,
    activeSessionId: input.activeSessionId,
  });
  const dueReviews = input.reviewQueueItems.filter(entry => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.trackId === input.trackId && Date.parse(entry.dueAt) <= now.getTime()).length;
  const manualRequests = input.reviewQueueItems.filter(entry => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.trackId === input.trackId && Date.parse(entry.dueAt) > now.getTime() && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined).length;
  const latestAttempt = [...input.trainingAttempts.filter(attempt => attempt.trackId === input.trackId && attempt.sessionId !== input.activeSessionId)].sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))[0];
  return { weekly, dueReviews, manualRequests, latestAttempt };
}
