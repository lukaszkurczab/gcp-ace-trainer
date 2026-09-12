import type { ReviewEvidence } from "./reviewEvidence";
import type { TrackId } from "./trackIdentity";
import { resolvedContentRefsEqual } from "./resolvedContentRef";

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
    !resolvedContentRefsEqual(existing.sourceItem, updated.sourceItem)) {
    throw new Error("A review update must preserve its canonical resolved content identity.");
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
