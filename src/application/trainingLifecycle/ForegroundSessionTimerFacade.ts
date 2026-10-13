import {
  type ForegroundTimerState,
  type TrainingSession,
} from "../../domain";
import type { ForegroundSessionClock, ForegroundTimerLeaveReason } from "../runtime/ForegroundSessionTimer";
import type { ForegroundTimerRepositoryPort } from "../runtime/ForegroundTimerRepositoryPort";
import { TrainingApplicationFailure, type TrackRegistryPort } from "./contracts";
import type { SimulationCommandAuthorization, TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";

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
  createTimer(state: ForegroundTimerState, session: TrainingSession): ForegroundSessionClock;
  observeRestoreBeforeSync?(state: ForegroundTimerState, session: TrainingSession): void;
  schedule(callback: () => void): ReturnType<typeof setInterval>;
  cancel(handle: ReturnType<typeof setInterval>): void;
  finalize(session: TrainingSession, authorization?: SimulationCommandAuthorization, cause?: "manual" | "expiry"): Promise<void>;
  getActiveSession?(): Promise<TrainingSession | null>;
  advanceMonotonicClockBy?(milliseconds: number): void;
}>;

/**
 * One application-owned foreground clock serves elapsed practice timers and
 * the Interview Simulation countdown. Presentation only signals foreground
 * transitions and reads projections.
 */
export class ForegroundSessionTimerFacade {
  private readonly synchronizedTimerRevisions = new Map<string, number>();
  private readonly timers = new Map<string, ForegroundSessionClock>();
  private readonly faults = new Map<string, ForegroundSessionTimerRecoveryError>();
  private readonly completionCheckpointFaults = new Set<string>();
  private readonly listeners = new Set<(event: ForegroundSessionTimerEvent) => void>();
  private readonly finalizations = new Map<string, Readonly<{ identity: string; operation: Promise<ForegroundTimeProjection> }>>();
  private readonly practiceCompletions = new Map<string, Promise<unknown>>();
  private readonly operations = new Map<string, Promise<unknown>>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private foregroundSessionId: string | null = null;
  private generation = 0;
  private localResetBarrier: Promise<void> | null = null;
  private quiescing = false;

  constructor(private readonly dependencies: ForegroundSessionTimerDependencies) {}

