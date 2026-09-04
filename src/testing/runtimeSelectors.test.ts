import assert from "node:assert/strict";
import test from "node:test";

import { isRuntimeSelectorId, runtimeSelectors } from "./runtimeSelectors";

test("runtime selectors are deterministic and use the canonical grammar", () => {
  const selector = runtimeSelectors.session.option("alg-complexity-amortized-001", "amortized-o1");

  assert.equal(selector, "patternly:session:option:alg-complexity-amortized-001:amortized-o1");
  assert.equal(runtimeSelectors.session.option("alg-complexity-amortized-001", "amortized-o1"), selector);
  assert.equal(isRuntimeSelectorId(selector), true);
  assert.equal(isRuntimeSelectorId("patternly:session:option:invalid value"), false);
  assert.equal(isRuntimeSelectorId("patternly:session"), false);
});

test("runtime selectors preserve canonical identities without learner-visible copy", () => {
  const itemId = "alg-complexity-amortized-001";
  const prompt = "Which statement about amortized complexity is correct?";
  const selectors = [
    runtimeSelectors.session.question(itemId),
    runtimeSelectors.session.option(itemId, "amortized-o1"),
    runtimeSelectors.session.feedback(itemId),
    runtimeSelectors.resume.card("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1"),
  ];

  assert.ok(selectors.every((selector) => isRuntimeSelectorId(selector)));
  assert.ok(selectors.every((selector) => !selector.includes(prompt)));
  assert.ok(selectors.every((selector) => !/\s/.test(selector)));
});

test("runtime selectors preserve case-sensitive authored item identities", () => {
  const itemId = "CCARP-D01-O01-boundary";
  const question = runtimeSelectors.session.question(itemId);
  const feedback = runtimeSelectors.session.feedback(itemId);

  assert.equal(question, "patternly:session:question:CCARP-D01-O01-boundary");
  assert.equal(feedback, "patternly:session:feedback:CCARP-D01-O01-boundary");
  assert.equal(isRuntimeSelectorId(question), true);
  assert.notEqual(question, runtimeSelectors.session.question(itemId.toLowerCase()));
});

test("session metadata selectors expose validated lifecycle values without learner copy", () => {
  const sessionId = "coding-interview-dsa-problem-solving:coding-interview-guided-practice:1";
  const counter = runtimeSelectors.session.counter(sessionId, 3, 10);
  const configuration = runtimeSelectors.session.configuration(sessionId, 10, "afterEachAnswer");

  assert.equal(counter, "patternly:session:counter:coding-interview-dsa-problem-solving:coding-interview-guided-practice:1:ordinal:3:length:10");
  assert.equal(configuration, "patternly:session:configuration:coding-interview-dsa-problem-solving:coding-interview-guided-practice:1:length:10:feedback-timing:after-each-answer");
  assert.equal(isRuntimeSelectorId(counter), true);
  assert.equal(isRuntimeSelectorId(configuration), true);
});

test("complexity selectors encode authored notation without weakening the selector grammar", () => {
  const selector = runtimeSelectors.session.complexityValue(
    "alg-hms-complement-expected-cost",
    "extra_space",
    "O(n)",
  );

  assert.equal(
    selector,
    "patternly:session:complexity-value:alg-hms-complement-expected-cost:extra_space:v-4f_28_6e_29",
  );
  assert.equal(isRuntimeSelectorId(selector), true);
  assert.notEqual(
    runtimeSelectors.session.complexityValue("item-1", "time", "O(N)"),
    runtimeSelectors.session.complexityValue("item-1", "time", "O(n)"),
  );
  assert.throws(
    () => runtimeSelectors.session.complexityValue("item-1", "time", ""),
    /complexity value cannot be empty/,
  );
});

test("runtime selectors keep distinct runtime entities distinct", () => {
  const selectors = new Set([
    runtimeSelectors.home.trackCard("coding-interview-dsa-problem-solving"),
    runtimeSelectors.content.preparing("verifying-content"),
    runtimeSelectors.content.unavailable(),
    runtimeSelectors.content.ready(),
    runtimeSelectors.content.readyAfterAuditReset(),
    runtimeSelectors.practice.modeCard("coding-interview-guided-practice"),
    runtimeSelectors.practice.declaredScope("hash_map_and_set"),
    runtimeSelectors.practice.openSetup(),
    runtimeSelectors.practice.customEntry(),
    runtimeSelectors.practice.customSetupTitle(),
    runtimeSelectors.practice.sessionLength(10),
    runtimeSelectors.practice.sessionLength(20),
    runtimeSelectors.practice.feedbackTiming("afterEachAnswer"),
    runtimeSelectors.practice.feedbackTiming("atSessionEnd"),
    runtimeSelectors.session.submit("alg-complexity-amortized-001"),
    runtimeSelectors.session.continue("alg-complexity-amortized-001"),
    runtimeSelectors.session.complexityValue("alg-complexity-amortized-001", "time", "O(n)"),
    runtimeSelectors.session.leaveAndResume("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1"),
    runtimeSelectors.session.counter("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1", 1, 10),
    runtimeSelectors.session.configuration("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1", 10, "afterEachAnswer"),
    runtimeSelectors.summary.root("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1"),
    runtimeSelectors.summary.backToPractice("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1"),
    runtimeSelectors.summary.configuration("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1", 10, "atSessionEnd"),
    runtimeSelectors.summary.feedbackItem("coding-interview-dsa-problem-solving:coding-interview-guided-practice:1", "occurrence:1"),
    runtimeSelectors.progress.root(),
    runtimeSelectors.progress.node("complexity"),
    runtimeSelectors.simulation.root("coding-interview-dsa-problem-solving:coding-interview-simulation:2"),
    runtimeSelectors.simulation.navigator("coding-interview-dsa-problem-solving:coding-interview-simulation:2:occurrence:1"),
  ]);

  assert.equal(selectors.size, 28);
});

test("runtime selector factories reject values that cannot be represented in the contract", () => {
  assert.throws(() => runtimeSelectors.session.question("prompt text is not an id"), /Runtime selector identities/);
  assert.throws(() => runtimeSelectors.practice.sessionLength(1.5), /session length/);
  assert.throws(() => runtimeSelectors.session.counter("session-1", 0, 10), /session ordinal/);
  assert.throws(() => runtimeSelectors.session.counter("session-1", 11, 10), /cannot exceed/);
});
