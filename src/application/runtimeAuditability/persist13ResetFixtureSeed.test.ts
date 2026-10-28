import assert from "node:assert/strict";
import test from "node:test";

import { advanceTrainingSession, canPersistTrainingSessionDraft, getTrackRegistration, initialForegroundTimerForSession } from "../../domain";
import { commitLearningStateReset, installLearningStateResetBarrier } from "../learningMutations/commitLearningStateReset";
import { MutationCommitFailure } from "../mutationBoundary";
import {
  getActiveTrainingSession,
  getActiveMutationJournal,
  getActiveTrainingSessionDraft,
  getGuestInstallation,
  areMutationPhysicalWritesAfter,
  getTrainingAttempts,
  getTrainingSessions,
  getTrainingSessionResult,
  getActiveForegroundTimer,
  provisionGuestInstallation,
} from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { installPersist13AdvanceMaterializedPauseHook, installPersist13MaterializedJournalPauseHook, installPersist13ResetPauseHook, installPersist13SubmitClearNextPauseHook, installPersist13VerifyClearPauseHook, PERSIST13_ADVANCE_MATERIALIZED_STAGE, PERSIST13_RESET_PAUSE_STAGE, PERSIST13_SUBMIT_CLEAR_NEXT_STAGE, PERSIST13_VERIFY_CLEAR_PAUSE_STAGE } from "./persist13ResetPauseHook";
import { seedPersist13ResetFixtureState } from "./persist13ResetFixtureSeed";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { installTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";
import { loadCanonicalRuntimeCatalog, type CanonicalQuestionResponse, type Question } from "../../content/canonical";
import { captureActiveProfileStorageLease, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { getReviewQueueItems } from "../../storage/repositories";
import { canonicalPhysicalWriteRelation } from "../../storage/repositories/canonicalRecordCodec";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { recoverPendingMutation } from "../learningMutations/recoverPendingMutation";
import { getAlgorithmsPracticeProjection } from "../coding-interview/codingInterviewSessionFacade";


installLearningStateResetBarrier(async (reset) => reset());

test("PERSIST-13 journal baseline keeps completed history without pre-seeding an active session", async () => {
  const storage = installMemoryStorage();
  const runId = "33333333-3333-4333-8333-333333333333";
  await provisionGuestInstallation({ async create() { return Object.freeze({ installationId: "44444444-4444-4444-8444-444444444444", localDatasetId: runId }); } });
  const plan = await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
  const sessions = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  assert.ok(sessions.some((session) => session.status === "completed"));
  assert.ok(attempts.some((attempt) => sessions.some((session) => session.id === attempt.sessionId && session.status === "completed")));
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal(await getActiveTrainingSessionDraft(productionTrackAdmissionContext), null);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), undefined);
  assert.ok(plan.targets.length > 0);
});

test("PERSIST-13 seed uses the registered Coding simulation draft and pauses after reset materialization", async () => {
  const storage = installMemoryStorage();
  const runId = "22222222-2222-4222-8222-222222222222";
  const guestIdentity = Object.freeze({
    installationId: "11111111-1111-4111-8111-111111111111",
    localDatasetId: runId,
  });
  await provisionGuestInstallation({ async create() { return guestIdentity; } });
  const plan = await seedPersist13ResetFixtureState(runId);
  const sessions = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const active = sessions.find((session) => session.status === "active");
  const draft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
  assert.ok(active);
  assert.equal(active.modeId, "coding-interview-simulation");
  assert.equal(active.configurationSnapshot.kind, "algorithmsInterviewSimulation");
  assert.equal(active.configurationSnapshot.timer, "countdownForeground");
  assert.equal(active.configurationSnapshot.simulationProfileId, "algorithms-interview-simulation-v1");
  assert.equal(canPersistTrainingSessionDraft(active), true);
  assert.equal(draft?.sessionId, active.id);
  assert.equal(draft?.trackId, active.trackId);
  assert.equal(draft?.familyId, "coding_interview");
  assert.ok(plan.targets.some(({ key }) => key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT));
  assert.equal((await getGuestInstallation())?.localDatasetId, runId);

  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const originalEnvironment = {
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    fixture: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = "seed";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = runId;
  let reachedPause = false;
  try {
    installPersist13ResetPauseHook(async (stage) => {
      reachedPause = true;
      assert.equal(stage, PERSIST13_RESET_PAUSE_STAGE);
      throw new Error("persist13_test_pause");
    });
    await assert.rejects(commitLearningStateReset(new Date().toISOString()), (error: unknown) => {
      assert.ok(error instanceof MutationCommitFailure);
      assert.equal(error.phase, "materialization");
      assert.equal(error.durableState, "journal_durable");
      return true;
    });
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", originalEnvironment.mode);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", originalEnvironment.fixture);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", originalEnvironment.runId);
  }

  assert.equal(reachedPause, true);
  const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  assert.equal(journal?.operation, "reset_learning_state");
  assert.equal(journal?.status, "journal_durable");
  assert.ok(plan.targets.every(({ key }) => storage.getString(key) === undefined));
}
);

