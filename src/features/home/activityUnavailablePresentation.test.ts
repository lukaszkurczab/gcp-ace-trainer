import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/ActivityScreen.tsx", "utf8");

test("Activity renders unavailable history as an explicit detail surface without runtime navigation", () => {
  assert.match(source, /loadActivityRecords/);
  assert.match(source, /item\.interaction\.kind === "toggle_unavailable_details"/);
  assert.match(source, /setSelectedUnavailableSessionId/);
  assert.match(source, /runtimeSelectors\.activity\.unavailableRow/);
  assert.match(source, /runtimeSelectors\.activity\.unavailableDetails/);
  assert.match(source, /This archived session cannot be reopened/);
  assert.match(source, /navigateToActivityResult\(navigation, item\)/);
});

test("Activity detail disclosures are mutually exclusive and expose expanded state", () => {
  assert.match(source, /setSelectedSessionDetailsId\(null\);[\s\S]*setSelectedUnavailableSessionId/);
  assert.match(source, /setSelectedUnavailableSessionId\(null\);[\s\S]*setSelectedSessionDetailsId/);
  assert.match(source, /accessibilityState=\{expanded === undefined \? undefined : \{ expanded \}\}/);
});
