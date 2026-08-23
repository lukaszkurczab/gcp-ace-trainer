import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const repositoryIndex = readFileSync("src/storage/repositories/index.ts", "utf8");

test("goal cadence is a reachable root route backed by the canonical repository", () => {
  assert.match(navigator, /name=\{ROUTES\.GOAL_CADENCE\}[\s\S]*?component=\{GoalCadenceScreen\}/);
  assert.match(repositoryIndex, /export \* from "\.\/goalRepository"/);
  assert.match(screen, /loadGoal\(savedTrackId\)/);
  assert.match(screen, /persistGoal\(nextGoal\)/);
  assert.match(screen, /<ChoiceRow|accessibilityRole="radio"/);
  assert.match(screen, /Weekly cadence/);
  assert.match(screen, /Preferred days/);
  assert.match(screen, /Managed in notification settings/);
  assert.match(screen, /status === "paused"/);
  assert.doesNotMatch(screen, /getKeyValueStorage|MMKV/);
});

test("Progress owns the goal entry point for the active track", () => {
  assert.match(progress, /onOpenGoal\?: \(\) => void/);
  assert.match(progress, /testID=\{runtimeSelectors\.progress\.goal\(\)\}/);
  assert.match(progress, /goal \? "View goal" : "Set a goal"/);
});
