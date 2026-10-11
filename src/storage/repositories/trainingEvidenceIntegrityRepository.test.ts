import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSessionResult } from "../../domain";
import { installMemoryStorage, attempt, session } from "../../testing/journalTestSupport";
import { CanonicalEvidenceIntegrityError } from "../errors";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { assertTrainingEvidenceIntegrity, assertTrainingEvidenceJournalPreflight, readTrainingAttemptsStrict, readTrainingSessionsStrict } from "./trainingEvidenceIntegrityRepository";

function assertStableFailure(storage: ReturnType<typeof installMemoryStorage>, read: () => unknown): void {
  const before = storage.snapshot();
  assert.throws(read);
  assert.throws(read);
  assert.deepEqual(storage.snapshot(), before);
}

test("strict evidence collections accept genuinely empty storage and reject a populated canonical set", async () => {
  installMemoryStorage();
  assert.deepEqual(readTrainingSessionsStrict().value, []);
  assert.deepEqual(readTrainingAttemptsStrict().value, []);
  assertTrainingEvidenceIntegrity();

  installMemoryStorage();
  const completed = session("completed");
  const responseAttempt = attempt();
  writeCanonicalJson(STORAGE_KEYS.trainingSession(completed.id), completed);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [completed.id]);
  writeCanonicalJson(STORAGE_KEYS.trainingAttempt(responseAttempt.id), responseAttempt);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [responseAttempt.id]);
  writeCanonicalJson(STORAGE_KEYS.trainingSessionResult(completed.id), createTrainingSessionResult({
    id: "result:session-1", sessionId: completed.id, trackId: completed.trackId, totalOccurrences: 1,
    answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [], completedAt: completed.completedAt!,
    evidence: { familyId: "coding-interview", details: {} },
  }));
  assertTrainingEvidenceIntegrity();
  assert.deepEqual(readTrainingSessionsStrict().value, [completed]);
  assert.deepEqual(readTrainingAttemptsStrict().value, [responseAttempt]);
});

test("strict evidence gate rejects duplicate and dangling index entries without repairing bytes", () => {
  const duplicateStorage = installMemoryStorage();
  const record = session();
  writeCanonicalJson(STORAGE_KEYS.trainingSession(record.id), record);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [record.id, record.id]);
  assertStableFailure(duplicateStorage, assertTrainingEvidenceIntegrity);

  const missingStorage = installMemoryStorage();
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["missing-session"]);
  assertStableFailure(missingStorage, assertTrainingEvidenceIntegrity);
});

test("strict evidence gate rejects unindexed orphan and key/payload identity mismatch", () => {
  const orphanStorage = installMemoryStorage();
  const orphan = session();
  writeCanonicalJson(STORAGE_KEYS.trainingSession(orphan.id), orphan);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, []);
  assertStableFailure(orphanStorage, assertTrainingEvidenceIntegrity);

  const mismatchStorage = installMemoryStorage();
  const record = attempt();
  writeCanonicalJson(STORAGE_KEYS.trainingAttempt(record.id), { ...record, id: "different-attempt" });
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [record.id]);
  assertStableFailure(mismatchStorage, assertTrainingEvidenceIntegrity);
});

test("strict evidence gate rejects unknown tracks, malformed indexes, and orphan results", () => {
  const unknownStorage = installMemoryStorage();
  const record = session();
  writeCanonicalJson(STORAGE_KEYS.trainingSession(record.id), { ...record, trackId: "unknown-track" });
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [record.id]);
  assertStableFailure(unknownStorage, assertTrainingEvidenceIntegrity);

  const malformedStorage = installMemoryStorage();
  malformedStorage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "not-json");
  assertStableFailure(malformedStorage, assertTrainingEvidenceIntegrity);

  const resultStorage = installMemoryStorage();
  const result = createTrainingSessionResult({
    id: "result:missing-parent", sessionId: "missing-session", trackId: "coding-interview-dsa-problem-solving",
    totalOccurrences: 1, answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [],
    completedAt: "2026-07-15T10:00:00.000Z", evidence: { familyId: "coding-interview", details: {} },
  });
  writeCanonicalJson(STORAGE_KEYS.trainingSessionResult(result.sessionId), result);
  assertStableFailure(resultStorage, assertTrainingEvidenceIntegrity);
});

test("journal preflight does not permit unrelated orphan evidence", () => {
  const storage = installMemoryStorage();
  const target = attempt();
  const orphan = attempt("unrelated-orphan");
  writeCanonicalJson(STORAGE_KEYS.trainingAttempt(orphan.id), orphan);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, []);
  const before = storage.snapshot();
  assert.throws(() => assertTrainingEvidenceJournalPreflight({ writes: [{ kind: "put_attempt", record: target }] }), CanonicalEvidenceIntegrityError);
  assert.deepEqual(storage.snapshot(), before);
});

test("journal preflight compares attempt payloads as persisted and rejects changed replay bytes", () => {
  const storage = installMemoryStorage();
  const stored = attempt();
  writeCanonicalJson(STORAGE_KEYS.trainingAttempt(stored.id), stored);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [stored.id]);
  const replay = { ...stored, durationMs: undefined };

  assert.doesNotThrow(() => assertTrainingEvidenceJournalPreflight({ writes: [{ kind: "put_attempt", record: replay }] }));

  const before = storage.snapshot();
  assert.throws(
    () => assertTrainingEvidenceJournalPreflight({ writes: [{ kind: "put_attempt", record: { ...stored, durationMs: 1 } }] }),
    CanonicalEvidenceIntegrityError,
  );
  assert.deepEqual(storage.snapshot(), before);
});
