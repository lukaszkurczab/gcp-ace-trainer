import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");

test("track evidence rows stay informational while local show-more behavior remains", () => {
  assert.doesNotMatch(progress, /trackEvidenceChevron/);
  assert.doesNotMatch(progress, /<Text[^>]*>\s*›\s*<\/Text>/);
  assert.match(progress, /const \[showAllTrackNodes, setShowAllTrackNodes\] = useState\(false\);/);
  assert.match(progress, /onPress=\{\(\) => setShowAllTrackNodes\(\(current\) => !current\)\}/);
  assert.match(progress, /showAllTrackNodes \? "Show fewer track areas" : "View all track evidence"/);
});

test("empty progress keeps practice as the primary action and exposes global activity", () => {
  const emptyBranch = progress.slice(progress.indexOf("!model.hasData"), progress.indexOf(") : (", progress.indexOf("!model.hasData")));
  assert.match(emptyBranch, /t\("Open Practice"\)/);
  assert.match(progress, /onOpenPractice\?: \(\) => void/);
  assert.match(emptyBranch, /\) : onOpenPractice \? \(/);
  assert.match(emptyBranch, /onPress=\{onOpenPractice\}/);
  assert.match(emptyBranch, /onOpenActivity && model\.activity\.length === 0/);
  assert.match(emptyBranch, /model\.activity\.length > 0 \? <ActivitySection/);
  assert.match(progress, /onOpenActivityItem\?: \(item: ActivityItem\) => void/);
  assert.match(emptyBranch, /testID=\{runtimeSelectors\.progress\.activity\(\)\}/);
  assert.match(emptyBranch, /t\("View all activity"\)/);
});

test("the shared Home shell opens the track-aware Practice Hub from empty Progress", () => {
  const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  assert.match(home, /<ProgressTab[\s\S]*?onOpenPractice=\{\(\) => navigation\.navigate\(ROUTES\.PRACTICE_HUB\)\}/);
});

test("Home passes canonical sessions and exact row navigation into Progress", () => {
  const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  assert.match(home, /loadActivitySessionRecords\(\{ getAttempts: \(\) => trainingAttemptsRead \}\)/);
  const props = home.slice(home.indexOf("<ProgressTab"), home.indexOf("/>", home.indexOf("<ProgressTab")));
  assert.match(props, /activityRecords=\{data\.activityRecords\}/);
  assert.match(props, /onOpenActivityItem=\{\(item\) => navigateToActivityResult\(navigation, item\)\}/);
});

test("Progress receives the single canonical Home plan snapshot and guidance action owner", () => {
  const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
  const props = home.slice(home.indexOf("<ProgressTab"), home.indexOf("/>", home.indexOf("<ProgressTab")));
  assert.match(props, /homePlan=\{data\.homePlan\}/);
  assert.match(props, /onHomePlanAction=\{\(action\) => \{ void handleHomePlanAction\(action, data\.homePlan!, "progress"\); \}\}/);
  assert.match(progress, /buildProgressPlanPresentationModel\(\{ snapshot: homePlan, activeTrackId: activeTrack\.id, locale \}\)/);
  assert.match(progress, /runtimeSelectors\.targetDateGuidance\.root\("progress"\)/);
  assert.match(progress, /runtimeSelectors\.progressPlan\.completion\(model\.completion\.kind\)/);
  assert.match(home, /navigation\.navigate\(ROUTES\.PRACTICE_SETUP, buildHomePlanPracticeSetupParams\(homePlan, selectedTrackId\)\)/);
});

test("Completed guidance does not render a Progress self-link", () => {
  const model = readFileSync("src/features/home/progressPlanPresentationModel.ts", "utf8");
  assert.match(model, /hasActiveSession && \(primary\.kind === "continue_plan" \|\| primary\.kind === "start_next_session"\)/);
});
