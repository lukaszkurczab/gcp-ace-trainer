import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runner = readFileSync("scripts/runCodingMockAud02bIos.mjs", "utf8");
const freeFlow = readFileSync(".maestro/aud02b-coding-mock-free.yaml", "utf8");
const premiumFlow = readFileSync(".maestro/aud02b-coding-mock-premium.yaml", "utf8");
const expiryFlow = readFileSync(".maestro/aud02b-coding-mock-expiry.yaml", "utf8");
const expiryResultFlow = readFileSync(".maestro/aud02b-coding-mock-expiry-result.yaml", "utf8");

test("AUD-02B runner fails closed outside the existing booted iPhone 17 app and local evidence setup", () => {
  assert.match(runner, /const EXPECTED_UDID = "7F315654-3175-4F3C-BB24-B0263F59360C"/);
  assert.match(runner, /udid\?\.toUpperCase\(\) !== EXPECTED_UDID/);
  assert.match(runner, /simulator\.name !== "iPhone 17"/);
  assert.match(runner, /com\.apple\.CoreSimulator\.SimDeviceType\.iPhone-17/);
  assert.match(runner, /available and booted/);
  assert.match(runner, /simctl", "get_app_container", udid, APP_ID, "app"/);
  assert.match(runner, /required\("PATTERNLY_DEV_CLIENT_URL"\)/);
  assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR/);
  assert.match(runner, /exp\+patternly:/);
  assert.match(runner, /\["127\.0\.0\.1", "\[::1\]"\]/);
  assert.doesNotMatch(runner, /simctl", "(boot|create|install)|maestro", "(install|start-device)/);
});

test("AUD-02B executes authenticated Free, Premium, and expiry phases in order with the exact audit URL", () => {
  const orderedPhases = [
    "runMaestro(AUTH_PREFLIGHT_FLOW, credentials)",
    "await resetLearningState();",
    "runMaestro(FREE_FLOW, credentials)",
    "await resetLearningState();",
    "runMaestro(PREMIUM_FLOW)",
    "await resetLearningState();",
    "runMaestro(EXPIRY_FLOW)",
    "run(\"xcrun\", [\"simctl\", \"openurl\", udid, EXPIRE_URL])",
    "runMaestro(EXPIRY_RESULT_FLOW)",
  ];
  let previous = -1;
  for (const phase of orderedPhases) {
    const current = runner.indexOf(phase, previous + 1);
    assert.ok(current > previous, `missing or reordered phase: ${phase}`);
    previous = current;
  }
  assert.match(runner, /const EXPIRE_URL = "com\.lkurczab\.patternly:\/\/audit\/coding-mock\/expire"/);
  assert.doesNotMatch(runner, /clock\/advance|milliseconds=/);
});

test("AUD-02B Free evidence selects Coding Mock and repeats the paywall after clearState:false relaunch", () => {
  assert.match(freeFlow, /patternly:home:select-track:coding-interview-dsa-problem-solving/);
  assert.equal((freeFlow.match(/patternly:home:select-track:continue/g) ?? []).length, 2);
  assert.doesNotMatch(freeFlow, /tapOn: "Go back"/);
  assert.match(freeFlow, /patternly:practice:mode-card:coding-interview-simulation/);
  assert.match(freeFlow, /settings-premium-testing[\s\S]*?visible: "Enabled"[\s\S]*?tapOn:[\s\S]*?settings-premium-testing[\s\S]*?assertVisible: "Disabled"[\s\S]*?patternly:home:primary-action/);
  assert.equal((freeFlow.match(/premium-offer-summary/g) ?? []).length, 2);
  assert.match(freeFlow, /stopApp[\s\S]*?launchApp:\n    clearState: false/);
  assert.match(freeFlow, /patternly:simulation:root:\.\*/);
  assert.doesNotMatch(freeFlow, /clearState: true|reset-learning-state/);

  const lifecycle = readFileSync("src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts", "utf8");
  assert.match(lifecycle, /Free and unavailable Coding Mock access fail before package resolution, preparation, or mutation/);
  assert.match(lifecycle, /assert\.equal\(setup\.startCount, 0\)/);
});

test("AUD-02B Premium evidence restores the same 40-question draft before manual finalization and endpoint review", () => {
  assert.match(premiumFlow, /settings-premium-testing/);
  assert.match(premiumFlow, /assertVisible: "Enabled"/);
  const sessionId = "coding-interview-dsa-problem-solving:coding-interview-simulation:1";
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:root:${sessionId}`, "g")) ?? []).length, 2);
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:position:${sessionId}`, "g")) ?? []).length, 3);
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:timer:${sessionId}`, "g")) ?? []).length, 2);
  assert.match(premiumFlow, /alg-backtracking-base-contract-001:path_length_n/);
  const firstOption = premiumFlow.indexOf("alg-backtracking-base-contract-001:path_length_n");
  const secondOption = premiumFlow.indexOf("alg-backtracking-base-contract-001:path_nonempty");
  const saveResponse = premiumFlow.indexOf('tapOn: "Save response"');
  assert.ok(firstOption < secondOption && secondOption < saveResponse, "Premium must change the answer to another valid option before saving");
  assert.match(premiumFlow, /id: "patternly:simulation:option:alg-backtracking-base-contract-001:path_nonempty"\n    checked: true/);
  assert.match(premiumFlow, /id: "patternly:simulation:option:alg-backtracking-base-contract-001:path_length_n"\n    checked: false/);
  assert.match(premiumFlow, /tapOn: "Save response"[\s\S]*?visible: "Saved"/);
  assert.match(premiumFlow, /tapOn: "Flag question"/);
  assert.match(premiumFlow, /Question 1, current, answered and saved, flagged/);
  assert.match(premiumFlow, /Question 2, unanswered/);
  assert.match(premiumFlow, /stopApp[\s\S]*?launchApp:\n    clearState: false/);
  assert.match(premiumFlow, /assertVisible: "2 \/ 40"[\s\S]*?Question 1, answered and saved, flagged/);
  assert.match(premiumFlow, /patternly:simulation:option:alg-backtracking-base-contract-001:path_length_n/);
  assert.match(premiumFlow, /Finish simulation[\s\S]*?Action required[\s\S]*?patternly:summary:root:/);
  assert.match(premiumFlow, /Question 1 \/ 40/);
  assert.match(premiumFlow, /times: 39[\s\S]*?Question 40 \/ 40/);
  assert.doesNotMatch(premiumFlow, /clearState: true/);
});

test("AUD-02B expiry invokes only the exact Coding Mock command and captures finalized unanswered review", () => {
  assert.match(expiryFlow, /patternly:practice:mode-card:coding-interview-simulation/);
  assert.match(expiryFlow, /patternly:simulation:root:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.match(expiryResultFlow, /patternly:summary:root:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.match(expiryResultFlow, /Session ended without answers/);
  assert.match(expiryResultFlow, /0 \/ 40/);
  assert.match(expiryResultFlow, /patternly:summary:review-answers:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.match(expiryResultFlow, /Question 1 \/ 40[\s\S]*?Unanswered/);
  assert.match(expiryResultFlow, /times: 39[\s\S]*?Question 40 \/ 40/);
  assert.doesNotMatch(`${expiryFlow}\n${expiryResultFlow}`, /clearState: true|clock\/advance/);
});
