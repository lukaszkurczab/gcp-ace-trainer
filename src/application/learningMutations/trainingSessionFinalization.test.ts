import assert from "node:assert/strict";
import test from "node:test";

import { commitTrainingSessionFinalization, recoverPendingMutation } from "./";
import { MutationCommitFailure } from "../mutationBoundary";
import { materializeMutation } from "./mutationMaterializer";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { completeTrainingSession, createTrainingAttempt, createTrainingSessionDraft, type TrainingSessionDraft } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../../storage/keys";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { captureMutationExpectedRevisions, captureMutationPhysicalWrites, createMutationPlanFingerprint, isMutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { readActiveTrainingSessionDraftStateProof } from "../../storage/repositories/trainingSessionDraftRepository";
import {
  getActiveMutationJournal,
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  addReviewQueueItems,
  persistMutationJournal,
  updateMutationJournalPhase,
  removeReviewQueueEntry,
  saveTrainingSession,
  saveTrainingSessionDraft as persistTrainingSessionDraft,
} from "../../storage/repositories";
import { acceptSimulationFinalizationForTest, installMemoryStorage, journal, review, session, timestamp } from "../../testing/journalTestSupport";

const draftConfiguration = { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } as const;

async function saveTrainingSessionDraft(draft: TrainingSessionDraft) {
  return persistTrainingSessionDraft(draft, (await getActiveTrainingSessionDraft())?.revision ?? null);
}

function setup() {
  const base = session();
  const active = {
    ...base,
    modeId: "coding-interview-simulation",
    configurationSnapshot: draftConfiguration,
    requestedLength: 2,
    actualLength: 2,
    itemOrder: [
      base.itemOrder[0]!,
      { occurrenceId: "occurrence-unanswered", item: { ...base.itemOrder[0]!.item, questionId: "item-unanswered" } },
    ],
    optionOrderByOccurrence: { "occurrence-1": ["a", "b"], "occurrence-unanswered": ["a", "b"] },
  };
  const response = { selectedOptionIds: ["a"] };
  const draft = createTrainingSessionDraft({
    sessionId: active.id,
    trackId: active.trackId,
    responsesByOccurrenceId: { "occurrence-1": response },
    updatedAt: timestamp,
  });
  const attempt = createTrainingAttempt({
    id: "simulation-attempt-1",
    sessionId: active.id,
    trackId: active.trackId,
    modeId: active.modeId,
    occurrenceId: "occurrence-1",
    item: active.itemOrder[0]!.item,
    response,
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder[0]!.item, taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }] },
    answeredAt: timestamp,
    committedAt: timestamp,
  });
  return { active, completed: completeTrainingSession(active, timestamp), draft, attempt };
}

test("Algorithms finalization commits exactly answered occurrences and deletes the matching draft", async () => {
  installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await commitTrainingSessionFinalization({
    session: completed,
    attempts: [attempt],
    reviewMutations: [],
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] },
    createdAt: timestamp,
  });

  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.deepEqual((await getReviewQueueItems()).value, []);
  assert.equal((await getTrainingSessions()).value[0]?.status, "completed");
  assert.equal(await getActiveTrainingSessionDraft(), null);
});

test("Algorithms finalization rejects attempts that do not correspond exactly to answered draft occurrences", async () => {
  installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await assert.rejects(commitTrainingSessionFinalization({
    session: completed,
    attempts: [{ ...attempt, response: { selectedOptionIds: ["b"] } }],
    reviewMutations: [],
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] },
    createdAt: timestamp,
  }));
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.notEqual(await getActiveTrainingSessionDraft(), null);
});

test("Algorithms finalization rejects a stale cleanup draft before journal persistence or outcome writes", async () => {
  installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  const stale = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["b"] } }, updatedAt: "2026-07-15T09:59:00.000Z" });
  await assert.rejects(commitTrainingSessionFinalization({
    session: completed,
    attempts: [attempt],
    reviewMutations: [],
    cleanup: { kind: "training_session_draft", draft: stale, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] },
    createdAt: timestamp,
  }), /does not match the active response draft/);
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.equal((await getTrainingSessions()).value[0]?.status, "active");
  assert.deepEqual(await getActiveTrainingSessionDraft(), draft);
});

