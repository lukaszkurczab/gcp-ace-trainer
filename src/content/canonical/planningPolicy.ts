import { isCanonicalSafeIdentity } from "./questionValidation";
import type { ProductModeConfig } from "./productModeConfig";

export type PlanningScopeRef = Readonly<{ nodeId: string; mentalUnitId: string }>;
export type PlanningReviewReserve =
  | Readonly<{ kind: "authored_estimate"; minAdditionalResponsesPerNewResponse: number; typicalAdditionalResponsesPerNewResponse: number; maxAdditionalResponsesPerNewResponse: number; provenance: "authored"; observationCount: 0; rationale: string }>
  | Readonly<{ kind: "unavailable"; reason: string }>;
export type PlanningWorkEstimate = Readonly<{
  estimateId: string;
  modeId: string;
  scopeRefs: readonly PlanningScopeRef[];
  minMinutesPerResponse: number;
  typicalMinutesPerResponse: number;
  maxMinutesPerResponse: number;
  provenance: "authored";
  observationCount: 0;
  rationale: string;
  reviewReserve: PlanningReviewReserve;
}>;
export type LearningPlanningPolicy = Readonly<{
  schemaVersion: "patternly-learning-planning-policy-v1";
  policyVersion: string;
  workEstimates: readonly PlanningWorkEstimate[];
  unavailableScopes: readonly Readonly<{
    scopeRef: PlanningScopeRef;
    modeIds: readonly string[];
    reason: "missing_authored_estimate" | "unsupported_app_mode" | "unknown_runtime_scope";
  }>[];
}>;

type ScopeQuestion = Readonly<{ nodeId: string; mentalUnitId: string; questionId?: string }>;

/** Strictly binds authored estimates to exact question scopes and selectable APP mode pools. */
export function validateLearningPlanningPolicy(
  value: unknown,
  questions: readonly ScopeQuestion[],
  modes: readonly ProductModeConfig[],
): LearningPlanningPolicy {
  const policy = asRecord(value);
  exactKeys(policy, ["schemaVersion", "policyVersion", "workEstimates", "unavailableScopes"]);
  if (policy.schemaVersion !== "patternly-learning-planning-policy-v1" || !safeId(policy.policyVersion) || !Array.isArray(policy.workEstimates) || !Array.isArray(policy.unavailableScopes)) fail();

  const scopePairs = new Set(questions.map(scopeKey));
  const modeById = new Map(modes.map((mode) => [mode.modeId, mode]));
  const estimated = new Map<string, PlanningWorkEstimate>();
  const estimateIds = new Set<string>();
  const workEstimates = policy.workEstimates.map((raw) => {
    const estimate = asRecord(raw);
    exactKeys(estimate, ["estimateId", "modeId", "scopeRefs", "minMinutesPerResponse", "typicalMinutesPerResponse", "maxMinutesPerResponse", "provenance", "observationCount", "rationale", "reviewReserve"]);
    if (!safeId(estimate.estimateId) || estimateIds.has(estimate.estimateId) || typeof estimate.modeId !== "string" || !modeById.has(estimate.modeId) || !Array.isArray(estimate.scopeRefs) || estimate.scopeRefs.length === 0 ||
      !positiveInteger(estimate.minMinutesPerResponse) || !positiveInteger(estimate.typicalMinutesPerResponse) || !positiveInteger(estimate.maxMinutesPerResponse) ||
      estimate.minMinutesPerResponse > estimate.typicalMinutesPerResponse || estimate.typicalMinutesPerResponse > estimate.maxMinutesPerResponse ||
      estimate.provenance !== "authored" || estimate.observationCount !== 0 || !nonEmptyText(estimate.rationale)) fail();
    estimateIds.add(estimate.estimateId);
    const scopeRefs = estimate.scopeRefs.map(validateScopeRef);
    if (new Set(scopeRefs.map(scopeKey)).size !== scopeRefs.length) fail();
    const mode = modeById.get(estimate.modeId)!;
    const selectableScopes = getSelectableScopes(mode, questions);
    for (const scope of scopeRefs) {
      const key = planningPairKey(estimate.modeId, scope);
      if (!scopePairs.has(scopeKey(scope)) || !selectableScopes.has(scopeKey(scope)) || estimated.has(key)) fail();
      estimated.set(key, Object.freeze({
        estimateId: estimate.estimateId,
        modeId: estimate.modeId,
        scopeRefs: Object.freeze(scopeRefs),
        minMinutesPerResponse: estimate.minMinutesPerResponse,
        typicalMinutesPerResponse: estimate.typicalMinutesPerResponse,
        maxMinutesPerResponse: estimate.maxMinutesPerResponse,
        provenance: "authored" as const,
        observationCount: 0 as const,
        rationale: estimate.rationale,
        reviewReserve: validateReviewReserve(estimate.reviewReserve),
      }));
    }
    return Object.freeze({
      estimateId: estimate.estimateId,
      modeId: estimate.modeId,
      scopeRefs: Object.freeze(scopeRefs),
      minMinutesPerResponse: estimate.minMinutesPerResponse,
      typicalMinutesPerResponse: estimate.typicalMinutesPerResponse,
      maxMinutesPerResponse: estimate.maxMinutesPerResponse,
      provenance: "authored" as const,
      observationCount: 0 as const,
      rationale: estimate.rationale,
      reviewReserve: validateReviewReserve(estimate.reviewReserve),
    });
  });

  const unavailable = new Map<string, LearningPlanningPolicy["unavailableScopes"][number]>();
  const unavailableScopes = policy.unavailableScopes.map((raw) => {
    const entry = asRecord(raw);
    exactKeys(entry, ["scopeRef", "modeIds", "reason"]);
    const scopeRef = validateScopeRef(entry.scopeRef);
    if (!scopePairs.has(scopeKey(scopeRef)) || !Array.isArray(entry.modeIds) || entry.modeIds.length === 0 ||
      !["missing_authored_estimate", "unsupported_app_mode", "unknown_runtime_scope"].includes(String(entry.reason))) fail();
    const modeIds = entry.modeIds.map((id) => {
      if (!safeId(id) || !modeById.has(id)) fail();
      return id;
    });
    if (new Set(modeIds).size !== modeIds.length) fail();
    const reason = entry.reason as LearningPlanningPolicy["unavailableScopes"][number]["reason"];
    for (const modeId of modeIds) {
      const key = planningPairKey(modeId, scopeRef);
      if (unavailable.has(key) || estimated.has(key)) fail();
      if (reason === "unknown_runtime_scope" && getSelectableScopes(modeById.get(modeId)!, questions).has(scopeKey(scopeRef))) fail();
      if (reason !== "unknown_runtime_scope" && !getSelectableScopes(modeById.get(modeId)!, questions).has(scopeKey(scopeRef))) fail();
      unavailable.set(key, Object.freeze({ scopeRef, modeIds: Object.freeze([modeId]), reason }));
    }
    return Object.freeze({ scopeRef, modeIds: Object.freeze(modeIds), reason });
  });

  // Every exact canonical question scope is accounted for under every currently
  // selectable product mode; Premium and unsupported scopes remain explicit.
  for (const mode of modes) {
    for (const scope of scopePairs) {
      const key = `${mode.modeId}\0${scope}`;
      const selectable = getSelectableScopes(mode, questions).has(scope);
      const hasEstimate = estimated.has(key);
      const hasUnavailable = unavailable.has(key);
      if ((selectable && hasEstimate === hasUnavailable) || (!selectable && (hasEstimate || !hasUnavailable))) fail();
    }
  }
  if (estimated.size + unavailable.size !== modes.length * scopePairs.size) fail();

  return deepFreeze({ schemaVersion: "patternly-learning-planning-policy-v1", policyVersion: policy.policyVersion, workEstimates, unavailableScopes });
}

