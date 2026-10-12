import { JournalVerificationError, StorageReadError } from "../../storage/errors";
import { areMutationPhysicalWritesAfter, getActiveForegroundTimer, getActiveTrainingSessionDraft, getActiveTrainingSessionId, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, getTrainingSessionResult, hasReviewQueueEntryRecord } from "../../storage/repositories";
import { assertValidMutationJournal, type MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { isGoalPlanAcceptanceMaterialized } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { isAccountSyncConflictResolutionMaterialized } from "../../storage/repositories/accountSyncConflictResolutionRepository";
import { assertTrainingEvidenceIntegrity } from "../../storage/repositories/trainingEvidenceIntegrityRepository";
import { assertLearningStateResetMaterialized } from "../../storage/repositories/learningStateResetRepository";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { resolveGoalPolicy } from "../../domain/goals/goalPolicy";
const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
function unsupportedWrite(write: never): never { throw new JournalVerificationError(); }
export async function verifyMutation(record: MutationJournalRecord): Promise<void> {
  try { assertValidMutationJournal(record, productionLearningDataAdmissionContext); } catch { throw new JournalVerificationError(); }
  if (record.operation === "accept_goal_plan") {
    const pair = record.writes[0];
    if (pair?.kind !== "accept_goal_plan" || !isGoalPlanAcceptanceMaterialized(pair.record, resolveGoalPolicy(productionLearningDataAdmissionContext.goalPolicyResolver, pair.record.trackId))) throw new JournalVerificationError();
    return;
  }
  if (record.operation === "resolve_account_sync_conflict") {
    const resolution = record.writes[0];
    if (resolution?.kind !== "resolve_account_sync_conflict" || !isAccountSyncConflictResolutionMaterialized(resolution.record, resolveGoalPolicy(productionLearningDataAdmissionContext.goalPolicyResolver, resolution.record.trackId), productionLearningDataAdmissionContext)) throw new JournalVerificationError();
    return;
  }
  if (record.operation === "reset_learning_state") {
    const reset = record.writes[0];
    if (reset?.kind !== "clear_learning_state") throw new JournalVerificationError();
    try { assertLearningStateResetMaterialized(reset.targetPlan); } catch { throw new JournalVerificationError(); }
    return;
  }
  try {
    if (!areMutationPhysicalWritesAfter(record.physicalWrites)) throw new JournalVerificationError();
    assertTrainingEvidenceIntegrity(productionTrackAdmissionContext);
  } catch (error) {
    if (error instanceof StorageReadError) throw error;
    if (error instanceof JournalVerificationError) throw error;
    throw new JournalVerificationError();
  }
  const [sessions, attempts, reviews, activeSessionId, activeDraft, timer] = await Promise.all([getTrainingSessions(productionTrackAdmissionContext), getTrainingAttempts(productionTrackAdmissionContext), getReviewQueueItems(productionTrackAdmissionContext), getActiveTrainingSessionId(), getActiveTrainingSessionDraft(productionTrackAdmissionContext), getActiveForegroundTimer(productionTrackAdmissionContext)]);
  if (record.operation === "complete_training_session") {
    const completed = record.writes.filter((write) => write.kind === "put_session");
    const results = record.writes.filter((write) => write.kind === "put_session_result");
    if (completed.length !== 1 || results.length !== 1 || completed[0]!.record.status !== "completed" || results[0]!.record.sessionId !== completed[0]!.record.id || results[0]!.record.trackId !== completed[0]!.record.trackId) throw new JournalVerificationError();
  }
  for (const write of record.writes) {
    switch (write.kind) {
      case "accept_goal_plan": throw new JournalVerificationError();
      case "resolve_account_sync_conflict": throw new JournalVerificationError();
      case "put_session": if (!equal(sessions.value.find((entry) => entry.id === write.record.id), write.record)) throw new JournalVerificationError(); break;
      case "put_active_foreground_timer": if (!equal(timer, write.record)) throw new JournalVerificationError(); break;
      case "put_session_result": if (!equal(await getTrainingSessionResult(write.record.sessionId, productionTrackAdmissionContext), write.record)) throw new JournalVerificationError(); break;
      case "put_attempt": if (!equal(attempts.value.find((entry) => entry.id === write.record.id), write.record)) throw new JournalVerificationError(); break;
      case "put_review_entry":
      case "put_review_entry_for_attempt":
      case "update_review_entry": if (!equal(reviews.value.find((entry) => entry.id === write.record.id), write.record)) throw new JournalVerificationError(); break;
      case "delete_review_entry":
      case "delete_review_entry_for_attempt": if (reviews.value.some((entry) => entry.id === write.record.id) || await hasReviewQueueEntryRecord(write.record.id, productionTrackAdmissionContext)) throw new JournalVerificationError(); break;
      case "clear_active_session": if (activeSessionId === write.sessionId || timer !== null) throw new JournalVerificationError(); break;
      case "put_active_session_draft": if (!equal(activeDraft, write.record)) throw new JournalVerificationError(); break;
      case "clear_active_session_draft":
      case "delete_active_session_draft": if (activeDraft !== null) throw new JournalVerificationError(); break;
      case "clear_learning_state": throw new JournalVerificationError();
      default: unsupportedWrite(write);
    }
  }
}
