import assert from "node:assert/strict";
import test from "node:test";

import { willAnswerEverySimulationOccurrence } from "../src/features/simulation/simulationCompletion";

const projection = (answered: readonly string[]) => ({
  navigator: ["one", "two", "three"].map((occurrenceId, index) => ({ index, occurrenceId, answered: answered.includes(occurrenceId), current: false })),
});

test("the final durable Simulation response completes only when it fills the last unanswered occurrence", () => {
  assert.equal(willAnswerEverySimulationOccurrence(projection(["one", "two"]).navigator, "three"), true);
  assert.equal(willAnswerEverySimulationOccurrence(projection(["one"]).navigator, "two"), false);
  assert.equal(willAnswerEverySimulationOccurrence(projection(["one", "two"]).navigator, "missing"), false);
});
