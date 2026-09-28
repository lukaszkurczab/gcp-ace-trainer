import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runner = readFileSync("scripts/runDesignInterviewAud02cIos.mjs", "utf8");
const free = readFileSync(".maestro/aud02c-design-simulation-free.yaml", "utf8");
const premium = readFileSync(".maestro/aud02c-design-simulation-premium.yaml", "utf8");
const timeout = readFileSync(".maestro/aud02c-design-simulation-timeout.yaml", "utf8");
const timeoutResult = readFileSync(".maestro/aud02c-design-simulation-timeout-result.yaml", "utf8");

test("AUD-02C runner is pinned to one existing iPhone 17 and ordered local entitlement phases", () => {
  assert.match(runner, /const UDID = "7F315654-3175-4F3C-BB24-B0263F59360C"/);
  assert.match(runner, /simulator\.name !== "iPhone 17"/);
  assert.match(runner, /simctl", "get_app_container", UDID, APP_ID, "app"/);
  assert.doesNotMatch(runner, /simctl", "(boot|create|install)|maestro", "(install|start-device)/);
  for (const trackId of ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"]) assert.match(runner, new RegExp(`"${trackId}"`));
  const phases = ['startBackend("expired")', "runMaestro(FREE_FLOW, credentials, trackId)", 'startBackend("active")', "runMaestro(PREMIUM_FLOW, credentials, trackId)", "runMaestro(TIMEOUT_PREPARE_FLOW, credentials, trackId)", "clock/advance?milliseconds=2700001", "runMaestro(TIMEOUT_RESULT_FLOW, credentials, trackId)"];
  let previous = -1;
  for (const phase of phases) { const current = runner.indexOf(phase, previous + 1); assert.ok(current > previous, `missing or reordered phase: ${phase}`); previous = current; }
  assert.match(runner, /finally\s*\{[\s\S]*await stopBackend\(backend\);[\s\S]*await waitForPortAvailable\(\)/);
});

test("AUD-02C flows prove Free denial, durable resume, manual result, timeout result, and rubric review", () => {
  assert.match(free, /premium-offer-summary[\s\S]*stopApp[\s\S]*launchApp:\n\s+clearState: false[\s\S]*premium-offer-summary/);
  assert.match(free, /assertNotVisible:\n\s+id: "patternly:resume:continue:\$\{TRACK_ID\}:design-interview-simulation:\.\*"/);
  assert.match(premium, /requirements[\s\S]*save-status:\.\*:saved[\s\S]*stopApp[\s\S]*launchApp:\n\s+clearState: false[\s\S]*resume:continue/);
  for (const stage of ["requirements", "architecture", "tradeoffs", "final_answer"]) assert.match(premium, new RegExp(`response:\\.\\*:${stage}`));
  assert.match(premium, /finish:\.\*[\s\S]*result:\.\*[\s\S]*Review responses[\s\S]*Self-assessment reference/);
  assert.match(timeout, /stopApp[\s\S]*launchApp:\n\s+clearState: false[\s\S]*resume:continue/);
  assert.match(timeoutResult, /result:\.\*[\s\S]*Complete[\s\S]*Review responses[\s\S]*Self-assessment reference/);
  assert.doesNotMatch(`${premium}\n${timeoutResult}`, /assertVisible: "Score"/);
});
