import type { MutationJournalRecord } from "./mutationJournalRepository";
import { assertCanonicalPhysicalPrefix, isCanonicalPhysicalWriteAfter, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { materializeTrainingAttemptBatch } from "./trainingAttemptRepository";
import { materializeReviewQueueBatch } from "./reviewQueueRepository";
import { materializeTrainingSessionJournalSteps } from "./trainingSessionRepository";
import { materializeTrainingSessionResultJournalSteps } from "./trainingSessionResultRepository";
import { materializeTrainingSessionDraftJournalStep } from "./trainingSessionDraftRepository";
import { materializeActiveForegroundTimerJournalStep } from "./foregroundTimerRepository";

/** Checks every captured key before the first physical write of a replay. */
export function assertMutationPhysicalWritePrefix(steps: readonly CanonicalPhysicalWrite[]): void {
  assertCanonicalPhysicalPrefix(steps);
}

/** Fresh terminal proof for the exact after envelope/revision or required absence. */
export function areMutationPhysicalWritesAfter(steps: readonly CanonicalPhysicalWrite[]): boolean {
  return steps.every(isCanonicalPhysicalWriteAfter);
}

/**
 * Dispatches the closed immutable journal plan through each owning repository.
 * The journal repository validates derivation; this module preserves family
 * batching and keeps the application layer away from the canonical codec.
 */
export function materializeMutationPhysicalWrites(record: MutationJournalRecord): void {
  const steps = record.physicalWrites;
  assertMutationPhysicalWritePrefix(steps);
  const attempts = record.writes.filter((write) => write.kind === "put_attempt").map((write) => write.record);
  materializeTrainingAttemptBatch(attempts, select(steps, (step) => step.target.startsWith("attempt:") || step.target === "attempt_index"));

  const reviewPuts = record.writes.filter((write) => write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry").map((write) => write.record);
  const reviewDeletes = record.writes.filter((write) => write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt").map((write) => write.record);
  const sessionIds = record.writes.filter((write) => write.kind === "put_session").map((write) => write.record.id);
  const clearSessionIds = record.writes.filter((write) => write.kind === "clear_active_session").map((write) => write.sessionId);
  const results = record.writes.filter((write) => write.kind === "put_session_result").map((write) => write.record);
  const hasDraftWrite = record.writes.some((write) => write.kind === "put_active_session_draft" || write.kind === "clear_active_session_draft" || write.kind === "delete_active_session_draft");
  const timer = select(steps, (step) => step.target === "active_foreground_timer");
  if (timer.length > 1 || (clearSessionIds.length === 0) !== (timer.length === 0)) throw new Error("The timer physical steps do not match the clear-session operation.");
  const reviewSteps = select(steps, (step) => step.target.startsWith("review:") || step.target === "review_index");
  materializeReviewQueueBatch(reviewPuts, reviewDeletes, reviewSteps);

  for (const step of steps) {
    if (step.target.startsWith("attempt:") || step.target === "attempt_index" || step.target.startsWith("review:") || step.target === "review_index") continue;
    if (step.target.startsWith("session:") || step.target === "session_index" || step.target === "active_session") {
      materializeTrainingSessionJournalSteps(sessionIds, clearSessionIds, [step]);
      continue;
    }
    if (step.target.startsWith("result:")) {
      materializeTrainingSessionResultJournalSteps(results, [step]);
      continue;
    }
    if (step.target === "active_session_draft") {
      materializeTrainingSessionDraftJournalStep(hasDraftWrite, [step]);
      continue;
    }
    if (step.target === "active_foreground_timer") {
      materializeActiveForegroundTimerJournalStep(clearSessionIds.length > 0, step);
      continue;
    }
    throw new Error(`No owning repository can apply physical target ${step.target}.`);
  }
}

function select(steps: readonly CanonicalPhysicalWrite[], predicate: (step: CanonicalPhysicalWrite) => boolean): CanonicalPhysicalWrite[] {
  return steps.filter(predicate);
}
