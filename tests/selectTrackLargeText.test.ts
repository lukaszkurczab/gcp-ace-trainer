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

test("track cards use the Figma route/server-stack icon pair and shared input tile", () => {
  assert.match(source, /coding \? "route" : cloud \? "server-stack"/);
  assert.match(source, /color=\{palette\.primary\} name=\{icon\}/);
  assert.match(source, /trackIcon:\s*\{[\s\S]*?backgroundColor: palette\.surfaceInput[\s\S]*?borderColor: palette\.primary/);
});

test("track selection mirrors the Figma returning and switching footer states", () => {
  assert.match(source, /const \[activeTrackId, setActiveTrackId\]/);
  assert.match(source, /const showFooter = !loaded \|\| onboarding \|\| selectedTrackId !== activeTrackId/);
  assert.match(source, /onboarding \? "Continue" : "Use this track"/);
  assert.match(source, /placement="back"/);
  assert.match(source, /footerContent:\s*\{\s*gap: 14[\s\S]*?paddingBottom: spacing\.sm/);
  assert.match(source, /trackList:\s*\{\s*gap: spacing\.md\s*\}/);
  assert.match(source, /trackSubtitle:\s*\{\s*color: palette\.textMuted[\s\S]*?fontSize: 11[\s\S]*?fontWeight: "400"[\s\S]*?lineHeight: 15\.4/);
});
