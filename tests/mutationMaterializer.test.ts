import assert from "node:assert/strict";
import test from "node:test";
import { materializeMutation } from "../src/application/learningMutations/mutationMaterializer";
import { JournalMaterializationError } from "../src/storage/errors";
import { getCertificationExam, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveReviewQueueItems, saveTrainingSession } from "../src/storage/repositories";
import { STORAGE_KEYS } from "../src/storage/keys";
import { installMemoryStorage, attempt, exam, journal, review, session } from "./journalTestSupport";

test("materializes one attempt", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }]));
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]);
});
test("materializes one review entry", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_review_entry", record: review() }]));
  assert.deepEqual((await getReviewQueueItems()).value, [review()]);
});
test("materializes review deletion", async () => {
  installMemoryStorage(); await saveReviewQueueItems([review()]); await materializeMutation(journal([{ kind: "delete_review_entry", id: "review-1" }]));
  assert.deepEqual((await getReviewQueueItems()).value, []);
});
test("materializes one session", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_session", record: session() }]));
  assert.deepEqual((await getTrainingSessions()).value, [session()]);
});
test("materializes certification exam state", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_certification_exam", record: exam() }]));
  assert.deepEqual(await getCertificationExam(), exam());
});
test("clears active session pointer", async () => {
  const storage = installMemoryStorage(); await saveTrainingSession(session()); await materializeMutation(journal([{ kind: "clear_active_session", sessionId: "session-1" }]));
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});
test("clears active certification exam", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_certification_exam", record: exam() }])); await materializeMutation(journal([{ kind: "clear_active_exam", sessionId: "session-1" }]));
  assert.equal(await getCertificationExam(), null);
});
test("materializes a complete training outcome in canonical order", async () => {
  const storage = installMemoryStorage(); const completed = session("completed");
  await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }]));
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]); assert.deepEqual((await getReviewQueueItems()).value, [review()]); assert.deepEqual((await getTrainingSessions()).value, [completed]);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "write").map((entry) => entry.key), [STORAGE_KEYS.trainingAttempt("attempt-1"), STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, STORAGE_KEYS.reviewEntry("review-1"), STORAGE_KEYS.REVIEW_INDEX, STORAGE_KEYS.trainingSession("session-1"), STORAGE_KEYS.TRAINING_SESSION_INDEX]);
});
test("replays a fully materialized journal without duplicate effects", async () => {
  installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session("completed") }]); await materializeMutation(record); await materializeMutation(record);
  assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getReviewQueueItems()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1);
});
test("resumes after only attempt write completed", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }])); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session("completed") }])); assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getReviewQueueItems()).value.length, 1); });
test("resumes after attempt and review writes completed", async () => { installMemoryStorage(); const writes = [{ kind: "put_attempt", record: attempt() } as const, { kind: "put_review_entry", record: review() } as const, { kind: "put_session", record: session("completed") } as const]; await materializeMutation(journal(writes.slice(0, 2))); await materializeMutation(journal(writes)); assert.equal((await getTrainingSessions()).value.length, 1); });
test("resumes after session write completed", async () => { installMemoryStorage(); const writes = [{ kind: "put_attempt", record: attempt() } as const, { kind: "put_review_entry", record: review() } as const, { kind: "put_session", record: session("completed") } as const]; await materializeMutation(journal(writes)); await materializeMutation(journal(writes)); assert.equal((await getTrainingSessions()).value.length, 1); });
test("rejects conflicting immutable attempt", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }])); await assert.rejects(() => materializeMutation(journal([{ kind: "put_attempt", record: { ...attempt(), response: { choice: "b" } } }]))); });
test("rejects conflicting session record", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_session", record: session() }])); await assert.rejects(() => materializeMutation(journal([{ kind: "put_session", record: { ...session(), startedAt: "2026-07-14T00:00:00.000Z" } }])), JournalMaterializationError); });
test("rejects conflicting review record", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_review_entry", record: review() }])); await assert.rejects(() => materializeMutation(journal([{ kind: "put_review_entry", record: { ...review(), sourceAttemptId: "different-attempt" } }])), JournalMaterializationError); });
test("preserves active journal after write failure", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }]); const { persistMutationJournal } = await import("../src/storage/repositories/mutationJournalRepository"); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt("attempt-1") }); await assert.rejects(() => materializeMutation(record), JournalMaterializationError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
