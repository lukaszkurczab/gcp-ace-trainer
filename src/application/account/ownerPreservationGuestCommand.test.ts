import assert from "node:assert/strict";
import test from "node:test";

import { createGuestTransitionLock, runOwnerPreservationGuestTransition, runWithGuestTransitionLock } from "./AccountSessionProvider";

function harness(overrides: Partial<Parameters<typeof runOwnerPreservationGuestTransition>[0]> = {}) {
  const calls: string[] = [];
  const input: Parameters<typeof runOwnerPreservationGuestTransition>[0] = {
    lock: createGuestTransitionLock(),
    preflight: () => { calls.push("preflight"); return true; },
    recheck: () => { calls.push("recheck"); return true; },
    arm: async () => { calls.push("arm"); return "unchanged"; },
    cleanup: async () => { calls.push("cleanup"); return "unchanged"; },
    beginTransition: async () => { calls.push("transition"); },
    ...overrides,
  };
  return { calls, input };
}

test("denied preflight makes no oracle or transition calls", async () => {
  const { calls, input } = harness({ preflight: () => { calls.push("preflight"); return false; } });
  assert.deepEqual(await runOwnerPreservationGuestTransition(input), { status: "denied" });
  assert.deepEqual(calls, ["preflight"]);
});

test("blocked oracle arm never starts session or profile side effects", async () => {
  const { calls, input } = harness({ arm: async () => { calls.push("arm"); return "blocked"; } });
  assert.deepEqual(await runOwnerPreservationGuestTransition(input), { status: "blocked", oracle: "blocked" });
  assert.deepEqual(calls, ["preflight", "arm"]);
});

test("failed post-arm recheck cleans only the armed record and blocks transition", async () => {
  const { calls, input } = harness({ recheck: () => { calls.push("recheck"); return false; } });
  assert.deepEqual(await runOwnerPreservationGuestTransition(input), { status: "denied" });
  assert.deepEqual(calls, ["preflight", "arm", "recheck", "cleanup"]);

  const failedCleanup = harness({
    recheck: () => false,
    cleanup: async () => "blocked",
  });
  assert.deepEqual(await runOwnerPreservationGuestTransition(failedCleanup.input), { status: "blocked", oracle: "blocked" });
  assert.equal(failedCleanup.calls.includes("transition"), false);
});

test("allowed command arms once, holds the shared lock through transition, and returns pending", async () => {
  const lock = createGuestTransitionLock();
  let releaseTransition!: () => void;
  const transition = new Promise<void>((resolve) => { releaseTransition = resolve; });
  const { calls, input } = harness({ lock, beginTransition: async () => { calls.push("transition"); await transition; } });

  const first = runOwnerPreservationGuestTransition(input);
  await new Promise<void>((resolve) => setImmediate(resolve));
  const concurrentCalls: string[] = [];
  const concurrent = await runOwnerPreservationGuestTransition({
    ...input,
    preflight: () => { concurrentCalls.push("preflight"); return true; },
    arm: async () => { concurrentCalls.push("arm"); return "unchanged"; },
    beginTransition: async () => { concurrentCalls.push("transition"); },
  });
  assert.deepEqual(concurrent, { status: "denied" });
  assert.deepEqual(concurrentCalls, []);

  releaseTransition();
  assert.deepEqual(await first, { status: "pending", oracle: "armed" });
  assert.deepEqual(calls, ["preflight", "arm", "recheck", "transition"]);

  const next = harness({ lock });
  assert.deepEqual(await runOwnerPreservationGuestTransition(next.input), { status: "pending", oracle: "armed" });
  assert.equal(next.calls.filter((call) => call === "transition").length, 1);
});

test("transition failure leaves the armed oracle record reportable", async () => {
  const { calls, input } = harness({ beginTransition: async () => { calls.push("transition"); throw new Error("reload_failed"); } });
  assert.deepEqual(await runOwnerPreservationGuestTransition(input), { status: "blocked", oracle: "blocked" });
  assert.equal(calls.includes("cleanup"), false);
  assert.deepEqual(calls, ["preflight", "arm", "recheck", "transition"]);
});

test("normal guest command winning the shared lock denies guarded command before its side effects", async () => {
  const lock = createGuestTransitionLock();
  const order: string[] = [];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const normal = runWithGuestTransitionLock(lock, "denied", async () => { order.push("normal"); await pending; return "normal"; });
  await new Promise<void>((resolve) => setImmediate(resolve));
  const guarded = await runOwnerPreservationGuestTransition({
    ...harness().input,
    lock,
    preflight: () => { order.push("guarded-preflight"); return true; },
    arm: async () => { order.push("guarded-arm"); return "unchanged"; },
    beginTransition: async () => { order.push("guarded-transition"); },
  });
  assert.deepEqual(guarded, { status: "denied" });
  assert.deepEqual(order, ["normal"]);
  finish();
  assert.equal(await normal, "normal");
});

test("guarded guest command winning the shared lock denies normal command before its side effects", async () => {
  const lock = createGuestTransitionLock();
  const order: string[] = [];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const guarded = runOwnerPreservationGuestTransition({
    ...harness().input,
    lock,
    preflight: () => { order.push("guarded-preflight"); return true; },
    arm: async () => { order.push("guarded-arm"); return "unchanged"; },
    beginTransition: async () => { order.push("guarded-transition"); await pending; },
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  const normal = await runWithGuestTransitionLock(lock, "denied", async () => { order.push("normal"); return "normal"; });
  assert.equal(normal, "denied");
  assert.deepEqual(order, ["guarded-preflight", "guarded-arm", "guarded-transition"]);
  finish();
  assert.deepEqual(await guarded, { status: "pending", oracle: "armed" });
});
