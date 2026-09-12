import { ContentError } from "../../content/errors";
import type { ResolvedPackageRuntime } from "../contentPackageRuntimeOwner";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import {
  InvalidLearningPlanProposalInputError,
  contentPackagePinsEqual,
  evaluatePackageCompletion,
  generateLearningPlanProposal,
  type GoalSnapshot,
  type ProposalIdentity,
  type ProposalOutcome,
  type ReviewQueueEntry,
  type TrackId,
  type TrainingAttempt,
} from "../../domain";
import { getTrackRegistration } from "../../domain/tracks/trackRegistry";
import { getGoalSnapshot, getReviewQueueItems, getTrainingAttempts } from "../../storage/repositories";

export type ProposalId = string;

export type CoordinatedLearningPlanProposal = Readonly<{
  proposalId: ProposalId;
  trackId: TrackId;
  outcome: ProposalOutcome;
}>;

export type ProposalFailureClassification = "retryable" | "terminal" | "unclassified";

export type LearningPlanProposalResult =
  | Readonly<{ kind: "no_goal" }>
  | Readonly<{ kind: "goal_paused" }>
  | Readonly<{ kind: "package_error" }>
  | Readonly<{ kind: "package_unavailable" }>
  | Readonly<{ kind: "generator_error"; classification: ProposalFailureClassification }>
  | Readonly<{ kind: "stale" }>
  | Readonly<{ kind: "ready" | "shortened" | "shortfall"; proposal: CoordinatedLearningPlanProposal }>;

export type LearningPlanProposalDependencies = Readonly<{
  createProposalId(): ProposalId;
  getTimezone(): string;
  loadAttempts(): Promise<readonly TrainingAttempt<unknown>[]>;
  loadGoalSnapshot(trackId: TrackId): Promise<GoalSnapshot | null>;
  loadReviews(): Promise<readonly ReviewQueueEntry[]>;
  now(): string;
  resolvePackage(trackId: TrackId, familyId: string): Promise<ResolvedPackageRuntime>;
  resolveTrackFamily(trackId: TrackId): string;
}>;

export class LearningPlanProposalCoordinator {
  private readonly proposals = new Map<ProposalId, CoordinatedLearningPlanProposal>();

  constructor(private readonly dependencies: LearningPlanProposalDependencies) {}

  async create(trackId: TrackId): Promise<LearningPlanProposalResult> {
    let snapshot: GoalSnapshot | null;
    try { snapshot = await this.dependencies.loadGoalSnapshot(trackId); }
    catch { return generatorError("retryable"); }
    if (!snapshot) return frozen({ kind: "no_goal" });
    if (snapshot.record.status === "paused") return frozen({ kind: "goal_paused" });

    let familyId: string;
    try { familyId = this.dependencies.resolveTrackFamily(trackId); }
    catch { return generatorError("terminal"); }

    let resolved: ResolvedPackageRuntime;
    try { resolved = await this.dependencies.resolvePackage(trackId, familyId); }
    catch (error) { return classifyPackageFailure(error); }

    const now = this.dependencies.now();
    let attempts: readonly TrainingAttempt<unknown>[];
    let reviews: readonly ReviewQueueEntry[];
    try { [attempts, reviews] = await Promise.all([this.dependencies.loadAttempts(), this.dependencies.loadReviews()]); }
    catch { return generatorError("retryable"); }

    try {
      const timezone = this.dependencies.getTimezone();
      const localToday = localDateFor(now, timezone);
      const primary = resolved.track.modes[0];
      if (!primary) throw new Error("Canonical track has no exposed mode.");
      const pool = resolved.track.getPool(primary.modeId);
      const capacity = pool.length >= primary.defaultRequestedLength
        ? Object.freeze({ kind: "exact" as const, actualLength: primary.defaultRequestedLength })
        : Object.freeze({ kind: "shortfall" as const, requestedLength: primary.defaultRequestedLength, eligibleItemCount: pool.length, missingItemCount: Math.max(0, primary.defaultRequestedLength - pool.length) });
      const completionState = Object.freeze({ kind: "unknown" as const });
      const dueReviewCount = reviews.filter((review) => review.trackId === trackId &&
        review.sourceItem.trackId === trackId && review.sourceItem.contentVersion === resolved.track.contentVersion &&
        contentPackagePinsEqual(review.sourceItem.packagePin, resolved.track.packagePin) && review.dueAt <= now).length;
      const outcome = generateLearningPlanProposal({
        goalSnapshot: snapshot,
        packagePin: resolved.track.packagePin,
        contentVersion: resolved.track.contentVersion,
        primaryModeId: primary.modeId,
        requestedLength: primary.defaultRequestedLength,
        sessionCapacity: capacity,
        completionState,
        dueReviewCount,
        primaryScopeLabel: humanizeScope(resolved.track.modes[0]?.selection.kind === "node" ? resolved.track.modes[0].selection.nodeId : "track"),
        localToday,
        timezone,
      });
      const proposalId = this.dependencies.createProposalId();
      if (typeof proposalId !== "string" || !proposalId.trim()) return generatorError("terminal");
      const proposal = frozen({ proposalId, trackId, outcome });
      this.proposals.set(proposalId, proposal);
      return frozen({ kind: outcome.kind, proposal });
    } catch (error) {
      return generatorError(error instanceof InvalidLearningPlanProposalInputError || error instanceof RangeError ? "terminal" : "unclassified");
    }
  }