test("PERSIST-13 materialized journal pause observes the real lifecycle commit after attempt, session, and review writes", async () => {
  const storage = installMemoryStorage();
  const runId = "55555555-5555-4555-8555-555555555555";
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const originalEnvironment = {
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    fixture: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = "seed";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = runId;
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = "journal_materialized";
  let pauseObserved = false;
  try {
    setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
    const guestIdentity = Object.freeze({ installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: runId });
    await provisionGuestInstallation({ async create() { return guestIdentity; } });
    await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
    const lifecycle = composeTrainingLifecycleUseCases();
    installTrainingLifecycleUseCases(lifecycle);
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-materialized-journal-test", request: { requestedLength: 10 } });
    const first = prepared.session.itemOrder[0];
    assert.ok(first);
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(first.item.trackId, first.item.questionId);
    assert.ok(question);
    const response = incorrectCanonicalResponseForTest(question);
    const beforeAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.length;
    installPersist13MaterializedJournalPauseHook(async (stage) => {
      pauseObserved = true;
      assert.equal(stage, PERSIST13_RESET_PAUSE_STAGE);
      const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
      assert.ok(journal);
      assert.equal(journal?.operation, "submit_training_outcome");
      assert.equal(journal?.status, "journal_durable");
      assert.equal(journal?.sessionId, prepared.session.id);
      assert.ok(journal.physicalWrites.some((write) => canonicalPhysicalWriteRelation(write) === "before"));
      assert.equal(areMutationPhysicalWritesAfter(journal.physicalWrites), true);
      const committedAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
      assert.equal(committedAttempts.length, beforeAttempts + 1);
      assert.deepEqual(committedAttempts.find((attempt) => attempt.sessionId === prepared.session.id)?.response, response);
      assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === prepared.session.id)?.status, "active");
      assert.ok((await getReviewQueueItems(productionTrackAdmissionContext)).value.length > 0);
      throw new Error("persist13_test_materialized_pause");
    });
    await assert.rejects(lifecycle.submitPracticeResponse(response), (error: unknown) => {
      assert.ok(error instanceof TrainingApplicationFailure);
      assert.ok(error.cause instanceof MutationCommitFailure);
      assert.equal(error.cause.phase, "materialization");
      assert.equal(error.cause.durableState, "journal_durable");
      return true;
    });
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", originalEnvironment.mode);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", originalEnvironment.fixture);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", originalEnvironment.runId);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO", originalEnvironment.scenario);
  }
  assert.equal(pauseObserved, true);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL) !== undefined, true);
});

