import type { AttemptResult } from "./attemptResult";
import type { ContentItemRef } from "./contentItemRef";
import type { ReviewEvidence } from "./reviewEvidence";
import type { TrackId } from "./trackIdentity";

export type TrainingAttempt<TResponse = unknown> = Readonly<{
  id: string;
  sessionId: string;
  trackId: TrackId;
  modeId: string;
  item: ContentItemRef;
  response: TResponse;
  result: AttemptResult;
  reviewEvidence: ReviewEvidence;
  answeredAt: string;
  committedAt: string;
  durationMs?: number;
}>;

export function createTrainingAttempt<TResponse>(attempt: TrainingAttempt<TResponse>): TrainingAttempt<TResponse> {
  if (attempt.item.trackId !== attempt.trackId || attempt.reviewEvidence.sourceItem.itemId !== attempt.item.itemId) {
    throw new Error("Training attempt item and review evidence must identify the same track item.");
  }
  return Object.freeze({ ...attempt });
}
