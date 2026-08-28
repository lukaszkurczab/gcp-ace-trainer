import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { SimulationNavigatorPosition } from "./simulationProjection";
import { navigatorCellLabel, navigatorGridColumns, navigatorStateLabel, SIMULATION_NAVIGATOR_COLUMNS, SIMULATION_NAVIGATOR_LARGE_TEXT_COLUMNS } from "./navigator/navigatorPresentation";

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
  assert.equal(navigatorCellLabel(position("current"), 11, true), "Question 12, navigation unavailable while save recovers");
  assert.equal(navigatorStateLabel(position("answered")), "Saved");
  assert.equal(navigatorStateLabel(position("answered"), true), "Frozen");
  assert.match(source, /<Modal animationType=\{reduceMotion \? "none" : "slide"\}/);
  assert.match(source, /<ScrollView contentContainerStyle=\{styles\.grid\} style=\{styles\.gridScroll\}>/);
  assert.match(source, /position\.state !== "answered"/);
  assert.match(source, /height: columns === 5 \? 56 : 48/);
  assert.match(source, /width: columns === 5 \? 56 : 48/);
  assert.match(source, /cell:\s*\{[\s\S]*backgroundColor:\s*palette\.elevatedSurface/);
  assert.match(source, /cellText:\s*\{[\s\S]*fontSize:\s*12[\s\S]*lineHeight:\s*16/);
  assert.match(source, /frozenCell:\s*\{\s*borderColor:\s*palette\.border\s*\}/);
  assert.match(source, /<IconButton accessibilityLabel=/);
  assert.doesNotMatch(source, /Finish simulation/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /Complete the response before leaving this question\./);
  assert.match(source, /Couldn't save this response\./);
  assert.match(source, /Couldn't save this response\. Your current answer is still here\./);
  assert.match(source, /frozen=\{feedback\?\.kind === "save_failed"\}/);
  assert.match(source, /fullWidthAction/);
  assert.match(source, /name="alert-triangle"/);
  assert.match(source, /operationNotice:\s*\{[\s\S]*?borderRadius:\s*radius\.lg[\s\S]*?gap:\s*spacing\.md[\s\S]*?padding:\s*spacing\.lg/);
  assert.match(source, /saveFailureStack:\s*\{\s*gap:\s*spacing\.md/);
  assert.match(source, /Try again/);
});
