import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createTrainingSessionDraft } from "../../domain";
import { getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getTrainingAttempts } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import {
  captureActiveProfileStorageLease,
  installKeyValueStorageForTests,
  MemoryKeyValueStorage,
  setActiveProfileLeaseForTests,
} from "../../infrastructure/storage/mmkvClient";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { composeTrainingLifecycleUseCases } from "./trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";

const PROFILE_A = Object.freeze({ id: "00000000-0000-4000-8000-000000000041", kind: "guest" as const, accountId: null });
const PROFILE_B = Object.freeze({ id: "00000000-0000-4000-8000-000000000042", kind: "guest" as const, accountId: null });
const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const SIMULATION_PROFILE_ID = "algorithms-interview-simulation-v1";

afterEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

function composeLifecycle(sessionId: string) {
  return composeTrainingLifecycleUseCases({
    sessionIds: { async create() { return sessionId; } },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
  });
}

test("real composition retains its opaque D receipt for exact readback reconciliation and isolates it from another lifecycle", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);

  const lifecycle = composeLifecycle("composition-d-receipt");
  const prepared = await lifecycle.startSession({
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    request: { scope: { simulationProfileId: SIMULATION_PROFILE_ID } },
  });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  let savedDraft = await getActiveTrainingSessionDraft();
  assert.ok(savedDraft);
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const retryDraft = createTrainingSessionDraft({
    ...savedDraft,
    revision: savedDraft.revision + 1,
    responsesByOccurrenceId: { [prepared.session.itemOrder[0]!.occurrenceId]: question.answer },
    flaggedOccurrenceIds: [prepared.session.itemOrder[0]!.occurrenceId],
    updatedAt: new Date(Date.now() + 1_000).toISOString(),
  });

  const prewriteReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT).length;
  const draftRawBeforePrewriteFailure = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  // The timer checkpoint runs three exact journal verifications first; fail at the draft command's own preflight read.
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, occurrence: prewriteReadsBefore + 4 });
  await assert.rejects(lifecycle.saveSimulationDraft({ draft: retryDraft, expectedPreviousRevision: savedDraft.revision }), /before it changed/u);
  storage.setFailurePlan(null);
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), draftRawBeforePrewriteFailure, "preflight failure leaves the exact prior draft bytes untouched");
  const retryable = await lifecycle.getSimulationOperationState(prepared.session);
  assert.equal("error" in retryable ? retryable.error.allowedAction : null, "retry_same_command");
  await lifecycle.retrySimulationDraftSave();
  savedDraft = await getActiveTrainingSessionDraft();
  assert.deepEqual(savedDraft, retryDraft);
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the real-composition retry keeps the exact command-entry lease");

  const attemptedDraft = createTrainingSessionDraft({
    ...savedDraft,
    revision: savedDraft.revision + 1,
    responsesByOccurrenceId: { [prepared.session.itemOrder[0]!.occurrenceId]: question.answer },
    flaggedOccurrenceIds: [],
    updatedAt: new Date(Date.now() + 2_000).toISOString(),
  });

  const draftReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT).length;
  // Three timer-checkpoint verifications plus the draft repository and canonical-write preflight precede readback.
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, occurrence: draftReadsBefore + 6 });
  await assert.rejects(lifecycle.saveSimulationDraft({ draft: attemptedDraft, expectedPreviousRevision: savedDraft.revision }), /result is uncertain/u);
  storage.setFailurePlan(null);

  const unresolved = await lifecycle.getSimulationOperationState(prepared.session);
  assert.equal("error" in unresolved ? unresolved.error.allowedAction : null, "reconcile");
  const durableAfterWriteFault = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  assert.ok(durableAfterWriteFault, "the repository write took effect before readback failed");
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the exact profile lease remains active while the receipt is reconciled");

  const foreignLifecycle = composeLifecycle("composition-foreign-lifecycle");
  assert.equal(await foreignLifecycle.reconcileSimulationDraftSave(prepared.session.id), "unknown", "another composition cannot borrow the original lifecycle's opaque receipt");
  await assert.rejects(foreignLifecycle.retrySimulationDraftSave(), /no exact simulation draft command safe to retry/u);
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), durableAfterWriteFault);

  assert.equal(await lifecycle.reconcileSimulationDraftSave(prepared.session.id), "verified");
  assert.deepEqual(await getActiveTrainingSessionDraft(), attemptedDraft);
  assert.equal((await lifecycle.getSimulationOperationState(prepared.session)).kind, "editable");
});

