import type { TrackId } from "../domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingAttemptResponse,
  TrainingAttemptResult,
  TrainingFeedback,
  TrainingItem,
  TrainingItemId,
  TrainingSessionModeId,
} from "../domain/training";

export type TrackContentAdapter = {
  getContentVersion(): string;
  getItemById(itemId: TrainingItemId): TrainingItem | undefined;
  getItems(): readonly TrainingItem[];
  getItemsForMode(modeId: TrainingSessionModeId): readonly TrainingItem[];
  trackId: TrackId;
};

export type TrackScoringContext = {
  answeredAt?: string;
  modeId?: TrainingSessionModeId;
};

export type TrackScoringAdapter = {
  scoreAttempt(
    item: TrainingItem,
    response: TrainingAttemptResponse,
    context?: TrackScoringContext,
  ): TrainingAttemptResult;
  trackId: TrackId;
};

export type TrackReviewContext = {
  dueAt?: string;
  now?: string;
};

export type TrackReviewAdapter = {
  createReviewQueueItems(
    attempt: TrainingAttempt,
    feedback?: TrainingFeedback,
    context?: TrackReviewContext,
  ): ReviewQueueItem[];
  trackId: TrackId;
};

export type TrackAdapter = {
  content: TrackContentAdapter;
  review: TrackReviewAdapter;
  scoring: TrackScoringAdapter;
  trackId: TrackId;
};
