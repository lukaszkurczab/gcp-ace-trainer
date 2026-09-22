import assert from "node:assert/strict";
import test from "node:test";
import { createPremiumRefreshQueue } from "./premiumRefreshQueue";

test("Premium refreshes run in request order and continue after a failed provider read", async () => {
  const queue = createPremiumRefreshQueue();
  const events: string[] = [];
  let release: (() => void) | undefined;
  const first = queue.request(async () => {
    events.push("first:start");
    await new Promise<void>((resolve) => { release = resolve; });
    events.push("first:end");
    throw new Error("provider unavailable");
  });
  const second = queue.request(async () => { events.push("second"); return "fresh"; });
  await Promise.resolve();
  assert.deepEqual(events, ["first:start"]);
  release?.();
  await assert.rejects(first, /provider unavailable/u);
  assert.equal(await second, "fresh");
  assert.deepEqual(events, ["first:start", "first:end", "second"]);
});
