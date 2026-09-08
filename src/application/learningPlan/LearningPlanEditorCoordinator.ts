import {
  acceptedTargetFromGoal,
  InvalidLearningPlanError,
  type GoalDay,
  type GoalSnapshot,
  type LearningPlan,
  type PlanSlot,
  type ProposalIdentity,
  type ProposalOutcome,
  type TrackId,
  type AcceptedTargetSnapshot,
  type ContentPackagePin,
} from "../../domain";
import { GOAL_DAY_IDS } from "../../domain/goals/goalContracts";
import {
  LearningPlanProposalCoordinator,
  learningPlanProposalCoordinator,
  proposalIdentitiesEqual,
  type LearningPlanProposalResult,
} from "./LearningPlanProposalCoordinator";
import {
  getGoalSnapshot,
  getLearningPlanSnapshot,
  saveLearningPlanAtomically,
  type LearningPlanSnapshot,
  type SaveLearningPlanAtomicallyInput,
  StaleLearningPlanStorageRevisionError,
  LearningPlanCommandConflictError,
} from "../../storage/repositories";
import { StaleGoalRevisionError } from "../../storage/repositories/goalRepository";
import { contentPackagePinsEqual } from "../../domain/learning/contentPackagePin";
import { createLearningPlanSlotId } from "../../domain/learning/slotIdentity";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getTrackRegistration } from "../../domain/tracks/trackRegistry";

export type { LearningPlanSnapshot } from "../../storage/repositories";

export type LearningPlanEditorSource = Readonly<{
  kind: "proposal" | "accepted_plan";
  proposalId?: string;
  planId?: string;
  planRevision?: number;
  goalRevision: number;
  expectedPlanStorageRevision: number | null;
  identity: ProposalIdentity | AcceptedPlanIdentity;
}>;

export type AcceptedPlanIdentity = Readonly<{
  trackId: TrackId;
  timezone: string;
  contentVersion: string;
  contentPackagePin: LearningPlan["contentPackagePin"];
  planId: string;
  planRevision: number;
  acceptedTarget: AcceptedTargetSnapshot;
}>;

export type LearningPlanEditorSession = Readonly<{
  editorId: string;
  trackId: TrackId;
  source: LearningPlanEditorSource;
  slots: readonly PlanSlot[];
  allowedSessionLengths: readonly number[];
  commandId: string;
}>;

export type LearningPlanEditorStartResult =
  | Readonly<{ kind: "ready"; session: LearningPlanEditorSession }>
  | Readonly<{ kind: "stale"; reason: LearningPlanEditorStaleReason }>
  | Readonly<{ kind: "storage_error" }>;

export type LearningPlanEditorStaleReason = "missing_session" | "proposal" | "goal" | "plan" | "identity";

export type LearningPlanEditorMutationResult =
  | Readonly<{ kind: "updated"; session: LearningPlanEditorSession }>
  | Readonly<{ kind: "stale"; reason: LearningPlanEditorStaleReason }>
  | Readonly<{ kind: "validation_error"; code: LearningPlanEditorValidationCode }>
  | Readonly<{ kind: "storage_error" }>;

export type LearningPlanEditorCommitResult =
  | Readonly<{ kind: "saved"; snapshot: LearningPlanSnapshot }>
  | Readonly<{ kind: "stale"; reason: LearningPlanEditorStaleReason }>
  | Readonly<{ kind: "validation_error"; code: LearningPlanEditorValidationCode }>
  | Readonly<{ kind: "storage_error" }>;

export type LearningPlanAcceptResult =
  | Readonly<{ kind: "accepted"; snapshot: LearningPlanSnapshot }>
  | Readonly<{ kind: "stale"; reason: LearningPlanEditorStaleReason }>
  | Readonly<{ kind: "validation_error"; code: LearningPlanEditorValidationCode }>
  | Readonly<{ kind: "storage_error" }>;

export type LearningPlanEditorValidationCode =
  | "invalid_days"
  | "session_length_unavailable"
  | "invalid_local_time"
  | "missing_day"
  | "unsupported_session_length"
  | "invalid_schedule";

