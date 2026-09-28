import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { addCleanupContext, awaitChildWithCleanup, childFailure, verifyProcessOwnership, waitForChildReadiness } from "./aud02dChildProcess.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

function makeChild() {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.spawnError = undefined;
  child.completion = new Promise((resolve) => { child.finish = resolve; });
  return child;
}

test("AUD-02D starts child before auth and records expired baseline before observation", async () => {
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  const body = runner.slice(runner.indexOf("async function runObservedNode"), runner.indexOf("function startObservedNode"));
  assert.ok(body.indexOf("startObservedNode(") < body.indexOf("smokeAuthContext()"));
  assert.ok(body.indexOf("waitForChildReadiness(") < body.indexOf("smokeAuthContext()"));
  assert.ok(body.indexOf('baseline.entitlement.state !== "expired"') < body.indexOf("observeBackendTransitions("));
  assert.match(body, /const outcome = await child\.completion;[\s\S]*?childWait = \{ outcome, timedOut: false/u);
  assert.match(body, /finally \{[\s\S]*?await observer\.stop\(\)[\s\S]*?awaitObservedChild\(child\)/u);
  assert.match(body, /assertBackendPortAvailable\(\);\s+const child = startObservedNode/u);
});

test("child readiness waits for readiness and races early completion", async () => {
  const child = makeChild();
  let polls = 0;
  const readiness = await waitForChildReadiness(child, async () => ++polls === 2 ? { status: "ready" } : null, { delayFn: async () => {} });
  assert.deepEqual(readiness, { status: "ready" });
  assert.equal(polls, 2);

  const exited = makeChild();
  exited.completion = Promise.resolve({ code: 17 });
  await assert.rejects(waitForChildReadiness(exited, async () => null), /exited before backend readiness.*17/u);
  const errored = makeChild();
  errored.completion = Promise.resolve({ error: new Error("spawn failed") });
  await assert.rejects(waitForChildReadiness(errored, async () => null), /spawn failed/u);
});

test("nonzero child completion remains a hard failure", () => {
  assert.match(childFailure({ code: 3 }, "Runner failed.").message, /Exit status: 3/u);
  assert.equal(childFailure({ code: 0 }, "Runner failed."), undefined);
});

test("bounded cleanup leaves a naturally completed child alone", async () => {
  const child = makeChild();
  child.finish({ code: 0 });
  let stopped = false;
  const result = await awaitChildWithCleanup(child, { completionTimeoutMs: 20, stopChild: async () => { stopped = true; } });
  assert.equal(result.timedOut, false);
  assert.deepEqual(result.outcome, { code: 0 });
  assert.equal(stopped, false);
});

test("timeout stops the child, its owned backend, then confirms port release", async () => {
  const child = makeChild();
  const calls = [];
  const result = await awaitChildWithCleanup(child, {
    completionTimeoutMs: 2,
    cleanupTimeoutMs: 10,
    stopChild: async () => { calls.push("child"); },
    stopOwnedBackend: async () => { calls.push("backend"); },
    confirmPortFree: async () => { calls.push("port-free"); },
  });
  assert.equal(result.timedOut, true);
  assert.deepEqual(calls, ["child", "backend", "port-free"]);
  assert.deepEqual(result.cleanupErrors, []);
});

test("cleanup is bounded and retains each cleanup failure", async () => {
  const child = makeChild();
  const result = await awaitChildWithCleanup(child, {
    completionTimeoutMs: 2,
    cleanupTimeoutMs: 2,
    stopChild: () => Promise.reject(new Error("kill denied")),
    stopOwnedBackend: () => new Promise(() => {}),
    confirmPortFree: () => Promise.reject(new Error("port remains occupied")),
  });
  assert.equal(result.timedOut, true);
  assert.deepEqual(result.cleanupErrors, [
    "stop child failed: kill denied",
    "stop owned backend timed out after 2ms",
    "confirm backend port release failed: port remains occupied",
  ]);
});

test("cleanup context keeps the original failure first", () => {
  const original = new Error("auth setup failed");
  const reported = addCleanupContext(original, "backend port remained occupied");
  assert.equal(reported, original);
  assert.match(reported.message, /^auth setup failed Cleanup context: backend port remained occupied$/u);
});

test("listener ownership requires a complete ancestry chain to the exact runner", async () => {
  const processes = new Map([
    [31, { parentPid: 22, groupId: 30 }],
    [22, { parentPid: 10, groupId: 22 }],
    [10, { parentPid: 1, groupId: 10 }],
  ]);
  const verified = await verifyProcessOwnership(31, 10, async (pid) => processes.get(pid));
  assert.deepEqual(verified, processes.get(31));
  await assert.rejects(verifyProcessOwnership(31, 99, async (pid) => processes.get(pid)), /not a descendant/u);
  await assert.rejects(verifyProcessOwnership(31, 10, async () => undefined), /Could not inspect/u);
  await assert.rejects(verifyProcessOwnership(31, 10, async (pid) => pid === 31
    ? { parentPid: 22, groupId: 30 }
    : { parentPid: 31, groupId: 22 }), /cycle/u);
});

test("backend signal uses only the group captured by successful ownership proof", async () => {
  const child = makeChild();
  const calls = [];
  const result = await awaitChildWithCleanup(child, {
    completionTimeoutMs: 2,
    cleanupTimeoutMs: 10,
    prepareOwnedBackendStop: async () => 77,
    stopChild: async () => { calls.push("child"); },
    stopOwnedBackend: async (groupId) => { calls.push(`backend:${groupId}`); },
    confirmPortFree: async () => { calls.push("port-free"); },
  });
  assert.equal(result.timedOut, true);
  assert.deepEqual(calls, ["child", "backend:77", "port-free"]);
});

test("failed backend ownership proof skips backend signal and reports secondary failure", async () => {
  const child = makeChild();
  const calls = [];
  const result = await awaitChildWithCleanup(child, {
    completionTimeoutMs: 2,
    cleanupTimeoutMs: 10,
    prepareOwnedBackendStop: async () => { throw new Error("foreign listener"); },
    stopChild: async () => { calls.push("child"); },
    stopOwnedBackend: async () => { calls.push("backend"); },
    confirmPortFree: async () => { calls.push("port-free"); },
  });
  assert.deepEqual(calls, ["child", "port-free"]);
  assert.deepEqual(result.cleanupErrors, ["verify backend ownership failed: foreign listener"]);
});
