import { JournalMaterializationError } from "../../storage/errors";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { canPersistTrainingSessionDraft } from "../../domain";
import {
  getActiveTrainingSessionDraft,
  materializeMutationPhysicalWrites,
  readReviewQueueForJournal,
  readTrainingSessionForJournal,
  assertTrainingSessionJournalWrite,
  assertTrainingSessionResultJournalWrite,
} from "../../storage/repositories";
import { readActiveTrainingSessionDraftStateProof } from "../../storage/repositories/trainingSessionDraftRepository";
import { isAcceptedSimulationFinalization } from "../../storage/repositories/trainingModelGuards";
import { assertValidMutationJournal, getActiveMutationJournal, type MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { assertTrainingEvidenceJournalPreflight } from "../../storage/repositories/trainingEvidenceIntegrityRepository";
import { assertLearningStateResetReplayState, materializeLearningStateReset } from "../../storage/repositories/learningStateResetRepository";
import { materializeGoalPlanAcceptance, type GoalPlanAcceptanceInterruptionHook } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { materializeAccountSyncConflictResolution } from "../../storage/repositories/accountSyncConflictResolutionRepository";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { resolveGoalPolicy } from "../../domain/goals/goalPolicy";

export async function materializeMutation(record: MutationJournalRecord, beforeGoalPlanWrite?: GoalPlanAcceptanceInterruptionHook): Promise<void> {
  try {
    assertValidMutationJournal(record, productionLearningDataAdmissionContext);
    if (record.operation === "reset_learning_state") {
      const reset = record.writes[0];
      if (reset?.kind !== "clear_learning_state") throw new Error("A reset journal has no exact physical target plan.");
      assertLearningStateResetReplayState(reset.targetPlan);
    } else {
      assertTrainingEvidenceJournalPreflight(record, productionTrackAdmissionContext);
    }
    if (record.operation === "accept_goal_plan" || record.operation === "resolve_account_sync_conflict") {
      const write = record.writes[0];
      if (write?.kind === "accept_goal_plan") materializeGoalPlanAcceptance(write.record, record, resolveGoalPolicy(productionLearningDataAdmissionContext.goalPolicyResolver, write.record.trackId), beforeGoalPlanWrite ? (context) => {
        const active = getActiveMutationJournal(productionLearningDataAdmissionContext);
        if (!active || canonicalSerialize(active) !== canonicalSerialize(record)) throw new Error("The exact durable goal-plan journal is no longer current.");
        beforeGoalPlanWrite(Object.freeze({ ...context, journal: active }));
      } : undefined);
      else if (write?.kind === "resolve_account_sync_conflict") materializeAccountSyncConflictResolution(write.record, record, resolveGoalPolicy(productionLearningDataAdmissionContext.goalPolicyResolver, write.record.trackId), productionLearningDataAdmissionContext);
      else throw new Error("A pair journal has no exact typed write.");
      return;
    }
    if (record.operation === "reset_learning_state") {
      const reset = record.writes[0];
      if (reset?.kind !== "clear_learning_state") throw new Error("A reset journal has no exact physical target plan.");
      materializeLearningStateReset(reset.targetPlan);
      return;
    }
    await assertDraftDeletePreflight(record);
    await assertDraftClearPreflight(record);
    await assertReviewDeletePreflight(record);
    for (const write of record.writes) {
      if (write.kind === "put_session") await assertTrainingSessionJournalWrite(write.record, productionTrackAdmissionContext);
      if (write.kind === "put_session_result") await assertTrainingSessionResultJournalWrite(write.record, productionTrackAdmissionContext);
    }
    const draftPut = record.writes.find((write) => write.kind === "put_active_session_draft");
    if (draftPut?.kind === "put_active_session_draft") {
      const sessionWrite = record.writes.find((write) => write.kind === "put_session");
      const activeDraft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
      if (!sessionWrite || sessionWrite.kind !== "put_session" || sessionWrite.record.status !== "active" ||
        sessionWrite.record.id !== draftPut.record.sessionId || sessionWrite.record.trackId !== draftPut.record.trackId || !canPersistTrainingSessionDraft(sessionWrite.record) ||
        (activeDraft && canonicalSerialize(activeDraft) !== canonicalSerialize(draftPut.record))) {
        throw new Error("Journaled active draft does not match its active session or conflicts with the durable draft.");
      }
    }
    materializeMutationPhysicalWrites(record, productionTrackAdmissionContext);
  } catch (error) {
    throw new JournalMaterializationError(error);
  }
}

async function assertDraftClearPreflight(record: MutationJournalRecord): Promise<void> {
  const draftClear = record.writes.find((write): write is Extract<MutationJournalRecord["writes"][number], { kind: "clear_active_session_draft" }> => write.kind === "clear_active_session_draft");
  if (!draftClear) return;
  const sessionWrite = record.writes.find((write): write is Extract<MutationJournalRecord["writes"][number], { kind: "put_session" }> => write.kind === "put_session");
  const activeDraft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
  if (activeDraft) {
    if (!sessionWrite || activeDraft.sessionId !== draftClear.sessionId || activeDraft.sessionId !== sessionWrite.record.id || activeDraft.trackId !== sessionWrite.record.trackId) {
      throw new Error(`Active draft does not match the journaled abandonment for ${draftClear.sessionId}.`);
    }
    return;
  }
  const durableSession = sessionWrite ? readTrainingSessionForJournal(sessionWrite.record, productionTrackAdmissionContext) ?? undefined : undefined;
  if (!sessionWrite || !durableSession || canonicalSerialize(durableSession) !== canonicalSerialize(sessionWrite.record)) {
    throw new Error(`Journaled draft cleanup for ${draftClear.sessionId} cannot replay before its terminal session is durable.`);
  }
}

async function assertReviewDeletePreflight(record: MutationJournalRecord): Promise<void> {
  const deletes = record.writes.filter((write) => write.kind === "delete_review_entry_for_attempt");
  if (deletes.length === 0) return;
  const durable = readReviewQueueForJournal(deletes.map((write) => write.record), productionTrackAdmissionContext);
  for (const write of deletes) {
    const existing = durable.find((entry) => entry.id === write.record.id);
    if (existing && canonicalSerialize(existing) !== canonicalSerialize(write.record)) {
      throw new Error(`Review delete ${write.record.id} conflicts with its durable review identity.`);
    }
  }
}

async function assertDraftDeletePreflight(record: MutationJournalRecord): Promise<void> {
  const draftDelete = record.writes.find((write) => write.kind === "delete_active_session_draft");
  if (!draftDelete) return;
  const state = readActiveTrainingSessionDraftStateProof(productionTrackAdmissionContext);
  if (state) {
    if (canonicalSerialize(state.state) !== canonicalSerialize(draftDelete.record)) throw new Error("Active D state does not match the exact journaled finalization cleanup.");
    return;
  }
  const completedWrite = record.writes.find((write) => write.kind === "put_session");
  const durableSession = completedWrite ? readTrainingSessionForJournal(completedWrite.record, productionTrackAdmissionContext) ?? undefined : undefined;
  if (!completedWrite || !durableSession || canonicalSerialize(durableSession) !== canonicalSerialize(completedWrite.record)) {
    const draft = isAcceptedSimulationFinalization(draftDelete.record, productionTrackAdmissionContext) ? draftDelete.record.responseDraft : draftDelete.record;
    throw new Error(`Journaled draft deletion for ${draft.sessionId} cannot replay before its completed session is durable.`);
  }
}
