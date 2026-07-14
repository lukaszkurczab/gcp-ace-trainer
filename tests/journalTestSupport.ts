import { createTrainingAttempt, createTrainingSession, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../src/domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import type { MutationJournalRecord } from "../src/storage/repositories/mutationJournalRepository";
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
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ trackId: "algorithms", itemId: "item-1", contentVersion: "v1" }],
    optionOrderByItem: { "item-1": ["a", "b"] },
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
    modeId: "cloud-exam-simulation",
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ trackId: "cloud-certification", itemId: "question-1", contentVersion: "v1" }],
    optionOrderByItem: { "question-1": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: "v1",
    status: "active",
    startedAt: timestamp,
  });
  return { session: examSession, examState: { sessionId: id, deadlineAt: timestamp, responsesByItemId: {}, flaggedItemIds: [] } };
}

export function journal(writes: MutationJournalRecord["writes"], operation: MutationJournalRecord["operation"] = "submit_training_outcome"): MutationJournalRecord {
  return {
    journalId: "journal-1",
    operation,
    status: "prepared",
    createdAt: timestamp,
    sessionId: "session-1",
    trackId: "algorithms",
    inputFingerprint: "fingerprint-1",
    writes,
  };
}
