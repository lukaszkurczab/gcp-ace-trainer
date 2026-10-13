import test from "node:test";
import assert from "node:assert/strict";
import { createForegroundClockCapability, type BoundForegroundClockDriver } from "./foregroundClockCapability";

function setup() {
  let current = true;
  const calls: string[] = [];
  const driver = {
    read: () => { calls.push("read"); return "durable"; },
    apply: (_token: string, _before: string | undefined, after: string | undefined) => { calls.push("apply"); return after; },
    arm: () => { calls.push("arm"); }, enter: () => { calls.push("enter"); return "durable"; },
    checkpoint: () => { calls.push("checkpoint"); return "durable"; }, pause: () => { calls.push("pause"); return "durable"; },
    quiesce: () => { calls.push("quiesce"); return "durable"; },
    elapsed: () => { calls.push("elapsed"); return 1; }, metrics: () => '{"maxOutstandingMs":1,"maxWriteMs":0,"checkpointCount":1}', revoke: () => { calls.push("revoke"); },
  } satisfies BoundForegroundClockDriver;
  const capability = createForegroundClockCapability(driver, "test-generation:nonce", { physicalKey: "router-derived-test-key", profileId: "test-profile", generation: 2, isCurrent: () => current });
  return { capability, calls, driver, invalidate: () => { current = false; } };
}
test("a fenced profile capability rejects every timer operation before reaching native storage", () => {
  const { capability, calls, invalidate } = setup();
  assert.equal(capability.read(), "durable");
  invalidate();
  for (const operation of [() => capability.read(), () => capability.apply("before", "after"),
    () => capability.arm({ expectedRaw: "raw", familyId: "family", sessionId: "session", trackId: "track" }),
    () => capability.enter(), () => capability.checkpoint(), () => capability.pause(), () => capability.quiesce(), () => capability.elapsed(), () => capability.metrics()]) assert.throws(operation, /lease_stale/);
  assert.deepEqual(calls, ["read"]);
  capability.revoke();
  capability.revoke();
  assert.deepEqual(calls, ["read", "revoke"]);
});
test("an uncertain native revoke closes the capability and cannot be retried as a fresh effect", () => {
  const { driver, calls } = setup();
  driver.revoke = () => { calls.push("revoke"); throw new Error("uncertain native acknowledgement"); };
  const capability = createForegroundClockCapability(driver, "token", { physicalKey: "key", profileId: "profile", generation: 0, isCurrent: () => true });
  assert.throws(() => capability.revoke(), /uncertain native acknowledgement/);
  assert.throws(() => capability.enter(), /lease_stale/);
  capability.revoke();
  assert.deepEqual(calls, ["revoke"]);
});
test("the application capability is sealed and exposes no native binding or storage handle", () => {
  const { capability } = setup();
  assert.equal(Object.isFrozen(capability), true);
  assert.deepEqual(Object.keys(capability).sort(), ["apply", "arm", "checkpoint", "elapsed", "enter", "metrics", "pause", "quiesce", "read", "revoke"]);
});
