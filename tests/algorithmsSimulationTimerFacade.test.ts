import assert from "node:assert/strict";
import test from "node:test";

import {
  AlgorithmsSimulationTimerFacade,
  AlgorithmsSimulationTimerRecoveryError,
  getAlgorithmsSessionRuntimePorts,
  installAlgorithmsSessionRuntimePorts,
  type AlgorithmsSimulationTimerDependencies,
} from "../src/application/algorithms";
import { createForegroundTimerState, createTrainingSession, type ForegroundTimerState } from "../src/domain";
import type { TrainingLifecycleUseCases } from "../src/application/trainingLifecycle";
import { simulationTimer } from "../src/features/simulation/simulationProjection";

const startedAt = "2026-07-19T10:00:00.000Z";

function simulationSession(duration = 2_700_000) {
  return createTrainingSession({
    id: "simulation-1", trackId: "algorithms", modeId: "algorithms-interview-simulation",
    configurationSnapshot: { kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: duration },
    requestedLength: 40, actualLength: 40, currentItemIndex: 0,
    itemOrder: Array.from({ length: 40 }, (_, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: "algorithms", contentVersion: "algorithms-core-0002", itemId: `item-${index}` } })),
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion: "algorithms-core-0002", taxonomyVersion: "algorithms-taxonomy-v2", planFingerprint: "a".repeat(64), status: "active", startedAt,
  });
}

function fixture(duration?: number) {
  let now = 0;
  let state: ForegroundTimerState | null = null;
  let active = simulationSession(duration);
  let scheduled: (() => void) | null = null;
  let finalizations = 0;
  let durableAtFinalization: ForegroundTimerState | null = null;
  const checkpoints: number[] = [];
  const lifecycle = {
    checkpointSimulationForegroundTime: async (elapsed: number) => {
      checkpoints.push(elapsed);
      active = createTrainingSession({ ...active, activeForegroundMs: elapsed });
      return active;
    },
    resumeActiveSession: async () => active,
    finalizeSimulation: async () => { finalizations += 1; durableAtFinalization = state; },
  } as unknown as TrainingLifecycleUseCases;
  const dependencies: AlgorithmsSimulationTimerDependencies = {
    repository: {
      async getActive() { return state; },
      async save(candidate, expected) {
        assert.equal(expected, state?.checkpointRevision ?? null);
        state = createForegroundTimerState({ ...candidate, checkpointRevision: (state?.checkpointRevision ?? 0) + 1 });
        return state;
      },
    },
    lifecycle,
    monotonicClock: { now: () => now }, wallClock: { now: () => startedAt },
    schedule(callback) { scheduled = callback; return 0 as unknown as ReturnType<typeof setInterval>; },
    cancel: () => undefined,
    finalize: async () => lifecycle.finalizeSimulation(),
  };
  const create = () => new AlgorithmsSimulationTimerFacade(dependencies);
  return {
    session: active, timer: create(), create, checkpoints,
    getActiveSession: () => active,
    setNow(value: number) { now = value; },
    getState: () => state,
    getFinalizations: () => finalizations,
    getDurableAtFinalization: () => durableAtFinalization,
    async tick() { scheduled?.(); for (let index = 0; index < 12; index += 1) await Promise.resolve(); },
  };
}

test("foreground enter and leave checkpoint authoritative time outside the UI", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);
  const projection = await f.timer.leaveForeground(f.session);
  assert.deepEqual(projection, { elapsedForegroundMs: 1_250, remainingForegroundMs: 2_698_750 });
  assert.deepEqual(f.checkpoints, [0, 1_250]);
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
});

test("AppState foreground transitions and force-close recovery never count background or closed-app time", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(100);
  await f.timer.leaveForeground(f.session);
  f.setNow(900_000); // inactive/background and process-closed time
  await f.timer.enterForeground(f.session);
  f.setNow(900_200);
  await f.timer.leaveForeground(f.session);
  assert.equal(f.getState()?.accumulatedForegroundMs, 300);

  const restarted = f.create();
  await restarted.restoreForResume(f.getActiveSession());
  assert.equal((await restarted.projection(f.getActiveSession())).elapsedForegroundMs, 300);
});

test("periodic checkpoint publishes a live projection refresh", async () => {
  const f = fixture();
  let refreshes = 0;
  f.timer.subscribe(() => { refreshes += 1; });
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(14_000);
  await f.tick();
  assert.equal(f.getState()?.accumulatedForegroundMs, 14_000);
  assert.ok(refreshes >= 2);
});

