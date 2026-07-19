import {
  createForegroundTimerState,
  type ForegroundTimerState,
  type TrainingSession,
} from "../../domain";
import { ForegroundSimulationTimer, type MonotonicClock, type WallClock } from "../runtime/ForegroundSimulationTimer";
import type { ForegroundTimerRepositoryPort } from "../runtime/ForegroundTimerRepositoryPort";
import { TrainingApplicationFailure, type TrainingLifecycleUseCases } from "../trainingLifecycle";

export class AlgorithmsSimulationTimerRecoveryError extends TrainingApplicationFailure {
  constructor(message: string, readonly cause?: unknown) {
    super("timer_recovery_failure", message, cause);
    this.name = "AlgorithmsSimulationTimerRecoveryError";
  }
}

export type AlgorithmsSimulationTimeProjection = Readonly<{
  elapsedForegroundMs: number;
  remainingForegroundMs: number;
}>;

export type AlgorithmsSimulationTimerEvent = Readonly<{
  kind: "projection_refresh" | "expired";
  sessionId: string;
}>;

export type AlgorithmsSimulationTimerDependencies = Readonly<{
  repository: ForegroundTimerRepositoryPort;
  lifecycle: TrainingLifecycleUseCases;
  monotonicClock: MonotonicClock;
  wallClock: WallClock;
  schedule(callback: () => void): ReturnType<typeof setInterval>;
  cancel(handle: ReturnType<typeof setInterval>): void;
  finalize(session: TrainingSession): Promise<void>;
}>;

/**
 * Application-owned foreground timer coordinator.  Presentation may signal
 * foreground transitions but never derives, stores, or increments duration.
 */
export class AlgorithmsSimulationTimerFacade {
  private readonly timers = new Map<string, ForegroundSimulationTimer>();
  private readonly faults = new Map<string, AlgorithmsSimulationTimerRecoveryError>();
  private readonly listeners = new Set<(event: AlgorithmsSimulationTimerEvent) => void>();
  private readonly finalizations = new Map<string, Promise<void>>();
  private readonly operations = new Map<string, Promise<unknown>>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private foregroundSessionId: string | null = null;

  constructor(private readonly dependencies: AlgorithmsSimulationTimerDependencies) {}

  subscribe(listener: (event: AlgorithmsSimulationTimerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async initialize(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertSimulation(session);
      try { await this.restore(session, true); }
      catch (error) { throw this.fail(session.id, error, "Interview Simulation timer could not be initialized."); }
    });
  }

