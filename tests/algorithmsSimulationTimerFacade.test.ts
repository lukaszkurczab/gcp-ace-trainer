import assert from "node:assert/strict";
import test from "node:test";
import { AlgorithmsSimulationTimerFacade, AlgorithmsSimulationTimerRecoveryError, type AlgorithmsSimulationTimerDependencies } from "../src/application/algorithms";
import { createForegroundTimerState, createTrainingSession, type ForegroundTimerState } from "../src/domain";
import type { TrainingLifecycleUseCases } from "../src/application/trainingLifecycle";

const startedAt = "2026-07-19T10:00:00.000Z";

function simulationSession() {
  return createTrainingSession({
    id: "simulation-1", trackId: "algorithms", modeId: "algorithms-interview-simulation",
    configurationSnapshot: { kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 2_700_000 },
    requestedLength: 40, actualLength: 40, currentItemIndex: 0,
    itemOrder: Array.from({ length: 40 }, (_, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: "algorithms", contentVersion: "algorithms-core-0002", itemId: `item-${index}` } })),
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion: "algorithms-core-0002", taxonomyVersion: "algorithms-taxonomy-v2", planFingerprint: "a".repeat(64), status: "active", startedAt,
  });
}

function fixture() {
  let now = 0;
  let state: ForegroundTimerState | null = null;
  const checkpoints: number[] = [];
  const dependencies: AlgorithmsSimulationTimerDependencies = {
    async getTimer() { return state; },
    async saveTimer(candidate, expected) {
      assert.equal(expected, state?.checkpointRevision ?? null);
      state = createForegroundTimerState({ ...candidate, checkpointRevision: (state?.checkpointRevision ?? 0) + 1 });
      return state;
    },
    lifecycle: () => ({ checkpointSimulationForegroundTime: async (elapsed: number) => { checkpoints.push(elapsed); return simulationSession(); } } as unknown as TrainingLifecycleUseCases),
    monotonicClock: { now: () => now }, wallClock: { now: () => startedAt },
    schedule: () => 0 as unknown as ReturnType<typeof setInterval>, cancel: () => undefined,
  };
  return { session: simulationSession(), timer: new AlgorithmsSimulationTimerFacade(dependencies), setNow(value: number) { now = value; }, checkpoints, getState: () => state };
}

test("initializes, checkpoints and projects Algorithms Simulation foreground time outside UI", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  assert.equal(f.getState()?.checkpointRevision, 1);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);
  const projection = await f.timer.leaveForeground(f.session);
  assert.equal(projection.elapsedForegroundMs, 1_250);
  assert.equal(projection.remainingForegroundMs, 2_698_750);
  assert.deepEqual(f.checkpoints, [0, 1_250]);
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
});

test("missing persisted timer on resume is an explicit recovery failure", async () => {
  const f = fixture();
  await assert.rejects(() => f.timer.restoreForResume(f.session), AlgorithmsSimulationTimerRecoveryError);
});
