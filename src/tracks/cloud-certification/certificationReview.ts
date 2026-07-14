import type { ReviewQueueEntry, TrainingAttempt } from "../../domain/learning";
import type { CertificationResponse } from "./domain";

export function createCertificationReviewEntry(
  attempt: TrainingAttempt<CertificationResponse>,
  dueAt = addDaysIso(attempt.committedAt, 1),
): ReviewQueueEntry | undefined {
  if (attempt.result.kind === "correct") return undefined;
  return {
    consecutiveAfterDueSuccesses: 0,
    createdAt: attempt.committedAt,
    dueAt,
    id: `review:${attempt.id}`,
    persistent: true,
    reasons: [attempt.result.kind],
    sourceAttemptId: attempt.id,
    sourceSessionId: attempt.sessionId,
    sourceItem: attempt.reviewEvidence.sourceItem,
    taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs,
    trackId: attempt.trackId,
  };
}

function addDaysIso(value: string, days: number): string {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
