import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ForegroundSessionTimerFacade,
  ForegroundSessionTimerRecoveryError,
  type ForegroundSessionTimerDependencies,
} from "../trainingLifecycle";
import { createForegroundTimerState, createTrainingSession, getTrackRegistration, type ForegroundTimerState, type TrainingSession } from "../../domain";
import type { TrainingLifecycleUseCases } from "../trainingLifecycle";
import { simulationTimer } from "../../features/simulation/simulationProjection";

const startedAt = "2026-07-19T10:00:00.000Z";

function simulationSession(duration = 2_700_000) {
  return createTrainingSession({
    id: "simulation-1", trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-simulation",
    configurationSnapshot: { kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: duration },
    requestedLength: 40, actualLength: 40, currentItemIndex: 0,
    itemOrder: Array.from({ length: 40 }, (_, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: "coding-interview-dsa-problem-solving", contentVersion: "algorithms-core-0002", packagePin: TEST_CONTENT_PACKAGE_PIN, itemId: `item-${index}` } })),
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion: "algorithms-core-0002", packagePin: TEST_CONTENT_PACKAGE_PIN, taxonomyVersion: "algorithms-taxonomy-v2", planFingerprint: "a".repeat(64), status: "active", startedAt,
  });
}

function practiceSession() {
  return createTrainingSession({
    ...simulationSession(),
    id: "practice-1",
    modeId: "coding-interview-guided-practice",
    configurationSnapshot: { kind: "algorithmsPractice", feedbackMode: "afterEachAnswer", answerChanges: "untilSubmission", navigation: "linear", submission: "perItem", timer: "elapsedForeground" },
  });
}

function certificationPracticeSession() {
  const contentVersion = "google-cloud-associate-cloud-engineer-core-0002";
  return createTrainingSession({
    id: "certification-practice-1", trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice",
    configurationSnapshot: { kind: "certificationFocusPractice", feedbackMode: "afterEachAnswer", answerChanges: "none", navigation: "linear", submission: "perItem", timer: "elapsedForeground" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "certification-occurrence-1", item: { trackId: "google-cloud-associate-cloud-engineer", contentVersion, itemId: "certification-item-1", packagePin: TEST_CONTENT_PACKAGE_PIN } }],
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion, packagePin: TEST_CONTENT_PACKAGE_PIN, taxonomyVersion: "google-cloud-associate-cloud-engineer-taxonomy-v2", planFingerprint: "b".repeat(64), status: "active", startedAt,
  });
}

