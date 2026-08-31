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

test("track cards use the canonical Figma icon mapping for every active track", () => {
  assert.match(source, /\[CODING_INTERVIEW_TRACK_ID\]: "route"/);
  assert.match(source, /\[GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID\]: "server-stack"/);
  assert.match(source, /\[BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID\]: "database"/);
  assert.match(source, /\[OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID\]: "grid"/);
  assert.match(source, /\[FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID\]: "device-phone"/);
  assert.match(source, /\[AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID\]: "cloud"/);
  assert.match(source, /\[MICROSOFT_AZURE_ADMINISTRATOR_ASSOCIATE_AZ_104_TRACK_ID\]: "settings"/);
  assert.match(source, /\[MICROSOFT_AZURE_AI_FUNDAMENTALS_AI_901_TRACK_ID\]: "cpu"/);
  assert.match(source, /No canonical icon is registered for track/);
  assert.match(source, /color=\{palette\.primary\} name=\{icon\}/);
  assert.match(source, /trackIcon:\s*\{[\s\S]*?backgroundColor: palette\.surfaceInput[\s\S]*?borderColor: palette\.primary/);
});

test("track selection mirrors the Figma returning and switching footer states", () => {
  assert.match(source, /const \[activeTrackId, setActiveTrackId\]/);
  assert.match(source, /const showFooter = !loaded \|\| onboarding \|\| selectedTrackId !== activeTrackId/);
  assert.match(source, /onboarding \? "Start track" : "Use this track"/);
  assert.match(source, /placement="back"/);
  assert.match(source, /footerVariant="sticky"/);
  assert.match(source, /footerContent:\s*\{\s*gap: 14[\s\S]*?paddingBottom: spacing\.xs/);
  assert.match(source, /trackList:\s*\{\s*gap: spacing\.sm\s*\}/);
  assert.match(source, /title=\{t\(track\.shortTitle\)\}/);
  assert.match(source, /accessibilityLabel=\{\[title, t\(track\.description\)\]\.join\("\. "\)\}/);
  assert.match(source, /trackCard:\s*\{[\s\S]*?minHeight: 68/);
});
