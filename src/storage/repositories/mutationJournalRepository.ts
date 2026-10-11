import type { AcceptedSimulationFinalization, ForegroundTimerState, GoalRecord, LearningPlan, ReviewQueueEntry, TrainingAttempt, TrainingSession, TrainingSessionDraft, TrainingSessionDraftState, TrainingSessionResult } from "../../domain";
import { acceptedTargetFromGoal, getTrackRegistration, getTrainingSessionFinalizationCleanupKind, initialForegroundTimerForSession, isArtifactSha256, isLearningPlanV1ForTrack, isRegisteredTrackId, normalizeLearningPlan } from "../../domain";
import { isGoalRecordShapeForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { resolvedContentRefKey, resolvedContentRefsEqual } from "../../domain/learning/resolvedContentRef";
import { canonicalFingerprintPayload, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../keys";
import { canonicalPhysicalWriteRelation, captureCanonicalPhysicalWrite, isCanonicalWriteAttemptCurrent, readCanonicalEnvelope, readCanonicalJson, reconcileCanonicalWriteAttempt, removeCanonicalValue, writeCanonicalJson, writeCanonicalJsonWithOutcome, type CanonicalPhysicalAfter, type CanonicalPhysicalState, type CanonicalPhysicalWrite, type CanonicalRecordEnvelope, type CanonicalWriteAttempt } from "./canonicalRecordCodec";
import { CanonicalWriteOutcomeError, JournalWriteError } from "../errors";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { isAcceptedSimulationFinalization, isReviewQueueEntry, isTrainingAttempt, isTrainingSession, isTrainingSessionDraft, isTrainingSessionDraftState, isTrainingSessionResult } from "./trainingModelGuards";
import { isForegroundTimerState } from "./trainingModelGuards";
import { getReviewQueueItems } from "./reviewQueueRepository";
import { getActiveTrainingSession } from "./trainingSessionRepository";
import { isCanonicalAccountSyncState, type AccountSyncState } from "./accountDataRepository";
import { assertTrainingEvidenceIntegrity } from "./trainingEvidenceIntegrityRepository";
import { assertContentIdentityRecordIntegrity } from "./contentIdentityUnavailableRepository";
import { assertLearningStateResetPlanBeforeJournal, isLearningStateResetTargetPlan, type LearningStateResetTargetPlan } from "./learningStateResetRepository";

export type { ActiveProfileStorageLease };

export type JournalWrite =
  | { kind: "accept_goal_plan"; record: GoalPlanAcceptanceRecord }
  | { kind: "resolve_account_sync_conflict"; record: AccountSyncConflictResolutionRecord }
  | { kind: "put_session"; record: TrainingSession }
  | { kind: "put_active_foreground_timer"; record: ForegroundTimerState }
  | { kind: "put_session_result"; record: TrainingSessionResult }
  | { kind: "put_attempt"; record: TrainingAttempt<unknown> }
  | { kind: "put_review_entry"; record: ReviewQueueEntry }
  | { kind: "put_review_entry_for_attempt"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "update_review_entry"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "delete_review_entry"; record: ReviewQueueEntry }
  | { kind: "delete_review_entry_for_attempt"; record: ReviewQueueEntry; transitionId: string }
  | { kind: "clear_active_session"; sessionId: string }
  | { kind: "clear_active_session_draft"; sessionId: string }
  | { kind: "put_active_session_draft"; record: TrainingSessionDraft }
  | { kind: "delete_active_session_draft"; record: TrainingSessionDraftState; submittedOccurrenceIds: readonly string[] }
  | { kind: "clear_learning_state"; targetPlan: LearningStateResetTargetPlan };

export type TrainingMutationOperation = "start_training_session" | "advance_training_session" | "submit_training_outcome" | "complete_training_session" | "abandon_training_session" | "finalize_training_session" | "set_review_entry" | "remove_review_entry" | "reset_learning_state";
export type MutationOperation = TrainingMutationOperation | "accept_goal_plan" | "resolve_account_sync_conflict";
export type MutationCommandIdentity = Readonly<{ version: 1; fingerprint: string }>;
export type MutationExpectedRevision = Readonly<{ target: string; revision: number | null }>;
export class StaleMutationRevisionError extends Error {
  constructor(readonly target: string) { super("Mutation journal expected revisions are stale."); this.name = "StaleMutationRevisionError"; }
}
export type GoalPlanAcceptanceRecord = Readonly<{
  cause?: "proposal_acceptance" | "pause" | "resume";
  proposalId: string;
  profileId: string;
  trackId: string;
  expectedGoalRevision: number | null;
  expectedPlanStorageRevision: number | null;
  beforeGoal: CanonicalRecordEnvelope<GoalRecord> | null;
  beforePlan: CanonicalRecordEnvelope<LearningPlan> | null;
  goal: GoalRecord;
  plan: LearningPlan;
}>;
export type AccountSyncConflictResolutionRecord = Readonly<{
  conflictId: string;
  accountId: string;
  profileId: string;
  trackId: string;
  resolution: "keep_local" | "keep_account";
  expectedGoalRevision: number | null;
  expectedPlanStorageRevision: number | null;
  expectedSyncStateRevision: number | null;
  afterGoalRevision: number | null;
  afterPlanStorageRevision: number | null;
  beforeGoal: CanonicalRecordEnvelope<GoalRecord> | null;
  beforePlan: CanonicalRecordEnvelope<LearningPlan> | null;
  beforeSyncState: CanonicalRecordEnvelope<AccountSyncState> | null;
  afterGoal: GoalRecord | null;
  afterPlan: LearningPlan | null;
  afterSyncState: AccountSyncState;
}>;
type MutationJournalPlanFields = Readonly<{
  status: "journal_durable" | "materialized" | "verified_pending_clear";
  createdAt: string;
  trackId: string;
  artifactSha256: string | null;
  commandIdentity: MutationCommandIdentity;
  expectedRevisions: readonly MutationExpectedRevision[];
  physicalWrites: readonly CanonicalPhysicalWrite[];
  writes: readonly JournalWrite[];
}>;
export type TrainingMutationJournalPlan = MutationJournalPlanFields & Readonly<{ operation: TrainingMutationOperation; sessionId: string }>;
export type GoalPlanAcceptanceJournalPlan = MutationJournalPlanFields & Readonly<{ operation: "accept_goal_plan"; proposalId: string }>;
export type AccountSyncConflictResolutionJournalPlan = MutationJournalPlanFields & Readonly<{ operation: "resolve_account_sync_conflict"; conflictId: string }>;
export type MutationJournalPlan = TrainingMutationJournalPlan | GoalPlanAcceptanceJournalPlan | AccountSyncConflictResolutionJournalPlan;
export type MutationJournalRecord = MutationJournalPlan & Readonly<{ journalId: string; planFingerprint: string }>;
export type TrainingMutationJournalRecord = TrainingMutationJournalPlan & Readonly<{ journalId: string; planFingerprint: string }>;

const TRAINING_OPERATIONS: readonly TrainingMutationOperation[] = ["start_training_session", "advance_training_session", "submit_training_outcome", "complete_training_session", "abandon_training_session", "finalize_training_session", "set_review_entry", "remove_review_entry", "reset_learning_state"];
const SHA_256 = /^[a-f0-9]{64}$/;
const PLAN_FINGERPRINT = /^[a-f0-9]{64}$/;
const RESET_STATIC_TARGETS = ["active_session", "active_session_draft", "active_foreground_timer", "session_index", "attempt_index", "review_index"] as const;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, required: readonly string[]): boolean { const keys = Object.keys(value); return keys.length === required.length && required.every((key) => keys.includes(key)); }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isTimestamp(value: unknown): value is string { return isNonEmptyString(value) && !Number.isNaN(Date.parse(value)); }
function isExpectedRevision(value: unknown): value is MutationExpectedRevision {
  return isRecord(value) && hasExactKeys(value, ["target", "revision"]) && isNonEmptyString(value.target) &&
    (value.revision === null || (Number.isSafeInteger(value.revision) && Number(value.revision) >= 1));
}
function isJournalWrite(value: unknown): value is JournalWrite {
  if (!isRecord(value) || !isNonEmptyString(value.kind)) return false;
  switch (value.kind) {
    case "accept_goal_plan": return hasExactKeys(value, ["kind", "record"]) && isGoalPlanAcceptanceRecord(value.record);
    case "resolve_account_sync_conflict": return hasExactKeys(value, ["kind", "record"]) && isAccountSyncConflictResolutionRecord(value.record);
    case "put_session": return hasExactKeys(value, ["kind", "record"]) && isTrainingSession(value.record);
    case "put_active_foreground_timer": return hasExactKeys(value, ["kind", "record"]) && isForegroundTimerState(value.record);
    case "put_session_result": return hasExactKeys(value, ["kind", "record"]) && isTrainingSessionResult(value.record);
    case "put_attempt": return hasExactKeys(value, ["kind", "record"]) && isTrainingAttempt(value.record);
    case "put_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "put_review_entry_for_attempt": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "update_review_entry": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "delete_review_entry": return hasExactKeys(value, ["kind", "record"]) && isReviewQueueEntry(value.record);
    case "delete_review_entry_for_attempt": return hasExactKeys(value, ["kind", "record", "transitionId"]) && isReviewQueueEntry(value.record) && isNonEmptyString(value.transitionId);
    case "clear_active_session":
    case "clear_active_session_draft": return hasExactKeys(value, ["kind", "sessionId"]) && isNonEmptyString(value.sessionId);
    case "clear_learning_state": return hasExactKeys(value, ["kind", "targetPlan"]) && isLearningStateResetTargetPlan(value.targetPlan);
    case "put_active_session_draft": return hasExactKeys(value, ["kind", "record"]) && isTrainingSessionDraft(value.record);
    case "delete_active_session_draft": return hasExactKeys(value, ["kind", "record", "submittedOccurrenceIds"]) && isTrainingSessionDraftState(value.record) && Array.isArray(value.submittedOccurrenceIds) && value.submittedOccurrenceIds.every(isNonEmptyString) && new Set(value.submittedOccurrenceIds).size === value.submittedOccurrenceIds.length;
    default: return false;
  }
}

function isStoredEnvelope<T>(value: unknown, guard: (candidate: unknown) => candidate is T): value is CanonicalRecordEnvelope<T> {
  return isRecord(value) && hasExactKeys(value, ["schemaIdentity", "revision", "payload"]) && value.schemaIdentity === "patternly:canonical:v1" &&
    Number.isSafeInteger(value.revision) && Number(value.revision) > 0 && guard(value.payload);
}

function isGoalPlanAcceptanceRecord(value: unknown): value is GoalPlanAcceptanceRecord {
  const legacyKeys = ["proposalId", "profileId", "trackId", "expectedGoalRevision", "expectedPlanStorageRevision", "beforeGoal", "beforePlan", "goal", "plan"];
  const pairKeys = [...legacyKeys, "cause"];
  if (!isRecord(value) || !(hasExactKeys(value, legacyKeys) || hasExactKeys(value, pairKeys)) ||
    (Object.hasOwn(value, "cause") && value.cause !== "proposal_acceptance" && value.cause !== "pause" && value.cause !== "resume") ||
    !isNonEmptyString(value.proposalId) || !isNonEmptyString(value.profileId) || typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) ||
    !(value.expectedGoalRevision === null || (Number.isSafeInteger(value.expectedGoalRevision) && Number(value.expectedGoalRevision) > 0)) ||
    !(value.expectedPlanStorageRevision === null || (Number.isSafeInteger(value.expectedPlanStorageRevision) && Number(value.expectedPlanStorageRevision) > 0))) return false;
  const trackId = value.trackId;
  const goalGuard = (candidate: unknown): candidate is GoalRecord => isGoalRecordShapeForTrack(candidate, trackId);
  const planGuard = (candidate: unknown): candidate is LearningPlan => isLearningPlanV1ForTrack(candidate, trackId);
  const beforeGoalValid = value.beforeGoal === null || isStoredEnvelope(value.beforeGoal, goalGuard);
  const beforePlan = value.beforePlan === null || isStoredEnvelope(value.beforePlan, planGuard);
  if (!beforeGoalValid || !beforePlan || !goalGuard(value.goal) || !planGuard(value.plan)) return false;
  if ((value.beforeGoal === null ? null : (value.beforeGoal as CanonicalRecordEnvelope<GoalRecord>).revision) !== value.expectedGoalRevision ||
      (value.beforePlan === null ? null : (value.beforePlan as CanonicalRecordEnvelope<LearningPlan>).revision) !== value.expectedPlanStorageRevision) return false;
  const beforeGoalEnvelope = value.beforeGoal as CanonicalRecordEnvelope<GoalRecord> | null;
  const unchangedGoal = beforeGoalEnvelope !== null && JSON.stringify(normalizeGoalRecord(beforeGoalEnvelope.payload)) === JSON.stringify(normalizeGoalRecord(value.goal as GoalRecord));
  const nextGoalRevision = (value.expectedGoalRevision as number | null ?? 0) + (unchangedGoal ? 0 : 1);
  const nextPlanRevision = (value.expectedPlanStorageRevision as number | null ?? 0) + 1;
  try {
    const goal = normalizeGoalRecord(value.goal as GoalRecord);
    const plan = normalizeLearningPlan(value.plan);
    const cause = value.cause ?? "proposal_acceptance";
    const expectedGoalStatus = cause === "pause" ? "paused" : "active";
    const expectedPlanStatus = cause === "pause" ? "paused" : "accepted";
    const beforeGoal = beforeGoalEnvelope?.payload;
    const beforePlanEnvelope = value.beforePlan as CanonicalRecordEnvelope<LearningPlan> | null;
    const beforePlanRecord = beforePlanEnvelope?.payload;
    const lifecycleSourceStatus = cause === "pause" ? "active" : "paused";
    const lifecyclePlanSourceStatus = cause === "pause" ? "accepted" : "paused";
    const lifecycleValid = cause === "proposal_acceptance" || Boolean(beforeGoal && beforePlanRecord && beforeGoal.status === lifecycleSourceStatus && beforePlanRecord.status === lifecyclePlanSourceStatus &&
      JSON.stringify({ ...beforeGoal, status: goal.status }) === JSON.stringify(goal) &&
      JSON.stringify({ ...beforePlanRecord, goalRevision: plan.goalRevision, planRevision: plan.planRevision, status: plan.status, updatedAt: plan.updatedAt, commandId: plan.commandId }) === JSON.stringify(plan));
    return JSON.stringify(goal) === JSON.stringify(value.goal) && JSON.stringify(plan) === JSON.stringify(value.plan) &&
      plan.goalRevision === nextGoalRevision && plan.planRevision === nextPlanRevision && plan.status === expectedPlanStatus && goal.status === expectedGoalStatus && lifecycleValid &&
      JSON.stringify(plan.acceptedTarget) === JSON.stringify(acceptedTargetFromGoal(goal));
  } catch { return false; }
}

