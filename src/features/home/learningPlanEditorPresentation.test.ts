import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/LearningPlanEditorScreen.tsx", "utf8");
const coordinator = readFileSync("src/application/learningPlan/LearningPlanEditorCoordinator.ts", "utf8");
const routes = readFileSync("src/navigation/types.ts", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("editor route carries only editor identity and track and never silently loads a plan", () => {
  assert.match(routes, /LEARNING_PLAN_EDITOR\]: \{ editorId: string; trackId: TrackId \}/);
  assert.match(navigator, /name=\{ROUTES\.LEARNING_PLAN_EDITOR\}[\s\S]*?component=\{LearningPlanEditorScreen\}/);
  assert.match(screen, /getSession\(editorId, trackId\)/);
  assert.doesNotMatch(screen, /getLearningPlanSnapshot|loadLearningPlanSnapshot/);
});

test("editor exposes day/time editing, explicit stale and failure surfaces, and durable save action", () => {
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorDay\(day\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorTime\(slot\.day\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorCommit\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorRetry\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorRetry\("start-existing"\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorStale\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.editorError\("validation"\)/);
  assert.match(screen, /editorError\("start-existing-storage"\)/);
  assert.match(screen, /learningPlanEditorCoordinator\.commit/);
  assert.match(screen, /learningPlanEditorCoordinator\.startExistingEdit/);
  assert.match(screen, /The saved plan could not be loaded\. Try again\./);
  assert.match(screen, /source === "commit"/);
  assert.match(screen, /source === "start-existing"/);
  assert.match(screen, /SavedPlanView/);
  assert.match(screen, /setSavedPlan\(null\)[\s\S]*setState\(\{ kind: "stale" \}\)/);
  assert.match(screen, /learningPlanEditorCoordinator\.commit\(editorId, trackId\)/);
  assert.match(screen, /useTranslation\("learningPlan"\)/);
  assert.match(screen, /validationCopyKey\(result\.code\)/);
  assert.doesNotMatch(coordinator, /validation_error[^\n]*message/);
  assert.match(screen, /maxFontSizeMultiplier=\{2\}/);
  assert.doesNotMatch(screen, /numberOfLines=/);
});
