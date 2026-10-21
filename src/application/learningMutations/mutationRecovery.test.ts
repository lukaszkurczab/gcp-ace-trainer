import assert from "node:assert/strict";
import test from "node:test";
import { createForegroundTimerState, createReviewSourceSnapshot, createTrainingAttempt, createTrainingSession, createTrainingSessionResult } from "../../domain";
import { recoverPendingMutation } from "./recoverPendingMutation";
import { JournalVerificationError, StorageReadError } from "../../storage/errors";
import { MutationCommitFailure } from "../mutationBoundary";
import { STORAGE_KEYS } from "../../storage/keys";
import { getActiveMutationJournal, persistMutationJournal, updateMutationJournalPhase } from "../../storage/repositories/mutationJournalRepository";
import { addReviewQueueItems, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveTrainingSession } from "../../storage/repositories";
import { materializeMutation } from "./mutationMaterializer";
import { UnsupportedStoredRecordError } from "../../storage/errors";
import { installMemoryStorage, attempt, journal, review, session } from "../../testing/journalTestSupport";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { transitionQualifiedSuccess } from "../../domain/learning/reviewCycleTransition";


function outcome() { return journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "put_session", record: session() }]); }
function completion() {
  const completed = session("completed");
  const result = createTrainingSessionResult({ id: `result:${completed.id}`, sessionId: completed.id, trackId: completed.trackId, totalOccurrences: completed.itemOrder.length,
    answeredOccurrenceIds: [], unansweredOccurrenceIds: completed.itemOrder.map((item) => item.occurrenceId), completedAt: completed.completedAt!, evidence: { familyId: "coding-interview", details: {} } });
  return journal([{ kind: "put_session_result", record: result }, { kind: "put_session", record: completed }, { kind: "clear_active_session", sessionId: completed.id }], "complete_training_session");
}
async function reachVerifiedPendingClear(record: ReturnType<typeof outcome>) {
  await persistMutationJournal(record, productionLearningDataAdmissionContext);
  await materializeMutation(record);
  const materialized = await updateMutationJournalPhase(record, "materialized", productionLearningDataAdmissionContext);
  await updateMutationJournalPhase(materialized, "verified_pending_clear", productionLearningDataAdmissionContext);
}
test("does nothing when no journal exists", async () => { installMemoryStorage(); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("recovers a journal before any writes", async () => { installMemoryStorage(); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); await recoverPendingMutation(); assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1); assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("recovers a real partial physical prefix", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry("review-1") }); await assert.rejects(() => materializeMutation(record)); storage.setFailurePlan(null); await recoverPendingMutation(); assert.equal((await getReviewQueueItems(productionTrackAdmissionContext)).value.length, 1); assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("fully materialized unverified", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); await materializeMutation(record); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("verified journal whose clear failed", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); await materializeMutation(record); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); storage.setFailurePlan(null); await recoverPendingMutation(); assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("accepts ident immutable attempt", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); await materializeMutation(record); await recoverPendingMutation(); assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1); });
test("rejects conflicting immutable attempt", async () => { installMemoryStorage(); await materializeMutation(journal([{ kind: "put_attempt", record: { ...attempt(), response: { choice: "b" } } }, { kind: "put_session", record: session() }])); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization" && error.durableState === "journal_durable"); });
test("rejects conflicting active journal", async () => { installMemoryStorage(); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); const commandFingerprint = "1".repeat(64); const conflicting = journal([{ kind: "put_attempt", record: attempt("other") }, { kind: "put_session", record: session() }]); const { captureMutationPhysicalWrites, createMutationPlanFingerprint } = await import("../../storage/repositories/mutationJournalRepository"); const plan = { operation: conflicting.operation, status: conflicting.status, createdAt: conflicting.createdAt, sessionId: conflicting.sessionId, trackId: conflicting.trackId, artifactSha256: conflicting.artifactSha256, commandIdentity: { version: 1 as const, fingerprint: commandFingerprint }, expectedRevisions: conflicting.expectedRevisions, physicalWrites: captureMutationPhysicalWrites(conflicting.writes, productionTrackAdmissionContext), writes: conflicting.writes } as const; await assert.rejects(() => persistMutationJournal({ journalId: `journal:${commandFingerprint}`, ...plan, planFingerprint: createMutationPlanFingerprint(plan) }, productionLearningDataAdmissionContext)) });
test("blocks corrupt journal", async () => { const storage = installMemoryStorage(); storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, "not-json"); await assert.rejects(() => recoverPendingMutation()); });
test("blocks journal read failure", async () => { const storage = installMemoryStorage(); storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation(), StorageReadError); });
test("preserves journal after materialization failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt("attempt-1") }); await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization" && error.durableState === "journal_durable"); assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("preserves journal after verification failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); await materializeMutation(record); storage.resetCounters(); storage.setFailurePlan({ kind: "fail_on_read_number", readNumber: 1 }); await assert.rejects(() => recoverPendingMutation(), StorageReadError); storage.setFailurePlan(null); assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("preserves journal after journal clear failure", async () => { const storage = installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => recoverPendingMutation()); assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null); });
test("rejects a semantically malformed persisted journal and retains it", async () => { const storage = installMemoryStorage(); const malformed = { ...outcome(), operation: "unsupported_operation" }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(malformed)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("rejects an unknown persisted write and retains its journal", async () => { const storage = installMemoryStorage(); const malformed = { ...outcome(), writes: [{ kind: "unknown_write", record: attempt() }] }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(malformed)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("rejects an old persisted journal without an exact artifact SHA-256", async () => { installMemoryStorage(); const { artifactSha256: _artifactSha256, ...unpinned } = outcome(); writeCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, unpinned); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); });
test("rejects incomplete operation plans before persistence", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }]), productionLearningDataAdmissionContext)); });
test("rejects duplicate write targets before persistence", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session("completed") }]), productionLearningDataAdmissionContext)); });
test("rejects destructive writes that do not belong to the operation", async () => { installMemoryStorage(); await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }, { kind: "clear_active_session", sessionId: "session-1" }]), productionLearningDataAdmissionContext)); });
test("rejects attempts and reviews that conflict with the durable session plan", async () => {
  installMemoryStorage();
  const outsideAttempt = { ...attempt(), item: { ...attempt().item, questionId: "outside" }, reviewEvidence: { ...attempt().reviewEvidence, sourceItem: { ...attempt().item, questionId: "outside" } } };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: outsideAttempt }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext));
  const wrongMode = { ...attempt(), modeId: "other-mode" };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: wrongMode }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext));
  const mismatchedReview = { ...review(), taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "different" }] };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: mismatchedReview }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext));
});
test("rejects an immediate submit for a planned but non-current occurrence", async () => {
  installMemoryStorage();
  const baseSession = session();
  const secondItem = { ...baseSession.itemOrder[0]!.item, questionId: "item-2" };
  const sessionAtFirstOccurrence = { ...baseSession, requestedLength: 2, actualLength: 2, itemOrder: [baseSession.itemOrder[0]!, { occurrenceId: "occurrence-2", item: secondItem }], optionOrderByOccurrence: {} };
  const nonCurrentAttempt = { ...attempt(), occurrenceId: "occurrence-2", item: secondItem, reviewEvidence: { ...attempt().reviewEvidence, sourceItem: secondItem } };
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: nonCurrentAttempt }, { kind: "put_session", record: sessionAtFirstOccurrence }]), productionLearningDataAdmissionContext));
});
test("rejects contradictory review actions and duplicate terminal item outcomes", async () => {
  installMemoryStorage();
  const oldReview = review("older-review", "older-attempt");
  await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: review() }, { kind: "delete_review_entry", record: oldReview }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext));
});
test("accepts a review update that retains its original durable source identity", async () => {
  installMemoryStorage(); const prior = { ...review("stable-review", "older-attempt"), sourceSessionId: "older-session" }; await addReviewQueueItems([prior], productionTrackAdmissionContext);
  const updatedExistingReview = { ...prior, dueAt: "2026-07-16T10:00:00.000Z" };
  await assert.doesNotReject(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "update_review_entry", record: updatedExistingReview, transitionId: attempt().id }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext));
});
test("due-unit transition accepts current question B and retains the durable queue source A", async () => {
  installMemoryStorage();
  const original = { ...review("unit-review", "attempt-old"), sourceSessionId: "session-old", sourceItem: { ...review().sourceItem, questionId: "question-a", contentVersion: "v1" },
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "node-u", role: "primary" }, { axisId: "mental_unit", nodeId: "unit-u", role: "primary" }] };
  await addReviewQueueItems([original], productionTrackAdmissionContext);
  const itemB = { ...original.sourceItem, questionId: "question-b", contentVersion: "v2", artifactSha256: "c".repeat(64) };
  const snapshot = createReviewSourceSnapshot(original, "due_queue");
  const active = createTrainingSession({ ...session(), modeId: "coding-interview-weak-area-review", contentVersion: "v2", artifactSha256: itemB.artifactSha256,
    itemOrder: [{ occurrenceId: "occurrence-1", item: itemB, reviewSourceSnapshot: snapshot }] });
  const attemptB = createTrainingAttempt({ ...attempt("attempt-b", active.id), modeId: active.modeId, item: itemB,
    reviewEvidence: { sourceItem: itemB, taxonomyOrSkillRefs: original.taxonomyOrSkillRefs }, answeredAt: "2026-07-15T10:00:01.000Z", committedAt: "2026-07-15T10:00:01.000Z" });
  const updatedOriginal = transitionQualifiedSuccess(original, attemptB);
  const base = journal([{ kind: "put_attempt", record: attemptB }, { kind: "update_review_entry", record: updatedOriginal, transitionId: attemptB.id }, { kind: "put_session", record: active }]);
  const { captureMutationPhysicalWrites, createMutationPlanFingerprint } = await import("../../storage/repositories/mutationJournalRepository");
  const { journalId, planFingerprint: _oldFingerprint, ...priorPlan } = base;
  void _oldFingerprint;
  const plan = { ...priorPlan, artifactSha256: itemB.artifactSha256, physicalWrites: captureMutationPhysicalWrites(base.writes, productionTrackAdmissionContext) };
  const record = { journalId, ...plan, planFingerprint: createMutationPlanFingerprint(plan) };
  await persistMutationJournal(record, productionLearningDataAdmissionContext);
  await recoverPendingMutation();
  const saved = (await getReviewQueueItems(productionTrackAdmissionContext)).value[0]!;
  assert.equal(saved.id, original.id);
  assert.deepEqual(saved.sourceItem, original.sourceItem);
  assert.deepEqual(saved.taxonomyOrSkillRefs, original.taxonomyOrSkillRefs);
  assert.equal(saved.dueAt, updatedOriginal.dueAt);
});
test("cross-question review update rejects a different unit or a missing source snapshot", async () => {
  for (const mismatch of ["unit", "snapshot"] as const) {
    installMemoryStorage();
    const original = { ...review("unit-review", "attempt-old"), sourceSessionId: "session-old", sourceItem: { ...review().sourceItem, questionId: "question-a", contentVersion: "v1" },
      taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "node-u", role: "primary" }, { axisId: "mental_unit", nodeId: "unit-u", role: "primary" }] };
    await addReviewQueueItems([original], productionTrackAdmissionContext);
    const itemB = { ...original.sourceItem, questionId: "question-b", contentVersion: "v2" };
    const active = createTrainingSession({ ...session(), modeId: "coding-interview-weak-area-review", contentVersion: "v2",
      itemOrder: [{ occurrenceId: "occurrence-1", item: itemB, ...(mismatch === "snapshot" ? {} : { reviewSourceSnapshot: createReviewSourceSnapshot(original, "due_queue") }) }] });
    const refs = mismatch === "unit" ? [{ axisId: "node", nodeId: "node-u", role: "primary" }, { axisId: "mental_unit", nodeId: "unit-other", role: "primary" }] : original.taxonomyOrSkillRefs;
    const attemptB = createTrainingAttempt({ ...attempt("attempt-b", active.id), modeId: active.modeId, item: itemB, reviewEvidence: { sourceItem: itemB, taxonomyOrSkillRefs: refs } });
    const updated = transitionQualifiedSuccess(original, attemptB);
    await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attemptB }, { kind: "update_review_entry", record: updated, transitionId: attemptB.id }, { kind: "put_session", record: active }]), productionLearningDataAdmissionContext));
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [original]);
  }
});
test("rejects a fabricated historical source on a nonexistent review identity", async () => { installMemoryStorage(); const fabricated = { ...review("missing-review", "older-attempt"), sourceSessionId: "older-session" }; await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_review_entry", record: fabricated }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext)); });
test("rejects an explicit review update when its durable identity does not exist", async () => { installMemoryStorage(); const missing = { ...review("missing-update", "older-attempt"), sourceSessionId: "older-session" }; await assert.rejects(() => persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "update_review_entry", record: missing, transitionId: attempt().id }, { kind: "put_session", record: session() }]), productionLearningDataAdmissionContext)); });
test("rejects a persisted plan with a corrupt fingerprint and retains it", async () => { const storage = installMemoryStorage(); const corrupt = { ...outcome(), planFingerprint: "f".repeat(32) }; storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(corrupt)); await assert.rejects(() => recoverPendingMutation(), UnsupportedStoredRecordError); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true); });
test("idempotent repeated recovery", async () => { installMemoryStorage(); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); await recoverPendingMutation(); await recoverPendingMutation(); assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1); assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.length, 1); });
test("does not require remote content", async () => { installMemoryStorage(); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); await recoverPendingMutation(); assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value[0]?.item.questionId, "item-1"); });
test("does not recalc scoring", async () => { installMemoryStorage(); const record = outcome(); await persistMutationJournal(record, productionLearningDataAdmissionContext); await recoverPendingMutation(); assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value[0]?.result, attempt().result); });
test("does not generate IDs", async () => { installMemoryStorage(); await persistMutationJournal(outcome(), productionLearningDataAdmissionContext); await recoverPendingMutation(); assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value[0]?.id, "attempt-1"); });

