import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { ContentPlanningPolicyIdentity } from "../../content/canonical/contentSuccessorLedger";
import {
  estimatePlanningWork,
  calibrateObservedPlanningTime,
  isActiveReviewQueueEntry,
  type PackageCompletionState,
  type PlanningScopeRef,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
} from "../../domain";
import type { ProductModeConfig } from "../../content/canonical/productModeConfig";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { matchesReviewSourceSnapshot } from "../../domain/learning/reviewQueueEntry";
import type { ObservedPlanningCalibration } from "../../domain/learning/planningWorkEstimate";
import type { PlanningSessionDemand, LegalSessionOption } from "../../domain/learning/planningCalendar";
import { getTrainingSessionProgress } from "../trainingSessions/sessionDurability";

export type ChapterWorkloadProjection = Readonly<{
  nodeId: string;
  completion: "complete" | "minimum_incomplete" | "quality_unmet";
  requiredResponses: number;
  dueReviewResponses: number;
  newResponses: number;
  qualityRepair: Readonly<{ nextLegalBlockResponses: number | null; minMinutes: number | null; typicalMinutes: number | null; maxMinutes: number | null; futureResponses: null; futureMaxMinutes: null }> | null;
  minMinutes: number | null;
  typicalMinutes: number | null;
  maxMinutes: number | null;
  provenance: "authored" | "observed" | "mixed" | "unavailable";
  observationCount: number;
  scopeRefs: readonly PlanningScopeRef[];
  diagnosticResponses: number;
  unavailableReason: "no_canonical_request" | "missing_scope_cost" | "missing_review_request" | "missing_review_cost" | "quality_outcome_unbounded" | null;
}>;

export type DueReviewWorkload = Readonly<{
  id: string;
  dueAt: string;
  nodeId: string;
  scope: PlanningScopeRef;
  modeId: string | null;
  minMinutes: number | null;
  typicalMinutes: number | null;
  maxMinutes: number | null;
  creditsTowardMinimum: boolean;
}>;

export type NextPracticeStage = Readonly<{ kind: "estimated"; modeId: string; responseCount: number; minMinutes: number; typicalMinutes: number; maxMinutes: number; provenance: "authored" | "observed" | "mixed"; observationCount: number }> |
  Readonly<{ kind: "unavailable"; modeId: string; reason: "no_canonical_request" | "missing_scope_cost" }>;

export type FullGoalWorkloadProjection = Readonly<{
  kind: "complete" | "estimated" | "incomplete" | "completion_unknown";
  chapters: readonly ChapterWorkloadProjection[];
  dueReviews: readonly DueReviewWorkload[];
  sessionDemands: readonly PlanningSessionDemand[];
  activeContinuation: Readonly<{ kind: "continue_existing"; sessionId: string; modeId: string; requestedLength: number; responseCount: number; phase: "diagnosis" | "practice" | "review"; reviewEntryIds: readonly string[] }> |
    Readonly<{ kind: "unavailable"; reason: "invalid_session" | "unsupported_mode" | "missing_scope_cost" }> | null;
  nextPractice: NextPracticeStage | null;
  requiredResponses: number | null;
  dueReviewResponses: number;
  newResponses: number | null;
  knownMinMinutes: number;
  knownTypicalMinutes: number;
  knownMaxMinutes: number | null;
  unknownChapterIds: readonly string[];
  uncostedDueReviewIds: readonly string[];
  qualityUncertainChapterIds: readonly string[];
  distribution: "median_scope_typical_with_conservative_extremes";
  provenance: "authored" | "observed" | "mixed" | "unavailable";
  observationCount: number;
}>;

/**
 * Projects exact C3 chapter deficits against existing canonical request pools.
 * It never retargets a mode or treats package question counts as planned work.
 */
