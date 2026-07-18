import {
  createForegroundTimerState,
  type ForegroundTimerState,
  type TrainingSession,
} from "../../domain";
import { ForegroundSimulationTimer, type MonotonicClock, type WallClock } from "../runtime/ForegroundSimulationTimer";
import { getActiveForegroundTimer, saveActiveForegroundTimer } from "../../storage/repositories";
import { getTrainingLifecycleUseCases, type TrainingLifecycleUseCases } from "../trainingLifecycle";

export class AlgorithmsSimulationTimerRecoveryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AlgorithmsSimulationTimerRecoveryError";
  }
}

export type AlgorithmsSimulationTimeProjection = Readonly<{
  elapsedForegroundMs: number;
  remainingForegroundMs: number;
}>;

export type AlgorithmsSimulationTimerDependencies = Readonly<{
  getTimer(): Promise<ForegroundTimerState | null>;
  saveTimer(timer: ForegroundTimerState, expectedPreviousCheckpointRevision: number | null): Promise<ForegroundTimerState>;
  lifecycle(): TrainingLifecycleUseCases;
  monotonicClock: MonotonicClock;
  wallClock: WallClock;
  schedule(callback: () => void): ReturnType<typeof setInterval>;
  cancel(handle: ReturnType<typeof setInterval>): void;
}>;

/**
 * Application-owned foreground timer coordinator.  Presentation may signal
 * foreground transitions but never derives, stores, or increments duration.
 */
export class AlgorithmsSimulationTimerFacade {
  private readonly timers = new Map<string, ForegroundSimulationTimer>();
  private readonly faults = new Map<string, AlgorithmsSimulationTimerRecoveryError>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private foregroundSessionId: string | null = null;

  constructor(private readonly dependencies: AlgorithmsSimulationTimerDependencies = canonicalDependencies()) {}

  async initialize(session: TrainingSession): Promise<void> {
    assertSimulation(session);
    try {
      await this.restore(session, true);
    } catch (error) {
      throw this.fail(session.id, error, "Interview Simulation timer could not be initialized.");
    }
  }

  async restoreForResume(session: TrainingSession): Promise<void> {
    assertSimulation(session);
    try {
      await this.restore(session, false);
    } catch (error) {
      throw this.fail(session.id, error, "Interview Simulation timer recovery is required before this session can continue.");
    }
  }

  async enterForeground(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    const timer = await this.requireTimer(session);
    try {
      const state = await timer.enterForeground();
      await this.sync(state);
      this.startPeriodicCheckpoint(session.id);
      return this.project(session, timer);
    } catch (error) {
      throw this.fail(session.id, error, "Interview Simulation timer could not enter foreground.");
    }
  }

  async leaveForeground(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    const timer = await this.requireTimer(session);
    try {
      const state = await timer.leaveForeground();
      await this.sync(state);
      this.stopPeriodicCheckpoint(session.id);
      return this.project(session, timer);
    } catch (error) {
      throw this.fail(session.id, error, "Interview Simulation timer could not leave foreground.");
    }
  }

  async checkpointForDraftSave(session: TrainingSession): Promise<void> {
    const timer = await this.requireTimer(session);
    try { await this.sync(await timer.checkpointForDraftSave()); }
    catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed before draft save."); }
  }

  async checkpointForFinalization(session: TrainingSession): Promise<void> {
    const timer = await this.requireTimer(session);
    try { await this.sync(await timer.checkpointForFinalization()); }
    catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed before finalization."); }
  }

  async checkpointForExpiry(session: TrainingSession): Promise<void> {
    const timer = await this.requireTimer(session);
    try { await this.sync(await timer.checkpointForExpiry()); }
    catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed at expiry."); }
  }

  async projection(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    const timer = await this.requireTimer(session);
    return this.project(session, timer);
  }

