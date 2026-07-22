import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/features/algorithms/session/SessionShell.tsx", "utf8");

test("SessionShell reserves its fixed action-footer height after scrollable feedback", () => {
  assert.match(shell, /const SESSION_ACTION_FOOTER_CLEARANCE = \(48 \* 2\) \+ spacing\.sm \+ \(spacing\.lg \* 2\);/);
  assert.match(shell, /content:\s*\{[\s\S]*paddingBottom: SESSION_ACTION_FOOTER_CLEARANCE,/);
  assert.match(shell, /footer=\{actionBar \? <View style=\{styles\.actionRegion\}>\{actionBar\}<\/View> : undefined\}/);
});
