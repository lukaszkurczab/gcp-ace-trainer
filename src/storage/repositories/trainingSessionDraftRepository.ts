import { canPersistTrainingSessionDraft, createTrainingSessionDraft, StaleDraftRevisionError, type TrainingSessionDraft } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isTrainingSessionDraft } from "./trainingModelGuards";
import { getActiveMutationJournal } from "./mutationJournalRepository";

export async function getActiveTrainingSessionDraft(): Promise<TrainingSessionDraft | null> {
  const stored = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  return stored ? createTrainingSessionDraft(stored) : null;
}

export async function getActiveTrainingSessionDraftRevision(): Promise<number | null> {
  return readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft)?.revision ?? null;
}

export async function saveTrainingSessionDraft(draft: TrainingSessionDraft, expectedRevision: number | null): Promise<TrainingSessionDraft> {
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
  const unknownFlaggedOccurrenceId = draft.flaggedOccurrenceIds.find((occurrenceId) => !occurrenceIds.has(occurrenceId));
  if (unknownFlaggedOccurrenceId) throw new Error(`Training session draft flag ${unknownFlaggedOccurrenceId} is outside the active session plan.`);
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  const existing = envelope?.payload ? createTrainingSessionDraft(envelope.payload) : null;
  if (existing && (existing.sessionId !== draft.sessionId || existing.trackId !== draft.trackId)) {
    throw new Error("A different training session draft is already active.");
  }
  const previousRevision = existing?.revision ?? null;
  if (expectedRevision !== previousRevision) throw new StaleDraftRevisionError(expectedRevision, previousRevision);
  const nextRevision = (previousRevision ?? 0) + 1;
  const durable = createTrainingSessionDraft({ ...draft, revision: nextRevision });
  if (await getActiveMutationJournal()) throw new Error("Training session draft cannot change while a durable mutation is pending.");
  try {
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, durable, envelope?.revision ?? null);
  } catch (error) {
    throw new Error("Training session draft write failed; the previous durable revision remains authoritative.", { cause: error });
  }
  const verified = await getActiveTrainingSessionDraft();
  if (!verified || canonicalSerialize(verified) !== canonicalSerialize(durable)) throw new Error("Training session draft durable write could not be verified.");
  return durable;
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
  if (!existing) writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, createTrainingSessionDraft(draft));
}

export async function clearActiveTrainingSessionDraft(sessionId: string): Promise<void> {
  const draft = await getActiveTrainingSessionDraft();
  if (draft?.sessionId === sessionId) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
}

export async function clearTrainingSessionDrafts(): Promise<void> {
  removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
}