test("force-close replay completes an Algorithms finalization idempotently at the draft-delete boundary", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT });
  await assert.rejects(commitTrainingSessionFinalization({
    session: completed,
    attempts: [attempt],
    reviewMutations: [],
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] },
    createdAt: timestamp,
  }));
  assert.notEqual(await getActiveMutationJournal(), null);

  storage.setFailurePlan(null);
  await recoverPendingMutation();
  await recoverPendingMutation();
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getTrainingSessions()).value.length, 1);
});

test("duplicate content occurrences keep distinct attempts and consolidate review to the latest planned transition", async () => {
  installMemoryStorage();
  const base = session();
  const active = {
    ...base,
    modeId: "coding-interview-simulation",
    configurationSnapshot: draftConfiguration,
    requestedLength: 2,
    actualLength: 2,
    itemOrder: [
      { occurrenceId: "first", item: base.itemOrder[0]!.item },
      { occurrenceId: "second", item: base.itemOrder[0]!.item },
    ],
    optionOrderByOccurrence: { first: ["a", "b"], second: ["a", "b"] },
  };
  const firstResponse = { selectedOptionIds: ["a"] };
  const secondResponse = { selectedOptionIds: ["b"] };
  const draft = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { first: firstResponse, second: secondResponse }, updatedAt: timestamp });
  const makeAttempt = (id: string, occurrenceId: string, response: typeof firstResponse) => createTrainingAttempt({
    id, sessionId: active.id, trackId: active.trackId, modeId: active.modeId, occurrenceId,
    item: active.itemOrder[0]!.item, response, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder[0]!.item, taxonomyOrSkillRefs: [{ axisId: "topic", nodeId: "one" }] },
    answeredAt: timestamp, committedAt: timestamp,
  });
  const firstAttempt = makeAttempt("first-attempt", "first", firstResponse);
  const secondAttempt = makeAttempt("second-attempt", "second", secondResponse);
  const firstReview = { ...review("first-review", firstAttempt.id), sourceSessionId: active.id, sourceItem: firstAttempt.item, taxonomyOrSkillRefs: firstAttempt.reviewEvidence.taxonomyOrSkillRefs };
  const secondReview = { ...review("second-review", secondAttempt.id), sourceSessionId: active.id, sourceItem: secondAttempt.item, taxonomyOrSkillRefs: secondAttempt.reviewEvidence.taxonomyOrSkillRefs };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await commitTrainingSessionFinalization({
    session: completeTrainingSession(active, timestamp),
    attempts: [firstAttempt, secondAttempt],
    reviewMutations: [
      { action: "put", record: secondReview, transitionAttemptId: secondAttempt.id },
    ],
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [firstAttempt.occurrenceId, secondAttempt.occurrenceId] },
    createdAt: timestamp,
  });
  assert.deepEqual((await getTrainingAttempts()).value.map((entry) => entry.occurrenceId).sort(), ["first", "second"]);
  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.sourceAttemptId), [secondAttempt.id]);
});

