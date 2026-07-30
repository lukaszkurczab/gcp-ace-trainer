import {
  FOREGROUND_TIMER_CHECKPOINT_INTERVAL_MS,
  FOREGROUND_TIMER_MAX_DRIFT_MS,
  createForegroundTimerState,
  type ForegroundTimerState,
} from "../../domain";

export type ForegroundSessionTimerPort = Readonly<{
  save(timer: ForegroundTimerState, expectedPreviousCheckpointRevision: number | null): Promise<ForegroundTimerState>;
}>;

export type MonotonicClock = Readonly<{ now(): number }>;
export type WallClock = Readonly<{ now(): string }>;

/**
 * A single authoritative timer for a foreground-timed session. It never derives
 * foreground work from wall time, so a process restart resumes from the last
 * durable checkpoint rather than counting the time while the app was closed.
 */
export class ForegroundSessionTimer {
  private segmentStartedAt: number | null = null;

  constructor(
    private state: ForegroundTimerState,
    private readonly port: ForegroundSessionTimerPort,
    private readonly monotonicClock: MonotonicClock,
    private readonly wallClock: WallClock,
  ) {}

  static restore(input: Readonly<{
    state: ForegroundTimerState;
    port: ForegroundSessionTimerPort;
    monotonicClock: MonotonicClock;
    wallClock: WallClock;
  }>): ForegroundSessionTimer {
    // A persisted running marker is only diagnostic across process death. No
    // segment start survives, therefore no closed-app duration can be counted.
    return new ForegroundSessionTimer(input.state, input.port, input.monotonicClock, input.wallClock);
  }

  getState(): ForegroundTimerState { return this.state; }

  getAccumulatedForegroundMs(): number {
    return this.state.accumulatedForegroundMs + this.currentSegmentMs();
  }

  needsPeriodicCheckpoint(): boolean {
    return this.currentSegmentMs() >= FOREGROUND_TIMER_CHECKPOINT_INTERVAL_MS - FOREGROUND_TIMER_MAX_DRIFT_MS;
  }

  async enterForeground(): Promise<ForegroundTimerState> {
    if (this.segmentStartedAt !== null) return this.state;
    this.segmentStartedAt = this.monotonicClock.now();
    return this.persist(true);
  }

  async checkpointIfDue(): Promise<ForegroundTimerState> {
    return this.needsPeriodicCheckpoint() ? this.persist(true) : this.state;
  }

  async checkpointForDraftSave(): Promise<ForegroundTimerState> { return this.persist(this.segmentStartedAt !== null); }
  async checkpointForFinalization(): Promise<ForegroundTimerState> { return this.persist(this.segmentStartedAt !== null); }
  async checkpointForExpiry(): Promise<ForegroundTimerState> { return this.persist(this.segmentStartedAt !== null); }

  async leaveForeground(): Promise<ForegroundTimerState> {
    if (this.segmentStartedAt === null && !this.state.running) return this.state;
    return this.persist(false);
  }

  private currentSegmentMs(): number {
    if (this.segmentStartedAt === null) return 0;
    const elapsed = this.monotonicClock.now() - this.segmentStartedAt;
    if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error("Monotonic foreground clock moved backwards.");
    return Math.floor(elapsed);
  }

  private async persist(running: boolean): Promise<ForegroundTimerState> {
    const elapsed = this.currentSegmentMs();
    const candidate = createForegroundTimerState({
      ...this.state,
      accumulatedForegroundMs: this.state.accumulatedForegroundMs + elapsed,
      lastCheckpointAt: this.wallClock.now(),
      running,
    });
    const durable = await this.port.save(candidate, this.state.checkpointRevision);
    this.state = durable;
    this.segmentStartedAt = running ? this.monotonicClock.now() : null;
    return durable;
  }
}
