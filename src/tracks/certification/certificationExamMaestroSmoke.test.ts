import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("RC Certification Maestro smoke traverses only the canonical product flow", () => {
  const flow = readFileSync(".maestro/rc-certification-exam-smoke.yaml", "utf8");
  const listener = readFileSync(".maestro/rc-runtime-audit-listener-ready.yaml", "utf8");

  for (const selector of [
    "patternly:home:select-track:google-cloud-associate-cloud-engineer",
    "main-tab-bar-practice",
    "patternly:practice:mode-card:certification-exam-simulation",
  ]) assert.match(flow, new RegExp(selector));
  assert.match(listener, /patternly:content:audit-command-listener:ready/);
  assert.match(flow, /visible:\n        id: "patternly:home:change-track"/);
  assert.match(flow, /tapOn:\n          id: "patternly:home:change-track"/);
  assert.match(flow, /scrollUntilVisible:\n    element:\n      id: "patternly:home:select-track:google-cloud-associate-cloud-engineer"/);
  assert.match(flow, /id: "main-tab-bar-practice"/);
  assert.match(flow, /Question 1 of 50/);
  assert.match(flow, /scrollUntilVisible:\n    element:\n      text: "Question 50, unanswered"/);
  assert.match(flow, /text: "Question 50, unanswered"/);
  assert.match(flow, /Question 50 of 50/);
  assert.match(flow, /text: "Remove flag"/);
  assert.match(flow, /text: "Finish exam"/);
  assert.match(flow, /Finish with unanswered questions\?/);
  assert.match(flow, /No submitted answers/);
  assert.equal((flow.match(/waitForAnimationToEnd/g) ?? []).length, 2);
});

test("RC Android runner requires the explicit current dev-client and evidence destination", () => {
  const runner = readFileSync("scripts/runCertificationExamRcAndroid.mjs", "utf8");
  assert.match(runner, /PATTERNLY_DEV_CLIENT_URL is required/);
  assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR is required/);
  assert.match(runner, /exp\+patternly/);
  assert.match(runner, /shell", "pm", "clear", APP_ID/);
  assert.match(runner, /--test-output-dir/);
});

test("RC iOS runner requires one booted simulator and the same explicit evidence contract", () => {
  const runner = readFileSync("scripts/runCertificationExamRcIos.mjs", "utf8");
  assert.match(runner, /PATTERNLY_DEV_CLIENT_URL is required/);
  assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR is required/);
  assert.match(runner, /available and booted/);
  assert.match(runner, /"simctl", "openurl", udid, devClientUrl/);
  assert.match(runner, /--test-output-dir/);
});