export type LearningPlanContentContext = Readonly<{
  contentVersion: string;
  contentPackagePin: ContentPackagePin;
  timezone: string;
}>;

export type LearningPlanEditorDependencies = Readonly<{
  proposalCoordinator: LearningPlanProposalCoordinator;
  loadGoalSnapshot(trackId: TrackId): Promise<GoalSnapshot | null>;
  loadLearningPlanSnapshot(trackId: TrackId): LearningPlanSnapshot | null;
  loadContentContext(trackId: TrackId): Promise<LearningPlanContentContext>;
  saveLearningPlan(input: SaveLearningPlanAtomicallyInput): LearningPlanSnapshot;
  createEditorId(): string;
  now(): string;
}>;

type InternalSession = {
  editorId: string;
  trackId: TrackId;
  source: LearningPlanEditorSource;
  slots: PlanSlot[];
  allowedSessionLengths: number[];
  commandId: string;
  nextSlotCounter: number;
};

/**
 * Owns every plan edit and accept command.  Both paths end in the same
 * goal+plan compare-and-swap repository call, so a direct accept invalidates
 * an older editor session and vice versa.
 */
export class LearningPlanEditorCoordinator {
  private readonly sessions = new Map<string, InternalSession>();
  private readonly pendingPlans = new Map<string, LearningPlan>();
  private readonly pendingProposalAccepts = new Map<string, { plan: LearningPlan; expectedPlanStorageRevision: number | null }>();
  private readonly proposalAcceptInFlight = new Map<string, Promise<LearningPlanAcceptResult>>();
  private readonly acceptedProposalResults = new Map<string, LearningPlanAcceptResult>();

  constructor(private readonly dependencies: LearningPlanEditorDependencies) {}

  async startProposalEdit(proposalId: string, trackId: TrackId): Promise<LearningPlanEditorStartResult> {
    let proposal: Extract<LearningPlanProposalResult, { proposal: { outcome: ProposalOutcome } }>;
    try {
      const result = await this.dependencies.proposalCoordinator.resolve(proposalId, trackId);
      if (!isEditableProposal(result)) return stale("proposal");
      proposal = result;
    } catch {
      return frozen({ kind: "storage_error" });
    }

    let goal: GoalSnapshot | null;
    let plan: LearningPlanSnapshot | null;
    try {
      [goal, plan] = await Promise.all([
        this.dependencies.loadGoalSnapshot(trackId),
        Promise.resolve(this.dependencies.loadLearningPlanSnapshot(trackId)),
      ]);
    } catch {
      return frozen({ kind: "storage_error" });
    }
    if (!goal || goal.revision !== proposal.proposal.outcome.identity.goalRevision) return stale("goal");
    if (proposal.proposal.outcome.identity.trackId !== trackId) return stale("identity");

    const editorId = this.dependencies.createEditorId();
    if (!isNonEmpty(editorId)) return frozen({ kind: "storage_error" });
    const commandId = `learning-plan:${editorId}:commit`;
    const slots = cloneSlots(proposal.proposal.outcome.slots);
    const allowedSessionLengths = proposalLengthOptions(proposal.proposal.outcome);
    const session: InternalSession = {
      editorId,
      trackId,
      source: Object.freeze({
        kind: "proposal",
        proposalId,
        goalRevision: proposal.proposal.outcome.identity.goalRevision,
        expectedPlanStorageRevision: plan?.revision ?? null,
        identity: proposal.proposal.outcome.identity,
      }),
      slots,
      allowedSessionLengths,
      commandId,
      nextSlotCounter: slots.length,
    };
    this.sessions.set(editorId, session);
    return frozen({ kind: "ready", session: snapshotSession(session) });
  }

  /** Alias used by application callers that describe an edit as a begin action. */
  beginProposalEdit(proposalId: string, trackId: TrackId): Promise<LearningPlanEditorStartResult> {
    return this.startProposalEdit(proposalId, trackId);
  }

