import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/HomeScreen.tsx", "utf8");

test("choosing the first track reloads Home data for that selected track", () => {
  assert.match(source, /const \[shellReload, setShellReload\] = useState\(0\)/);
  assert.match(source, /\}, \[shellReload\]\),/);
  assert.match(source, /onTrackSelected=\{\(trackId\) => \{\s*setActiveTrackId\(trackId\);\s*setShellReload\(\(reload\) => reload \+ 1\);/);
});

test("a failed Home shell read keeps the learner in a retryable state on the canonical load path", () => {
  assert.match(source, /setShellReadError\("We couldn't load your Patternly data\. Check your connection and try again\."\);/);
  assert.match(source, /<EmptyState actionLabel=\{t\("Try again"\)\} description=\{t\(shellReadError\)\} onActionPress=\{\(\) => setShellReload\(\(reload\) => reload \+ 1\)\} title=\{t\("Patternly is unavailable"\)} \/>/);
  assert.match(source, /useFocusEffect\([\s\S]*?\}, \[shellReload\]\),/);
});

test("Home focus retries only eligible pending account data and clears route tab suppression on local navigation", () => {
  assert.match(source, /useState<HomeShellTab>\(route\.params\?\.initialTab \?\? "home"\)/);
  assert.match(source, /if \(activeTab !== "home" \|\| \(initialRouteTabRef\.current !== null && initialRouteTabRef\.current !== "home"\)\) return undefined;/);
  assert.match(source, /if \(accountState\.kind !== "authenticated" \|\| accountState\.accountData\.status === "resumeRequired"\) return undefined;\s*void accountRef\.current\.retryPendingAccountSync\(\);/);
  assert.match(source, /\}, \[activeTab\]\),/);
  assert.match(source, /function handleHomeTabChange\(tab: HomeShellTab\) \{\s*initialRouteTabRef\.current = null;\s*setActiveTab\(tab\);/);
  assert.match(source, /function handleHomeTabChange\(tab: HomeShellTab\) \{[\s\S]*?navigation\.setParams\(\{ initialTab: tab \}\);/);
});

test("the first Home visit replaces repeated empty metrics with one honest next-step state", () => {
  const homeTab = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");

  assert.match(homeTab, /const isFirstUse = !hasActiveSession && trainingAttempts\.length === 0 && reviewQueueItems\.length === 0/);
  assert.match(homeTab, /hasActiveSession \|\| isFirstUse \? null/);
  assert.match(homeTab, /Your learning starts here/);
  assert.match(homeTab, /Complete your first session to see progress and activity here\./);
  assert.match(homeTab, /isFirstUse && !showGuestGoalOnboarding/);
  assert.match(homeTab, /\{!isFirstUse \? <View style=\{styles\.overviewSection\}/);
  assert.match(homeTab, /firstUseState:\s*\{[\s\S]*?backgroundColor: palette\.surface/);
});

test("guest goal onboarding stays optional, reloads after Goal, and persists dismissal per track", () => {
  const homeTab = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");
  const navigation = readFileSync("src/navigation/types.ts", "utf8");

  assert.match(source, /loadGoalOnboardingDismissed\(savedTrackId\)/);
  assert.match(source, /catch \{ goalOnboardingDismissed = true; \}/);
  assert.match(source, /account\.state\.kind === "guest" && data\.goal === null && !data\.goalOnboardingDismissed/);
  assert.match(source, /persistGoalOnboardingDismissal\(activeTrack\.id\)/);
  assert.match(source, /returnTo: "home", trackId: activeTrack\.id/);
  assert.match(navigation, /GoalCadenceReturnTo = "home" \| "progress" \| "settings"/);
  assert.match(homeTab, /testID=\{runtimeSelectors\.goalOnboarding\.root\(\)\}/);
  assert.match(homeTab, /runtimeSelectors\.home\.primaryAction\(\)/);
  assert.match(homeTab, /t\("Set a goal for this track"\)/);
  assert.match(homeTab, /t\("Choose when and why you want to practise \{\{trackName\}\}\."/);
  assert.match(homeTab, /testID=\{runtimeSelectors\.goalOnboarding\.setGoal\(\)\}/);
  assert.match(homeTab, /testID=\{runtimeSelectors\.goalOnboarding\.notNow\(\)\}/);
  assert.match(homeTab, /We couldn't save this choice\. Try again\./);
  assert.match(homeTab, /minHeight: 44/);
});
