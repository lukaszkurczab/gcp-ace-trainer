import type { TrackId } from "../tracks";
import type { TrainingAttemptId } from "./trainingAttempt";
import type { TrainingItemId, TrainingItemTaxonomyRef } from "./trainingItem";

export type ReviewQueueItemId = string;

export type ReviewPriority = "low" | "normal" | "high" | "urgent";
export type ReviewQueueItemKind = "remediation" | "retention";

export type ReviewReason =
  | "incorrect_attempt"
  | "partial_credit"
  | "low_confidence"
  | "repeated_mistake"
  | "manual"
  | "due_spacing";

export type ReviewQueueItem = {
  createdAt: string;
  dueAt: string;
  id: ReviewQueueItemId;
  itemId: TrainingItemId;
  kind?: ReviewQueueItemKind;
  lastReviewedAt?: string;
  mistakeTypeRefs?: TrainingItemTaxonomyRef[];
  priority: ReviewPriority;
  reasons: ReviewReason[];
  retentionPassedAt?: string;
  sourceAttemptId: TrainingAttemptId;
  taxonomyRefs?: TrainingItemTaxonomyRef[];
  trackId: TrackId;
};

export function getReviewQueueItemKind(
  item: Pick<ReviewQueueItem, "kind" | "reasons">,
): ReviewQueueItemKind {
  if (item.kind) return item.kind;

  return item.reasons.some((reason) =>
    reason === "incorrect_attempt" ||
    reason === "partial_credit" ||
    reason === "repeated_mistake" ||
    reason === "low_confidence"
  ) ? "remediation" : "retention";
}