test("PERSIST-13 verify-clear pause observes real verified_pending_clear state after final verification", async () => {
  const storage = installMemoryStorage();
  const runId = "77777777-7777-4777-8777-777777777777";
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const originalEnvironment = {
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    fixture: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = "seed";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = runId;
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = "verify_clear";
  let pauseObserved = false;
  let expectedResponse: CanonicalQuestionResponse | null = null;
  try {
    setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
    const guestIdentity = Object.freeze({ installationId: "88888888-8888-4888-8888-888888888888", localDatasetId: runId });
    await provisionGuestInstallation({ async create() { return guestIdentity; } });
    await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
    const lifecycle = composeTrainingLifecycleUseCases();
    installTrainingLifecycleUseCases(lifecycle);
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-verify-clear-test", request: { requestedLength: 10 } });
    const first = prepared.session.itemOrder[0];
    assert.ok(first);
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(first.item.trackId, first.item.questionId);
    assert.ok(question);
    expectedResponse = incorrectCanonicalResponseForTest(question);
    const beforeAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.length;
    const beforeReviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value.length;
    const beforeSession = (await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === prepared.session.id);
    assert.ok(beforeSession);
    const beforeStorage = storage.snapshot();
    installPersist13VerifyClearPauseHook(async (stage) => {
      pauseObserved = true;
      assert.equal(stage, PERSIST13_VERIFY_CLEAR_PAUSE_STAGE);
      const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
      assert.ok(journal);
      assert.equal(journal?.operation, "submit_training_outcome");
      assert.equal(journal?.status, "verified_pending_clear");
      assert.equal(journal?.sessionId, prepared.session.id);
      const lease = captureActiveProfileStorageLease();
      assert.ok(lease);
      assert.deepEqual(lease?.profile, { id: runId, kind: "guest", accountId: null });
      assert.equal(areMutationPhysicalWritesAfter(journal.physicalWrites), true);
      assert.ok(journal.physicalWrites.some((write) => canonicalPhysicalWriteRelation(write) === "before"));
      assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, beforeAttempts + 1);
      assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value.find((attempt) => attempt.sessionId === prepared.session.id)?.response, expectedResponse);
      assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === prepared.session.id)?.currentItemIndex, beforeSession.currentItemIndex);
      assert.ok((await getReviewQueueItems(productionTrackAdmissionContext)).value.length >= beforeReviews);
      const afterStorage = storage.snapshot();
      const allowedKeys = new Set([...journal.physicalWrites.map((write) => write.key), STORAGE_KEYS.ACTIVE_JOURNAL]);
      const unexpectedKeys = new Set([...beforeStorage.keys(), ...afterStorage.keys()]);
      assert.deepEqual([...unexpectedKeys].filter((key) => beforeStorage.get(key) !== afterStorage.get(key) && !allowedKeys.has(key)), []);
      throw new Error("persist13_test_verify_clear_pause");
    });
    await assert.rejects(lifecycle.submitPracticeResponse(expectedResponse), (error: unknown) => {
      assert.ok(error instanceof TrainingApplicationFailure);
      assert.ok(error.cause instanceof MutationCommitFailure);
      assert.equal(error.cause.phase, "journal_clear");
      assert.equal(error.cause.durableState, "verified_pending_clear");
      return true;
    });
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", originalEnvironment.mode);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", originalEnvironment.fixture);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", originalEnvironment.runId);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO", originalEnvironment.scenario);
  }
  assert.equal(pauseObserved, true);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL) !== undefined, true);
});

test("PERSIST-13 submit-clear-next pause is after durable clear and the public lifecycle advances once", async () => {
  const storage = installMemoryStorage();
  const runId = "99999999-9999-4999-8999-999999999999";
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const originalEnvironment = {
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    fixture: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = "seed";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = runId;
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = "submit_clear_next";
  let pauseObserved = false;
  try {
    setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
    const guestIdentity = Object.freeze({ installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", localDatasetId: runId });
    await provisionGuestInstallation({ async create() { return guestIdentity; } });
    await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
    const lifecycle = composeTrainingLifecycleUseCases();
    installTrainingLifecycleUseCases(lifecycle);
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-submit-clear-next-test", request: { requestedLength: 10 } });
    const first = prepared.session.itemOrder[0];
    assert.ok(first);
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(first.item.trackId, first.item.questionId);
    assert.ok(question);
    const response = incorrectCanonicalResponseForTest(question);
    const beforeAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.length;
    installPersist13SubmitClearNextPauseHook(async (stage) => {
      pauseObserved = true;
      assert.equal(stage, PERSIST13_SUBMIT_CLEAR_NEXT_STAGE);
      assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
      assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined);
      const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
      assert.equal(attempts.length, beforeAttempts + 1);
      assert.deepEqual(attempts.find((attempt) => attempt.sessionId === prepared.session.id)?.response, response);
      assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 0);
      assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
      throw new Error("persist13_test_submit_clear_next_pause");
    });
    await assert.rejects(lifecycle.submitPracticeResponse(response));
    assert.equal(pauseObserved, true);
    const submittedSession = await getActiveTrainingSession(productionTrackAdmissionContext);
    assert.ok(submittedSession);
    const reconstructed = await lifecycle.reconstructOperationProjection(submittedSession);
    assert.equal(reconstructed.family, "practice");
    assert.equal(reconstructed.kind, "feedback");
    assert.equal(lifecycle.getOperationProjection(submittedSession.id)?.kind, "feedback");
    const advanced = await lifecycle.advancePracticeSession();
    assert.equal(advanced.currentItemIndex, 1);
    assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, beforeAttempts + 1);
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", originalEnvironment.mode);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", originalEnvironment.fixture);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", originalEnvironment.runId);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO", originalEnvironment.scenario);
  }
});

