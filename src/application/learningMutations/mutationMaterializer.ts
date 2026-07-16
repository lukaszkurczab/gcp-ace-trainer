import { JournalMaterializationError } from "../../storage/errors";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import {
  addReviewQueueItems,
  addTrainingAttempt,
  clearActiveTrainingSession,
  clearActiveForegroundTimer,
  clearActiveTrainingSessionDraft,
  clearActiveSessionRuntime,
  getActiveTrainingSessionDraft,
  getActiveSessionRuntime,
  getReviewQueueItems,
  getTrainingSessions,
  materializeActiveTrainingSessionDraft,
  removeReviewQueueEntry,
  saveTrainingSession,
} from "../../storage/repositories";
import { assertMutationJournalIntegrity, type MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";

function unsupportedWrite(write: never): never { throw new Error(`Unsupported journal write kind: ${String((write as { kind?: unknown }).kind)}.`); }

export async function materializeMutation(record: MutationJournalRecord): Promise<void> {
  try {
    assertMutationJournalIntegrity(record);
    await assertDraftDeletePreflight(record);
    await assertDraftClearPreflight(record);
    await assertReviewDeletePreflight(record);
    for (const write of record.writes) {
      switch (write.kind) {
        case "put_attempt": await addTrainingAttempt(write.record); break;
        case "put_review_entry":
        case "put_review_entry_for_attempt": await addReviewQueueItems([write.record]); break;
        case "update_review_entry": {
          if (!(await getReviewQueueItems()).value.some((entry) => entry.id === write.record.id)) throw new Error(`Review update ${write.record.id} has no durable record to update.`);
          await addReviewQueueItems([write.record]);
          break;
        }
        case "delete_review_entry": await removeReviewQueueEntry(write.record.id); break;
        case "delete_review_entry_for_attempt": {
          const durable = (await getReviewQueueItems()).value.find((entry) => entry.id === write.record.id);
          if (durable) await removeReviewQueueEntry(write.record.id);
          break;
        }
        case "put_session": await saveTrainingSession(write.record); break;
        case "put_active_session_draft": await materializeActiveTrainingSessionDraft(write.record); break;
        case "clear_active_session":
          await clearActiveTrainingSession(write.sessionId);
          await clearActiveForegroundTimer(write.sessionId);
          break;
        case "clear_active_session_draft": await clearActiveTrainingSessionDraft(write.sessionId); break;
        case "delete_active_session_draft": {
          const activeDraft = await getActiveTrainingSessionDraft();
          if (activeDraft && canonicalSerialize(activeDraft) !== canonicalSerialize(write.record)) throw new Error(`Active draft for ${write.record.sessionId} does not match the journaled finalization draft.`);
          if (activeDraft) await clearActiveTrainingSessionDraft(write.record.sessionId);
          break;
        }
        case "clear_active_exam": {
          const activeRuntime = await getActiveSessionRuntime();
          if (activeRuntime?.session.id === write.sessionId) await clearActiveSessionRuntime();
          break;
        }
        default: unsupportedWrite(write);
      }
    }
  } catch (error) {
    throw new JournalMaterializationError(error);
  }
}

async function assertDraftClearPreflight(record: MutationJournalRecord): Promise<void> {
  const draftClear = record.writes.find((write): write is Extract<MutationJournalRecord["writes"][number], { kind: "clear_active_session_draft" }> => write.kind === "clear_active_session_draft");
  if (!draftClear) return;
  const sessionWrite = record.writes.find((write): write is Extract<MutationJournalRecord["writes"][number], { kind: "put_session" }> => write.kind === "put_session");
  const activeDraft = await getActiveTrainingSessionDraft();
  if (activeDraft) {
    if (!sessionWrite || activeDraft.sessionId !== draftClear.sessionId || activeDraft.sessionId !== sessionWrite.record.id || activeDraft.trackId !== sessionWrite.record.trackId) {
      throw new Error(`Active draft does not match the journaled abandonment for ${draftClear.sessionId}.`);
    }
    return;
  }
  const durableSession = sessionWrite ? (await getTrainingSessions()).value.find((session) => session.id === sessionWrite.record.id) : undefined;
  if (!sessionWrite || !durableSession || canonicalSerialize(durableSession) !== canonicalSerialize(sessionWrite.record)) {
    throw new Error(`Journaled draft cleanup for ${draftClear.sessionId} cannot replay before its terminal session is durable.`);
  }
}

async function assertReviewDeletePreflight(record: MutationJournalRecord): Promise<void> {
  const deletes = record.writes.filter((write) => write.kind === "delete_review_entry_for_attempt");
  if (deletes.length === 0) return;
  const durable = (await getReviewQueueItems()).value;
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
  const activeDraft = await getActiveTrainingSessionDraft();
  if (activeDraft) {
    if (canonicalSerialize(activeDraft) !== canonicalSerialize(draftDelete.record)) throw new Error(`Active draft for ${draftDelete.record.sessionId} does not match the journaled finalization draft.`);
    return;
  }
  const completedWrite = record.writes.find((write) => write.kind === "put_session");
  const durableSession = completedWrite ? (await getTrainingSessions()).value.find((session) => session.id === completedWrite.record.id) : undefined;
  if (!completedWrite || !durableSession || canonicalSerialize(durableSession) !== canonicalSerialize(completedWrite.record)) {
    throw new Error(`Journaled draft deletion for ${draftDelete.record.sessionId} cannot replay before its completed session is durable.`);
  }
}
