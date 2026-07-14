import assert from "node:assert/strict";
import test from "node:test";
import { verifyMutation } from "../src/application/learningMutations/mutationVerifier";
import { JournalVerificationError, StorageReadError } from "../src/storage/errors";
import { STORAGE_KEYS } from "../src/storage/keys";
import { persistMutationJournal } from "../src/storage/repositories/mutationJournalRepository";
import { saveCertificationExam, saveReviewQueueItems, saveTrainingSession } from "../src/storage/repositories";
import { installMemoryStorage, attempt, exam, journal, review, session } from "./journalTestSupport";
import { materializeMutation } from "../src/application/learningMutations/mutationMaterializer";

async function materialize(record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session("completed") }])) { await materializeMutation(record); return record; }
test("verifies a complete materialized mutation", async () => { installMemoryStorage(); const record = await materialize(); await verifyMutation(record); });
test("rejects missing attempt", async () => { installMemoryStorage(); await assert.rejects(() => verifyMutation(journal([{ kind: "put_attempt", record: attempt() }])), JournalVerificationError); });
test("rejects conflicting attempt", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }])); await assert.rejects(() => verifyMutation(journal([{ kind: "put_attempt", record: { ...attempt(), response: { choice: "b" } } }])), JournalVerificationError); });
test("rejects missing review entry", async () => { installMemoryStorage(); await assert.rejects(() => verifyMutation(journal([{ kind: "put_review_entry", record: review() }])), JournalVerificationError); });
test("rejects conflicting review entry", async () => { installMemoryStorage(); await saveReviewQueueItems([review()]); await assert.rejects(() => verifyMutation(journal([{ kind: "put_review_entry", record: { ...review(), dueAt: "2026-07-16T00:00:00.000Z" } }])), JournalVerificationError); });
test("rejects review entry that should be deleted", async () => { installMemoryStorage(); await saveReviewQueueItems([review()]); await assert.rejects(() => verifyMutation(journal([{ kind: "delete_review_entry", id: "review-1" }])), JournalVerificationError); });
test("rejects missing session", async () => { installMemoryStorage(); await assert.rejects(() => verifyMutation(journal([{ kind: "put_session", record: session() }])), JournalVerificationError); });
test("rejects conflicting session", async () => { installMemoryStorage(); await saveTrainingSession(session()); await assert.rejects(() => verifyMutation(journal([{ kind: "put_session", record: { ...session(), currentItemIndex: 0, activeForegroundMs: 1 } }])), JournalVerificationError); });
test("rejects missing certification exam state", async () => { installMemoryStorage(); await assert.rejects(() => verifyMutation(journal([{ kind: "put_certification_exam", record: exam() }])), JournalVerificationError); });
test("rejects certification exam state that should be cleared", async () => { installMemoryStorage(); await saveCertificationExam(exam()); await assert.rejects(() => verifyMutation(journal([{ kind: "clear_active_exam", sessionId: "session-1" }])), JournalVerificationError); });
test("rejects active session pointer that should be cleared", async () => { installMemoryStorage(); await saveTrainingSession(session()); await assert.rejects(() => verifyMutation(journal([{ kind: "clear_active_session", sessionId: "session-1" }])), JournalVerificationError); });
test("propagates storage read failure", async () => { const storage = installMemoryStorage(); storage.setFailurePlan({ kind: "fail_on_read_number", readNumber: 1 }); await assert.rejects(() => verifyMutation(journal([])), StorageReadError); });
test("preserves active journal after verification failure", async () => { const storage = installMemoryStorage(); const record = journal([{ kind: "put_attempt", record: attempt() }]); await persistMutationJournal(record); await assert.rejects(() => verifyMutation(record), JournalVerificationError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