test("PERSIST-13 advance materialized stage-1 probe observes the actual public advance journal", async () => {
  const storage = installMemoryStorage();
  const runId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const originalEnvironment = {
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    fixture: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = "seed";
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = runId;
  process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = "advance_materialized";
  let pauseObserved = false;
  try {
    setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
    const guestIdentity = Object.freeze({ installationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", localDatasetId: runId });
    await provisionGuestInstallation({ async create() { return guestIdentity; } });
    await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
    const lifecycle = composeTrainingLifecycleUseCases();
    installTrainingLifecycleUseCases(lifecycle);
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-advance-materialized-probe", request: { requestedLength: 10 } });
    await getForegroundSessionTimerFacade().initialize(prepared.session);
    const occurrence = prepared.session.itemOrder[0];
    assert.ok(occurrence);
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(occurrence.item.trackId, occurrence.item.questionId);
    assert.ok(question);
    const response = incorrectCanonicalResponseForTest(question);
    await lifecycle.submitPracticeResponse(response);

    const baselineSession = await getActiveTrainingSession(productionTrackAdmissionContext);
    assert.ok(baselineSession);
    assert.equal(baselineSession.currentItemIndex, 0);
    assert.equal((await lifecycle.getPracticeOperationState(baselineSession, false)).kind, "feedback");
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
    const attemptsBefore = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
    const reviewsBefore = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
    const timerBefore = await getActiveForegroundTimer(productionTrackAdmissionContext);
    assert.ok(timerBefore);
    assert.equal(timerBefore?.running, false);
    assert.deepEqual(timerBefore, initialForegroundTimerForSession(baselineSession, getTrackRegistration(baselineSession.trackId).familyId));
    const storageBefore = storage.snapshot();
    const expectedAdvance = advanceTrainingSession(baselineSession);
    const expectedPhysicalTargets = ["active_session", `session:${baselineSession.id}`, "session_index"].sort();

    installPersist13AdvanceMaterializedPauseHook(async (stage) => {
      pauseObserved = true;
      assert.equal(stage, PERSIST13_ADVANCE_MATERIALIZED_STAGE);
      const lease = captureActiveProfileStorageLease();
      assert.ok(lease);
      assert.deepEqual(lease?.profile, { id: runId, kind: "guest", accountId: null });
      const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
      assert.ok(journal);
      assert.equal(journal.status, "journal_durable");
      assert.equal(journal.operation, "advance_training_session");
      assert.equal(journal.sessionId, baselineSession.id);
      assert.equal(journal.writes.length, 1);
      assert.equal(journal.writes[0]?.kind, "put_session");
      if (journal.writes[0]?.kind !== "put_session") throw new Error("persist13_advance_probe_write_shape_invalid");
      assert.deepEqual(journal.writes[0].record, expectedAdvance);
      assert.equal(areMutationPhysicalWritesAfter(journal.physicalWrites), true);
      assert.deepEqual(journal.physicalWrites.map((write) => write.target).sort(), expectedPhysicalTargets);
      assert.deepEqual(journal.physicalWrites.map((write) => write.key).sort(), [
        STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
        STORAGE_KEYS.trainingSession(baselineSession.id),
        STORAGE_KEYS.TRAINING_SESSION_INDEX,
      ].sort());
      const relations = journal.physicalWrites.map((write) => canonicalPhysicalWriteRelation(write));
      assert.ok(relations.every((relation) => relation === "before" || relation === "after"));
      const activeAfter = await getActiveTrainingSession(productionTrackAdmissionContext);
      assert.deepEqual(activeAfter, expectedAdvance);
      assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === baselineSession.id), expectedAdvance);
      assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, attemptsBefore);
      assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, reviewsBefore);
      assert.deepEqual(await getActiveForegroundTimer(productionTrackAdmissionContext), timerBefore);
      assert.equal(await getTrainingSessionResult(baselineSession.id, productionTrackAdmissionContext), null);
      const storageAfter = storage.snapshot();
      const allowedKeys = new Set([...journal.physicalWrites.map((write) => write.key), STORAGE_KEYS.ACTIVE_JOURNAL]);
      const allKeys = new Set([...storageBefore.keys(), ...storageAfter.keys()]);
      const changedKeys = [...allKeys].filter((key) => storageBefore.get(key) !== storageAfter.get(key));
      assert.ok(changedKeys.length > 0);
      assert.ok(changedKeys.every((key) => allowedKeys.has(key)));
      const relationCounts = relations.reduce<Record<string, number>>((counts, relation) => ({ ...counts, [relation]: (counts[relation] ?? 0) + 1 }), {});
      process.stdout.write(`PERSIST13_ADVANCE_MATERIALIZED_SHAPE ${JSON.stringify({ operation: journal.operation, status: journal.status, writeKinds: journal.writes.map((write) => write.kind), targets: journal.physicalWrites.map((write) => write.target).sort(), relationCounts, writesAfter: true, timerPresent: timerBefore !== null })}\n`);
      throw new Error("persist13_advance_materialized_probe_pause");
    });
    await assert.rejects(lifecycle.advancePracticeSession(), (error: unknown) => {
      assert.ok(error instanceof TrainingApplicationFailure);
      assert.ok(error.cause instanceof MutationCommitFailure);
      assert.equal(error.cause.phase, "materialization");
      assert.equal(error.cause.durableState, "journal_durable");
      return true;
    });
    assert.equal(pauseObserved, true);
    const pending = await getActiveMutationJournal(productionLearningDataAdmissionContext);
    assert.equal(pending?.operation, "advance_training_session");
    assert.equal(pending?.status, "journal_durable");
    await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
    assert.deepEqual(await getActiveTrainingSession(productionTrackAdmissionContext), expectedAdvance);
    assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, attemptsBefore);
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, reviewsBefore);
    assert.deepEqual(await getActiveForegroundTimer(productionTrackAdmissionContext), timerBefore);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", originalEnvironment.mode);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", originalEnvironment.fixture);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", originalEnvironment.runId);
    restoreEnvironment("EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO", originalEnvironment.scenario);
  }
});

