import type { TrackId } from "../../domain";
import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { readLearningPlanStorageScope } from "../../storage/repositories/learningPlanInputSnapshot";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, readActiveAccountIdentityBinding, getActiveStorageProfileOrNull } from "../../storage/repositories/profileStorageRepository";
import { readActiveMutationJournal, type MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";
import { learningPlanProposalCoordinator, type DevelopmentGoalPlanFaultProposalSnapshot } from "../learningPlan/LearningPlanProposalCoordinator";
import type { GoalPlanAcceptanceInterruptionContext, GoalPlanAcceptanceInterruptionHook } from "../../storage/repositories/goalPlanAcceptanceRepository";

export const DEVELOPMENT_INTERRUPT_GOAL_PLAN_ACCEPTANCE_URL = "com.lkurczab.patternly://audit/goal-plan-interruption";

export type GoalPlanAcceptanceInterruptionCommand = Readonly<{ nonce: string; proposalId: string; trackId: TrackId }>;
export type GoalPlanAcceptanceInterruptionCommandResult = "unavailable_in_production" | "ignored" | "armed" | "rejected";

type ActorFence = Readonly<{ isCurrent(): boolean; isCurrentSdkUid(uid: string): boolean }>;
export type GoalPlanAcceptanceInterruptionArmContext = Readonly<{
  development: boolean;
  smoke: boolean;
  authenticated: boolean;
  accountSynced: boolean;
  firebaseUid: string | null;
  accountId: string | null;
  captureActorFence(): ActorFence | null;
}>;

type ArmedInterruption = Readonly<{
  command: GoalPlanAcceptanceInterruptionCommand;
  proposal: DevelopmentGoalPlanFaultProposalSnapshot;
  actorFence: ActorFence;
  firebaseUid: string;
  profileId: string;
  accountId: string;
  lease: NonNullable<ReturnType<typeof captureActiveProfileStorageLease>>;
  storageScope: object;
}>;

let armedInterruption: ArmedInterruption | null = null;
let claimedInterruption: ArmedInterruption | null = null;
let lastInterruptionReceipt: GoalPlanAcceptanceInterruptionReceipt | null = null;

export type GoalPlanAcceptanceInterruptionReceipt = Readonly<{
  checkpoint: "armed" | "interrupted";
  nonce: string;
  proposalId: string;
  trackId: TrackId;
  journalExact: boolean;
  goalBeforeAbsent: boolean;
  planBeforeAbsent: boolean;
  goalReadbackExact: boolean;
  planStillAbsent: boolean;
  callbackConsumed: boolean;
  actorFenceCurrent: boolean;
  profileLeaseCurrent: boolean;
  profileMatches: boolean;
  journalSha256: string | null;
  goalReadbackSha256: string | null;
  planBeforeSha256: string | null;
}>;

/** Read-only, in-memory receipt for the development smoke interruption; never exposes record contents. */
export function getDevelopmentGoalPlanAcceptanceInterruptionReceipt(): GoalPlanAcceptanceInterruptionReceipt | null {
  if (typeof __DEV__ === "undefined" || !__DEV__ || !isPatternlySmokeRuntime()) return null;
  if (lastInterruptionReceipt) return lastInterruptionReceipt;
  const armed = armedInterruption;
  if (!armed) return null;
  return Object.freeze({
    checkpoint: "armed", nonce: armed.command.nonce, proposalId: armed.command.proposalId, trackId: armed.command.trackId,
    journalExact: false, goalBeforeAbsent: true, planBeforeAbsent: true, goalReadbackExact: false, planStillAbsent: true,
    callbackConsumed: false, actorFenceCurrent: armed.actorFence.isCurrent() && armed.actorFence.isCurrentSdkUid(armed.firebaseUid),
    profileLeaseCurrent: isActiveProfileStorageLeaseCurrent(armed.lease),
    profileMatches: getActiveStorageProfileOrNull()?.id === armed.profileId && getActiveStorageProfileOrNull()?.accountId === armed.accountId,
    journalSha256: null, goalReadbackSha256: null, planBeforeSha256: null,
  });
}

export function parseGoalPlanAcceptanceInterruptionCommand(url: string | null): GoalPlanAcceptanceInterruptionCommand | null {
  if (!url) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== DEVELOPMENT_INTERRUPT_GOAL_PLAN_ACCEPTANCE_URL || parsed.hash ||
    [...parsed.searchParams.keys()].length !== 3 || [...parsed.searchParams.keys()].some((key) => !["nonce", "proposalId", "trackId"].includes(key))) return null;
  const nonce = parsed.searchParams.get("nonce");
  const proposalId = parsed.searchParams.get("proposalId");
  const trackId = parsed.searchParams.get("trackId");
  if (!nonce || !/^[A-Za-z0-9_-]{16,128}$/u.test(nonce) || !proposalId || proposalId.length > 256 || !trackId || !isRegisteredTrackId(trackId)) return null;
  return Object.freeze({ nonce, proposalId, trackId });
}

