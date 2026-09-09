import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/LearningPlanProposalScreen.tsx", "utf8");
const goal = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const routes = readFileSync("src/navigation/types.ts", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("proposal route carries only identity and resolves the in-memory proposal", () => {
  assert.match(routes, /LEARNING_PLAN_PROPOSAL\]: \{ proposalId: string; trackId: TrackId \}/);
  assert.match(navigator, /name=\{ROUTES\.LEARNING_PLAN_PROPOSAL\}[\s\S]*?component=\{LearningPlanProposalScreen\}/);
  assert.match(screen, /learningPlanProposalCoordinator\.resolve\(proposalId, trackId\)/);
  assert.match(screen, /navigation\.replace\(ROUTES\.LEARNING_PLAN_PROPOSAL, \{ proposalId: result\.proposal\.proposalId, trackId \}\)/);
  assert.doesNotMatch(routes, /LEARNING_PLAN_PROPOSAL\]:[^\n]*(outcome|goalRevision|contentVersion|packagePin|timezone)/);
});

test("proposal accepts through the plan/reminder runtime and preserves pending saves", () => {
  assert.match(screen, /acceptPlanWithReminders\(proposalId, trackId, notification\)/);
  assert.doesNotMatch(screen, /learningPlanEditorCoordinator\.acceptProposal/);
  assert.match(screen, /plan_saved_reminders_synced/);
  assert.match(screen, /plan_saved_reminders_pending/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.retryReminders\(\)/);
  assert.match(screen, /retryPlanReminders\(notification\)/);
  assert.match(screen, /setState\(\{ kind: "stale" \}\)/);
});

test("proposal keeps explicit states, edit actions and localized copy", () => {
  for (const state of ["loading", "stale", "no_goal", "goal_paused", "package_error", "package_unavailable", "generator_error", "shortfall", "shortened", "ready"]) assert.match(screen, new RegExp(state));
  assert.match(screen, /learningPlanEditorCoordinator\.startProposalEdit/);
  assert.match(screen, /learningPlanEditorCoordinator\.startExistingEdit/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.actionError\(kind\)/);
  assert.match(screen, /useTranslation\("learningPlan"\)/);
  assert.match(screen, /footerVariant="sticky"/);
  assert.doesNotMatch(screen, /numberOfLines=/);
});

test("goal save still opens a proposal only after its existing reminder reconciliation", () => {
  const reminder = goal.indexOf("await reconcileDeviceReminder(reminderCopy)");
  const proposal = goal.indexOf("await createAndOpenPlan(track.id)");
  assert.ok(reminder >= 0 && proposal > reminder);
  assert.match(goal, /learningPlanProposalCoordinator\.create\(selectedTrackId\)/);
});
