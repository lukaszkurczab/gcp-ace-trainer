import assert from "node:assert/strict";
import test from "node:test";

import { createAdjustableWallClock } from "./bootstrap/trainingLifecycleComposition";

test("injected audit clock rejects an advance outside the ISO date range without changing its offset", () => {
  const base = new Date(8_640_000_000_000_000 - 1).toISOString();
  const clock = createAdjustableWallClock(() => base);

  assert.throws(() => clock.advanceBy(2), /valid ISO date range/);
  assert.equal(clock.now(), base);
});
