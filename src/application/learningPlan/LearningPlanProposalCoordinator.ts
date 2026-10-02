import { ContentError } from "../../content/errors";
import type { ResolvedPackageRuntime } from "../contentPackageRuntimeOwner";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import {
  InvalidLearningPlanProposalInputError,
  generateLearningPlanProposal,
  type ProposalIdentity,
  type ProposalOutcome,
  type TrackId,
} from "../../domain";
import { getTrackRegistration } from "../../domain/tracks/trackRegistry";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readLearningPlanInputSnapshot, type LearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";

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
  readInputs(trackId: TrackId): LearningPlanInputSnapshot;
  peekPackage(trackId: TrackId): ResolvedPackageRuntime | null;
  now(): string;
  resolvePackage(trackId: TrackId, familyId: string): Promise<ResolvedPackageRuntime>;
  resolveTrackFamily(trackId: TrackId): string;
}>;

type ProposalContext = Readonly<{
  storageScope: object;
  fingerprint: string;
  timezone: string;
  localToday: string;
  dueReviewCount: number;
}>;

type StoredProposal = Readonly<{
  proposal: CoordinatedLearningPlanProposal;
  context: ProposalContext;
}>;

export class LearningPlanProposalCoordinator {
  private readonly proposals = new Map<ProposalId, StoredProposal>();

  constructor(private readonly dependencies: LearningPlanProposalDependencies) {}

  async create(trackId: TrackId): Promise<LearningPlanProposalResult> {
    let before: LearningPlanInputSnapshot;
    try { before = this.dependencies.readInputs(trackId); }
    catch { return generatorError("retryable"); }
    if (!before.goal) return frozen({ kind: "no_goal" });
    if (before.goal.record.status === "paused") return frozen({ kind: "goal_paused" });

    let familyId: string;
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
    try {
      if (!sameStorageScope(before, after) || !after.goal || after.goal.record.status === "paused") return frozen({ kind: "stale" });
      beforeContext = buildProposalContext(before, resolved, requestedAt, requestedTimezone);
      context = buildProposalContext(after, resolved, this.dependencies.now(), this.dependencies.getTimezone());
    } catch (error) {
      return error instanceof RangeError ? generatorError("terminal") : generatorError("unclassified");
    }
    if (beforeContext.fingerprint !== context.fingerprint) return frozen({ kind: "stale" });

    try {
      const primary = resolved.track.modes[0];
      if (!primary) throw new Error("Canonical track has no exposed mode.");
      const pool = resolved.track.getPool(primary.modeId);
      const capacity = pool.length >= primary.defaultRequestedLength
        ? Object.freeze({ kind: "exact" as const, actualLength: primary.defaultRequestedLength })
        : Object.freeze({ kind: "shortfall" as const, requestedLength: primary.defaultRequestedLength, eligibleItemCount: pool.length, missingItemCount: Math.max(0, primary.defaultRequestedLength - pool.length) });
      const outcome = generateLearningPlanProposal({
        goalSnapshot: after.goal,
        artifactSha256: resolved.track.artifactSha256,
        contentVersion: resolved.track.contentVersion,
        primaryModeId: primary.modeId,
        requestedLength: primary.defaultRequestedLength,
        sessionCapacity: capacity,
        // The current canonical profiles do not supply an approved completion rule.
        completionState: Object.freeze({ kind: "unknown" as const }),
        dueReviewCount: context.dueReviewCount,
        primaryScopeLabel: humanizeScope(primary.selection.kind === "node" ? primary.selection.nodeId : "track"),
        localToday: context.localToday,
        timezone: context.timezone,
      });
      const proposalId = this.dependencies.createProposalId();
      if (typeof proposalId !== "string" || !proposalId.trim() || this.proposals.has(proposalId)) return generatorError("terminal");
      const proposal = frozen({ proposalId, trackId, outcome });
      this.proposals.set(proposalId, frozen({ proposal, context }));
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
    if (!before.goal || before.goal.record.status === "paused") return frozen({ kind: "stale" });

    let familyId: string;
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
    try {
      if (!sameStorageScope(before, after) || !after.goal || after.goal.record.status === "paused") return frozen({ kind: "stale" });
      beforeContext = buildProposalContext(before, resolved, requestedAt, requestedTimezone);
      context = buildProposalContext(after, resolved, this.dependencies.now(), this.dependencies.getTimezone());
    } catch (error) {
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
      if (!snapshot.goal || snapshot.goal.record.status === "paused") return frozen({ kind: "stale" });
      context = buildProposalContext(snapshot, resolved, this.dependencies.now(), this.dependencies.getTimezone());
    } catch (error) {
      return error instanceof RangeError ? generatorError("terminal") : generatorError("retryable");
    }
    if (!sameStorageScope(snapshot, { storageScope: stored.context.storageScope }) || !contextsEqual(stored.context, context)) {
      return frozen({ kind: "stale" });
    }
    return frozen({ kind: stored.proposal.outcome.kind, proposal: stored.proposal });
  }

  remove(proposalId: ProposalId): void { this.proposals.delete(proposalId); }
}

export function proposalIdentitiesEqual(left: ProposalIdentity, right: ProposalIdentity): boolean {
  return left.trackId === right.trackId && left.goalRevision === right.goalRevision &&
    left.contentVersion === right.contentVersion && left.timezone === right.timezone &&
    left.artifactSha256 === right.artifactSha256;
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
  now: () => new Date().toISOString(),
  resolvePackage: (trackId, familyId) => contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId),
  resolveTrackFamily: (trackId) => getTrackRegistration(trackId).familyId,
});

