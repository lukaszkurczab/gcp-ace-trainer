import { calibrateObservedPlanningTime, estimatePlanningWork, type PlanningWorkEstimateResult, type TrainingAttempt, type TrainingSession } from "../../domain";
import { CLAUDE_CASE_TRACK, indexCaseRecipes } from "../../content/canonical/caseRecipe";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { ContentPlanningPolicyIdentity } from "../../content/canonical/contentSuccessorLedger";
import type { TrainingCatalog, TrainingQuestionSummary } from "../trainingLifecycle/contracts";

/** A recipe's initial seconds cover its shared context, every decision and required feedback once. */
export function estimateCaseWork(input: Readonly<{
  track: TrainingCatalog; policy: LearningPlanningPolicy; planningPolicyIdentity: ContentPlanningPolicyIdentity;
  modeId: string; questions: readonly TrainingQuestionSummary[]; sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt[]; observedCalibrations: Parameters<typeof estimatePlanningWork>[0]["observedCalibrations"];
}>): PlanningWorkEstimateResult | null {
  if (input.track.trackId !== CLAUDE_CASE_TRACK) return null;
  const ids = new Set(input.questions.map(question => question.questionId));
  const recipes = indexCaseRecipes(input.track.questions).filter(recipe => recipe.steps.some(step => ids.has(step.questionId)));
  if (!recipes.length) return null;
  if (recipes.some(recipe => recipe.steps.some(step => !ids.has(step.questionId)))) return { kind: "unavailable", reason: "missing_scope_estimate", scopeRefs: [] };
  const caseIds = new Set(recipes.flatMap(recipe => recipe.steps.map(step => step.questionId)));
  const standalone = input.questions.filter(question => !caseIds.has(question.questionId));
  const scopes = new Map<string, { nodeId: string; mentalUnitId: string; responses: number }>();
  for (const question of standalone) {
    const key = `${question.nodeId}\0${question.mentalUnitId}`;
    const scope = scopes.get(key) ?? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: 0 };
    scope.responses++; scopes.set(key, scope);
  }
  const base = standalone.length ? estimatePlanningWork({ policy: input.policy, modeId: input.modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256, planningPolicyIdentity: input.planningPolicyIdentity, plannedWork: [...scopes.values()], observedCalibrations: input.observedCalibrations, includeReviewReserve: false }) : null;
  if (base?.kind === "unavailable") return base;
  let minimum = base?.minMinutes ?? 0, typical = base?.typicalMinutes ?? 0, maximum = base?.maxMinutes ?? 0;
  const sources = [...(base?.estimateSources ?? [])];
  const rationales = [...(base?.rationaleByEstimate ?? [])];
  for (const recipe of recipes) {
    const owner = input.track.getQuestion(recipe.steps[0]!.questionId)!;
    const estimate = input.policy.workEstimates.find(entry => entry.modeId === input.modeId && entry.scopeRefs.some(scope => scope.nodeId === owner.nodeId && scope.mentalUnitId === owner.mentalUnitId));
    const observed = estimate ? calibrateObservedPlanningTime({ sessions: input.sessions, attempts: input.attempts, questions: input.track.questions, policy: input.policy, estimateId: estimate.estimateId, trackId: input.track.trackId, modeId: input.modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256, planningPolicyIdentity: input.planningPolicyIdentity, caseFormat: { caseId: recipe.caseId, caseVersion: recipe.version } }) : null;
    const authored = recipe.initialEstimatedSeconds / 60;
    const minutes = observed?.kind === "observed" ? observed.medianActiveMinutesPerResponse * recipe.steps.length : authored;
    minimum += Math.min(authored, minutes); typical += minutes; maximum += Math.max(authored, minutes);
    const estimateId = `case:${recipe.caseId}:${recipe.version}`;
    sources.push({ estimateId, provenance: observed?.kind === "observed" ? "observed" : "authored", observationCount: observed?.kind === "observed" ? observed.observationCount : 0, typicalMinutesPerResponse: minutes / recipe.steps.length, ...(observed?.kind === "observed" ? { methodVersion: observed.methodVersion } : {}) });
    rationales.push({ estimateId, rationale: "Initial authored whole-case estimate includes one shared context, all decisions and required feedback; observed time uses only this exact recipe's completed sessions." });
  }
  const minMinutes = Math.floor(minimum), maxMinutes = Math.ceil(maximum);
  return { kind: "estimated", provenance: sources.every(source => source.provenance === "authored") ? "authored" : sources.every(source => source.provenance === "observed") ? "observed" : "mixed", policyVersion: input.policy.policyVersion, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256, observationCount: sources.reduce((sum, source) => sum + source.observationCount, 0), newResponses: input.questions.length, dueReviewResponses: 0, minMinutes, typicalMinutes: Math.ceil(typical), maxMinutes, uncertaintyMinutes: maxMinutes - minMinutes, rationaleByEstimate: rationales, estimateSources: sources };
}
