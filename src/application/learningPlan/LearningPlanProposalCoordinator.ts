import { projectLearningEvidence } from "./learningEvidenceProjection";
import { ContentError } from "../../content/errors";
import type { ResolvedPackageRuntime } from "../contentPackageRuntimeOwner";
import type { GoalRecord } from "../../domain/goals/goalContracts";
import type { LearningPlan } from "../../domain/learning/learningPlan";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import {
  acceptedTargetFromGoal,
  InvalidLearningPlanProposalInputError,
  generateLearningPlanProposal,
  type ProposalIdentity,
  type ProposalOutcome,
  type PackageCompletionState,
  type TrackId,
} from "../../domain";
import { getTrackRegistration } from "../../domain/tracks/trackRegistry";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { createProposalSlotId } from "../../domain/learning/slotIdentity";
import { readLearningPlanInputSnapshot, type LearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";
import { ActiveSessionPlanningError, recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import type { LearningPlanModeRecommendation } from "./learningPlanModeRecommendation";
import { estimateNextSessionTime } from "./nextSessionTimeEstimate";
import { estimateLegalNextSessionOptions, projectFullGoalScopeAvailability } from "./nextSessionTimeEstimate";
import type { FullGoalScopeAvailability } from "./nextSessionTimeEstimate";
import { projectFullGoalWorkload } from "./fullGoalWorkloadProjection";
import type { FullGoalWorkloadProjection } from "./fullGoalWorkloadProjection";
import { assessFullGoalTimeCapacity } from "./fullGoalTimeCapacity";
import type { FullGoalTimeCapacity } from "./fullGoalTimeCapacity";
import type { PlanningWorkEstimateResult } from "../../domain/learning/planningWorkEstimate";
import { buildPlanningCalendar, type PlanningCalendarResult, type PlanningSessionDemand, type TodayActiveTime } from "../../domain/learning/planningCalendar";
import { projectGoalTargetDate } from "../../domain/goals/goalTargetDateSemantics";
import { readActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { getApplicationCurrentTime } from "../trainingLifecycle/applicationLifecycle";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { getTrainingSessionProgress } from "../trainingSessions/sessionDurability";

export type ProposalId = string;

export type CoordinatedLearningPlanProposal = Readonly<{
  proposalId: ProposalId;
  trackId: TrackId;
  outcome: ProposalOutcome;
  nextSessionTimeEstimate: PlanningWorkEstimateResult;
  nextSessionCalendar: Readonly<{ kind: "available"; calendar: PlanningCalendarResult }> | Readonly<{ kind: "unavailable"; reason: "no_legal_session_estimate" }>;
  fullGoalCalendar: Readonly<{ kind: "available"; calendar: PlanningCalendarResult }> | Readonly<{ kind: "unavailable"; reason: "no_legal_session_estimate" }>;
  fullGoalScopeAvailability: FullGoalScopeAvailability;
  fullGoalWorkload: FullGoalWorkloadProjection;
  fullGoalTimeCapacity: FullGoalTimeCapacity;
}>;

export type DevelopmentGoalPlanFaultProposalSnapshot = Readonly<{
  proposalId: ProposalId;
  trackId: TrackId;
  storageScope: object;
  fingerprint: string;
  isCurrent(): boolean;
  isRetained(): boolean;
  matchesAcceptance(goal: GoalRecord, plan: LearningPlan): boolean;
}>;

export type ProposalFailureClassification = "retryable" | "terminal" | "unclassified";

export type LearningPlanProposalResult =
  | Readonly<{ kind: "no_goal" }>
  | Readonly<{ kind: "goal_paused" }>
  | Readonly<{ kind: "budget_required" }>
  | Readonly<{ kind: "package_error" }>
  | Readonly<{ kind: "package_unavailable" }>
  | Readonly<{ kind: "active_session_unavailable"; reason: ActiveSessionPlanningError["reason"] }>
  | Readonly<{ kind: "generator_error"; classification: ProposalFailureClassification }>
  | Readonly<{ kind: "stale" }>
  | Readonly<{ kind: "ready" | "shortened" | "shortfall"; proposal: CoordinatedLearningPlanProposal }>;

export type LearningPlanProposalDependencies = Readonly<{
  createProposalId(): ProposalId;
  getTimezone(): string;
  readInputs(trackId: TrackId): LearningPlanInputSnapshot;
  peekPackage(trackId: TrackId): ResolvedPackageRuntime | null;
  now(): string;
  resolvePackage(trackId: TrackId, familyId: string): Promise<ResolvedPackageRuntime>;
  resolveTrackFamily(trackId: TrackId): import("../../domain/learning/trackIdentity").TrackFamilyId;
}>;

type ProposalContext = Readonly<{
  storageScope: object;
  fingerprint: string;
  fingerprintBase: string;
  calendarSchedule: readonly Readonly<{ day: import("../../domain/goals/goalContracts").GoalDay; localTime: string }>[];
  calendarWindowOpenToday: boolean;
  timezone: string;
  localToday: string;
  goalRecord: GoalRecord;
  expectedGoalRevision: number | null;
  minutesPerStudyDay: number;
  planningPolicyIdentity: import("../../domain/learning/learningPlan").LearningPlanPolicyIdentity;
  dueReviewCount: number;
  completion: PackageCompletionState;
  recommendation: LearningPlanModeRecommendation;
}>;

type StoredProposal = Readonly<{
  proposal: CoordinatedLearningPlanProposal;
  context: ProposalContext;
  calendarInputs: Readonly<{
    sessions: readonly import("../../domain").TrainingSession[];
    legalSessions: readonly import("../../domain/learning/planningCalendar").LegalSessionOption[];
    dueObligations: readonly import("../../domain/learning/planningCalendar").PlanningDueObligation[];
    sessionDemands: readonly PlanningSessionDemand[];
  }>;
}>;

export class LearningPlanProposalCoordinator {
  private readonly proposals = new Map<ProposalId, StoredProposal>();

  constructor(private readonly dependencies: LearningPlanProposalDependencies) {}

  async create(trackId: TrackId, draft?: Readonly<{ goal: GoalRecord; minutesPerStudyDay: number }>): Promise<LearningPlanProposalResult> {
    let before: LearningPlanInputSnapshot;
    try { before = this.dependencies.readInputs(trackId); }
    catch { return generatorError("retryable"); }
    const goalRecord = draft?.goal ?? before.goal?.record;
    if (!goalRecord) return frozen({ kind: "no_goal" });
    if (goalRecord.status === "paused") return frozen({ kind: "goal_paused" });
    const minutesPerStudyDay = draft?.minutesPerStudyDay ?? (before.plan?.plan.schemaVersion === 2 ? before.plan.plan.minutesPerStudyDay : undefined);
    if (minutesPerStudyDay === undefined) return frozen({ kind: "budget_required" });

    let familyId: import("../../domain/learning/trackIdentity").TrackFamilyId;
    try { familyId = this.dependencies.resolveTrackFamily(trackId); }
    catch { return generatorError("terminal"); }

    let requestedAt: string;
    let requestedTimezone: string;
    try {
      requestedAt = this.dependencies.now();
      requestedTimezone = this.dependencies.getTimezone();
      localDateFor(requestedAt, requestedTimezone);
    } catch { return generatorError("terminal"); }

    let resolved: ResolvedPackageRuntime;
    try { resolved = await this.dependencies.resolvePackage(trackId, familyId); }
    catch (error) { return classifyPackageFailure(error); }

    let after: LearningPlanInputSnapshot;
    let beforeContext: ProposalContext;
    let context: ProposalContext;
    try { after = this.dependencies.readInputs(trackId); }
    catch { return generatorError("retryable"); }
    try { await validateActiveSession(after, resolved, familyId); }
    catch (error) { return error instanceof ActiveSessionPlanningError ? activeSessionFailure(error) : generatorError("unclassified"); }
    try {
      if (!sameStorageScope(before, after) || (after.goal?.revision ?? null) !== (before.goal?.revision ?? null)) return frozen({ kind: "stale" });
      beforeContext = buildProposalContext(before, resolved, requestedAt, requestedTimezone, familyId, goalRecord, minutesPerStudyDay);
      context = buildProposalContext(after, resolved, this.dependencies.now(), this.dependencies.getTimezone(), familyId, goalRecord, minutesPerStudyDay);
    } catch (error) {
      if (error instanceof ActiveSessionPlanningError) return activeSessionFailure(error);
      return error instanceof RangeError ? generatorError("terminal") : generatorError("unclassified");
    }
    if (beforeContext.fingerprint !== context.fingerprint) return frozen({ kind: "stale" });

    try {
      const primary = resolved.track.getMode(context.recommendation.executionPolicy.practice.modeId);
      const requestedLength = context.recommendation.executionPolicy.practice.requestedLength;
      const pool = resolved.track.getPool(primary.modeId);
      const capacity = pool.length >= requestedLength
        ? Object.freeze({ kind: "exact" as const, actualLength: requestedLength })
        : Object.freeze({ kind: "shortfall" as const, requestedLength, eligibleItemCount: pool.length, missingItemCount: Math.max(0, requestedLength - pool.length) });
      const outcome = generateLearningPlanProposal({
        goalRecord: context.goalRecord,
        expectedGoalRevision: context.expectedGoalRevision,
        minutesPerStudyDay: context.minutesPerStudyDay,
        executionPolicy: context.recommendation.executionPolicy,
        nextSession: context.recommendation.continuation
          ? { kind: "continue_existing", modeId: context.recommendation.mode.modeId, requestedLength: context.recommendation.requestedLength, sessionId: context.recommendation.continuation.sessionId }
          : { kind: context.recommendation.phase, modeId: context.recommendation.mode.modeId, requestedLength: context.recommendation.requestedLength },
        diagnosisStatus: context.recommendation.diagnosis,
        artifactSha256: resolved.track.artifactSha256,
        planningPolicyIdentity: context.planningPolicyIdentity,
        contentVersion: resolved.track.contentVersion,
        primaryModeId: primary.modeId,
        requestedLength,
        sessionCapacity: capacity,
        completionState: context.completion,
        dueReviewCount: context.dueReviewCount,
      primaryScopeLabel: humanizeScope(primary.selection.kind === "node" ? primary.selection.nodeId : "track"),
        localToday: context.localToday,
        timezone: context.timezone,
      });
      const estimateInput = {
        track: resolved.track,
        planningPolicy: resolved.planningPolicy,
        planningPolicyIdentity: resolved.planningPolicyIdentity,
        recommendation: context.recommendation,
        sessions: (after.sessions ?? []).filter((session) => session.trackId === trackId),
        attempts: after.attempts,
        reviews: after.reviews,
        now: requestedAt,
        requestedLength: context.recommendation.requestedLength,
      } as const;
      const nextSessionTimeEstimate = estimateNextSessionTime(estimateInput);
      const legalSessions = estimateLegalNextSessionOptions(estimateInput);
      const fullGoalScopeAvailability = projectFullGoalScopeAvailability({ track: resolved.track, planningPolicy: resolved.planningPolicy, completion: context.completion });
      const fullGoalWorkload = projectFullGoalWorkload({
        track: resolved.track,
        policy: resolved.planningPolicy,
        planningPolicyIdentity: resolved.planningPolicyIdentity,
        completion: context.completion,
        sessions: (after.sessions ?? []).filter((session) => session.trackId === trackId),
        activeSession: after.activeSession ?? null,
        attempts: after.attempts,
        reviews: after.reviews,
        practiceMode: primary,
        ...(context.recommendation.executionPolicy.initialDiagnosis ? { diagnosisMode: resolved.track.getMode(context.recommendation.executionPolicy.initialDiagnosis.modeId), diagnosisStatus: context.recommendation.diagnosis } : { diagnosisStatus: context.recommendation.diagnosis }),
        ...(context.recommendation.reviewMode ? { reviewMode: context.recommendation.reviewMode } : {}),
      });
      const continuationDemands = fullGoalWorkload.sessionDemands.filter((demand) => demand.kind === "continue_existing");
      const nextSessionCalendar = buildNextSessionCalendar({
        goal: context.goalRecord,
        minutesPerStudyDay: context.minutesPerStudyDay,
        localToday: context.localToday,
        timezone: context.timezone,
        now: requestedAt,
        sessions: (after.sessions ?? []).filter((session) => session.trackId === trackId),
        legalSessions: legalOptionsForNextSession(legalSessions, outcome.nextSession.requestedLength),
        sessionDemands: continuationDemands,
        sessionLocalTimesByDay: sessionTimesByDay(outcome.slots),
      });
      const continuationReviewIds = new Set(fullGoalWorkload.sessionDemands.flatMap((demand) => demand.kind === "continue_existing" ? demand.reviewEntryIds ?? [] : []));
      const fullGoalCalendar = buildFullGoalCalendar({
        goal: context.goalRecord,
        minutesPerStudyDay: context.minutesPerStudyDay,
        localToday: context.localToday,
        timezone: context.timezone,
        now: requestedAt,
        sessions: (after.sessions ?? []).filter((session) => session.trackId === trackId),
        legalSessions,
        sessionLocalTimesByDay: sessionTimesByDay(outcome.slots),
        dueObligations: fullGoalWorkload.dueReviews.flatMap((review) => continuationReviewIds.has(review.id) || review.minMinutes === null || review.typicalMinutes === null || review.maxMinutes === null ? [] : [{
          id: review.id, dueAt: review.dueAt, minMinutes: review.minMinutes, typicalMinutes: review.typicalMinutes, maxMinutes: review.maxMinutes,
        }]),
        sessionDemands: fullGoalWorkload.sessionDemands,
      });
      const fullGoalTimeCapacity = assessFullGoalTimeCapacity({ workload: fullGoalWorkload, calendar: fullGoalCalendar.kind === "available" ? fullGoalCalendar.calendar : null });
      const proposalId = this.dependencies.createProposalId();
      if (typeof proposalId !== "string" || !proposalId.trim() || this.proposals.has(proposalId)) return generatorError("terminal");
      const proposal = frozen({ proposalId, trackId, outcome, nextSessionTimeEstimate, nextSessionCalendar, fullGoalCalendar, fullGoalScopeAvailability, fullGoalWorkload, fullGoalTimeCapacity });
      const proposalContext = buildProposalContext(after, resolved, requestedAt, requestedTimezone, familyId, goalRecord, minutesPerStudyDay, outcome.slots);
      this.proposals.set(proposalId, frozen({ proposal, context: proposalContext, calendarInputs: Object.freeze({
        sessions: Object.freeze([...(after.sessions ?? []).filter((session) => session.trackId === trackId)]), legalSessions,
        dueObligations: Object.freeze(fullGoalWorkload.dueReviews.flatMap((review) => continuationReviewIds.has(review.id) || review.minMinutes === null || review.typicalMinutes === null || review.maxMinutes === null ? [] : [{
          id: review.id, dueAt: review.dueAt, minMinutes: review.minMinutes, typicalMinutes: review.typicalMinutes, maxMinutes: review.maxMinutes,
        }])), sessionDemands: fullGoalWorkload.sessionDemands,
      }) }));
      return frozen({ kind: outcome.kind, proposal });
    } catch (error) {
      return generatorError(error instanceof InvalidLearningPlanProposalInputError || error instanceof RangeError ? "terminal" : "unclassified");
    }
  }

  async resolve(proposalId: ProposalId, trackId: TrackId): Promise<LearningPlanProposalResult> {
    const stored = this.proposals.get(proposalId);
    if (!stored || stored.proposal.trackId !== trackId) return frozen({ kind: "stale" });

    let before: LearningPlanInputSnapshot;
    try { before = this.dependencies.readInputs(trackId); }
    catch { return generatorError("retryable"); }
    if ((before.goal?.revision ?? null) !== stored.context.expectedGoalRevision) return frozen({ kind: "stale" });

    let familyId: import("../../domain/learning/trackIdentity").TrackFamilyId;
    try { familyId = this.dependencies.resolveTrackFamily(trackId); }
    catch { return generatorError("terminal"); }
    let requestedAt: string;
    let requestedTimezone: string;
    try {
      requestedAt = this.dependencies.now();
      requestedTimezone = this.dependencies.getTimezone();
      localDateFor(requestedAt, requestedTimezone);
    } catch { return generatorError("terminal"); }
    let resolved: ResolvedPackageRuntime;
    try { resolved = await this.dependencies.resolvePackage(trackId, familyId); }
    catch (error) { return classifyPackageFailure(error); }

    let after: LearningPlanInputSnapshot;
    let beforeContext: ProposalContext;
    let context: ProposalContext;
    try { after = this.dependencies.readInputs(trackId); }
    catch { return generatorError("retryable"); }
    try { await validateActiveSession(after, resolved, familyId); }
    catch (error) { return error instanceof ActiveSessionPlanningError ? activeSessionFailure(error) : generatorError("unclassified"); }
    try {
      if (!sameStorageScope(before, after) || (after.goal?.revision ?? null) !== stored.context.expectedGoalRevision) return frozen({ kind: "stale" });
      beforeContext = buildProposalContext(before, resolved, requestedAt, requestedTimezone, familyId, stored.context.goalRecord, stored.context.minutesPerStudyDay, stored.proposal.outcome.slots);
      context = buildProposalContext(after, resolved, this.dependencies.now(), this.dependencies.getTimezone(), familyId, stored.context.goalRecord, stored.context.minutesPerStudyDay, stored.proposal.outcome.slots);
    } catch (error) {
      if (error instanceof ActiveSessionPlanningError) return activeSessionFailure(error);
      return error instanceof RangeError ? generatorError("terminal") : generatorError("unclassified");
    }
    if (!contextsEqual(beforeContext, context) || !contextsEqual(stored.context, context)) return frozen({ kind: "stale" });
    return frozen({ kind: stored.proposal.outcome.kind, proposal: stored.proposal });
  }

  /** Final synchronous guard for the existing goal+plan commit owner. */
  resolveForCommit(proposalId: ProposalId, trackId: TrackId): LearningPlanProposalResult {
    const stored = this.proposals.get(proposalId);
    if (!stored || stored.proposal.trackId !== trackId) return frozen({ kind: "stale" });

    let snapshot: LearningPlanInputSnapshot;
    let resolved: ResolvedPackageRuntime | null;
    let context: ProposalContext;
    try {
      snapshot = this.dependencies.readInputs(trackId);
      resolved = this.dependencies.peekPackage(trackId);
      if (!resolved) return frozen({ kind: "stale" });
      if ((snapshot.goal?.revision ?? null) !== stored.context.expectedGoalRevision) return frozen({ kind: "stale" });
      context = buildProposalContext(snapshot, resolved, this.dependencies.now(), this.dependencies.getTimezone(), getTrackRegistration(trackId).familyId, stored.context.goalRecord, stored.context.minutesPerStudyDay, stored.proposal.outcome.slots);
    } catch (error) {
      if (error instanceof ActiveSessionPlanningError) return activeSessionFailure(error);
      return error instanceof RangeError ? generatorError("terminal") : generatorError("retryable");
    }
    if (!sameStorageScope(snapshot, { storageScope: stored.context.storageScope }) || !contextsEqual(stored.context, context)) {
      return frozen({ kind: "stale" });
    }
    return frozen({ kind: stored.proposal.outcome.kind, proposal: stored.proposal });
  }

  /** Exact, read-only snapshot for the development-only interrupted-acceptance probe. */
  readDevelopmentGoalPlanFaultProposalSnapshot(proposalId: ProposalId, trackId: TrackId): DevelopmentGoalPlanFaultProposalSnapshot | null {
    const stored = this.proposals.get(proposalId);
    if (!stored || stored.proposal.trackId !== trackId) return null;
    const current = this.readDevelopmentGoalPlanFaultProposalState(proposalId, trackId, stored);
    if (!current) return null;
    const snapshot = Object.freeze({
      proposalId,
      trackId,
      storageScope: stored.context.storageScope,
      fingerprint: stored.context.fingerprint,
      isCurrent: () => this.readDevelopmentGoalPlanFaultProposalState(proposalId, trackId, stored),
      isRetained: () => this.proposals.get(proposalId) === stored && stored.proposal.proposalId === proposalId && stored.context.fingerprint === snapshot.fingerprint,
      matchesAcceptance: (goal: GoalRecord, plan: LearningPlan) => {
        const outcome = stored.proposal.outcome;
        return this.proposals.get(proposalId) === stored && stored.proposal.proposalId === proposalId &&
          canonicalSerialize(goal) === canonicalSerialize(outcome.goal) && plan.schemaVersion === 2 && plan.trackId === trackId && plan.planId === `plan:${proposalId}` &&
          plan.goalRevision === 1 && plan.planRevision === 1 && plan.status === "accepted" && plan.minutesPerStudyDay === outcome.minutesPerStudyDay &&
          plan.timezone === outcome.identity.timezone && plan.contentVersion === outcome.identity.contentVersion &&
          plan.artifactSha256 === outcome.identity.artifactSha256 && canonicalSerialize(plan.planningPolicyIdentity) === canonicalSerialize(outcome.identity.planningPolicyIdentity) &&
          canonicalSerialize(plan.executionPolicy) === canonicalSerialize(outcome.executionPolicy) &&
          canonicalSerialize(plan.acceptedTarget) === canonicalSerialize(acceptedTargetFromGoal(outcome.goal)) &&
          plan.commandId === `learning-plan:${proposalId}:accept` && canonicalSerialize(plan.slots) === canonicalSerialize(outcome.slots);
      },
    });
    return snapshot;
  }

  private readDevelopmentGoalPlanFaultProposalState(proposalId: ProposalId, trackId: TrackId, stored: StoredProposal): boolean {
    try {
      if (this.proposals.get(proposalId) !== stored || readActiveTrackId() !== trackId) return false;
      const snapshot = this.dependencies.readInputs(trackId);
      if (snapshot.goal !== null || snapshot.plan !== null || (snapshot.sessions?.length ?? 0) > 0 ||
        !sameStorageScope(snapshot, { storageScope: stored.context.storageScope })) return false;
      const resolvedPackage = this.dependencies.peekPackage(trackId);
      if (!resolvedPackage) return false;
      const resolved = this.resolveForCommit(proposalId, trackId);
      if (!("proposal" in resolved) || resolved.proposal.proposalId !== proposalId) return false;
      const context = buildProposalContext(snapshot, resolvedPackage, this.dependencies.now(), this.dependencies.getTimezone(),
        getTrackRegistration(trackId).familyId, stored.context.goalRecord, stored.context.minutesPerStudyDay, stored.proposal.outcome.slots);
      return contextsEqual(stored.context, context);
    } catch { return false; }
  }

  updateSchedule(proposalId: ProposalId, trackId: TrackId, slots: readonly Readonly<{ slotId: string; day: ProposalOutcome["slots"][number]["day"]; localTime: string; sessionLength: number }>[]): boolean {
    const stored = this.proposals.get(proposalId);
    if (!stored || stored.proposal.trackId !== trackId || slots.length === 0) return false;
    const days = new Set<string>();
    for (const slot of slots) {
      if (days.has(slot.day) || !Number.isSafeInteger(slot.sessionLength) || slot.sessionLength < 1 || !/^\d{2}:\d{2}$/u.test(slot.localTime)) return false;
      days.add(slot.day);
    }
    let now: string; let timezone: string;
    try { now = this.dependencies.now(); timezone = this.dependencies.getTimezone(); } catch { return false; }
    const localToday = localDateFor(now, timezone);
    if (localToday !== stored.context.localToday || timezone !== stored.context.timezone) return false;
    const scheduled = Object.freeze(slots.map((slot) => Object.freeze({ ...slot, slotId: createProposalSlotId(`proposal-slot:v1:${slot.day}:18-00`) })));
    const context = withCalendarSchedule(stored.context, scheduled, now, timezone);
    const localTimes = sessionTimesByDay(scheduled);
    const nextSessionCalendar = buildNextSessionCalendar({ goal: context.goalRecord, minutesPerStudyDay: context.minutesPerStudyDay, localToday: context.localToday,
      timezone: context.timezone, now, sessions: stored.calendarInputs.sessions,
      legalSessions: legalOptionsForNextSession(stored.calendarInputs.legalSessions, stored.proposal.outcome.nextSession.requestedLength),
      sessionDemands: stored.proposal.fullGoalWorkload.sessionDemands.filter((demand) => demand.kind === "continue_existing"), sessionLocalTimesByDay: localTimes });
    const fullGoalCalendar = buildFullGoalCalendar({ goal: context.goalRecord, minutesPerStudyDay: context.minutesPerStudyDay, localToday: context.localToday,
      timezone: context.timezone, now, sessions: stored.calendarInputs.sessions, legalSessions: stored.calendarInputs.legalSessions,
      sessionLocalTimesByDay: localTimes, dueObligations: stored.calendarInputs.dueObligations, sessionDemands: stored.calendarInputs.sessionDemands });
    const fullGoalTimeCapacity = assessFullGoalTimeCapacity({ workload: stored.proposal.fullGoalWorkload, calendar: fullGoalCalendar.kind === "available" ? fullGoalCalendar.calendar : null });
    const outcome = Object.freeze({ ...stored.proposal.outcome, slots: scheduled });
    const proposal = Object.freeze({ ...stored.proposal, outcome, nextSessionCalendar, fullGoalCalendar, fullGoalTimeCapacity });
    this.proposals.set(proposalId, Object.freeze({ ...stored, context, proposal }));
    return true;
  }

  remove(proposalId: ProposalId): void { this.proposals.delete(proposalId); }
}

export function proposalIdentitiesEqual(left: ProposalIdentity, right: ProposalIdentity): boolean {
  return left.trackId === right.trackId && left.goalRevision === right.goalRevision &&
    left.contentVersion === right.contentVersion && left.timezone === right.timezone &&
    left.artifactSha256 === right.artifactSha256 && JSON.stringify(left.planningPolicyIdentity) === JSON.stringify(right.planningPolicyIdentity);
}

let proposalSequence = 0;
export const learningPlanProposalCoordinator = new LearningPlanProposalCoordinator({
  createProposalId: () => `proposal:${Date.now()}:${++proposalSequence}`,
  getTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  readInputs: readLearningPlanInputSnapshot,
  peekPackage: (trackId) => {
    try { return contentPackageRuntimeOwner.getPreparedDiscovery(trackId); }
    catch { return null; }
  },
  now: getApplicationCurrentTime,
  resolvePackage: (trackId, familyId) => contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId),
  resolveTrackFamily: (trackId) => getTrackRegistration(trackId).familyId,
});

function buildProposalContext(snapshot: LearningPlanInputSnapshot, resolved: ResolvedPackageRuntime, now: string, timezone: string, familyId: import("../../domain/learning/trackIdentity").TrackFamilyId, goalRecord: GoalRecord, minutesPerStudyDay: number, slots?: readonly ProposalOutcome["slots"][number][]): ProposalContext {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || !timezone.trim()) throw new RangeError("Invalid proposal clock context.");
  if (!Number.isSafeInteger(minutesPerStudyDay) || minutesPerStudyDay < 1 || minutesPerStudyDay > 1440 || goalRecord.trackId !== resolved.track.trackId || goalRecord.status !== "active") throw new RangeError("Invalid goal or per-track availability.");
  const localToday = localDateFor(now, timezone);
  if (!resolved.planningPolicy || !resolved.planningPolicyIdentity) throw new Error("The exact content successor has no planning policy identity.");
  const evidence = projectLearningEvidence({ profile: resolved.track, attempts: snapshot.attempts, reviews: snapshot.reviews, now });
  const recommendation = recommendLearningPlanMode({ familyId, trackId: resolved.track.trackId, modes: resolved.track.modes, sessions: snapshot.sessions ?? [], activeSession: snapshot.activeSession ?? null, dueReviewCount: evidence.dueReviews.length });
  const primary = resolved.track.getMode(recommendation.executionPolicy.practice.modeId);
  const pool = resolved.track.getPool(primary.modeId);
  const packageIdentity = {
    trackId: resolved.track.trackId,
    contentVersion: resolved.track.contentVersion,
    artifactSha256: resolved.track.artifactSha256,
    planningPolicy: resolved.planningPolicyIdentity,
  };
  const attempts = evidence.attempts;
  const reviews = evidence.reviews;
  const dueReviewCount = evidence.dueReviews.length;
  // Keep a bounded private digest rather than retaining a full history per proposal.
  const fingerprintBase = sha256Utf8(canonicalSerialize({
    goal: snapshot.goal,
    goalRecord,
    expectedGoalRevision: snapshot.goal?.revision ?? null,
    minutesPerStudyDay,
    plan: snapshot.plan,
    package: packageIdentity,
    completionRule: resolved.track.completionRule ?? null,
    modes: resolved.track.modes,
    sessions: (snapshot.sessions ?? []).filter((session) => session.trackId === resolved.track.trackId),
    recommendation: { modeId: recommendation.mode.modeId, reviewModeId: recommendation.reviewMode?.modeId ?? null, requestedLength: recommendation.requestedLength, phase: recommendation.phase, diagnosis: recommendation.diagnosis, continuation: recommendation.continuation, executionPolicy: recommendation.executionPolicy },
    primaryModeId: primary.modeId,
    primaryPoolQuestionIds: pool.map((question) => question.questionId),
    attempts,
    reviews,
    dueReviewCount,
    localToday,
    timezone,
  }));
  const calendarSchedule = normalizeCalendarSchedule(goalRecord, slots);
  const calendarWindowOpenToday = isCalendarWindowOpenToday(calendarSchedule, now, timezone);
  const fingerprint = calendarFingerprint(fingerprintBase, calendarSchedule, calendarWindowOpenToday);
  return Object.freeze({ storageScope: snapshot.storageScope, fingerprint, fingerprintBase, calendarSchedule, calendarWindowOpenToday, timezone, localToday, goalRecord: Object.freeze({ ...goalRecord, preferredDays: Object.freeze([...goalRecord.preferredDays]) }), expectedGoalRevision: snapshot.goal?.revision ?? null, minutesPerStudyDay, planningPolicyIdentity: resolved.planningPolicyIdentity, dueReviewCount, completion: evidence.completion, recommendation });
}

function sameStorageScope(left: Pick<LearningPlanInputSnapshot, "storageScope">, right: Pick<LearningPlanInputSnapshot, "storageScope">): boolean {
  return left.storageScope === right.storageScope;
}

function contextsEqual(left: ProposalContext, right: ProposalContext): boolean {
  return sameStorageScope(left, right) && left.fingerprint === right.fingerprint;
}

function normalizeCalendarSchedule(goal: GoalRecord, slots?: readonly ProposalOutcome["slots"][number][]): ProposalContext["calendarSchedule"] {
  const values = slots ? slots.map(({ day, localTime }) => ({ day, localTime })) : goal.preferredDays.map((day) => ({ day, localTime: "18:00" }));
  return Object.freeze([...values].sort((left, right) => left.day.localeCompare(right.day)).map((entry) => Object.freeze(entry)));
}

function sessionTimesByDay(slots: readonly Readonly<{ day: import("../../domain/goals/goalContracts").GoalDay; localTime: string }>[]): Partial<Readonly<Record<import("../../domain/goals/goalContracts").GoalDay, string>>> {
  return Object.freeze(Object.fromEntries(slots.map(({ day, localTime }) => [day, localTime])));
}

function isCalendarWindowOpenToday(schedule: ProposalContext["calendarSchedule"], now: string, timezone: string): boolean {
  const localToday = localDateFor(now, timezone);
  const weekday = new Date(`${localToday}T00:00:00.000Z`).getUTCDay();
  const day: import("../../domain/goals/goalContracts").GoalDay = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[weekday]!;
  const localTime = schedule.find((entry) => entry.day === day)?.localTime;
  return localTime !== undefined && localTimeForInstant(now, timezone) <= localTime;
}

function calendarFingerprint(base: string, schedule: ProposalContext["calendarSchedule"], openToday: boolean): string {
  return sha256Utf8(canonicalSerialize({ base, schedule, openToday }));
}

function withCalendarSchedule(context: ProposalContext, slots: readonly ProposalOutcome["slots"][number][], now: string, timezone: string): ProposalContext {
  const calendarSchedule = normalizeCalendarSchedule(context.goalRecord, slots);
  const calendarWindowOpenToday = isCalendarWindowOpenToday(calendarSchedule, now, timezone);
  return Object.freeze({ ...context, calendarSchedule, calendarWindowOpenToday, fingerprint: calendarFingerprint(context.fingerprintBase, calendarSchedule, calendarWindowOpenToday) });
}

function localDateFor(now: string, timezone: string): string {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || !timezone.trim()) throw new RangeError("Invalid proposal clock context.");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year"); const month = part("month"); const day = part("day");
  if (!year || !month || !day) throw new RangeError("Invalid proposal local date.");
  return `${year}-${month}-${day}`;
}

