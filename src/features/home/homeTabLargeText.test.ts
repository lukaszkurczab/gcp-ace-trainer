import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");

test("Home stacks quiet-layered context and decision metadata at large text sizes", () => {
  assert.match(source, /const \{ fontScale(?:, width)? \} = useWindowDimensions\(\)/);
  assert.match(source, /const largeText = fontScale >= 1\.3/);
  assert.match(source, /largeText \? styles\.trackContextLargeText : null/);
  assert.match(source, /largeText \? styles\.decisionHeadingLargeText : null/);
  assert.match(source, /decisionHeadingLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);
});
