import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/ActivityScreen.tsx", "utf8");

test("Activity renders unavailable history as an explicit detail surface without runtime navigation", () => {
  assert.match(source, /loadActivityRecords/);
  assert.match(source, /if \(item\.kind === "unavailable"\)/);
  assert.match(source, /setSelectedUnavailableSessionId/);
  assert.match(source, /runtimeSelectors\.activity\.unavailableRow/);
  assert.match(source, /runtimeSelectors\.activity\.unavailableDetails/);
  assert.match(source, /This archived session cannot be reopened/);
  assert.match(source, /navigateToActivityResult\(navigation, item\)/);
});