test("fresh verified-pending-clear verification rejects every changed outcome target and retains the exact journal", async () => {
  installMemoryStorage();
  const targets = outcome().physicalWrites;
  for (const target of targets) {
    const storage = installMemoryStorage();
    const record = outcome();
    await reachVerifiedPendingClear(record);
    const step = record.physicalWrites.find((candidate) => candidate.target === target.target)!;
    storage.remove(step.key);
    await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "journal_clear");
    assert.equal(storage.getString(step.key), undefined, `${target.target} should remain in the observed third state`);
    assert.equal((await getActiveMutationJournal(productionLearningDataAdmissionContext))?.journalId, record.journalId);
  }
});

test("fresh verified-pending-clear verification checks result, terminal pointer, and required timer absence", async () => {
  const recordKeys = ["result:session-1", "session:session-1", "session_index", "active_session", "active_foreground_timer"];
  for (const target of recordKeys) {
    const storage = installMemoryStorage();
    await saveTrainingSession(session(), productionTrackAdmissionContext);
    const record = completion();
    await reachVerifiedPendingClear(record);
    const step = record.physicalWrites.find((candidate) => candidate.target === target)!;
    if (target === "active_session" || target === "active_foreground_timer") {
      const payload = target === "active_session" ? "foreign-session" : createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding-interview", sessionId: "session-1", trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: "2026-07-15T10:00:00.000Z", running: false });
      writeCanonicalJson(step.key, payload);
    } else storage.remove(step.key);
    await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "journal_clear");
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);
  }
});

