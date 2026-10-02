import assert from "node:assert/strict";
import test from "node:test";

import { LEARNING_PLAN_PROPOSAL_FIXTURE_CASES, LEARNING_PLAN_PROPOSAL_FIXTURE_URL, nextLearningPlanProposalFixtureLaunch, parseLearningPlanProposalFixtureUrl } from "./learningPlanProposalFixtureCommand";

const ready = `${LEARNING_PLAN_PROPOSAL_FIXTURE_URL}?case=ready3-no-target`;

test("learning plan fixture URL accepts only the explicit development smoke case enum", () => {
  assert.deepEqual(LEARNING_PLAN_PROPOSAL_FIXTURE_CASES, [
    "ready3-no-target", "ready1-target", "ready7-target", "shortened", "shortfall",
    "quality-unmet-target", "quality-unmet-open-ended",
    "delayed-loading", "stale", "unavailable", "accept-validation", "accept-stale", "edit-storage", "edit-stale",
  ]);
  assert.equal(parseLearningPlanProposalFixtureUrl(ready, true), "ready3-no-target");
  for (const url of [null, "", `${LEARNING_PLAN_PROPOSAL_FIXTURE_URL}?case=unknown`, `${ready}&case=stale`, `${ready}&anything=true`, `${ready}#fragment`, `com.lkurczab.patternly:/audit/learning-plan-proposal?case=ready3-no-target`, `https://example.test/audit/learning-plan-proposal?case=ready3-no-target`]) {
    assert.equal(parseLearningPlanProposalFixtureUrl(url, true), null, String(url));
  }
  for (const scenario of LEARNING_PLAN_PROPOSAL_FIXTURE_CASES) {
    const url = `${LEARNING_PLAN_PROPOSAL_FIXTURE_URL}?case=${scenario}`;
    assert.equal(parseLearningPlanProposalFixtureUrl(url, true), scenario);
    assert.equal(parseLearningPlanProposalFixtureUrl(url, false), null);
  }
});

test("reopening the same fixture URL creates a fresh launch identity", () => {
  const scenario = parseLearningPlanProposalFixtureUrl(ready, true)!;
  const first = nextLearningPlanProposalFixtureLaunch(null, scenario);
  const second = nextLearningPlanProposalFixtureLaunch(first, scenario);
  assert.deepEqual(first, { scenario, launchId: 1 });
  assert.deepEqual(second, { scenario, launchId: 2 });
});
