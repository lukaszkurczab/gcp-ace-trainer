import assert from "node:assert/strict";
import test from "node:test";

import { createCooperativeSlice } from "./cooperativeSlice";

function busy(ms: number): void { const end = performance.now() + ms; while (performance.now() < end) { /* simulated synchronous work */ } }

test("a short operation never leaves the current macrotask", async () => {
  const yieldPoint = createCooperativeSlice(50);
  let timerRan = false;
  setTimeout(() => { timerRan = true; }, 0);
  for (let step = 0; step < 5; step += 1) { busy(1); await yieldPoint(); }
  assert.equal(timerRan, false);
});

test("a long operation yields once its budget is spent, letting timers run", async () => {
  const yieldPoint = createCooperativeSlice(20);
  let timerRan = false;
  setTimeout(() => { timerRan = true; }, 0);
  busy(25);
  await yieldPoint();
  assert.equal(timerRan, true);
});