  async startExistingEdit(trackId: TrackId): Promise<LearningPlanEditorStartResult> {
    let goal: GoalSnapshot | null;
    let plan: LearningPlanSnapshot | null;
    try {
      [goal, plan] = await Promise.all([
        this.dependencies.loadGoalSnapshot(trackId),
        Promise.resolve(this.dependencies.loadLearningPlanSnapshot(trackId)),
      ]);
    } catch {
      return frozen({ kind: "storage_error" });
    }
    if (!goal) return stale("goal");
    if (!plan) return stale("plan");
    let contentContext: LearningPlanContentContext;
    try {
      contentContext = await this.dependencies.loadContentContext(trackId);
    } catch {
      return frozen({ kind: "storage_error" });
    }
    if (plan.plan.trackId !== trackId) return stale("identity");
    if (plan.plan.goalRevision !== goal.revision) return stale("goal");
    if (plan.plan.contentVersion !== contentContext.contentVersion || !contentPackagePinsEqual(plan.plan.contentPackagePin, contentContext.contentPackagePin) || plan.plan.timezone !== contentContext.timezone) return stale("identity");
    const currentTarget = acceptedTargetFromGoal(goal.record);
    if (plan.plan.acceptedTarget.meaning !== currentTarget.meaning || plan.plan.acceptedTarget.targetDate !== currentTarget.targetDate) return stale("identity");

    const editorId = this.dependencies.createEditorId();
    if (!isNonEmpty(editorId)) return frozen({ kind: "storage_error" });
    const session: InternalSession = {
      editorId,
      trackId,
      source: Object.freeze({
        kind: "accepted_plan",
        planId: plan.plan.planId,
        planRevision: plan.plan.planRevision,
        contentVersion: plan.plan.contentVersion,
        goalRevision: goal.revision,
        expectedPlanStorageRevision: plan.revision,
        identity: Object.freeze({
          trackId,
          timezone: plan.plan.timezone,
          contentVersion: plan.plan.contentVersion,
          contentPackagePin: plan.plan.contentPackagePin,
          planId: plan.plan.planId,
          planRevision: plan.plan.planRevision,
          acceptedTarget: plan.plan.acceptedTarget,
        }),
      }),
      slots: cloneSlots(plan.plan.slots),
      allowedSessionLengths: uniqueLengths(plan.plan.slots.map((slot) => slot.sessionLength)),
      commandId: `learning-plan:${editorId}:commit`,
      nextSlotCounter: plan.plan.slots.length,
    };
    this.sessions.set(editorId, session);
    return frozen({ kind: "ready", session: snapshotSession(session) });
  }

  beginExistingEdit(trackId: TrackId): Promise<LearningPlanEditorStartResult> {
    return this.startExistingEdit(trackId);
  }

  /** Existing plan entry point; the read above is intentionally explicit. */
  beginAcceptedPlanEdit(trackId: TrackId): Promise<LearningPlanEditorStartResult> {
    return this.startExistingEdit(trackId);
  }

  getSession(editorId: string, trackId: TrackId): LearningPlanEditorSession | null {
    const session = this.sessions.get(editorId);
    return session && session.trackId === trackId ? snapshotSession(session) : null;
  }

  updateDays(editorId: string, trackId: TrackId, days: readonly GoalDay[]): LearningPlanEditorMutationResult {
    const session = this.findSession(editorId, trackId);
    if (!session) return stale("missing_session");
    if (!isValidDays(days)) return frozen({ kind: "validation_error" as const, code: "invalid_days" as const });

    const previousByDay = new Map(session.slots.map((slot) => [slot.day, slot]));
    const defaultLength = session.allowedSessionLengths[0];
    if (defaultLength === undefined) return frozen({ kind: "validation_error" as const, code: "session_length_unavailable" as const });
    session.slots = sortSlots(days.map((day) => previousByDay.get(day) ?? Object.freeze({
      slotId: createLearningPlanSlotId(`${editorId}:slot:${session.nextSlotCounter++}`),
      day,
      localTime: "18:00",
      sessionLength: defaultLength,
    })));
    return frozen({ kind: "updated", session: snapshotSession(session) });
  }