test("fresh verified-pending-clear read errors retain the journal", async () => {
  installMemoryStorage();
  const targetSteps = outcome().physicalWrites;
  for (const target of targetSteps) {
    const storage = installMemoryStorage();
    const current = outcome();
    await reachVerifiedPendingClear(current);
    const step = current.physicalWrites.find((candidate) => candidate.target === target.target)!;
    storage.setFailurePlan({ kind: "fail_on_key_read", key: step.key });
    await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "journal_clear");
    storage.setFailurePlan(null);
    assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  }
});

test("verified session-only recovery rejects unrelated corruption without clearing or rewriting bytes", async () => {
  const cases = ["attempt", "session", "dangling_index", "orphan_attempt", "duplicate_active_review", "orphan_result", "read_failure"] as const;
  for (const defect of cases) {
    const storage = installMemoryStorage();
    await saveTrainingSession(session(), productionTrackAdmissionContext);
    const unrelated = attempt("unrelated-attempt", "unrelated-session");
    writeCanonicalJson(STORAGE_KEYS.trainingAttempt(unrelated.id), unrelated);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [unrelated.id]);
    const historical = session("completed", "unrelated-session");
    writeCanonicalJson(STORAGE_KEYS.trainingSession(historical.id), historical);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [session().id, historical.id]);
    await addReviewQueueItems([review("unrelated-review", unrelated.id)], productionTrackAdmissionContext);
    // No attempt/review/index target is declared by this session-only journal.
    const record = journal([{ kind: "put_session", record: { ...session(), activeForegroundMs: 1 } }], "advance_training_session");
    await reachVerifiedPendingClear(record);
    if (defect === "attempt") storage.setString(STORAGE_KEYS.trainingAttempt(unrelated.id), "{");
    if (defect === "session") storage.setString(STORAGE_KEYS.trainingSession(historical.id), "{");
    if (defect === "dangling_index") writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [unrelated.id, "missing-unrelated"]);
    if (defect === "orphan_attempt") writeCanonicalJson(STORAGE_KEYS.trainingAttempt("unindexed"), attempt("unindexed"));
    if (defect === "duplicate_active_review") {
      writeCanonicalJson(STORAGE_KEYS.reviewEntry("duplicate-cycle"), review("duplicate-cycle", unrelated.id));
      writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, ["unrelated-review", "duplicate-cycle"]);
    }
    if (defect === "orphan_result") writeCanonicalJson(STORAGE_KEYS.trainingSessionResult("missing-parent"), createTrainingSessionResult({
      id: "orphan-result", sessionId: "missing-parent", trackId: historical.trackId, totalOccurrences: 1,
      answeredOccurrenceIds: [], unansweredOccurrenceIds: ["occurrence-1"], completedAt: historical.completedAt!, evidence: { familyId: "coding-interview", details: {} },
    }));
    const before = storage.snapshot();
    if (defect === "read_failure") storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.trainingAttempt(unrelated.id) });
    for (let retry = 0; retry < 2; retry++) {
      await assert.rejects(() => recoverPendingMutation(), (error: unknown) => {
        if (!(error instanceof MutationCommitFailure) || error.phase !== "journal_clear") return false;
        if (defect === "read_failure") return error.cause instanceof StorageReadError;
        if (defect === "duplicate_active_review") return error.cause instanceof Error && error.cause.constructor === Error;
        return error.cause instanceof JournalVerificationError;
      }, defect);
      assert.deepEqual(storage.snapshot(), before, defect);
    }
    storage.setFailurePlan(null);
    assert.equal(getActiveMutationJournal(productionLearningDataAdmissionContext)?.status, "verified_pending_clear", defect);
  }
});