function getSelectableScopes(mode: ProductModeConfig, questions: readonly ScopeQuestion[]): Set<string> {
  const selection = mode.selection;
  if (selection.kind === "exact_ordered_questions") {
    const questionIds = new Set(selection.questionIds);
    return new Set(questions.filter((question) => question.questionId !== undefined && questionIds.has(question.questionId)).map(scopeKey));
  }
  if (selection.kind === "node") {
    return new Set(questions.filter((question) => question.nodeId === selection.nodeId && (selection.mentalUnitId === undefined || question.mentalUnitId === selection.mentalUnitId)).map(scopeKey));
  }
  if (selection.kind === "evidence_conditioned") {
    return new Set(questions.filter((question) => question.nodeId === selection.nodeId).map(scopeKey));
  }
  return new Set();
}
function validateScopeRef(value: unknown): PlanningScopeRef {
  const scope = asRecord(value); exactKeys(scope, ["nodeId", "mentalUnitId"]);
  if (!safeId(scope.nodeId) || !safeId(scope.mentalUnitId)) fail();
  return Object.freeze({ nodeId: scope.nodeId, mentalUnitId: scope.mentalUnitId });
}
function validateReviewReserve(value: unknown): PlanningReviewReserve {
  const reserve = asRecord(value);
  if (reserve.kind === "unavailable") {
    exactKeys(reserve, ["kind", "reason"]);
    if (!nonEmptyText(reserve.reason)) fail();
    return Object.freeze({ kind: "unavailable", reason: reserve.reason });
  }
  exactKeys(reserve, ["kind", "minAdditionalResponsesPerNewResponse", "typicalAdditionalResponsesPerNewResponse", "maxAdditionalResponsesPerNewResponse", "provenance", "observationCount", "rationale"]);
  if (reserve.kind !== "authored_estimate" || !finiteNonNegative(reserve.minAdditionalResponsesPerNewResponse) || !finiteNonNegative(reserve.typicalAdditionalResponsesPerNewResponse) || !finiteNonNegative(reserve.maxAdditionalResponsesPerNewResponse) ||
    reserve.minAdditionalResponsesPerNewResponse > reserve.typicalAdditionalResponsesPerNewResponse || reserve.typicalAdditionalResponsesPerNewResponse > reserve.maxAdditionalResponsesPerNewResponse || reserve.provenance !== "authored" || reserve.observationCount !== 0 || !nonEmptyText(reserve.rationale)) fail();
  return Object.freeze({ kind: "authored_estimate", minAdditionalResponsesPerNewResponse: reserve.minAdditionalResponsesPerNewResponse, typicalAdditionalResponsesPerNewResponse: reserve.typicalAdditionalResponsesPerNewResponse, maxAdditionalResponsesPerNewResponse: reserve.maxAdditionalResponsesPerNewResponse, provenance: "authored", observationCount: 0, rationale: reserve.rationale });
}
function scopeKey(value: ScopeQuestion): string { return `${value.nodeId}\0${value.mentalUnitId}`; }
function planningPairKey(modeId: string, scope: ScopeQuestion): string { return `${modeId}\0${scopeKey(scope)}`; }
function asRecord(value: unknown): Record<string, any> { if (typeof value !== "object" || value === null || Array.isArray(value)) fail(); return value as Record<string, any>; }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): void { if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) fail(); }
function safeId(value: unknown): value is string { return isCanonicalSafeIdentity(value); }
function nonEmptyText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function positiveInteger(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
function finiteNonNegative(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }
function deepFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child); } return value; }
function fail(): never { throw new Error("Canonical learning planning policy is invalid."); }