function certificationExamSession() {
  const contentVersion = "google-cloud-associate-cloud-engineer-core-0002";
  return createTrainingSession({
    id: "certification-exam-1", trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-exam-simulation",
    configurationSnapshot: { kind: "certificationSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "absoluteDeadline", timerDurationMs: 7_200_000, timerDeadlineAt: "2026-07-19T12:00:00.000Z" },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "certification-exam-occurrence-1", item: { trackId: "google-cloud-associate-cloud-engineer", contentVersion, itemId: "certification-exam-item-1", packagePin: TEST_CONTENT_PACKAGE_PIN } }],
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion, packagePin: TEST_CONTENT_PACKAGE_PIN, taxonomyVersion: "google-cloud-associate-cloud-engineer-taxonomy-v2", planFingerprint: "c".repeat(64), status: "active", startedAt,
  });
}

function fixture(duration?: number, kind: "countdown" | "elapsed" = "countdown", session?: TrainingSession) {
  let now = 0;
  let state: ForegroundTimerState | null = null;
  let active = session ?? (kind === "countdown" ? simulationSession(duration) : practiceSession());
  let scheduled: (() => void) | null = null;
  let cancelCount = 0;
  let saveCount = 0;
  let resumeCount = 0;
  let finalizations = 0;
  let checkpointError: Error | null = null;
  let durableAtFinalization: ForegroundTimerState | null = null;
  const checkpoints: number[] = [];
  const lifecycle = {
    checkpointForegroundTime: async (elapsed: number) => {
      if (checkpointError) throw checkpointError;
      checkpoints.push(elapsed);
      active = createTrainingSession({ ...active, activeForegroundMs: elapsed });
      return active;
    },
    resumeActiveSession: async () => { resumeCount += 1; return active; },
    finalizeSimulation: async () => { finalizations += 1; durableAtFinalization = state; },
  } as unknown as TrainingLifecycleUseCases;
  const dependencies: ForegroundSessionTimerDependencies = {
    repository: {
      async getActive() { return state; },
      async save(candidate, expected) {
        saveCount += 1;
        assert.equal(expected, state?.checkpointRevision ?? null);
        state = createForegroundTimerState({ ...candidate, checkpointRevision: (state?.checkpointRevision ?? 0) + 1 });
        return state;
      },
    },
    lifecycle,
    tracks: { getTrackRegistration },
    monotonicClock: { now: () => now }, wallClock: { now: () => startedAt },
    schedule(callback) { scheduled = callback; return 0 as unknown as ReturnType<typeof setInterval>; },
    cancel: () => { cancelCount += 1; },
    finalize: async () => lifecycle.finalizeSimulation(),
  };
  const create = () => new ForegroundSessionTimerFacade(dependencies);
  return {
    session: active, timer: create(), create, checkpoints,
    getActiveSession: () => active,
    setNow(value: number) { now = value; },
    getState: () => state,
    setState(value: ForegroundTimerState | null) { state = value; },
    setActiveSession(value: TrainingSession) { active = value; },
    failCheckpoint(error: Error) { checkpointError = error; },
    getSaveCount: () => saveCount,
    getCancelCount: () => cancelCount,
    getResumeCount: () => resumeCount,
    getFinalizations: () => finalizations,
    getDurableAtFinalization: () => durableAtFinalization,
    fireScheduled() { scheduled?.(); },
    async settle() { for (let index = 0; index < 12; index += 1) await Promise.resolve(); },
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

test("ordinary practice publishes a live elapsed timer without a countdown", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(2_400);
  const projection = await f.timer.projection(f.getActiveSession());
  assert.deepEqual(projection, { elapsedForegroundMs: 2_400 });
  await f.timer.leaveForeground(f.getActiveSession());
  assert.equal(f.getActiveSession().activeForegroundMs, 2_400);
});

test("one family-neutral timer initializes and restores ordinary Certification foreground time", async () => {
  const f = fixture(undefined, "elapsed", certificationPracticeSession());
  await f.timer.initialize(f.session);
  assert.equal(f.getState()?.familyId, "certification");
  assert.equal(f.getState()?.trackId, "google-cloud-associate-cloud-engineer");
  await f.timer.enterForeground(f.session);
  f.setNow(500);
  await f.timer.leaveForeground(f.getActiveSession());
  f.setNow(900_000);

  const restarted = f.create();
  await restarted.restoreForResume(f.getActiveSession());
  assert.deepEqual(await restarted.projection(f.getActiveSession()), { elapsedForegroundMs: 500 });
});

test("absolute-deadline Certification Exam remains outside the foreground timer owner", async () => {
  const f = fixture(undefined, "elapsed", certificationExamSession());
  await assert.rejects(() => f.timer.initialize(f.session), /not foreground-timed/);
  assert.equal(f.getState(), null);
});

test("a durable foreground timer from another family is rejected instead of reused", async () => {
  const f = fixture();
  await f.timer.initialize(f.session);
  await assert.rejects(() => f.timer.initialize(certificationPracticeSession()), (error: unknown) => {
    assert.ok(error instanceof ForegroundSessionTimerRecoveryError);
    assert.match(error.message, /could not be initialized/);
    return true;
  });
  assert.equal(f.getState()?.familyId, "coding_interview");
  assert.equal(f.getState()?.sessionId, f.session.id);
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
  const firstProjection = await f.timer.projection(f.getActiveSession());
  assert.notEqual(firstProjection.remainingForegroundMs, undefined);
  const first = simulationTimer(firstProjection.remainingForegroundMs!);
  f.setNow(2_000);
  await f.tick();
  const secondProjection = await f.timer.projection(f.getActiveSession());
  assert.notEqual(secondProjection.remainingForegroundMs, undefined);
  const second = simulationTimer(secondProjection.remainingForegroundMs!);

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

test("force-close immediately before and after the checkpoint boundary resumes within the declared drift", async () => {
  const before = fixture();
  await before.timer.initialize(before.session);
  await before.timer.enterForeground(before.session);
  before.setNow(13_999);
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
  await manual.timer.finalizeCountdownManually(manual.session);
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

  await f.timer.finalizeCountdownManually(f.session);

  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
  assert.equal(f.getDurableAtFinalization()?.accumulatedForegroundMs, 1_250);
  assert.equal(f.getFinalizations(), 1);
});

test("practice completion checkpoint freezes the captured tick until verified release", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);
  await f.timer.checkpointForPracticeCompletion(f.getActiveSession());
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
  const checkpointsAtTerminalBoundary = [...f.checkpoints];
  const durableAtTerminalBoundary = f.getState();

  f.setNow(15_250);
  f.fireScheduled();
  await f.settle();

  assert.deepEqual(f.checkpoints, checkpointsAtTerminalBoundary);
  assert.equal(f.getState(), durableAtTerminalBoundary);
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
  f.timer.releaseAfterVerifiedPracticeCompletion(f.session.id);
  assert.equal(f.getCancelCount(), 1);
  assert.equal(f.getResumeCount(), 0);
});

test("a completed timer checkpoint is not released before completion is verified", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);
  await f.timer.checkpointForPracticeCompletion(f.getActiveSession());
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);

  f.setNow(15_250);
  f.fireScheduled();
  await f.settle();

  assert.equal(f.getCancelCount(), 1);
  assert.equal(f.getResumeCount(), 0);
  assert.equal(f.getState()?.accumulatedForegroundMs, 1_250);
  assert.deepEqual(await f.timer.projection(f.getActiveSession()), { elapsedForegroundMs: 1_250 });
});