test("real composition rejects the original frozen journal retry after the same-profile lease changes away and back", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);

  const lifecycle = composeLifecycle("composition-journal-lease-aba");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const journalWritesBeforeSubmit = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  storage.setFailurePlan(null);

  const failed = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in failed ? failed.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length, journalWritesBeforeSubmit);

  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  const currentLease = captureActiveProfileStorageLease();
  assert.ok(currentLease);
  assert.notEqual(currentLease, originalLease, "returning to profile A creates a new lease generation");
  assert.equal(currentLease.profile.id, originalLease.profile.id);
  const beforeRejectedRetry = storage.snapshot();

  await assert.rejects(lifecycle.retryPracticeSubmission());

  const blocked = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in blocked ? blocked.error.allowedAction : null, "none");
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual(storage.snapshot(), beforeRejectedRetry, "stale original command cannot write into the replacement lease");
});

test("real composition retries the exact prewrite practice command once under the original lease", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);
  const lifecycle = composeLifecycle("composition-journal-same-lease-retry");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const journalWritesBefore = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  storage.setFailurePlan(null);

  const retryable = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in retryable ? retryable.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null, "the pre-set failure did not create a journal");
  assert.deepEqual((await getTrainingAttempts()).value, []);
  const beforeWrongRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryExpectedSessionAbandonment(prepared.session.id), /no exact abandonment command safe to retry/u);
  assert.deepEqual(storage.snapshot(), beforeWrongRetry, "a practice command handle cannot be used as an abandonment command");
  await lifecycle.retryPracticeSubmission();

  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]?.response, question.answer);
  assert.equal(attempts[0]?.sessionId, prepared.session.id);
  assert.equal((await getActiveTrainingSession())?.currentItemIndex, prepared.session.currentItemIndex, "submission does not silently advance the occurrence");
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the retry uses the exact lease captured before the first await");
  await assert.rejects(lifecycle.retryPracticeSubmission(), /no exact frozen command safe to retry/u);
  assert.equal((await getTrainingAttempts()).value.length, 1, "a completed frozen command cannot materialize twice");
  assert.ok(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length > journalWritesBefore);
});

test("real composition retries the exact prewrite abandonment under its original eligibility checks", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  let now = "2026-10-11T10:00:00.000Z";
  let exactResolutions = 0;
  const packages = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input: Parameters<typeof contentPackageRuntimeOwner.resolveExactArtifact>[0]) {
      exactResolutions += 1;
      return contentPackageRuntimeOwner.resolveExactArtifact(input);
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => now },
    packages,
    sessionIds: { async create() { return "composition-abandonment-exact-retry"; } },
  });
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const exactResolutionsBeforeAbandonment = exactResolutions;
  const writesBefore = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.abandonActiveSession());
  storage.setFailurePlan(null);

  const failed = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in failed ? failed.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null, "the prewrite transport failure did not persist a journal");
  assert.equal(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length, writesBefore);
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
  const beforeWrongRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryPracticeSubmission(), /no exact frozen command safe to retry/u);
  assert.deepEqual(storage.snapshot(), beforeWrongRetry, "an abandonment handle cannot be used as a practice submission");

  now = "2026-10-11T10:01:00.000Z";
  const abandoned = await lifecycle.retryExpectedSessionAbandonment(prepared.session.id);
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.completedAt, "2026-10-11T10:00:00.000Z", "retry used the frozen abandonment record instead of rebuilding it with the later clock");
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveMutationJournal(), null);
  assert.ok(exactResolutions >= exactResolutionsBeforeAbandonment + 3, "retry reran exact content eligibility in the original preflight");
  assert.ok(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length > writesBefore);
});

test("real composition refuses an abandonment retry after the original same-profile lease is replaced", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);
  const lifecycle = composeLifecycle("composition-abandonment-lease-aba");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.abandonActiveSession());
  storage.setFailurePlan(null);
  assert.equal((await lifecycle.getPracticeOperationState(prepared.session, false)).kind, "abandonment_failed_before_journal");

  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  const replacementLease = captureActiveProfileStorageLease();
  assert.ok(replacementLease);
  assert.notEqual(replacementLease, originalLease);
  assert.equal(replacementLease.profile.id, originalLease.profile.id);
  const beforeRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryExpectedSessionAbandonment(prepared.session.id));
  const blocked = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in blocked ? blocked.error.allowedAction : null, null, "the canonical active session is reprojected without exposing a retry for the stale command");
  assert.deepEqual(storage.snapshot(), beforeRetry, "the stale frozen abandonment cannot write through a replacement lease generation");
});