  subscribe(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Quiesces every session-owned timer operation before the journaled local
   * reset starts.  The barrier stays closed for the whole durable reset, so a
   * late AppState event or periodic callback cannot recreate cleared state.
   */
  runLocalLearningReset(reset: () => Promise<void>): Promise<void> {
    if (this.localResetBarrier) return this.localResetBarrier;
    this.quiescing = true;
    this.generation += 1;
    this.stopPeriodicCheckpoint();
    const barrier = this.performLocalLearningReset(reset).finally(() => {
      this.stopPeriodicCheckpoint();
      this.clearSessionRuntimeState();
      this.quiescing = false;
      if (this.localResetBarrier === barrier) this.localResetBarrier = null;
    });
    this.localResetBarrier = barrier;
    return barrier;
  }

  private async performLocalLearningReset(reset: () => Promise<void>): Promise<void> {
    // Every root async task is included. Duplicates are harmless and avoid a
    // hidden finalization/completion lane escaping the reset barrier.
    const inFlight = [
      ...this.operations.values(),
      ...Array.from(this.finalizations.values(), record => record.operation),
      ...this.practiceCompletions.values(),
    ];
    await Promise.allSettled(inFlight);
    this.stopPeriodicCheckpoint();
    this.clearSessionRuntimeState();
    await reset();
  }

  private clearSessionRuntimeState(): void {
    this.timers.clear();
    this.synchronizedTimerRevisions.clear();
    this.faults.clear();
    this.completionCheckpointFaults.clear();
    this.finalizations.clear();
    this.practiceCompletions.clear();
    this.operations.clear();
  }

  async initialize(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertForegroundTimedSession(session);
      const terminal = this.terminalProjection(session);
      if (terminal) { await terminal; return; }
      try { await this.restore(session); }
      catch (error) { throw this.fail(session.id, error, "Session timer could not be initialized."); }
    });
  }

  async restoreForResume(session: TrainingSession): Promise<void> {
    return this.serialize(session.id, async () => {
      assertForegroundTimedSession(session);
      const terminal = this.terminalProjection(session);
      if (terminal) { await terminal; return; }
      try { await this.restore(session); }
      catch (error) { throw this.fail(session.id, error, "Session timer recovery is required before this session can continue."); }
    });
  }

  async enterForeground(session: TrainingSession): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      const terminal = this.terminalProjection(session);
      if (terminal) return terminal;
      const timer = await this.requireTimer(session);
      try {
        const state = await timer.enterForeground();
        await this.sync(state);
        this.startPeriodicCheckpoint(session);
        await this.expireIfNeeded(session, timer);
        return await this.publish(session, timer);
      } catch (error) { throw this.fail(session.id, error, "Session timer could not enter foreground."); }
    });
  }

  async leaveForeground(session: TrainingSession, reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      return this.leaveForegroundInLane(session, reason);
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

  async checkpointForResponseSave(session: TrainingSession, authorization?: SimulationCommandAuthorization): Promise<boolean> {
    return this.serialize(session.id, async () => {
      return this.responseSaveBoundary(session, authorization);
    });
  }

  async saveDraftAtResponseBoundary(session: TrainingSession, authorization: SimulationCommandAuthorization, commit: () => Promise<void>): Promise<boolean> {
    return this.serialize(session.id, async () => {
      const terminal = this.terminalProjection(session);
      if (terminal) { await terminal; return true; }
      if (session.configurationSnapshot.timer === "absoluteDeadline") {
        return this.saveDraftAtAbsoluteDeadlineBoundary(session, commit);
      }
      if (await this.responseSaveBoundary(session, authorization)) return true;
      await commit();
      return false;
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

  async projection(session: TrainingSession, authorization?: SimulationCommandAuthorization): Promise<ForegroundTimeProjection> {
    return this.serialize(session.id, async () => {
      const terminal = this.terminalProjection(session);
      if (terminal) return terminal;
      const timer = await this.requireTimer(session);
      await this.expireIfNeeded(session, timer, authorization);
      return this.terminalProjection(session) ?? this.project(session, timer);
    });
  }

  async advanceActiveCodingMockCountdownForAudit(): Promise<void> {
    const sessionId = this.foregroundSessionId;
    if (!sessionId) {
      throw new ForegroundSessionTimerRecoveryError("Coding Mock countdown audit control is unavailable.");
    }
    await this.serialize(sessionId, async () => {
      if (this.foregroundSessionId !== sessionId || !this.dependencies.getActiveSession || !this.dependencies.advanceMonotonicClockBy) {
        throw new ForegroundSessionTimerRecoveryError("Coding Mock countdown audit control is unavailable.");
      }
      const session = await this.dependencies.getActiveSession();
      if (!session || session.id !== sessionId || session.modeId !== "coding-interview-simulation" || session.configurationSnapshot.timer !== "countdownForeground") {
        throw new ForegroundSessionTimerRecoveryError("Coding Mock countdown audit requires the active foreground Coding Mock.");
      }
      const duration = session.configurationSnapshot.timerDurationMs;
      if (typeof duration !== "number" || !Number.isSafeInteger(duration) || duration <= 0) {
        throw new ForegroundSessionTimerRecoveryError("Coding Mock countdown duration is unavailable.");
      }
      this.dependencies.advanceMonotonicClockBy(duration);
      try { await this.expireIfNeeded(session, await this.requireTimer(session)); }
      catch (error) { throw this.fail(session.id, error, "Coding Mock countdown audit could not checkpoint and finalize the session."); }
    });
  }

  /** Manual and automatic expiry share one idempotent simulation finalization. */
  async finalizeCountdownManually(session: TrainingSession, authorization?: SimulationCommandAuthorization): Promise<void> {
    return this.serialize(session.id, async () => {
      assertCountdownSession(session);
      const terminal = this.terminalProjection(session);
      if (terminal) { await terminal; return; }
      const access = authorization ?? await this.dependencies.lifecycle.authorizeActiveSimulationCommand(session.id);
      const timer = await this.requireTimer(session);
      try {
        const state = await timer.checkpointForFinalization();
        await this.sync(state);
        await this.finalizeOnce(session, "manual", access, this.projectElapsed(session, state.accumulatedForegroundMs));
      } catch (error) { throw this.fail(session.id, error, "Interview Simulation finalization could not be completed."); }
    });
  }

  private async restore(session: TrainingSession): Promise<ForegroundSessionClock> {
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
      throw new Error("The persisted foreground timer is missing.");
    }
    if (state.accumulatedForegroundMs < session.activeForegroundMs) {
      throw new Error("Persisted foreground timer and session aggregate disagree.");
    }
    // A missing diagnostic receipt fails its runner, never normal recovery.
    try { this.dependencies.observeRestoreBeforeSync?.(state, session); } catch { /* non-authoritative observation */ }
    if (state.accumulatedForegroundMs > session.activeForegroundMs) await this.sync(state);
    else this.synchronizedTimerRevisions.set(state.sessionId, state.checkpointRevision);
    const timer = this.dependencies.createTimer(state, session);
    this.timers.set(session.id, timer);
    return timer;
  }

  private async requireTimer(session: TrainingSession): Promise<ForegroundSessionClock> {
    const fault = this.faults.get(session.id);
    if (fault) throw fault;
    assertForegroundTimedSession(session);
    return this.restore(session);
  }

  private async leaveForegroundInLane(session: TrainingSession, reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimeProjection> {
    const terminal = this.terminalProjection(session);
    if (terminal) return terminal;
    const timer = await this.requireTimer(session);
    try {
      const state = await timer.leaveForeground(reason);
      await this.sync(state);
      this.stopPeriodicCheckpoint(session.id);
      await this.expireIfNeeded(session, timer);
      return await this.publish(session, timer);
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

  private async responseSaveBoundary(session: TrainingSession, authorization?: SimulationCommandAuthorization): Promise<boolean> {
    const terminal = this.terminalProjection(session);
    if (terminal) { await terminal; return true; }
    if (session.configurationSnapshot.timer === "absoluteDeadline") {
      return this.finalizeAbsoluteDeadlineIfDue(session);
    }
    const access = authorization ?? (session.configurationSnapshot.submission === "manualOrForegroundTimeout"
      ? await this.dependencies.lifecycle.authorizeActiveSimulationCommand(session.id)
      : undefined);
    const timer = await this.requireTimer(session);
    try {
      await this.sync(await timer.checkpointForDraftSave());
      return await this.expireIfNeeded(session, timer, access);
    } catch (error) { throw this.fail(session.id, error, "Session timer checkpoint failed before response save."); }
  }

  private async saveDraftAtAbsoluteDeadlineBoundary(session: TrainingSession, commit: () => Promise<void>): Promise<boolean> {
    const deadline = this.absoluteDeadline(session);
    if (Date.parse(this.dependencies.lifecycle.currentTime()) >= deadline) {
      await this.dependencies.lifecycle.finalizeExpiredSimulationIfDue();
      return true;
    }
    await commit();
    return false;
  }

  private async finalizeAbsoluteDeadlineIfDue(session: TrainingSession): Promise<boolean> {
    const deadline = this.absoluteDeadline(session);
    if (Date.parse(this.dependencies.lifecycle.currentTime()) < deadline) return false;
    await this.dependencies.lifecycle.finalizeExpiredSimulationIfDue();
    return true;
  }

  private absoluteDeadline(session: TrainingSession): number {
    const deadlineAt = session.configurationSnapshot.timerDeadlineAt;
    const deadline = typeof deadlineAt === "string" ? Date.parse(deadlineAt) : Number.NaN;
    if (!Number.isFinite(deadline)) throw new ForegroundSessionTimerRecoveryError("An absolute-deadline simulation has no valid immutable deadline.");
    return deadline;
  }

  private async sync(state: ForegroundTimerState): Promise<void> {
    await this.dependencies.lifecycle.checkpointForegroundTime(state.accumulatedForegroundMs);
    this.synchronizedTimerRevisions.set(state.sessionId, state.checkpointRevision);
  }

  private project(session: TrainingSession, timer: ForegroundSessionClock): ForegroundTimeProjection {
    return this.projectElapsed(session, timer.getAccumulatedForegroundMs());
  }

  private projectElapsed(session: TrainingSession, elapsedForegroundMs: number): ForegroundTimeProjection {
    if (session.configurationSnapshot.timer === "elapsedForeground") {
      return Object.freeze({ elapsedForegroundMs });
    }
    const duration = session.configurationSnapshot.timerDurationMs;
    if (typeof duration !== "number") throw new Error("Interview Simulation timer duration is unavailable.");
    return Object.freeze({ elapsedForegroundMs, remainingForegroundMs: Math.max(0, duration - elapsedForegroundMs) });
  }

  private async publish(session: TrainingSession, timer: ForegroundSessionClock): Promise<ForegroundTimeProjection> {
    const projection = await (this.terminalProjection(session) ?? this.project(session, timer));
    this.notify({ kind: "projection_refresh", sessionId: session.id });
    return projection;
  }

  private async expireIfNeeded(session: TrainingSession, timer: ForegroundSessionClock, authorization?: SimulationCommandAuthorization): Promise<boolean> {
    const terminal = this.terminalProjection(session);
    if (terminal) { await terminal; return true; }
    if (session.configurationSnapshot.timer !== "countdownForeground") return false;
    const remaining = this.project(session, timer).remainingForegroundMs;
    if (remaining === undefined || remaining > 0) return false;
    const access = authorization ?? await this.dependencies.lifecycle.authorizeActiveSimulationCommand(session.id);
    const state = await timer.checkpointForExpiry();
    await this.sync(state);
    await this.finalizeOnce(session, "expiry", access, this.projectElapsed(session, state.accumulatedForegroundMs));
    return true;
  }

  private finalizationIdentity(session: TrainingSession): string {
    return canonicalSerialize({ trackId: session.trackId, modeId: session.modeId,
      familyId: this.dependencies.tracks.getTrackRegistration(session.trackId).familyId,
      configurationSnapshot: session.configurationSnapshot });
  }

  private terminalProjection(session: TrainingSession): Promise<ForegroundTimeProjection> | undefined {
    const record = this.finalizations.get(session.id);
    if (record && record.identity !== this.finalizationIdentity(session)) {
      throw new ForegroundSessionTimerRecoveryError("Finalized timer belongs to a different immutable session configuration.");
    }
    return record?.operation;
  }

  private async finalizeOnce(session: TrainingSession, cause: "manual" | "expiry", authorization: SimulationCommandAuthorization, projection: ForegroundTimeProjection): Promise<void> {
    const existing = this.terminalProjection(session);
    if (existing) { await existing; return; }
    const identity = this.finalizationIdentity(session);
    // Publish the scoped shared operation before the finalizer can clear T.
    // Only verified success resolves its frozen checkpoint projection.
    const operation = Promise.resolve().then(() => this.dependencies.finalize(session, authorization, cause)).then(() => {
      if (cause === "expiry") this.notify({ kind: "expired", sessionId: session.id });
      return projection;
    }).finally(() => this.stopPeriodicCheckpoint(session.id));
    this.finalizations.set(session.id, Object.freeze({ identity, operation }));
    await operation;
  }

  private notify(event: ForegroundSessionTimerEvent): void {
    for (const listener of this.listeners) {
      // Observers cannot turn completed persistence into an uncertain result
      // or prevent the remaining observers from receiving the event.
      try { listener(event); } catch { /* Subscriber failure does not change timer state. */ }
    }
  }

  private releaseAfterTerminalSuccess(sessionId: string): void {
    this.stopPeriodicCheckpoint(sessionId);
    this.timers.delete(sessionId);
    this.synchronizedTimerRevisions.delete(sessionId);
    this.faults.delete(sessionId);
    this.completionCheckpointFaults.delete(sessionId);
    this.finalizations.delete(sessionId);
    this.operations.delete(sessionId);
  }

  private serialize<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    if (this.quiescing) return Promise.reject(new ForegroundSessionTimerRecoveryError("Session timer is unavailable while local learning state is being reset."));
    const generation = this.generation;
    const previous = this.operations.get(sessionId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(() => {
      if (this.quiescing || generation !== this.generation) throw new ForegroundSessionTimerRecoveryError("Session timer operation was superseded by a local learning-state reset.");
      return operation();
    });
    this.operations.set(sessionId, result);
    return result;
  }

  private startPeriodicCheckpoint(session: TrainingSession): void {
    const sessionId = session.id;
    this.stopPeriodicCheckpoint();
    this.foregroundSessionId = sessionId;
    this.interval = this.dependencies.schedule(() => {
      if (this.foregroundSessionId !== sessionId) return;
      const timer = this.timers.get(sessionId);
      if (!timer) return;
      void this.serialize(sessionId, async () => {
        if (this.foregroundSessionId !== sessionId || this.finalizations.has(sessionId) || this.timers.get(sessionId) !== timer) return;
        const state = await timer.checkpointIfDue();
        if (state.checkpointRevision !== this.synchronizedTimerRevisions.get(sessionId)) await this.sync(state);
        await this.expireIfNeeded(session, timer);
        await this.publish(session, timer);
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

/** Read-only startup assertion for the isolated PERSIST-13 fixture entry point. */
export function isPersist13TimerOwnerCold(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE !== undefined && canonicalTimerFacade === null;
}

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
