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
