import type { TrackId } from "../tracks";
import type { TrainingAttemptId } from "./trainingAttempt";
import type { TrainingItemId, TrainingItemTaxonomyRef } from "./trainingItem";

export type ReviewQueueItemId = string;

export type ReviewPriority = "low" | "normal" | "high" | "urgent";

export type ReviewReason =
  | "incorrect_attempt"
  | "partial_credit"
  | "low_confidence"
  | "weak_strategy"
  | "repeated_mistake"
  | "manual"
  | "due_spacing";

export type ReviewQueueItem = {
  createdAt: string;
  dueAt: string;
  id: ReviewQueueItemId;
  itemId: TrainingItemId;
  lastReviewedAt?: string;
  mistakeTypeRefs?: TrainingItemTaxonomyRef[];
  priority: ReviewPriority;
  reasons: ReviewReason[];
  sourceAttemptId: TrainingAttemptId;
  taxonomyRefs?: TrainingItemTaxonomyRef[];
  trackId: TrackId;
};