test("concurrent Finish handoffs share one timer checkpoint and one completion result", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  await f.timer.enterForeground(f.session);
  f.setNow(1_250);
  let completions = 0;
  const verified = Object.freeze({ kind: "verified", sessionId: f.session.id });

  const [first, second] = await Promise.all([
    f.timer.completePracticeAfterCheckpoint(f.getActiveSession(), async () => { completions += 1; return verified; }),
    f.timer.completePracticeAfterCheckpoint(f.getActiveSession(), async () => { completions += 1; return verified; }),
  ]);

  assert.equal(completions, 1);
  assert.deepEqual(f.checkpoints, [0, 1_250]);
  assert.equal(first, verified);
  assert.equal(second, verified);
  assert.equal(f.getCancelCount(), 1);
});

test("missing persisted timer on resume is a typed application recovery failure", async () => {
  const f = fixture();
  await assert.rejects(() => f.timer.restoreForResume(f.session), (error: unknown) => {
    assert.ok(error instanceof ForegroundSessionTimerRecoveryError);
    assert.equal(error.code, "timer_recovery_failure");
    return true;
  });
});

test("resume repairs a durable timer checkpoint that precedes the session aggregate", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  const persisted = f.getState()!;
  f.setState(createForegroundTimerState({ ...persisted, accumulatedForegroundMs: 500 }));

  const restarted = f.create();
  await restarted.restoreForResume(f.getActiveSession());

  assert.equal(f.getActiveSession().activeForegroundMs, 500);
  assert.deepEqual(f.checkpoints, [500]);
  assert.equal((await restarted.projection(f.getActiveSession())).elapsedForegroundMs, 500);
});

test("repeated resume of a repaired timer does not write another session checkpoint", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  const persisted = f.getState()!;
  f.setState(createForegroundTimerState({ ...persisted, accumulatedForegroundMs: 500 }));

  const restarted = f.create();
  await restarted.restoreForResume(f.getActiveSession());
  const savesAfterRepair = f.getSaveCount();
  const resumedAgain = f.create();
  await resumedAgain.restoreForResume(f.getActiveSession());

  assert.deepEqual(f.checkpoints, [500]);
  assert.equal(f.getSaveCount(), savesAfterRepair);
});

test("resume rejects a durable timer checkpoint that is behind the session aggregate", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  f.setActiveSession(createTrainingSession({ ...f.getActiveSession(), activeForegroundMs: 500 }));
  const persisted = f.getState()!;
  f.setState(createForegroundTimerState({ ...persisted, accumulatedForegroundMs: 400 }));

  await assert.rejects(() => f.create().restoreForResume(f.getActiveSession()), (error: unknown) => {
    assert.ok(error instanceof ForegroundSessionTimerRecoveryError);
    assert.match(error.message, /recovery is required/);
    return true;
  });
  assert.deepEqual(f.checkpoints, []);
});

test("a failed durable timer repair remains a blocking recovery error", async () => {
  const f = fixture(undefined, "elapsed");
  await f.timer.initialize(f.session);
  const persisted = f.getState()!;
  f.setState(createForegroundTimerState({ ...persisted, accumulatedForegroundMs: 500 }));
  f.failCheckpoint(new Error("checkpoint unavailable"));

  await assert.rejects(() => f.create().restoreForResume(f.getActiveSession()), (error: unknown) => {
    assert.ok(error instanceof ForegroundSessionTimerRecoveryError);
    assert.match(error.message, /recovery is required/);
    return true;
  });
  assert.equal(f.getActiveSession().activeForegroundMs, 0);
  assert.deepEqual(f.checkpoints, []);
});
