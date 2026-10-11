import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingSessionResult } from "../../domain";
import { JournalVerificationError, StorageReadError } from "../../storage/errors";
import { STORAGE_KEYS } from "../../storage/keys";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { addReviewQueueItems, saveTrainingSession } from "../../storage/repositories";
import { installMemoryStorage, attempt, journal, review, session } from "../../testing/journalTestSupport";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";

function completedSessionResult(target = session("completed")) {
  return createTrainingSessionResult({ id: `result:${target.id}`, sessionId: target.id, trackId: target.trackId, totalOccurrences: target.itemOrder.length,
    answeredOccurrenceIds: [], unansweredOccurrenceIds: target.itemOrder.map((item) => item.occurrenceId), completedAt: target.completedAt!, evidence: { familyId: "coding-interview", details: {} } });
}
function outcome(candidateAttempt = attempt(), candidateReview = review(), candidateSession = session()) {
  return journal([{ kind: "put_attempt", record: candidateAttempt }, { kind: "put_review_entry", record: candidateReview }, { kind: "put_session", record: candidateSession }]);
}
function completion() {
  const completed = session("completed");
  return journal([{ kind: "put_session_result", record: completedSessionResult(completed) }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }], "complete_training_session");
}

test("verifies a complete materialized mutation", async () => { installMemoryStorage(); const record = outcome(); await materializeMutation(record); await verifyMutation(record); });
test("rejects a missing attempt from an otherwise valid outcome plan", async () => { installMemoryStorage(); const record = outcome(); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("rejects an attempt whose exact captured after-state was not materialized", async () => { installMemoryStorage(); const record = outcome(); await materializeMutation(record); const conflicting = outcome({ ...attempt(), response: { choice: "b" } }); await assert.rejects(() => verifyMutation(conflicting), JournalVerificationError); });
test("rejects a missing review entry from an otherwise valid outcome plan", async () => { installMemoryStorage(); const record = outcome(); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("rejects a conflicting review identity", async () => { installMemoryStorage(); await addReviewQueueItems([review()]); const record = outcome(attempt(), { ...review(), dueAt: "2026-07-16T00:00:00.000Z" }); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("rejects a missing session from an otherwise valid outcome plan", async () => { installMemoryStorage(); const record = outcome(); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("rejects a conflicting session physical state", async () => { installMemoryStorage(); await saveTrainingSession(session()); const record = journal([{ kind: "put_session", record: { ...session(), activeForegroundMs: 1 } }], "advance_training_session"); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("rejects an active session pointer that should have been cleared", async () => { installMemoryStorage(); await saveTrainingSession(session()); const record = completion(); await assert.rejects(() => verifyMutation(record), JournalVerificationError); });
test("propagates storage read failure", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_session", record: session() }], "advance_training_session"); await persistMutationJournal(record); await materializeMutation(record); storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.TRAINING_SESSION_INDEX }); await assert.rejects(() => verifyMutation(record), StorageReadError); });
test("preserves active journal after verification failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await assert.rejects(() => verifyMutation(record), JournalVerificationError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
