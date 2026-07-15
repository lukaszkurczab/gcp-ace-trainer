import assert from "node:assert/strict";
import test from "node:test";
import { commitMutation } from "../src/application/learningMutations/commitMutation";
import { materializeMutation } from "../src/application/learningMutations/mutationMaterializer";
import { recoverPendingMutation } from "../src/application/learningMutations/recoverPendingMutation";
import { commitReviewEntryChange, commitReviewEntryRemoval } from "../src/application/learningMutations";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, persistMutationJournal } from "../src/storage/repositories/mutationJournalRepository";
import { addReviewQueueItems, addTrainingAttempt, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveTrainingSession } from "../src/storage/repositories";
import { installMemoryStorage, attempt, journal, review, session } from "./journalTestSupport";

function outcome() { return journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session() }]); }
async function assertOneOutcome() { assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getReviewQueueItems()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); assert.equal((await getTrainingSessions()).value[0]?.status, "active"); assert.equal(await getActiveMutationJournal(), null); }
test("A before journal persistence leaves no durable outcome", async () => { const storage = installMemoryStorage(); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => commitMutation(outcome())); assert.equal((await getTrainingAttempts()).value.length, 0); assert.equal((await getReviewQueueItems()).value.length, 0); assert.equal((await getTrainingSessions()).value.length, 0); assert.equal(await getActiveMutationJournal(), null); });
test("B after journal persistence recovers complete", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); await assertOneOutcome(); });
test("C after attempt write does not duplicate", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await addTrainingAttempt(attempt()); await recoverPendingMutation(); await assertOneOutcome(); });
test("D after review writes no duplicate evidence", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await addTrainingAttempt(attempt()); await addReviewQueueItems([review()]); await recoverPendingMutation(); await assertOneOutcome(); });
test("E after session no twice advance", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await addTrainingAttempt(attempt()); await addReviewQueueItems([review()]); await saveTrainingSession(session()); await recoverPendingMutation(); await assertOneOutcome(); });
test("F all writes before verification", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); await recoverPendingMutation(); await assertOneOutcome(); });
test("G verification before clear safely replays", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); storage.setFailurePlan(null); await recoverPendingMutation(); await assertOneOutcome(); });
test("resolved review deletion is physical and safely replays after force-close", async () => {
  const storage = installMemoryStorage();
  const resolved = review("review-resolved", "older-attempt");
  await addReviewQueueItems([resolved]);
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "delete_review_entry", record: resolved }, { kind: "put_session", record: session() }]);
  await persistMutationJournal(record);
  await addTrainingAttempt(attempt());
  await recoverPendingMutation();
  assert.equal((await getReviewQueueItems()).value.some((entry) => entry.id === resolved.id), false);
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(resolved.id)), false);
  await recoverPendingMutation();
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(resolved.id)), false);
});
test("resolved review deletion recovers when its index update fails", async () => {
  const storage = installMemoryStorage();
  const resolved = review("review-index-failure", "older-attempt");
  await addReviewQueueItems([resolved]);
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "delete_review_entry", record: resolved }, { kind: "put_session", record: session() }]);
  await persistMutationJournal(record);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.REVIEW_INDEX });
  await assert.rejects(() => recoverPendingMutation());
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(resolved.id)), true);
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(resolved.id)), false);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
});
test("manual review removal recovers after index switch but before physical deletion", async () => {
  const storage = installMemoryStorage();
  const manual = { ...review("manual-review", "manual-attempt"), sourceSessionId: "manual-session", reasons: ["manual_mark" as const] };
  await commitReviewEntryChange({ record: manual, isUpdate: false, transitionId: "manual-transition", createdAt: manual.createdAt });
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.reviewEntry(manual.id) });
  await assert.rejects(() => commitReviewEntryRemoval(manual, manual.createdAt));
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(manual.id)), true);
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(manual.id)), false);
  assert.equal((await getReviewQueueItems()).value.length, 0);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
});
