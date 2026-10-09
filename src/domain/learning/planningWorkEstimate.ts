export type PlanningScopeRef = Readonly<{ nodeId: string; mentalUnitId: string }>;
export type PlanningDueScope = PlanningScopeRef;
export type PlannedWorkScope = Readonly<PlanningScopeRef & { responses: number }>;
export type ObservedPlanningCalibration = Readonly<{
  kind: "observed";
  methodVersion: "patternly-time-calibration-median-v1";
  policyVersion: string;
  estimateId: string;
  modeId: string;
  contentVersion: string;
  artifactSha256: string;
  planningPolicyIdentity: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
  observationCount: number;
  medianActiveMinutesPerResponse: number;
}>;
type Reserve = Readonly<{ kind: "authored_estimate"; minAdditionalResponsesPerNewResponse: number; typicalAdditionalResponsesPerNewResponse: number; maxAdditionalResponsesPerNewResponse: number }> | Readonly<{ kind: "unavailable"; reason: string }>;
type PlanningWorkEstimate = Readonly<{
  estimateId: string; modeId: string; scopeRefs: readonly PlanningScopeRef[];
  minMinutesPerResponse: number; typicalMinutesPerResponse: number; maxMinutesPerResponse: number;
  rationale: string; reviewReserve: Reserve;
}>;
type LearningPlanningPolicy = Readonly<{ policyVersion: string; workEstimates: readonly PlanningWorkEstimate[] }>;

export type WorkEstimateUnavailableReason =
  | "empty_pool"
  | "invalid_response_count"
  | "missing_scope_estimate"
  | "review_reserve_unavailable";

export type PlanningWorkEstimateResult =
  | Readonly<{ kind: "unavailable"; reason: WorkEstimateUnavailableReason; scopeRefs: readonly PlanningScopeRef[] }>
  | Readonly<{
      kind: "estimated";
      provenance: "authored" | "observed" | "mixed";
      policyVersion: string;
      contentVersion: string;
      artifactSha256: string;
      observationCount: number;
      newResponses: number;
      dueReviewResponses: number;
      minMinutes: number;
      typicalMinutes: number;
      maxMinutes: number;
      uncertaintyMinutes: number;
      rationaleByEstimate: readonly Readonly<{ estimateId: string; rationale: string }>[];
      estimateSources: readonly Readonly<{ estimateId: string; provenance: "authored" | "observed"; observationCount: number; typicalMinutesPerResponse: number; methodVersion?: ObservedPlanningCalibration["methodVersion"] }>[];
    }>;

/**
 * Estimates only explicitly selected scoped work. It never derives workload
 * from question-bank size. Due reviews are charged separately by their real
 * scope. Authored review reserves apply only to new work in that estimate's
 * class and remain an explicit uncertainty range.
 */