function isAccountSyncConflictResolutionRecord(value: unknown): value is AccountSyncConflictResolutionRecord {
  const keys = ["conflictId", "accountId", "profileId", "trackId", "resolution", "expectedGoalRevision", "expectedPlanStorageRevision", "expectedSyncStateRevision", "afterGoalRevision", "afterPlanStorageRevision", "beforeGoal", "beforePlan", "beforeSyncState", "afterGoal", "afterPlan", "afterSyncState"];
  if (!isRecord(value) || !hasExactKeys(value, keys) || !SHA_256.test(String(value.conflictId)) || !isNonEmptyString(value.accountId) || !isNonEmptyString(value.profileId)
    || typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) || (value.resolution !== "keep_local" && value.resolution !== "keep_account")
    || ![value.expectedGoalRevision, value.expectedPlanStorageRevision, value.expectedSyncStateRevision].every((revision) => revision === null || (Number.isSafeInteger(revision) && Number(revision) >= 1))
    || !(value.afterGoalRevision === null || (Number.isSafeInteger(value.afterGoalRevision) && Number(value.afterGoalRevision) >= 1))
    || !(value.afterPlanStorageRevision === null || (Number.isSafeInteger(value.afterPlanStorageRevision) && Number(value.afterPlanStorageRevision) >= 1))) return false;
  const trackId = value.trackId;
  const goalGuard = (candidate: unknown): candidate is GoalRecord => isGoalRecordShapeForTrack(candidate, trackId);
  const planGuard = (candidate: unknown): candidate is LearningPlan => isLearningPlanV1ForTrack(candidate, trackId);
  const beforeGoalValid = value.beforeGoal === null || isStoredEnvelope(value.beforeGoal, goalGuard);
  const beforePlanValid = value.beforePlan === null || isStoredEnvelope(value.beforePlan, planGuard);
  const beforeSyncValid = value.beforeSyncState === null || isStoredEnvelope(value.beforeSyncState, isAccountSyncStateGuard);
  if (!beforeGoalValid || !beforePlanValid || !beforeSyncValid || value.beforeSyncState === null || !isNonEmptyString(value.accountId)
    || (value.afterGoal !== null && !goalGuard(value.afterGoal)) || (value.afterPlan !== null && !planGuard(value.afterPlan))
    || (value.afterGoal === null) !== (value.afterPlan === null) || !isCanonicalAccountSyncState(value.afterSyncState)) return false;
  const beforeGoal = value.beforeGoal as CanonicalRecordEnvelope<GoalRecord> | null;
  const beforePlan = value.beforePlan as CanonicalRecordEnvelope<LearningPlan> | null;
  const beforeSync = value.beforeSyncState as CanonicalRecordEnvelope<AccountSyncState> | null;
  if ((beforeGoal?.revision ?? null) !== value.expectedGoalRevision || (beforePlan?.revision ?? null) !== value.expectedPlanStorageRevision || (beforeSync?.revision ?? null) !== value.expectedSyncStateRevision) return false;
  if (beforeSync?.payload.accountId !== value.accountId || beforeSync.payload.syncConflict?.conflictId !== value.conflictId) return false;
  const afterGoal = value.afterGoal === null ? null : normalizeGoalRecord(value.afterGoal as GoalRecord);
  const afterPlan = value.afterPlan === null ? null : normalizeLearningPlan(value.afterPlan as LearningPlan);
  const afterSync = value.afterSyncState as AccountSyncState;
  const pairValid = afterGoal === null && afterPlan === null
    ? value.afterGoalRevision === null && value.afterPlanStorageRevision === null
    : afterGoal !== null && afterPlan !== null && afterGoal.trackId === trackId && afterPlan.trackId === trackId
      && afterPlan.goalRevision === value.afterGoalRevision && JSON.stringify(afterPlan.acceptedTarget) === JSON.stringify(acceptedTargetFromGoal(afterGoal));
  const conflictGateValid = afterSync.syncConflict == null
    ? afterSync.blockingConflictCode === null && afterSync.status !== "conflict"
    : afterSync.syncConflict.conflictId === value.conflictId && afterSync.status === "conflict"
      && afterSync.blockingConflictCode === afterSync.syncConflict.code;
  return pairValid
    && afterSync.accountId === value.accountId && conflictGateValid
    && afterSync.materialization === null && afterSync.pendingConfirmation === null && afterSync.resetGuard === null
    && (value.resolution !== "keep_local" || (
      beforeGoal === null && beforePlan === null && afterGoal === null && afterPlan === null
        ? value.afterGoalRevision === null && value.afterPlanStorageRevision === null
        : beforeGoal !== null && beforePlan !== null && afterGoal !== null && afterPlan !== null
          && beforeGoal.revision === value.afterGoalRevision && beforePlan.revision === value.afterPlanStorageRevision
          && JSON.stringify(normalizeGoalRecord(beforeGoal.payload)) === JSON.stringify(afterGoal)
          && JSON.stringify(normalizeLearningPlan(beforePlan.payload)) === JSON.stringify(afterPlan)
    ));
}
function isAccountSyncStateGuard(value: unknown): value is AccountSyncState { return isCanonicalAccountSyncState(value); }