  updateSlotTime(editorId: string, trackId: TrackId, day: GoalDay, localTime: string): LearningPlanEditorMutationResult {
    const session = this.findSession(editorId, trackId);
    if (!session) return stale("missing_session");
    if (!isLocalTime(localTime)) return frozen({ kind: "validation_error" as const, code: "invalid_local_time" as const });
    const slot = session.slots.find((candidate) => candidate.day === day);
    if (!slot) return frozen({ kind: "validation_error" as const, code: "missing_day" as const });
    session.slots = session.slots.map((candidate) => candidate.day === day ? Object.freeze({ ...candidate, localTime }) : candidate);
    return frozen({ kind: "updated", session: snapshotSession(session) });
  }

  updateSessionLength(editorId: string, trackId: TrackId, day: GoalDay, sessionLength: number): LearningPlanEditorMutationResult {
    const session = this.findSession(editorId, trackId);
    if (!session) return stale("missing_session");
    if (!Number.isSafeInteger(sessionLength) || sessionLength < 1 || !session.allowedSessionLengths.includes(sessionLength)) {
      return frozen({ kind: "validation_error" as const, code: "unsupported_session_length" as const });
    }
    const slot = session.slots.find((candidate) => candidate.day === day);
    if (!slot) return frozen({ kind: "validation_error" as const, code: "missing_day" as const });
    session.slots = session.slots.map((candidate) => candidate.day === day ? Object.freeze({ ...candidate, sessionLength }) : candidate);
    return frozen({ kind: "updated", session: snapshotSession(session) });
  }

  editSchedule(editorId: string, trackId: TrackId, days: readonly GoalDay[], localTimes?: Partial<Record<GoalDay, string>>): LearningPlanEditorMutationResult {
    const changed = this.updateDays(editorId, trackId, days);
    if (changed.kind !== "updated" || !localTimes) return changed;
    let result: LearningPlanEditorMutationResult = changed;
    for (const day of days) {
      const localTime = localTimes[day];
      if (localTime !== undefined) result = this.updateSlotTime(editorId, trackId, day, localTime);
      if (result.kind !== "updated") return result;
    }
    return result;
  }

  async commit(editorId: string, trackId: TrackId): Promise<LearningPlanEditorCommitResult> {
    const session = this.findSession(editorId, trackId);
    if (!session) return stale("missing_session");
    const validation = validateEditorSlots(session);
    if (validation) return frozen({ kind: "validation_error" as const, code: validation });

    let goal: GoalSnapshot | null;
    let currentPlan: LearningPlanSnapshot | null;
    try {
      [goal, currentPlan] = await Promise.all([
        this.dependencies.loadGoalSnapshot(trackId),
        Promise.resolve(this.dependencies.loadLearningPlanSnapshot(trackId)),
      ]);
    } catch {
      return frozen({ kind: "storage_error" });
    }
    const pending = this.pendingPlans.get(editorId);
    // A retry after an uncertain write may skip source freshness checks only
    // after the durable command is observed in the canonical plan record.
    if (pending && currentPlan?.plan.commandId === pending.commandId) {
      if (!goal) return stale("goal");
      return this.persistEditorPlan(session, pending, goal.revision, currentPlan?.revision ?? null);
    }
    if (!goal || goal.revision !== session.source.goalRevision) return stale("goal");

    if (session.source.kind === "proposal") {
      const proposalId = session.source.proposalId;
      if (!proposalId) return stale("proposal");
      const result = await this.dependencies.proposalCoordinator.resolve(proposalId, trackId);
      if (!isEditableProposal(result) || !proposalIdentitiesEqual(result.proposal.outcome.identity, session.source.identity as ProposalIdentity)) return stale("proposal");
      if ((currentPlan?.revision ?? null) !== session.source.expectedPlanStorageRevision) return stale("plan");
    } else {
      const identity = session.source.identity as AcceptedPlanIdentity;
      let contentContext: LearningPlanContentContext;
      try {
        contentContext = await this.dependencies.loadContentContext(trackId);
      } catch {
        return frozen({ kind: "storage_error" });
      }
      if (!currentPlan || currentPlan.revision !== session.source.expectedPlanStorageRevision || currentPlan.plan.planId !== identity.planId || currentPlan.plan.planRevision !== identity.planRevision || currentPlan.plan.trackId !== trackId || currentPlan.plan.contentVersion !== identity.contentVersion || currentPlan.plan.contentVersion !== contentContext.contentVersion || currentPlan.plan.timezone !== identity.timezone || currentPlan.plan.timezone !== contentContext.timezone || !contentPackagePinsEqual(currentPlan.plan.contentPackagePin, identity.contentPackagePin) || !contentPackagePinsEqual(currentPlan.plan.contentPackagePin, contentContext.contentPackagePin) || currentPlan.plan.acceptedTarget.meaning !== identity.acceptedTarget.meaning || currentPlan.plan.acceptedTarget.targetDate !== identity.acceptedTarget.targetDate) {
        if (pending && currentPlan?.plan.commandId === pending.commandId) return this.persistEditorPlan(session, pending, goal.revision, currentPlan.revision);
        return stale("plan");
      }
    }

    const plan = pending ?? this.buildPlan(session, goal, currentPlan);
    if (!plan) return stale("plan");
    this.pendingPlans.set(editorId, plan);
    return this.persistEditorPlan(session, plan, goal.revision, session.source.expectedPlanStorageRevision);
  }

