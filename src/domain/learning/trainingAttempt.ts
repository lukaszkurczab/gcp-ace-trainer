import type { AttemptResult } from "./attemptResult";
import { deepFreeze } from "./familyEnvelope";
import type { ReviewEvidence } from "./reviewEvidence";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "./resolvedContentRef";
import type { TrackId } from "./trackIdentity";

export type TrainingAttempt<TResponse = unknown> = Readonly<{
  id: string;
  sessionId: string;
  trackId: TrackId;
  modeId: string;
  occurrenceId: string;
  item: ResolvedContentRef;
  response: TResponse;
  result: AttemptResult;
  reviewEvidence: ReviewEvidence;
  answeredAt: string;
  committedAt: string;
  durationMs?: number;
}>;

export function createTrainingAttempt<TResponse>(attempt: TrainingAttempt<TResponse>): TrainingAttempt<TResponse> {
  if (!attempt.occurrenceId.trim()) {
    throw new Error("Training attempt occurrence identity is required.");
  }
  const item = createResolvedContentRef(attempt.item);
  const sourceItem = createResolvedContentRef(attempt.reviewEvidence.sourceItem);
  if (item.trackId !== attempt.trackId || !resolvedContentRefsEqual(sourceItem, item)) {
    throw new Error("Training attempt item and review evidence must identify the same resolved content reference.");
  }
  return deepFreeze({
    ...attempt,
    item,
    reviewEvidence: {
      ...attempt.reviewEvidence,
      sourceItem,
      taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs.map((ref) => ({ ...ref })),
    },
  });
}
