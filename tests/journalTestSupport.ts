import { createTrainingAttempt, createTrainingSession, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../src/domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { captureMutationExpectedRevisions, createMutationPlanFingerprint, type MutationJournalPlan, type MutationJournalRecord } from "../src/storage/repositories/mutationJournalRepository";
import type { CertificationExamViewModel } from "../src/tracks/cloud-certification";

export const timestamp = "2026-07-15T10:00:00.000Z";

export function installMemoryStorage(): MemoryKeyValueStorage {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  return storage;
}

export function session(status: TrainingSession["status"] = "active", id = "session-1"): TrainingSession {
  return createTrainingSession({
    id,
    trackId: "algorithms",
    modeId: "practice",
    configurationSnapshot: { kind: "practice", mode: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "algorithms", itemId: "item-1", contentVersion: "v1" } }],
    optionOrderByOccurrence: { "occurrence-1": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: "v1",
    status,
    startedAt: timestamp,
    ...(status === "active" ? {} : { completedAt: timestamp }),
  });
}

export function attempt(id = "attempt-1", sessionId = "session-1"): TrainingAttempt<{ choice: string }> {
  return createTrainingAttempt({
    id,
    sessionId,
    trackId: "algorithms",
    modeId: "practice",
    occurrenceId: "occurrence-1",
    item: { trackId: "algorithms", itemId: "item-1", contentVersion: "v1" },
    response: { choice: "a" },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: { trackId: "algorithms", itemId: "item-1", contentVersion: "v1" }, taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }] },
    answeredAt: timestamp,
    committedAt: timestamp,
  });
}

export function review(id = "review-1", sourceAttemptId = "attempt-1"): ReviewQueueEntry {
  return {
    id,
    trackId: "algorithms",
    sourceAttemptId,
    sourceSessionId: "session-1",
    sourceItem: { trackId: "algorithms", itemId: "item-1", contentVersion: "v1" },
    taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }],
    reasons: ["incorrect"],
    dueAt: timestamp,
    createdAt: timestamp,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

export function exam(id = "session-1"): CertificationExamViewModel {
  const examSession = createTrainingSession({
    id,
    trackId: "cloud-certification",
    modeId: "certification-exam-simulation",
    configurationSnapshot: { kind: "certificationSimulation", mode: "exam" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "cloud-certification", itemId: "question-1", contentVersion: "v1" } }],
    optionOrderByOccurrence: { "occurrence-1": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: "v1",
    status: "active",
    startedAt: timestamp,
  });
  return { session: examSession, examState: { sessionId: id, deadlineAt: timestamp, responsesByItemId: {}, flaggedItemIds: [] } };
}

export function journal(writes: MutationJournalRecord["writes"], operation: MutationJournalRecord["operation"] = "submit_training_outcome"): MutationJournalRecord {
  const identifiedWrite = writes.find((write) => write.kind === "put_session" || write.kind === "put_attempt" || write.kind === "put_review_entry");
  const sessionId = identifiedWrite?.kind === "put_session" ? identifiedWrite.record.id : identifiedWrite?.kind === "put_attempt" ? identifiedWrite.record.sessionId : identifiedWrite?.kind === "put_review_entry" ? identifiedWrite.record.sourceSessionId : "session-1";
  const trackId = identifiedWrite?.kind === "put_session" || identifiedWrite?.kind === "put_attempt" || identifiedWrite?.kind === "put_review_entry" ? identifiedWrite.record.trackId : "algorithms";
  const commandFingerprint = "0".repeat(64);
  const plan: MutationJournalPlan = {
    operation,
    status: "journal_durable",
    createdAt: timestamp,
    sessionId,
    trackId,
    commandIdentity: { version: 1, fingerprint: commandFingerprint },
    expectedRevisions: captureMutationExpectedRevisions(writes),
    writes,
  };
  return {
    journalId: `journal:${commandFingerprint}`,
    ...plan,
    planFingerprint: createMutationPlanFingerprint(plan),
  };
}
