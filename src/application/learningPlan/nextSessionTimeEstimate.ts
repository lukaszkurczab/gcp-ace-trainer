import type { TrainingAttempt, TrainingSession } from "../../domain";
import { isActiveReviewQueueEntry } from "../../domain";
import { estimatePlanningWork, calibrateObservedPlanningTime, type PlanningWorkEstimateResult } from "../../domain";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { LearningPlanModeRecommendation } from "./learningPlanModeRecommendation";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { ContentPlanningPolicyIdentity } from "../../content/canonical/contentSuccessorLedger";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";
import type { LegalSessionOption } from "../../domain/learning/planningCalendar";
import { getTrainingSessionProgress } from "../trainingSessions/sessionDurability";
import { matchesReviewSourceSnapshot } from "../../domain/learning/reviewQueueEntry";

/** Estimates only the next legal request; it does not claim to forecast the full curriculum. */
export function estimateNextSessionTime(input: Readonly<{
  track: CanonicalTrackRuntime;
  planningPolicy?: LearningPlanningPolicy;
  planningPolicyIdentity?: ContentPlanningPolicyIdentity;
  recommendation: LearningPlanModeRecommendation;
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly import("../../domain").ReviewQueueEntry[];
  now: string;
  requestedLength?: number;
}>): PlanningWorkEstimateResult {
  const { track, recommendation } = input;
  const policy = input.planningPolicy;
  const planningPolicyIdentity = input.planningPolicyIdentity;
  if (!policy || !planningPolicyIdentity || planningPolicyIdentity.policyVersion !== policy.policyVersion) return unavailable("missing_scope_estimate", []);
  if (!recommendation.continuation && input.sessions.some((session) => session.trackId === track.trackId && session.status === "active")) {
    return unavailable("invalid_response_count", []);
  }
  const mode = track.getMode(recommendation.mode.modeId);
  const requestedLength = input.requestedLength ?? recommendation.requestedLength;
  const pool = track.getPool(mode.modeId);
  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) return unavailable("invalid_response_count", []);
  const observedCalibrations = policy.workEstimates.filter((estimate) => estimate.modeId === mode.modeId).flatMap((estimate) => {
    const result = calibrateObservedPlanningTime({
      sessions: input.sessions, attempts: input.attempts, questions: track.questions, policy,
      estimateId: estimate.estimateId, trackId: track.trackId, modeId: mode.modeId,
      contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, planningPolicyIdentity,
    });
    return result.kind === "observed" ? [result] : [];
  });

  if (recommendation.continuation) {
    if (requestedLength !== recommendation.continuation.requestedLength) return unavailable("invalid_response_count", []);
    const active = input.sessions.find((session) => session.id === recommendation.continuation!.sessionId);
    if (!active || active.status !== "active" || active.trackId !== track.trackId || active.modeId !== mode.modeId ||
      active.requestedLength !== recommendation.continuation.requestedLength || active.contentVersion !== track.contentVersion ||
      active.artifactSha256 !== track.artifactSha256 || active.actualLength !== active.itemOrder.length ||
      !mode.requestedLengths.includes(active.requestedLength)) return unavailable("invalid_response_count", []);
    const matchingAttempts = input.attempts.filter((attempt) => attempt.sessionId === active.id);
    if (matchingAttempts.some((attempt) => attempt.committedAt === undefined)) return unavailable("invalid_response_count", []);
    let progress;
    try { progress = getTrainingSessionProgress(active, matchingAttempts); }
    catch { return unavailable("invalid_response_count", []); }
    const answeredIds = new Set(progress.attempts.map((attempt) => attempt.occurrenceId));
    const remainingOccurrences = active.itemOrder.filter((occurrence) => !answeredIds.has(occurrence.occurrenceId));
    const remainingQuestions = remainingOccurrences.map((occurrence) => {
      const question = track.getQuestion(occurrence.item.questionId);
      return question && occurrence.item.trackId === track.trackId && occurrence.item.contentVersion === track.contentVersion &&
        occurrence.item.artifactSha256 === track.artifactSha256 ? question : undefined;
    });
    if (remainingQuestions.length === 0 || remainingQuestions.some((question) => question === undefined)) return unavailable("invalid_response_count", []);
    const exactRemainingQuestions = remainingQuestions as readonly NonNullable<(typeof remainingQuestions)[number]>[];
    const plannedWork = mode.selection.kind === "evidence_conditioned" ? [] : aggregateScopes(exactRemainingQuestions);
    const dueReviews = mode.selection.kind === "evidence_conditioned" ? exactRemainingQuestions.map((question) => ({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId })) : [];
    if (mode.selection.kind === "evidence_conditioned") {
      for (const occurrence of remainingOccurrences) {
        const source = occurrence.reviewSourceSnapshot && input.reviews.find((entry) => entry.id === occurrence.reviewSourceSnapshot!.reviewEntryId);
        if (!source || !matchesReviewSourceSnapshot(occurrence.reviewSourceSnapshot!, source) || source.trackId !== track.trackId ||
          source.sourceItem.questionId !== occurrence.item.questionId || source.sourceItem.artifactSha256 !== track.artifactSha256) {
          return unavailable("invalid_response_count", []);
        }
      }
    }
    return estimatePlanningWork({
      policy,
      modeId: mode.modeId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      planningPolicyIdentity,
      plannedWork,
      dueReviews,
      observedCalibrations,
      includeReviewReserve: false,
    });
  }
  const currentDue = input.reviews.filter((entry) => entry.trackId === track.trackId && entry.sourceItem.trackId === track.trackId
    && entry.sourceItem.contentVersion === track.contentVersion && entry.sourceItem.artifactSha256 === track.artifactSha256
    && isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && Number.isFinite(Date.parse(entry.dueAt)) && Date.parse(entry.dueAt) <= nowMs);
  let selected = pool;
  if (mode.selection.kind === "evidence_conditioned") {
    const dueIds = new Set(currentDue.map((entry) => entry.sourceItem.questionId));
    selected = pool.filter((question) => dueIds.has(question.questionId));
  }
  if (!recommendation.mode.requestedLengths.includes(requestedLength)) return unavailable("invalid_response_count", []);
  const count = Math.min(requestedLength, selected.length);
  if (mode.selection.kind === "node") {
    selected = selectPracticeQuestions(selected, input.attempts, track, count);
  } else {
    // Exact-order and evidence-conditioned modes retain the same canonical ordering
    // used by CanonicalTrainingRuntime when it prepares their session.
    selected = selected.slice(0, count);
  }
  if (selected.length < mode.minimumActualLength && mode.selection.kind !== "evidence_conditioned") return unavailable("empty_pool", []);

  const plannedWork = recommendation.phase === "review" ? [] : aggregateScopes(selected);
  const dueReviews = recommendation.phase === "review" ? selected.map((question) => ({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId })) : [];
  return estimatePlanningWork({
    policy,
    modeId: mode.modeId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    planningPolicyIdentity,
    plannedWork,
    dueReviews,
    observedCalibrations,
    includeReviewReserve: false,
  });
}

