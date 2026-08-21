import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const developmentFlow = readFileSync(".maestro/screenshot-capture/visual-shell/visual-shell.yaml", "utf8");
const releaseFlow = readFileSync(".maestro/screenshot-capture/visual-shell/visual-shell-release.yaml", "utf8");
const captureFlow = readFileSync(".maestro/screenshot-capture/visual-shell/visual-shell-capture.yaml", "utf8");

test("visual shell has one shared journey and an explicit production-ready preparation boundary", () => {
  assert.match(developmentFlow, /patternly:content:ready-after-audit-reset/);
  assert.match(developmentFlow, /- runFlow: visual-shell-capture\.yaml/);
  assert.match(releaseFlow, /patternly:content:ready/);
  assert.doesNotMatch(releaseFlow, /audit\/reset-learning-state|ready-after-audit-reset/);
  assert.match(releaseFlow, /- runFlow: visual-shell-capture\.yaml/);
  assert.equal((captureFlow.match(/- takeScreenshot:/g) ?? []).length, 6);
  assert.doesNotMatch(captureFlow, /audit\/reset-learning-state|ready-after-audit-reset/);
});