export function projectFullGoalWorkload(input: Readonly<{
  track: CanonicalTrackRuntime;
  policy?: LearningPlanningPolicy;
  planningPolicyIdentity?: ContentPlanningPolicyIdentity;
  completion: PackageCompletionState;
  sessions: readonly TrainingSession[];
  activeSession?: TrainingSession | null;
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
  practiceMode: ProductModeConfig;
  reviewMode?: ProductModeConfig;
  diagnosisMode?: ProductModeConfig;
  diagnosisStatus?: "scheduled" | "active" | "completed" | "abandoned" | "not_available";
}>): FullGoalWorkloadProjection {
  if (input.completion.kind === "unknown" || !input.policy || !input.planningPolicyIdentity ||
    input.planningPolicyIdentity.policyVersion !== input.policy.policyVersion ||
    input.practiceMode.trackId !== input.track.trackId || input.practiceMode.selection.kind !== "node") {
    return empty("completion_unknown");
  }
  const practicePool = input.track.getPool(input.practiceMode.modeId);
  const practiceScopesByNode = new Map<string, Map<string, PlanningScopeRef>>();
  for (const question of practicePool) {
    const scope = Object.freeze({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId });
    const byUnit = practiceScopesByNode.get(question.nodeId) ?? new Map<string, PlanningScopeRef>();
    byUnit.set(scope.mentalUnitId, scope);
    practiceScopesByNode.set(question.nodeId, byUnit);
  }

  const uniqueReviews = deduplicateReviews(input.reviews);
  const activeReviews = uniqueReviews.filter((entry) => entry.trackId === input.track.trackId && entry.sourceItem.trackId === input.track.trackId &&
    entry.sourceItem.contentVersion === input.track.contentVersion && entry.sourceItem.artifactSha256 === input.track.artifactSha256 && isActiveReviewQueueEntry(entry)).sort((left, right) =>
    Date.parse(left.dueAt ?? "") - Date.parse(right.dueAt ?? "") || left.id.localeCompare(right.id));
  const dueReviewMode = input.reviewMode?.trackId === input.track.trackId && input.reviewMode.selection.kind === "evidence_conditioned" && input.reviewMode.selection.evidenceSources.includes("due_queue")
    ? input.reviewMode : undefined;
  const calibrations = observedCalibrations(input);
  const diagnosticForecast = diagnosticWork(input, calibrations);
  const activeContinuationWork = input.activeSession?.modeId === input.diagnosisMode?.modeId && diagnosticForecast.demand?.kind === "continue_existing"
    ? Object.freeze({ kind: "continue_existing" as const, demand: diagnosticForecast.demand, questions: diagnosticForecast.questions, reviewEntryIds: Object.freeze([] as string[]) })
    : input.activeSession ? projectActiveContinuation(input, calibrations) : null;
  const diagnosticCounts = new Map<string, number>();
  for (const item of diagnosticForecast.questions) diagnosticCounts.set(item.nodeId, (diagnosticCounts.get(item.nodeId) ?? 0) + 1);
  const sessionDemands: PlanningSessionDemand[] = [];
  if (diagnosticForecast.demand) sessionDemands.push(diagnosticForecast.demand);
  if (activeContinuationWork?.kind === "continue_existing" && activeContinuationWork.demand.id !== diagnosticForecast.demand?.id) sessionDemands.push(activeContinuationWork.demand);
  const activePracticeQuestionsByChapter = new Map<string, Array<Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>>>();
  if (activeContinuationWork?.kind === "continue_existing" && activeContinuationWork.demand.phase === "practice") {
    for (const question of activeContinuationWork.questions) {
      const questions = activePracticeQuestionsByChapter.get(question.nodeId) ?? [];
      questions.push(question);
      activePracticeQuestionsByChapter.set(question.nodeId, questions);
    }
  }
  const reviewPoolIds = new Set(dueReviewMode ? input.track.getPool(dueReviewMode.modeId).map((question) => question.questionId) : []);
  const dueByChapter = new Map<string, Array<{ entry: ReviewQueueEntry; scope: PlanningScopeRef }>>();
  for (const entry of activeReviews) {
    const question = input.track.getQuestion(entry.sourceItem.questionId);
    if (!question || !entry.dueAt || !Number.isFinite(Date.parse(entry.dueAt))) continue;
    const scope = Object.freeze({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId });
    const rows = dueByChapter.get(question.nodeId) ?? [];
    rows.push({ entry, scope });
    dueByChapter.set(question.nodeId, rows);
  }

  const rateCache = new Map<string, PerResponseCost | null>();
  const usedSources = new Map<string, PerResponseCost["sources"][number]>();
  const rateFor = (modeId: string, scope: PlanningScopeRef, reserve: boolean): PerResponseCost | null => {
    const key = `${modeId}\0${scope.nodeId}\0${scope.mentalUnitId}\0${reserve ? "reserve" : "plain"}`;
    if (rateCache.has(key)) return rateCache.get(key)!;
    const estimate = estimatePlanningWork({
      policy: input.policy!, modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256,
      planningPolicyIdentity: input.planningPolicyIdentity!, plannedWork: reserve ? [{ ...scope, responses: 1 }] : [],
      dueReviews: reserve ? [] : [scope], observedCalibrations: calibrations, includeReviewReserve: reserve,
    });
    const cost = estimate.kind === "estimated" ? Object.freeze({ min: estimate.minMinutes, typical: estimate.typicalMinutes, max: estimate.maxMinutes,
      sources: Object.freeze(estimate.estimateSources.map((source) => Object.freeze({ estimateId: source.estimateId, provenance: source.provenance, observationCount: source.observationCount, ...(source.methodVersion ? { methodVersion: source.methodVersion } : {}) }))) }) : null;
    for (const source of cost?.sources ?? []) usedSources.set(source.estimateId, source);
    rateCache.set(key, cost);
    return cost;
  };

  const dueRows: DueReviewWorkload[] = [];
  const dueSourcesByChapter = new Map<string, PerResponseCost["sources"][number][]>();
  const chapters: ChapterWorkloadProjection[] = [];
  const unknownChapterIds: string[] = [];
  const uncostedDueReviewIds: string[] = [];
  const qualityUncertainChapterIds: string[] = [];
  let knownMinMinutes = 0;
  let knownTypicalMinutes = 0;
  let knownMaxMinutes: number | null = 0;
  let requiredResponses = 0;
  let newResponses = 0;
  let dueReviewResponses = 0;
  let hasUnknownChapter = false;
  let hasQualityUncertainty = false;

  for (const chapter of input.completion.chapters) {
    const completion = chapter.status === "completed" ? "complete" as const : chapter.reason === "quality_unmet" ? "quality_unmet" as const : "minimum_incomplete" as const;
    const missing = chapter.status === "completed" ? 0 : Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount);
    const modeOwnsChapter = input.practiceMode.selection.kind === "node" && input.practiceMode.selection.nodeId === chapter.nodeId;
    const practiceScopes = modeOwnsChapter ? [...(practiceScopesByNode.get(chapter.nodeId)?.values() ?? [])].sort(scopeOrder) : [];
    const costByScope = new Map(practiceScopes.map((scope) => [scopeKey(scope), rateFor(input.practiceMode.modeId, scope, true)]));
    const missingCostScopes = practiceScopes.filter((scope) => costByScope.get(scopeKey(scope)) === null);
    const reviewEntries = dueByChapter.get(chapter.nodeId) ?? [];
    const legalPoolDue = dueReviewMode?.selection.kind === "evidence_conditioned" && dueReviewMode.selection.nodeId === chapter.nodeId
      ? reviewEntries.filter(({ entry }) => reviewPoolIds.has(entry.sourceItem.questionId)) : [];
    const dueCredit = Math.min(missing, legalPoolDue.length);
    const diagnosticResponses = Math.min(Math.max(0, missing - dueCredit), diagnosticCounts.get(chapter.nodeId) ?? 0);
    const remainingNew = Math.max(0, missing - dueCredit - diagnosticResponses);
    const activePracticeQuestions = activePracticeQuestionsByChapter.get(chapter.nodeId) ?? [];
    const activePracticeCost = activePracticeQuestions.length > 0 && activeContinuationWork?.kind === "continue_existing"
      ? estimateQuestionsCost(input, activeContinuationWork.demand.modeId, activePracticeQuestions, calibrations, true) : null;
    const activeResponsesForChapter = Math.min(remainingNew, activePracticeQuestions.length);
    const remainingNewSessions = remainingNew - activeResponsesForChapter;
    requiredResponses += missing;
    dueReviewResponses += dueCredit;
    newResponses += remainingNew;

    for (const row of reviewEntries) {
      const qualified = legalPoolDue.some(({ entry }) => entry.id === row.entry.id);
      const cost = qualified && dueReviewMode ? rateFor(dueReviewMode.modeId, row.scope, false) : null;
      const creditsTowardMinimum = qualified && legalPoolDue.findIndex(({ entry }) => entry.id === row.entry.id) < dueCredit;
      const due = Object.freeze({ id: row.entry.id, dueAt: row.entry.dueAt!, nodeId: chapter.nodeId, scope: row.scope, modeId: cost && dueReviewMode ? dueReviewMode.modeId : null,
        minMinutes: cost?.min ?? null, typicalMinutes: cost?.typical ?? null, maxMinutes: cost?.max ?? null, creditsTowardMinimum });
      dueRows.push(due);
      if (!cost) uncostedDueReviewIds.push(row.entry.id);
      else {
        knownMinMinutes += cost.min; knownTypicalMinutes += cost.typical; knownMaxMinutes = knownMaxMinutes === null ? null : knownMaxMinutes + cost.max;
        dueSourcesByChapter.set(chapter.nodeId, [...(dueSourcesByChapter.get(chapter.nodeId) ?? []), ...cost.sources]);
      }
    }

    let minMinutes = 0;
    let typicalMinutes = 0;
    let maxMinutes: number | null = 0;
    let unavailableReason: ChapterWorkloadProjection["unavailableReason"] = null;
    const chapterSources = new Map<string, PerResponseCost["sources"][number]>();
    for (const source of dueSourcesByChapter.get(chapter.nodeId) ?? []) chapterSources.set(source.estimateId, source);
    if (activePracticeQuestions.length > 0) {
      if (!activePracticeCost) unavailableReason = "missing_scope_cost";
      else {
        minMinutes += activePracticeCost.min;
        typicalMinutes += activePracticeCost.typical;
        maxMinutes = activePracticeCost.max;
        for (const source of activePracticeCost.sources) { chapterSources.set(source.estimateId, source); usedSources.set(source.estimateId, source); }
      }
    }
    let qualityRepair: ChapterWorkloadProjection["qualityRepair"] = null;
    let qualityRepairDemand: PlanningSessionDemand | null = null;
    const diagnosticItems = diagnosticForecast.questions.filter((question) => question.nodeId === chapter.nodeId).slice(0, diagnosticResponses);
    if (diagnosticItems.length > 0) {
      const diagnosticCost = estimateQuestionsCost(input, diagnosticForecast.modeId!, diagnosticItems, calibrations, true);
      if (!diagnosticCost) unavailableReason = "missing_scope_cost";
      else {
        minMinutes += diagnosticCost.min;
        typicalMinutes += diagnosticCost.typical;
        maxMinutes = diagnosticCost.max;
        for (const source of diagnosticCost.sources) { chapterSources.set(source.estimateId, source); usedSources.set(source.estimateId, source); }
      }
    }
    if (completion === "quality_unmet") {
      hasQualityUncertainty = true;
      qualityUncertainChapterIds.push(chapter.nodeId);
      const activeQualityBlock = activePracticeQuestions.length > 0 && activePracticeCost
        ? Object.freeze({ responses: activePracticeQuestions.length, cost: activePracticeCost }) : null;
      const nextBlock = activeQualityBlock ?? (practiceScopes.length > 0 ? estimateNextLegalPracticeBlock(input, calibrations) : null);
      qualityRepair = Object.freeze({ nextLegalBlockResponses: nextBlock?.responses ?? null, minMinutes: nextBlock?.cost.min ?? null,
        typicalMinutes: nextBlock?.cost.typical ?? null, maxMinutes: nextBlock?.cost.max ?? null, futureResponses: null, futureMaxMinutes: null });
      if (nextBlock && !activeQualityBlock) qualityRepairDemand = Object.freeze({ id: `quality-repair:${chapter.nodeId}`, modeId: input.practiceMode.modeId, phase: "quality_repair", responseCount: nextBlock.responses,
        legalOptions: Object.freeze([Object.freeze({ sessionLength: nextBlock.responses, minMinutes: nextBlock.cost.min, typicalMinutes: nextBlock.cost.typical, maxMinutes: nextBlock.cost.max })]),
        canResumeAcrossWindows: input.practiceMode.timer.kind === "elapsed_foreground" });
      if (!nextBlock) unavailableReason = practiceScopes.length === 0 ? "no_canonical_request" : "missing_scope_cost";
      else if (!activeQualityBlock) {
        for (const source of nextBlock.cost.sources) { chapterSources.set(source.estimateId, source); usedSources.set(source.estimateId, source); }
        minMinutes += nextBlock.cost.min;
        typicalMinutes += nextBlock.cost.typical;
        maxMinutes = null;
        unavailableReason = "quality_outcome_unbounded";
      } else {
        maxMinutes = null;
        unavailableReason = "quality_outcome_unbounded";
      }
    }

    if (remainingNewSessions > 0) {
      if (practiceScopes.length === 0) unavailableReason ??= "no_canonical_request";
      else if (missingCostScopes.length > 0) unavailableReason ??= "missing_scope_cost";
      else {
        const costs = [...costByScope.values()].filter((value): value is PerResponseCost => value !== null);
        for (const source of costs.flatMap((cost) => cost.sources)) chapterSources.set(source.estimateId, source);
        const central = median(costs.map((cost) => cost.typical));
        minMinutes += remainingNewSessions * Math.min(...costs.map((cost) => cost.min));
        typicalMinutes += remainingNewSessions * central;
        maxMinutes = maxMinutes === null ? null : maxMinutes + remainingNewSessions * Math.max(...costs.map((cost) => cost.max));
      }
    }
    const chapterScopeRefs = [...new Map([...practiceScopes, ...reviewEntries.map(({ scope }) => scope), ...diagnosticItems.map(({ nodeId, mentalUnitId }) => ({ nodeId, mentalUnitId }))].map((scope) => [scopeKey(scope), scope])).values()].sort(scopeOrder);
    if ((remainingNew > 0 || completion === "quality_unmet") && unavailableReason && unavailableReason !== "quality_outcome_unbounded") {
      hasUnknownChapter = true;
      unknownChapterIds.push(chapter.nodeId);
    }
    if (unavailableReason && unavailableReason !== "quality_outcome_unbounded") { minMinutes = 0; typicalMinutes = 0; maxMinutes = 0; }
    const rowProvenance = provenance([...chapterSources.values()]);
    const rowObservationCount = [...chapterSources.values()].reduce((sum, source) => sum + source.observationCount, 0);
    knownMinMinutes += minMinutes;
    knownTypicalMinutes += typicalMinutes;
    knownMaxMinutes = knownMaxMinutes === null || maxMinutes === null ? null : knownMaxMinutes + maxMinutes;
    chapters.push(Object.freeze({ nodeId: chapter.nodeId, completion, requiredResponses: missing, dueReviewResponses: dueCredit, newResponses: remainingNew,
      qualityRepair, minMinutes: unavailableReason && unavailableReason !== "quality_outcome_unbounded" ? null : minMinutes,
      typicalMinutes: unavailableReason && unavailableReason !== "quality_outcome_unbounded" ? null : typicalMinutes,
      maxMinutes: unavailableReason && unavailableReason !== "quality_outcome_unbounded" ? null : maxMinutes,
      provenance: rowProvenance, observationCount: rowObservationCount, scopeRefs: Object.freeze(chapterScopeRefs), diagnosticResponses, unavailableReason }));

    const remainingForNewSessions = remainingNewSessions;
    if (remainingForNewSessions > 0 && practiceScopes.length > 0 && missingCostScopes.length === 0) {
      const options = estimateLegalPoolOptions(input, input.practiceMode, practiceScopes, calibrations);
      if (options.length > 0) sessionDemands.push(Object.freeze({ id: `practice:${chapter.nodeId}`, modeId: input.practiceMode.modeId, phase: "practice", responseCount: remainingForNewSessions, legalOptions: options,
        canResumeAcrossWindows: input.practiceMode.timer.kind === "elapsed_foreground" }));
    }
    if (qualityRepairDemand) sessionDemands.push(qualityRepairDemand);
  }

  let nextPractice: NextPracticeStage | null = null;
  if (diagnosticForecast.demand && !sessionDemands.some((demand) => demand.phase === "practice" || demand.phase === "quality_repair")) {
    const nextStage = estimateNextPracticePoolBlock(input, calibrations);
    if (!nextStage) {
      nextPractice = Object.freeze({ kind: "unavailable", modeId: input.practiceMode.modeId, reason: input.track.getPool(input.practiceMode.modeId).length === 0 ? "no_canonical_request" : "missing_scope_cost" });
    } else {
      const nextStageProvenance = provenance(nextStage.cost.sources);
      if (nextStageProvenance === "unavailable") {
        nextPractice = Object.freeze({ kind: "unavailable", modeId: input.practiceMode.modeId, reason: "missing_scope_cost" });
      } else {
      nextPractice = Object.freeze({ kind: "estimated", modeId: input.practiceMode.modeId, responseCount: nextStage.responses, minMinutes: nextStage.cost.min,
        typicalMinutes: nextStage.cost.typical, maxMinutes: nextStage.cost.max, provenance: nextStageProvenance,
        observationCount: nextStage.cost.sources.reduce((sum, source) => sum + source.observationCount, 0) });
      knownMinMinutes += nextStage.cost.min;
      knownTypicalMinutes += nextStage.cost.typical;
      knownMaxMinutes = knownMaxMinutes === null ? null : knownMaxMinutes + nextStage.cost.max;
      for (const source of nextStage.cost.sources) usedSources.set(source.estimateId, source);
      sessionDemands.push(Object.freeze({ id: `next-practice:${input.practiceMode.modeId}`, modeId: input.practiceMode.modeId, phase: "practice", responseCount: nextStage.responses,
        legalOptions: Object.freeze([Object.freeze({ sessionLength: nextStage.responses, minMinutes: nextStage.cost.min, typicalMinutes: nextStage.cost.typical, maxMinutes: nextStage.cost.max })]),
        canResumeAcrossWindows: input.practiceMode.timer.kind === "elapsed_foreground" }));
      }
    }
  }

  const projectedDueIds = new Set(dueRows.map(({ id }) => id));
  for (const [nodeId, entries] of dueByChapter) {
    for (const { entry, scope } of entries) {
      if (projectedDueIds.has(entry.id)) continue;
      dueRows.push(Object.freeze({ id: entry.id, dueAt: entry.dueAt!, nodeId, scope, modeId: null, minMinutes: null, typicalMinutes: null, maxMinutes: null, creditsTowardMinimum: false }));
      uncostedDueReviewIds.push(entry.id);
    }
  }

  const dueUnknown = uncostedDueReviewIds.length > 0;
  const kind = input.completion.kind === "completed" && dueRows.length === 0 ? "complete" as const
    : hasUnknownChapter || dueUnknown || activeContinuationWork?.kind === "unavailable" ? "incomplete" as const
      : hasQualityUncertainty ? "incomplete" as const : "estimated" as const;
  const activeContinuation = activeContinuationWork?.kind === "continue_existing"
    ? Object.freeze({ kind: "continue_existing" as const, sessionId: activeContinuationWork.demand.sessionId!, modeId: activeContinuationWork.demand.modeId,
      requestedLength: activeContinuationWork.demand.legalOptions[0]!.sessionLength, responseCount: activeContinuationWork.demand.responseCount,
      phase: activeContinuationWork.demand.phase as "diagnosis" | "practice" | "review", reviewEntryIds: activeContinuationWork.reviewEntryIds })
    : activeContinuationWork?.kind === "unavailable" ? Object.freeze({ kind: "unavailable" as const, reason: activeContinuationWork.reason }) : null;
  return Object.freeze({ kind, chapters: Object.freeze(chapters), dueReviews: Object.freeze(dueRows.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.id.localeCompare(b.id))), sessionDemands: Object.freeze(sessionDemands), activeContinuation, nextPractice,
    requiredResponses, dueReviewResponses, newResponses, knownMinMinutes, knownTypicalMinutes, knownMaxMinutes,
    unknownChapterIds: Object.freeze(unknownChapterIds), uncostedDueReviewIds: Object.freeze([...new Set(uncostedDueReviewIds)]),
    qualityUncertainChapterIds: Object.freeze(qualityUncertainChapterIds), distribution: "median_scope_typical_with_conservative_extremes",
    provenance: provenance([...usedSources.values()]), observationCount: [...usedSources.values()].reduce((sum, source) => sum + source.observationCount, 0) });
}

