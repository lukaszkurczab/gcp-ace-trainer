import assert from "node:assert/strict";
import test from "node:test";
import { estimatePlanningWork } from "./planningWorkEstimate";

const scopeA = { nodeId: "node-a", mentalUnitId: "unit-a" } as const;
const scopeB = { nodeId: "node-a", mentalUnitId: "unit-b" } as const;
const contentVersion = "artifact-v2";
const artifactSha256 = "a".repeat(64);
const planningPolicyIdentity = { contentVersion: "policy-v2", artifactSha256: "b".repeat(64), policyVersion: "2026-10-08-authored-v1" };
const policy = {
  schemaVersion: "patternly-learning-planning-policy-v1" as const,
  policyVersion: "2026-10-08-authored-v1",
  workEstimates: [
    { estimateId: "estimate-a", modeId: "mode", scopeRefs: [scopeA], minMinutesPerResponse: 2, typicalMinutesPerResponse: 3, maxMinutesPerResponse: 5, provenance: "authored" as const, observationCount: 0 as const, rationale: "Short retrieval", reviewReserve: { kind: "authored_estimate" as const, minAdditionalResponsesPerNewResponse: 0.25, typicalAdditionalResponsesPerNewResponse: 0.5, maxAdditionalResponsesPerNewResponse: 1, provenance: "authored" as const, observationCount: 0 as const, rationale: "Occasional retrieval" } },
    { estimateId: "estimate-b", modeId: "mode", scopeRefs: [scopeB], minMinutesPerResponse: 4, typicalMinutesPerResponse: 6, maxMinutesPerResponse: 8, provenance: "authored" as const, observationCount: 0 as const, rationale: "Longer tradeoff", reviewReserve: { kind: "authored_estimate" as const, minAdditionalResponsesPerNewResponse: 0.25, typicalAdditionalResponsesPerNewResponse: 0.5, maxAdditionalResponsesPerNewResponse: 1, provenance: "authored" as const, observationCount: 0 as const, rationale: "Occasional retrieval" } },
  ],
};

test("estimates only exact planned scopes, adds scoped reserve and real due reviews once", () => {
  const result = estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 2 }, { ...scopeB, responses: 1 }], dueReviews: [scopeA] });
  assert.deepEqual(result, {
    kind: "estimated", provenance: "authored", policyVersion: policy.policyVersion, contentVersion, artifactSha256, observationCount: 0,
    newResponses: 3, dueReviewResponses: 1,
    minMinutes: 12, typicalMinutes: 21, maxMinutes: 41, uncertaintyMinutes: 29,
    rationaleByEstimate: [{ estimateId: "estimate-a", rationale: "Short retrieval" }, { estimateId: "estimate-b", rationale: "Longer tradeoff" }],
    estimateSources: [{ estimateId: "estimate-a", provenance: "authored", observationCount: 0, typicalMinutesPerResponse: 3 }, { estimateId: "estimate-b", provenance: "authored", observationCount: 0, typicalMinutesPerResponse: 6 }],
  });
});

test("estimates an immediate session without adding future reserve as if it were already due", () => {
  const result = estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 2 }], includeReviewReserve: false });
  assert.equal(result.kind, "estimated");
  if (result.kind === "estimated") assert.deepEqual([result.minMinutes, result.typicalMinutes, result.maxMinutes, result.dueReviewResponses], [4, 6, 10, 0]);
});

test("reports explicit unavailable work when any real pool scope lacks an authored estimate", () => {
  const result = estimatePlanningWork({ policy: { ...policy, workEstimates: [policy.workEstimates[0]!] }, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 1 }, { ...scopeB, responses: 1 }] });
  assert.deepEqual(result, { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [scopeB] });
});

test("does not require a reserve estimate when no new work is proposed", () => {
  const result = estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [], dueReviews: [scopeB] });
  assert.equal(result.kind, "estimated");
  if (result.kind === "estimated") assert.deepEqual([result.minMinutes, result.typicalMinutes, result.maxMinutes, result.dueReviewResponses], [4, 6, 8, 1]);
});

test("rejects invalid counts and empty pools instead of inventing a duration", () => {
  assert.deepEqual(estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: Number.NaN }] }), { kind: "unavailable", reason: "invalid_response_count", scopeRefs: [scopeA] });
  assert.deepEqual(estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [] }), { kind: "unavailable", reason: "empty_pool", scopeRefs: [] });
});

test("reports unavailable reserve rather than silently omitting the future review cost", () => {
  const noReserve = { ...policy, workEstimates: [{ ...policy.workEstimates[0]!, reviewReserve: { kind: "unavailable" as const, reason: "No authored reserve" } }] };
  assert.deepEqual(estimatePlanningWork({ policy: noReserve, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 1 }] }), { kind: "unavailable", reason: "review_reserve_unavailable", scopeRefs: [scopeA] });
});

test("uses observed median only for an exact policy/mode/content/estimate identity", () => {
  const calibration = { kind: "observed" as const, methodVersion: "patternly-time-calibration-median-v1" as const, policyVersion: policy.policyVersion,
    estimateId: "estimate-a", modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, observationCount: 24, medianActiveMinutesPerResponse: 4 };
  const result = estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 2 }], dueReviews: [scopeA], observedCalibrations: [calibration] });
  assert.equal(result.kind, "estimated");
  if (result.kind === "estimated") {
    assert.deepEqual([result.provenance, result.observationCount, result.minMinutes, result.typicalMinutes, result.maxMinutes], ["observed", 24, 7, 16, 25]);
    assert.deepEqual(result.estimateSources, [{ estimateId: "estimate-a", provenance: "observed", observationCount: 24, typicalMinutesPerResponse: 4, methodVersion: "patternly-time-calibration-median-v1" }]);
  }
});

test("ignores observed calibration if the artifact pin or authored policy changed", () => {
  const calibration = { kind: "observed" as const, methodVersion: "patternly-time-calibration-median-v1" as const, policyVersion: policy.policyVersion,
    estimateId: "estimate-a", modeId: "mode", contentVersion, artifactSha256: "d".repeat(64), planningPolicyIdentity, observationCount: 24, medianActiveMinutesPerResponse: 4 };
  const result = estimatePlanningWork({ policy, modeId: "mode", contentVersion, artifactSha256, planningPolicyIdentity, plannedWork: [{ ...scopeA, responses: 1 }], observedCalibrations: [calibration] });
  assert.equal(result.kind, "estimated");
  if (result.kind === "estimated") assert.equal(result.estimateSources[0]?.provenance, "authored");
});
