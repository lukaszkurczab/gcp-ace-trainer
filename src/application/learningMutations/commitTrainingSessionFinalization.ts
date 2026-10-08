import type { ResolvedContentRef, ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionDraft, TrainingSessionResult } from "../../domain";
import { getTrainingSessionFinalizationCleanupKind } from "../../domain";
import { resolvedContentRefKey, resolvedContentRefsEqual } from "../../domain/learning/resolvedContentRef";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { getActiveTrainingSessionDraft } from "../../storage/repositories";
import { getReviewQueueSnapshot } from "../../storage/repositories/reviewQueueRepository";
import { StaleMutationRevisionError } from "../../storage/repositories/mutationJournalRepository";
import { JournalWriteError } from "../../storage/errors";
import { MutationCommitFailure } from "../mutationBoundary";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutationAfterPreflight } from "./commitMutation";

export type TrainingSessionFinalizationCleanup =
  Readonly<{ kind: "training_session_draft"; draft: TrainingSessionDraft; submittedOccurrenceIds: readonly string[] }>;

export type TrainingSessionFinalizationReviewMutation = Readonly<{
  action: "put" | "update" | "delete";
  record: ReviewQueueEntry;
  transitionAttemptId: string;
}>;

export async function commitTrainingSessionFinalization(input: {
  session: TrainingSession;
  attempts: readonly TrainingAttempt<unknown>[];
  reviewMutations: readonly TrainingSessionFinalizationReviewMutation[];
  reviewBaseline?: readonly ReviewQueueEntry[];
  result?: TrainingSessionResult;
  cleanup: TrainingSessionFinalizationCleanup;
  createdAt: string;
}): Promise<boolean> {
  if (input.session.status !== "completed") throw new Error("Training session finalization requires a completed session.");
  const expectedCleanup = getTrainingSessionFinalizationCleanupKind(input.session);
  if (expectedCleanup !== "session_draft") {
    throw new Error("Training session finalization cleanup does not match the session configuration.");
  }
  if (input.cleanup.kind === "training_session_draft") {
    const currentDraft = await getActiveTrainingSessionDraft();
    if (!currentDraft || canonicalSerialize(currentDraft) !== canonicalSerialize(input.cleanup.draft)) {
      throw new Error("The active training session draft does not match the finalization draft.");
    }
    const submitted = new Set(input.cleanup.submittedOccurrenceIds);
    if (submitted.size !== input.cleanup.submittedOccurrenceIds.length || submitted.size !== input.attempts.length || input.attempts.some((attempt) => !submitted.has(attempt.occurrenceId))) {
      throw new Error("Finalization attempts must match the explicit submitted draft occurrence set.");
    }
  }
  const attemptById = new Map(input.attempts.map((attempt) => [attempt.id, attempt]));
  const occurrenceIndex = new Map(input.session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, index]));
  const reviewMutationByContent = new Map<string, TrainingSessionFinalizationReviewMutation>();
  for (const mutation of input.reviewMutations) {
    const attempt = attemptById.get(mutation.transitionAttemptId);
    if (!attempt) throw new Error(`Review transition attempt ${mutation.transitionAttemptId} is outside the finalization attempts.`);
    if (!resolvedContentRefsEqual(attempt.item, mutation.record.sourceItem)) {
      throw new Error(`Review transition attempt ${mutation.transitionAttemptId} does not match its review content.`);
    }
    const key = contentKey(mutation.record.sourceItem);
    const current = reviewMutationByContent.get(key);
    const currentAttempt = current ? attemptById.get(current.transitionAttemptId) : undefined;
    if (!currentAttempt || (occurrenceIndex.get(attempt.occurrenceId) ?? -1) > (occurrenceIndex.get(currentAttempt.occurrenceId) ?? -1)) {
      reviewMutationByContent.set(key, mutation);
    }
  }
  let reviewConflict = false;
  const execute = (includeReviewWrites: boolean) => commitMutationAfterPreflight(async () => {
    const snapshot = await getReviewQueueSnapshot();
    const mutations = includeReviewWrites ? [...reviewMutationByContent.values()] : [];
    const touchedKeys = new Set(mutations.map(({ record }) => `${record.trackId}:${contentKey(record.sourceItem)}`));
    if (includeReviewWrites && input.reviewBaseline !== undefined) {
      for (const key of touchedKeys) {
        const prior = input.reviewBaseline.filter((entry) => `${entry.trackId}:${contentKey(entry.sourceItem)}` === key).sort((a, b) => a.id.localeCompare(b.id));
        const current = snapshot.value.entries.filter((entry) => `${entry.trackId}:${contentKey(entry.sourceItem)}` === key).sort((a, b) => a.id.localeCompare(b.id));
        if (canonicalSerialize(prior) !== canonicalSerialize(current)) { reviewConflict = true; break; }
      }
    }
    const accepted = reviewConflict ? [] : mutations;
    const writes = [
      ...input.attempts.map((record) => ({ kind: "put_attempt", record } as const)),
      ...accepted.map(({ action, record, transitionAttemptId }) => {
        if (action === "delete") return { kind: "delete_review_entry_for_attempt", record, transitionId: transitionAttemptId } as const;
        if (action === "put") return { kind: "put_review_entry_for_attempt", record, transitionId: transitionAttemptId } as const;
        return { kind: "update_review_entry", record, transitionId: transitionAttemptId } as const;
      }),
      ...(input.result ? [{ kind: "put_session_result", record: input.result } as const] : []),
      { kind: "put_session", record: input.session } as const,
      { kind: "clear_active_session", sessionId: input.session.id } as const,
      { kind: "delete_active_session_draft", record: input.cleanup.draft, submittedOccurrenceIds: [...input.cleanup.submittedOccurrenceIds] } as const,
    ];
    const reviewTargets = new Set(accepted.map(({ record }) => `review:${record.id}`));
    const expectedRevisionOverrides = [
      ...[...reviewTargets].map((target) => ({ target, revision: snapshot.value.revisions[target.slice("review:".length)] ?? null })),
      ...(reviewTargets.size > 0 ? [{ target: "review_index", revision: snapshot.value.indexRevision }] : []),
    ];
    return buildMutationJournal({
      operation: "finalize_training_session",
      sessionId: input.session.id,
      trackId: input.session.trackId,
      identity: JSON.parse(JSON.stringify([input.session, input.attempts, accepted, input.result, input.cleanup])),
      writes,
      createdAt: input.createdAt,
      expectedRevisionOverrides,
    });
  });
  try { await execute(true); }
  catch (error) {
    if (!isStaleReviewRevision(error)) throw error;
    reviewConflict = true;
    await execute(false);
  }
  return reviewConflict;
}

function isStaleReviewRevision(error: unknown): boolean {
  if (!(error instanceof MutationCommitFailure) || error.phase !== "journal_write" || error.durableState !== "not_durable") return false;
  if (!(error.cause instanceof JournalWriteError) || !(error.cause.cause instanceof StaleMutationRevisionError)) return false;
  const target = error.cause.cause.target;
  return target === "review_index" || target.startsWith("review:");
}

function contentKey(item: ResolvedContentRef): string {
  return resolvedContentRefKey(item);
}
