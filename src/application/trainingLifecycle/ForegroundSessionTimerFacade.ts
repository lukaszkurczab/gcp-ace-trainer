import {
  createForegroundTimerState,
  type ForegroundTimerState,
  type TrainingSession,
} from "../../domain";
import { ForegroundSessionTimer, type MonotonicClock, type WallClock } from "../runtime/ForegroundSessionTimer";
import type { ForegroundTimerRepositoryPort } from "../runtime/ForegroundTimerRepositoryPort";
import { TrainingApplicationFailure, type TrackRegistryPort } from "./contracts";
import type { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";

export class ForegroundSessionTimerRecoveryError extends TrainingApplicationFailure {
  constructor(message: string, readonly cause?: unknown) {
    super("timer_recovery_failure", message, cause);
    this.name = "ForegroundSessionTimerRecoveryError";
  }
}

export class PracticeCompletionCheckpointError extends ForegroundSessionTimerRecoveryError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PracticeCompletionCheckpointError";
  }
}

export type ForegroundTimeProjection = Readonly<{
  elapsedForegroundMs: number;
  remainingForegroundMs?: number;
}>;

export type ForegroundSessionTimerEvent = Readonly<{
  kind: "projection_refresh" | "expired";
  sessionId: string;
}>;

export type ForegroundSessionTimerDependencies = Readonly<{
  repository: ForegroundTimerRepositoryPort;
  lifecycle: TrainingLifecycleUseCases;
  tracks: TrackRegistryPort;
  monotonicClock: MonotonicClock;
  wallClock: WallClock;
  schedule(callback: () => void): ReturnType<typeof setInterval>;
  cancel(handle: ReturnType<typeof setInterval>): void;
  finalize(session: TrainingSession): Promise<void>;
}>;

/**
 * One application-owned foreground clock serves elapsed practice timers and
 * the Interview Simulation countdown. Presentation only signals foreground
 * transitions and reads projections.
 */
export class ForegroundSessionTimerFacade {
  private readonly timers = new Map<string, ForegroundSessionTimer>();
  private readonly faults = new Map<string, ForegroundSessionTimerRecoveryError>();
  private readonly completionCheckpointFaults = new Set<string>();
  private readonly listeners = new Set<(event: ForegroundSessionTimerEvent) => void>();
  private readonly finalizations = new Map<string, Promise<void>>();
  private readonly practiceCompletions = new Map<string, Promise<unknown>>();
  private readonly operations = new Map<string, Promise<unknown>>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private foregroundSessionId: string | null = null;

  constructor(private readonly dependencies: ForegroundSessionTimerDependencies) {}

