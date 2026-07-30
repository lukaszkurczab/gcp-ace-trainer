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
  assert.match(flow, /visible:\n        id: "patternly:home:change-track"/);
  assert.match(flow, /tapOn:\n          id: "patternly:home:change-track"/);
  assert.match(flow, /patternly:home:select-track:algorithms/);
  assert.match(flow, /patternly:home:track-card:algorithms/);
});

test("RC Algorithms runners require an explicit device, local dev-client, output destination, and flow", () => {
  for (const path of ["scripts/runRcAlgorithmsIos.mjs", "scripts/runRcAlgorithmsAndroid.mjs"]) {
    const runner = readFileSync(path, "utf8");
    assert.match(runner, /PATTERNLY_DEV_CLIENT_URL/);
    assert.match(runner, /MAESTRO_TEST_OUTPUT_DIR/);
    assert.match(runner, /--flow/);
    assert.match(runner, /exp\+patternly/);
  }
});