  private async restore(session: TrainingSession, createWhenAbsent: boolean): Promise<ForegroundSimulationTimer> {
    const cached = this.timers.get(session.id);
    if (cached) return cached;
    const existing = await this.dependencies.getTimer();
    let state: ForegroundTimerState;
    if (existing) {
      if (existing.sessionId !== session.id || existing.trackId !== session.trackId || existing.familyId !== "algorithms") {
        throw new Error("Persisted foreground timer belongs to a different session.");
      }
      state = existing;
    } else {
      if (!createWhenAbsent) throw new Error("The persisted foreground timer is missing.");
      state = await this.dependencies.saveTimer(createForegroundTimerState({
        schemaVersion: 1,
        timerVersion: 1,
        familyId: "algorithms",
        sessionId: session.id,
        trackId: session.trackId,
        accumulatedForegroundMs: session.activeForegroundMs,
        checkpointRevision: 1,
        lastCheckpointAt: this.dependencies.wallClock.now(),
        running: false,
      }), null);
    }
    if (state.accumulatedForegroundMs !== session.activeForegroundMs) {
      throw new Error("Persisted foreground timer and session aggregate disagree.");
    }
    const timer = ForegroundSimulationTimer.restore({
      state,
      port: { save: this.dependencies.saveTimer },
      monotonicClock: this.dependencies.monotonicClock,
      wallClock: this.dependencies.wallClock,
    });
    this.timers.set(session.id, timer);
    return timer;
  }

  private async requireTimer(session: TrainingSession): Promise<ForegroundSimulationTimer> {
    const fault = this.faults.get(session.id);
    if (fault) throw fault;
    assertSimulation(session);
    return this.restore(session, false);
  }

  private async sync(state: ForegroundTimerState): Promise<void> {
    await this.dependencies.lifecycle().checkpointSimulationForegroundTime(state.accumulatedForegroundMs);
  }

  private project(session: TrainingSession, timer: ForegroundSimulationTimer): AlgorithmsSimulationTimeProjection {
    const elapsedForegroundMs = timer.getAccumulatedForegroundMs();
    const duration = session.configurationSnapshot.timerDurationMs;
    if (typeof duration !== "number") throw new Error("Interview Simulation timer duration is unavailable.");
    return Object.freeze({ elapsedForegroundMs, remainingForegroundMs: Math.max(0, duration - elapsedForegroundMs) });
  }

  private startPeriodicCheckpoint(sessionId: string): void {
    this.stopPeriodicCheckpoint();
    this.foregroundSessionId = sessionId;
    this.interval = this.dependencies.schedule(() => {
      const timer = this.timers.get(sessionId);
      if (!timer) return;
      const revision = timer.getState().checkpointRevision;
      void timer.checkpointIfDue().then(async (state) => {
        if (state.checkpointRevision !== revision) await this.sync(state);
      }).catch((error: unknown) => { this.fail(sessionId, error, "Interview Simulation periodic timer checkpoint failed."); });
    });
  }

  private stopPeriodicCheckpoint(sessionId?: string): void {
    if (sessionId && this.foregroundSessionId !== sessionId) return;
    if (this.interval !== null) this.dependencies.cancel(this.interval);
    this.interval = null;
    this.foregroundSessionId = null;
  }

  private fail(sessionId: string, error: unknown, message: string): AlgorithmsSimulationTimerRecoveryError {
    const failure = error instanceof AlgorithmsSimulationTimerRecoveryError ? error : new AlgorithmsSimulationTimerRecoveryError(message, error);
    this.faults.set(sessionId, failure);
    this.stopPeriodicCheckpoint(sessionId);
    return failure;
  }
}

const canonicalTimerFacade = new AlgorithmsSimulationTimerFacade();

export function getAlgorithmsSimulationTimerFacade(): AlgorithmsSimulationTimerFacade {
  return canonicalTimerFacade;
}

function canonicalDependencies(): AlgorithmsSimulationTimerDependencies {
  return {
    getTimer: getActiveForegroundTimer,
    saveTimer: saveActiveForegroundTimer,
    lifecycle: getTrainingLifecycleUseCases,
    monotonicClock: { now: () => globalThis.performance?.now?.() ?? Date.now() },
    wallClock: { now: () => new Date().toISOString() },
    schedule: (callback) => setInterval(callback, 1_000),
    cancel: (handle) => clearInterval(handle),
  };
}

function assertSimulation(session: TrainingSession): void {
  if (session.trackId !== "algorithms" || session.configurationSnapshot.timer !== "countdownForeground" || session.configurationSnapshot.submission !== "manualOrForegroundTimeout") {
    throw new Error("The active session is not an Algorithms Interview Simulation.");
  }
}
