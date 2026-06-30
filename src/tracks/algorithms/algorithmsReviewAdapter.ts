import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { ReviewQueueItem, TrainingAttempt, TrainingFeedback } from "../../domain/training";
import type { TrackReviewAdapter, TrackReviewContext } from "../types";

export function createAlgorithmsReviewAdapter(): TrackReviewAdapter {
  return {
    createReviewQueueItems: (
      attempt: TrainingAttempt,
      feedback?: TrainingFeedback,
      context?: TrackReviewContext,
    ): ReviewQueueItem[] => createAlgorithmsReviewQueueItems(attempt, feedback, context),
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export function createAlgorithmsReviewQueueItems(
  _attempt: TrainingAttempt,
  _feedback?: TrainingFeedback,
  _context?: TrackReviewContext,
): ReviewQueueItem[] {
  return [];
}

export const algorithmsReviewAdapter = createAlgorithmsReviewAdapter();