export function estimatePlanningWork(input: Readonly<{
  policy: LearningPlanningPolicy;
  modeId: string;
  contentVersion: string;
  artifactSha256: string;
  plannedWork: readonly PlannedWorkScope[];
  dueReviews?: readonly PlanningDueScope[];
  observedCalibrations?: readonly ObservedPlanningCalibration[];
  planningPolicyIdentity: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
  /** The immediate session duration excludes forecast reserve; reserves describe future repeats. */
  includeReviewReserve?: boolean;
}>): PlanningWorkEstimateResult {
  if (input.plannedWork.length === 0 && (input.dueReviews?.length ?? 0) === 0) return unavailable("empty_pool", []);

  const byScope = new Map<string, { scope: PlanningScopeRef; responses: number; dueCount: number }>();
  for (const planned of input.plannedWork) {
    if (!Number.isSafeInteger(planned.responses) || planned.responses < 1) return unavailable("invalid_response_count", [{ nodeId: planned.nodeId, mentalUnitId: planned.mentalUnitId }]);
    const key = scopeKey(planned);
    const current = byScope.get(key) ?? { scope: Object.freeze({ nodeId: planned.nodeId, mentalUnitId: planned.mentalUnitId }), responses: 0, dueCount: 0 };
    current.responses += planned.responses;
    byScope.set(key, current);
  }
  for (const due of input.dueReviews ?? []) {
    const current = byScope.get(scopeKey(due));
    if (current) current.dueCount += 1;
    else byScope.set(scopeKey(due), { scope: Object.freeze({ nodeId: due.nodeId, mentalUnitId: due.mentalUnitId }), responses: 0, dueCount: 1 });
  }

  const estimates = new Map<string, PlanningWorkEstimate>();
  for (const estimate of input.policy.workEstimates) {
    if (estimate.modeId !== input.modeId) continue;
    for (const scope of estimate.scopeRefs) estimates.set(scopeKey(scope), estimate);
  }
  const work = [...byScope.values()].filter(({ responses, dueCount }) => responses > 0 || dueCount > 0);
  const missing = work.filter(({ scope }) => !estimates.has(scopeKey(scope)));
  if (missing.length > 0) return unavailable("missing_scope_estimate", missing.map(({ scope }) => scope));

  let minMinutes = 0;
  let typicalMinutes = 0;
  let maxMinutes = 0;
  let dueReviewResponses = 0;
  let newResponses = 0;
  const rationales = new Map<string, string>();
  const estimateSources = new Map<string, { provenance: "authored" | "observed"; observationCount: number; typicalMinutesPerResponse: number; methodVersion?: ObservedPlanningCalibration["methodVersion"] }>();
  const calibrations = new Map((input.observedCalibrations ?? []).filter((entry) => entry.policyVersion === input.policy.policyVersion && entry.contentVersion === input.contentVersion && entry.artifactSha256 === input.artifactSha256 &&
    entry.planningPolicyIdentity.contentVersion === input.planningPolicyIdentity.contentVersion && entry.planningPolicyIdentity.artifactSha256 === input.planningPolicyIdentity.artifactSha256 && entry.planningPolicyIdentity.policyVersion === input.planningPolicyIdentity.policyVersion &&
    entry.modeId === input.modeId && entry.observationCount >= 20 && Number.isFinite(entry.medianActiveMinutesPerResponse) && entry.medianActiveMinutesPerResponse > 0).map((entry) => [entry.estimateId, entry]));
  for (const { scope, responses, dueCount } of work) {
    const estimate = estimates.get(scopeKey(scope))!;
    const observed = calibrations.get(estimate.estimateId);
    const typicalPerResponse = observed?.medianActiveMinutesPerResponse ?? estimate.typicalMinutesPerResponse;
    const minimumPerResponse = Math.min(estimate.minMinutesPerResponse, typicalPerResponse);
    const maximumPerResponse = Math.max(estimate.maxMinutesPerResponse, typicalPerResponse);
    rationales.set(estimate.estimateId, estimate.rationale);
    estimateSources.set(estimate.estimateId, {
      provenance: observed ? "observed" : "authored",
      observationCount: observed?.observationCount ?? 0,
      typicalMinutesPerResponse: typicalPerResponse,
      ...(observed ? { methodVersion: observed.methodVersion } : {}),
    });
    minMinutes += responses * minimumPerResponse;
    typicalMinutes += responses * typicalPerResponse;
    maxMinutes += responses * maximumPerResponse;
    newResponses += responses;
    dueReviewResponses += dueCount;
    minMinutes += dueCount * minimumPerResponse;
    typicalMinutes += dueCount * typicalPerResponse;
    maxMinutes += dueCount * maximumPerResponse;

    if (responses > 0 && input.includeReviewReserve !== false) {
      if (estimate.reviewReserve.kind === "unavailable") return unavailable("review_reserve_unavailable", [scope]);
      minMinutes += responses * estimate.reviewReserve.minAdditionalResponsesPerNewResponse * minimumPerResponse;
      typicalMinutes += responses * estimate.reviewReserve.typicalAdditionalResponsesPerNewResponse * typicalPerResponse;
      maxMinutes += responses * estimate.reviewReserve.maxAdditionalResponsesPerNewResponse * maximumPerResponse;
    }
  }
  const min = Math.floor(minMinutes);
  const typical = Math.ceil(typicalMinutes);
  const max = Math.ceil(maxMinutes);
  return Object.freeze({
    kind: "estimated",
    provenance: [...estimateSources.values()].every(({ provenance }) => provenance === "authored") ? "authored" : [...estimateSources.values()].every(({ provenance }) => provenance === "observed") ? "observed" : "mixed",
    policyVersion: input.policy.policyVersion,
    contentVersion: input.contentVersion,
    artifactSha256: input.artifactSha256,
    observationCount: [...estimateSources.values()].reduce((sum, source) => sum + source.observationCount, 0),
    newResponses,
    dueReviewResponses,
    minMinutes: min,
    typicalMinutes: typical,
    maxMinutes: max,
    uncertaintyMinutes: Math.max(0, max - min),
    rationaleByEstimate: Object.freeze([...rationales].map(([estimateId, rationale]) => Object.freeze({ estimateId, rationale }))),
    estimateSources: Object.freeze([...estimateSources].map(([estimateId, source]) => Object.freeze({ estimateId, ...source }))),
  });
}

function scopeKey(scope: PlanningScopeRef): string { return `${scope.nodeId}\0${scope.mentalUnitId}`; }
function unavailable(reason: WorkEstimateUnavailableReason, scopeRefs: readonly PlanningScopeRef[]): PlanningWorkEstimateResult {
  return Object.freeze({ kind: "unavailable", reason, scopeRefs: Object.freeze([...scopeRefs]) });
}
