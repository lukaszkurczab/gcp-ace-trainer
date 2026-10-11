import { canPersistTrainingSessionDraft, createTrainingSessionDraft, StaleDraftRevisionError, type TrainingSessionDraft } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, reconcileCanonicalWriteAttempt, removeCanonicalValue, writeCanonicalJson, writeCanonicalJsonWithOutcome, type CanonicalWriteAttempt } from "./canonicalRecordCodec";
import { CanonicalWriteOutcomeError, StorageReadError } from "../errors";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isTrainingSessionDraft } from "./trainingModelGuards";
import { getActiveMutationJournal } from "./mutationJournalRepository";

export type { ActiveProfileStorageLease };

/** Captures the D-write owner synchronously at the start of a user command. */
export function captureTrainingSessionDraftLease(): ActiveProfileStorageLease | null {
  return captureActiveProfileStorageLease();
}

export function isTrainingSessionDraftLeaseCurrent(lease: ActiveProfileStorageLease | null): boolean {
  try {
    return lease ? isActiveProfileStorageLeaseCurrent(lease) : captureActiveProfileStorageLease() === null;
  } catch {
    return false;
  }
}

export function readActiveTrainingSessionDraft(): TrainingSessionDraft | null {
  const stored = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  return stored ? createTrainingSessionDraft(stored) : null;
}

export async function getActiveTrainingSessionDraft(): Promise<TrainingSessionDraft | null> {
  return readActiveTrainingSessionDraft();
}

export async function getActiveTrainingSessionDraftRevision(): Promise<number | null> {
  return readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft)?.revision ?? null;
}

export async function saveTrainingSessionDraft(draft: TrainingSessionDraft, expectedRevision: number | null, expectedLease: ActiveProfileStorageLease | null = captureActiveProfileStorageLease()): Promise<TrainingSessionDraft> {
  try {
    if (!isTrainingSessionDraftLeaseCurrent(expectedLease)) throw new Error("Training session draft profile lease changed before save.");
    return await saveTrainingSessionDraftAfterPreflight(draft, expectedRevision, expectedLease);
  } catch (error) {
    if (error instanceof StorageReadError) {
      if (!isTrainingSessionDraftLeaseCurrent(expectedLease)) throw new Error("Training session draft profile lease changed during preflight.");
      throw new CanonicalWriteOutcomeError(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, { kind: "provenNotApplied", cause: error });
    }
    throw error;
  }
}

async function saveTrainingSessionDraftAfterPreflight(draft: TrainingSessionDraft, expectedRevision: number | null, lease: ActiveProfileStorageLease | null): Promise<TrainingSessionDraft> {
  if (!isTrainingSessionDraft(draft)) throw new Error("Training session draft is invalid.");
  if (!isTrainingSessionDraftLeaseCurrent(lease)) throw new Error("Training session draft profile lease changed before preflight.");
  if (await getActiveMutationJournal()) throw new Error("Training session draft cannot change while a durable mutation is pending.");
  if (!isTrainingSessionDraftLeaseCurrent(lease)) throw new Error("Training session draft profile lease changed during preflight.");
  const activeSession = await getActiveTrainingSession();
  if (!isTrainingSessionDraftLeaseCurrent(lease)) throw new Error("Training session draft profile lease changed during preflight.");
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
  if (!isTrainingSessionDraftLeaseCurrent(lease)) throw new Error("Training session draft profile lease changed during preflight.");
  const outcome = writeCanonicalJsonWithOutcome(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, durable, envelope?.revision ?? null, lease);
  if (outcome.kind !== "verified") throw new CanonicalWriteOutcomeError(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, outcome);
  return createTrainingSessionDraft(outcome.envelope.payload);
}

export async function reconcileTrainingSessionDraftWrite(attempt: CanonicalWriteAttempt<TrainingSessionDraft>): Promise<"verified" | "conflict" | "unknown"> {
  if (attempt.key !== STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT || !isTrainingSessionDraft(attempt.envelope.payload)) return "conflict";
  try {
    const active = await getActiveTrainingSession();
    const draft = attempt.envelope.payload;
    if (!active || active.id !== draft.sessionId || active.trackId !== draft.trackId || active.status !== "active" || !canPersistTrainingSessionDraft(active)) return "conflict";
    const outcome = reconcileCanonicalWriteAttempt(attempt);
    return outcome.kind === "verified" ? "verified" : outcome.kind === "provenNotApplied" ? "unknown" : outcome.kind;
  } catch { return "unknown"; }
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
