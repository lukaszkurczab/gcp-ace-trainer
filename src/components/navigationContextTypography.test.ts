import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("navigation context owns the approved 16/22/600 semantic token", () => {
  const tokens = source("src/theme/tokens.ts");
  assert.match(tokens, /navigationContext:\s*\{\s*fontSize:\s*16,\s*lineHeight:\s*22,\s*fontWeight:\s*"600",\s*\}/);
});

test("shared and goal headers preserve long context at 200 percent text", () => {
  const files = [
    "src/components/ScreenHeader.tsx",
    "src/components/AppShellHeader.tsx",
    "src/components/ReviewShell.tsx",
    "src/components/ReviewLoadingSkeleton.tsx",
    "src/features/home/GoalCadenceScreen.tsx",
  ].map(source);

  for (const file of files) {
    assert.match(file, /\.\.\.typography\.navigationContext/);
    assert.match(file, /maxFontSizeMultiplier=\{2\}/);
    assert.match(file, /numberOfLines=\{2\}/);
    assert.match(file, /ellipsizeMode="clip"/);
    assert.match(file, /color:\s*palette\.textPrimary/);
    assert.match(file, /flexShrink:\s*1/);
    assert.match(file, /minWidth:\s*0/);
  }
});

test("back controls keep a 44 point target while context can reflow", () => {
  const appShell = source("src/components/AppShellHeader.tsx");
  const iconButton = source("src/components/IconButton.tsx");
  assert.match(appShell, /backChevron:\s*\{[\s\S]*?height:\s*44[\s\S]*?width:\s*44/);
  assert.match(iconButton, /height:\s*44,[\s\S]*?width:\s*44,/);
});

test("approved exceptions remain local and tab typography stays out of scope", () => {
  const review = source("src/components/ReviewShell.tsx");
  const session = source("src/features/coding-interview/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const tabs = source("src/components/BottomTabBar.tsx");

  assert.match(review, /contextText:\s*\{[^}]*fontSize:\s*13[^}]*fontWeight:\s*"500"[^}]*lineHeight:\s*18/);
  assert.match(review, /accessibilityLabel=\{contextLabel\}[^>]*ellipsizeMode="clip"[^>]*numberOfLines=\{2\}/);
  assert.match(session, /modeText:\s*\{[^}]*fontSize:\s*14[^}]*fontWeight:\s*"600"[^}]*lineHeight:\s*20/);
  assert.match(session, /topTextLargeSimulation:\s*\{[^}]*fontSize:\s*13[^}]*fontWeight:\s*"600"[^}]*lineHeight:\s*16/);
  assert.match(practice, /sessionActionLabel:\s*\{\s*fontSize:\s*13,\s*fontWeight:\s*"600",\s*lineHeight:\s*16\s*\}/);
  assert.match(simulation, /sessionActionLabel:\s*\{\s*fontSize:\s*13,\s*fontWeight:\s*"600",\s*lineHeight:\s*16\s*\}/);
  assert.doesNotMatch(tabs, /navigationContext/);
});

test("goal error keeps the same accessible navigation context as loading and ready states", () => {
  const goal = source("src/features/home/GoalCadenceScreen.tsx");
  assert.match(goal, /if \(loadError \|\| !track \|\| !current\)[\s\S]*?header=\{\([\s\S]*?<IconButton[\s\S]*?<Text accessibilityLabel=\{context\}[\s\S]*?style=\{styles\.loadingContext\}/);
});
