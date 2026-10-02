import assert from "node:assert/strict";
import test from "node:test";

import { createLearningPlanProposalFixtureRuntime as createSmokeRuntime } from "./learningPlanProposalFixtureRuntime.smoke";
import { createLearningPlanProposalFixtureRuntime as createDisabledRuntime } from "./learningPlanProposalFixtureRuntime.disabled";
import { LEARNING_PLAN_PROPOSAL_FIXTURE_CASES } from "./learningPlanProposalFixtureCommand";

const proposalId = "ui11-fixture-proposal";
const trackId = "coding-interview-dsa-problem-solving";

test("named proposal fixture cases produce domain-generated screen states with the declared schedule shape", async () => {
  for (const scenario of LEARNING_PLAN_PROPOSAL_FIXTURE_CASES) {
    const runtime = createSmokeRuntime(scenario);
    const result = await runtime.resolve(proposalId, trackId);
    if (scenario === "stale") { assert.equal(result.kind, "stale"); continue; }
    if (scenario === "unavailable") { assert.equal(result.kind, "package_unavailable"); continue; }
    assert.ok("proposal" in result, scenario);
    if (!("proposal" in result)) continue;
    assert.equal(result.kind, scenario === "shortfall" ? "shortfall" : scenario === "shortened" ? "shortened" : "ready");
    assert.equal(result.proposal.outcome.slots.length, scenario === "ready1-target" ? 1 : scenario === "ready7-target" ? 7 : scenario === "shortfall" ? 0 : 3);
    assert.equal(result.proposal.outcome.targetAssessment.kind, scenario === "ready1-target" || scenario === "ready7-target" ? "achievable" : scenario === "shortfall" ? "unavailable_due_to_shortfall" : scenario === "quality-unmet-target" ? "quality_requirement_unmet" : "open_ended");
    if (scenario === "shortened") assert.deepEqual(result.proposal.outcome.sessionCapacity, { kind: "shortened", actualLength: 4, requestedLength: 10 });
  }
});

test("fixture actions report one in-memory call and never report storage success", async () => {
  for (const [scenario, expected] of [["ready3-no-target", "storage_error"], ["quality-unmet-target", "storage_error"], ["quality-unmet-open-ended", "storage_error"], ["accept-validation", "validation_error"], ["accept-stale", "stale"]] as const) {
    const runtime = createSmokeRuntime(scenario);
    const result = await runtime.accept(proposalId, trackId, { body: "local", title: "local" });
    assert.equal(result.kind, expected);
    assert.equal(runtime.getFixtureInvocationCounts?.().accept, 1);
    assert.notEqual(result.kind, "plan_saved_reminders_synced");
  }
  for (const [scenario, expected] of [["edit-storage", "storage_error"], ["edit-stale", "stale"]] as const) {
    const runtime = createSmokeRuntime(scenario);
    const result = await runtime.startProposalEdit(proposalId, trackId);
    assert.equal(result.kind, expected);
    assert.equal(runtime.getFixtureInvocationCounts?.()["edit-proposal"], 1);
  }
  const invalidIdentityRuntime = createSmokeRuntime("ready3-no-target");
  assert.equal((await invalidIdentityRuntime.resolve("invented-id", trackId)).kind, "stale");
  assert.equal((await invalidIdentityRuntime.accept("invented-id", trackId, { body: "local", title: "local" })).kind, "stale");
  assert.equal((await invalidIdentityRuntime.startProposalEdit("invented-id", trackId)).kind, "stale");
});

test("delayed loading remains pending before it resolves to the ready view", async () => {
  const runtime = createSmokeRuntime("delayed-loading");
  let settled = false;
  const pending = runtime.resolve(proposalId, trackId).then((result) => { settled = true; return result; });
  await Promise.resolve();
  assert.equal(settled, false);
  const result = await pending;
  assert.equal(settled, true);
  assert.equal(result.kind, "ready");
});

test("disabled fixture peer is an explicit unavailable implementation", () => {
  assert.throws(() => createDisabledRuntime("ready3-no-target"), /unavailable in this runtime/);
});
