import { canPersistTrainingSessionDraft, createTrainingSessionDraft, StaleDraftRevisionError, type AcceptedSimulationFinalization, type ResolvedContentRef, type TrainingSessionDraft, type TrainingSessionDraftState } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, readCanonicalEnvelope, readCanonicalEnvelopeProof, readCanonicalJson, reconcileCanonicalWriteAttempt, reconcileCanonicalWriteAttemptWithPrior, removeCanonicalValue, writeCanonicalJsonWithOutcome, type CanonicalPhysicalWrite, type CanonicalWriteAttempt, type CanonicalWriteOutcome } from "./canonicalRecordCodec";
import { CanonicalWriteOutcomeError, StorageReadError } from "../errors";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isAcceptedSimulationFinalization, isTrainingSessionDraft, isTrainingSessionDraftState } from "./trainingModelGuards";
import { getActiveMutationJournal } from "./mutationJournalRepository";
import { getTrackRegistration } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readTrainingSessionEnvelopeProof } from "./trainingSessionRepository";
import { readReviewQueueFinalizationProofs } from "./reviewQueueRepository";

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

/** The accepted D payload has stable outer field order and retains its exact captured response encoding. */
function acceptedFinalizationWritePayload(value: AcceptedSimulationFinalization): AcceptedSimulationFinalization {
  const acceptance = value.acceptance;
  return Object.freeze({
    kind: value.kind,
    version: value.version,
    // Keep the exact parsed prior payload field order. Its raw bytes are bound
    // by priorDraftEnvelopeDigest and must remain reconstructible on cold read.
    responseDraft: value.responseDraft,
    acceptance: Object.freeze({
      commandId: acceptance.commandId,
      sessionId: acceptance.sessionId,
      trackId: acceptance.trackId,
      familyId: acceptance.familyId,
      trigger: acceptance.trigger,
      capturedAt: acceptance.capturedAt,
      semanticsVersion: acceptance.semanticsVersion,
      sessionRevision: acceptance.sessionRevision,
      sessionDigest: acceptance.sessionDigest,
      priorDraftEnvelopeRevision: acceptance.priorDraftEnvelopeRevision,
      priorDraftEnvelopeDigest: acceptance.priorDraftEnvelopeDigest,
      reviewProofs: acceptance.reviewProofs.map((proof) => ({ id: proof.id, revision: proof.revision, digest: proof.digest })),
    }),
  });
}

function expectedAcceptedEnvelopeDigest(accepted: AcceptedSimulationFinalization, revision: number): string {
  const envelope = { schemaIdentity: "patternly:canonical:v1", revision, payload: acceptedFinalizationWritePayload(accepted) };
  return sha256Utf8(JSON.stringify(envelope));
}

export function isExactAcceptedFinalizationEnvelopeProof(
  accepted: AcceptedSimulationFinalization,
  proof: Readonly<{ state: TrainingSessionDraftState; revision: number; digest: string }>,
): boolean {
  return isAcceptedSimulationFinalization(proof.state) && canonicalSerialize(proof.state) === canonicalSerialize(accepted) &&
    proof.revision === accepted.acceptance.priorDraftEnvelopeRevision + 1 &&
    proof.digest === expectedAcceptedEnvelopeDigest(accepted, proof.revision);
}

export function readActiveTrainingSessionDraft(): TrainingSessionDraft | null {
  const stored = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  return stored ? createTrainingSessionDraft(isAcceptedSimulationFinalization(stored) ? stored.responseDraft : stored) : null;
}

export function readActiveTrainingSessionDraftStateProof(): Readonly<{ state: TrainingSessionDraftState; revision: number; digest: string }> | null {
  const proof = readCanonicalEnvelopeProof(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  return proof ? Object.freeze({ state: proof.envelope.payload, revision: proof.envelope.revision, digest: proof.digest }) : null;
}

export async function getActiveTrainingSessionDraft(): Promise<TrainingSessionDraft | null> {
  return readActiveTrainingSessionDraft();
}

export async function getActiveTrainingSessionDraftRevision(): Promise<number | null> {
  return readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState)?.revision ?? null;
}