function writeTarget(write: JournalWrite): string {
  switch (write.kind) {
    case "accept_goal_plan": return `goal_plan:${write.record.trackId}`;
    case "resolve_account_sync_conflict": return `account_sync_conflict:${write.record.trackId}`;
    case "put_session": return `session:${write.record.id}`;
    case "put_active_foreground_timer": return "active_foreground_timer";
    case "put_session_result": return `result:${write.record.sessionId}`;
    case "put_attempt": return `attempt:${write.record.id}`;
    case "put_review_entry": return `review:${write.record.id}`;
    case "put_review_entry_for_attempt": return `review:${write.record.id}`;
    case "update_review_entry": return `review:${write.record.id}`;
    case "delete_review_entry": return `review:${write.record.id}`;
    case "delete_review_entry_for_attempt": return `review:${write.record.id}`;
    case "put_active_session_draft":
    case "delete_active_session_draft": return "active_session_draft";
    case "clear_active_session_draft": return "active_session_draft";
    case "clear_active_session": return "active_session";
    case "clear_learning_state": return "learning_state";
  }
}

function writePreconditionTargets(write: JournalWrite): string[] {
  switch (write.kind) {
    case "accept_goal_plan": return [`goal:${write.record.trackId}`, `learning_plan:${write.record.trackId}`];
    case "resolve_account_sync_conflict": return [`goal:${write.record.trackId}`, `learning_plan:${write.record.trackId}`, "account_sync"];
    case "put_session": return [`session:${write.record.id}`, "session_index", "active_session"];
    case "put_active_foreground_timer": return ["active_foreground_timer"];
    case "put_session_result": return [`result:${write.record.sessionId}`];
    case "put_attempt": return [`attempt:${write.record.id}`, "attempt_index"];
    case "put_review_entry":
    case "put_review_entry_for_attempt":
    case "update_review_entry":
    case "delete_review_entry":
    case "delete_review_entry_for_attempt": return [`review:${write.record.id}`, "review_index"];
    case "clear_active_session": return ["active_session", "active_foreground_timer"];
    case "clear_active_session_draft":
    case "put_active_session_draft":
    case "delete_active_session_draft": return ["active_session_draft"];
    case "clear_learning_state": return [...RESET_STATIC_TARGETS];
  }
}

function targetStorageKey(target: string): string {
  if (target === "active_session") return STORAGE_KEYS.ACTIVE_TRAINING_SESSION;
  if (target === "account_sync") return STORAGE_KEYS.ACCOUNT_SYNC;
  if (target === "active_session_draft") return STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
  if (target === "active_foreground_timer") return STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER;
  if (target === "session_index") return STORAGE_KEYS.TRAINING_SESSION_INDEX;
  if (target === "attempt_index") return STORAGE_KEYS.TRAINING_ATTEMPT_INDEX;
  if (target === "review_index") return STORAGE_KEYS.REVIEW_INDEX;
  if (target.startsWith("goal:")) return STORAGE_KEYS.goal(target.slice("goal:".length));
  if (target.startsWith("learning_plan:")) return STORAGE_KEYS.learningPlan(target.slice("learning_plan:".length));
  if (target.startsWith("session:")) return STORAGE_KEYS.trainingSession(target.slice("session:".length));
  if (target.startsWith("result:")) return STORAGE_KEYS.trainingSessionResult(target.slice("result:".length));
  if (target.startsWith("attempt:")) return STORAGE_KEYS.trainingAttempt(target.slice("attempt:".length));
  if (target.startsWith("review:")) return STORAGE_KEYS.reviewEntry(target.slice("review:".length));
  throw new Error(`Unknown mutation precondition target ${target}.`);
}

type PhysicalDesired = Readonly<{ kind: "write"; payload: unknown }> | Readonly<{ kind: "remove" }>;
type PhysicalSpec = Readonly<{ target: string; desired: PhysicalDesired | ((before: CanonicalPhysicalState) => PhysicalDesired); retainBeforeEnvelope?: boolean }>;
const idsGuard = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim().length > 0) && new Set(value).size === value.length;