  subscribe(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async initialize(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertForegroundTimedSession(session);
      try { await this.restore(session, true); }
      catch (error) { throw this.fail(session.id, error, "Session timer could not be initialized."); }
    });
  }

  async restoreForResume(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertForegroundTimedSession(session);
      try { await this.restore(session, false); }
      catch (error) { throw this.fail(session.id, error, "Session timer recovery is required before this session can continue."); }
    });
  }

  async enterForeground(session: TrainingSession): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try {
        const state = await timer.enterForeground();
        await this.sync(state);
        this.startPeriodicCheckpoint(session.id);
        await this.expireIfNeeded(session, timer);
        return this.publish(session, timer);
      } catch (error) { throw this.fail(session.id, error, "Session timer could not enter foreground."); }
    });
  }

  async leaveForeground(session: TrainingSession): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      return this.leaveForegroundInLane(session);
    });
  }

  /** Retries only an explicitly surfaced failed leave checkpoint for the same active session. */
  async retryLeaveForegroundAfterCheckpointFailure(session: TrainingSession): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      if (!this.faults.has(session.id)) throw new ForegroundSessionTimerRecoveryError("Session timer has no failed leave checkpoint to retry.");
      this.faults.delete(session.id);
      return this.leaveForegroundInLane(session);
    });
  }

  async checkpointForResponseSave(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      try { await this.sync(await timer.checkpointForDraftSave()); }
      catch (error) { throw this.fail(session.id, error, "Session timer checkpoint failed before response save."); }
    });
  }

  async checkpointForPracticeCompletion(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      await this.checkpointForPracticeCompletionInLane(session);
    });
  }

  async completePracticeAfterCheckpoint<T>(session: TrainingSession, complete: () => Promise<T>): Promise<T> {
    const existing = this.practiceCompletions.get(session.id);
    if (existing) return existing as Promise<T>;
    const completion = this.serialize(session.id, async () => {
      await this.checkpointForPracticeCompletionInLane(session);
      const result = await complete();
      this.releaseAfterTerminalSuccess(session.id);
      return result;
    });
    this.practiceCompletions.set(session.id, completion);
    try { return await completion; }
    finally { if (this.practiceCompletions.get(session.id) === completion) this.practiceCompletions.delete(session.id); }
  }

  async retryPracticeCompletionCheckpointAfterFailure(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      if (!this.completionCheckpointFaults.has(session.id)) throw new PracticeCompletionCheckpointError("Session timer has no failed practice-completion checkpoint to retry.");
      this.completionCheckpointFaults.delete(session.id);
      this.faults.delete(session.id);
      await this.checkpointForPracticeCompletionInLane(session);
    });
  }

  releaseAfterVerifiedPracticeCompletion(sessionId: string): void {
    this.releaseAfterTerminalSuccess(sessionId);
  }

  async projection(session: TrainingSession): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      const timer = await this.requireTimer(session);
      await this.expireIfNeeded(session, timer);
      return this.project(session, timer);
    });
  }

  /** Manual and automatic expiry share one idempotent simulation finalization. */
  async finalizeCountdownManually(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertCountdownSession(session);
      const timer = await this.requireTimer(session);
      try {
        await this.sync(await timer.checkpointForFinalization());
        await this.finalizeOnce(session, "manual");
      } catch (error) { throw this.fail(session.id, error, "Interview Simulation finalization could not be completed."); }
    });
  }

  private async restore(session: TrainingSession, createWhenAbsent: boolean): Promise<ForegroundSessionTimer> {
    const familyId = this.dependencies.tracks.getTrackRegistration(session.trackId).familyId;
    const cached = this.timers.get(session.id);
    if (cached) {
      const state = cached.getState();
      if (state.sessionId !== session.id || state.trackId !== session.trackId || state.familyId !== familyId) {
        throw new Error("Cached foreground timer belongs to a different session.");
      }
      return cached;
    }
    const existing = await this.dependencies.repository.getActive();
    let state: ForegroundTimerState;
    if (existing) {
      if (existing.sessionId !== session.id || existing.trackId !== session.trackId || existing.familyId !== familyId) {
        throw new Error("Persisted foreground timer belongs to a different session.");
      }
      state = existing;
    } else {
      if (!createWhenAbsent) throw new Error("The persisted foreground timer is missing.");
      state = await this.dependencies.repository.save(createForegroundTimerState({
        schemaVersion: 1,
        timerVersion: 1,
        familyId,
        sessionId: session.id,
        trackId: session.trackId,
        accumulatedForegroundMs: session.activeForegroundMs,
        checkpointRevision: 1,
        lastCheckpointAt: this.dependencies.wallClock.now(),
        running: false,
      }), null);
    }
    if (state.accumulatedForegroundMs < session.activeForegroundMs) {
      throw new Error("Persisted foreground timer and session aggregate disagree.");
    }
    if (state.accumulatedForegroundMs > session.activeForegroundMs) await this.sync(state);
    const timer = ForegroundSessionTimer.restore({
      state,
      port: { save: this.dependencies.repository.save },
      monotonicClock: this.dependencies.monotonicClock,
      wallClock: this.dependencies.wallClock,
    });
    this.timers.set(session.id, timer);
    return timer;
  }

  private async requireTimer(session: TrainingSession): Promise<ForegroundSessionTimer> {
    const fault = this.faults.get(session.id);
    if (fault) throw fault;
    assertForegroundTimedSession(session);
    return this.restore(session, false);
  }

  private async leaveForegroundInLane(session: TrainingSession): Promise<ForegroundTimeProjection> {
    const timer = await this.requireTimer(session);
    try {
      const state = await timer.leaveForeground();
      await this.sync(state);
      this.stopPeriodicCheckpoint(session.id);
      await this.expireIfNeeded(session, timer);
      return this.publish(session, timer);
    } catch (error) { throw this.fail(session.id, error, "Session timer could not leave foreground."); }
  }

  private async checkpointForPracticeCompletionInLane(session: TrainingSession): Promise<void> {
    const timer = await this.requireTimer(session);
    try {
      await this.sync(await timer.checkpointForPracticeCompletion());
      this.stopPeriodicCheckpoint(session.id);
    }
    catch (error) {
      this.completionCheckpointFaults.add(session.id);
      const failure = new PracticeCompletionCheckpointError("Session timer checkpoint failed before practice completion.", error);
      this.faults.set(session.id, failure);
      this.stopPeriodicCheckpoint(session.id);
      throw failure;
    }
  }

  private async sync(state: ForegroundTimerState): Promise<void> {
    await this.dependencies.lifecycle.checkpointForegroundTime(state.accumulatedForegroundMs);
  }

  private project(session: TrainingSession, timer: ForegroundSessionTimer): ForegroundTimeProjection {
    const elapsedForegroundMs = timer.getAccumulatedForegroundMs();
    if (session.configurationSnapshot.timer === "elapsedForeground") {
      return Object.freeze({ elapsedForegroundMs });
    }
    const duration = session.configurationSnapshot.timerDurationMs;
    if (typeof duration !== "number") throw new Error("Interview Simulation timer duration is unavailable.");
    return Object.freeze({ elapsedForegroundMs, remainingForegroundMs: Math.max(0, duration - elapsedForegroundMs) });
  }

  private publish(session: TrainingSession, timer: ForegroundSessionTimer): ForegroundTimeProjection {
    const projection = this.project(session, timer);
    this.notify({ kind: "projection_refresh", sessionId: session.id });
    return projection;
  }

  private async expireIfNeeded(session: TrainingSession, timer: ForegroundSessionTimer): Promise<void> {
    if (session.configurationSnapshot.timer !== "countdownForeground") return;
    const remaining = this.project(session, timer).remainingForegroundMs;
    if (remaining === undefined || remaining > 0) return;
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

  private notify(event: ForegroundSessionTimerEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private releaseAfterTerminalSuccess(sessionId: string): void {
    this.stopPeriodicCheckpoint(sessionId);
    this.timers.delete(sessionId);
    this.faults.delete(sessionId);
    this.completionCheckpointFaults.delete(sessionId);
    this.finalizations.delete(sessionId);
    this.operations.delete(sessionId);
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
      if (this.foregroundSessionId !== sessionId) return;
      const timer = this.timers.get(sessionId);
      if (!timer) return;
      const revision = timer.getState().checkpointRevision;
      void this.serialize(sessionId, async () => {
        if (this.timers.get(sessionId) !== timer) return;
        const state = await timer.checkpointIfDue();
        if (state.checkpointRevision !== revision) await this.sync(state);
        const session = await this.dependencies.lifecycle.resumeActiveSession();
        if (session.id !== sessionId) throw new Error("The active session changed while refreshing its timer.");
        await this.expireIfNeeded(session, timer);
        this.publish(session, timer);
      }).catch((error: unknown) => { this.fail(sessionId, error, "Periodic foreground timer checkpoint failed."); });
    });
  }

  private stopPeriodicCheckpoint(sessionId?: string): void {
    if (sessionId && this.foregroundSessionId !== sessionId) return;
    if (this.interval !== null) this.dependencies.cancel(this.interval);
    this.interval = null;
    this.foregroundSessionId = null;
  }

  private fail(sessionId: string, error: unknown, message: string): ForegroundSessionTimerRecoveryError {
    const failure = error instanceof ForegroundSessionTimerRecoveryError ? error : new ForegroundSessionTimerRecoveryError(message, error);
    this.faults.set(sessionId, failure);
    this.stopPeriodicCheckpoint(sessionId);
    return failure;
  }
}

let canonicalTimerFacade: ForegroundSessionTimerFacade | null = null;

export function installForegroundSessionTimerFacade(value: ForegroundSessionTimerFacade): void {
  canonicalTimerFacade = value;
}

export function getForegroundSessionTimerFacade(): ForegroundSessionTimerFacade {
  if (!canonicalTimerFacade) throw new Error("Foreground session timer is unavailable until application bootstrap has completed.");
  return canonicalTimerFacade;
}

function assertForegroundTimedSession(session: TrainingSession): void {
  if (session.configurationSnapshot.timer !== "countdownForeground" && session.configurationSnapshot.timer !== "elapsedForeground") {
    throw new Error("The active session is not foreground-timed.");
  }
}

function assertCountdownSession(session: TrainingSession): void {
  if (session.configurationSnapshot.timer !== "countdownForeground" || session.configurationSnapshot.submission !== "manualOrForegroundTimeout") {
    throw new Error("The active session is not a foreground-countdown simulation.");
  }
}