test("same payload at a newer canonical revision conflicts before replay and preserves raw bytes and journal", async () => {
  const storage = installMemoryStorage();
  await saveTrainingSession(session(), productionTrackAdmissionContext);
  const record = journal([{ kind: "put_session", record: session() }], "advance_training_session");
  await persistMutationJournal(record, productionLearningDataAdmissionContext);
  writeCanonicalJson(STORAGE_KEYS.trainingSession("session-1"), session());
  const conflictedSnapshot = storage.snapshot();

  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.deepEqual(storage.snapshot(), conflictedSnapshot);
  assert.equal((await getActiveMutationJournal(productionLearningDataAdmissionContext))?.journalId, record.journalId);
});

test("restarted recovery resumes after a write fault at every outcome boundary", async () => {
  installMemoryStorage();
  const boundaries = outcome().physicalWrites;
  for (const boundary of boundaries) {
    const storage = installMemoryStorage();
    const record = outcome();
    await persistMutationJournal(record, productionLearningDataAdmissionContext);
    storage.setFailurePlan({ kind: "fail_on_key_write", key: boundary.key });
    await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
    assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, `${boundary.target} interruption must retain its journal`);
    storage.setFailurePlan(null);
    await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, `${boundary.target} retry must clear after fresh verification`);
  }
});