function physicalWriteSpecs(writes: readonly JournalWrite[]): readonly PhysicalSpec[] {
  const attempts = writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt");
  const reviewPuts = writes.filter((write): write is Extract<JournalWrite, { kind: "put_review_entry" | "put_review_entry_for_attempt" | "update_review_entry" }> => write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry");
  const reviewDeletes = writes.filter((write): write is Extract<JournalWrite, { kind: "delete_review_entry" | "delete_review_entry_for_attempt" }> => write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt");
  const specs: PhysicalSpec[] = [];

  for (const write of attempts) specs.push({ target: `attempt:${write.record.id}`, desired: { kind: "write", payload: write.record } });
  if (attempts.length > 0) specs.push({ target: "attempt_index", retainBeforeEnvelope: true, desired: (before) => {
    const ids = before.kind === "present" ? readPriorIndex(before, "attempt_index") : [];
    for (const attempt of attempts) if (!ids.includes(attempt.record.id)) ids.unshift(attempt.record.id);
    return { kind: "write", payload: ids };
  } });

  for (const write of reviewPuts) specs.push({ target: `review:${write.record.id}`, desired: { kind: "write", payload: write.record } });
  if (reviewPuts.length > 0 || reviewDeletes.length > 0) specs.push({ target: "review_index", retainBeforeEnvelope: true, desired: (before) => {
    const ids = before.kind === "present" ? readPriorIndex(before, "review_index") : [];
    for (const review of reviewPuts) if (review.kind === "put_review_entry" || review.kind === "put_review_entry_for_attempt") if (!ids.includes(review.record.id)) ids.push(review.record.id);
    const deletedIds = new Set(reviewDeletes.map((write) => write.record.id));
    return { kind: "write", payload: ids.filter((id) => !deletedIds.has(id)) };
  } });
  for (const write of reviewDeletes) specs.push({ target: `review:${write.record.id}`, desired: { kind: "remove" } });

  const clearSession = writes.find((write): write is Extract<JournalWrite, { kind: "clear_active_session" }> => write.kind === "clear_active_session");
  let sessionIndexWritten = false;
  for (const write of writes) {
    switch (write.kind) {
      case "put_session":
        specs.push({ target: `session:${write.record.id}`, desired: { kind: "write", payload: write.record } });
        if (!sessionIndexWritten) {
          specs.push({ target: "session_index", retainBeforeEnvelope: true, desired: (before) => {
            const ids = before.kind === "present" ? readPriorIndex(before, "session_index") : [];
            if (!ids.includes(write.record.id)) ids.unshift(write.record.id);
            return { kind: "write", payload: ids };
          } });
          sessionIndexWritten = true;
        }
        if (!clearSession) specs.push({ target: "active_session", retainBeforeEnvelope: true, desired: (before) => {
          if (write.record.status === "active") return { kind: "write", payload: write.record.id };
          const activeId = readPriorString(before, "active_session");
          return activeId === write.record.id ? { kind: "remove" } : preservePriorValue(before);
        } });
        break;
      case "put_active_foreground_timer":
        specs.push({ target: "active_foreground_timer", desired: (before) => {
          if (before.kind !== "absent") throw new Error("A foreground-timed session cannot start while a timer already exists.");
          return { kind: "write", payload: write.record };
        } });
        break;
      case "put_session_result": specs.push({ target: `result:${write.record.sessionId}`, desired: { kind: "write", payload: write.record } }); break;
      case "put_active_session_draft": specs.push({ target: "active_session_draft", desired: { kind: "write", payload: write.record } }); break;
      case "clear_active_session":
        specs.push({ target: "active_session", retainBeforeEnvelope: true, desired: (before) => readPriorString(before, "active_session") === write.sessionId ? { kind: "remove" } : preservePriorValue(before) });
        specs.push({ target: "active_foreground_timer", retainBeforeEnvelope: true, desired: (before) => {
          const timer = readPriorTimer(before);
          if (!timer) return { kind: "remove" };
          const owner = writes.find((candidate): candidate is Extract<JournalWrite, { kind: "put_session" }> => candidate.kind === "put_session" && candidate.record.id === write.sessionId);
          if (!owner || timer.sessionId !== write.sessionId || timer.trackId !== owner.record.trackId) throw new Error("The active foreground timer is not owned by the terminal session in this journal.");
          return { kind: "remove" };
        } });
        break;
      case "clear_active_session_draft":
        specs.push({ target: "active_session_draft", retainBeforeEnvelope: true, desired: (before) => readPriorScopedSessionId(before, "active_session_draft") === write.sessionId ? { kind: "remove" } : preservePriorValue(before) });
        break;
      case "delete_active_session_draft":
        specs.push({ target: "active_session_draft", retainBeforeEnvelope: true, desired: (before) => {
          const record = write.record;
          if (isAcceptedSimulationFinalization(record)) {
            if (before.kind !== "present" || !before.envelope || before.envelope.revision !== before.revision ||
              canonicalSerialize(before.envelope.payload) !== canonicalSerialize(record)) {
              throw new Error("Accepted finalization cleanup must carry the entire exact durable D state.");
            }
            return { kind: "remove" };
          }
          return readPriorScopedSessionId(before, "active_session_draft") === record.sessionId ? { kind: "remove" } : preservePriorValue(before);
        } });
        break;
      default: break;
    }
  }
  return Object.freeze(specs);
}

function readPriorIndex(before: CanonicalPhysicalState, target: string): string[] {
  if (before.kind !== "present" || !before.envelope || !idsGuard(before.envelope.payload) || before.envelope.revision !== before.revision ||
    sha256Utf8(JSON.stringify(before.envelope)) !== before.digest || sha256Utf8(JSON.stringify(before.envelope.payload)) !== before.payloadDigest) {
    throw new Error(`The captured ${target} envelope is unavailable or invalid.`);
  }
  return [...before.envelope.payload];
}

function readPriorString(before: CanonicalPhysicalState, target: string): string | null {
  if (before.kind === "absent") return null;
  if (!before.envelope || before.envelope.revision !== before.revision || sha256Utf8(JSON.stringify(before.envelope)) !== before.digest || sha256Utf8(JSON.stringify(before.envelope.payload)) !== before.payloadDigest || typeof before.envelope.payload !== "string") {
    throw new Error(`The captured ${target} envelope is unavailable or invalid.`);
  }
  return before.envelope.payload;
}

function readPriorScopedSessionId(before: CanonicalPhysicalState, target: string): string | null {
  if (before.kind === "absent") return null;
  if (!before.envelope || before.envelope.revision !== before.revision || sha256Utf8(JSON.stringify(before.envelope)) !== before.digest || sha256Utf8(JSON.stringify(before.envelope.payload)) !== before.payloadDigest || !isRecord(before.envelope.payload) || !isNonEmptyString(before.envelope.payload.sessionId)) {
    throw new Error(`The captured ${target} envelope is unavailable or invalid.`);
  }
  return before.envelope.payload.sessionId;
}

function readPriorTimer(before: CanonicalPhysicalState): Readonly<{ sessionId: string; trackId: string }> | null {
  if (before.kind === "absent") return null;
  if (!before.envelope || before.envelope.revision !== before.revision || sha256Utf8(JSON.stringify(before.envelope)) !== before.digest || sha256Utf8(JSON.stringify(before.envelope.payload)) !== before.payloadDigest || !isForegroundTimerState(before.envelope.payload)) {
    throw new Error("The captured foreground timer envelope is invalid.");
  }
  return { sessionId: before.envelope.payload.sessionId, trackId: before.envelope.payload.trackId };
}

function preservePriorValue(before: CanonicalPhysicalState): PhysicalDesired {
  if (before.kind === "absent") return { kind: "remove" };
  if (!before.envelope || before.envelope.revision !== before.revision || sha256Utf8(JSON.stringify(before.envelope)) !== before.digest || sha256Utf8(JSON.stringify(before.envelope.payload)) !== before.payloadDigest) {
    throw new Error("The exact prior envelope is unavailable for preserving a conditional target.");
  }
  return { kind: "write", payload: before.envelope.payload };
}

function derivePhysicalAfter(before: CanonicalPhysicalState, desired: PhysicalDesired): CanonicalPhysicalAfter {
  if (desired.kind === "remove") return Object.freeze({ kind: "absent" });
  const unchanged = before.kind === "present" && before.payloadDigest === sha256Utf8(JSON.stringify(desired.payload));
  const envelope: CanonicalRecordEnvelope<unknown> = Object.freeze({
    schemaIdentity: "patternly:canonical:v1",
    revision: unchanged ? before.revision : (before.kind === "present" ? before.revision : 0) + 1,
    payload: desired.payload,
  });
  return Object.freeze({ kind: "present", envelope, digest: unchanged && before.kind === "present" ? before.digest : sha256Utf8(JSON.stringify(envelope)) });
}

/** Builds the closed physical operation list from one exact set of typed journal writes. */
export function captureMutationPhysicalWrites(writes: readonly JournalWrite[]): readonly CanonicalPhysicalWrite[] {
  return Object.freeze(physicalWriteSpecs(writes).map((spec) => captureCanonicalPhysicalWrite(
    spec.target,
    targetStorageKey(spec.target),
    (envelope) => {
      const before: CanonicalPhysicalState = envelope === null
        ? Object.freeze({ kind: "absent" })
        : Object.freeze({ kind: "present", revision: envelope.revision, digest: sha256Utf8(JSON.stringify(envelope)), payloadDigest: sha256Utf8(JSON.stringify(envelope.payload)), ...(spec.retainBeforeEnvelope ? { envelope } : {}) });
      return typeof spec.desired === "function" ? spec.desired(before) : spec.desired;
    },
    Boolean(spec.retainBeforeEnvelope),
  )));
}

function hasValidPhysicalWrites(plan: MutationJournalPlan): boolean {
  const specs = physicalWriteSpecs(plan.writes);
  const physical = plan.physicalWrites;
  if (!Array.isArray(physical) || physical.length !== specs.length) return false;
  for (let index = 0; index < specs.length; index += 1) {
    const step = physical[index];
    const spec = specs[index]!;
    if (!isCanonicalPhysicalWriteShape(step) || step.target !== spec.target || step.key !== targetStorageKey(spec.target)) return false;
    if (spec.retainBeforeEnvelope) {
      if (step.before.kind === "present" && (!step.before.envelope || step.before.envelope.revision !== step.before.revision ||
        sha256Utf8(JSON.stringify(step.before.envelope)) !== step.before.digest || sha256Utf8(JSON.stringify(step.before.envelope.payload)) !== step.before.payloadDigest)) return false;
    } else if (step.before.kind === "present" && step.before.envelope !== undefined) return false;
    let desired: PhysicalDesired;
    try { desired = typeof spec.desired === "function" ? spec.desired(step.before) : spec.desired; } catch { return false; }
    const after = derivePhysicalAfter(step.before, desired);
    if (JSON.stringify(after) !== JSON.stringify(step.after)) return false;
  }
  return true;
}

function isCanonicalPhysicalWriteShape(value: unknown): value is CanonicalPhysicalWrite {
  if (!isRecord(value) || !hasExactKeys(value, ["target", "key", "before", "after"]) || !isNonEmptyString(value.target) || !isNonEmptyString(value.key) || !isRecord(value.before) || !isRecord(value.after)) return false;
  const before = value.before;
  const after = value.after;
  if (before.kind === "absent") {
    if (!hasExactKeys(before, ["kind"])) return false;
  } else if (before.kind === "present") {
    const keys = Object.hasOwn(before, "envelope") ? ["kind", "revision", "digest", "payloadDigest", "envelope"] : ["kind", "revision", "digest", "payloadDigest"];
    if (!hasExactKeys(before, keys) || !Number.isSafeInteger(before.revision) || Number(before.revision) < 1 || !SHA_256.test(String(before.digest)) || !SHA_256.test(String(before.payloadDigest)) ||
      (Object.hasOwn(before, "envelope") && !isStoredEnvelope(before.envelope, (_candidate): _candidate is unknown => true))) return false;
  } else return false;
  if (after.kind === "absent") return hasExactKeys(after, ["kind"]);
  return after.kind === "present" && hasExactKeys(after, ["kind", "envelope", "digest"]) && SHA_256.test(String(after.digest)) &&
    isStoredEnvelope(after.envelope, (_candidate): _candidate is unknown => true);
}

function isKnownPreconditionTarget(target: string): boolean {
  try { targetStorageKey(target); return true; } catch { return false; }
}

function revisionForTarget(target: string): number | null {
  return readCanonicalEnvelope(targetStorageKey(target), (_value): _value is unknown => true)?.revision ?? null;
}

function resetRecordTargets(): string[] {
  const ids = (key: string) => readCanonicalJson(key, (value): value is string[] => Array.isArray(value) && value.every((id) => typeof id === "string")) ?? [];
  return [
    ...ids(STORAGE_KEYS.TRAINING_SESSION_INDEX).map((id) => `session:${id}`),
    ...ids(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX).map((id) => `attempt:${id}`),
    ...ids(STORAGE_KEYS.REVIEW_INDEX).map((id) => `review:${id}`),
  ];
}

/** Captures every mutable canonical record that the immutable plan can touch. */
export function captureMutationExpectedRevisions(writes: readonly JournalWrite[], overrides: readonly MutationExpectedRevision[] = []): readonly MutationExpectedRevision[] {
  const targets = writes.some((write) => write.kind === "clear_learning_state")
    ? [...RESET_STATIC_TARGETS, ...resetRecordTargets()]
    : writes.flatMap(writePreconditionTargets);
  const uniqueTargets = [...new Set(targets)].sort();
  const overrideByTarget = new Map(overrides.map((condition) => [condition.target, condition.revision]));
  if (overrideByTarget.size !== overrides.length || overrides.some((condition) => !uniqueTargets.includes(condition.target))) throw new Error("Mutation revision overrides must target unique records in the write set.");
  return uniqueTargets.map((target) => ({ target, revision: overrideByTarget.has(target) ? overrideByTarget.get(target)! : revisionForTarget(target) }));
}

function hasExpectedRevisionPlan(record: MutationJournalPlan): boolean {
  const targets = record.expectedRevisions.map((condition) => condition.target);
  if (new Set(targets).size !== targets.length || !record.expectedRevisions.every((condition) => isKnownPreconditionTarget(condition.target))) return false;
  if (record.operation === "reset_learning_state") {
    return RESET_STATIC_TARGETS.every((target) => targets.includes(target));
  }
  const expectedTargets = [...new Set(record.writes.flatMap(writePreconditionTargets))];
  if (targets.length !== expectedTargets.length || !expectedTargets.every((target) => targets.includes(target))) return false;
  if (record.operation === "accept_goal_plan" || record.operation === "resolve_account_sync_conflict") return record.physicalWrites.length === 0;
  return record.physicalWrites.length === expectedTargets.length && record.physicalWrites.every((write) => expectedTargets.includes(write.target));
}

function hasValidOperationPlan(record: MutationJournalPlan): boolean {
  if (record.writes.length === 0) return false;
  const targets = record.writes.map(writeTarget);
  if (new Set(targets).size !== targets.length) return false;
  if (record.operation === "accept_goal_plan") {
    return record.writes.length === 1 && record.writes[0]?.kind === "accept_goal_plan" && record.artifactSha256 === record.writes[0].record.plan.artifactSha256 &&
      record.writes[0].record.trackId === record.trackId && record.writes[0].record.proposalId === record.proposalId;
  }
  if (record.operation === "resolve_account_sync_conflict") {
    const write = record.writes[0];
    return record.writes.length === 1 && write?.kind === "resolve_account_sync_conflict"
      && record.trackId === write.record.trackId && record.conflictId === write.record.conflictId
      && record.artifactSha256 === (write.record.afterPlan?.artifactSha256 ?? null);
  }
  const count = (kind: JournalWrite["kind"]) => record.writes.filter((write) => write.kind === kind).length;
  const only = (...kinds: JournalWrite["kind"][]) => record.writes.every((write) => kinds.includes(write.kind));
  const sessionWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_session" }> => write.kind === "put_session");
  const resultWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_session_result" }> => write.kind === "put_session_result");
  const attemptWrites = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt");
  const attemptItemKeys = new Set(record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_attempt" }> => write.kind === "put_attempt").map((write) => resolvedContentRefKey(write.record.item)));
  const attemptOccurrenceIds = attemptWrites.map((write) => write.record.occurrenceId);
  const reviewItemKeys = record.writes.filter((write): write is Extract<JournalWrite, { kind: "put_review_entry" | "put_review_entry_for_attempt" | "update_review_entry" | "delete_review_entry_for_attempt" }> => write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry" || write.kind === "delete_review_entry_for_attempt").map((write) => resolvedContentRefKey(write.record.sourceItem));
  const hasUniqueOutcomeSemantics = new Set(attemptOccurrenceIds).size === attemptOccurrenceIds.length && new Set(reviewItemKeys).size === reviewItemKeys.length;
  const deletedReviewsMatchPlannedItems = record.writes.every((write) => write.kind !== "delete_review_entry" || attemptItemKeys.has(resolvedContentRefKey(write.record.sourceItem)));
  const attemptsMatchSessionPlan = Boolean(sessionWrite) && attemptWrites.every((write) =>
    write.record.modeId === sessionWrite?.record.modeId &&
    sessionWrite?.record.itemOrder.some((occurrence) => occurrence.occurrenceId === write.record.occurrenceId && equalItemRef(occurrence.item, write.record.item)) &&
    equalItemRef(write.record.item, write.record.reviewEvidence.sourceItem));
  const reviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "put_review_entry" && write.kind !== "put_review_entry_for_attempt" && write.kind !== "update_review_entry") return true;
    const attempt = attemptWrites.find((candidate) => candidate.record.id === (write.kind === "put_review_entry" ? write.record.sourceAttemptId : write.transitionId))?.record;
    if (!attempt || write.record.trackId !== attempt.trackId || !equalItemRef(write.record.sourceItem, attempt.reviewEvidence.sourceItem)) return false;
    if (write.kind === "put_review_entry_for_attempt") {
      const sourceAttempt = attemptWrites.find((candidate) => candidate.record.id === write.record.sourceAttemptId)?.record;
      return Boolean(sourceAttempt && write.record.sourceSessionId === sourceAttempt.sessionId && equalItemRef(write.record.sourceItem, sourceAttempt.item) && JSON.stringify(write.record.taxonomyOrSkillRefs) === JSON.stringify(sourceAttempt.reviewEvidence.taxonomyOrSkillRefs));
    }
    return write.kind === "update_review_entry" || (write.record.sourceSessionId === attempt.sessionId && JSON.stringify(write.record.taxonomyOrSkillRefs) === JSON.stringify(attempt.reviewEvidence.taxonomyOrSkillRefs));
  });
  const deletedReviewsMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "delete_review_entry") return true;
    return attemptWrites.some((attempt) => equalItemRef(write.record.sourceItem, attempt.record.item));
  });
  const transitionedReviewDeletesMatchAttempts = record.writes.every((write) => {
    if (write.kind !== "delete_review_entry_for_attempt") return true;
    const attempt = attemptWrites.find((candidate) => candidate.record.id === write.transitionId)?.record;
    return Boolean(attempt && write.record.trackId === attempt.trackId && equalItemRef(write.record.sourceItem, attempt.reviewEvidence.sourceItem));
  });
  const immediateAttemptMatchesCurrentOccurrence = attemptWrites.length === 1 &&
    sessionWrite?.record.itemOrder[sessionWrite.record.currentItemIndex]?.occurrenceId === attemptWrites[0]?.record.occurrenceId;
  const draftDelete = record.writes.find((write): write is Extract<JournalWrite, { kind: "delete_active_session_draft" }> => write.kind === "delete_active_session_draft");
  const deletedDraft = draftDelete ? draftPayload(draftDelete.record) : undefined;
  const draftResponsesMatchAttempts = !draftDelete || (
    deletedDraft?.sessionId === sessionWrite?.record.id &&
    deletedDraft?.trackId === sessionWrite?.record.trackId &&
    draftDelete.submittedOccurrenceIds.length === attemptWrites.length &&
    draftDelete.submittedOccurrenceIds.every((occurrenceId) => Object.prototype.hasOwnProperty.call(deletedDraft!.responsesByOccurrenceId, occurrenceId)) &&
    attemptWrites.every((write) => draftDelete.submittedOccurrenceIds.includes(write.record.occurrenceId) &&
      canonicalSerialize(deletedDraft!.responsesByOccurrenceId[write.record.occurrenceId]) === canonicalSerialize(write.record.response)) &&
    (!isAcceptedSimulationFinalization(draftDelete.record) || draftDelete.record.acceptance.commandId.length === 64)
  );
  const draftPut = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_active_session_draft" }> => write.kind === "put_active_session_draft");

  switch (record.operation) {
    case "start_training_session": {
      const draftExpected = Boolean(sessionWrite && getTrainingSessionFinalizationCleanupKind(sessionWrite.record) === "session_draft");
      const draftMatches = !draftExpected || Boolean(draftPut && draftPut.record.sessionId === sessionWrite?.record.id && draftPut.record.trackId === sessionWrite.record.trackId && Object.keys(draftPut.record.responsesByOccurrenceId).length === 0 && draftPut.record.flaggedOccurrenceIds.length === 0);
      let expectedTimer: ForegroundTimerState | null = null;
      try { expectedTimer = sessionWrite ? initialForegroundTimerForSession(sessionWrite.record, getTrackRegistration(sessionWrite.record.trackId).familyId) : null; } catch { return false; }
      const timerWrite = record.writes.find((write): write is Extract<JournalWrite, { kind: "put_active_foreground_timer" }> => write.kind === "put_active_foreground_timer");
      const timerMatches = expectedTimer === null ? !timerWrite : Boolean(timerWrite && canonicalSerialize(timerWrite.record) === canonicalSerialize(expectedTimer));
      const expectedWriteKinds = ["put_session", ...(draftExpected ? ["put_active_session_draft"] : []), ...(expectedTimer ? ["put_active_foreground_timer"] : [])];
      const typedWriteOrderMatches = record.writes.length === expectedWriteKinds.length && record.writes.every((write, index) => write.kind === expectedWriteKinds[index]);
      return only("put_session", "put_active_session_draft", "put_active_foreground_timer") && typedWriteOrderMatches && count("put_session") === 1 && sessionWrite?.record.status === "active" && count("put_active_session_draft") === (draftExpected ? 1 : 0) && draftMatches && count("put_active_foreground_timer") === (expectedTimer ? 1 : 0) && timerMatches;
    }
    case "advance_training_session":
      return only("put_session") && count("put_session") === 1 && sessionWrite?.record.status === "active";
    case "submit_training_outcome":
      return only("put_attempt", "put_review_entry", "update_review_entry", "delete_review_entry", "put_session") && count("put_attempt") === 1 && count("put_review_entry") + count("update_review_entry") + count("delete_review_entry") <= 1 && count("put_session") === 1 && sessionWrite?.record.status === "active" && immediateAttemptMatchesCurrentOccurrence && hasUniqueOutcomeSemantics && deletedReviewsMatchPlannedItems && attemptsMatchSessionPlan && reviewsMatchAttempts && deletedReviewsMatchAttempts;
    case "complete_training_session":
      return only("put_session_result", "put_session", "clear_active_session") && count("put_session") === 1 && count("put_session_result") === 1 && count("clear_active_session") === 1 && sessionWrite?.record.status === "completed" && resultWrite?.record.sessionId === sessionWrite.record.id && resultWrite.record.trackId === sessionWrite.record.trackId;
    case "abandon_training_session": {
      const draftExpected = Boolean(sessionWrite && getTrainingSessionFinalizationCleanupKind(sessionWrite.record) === "session_draft");
      return only("put_session", "clear_active_session", "clear_active_session_draft") &&
        count("put_session") === 1 && count("clear_active_session") === 1 &&
        count("clear_active_session_draft") === (draftExpected ? 1 : 0) &&
        record.writes.filter((write): write is Extract<JournalWrite, { kind: "clear_active_session_draft" }> => write.kind === "clear_active_session_draft").every((write) => write.sessionId === sessionWrite?.record.id) &&
        sessionWrite?.record.status === "abandoned";
    }
    case "finalize_training_session": {
      const cleanupKind = sessionWrite ? getTrainingSessionFinalizationCleanupKind(sessionWrite.record) : null;
      const cleanupMatchesSession = cleanupKind === "session_draft" && count("delete_active_session_draft") === 1 && draftResponsesMatchAttempts;
      return only("put_attempt", "put_review_entry_for_attempt", "update_review_entry", "delete_review_entry_for_attempt", "put_session_result", "put_session", "clear_active_session", "delete_active_session_draft") &&
        count("put_session") === 1 && count("clear_active_session") === 1 && sessionWrite?.record.status === "completed" &&
        cleanupMatchesSession && hasUniqueOutcomeSemantics && attemptsMatchSessionPlan && reviewsMatchAttempts && transitionedReviewDeletesMatchAttempts &&
        (!resultWrite || (resultWrite.record.sessionId === sessionWrite.record.id && resultWrite.record.trackId === sessionWrite.record.trackId && resultWrite.record.totalOccurrences === sessionWrite.record.itemOrder.length));
    }
    case "set_review_entry":
      return only("put_review_entry", "update_review_entry") && count("put_review_entry") + count("update_review_entry") === 1;
    case "remove_review_entry":
      return only("delete_review_entry") && count("delete_review_entry") === 1 &&
        record.writes[0]?.kind === "delete_review_entry" && record.writes[0].record.sourceSessionId === record.sessionId;
    case "reset_learning_state":
      return only("clear_learning_state") && count("clear_learning_state") === 1;
  }
}

