import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/review/MistakesReviewScreen.tsx", "utf8");

test("Review presents unavailable entries in a separate section with scoped removal confirmation", () => {
  assert.match(source, /runtimeSelectors\.review\.unavailableSection\(\)/);
  assert.match(source, /runtimeSelectors\.review\.unavailableRow\(row\.id\)/);
  assert.match(source, /model\.unavailableRows\.length > 0/);
  assert.match(source, /removeUnavailableReview\(selectedRow\.id\)/);
  assert.match(source, /runtimeSelectors\.review\.removeUnavailableConfirm\(row\.id\)/);
  assert.match(source, /Other unavailable reviews will remain/);
  assert.match(source, /selectedRow\.kind !== "unavailable"/);
});
