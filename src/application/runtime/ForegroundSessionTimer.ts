import type { ForegroundTimerState } from "../../domain";

export type ForegroundTimerLeaveReason = "session_exit" | "app_background";
export type ForegroundSessionClock = Readonly<{
  getState(): ForegroundTimerState;
  getAccumulatedForegroundMs(): number;
  enterForeground(): Promise<ForegroundTimerState>;
  checkpointIfDue(): Promise<ForegroundTimerState>;
  checkpointForDraftSave(): Promise<ForegroundTimerState>;
  checkpointForFinalization(): Promise<ForegroundTimerState>;
  checkpointForPracticeCompletion(): Promise<ForegroundTimerState>;
  checkpointForExpiry(): Promise<ForegroundTimerState>;
  leaveForeground(reason?: ForegroundTimerLeaveReason): Promise<ForegroundTimerState>;
}>;

export type NativeForegroundTimerPort = Readonly<{
  readState(): ForegroundTimerState;
  elapsed(): number;
  enter(): ForegroundTimerState;
  checkpoint(): ForegroundTimerState;
  pause(): ForegroundTimerState;
}>;

/** Application adapter for the one native clock authority. There is no JS
 * segment, wall-clock elapsed calculation or JS durability scheduler here. */
export class ForegroundSessionTimer implements ForegroundSessionClock {
  constructor(private readonly port: NativeForegroundTimerPort) {}
  getState(): ForegroundTimerState { return this.port.readState(); }
  getAccumulatedForegroundMs(): number { return this.port.elapsed(); }
  async enterForeground(): Promise<ForegroundTimerState> { return this.port.enter(); }
  // The facade's interval refreshes projections and reconciles durable T→S.
  // Native owns periodic persistence even while this JS callback is delayed.
  async checkpointIfDue(): Promise<ForegroundTimerState> { return this.port.readState(); }
  async checkpointForDraftSave(): Promise<ForegroundTimerState> { return this.port.checkpoint(); }
  async checkpointForFinalization(): Promise<ForegroundTimerState> { return this.port.pause(); }
  async checkpointForPracticeCompletion(): Promise<ForegroundTimerState> { return this.port.pause(); }
  async checkpointForExpiry(): Promise<ForegroundTimerState> { return this.port.pause(); }
  async leaveForeground(reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimerState> {
    // AppState sync must preserve the native admitted intent for return without
    // JS. Route exit explicitly stops that intent before leaving the session.
    return reason === "app_background" ? this.port.checkpoint() : this.port.pause();
  }
}

/** Platform selection is explicit and happens before construction. A native
 * construction/bind failure propagates; it never enters the Android branch. */
export function selectForegroundSessionClock(
  authority: "ios-native" | "android-js" | "memory-test",
  createNative: () => ForegroundSessionClock,
  createAndroidOrMemory: () => ForegroundSessionClock,
): ForegroundSessionClock {
  if (authority === "ios-native") return createNative();
  if (authority === "android-js" || authority === "memory-test") return createAndroidOrMemory();
  throw new Error("foreground_clock_authority_invalid");
}
