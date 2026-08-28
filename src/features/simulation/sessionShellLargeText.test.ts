import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/coding-interview/session/SessionShell.tsx", "utf8");
const practiceSurface = readFileSync("src/features/practice/PracticeSessionSurface.tsx", "utf8");
const buttonSource = readFileSync("src/components/Button.tsx", "utf8");

test("SessionShell keeps the Figma top bar in one row at large text", () => {
  assert.doesNotMatch(source, /useWindowDimensions|fontScale >= 1\.3|topBarLargeText|topSlotLargeText/);
  assert.match(source, /topBar:\s*\{[\s\S]*flexDirection:\s*"row"[\s\S]*minHeight:\s*16/);
  assert.match(source, /topBar:\s*\{[\s\S]*paddingHorizontal:\s*spacing\.xl/);
});

test("SessionShell keeps chrome readable without allowing it to crowd out authored content", () => {
  assert.equal(source.match(/maxFontSizeMultiplier=\{2\}/g)?.length, 3);
});

test("session timers keep the Figma value-only visual label while retaining spoken context", () => {
  const practice = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
  const design = readFileSync("src/features/practice/DesignInterviewPracticeScreen.tsx", "utf8");
  const certification = readFileSync("src/features/practice/CertificationPracticeSessionScreen.tsx", "utf8");

  for (const screen of [practice, design, certification]) {
    assert.match(screen, /accessibilityLabel:\s*`\$\{t\("Active foreground time"\)\} \$\{[^}]+\}`, label:\s*format/);
    assert.doesNotMatch(screen, /label:\s*`\$\{t\("Active time"\)\}/);
  }
});

test("Practice sessions reset their scroll viewport when the canonical item changes", () => {
  assert.match(practiceSurface, /<SessionShell[\s\S]*key=\{itemId\}/);
});

test("Button chrome remains usable while supporting up to 200 percent text", () => {
  assert.match(buttonSource, /<Text maxFontSizeMultiplier=\{2\}/);
});