test("finalization can resolve a review through an exact transition attempt", async () => {
  installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  const correctAttempt = createTrainingAttempt({ ...attempt, id: "correct-transition", result: { kind: "correct", earnedPoints: 1, maxPoints: 1 } });
  const existing = { ...review("existing-review", "historical-attempt"), sourceSessionId: "historical-session", sourceItem: correctAttempt.item, taxonomyOrSkillRefs: correctAttempt.reviewEvidence.taxonomyOrSkillRefs };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await addReviewQueueItems([existing]);
  await commitTrainingSessionFinalization({
    session: completed,
    attempts: [correctAttempt],
    reviewMutations: [{ action: "delete", record: existing, transitionAttemptId: correctAttempt.id }],
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [correctAttempt.occurrenceId] },
    createdAt: timestamp,
  });
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("simulation finalization reports a review race while preserving the exact graded attempt and result records", async () => {
  installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  const baseline = { ...review("simulation-review-race", "older-attempt"), sourceSessionId: "older-session", sourceItem: attempt.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs };
  const concurrentlyChanged = { ...baseline, dueAt: "2026-07-16T10:00:00.000Z" };
  const proposed = { ...baseline, sourceAttemptId: attempt.id, sourceSessionId: active.id, dueAt: "2026-07-22T10:00:00.000Z", lastReviewedAt: timestamp };
  const result = { id: `${active.id}:result`, sessionId: active.id, trackId: active.trackId, totalOccurrences: active.actualLength, answeredOccurrenceIds: [attempt.occurrenceId], unansweredOccurrenceIds: ["occurrence-unanswered"], completedAt: timestamp, evidence: { familyId: "coding_interview", details: {} } } as const;
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await addReviewQueueItems([concurrentlyChanged]);

  const reviewConflict = await commitTrainingSessionFinalization({
    session: completed,
    attempts: [attempt],
    reviewMutations: [{ action: "update", record: proposed, transitionAttemptId: attempt.id }],
    reviewBaseline: [baseline],
    result,
    cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] },
    createdAt: timestamp,
  });

  assert.equal(reviewConflict, true);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt], "the graded response remains durable");
  assert.deepEqual((await getReviewQueueItems()).value, [concurrentlyChanged], "a concurrent review-cycle change is not overwritten");
  assert.equal((await getTrainingSessions()).value[0]?.status, "completed");
  assert.equal(await getActiveTrainingSessionDraft(), null);
});

test("journaled transition delete rejects a same-id review conflict before outcome writes and replays exact or absent identity", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  const correctAttempt = createTrainingAttempt({ ...attempt, id: "delete-transition", result: { kind: "correct", earnedPoints: 1, maxPoints: 1 } });
  const existing = { ...review("delete-review", "historical-attempt"), sourceSessionId: "historical-session", sourceItem: correctAttempt.item, taxonomyOrSkillRefs: correctAttempt.reviewEvidence.taxonomyOrSkillRefs };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  await addReviewQueueItems([existing]);
  const exactExistingReviewBytes = storage.getString(STORAGE_KEYS.reviewEntry(existing.id));
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(correctAttempt.id) });
  await assert.rejects(commitTrainingSessionFinalization({ session: completed, attempts: [correctAttempt], reviewMutations: [{ action: "delete", record: existing, transitionAttemptId: correctAttempt.id }], cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [correctAttempt.occurrenceId] }, createdAt: timestamp }));
  storage.setFailurePlan(null);
  writeCanonicalJson(STORAGE_KEYS.reviewEntry(existing.id), { ...existing, dueAt: "2026-07-16T10:00:00.000Z" });
  await assert.rejects(recoverPendingMutation(), /materialize/);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.ok(exactExistingReviewBytes);
  storage.setString(STORAGE_KEYS.reviewEntry(existing.id), exactExistingReviewBytes);
  await recoverPendingMutation();
  assert.deepEqual((await getReviewQueueItems()).value, []);

  installMemoryStorage();
  const second = setup();
  await saveTrainingSession(second.active);
  await saveTrainingSessionDraft(second.draft);
  await addReviewQueueItems([existing]);
  const absentAttempt = createTrainingAttempt({ ...second.attempt, id: "absent-delete-transition", result: { kind: "correct", earnedPoints: 1, maxPoints: 1 } });
  const absentCommand = commitTrainingSessionFinalization({ session: second.completed, attempts: [absentAttempt], reviewMutations: [{ action: "delete", record: existing, transitionAttemptId: absentAttempt.id }], cleanup: { kind: "training_session_draft", draft: second.draft, acceptedFinalization: await acceptSimulationFinalizationForTest(second.active, second.draft), submittedOccurrenceIds: [absentAttempt.occurrenceId] }, createdAt: timestamp });
  await removeReviewQueueEntry(existing.id);
  await absentCommand;
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("Algorithms finalization recovers idempotently across every canonical write boundary", async () => {
  const failurePlans = [
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt("simulation-attempt-1") },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry("review:simulation-attempt-1") },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession("session-1") },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ] as const;
  for (const failurePlan of failurePlans) {
    const storage = installMemoryStorage();
    const { active, completed, draft, attempt } = setup();
    const reviewRecord = { ...review("review:simulation-attempt-1", attempt.id), sourceSessionId: active.id, sourceItem: attempt.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs };
    await saveTrainingSession(active);
    await saveTrainingSessionDraft(draft);
    storage.setFailurePlan(failurePlan);
    const acceptedFinalization = await acceptSimulationFinalizationForTest(active, draft);
    const command = () => commitTrainingSessionFinalization({ session: completed, attempts: [attempt], reviewMutations: [{ action: "put", record: reviewRecord, transitionAttemptId: attempt.id }], cleanup: { kind: "training_session_draft", draft, acceptedFinalization, submittedOccurrenceIds: [attempt.occurrenceId] }, createdAt: timestamp });
    await assert.rejects(command());
    storage.setFailurePlan(null);
    if (failurePlan.key === STORAGE_KEYS.ACTIVE_JOURNAL && failurePlan.kind === "fail_on_key_write") await command();
    else await recoverPendingMutation();
    await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(), null, failurePlan.key);
    assert.equal(await getActiveTrainingSessionDraft(), null, failurePlan.key);
    assert.equal((await getTrainingAttempts()).value.length, 1, failurePlan.key);
    assert.equal((await getReviewQueueItems()).value.length, 1, failurePlan.key);
    assert.equal((await getTrainingSessions()).value[0]?.status, "completed", failurePlan.key);
  }
});