function humanizeScope(scopeId: string): string {
  const value = scopeId.replaceAll("_", " ").trim();
  if (!value) throw new InvalidLearningPlanProposalInputError("invalid_primary_scope_label");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildNextSessionCalendar(input: Readonly<{
  goal: GoalRecord;
  minutesPerStudyDay: number;
  localToday: string;
  timezone: string;
  now: string;
  sessions: readonly import("../../domain").TrainingSession[];
  legalSessions: readonly import("../../domain/learning/planningCalendar").LegalSessionOption[];
  sessionDemands: readonly PlanningSessionDemand[];
  sessionLocalTimesByDay?: Partial<Readonly<Record<import("../../domain/goals/goalContracts").GoalDay, string>>>;
}>): CoordinatedLearningPlanProposal["nextSessionCalendar"] {
  if (input.legalSessions.length === 0) return Object.freeze({ kind: "unavailable", reason: "no_legal_session_estimate" });
  const activeTime = projectTodayForegroundUsage(input.sessions, input.localToday, input.timezone);
  const target = projectGoalTargetDate(input.goal);
  try {
    return Object.freeze({ kind: "available", calendar: buildPlanningCalendar({
      localToday: input.localToday,
      timezone: input.timezone,
      preferredDays: input.goal.preferredDays,
      weeklySessionTarget: input.goal.weeklySessionTarget,
      dueObligations: [],
      ...(input.sessionDemands.length > 0 ? { sessionDemands: input.sessionDemands } : {}),
      targetDate: target.targetDate ?? null,
      targetMeaning: target.meaning,
      availableMinutesPerStudyDay: input.minutesPerStudyDay,
      todayActiveTime: activeTime,
      sessionLocalTime: "18:00",
      ...(input.sessionLocalTimesByDay ? { sessionLocalTimesByDay: input.sessionLocalTimesByDay } : {}),
      currentLocalTime: localTimeForInstant(input.now, input.timezone),
      legalSessions: input.legalSessions,
      requiredSessionCount: input.sessionDemands.length > 0 ? 0 : 1,
    }) });
  } catch { return Object.freeze({ kind: "unavailable", reason: "no_legal_session_estimate" }); }
}

function legalOptionsForNextSession(
  options: readonly import("../../domain/learning/planningCalendar").LegalSessionOption[],
  requestedLength: number,
): readonly import("../../domain/learning/planningCalendar").LegalSessionOption[] {
  return Object.freeze(options.filter((option) => option.sessionLength === requestedLength));
}

function buildFullGoalCalendar(input: Readonly<{
  goal: GoalRecord;
  minutesPerStudyDay: number;
  localToday: string;
  timezone: string;
  now: string;
  sessions: readonly import("../../domain").TrainingSession[];
  legalSessions: readonly import("../../domain/learning/planningCalendar").LegalSessionOption[];
  dueObligations: readonly import("../../domain/learning/planningCalendar").PlanningDueObligation[];
  sessionDemands: readonly PlanningSessionDemand[];
  sessionLocalTimesByDay?: Partial<Readonly<Record<import("../../domain/goals/goalContracts").GoalDay, string>>>;
}>): CoordinatedLearningPlanProposal["fullGoalCalendar"] {
  if (input.legalSessions.length === 0) return Object.freeze({ kind: "unavailable", reason: "no_legal_session_estimate" });
  const activeTime = projectTodayForegroundUsage(input.sessions, input.localToday, input.timezone);
  const target = projectGoalTargetDate(input.goal);
  try {
    return Object.freeze({ kind: "available", calendar: buildPlanningCalendar({
      localToday: input.localToday,
      timezone: input.timezone,
      preferredDays: input.goal.preferredDays,
      weeklySessionTarget: input.goal.weeklySessionTarget,
      dueObligations: input.dueObligations,
      targetDate: target.targetDate ?? null,
      targetMeaning: target.meaning,
      availableMinutesPerStudyDay: input.minutesPerStudyDay,
      todayActiveTime: activeTime,
      sessionLocalTime: "18:00",
      ...(input.sessionLocalTimesByDay ? { sessionLocalTimesByDay: input.sessionLocalTimesByDay } : {}),
      currentLocalTime: localTimeForInstant(input.now, input.timezone),
      legalSessions: input.legalSessions,
      sessionDemands: input.sessionDemands,
    }) });
  } catch { return Object.freeze({ kind: "unavailable", reason: "no_legal_session_estimate" }); }
}

function projectTodayForegroundUsage(sessions: readonly import("../../domain").TrainingSession[], today: string, timezone: string): TodayActiveTime {
  let foregroundMs = 0;
  for (const session of sessions) {
    const startedAt = Date.parse(session.startedAt);
    if (!Number.isFinite(startedAt)) return Object.freeze({ kind: "unknown", reason: "unavailable" });
    const startDate = localDateFor(session.startedAt, timezone);
    if (startDate === today) { foregroundMs += session.activeForegroundMs; continue; }
    if (session.status === "active") return Object.freeze({ kind: "unknown", reason: "session_started_before_today" });
    if (session.completedAt && Number.isFinite(Date.parse(session.completedAt)) && localDateFor(session.completedAt, timezone) === today) {
      return Object.freeze({ kind: "unknown", reason: "active_interval_crosses_today_boundary" });
    }
  }
  if (!Number.isFinite(foregroundMs) || foregroundMs > 86_400_000) return Object.freeze({ kind: "unknown", reason: "unavailable" });
  return Object.freeze({ kind: "known", minutes: Math.floor(foregroundMs / 60_000) });
}

function localTimeForInstant(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = fields.hour; const minute = fields.minute;
  if (!hour || !minute) throw new RangeError("Proposal local time is invalid.");
  return `${hour}:${minute}`;
}

function classifyPackageFailure(error: unknown): LearningPlanProposalResult {
  return error instanceof ContentError ? frozen({ kind: "package_unavailable" }) : frozen({ kind: "package_error" });
}

async function validateActiveSession(snapshot: LearningPlanInputSnapshot, resolved: ResolvedPackageRuntime, familyId: import("../../domain/learning/trackIdentity").TrackFamilyId): Promise<void> {
  const active = snapshot.activeSession ?? null;
  if (!active) return;
  if (active.trackId !== resolved.track.trackId) throw new ActiveSessionPlanningError("another_track_active");
  try {
    if (resolved.track.getMode(active.modeId).timer.kind !== "elapsed_foreground") throw new ActiveSessionPlanningError("active_session_mode_unavailable");
  } catch (error) {
    if (error instanceof ActiveSessionPlanningError) throw error;
    throw new ActiveSessionPlanningError("active_session_mode_unavailable");
  }
  const matchingAttempts = snapshot.attempts.filter((attempt) => attempt.sessionId === active.id);
  if (matchingAttempts.some((attempt) => attempt.committedAt === undefined)) throw new ActiveSessionPlanningError("active_session_not_indexed");
  try {
    await new CanonicalTrainingRuntime(resolved.track, familyId).validateResume({ session: active, draft: null });
    getTrainingSessionProgress(active, matchingAttempts);
  } catch {
    throw new ActiveSessionPlanningError("active_session_mode_unavailable");
  }
}

function activeSessionFailure(error: ActiveSessionPlanningError): LearningPlanProposalResult {
  return frozen({ kind: "active_session_unavailable", reason: error.reason });
}

function generatorError(classification: ProposalFailureClassification): LearningPlanProposalResult {
  return frozen({ kind: "generator_error", classification });
}

function frozen<T extends object>(value: T): Readonly<T> { return Object.freeze(value); }
