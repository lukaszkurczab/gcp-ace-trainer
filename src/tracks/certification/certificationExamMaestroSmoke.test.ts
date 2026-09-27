import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("RC Certification Maestro flows change, restore, persist, resume, finish, and review the 50-item exam", () => {
  const flow = readFileSync(".maestro/rc-certification-exam-smoke.yaml", "utf8");
  const resumeFlow = readFileSync(".maestro/rc-certification-exam-resume-finish.yaml", "utf8");

  for (const selector of [
    "patternly:home:select-track:root",
    "patternly:home:select-track:google-cloud-associate-cloud-engineer",
    "patternly:home:select-track:continue",
    "patternly:home:primary-action",
    "patternly:practice:mode-card:certification-exam-simulation",
  ]) assert.match(flow, new RegExp(selector));
  assert.match(flow, /visible: "\.\*Open debugger to view warnings\.\*"[\s\S]*?point: "92%,93%"/);
  assert.match(readFileSync(".maestro/rc-runtime-audit-reset-complete.yaml", "utf8"), /patternly:content:ready-after-audit-reset/);
  assert.match(flow, /visible:\n        id: "patternly:home:change-track"/);
  assert.match(flow, /tapOn:\n          id: "patternly:home:change-track"/);
  assert.match(flow, /scrollUntilVisible:\n    element:\n      id: "patternly:home:select-track:google-cloud-associate-cloud-engineer"/);
  assert.match(flow, /visible: "Not now"[\s\S]*?tapOn: "Not now"/);
  assert.match(flow, /Question 1 of 50/);
  assert.match(flow, /patternly:simulation:option:gcp-ace-gcpace-n01-b02-001:a/);
  assert.match(flow, /patternly:simulation:option:gcp-ace-gcpace-n01-b02-001:b/);
  assert.match(flow, /tapOn: "Next"[\s\S]*?Question 2 of 50[\s\S]*?tapOn: "Previous"[\s\S]*?Question 1 of 50/);
  assert.match(flow, /rc-certification-exam-answer-changed-and-restored/);
  assert.match(flow, /tapOn: "Flag question"[\s\S]*?assertVisible: "Remove flag"/);
  assert.match(flow, /Question 1, current, answered and saved, flagged/);
  assert.match(flow, /tapOn: "Question 50, unanswered"/);
  assert.match(flow, /Question 50 of 50/);
  assert.match(flow, /rc-certification-exam-question-50-before-relaunch/);
  assert.match(resumeFlow, /tapOn: "Resume session"[\s\S]*?extendedWaitUntil:\n          visible:\n            id: "patternly:practice:hub:root"[\s\S]*?scrollUntilVisible:\n          element:\n            id: "patternly:practice:mode-card:certification-exam-simulation"[\s\S]*?tapOn:\n          id: "patternly:practice:mode-card:certification-exam-simulation"[\s\S]*?extendedWaitUntil:\n    visible: "Question 50 of 50"/);
  assert.doesNotMatch(resumeFlow, /main-tab-bar-practice/);
  assert.equal((resumeFlow.match(/visible: "Question 50 of 50"/g) ?? []).length, 1);
  assert.match(resumeFlow, /Question 1, answered and saved, flagged/);
  assert.match(resumeFlow, /assertVisible: "Question 50, current"[\s\S]*?tapOn: "Close question navigator"[\s\S]*?assertVisible: "Question 50 of 50"/);
  assert.doesNotMatch(resumeFlow, /tapOn: "Question 50, current"/);
  assert.match(resumeFlow, /runFlow:\n    when:\n      visible: "!, Open debugger to view warnings\."\n    commands:\n      - tapOn:\n          point: "92%,93%"\n      - extendedWaitUntil:\n          notVisible: "!, Open debugger to view warnings\."\n          timeout: 5000\n- scrollUntilVisible:\n    element: "Finish exam"[\s\S]*?tapOn: "Finish exam"[\s\S]*?extendedWaitUntil:\n    visible: "Finish with unanswered questions\?"\n    timeout: 30000/);
  assert.equal((resumeFlow.match(/point: "92%,93%"/g) ?? []).length, 1);
  assert.doesNotMatch(resumeFlow, /^- tapOn:\n    point:/m);
  assert.match(resumeFlow, /rc-certification-exam-result/);
  assert.match(resumeFlow, /repeat:\n    times: 49/);
  assert.match(resumeFlow, /Question 1 \/ 50/);
  assert.match(resumeFlow, /Question 50 \/ 50/);
  assert.match(resumeFlow, /assertVisible: "Unanswered"/);
  assert.doesNotMatch(`${flow}\n${resumeFlow}`, /No submitted answers/);
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
  assert.equal((runner.match(/"simctl", "openurl", udid, devClientUrl/g) ?? []).length, 2);
  assert.match(runner, /RESUME_FLOW_PATH/);
  assert.match(runner, /"simctl", "terminate", udid, APP_ID/);
  assert.match(runner, /--test-output-dir/);
});