test("controlled timer refreshes consecutive visible labels without a durable write each second", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  const checkpointRevision = f.getState()?.checkpointRevision;

  f.setNow(1_000);
  await f.tick();
  const first = simulationTimer((await f.timer.projection(f.getActiveSession())).remainingForegroundMs);
  f.setNow(2_000);
  await f.tick();
  const second = simulationTimer((await f.timer.projection(f.getActiveSession())).remainingForegroundMs);

  assert.deepEqual([first.label, second.label], ["44:59", "44:58"]);
  assert.equal(f.getState()?.checkpointRevision, checkpointRevision);
});

test("periodic checkpoint uses the declared durable interval with an exact write count", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);

  f.setNow(13_999);
  await f.tick();
  assert.equal(f.getState()?.checkpointRevision, 2);
  f.setNow(14_000);
  await f.tick();
  assert.equal(f.getState()?.checkpointRevision, 3);
  f.setNow(27_999);
  await f.tick();
  assert.equal(f.getState()?.checkpointRevision, 3);
  f.setNow(28_000);
  await f.tick();

  assert.equal(f.getState()?.checkpointRevision, 4);
  assert.deepEqual(f.checkpoints, [0, 14_000, 28_000]);
});

test("force-close before and after a checkpoint resumes only the last verified checkpoint", async () => {
  const before = fixture();
  await before.timer.initialize(before.session);
  await before.timer.enterForeground(before.session);
  before.setNow(9_000);
  const closedBeforeCheckpoint = before.create();
  await closedBeforeCheckpoint.restoreForResume(before.getActiveSession());
  assert.equal((await closedBeforeCheckpoint.projection(before.getActiveSession())).elapsedForegroundMs, 0);

  const after = fixture();
  await after.timer.initialize(after.session);
  await after.timer.enterForeground(after.session);
  after.setNow(14_000);
  await after.tick();
  const closedAfterCheckpoint = after.create();
  await closedAfterCheckpoint.restoreForResume(after.getActiveSession());
  assert.equal((await closedAfterCheckpoint.projection(after.getActiveSession())).elapsedForegroundMs, 14_000);
});

test("expiry clamps to zero, checkpoints first, and finalizes exactly once", async () => {
  const f = fixture(100);
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(150);
  const projection = await f.timer.projection(f.session);
  await f.timer.projection(f.session);
  assert.equal(projection.remainingForegroundMs, 0);
  assert.equal(f.getState()?.accumulatedForegroundMs, 150);
  assert.equal(f.getDurableAtFinalization()?.accumulatedForegroundMs, 150);
  assert.equal(f.getFinalizations(), 1);
});

test("manual and expiry use the same injected finalization operation", async () => {
  const manual = fixture(100);
  await manual.timer.initialize(manual.session);
  await manual.timer.finalizeManually(manual.session);
  assert.equal(manual.getFinalizations(), 1);

  const expiry = fixture(100);
  await expiry.timer.initialize(expiry.session);
  await expiry.timer.enterForeground(expiry.session);
  expiry.setNow(100);
  await expiry.timer.projection(expiry.session);
  assert.equal(expiry.getFinalizations(), 1);
});

test("manual finalization checkpoints the active foreground segment before it freezes the result", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);

  await f.timer.finalizeManually(f.session);

  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
  assert.equal(f.getDurableAtFinalization()?.accumulatedForegroundMs, 1_250);
  assert.equal(f.getFinalizations(), 1);
});

test("missing persisted timer on resume is a typed application recovery failure", async () => {
  const f = fixture();
  await assert.rejects(() => f.timer.restoreForResume(f.session), (error: unknown) => {
    assert.ok(error instanceof AlgorithmsSimulationTimerRecoveryError);
    assert.equal(error.code, "timer_recovery_failure");
    return true;
  });
});

test("Algorithms session runtime receives deterministic wall-clock and ID ports", () => {
  installAlgorithmsSessionRuntimePorts({
    wallClock: { now: () => startedAt },
    sessionIds: { next: (modeId) => `deterministic:${modeId}:1` },
  });
  const ports = getAlgorithmsSessionRuntimePorts();
  assert.equal(ports.wallClock.now(), startedAt);
  assert.equal(ports.sessionIds.next("algorithms-interview-simulation"), "deterministic:algorithms-interview-simulation:1");
});
