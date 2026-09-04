import assert from "node:assert/strict";
import test from "node:test";

import { createSimulationResultReadOwner } from "./simulationResultReadOwner";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, reject, resolve };
}

test("keyed result reads discard a previous request after the session changes", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  const owner = createSimulationResultReadOwner((requestKey) => requestKey === "A" ? first.promise : second.promise);
  const firstToken = owner.begin("A");
  const firstRead = owner.resolve(firstToken);
  const secondToken = owner.begin("B");
  first.resolve("A result");
  second.resolve("B result");

  assert.deepEqual(await firstRead, { kind: "stale" });
  assert.deepEqual(await owner.resolve(secondToken), { kind: "ready", result: "B result" });
});

test("focus loss and unmount invalidation prevent late read errors from publishing", async () => {
  const pending = deferred<string>();
  const owner = createSimulationResultReadOwner(() => pending.promise);
  const token = owner.begin("session");
  const read = owner.resolve(token);
  owner.invalidate(token);
  pending.reject(new Error("late read"));

  assert.deepEqual(await read, { kind: "stale" });
});

test("retry starts a new generation and publishes only its successful result", async () => {
  const first = deferred<string>();
  const retry = deferred<string>();
  const owner = createSimulationResultReadOwner((requestKey) => requestKey === "retry" && !firstSettled ? first.promise : retry.promise);
  let firstSettled = false;
  const firstToken = owner.begin("retry");
  const firstRead = owner.resolve(firstToken);
  firstSettled = true;
  const retryToken = owner.begin("retry");
  retry.resolve("fresh result");
  first.reject(new Error("superseded"));

  assert.deepEqual(await firstRead, { kind: "stale" });
  assert.deepEqual(await owner.resolve(retryToken), { kind: "ready", result: "fresh result" });
});

test("blur or unmount invalidates the latest retry token", async () => {
  const first = deferred<string>();
  const retry = deferred<string>();
  const owner = createSimulationResultReadOwner((requestKey) => requestKey === "first" ? first.promise : retry.promise);
  const firstToken = owner.begin("first");
  const firstRead = owner.resolve(firstToken);
  const retryToken = owner.begin("retry");
  const retryRead = owner.resolve(retryToken);
  owner.invalidate(retryToken);
  retry.resolve("late retry");
  first.reject(new Error("blurred"));

  assert.deepEqual(await firstRead, { kind: "stale" });
  assert.deepEqual(await retryRead, { kind: "stale" });
});

test("the current rejected result read stays an explicit error", async () => {
  const owner = createSimulationResultReadOwner(async () => { throw new Error("verification failed"); });
  const token = owner.begin("session");
  const outcome = await owner.resolve(token);

  assert.equal(outcome.kind, "error");
  if (outcome.kind === "error") assert.equal((outcome.error as Error).message, "verification failed");
});
