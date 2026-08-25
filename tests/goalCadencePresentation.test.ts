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
  assert.match(screen, /header: \{ gap: spacing\.sm \}/);
  assert.match(screen, /trackContext[\s\S]*?statusRow/);
  assert.match(screen, /editing \? <Text[\s\S]*?: \([\s\S]*?statusRow/);
  assert.match(screen, /summaryCard:[\s\S]*?gap: 14[\s\S]*?padding: spacing\.lg/);
  assert.match(screen, /summaryDivider:[\s\S]*?height: StyleSheet\.hairlineWidth/);
  assert.match(screen, /dayBadges:[\s\S]*?gap: 6/);
  assert.match(screen, /dayBadge:[\s\S]*?backgroundColor: colorWithOpacity\(palette\.primary, 0\.12\)/);
  assert.doesNotMatch(screen, /getKeyValueStorage|MMKV/);
});

test("Progress owns the goal entry point for the active track", () => {
  assert.match(progress, /onOpenGoal\?: \(\) => void/);
  assert.match(progress, /testID=\{runtimeSelectors\.progress\.goal\(\)\}/);
  assert.match(progress, /goal \? "Manage goal" : "Set a goal"/);
});

test("active goal summary only exposes Save while editing", () => {
  assert.match(screen, /footer=\{editing \? \([\s\S]*?\) : null\}/);
  assert.match(screen, /\{t\(goal \? "Save changes" : "Save goal"\)\}/);
  assert.match(screen, /onEdit=\{\(\) => \{ setDraft/);
  assert.match(screen, /onTogglePause=\{\(\) => \{ void togglePause\(\); \}\}/);
});
