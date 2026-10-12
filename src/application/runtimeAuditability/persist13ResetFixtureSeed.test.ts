import assert from "node:assert/strict";
import test from "node:test";

import { canPersistTrainingSessionDraft } from "../../domain";
import { installLearningStateResetBarrier } from "../learningMutations/commitLearningStateReset";
import { MutationCommitFailure } from "../mutationBoundary";
import { clearPatternlyLocalHistory } from "../../features/home/localReset";
import {
  getActiveTrainingSession,
  getActiveMutationJournal,
  getActiveTrainingSessionDraft,
  getGuestInstallation,
  getTrainingAttempts,
  getTrainingSessions,
  provisionGuestInstallation,
} from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { installPersist13ResetPauseHook, PERSIST13_RESET_PAUSE_STAGE } from "./persist13ResetPauseHook";
import { seedPersist13ResetFixtureState } from "./persist13ResetFixtureSeed";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";


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
    await assert.rejects(clearPatternlyLocalHistory(), (error: unknown) => {
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

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