type PerResponseCost = Readonly<{ min: number; typical: number; max: number; sources: readonly Readonly<{ estimateId: string; provenance: "authored" | "observed"; observationCount: number; methodVersion?: string }>[] }>;

function observedCalibrations(input: Parameters<typeof projectFullGoalWorkload>[0]): readonly ObservedPlanningCalibration[] {
  if (!input.policy || !input.planningPolicyIdentity) return [];
  return input.policy.workEstimates.flatMap((estimate) => {
    const result = calibrateObservedPlanningTime({ sessions: input.sessions, attempts: input.attempts, questions: input.track.questions, policy: input.policy!, estimateId: estimate.estimateId,
      trackId: input.track.trackId, modeId: estimate.modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256, planningPolicyIdentity: input.planningPolicyIdentity! });
    return result.kind === "observed" ? [result] : [];
  });
}
function estimateNextLegalPracticeBlock(
  input: Parameters<typeof projectFullGoalWorkload>[0],
  calibrations: readonly ObservedPlanningCalibration[],
): Readonly<{ responses: number; cost: PerResponseCost }> | null {
  const mode = input.track.getMode(input.practiceMode.modeId);
  const requestedLength = mode.defaultRequestedLength;
  if (!mode.requestedLengths.includes(requestedLength)) return null;
  const pool = input.track.getPool(mode.modeId);
  if (pool.length < requestedLength) return null;
  const questions = selectPracticeQuestions(pool, input.attempts, input.track, requestedLength);
  if (questions.length !== requestedLength) return null;
  const counts = new Map<string, { nodeId: string; mentalUnitId: string; responses: number }>();
  for (const question of questions) {
    const key = `${question.nodeId}\0${question.mentalUnitId}`;
    const scope = counts.get(key) ?? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: 0 };
    scope.responses += 1; counts.set(key, scope);
  }
  const result = estimatePlanningWork({ policy: input.policy!, modeId: mode.modeId, contentVersion: input.track.contentVersion,
    artifactSha256: input.track.artifactSha256, planningPolicyIdentity: input.planningPolicyIdentity!, plannedWork: [...counts.values()], dueReviews: [],
    observedCalibrations: calibrations, includeReviewReserve: false });
  if (result.kind !== "estimated") return null;
  return Object.freeze({ responses: requestedLength, cost: Object.freeze({ min: result.minMinutes, typical: result.typicalMinutes, max: result.maxMinutes,
    sources: Object.freeze(result.estimateSources.map((source) => Object.freeze({ estimateId: source.estimateId, provenance: source.provenance,
      observationCount: source.observationCount, ...(source.methodVersion ? { methodVersion: source.methodVersion } : {}) }))) }) });
}
/** Forecasts one bounded recurring stage from the complete real mode pool. */
function estimateNextPracticePoolBlock(
  input: Parameters<typeof projectFullGoalWorkload>[0],
  calibrations: readonly ObservedPlanningCalibration[],
): Readonly<{ responses: number; cost: PerResponseCost }> | null {
  const mode = input.practiceMode;
  const requestedLength = mode.defaultRequestedLength;
  if (!mode.requestedLengths.includes(requestedLength)) return null;
  const pool = input.track.getPool(mode.modeId);
  const scopes = [...new Map(pool.map((question) => {
    const scope = { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId };
    return [scopeKey(scope), scope] as const;
  })).values()].sort(scopeOrder);
  if (pool.length < requestedLength || scopes.length === 0 || pool.some((question) => !scopes.some((scope) => scope.nodeId === question.nodeId && scope.mentalUnitId === question.mentalUnitId))) return null;
  const option = estimateLegalPoolOptions(input, mode, scopes, calibrations).find((candidate) => candidate.sessionLength === requestedLength);
  if (!option) return null;
  const sources = new Map<string, PerResponseCost["sources"][number]>();
  for (const scope of scopes) {
    const cost = rateForScope(input, mode.modeId, scope, calibrations);
    if (!cost) return null;
    for (const source of cost.sources) sources.set(source.estimateId, source);
  }
  return Object.freeze({ responses: requestedLength, cost: Object.freeze({ min: option.minMinutes, typical: option.typicalMinutes, max: option.maxMinutes, sources: Object.freeze([...sources.values()]) }) });
}
function diagnosticWork(input: Parameters<typeof projectFullGoalWorkload>[0], calibrations: readonly ObservedPlanningCalibration[]): Readonly<{ modeId: string | null; questions: readonly Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>[]; demand: PlanningSessionDemand | null }> {
  const mode = input.diagnosisMode;
  if (!mode || mode.selection.kind !== "exact_ordered_questions" || input.diagnosisStatus === "completed" || input.diagnosisStatus === "abandoned" || input.diagnosisStatus === "not_available") return { modeId: null, questions: Object.freeze([]), demand: null };
  const diagnosticQuestionIds = mode.selection.questionIds;
  let questions: readonly Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>[] = [];
  let resumed = false;
  let legalSessionLength = mode.defaultRequestedLength;
  if (input.diagnosisStatus === "active") {
    const session = input.activeSession;
    if (!session || session.status !== "active" || session.trackId !== input.track.trackId || session.modeId !== mode.modeId ||
      session.contentVersion !== input.track.contentVersion || session.artifactSha256 !== input.track.artifactSha256) return { modeId: mode.modeId, questions: Object.freeze([]), demand: null };
    if (!mode.requestedLengths.includes(session.requestedLength) || session.itemOrder.some((occurrence, index) => occurrence.item.questionId !== diagnosticQuestionIds[index])) return { modeId: mode.modeId, questions: Object.freeze([]), demand: null };
    legalSessionLength = session.requestedLength;
    let progress;
    try { progress = getTrainingSessionProgress(session, input.attempts.filter((attempt) => attempt.sessionId === session.id)); }
    catch { return { modeId: mode.modeId, questions: Object.freeze([]), demand: null }; }
    const answered = new Set(progress.attempts.map((attempt) => attempt.occurrenceId));
    const remaining = session.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId));
    const resolved = remaining.map((occurrence) => input.track.getQuestion(occurrence.item.questionId));
    if (resolved.some((question) => question === undefined)) return { modeId: mode.modeId, questions: Object.freeze([]), demand: null };
    questions = resolved as readonly NonNullable<(typeof resolved)[number]>[];
    resumed = true;
  } else {
    const requested = mode.defaultRequestedLength;
    if (!mode.requestedLengths.includes(requested)) return { modeId: mode.modeId, questions: Object.freeze([]), demand: null };
    questions = diagnosticQuestionIds.slice(0, requested).map((id) => input.track.getQuestion(id)).filter((question): question is NonNullable<typeof question> => Boolean(question));
  }
  if (questions.length === 0) return { modeId: mode.modeId, questions: Object.freeze([]), demand: null };
  // Session demand is only the immediate block. Forecast reserve is added later
  // to chapter workload, where it is charged once with the remaining new work.
  const cost = estimateQuestionsCost(input, mode.modeId, questions, calibrations, false);
  if (!cost) return { modeId: mode.modeId, questions: Object.freeze(questions), demand: null };
  const option = Object.freeze({ sessionLength: legalSessionLength, minMinutes: cost.min, typicalMinutes: cost.typical, maxMinutes: cost.max });
  return { modeId: mode.modeId, questions: Object.freeze(questions), demand: Object.freeze({ id: resumed ? `resume-diagnosis:${mode.modeId}` : `diagnosis:${mode.modeId}`, modeId: mode.modeId, phase: "diagnosis", responseCount: questions.length, legalOptions: Object.freeze([option]), canResumeAcrossWindows: mode.timer.kind === "elapsed_foreground", isExistingSession: resumed,
    ...(resumed && input.activeSession ? { kind: "continue_existing" as const, sessionId: input.activeSession.id } : {}) }) };
}

