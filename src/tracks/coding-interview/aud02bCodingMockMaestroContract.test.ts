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
  const initialPreflight = runner.indexOf("runMaestro(AUTH_PREFLIGHT_FLOW, credentials)");
  const foregroundLaunch = runner.indexOf('run("xcrun", ["simctl", "launch", udid, APP_ID])', initialPreflight);
  const contentPreparationWait = runner.indexOf("await waitForContentPreparationState()", initialPreflight);
  assert.ok(initialPreflight < foregroundLaunch && foregroundLaunch < contentPreparationWait, "initial preflight must foreground the installed app before waiting for content preparation");

  const orderedPhases = [
    "runMaestro(AUTH_PREFLIGHT_FLOW, credentials)",
    "await resetLearningState();",
    "runMaestro(AUTH_PREFLIGHT_FLOW, credentials)",
    "runMaestro(FREE_FLOW, credentials)",
    "await resetLearningState();",
    "runMaestro(AUTH_PREFLIGHT_FLOW, credentials)",
    "runMaestro(PREMIUM_FLOW)",
    "await resetLearningState();",
    "runMaestro(AUTH_PREFLIGHT_FLOW, credentials)",
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

test("AUD-02B owns only its local backend process and gates both entitlement phases on readiness", () => {
  assert.match(runner, /await assertPortAvailable\(\)/);
  assert.ok(runner.indexOf("await assertPortAvailable()") < runner.indexOf("function startBackend"));
  assert.match(runner, /BACKEND_DIRECTORY = "\.\.\/patternly-backend"/);
  assert.match(runner, /spawn\("npm", \["run", "dev:smoke"\]/);
  for (const [key, value] of Object.entries({
    FIREBASE_PROJECT_ID: "patternly-app-sandbox",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19099",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:18081",
  })) assert.match(runner, new RegExp(`${key}: "${value.replaceAll(".", "\\.")}"`));
  assert.match(runner, /PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE: entitlementState/);
  assert.match(runner, /\["database", "authentication", "providerReader"\]\.every\(\(key\) => body\.checks\?\.\[key\] === true\)/);
  assert.match(runner, /async function waitForBackendReady/);
  assert.match(runner, /finally\s*\{\s*if \(backendProcess\) \{\s*await stopBackend\(backendProcess\);\s*await waitForPortAvailable\(\);/);
  assert.match(runner, /process\.kill\(-child\.pid, "SIGTERM"\)/);
  assert.match(runner, /child\.kill\("SIGTERM"\)/);
  assert.doesNotMatch(runner, /lsof|pkill|kill-port|execSync\([^)]*kill/);
  const backendLauncher = runner.slice(runner.indexOf("function startBackend"), runner.indexOf("async function waitForBackendReady"));
  assert.doesNotMatch(backendLauncher, /\.\.\.process\.env|EXPO_PUBLIC_PATTERNLY_E2E|\.env\.smoke\.local/);

  const orderedBackendPhases = [
    'startBackend("expired")',
    "await waitForBackendReady(backendProcess)",
    "runMaestro(FREE_FLOW, credentials)",
    "await stopBackend(backendProcess)",
    "await waitForPortAvailable()",
    'startBackend("active")',
    "await waitForBackendReady(backendProcess)",
    "runMaestro(PREMIUM_FLOW)",
    "runMaestro(EXPIRY_FLOW)",
  ];
  let previous = -1;
  for (const phase of orderedBackendPhases) {
    const current = runner.indexOf(phase, previous + 1);
    assert.ok(current > previous, `missing or reordered backend phase: ${phase}`);
    previous = current;
  }
});

test("AUD-02B Free evidence selects Coding Mock and repeats the paywall after clearState:false relaunch", () => {
  assert.match(freeFlow, /patternly:home:select-track:coding-interview-dsa-problem-solving/);
  assert.equal((freeFlow.match(/patternly:home:select-track:continue/g) ?? []).length, 1);
  assert.equal((freeFlow.match(/retryTapIfNoChange: true/g) ?? []).length, 3);
  assert.match(freeFlow, /launchApp:\n\s+clearState: false[\s\S]*?patternly:home:track-card:coding-interview-dsa-problem-solving/);
  assert.match(freeFlow, /when:\n\s+notVisible:\n\s+id: "patternly:home:track-card:coding-interview-dsa-problem-solving"[\s\S]*?patternly:home:change-track[\s\S]*?patternly:home:select-track:coding-interview-dsa-problem-solving[\s\S]*?patternly:home:select-track:continue/);
  const firstPaywall = freeFlow.indexOf('visible:\n    id: "premium-offer-summary"');
  const coldRelaunchHome = freeFlow.indexOf('launchApp:\n    clearState: false', firstPaywall);
  const coldRelaunchCoding = freeFlow.indexOf('patternly:home:track-card:coding-interview-dsa-problem-solving', coldRelaunchHome);
  const coldRelaunchHomeTap = freeFlow.indexOf('id: "main-tab-bar-home"', coldRelaunchCoding);
  const coldRelaunchCodingAssertion = freeFlow.indexOf('assertVisible:\n    id: "patternly:home:track-card:coding-interview-dsa-problem-solving"', coldRelaunchHomeTap);
  const coldRelaunchPractice = freeFlow.indexOf('id: "main-tab-bar-practice"', coldRelaunchCodingAssertion);
  const coldRelaunchHub = freeFlow.indexOf('id: "patternly:practice:hub:root"', coldRelaunchPractice);
  assert.ok(firstPaywall < coldRelaunchHome && coldRelaunchHome < coldRelaunchCoding && coldRelaunchCoding < coldRelaunchHomeTap && coldRelaunchHomeTap < coldRelaunchCodingAssertion && coldRelaunchCodingAssertion < coldRelaunchPractice && coldRelaunchPractice < coldRelaunchHub);
  assert.doesNotMatch(freeFlow, /tapOn: "Go back"/);
  assert.match(freeFlow, /patternly:practice:mode-card:coding-interview-simulation/);
  assert.match(freeFlow, /settings-premium-testing:\.\*[\s\S]*?settings-premium-testing:enabled[\s\S]*?tapOn:[\s\S]*?settings-premium-testing:enabled[\s\S]*?settings-premium-testing:disabled[\s\S]*?main-tab-bar-practice/);
  assert.equal((freeFlow.match(/main-tab-bar-practice/g) ?? []).length, 2);
  assert.equal((freeFlow.match(/premium-offer-summary/g) ?? []).length, 2);
  assert.match(freeFlow, /stopApp[\s\S]*?launchApp:\n    clearState: false/);
  assert.match(freeFlow, /patternly:simulation:root:\.\*/);
  assert.doesNotMatch(freeFlow, /clearState: true|reset-learning-state/);

  const lifecycle = readFileSync("src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts", "utf8");
  assert.match(lifecycle, /Free and unavailable Coding Mock access fail before package resolution, preparation, or mutation/);
  assert.match(lifecycle, /assert\.equal\(setup\.startCount, 0\)/);
});

test("AUD-02B Premium evidence restores the same 40-question draft before manual finalization and endpoint review", () => {
  assert.match(premiumFlow, /settings-premium-testing:\.\*[\s\S]*?settings-premium-testing:disabled[\s\S]*?tapOn:[\s\S]*?settings-premium-testing:disabled[\s\S]*?settings-premium-testing:enabled/);
  assert.match(premiumFlow, /main-tab-bar-practice/);
  const sessionId = "coding-interview-dsa-problem-solving:coding-interview-simulation:1";
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:root:${sessionId}`, "g")) ?? []).length, 2);
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:position:${sessionId}`, "g")) ?? []).length, 5);
  assert.equal((premiumFlow.match(new RegExp(`patternly:simulation:timer:${sessionId}`, "g")) ?? []).length, 2);
  assert.match(premiumFlow, /alg-backtracking-base-contract-001:path_length_n/);
  const firstOption = premiumFlow.indexOf("alg-backtracking-base-contract-001:path_length_n");
  const secondOption = premiumFlow.indexOf("alg-backtracking-base-contract-001:path_nonempty");
  const saveAndContinue = premiumFlow.indexOf('patternly:simulation:action:coding-interview-dsa-problem-solving:coding-interview-simulation:1:save-and-continue');
  const questionTwoAfterSave = premiumFlow.indexOf('assertVisible: "Open question navigator, 2 of 40"', saveAndContinue);
  const questionOneNavigator = premiumFlow.indexOf('patternly:simulation:position:coding-interview-dsa-problem-solving:coding-interview-simulation:1', questionTwoAfterSave);
  const questionOneEntry = premiumFlow.indexOf('Question 1, answered and saved', questionOneNavigator);
  const returnToQuestionOne = premiumFlow.indexOf('tapOn: "Question 1, answered and saved"', questionOneEntry);
  const flagSwipe = premiumFlow.indexOf("start: 50%, 50%\n    end: 50%, 20%\n    duration: 600");
  const flagAction = premiumFlow.indexOf('id: "patternly:simulation:flag:coding-interview-dsa-problem-solving:coding-interview-simulation:1"', flagSwipe + 1);
  const returnToQuestionTwo = premiumFlow.indexOf('tapOn: "Question 2, unanswered"');
  assert.ok(firstOption < secondOption && secondOption < saveAndContinue && saveAndContinue < questionTwoAfterSave && questionTwoAfterSave < questionOneNavigator && questionOneNavigator < questionOneEntry && questionOneEntry < returnToQuestionOne && returnToQuestionOne < flagSwipe && flagSwipe < flagAction && flagAction < returnToQuestionTwo, "Premium must save and advance to Q2, return to Q1, flag it, then continue to Q2");
  const questionTwoAfterRelaunch = premiumFlow.indexOf("takeScreenshot: aud02b-coding-mock-question-two-after-relaunch");
  const openFinalNavigator = premiumFlow.indexOf(`id: "patternly:simulation:position:${sessionId}"`, questionTwoAfterRelaunch);
  const selectQuestionForty = premiumFlow.indexOf('tapOn: "Question 40, unanswered"', openFinalNavigator);
  const assertQuestionForty = premiumFlow.indexOf('assertVisible: "Open question navigator, 40 of 40"', selectQuestionForty);
  const finishAction = premiumFlow.indexOf(`id: "patternly:simulation:action:${sessionId}:finish-simulation"`, assertQuestionForty);
  const finishConfirmation = premiumFlow.indexOf(`id: "patternly:simulation:action:${sessionId}:confirm:finish"`, finishAction);
  const finishedSummary = premiumFlow.indexOf(`id: "patternly:summary:root:${sessionId}"`, finishConfirmation);
  assert.ok(questionTwoAfterRelaunch < openFinalNavigator && openFinalNavigator < selectQuestionForty && selectQuestionForty < assertQuestionForty && assertQuestionForty < finishAction && finishAction < finishConfirmation && finishConfirmation < finishedSummary, "After relaunch, Premium must navigate from Q2 to unanswered Q40 before confirming manual finish");
  assert.match(premiumFlow, /id: "patternly:simulation:option:alg-backtracking-base-contract-001:path_nonempty"\n    text: "radio button, checked"/);
  assert.match(premiumFlow, /id: "patternly:simulation:option:alg-backtracking-base-contract-001:path_length_n"\n    text: "radio button, unchecked"/);
  assert.match(premiumFlow, /id: "patternly:simulation:action:coding-interview-dsa-problem-solving:coding-interview-simulation:1:save-and-continue"[\s\S]*?assertVisible: "Open question navigator, 2 of 40"[\s\S]*?Question 1, answered and saved[\s\S]*?start: 50%, 50%\n    end: 50%, 20%\n    duration: 600[\s\S]*?id: "patternly:simulation:flag:coding-interview-dsa-problem-solving:coding-interview-simulation:1"\n    text: "Flag question for review"[\s\S]*?tapOn:\n    id: "patternly:simulation:flag:coding-interview-dsa-problem-solving:coding-interview-simulation:1"[\s\S]*?id: "patternly:simulation:flag:coding-interview-dsa-problem-solving:coding-interview-simulation:1"\n    text: "Remove flag from question"/);
  assert.match(premiumFlow, /Question 1, current, answered and saved, flagged/);
  assert.match(premiumFlow, /Question 2, unanswered/);
  assert.match(premiumFlow, /stopApp[\s\S]*?launchApp:\n    clearState: false[\s\S]*?extendedWaitUntil:\n    visible:\n      id: "patternly:resume:continue:coding-interview-dsa-problem-solving:coding-interview-simulation:1"[\s\S]*?tapOn:\n    id: "patternly:resume:continue:coding-interview-dsa-problem-solving:coding-interview-simulation:1"[\s\S]*?patternly:simulation:root:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.equal((premiumFlow.match(/assertVisible: "Open question navigator, 1 of 40"/g) ?? []).length, 1);
  assert.equal((premiumFlow.match(/assertVisible: "Open question navigator, 2 of 40"/g) ?? []).length, 4);
  assert.match(premiumFlow, /assertVisible: "Open question navigator, 2 of 40"[\s\S]*?Question 1, answered and saved, flagged/);
  assert.match(premiumFlow, /patternly:simulation:option:alg-backtracking-base-contract-001:path_length_n/);
  assert.match(premiumFlow, /:finish-simulation"[\s\S]*?Action required[\s\S]*?:confirm:finish"[\s\S]*?patternly:summary:root:/);
  assert.match(premiumFlow, /Session complete[\s\S]*?Coding Mock Interview[\s\S]*?assertVisible: "1 \/ 40"/);
  assert.match(premiumFlow, /Question 1 \/ 40/);
  assert.match(premiumFlow, /times: 39[\s\S]*?Question 40 \/ 40/);
  assert.doesNotMatch(premiumFlow, /clearState: true/);
});

test("AUD-02B expiry invokes only the exact Coding Mock command and captures finalized unanswered review", () => {
  assert.match(expiryFlow, /patternly:practice:mode-card:coding-interview-simulation/);
  assert.match(expiryFlow, /main-tab-bar-practice/);
  assert.match(expiryFlow, /patternly:simulation:root:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.equal((expiryFlow.match(/assertVisible: "Open question navigator, 1 of 40"/g) ?? []).length, 1);
  assert.doesNotMatch(expiryFlow, /assertVisible: "1 \/ 40"/);
  assert.match(expiryResultFlow, /patternly:summary:root:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.match(expiryResultFlow, /Session ended without answers/);
  assert.match(expiryResultFlow, /0 \/ 40/);
  assert.match(expiryResultFlow, /patternly:summary:review-answers:coding-interview-dsa-problem-solving:coding-interview-simulation:1/);
  assert.match(expiryResultFlow, /Question 1 \/ 40[\s\S]*?Unanswered/);
  assert.match(expiryResultFlow, /times: 39[\s\S]*?Question 40 \/ 40/);
  assert.doesNotMatch(`${expiryFlow}\n${expiryResultFlow}`, /clearState: true|clock\/advance/);
});