/** Returns estimates only for lengths declared by the canonical current mode. */
export function estimateLegalNextSessionOptions(input: Parameters<typeof estimateNextSessionTime>[0]): readonly LegalSessionOption[] {
  const options: LegalSessionOption[] = [];
  for (const sessionLength of input.recommendation.mode.requestedLengths) {
    const estimate = estimateNextSessionTime({ ...input, requestedLength: sessionLength });
    if (estimate.kind !== "estimated") continue;
    options.push(Object.freeze({ sessionLength, minMinutes: estimate.minMinutes, typicalMinutes: estimate.typicalMinutes, maxMinutes: estimate.maxMinutes }));
  }
  return Object.freeze(options);
}

export type FullGoalScopeAvailability = Readonly<{
  kind: "scope_costs_incomplete" | "scope_costed_volume_unavailable" | "complete" | "completion_contract_unavailable";
  requiredChapterCount: number | null;
  costedChapterCount: number | null;
  minimumRemainingResponses: number | null;
  unavailableScopeRefs: readonly Readonly<{ nodeId: string; mentalUnitId: string }>[];
  unavailableChapterIds: readonly string[];
}>;

/** Reports exact per-unit cost gaps without treating a bank or a single free mode as the full curriculum. */
export function projectFullGoalScopeAvailability(input: Readonly<{
  track: CanonicalTrackRuntime;
  planningPolicy?: LearningPlanningPolicy;
  completion: import("../../domain").PackageCompletionState;
}>): FullGoalScopeAvailability {
  if (!input.planningPolicy || input.completion.kind === "unknown") return Object.freeze({ kind: "completion_contract_unavailable", requiredChapterCount: null, costedChapterCount: null, minimumRemainingResponses: null, unavailableScopeRefs: Object.freeze([]), unavailableChapterIds: Object.freeze([]) });
  const allCostedScopes = new Set(input.planningPolicy.workEstimates.flatMap((estimate) => estimate.scopeRefs.map((scope) => `${scope.nodeId}\0${scope.mentalUnitId}`)));
  const chapters = input.completion.chapters;
  const unavailable = new Map<string, Readonly<{ nodeId: string; mentalUnitId: string }>>();
  const unavailableChapters: string[] = [];
  let costedChapterCount = 0;
  for (const chapter of chapters) {
    const unitIds = new Set(input.track.questions.filter((question) => question.nodeId === chapter.nodeId).map((question) => question.mentalUnitId));
    let chapterCosted = unitIds.size > 0;
    if (unitIds.size === 0) unavailableChapters.push(chapter.nodeId);
    for (const mentalUnitId of unitIds) {
      if (allCostedScopes.has(`${chapter.nodeId}\0${mentalUnitId}`)) continue;
      chapterCosted = false;
      unavailable.set(`${chapter.nodeId}\0${mentalUnitId}`, Object.freeze({ nodeId: chapter.nodeId, mentalUnitId }));
    }
    if (chapterCosted) costedChapterCount += 1;
  }
  const unavailableScopeRefs = Object.freeze([...unavailable.values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId) || left.mentalUnitId.localeCompare(right.mentalUnitId)));
  const minimumRemainingResponses = input.completion.kind === "completed" ? 0 : input.completion.remainingAttemptCount;
  const kind = input.completion.kind === "completed" ? "complete" as const
    : unavailableScopeRefs.length > 0 || unavailableChapters.length > 0 ? "scope_costs_incomplete" as const
      : "scope_costed_volume_unavailable" as const;
  return Object.freeze({ kind, requiredChapterCount: chapters.length, costedChapterCount, minimumRemainingResponses, unavailableScopeRefs, unavailableChapterIds: Object.freeze(unavailableChapters.sort()) });
}

function aggregateScopes(questions: readonly Readonly<{ nodeId: string; mentalUnitId: string }>[]) {
  const counts = new Map<string, { nodeId: string; mentalUnitId: string; responses: number }>();
  for (const question of questions) {
    const key = `${question.nodeId}\0${question.mentalUnitId}`;
    const current = counts.get(key) ?? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: 0 };
    current.responses += 1;
    counts.set(key, current);
  }
  return Object.freeze([...counts.values()].map((scope) => Object.freeze(scope)));
}

function unavailable(reason: "empty_pool" | "invalid_response_count" | "missing_scope_estimate" | "review_reserve_unavailable", scopeRefs: readonly Readonly<{ nodeId: string; mentalUnitId: string }>[]): PlanningWorkEstimateResult {
  return Object.freeze({ kind: "unavailable", reason, scopeRefs: Object.freeze([...scopeRefs]) });
}