function buildProposalContext(snapshot: LearningPlanInputSnapshot, resolved: ResolvedPackageRuntime, now: string, timezone: string): ProposalContext {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || !timezone.trim()) throw new RangeError("Invalid proposal clock context.");
  const localToday = localDateFor(now, timezone);
  const primary = resolved.track.modes[0];
  if (!primary) throw new Error("Canonical track has no exposed mode.");
  const pool = resolved.track.getPool(primary.modeId);
  const packageIdentity = {
    trackId: resolved.track.trackId,
    contentVersion: resolved.track.contentVersion,
    artifactSha256: resolved.track.artifactSha256,
  };
  const attempts = uniqueRecords(snapshot.attempts, "attempt").filter((attempt) =>
    attempt.trackId === packageIdentity.trackId && attempt.item.trackId === packageIdentity.trackId &&
    attempt.item.contentVersion === packageIdentity.contentVersion && attempt.item.artifactSha256 === packageIdentity.artifactSha256);
  const reviews = uniqueRecords(snapshot.reviews, "review").filter((review) =>
    review.trackId === packageIdentity.trackId && review.sourceItem.trackId === packageIdentity.trackId &&
    review.sourceItem.contentVersion === packageIdentity.contentVersion && review.sourceItem.artifactSha256 === packageIdentity.artifactSha256);
  const dueReviewCount = reviews.filter((review) => review.dueAt <= now).length;
  // Keep a bounded private digest rather than retaining a full history per proposal.
  const fingerprint = sha256Utf8(canonicalSerialize({
    goal: snapshot.goal,
    plan: snapshot.plan,
    package: packageIdentity,
    modes: resolved.track.modes,
    primaryModeId: primary.modeId,
    primaryPoolQuestionIds: pool.map((question) => question.questionId),
    attempts,
    reviews,
    dueReviewCount,
    localToday,
    timezone,
  }));
  return Object.freeze({ storageScope: snapshot.storageScope, fingerprint, timezone, localToday, dueReviewCount });
}

function uniqueRecords<T extends Readonly<{ id: string }>>(records: readonly T[], label: string): readonly T[] {
  const byId = new Map<string, T>();
  const serializedById = new Map<string, string>();
  for (const record of records) {
    if (!record || typeof record.id !== "string" || !record.id.trim()) throw new Error(`Invalid ${label} identity.`);
    const serialized = canonicalSerialize(record);
    const previous = byId.get(record.id);
    if (previous) {
      if (serializedById.get(record.id) !== serialized) throw new Error(`Conflicting ${label} records share an ID.`);
      continue;
    }
    byId.set(record.id, record);
    serializedById.set(record.id, serialized);
  }
  return Object.freeze([...byId.values()]);
}

function sameStorageScope(left: Pick<LearningPlanInputSnapshot, "storageScope">, right: Pick<LearningPlanInputSnapshot, "storageScope">): boolean {
  return left.storageScope === right.storageScope;
}

function contextsEqual(left: ProposalContext, right: ProposalContext): boolean {
  return sameStorageScope(left, right) && left.fingerprint === right.fingerprint;
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

function classifyPackageFailure(error: unknown): LearningPlanProposalResult {
  return error instanceof ContentError ? frozen({ kind: "package_unavailable" }) : frozen({ kind: "package_error" });
}

function generatorError(classification: ProposalFailureClassification): LearningPlanProposalResult {
  return frozen({ kind: "generator_error", classification });
}

function frozen<T extends object>(value: T): Readonly<T> { return Object.freeze(value); }
