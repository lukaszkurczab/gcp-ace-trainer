import assert from "node:assert/strict";
import test from "node:test";
import { materializeMutation } from "./mutationMaterializer";
import { JournalMaterializationError, JournalWriteError } from "../../storage/errors";
import { getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveTrainingSession } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { installMemoryStorage, attempt, journal, review, session } from "../../testing/journalTestSupport";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";

test("materializes one attempt", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }]));
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]);
});
test("materializes one review entry", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_review_entry", record: review() }]));
  assert.deepEqual((await getReviewQueueItems()).value, [review()]);
});
test("rejects an unsupported write kind instead of silently materializing it", async () => {
  installMemoryStorage();
  const record = { ...journal([]), writes: [{ kind: "unknown_write", record: attempt() }] } as unknown as Parameters<typeof materializeMutation>[0];
  await assert.rejects(() => materializeMutation(record), JournalMaterializationError);
});
test("materializes one session", async () => {
  installMemoryStorage(); await materializeMutation(journal([{ kind: "put_session", record: session() }]));
  assert.deepEqual((await getTrainingSessions()).value, [session()]);
});
test("clears active session pointer", async () => {
  const storage = installMemoryStorage(); await saveTrainingSession(session()); await materializeMutation(journal([{ kind: "clear_active_session", sessionId: "session-1" }]));
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});
test("materializes a complete training outcome in canonical order", async () => {
  const storage = installMemoryStorage(); const completed = session("completed");
  await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }]));
  assert.deepEqual((await getTrainingAttempts()).value, [attempt()]); assert.deepEqual((await getReviewQueueItems()).value, [review()]); assert.deepEqual((await getTrainingSessions()).value, [completed]);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "write").map((entry) => entry.key), [STORAGE_KEYS.METADATA, STORAGE_KEYS.trainingAttempt("attempt-1"), STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, STORAGE_KEYS.reviewEntry("review-1"), STORAGE_KEYS.REVIEW_INDEX, STORAGE_KEYS.trainingSession("session-1"), STORAGE_KEYS.TRAINING_SESSION_INDEX]);
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
