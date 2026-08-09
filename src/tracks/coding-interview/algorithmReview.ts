import type { ReviewQueueEntry, ReviewReason, TrainingAttempt } from "../../domain/learning";
import type { AlgorithmResponse } from "./domain";

export function createAlgorithmReviewEntry(
  attempt: TrainingAttempt<AlgorithmResponse>,
  dueAt = addDaysIso(attempt.committedAt, attempt.result.kind === "correct" ? 7 : 1),
  explicitReasons?: readonly ReviewReason[],
): ReviewQueueEntry {
  return {
    consecutiveAfterDueSuccesses: 0,
    createdAt: attempt.committedAt,
    dueAt,
    id: `review:${attempt.id}`,
    persistent: attempt.result.kind !== "correct",
    reasons: explicitReasons && explicitReasons.length > 0
      ? [...new Set(explicitReasons)]
      : [attempt.result.kind === "correct" ? "scheduled_retrieval" : attempt.result.kind],
    sourceAttemptId: attempt.id,
    sourceSessionId: attempt.sessionId,
    sourceItem: attempt.reviewEvidence.sourceItem,
    taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs,
    trackId: attempt.trackId,
  };
}

export function updateAlgorithmReviewEntry(
  entry: ReviewQueueEntry,
  attempt: TrainingAttempt<AlgorithmResponse>,
  input: Readonly<{ eligibleForPersistentResolution: boolean }>,
): ReviewQueueEntry | undefined {
  if (attempt.id === entry.sourceAttemptId) return entry;
  if (attempt.committedAt < entry.dueAt) return entry;
  if (attempt.result.kind !== "correct") {
    return { ...entry, consecutiveAfterDueSuccesses: 0, lastReviewedAt: attempt.committedAt, persistent: true, reasons: [attempt.result.kind] };
  }
  if (!input.eligibleForPersistentResolution) return entry;
  const sameSessionCorrection = entry.persistent && entry.sourceSessionId === attempt.sessionId;
  const consecutiveAfterDueSuccesses = sameSessionCorrection
    ? entry.consecutiveAfterDueSuccesses
    : entry.consecutiveAfterDueSuccesses + 1;
  if (consecutiveAfterDueSuccesses >= 2) return undefined;
  return { ...entry, consecutiveAfterDueSuccesses, lastReviewedAt: attempt.committedAt };
}

function addDaysIso(value: string, days: number): string {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
