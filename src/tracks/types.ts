import type { TrackId } from "../domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingAttemptResponse,
  TrainingAttemptResult,
  TrainingContentItem,
  TrainingFeedback,
  TrainingItemId,
  TrainingItemTaxonomyRef,
  TrainingItemType,
  TrainingSessionModeId,
} from "../domain/training";

export type TrackContentItem = TrainingContentItem;

export type TrackReviewContent = {
  prompt: string;
  taxonomyRefs: readonly TrainingItemTaxonomyRef[];
};

export type TrackContentAdapter<Item extends TrackContentItem = TrackContentItem> = {
  getContentVersion(): string;
  getItemById(itemId: TrainingItemId): Item | undefined;
  getItems(): readonly Item[];
  getItemsForMode(modeId: TrainingSessionModeId): readonly Item[];
  getReviewContent(itemId: TrainingItemId): TrackReviewContent | undefined;
  trackId: TrackId;
};

export type TrackScoringContext = {
  answeredAt?: string;
  modeId?: TrainingSessionModeId;
};

export type TrackScoringAdapter<Item extends TrackContentItem = TrackContentItem> = {
  scoreAttempt(
    item: Item,
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

export type TrackAdapter<Item extends TrackContentItem = TrackContentItem> = {
  content: TrackContentAdapter<Item>;
  review: TrackReviewAdapter;
  scoring: TrackScoringAdapter<Item>;
  trackId: TrackId;
};