  commitEditor(editorId: string, trackId: TrackId): Promise<LearningPlanEditorCommitResult> {
    return this.commit(editorId, trackId);
  }

  acceptProposal(proposalId: string, trackId: TrackId): Promise<LearningPlanAcceptResult> {
    const key = proposalOperationKey(proposalId, trackId);
    const terminal = this.acceptedProposalResults.get(key);
    if (terminal) return Promise.resolve(terminal);
    const inFlight = this.proposalAcceptInFlight.get(key);
    if (inFlight) return inFlight;
    const promise = this.acceptProposalOnce(proposalId, trackId, key);
    this.proposalAcceptInFlight.set(key, promise);
    void promise.then((result) => {
      if (this.proposalAcceptInFlight.get(key) === promise) this.proposalAcceptInFlight.delete(key);
      if (result.kind === "accepted") this.acceptedProposalResults.set(key, result);
    }, () => {
      if (this.proposalAcceptInFlight.get(key) === promise) this.proposalAcceptInFlight.delete(key);
    });
    return promise;
  }

  private async acceptProposalOnce(proposalId: string, trackId: TrackId, key: string): Promise<LearningPlanAcceptResult> {
    const pending = this.pendingProposalAccepts.get(key);
    if (pending) {
      let currentPlan: LearningPlanSnapshot | null;
      let goal: GoalSnapshot | null;
      try {
        [goal, currentPlan] = await Promise.all([
          this.dependencies.loadGoalSnapshot(trackId),
          Promise.resolve(this.dependencies.loadLearningPlanSnapshot(trackId)),
        ]);
      } catch {
        return frozen({ kind: "storage_error" });
      }
      if (goal && currentPlan?.plan.commandId === pending.plan.commandId) {
        const saved = this.persistProposal(pending.plan, pending.plan.goalRevision, currentPlan.revision);
        if (saved.kind === "accepted") this.completeProposalAcceptance(proposalId, key);
        return saved;
      }
    }
    let result: LearningPlanProposalResult;
    try { result = await this.dependencies.proposalCoordinator.resolve(proposalId, trackId); } catch { return frozen({ kind: "storage_error" }); }
    if (!isEditableProposal(result)) return stale("proposal");

    let goal: GoalSnapshot | null;
    let currentPlan: LearningPlanSnapshot | null;
    try {
      [goal, currentPlan] = await Promise.all([
        this.dependencies.loadGoalSnapshot(trackId),
        Promise.resolve(this.dependencies.loadLearningPlanSnapshot(trackId)),
      ]);
    } catch {
      return frozen({ kind: "storage_error" });
    }
    const identity = result.proposal.outcome.identity;
    if (!goal || goal.revision !== identity.goalRevision) return stale("goal");
    if (!pending && identity.trackId !== trackId) return stale("identity");

    const command = pending ?? {
      plan: this.buildProposalPlan(result.proposal.outcome, proposalPlanId(proposalId), proposalCommandId(proposalId), goal, currentPlan),
      expectedPlanStorageRevision: currentPlan?.revision ?? null,
    };
    this.pendingProposalAccepts.set(key, command);
    const saved = this.persistProposal(command.plan, goal.revision, command.expectedPlanStorageRevision);
    if (saved.kind === "accepted") {
      this.completeProposalAcceptance(proposalId, key);
    }
    return saved;
  }