function equalItemRef(left: TrainingAttempt["item"], right: TrainingAttempt["item"]): boolean {
  return resolvedContentRefsEqual(left, right);
}

function hasConsistentScope(record: MutationJournalPlan): boolean {
  if (record.operation === "accept_goal_plan") {
    const write = record.writes[0];
    return write?.kind === "accept_goal_plan" && record.artifactSha256 === write.record.plan.artifactSha256 && write.record.trackId === record.trackId &&
      write.record.proposalId === record.proposalId && write.record.plan.artifactSha256 !== "";
  }
  if (record.operation === "resolve_account_sync_conflict") {
    const write = record.writes[0];
    return write?.kind === "resolve_account_sync_conflict" && record.artifactSha256 === (write.record.afterPlan?.artifactSha256 ?? null)
      && write.record.trackId === record.trackId && write.record.conflictId === record.conflictId;
  }
  if (record.operation === "reset_learning_state") return record.artifactSha256 === null && record.writes.length === 1
    && record.writes[0]?.kind === "clear_learning_state" && isLearningStateResetTargetPlan(record.writes[0].targetPlan);
  if (!isArtifactSha256(record.artifactSha256)) return false;
  if (record.operation === "finalize_training_session") {
    const cleanup = record.writes.find((write): write is Extract<JournalWrite, { kind: "delete_active_session_draft" }> => write.kind === "delete_active_session_draft");
    // Existing pending finalization journals remain replayable. New accepted
    // finalizations bind the journal's stable command identity to the exact
    // acceptance preimage, while the plan fingerprint continues to bind the
    // full physical plan.
    if (cleanup && isAcceptedSimulationFinalization(cleanup.record)) {
      const { commandId, ...identity } = cleanup.record.acceptance;
      if (commandId !== sha256Utf8(canonicalSerialize(identity)) || record.commandIdentity.fingerprint !== commandId) return false;
    }
  }
  const artifactSha256 = record.artifactSha256;
  return record.writes.every((write) => {
    if (write.kind === "put_session") return write.record.id === record.sessionId && write.record.trackId === record.trackId && write.record.artifactSha256 === artifactSha256;
    if (write.kind === "put_active_foreground_timer") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_session_result") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "put_attempt") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId && write.record.item.artifactSha256 === artifactSha256;
    if (write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt") return write.record.sourceSessionId === record.sessionId && write.record.trackId === record.trackId && write.record.sourceItem.artifactSha256 === artifactSha256;
    if (write.kind === "update_review_entry" || write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt") return write.record.trackId === record.trackId && write.record.sourceItem.artifactSha256 === artifactSha256;
    if (write.kind === "clear_active_session" || write.kind === "clear_active_session_draft") return write.sessionId === record.sessionId;
    if (write.kind === "put_active_session_draft") return write.record.sessionId === record.sessionId && write.record.trackId === record.trackId;
    if (write.kind === "delete_active_session_draft") {
      const draft = draftPayload(write.record);
      return draft.sessionId === record.sessionId && draft.trackId === record.trackId &&
        (!isAcceptedSimulationFinalization(write.record) || write.record.acceptance.commandId.length === 64);
    }
    if (write.kind === "clear_learning_state") return record.sessionId === "learning-state-reset";
    return true;
  });
}

function draftPayload(record: TrainingSessionDraftState): TrainingSessionDraft {
  return isAcceptedSimulationFinalization(record) ? record.responseDraft : record;
}

export function createMutationPlanFingerprint(plan: MutationJournalPlan): string {
  const serialized = canonicalFingerprintPayload(JSON.parse(JSON.stringify(plan)));
  return sha256Utf8(serialized);
}

function persistedPlan(record: MutationJournalRecord): MutationJournalPlan {
  const { journalId: _journalId, planFingerprint: _planFingerprint, status: _status, ...plan } = record;
  return { ...plan, status: "journal_durable" };
}

export function hasValidMutationJournalIntegrity(value: unknown): value is MutationJournalRecord {
  if (!isRecord(value) || !isNonEmptyString(value.operation)) return false;
  const expectedKeys = value.operation === "accept_goal_plan"
    ? ["journalId", "operation", "status", "createdAt", "proposalId", "trackId", "artifactSha256", "commandIdentity", "expectedRevisions", "physicalWrites", "planFingerprint", "writes"]
    : value.operation === "resolve_account_sync_conflict"
      ? ["journalId", "operation", "status", "createdAt", "conflictId", "trackId", "artifactSha256", "commandIdentity", "expectedRevisions", "physicalWrites", "planFingerprint", "writes"]
      : ["journalId", "operation", "status", "createdAt", "sessionId", "trackId", "artifactSha256", "commandIdentity", "expectedRevisions", "physicalWrites", "planFingerprint", "writes"];
  if (!hasExactKeys(value, expectedKeys)) return false;
  if (!isRecord(value.commandIdentity) || !hasExactKeys(value.commandIdentity, ["version", "fingerprint"]) || value.commandIdentity.version !== 1 || !isNonEmptyString(value.commandIdentity.fingerprint) || !SHA_256.test(value.commandIdentity.fingerprint) || value.journalId !== `journal:${value.commandIdentity.fingerprint}` ||
    !isNonEmptyString(value.planFingerprint) || !PLAN_FINGERPRINT.test(value.planFingerprint) ||
    !(value.operation === "accept_goal_plan" || value.operation === "resolve_account_sync_conflict" || (TRAINING_OPERATIONS as readonly unknown[]).includes(value.operation)) ||
    !["journal_durable", "materialized", "verified_pending_clear"].includes(value.status as string) || !isTimestamp(value.createdAt) ||
    (value.operation === "accept_goal_plan" ? !isNonEmptyString(value.proposalId) : value.operation === "resolve_account_sync_conflict" ? !SHA_256.test(String(value.conflictId)) : !isNonEmptyString(value.sessionId)) || !isNonEmptyString(value.trackId) ||
    !isRegisteredTrackId(value.trackId) || !(value.artifactSha256 === null || isArtifactSha256(value.artifactSha256)) || !Array.isArray(value.expectedRevisions) || !value.expectedRevisions.every(isExpectedRevision) ||
    !Array.isArray(value.physicalWrites) || !Array.isArray(value.writes) || !value.writes.every(isJournalWrite)) return false;
  const record = value as MutationJournalRecord;
  return hasConsistentScope(record) && hasExpectedRevisionPlan(record) && hasValidPhysicalWrites(record) && createMutationPlanFingerprint(persistedPlan(record)) === record.planFingerprint;
}

export function isMutationJournalRecord(value: unknown): value is MutationJournalRecord {
  return hasValidMutationJournalIntegrity(value) && hasValidOperationPlan(value);
}

export function assertMutationJournalIntegrity(value: unknown): asserts value is MutationJournalRecord { if (!hasValidMutationJournalIntegrity(value)) throw new Error("Mutation journal record is unsupported."); }
export function assertValidMutationJournal(value: unknown): asserts value is MutationJournalRecord { if (!isMutationJournalRecord(value)) throw new Error("Mutation journal record is unsupported."); }
export function readActiveMutationJournal(): MutationJournalRecord | null { return readCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, isMutationJournalRecord); }
export async function getActiveMutationJournal(): Promise<MutationJournalRecord | null> { return readActiveMutationJournal(); }
export function reconcileMutationJournalWriteAttempt(value: unknown, expected: Readonly<{ commandFingerprint: string; planFingerprint: string }>): "verified" | "conflict" | "unknown" {
  if (!isMutationJournalWriteAttempt(value)) return "unknown";
  const attempt = value;
  if (attempt.envelope.payload.commandIdentity.fingerprint !== expected.commandFingerprint ||
    attempt.envelope.payload.planFingerprint !== expected.planFingerprint) return "conflict";
  const exact = reconcileCanonicalWriteAttempt(attempt);
  if (exact.kind !== "verified") return exact.kind === "provenNotApplied" ? "unknown" : exact.kind;
  try {
    if (!isCanonicalWriteAttemptCurrent(attempt)) return "unknown";
    const current = readActiveMutationJournal();
    if (!isCanonicalWriteAttemptCurrent(attempt)) return "unknown";
    return current?.journalId === attempt.envelope.payload.journalId &&
      current.commandIdentity.fingerprint === expected.commandFingerprint && current.planFingerprint === expected.planFingerprint
      ? "verified" : "conflict";
  } catch { return "unknown"; }
}
function isMutationJournalWriteAttempt(value: unknown): value is CanonicalWriteAttempt<MutationJournalRecord> {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Partial<CanonicalWriteAttempt<MutationJournalRecord>>;
  return attempt.key === STORAGE_KEYS.ACTIVE_JOURNAL && typeof attempt.afterRaw === "string" &&
    typeof attempt.storage === "object" && attempt.storage !== null &&
    (attempt.lease === null || (typeof attempt.lease === "object" && attempt.lease !== null)) &&
    typeof attempt.envelope === "object" && attempt.envelope !== null && isMutationJournalRecord(attempt.envelope.payload);
}
export class GoalPlanAcceptanceRecoveryRequiredError extends Error {
  constructor() { super("Goal-plan acceptance must recover before canonical reads."); this.name = "GoalPlanAcceptanceRecoveryRequiredError"; }
}
export function assertGoalPlanPairReadable(): void {
  const operation = readActiveMutationJournal()?.operation;
  if (operation === "accept_goal_plan" || operation === "resolve_account_sync_conflict") throw new GoalPlanAcceptanceRecoveryRequiredError();
}
let journalCriticalSection: Promise<void> = Promise.resolve();
async function inJournalCriticalSection<T>(operation: () => Promise<T>): Promise<T> {
  const previous = journalCriticalSection;
  let release!: () => void;
  journalCriticalSection = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await operation(); } finally { release(); }
}
/** Captures the current journal write owner before application preflight begins. */
export function captureMutationJournalLease(): ActiveProfileStorageLease | null { return captureActiveProfileStorageLease(); }
export function isMutationJournalLeaseCurrent(lease: ActiveProfileStorageLease | null): boolean { return isJournalLeaseCurrent(lease); }

