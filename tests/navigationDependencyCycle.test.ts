import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("navigation screens do not re-enter the public navigation barrel at runtime", () => {
  const screenPaths = [
    "src/features/home/SelectTrackScreen.tsx",
    "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
    "src/features/practice/PracticeHubScreen.tsx",
    "src/features/practice/PracticeSetupScreen.tsx",
  ];

  for (const path of screenPaths) {
    const screen = source(path);
    assert.doesNotMatch(screen, /import\s+(?!type\b)[\s\S]*?from\s+["']\.\.\/\.\.\/navigation["']/);
    assert.match(screen, /from ["']\.\.\/\.\.\/navigation\/goBackOrHome["']/);
    assert.match(screen, /from ["']\.\.\/\.\.\/navigation\/types["']/);
  }

  assert.match(source("src/navigation/index.ts"), /export \* from "\.\/RootNavigator"/);
});
