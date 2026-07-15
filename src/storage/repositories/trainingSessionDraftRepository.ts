import { canPersistTrainingSessionDraft, createTrainingSessionDraft, type TrainingSessionDraft } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isTrainingSessionDraft } from "./trainingModelGuards";
import { getActiveMutationJournal } from "./mutationJournalRepository";

export async function getActiveTrainingSessionDraft(): Promise<TrainingSessionDraft | null> {
  const stored = readStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  return stored ? createTrainingSessionDraft(stored) : null;
}

export async function saveTrainingSessionDraft(draft: TrainingSessionDraft): Promise<void> {
  if (!isTrainingSessionDraft(draft)) throw new Error("Training session draft is invalid.");
  if (await getActiveMutationJournal()) throw new Error("Training session draft cannot change while a durable mutation is pending.");
  const activeSession = await getActiveTrainingSession();
  if (!activeSession || activeSession.status !== "active") throw new Error("An active training session is required to save a draft.");
  if (!canPersistTrainingSessionDraft(activeSession)) throw new Error("The active training session does not permit persisted draft responses.");
  if (draft.sessionId !== activeSession.id || draft.trackId !== activeSession.trackId) {
    throw new Error("Training session draft scope does not match the active session.");
  }
  const occurrenceIds = new Set(activeSession.itemOrder.map((occurrence) => occurrence.occurrenceId));
  const unknownOccurrenceId = Object.keys(draft.responsesByOccurrenceId).find((occurrenceId) => !occurrenceIds.has(occurrenceId));
  if (unknownOccurrenceId) throw new Error(`Training session draft occurrence ${unknownOccurrenceId} is outside the active session plan.`);
  const existing = await getActiveTrainingSessionDraft();
  if (existing && (existing.sessionId !== draft.sessionId || existing.trackId !== draft.trackId)) {
    throw new Error("A different training session draft is already active.");
  }
  if (existing && Date.parse(draft.updatedAt) < Date.parse(existing.updatedAt)) {
    throw new Error("Training session draft update time cannot move backwards.");
  }
  if (existing && draft.updatedAt === existing.updatedAt && canonicalSerialize(existing) !== canonicalSerialize(draft)) {
    throw new Error("Training session draft cannot change at an already persisted update time.");
  }
  if (await getActiveMutationJournal()) throw new Error("Training session draft cannot change while a durable mutation is pending.");
  writeStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, createTrainingSessionDraft(draft));
}

export async function materializeActiveTrainingSessionDraft(draft: TrainingSessionDraft): Promise<void> {
  if (!isTrainingSessionDraft(draft)) throw new Error("Training session draft is invalid.");
  const journal = await getActiveMutationJournal();
  const planned = journal?.writes.find((write) => write.kind === "put_active_session_draft");
  if (!planned || canonicalSerialize(planned.record) !== canonicalSerialize(draft)) {
    throw new Error("Active training session draft is not owned by the pending mutation journal.");
  }
  const activeSession = await getActiveTrainingSession();
  if (!activeSession || activeSession.status !== "active" || activeSession.id !== draft.sessionId || activeSession.trackId !== draft.trackId || !canPersistTrainingSessionDraft(activeSession)) {
    throw new Error("Journaled training session draft does not match the active session.");
  }
  const existing = await getActiveTrainingSessionDraft();
  if (existing && canonicalSerialize(existing) !== canonicalSerialize(draft)) {
    throw new Error("A conflicting active training session draft is already durable.");
  }
  if (!existing) writeStoredJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, createTrainingSessionDraft(draft));
}

export async function clearActiveTrainingSessionDraft(sessionId: string): Promise<void> {
  const draft = await getActiveTrainingSessionDraft();
  if (draft?.sessionId === sessionId) removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
}

export async function clearTrainingSessionDrafts(): Promise<void> {
  removeStoredValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
}
