import assert from "node:assert/strict";
import test from "node:test";

import { createAccountForegroundRefreshScheduler, type AccountForegroundRefreshIntent } from "./accountForegroundRefresh";

type Intent = AccountForegroundRefreshIntent;

async function settle() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

test("foreground scheduler coalesces duplicate active events and runs a newer return after the current refresh", async () => {
  let currentGeneration = 1;
  let release: (() => void) | undefined;
  const calls: number[] = [];
  const scheduler = createAccountForegroundRefreshScheduler<Intent>({
    isCurrent: (intent) => intent.uid === "uid-a" && intent.generation === currentGeneration,
    refresh: async (intent) => {
      calls.push(intent.generation);
      if (intent.generation === 1) await new Promise<void>((resolve) => { release = resolve; });
    },
  });
  const first = { generation: 1, uid: "uid-a" } as const;
  scheduler.request(first);
  scheduler.request(first);
  await settle();
  assert.deepEqual(calls, [1]);

  currentGeneration = 2;
  scheduler.request({ generation: 2, uid: "uid-a" });
  scheduler.request({ generation: 2, uid: "uid-a" });
  release?.();
  await settle();
  assert.deepEqual(calls, [1, 2]);
});

test("foreground scheduler cleanup cancels queued work and drops stale intents", async () => {
  let currentGeneration = 1;
  let release: (() => void) | undefined;
  let calls = 0;
  const scheduler = createAccountForegroundRefreshScheduler<Intent>({
    isCurrent: (intent) => intent.generation === currentGeneration,
    refresh: async () => {
      calls += 1;
      await new Promise<void>((resolve) => { release = resolve; });
    },
  });
  scheduler.request({ generation: 1, uid: "uid-a" });
  await settle();
  currentGeneration = 2;
  scheduler.request({ generation: 2, uid: "uid-a" });
  scheduler.dispose();
  release?.();
  await settle();
  assert.equal(calls, 1);
});