test("RC iOS certification smoke requires local credentials and authenticates only when Settings offers account entry", () => {
  const flow = readFileSync(".maestro/rc-certification-exam-smoke.yaml", "utf8");
  const authFlow = readFileSync(".maestro/rc-auth-preflight.yaml", "utf8");
  const runner = readFileSync("scripts/runCertificationExamRcIos.mjs", "utf8");

  assert.match(runner, /parseDotenv\(readFileSync\("\.env\.smoke\.local"/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_EMAIL/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD/);
  assert.match(runner, /env: \{ \.\.\.process\.env, \.\.\.credentials \}/);
  assert.match(runner, /SMOKE_CREDENTIAL_KEYS\.flatMap\(\(key\) => \["-e", `\$\{key\}=\$\{credentials\[key\]\}`\]\)/);
  assert.match(runner, /runMaestro\(AUTH_PREFLIGHT_FLOW, smokeCredentials\)/);
  assert.match(runner, /runMaestro\(PREPARE_FLOW_PATH, smokeCredentials\)/);
  assert.match(runner, /\[redacted\]/);
  assert.match(authFlow, /id: "account-revoked-session"[\s\S]*?id: "account-sign-out"[\s\S]*?notVisible:[\s\S]*?id: "account-revoked-session"/);

  assert.match(authFlow, /when:[\s\S]*?visible:[\s\S]*?id: "settings-account-entry"[\s\S]*?tapOn:[\s\S]*?id: "settings-account-entry"/);
  assert.match(authFlow, /when:[\s\S]*?visible:[\s\S]*?id: "account-sign-in"[\s\S]*?tapOn:[\s\S]*?id: "account-sign-in"/);
  assert.match(authFlow, /inputText: "\$\{EXPO_PUBLIC_PATTERNLY_E2E_EMAIL\}"/);
  assert.match(authFlow, /inputText: "\$\{EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD\}"/);
  assert.ok(authFlow.indexOf('id: "account-email"') < authFlow.indexOf('id: "main-tab-bar-settings"'));
  assert.match(authFlow, /tapOn:[\s\S]*?id: "account-sign-in-submit"[\s\S]*?notVisible:[\s\S]*?id: "account-email"/);
  assert.match(authFlow, /visible: "Not now"[\s\S]*?tapOn: "Not now"/);
  assert.match(authFlow, /visible: "Nie teraz"[\s\S]*?tapOn: "Nie teraz"/);
  assert.match(authFlow, /when:[\s\S]*?visible:[\s\S]*?id: "account-entry-continue"[\s\S]*?tapOn:[\s\S]*?id: "account-entry-continue"/);
  assert.match(authFlow, /when:[\s\S]*?visible:[\s\S]*?id: "account-open-settings"[\s\S]*?tapOn:[\s\S]*?id: "account-open-settings"/);
  assert.match(authFlow, /when:[\s\S]*?visible:[\s\S]*?id: "main-tab-bar-home"[\s\S]*?tapOn:[\s\S]*?id: "main-tab-bar-home"/);
  assert.match(flow, /id: "main-tab-bar-home"/);
});

test("Free Certification Exam flow resets once, reaches the Premium paywall, and retries after a cold restart without reset", () => {
  const flow = readFileSync(".maestro/rc-certification-exam-free.yaml", "utf8");
  const runner = readFileSync("scripts/runCertificationExamFreeRcIos.mjs", "utf8");
  const examRunner = readFileSync("scripts/runCertificationExamRcIos.mjs", "utf8");
  assertRunnerResetGate(runner);
  assertRunnerResetGate(examRunner);
  assert.match(runner, /runMaestro\(AUTH_PREFLIGHT_FLOW, credentials\)/);

  assert.match(runner, /\.env\.smoke\.local/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_EMAIL/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD/);
  assert.match(runner, /run\("xcrun", \["simctl", "openurl", udid, RESET_URL\]\)/);
  assert.equal((runner.match(/RESET_URL/g) ?? []).length, 2);
  assert.match(runner, /runMaestro\(FLOW_PATH, credentials\)/);
  assert.match(flow, /patternly:practice:mode-card:certification-exam-simulation/);
  assert.match(readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8"), /<Badge label=\{t\("Premium"\)\} tone="info" \/>/);
  assert.match(flow, /visible:[\s\S]*?id: "premium-offer-summary"/);
  assert.match(flow, /stopApp[\s\S]*?launchApp:\n    clearState: false/);
  assert.equal((flow.match(/- tapOn:\n    id: "patternly:practice:mode-card:certification-exam-simulation"/g) ?? []).length, 2);
  assert.equal((flow.match(/premium-offer-summary/g) ?? []).length, 2);
  assert.doesNotMatch(flow, /reset-learning-state|clearState: true/);
  assert.match(examRunner, /\["127\.0\.0\.1", "\[::1\]"\]/);
  assert.doesNotMatch(examRunner, /metroUrl\.hostname === "localhost"/);
});

test("RC iOS timeout runner prepares one local exam, advances the audit clock, and captures timeout review evidence", () => {
  const runner = readFileSync("scripts/runCertificationExamTimeoutRcIos.mjs", "utf8");
  const timeoutFlow = readFileSync(".maestro/rc-certification-exam-timeout-result.yaml", "utf8");
  const orderedSteps = [
    'await waitForContentPreparationState()',
    'run("xcrun", ["simctl", "openurl", udid, RESET_URL])',
    'runMaestro(PREPARE_FLOW_PATH, smokeCredentials)',
    'run("xcrun", ["simctl", "openurl", udid, TIMEOUT_URL])',
    'runMaestro(TIMEOUT_RESULT_FLOW_PATH, smokeCredentials)',
  ];
  let previousIndex = -1;
  for (const step of orderedSteps) {
    const index = runner.indexOf(step);
    assert.ok(index > previousIndex, `expected ${step} after its prior runner phase`);
    previousIndex = index;
  }

  assert.match(runner, /PATTERNLY_DEV_CLIENT_URL is required/);
  assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR is required/);
  assert.match(runner, /available and booted/);
  assert.match(runner, /\.env\.smoke\.local/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_EMAIL/);
  assert.match(runner, /EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD/);
  assert.match(runner, /\["127\.0\.0\.1", "\[::1\]"\]/);
  assert.equal((runner.match(/run\("xcrun", \["simctl", "openurl", udid, RESET_URL\]\)/g) ?? []).length, 1);
  assert.equal((runner.match(/RESET_URL/g) ?? []).length, 2);
  assert.match(runner, /milliseconds=7200001/);
  assertRunnerResetGate(runner);
  assert.match(timeoutFlow, /visible: "Session complete"\n    timeout: 120000/);
  assert.match(timeoutFlow, /rc-certification-exam-timeout-result/);
  assert.match(timeoutFlow, /Review answers[\s\S]*?Question 1 \/ 50[\s\S]*?Incorrect/);
  assert.match(timeoutFlow, /repeat:\n    times: 49[\s\S]*?Question 50 \/ 50[\s\S]*?Unanswered/);
  assert.doesNotMatch(timeoutFlow, /Finish exam/);
});

function assertRunnerResetGate(runner: string) {
  assert.doesNotMatch(runner, /LISTENER_FLOW|audit-command-listener/);
  assert.match(runner, /await waitForContentPreparationState\(\)/);
  assert.ok(runner.indexOf("runMaestro(AUTH_PREFLIGHT_FLOW,") < runner.indexOf("await waitForContentPreparationState()"));
  assert.match(runner, /openurl", udid, RESET_URL/);
  assert.match(readFileSync(".maestro/rc-runtime-audit-reset-complete.yaml", "utf8"), /patternly:content:ready-after-audit-reset/);
  assert.ok(runner.indexOf("await waitForContentPreparationState()") < runner.indexOf('"openurl", udid, RESET_URL'));
  const resetAssertionIndex = runner.indexOf("RESET_COMPLETE_FLOW], { stdio: \"inherit\" }") >= 0
    ? runner.indexOf("RESET_COMPLETE_FLOW], { stdio: \"inherit\" }")
    : runner.indexOf("runMaestro(RESET_COMPLETE_FLOW)");
  assert.ok(runner.indexOf('"openurl", udid, RESET_URL') < resetAssertionIndex);
  const examFlowIndex = Math.max(
    runner.indexOf("runMaestro(FLOW_PATH,"),
    runner.indexOf("runMaestro(PREPARE_FLOW_PATH,"),
  );
  assert.ok(resetAssertionIndex < examFlowIndex);
}
