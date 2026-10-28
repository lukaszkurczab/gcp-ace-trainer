import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { createPackageCompletionRuleV3, evaluatePackageCompletion } from "../../domain/learning/packageCompletionRule";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import { estimateLegalNextSessionOptions, estimateNextSessionTime, estimateNextSessionTimeAndLegalOptions } from "./nextSessionTimeEstimate";
import coverageFixture from "../../testing/claudeCoverageFixtureData.json";

const CLAUDE_TRACK = "claude-certified-architect-professional-certification" as const;
const CODING_TRACK = "coding-interview-dsa-problem-solving" as const;

function withQuestionsReadCounter<T extends { readonly questions: readonly unknown[] }>(track: T, readCount: { value: number }): T {
  return new Proxy(track, {
    get(target, property) {
      if (property === "questions") readCount.value += 1;
      return Reflect.get(target, property, target);
    },
  });
}

test("paired Coding estimate and legal options reuse one fresh calibration base without changing results", async (t) => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(CODING_TRACK, "coding_interview");
  const { planningPolicy, planningPolicyIdentity, track, runtime } = resolved;
  assert.ok(planningPolicy);
  assert.ok(planningPolicyIdentity);
  const recommendation = recommendLearningPlanMode({
    binding: runtime.getPlanningModeBinding(),
    trackId: CODING_TRACK,
    modes: track.modes,
    sessions: [],
    dueReviewCount: 0,
  });
  const modeEstimateCount = planningPolicy.workEstimates.filter((estimate) => estimate.modeId === recommendation.mode.modeId).length;
  const requestedLengths = recommendation.mode.requestedLengths.length;
  assert.ok(modeEstimateCount > 0, "the selected mode has canonical work estimates");
  assert.ok(requestedLengths > 1, "the selected mode exposes multiple legal lengths");

  const reads = { value: 0 };
  const input = {
    track: withQuestionsReadCounter(track, reads),
    planningPolicy,
    planningPolicyIdentity,
    recommendation,
    sessions: Object.freeze([]),
    attempts: Object.freeze([]),
    reviews: Object.freeze([]),
    now: "2026-10-26T12:00:00.000Z",
  } as const;
  estimateNextSessionTime(input);
  estimateLegalNextSessionOptions(input);

  assert.equal(reads.value, modeEstimateCount * (requestedLengths + 1),
    "the primary estimate plus each legal-length estimate rereads the real track question collection for calibration");
  t.diagnostic(`baseline calibration-input reads: M=${modeEstimateCount}, K=${requestedLengths}, reads=${reads.value}`);

  const optimizedReads = { value: 0 };
  const optimizedInput = { ...input, track: withQuestionsReadCounter(track, optimizedReads) };
  const baselinePrimary = estimateNextSessionTime(input);
  const baselineOptions = estimateLegalNextSessionOptions(input);
  const optimized = estimateNextSessionTimeAndLegalOptions(optimizedInput);
  assert.equal(optimizedReads.value, modeEstimateCount,
    "one combined invocation reads the calibration question collection once per same-mode work estimate");
  assert.deepEqual(optimized.estimate, baselinePrimary);
  assert.deepEqual(optimized.legalOptions, baselineOptions);

  const secondCallReads = { value: 0 };
  const secondCall = estimateNextSessionTimeAndLegalOptions({ ...input, track: withQuestionsReadCounter(track, secondCallReads) });
  assert.equal(secondCallReads.value, modeEstimateCount, "a later invocation builds a fresh proposal-local calibration base");
  assert.deepEqual(secondCall, optimized);
});

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
