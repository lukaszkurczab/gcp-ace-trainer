import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runtimeSelectors } from "../../testing/runtimeSelectors";

const flow = readFileSync(
  ".maestro/algorithms-session-dry-run-regression.yaml",
  "utf8",
);
const sessionId = "coding-interview-dsa-problem-solving:coding-interview-guided-practice:1";
const itemId = "alg-complexity-amortized-001";

test("dry-run regression starts the recommended session directly and proves its live timer", () => {
  assert.equal(count(flow, runtimeSelectors.practice.startSession()), 1);
  assert.doesNotMatch(flow, new RegExp(escape(runtimeSelectors.practice.setupRoot())));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.question(itemId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.mode("coding-interview-guided-practice"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.configuration(sessionId, 20, "afterEachAnswer"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.timer(sessionId))));
  assert.match(flow, /visible: "Active foreground time 00:0\[1-9\]"\n\s+timeout: 5000/);
});

test("dry-run regression ends early into a truthful partial summary", () => {
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.leave(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.abandon(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.root(sessionId))));
  assert.match(flow, /assertVisible: "Session ended without answers"/);
  assert.match(flow, /assertVisible: "Answered"/);
  assert.ok(flow.includes('assertVisible: "0 / 20"'));
  assert.match(flow, /assertVisible: "No answers were submitted\."/);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
