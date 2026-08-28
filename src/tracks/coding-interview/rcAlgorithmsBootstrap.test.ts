import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("RC Algorithms bootstrap resets learning data and explicitly selects the Algorithms track", () => {
  const flow = readFileSync(".maestro/rc-algorithms-bootstrap.yaml", "utf8");
  const listener = readFileSync(".maestro/rc-runtime-audit-listener-ready.yaml", "utf8");
  const devMenu = readFileSync(".maestro/rc-runtime-dev-menu-continue.yaml", "utf8");
  assert.match(listener, /patternly:content:audit-command-listener:ready/);
  assert.match(readFileSync(".maestro/rc-runtime-audit-reset-complete.yaml", "utf8"), /patternly:content:ready-after-audit-reset/);
  assert.equal((devMenu.match(/text: "Continue"\n    optional: true\n    retryTapIfNoChange: true/g) ?? []).length, 2);
  assert.doesNotMatch(devMenu, /when:\n      visible: "Continue"/);
  const waitForShell = flow.indexOf('- extendedWaitUntil:\n    visible:\n      id: "main-tab-bar"\n    timeout: 30000');
  const homeBranch = flow.indexOf('- runFlow:\n    when:\n      visible:\n        id: "patternly:home:change-track"');
  const selectAlgorithms = flow.indexOf('- scrollUntilVisible:\n    element:\n      id: "patternly:home:select-track:coding-interview-dsa-problem-solving"');
  assert.ok(waitForShell >= 0 && homeBranch > waitForShell && selectAlgorithms > homeBranch);
  assert.equal((flow.match(/- runFlow:/g) ?? []).length, 1);
  assert.equal((flow.match(/id: "patternly:home:change-track"/g) ?? []).length, 2);
  assert.match(flow, /commands:\n      - tapOn:\n          id: "patternly:home:change-track"\n          retryTapIfNoChange: true/);
  assert.equal((flow.match(/retryTapIfNoChange: true/g) ?? []).length, 1);
  assert.doesNotMatch(flow, /openLink:|point:|coordinates:|repeat:/);
  assert.match(flow, /scrollUntilVisible:\n    element:\n      id: "patternly:home:select-track:coding-interview-dsa-problem-solving"[\s\S]*?timeout: 30000[\s\S]*?- tapOn:\n    id: "patternly:home:select-track:coding-interview-dsa-problem-solving"/);
  assert.equal((flow.match(/id: "patternly:home:select-track:coding-interview-dsa-problem-solving"/g) ?? []).length, 2);
  assert.match(flow, /scrollUntilVisible:\n    element:\n      id: "patternly:home:track-card:coding-interview-dsa-problem-solving"[\s\S]*?timeout: 30000[\s\S]*?- assertVisible:\n    id: "patternly:home:track-card:coding-interview-dsa-problem-solving"/);
  assert.equal((flow.match(/id: "patternly:home:track-card:coding-interview-dsa-problem-solving"/g) ?? []).length, 2);
});

test("RC Algorithms iOS runner validates and passes explicit capture inputs only to the final Maestro flow", () => {
  const runner = readFileSync("scripts/runRcAlgorithmsIos.mjs", "utf8");
  assert.match(runner, /PATTERNLY_DEV_CLIENT_URL/);
  assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR/);
  assert.match(runner, /--flow/);
  assert.match(runner, /exp\+patternly/);
  assert.match(runner, /capturePlatform !== "ios"/);
  assert.match(runner, /\["light", "dark"\]\.includes\(captureTheme\)/);
  assert.match(runner, /resolve\(required\("SCREENSHOT_ROOT"\)\)/);
  assert.ok(runner.includes('"-e", `SCREENSHOT_ROOT=${screenshotRoot}`'));
  assert.ok(runner.includes('"-e", `THEME=${captureTheme}`'));
  assert.ok(runner.includes('"-e", `PLATFORM=${capturePlatform}`'));
  assert.ok(runner.includes('"-e", `PATTERNLY_DEV_CLIENT_URL=${devClientUrl}`'));
  assert.equal((runner.match(/\.\.\.captureEnvironmentArgs/g) ?? []).length, 1);
  assert.match(runner, /run\("maestro", \["test",[^\n]*\.\.\.captureEnvironmentArgs, flow\], \{ stdio: "inherit" \}\);/);
});
