import type { ForegroundTimerState, TrainingSession } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent } from "../../storage/repositories/profileStorageRepository";

type Context = Readonly<{
  development: boolean;
  smoke: boolean;
  runId: string | undefined;
  captureProfile(): Readonly<{ id: string; isCurrent(): boolean }> | null;
}>;
export type ForegroundClockColdReceipt = Readonly<{
  protocol: "patternly.foreground-clock-cold-receipt.v1";
  runId: string;
  profileIdSha256: string;
  sessionIdSha256: string;
  durableElapsedMs: number;
  sessionElapsedMs: number;
  checkpointRevision: number;
  running: boolean;
}>;

/** Non-authoritative, memory-only first validated restore observation. Failure
 * leaves no acceptable receipt; it never changes normal T→S reconciliation. */
export function createForegroundClockColdReceipt(context: Context) {
  const enabled = context.development && context.smoke
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(context.runId ?? "");
  let attempted = false;
  let receipt: ForegroundClockColdReceipt | null = null;
  let profileCurrent: (() => boolean) | null = null;
  return Object.freeze({
    record(timer: ForegroundTimerState, session: TrainingSession): void {
      if (!enabled || attempted) return;
      attempted = true;
      try {
        const profile = context.captureProfile();
        if (!profile || !profile.isCurrent() || !profile.id || !session.id || timer.sessionId !== session.id
          || timer.trackId !== session.trackId || session.status !== "active"
          || (session.configurationSnapshot.timer !== "elapsedForeground" && session.configurationSnapshot.timer !== "countdownForeground")
          || !Number.isSafeInteger(timer.accumulatedForegroundMs) || !Number.isSafeInteger(session.activeForegroundMs)
          || session.activeForegroundMs < 0 || timer.accumulatedForegroundMs < session.activeForegroundMs
          || !Number.isSafeInteger(timer.checkpointRevision) || timer.checkpointRevision < 1 || typeof timer.running !== "boolean") return;
        receipt = Object.freeze({
          protocol: "patternly.foreground-clock-cold-receipt.v1", runId: context.runId!,
          profileIdSha256: sha256Utf8(profile.id), sessionIdSha256: sha256Utf8(session.id),
          durableElapsedMs: timer.accumulatedForegroundMs, sessionElapsedMs: session.activeForegroundMs,
          checkpointRevision: timer.checkpointRevision, running: timer.running,
        });
        profileCurrent = profile.isCurrent;
      } catch { receipt = null; }
    },
    read(runId: string, profileIdSha256: string, sessionIdSha256: string): ForegroundClockColdReceipt | null {
      try {
        return receipt && profileCurrent?.() && runId === context.runId
          && receipt.profileIdSha256 === profileIdSha256 && receipt.sessionIdSha256 === sessionIdSha256 ? receipt : null;
      } catch { return null; }
    },
  });
}

let runtimeReceipt: ReturnType<typeof createForegroundClockColdReceipt> | null = null;
export function observeForegroundClockColdRestore(timer: ForegroundTimerState, session: TrainingSession): void {
  if (typeof __DEV__ === "undefined" || !__DEV__ || !isPatternlySmokeRuntime()) return;
  runtimeReceipt ??= createForegroundClockColdReceipt({
    development: __DEV__, smoke: true, runId: process.env.EXPO_PUBLIC_PATTERNLY_FOREGROUND_CLOCK_RUN_ID,
    captureProfile: () => {
      const lease = captureActiveProfileStorageLease();
      return lease ? { id: lease.profile.id, isCurrent: () => isActiveProfileStorageLeaseCurrent(lease) } : null;
    },
  });
  runtimeReceipt.record(timer, session);
}
export function readForegroundClockColdReceipt(runId: string, profileIdSha256: string, sessionIdSha256: string): ForegroundClockColdReceipt | null {
  if (typeof __DEV__ === "undefined" || !__DEV__ || !isPatternlySmokeRuntime()
    || runId !== process.env.EXPO_PUBLIC_PATTERNLY_FOREGROUND_CLOCK_RUN_ID) return null;
  return runtimeReceipt?.read(runId, profileIdSha256, sessionIdSha256) ?? null;
}
