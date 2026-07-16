import type { ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionDraft, TrainingSessionResult } from "../../domain";
import { getTrainingSessionFinalizationCleanupKind } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { getActiveTrainingSessionDraft } from "../../storage/repositories";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";

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
  result?: TrainingSessionResult;
  cleanup: TrainingSessionFinalizationCleanup;
  createdAt: string;
}): Promise<void> {
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
    if (contentKey(attempt.item) !== contentKey(mutation.record.sourceItem)) {
      throw new Error(`Review transition attempt ${mutation.transitionAttemptId} does not match its review content.`);
    }
    const key = contentKey(mutation.record.sourceItem);
    const current = reviewMutationByContent.get(key);
    const currentAttempt = current ? attemptById.get(current.transitionAttemptId) : undefined;
    if (!currentAttempt || (occurrenceIndex.get(attempt.occurrenceId) ?? -1) > (occurrenceIndex.get(currentAttempt.occurrenceId) ?? -1)) {
      reviewMutationByContent.set(key, mutation);
    }
  }
  const writes = [
    ...input.attempts.map((record) => ({ kind: "put_attempt", record } as const)),
    ...[...reviewMutationByContent.values()].map(({ action, record, transitionAttemptId }) => {
      if (action === "delete") return { kind: "delete_review_entry_for_attempt", record, transitionId: transitionAttemptId } as const;
      if (action === "put") return { kind: "put_review_entry_for_attempt", record, transitionId: transitionAttemptId } as const;
      return { kind: "update_review_entry", record, transitionId: transitionAttemptId } as const;
    }),
    ...(input.result ? [{ kind: "put_session_result", record: input.result } as const] : []),
    { kind: "put_session", record: input.session } as const,
    { kind: "clear_active_session", sessionId: input.session.id } as const,
    { kind: "delete_active_session_draft", record: input.cleanup.draft, submittedOccurrenceIds: [...input.cleanup.submittedOccurrenceIds] } as const,
  ];
  await commitMutation(await buildMutationJournal({
    operation: "finalize_training_session",
    sessionId: input.session.id,
    trackId: input.session.trackId,
    identity: JSON.parse(JSON.stringify([input.session, input.attempts, [...reviewMutationByContent.values()], input.result, input.cleanup])),
    writes,
    createdAt: input.createdAt,
  }));
}

function contentKey(item: { trackId: string; contentVersion: string; itemId: string }): string {
  return `${item.trackId}:${item.contentVersion}:${item.itemId}`;
}
