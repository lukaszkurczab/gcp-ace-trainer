import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../../domain";
import { resolvedContentRefKey } from "../../domain/learning/resolvedContentRef";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { JournalWriteError } from "../../storage/errors";
import { getReviewQueueSnapshot } from "../../storage/repositories/reviewQueueRepository";
import { StaleMutationRevisionError } from "../../storage/repositories/mutationJournalRepository";
import { MutationCommitFailure } from "../mutationBoundary";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutationAfterPreflight } from "./commitMutation";

export async function commitTrainingOutcome(input: {
  attempt: TrainingAttempt<unknown>;
  session: TrainingSession;
  reviews: readonly ReviewQueueEntry[];
  resolvedReviews?: readonly ReviewQueueEntry[];
  reviewBaseline?: readonly ReviewQueueEntry[];
  reviewSnapshotConflict?: boolean;
  createdAt: string;
}): Promise<boolean> {
  let conflict = input.reviewSnapshotConflict === true;
  const execute = (includeReviewWrites: boolean) => commitMutationAfterPreflight(async () => {
    const snapshot = await getReviewQueueSnapshot();
    const reviewWrites = includeReviewWrites ? input.reviews : [];
    const resolvedReviews = includeReviewWrites ? input.resolvedReviews ?? [] : [];
    const touched = [...reviewWrites, ...resolvedReviews];
    const semanticConflict = includeReviewWrites && input.reviewBaseline !== undefined && !baselineMatchesTouchedRefs(input.reviewBaseline, snapshot.value.entries, touched);
    if (semanticConflict) conflict = true;
    const acceptedReviewWrites = semanticConflict ? [] : reviewWrites;
    const acceptedResolvedReviews = semanticConflict ? [] : resolvedReviews;
    const writes = [
      { kind: "put_attempt", record: input.attempt } as const,
      ...acceptedReviewWrites.map((record) => record.sourceAttemptId === input.attempt.id
        ? ({ kind: "put_review_entry", record } as const)
        : ({ kind: "update_review_entry", record, transitionId: input.attempt.id } as const)),
      ...acceptedResolvedReviews.map((record) => ({ kind: "delete_review_entry", record } as const)),
      { kind: "put_session", record: input.session } as const,
    ];
    const reviewTargets = new Set<string>();
    for (const record of [...acceptedReviewWrites, ...acceptedResolvedReviews]) reviewTargets.add(`review:${record.id}`);
    const expectedRevisionOverrides = [
      ...[...reviewTargets].map((target) => {
        const id = target.slice("review:".length);
        return { target, revision: snapshot.value.revisions[id] ?? null };
      }),
      ...(reviewTargets.size > 0 ? [{ target: "review_index", revision: snapshot.value.indexRevision }] : []),
    ];
    return buildMutationJournal({
      operation: "submit_training_outcome",
      sessionId: input.session.id,
      trackId: input.session.trackId,
      identity: [input.attempt.id, input.attempt.response, acceptedResolvedReviews.map((record) => record.id)],
      writes,
      createdAt: input.createdAt,
      expectedRevisionOverrides,
    });
  });

  try {
    await execute(true);
  } catch (error) {
    const stale = staleReviewRevisionFrom(error);
    if (!stale) throw error;
    // The expected review revision changed after the exact read used to build the
    // journal. Preserve the graded attempt and session exactly once, without
    // applying a review transition based on stale evidence.
    conflict = true;
    await execute(false);
  }
  return conflict;
}

function baselineMatchesTouchedRefs(baseline: readonly ReviewQueueEntry[], current: readonly ReviewQueueEntry[], touched: readonly ReviewQueueEntry[]): boolean {
  const keys = new Set(touched.map((entry) => `${entry.trackId}:${resolvedContentRefKey(entry.sourceItem)}`));
  for (const key of keys) {
    const prior = baseline.filter((entry) => `${entry.trackId}:${resolvedContentRefKey(entry.sourceItem)}` === key).sort((a, b) => a.id.localeCompare(b.id));
    const now = current.filter((entry) => `${entry.trackId}:${resolvedContentRefKey(entry.sourceItem)}` === key).sort((a, b) => a.id.localeCompare(b.id));
    if (canonicalSerialize(prior) !== canonicalSerialize(now)) return false;
  }
  return true;
}

function staleReviewRevisionFrom(error: unknown): StaleMutationRevisionError | null {
  if (!(error instanceof MutationCommitFailure) || error.phase !== "journal_write" || error.durableState !== "not_durable") return null;
  const journalError = error.cause;
  if (!(journalError instanceof JournalWriteError)) return null;
  const stale = journalError.cause;
  return stale instanceof StaleMutationRevisionError && (stale.target.startsWith("review:") || stale.target === "review_index") ? stale : null;
}
