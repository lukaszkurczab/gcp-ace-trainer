import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runtimeSelectors } from "../src/testing/runtimeSelectors";

const flow = readFileSync(
  ".maestro/algorithms-session-dry-run-regression.yaml",
  "utf8",
);
const sessionId = "algorithms:algorithms-guided-practice:1";
const itemId = "alg-complexity-amortized-001";

test("dry-run regression starts the recommended session directly and proves its live timer", () => {
  assert.equal(count(flow, runtimeSelectors.practice.startSession()), 1);
  assert.doesNotMatch(flow, new RegExp(escape(runtimeSelectors.practice.setupRoot())));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.question(itemId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.mode("algorithms-guided-practice"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.configuration(sessionId, 20, "afterEachAnswer"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.timer(sessionId))));
  assert.match(flow, /visible: "Active foreground time 00:0\[1-9\]"\n\s+timeout: 5000/);
});

test("dry-run regression ends early into a truthful partial summary", () => {
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.leave(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.session.abandon(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.root(sessionId))));
  assert.match(flow, /assertVisible: "Partial summary"/);
  assert.match(flow, /assertVisible: "0 answered · 20 unanswered"/);
  assert.match(flow, /assertVisible: "Score is shown only after a completed session\."/);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