  acceptPlan(proposalId: string, trackId: TrackId): Promise<LearningPlanAcceptResult> {
    return this.acceptProposal(proposalId, trackId);
  }

  discard(editorId: string): void {
    this.sessions.delete(editorId);
    this.pendingPlans.delete(editorId);
  }

  private completeProposalAcceptance(proposalId: string, key: string): void {
    this.pendingProposalAccepts.delete(key);
    this.dependencies.proposalCoordinator.remove(proposalId);
  }

  private persistEditorPlan(session: InternalSession, plan: LearningPlan, goalRevision: number, expectedPlanStorageRevision: number | null): LearningPlanEditorCommitResult {
    try {
      const snapshot = this.dependencies.saveLearningPlan({ plan, expectedGoalRevision: goalRevision, expectedPlanStorageRevision, trackId: session.trackId });
      this.sessions.delete(session.editorId);
      this.pendingPlans.delete(session.editorId);
      if (session.source.kind === "proposal" && session.source.proposalId) this.dependencies.proposalCoordinator.remove(session.source.proposalId);
      return frozen({ kind: "saved", snapshot });
    } catch (error) {
      return classifyCommitError(error);
    }
  }

  private persistProposal(plan: LearningPlan, expectedGoalRevision: number, expectedPlanStorageRevision: number | null): LearningPlanAcceptResult {
    try {
      return frozen({ kind: "accepted", snapshot: this.dependencies.saveLearningPlan({ plan, expectedGoalRevision, expectedPlanStorageRevision, trackId: plan.trackId }) });
    } catch (error) {
      return classifyAcceptError(error);
    }
  }

  private buildPlan(session: InternalSession, goal: GoalSnapshot, currentPlan: LearningPlanSnapshot | null): LearningPlan | null {
    if (session.source.kind === "proposal") {
      const identity = session.source.identity as ProposalIdentity;
      return this.buildProposalPlan({
        identity,
        slots: session.slots,
      }, `plan:${session.editorId}`, session.commandId, goal, currentPlan, session.slots);
    }
    if (!currentPlan) return null;
    const source = currentPlan.plan;
    return {
      ...source,
      goalRevision: goal.revision,
      status: source.status === "paused" ? "accepted" : source.status,
      acceptedTarget: acceptedTargetFromGoal(goal.record),
      updatedAt: this.dependencies.now(),
      planRevision: source.planRevision + 1,
      commandId: session.commandId,
      slots: session.slots,
    };
  }

  private buildProposalPlan(outcome: Pick<ProposalOutcome, "identity"> & { slots: readonly PlanSlot[] }, planId: string, commandId: string, goal: GoalSnapshot, currentPlan: LearningPlanSnapshot | null = null, slots = cloneSlots(outcome.slots)): LearningPlan {
    const now = this.dependencies.now();
    const source = currentPlan?.plan;
    return {
      schemaVersion: 1,
      planId: source?.planId ?? planId,
      trackId: outcome.identity.trackId,
      goalRevision: goal.revision,
      status: "accepted",
      timezone: outcome.identity.timezone,
      contentVersion: outcome.identity.contentVersion,
      contentPackagePin: outcome.identity.packagePin,
      acceptedTarget: acceptedTargetFromGoal(goal.record),
      createdAt: source?.createdAt ?? now,
      updatedAt: now,
      planRevision: source ? source.planRevision + 1 : 1,
      commandId,
      slots,
    };
  }

  private findSession(editorId: string, trackId: TrackId): InternalSession | null {
    const session = this.sessions.get(editorId);
    return session && session.trackId === trackId ? session : null;
  }
}

function isEditableProposal(result: LearningPlanProposalResult): result is Extract<LearningPlanProposalResult, { proposal: { outcome: ProposalOutcome } }> {
  return (result.kind === "ready" || result.kind === "shortened") && "proposal" in result;
}

function proposalLengthOptions(outcome: ProposalOutcome): number[] {
  if (outcome.sessionCapacity.kind === "shortfall") return [];
  return [outcome.sessionCapacity.actualLength];
}

