export const HOLD_TO_CONFIRM_DURATION_MS = 3_000;

export type HoldToConfirmPhase = "idle" | "holding" | "ready";

export type HoldToConfirmState = Readonly<{
  elapsedMs: number;
  phase: HoldToConfirmPhase;
  progress: number;
}>;

export type HoldToConfirmClock = Readonly<{
  now: () => number;
}>;

export type HoldToConfirmFrameScheduler = Readonly<{
  cancel: (frameId: number) => void;
  request: (callback: () => void) => number;
}>;

export type HoldToConfirmReleaseResult = "cancelled" | "committed" | "idle";

export type HoldToConfirmController = Readonly<{
  activate: () => void;
  deactivate: () => void;
  destroy: () => void;
  getState: () => HoldToConfirmState;
  grant: () => void;
  move: (insideBounds: boolean) => void;
  release: () => HoldToConfirmReleaseResult;
  reset: () => void;
  setEnabled: (enabled: boolean) => void;
  terminate: () => void;
}>;

export type HoldToConfirmControllerOptions = Readonly<{
  clock: HoldToConfirmClock;
  durationMs?: number;
  onComplete: () => void;
  onStateChange: (state: HoldToConfirmState) => void;
  scheduler?: HoldToConfirmFrameScheduler;
}>;

const IDLE_STATE: HoldToConfirmState = Object.freeze({ elapsedMs: 0, phase: "idle", progress: 0 });
const NOOP_SCHEDULER: HoldToConfirmFrameScheduler = Object.freeze({ cancel: () => undefined, request: () => 0 });

export function createHoldToConfirmController(options: HoldToConfirmControllerOptions): HoldToConfirmController {
  const durationMs = normalizeDuration(options.durationMs);
  const scheduler = options.scheduler ?? NOOP_SCHEDULER;
  let state = IDLE_STATE;
  let startedAt: number | null = null;
  let lastNow: number | null = null;
  let enabled = true;
  let active = true;
  let destroyed = false;
  let frameId: number | null = null;
  let epoch = 0;

  const publish = (next: HoldToConfirmState): void => {
    if (sameState(state, next)) return;
    state = next;
    options.onStateChange(next);
  };

  const cancelFrame = (): void => {
    if (frameId === null) return;
    scheduler.cancel(frameId);
    frameId = null;
  };

  const readNow = (): number | null => {
    try {
      const value = options.clock.now();
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  };

  const refresh = (): boolean => {
    if (startedAt === null) return false;
    const now = readNow();
    if (now === null || (lastNow !== null && now < lastNow)) {
      cancelGesture();
      return false;
    }
    lastNow = now;
    const elapsedMs = now - startedAt;
    const ready = elapsedMs >= durationMs;
    publish({
      elapsedMs,
      phase: ready ? "ready" : "holding",
      progress: ready ? 1 : clamp(elapsedMs / durationMs),
    });
    return true;
  };

  const scheduleFrame = (): void => {
    if (destroyed || !active || !enabled || startedAt === null || state.phase === "ready" || frameId !== null) return;
    const scheduledEpoch = epoch;
    frameId = scheduler.request(() => {
      if (scheduledEpoch !== epoch || destroyed || !active || !enabled || startedAt === null) return;
      frameId = null;
      if (refresh() && state.phase === "holding") scheduleFrame();
    });
  };

  const cancelGesture = (): void => {
    epoch += 1;
    startedAt = null;
    lastNow = null;
    cancelFrame();
    publish(IDLE_STATE);
  };

  const controller: HoldToConfirmController = {
    activate: () => {
      if (destroyed) return;
      active = true;
    },
    deactivate: () => {
      if (destroyed) return;
      cancelGesture();
      active = false;
    },
    destroy: () => {
      if (destroyed) return;
      controller.deactivate();
      destroyed = true;
    },
    getState: () => state,
    grant: () => {
      if (destroyed || !active || !enabled || startedAt !== null) return;
      const now = readNow();
      if (now === null) return;
      startedAt = now;
      lastNow = now;
      publish({ elapsedMs: 0, phase: "holding", progress: 0 });
      scheduleFrame();
    },
    move: (insideBounds) => {
      if (destroyed || !active || startedAt === null) return;
      if (!insideBounds) cancelGesture();
    },
    release: () => {
      if (destroyed || !active || !enabled || startedAt === null) {
        if (startedAt !== null) cancelGesture();
        return "idle";
      }
      if (!refresh()) return "cancelled";
      const committed = state.phase === "ready";
      startedAt = null;
      lastNow = null;
      epoch += 1;
      cancelFrame();
      publish(IDLE_STATE);
      if (committed) {
        options.onComplete();
        return "committed";
      }
      return "cancelled";
    },
    reset: () => {
      if (destroyed) return;
      cancelGesture();
    },
    setEnabled: (nextEnabled) => {
      enabled = nextEnabled;
      if (!enabled && startedAt !== null) cancelGesture();
    },
    terminate: () => {
      if (destroyed || !active || startedAt === null) return;
      cancelGesture();
    },
  };

  return controller;
}

function normalizeDuration(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.max(HOLD_TO_CONFIRM_DURATION_MS, value)
    : HOLD_TO_CONFIRM_DURATION_MS;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function sameState(left: HoldToConfirmState, right: HoldToConfirmState): boolean {
  return left.phase === right.phase && left.elapsedMs === right.elapsedMs && left.progress === right.progress;
}
