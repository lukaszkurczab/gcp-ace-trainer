import { TEST_CONTENT_PACKAGE_PIN } from "./contentPackagePinFixture";
import { createTrainingAttempt, createTrainingSession, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { captureMutationExpectedRevisions, createMutationPlanFingerprint, type MutationJournalPlan, type MutationJournalRecord } from "../storage/repositories/mutationJournalRepository";

export const timestamp = "2026-07-15T10:00:00.000Z";

export function installMemoryStorage(): MemoryKeyValueStorage {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
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
    itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "coding-interview-dsa-problem-solving", itemId: "item-1", contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN} }],
    optionOrderByOccurrence: { "occurrence-1": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: "v1", packagePin: TEST_CONTENT_PACKAGE_PIN,
    status,
    startedAt: timestamp,
    ...(status === "active" ? {} : { completedAt: timestamp }),
  });
}

export function attempt(id = "attempt-1", sessionId = "session-1"): TrainingAttempt<{ choice: string }> {
  return createTrainingAttempt({
    id,
    sessionId,
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "practice",
    occurrenceId: "occurrence-1",
    item: { trackId: "coding-interview-dsa-problem-solving", itemId: "item-1", contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN},
    response: { choice: "a" },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: { trackId: "coding-interview-dsa-problem-solving", itemId: "item-1", contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN}, taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }] },
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
    sourceItem: { trackId: "coding-interview-dsa-problem-solving", itemId: "item-1", contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN},
    taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }],
    reasons: ["incorrect"],
    dueAt: timestamp,
    createdAt: timestamp,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

export function journal(writes: MutationJournalRecord["writes"], operation: MutationJournalRecord["operation"] = "submit_training_outcome"): MutationJournalRecord {
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
    packagePin: operation === "reset_learning_state" ? null : TEST_CONTENT_PACKAGE_PIN,
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
