import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/coding-interview/session/SessionShell.tsx", "utf8");
const practiceSurface = readFileSync("src/features/practice/PracticeSessionSurface.tsx", "utf8");
const buttonSource = readFileSync("src/components/Button.tsx", "utf8");

test("SessionShell stacks metadata before large text can collapse into narrow columns", () => {
  assert.match(source, /fontScale >= 1\.3/);
  assert.match(source, /styles\.topBarLargeText/);
  assert.match(source, /topBarLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);
});

test("SessionShell keeps chrome readable without allowing it to crowd out authored content", () => {
  assert.equal(source.match(/maxFontSizeMultiplier=\{2\}/g)?.length, 3);
});

test("Practice sessions reset their scroll viewport when the canonical item changes", () => {
  assert.match(practiceSurface, /<SessionShell[\s\S]*key=\{itemId\}/);
});

test("Button chrome remains usable while supporting up to 200 percent text", () => {
  assert.match(buttonSource, /<Text maxFontSizeMultiplier=\{2\}/);
});