test("persisted finalization journal preflights a stale durable draft before replaying any outcome write", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(attempt.id) });
  await assert.rejects(commitTrainingSessionFinalization({ session: completed, attempts: [attempt], reviewMutations: [], cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] }, createdAt: timestamp }));
  storage.setFailurePlan(null);
  const stale = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["b"] } }, updatedAt: "2026-07-15T10:01:00.000Z" });
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, stale);
  await assert.rejects(recoverPendingMutation(), /materialize/i);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.equal((await getTrainingSessions()).value[0]?.status, "active");
  assert.deepEqual(await getActiveTrainingSessionDraft(), stale);
});

test("draft saves are locked as soon as a finalization journal is pending", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(attempt.id) });
  await assert.rejects(commitTrainingSessionFinalization({ session: completed, attempts: [attempt], reviewMutations: [], cleanup: { kind: "training_session_draft", draft, acceptedFinalization: await acceptSimulationFinalizationForTest(active, draft), submittedOccurrenceIds: [attempt.occurrenceId] }, createdAt: timestamp }));
  storage.setFailurePlan(null);
  const edited = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: {}, updatedAt: "2026-07-15T10:01:00.000Z" });
  await assert.rejects(saveTrainingSessionDraft(edited), /durable mutation is pending/);
  assert.deepEqual(await getActiveTrainingSessionDraft(), draft);
});

test("ordinary draft saves are locked immediately after exact finalization acceptance", async () => {
  installMemoryStorage();
  const { active, draft } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  const edited = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: {}, updatedAt: "2026-07-15T10:01:00.000Z" });
  const accepted = await acceptSimulationFinalizationForTest(active, draft);
  await assert.rejects(saveTrainingSessionDraft(edited), /accepted for finalization/u);
  const after = readActiveTrainingSessionDraftStateProof();
  assert.deepEqual(after?.state, accepted);
});

