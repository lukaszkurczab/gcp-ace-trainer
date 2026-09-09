import assert from "node:assert/strict";
import test from "node:test";

import { createLearningPlanSlotId, createProposalSlotId } from "../domain";
import { isRuntimeSelectorId, runtimeSelectors, type LearningPlanPrimaryState, type TargetDateGuidanceReason, type TargetDateGuidanceState } from "./runtimeSelectors";

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

test("learning plan selectors use the closed primary states and stable slot identities", () => {
  const states: readonly LearningPlanPrimaryState[] = [
    "loading", "stale", "no_goal", "goal_paused", "package_error", "package_unavailable", "generator_error",
    "shortfall", "shortened", "ready", "accepted",
  ];
  for (const state of states) {
    assert.equal(runtimeSelectors.learningPlan.state(state), `patternly:learning-plan:state:${state}`);
  }
  assert.throws(() => runtimeSelectors.learningPlan.state("unknown" as LearningPlanPrimaryState), /Unknown learning plan primary state/);

  const proposalSlotId = createProposalSlotId("proposal-slot:v1:mon:18-00");
  const persistedSlotId = createLearningPlanSlotId("editor:one:slot:2");
  assert.equal(runtimeSelectors.learningPlan.slot(proposalSlotId), "patternly:learning-plan:slot:proposal-slot:v1:mon:18-00");
  assert.equal(runtimeSelectors.learningPlan.slot(persistedSlotId), "patternly:learning-plan:slot:editor:one:slot:2");
  assert.throws(() => createProposalSlotId("mon"), /canonical v1 identity/);
});

test("learning plan editor retry selectors distinguish save from start-existing", () => {
  assert.equal(runtimeSelectors.learningPlan.editorRetry(), "patternly:learning-plan:editor:retry-save");
  assert.equal(runtimeSelectors.learningPlan.editorRetry("start-existing"), "patternly:learning-plan:editor:retry-start-existing");
  assert.equal(runtimeSelectors.learningPlan.editorError("start-existing-storage"), "patternly:learning-plan:editor:error:start-existing-storage");
  assert.equal(runtimeSelectors.learningPlan.actionError("open-proposal-storage"), "patternly:learning-plan:action-error:open-proposal-storage");
  assert.equal(runtimeSelectors.learningPlan.actionError("open-existing-storage"), "patternly:learning-plan:action-error:open-existing-storage");
  assert.equal(runtimeSelectors.learningPlan.actionError("accept-storage"), "patternly:learning-plan:action-error:accept-storage");
});

test("notification selectors keep plan slots and closed error states typed", () => {
  assert.equal(runtimeSelectors.notifications.root(), "patternly:notifications:root");
  assert.equal(runtimeSelectors.notifications.planSchedule(), "patternly:notifications:plan-schedule");
  assert.equal(runtimeSelectors.notifications.slot(createLearningPlanSlotId("editor:one:slot:2")), "patternly:notifications:slot:editor:one:slot:2");
  assert.equal(runtimeSelectors.notifications.permission("granted"), "patternly:notifications:permission:granted");
  assert.equal(runtimeSelectors.notifications.state("synced"), "patternly:notifications:state:synced");
  for (const reason of ["missing_track", "missing_goal", "missing_plan", "identity_mismatch", "goal_paused", "plan_paused", "plan_completed", "no_slots", "timezone_mismatch", "permission_denied", "scheduler_failure", "concurrent_change"] as const) {
    assert.equal(runtimeSelectors.notifications.error(reason), `patternly:notifications:error:${reason.replaceAll("_", "-")}`);
  }
  assert.equal(runtimeSelectors.notifications.retry(), "patternly:notifications:retry");
  assert.equal(runtimeSelectors.notifications.pending(), "patternly:notifications:pending");
  assert.throws(() => runtimeSelectors.notifications.state("unknown" as never), /Unknown notification settings state/);
});

