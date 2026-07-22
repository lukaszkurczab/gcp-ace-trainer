import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runtimeSelectors } from "../src/testing/runtimeSelectors";

type Manifest = Readonly<{
  m3: Readonly<{ feedbackTiming: "atSessionEnd"; itemId: string; length: 10; selectedOptionId: string; sessionId: string }>;
  m4: Readonly<{ expectedResult: "incorrect"; feedbackTiming: "afterEachAnswer"; itemId: string; length: 10; selectedOptionId: string; sessionId: string }>;
  m5: Readonly<{ completedSessionId: string }>;
}>;

const manifest = JSON.parse(readFileSync(".maestro/m3-m5.expected-sessions.json", "utf8")) as Manifest;
const m3 = readFileSync(".maestro/m3-custom-at-session-end.yaml", "utf8");
const m4 = readFileSync(".maestro/m4-custom-after-each-answer.yaml", "utf8");
const m5 = readFileSync(".maestro/m5-completed-session-relaunch.yaml", "utf8");

test("M3 keeps the same Custom Practice session and withholds feedback across leave, kill, and resume", () => {
  assertRuntimeSessionBootstrap(m3, manifest.m3);
  assert.match(m3, new RegExp(escape(runtimeSelectors.session.option(manifest.m3.itemId, manifest.m3.selectedOptionId))));
  assert.match(m3, new RegExp(escape(runtimeSelectors.session.submit(manifest.m3.itemId))));
  for (const selector of [
    runtimeSelectors.session.feedback(manifest.m3.itemId),
    runtimeSelectors.session.result(manifest.m3.itemId, "correct"),
    runtimeSelectors.session.reason(manifest.m3.itemId),
    runtimeSelectors.session.details(manifest.m3.itemId),
  ]) {
    assert.equal(count(m3, `assertNotVisible:\n    id: "${selector}"`), 2, `M3 must withhold ${selector} before and after relaunch`);
  }
});

test("M4 restores the exact Custom Practice durable feedback after leave, kill, and resume", () => {
  assertRuntimeSessionBootstrap(m4, manifest.m4);
  assert.match(m4, new RegExp(escape(runtimeSelectors.session.option(manifest.m4.itemId, manifest.m4.selectedOptionId))));
  assert.match(m4, new RegExp(escape(runtimeSelectors.session.submit(manifest.m4.itemId))));
  for (const selector of [
    runtimeSelectors.session.feedback(manifest.m4.itemId),
    runtimeSelectors.session.reason(manifest.m4.itemId),
    runtimeSelectors.session.result(manifest.m4.itemId, manifest.m4.expectedResult),
  ]) {
    assert.equal(count(m4, `assertVisible:\n    id: "${selector}"`), 2, `M4 must restore ${selector} after relaunch`);
  }
});

test("M5 reuses the complete M1 flow and proves a terminal session has no active resume path after relaunch", () => {
  assert.match(m5, /- runFlow: m1-guided-10\.yaml/);
  assert.match(m5, new RegExp(escape(runtimeSelectors.home.trackCard("algorithms"))));
  assert.match(m5, new RegExp(escape(runtimeSelectors.resume.card(manifest.m5.completedSessionId))));
  assert.match(m5, new RegExp(escape(runtimeSelectors.session.root(manifest.m5.completedSessionId))));
  assert.match(m5, new RegExp(escape(runtimeSelectors.practice.hubRoot())));
  assert.doesNotMatch(m5, /point:|text:/);
});

function assertRuntimeSessionBootstrap(flow: string, session: Readonly<{ feedbackTiming: "afterEachAnswer" | "atSessionEnd"; itemId: string; length: number; sessionId: string }>): void {
  assert.match(flow, /- killApp\n- launchApp/);
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.configuration(session.sessionId, session.length, session.feedbackTiming))));
  assert.equal(count(flow, `id: "${runtimeSelectors.session.question(session.itemId)}"`), 2, "flow must resume the exact current item");
  assert.match(flow, new RegExp(escape(runtimeSelectors.resume.card(session.sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.resume.continue(session.sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.leave(session.sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.leaveAndResume(session.sessionId))));
  assert.doesNotMatch(flow, /point:|text:/);
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
