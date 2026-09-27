import assert from "node:assert/strict";
import test from "node:test";
import { observedContentPreparationState, waitForContentPreparationState } from "./waitForContentPreparationState.mjs";

test("recognizes only an enumerated ContentPreparationGate state", () => {
  assert.equal(observedContentPreparationState('resource-id=patternly:content:unavailable;'), "patternly:content:unavailable");
  assert.equal(observedContentPreparationState('resource-id=patternly:content:preparing:resuming-session;'), "patternly:content:preparing:resuming-session");
  assert.equal(observedContentPreparationState('resource-id=patternly:content:audit-command-listener:ready;'), undefined);
  assert.equal(observedContentPreparationState('resource-id=patternly:profile-storage:state:unavailable;'), undefined);
  assert.equal(observedContentPreparationState('resource-id=patternly:content:unavailable-other;'), undefined);
});

test("waits through transient hierarchy failures and returns once a gate state is visible", async () => {
  let currentTime = 0;
  let reads = 0;
  const state = await waitForContentPreparationState({
    readHierarchy: () => {
      reads += 1;
      if (reads === 1) throw new Error("driver is starting");
      if (reads === 2) return "application splash";
      return "resource-id=patternly:content:ready;";
    },
    sleep: async (milliseconds) => { currentTime += milliseconds; },
    now: () => currentTime,
    timeoutMs: 1_000,
    pollIntervalMs: 250,
  });
  assert.equal(state, "patternly:content:ready");
  assert.equal(reads, 3);
});

test("fails closed at the bounded deadline when no gate state is visible", async () => {
  let currentTime = 0;
  await assert.rejects(
    waitForContentPreparationState({
      readHierarchy: () => "resource-id=patternly:home:root;",
      sleep: async (milliseconds) => { currentTime += milliseconds; },
      now: () => currentTime,
      timeoutMs: 1_000,
      pollIntervalMs: 400,
    }),
    /Timed out waiting for a recognized ContentPreparationGate hierarchy state after 1000 ms/,
  );
  assert.equal(currentTime, 1_000);
});