test("restarted recovery resumes after each changed completion boundary, including timer removal", async () => {
  installMemoryStorage();
  await saveTrainingSession(session(), productionTrackAdmissionContext);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding-interview", sessionId: "session-1", trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: "2026-07-15T10:00:00.000Z", running: false }));
  const sample = completion().physicalWrites;
  const changed = sample.filter((step) => step.before.kind !== step.after.kind || (step.before.kind === "present" && step.after.kind === "present" &&
    (step.before.digest !== step.after.digest || step.before.revision !== step.after.envelope.revision)));
  for (const boundary of changed) {
    const storage = installMemoryStorage();
    await saveTrainingSession(session(), productionTrackAdmissionContext);
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding-interview", sessionId: "session-1", trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: "2026-07-15T10:00:00.000Z", running: false }));
    const record = completion();
    await persistMutationJournal(record, productionLearningDataAdmissionContext);
    const step = record.physicalWrites.find((candidate) => candidate.target === boundary.target)!;
    storage.setFailurePlan(step.after.kind === "absent"
      ? { kind: "fail_on_key_remove", key: step.key }
      : { kind: "fail_on_key_write", key: step.key });
    await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
    assert.notEqual(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, `${boundary.target} interruption must retain its journal`);
    storage.setFailurePlan(null);
    await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, `${boundary.target} retry must clear after fresh verification`);
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), false);
  }
});