/** Arms one exact proposal interruption only after checking its real authenticated profile and empty pair. */
export async function handleGoalPlanAcceptanceInterruptionUrl(url: string | null, context: GoalPlanAcceptanceInterruptionArmContext): Promise<GoalPlanAcceptanceInterruptionCommandResult> {
  clearGoalPlanAcceptanceInterruptionArm();
  if (!context.development || !context.smoke) return "unavailable_in_production";
  const command = parseGoalPlanAcceptanceInterruptionCommand(url);
  if (!command) return "ignored";
  if (!context.authenticated || !context.accountSynced || !context.firebaseUid || !context.accountId) return "rejected";
  const actorFence = context.captureActorFence();
  const lease = captureActiveProfileStorageLease();
  const profile = getActiveStorageProfileOrNull();
  if (!actorFence || !actorFence.isCurrent() || !actorFence.isCurrentSdkUid(context.firebaseUid) || !lease || !profile ||
    !isActiveProfileStorageLeaseCurrent(lease) || lease.profile.id !== profile.id || !["account", "legacy_owner"].includes(profile.kind) ||
    profile.accountId !== context.accountId || lease.profile.accountId !== context.accountId) return "rejected";
  try {
    const binding = await readActiveAccountIdentityBinding(lease);
    if (binding.kind !== "verified" || binding.binding.profileId !== profile.id || binding.binding.profileKind !== profile.kind ||
      binding.binding.accountId !== context.accountId || binding.binding.firebaseUid !== context.firebaseUid || !actorFence.isCurrentSdkUid(context.firebaseUid) ||
      !isActiveProfileStorageLeaseCurrent(lease)) return "rejected";
    const sync = await getAccountSyncState();
    if (sync.status !== "synced" || sync.accountId !== context.accountId || sync.materialization !== null || sync.pendingConfirmation !== null) return "rejected";
    const storageScope = readLearningPlanStorageScope();
    const proposal = learningPlanProposalCoordinator.readDevelopmentGoalPlanFaultProposalSnapshot(command.proposalId, command.trackId);
    if (!proposal || proposal.storageScope !== storageScope || readActiveMutationJournal() !== null || !proposal.isCurrent() ||
      !actorFence.isCurrentSdkUid(context.firebaseUid) || !isActiveProfileStorageLeaseCurrent(lease)) return "rejected";
    armedInterruption = Object.freeze({ command, proposal, actorFence, firebaseUid: context.firebaseUid, profileId: profile.id,
      accountId: context.accountId, lease, storageScope });
    lastInterruptionReceipt = null;
    return "armed";
  } catch { return "rejected"; }
}

/** Called once by the ordinary proposal-accept path; mismatched work disarms instead of inheriting the fault. */
export function takeGoalPlanAcceptanceInterruptionHook(proposalId: string, trackId: TrackId): GoalPlanAcceptanceInterruptionHook | undefined {
  const armed = armedInterruption;
  if (!armed) return undefined;
  if (armed.command.proposalId !== proposalId || armed.command.trackId !== trackId) {
    clearGoalPlanAcceptanceInterruptionArm();
    return undefined;
  }
  if (claimedInterruption === armed) return undefined;
  claimedInterruption = armed;
  let consumed = false;
  const nonce = armed.command.nonce;
  const hook: GoalPlanAcceptanceInterruptionHook = Object.assign(
    (context: GoalPlanAcceptanceInterruptionContext) => runArmedInterruption(armed, nonce, context, () => consumed, () => { consumed = true; }),
    { dispose: () => { if (armedInterruption === armed || claimedInterruption === armed) clearGoalPlanAcceptanceInterruptionArm(); } },
  );
  return hook;
}

export function clearGoalPlanAcceptanceInterruptionArm(): void { armedInterruption = null; claimedInterruption = null; }

