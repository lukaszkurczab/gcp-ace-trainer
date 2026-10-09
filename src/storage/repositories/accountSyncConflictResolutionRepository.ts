import type { GoalRecord, LearningPlan } from "../../domain";
import { isLearningPlanV1ForTrack } from "../../domain";
import { isGoalRecordShapeForTrack } from "../../domain/goals/goalContracts";
import { getActiveStorageProfileOrNull } from "../../infrastructure/storage/mmkvClient";
import type { AccountSyncConflictResolutionRecord, MutationJournalRecord } from "./mutationJournalRepository";
import type { AccountSyncState } from "./accountDataRepository";
import { isCanonicalAccountSyncState } from "./accountDataRepository";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, removeCanonicalValue, restoreCanonicalEnvelopeUnlocked, withCanonicalWriteLocks, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";

export class AccountSyncConflictResolutionConflictError extends Error {
  constructor() { super("Account-sync conflict recovery found a value outside its journaled before/after state."); this.name = "AccountSyncConflictResolutionConflictError"; }
}

/** Roll-forward-only exact pair + sync-state materializer for the typed resolver journal. */
export function materializeAccountSyncConflictResolution(record: AccountSyncConflictResolutionRecord, _journal: MutationJournalRecord): void {
  const goalKey = STORAGE_KEYS.goal(record.trackId);
  const planKey = STORAGE_KEYS.learningPlan(record.trackId);
  const syncKey = STORAGE_KEYS.ACCOUNT_SYNC;
  withCanonicalWriteLocks([goalKey, planKey, syncKey], () => {
    assertProfileIdentity(record.profileId);
    const goalGuard = (value: unknown): value is GoalRecord => isGoalRecordShapeForTrack(value, record.trackId);
    const planGuard = (value: unknown): value is LearningPlan => isLearningPlanV1ForTrack(value, record.trackId);
    let goal = readCanonicalEnvelope(goalKey, goalGuard);
    let plan = readCanonicalEnvelope(planKey, planGuard);
    let sync = readCanonicalEnvelope(syncKey, isAccountSyncState);
    const afterGoal = record.afterGoal === null || record.afterGoalRevision === null ? null : envelope(record.afterGoalRevision, record.afterGoal);
    const afterPlan = record.afterPlan === null || record.afterPlanStorageRevision === null ? null : envelope(record.afterPlanStorageRevision, record.afterPlan);
    const afterSync = nextEnvelope(record.expectedSyncStateRevision, record.afterSyncState, record.beforeSyncState);
    if (!beforeOrAfter(goal, record.beforeGoal, afterGoal) || !beforeOrAfter(plan, record.beforePlan, afterPlan) || !beforeOrAfter(sync, record.beforeSyncState, afterSync)) throw new AccountSyncConflictResolutionConflictError();
    if (!exact(goal, afterGoal)) {
      try { if (afterGoal) goal = restoreCanonicalEnvelopeUnlocked(goalKey, afterGoal); else removeCanonicalValue(goalKey); }
      catch (error) { if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) throw new AccountSyncConflictResolutionConflictError(); throw error; }
    }
    if (!exact(plan, afterPlan)) {
      try { if (afterPlan) plan = restoreCanonicalEnvelopeUnlocked(planKey, afterPlan); else removeCanonicalValue(planKey); }
      catch (error) { if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) throw new AccountSyncConflictResolutionConflictError(); throw error; }
    }
    if (!exact(sync, afterSync)) {
      try { sync = restoreCanonicalEnvelopeUnlocked(syncKey, afterSync); }
      catch (error) { if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) throw new AccountSyncConflictResolutionConflictError(); throw error; }
    }
    if (!isAccountSyncConflictResolutionMaterialized(record)) throw new AccountSyncConflictResolutionConflictError();
  });
}

export function isAccountSyncConflictResolutionMaterialized(record: AccountSyncConflictResolutionRecord): boolean {
  assertProfileIdentity(record.profileId);
  const goal = readCanonicalEnvelope(STORAGE_KEYS.goal(record.trackId), (value): value is GoalRecord => isGoalRecordShapeForTrack(value, record.trackId));
  const plan = readCanonicalEnvelope(STORAGE_KEYS.learningPlan(record.trackId), (value): value is LearningPlan => isLearningPlanV1ForTrack(value, record.trackId));
  const sync = readCanonicalEnvelope(STORAGE_KEYS.ACCOUNT_SYNC, isAccountSyncState);
  const afterGoal = record.afterGoal === null || record.afterGoalRevision === null ? null : envelope(record.afterGoalRevision, record.afterGoal);
  const afterPlan = record.afterPlan === null || record.afterPlanStorageRevision === null ? null : envelope(record.afterPlanStorageRevision, record.afterPlan);
  return exact(goal, afterGoal)
    && exact(plan, afterPlan)
    && exact(sync, nextEnvelope(record.expectedSyncStateRevision, record.afterSyncState, record.beforeSyncState))
    && (record.afterPlan === null ? record.afterGoal === null : record.afterPlan.goalRevision === (goal?.revision ?? -1));
}

function assertProfileIdentity(profileId: string): void {
  if (getActiveStorageProfileOrNull()?.id !== profileId) throw new AccountSyncConflictResolutionConflictError();
}
function isAccountSyncState(value: unknown): value is AccountSyncState { return isCanonicalAccountSyncState(value); }
function envelope<T>(revision: number, payload: T): CanonicalRecordEnvelope<T> {
  return Object.freeze({ schemaIdentity: "patternly:canonical:v1", revision, payload });
}
function nextEnvelope<T>(expectedRevision: number | null, payload: T, before: CanonicalRecordEnvelope<T> | null): CanonicalRecordEnvelope<T> {
  const unchanged = before !== null && JSON.stringify(before.payload) === JSON.stringify(payload);
  return envelope((expectedRevision ?? 0) + (unchanged ? 0 : 1), payload);
}
function exact<T>(actual: CanonicalRecordEnvelope<T> | null, expected: CanonicalRecordEnvelope<T> | null): boolean {
  if (expected === null) return actual === null;
  if (actual === null) return false;
  return actual !== null && actual.revision === expected.revision && JSON.stringify(actual.payload) === JSON.stringify(expected.payload);
}
function beforeOrAfter<T>(actual: CanonicalRecordEnvelope<T> | null, before: CanonicalRecordEnvelope<T> | null, after: CanonicalRecordEnvelope<T> | null): boolean {
  if (exact(actual, after)) return true;
  if (before === null) return actual === null;
  return actual !== null && actual.revision === before.revision && JSON.stringify(actual.payload) === JSON.stringify(before.payload);
}