test("accepted finalization journals bind command identity and reject a re-fingerprinted full-wrapper forgery before J", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  const accepted = await acceptSimulationFinalizationForTest(active, draft);
  const writes = [
    { kind: "put_attempt" as const, record: attempt },
    { kind: "put_session" as const, record: completed },
    { kind: "clear_active_session" as const, sessionId: active.id },
    { kind: "delete_active_session_draft" as const, record: accepted, submittedOccurrenceIds: [attempt.occurrenceId] },
  ];
  const record = await buildMutationJournal({ operation: "finalize_training_session", sessionId: active.id, trackId: active.trackId, identity: accepted.acceptance, writes, createdAt: timestamp });
  assert.equal(isMutationJournalRecord(record), true);

  const changedCommandIdentity = { ...record.commandIdentity, fingerprint: "f".repeat(64) };
  const identityPlan = { ...record, commandIdentity: changedCommandIdentity };
  const wrongIdentityRecord = { ...identityPlan, journalId: `journal:${changedCommandIdentity.fingerprint}`, planFingerprint: createMutationPlanFingerprint(identityPlan) };
  assert.equal(isMutationJournalRecord(wrongIdentityRecord), false, "a recomputed journal fingerprint cannot detach commandIdentity from the accepted commandId");

  const forgedAccepted = { ...accepted, responseDraft: createTrainingSessionDraft({ ...accepted.responseDraft, updatedAt: "2026-07-16T10:00:00.000Z" }) };
  const forgedWrites = writes.map((write) => write.kind === "delete_active_session_draft" ? { ...write, record: forgedAccepted } : write);
  const forgedPhysicalWrites = record.physicalWrites.map((step) => {
    if (step.target !== "active_session_draft" || step.before.kind !== "present" || !step.before.envelope) return step;
    const envelope = { ...step.before.envelope, payload: forgedAccepted };
    return { ...step, before: { ...step.before, envelope, digest: sha256Utf8(JSON.stringify(envelope)), payloadDigest: sha256Utf8(JSON.stringify(forgedAccepted)) } };
  });
  const expectedRevisions = captureMutationExpectedRevisions(forgedWrites);
  const forgedPlan = { ...record, expectedRevisions, physicalWrites: forgedPhysicalWrites, writes: forgedWrites };
  const forgedRecord = { ...forgedPlan, planFingerprint: createMutationPlanFingerprint(forgedPlan) };
  assert.equal(isMutationJournalRecord(forgedRecord), false, "closed typed-write derivation rejects a recomputed physical plan carrying a different full D wrapper");
  const acceptedBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  assert.ok(acceptedBytes);
  await assert.rejects(persistMutationJournal(forgedRecord));
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), acceptedBytes, "forged cleanup cannot replace or clear the real accepted wrapper");
  assert.equal(await getActiveMutationJournal(), null, "the conflicting J was not written");
});

test("verified finalization refuses a reappearing draft and retains the journal", async () => {
  const storage = installMemoryStorage();
  const { active, completed, draft, attempt } = setup();
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(draft);
  const acceptedFinalization = await acceptSimulationFinalizationForTest(active, draft);
  const writes = [
    { kind: "put_attempt", record: attempt },
    { kind: "put_session", record: completed },
    { kind: "clear_active_session", sessionId: completed.id },
    { kind: "delete_active_session_draft", record: acceptedFinalization, submittedOccurrenceIds: [attempt.occurrenceId] },
  ] as const;
  const record = await buildMutationJournal({ operation: "finalize_training_session", sessionId: completed.id, trackId: completed.trackId,
    identity: acceptedFinalization.acceptance, writes, createdAt: timestamp });
  await persistMutationJournal(record);
  await materializeMutation(record);
  const materialized = await updateMutationJournalPhase(record, "materialized");
  await updateMutationJournalPhase(materialized, "verified_pending_clear");

  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, draft);
  const unexpectedDraftBytes = storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "journal_clear");
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), unexpectedDraftBytes);
  assert.equal((await getActiveMutationJournal())?.journalId, record.journalId);
});
