import type { ReviewQueueEntry, TrainingAttempt } from "../../domain";
import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import { createResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import type { ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import type { TrainingSession } from "../../domain";
import { createAttemptId } from "../learningMutations/identity";
import { createTrainingAttempt } from "../../domain/learning/trainingAttempt";

export async function createCanonicalAttempt(input: Readonly<{
  session: TrainingSession;
  occurrenceId: string;
  item: ResolvedContentRef;
  response: unknown;
  result: TrainingAttempt<unknown>["result"];
  reviewEvidence: TrainingAttempt<unknown>["reviewEvidence"];
  answeredAt: string;
  committedAt: string;
}>): Promise<TrainingAttempt<unknown>> {
  return createTrainingAttempt({
    id: await createAttemptId(input.session.id, input.occurrenceId, input.response),
    sessionId: input.session.id,
    trackId: input.session.trackId,
    modeId: input.session.modeId,
    occurrenceId: input.occurrenceId,
    item: input.item,
    response: input.response,
    result: input.result,
    reviewEvidence: input.reviewEvidence,
    answeredAt: input.answeredAt,
    committedAt: input.committedAt,
  });
}

/** Exact content scoping only; each family decides which evidence contributes to a query or policy. */
export function scopeReviewsToExactCatalog(reviews: readonly ReviewQueueEntry[], catalog: TrainingCatalog): readonly ReviewQueueEntry[] {
  return reviews.filter((entry) => entry.trackId === catalog.trackId && entry.sourceItem.trackId === catalog.trackId && entry.sourceItem.contentVersion === catalog.contentVersion && entry.sourceItem.artifactSha256 === catalog.artifactSha256);
}

/** Exact content scoping only; ordering, ranking and qualification remain family-owned. */
export function scopeAttemptsToExactCatalog(attempts: readonly TrainingAttempt<unknown>[], catalog: TrainingCatalog): readonly TrainingAttempt<unknown>[] {
  return attempts.filter((attempt) => attempt.trackId === catalog.trackId && attempt.item.trackId === catalog.trackId && attempt.item.contentVersion === catalog.contentVersion && attempt.item.artifactSha256 === catalog.artifactSha256);
}

/** Resolves a selected question to the active package's exact pin; callers own selection. */
export function exactCanonicalQuestionRef(catalog: TrainingCatalog, questionId: string): ResolvedContentRef {
  const question = catalog.getQuestion(questionId);
  if (!question || question.trackId !== catalog.trackId) throw new Error("Selected canonical question is unavailable in the exact catalog.");
  return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 });
}

