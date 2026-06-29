import type { TrackAdapter, TrackReviewContext } from "../../tracks";
import type { ReviewQueueItem, TrainingAttempt, TrainingFeedback } from "../training";

export type CreateReviewQueueItemsForAttemptsInput = {
  adapter: TrackAdapter;
  attempts: readonly TrainingAttempt[];
  context?: TrackReviewContext;
  feedbackByAttemptId?: Readonly<Record<string, TrainingFeedback>>;
};

export function createReviewQueueItemsForAttempts(
  input: CreateReviewQueueItemsForAttemptsInput,
): ReviewQueueItem[] {
  return input.attempts.flatMap((attempt) => {
    if (attempt.trackId !== input.adapter.trackId) {
      throw new Error(`Track adapter ${input.adapter.trackId} cannot create review items for attempt track ${attempt.trackId}.`);
    }

    return input.adapter.review.createReviewQueueItems(
      attempt,
      input.feedbackByAttemptId?.[attempt.id],
      input.context,
    );
  });
}