  async restoreForResume(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertSimulation(session);
      try { await this.restore(session, false); }
      catch (error) { throw this.fail(session.id, error, "Interview Simulation timer recovery is required before this session can continue."); }
    });
  }

  async enterForeground(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try {
        const state = await timer.enterForeground();
        await this.sync(state);
        this.startPeriodicCheckpoint(session.id);
        await this.expireIfNeeded(session, timer);
        return this.publish(session, timer);
      } catch (error) { throw this.fail(session.id, error, "Interview Simulation timer could not enter foreground."); }
    });
  }

  async leaveForeground(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try {
        const state = await timer.leaveForeground();
        await this.sync(state);
        this.stopPeriodicCheckpoint(session.id);
        await this.expireIfNeeded(session, timer);
        return this.publish(session, timer);
      } catch (error) { throw this.fail(session.id, error, "Interview Simulation timer could not leave foreground."); }
    });
  }

  async checkpointForDraftSave(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try { await this.sync(await timer.checkpointForDraftSave()); }
      catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed before draft save."); }
    });
  }

  async checkpointForFinalization(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try { await this.sync(await timer.checkpointForFinalization()); }
      catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed before finalization."); }
    });
  }

  async checkpointForExpiry(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try { await this.sync(await timer.checkpointForExpiry()); }
      catch (error) { throw this.fail(session.id, error, "Interview Simulation timer checkpoint failed at expiry."); }
    });
  }

  async projection(session: TrainingSession): Promise<AlgorithmsSimulationTimeProjection> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      await this.expireIfNeeded(session, timer);
      return this.publish(session, timer);
    });
  }

  /** Manual and automatic expiry share one idempotent finalization operation. */
  async finalizeManually(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try {
        await this.sync(await timer.checkpointForFinalization());
        await this.finalizeOnce(session, "manual");
      } catch (error) { throw this.fail(session.id, error, "Interview Simulation finalization could not be completed."); }
    });
  }

  private async restore(session: TrainingSession, createWhenAbsent: boolean): Promise<ForegroundSimulationTimer> {
    const cached = this.timers.get(session.id);
    if (cached) return cached;
    const existing = await this.dependencies.repository.getActive();
    let state: ForegroundTimerState;
    if (existing) {
      if (existing.sessionId !== session.id || existing.trackId !== session.trackId || existing.familyId !== "algorithms") {
        throw new Error("Persisted foreground timer belongs to a different session.");
      }
      state = existing;
    } else {
      if (!createWhenAbsent) throw new Error("The persisted foreground timer is missing.");
      state = await this.dependencies.repository.save(createForegroundTimerState({
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
      port: { save: this.dependencies.repository.save },
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
    await this.dependencies.lifecycle.checkpointSimulationForegroundTime(state.accumulatedForegroundMs);
  }

  private project(session: TrainingSession, timer: ForegroundSimulationTimer): AlgorithmsSimulationTimeProjection {
    const elapsedForegroundMs = timer.getAccumulatedForegroundMs();
    const duration = session.configurationSnapshot.timerDurationMs;
    if (typeof duration !== "number") throw new Error("Interview Simulation timer duration is unavailable.");
    return Object.freeze({ elapsedForegroundMs, remainingForegroundMs: Math.max(0, duration - elapsedForegroundMs) });
  }

  private publish(session: TrainingSession, timer: ForegroundSimulationTimer): AlgorithmsSimulationTimeProjection {
    const projection = this.project(session, timer);
    this.notify({ kind: "projection_refresh", sessionId: session.id });
    return projection;
  }

  private async expireIfNeeded(session: TrainingSession, timer: ForegroundSimulationTimer): Promise<void> {
    if (this.project(session, timer).remainingForegroundMs > 0) return;
    await this.sync(await timer.checkpointForExpiry());
    await this.finalizeOnce(session, "expiry");
  }

  private async finalizeOnce(session: TrainingSession, cause: "manual" | "expiry"): Promise<void> {
    const existing = this.finalizations.get(session.id);
    if (existing) return existing;
    const operation = this.dependencies.finalize(session).then(() => {
      if (cause === "expiry") this.notify({ kind: "expired", sessionId: session.id });
    }).finally(() => this.stopPeriodicCheckpoint(session.id));
    this.finalizations.set(session.id, operation);
    return operation;
  }

  private notify(event: AlgorithmsSimulationTimerEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private serialize<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.operations.get(sessionId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(operation);
    this.operations.set(sessionId, result);
    return result;
  }

  private startPeriodicCheckpoint(sessionId: string): void {
    this.stopPeriodicCheckpoint();
    this.foregroundSessionId = sessionId;
    this.interval = this.dependencies.schedule(() => {
      const timer = this.timers.get(sessionId);
      if (!timer) return;
      const revision = timer.getState().checkpointRevision;
      void this.serialize(sessionId, async () => {
        const state = await timer.checkpointIfDue();
        if (state.checkpointRevision !== revision) await this.sync(state);
        const session = await this.dependencies.lifecycle.resumeActiveSession();
        if (session.id !== sessionId) throw new Error("The active simulation changed while refreshing its timer.");
        await this.expireIfNeeded(session, timer);
        this.publish(session, timer);
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

let canonicalTimerFacade: AlgorithmsSimulationTimerFacade | null = null;

/** Installed once by the application composition root after lifecycle ports exist. */
export function installAlgorithmsSimulationTimerFacade(value: AlgorithmsSimulationTimerFacade): void {
  canonicalTimerFacade = value;
}

export function getAlgorithmsSimulationTimerFacade(): AlgorithmsSimulationTimerFacade {
  if (!canonicalTimerFacade) throw new Error("Algorithms Simulation timer is unavailable until application bootstrap has completed.");
  return canonicalTimerFacade;
}

function assertSimulation(session: TrainingSession): void {
  if (session.trackId !== "algorithms" || session.configurationSnapshot.timer !== "countdownForeground" || session.configurationSnapshot.submission !== "manualOrForegroundTimeout") {
    throw new Error("The active session is not an Algorithms Interview Simulation.");
  }
}
