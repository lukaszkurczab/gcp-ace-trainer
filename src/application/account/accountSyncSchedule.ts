import { useSyncExternalStore } from "react";

/**
 * T1.3 (Plan §3, variant C1): account sync starts in the background right after
 * a session is finalized and when the app goes to the background, instead of
 * waiting for the next Today focus. Today keeps its own idle-time sync as the
 * fallback.
 *
 * This module is deliberately tiny and React Native free at import time: the
 * quiz facade calls `requestAccountSync`, the account provider registers the
 * scheduler, and neither has to import the other.
 */
export type AccountSyncReason = "session_finalized" | "app_background";

/** Upper bound for the idle wait, so `sync_start` lands ≤ 1 s after `session_finalized`. */
export const ACCOUNT_SYNC_IDLE_TIMEOUT_MS = 500;
/** The indicator appears only for a sync that is still running after this delay (no flicker for no-ops). */
export const ACCOUNT_SYNC_INDICATOR_DELAY_MS = 250;

export type AccountSyncSchedulerDependencies = Readonly<{
  /** Runs `task` once the JS thread is idle; returns a cancel function. */
  defer: (task: () => void) => () => void;
  /** One sync attempt. It must deduplicate network work itself (the account operation lane does). */
  run: (reason: AccountSyncReason) => Promise<unknown>;
}>;

export type AccountSyncScheduler = Readonly<{
  schedule: (reason: AccountSyncReason) => void;
  dispose: () => void;
}>;

/**
 * Deduplicating scheduler:
 * - at most one deferred task and one running attempt at a time;
 * - `app_background` runs at once (the deferred task is cancelled), because
 *   iOS gives a backgrounded app only a few seconds;
 * - a finalization while an attempt is running queues exactly one follow-up,
 *   so a result committed after the running attempt's snapshot is not left
 *   waiting for Today.
 */
export function createAccountSyncScheduler(dependencies: AccountSyncSchedulerDependencies): AccountSyncScheduler {
  let cancelDeferred: (() => void) | null = null;
  let running = false;
  let followUp = false;
  let disposed = false;

  const start = (reason: AccountSyncReason): void => {
    cancelDeferred = null;
    if (disposed) return;
    running = true;
    let attempt: Promise<unknown>;
    try { attempt = dependencies.run(reason); } catch (error) { attempt = Promise.reject(error); }
    void attempt.then(settle, settle);
  };

  const settle = (): void => {
    running = false;
    if (!followUp || disposed) return;
    followUp = false;
    schedule("session_finalized");
  };

  const schedule = (reason: AccountSyncReason): void => {
    if (disposed) return;
    if (running) {
      if (reason === "session_finalized") followUp = true;
      return;
    }
    if (reason === "app_background") {
      cancelDeferred?.();
      start(reason);
      return;
    }
    if (cancelDeferred) return;
    cancelDeferred = dependencies.defer(() => start(reason));
  };

  return Object.freeze({
    schedule,
    dispose: () => {
      disposed = true;
      cancelDeferred?.();
      cancelDeferred = null;
    },
  });
}

let registeredScheduler: ((reason: AccountSyncReason) => void) | null = null;

/** The account provider owns the scheduler for the mounted account session. */
export function registerAccountSyncScheduler(schedule: (reason: AccountSyncReason) => void): () => void {
  registeredScheduler = schedule;
  return () => { if (registeredScheduler === schedule) registeredScheduler = null; };
}

/** Best effort: never throws into the caller (the quiz completion command). */
export function requestAccountSync(reason: AccountSyncReason): void {
  try { registeredScheduler?.(reason); } catch { /* Today focus remains the fallback. */ }
}

/** Idle-time deferral with a deadline, so a busy summary screen cannot postpone sync indefinitely. */
export function deferAccountSyncUntilIdle(task: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(() => task(), { timeout: ACCOUNT_SYNC_IDLE_TIMEOUT_MS });
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(task, 0);
  return () => clearTimeout(handle);
}

/** Subscribes to the app moving to the background. React Native is loaded lazily, so Node tests can import this module. */
export function subscribeAppBackground(listener: () => void): () => void {
  try {
    const { AppState } = require("react-native") as typeof import("react-native");
    const subscription = AppState.addEventListener("change", (next) => { if (next === "background") listener(); });
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}

// Sync activity for the Today indicator. A small external store keeps the
// indicator from re-rendering every account-context consumer.
let syncActive = false;
const activityListeners = new Set<() => void>();

export function setAccountSyncActivity(active: boolean): void {
  if (syncActive === active) return;
  syncActive = active;
  for (const listener of [...activityListeners]) listener();
}

export function readAccountSyncActivity(): boolean { return syncActive; }

function subscribeAccountSyncActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => { activityListeners.delete(listener); };
}

/** True while a background account sync started by this scheduler is running past the indicator delay. */
export function useAccountSyncActivity(): boolean {
  return useSyncExternalStore(subscribeAccountSyncActivity, readAccountSyncActivity, readAccountSyncActivity);
}
