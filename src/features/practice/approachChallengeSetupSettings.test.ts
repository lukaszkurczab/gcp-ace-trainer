import assert from "node:assert/strict";
import test from "node:test";
import { ALL_APPROACH_CHALLENGE_FAMILY_IDS, normalizeApproachChallengeSetupSettings } from "./approachChallengeSetupSettings";

test("first setup selects every family manually without a migration write", () => {
  const defaults = normalizeApproachChallengeSetupSettings();
  assert.equal(defaults.mode, "manual");
  assert.deepEqual(defaults.selectedFamilyIds, ALL_APPROACH_CHALLENGE_FAMILY_IDS);
  assert.ok(defaults.selectedFamilyIds.length > 0);
});

test("saved manual choices, including none, are not replaced by the first-use default", () => {
  for (const selectedFamilyIds of [[], ["prefix_sums"]]) {
    const saved = { mode: "manual" as const, requestedProblemCount: 10 as const, difficulties: ["hard"] as const, selectedFamilyIds };
    assert.deepEqual(normalizeApproachChallengeSetupSettings(saved), saved);
  }
});

test("legacy automatic settings become all-family manual setup while keeping length and difficulty", () => {
  const saved = { mode: "auto" as const, requestedProblemCount: 20 as const, difficulties: ["hard"] as const, selectedFamilyIds: ["prefix_sums"] };
  const copy = JSON.stringify(saved);
  const result = normalizeApproachChallengeSetupSettings(saved);
  assert.equal(result.mode, "manual");
  assert.equal(result.requestedProblemCount, 20);
  assert.deepEqual(result.difficulties, ["hard"]);
  assert.deepEqual(result.selectedFamilyIds, ALL_APPROACH_CHALLENGE_FAMILY_IDS);
  assert.equal(JSON.stringify(saved), copy);
});
