import assert from "node:assert/strict";
import test from "node:test";
import { recoverPendingMutation } from "../src/application/learningMutations/recoverPendingMutation";
import { JournalMaterializationError, JournalVerificationError, StorageReadError } from "../src/storage/errors";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, persistMutationJournal } from "../src/storage/repositories/mutationJournalRepository";
import { addReviewQueueItems, getReviewQueueItems, getTrainingAttempts, getTrainingSessions } from "../src/storage/repositories";
import { materializeMutation } from "../src/application/learningMutations/mutationMaterializer";
import { UnsupportedStoredRecordError } from "../src/storage/errors";
import { installMemoryStorage, attempt, journal, review, session } from "./journalTestSupport";

function outcome() { return journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session() }]); }
test("does nothing when no journal exists", async () => { installMemoryStorage(); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(), null); });
test("recovers a journal before any writes", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal(await getActiveMutationJournal(), null); });
test("recovers partially materialized", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(journal([{ kind: "put_attempt", record: attempt() }])); await recoverPendingMutation(); assert.equal((await getReviewQueueItems()).value.length, 1); assert.equal(await getActiveMutationJournal(), null); });
test("fully materialized unverified", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(), null); });
test("verified journal whose clear failed", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); storage.setFailurePlan(null); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(), null); });
test("accepts ident immutable attempt", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value.length, 1); });
test("rejects conflicting immutable attempt", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: { ...attempt(), response: { choice: "b" } } }])); await persistMutationJournal(outcome()); await assert.rejects(() => recoverPendingMutation(), JournalMaterializationError); });
test("rejects conflicting active journal", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); const commandFingerprint = "1".repeat(64); const conflicting = journal([{ kind: "put_attempt", record: attempt("other") }, { kind: "put_session", record: session("completed") }]); const plan = { operation: conflicting.operation, status: conflicting.status, createdAt: conflicting.createdAt, sessionId: conflicting.sessionId, trackId: conflicting.trackId, commandFingerprint, writes: conflicting.writes } as const; const { createMutationPlanFingerprint } = await import("../src/storage/repositories/mutationJournalRepository"); await assert.rejects(() => persistMutationJournal({ journalId: `journal:${commandFingerprint}`, ...plan, planFingerprint: createMutationPlanFingerprint(plan) })) });
test("blocks corrupt journal", async () => { const storage = installMemoryStorage(); storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, "not-json"); await assert.rejects(() => recoverPendingMutation()); });
test("blocks journal read failure", async () => { const storage = installMemoryStorage(); storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation(), StorageReadError); });
test("preserves journal after materialization failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt("attempt-1") }); await assert.rejects(() => recoverPendingMutation(), JournalMaterializationError); assert.notEqual(await getActiveMutationJournal(), null); });
test("preserves journal after verification failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await materializeMutation(record); storage.resetCounters(); storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM }); await assert.rejects(() => recoverPendingMutation(), StorageReadError); storage.setFailurePlan(null); assert.notEqual(await getActiveMutationJournal(), null); });
test("preserves journal after journal clear failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); assert.notEqual(await getActiveMutationJournal(), null); });
test("rejects a semantically malformed persisted journal and retains it", async () => { const storage = installMemoryStorage(); const malformed = { ...outcome(), operation: "unsupported_operation" }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(malformed)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("rejects an unknown persisted write and retains its journal", async () => { const storage = installMemoryStorage(); const malformed = { ...outcome(), writes: [{ kind: "unknown_write", record: attempt() }] }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(malformed)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("rejects incomplete operation plans before persistence", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }]))); });
test("rejects duplicate write targets before persistence", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session("completed") }]))); });
test("rejects destructive writes that do not belong to the operation", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }, { kind: "clear_active_exam", sessionId: "session-1" }]))); });
test("rejects attempts and reviews that conflict with the durable session plan", async () => {
  installMemoryStorage();
  const outsideAttempt = { ...attempt(), item: { ...attempt().item, itemId: "outside" }, reviewEvidence: { ...attempt().reviewEvidence, sourceItem: { ...attempt().item, itemId: "outside" } } };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: outsideAttempt }, { kind: "put_session", record: session() }])));
  const wrongMode = { ...attempt(), modeId: "other-mode" };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: wrongMode }, { kind: "put_session", record: session() }])));
  const mismatchedReview = { ...review(), taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "different" }] };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: mismatchedReview }, { kind: "put_session", record: session() }])));
});
test("rejects an immediate submit for a planned but non-current occurrence", async () => {
  installMemoryStorage();
  const baseSession = session();
  const secondItem = { ...baseSession.itemOrder[0]!.item, itemId: "item-2" };
  const sessionAtFirstOccurrence = { ...baseSession, requestedLength: 2, actualLength: 2, itemOrder: [baseSession.itemOrder[0]!, { occurrenceId: "occurrence-2", item: secondItem }], optionOrderByOccurrence: {} };
  const nonCurrentAttempt = { ...attempt(), occurrenceId: "occurrence-2", item: secondItem, reviewEvidence: { ...attempt().reviewEvidence, sourceItem: secondItem } };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: nonCurrentAttempt }, { kind: "put_session", record: sessionAtFirstOccurrence }])));
});
test("rejects contradictory review actions and duplicate exam item outcomes", async () => {
  installMemoryStorage();
  const oldReview = review("older-review", "older-attempt");
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "delete_review_entry", record: oldReview }, { kind: "put_session", record: session() }])));
  const cloudRef = { trackId: "cloud-certification", itemId: "question-1", contentVersion: "v1" };
  const completedCloudSession = { ...session("completed"), trackId: "cloud-certification", modeId: "cloud-exam-simulation", itemOrder: [{ occurrenceId: "occurrence-1", item: cloudRef }], configurationSnapshot: { kind: "certificationSimulation", timer: "absoluteDeadline" } };
  const first = { ...attempt("exam-a"), trackId: "cloud-certification", modeId: "cloud-exam-simulation", item: cloudRef, reviewEvidence: { sourceItem: cloudRef, taxonomyOrSkillRefs: [] } };
  const second = { ...first, id: "exam-b" };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: first }, { kind: "put_attempt", record: second }, { kind: "put_session", record: completedCloudSession }, { kind: "clear_active_session", sessionId: completedCloudSession.id }, { kind: "clear_active_exam", sessionId: completedCloudSession.id }], "finalize_training_session")));
});

