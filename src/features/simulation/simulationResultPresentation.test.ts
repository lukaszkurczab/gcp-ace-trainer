import assert from "node:assert/strict";
import test from "node:test";

import { resolveSimulationResultResolution } from "./simulationProjection";

test("simulation result presentation distinguishes pending, verified, scoreless, and rejected reads", () => {
  assert.equal(resolveSimulationResultResolution(null, null), "pending");
  assert.equal(resolveSimulationResultResolution({ score: { correctCount: 1 } }, null), "verified");
  assert.equal(resolveSimulationResultResolution({ score: null }, null), "scoreless");
  assert.equal(resolveSimulationResultResolution(null, "verification failed"), "failed");
});
