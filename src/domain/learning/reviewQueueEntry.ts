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
  sourceSessionId: string;
  reasons: readonly ReviewReason[];
  dueAt: string;
  createdAt: string;
  consecutiveAfterDueSuccesses: number;
  persistent: boolean;
  lastReviewedAt?: string;
}>;

export function retainReviewQueueEntryIdentity(existing: ReviewQueueEntry, updated: ReviewQueueEntry): ReviewQueueEntry {
  if (existing.trackId !== updated.trackId || existing.sourceItem.trackId !== updated.sourceItem.trackId ||
    existing.sourceItem.itemId !== updated.sourceItem.itemId || existing.sourceItem.contentVersion !== updated.sourceItem.contentVersion) {
    throw new Error("A review update must preserve its canonical item identity.");
  }
  return {
    ...updated,
    id: existing.id,
    sourceAttemptId: existing.sourceAttemptId,
    sourceSessionId: existing.sourceSessionId,
    sourceItem: existing.sourceItem,
    taxonomyOrSkillRefs: existing.taxonomyOrSkillRefs,
    createdAt: existing.createdAt,
  };
}
