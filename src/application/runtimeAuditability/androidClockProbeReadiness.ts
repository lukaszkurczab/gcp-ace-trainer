import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { isPremiumCacheRecord } from "../../domain/entitlements/premiumEntitlement";

/** Hash every entitlement field; only observation times may vary in a refresh.
 * Invalid/foreign cache gets no annotation and can never pass by raw-hash delta. */
export function observeAndroidClockProbePremiumCache(raw: string, profileId: string, accountId: string | null | undefined, observedWallMs: number) {
  try {
    const value: unknown = JSON.parse(raw);
    if (!accountId || !isPremiumCacheRecord(value) || value.snapshot.accountId !== accountId
      || !Number.isSafeInteger(observedWallMs) || observedWallMs < 0) return undefined;
    const { providerObservedAt, serverObservedAt, ...content } = value.snapshot;
    return { profileSha256: sha256Utf8(profileId), accountSha256: sha256Utf8(accountId), contentSha256: sha256Utf8(JSON.stringify(content)),
      providerObservedMs: Date.parse(providerObservedAt), serverObservedMs: Date.parse(serverObservedAt),
      maxObservedWallTime: value.maxObservedWallTime, observedWallMs };
  } catch { return undefined; }
}

export const PREPARED_STALL_TTL_MS = 10_000;

export function requireAndroidClockProbePreparationCurrent(expiresAt: number, nowMs: number) {
  if (!Number.isFinite(expiresAt) || !Number.isFinite(nowMs) || nowMs >= expiresAt) throw androidClockProbeFailure("probe_preparation_expired");
}

const RETRYABLE = new Set(["probe_session_unavailable", "probe_countdown_or_owner_unavailable", "probe_foreground_unavailable", "probe_timer_not_running", "probe_profile_unavailable", "fixture_not_ready", "foreground_clock_shared_handle_observation_busy"]);
const CATEGORIES = new Set([...RETRYABLE, "probe_scope_unavailable", "probe_request_invalid", "probe_request_io_failed", "probe_request_delete_failed", "probe_prepared_owner_changed", "probe_prepared_keys_changed", "probe_prepared_value_changed", "probe_prepared_session_changed", "probe_not_advancing", "probe_preparation_required", "probe_preparation_expired", "probe_cold_profile_unavailable", "probe_cold_journal_pending", "fixture_production_owner_unavailable", "fixture_store_collision", "fixture_requires_session_exit", "fixture_record_rejected", "fixture_namespace_rejected", "fixture_encryption_rejected", "fixture_configuration_rejected", "fixture_cleanup_unverified", "fixture_cas_unverified", "fixture_native_fault_unavailable", "fixture_not_running", "foreground_clock_shared_handle_mismatch"]);

/** Preserve every canonical session field except the two fields changed by
 * ordinary foreground reconciliation. This observation never drives recovery. */
export function observeAndroidClockProbeSession(raw: string) {
  const envelope = JSON.parse(raw);
  if (!envelope || envelope.schemaIdentity !== "patternly:canonical:v1" || !Number.isSafeInteger(envelope.revision) || envelope.revision < 1
    || !envelope.payload || !Number.isSafeInteger(envelope.payload.activeForegroundMs) || envelope.payload.activeForegroundMs < 0) throw androidClockProbeFailure("probe_scope_unavailable");
  const { revision, ...metadata } = envelope;
  const { activeForegroundMs, ...content } = envelope.payload;
  return { contentSha256: sha256Utf8(JSON.stringify({ ...metadata, payload: content })), elapsedMs: activeForegroundMs as number, revision: revision as number };
}

export function requireAndroidClockProbeSessionAdvance(before: ReturnType<typeof observeAndroidClockProbeSession>, after: ReturnType<typeof observeAndroidClockProbeSession>) {
  if (after.contentSha256 !== before.contentSha256 || after.elapsedMs < before.elapsedMs || after.revision < before.revision) throw androidClockProbeFailure("probe_scope_unavailable");
}

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
