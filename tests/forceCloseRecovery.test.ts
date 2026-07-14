import assert from "node:assert/strict";
import test from "node:test";
import { commitMutation } from "../src/application/learningMutations/commitMutation";
import { materializeMutation } from "../src/application/learningMutations/mutationMaterializer";
import { recoverPendingMutation } from "../src/application/learningMutations/recoverPendingMutation";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, persistMutationJournal } from "../src/storage/repositories/mutationJournalRepository";
import { getReviewQueueItems, getTrainingAttempts, getTrainingSessions } from "../src/storage/repositories";
import { installMemoryStorage, attempt, journal, review, session } from "./journalTestSupport";

function outcome() { return journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session("completed") }, { kind: "clear_active_session", sessionId: "session-1" }]); }
async function assertOneOutcome() { assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getReviewQueueItems()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); assert.equal((await getTrainingSessions()).value[0]?.status, "completed"); assert.equal(await getActiveMutationJournal(), null); }
test("A before journal persistence leaves no durable outcome", async () => { const storage = installMemoryStorage(); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => commitMutation(outcome())); assert.equal((await getTrainingAttempts()).value.length, 0); assert.equal((await getReviewQueueItems()).value.length, 0); assert.equal((await getTrainingSessions()).value.length, 0); assert.equal(await getActiveMutationJournal(), null); });
test("B after journal persistence recovers complete", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); await assertOneOutcome(); });
test("C after attempt write does not duplicate", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(journal(record.writes.slice(0, 1))); await recoverPendingMutation(); await assertOneOutcome(); });
test("D after review writes no duplicate evidence", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(journal(record.writes.slice(0, 2))); await recoverPendingMutation(); await assertOneOutcome(); });
test("E after session no twice advance", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(journal(record.writes.slice(0, 3))); await recoverPendingMutation(); await assertOneOutcome(); });
test("F all writes before verification", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); await recoverPendingMutation(); await assertOneOutcome(); });
test("G verification before clear safely replays", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); storage.setFailurePlan(null); await recoverPendingMutation(); await assertOneOutcome(); });
