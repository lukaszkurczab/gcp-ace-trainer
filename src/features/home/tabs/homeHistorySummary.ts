import type { ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import { buildHomeOverviewMetrics, type HomeOverviewMetric } from "./homeOverviewPresentation";

/**
 * T27: everything Today shows from the learning history, projected once with the shell read
 * (and kept in the Today snapshot), so Home renders without the attempts and review queue.
 * Same results as before, read at `now` (the shell's capturedAt).
 */
export type HomeHistorySummary = Readonly<{
  trackId: string;
  /** Some attempt of this track exists (any session). */
  hasTrackAttempts: boolean;
  /** No attempt and no review entry at all (first use, together with no active session). */
  isEmpty: boolean;
  /** Mode of the latest attempt of this track outside the active session. */
  recentAttemptModeId: string | null;
  overview: readonly HomeOverviewMetric[];
}>;

export function projectHomeHistorySummary(input: Readonly<{
  trackId: string;
  trainingAttempts: readonly TrainingAttempt[];
  reviewQueueItems: readonly ReviewQueueEntry[];
  activeSessionId?: string;
  now: string;
}>): HomeHistorySummary {
  let hasTrackAttempts = false;
  let recent: TrainingAttempt | undefined;
  for (const attempt of input.trainingAttempts) {
    if (attempt.trackId !== input.trackId) continue;
    hasTrackAttempts = true;
    if (attempt.sessionId === input.activeSessionId) continue;
    // The first of the latest ones, as the former stable descending sort picked it.
    if (!recent || attempt.answeredAt.localeCompare(recent.answeredAt) > 0) recent = attempt;
  }
  return {
    trackId: input.trackId,
    hasTrackAttempts,
    isEmpty: input.trainingAttempts.length === 0 && input.reviewQueueItems.length === 0,
    recentAttemptModeId: recent?.modeId ?? null,
    overview: buildHomeOverviewMetrics({ trackId: input.trackId, reviewQueueItems: input.reviewQueueItems, trainingAttempts: input.trainingAttempts, activeSessionId: input.activeSessionId, now: input.now }),
  };
}