type ActiveContinuationWork = Readonly<{ kind: "continue_existing"; demand: PlanningSessionDemand; questions: readonly Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>[]; reviewEntryIds: readonly string[] }> |
  Readonly<{ kind: "unavailable"; reason: "invalid_session" | "unsupported_mode" | "missing_scope_cost" }>;

function projectActiveContinuation(input: Parameters<typeof projectFullGoalWorkload>[0], calibrations: readonly ObservedPlanningCalibration[]): ActiveContinuationWork {
  const session = input.activeSession;
  if (!session || session.status !== "active" || session.trackId !== input.track.trackId || session.contentVersion !== input.track.contentVersion || session.artifactSha256 !== input.track.artifactSha256) {
    return Object.freeze({ kind: "unavailable", reason: "invalid_session" });
  }
  let mode: ProductModeConfig;
  try { mode = input.track.getMode(session.modeId); }
  catch { return Object.freeze({ kind: "unavailable", reason: "unsupported_mode" }); }
  if (mode.trackId !== input.track.trackId || !mode.requestedLengths.includes(session.requestedLength) || session.actualLength !== session.itemOrder.length ||
    session.actualLength < 1 || session.actualLength > session.requestedLength || mode.timer.kind !== "elapsed_foreground") {
    return Object.freeze({ kind: "unavailable", reason: "unsupported_mode" });
  }
  const attempts = input.attempts.filter((attempt) => attempt.sessionId === session.id);
  if (attempts.some((attempt) => attempt.committedAt === undefined)) return Object.freeze({ kind: "unavailable", reason: "invalid_session" });
  let progress;
  try { progress = getTrainingSessionProgress(session, attempts); }
  catch { return Object.freeze({ kind: "unavailable", reason: "invalid_session" }); }
  const answered = new Set(progress.attempts.map((attempt) => attempt.occurrenceId));
  const remaining = session.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId));
  if (remaining.length === 0) return Object.freeze({ kind: "unavailable", reason: "invalid_session" });
  const poolIds = new Set(input.track.getPool(mode.modeId).map((question) => question.questionId));
  const questions = remaining.map((occurrence) => {
    const question = input.track.getQuestion(occurrence.item.questionId);
    if (!question || !poolIds.has(question.questionId) || occurrence.item.trackId !== input.track.trackId || occurrence.item.contentVersion !== input.track.contentVersion || occurrence.item.artifactSha256 !== input.track.artifactSha256) return undefined;
    if (mode.selection.kind === "node" && (question.nodeId !== mode.selection.nodeId || (mode.selection.mentalUnitId && question.mentalUnitId !== mode.selection.mentalUnitId))) return undefined;
    return question;
  });
  if (questions.some((question) => question === undefined)) return Object.freeze({ kind: "unavailable", reason: "invalid_session" });
  const exactQuestions = questions as readonly NonNullable<(typeof questions)[number]>[];
  const reviewEntryIds: string[] = [];
  if (mode.selection.kind === "evidence_conditioned") {
    if (!mode.selection.evidenceSources.includes("due_queue")) return Object.freeze({ kind: "unavailable", reason: "unsupported_mode" });
    for (const occurrence of remaining) {
      const snapshot = occurrence.reviewSourceSnapshot;
      const entry = snapshot && input.reviews.find((candidate) => candidate.id === snapshot.reviewEntryId);
      if (!snapshot || !entry || !matchesReviewSourceSnapshot(snapshot, entry) || entry.trackId !== input.track.trackId ||
        entry.sourceItem.questionId !== occurrence.item.questionId || entry.sourceItem.artifactSha256 !== input.track.artifactSha256 || !isActiveReviewQueueEntry(entry)) {
        return Object.freeze({ kind: "unavailable", reason: "invalid_session" });
      }
      if (!reviewEntryIds.includes(entry.id)) reviewEntryIds.push(entry.id);
    }
  }
  const phase = mode.selection.kind === "evidence_conditioned" ? "review" as const : mode.selection.kind === "exact_ordered_questions" ? "diagnosis" as const : "practice" as const;
  // A continuation's current session cost covers only its unanswered items.
  // Full-goal reserve remains in the separate workload projection.
  const cost = estimateQuestionsCost(input, mode.modeId, exactQuestions, calibrations, false);
  if (!cost) return Object.freeze({ kind: "unavailable", reason: "missing_scope_cost" });
  const demand: PlanningSessionDemand = Object.freeze({
    id: `continue-existing:${session.id}`, kind: "continue_existing", sessionId: session.id, modeId: mode.modeId, phase,
    responseCount: exactQuestions.length,
    legalOptions: Object.freeze([Object.freeze({ sessionLength: session.requestedLength, minMinutes: cost.min, typicalMinutes: cost.typical, maxMinutes: cost.max })]),
    canResumeAcrossWindows: true, isExistingSession: true, reviewEntryIds: Object.freeze(reviewEntryIds),
  });
  return Object.freeze({ kind: "continue_existing", demand, questions: Object.freeze(exactQuestions), reviewEntryIds: Object.freeze(reviewEntryIds) });
}
function estimateQuestionsCost(input: Parameters<typeof projectFullGoalWorkload>[0], modeId: string, questions: readonly Readonly<{ nodeId: string; mentalUnitId: string }>[], calibrations: readonly ObservedPlanningCalibration[], reserve: boolean): PerResponseCost | null {
  const counts = new Map<string, { nodeId: string; mentalUnitId: string; responses: number }>();
  for (const question of questions) { const key = `${question.nodeId}\0${question.mentalUnitId}`; const scope = counts.get(key) ?? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: 0 }; scope.responses += 1; counts.set(key, scope); }
  const estimate = estimatePlanningWork({ policy: input.policy!, modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256,
    planningPolicyIdentity: input.planningPolicyIdentity!, plannedWork: [...counts.values()], dueReviews: [], observedCalibrations: calibrations, includeReviewReserve: reserve });
  return estimate.kind === "estimated" ? Object.freeze({ min: estimate.minMinutes, typical: estimate.typicalMinutes, max: estimate.maxMinutes,
    sources: Object.freeze(estimate.estimateSources.map((source) => Object.freeze({ estimateId: source.estimateId, provenance: source.provenance, observationCount: source.observationCount, ...(source.methodVersion ? { methodVersion: source.methodVersion } : {}) }))) }) : null;
}
function estimateLegalPoolOptions(input: Parameters<typeof projectFullGoalWorkload>[0], mode: ProductModeConfig, scopes: readonly PlanningScopeRef[], calibrations: readonly ObservedPlanningCalibration[]): readonly LegalSessionOption[] {
  const all = input.track.getPool(mode.modeId);
  if (scopes.length === 0) return Object.freeze([]);
  const costedScopes = new Set(scopes.map(scopeKey));
  if (all.some((question) => !costedScopes.has(scopeKey({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId })))) return Object.freeze([]);
  const perResponse: PerResponseCost[] = [];
  for (const scope of scopes) { const cost = rateForScope(input, mode.modeId, scope, calibrations); if (!cost) return Object.freeze([]); perResponse.push(cost); }
  const rates = { min: Math.min(...perResponse.map((cost) => cost.min)), typical: median(perResponse.map((cost) => cost.typical)), max: Math.max(...perResponse.map((cost) => cost.max)) };
  return Object.freeze(mode.requestedLengths.filter((length) => length <= all.length).map((length) => Object.freeze({ sessionLength: length, minMinutes: length * rates.min, typicalMinutes: length * rates.typical, maxMinutes: length * rates.max })));
}
function rateForScope(input: Parameters<typeof projectFullGoalWorkload>[0], modeId: string, scope: PlanningScopeRef, calibrations: readonly ObservedPlanningCalibration[]): PerResponseCost | null {
  const estimate = estimatePlanningWork({ policy: input.policy!, modeId, contentVersion: input.track.contentVersion, artifactSha256: input.track.artifactSha256,
    planningPolicyIdentity: input.planningPolicyIdentity!, plannedWork: [{ ...scope, responses: 1 }], dueReviews: [], observedCalibrations: calibrations, includeReviewReserve: true });
  return estimate.kind === "estimated" ? Object.freeze({ min: estimate.minMinutes, typical: estimate.typicalMinutes, max: estimate.maxMinutes,
    sources: Object.freeze(estimate.estimateSources.map((source) => Object.freeze({ estimateId: source.estimateId, provenance: source.provenance, observationCount: source.observationCount, ...(source.methodVersion ? { methodVersion: source.methodVersion } : {}) }))) }) : null;
}
function deduplicateReviews(reviews: readonly ReviewQueueEntry[]): readonly ReviewQueueEntry[] {
  const byId = new Map<string, ReviewQueueEntry>();
  const payloadById = new Map<string, string>();
  for (const review of reviews) {
    if (!review || typeof review.id !== "string" || !review.id.trim()) throw new Error("Planning review identity is invalid.");
    const payload = canonicalSerialize(review);
    const previous = byId.get(review.id);
    if (previous) {
      if (payloadById.get(review.id) !== payload) throw new Error("Planning reviews contain conflicting canonical identities.");
      continue;
    }
    byId.set(review.id, review); payloadById.set(review.id, payload);
  }
  return Object.freeze([...byId.values()]);
}
function scopeKey(scope: PlanningScopeRef): string { return `${scope.nodeId}\0${scope.mentalUnitId}`; }
function scopeOrder(left: PlanningScopeRef, right: PlanningScopeRef): number { return left.nodeId.localeCompare(right.nodeId) || left.mentalUnitId.localeCompare(right.mentalUnitId); }
function median(values: readonly number[]): number { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2; }
function provenance(sources: readonly Readonly<{ provenance: "authored" | "observed" }>[]): "authored" | "observed" | "mixed" | "unavailable" {
  if (sources.length === 0) return "unavailable";
  if (sources.every((source) => source.provenance === "authored")) return "authored";
  if (sources.every((source) => source.provenance === "observed")) return "observed";
  return "mixed";
}
function empty(kind: "completion_unknown"): FullGoalWorkloadProjection { return Object.freeze({ kind, chapters: Object.freeze([]), dueReviews: Object.freeze([]), sessionDemands: Object.freeze([]), activeContinuation: null, nextPractice: null, requiredResponses: null, dueReviewResponses: 0, newResponses: null, knownMinMinutes: 0, knownTypicalMinutes: 0, knownMaxMinutes: null, unknownChapterIds: Object.freeze([]), uncostedDueReviewIds: Object.freeze([]), qualityUncertainChapterIds: Object.freeze([]), distribution: "median_scope_typical_with_conservative_extremes", provenance: "unavailable", observationCount: 0 }); }
