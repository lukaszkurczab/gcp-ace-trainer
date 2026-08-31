import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/HomeScreen.tsx", "utf8");

test("choosing the first track reloads Home data for that selected track", () => {
  assert.match(source, /const \[shellReload, setShellReload\] = useState\(0\)/);
  assert.match(source, /\}, \[shellReload\]\),/);
  assert.match(source, /onTrackSelected=\{\(trackId\) => \{\s*setActiveTrackId\(trackId\);\s*setShellReload\(\(reload\) => reload \+ 1\);/);
});

test("the first Home visit replaces repeated empty metrics with one honest next-step state", () => {
  const homeTab = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");

  assert.match(homeTab, /const isFirstUse = !hasActiveSession && trainingAttempts\.length === 0 && reviewQueueItems\.length === 0/);
  assert.match(homeTab, /hasActiveSession \|\| isFirstUse \? null/);
  assert.match(homeTab, /Your learning starts here/);
  assert.match(homeTab, /Complete your first session to see progress and activity here\./);
  assert.match(homeTab, /\{!isFirstUse \? <View style=\{styles\.overviewSection\}/);
  assert.match(homeTab, /firstUseState:\s*\{[\s\S]*?backgroundColor: palette\.surface/);
});