export async function persistMutationJournal(record: MutationJournalRecord, expectedLease: ActiveProfileStorageLease | null = captureActiveProfileStorageLease()): Promise<MutationJournalRecord> {
  return inJournalCriticalSection(async () => { try {
    assertValidMutationJournal(record);
    const reviewUpdates = record.writes.filter((write): write is Extract<JournalWrite, { kind: "update_review_entry" }> => write.kind === "update_review_entry");
    if (reviewUpdates.length > 0) {
      const existingReviews = (await getReviewQueueItems()).value;
      if (reviewUpdates.some((write) => { const existing = existingReviews.find((entry) => entry.id === write.record.id); return !existing || !hasSameReviewIdentity(existing, write.record); })) throw new Error("A journaled review update must preserve an existing durable review identity.");
    }
    const current = await getActiveMutationJournal();
    if (current && current.commandIdentity.fingerprint !== record.commandIdentity.fingerprint) throw new Error("A different mutation is already pending.");
    if (current) {
      if (current.journalId !== record.journalId || current.planFingerprint !== record.planFingerprint) throw new Error("The existing mutation command has a different immutable plan.");
      if (!isJournalLeaseCurrent(expectedLease)) throw new Error("The active profile changed while the mutation command was being checked.");
      return current;
    }
    if (!current) {
      const draftEnvelope = readCanonicalEnvelope(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, isTrainingSessionDraftState);
      const acceptedDraft = draftEnvelope && isAcceptedSimulationFinalization(draftEnvelope.payload) ? draftEnvelope.payload : null;
      if (record.operation === "finalize_training_session") {
        const cleanup = record.writes.find((write): write is Extract<JournalWrite, { kind: "delete_active_session_draft" }> => write.kind === "delete_active_session_draft");
        if (!acceptedDraft || !cleanup || !isAcceptedSimulationFinalization(cleanup.record) ||
          canonicalSerialize(cleanup.record) !== canonicalSerialize(acceptedDraft)) {
          throw new Error("A new finalization journal requires the exact accepted D state and cannot finalize a legacy draft implicitly.");
        }
      } else if (acceptedDraft && record.operation !== "reset_learning_state") {
        throw new Error("An accepted simulation finalization blocks other session mutations until its exact journal is materialized.");
      }
      // A new journal cannot legitimize pre-existing orphan evidence. Existing
      // durable journals instead use the narrower journal-aware replay gate.
      if (record.operation === "reset_learning_state") {
        const reset = record.writes[0];
        if (reset?.kind !== "clear_learning_state") throw new Error("A learning-state reset requires one exact target plan.");
        assertLearningStateResetPlanBeforeJournal(reset.targetPlan);
      } else {
        assertTrainingEvidenceIntegrity();
        assertContentIdentityRecordIntegrity();
      }
      const staleTarget = record.expectedRevisions.find((condition) => revisionForTarget(condition.target) !== condition.revision)?.target;
      if (staleTarget) throw new StaleMutationRevisionError(staleTarget);
      const stalePhysicalTarget = record.physicalWrites.find((write) => canonicalPhysicalWriteRelation(write) !== "before")?.target;
      if (stalePhysicalTarget) throw new StaleMutationRevisionError(stalePhysicalTarget);
    }
    if (record.operation === "start_training_session") {
      const activeSession = await getActiveTrainingSession();
      if (activeSession && activeSession.id !== record.sessionId) {
        const message = `Active session ${activeSession.id} was claimed before this start command.`;
        throw new JournalWriteError(new Error(message), message);
      }
    }
    if (!current) {
      const stalePhysicalTarget = record.physicalWrites.find((write) => canonicalPhysicalWriteRelation(write) !== "before")?.target;
      if (stalePhysicalTarget) throw new StaleMutationRevisionError(stalePhysicalTarget);
    }
    const outcome = writeCanonicalJsonWithOutcome(STORAGE_KEYS.ACTIVE_JOURNAL, record, null, expectedLease);
    if (outcome.kind !== "verified") throw new JournalWriteError(new CanonicalWriteOutcomeError(STORAGE_KEYS.ACTIVE_JOURNAL, outcome));
    return outcome.envelope.payload;
  } catch (error) {
    if (error instanceof JournalWriteError) throw error;
    throw new JournalWriteError(error);
  } });
}