  async resolve(proposalId: ProposalId, trackId: TrackId): Promise<LearningPlanProposalResult> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.trackId !== trackId) return frozen({ kind: "stale" });

    let snapshot: GoalSnapshot | null;
    try { snapshot = await this.dependencies.loadGoalSnapshot(trackId); }
    catch { return generatorError("retryable"); }
    if (!snapshot) return frozen({ kind: "stale" });

    let familyId: string;
    try { familyId = this.dependencies.resolveTrackFamily(trackId); }
    catch { return generatorError("terminal"); }
    let resolved: ResolvedPackageRuntime;
    try { resolved = await this.dependencies.resolvePackage(trackId, familyId); }
    catch (error) { return classifyPackageFailure(error); }

    let timezone: string;
    try { timezone = this.dependencies.getTimezone(); localDateFor(this.dependencies.now(), timezone); }
    catch { return generatorError("terminal"); }
    const currentIdentity: ProposalIdentity = {
      trackId,
      goalRevision: snapshot.revision,
      contentVersion: resolved.track.contentVersion,
      packagePin: resolved.track.packagePin,
      timezone,
    };
    if (!proposalIdentitiesEqual(proposal.outcome.identity, currentIdentity)) return frozen({ kind: "stale" });
    return frozen({ kind: proposal.outcome.kind, proposal });
  }

  remove(proposalId: ProposalId): void { this.proposals.delete(proposalId); }
}

export function proposalIdentitiesEqual(left: ProposalIdentity, right: ProposalIdentity): boolean {
  return left.trackId === right.trackId && left.goalRevision === right.goalRevision &&
    left.contentVersion === right.contentVersion && left.timezone === right.timezone &&
    contentPackagePinsEqual(left.packagePin, right.packagePin);
}

let proposalSequence = 0;
export const learningPlanProposalCoordinator = new LearningPlanProposalCoordinator({
  createProposalId: () => `proposal:${Date.now()}:${++proposalSequence}`,
  getTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  loadAttempts: async () => (await getTrainingAttempts()).value,
  loadGoalSnapshot: getGoalSnapshot,
  loadReviews: async () => (await getReviewQueueItems()).value,
  now: () => new Date().toISOString(),
  resolvePackage: (trackId, familyId) => contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId),
  resolveTrackFamily: (trackId) => getTrackRegistration(trackId).familyId,
});

function localDateFor(now: string, timezone: string): string {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || !timezone.trim()) throw new RangeError("Invalid proposal clock context.");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: "year" | "month" | "day") => parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year"); const month = part("month"); const day = part("day");
  if (!year || !month || !day) throw new RangeError("Invalid proposal local date.");
  return `${year}-${month}-${day}`;
}

function humanizeScope(scopeId: string): string {
  const value = scopeId.replaceAll("_", " ").trim();
  if (!value) throw new InvalidLearningPlanProposalInputError("invalid_primary_scope_label");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function classifyPackageFailure(error: unknown): LearningPlanProposalResult {
  return error instanceof ContentError ? frozen({ kind: "package_unavailable" }) : frozen({ kind: "package_error" });
}

function generatorError(classification: ProposalFailureClassification): LearningPlanProposalResult {
  return frozen({ kind: "generator_error", classification });
}

function frozen<T extends object>(value: T): Readonly<T> { return Object.freeze(value); }