/** Replaces the exact verified draft by an explicit acceptance in the same D owner. */
export async function acceptSimulationFinalization(
  accepted: AcceptedSimulationFinalization,
  expected: Readonly<{ revision: number; digest: string }>,
  lease: ActiveProfileStorageLease | null,
  reviewRefs: readonly ResolvedContentRef[],
): Promise<CanonicalWriteOutcome<TrainingSessionDraftState>> {
  if (!isAcceptedSimulationFinalization(accepted) || !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "provenNotApplied", cause: new Error("Simulation finalization acceptance is invalid or its profile lease is stale.") };
  if (await getActiveMutationJournal()) return { kind: "provenNotApplied", cause: new Error("A durable mutation must be recovered before finalization acceptance.") };
  const current = readCanonicalEnvelopeProof(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  if (!current || current.envelope.revision !== expected.revision || current.digest !== expected.digest ||
    accepted.acceptance.priorDraftEnvelopeRevision !== current.envelope.revision || accepted.acceptance.priorDraftEnvelopeDigest !== current.digest ||
    canonicalSerialize(current.envelope.payload) !== canonicalSerialize(accepted.responseDraft) ||
    JSON.stringify(current.envelope.payload) !== JSON.stringify(accepted.responseDraft) ||
    current.envelope.payload.sessionId !== accepted.acceptance.sessionId || current.envelope.payload.trackId !== accepted.acceptance.trackId ||
    !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "conflict", cause: new Error("The exact draft changed before finalization acceptance.") };
  const sessionProof = readTrainingSessionEnvelopeProof(accepted.acceptance.sessionId);
  const session = sessionProof?.session;
  let familyId: string;
  try { familyId = getTrackRegistration(accepted.acceptance.trackId).familyId; }
  catch { return { kind: "conflict", cause: new Error("The accepted simulation family is no longer registered.") }; }
  const acceptance = accepted.acceptance;
  const commandPreimage = {
    sessionId: acceptance.sessionId,
    trackId: acceptance.trackId,
    familyId: acceptance.familyId,
    trigger: acceptance.trigger,
    capturedAt: acceptance.capturedAt,
    semanticsVersion: acceptance.semanticsVersion,
    sessionRevision: acceptance.sessionRevision,
    sessionDigest: acceptance.sessionDigest,
    priorDraftEnvelopeRevision: acceptance.priorDraftEnvelopeRevision,
    priorDraftEnvelopeDigest: acceptance.priorDraftEnvelopeDigest,
    reviewProofs: acceptance.reviewProofs,
  };
  const expectedCommandId = sha256Utf8(canonicalSerialize(commandPreimage));
  const triggerMatchesTimer = acceptance.trigger === "manual" ||
    (acceptance.trigger === "countdown-expiry" && session?.configurationSnapshot.timer === "countdownForeground") ||
    (acceptance.trigger === "absolute-deadline" && session?.configurationSnapshot.timer === "absoluteDeadline");
  if (!session || session.id !== acceptance.sessionId || session.trackId !== acceptance.trackId || session.status !== "active" ||
    sessionProof?.revision !== acceptance.sessionRevision || sessionProof.digest !== acceptance.sessionDigest || familyId !== acceptance.familyId ||
    !triggerMatchesTimer || acceptance.commandId !== expectedCommandId ||
    !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "conflict", cause: new Error("The active session changed before finalization acceptance.") };
  if (await getActiveMutationJournal()) return { kind: "conflict", cause: new Error("A durable mutation appeared before finalization acceptance.") };
  const latestSessionProof = readTrainingSessionEnvelopeProof(acceptance.sessionId);
  if (!latestSessionProof || latestSessionProof.revision !== acceptance.sessionRevision || latestSessionProof.digest !== acceptance.sessionDigest ||
    !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "conflict", cause: new Error("The exact session changed during finalization acceptance.") };
  const latestDraftProof = readCanonicalEnvelopeProof(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  if (!latestDraftProof || latestDraftProof.envelope.revision !== expected.revision || latestDraftProof.digest !== expected.digest) {
    return { kind: "conflict", cause: new Error("The exact response draft changed during finalization acceptance.") };
  }
  const latestReviewProofs = readReviewQueueFinalizationProofs(reviewRefs);
  if (canonicalSerialize(latestReviewProofs.proofs) !== canonicalSerialize(acceptance.reviewProofs) ||
    !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "conflict", cause: new Error("Review evidence changed during finalization acceptance.") };
  if (await getActiveMutationJournal()) return { kind: "conflict", cause: new Error("A durable mutation appeared during finalization acceptance.") };
  const finalSessionProof = readTrainingSessionEnvelopeProof(acceptance.sessionId);
  const finalDraftProof = readCanonicalEnvelopeProof(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraft);
  if (!finalSessionProof || finalSessionProof.revision !== acceptance.sessionRevision || finalSessionProof.digest !== acceptance.sessionDigest ||
    !finalDraftProof || finalDraftProof.envelope.revision !== expected.revision || finalDraftProof.digest !== expected.digest ||
    !isTrainingSessionDraftLeaseCurrent(lease)) return { kind: "conflict", cause: new Error("An accepted finalization source changed at the last prewrite fence.") };
  return writeCanonicalJsonWithOutcome(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, acceptedFinalizationWritePayload(accepted), expected.revision, lease);
}

export async function reconcileAcceptedSimulationFinalization(accepted: AcceptedSimulationFinalization, attempt?: CanonicalWriteAttempt<TrainingSessionDraftState>): Promise<"verified" | "not_applied" | "conflict" | "unknown"> {
  if (attempt) {
    if (attempt.key !== STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT || !isAcceptedSimulationFinalization(attempt.envelope.payload) ||
      canonicalSerialize(attempt.envelope.payload) !== canonicalSerialize(accepted)) return "conflict";
    const result = reconcileCanonicalWriteAttemptWithPrior(attempt);
    return result.kind === "verified" ? "verified" : result.kind === "provenNotApplied" ? "not_applied" : result.kind;
  }
  try {
    const proof = readCanonicalEnvelopeProof(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
    if (!proof) return "conflict";
    return isExactAcceptedFinalizationEnvelopeProof(accepted, { state: proof.envelope.payload, revision: proof.envelope.revision, digest: proof.digest }) ? "verified" : "conflict";
  } catch { return "unknown"; }
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
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  const currentState = envelope?.payload;
  if (currentState && isAcceptedSimulationFinalization(currentState)) throw new Error("The simulation response is durably accepted for finalization and cannot be edited.");
  const existing = currentState ? createTrainingSessionDraft(currentState) : null;
  if (existing && (existing.sessionId !== draft.sessionId || existing.trackId !== draft.trackId)) {
    throw new Error("A different training session draft is already active.");
  }
  const previousRevision = existing?.revision ?? null;
  if (expectedRevision !== previousRevision) throw new StaleDraftRevisionError(expectedRevision, previousRevision);
  const nextRevision = (previousRevision ?? 0) + 1;
  const durable = createTrainingSessionDraft({ ...draft, revision: nextRevision });
  if (await getActiveMutationJournal()) throw new Error("Training session draft cannot change while a durable mutation is pending.");
  if (!isTrainingSessionDraftLeaseCurrent(lease)) throw new Error("Training session draft profile lease changed during preflight.");
  const latest = readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  if (latest?.revision !== envelope?.revision) throw new StaleDraftRevisionError(previousRevision, latest?.revision ?? null);
  if (latest && isAcceptedSimulationFinalization(latest.payload)) throw new Error("The simulation response was accepted for finalization while this save was preparing.");
  const outcome = writeCanonicalJsonWithOutcome(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, durable, latest?.revision ?? null, lease);
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

export async function clearActiveTrainingSessionDraft(sessionId: string): Promise<void> {
  const state = readCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
  if (state && isAcceptedSimulationFinalization(state)) throw new Error("An accepted simulation finalization can only be cleared by its exact durable journal.");
  const draft = state ? createTrainingSessionDraft(isAcceptedSimulationFinalization(state) ? state.responseDraft : state) : null;
  if (draft?.sessionId === sessionId) removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
}

/** Applies the single journal-owned draft target through the draft repository. */
export function materializeTrainingSessionDraftJournalStep(hasDraftWrite: boolean, steps: readonly CanonicalPhysicalWrite[]): void {
  const expected = hasDraftWrite ? ["active_session_draft"] : [];
  if (steps.length !== expected.length || steps.some((step, index) => step.target !== expected[index])) throw new Error("Training session draft step does not match its exact journal plan.");
  for (const step of steps) applyCanonicalPhysicalWrite(step);
}
