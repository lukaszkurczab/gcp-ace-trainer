import {
  createForegroundTimerState,
  type ForegroundTimerState,
} from "../../domain";

const ANDROID_CHECKPOINT_INTERVAL_MS = 15_000;
const ANDROID_CHECKPOINT_DRIFT_MS = 1_000;

export type AndroidForegroundSessionTimerPort = Readonly<{
  save(timer: ForegroundTimerState, expectedPreviousCheckpointRevision: number | null): Promise<ForegroundTimerState>;
}>;

export type MonotonicClock = Readonly<{ now(): number }>;
export type WallClock = Readonly<{ now(): string }>;

/**
 * Existing Android JS authority, retained explicitly while Android native
 * acceptance is outside the first-iOS scope. It does not establish PERSIST-11
 * ≤5s and must never be selected after an iOS native-owner failure. It never derives
 * foreground work from wall time, so a process restart resumes from the last
 * durable checkpoint rather than counting the time while the app was closed.
 */
export class AndroidForegroundSessionTimer {
  private segmentStartedAt: number | null = null;

  constructor(
    private state: ForegroundTimerState,
    private readonly port: AndroidForegroundSessionTimerPort,
    private readonly monotonicClock: MonotonicClock,
    private readonly wallClock: WallClock,
  ) {}

  static restore(input: Readonly<{
    state: ForegroundTimerState;
    port: AndroidForegroundSessionTimerPort;
    monotonicClock: MonotonicClock;
    wallClock: WallClock;
  }>): AndroidForegroundSessionTimer {
    // A persisted running marker is only diagnostic across process death. No
    // segment start survives, therefore no closed-app duration can be counted.
    return new AndroidForegroundSessionTimer(input.state, input.port, input.monotonicClock, input.wallClock);
  }

  getState(): ForegroundTimerState { return this.state; }

  getAccumulatedForegroundMs(): number {
    return this.state.accumulatedForegroundMs + this.currentSegmentMs();
  }

  needsPeriodicCheckpoint(): boolean {
    return this.currentSegmentMs() >= ANDROID_CHECKPOINT_INTERVAL_MS - ANDROID_CHECKPOINT_DRIFT_MS;
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
  async checkpointForPracticeCompletion(): Promise<ForegroundTimerState> { return this.persist(false); }
  async checkpointForExpiry(): Promise<ForegroundTimerState> { return this.persist(this.segmentStartedAt !== null); }

  async leaveForeground(_reason?: "session_exit" | "app_background"): Promise<ForegroundTimerState> {
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