function cloneSlots(slots: readonly PlanSlot[]): PlanSlot[] {
  return sortSlots(slots.map((slot) => Object.freeze({ slotId: slot.slotId, day: slot.day, localTime: slot.localTime, sessionLength: slot.sessionLength })));
}

function sortSlots(slots: readonly PlanSlot[]): PlanSlot[] {
  return [...slots].sort((left, right) => GOAL_DAY_IDS.indexOf(left.day) - GOAL_DAY_IDS.indexOf(right.day));
}

function uniqueLengths(values: readonly number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function isValidDays(days: readonly GoalDay[]): boolean {
  return Array.isArray(days) && days.length >= 1 && days.length <= 7 && new Set(days).size === days.length && days.every((day) => GOAL_DAY_IDS.includes(day));
}

function isLocalTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  return match !== null && Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

function validateEditorSlots(session: InternalSession): LearningPlanEditorValidationCode | null {
  if (!isValidDays(session.slots.map((slot) => slot.day))) return "invalid_schedule";
  for (let index = 0; index < session.slots.length; index += 1) {
    const slot = session.slots[index];
    if (!slot || !isLocalTime(slot.localTime) || !Number.isSafeInteger(slot.sessionLength) || slot.sessionLength < 1 || !session.allowedSessionLengths.includes(slot.sessionLength)) return "invalid_schedule";
    if (index > 0 && GOAL_DAY_IDS.indexOf(session.slots[index - 1]!.day) >= GOAL_DAY_IDS.indexOf(slot.day)) return "invalid_schedule";
  }
  return null;
}

function classifyCommitError(error: unknown): LearningPlanEditorCommitResult {
  if (error instanceof StaleGoalRevisionError) return stale("goal");
  if (error instanceof StaleLearningPlanStorageRevisionError || error instanceof LearningPlanCommandConflictError) return stale("plan");
  if (error instanceof InvalidLearningPlanError || error instanceof RangeError) return frozen({ kind: "validation_error" as const, code: "invalid_schedule" as const });
  return frozen({ kind: "storage_error" });
}

function classifyAcceptError(error: unknown): LearningPlanAcceptResult {
  if (error instanceof StaleGoalRevisionError) return stale("goal");
  if (error instanceof StaleLearningPlanStorageRevisionError || error instanceof LearningPlanCommandConflictError) return stale("plan");
  if (error instanceof InvalidLearningPlanError || error instanceof RangeError) return frozen({ kind: "validation_error" as const, code: "invalid_schedule" as const });
  return frozen({ kind: "storage_error" });
}

function proposalPlanId(proposalId: string): string { return `plan:${proposalId}`; }
function proposalCommandId(proposalId: string): string { return `learning-plan:${proposalId}:accept`; }
function proposalOperationKey(proposalId: string, trackId: TrackId): string { return JSON.stringify([proposalId, trackId]); }
function isNonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function stale(reason: LearningPlanEditorStaleReason): Readonly<{ kind: "stale"; reason: LearningPlanEditorStaleReason }> { return Object.freeze({ kind: "stale" as const, reason }); }
function snapshotSession(session: InternalSession): LearningPlanEditorSession {
  return Object.freeze({ ...session, slots: Object.freeze(cloneSlots(session.slots)), allowedSessionLengths: Object.freeze([...session.allowedSessionLengths]) });
}
function frozen<T extends object>(value: T): Readonly<T> { return Object.freeze(value); }

let editorSequence = 0;
export const learningPlanEditorCoordinator = new LearningPlanEditorCoordinator({
  proposalCoordinator: learningPlanProposalCoordinator,
  loadGoalSnapshot: getGoalSnapshot,
  loadLearningPlanSnapshot: getLearningPlanSnapshot,
  loadContentContext: async (trackId) => {
    const registration = getTrackRegistration(trackId);
    const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, registration.familyId);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return Object.freeze({ contentVersion: resolved.package.contentVersion, contentPackagePin: resolved.package.packagePin, timezone });
  },
  saveLearningPlan: saveLearningPlanAtomically,
  createEditorId: () => `editor:${Date.now()}:${++editorSequence}`,
  now: () => new Date().toISOString(),
});
