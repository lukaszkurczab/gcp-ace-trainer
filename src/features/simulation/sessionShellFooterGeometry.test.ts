import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/features/coding-interview/session/SessionShell.tsx", "utf8");

test("practice SessionShell uses natural action geometry while simulation keeps its fixed footer", () => {
  assert.doesNotMatch(shell, /SESSION_ACTION_FOOTER_CLEARANCE/);
  assert.match(shell, /const footer = isSimulationLayout && actionBar \? <View style=\{styles\.simulationActionRegion\}>\{actionBar\}<\/View> : actionBar;/);
  assert.match(shell, /simulationActionRegion:\s*\{\s*minHeight:\s*80/);
  assert.match(shell, /content:\s*\{[\s\S]*paddingTop:\s*spacing\.xxxl/);
  assert.match(shell, /contentSimulation:\s*\{[\s\S]*paddingBottom:\s*spacing\.lg[\s\S]*paddingTop:\s*spacing\.xl/);
  assert.match(shell, /topBar:\s*\{[\s\S]*paddingVertical:\s*spacing\.sm/);
  assert.match(shell, /topBarSimulation:\s*\{[\s\S]*paddingVertical:\s*0/);
  assert.match(shell, /footerVariant=\{layout === "practice" \? "session" : "simulation"\}/);
  const screen = readFileSync("src/components/Screen.tsx", "utf8");
  assert.match(screen, /footerVariant\?: "default" \| "review" \| "session" \| "simulation" \| "sticky"/);
  assert.match(screen, /footerSession:\s*\{[\s\S]*justifyContent:\s*"flex-end"[\s\S]*gap:\s*spacing\.sm[\s\S]*paddingVertical:\s*spacing\.md/);
  assert.doesNotMatch(screen, /footerSession:\s*\{[\s\S]*minHeight:\s*228/);
  assert.match(screen, /footerSimulation:\s*\{[\s\S]*justifyContent:\s*"flex-end"[\s\S]*minHeight:\s*361[\s\S]*gap:\s*spacing\.sm[\s\S]*paddingVertical:\s*spacing\.lg/);
  assert.match(shell, /progressTrack:\s*\{[\s\S]*borderRadius:\s*2[\s\S]*height:\s*4/);
  assert.match(shell, /progressFill:\s*\{[\s\S]*borderRadius:\s*2[\s\S]*height:\s*4/);
});
