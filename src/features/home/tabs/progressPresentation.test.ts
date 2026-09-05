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
