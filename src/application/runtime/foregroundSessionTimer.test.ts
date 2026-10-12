import assert from "node:assert/strict";
import test from "node:test";

import { ForegroundSessionTimer } from "./ForegroundSessionTimer";
import { createForegroundTimerState, type ForegroundTimerState } from "../../domain";
import { getActiveForegroundTimer, saveActiveForegroundTimer, saveTrainingSession } from "../../storage/repositories";
import { installMemoryStorage, session } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";


test("foreground timer checkpoints monotonic segments with an explicit drift bound and never counts closed-app wall time", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } };
  await saveTrainingSession(active, productionTrackAdmissionContext);
  const initial = await saveActiveForegroundTimer(createForegroundTimerState({
    schemaVersion: 1, timerVersion: 1, familyId: "coding_interview", sessionId: active.id, trackId: active.trackId,
    accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: "2026-07-16T10:00:00.000Z", running: false,
  }), null, productionTrackAdmissionContext);
  let monotonic = 0;
  let wall = "2026-07-16T10:00:00.000Z";
  const port = { save: (timer: ForegroundTimerState, revision: number | null) => saveActiveForegroundTimer(timer, revision, productionTrackAdmissionContext) };
  const timer = ForegroundSessionTimer.restore({ state: initial, port, monotonicClock: { now: () => monotonic }, wallClock: { now: () => wall } });

  await timer.enterForeground();
  monotonic = 14_000;
  assert.equal(timer.needsPeriodicCheckpoint(), true);
  wall = "2026-07-16T10:00:14.000Z";
  await timer.checkpointIfDue();
  assert.equal((await getActiveForegroundTimer(productionTrackAdmissionContext))?.accumulatedForegroundMs, 14_000);

  const durable = (await getActiveForegroundTimer(productionTrackAdmissionContext))!;
  wall = "2030-01-01T00:00:00.000Z";
  let restartedMonotonic = 0;
  const restarted = ForegroundSessionTimer.restore({ state: durable, port, monotonicClock: { now: () => restartedMonotonic }, wallClock: { now: () => wall } });
  assert.equal(restarted.getAccumulatedForegroundMs(), 14_000);
  await restarted.enterForeground();
  restartedMonotonic = 0;
  await restarted.leaveForeground();
  assert.equal((await getActiveForegroundTimer(productionTrackAdmissionContext))?.accumulatedForegroundMs, 14_000);
});

test("foreground timer rejects stale checkpoints and retains the previous durable checkpoint", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } };
  await saveTrainingSession(active, productionTrackAdmissionContext);
  const initial = createForegroundTimerState({
    schemaVersion: 1, timerVersion: 1, familyId: "coding_interview", sessionId: active.id, trackId: active.trackId,
    accumulatedForegroundMs: 100, checkpointRevision: 1, lastCheckpointAt: "2026-07-16T10:00:00.000Z", running: false,
  });
  const durable = await saveActiveForegroundTimer(initial, null, productionTrackAdmissionContext);
  await assert.rejects(saveActiveForegroundTimer({ ...durable, accumulatedForegroundMs: 200 }, 99, productionTrackAdmissionContext), /expected checkpoint revision is stale/);
  assert.equal((await getActiveForegroundTimer(productionTrackAdmissionContext))?.accumulatedForegroundMs, 100);
});