test("journal accepts duplicate exact content through distinct occurrences and rejects occurrence mismatches", async () => {
  installMemoryStorage();
  const item = { trackId: "cloud-certification", itemId: "question-1", contentVersion: "v1" };
  const completed = { ...session("completed"), trackId: "cloud-certification", modeId: "cloud-exam-simulation", requestedLength: 2, actualLength: 2, currentItemIndex: 1, itemOrder: [{ occurrenceId: "first", item }, { occurrenceId: "second", item }], optionOrderByOccurrence: {}, configurationSnapshot: { kind: "certificationSimulation", timer: "absoluteDeadline" } };
  const first = { ...attempt("first-attempt"), trackId: "cloud-certification", modeId: "cloud-exam-simulation", occurrenceId: "first", item, reviewEvidence: { ...attempt().reviewEvidence, sourceItem: item } };
  const second = { ...first, id: "second-attempt", occurrenceId: "second" };
  const writes = [{ kind: "put_attempt", record: first } as const, { kind: "put_attempt", record: second } as const, { kind: "put_session", record: completed } as const, { kind: "clear_active_session", sessionId: completed.id } as const, { kind: "clear_active_exam", sessionId: completed.id } as const];
  await assert.doesNotReject(() => persistMutationJournal(journal(writes, "finalize_training_session")));
  installMemoryStorage();
  const mismatchedWrites = [{ kind: "put_attempt", record: { ...first, occurrenceId: "missing" } } as const, { kind: "put_attempt", record: second } as const, { kind: "put_session", record: completed } as const, { kind: "clear_active_session", sessionId: completed.id } as const, { kind: "clear_active_exam", sessionId: completed.id } as const];
  await assert.rejects(() => persistMutationJournal(journal(mismatchedWrites, "finalize_training_session")));
});
test("accepts a review update that retains its original durable source identity", async () => {
  installMemoryStorage(); const prior = { ...review("stable-review", "older-attempt"), sourceSessionId: "older-session" }; await addReviewQueueItems([prior]);
  const updatedExistingReview = { ...prior, dueAt: "2026-07-16T10:00:00.000Z" };
  await assert.doesNotReject(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "update_review_entry", record: updatedExistingReview, transitionId: attempt().id }, { kind: "put_session", record: session() }])));
});
test("rejects a fabricated historical source on a nonexistent review identity", async () => { installMemoryStorage(); const fabricated = { ...review("missing-review", "older-attempt"), sourceSessionId: "older-session" }; await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: fabricated }, { kind: "put_session", record: session() }]))); });
test("rejects an explicit review update when its durable identity does not exist", async () => { installMemoryStorage(); const missing = { ...review("missing-update", "older-attempt"), sourceSessionId: "older-session" }; await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "update_review_entry", record: missing, transitionId: attempt().id }, { kind: "put_session", record: session() }]))); });
test("rejects a persisted plan with a corrupt fingerprint and retains it", async () => { const storage = installMemoryStorage(); const corrupt = { ...outcome(), planFingerprint: "f".repeat(32) }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(corrupt)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("idempotent repeated recovery", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); });
test("does not require remote content", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value[0]?.item.itemId, "item-1"); });
test("does not recalc scoring", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record); await recoverPendingMutation(); assert.deepEqual((await getTrainingAttempts()).value[0]?.result, attempt().result); });
test("does not generate IDs", async () => { installMemoryStorage(); await persistMutationJournal(outcome()); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value[0]?.id, "attempt-1"); });
