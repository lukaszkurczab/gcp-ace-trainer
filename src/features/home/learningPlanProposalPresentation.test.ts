import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/LearningPlanProposalScreen.tsx", "utf8");
const goal = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const routes = readFileSync("src/navigation/types.ts", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("learning plan proposal route carries identity only and resolves the in-memory proposal", () => {
  assert.match(routes, /LEARNING_PLAN_PROPOSAL\]: \{ proposalId: string; trackId: TrackId \}/);
  assert.match(navigator, /name=\{ROUTES\.LEARNING_PLAN_PROPOSAL\}[\s\S]*?component=\{LearningPlanProposalScreen\}/);
  assert.match(screen, /learningPlanProposalCoordinator\.resolve\(proposalId, trackId\)/);
  assert.match(screen, /navigation\.replace\(ROUTES\.LEARNING_PLAN_PROPOSAL, \{ proposalId: result\.proposal\.proposalId, trackId \}\)/);
  assert.doesNotMatch(routes, /LEARNING_PLAN_PROPOSAL\]:[^\n]*(outcome|goalRevision|contentVersion|packagePin|timezone)/);
});

test("proposal UI exposes all explicit states without claiming ODK-029 edit or acceptance", () => {
  for (const state of ["loading", "stale", "no_goal", "goal_paused", "package_error", "package_unavailable", "generator_error", "shortfall", "shortened", "ready"]) {
    assert.match(screen, new RegExp(state));
  }
  assert.match(screen, /runtimeSelectors\.learningPlan\.update\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.adjustGoal\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.backToPractice\(\)/);
  assert.doesNotMatch(screen, />\{t\("(?:Accept|Edit) plan"\)\}</);
});

test("goal save opens a real proposal only after reminder reconciliation", () => {
  const reminder = goal.indexOf("await reconcileDeviceReminder(reminderCopy)");
  const proposal = goal.indexOf("await createAndOpenPlan(track.id)");
  assert.ok(reminder >= 0 && proposal > reminder);
  assert.match(goal, /learningPlanProposalCoordinator\.create\(selectedTrackId\)/);
  assert.match(goal, /runtimeSelectors\.learningPlan\.create\(\)/);
  assert.match(goal, /disabled=\{goal\.status === "paused"\}/);
});

test("proposal copy uses its EN and PL namespace and supports 200 percent text", () => {
  assert.match(screen, /useTranslation\("learningPlan"\)/);
  assert.match(screen, /maxFontSizeMultiplier=\{2\}/);
  assert.match(screen, /footerVariant="sticky"/);
  assert.doesNotMatch(screen, /numberOfLines=/);
});
