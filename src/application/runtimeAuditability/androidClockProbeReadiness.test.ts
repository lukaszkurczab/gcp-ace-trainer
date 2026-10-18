import test from "node:test";
import assert from "node:assert/strict";
import { PREPARED_STALL_TTL_MS, requireAndroidClockProbePreparationCurrent, waitForAndroidClockProbe, androidClockProbeErrorCategory, androidClockProbeFailure, requireAndroidClockProbeAdvance, observeAndroidClockProbeSession, requireAndroidClockProbeSessionAdvance } from "./androidClockProbeReadiness";

test("readiness survives the transient intent foreground transition without repeating an effect", async () => {
  let now = 0, reads = 0, effects = 0;
  const result = await waitForAndroidClockProbe(() => {
    reads++;
    if (now < 150) throw androidClockProbeFailure("probe_foreground_unavailable");
    return { ready: true };
  }, 500, { now: () => now, wait: async () => { now += 50; } });
  effects++;
  assert.equal(result.ready, true); assert.equal(reads, 4); assert.equal(effects, 1);
});

test("timeout refuses before the effect; an SDK fault is never retried or exposed", async () => {
  let now = 0, calls = 0;
  await assert.rejects(waitForAndroidClockProbe(() => { throw androidClockProbeFailure("probe_timer_not_running"); }, 100,
    { now: () => now, wait: async () => { now += 50; } }), /timer_not_running/);
  await assert.rejects(waitForAndroidClockProbe(() => { calls++; throw Error("private-sdk-detail"); }, 100,
    { now: () => now, wait: async () => { now += 50; } }), /private-sdk-detail/);
  assert.equal(calls, 1); assert.equal(androidClockProbeErrorCategory(Error("private-sdk-detail")), "probe_failed");
});

test("production stall requires actual native advancement in the same immutable scope", () => {
  const first = { profileSha256: "p", sessionSha256: "s", configurationSha256: "c", startedAt: "start", timerKind: "elapsedForeground",
    durableElapsedMs: 1000, elapsedMs: 1100, running: true };
  requireAndroidClockProbeAdvance(first, { ...first, durableElapsedMs: 1150, elapsedMs: 1200 });
  assert.throws(() => requireAndroidClockProbeAdvance(first, first), /probe_not_advancing/);
  assert.throws(() => requireAndroidClockProbeAdvance(first, { ...first, elapsedMs: 1200, running: false }), /probe_not_advancing/);
  assert.throws(() => requireAndroidClockProbeAdvance(first, { ...first, elapsedMs: 1200, sessionSha256: "other" }), /probe_scope_unavailable/);
  assert.throws(() => requireAndroidClockProbeAdvance(first, { ...first, durableElapsedMs: 999, elapsedMs: 1200 }), /probe_scope_unavailable/);
});

test("prepared production observation admits clock reconciliation but refuses any session-content edit or rollback", () => {
  const session = { id: "s", status: "active", trackId: "track", startedAt: "start", configurationSnapshot: { timer: "elapsedForeground" },
    answers: ["preserved"], activeForegroundMs: 100 };
  const observe = (payload = session, revision = 1) => observeAndroidClockProbeSession(JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision, payload }));
  const baseline = observe();
  requireAndroidClockProbeSessionAdvance(baseline, observe({ ...session, activeForegroundMs: 200 }, 2));
  for (const change of [{ id: "other" }, { startedAt: "other" }, { status: "completed" }, { answers: [] }, { configurationSnapshot: { timer: "countdownForeground" } }, { activeForegroundMs: 99 }]) {
    assert.throws(() => requireAndroidClockProbeSessionAdvance(baseline, observe({ ...session, ...change })), /probe_scope_unavailable/);
  }
  assert.throws(() => requireAndroidClockProbeSessionAdvance(observe(session, 2), baseline), /probe_scope_unavailable/);
  assert.throws(() => observe({ ...session, activeForegroundMs: Number.NaN }), /probe_scope_unavailable/);
});


test("prepared diagnostic window expires at its boundary while scope checks remain separate", () => {
  assert.equal(PREPARED_STALL_TTL_MS, 10_000);
  requireAndroidClockProbePreparationCurrent(PREPARED_STALL_TTL_MS, 9_999);
  for (const now of [10_000, 10_001, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => requireAndroidClockProbePreparationCurrent(PREPARED_STALL_TTL_MS, now), { message: "probe_preparation_expired" });
  }
});

test("Premium observation hashes every entitlement field and refuses invalid or foreign cache", async () => {
  const { observeAndroidClockProbePremiumCache: observe } = await import("./androidClockProbeReadiness");
  const snapshot = { accountId: "account", entitlement: "premium", productId: "premium", state: "active", source: "revenuecat",
    mapVersion: "v2", projectId: "project", environment: "SANDBOX", reason: "promotional", sources: [],
    providerExpiresAt: "2026-10-19T00:00:00.000Z", providerGraceExpiresAt: null,
    providerObservedAt: "2026-10-18T00:00:00.000Z", serverObservedAt: "2026-10-18T00:00:00.000Z" };
  const now = Date.parse(snapshot.serverObservedAt);
  const raw = (change = {}) => JSON.stringify({ snapshot: { ...snapshot, ...change }, maxObservedWallTime: now + 1000 });
  const baseline = observe(raw(), "profile", "account", now)!;
  assert.ok(baseline);
  assert.equal(observe(raw({ providerObservedAt: "2026-10-18T00:00:01.000Z", serverObservedAt: "2026-10-18T00:00:01.000Z" }), "profile", "account", now)?.contentSha256, baseline.contentSha256);
  for (const change of [{ providerExpiresAt: "2026-10-20T00:00:00.000Z" }, { state: "expired" }, { projectId: "other" }, { productId: "other" }]) {
    assert.notEqual(observe(raw(change), "profile", "account", now)?.contentSha256, baseline.contentSha256);
  }
  for (const value of ["invalid", raw({ extra: true }), raw({ serverObservedAt: "bad" }), raw({ accountId: "foreign" })]) assert.equal(observe(value, "profile", "account", now), undefined);
  assert.equal(observe(raw(), "profile", null, now), undefined);
  assert.equal(observe(raw(), "profile", "account", Number.NaN), undefined);
  assert.equal(JSON.stringify(baseline).includes('"account"'), false);
});
