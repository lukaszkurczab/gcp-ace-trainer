import type { GoalRecord, LearningPlan, TrackId } from "../../domain";
import { isLearningPlanV1ForTrack } from "../../domain";
import { isGoalRecordShapeForTrack } from "../../domain/goals/goalContracts";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJsonUnlocked, withCanonicalWriteLocks, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { assertGoalPlanPairReadable, type GoalPlanAcceptanceRecord, type MutationJournalRecord } from "./mutationJournalRepository";
import { getActiveStorageProfileOrNull } from "../../infrastructure/storage/mmkvClient";

export class GoalPlanAcceptanceConflictError extends Error {
  constructor() { super("Goal-plan acceptance recovery found a value outside its journaled before/after pair."); this.name = "GoalPlanAcceptanceConflictError"; }
}
export type GoalPlanAcceptanceInterruptionContext = Readonly<{
  journal: MutationJournalRecord;
  record: GoalPlanAcceptanceRecord;
  goalEnvelope: CanonicalRecordEnvelope<GoalRecord> | null;
  planEnvelope: CanonicalRecordEnvelope<LearningPlan> | null;
}>;
export type GoalPlanAcceptanceInterruptionHook = ((context: GoalPlanAcceptanceInterruptionContext) => void) & Readonly<{ dispose?: () => void }>;
let testProfileId: string | null = null;
export function setGoalPlanAcceptanceProfileForTests(profileId: string | null): void { testProfileId = profileId; }

/** One rule owns the unchanged-goal revision used by acceptance, replay and verification. */
export function goalPlanAcceptanceGoalRevision(
  expectedGoalRevision: number | null,
  beforeGoal: CanonicalRecordEnvelope<GoalRecord> | null,
  goal: GoalRecord,
): number {
  const unchangedGoal = beforeGoal !== null && JSON.stringify(beforeGoal.payload) === JSON.stringify(goal);
  return (expectedGoalRevision ?? 0) + (unchangedGoal ? 0 : 1);
}

/** Reads the exact current pair while excluding pair materialization and pending journals. */
export function readGoalPlanAcceptancePrecondition(trackId: TrackId): Readonly<{
  goal: CanonicalRecordEnvelope<GoalRecord> | null;
  plan: CanonicalRecordEnvelope<LearningPlan> | null;
}> {
  const goalKey = STORAGE_KEYS.goal(trackId);
  const planKey = STORAGE_KEYS.learningPlan(trackId);
  return withCanonicalWriteLocks([goalKey, planKey], () => {
    assertGoalPlanPairReadable();
    const goal = readCanonicalEnvelope(goalKey, (value): value is GoalRecord => isGoalRecordShapeForTrack(value, trackId));
    const plan = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, trackId));
    return Object.freeze({ goal, plan });
  });
}

function expectedGoalEnvelope(record: GoalPlanAcceptanceRecord): CanonicalRecordEnvelope<GoalRecord> {
  return Object.freeze({
    schemaIdentity: "patternly:canonical:v1",
    revision: goalPlanAcceptanceGoalRevision(record.expectedGoalRevision, record.beforeGoal, record.goal),
    payload: record.goal,
  });
}

