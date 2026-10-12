import { createTrainingAttempt, createTrainingSession, getTrackRegistration, type AcceptedSimulationFinalization, type ResolvedContentRef, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession, type TrainingSessionDraft } from "../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../infrastructure/storage/mmkvClient";
import { captureMutationExpectedRevisions, captureMutationPhysicalWrites, createMutationPlanFingerprint, type MutationJournalPlan, type TrainingMutationJournalRecord, type TrainingMutationOperation } from "../storage/repositories/mutationJournalRepository";
import { initializeStorageMetadata } from "../storage/repositories/storageMetadataRepository";
import { canonicalSerialize } from "../domain/identity/canonicalSerialization";
import { sha256Utf8 } from "../infrastructure/identity/sha256";
import { acceptSimulationFinalization, readActiveTrainingSessionDraftStateProof } from "../storage/repositories/trainingSessionDraftRepository";
import { readTrainingSessionEnvelopeProof } from "../storage/repositories/trainingSessionRepository";
import { readReviewQueueFinalizationProofs } from "../storage/repositories/reviewQueueRepository";
import { captureActiveProfileStorageLease } from "../infrastructure/storage/mmkvClient";
import { resolvedContentRefKey } from "../domain/learning/resolvedContentRef";
import { productionTrackAdmissionContext } from "../application/tracks/trackAdmissionContext";

export const timestamp = "2026-07-15T10:00:00.000Z";
const artifactSha256 = "a".repeat(64);

function item(): ResolvedContentRef {
  return { trackId: "coding-interview-dsa-problem-solving", questionId: "item-1", contentVersion: "v1", artifactSha256 };
}

export function installMemoryStorage(): MemoryKeyValueStorage {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests({ id: "guest-test-profile", kind: "guest", accountId: null });
  initializeStorageMetadata();
  return storage;
}

export function session(status: TrainingSession["status"] = "active", id = "session-1"): TrainingSession {
  return createTrainingSession({
    id,
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "practice",
    configurationSnapshot: { kind: "practice", mode: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: item() }],
    optionOrderByOccurrence: { "occurrence-1": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: "v1", artifactSha256,
    status,
    startedAt: timestamp,
    ...(status === "active" ? {} : { completedAt: timestamp }),
  });
}

/** Uses the production D owner to establish the accepted authority required by
 * new finalization commands in tests that exercise later journal boundaries. */
export async function acceptSimulationFinalizationForTest(sessionRecord: TrainingSession, draft: TrainingSessionDraft, capturedAt = timestamp): Promise<AcceptedSimulationFinalization> {
  const draftProof = readActiveTrainingSessionDraftStateProof(productionTrackAdmissionContext);
  const sessionProof = readTrainingSessionEnvelopeProof(sessionRecord.id, productionTrackAdmissionContext);
  if (!draftProof || "kind" in draftProof.state || !sessionProof || sessionProof.session.status !== "active") {
    throw new Error("The exact active session and editable draft must be durable before test acceptance.");
  }
  const byKey = new Map(sessionRecord.itemOrder.map((entry) => [resolvedContentRefKey(entry.item), entry.item]));
  const reviewRefs = [...new Set(Object.keys(draft.responsesByOccurrenceId).map((occurrenceId) => {
    const occurrence = sessionRecord.itemOrder.find((entry) => entry.occurrenceId === occurrenceId);
    if (!occurrence) throw new Error("The test draft response is outside its session order.");
    return resolvedContentRefKey(occurrence.item);
  }))].map((key) => byKey.get(key)!).sort((a, b) => resolvedContentRefKey(a).localeCompare(resolvedContentRefKey(b)));
  const reviewProofs = readReviewQueueFinalizationProofs(reviewRefs, productionTrackAdmissionContext).proofs;
  const familyId = getTrackRegistration(sessionRecord.trackId).familyId;
  const identity = {
    sessionId: sessionRecord.id,
    trackId: sessionRecord.trackId,
    familyId,
    trigger: "manual" as const,
    capturedAt,
    semanticsVersion: "simulation-finalization-v1" as const,
    sessionRevision: sessionProof.revision,
    sessionDigest: sessionProof.digest,
    priorDraftEnvelopeRevision: draftProof.revision,
    priorDraftEnvelopeDigest: draftProof.digest,
    reviewProofs,
  };
  const accepted: AcceptedSimulationFinalization = {
    kind: "accepted_simulation_finalization",
    version: 1,
    responseDraft: draft,
    acceptance: { ...identity, commandId: sha256Utf8(canonicalSerialize(identity)) },
  };
  const outcome = await acceptSimulationFinalization(accepted, { revision: draftProof.revision, digest: draftProof.digest }, captureActiveProfileStorageLease(), reviewRefs, productionTrackAdmissionContext);
  if (outcome.kind !== "verified") throw new Error(`The D owner did not verify test acceptance: ${outcome.kind}.`);
  return accepted;
}

export function attempt(id = "attempt-1", sessionId = "session-1"): TrainingAttempt<{ choice: string }> {
  return createTrainingAttempt({
    id,
    sessionId,
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "practice",
    occurrenceId: "occurrence-1",
    item: item(),
    response: { choice: "a" },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item(), taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }] },
    answeredAt: timestamp,
    committedAt: timestamp,
  });
}

export function review(id = "review-1", sourceAttemptId = "attempt-1"): ReviewQueueEntry {
  return {
    id,
    trackId: "coding-interview-dsa-problem-solving",
    sourceAttemptId,
    sourceSessionId: "session-1",
    sourceItem: item(),
    taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }],
    reasons: ["incorrect"],
    dueAt: timestamp,
    createdAt: timestamp,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

export function journal(writes: TrainingMutationJournalRecord["writes"], operation: TrainingMutationOperation = "submit_training_outcome"): TrainingMutationJournalRecord {
  const identifiedWrite = writes.find((write) => write.kind === "put_session" || write.kind === "put_attempt" || write.kind === "put_review_entry");
  const sessionId = identifiedWrite?.kind === "put_session" ? identifiedWrite.record.id : identifiedWrite?.kind === "put_attempt" ? identifiedWrite.record.sessionId : identifiedWrite?.kind === "put_review_entry" ? identifiedWrite.record.sourceSessionId : "session-1";
  const trackId = identifiedWrite?.kind === "put_session" || identifiedWrite?.kind === "put_attempt" || identifiedWrite?.kind === "put_review_entry" ? identifiedWrite.record.trackId : "coding-interview-dsa-problem-solving";
  const commandFingerprint = "0".repeat(64);
  const plan: MutationJournalPlan = {
    operation,
    status: "journal_durable",
    createdAt: timestamp,
    sessionId,
    trackId,
    artifactSha256: operation === "reset_learning_state" ? null : artifactSha256,
    commandIdentity: { version: 1, fingerprint: commandFingerprint },
    expectedRevisions: captureMutationExpectedRevisions(writes),
    physicalWrites: operation === "reset_learning_state" ? [] : captureMutationPhysicalWrites(writes, productionTrackAdmissionContext),
    writes,
  };
  return {
    journalId: `journal:${commandFingerprint}`,
    ...plan,
    planFingerprint: createMutationPlanFingerprint(plan),
  };
}
