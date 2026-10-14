import assert from "node:assert/strict";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { indexCaseRecipes } from "../../content/canonical/caseRecipe";
import { estimateCaseWork } from "./caseWorkEstimate";
import { estimatePlanningWork } from "../../domain";
import { estimateNextSessionTime } from "./nextSessionTimeEstimate";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";

const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-14T12:00:00.000Z";

test("whole case costs one context/decision/feedback total and a partial case stays unknown", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  const resolved = await owner.resolveForDiscovery(TRACK, "certification");
  const { track, planningPolicy: policy, planningPolicyIdentity } = resolved;
  assert.ok(policy); assert.ok(planningPolicyIdentity);
  const recipe = indexCaseRecipes(track.questions)[0]!;
  const questions = recipe.steps.map(step => track.getQuestion(step.questionId)!);
  const input = { track, policy, planningPolicyIdentity, modeId: "certification-focus-practice", questions, sessions: [], attempts: [], observedCalibrations: [] };
  const result = estimateCaseWork(input);
  assert.equal(result?.kind, "estimated");
  if (result?.kind !== "estimated") throw Error("case estimate missing");
  assert.equal(result.typicalMinutes, Math.ceil(recipe.initialEstimatedSeconds / 60));
  assert.equal(result.newResponses, recipe.steps.length);
  assert.equal(result.estimateSources.length, 1);
  assert.equal(result.provenance, "authored"); assert.equal(result.observationCount, 0);
  assert.deepEqual(estimateCaseWork({ ...input, questions: questions.slice(1) }), { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] });
});

test("actual mixed-unit plan continuation counts its recipe once plus its standalone work", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  const resolved = await owner.resolveForDiscovery(TRACK, "certification");
  const { track, runtime, planningPolicy: policy, planningPolicyIdentity } = resolved;
  assert.ok(policy); assert.ok(planningPolicyIdentity);
  const prepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: "case-time-mixed", requestedLength: 40, mentalUnitId: "CCARP-D01-O01" }, attempts: [], reviews: [], now: NOW });
  const recipe = indexCaseRecipes(track.questions).find(recipe => prepared.session.caseStates?.some(state => state.caseId === recipe.caseId))!;
  assert.ok(recipe);
  const caseIds = new Set(recipe.steps.map(step => step.questionId));
  const standalone = prepared.session.itemOrder.filter(item => !caseIds.has(item.item.questionId));
  assert.ok(standalone.length > 0);
  const question = track.getQuestion(standalone[0]!.item.questionId)!;
  const base = estimatePlanningWork({ policy, modeId: prepared.session.modeId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, planningPolicyIdentity, plannedWork: [{ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: standalone.length }], includeReviewReserve: false });
  assert.equal(base.kind, "estimated"); if (base.kind !== "estimated") throw Error("standalone estimate missing");
  const recommendation = recommendLearningPlanMode({ binding: runtime.getPlanningModeBinding(), trackId: TRACK, modes: track.modes, sessions: [prepared.session], activeSession: prepared.session, dueReviewCount: 0 });
  const estimate = estimateNextSessionTime({ track, planningPolicy: policy, planningPolicyIdentity, recommendation, sessions: [prepared.session], attempts: [], reviews: [], now: NOW });
  assert.equal(estimate.kind, "estimated"); if (estimate.kind !== "estimated") throw Error("mixed estimate missing");
  assert.equal(estimate.typicalMinutes, Math.ceil(base.typicalMinutes + recipe.initialEstimatedSeconds / 60));
  assert.equal(estimate.newResponses, prepared.session.actualLength);
  assert.equal(estimate.estimateSources.filter(source => source.estimateId.startsWith("case:")).length, 1);
});

test("a legally active micro-case can continue without widening standard request lengths", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  const resolved = await owner.resolveForDiscovery(TRACK, "certification");
  const { track, runtime, planningPolicy, planningPolicyIdentity } = resolved;
  assert.ok(planningPolicy); assert.ok(planningPolicyIdentity);
  const recipe = indexCaseRecipes(track.questions)[0]!;
  const prepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: "case-time-micro", preset: "single_case", caseId: recipe.caseId }, attempts: [], reviews: [], now: NOW });
  const recommendation = recommendLearningPlanMode({ binding: runtime.getPlanningModeBinding(), trackId: TRACK, modes: track.modes, sessions: [prepared.session], activeSession: prepared.session, dueReviewCount: 0 });
  assert.equal(recommendation.requestedLength, recipe.steps.length);
  assert.equal(recommendation.mode.requestedLengths.includes(recipe.steps.length), false);
  const estimate = estimateNextSessionTime({ track, planningPolicy, planningPolicyIdentity, recommendation, sessions: [prepared.session], attempts: [], reviews: [], now: NOW });
  assert.equal(estimate.kind, "estimated");
  if (estimate.kind === "estimated") assert.equal(estimate.typicalMinutes, Math.ceil(recipe.initialEstimatedSeconds / 60));
  const stalePolicy = { ...prepared.session, configurationSnapshot: { ...prepared.session.configurationSnapshot, policyVersion: "old-policy" } };
  assert.throws(() => recommendLearningPlanMode({ binding: runtime.getPlanningModeBinding(), trackId: TRACK, modes: track.modes, sessions: [stalePolicy], activeSession: stalePolicy, dueReviewCount: 0 }));
  const malformed = { ...prepared.session, caseState: undefined };
  assert.throws(() => recommendLearningPlanMode({ binding: runtime.getPlanningModeBinding(), trackId: TRACK, modes: track.modes, sessions: [malformed], activeSession: malformed, dueReviewCount: 0 }));
});
