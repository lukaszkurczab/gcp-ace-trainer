import type { AttemptResult } from "./attemptResult";
import type { ContentItemRef } from "./contentItemRef";
import type { ReviewEvidence } from "./reviewEvidence";
import type { TrackId } from "./trackIdentity";

export type TrainingAttempt<TResponse = unknown> = Readonly<{
  id: string;
  sessionId: string;
  trackId: TrackId;
  modeId: string;
  occurrenceId: string;
  item: ContentItemRef;
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
  if (attempt.item.trackId !== attempt.trackId || attempt.reviewEvidence.sourceItem.trackId !== attempt.item.trackId || attempt.reviewEvidence.sourceItem.itemId !== attempt.item.itemId || attempt.reviewEvidence.sourceItem.contentVersion !== attempt.item.contentVersion) {
    throw new Error("Training attempt item and review evidence must identify the same track item.");
  }
  return Object.freeze({ ...attempt });
}
