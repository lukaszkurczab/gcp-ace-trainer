import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCanonicalSimulationNavigator,
  mayRenderSimulationCompletion,
} from "../src/features/simulation/simulationViewModel";
import type { SimulationNavigatorPosition, SimulationSurfaceProjection } from "../src/features/simulation/simulationProjection";

function navigator(length: number): readonly SimulationNavigatorPosition[] {
  return Array.from({ length }, (_, index) => ({ occurrenceId: `occurrence-${index + 1}`, state: index === 0 ? "current" as const : index % 2 ? "answered" as const : "unanswered" as const }));
}

function projection(state: SimulationSurfaceProjection["state"], completion?: SimulationSurfaceProjection["completion"]): SimulationSurfaceProjection {
  return { state, title: "Interview Simulation", ...(completion ? { completion } : {}) };
}

test("Simulation navigator accepts complete unique projections for each supported session length", () => {
  assert.equal(hasCanonicalSimulationNavigator(navigator(40)), true);
  assert.equal(hasCanonicalSimulationNavigator(navigator(50)), true);
  assert.equal(hasCanonicalSimulationNavigator([]), false);
  assert.equal(hasCanonicalSimulationNavigator([...navigator(49), navigator(50)[0]!]), false);
});

test("Simulation completion metrics are withheld before the verified completed projection", () => {
  const completion = { answeredCount: 40, correctCount: 10, incorrectCount: 20, partialCount: 10, unansweredCount: 0 };
  assert.equal(mayRenderSimulationCompletion(projection("finalizing", completion)), false);
  assert.equal(mayRenderSimulationCompletion(projection("completed", completion)), true);
  assert.equal(mayRenderSimulationCompletion(projection("completed")), false);
});
