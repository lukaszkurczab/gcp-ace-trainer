import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function compactYaml(source: string): string {
  return source.replace(/\s+/g, " ").trim();
}

function assertInOrder(source: string, ...fragments: readonly string[]): void {
  let cursor = 0;
  for (const fragment of fragments) {
    const index = source.indexOf(fragment, cursor);
    assert.ok(index >= 0, `Expected YAML fragment after offset ${cursor}: ${fragment}`);
    cursor = index + fragment.length;
  }
}

test("RC Algorithms bootstrap resets learning data and explicitly selects the Algorithms track", () => {
  const flow = readFileSync(".maestro/rc-algorithms-bootstrap.yaml", "utf8");
  const listener = readFileSync(".maestro/rc-runtime-audit-listener-ready.yaml", "utf8");
  const devMenu = readFileSync(".maestro/rc-runtime-dev-menu-continue.yaml", "utf8");
  assert.match(listener, /patternly:content:audit-command-listener:ready/);
  assert.match(readFileSync(".maestro/rc-runtime-audit-reset-complete.yaml", "utf8"), /patternly:content:ready-after-audit-reset/);
  assert.equal((devMenu.match(/text: "Continue"\n    optional: true\n    retryTapIfNoChange: true/g) ?? []).length, 2);
  assert.doesNotMatch(devMenu, /when:\n      visible: "Continue"/);
  const normalizedFlow = compactYaml(flow);
  const initialReady = compactYaml(`extendedWaitUntil:
    visible:
      id: "account-guest|main-tab-bar|patternly:home:select-track:root"
    timeout: 30000`);
  const afterGuestReady = compactYaml(`extendedWaitUntil:
    visible:
      id: "main-tab-bar|patternly:home:select-track:root"
    timeout: 30000`);
  const guestBranch = compactYaml(`runFlow:
    when:
      visible:
        id: "account-guest"
    commands:
      - tapOn:
          id: "account-guest"`);
  const noTrackBranch = compactYaml(`runFlow:
    when:
      notVisible:
        id: "patternly:home:track-card:coding-interview-dsa-problem-solving"`);
  const finalReady = compactYaml(`extendedWaitUntil:
    visible:
      id: "patternly:home:track-card:coding-interview-dsa-problem-solving"
    timeout: 30000`);
  const finalAssertion = compactYaml(`assertVisible:
    id: "patternly:home:track-card:coding-interview-dsa-problem-solving"`);

  assertInOrder(normalizedFlow, initialReady, guestBranch, afterGuestReady, noTrackBranch, finalReady, finalAssertion);
  const noTrackBranchIndex = normalizedFlow.indexOf(noTrackBranch);
  const finalReadyIndex = normalizedFlow.indexOf(finalReady, noTrackBranchIndex);
  assert.ok(noTrackBranchIndex >= 0 && finalReadyIndex > noTrackBranchIndex);
  const noTrackCommands = normalizedFlow.slice(noTrackBranchIndex, finalReadyIndex);
  assertInOrder(
    noTrackCommands,
    compactYaml(`runFlow:
      when:
        visible:
          id: "patternly:home:change-track"
      commands:
        - tapOn:
            id: "patternly:home:change-track"
            retryTapIfNoChange: true`),
    compactYaml(`scrollUntilVisible:
      element:
        id: "patternly:home:select-track:coding-interview-dsa-problem-solving"
      direction: DOWN
      centerElement: false
      timeout: 30000
      visibilityPercentage: 50`),
    compactYaml(`tapOn:
      id: "patternly:home:select-track:coding-interview-dsa-problem-solving"`),
    compactYaml(`tapOn:
      id: "patternly:home:select-track:continue"`),
  );
  assert.equal((flow.match(/- runFlow:/g) ?? []).length, 3);
  assert.equal((flow.match(/id: "patternly:home:change-track"/g) ?? []).length, 2);
  assert.equal((flow.match(/retryTapIfNoChange: true/g) ?? []).length, 1);
  assert.doesNotMatch(flow, /openLink:|point:|coordinates:|repeat:/);
  assert.equal((flow.match(/id: "patternly:home:select-track:coding-interview-dsa-problem-solving"/g) ?? []).length, 2);
  assert.equal((flow.match(/id: "patternly:home:track-card:coding-interview-dsa-problem-solving"/g) ?? []).length, 3);
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
