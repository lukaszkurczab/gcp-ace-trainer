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
  assert.equal((captureFlow.match(/- takeScreenshot:/g) ?? []).length, 11);
  assert.doesNotMatch(captureFlow, /audit\/reset-learning-state|ready-after-audit-reset/);
  assert.match(captureFlow, /select-track:google-cloud-associate-cloud-engineer[\s\S]*?select-track:continue[\s\S]*?track-card:google-cloud-associate-cloud-engineer/);
  const codingSelection = captureFlow.indexOf('id: "patternly:home:select-track:coding-interview-dsa-problem-solving"', captureFlow.indexOf("track-selection-ready"));
  const codingCommit = captureFlow.indexOf('id: "patternly:home:select-track:continue"', codingSelection);
  const codingHomeCard = captureFlow.indexOf('id: "patternly:home:track-card:coding-interview-dsa-problem-solving"', codingCommit);
  assert.ok(codingSelection >= 0, "capture must select Coding before committing it");
  assert.ok(codingCommit > codingSelection, "capture must commit Coding through the footer action");
  assert.ok(codingHomeCard > codingCommit, "capture must verify the persisted Coding Home card after commit");
  assert.match(captureFlow.slice(codingSelection, codingHomeCard), /scrollUntilVisible:[\s\S]*?select-track:continue[\s\S]*?- tapOn:\s*\n    id: "patternly:home:select-track:continue"/);
  assert.match(captureFlow, /id: "settings-your-data"[\s\S]*?direction: DOWN[\s\S]*?visibilityPercentage: 50[\s\S]*?tapOn:\s*\n    id: "settings-your-data"/);
});
