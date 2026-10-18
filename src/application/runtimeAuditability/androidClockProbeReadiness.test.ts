import test from "node:test";
import assert from "node:assert/strict";
import { waitForAndroidClockProbe, androidClockProbeErrorCategory, androidClockProbeFailure, requireAndroidClockProbeAdvance } from "./androidClockProbeReadiness";

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
