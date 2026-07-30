import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/SelectTrackScreen.tsx", "utf8");
const bootstrap = readFileSync(".maestro/rc-algorithms-bootstrap.yaml", "utf8");

test("track selection stacks dense rows and actions instead of clipping large text", () => {
  assert.match(source, /const \{ fontScale \} = useWindowDimensions\(\)/);
  assert.match(source, /const largeText = fontScale >= 1\.3/);
  assert.match(source, /largeText \? styles\.trackMetaRowLargeText : null/);
  assert.match(source, /largeText \? styles\.progressHeaderLargeText : null/);
  assert.match(source, /largeText \? styles\.actionsLargeText : null/);
  assert.match(source, /largeText \? styles\.actionButtonLargeText : null/);
  assert.match(source, /actionsLargeText:\s*\{\s*flexDirection: "column"/);
  assert.match(source, /actionButtonLargeText:\s*\{\s*flex: 0,\s*width: "100%"/);
});

test("Algorithms bootstrap accepts a reachable large-text control without requiring full card visibility", () => {
  assert.match(bootstrap, /centerElement: false/);
  assert.match(bootstrap, /visibilityPercentage: 50/);
});
