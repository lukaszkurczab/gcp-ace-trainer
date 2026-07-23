import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { SimulationNavigatorPosition } from "../src/features/simulation/simulationProjection";
import { navigatorCellLabel, navigatorGridColumns, navigatorStateLabel, SIMULATION_NAVIGATOR_COLUMNS, SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS } from "../src/features/simulation/navigator/navigatorPresentation";

const source = readFileSync("src/features/simulation/navigator/SimulationQuestionNavigator.tsx", "utf8");

function position(state: SimulationNavigatorPosition["state"]): SimulationNavigatorPosition {
  return { occurrenceId: `occurrence-${state}`, state };
}

test("simulation question navigator has the approved states, accessible labels, and large-text grid adaptation", () => {
  assert.equal(navigatorGridColumns(1), SIMULATION_NAVIGATOR_COLUMNS);
  assert.equal(navigatorGridColumns(1.3), SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS);
  assert.equal(navigatorCellLabel(position("current"), 11), "Question 12, current");
  assert.equal(navigatorCellLabel(position("answered"), 6), "Question 7, answered and saved");
  assert.equal(navigatorCellLabel(position("unanswered"), 17), "Question 18, unanswered");
  assert.equal(navigatorStateLabel(position("answered")), "Saved");
  assert.match(source, /<Modal animationType=\{reduceMotion \? "none" : "slide"\}/);
  assert.match(source, /minHeight: 48/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /Complete the response before leaving this question\./);
  assert.match(source, /Couldn't save this response\./);
  assert.match(source, /Try again/);
});