function isJournalLeaseCurrent(lease: ActiveProfileStorageLease | null): boolean {
  try { return lease ? isActiveProfileStorageLeaseCurrent(lease) : captureActiveProfileStorageLease() === null; }
  catch { return false; }
}

export async function updateMutationJournalPhase(record: MutationJournalRecord, status: MutationJournalRecord["status"]): Promise<MutationJournalRecord> {
  return inJournalCriticalSection(async () => {
    const current = await getActiveMutationJournal();
    if (!current || current.commandIdentity.fingerprint !== record.commandIdentity.fingerprint) throw new JournalWriteError(new Error("Pending mutation ownership changed."));
    // The plan fingerprint is computed over the immutable operation, scope,
    // command, expected revisions and write set with status normalized.
    if (current.planFingerprint !== record.planFingerprint || current.journalId !== record.journalId ||
      current.operation !== record.operation || current.trackId !== record.trackId ||
      (current.operation === "accept_goal_plan" ? current.proposalId !== (record.operation === "accept_goal_plan" ? record.proposalId : null)
        : current.operation === "resolve_account_sync_conflict" ? current.conflictId !== (record.operation === "resolve_account_sync_conflict" ? record.conflictId : null)
          : current.sessionId !== (record.operation === "accept_goal_plan" || record.operation === "resolve_account_sync_conflict" ? null : record.sessionId))) {
      throw new JournalWriteError(new Error("Pending mutation plan ownership changed."));
    }
    const phases: readonly MutationJournalRecord["status"][] = ["journal_durable", "materialized", "verified_pending_clear"];
    const from = phases.indexOf(current.status);
    const to = phases.indexOf(status);
    if (from < 0 || to !== from + 1) throw new JournalWriteError(new Error("Mutation journal phase transition is not monotonic."));
    const updated = { ...current, status } as MutationJournalRecord;
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, updated);
    return updated;
  });
}

function hasSameReviewIdentity(left: ReviewQueueEntry, right: ReviewQueueEntry): boolean {
  const identity = (entry: ReviewQueueEntry) => ({ id: entry.id, trackId: entry.trackId, sourceAttemptId: entry.sourceAttemptId, sourceSessionId: entry.sourceSessionId, sourceItem: entry.sourceItem, taxonomyOrSkillRefs: entry.taxonomyOrSkillRefs, createdAt: entry.createdAt });
  return JSON.stringify(identity(left)) === JSON.stringify(identity(right));
}
export async function clearMutationJournal(expectedCommandFingerprint?: string): Promise<void> {
  await inJournalCriticalSection(async () => {
    const current = await getActiveMutationJournal();
    if (!current) return;
    if (expectedCommandFingerprint && current.commandIdentity.fingerprint !== expectedCommandFingerprint) {
      throw new JournalWriteError(new Error("Mutation journal ownership changed before clear."), "Mutation journal ownership changed before clear.");
    }
    removeCanonicalValue(STORAGE_KEYS.ACTIVE_JOURNAL);
  });
}