test("target date guidance selectors expose every closed state and reason", () => {
  const states: readonly TargetDateGuidanceState[] = [
    "no_goal", "goal_paused", "no_plan", "update_required", "plan_paused", "completed", "overdue", "unreachable", "at_risk", "on_track", "open_ended", "unavailable",
  ];
  const reasons: readonly TargetDateGuidanceReason[] = [
    "no_goal", "goal_paused", "no_plan", "target_changed", "package_changed", "cadence_changed", "plan_paused", "completed", "overdue", "insufficient_sessions", "no_future_slots", "at_risk", "on_track", "no_target", "unknown_completion_rule", "insufficient_elapsed_evidence", "calculation_error",
  ];
  for (const surface of ["home", "progress"] as const) {
    assert.equal(runtimeSelectors.targetDateGuidance.root(surface), `patternly:target-date-guidance:root:${surface}`);
    assert.equal(runtimeSelectors.targetDateGuidance.primary(surface), `patternly:target-date-guidance:primary:${surface}`);
    for (const state of states) assert.equal(runtimeSelectors.targetDateGuidance.state(surface, state), `patternly:target-date-guidance:state:${surface}:${state.replaceAll("_", "-")}`);
    for (const reason of reasons) assert.equal(runtimeSelectors.targetDateGuidance.reason(surface, reason), `patternly:target-date-guidance:reason:${surface}:${reason.replaceAll("_", "-")}`);
  }
  for (const fact of ["required-pace", "actual-pace", "forecast", "target"] as const) {
    assert.equal(runtimeSelectors.targetDateGuidance.fact(fact), `patternly:target-date-guidance:fact:${fact}`);
  }
  assert.equal(runtimeSelectors.targetDateGuidance.secondary(), "patternly:target-date-guidance:secondary");
  assert.throws(() => runtimeSelectors.targetDateGuidance.state("home", "future" as TargetDateGuidanceState), /Unknown target date guidance state/);
  assert.throws(() => runtimeSelectors.targetDateGuidance.reason("home", "future" as TargetDateGuidanceReason), /Unknown target date guidance reason/);
  assert.throws(() => runtimeSelectors.targetDateGuidance.root("settings" as "home"), /Unknown target date guidance surface/);
  assert.ok(isRuntimeSelectorId(runtimeSelectors.targetDateGuidance.state("home", "at_risk")));
});

test("Home plan selectors expose every closed unavailable reason", () => {
  const reasons = [
    "invalid_request", "concurrent_change", "storage_error", "corrupt_record", "identity_mismatch",
    "package_error", "package_unavailable", "calculation_error", "unsupported_action",
  ] as const;
  for (const reason of reasons) {
    assert.equal(runtimeSelectors.homePlan.reason(reason), `patternly:home-plan:reason:${reason.replaceAll("_", "-")}`);
  }
  assert.throws(() => runtimeSelectors.homePlan.reason("future" as never), /Unknown Home plan unavailable reason/);
});

test("Progress plan selectors expose typed completion, day and unavailable identities", () => {
  assert.equal(runtimeSelectors.progressPlan.root(), "patternly:progress-plan:root");
  assert.equal(runtimeSelectors.progressPlan.completion("in_progress"), "patternly:progress-plan:completion:in-progress");
  assert.equal(runtimeSelectors.progressPlan.completion("completed"), "patternly:progress-plan:completion:completed");
  assert.equal(runtimeSelectors.progressPlan.day("scheduled"), "patternly:progress-plan:day:scheduled");
  assert.equal(runtimeSelectors.progressPlan.day("completed"), "patternly:progress-plan:day:completed");
  assert.equal(runtimeSelectors.progressPlan.day("skipped"), "patternly:progress-plan:day:skipped");
  assert.equal(runtimeSelectors.progressPlan.day("rest"), "patternly:progress-plan:day:rest");
  assert.equal(runtimeSelectors.progressPlan.session(), "patternly:progress-plan:session");
  assert.equal(runtimeSelectors.progressPlan.activeSession(), "patternly:progress-plan:active-session");
  assert.equal(runtimeSelectors.progressPlan.unavailable("identity_mismatch"), "patternly:progress-plan:unavailable:identity-mismatch");
  assert.throws(() => runtimeSelectors.progressPlan.completion("future" as never), /Unknown Progress plan completion state/);
  assert.throws(() => runtimeSelectors.progressPlan.day("future" as never), /Unknown Progress plan day status/);
});
