import test from "node:test";
import assert from "node:assert/strict";
import { androidClockProbeEnabled, isAndroidClockPreparedRequest, parseAndroidClockProbeUrl } from "./androidClockProbeProtocol";
const run = "36250bed-f3a6-444d-a68c-92b1f24db701";
const attempt = "82000846-ad42-4b3c-aa10-8924d49437b8";
const url = `com.lkurczab.patternly://android-clock-probe/${run}/${attempt}/stall`;

test("prepared file command is complete and bound to one exact case and run", () => {
  const valid = { protocol: "patternly.android-clock-probe.v1", runId: run, caseId: attempt };
  assert.equal(isAndroidClockPreparedRequest(valid, run, attempt), true);
  for (const request of [null, [], {}, { ...valid, caseId: run }, { ...valid, runId: attempt }, { ...valid, protocol: "other" }, { ...valid, reset: true }]) {
    assert.equal(isAndroidClockPreparedRequest(request, run, attempt), false);
  }
});

test("diagnostic command requires the exact run and bounded operation", () => {
  assert.deepEqual(parseAndroidClockProbeUrl(url, run), { caseId: attempt, action: "stall" });
  for (const value of [url + "?duration=100000", url + "#x", url.replace("/stall", "/reset"), url.replace(attempt, "anything"), url.replace(run, attempt), url.replace("android-clock-probe", "evil"), url + "/extra"]) {
    assert.equal(parseAndroidClockProbeUrl(value, run), null, value);
  }
});

test("diagnostic runtime remains disabled outside explicit Android sandbox build", () => {
  assert.equal(androidClockProbeEnabled(run, "sandbox", "android"), true);
  for (const [id, runtime, os] of [[undefined, "sandbox", "android"], [run, "release", "android"], [run, "smoke", "android"], [run, "sandbox", "ios"], ["true", "sandbox", "android"]]) {
    assert.equal(androidClockProbeEnabled(id, runtime, os!), false);
  }
});


test("native fault commands are fixed fixture-only operations under the exact diagnostic run", () => {
  for (const scenario of ["read", "write-before", "write-after", "readback", "backward"]) {
    const action = `fixture-fault-${scenario}`;
    assert.deepEqual(parseAndroidClockProbeUrl(url.replace("/stall", `/${action}`), run), {caseId: attempt, action});
  }
  for (const action of ["fault-read", "fixture-fault-reset", "fixture-fault-write", "fixture-fault-backward?time=-1"]) {
    assert.equal(parseAndroidClockProbeUrl(url.replace("/stall", `/${action}`), run), null);
  }
});
