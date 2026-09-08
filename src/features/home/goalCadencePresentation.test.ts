import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
const settings = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const navigationTypes = readFileSync("src/navigation/types.ts", "utf8");
const repositoryIndex = readFileSync("src/storage/repositories/index.ts", "utf8");

test("goal cadence is a reachable root route backed by the canonical repository", () => {
  assert.match(navigator, /name=\{ROUTES\.GOAL_CADENCE\}[\s\S]*?component=\{GoalCadenceScreen\}/);
  assert.match(repositoryIndex, /export \* from "\.\/goalRepository"/);
  assert.match(screen, /loadGoal\(savedTrackId\)/);
  assert.match(screen, /persistGoal\(nextGoal\)/);
  assert.match(screen, /style=\{styles\.title\}[^>]*>\{t\("Goal"\)\}/);
  assert.match(navigator, /title: t\("Goal"\)/);
  assert.doesNotMatch(screen + navigator, /Goal & cadence|Goal and cadence/);
  assert.match(screen, /normalizeGoalRecord\(\{/);
  assert.match(screen, /<ChoiceRow|accessibilityRole="radio"/);
  assert.match(screen, /Preferred days/);
  assert.match(screen, /Choose at least one practice day\./);
  assert.match(screen, /weeklySessionTarget: preferredDays\.length/);
  assert.doesNotMatch(screen, /No preferred days/);
  assert.doesNotMatch(screen, /stepper|onSetWeeklyTarget|Weekly cadence|Sessions per week|Decrease sessions per week|Increase sessions per week/);
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
  assert.match(home, /onOpenGoal=\{\(\) => navigation\.navigate\(ROUTES\.GOAL_CADENCE, \{ returnTo: "progress", trackId: activeTrack\.id \}\)\}/);
});

test("Settings opens the shared goal screen with its return context", () => {
  assert.match(navigationTypes, /GOAL_CADENCE\]: \{ trackId\?: TrackId; returnTo\?: GoalCadenceReturnTo \}/);
  assert.match(settings, /onOpenGoal: \(\) => void/);
  assert.match(settings, /onPress=\{onOpenGoal\}/);
  assert.match(settings, /testID="settings-goal"/);
  assert.match(home, /onOpenGoal=\{\(\) => navigation\.navigate\(ROUTES\.GOAL_CADENCE, \{ returnTo: "settings", trackId: activeTrack\.id \}\)\}/);
  assert.match(screen, /const returnTo: GoalCadenceReturnTo = route\.params\?\.returnTo === "settings" \? "settings" : "progress"/);
  assert.match(screen, /const context = t\(returnTo === "settings" \? "Settings" : "Progress"\)/);
  assert.match(screen, /navigation\.canGoBack\(\)/);
  assert.match(screen, /navigation\.navigate\(ROUTES\.HOME, \{ initialTab: returnTo \}\)/);
  assert.match(screen, /<GoalLoadingSkeleton context=\{context\} onBack=\{handleBack\} \/>/);
  assert.match(screen, /style=\{styles\.context\}\>\{context\}</);
});

test("active goal summary only exposes Save while editing", () => {
  assert.match(screen, /footer=\{editing \? \([\s\S]*?\) : null\}/);
  assert.match(screen, /\{t\(goal \? "Save changes" : "Save goal"\)\}/);
  assert.match(screen, /onEdit=\{\(\) => \{ setDraft/);
  assert.match(screen, /onTogglePause=\{\(\) => \{ void togglePause\(\); \}\}/);
});

test("goal loading keeps its back action separate from the busy content announcement", () => {
  assert.match(screen, /export function GoalLoadingSkeleton\(\{ context, onBack \}/);
  assert.match(screen, /header=\{\(/);
  assert.match(screen, /<IconButton/);
  assert.match(screen, /onPress=\{onBack\}/);
  assert.match(screen, /accessibilityRole="progressbar"[\s\S]*?accessibilityState=\{\{ busy: true \}\}/);
  assert.match(screen, /<View accessible=\{false\} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style=\{styles\.loadingShapes\}>/);
  assert.match(screen, /if \(loading\) return <GoalLoadingSkeleton context=\{context\} onBack=\{handleBack\} \/>/);
  const pendingBranch = screen.slice(screen.indexOf("if (loading)"), screen.indexOf("if (loadError"));
  assert.doesNotMatch(pendingBranch, /scroll=\{false\}/);
});
