import assert from "node:assert/strict";
import test from "node:test";

import { DesignSimulationDraftDrain } from "./designSimulationDraftDrain";
import type { DesignSimulationStage } from "../../application/design-interview";

const requirements: DesignSimulationStage = "requirements";
const architecture: DesignSimulationStage = "architecture";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("rapid typing coalesces to the latest value", async () => {
  const writes: string[] = [];
  const drain = new DesignSimulationDraftDrain(async (_stage, value) => { writes.push(value); }, async () => undefined, () => undefined);

  await Promise.all([drain.request(requirements, "a"), drain.request(requirements, "ab"), drain.request(requirements, "abc")]);

  assert.deepEqual(writes, ["abc"]);
  assert.equal(drain.isSaved({ requirements: "abc" }), true);
});

test("an edit arriving during a write is persisted after it", async () => {
  const first = deferred<void>();
  const writes: string[] = [];
  const drain = new DesignSimulationDraftDrain(async (_stage, value) => {
    writes.push(value);
    if (value === "old") await first.promise;
  }, async () => undefined, () => undefined);

  const initial = drain.request(requirements, "old");
  const flushed = drain.flush();
  const latest = drain.request(requirements, "latest");
  first.resolve();
  await Promise.all([initial, latest, flushed]);

  assert.deepEqual(writes, ["old", "latest"]);
  assert.equal(drain.isSaved({ requirements: "latest" }), true);
});

test("one drain preserves dirty values for multiple stages", async () => {
  const writes: Array<[DesignSimulationStage, string]> = [];
  const drain = new DesignSimulationDraftDrain(async (stage, value) => { writes.push([stage, value]); }, async () => undefined, () => undefined);

  await Promise.all([drain.request(requirements, "scope"), drain.request(architecture, "queue")]);

  assert.deepEqual(writes, [[requirements, "scope"], [architecture, "queue"]]);
  assert.equal(drain.isSaved({ requirements: "scope", architecture: "queue" }), true);
});

test("failure retains dirty data and a later flush retries it", async () => {
  let attempts = 0;
  const drain = new DesignSimulationDraftDrain(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("storage unavailable");
  }, async () => undefined, () => undefined);

  await assert.rejects(drain.request(requirements, "response"), /storage unavailable/);
  assert.equal(drain.hasDirty(), true);
  assert.equal(drain.isSaved({ requirements: "response" }), false);
  await drain.flush();
  assert.equal(attempts, 2);
  assert.equal(drain.isSaved({ requirements: "response" }), true);
});

test("flush waits for the latest in-flight edit before resolving", async () => {
  const first = deferred<void>();
  const writes: string[] = [];
  const drain = new DesignSimulationDraftDrain(async (_stage, value) => {
    writes.push(value);
    if (value === "draft") await first.promise;
  }, async () => undefined, () => undefined);

  const request = drain.request(requirements, "draft");
  const initialFlush = drain.flush();
  const latest = drain.request(requirements, "finished draft");
  const flush = drain.flush();
  first.resolve();
  await Promise.all([request, initialFlush, latest, flush]);

  assert.deepEqual(writes, ["draft", "finished draft"]);
  assert.equal(drain.isSaved({ requirements: "finished draft" }), true);
});
