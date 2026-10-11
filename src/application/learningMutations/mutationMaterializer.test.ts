import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingSessionResult } from "../../domain";
import { materializeMutation } from "./mutationMaterializer";
import { JournalMaterializationError, JournalWriteError } from "../../storage/errors";
import { getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveTrainingSession } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { installMemoryStorage, attempt, journal, review, session } from "../../testing/journalTestSupport";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";

function completedSessionResult(target = session("completed")) {
  return createTrainingSessionResult({ id: `result:${target.id}`, sessionId: target.id, trackId: target.trackId, totalOccurrences: target.itemOrder.length,
    answeredOccurrenceIds: [], unansweredOccurrenceIds: target.itemOrder.map((item) => item.occurrenceId), completedAt: target.completedAt!, evidence: { familyId: "coding-interview", details: {} } });
}

test("materializes one attempt", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]));
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]);
  assert.deepEqual((await getTrainingSessions()).value, [session()]);
});
test("materializes one review entry", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_review_entry", record: review() }], "set_review_entry"));
  assert.deepEqual((await getReviewQueueItems()).value, [review()]);
});
test("rejects an unsupported write kind instead of silently materializing it", async () => {
  installMemoryStorage();
  const record = { ...journal([]), writes: [{ kind: "unknown_write", record: attempt() }] } as unknown as Parameters<typeof materializeMutation>[0];
  await assert.rejects(() => materializeMutation(record), JournalMaterializationError);
});
test("materializes one session", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_session", record: session() }], "advance_training_session"));
  assert.deepEqual((await getTrainingSessions()).value, [session()]);
});
test("clears active session pointer", async () => {
  const storage = installMemoryStorage(); await saveTrainingSession(session());
  const completed = session("completed");
  const record = journal([{ kind: "put_session_result", record: completedSessionResult(completed) }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }], "complete_training_session");
  await materializeMutation(record);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});
test("materializes a completed training session in its typed write order", async () => {
  const storage = installMemoryStorage(); const completed = session("completed"); await saveTrainingSession(session()); storage.resetCounters();
  await materializeMutation(journal([{ kind: "put_session_result", record: completedSessionResult(completed) }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }], "complete_training_session"));
  assert.deepEqual((await getTrainingSessions()).value, [completed]);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "write").map((entry) => entry.key), [STORAGE_KEYS.trainingSessionResult(completed.id), STORAGE_KEYS.trainingSession(completed.id)]);
});
test("replays a fully materialized journal without duplicate effects", async () => {
  installMemoryStorage(); const completed = session("completed"); const record = journal([{ kind: "put_session_result", record: completedSessionResult(completed) }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }], "complete_training_session"); await materializeMutation(record); await materializeMutation(record);
  assert.equal((await getTrainingSessions()).value.length, 1);
});
test("resumes a valid journal after the attempt record write completed", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX }); await assert.rejects(() => materializeMutation(record), JournalMaterializationError); storage.setFailurePlan(null); await materializeMutation(record); assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); });
test("resumes after the complete attempt and review batches", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session() }]); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession("session-1") }); await assert.rejects(() => materializeMutation(record), JournalMaterializationError); storage.setFailurePlan(null); await materializeMutation(record); assert.equal((await getReviewQueueItems()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); });
test("replays after session materialization without revision churn", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session() }]); await materializeMutation(record); const revisions = record.physicalWrites.map((step) => storage.getString(step.key)); await materializeMutation(record); assert.deepEqual(record.physicalWrites.map((step) => storage.getString(step.key)), revisions); });
test("rejects conflicting immutable attempt", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }])); await assert.rejects(() => materializeMutation(journal([{ kind: "put_attempt", record: { ...attempt(), response: { choice: "b" } } }, { kind: "put_session", record: session() }]))); });
test("rejects conflicting session record", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_session", record: session() }], "advance_training_session")); await assert.rejects(() => materializeMutation(journal([{ kind: "put_session", record: { ...session(), startedAt: "2026-07-14T00:00:00.000Z" } }], "advance_training_session")), JournalMaterializationError); });
test("rejects conflicting review record", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_review_entry", record: review() }], "set_review_entry")); await assert.rejects(() => materializeMutation(journal([{ kind: "put_review_entry", record: { ...review(), sourceAttemptId: "different-attempt" } }], "set_review_entry")), JournalMaterializationError); });
test("preserves active journal after write failure", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]); const { persistMutationJournal } = await import("../../storage/repositories/mutationJournalRepository"); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt("attempt-1") }); await assert.rejects(() => materializeMutation(record), JournalMaterializationError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });

test("replays an exact record-before-index prefix without revision churn", async () => {
  const storage = installMemoryStorage();
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]);
  await persistMutationJournal(record);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX });
  await assert.rejects(() => materializeMutation(record), JournalMaterializationError);
  const partial = storage.snapshot();
  const attemptEnvelope = JSON.parse(storage.getString(STORAGE_KEYS.trainingAttempt("attempt-1"))!);
  assert.equal(storage.contains(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX), false);
  storage.setFailurePlan(null);
  await materializeMutation(record);
  assert.equal(JSON.parse(storage.getString(STORAGE_KEYS.trainingAttempt("attempt-1"))!).revision, attemptEnvelope.revision);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getTrainingSessions()).value.length, 1);
  assert.notDeepEqual(storage.snapshot(), partial);
});

test("unrelated orphan corruption blocks journal replay before any storage write", async () => {
  const storage = installMemoryStorage();
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]);
  await persistMutationJournal(record);
  const orphan = review("review:unrelated", "attempt:unrelated");
  writeCanonicalJson(STORAGE_KEYS.reviewEntry(orphan.id), orphan);
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, []);
  const beforeReplay = storage.snapshot();
  const writesBeforeReplay = storage.operations.filter((entry) => entry.kind === "write").length;
  await assert.rejects(() => materializeMutation(record), JournalMaterializationError);
  assert.deepEqual(storage.snapshot(), beforeReplay);
  assert.equal(storage.operations.filter((entry) => entry.kind === "write").length, writesBeforeReplay);
});

test("a new journal cannot authorize pre-existing orphan evidence, including its own target", async () => {
  const unrelatedStorage = installMemoryStorage();
  const unrelated = review("review:unrelated", "attempt:unrelated");
  writeCanonicalJson(STORAGE_KEYS.reviewEntry(unrelated.id), unrelated);
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, []);
  const unrelatedBefore = unrelatedStorage.snapshot();
  const unrelatedJournal = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]);
  await assert.rejects(() => persistMutationJournal(unrelatedJournal), JournalWriteError);
  assert.deepEqual(unrelatedStorage.snapshot(), unrelatedBefore);

  const targetStorage = installMemoryStorage();
  const targetAttempt = attempt();
  writeCanonicalJson(STORAGE_KEYS.trainingAttempt(targetAttempt.id), targetAttempt);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, []);
  const targetBefore = targetStorage.snapshot();
  const targetJournal = journal([{ kind: "put_attempt", record: targetAttempt }, { kind: "put_session", record: session() }]);
  await assert.rejects(() => persistMutationJournal(targetJournal), JournalWriteError);
  assert.deepEqual(targetStorage.snapshot(), targetBefore);
});
