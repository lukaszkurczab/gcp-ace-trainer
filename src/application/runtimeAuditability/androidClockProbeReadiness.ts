const RETRYABLE = new Set(["probe_session_unavailable", "probe_countdown_or_owner_unavailable", "probe_foreground_unavailable", "probe_timer_not_running", "probe_profile_unavailable", "fixture_not_ready", "foreground_clock_shared_handle_observation_busy"]);
const CATEGORIES = new Set([...RETRYABLE, "probe_scope_unavailable", "probe_not_advancing", "fixture_store_collision", "fixture_requires_session_exit", "fixture_record_rejected", "fixture_namespace_rejected", "fixture_encryption_rejected", "fixture_configuration_rejected", "fixture_cleanup_unverified", "fixture_cas_unverified", "fixture_not_running", "foreground_clock_shared_handle_mismatch"]);

/** Fixed diagnostic code; receipt projection never reads SDK message text. */
export function androidClockProbeFailure(category: string): Error & { code: string } {
  if (!CATEGORIES.has(category)) throw Error("android_clock_probe_category_invalid");
  return Object.assign(Error(category), { code: category });
}

export function androidClockProbeErrorCategory(failure: unknown): string {
  const code = failure instanceof Error ? (failure as Error & { code?: unknown }).code : undefined;
  return typeof code === "string" && CATEGORIES.has(code) ? code : "probe_failed";
}

/** Only repeats read-only readiness checks. Mutating commands and the stall
 * start run exactly once after this function has returned. */
export async function waitForAndroidClockProbe<T>(read: () => T, timeoutMs = 2_000,
  port = { now: () => performance.now(), wait: () => new Promise<void>(resolve => setTimeout(resolve, 50)) }): Promise<T> {
  const deadline = port.now() + timeoutMs;
  for (;;) {
    try { return read(); }
    catch (failure) {
      if (!RETRYABLE.has(androidClockProbeErrorCategory(failure)) || port.now() >= deadline) throw failure;
      await port.wait();
    }
  }
}

type AdvancementSample = Readonly<{ profileSha256: string; sessionSha256: string; configurationSha256: string; startedAt: string; timerKind: string;
  durableElapsedMs: number; elapsedMs: number; running: boolean }>;

/** Same authority/scope, monotonic durable baseline and a live native segment. */
export function requireAndroidClockProbeAdvance(before: AdvancementSample, after: AdvancementSample): void {
  if (["profileSha256", "sessionSha256", "configurationSha256", "startedAt", "timerKind"].some(key => before[key as keyof AdvancementSample] !== after[key as keyof AdvancementSample])
    || after.durableElapsedMs < before.durableElapsedMs) throw androidClockProbeFailure("probe_scope_unavailable");
  if (!before.running || !after.running || !Number.isSafeInteger(before.elapsedMs) || !Number.isSafeInteger(after.elapsedMs)
    || before.elapsedMs < before.durableElapsedMs || after.elapsedMs < after.durableElapsedMs || after.elapsedMs <= before.elapsedMs) throw androidClockProbeFailure("probe_not_advancing");
}
