import assert from "node:assert/strict";
import test from "node:test";
import { areDesignSimulationStagesComplete } from "./designInterviewSimulationFacade";

test("manual Design Simulation completion requires every non-empty stage", () => {
  assert.equal(areDesignSimulationStagesComplete({ requirements: true, architecture: true, tradeoffs: true, final_answer: true }), true);
  for (const missing of ["requirements", "architecture", "tradeoffs", "final_answer"] as const) {
    assert.equal(areDesignSimulationStagesComplete({ requirements: true, architecture: true, tradeoffs: true, final_answer: true, [missing]: false }), false);
  }
});
