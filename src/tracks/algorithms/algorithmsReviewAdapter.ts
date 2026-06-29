import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { ReviewQueueItem, ReviewReason, TrainingAttempt, TrainingFeedback } from "../../domain/training";
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
  attempt: TrainingAttempt,
  feedback?: TrainingFeedback,
  context?: TrackReviewContext,
): ReviewQueueItem[] {
  const reviewReason = getReviewReason(attempt);

  if (!reviewReason) {
    return [];
  }

  const createdAt = context?.now ?? attempt.answeredAt;
  const dueAt = context?.dueAt ?? addDaysIso(createdAt, 1);

  return [
    {
      createdAt,
      dueAt,
      id: `review:${attempt.id}`,
      itemId: attempt.itemId,
      mistakeTypeRefs: attempt.mistakeTypeRefs ?? feedback?.mistakeTypeRefs,
      priority: reviewReason === "weak_strategy" ? "high" : "normal",
      reasons: [reviewReason],
      sourceAttemptId: attempt.id,
      trackId: ALGORITHMS_TRACK_ID,
    },
  ];
}

function getReviewReason(attempt: TrainingAttempt): ReviewReason | undefined {
  const result = attempt.result;

  if (!result) {
    return undefined;
  }

  if (result.kind === "strategy_quality") {
    return result.quality === "strong" ? undefined : "weak_strategy";
  }

  if (result.kind === "correctness") {
    return result.isCorrect ? undefined : "incorrect_attempt";
  }

  if (result.kind === "partial_credit") {
    return result.earnedPoints >= result.maxPoints ? undefined : "partial_credit";
  }

  if (result.kind === "mixed" && result.isCorrect === false) {
    return "incorrect_attempt";
  }

  return undefined;
}

function addDaysIso(value: string, days: number): string {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export const algorithmsReviewAdapter = createAlgorithmsReviewAdapter();
