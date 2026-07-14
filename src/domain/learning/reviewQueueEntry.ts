import type { ReviewEvidence } from "./reviewEvidence";
import type { TrackId } from "./trackIdentity";

export const REVIEW_REASONS = [
  "incorrect", "partial", "hint_used", "wrong_pattern", "wrong_strategy", "complexity_error",
  "repeated_mistake", "scheduled_retrieval", "weak_taxonomy_area", "manual_mark",
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number];

export type ReviewQueueEntry = ReviewEvidence & Readonly<{
  id: string;
  trackId: TrackId;
  sourceAttemptId: string;
  reasons: readonly ReviewReason[];
  dueAt: string;
  createdAt: string;
  consecutiveAfterDueSuccesses: number;
  persistent: boolean;
  lastReviewedAt?: string;
}>;
