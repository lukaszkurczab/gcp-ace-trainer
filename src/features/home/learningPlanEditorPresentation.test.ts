import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/LearningPlanEditorScreen.tsx", "utf8");
const coordinator = readFileSync("src/application/learningPlan/LearningPlanEditorCoordinator.ts", "utf8");
const routes = readFileSync("src/navigation/types.ts", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("editor route carries only editor identity and never silently loads a plan", () => {
  assert.match(routes, /LEARNING_PLAN_EDITOR\]: \{ editorId: string; trackId: TrackId \}/);
  assert.match(navigator, /name=\{ROUTES\.LEARNING_PLAN_EDITOR\}[\s\S]*?component=\{LearningPlanEditorScreen\}/);
  assert.match(screen, /getSession\(editorId, trackId\)/);
  assert.doesNotMatch(screen, /getLearningPlanSnapshot|loadLearningPlanSnapshot/);
});

test("editor commits through the runtime wrapper and keeps reminder retry visible", () => {
  assert.match(screen, /commitPlanWithReminders\(editorId, trackId, notification\)/);
  assert.doesNotMatch(screen, /learningPlanEditorCoordinator\.commit\(/);
  assert.match(screen, /plan_saved_reminders_synced/);
  assert.match(screen, /plan_saved_reminders_pending/);
  assert.match(screen, /editorReminderPending\(\)/);
  assert.match(screen, /editorReminderRetry\(\)/);
  assert.match(screen, /retryPlanReminders\(notification\)/);
  assert.match(screen, /learningPlanEditorCoordinator\.startExistingEdit/);
  assert.match(screen, /source === "start-existing"/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorRetry\("start-existing"\)/);
  assert.match(screen, /The saved plan could not be loaded\. Try again\./);
  assert.match(screen, /setSavedPlan\(null\)[\s\S]*setState\(\{ kind: "stale" \}\)/);
  assert.match(screen, /useTranslation\("learningPlan"\)/);
  assert.doesNotMatch(coordinator, /validation_error[^\n]*message/);
});