function runArmedInterruption(armed: ArmedInterruption, nonce: string, context: GoalPlanAcceptanceInterruptionContext, isConsumed: () => boolean, consume: () => void): never {
  const active = readActiveMutationJournal();
  const journal = context.journal;
  const pair = journal.writes[0];
  const exactJournal = active !== null && canonicalSerialize(active) === canonicalSerialize(journal) && journal.status === "journal_durable" &&
    journal.operation === "accept_goal_plan" && journal.proposalId === armed.command.proposalId && journal.trackId === armed.command.trackId &&
    pair?.kind === "accept_goal_plan" && pair.record.cause === "proposal_acceptance" && pair.record.proposalId === armed.command.proposalId &&
    pair.record.trackId === armed.command.trackId && pair.record.profileId === armed.profileId && pair.record.beforeGoal === null && pair.record.beforePlan === null &&
    pair.record.expectedGoalRevision === null && pair.record.expectedPlanStorageRevision === null && canonicalSerialize(context.record) === canonicalSerialize(pair.record) &&
    armed.proposal.matchesAcceptance(pair.record.goal, pair.record.plan);
  const expectedGoalRevision = pair?.kind === "accept_goal_plan" ? pair.record.plan.goalRevision : null;
  const exactAfterGoal = pair?.kind === "accept_goal_plan" && context.goalEnvelope !== null && context.goalEnvelope.revision === expectedGoalRevision &&
    context.goalEnvelope.payload.trackId === armed.command.trackId && canonicalSerialize(context.goalEnvelope.payload) === canonicalSerialize(pair.record.goal);
  const stillCurrent = armedInterruption === armed && claimedInterruption === armed && armed.command.nonce === nonce && !isConsumed() && armed.actorFence.isCurrent() && armed.actorFence.isCurrentSdkUid(armed.firebaseUid) &&
    isActiveProfileStorageLeaseCurrent(armed.lease) && getActiveStorageProfileOrNull()?.id === armed.profileId &&
    getActiveStorageProfileOrNull()?.accountId === armed.accountId && readLearningPlanStorageScope() === armed.storageScope &&
    armed.proposal.isRetained() && armed.proposal.proposalId === armed.command.proposalId && armed.proposal.trackId === armed.command.trackId;
  lastInterruptionReceipt = Object.freeze({
    checkpoint: "interrupted", nonce, proposalId: armed.command.proposalId, trackId: armed.command.trackId,
    journalExact: exactJournal, goalBeforeAbsent: exactJournal && pair?.kind === "accept_goal_plan" && pair.record.beforeGoal === null,
    planBeforeAbsent: exactJournal && pair?.kind === "accept_goal_plan" && pair.record.beforePlan === null,
    goalReadbackExact: exactAfterGoal, planStillAbsent: context.planEnvelope === null, callbackConsumed: true,
    actorFenceCurrent: armed.actorFence.isCurrent() && armed.actorFence.isCurrentSdkUid(armed.firebaseUid),
    profileLeaseCurrent: isActiveProfileStorageLeaseCurrent(armed.lease),
    profileMatches: getActiveStorageProfileOrNull()?.id === armed.profileId && getActiveStorageProfileOrNull()?.accountId === armed.accountId,
    journalSha256: active ? sha256Utf8(canonicalSerialize(active)) : null,
    goalReadbackSha256: context.goalEnvelope ? sha256Utf8(canonicalSerialize(context.goalEnvelope)) : null,
    planBeforeSha256: context.planEnvelope === null ? null : sha256Utf8(canonicalSerialize(context.planEnvelope)),
  });
  consume();
  clearGoalPlanAcceptanceInterruptionArm();
  if (!exactJournal || !exactAfterGoal || context.planEnvelope !== null || !stillCurrent) {
    throw new Error("Development goal-plan interruption preconditions no longer match.");
  }
  throw new DevelopmentGoalPlanAcceptanceInterruptionError();
}

export class DevelopmentGoalPlanAcceptanceInterruptionError extends Error {
  constructor() { super("Development goal-plan acceptance interruption injected after the goal write."); this.name = "DevelopmentGoalPlanAcceptanceInterruptionError"; }
}

export function isGoalPlanAcceptanceInterruptionError(error: unknown): error is DevelopmentGoalPlanAcceptanceInterruptionError {
  return error instanceof DevelopmentGoalPlanAcceptanceInterruptionError;
}
