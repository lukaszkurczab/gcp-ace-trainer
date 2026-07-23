import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCanonicalSimulationNavigator,
  mayRenderSimulationCompletion,
  SIMULATION_OCCURRENCE_COUNT,
} from "../src/features/simulation/simulationViewModel";
import type { SimulationNavigatorPosition, SimulationSurfaceProjection } from "../src/features/simulation/simulationProjection";

function navigator(): readonly SimulationNavigatorPosition[] {
  return Array.from({ length: SIMULATION_OCCURRENCE_COUNT }, (_, index) => ({ occurrenceId: `occurrence-${index + 1}`, state: index === 0 ? "current" as const : index % 2 ? "answered" as const : "unanswered" as const }));
}

function projection(state: SimulationSurfaceProjection["state"], completion?: SimulationSurfaceProjection["completion"]): SimulationSurfaceProjection {
  return { state, title: "Interview Simulation", ...(completion ? { completion } : {}) };
}

test("Simulation navigator accepts only exactly forty unique occurrence identities", () => {
  assert.equal(hasCanonicalSimulationNavigator(navigator()), true);
  assert.equal(hasCanonicalSimulationNavigator(navigator().slice(0, 39)), false);
  assert.equal(hasCanonicalSimulationNavigator([...navigator().slice(0, 39), navigator()[0]!]), false);
});

test("Simulation completion metrics are withheld before the verified completed projection", () => {
  const completion = { answeredCount: 40, correctCount: 10, earnedPoints: 10, incorrectCount: 20, maxPoints: 40, partialCount: 10, unansweredCount: 0 };
  assert.equal(mayRenderSimulationCompletion(projection("finalizing", completion)), false);
  assert.equal(mayRenderSimulationCompletion(projection("completed", completion)), true);
  assert.equal(mayRenderSimulationCompletion(projection("completed")), false);
});