/** Roll-forward-only materialization for the immutable acceptance journal. */
export function materializeGoalPlanAcceptance(record: GoalPlanAcceptanceRecord, journal: MutationJournalRecord, beforePlanWrite?: GoalPlanAcceptanceInterruptionHook): void {
  const goalKey = STORAGE_KEYS.goal(record.trackId);
  const planKey = STORAGE_KEYS.learningPlan(record.trackId);
  withCanonicalWriteLocks([goalKey, planKey], () => {
    assertProfileIdentity(record.profileId);
    const goalGuard = (value: unknown): value is GoalRecord => isGoalRecordShapeForTrack(value, record.trackId);
    const planGuard = (value: unknown): value is LearningPlan => isLearningPlanV1ForTrack(value, record.trackId);
    let currentGoal = readCanonicalEnvelope(goalKey, goalGuard);
    let currentPlan = readCanonicalEnvelope(planKey, planGuard);
    const nextGoal = expectedGoalEnvelope(record);
    const nextPlan = nextEnvelope(record.expectedPlanStorageRevision, record.plan);
    if (!isBeforeOrAfter(currentGoal, record.beforeGoal, nextGoal, goalGuard) || !isBeforeOrAfter(currentPlan, record.beforePlan, nextPlan, planGuard)) throw new GoalPlanAcceptanceConflictError();
    if (!isExactEnvelope(currentGoal, nextGoal)) {
      try { currentGoal = writeCanonicalJsonUnlocked(goalKey, record.goal, record.expectedGoalRevision); }
      catch (error) { if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) throw new GoalPlanAcceptanceConflictError(); throw error; }
    }
    if (beforePlanWrite) {
      currentGoal = readCanonicalEnvelope(goalKey, goalGuard);
      currentPlan = readCanonicalEnvelope(planKey, planGuard);
      if (!isExactEnvelope(currentGoal, nextGoal) || currentPlan !== null) throw new GoalPlanAcceptanceConflictError();
      beforePlanWrite(Object.freeze({ journal, record, goalEnvelope: currentGoal, planEnvelope: currentPlan }));
    }
    if (!isExactEnvelope(currentPlan, nextPlan)) {
      try { currentPlan = writeCanonicalJsonUnlocked(planKey, record.plan, record.expectedPlanStorageRevision); }
      catch (error) { if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) throw new GoalPlanAcceptanceConflictError(); throw error; }
    }
    if (!isGoalPlanAcceptanceMaterialized(record)) throw new GoalPlanAcceptanceConflictError();
  });
}

export function isGoalPlanAcceptanceMaterialized(record: GoalPlanAcceptanceRecord): boolean {
  assertProfileIdentity(record.profileId);
  const goal = readCanonicalEnvelope(STORAGE_KEYS.goal(record.trackId), (value): value is GoalRecord => isGoalRecordShapeForTrack(value, record.trackId));
  const plan = readCanonicalEnvelope(STORAGE_KEYS.learningPlan(record.trackId), (value): value is LearningPlan => isLearningPlanV1ForTrack(value, record.trackId));
  const expectedGoal = expectedGoalEnvelope(record);
  const expectedPlan = nextEnvelope(record.expectedPlanStorageRevision, record.plan);
  return isExactEnvelope(goal, expectedGoal) && isExactEnvelope(plan, expectedPlan) && record.plan.goalRevision === expectedGoal.revision;
}

function assertProfileIdentity(profileId: string): void {
  // The ACTIVE_JOURNAL key is profile-scoped. This runtime guard catches a
  // profile transition between intent persistence and materialization.
  if ((getActiveStorageProfileOrNull()?.id ?? testProfileId) !== profileId) throw new GoalPlanAcceptanceConflictError();
}

function nextEnvelope<T>(expectedRevision: number | null, payload: T): CanonicalRecordEnvelope<T> {
  return Object.freeze({ schemaIdentity: "patternly:canonical:v1", revision: (expectedRevision ?? 0) + 1, payload });
}

function isExactEnvelope<T>(actual: CanonicalRecordEnvelope<T> | null, expected: CanonicalRecordEnvelope<T>): boolean {
  return actual !== null && actual.revision === expected.revision && JSON.stringify(actual.payload) === JSON.stringify(expected.payload);
}

function isBeforeOrAfter<T>(actual: CanonicalRecordEnvelope<T> | null, before: CanonicalRecordEnvelope<T> | null, after: CanonicalRecordEnvelope<T>, guard: (value: unknown) => value is T): boolean {
  if (isExactEnvelope(actual, after)) return true;
  if (before === null) return actual === null;
  return actual !== null && actual.revision === before.revision && guard(before.payload) && JSON.stringify(actual.payload) === JSON.stringify(before.payload);
}
