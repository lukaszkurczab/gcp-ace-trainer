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

  const createdAt = context?.now ?? attempt.answeredAt;
  const kind = reviewReason ? "remediation" : "retention";
  const dueAt = context?.dueAt ?? addDaysIso(createdAt, reviewReason ? 1 : 7);

  return [
    {
      createdAt,
      dueAt,
      id: `review:${attempt.id}`,
      itemId: attempt.itemId,
      kind,
      lastReviewedAt: undefined,
      mistakeTypeRefs: attempt.mistakeTypeRefs ?? feedback?.mistakeTypeRefs,
      priority: reviewReason === "incorrect_attempt" ? "high" : kind === "retention" ? "low" : "normal",
      reasons: [reviewReason ?? "due_spacing"],
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