test("PERSIST-13 practice UI probe seed commits real Coding feedback before exposing the screen host", async () => {
  const storage = installMemoryStorage();
  const runId = "7e4fb614-da0c-4f32-8676-4e002451dd22";
  setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
  await provisionGuestInstallation({ async create() { return Object.freeze({ installationId: "8e4fb614-da0c-4f32-8676-4e002451dd22", localDatasetId: runId }); } });
  await seedPersist13ResetFixtureState(runId, { includeActiveSession: false });
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  const lifecycle = composeTrainingLifecycleUseCases();
  installTrainingLifecycleUseCases(lifecycle);
  const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-practice-ui-probe-test", request: { requestedLength: 10 } });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  const occurrence = prepared.session.itemOrder[0];
  assert.ok(occurrence);
  const question = (await loadCanonicalRuntimeCatalog()).getQuestion(occurrence.item.trackId, occurrence.item.questionId);
  assert.ok(question);
  await lifecycle.submitPracticeResponse(incorrectCanonicalResponseForTest(question));

  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  const projection = await getAlgorithmsPracticeProjection();
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  const timer = await getActiveForegroundTimer(productionTrackAdmissionContext);
  assert.ok(active);
  assert.equal(active.id, prepared.session.id);
  assert.equal(active.status, "active");
  assert.equal(active.currentItemIndex, 0);
  assert.equal(projection.kind, "practice");
  if (projection.kind !== "practice") throw new Error("persist13_practice_ui_projection_kind_invalid");
  assert.equal(projection.operation.kind, "feedback");
  assert.equal(projection.position.current, 1);
  assert.ok(projection.feedback);
  assert.equal(projection.response?.source, "materialized");
  assert.ok(attempts.some((attempt) => attempt.sessionId === active.id && attempt.occurrenceId === occurrence.occurrenceId));
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined);
  assert.equal(await getTrainingSessionResult(active.id, productionTrackAdmissionContext), null);
  assert.ok(timer);
  assert.deepEqual(timer, initialForegroundTimerForSession(active, getTrackRegistration(active.trackId).familyId));
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function incorrectCanonicalResponseForTest(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type === "choice_single" && question.answer.type === "choice_single") {
    const answer = question.answer;
    const option = question.interaction.options.find((candidate) => candidate.optionId !== answer.optionId);
    if (option) return { type: "choice_single", optionId: option.optionId };
  }
  if (question.interaction.type === "choice_multiple" && question.answer.type === "choice_multiple") {
    const answer = question.answer;
    const option = question.interaction.options.find((candidate) => !answer.optionIds.includes(candidate.optionId));
    if (option) return { type: "choice_multiple", optionIds: [option.optionId] };
  }
  if (question.interaction.type === "ordering" && question.answer.type === "ordering" && question.answer.orderedElementIds.length > 1) {
    return { type: "ordering", orderedElementIds: [...question.answer.orderedElementIds].reverse() };
  }
  throw new Error("persist13_test_incorrect_response_unavailable");
}
