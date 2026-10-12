import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { createPackageCompletionRuleV3, evaluatePackageCompletion } from "../../domain/learning/packageCompletionRule";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import { estimateLegalNextSessionOptions, estimateNextSessionTime } from "./nextSessionTimeEstimate";
import coverageFixture from "../../testing/claudeCoverageFixtureData.json";

const CLAUDE_TRACK = "claude-certified-architect-professional-certification" as const;

test("incomplete V3 next-session estimates stay unavailable without an exact accessible unit target", async () => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(CLAUDE_TRACK, "certification");
  const { planningPolicy, planningPolicyIdentity } = resolved;
  assert.ok(planningPolicy);
  assert.ok(planningPolicyIdentity);
  // The bundled package intentionally remains v2 until CC05; use the approved
  // final v3 scope inventory fixture over its canonical runtime API for this guard.
  const completionRule = createPackageCompletionRuleV3(coverageFixture.completionRule);
  const track = Object.freeze({ ...resolved.track, completionRule });
  const completion = evaluatePackageCompletion({
    trackId: track.trackId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    completionRule,
  }, [], (questionId) => {
    const question = track.getQuestion(questionId);
    return question ? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId } : undefined;
  });
  assert.equal(completion.kind, "in_progress");

  const baseRecommendation = recommendLearningPlanMode({
    binding: resolved.runtime.getPlanningModeBinding(),
    trackId: track.trackId,
    modes: track.modes,
    sessions: [],
    dueReviewCount: 0,
  });
  const base = {
    track,
    planningPolicy,
    planningPolicyIdentity,
    sessions: [],
    attempts: [],
    reviews: [],
    completion,
    now: "2026-10-11T12:00:00.000Z",
  } as const;

  const practiceEstimate = estimateNextSessionTime({ ...base, recommendation: baseRecommendation });
  assert.deepEqual(practiceEstimate, { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] });
  assert.deepEqual(estimateLegalNextSessionOptions({ ...base, recommendation: baseRecommendation }), []);
  const { completion: _completion, ...withoutCompletion } = base;
  assert.deepEqual(estimateNextSessionTime({ ...withoutCompletion, recommendation: baseRecommendation }),
    { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] }, "direct V3 callers without completion evidence also fail closed");
  assert.deepEqual(estimateNextSessionTime({ ...base, completion: { kind: "unknown" }, recommendation: baseRecommendation }),
    { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] }, "unknown completion evidence cannot authorize a generic D01 estimate");

  const dueReviewRecommendation = recommendLearningPlanMode({
    binding: resolved.runtime.getPlanningModeBinding(),
    trackId: track.trackId,
    modes: track.modes,
    sessions: [],
    dueReviewCount: 1,
  });
  assert.equal(dueReviewRecommendation.phase, "review");
  assert.deepEqual(estimateNextSessionTime({ ...base, recommendation: dueReviewRecommendation }),
    { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] },
    "the coordinator lacks entitlement data to decide whether Home will override a due-review recommendation");

  const continuation = Object.freeze({ ...baseRecommendation, continuation: Object.freeze({ kind: "continue_existing" as const,
    sessionId: "active-claude-session", requestedLength: baseRecommendation.requestedLength }) });
  assert.deepEqual(estimateNextSessionTime({ ...base, recommendation: continuation }),
    { kind: "unavailable", reason: "invalid_response_count", scopeRefs: [] },
    "an active continuation is validated from its persisted exact questions before the V3 unknown-scope guard");
});
