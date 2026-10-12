import { captureMutationJournalLease, clearMutationJournal, isMutationJournalLeaseCurrent, persistMutationJournal, updateMutationJournalPhase } from "../../storage/repositories/mutationJournalRepository";
import { assertValidMutationJournal, type MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
import { MutationCommitFailure } from "../mutationBoundary";
import { CanonicalWriteOutcomeError, JournalWriteError, StorageReadError } from "../../storage/errors";
import { getAccountSyncState, markAccountDataPending } from "../../storage/repositories/accountDataRepository";
import { withLocalLearningWriteOperation } from "./localLearningWriteOperation";
import type { GoalPlanAcceptanceInterruptionHook } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { pausePersist13ResetAfterMaterialization } from "../runtimeAuditability/persist13ResetPauseHook";
import { recoverPendingMutation } from "./recoverPendingMutation";
import type { ActiveProfileStorageLease } from "../../storage/repositories/mutationJournalRepository";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";

export async function commitMutation(record: MutationJournalRecord, expectedLease: ActiveProfileStorageLease | null = captureMutationJournalLease()): Promise<void> {
  return withLocalLearningWriteOperation(() => {
    if (!isRetryLeaseCurrent(expectedLease)) throw new MutationCommitFailure("journal_write", "not_durable", new Error("The original profile lease changed before the exact command retry."));
    return commitMutationUnlocked(record, undefined, expectedLease);
  });
}

/** Build an existing journal only after a guarded read inside the canonical learning-write lane. */
export async function commitMutationAfterPreflight(build: () => Promise<MutationJournalRecord | null>, revalidate?: () => void | Promise<void>, beforeGoalPlanWrite?: GoalPlanAcceptanceInterruptionHook, expectedLease: ActiveProfileStorageLease | null = captureMutationJournalLease()): Promise<void> {
  return withLocalLearningWriteOperation(async () => {
    const record = await build();
    if (!record) return;
    if (!isRetryLeaseCurrent(expectedLease)) throw new MutationCommitFailure("journal_write", "not_durable", new Error("The original profile lease changed before the exact command retry."));
    await revalidate?.();
    if (!isRetryLeaseCurrent(expectedLease)) throw new MutationCommitFailure("journal_write", "not_durable", new Error("The original profile lease changed during exact command preflight."));
    await commitMutationUnlocked(record, beforeGoalPlanWrite, expectedLease);
  });
}

export type ExactMutationRetrySeed = Readonly<{ record: MutationJournalRecord; lease: ActiveProfileStorageLease | null; preflight?: () => Promise<void> }>;

/** Adds the original eligibility preflight to an already-frozen exact retry seed. */
export function retainMutationRetryPreflight(error: unknown, preflight: (() => Promise<void>) | undefined): unknown {
  if (!preflight || !(error instanceof MutationCommitFailure) || error.retrySeed === undefined) return error;
  const seed = retrySeedFromUnknown(error.retrySeed);
  if (!seed) return error;
  return new MutationCommitFailure(error.phase, error.durableState, error.cause, error.commandProof, Object.freeze({ ...seed, preflight }));
}

async function commitMutationUnlocked(record: MutationJournalRecord, beforeGoalPlanWrite?: GoalPlanAcceptanceInterruptionHook, lease = captureMutationJournalLease()): Promise<void> {
  const accountState = await getAccountSyncState(productionLearningDataAdmissionContext);
  if (accountState.materialization || accountState.pendingConfirmation) throw new MutationCommitFailure("journal_write", "not_durable", new Error("Account data transition is in progress."));
  let prepared: MutationJournalRecord;
  try { prepared = await persistMutationJournal(record, productionLearningDataAdmissionContext, lease); }
  catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const outcome = cause instanceof CanonicalWriteOutcomeError ? cause.outcome.kind : null;
    const attemptedWrite = cause instanceof CanonicalWriteOutcomeError && cause.attempt !== undefined;
    const retryablePrewriteRead = isPrewriteStorageReadFailure(error);
    const unresolvedAttempt = attemptedWrite && (outcome === "unknown" || outcome === "conflict");
    throw new MutationCommitFailure("journal_write", unresolvedAttempt ? "unknown" : "not_durable", error,
      unresolvedAttempt || retryablePrewriteRead ? Object.freeze({
        commandFingerprint: record.commandIdentity.fingerprint,
        planFingerprint: record.planFingerprint,
        attempt: cause instanceof CanonicalWriteOutcomeError ? cause.attempt : undefined,
      }) : undefined,
      retryablePrewriteRead ? Object.freeze({ record: immutableRetryRecord(record), lease }) : undefined);
  }
  if (prepared.status !== "journal_durable") {
    try { await recoverPendingMutation(); }
    catch (error) {
      const phase = error instanceof MutationCommitFailure ? error.phase : "materialization";
      const durableState = error instanceof MutationCommitFailure ? error.durableState : prepared.status === "materialized" ? "materialized" : "verified_pending_clear";
      throw new MutationCommitFailure(phase, durableState, error);
    }
    return;
  }
  try {
    await materializeMutation(prepared, beforeGoalPlanWrite);
    await pausePersist13ResetAfterMaterialization(prepared.operation);
    await updateMutationJournalPhase(prepared, "materialized", productionLearningDataAdmissionContext);
  }
  catch (error) { throw new MutationCommitFailure("materialization", "journal_durable", error); }
  try { await verifyMutation(prepared); await updateMutationJournalPhase(prepared, "verified_pending_clear", productionLearningDataAdmissionContext); }
  catch (error) { throw new MutationCommitFailure("verification", "materialized", error); }
  try {
    await verifyMutation(prepared);
    if (prepared.operation !== "resolve_account_sync_conflict" && prepared.operation !== "reset_learning_state") await markAccountDataPending(productionLearningDataAdmissionContext);
    await verifyMutation(prepared);
    await clearMutationJournal(productionLearningDataAdmissionContext, prepared.commandIdentity.fingerprint);
  }
  catch (error) { throw new MutationCommitFailure("journal_clear", "verified_pending_clear", error); }
}

function isPrewriteStorageReadFailure(error: unknown): boolean {
  if (!(error instanceof JournalWriteError)) return false;
  if (error.cause instanceof StorageReadError) return true;
  return error.cause instanceof CanonicalWriteOutcomeError && error.cause.outcome.kind === "provenNotApplied" &&
    error.cause.attempt === undefined && error.cause.outcome.cause instanceof StorageReadError;
}

function immutableRetryRecord(record: MutationJournalRecord): MutationJournalRecord {
  const clone = JSON.parse(JSON.stringify(record)) as MutationJournalRecord;
  assertValidMutationJournal(clone, productionLearningDataAdmissionContext);
  const freeze = (value: unknown): void => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  };
  freeze(clone);
  return clone;
}

function isRetryLeaseCurrent(lease: ActiveProfileStorageLease | null): boolean {
  return isMutationJournalLeaseCurrent(lease);
}

function retrySeedFromUnknown(value: unknown): ExactMutationRetrySeed | null {
  if (typeof value !== "object" || value === null || !("record" in value) || !("lease" in value)) return null;
  const seed = value as { record?: unknown; lease?: unknown; preflight?: unknown };
  if (typeof seed.record !== "object" || seed.record === null) return null;
  if (seed.lease !== null && typeof seed.lease !== "object") return null;
  if (seed.preflight !== undefined && typeof seed.preflight !== "function") return null;
  return seed as ExactMutationRetrySeed;
}
