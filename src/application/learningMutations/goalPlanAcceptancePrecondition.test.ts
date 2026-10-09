import assert from "node:assert/strict";
import test from "node:test";
import { acceptedTargetFromGoal, createDefaultGoal, createLearningPlanSlotId } from "../../domain";
import { accountDataRecordFingerprint, accountDataRecordKey, isCanonicalAccountSyncState, setAccountSyncState, type AccountSyncState } from "../../storage/repositories/accountDataRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import { readGoalPlanAcceptancePrecondition, setGoalPlanAcceptanceProfileForTests } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { CanonicalWriteConflictError } from "../../storage/errors";
import { GoalPlanAcceptanceRecoveryRequiredError, getActiveMutationJournal, persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { readCanonicalEnvelope, withCanonicalWriteLocks, writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { installMemoryStorage } from "../../testing/journalTestSupport";

const TRACK = "coding-interview-dsa-problem-solving";
const PROFILE = "guest-pair-precondition-test";
const ACCOUNT = "account-pair-precondition-test";
const NOW = "2026-10-09T10:00:00.000Z";
const CONFLICT_ID = "a".repeat(64);
const FINGERPRINT = "b".repeat(64);

test("paired precondition returns exact canonical envelopes only when the pair is readable", (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const storage = installMemoryStorage();
  setGoalPlanAcceptanceProfileForTests(PROFILE);
  assert.deepEqual(readGoalPlanAcceptancePrecondition(TRACK), { goal: null, plan: null });

  const goal = createDefaultGoal(TRACK);
  const goalEnvelope = writeCanonicalJson(STORAGE_KEYS.goal(TRACK), goal, null);
  const plan = {
    schemaVersion: 2 as const,
    minutesPerStudyDay: 25,
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "coding-interview-guided-practice", requestedLength: 10 } },
    planningPolicyIdentity: { contentVersion: "content-v1", artifactSha256: "c".repeat(64), policyVersion: "bizq03-authored-estimates-v3" },
    planId: "pair-precondition-plan",
    trackId: TRACK,
    goalRevision: goalEnvelope.revision,
    status: "accepted" as const,
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    artifactSha256: "c".repeat(64),
    acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: NOW,
    updatedAt: NOW,
    planRevision: 1,
    commandId: "pair-precondition-command",
    slots: [{ slotId: createLearningPlanSlotId("pair-precondition-slot"), day: "mon" as const, localTime: "18:00", sessionLength: 10 }],
  };
  const planEnvelope = writeCanonicalJson(STORAGE_KEYS.learningPlan(TRACK), plan, null);
  const before = storage.snapshot();
  assert.deepEqual(readGoalPlanAcceptancePrecondition(TRACK), { goal: goalEnvelope, plan: planEnvelope });
  assert.throws(
    () => withCanonicalWriteLocks([STORAGE_KEYS.goal(TRACK)], () => readGoalPlanAcceptancePrecondition(TRACK)),
    CanonicalWriteConflictError,
  );
  assert.deepEqual(storage.snapshot(), before, "precondition read must not write or change either revision");
});

test("paired precondition fails closed for an account-conflict journal without touching pair records", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const storage = installMemoryStorage();
  setGoalPlanAcceptanceProfileForTests(PROFILE);
  const goalPayload = { schemaVersion: 1 as const, revision: 1, record: createDefaultGoal(TRACK) };
  const baseGoalRecord = { recordId: TRACK, recordType: "goal" as const, state: goalPayload, trackId: TRACK, version: 1 };
  const goalRecord = { ...baseGoalRecord, fingerprint: accountDataRecordFingerprint(baseGoalRecord) };
  const conflict = {
    schemaVersion: 1 as const,
    conflictId: CONFLICT_ID,
    code: "account_revision_conflict" as const,
    planId: "plan-1",
    batchId: "batch-1",
    batchIndex: 0,
    expectedAccountRevision: 4,
    requestFingerprint: FINGERPRINT,
    mutationIds: ["mutation-1"],
    recordKeys: [accountDataRecordKey(goalRecord)],
    trackIds: [TRACK],
    occurredAt: NOW,
  };
  const syncPlanItem = { sequence: 1, recordKey: conflict.recordKeys[0]!, mutationId: conflict.mutationIds[0]!, expectedVersion: null, payload: goalRecord, groupId: `track:${TRACK}`, status: "sent" as const };
  const outboxEntry = { ...goalRecord, mutationId: syncPlanItem.mutationId, expectedVersion: null, attemptCount: 1, lastErrorCode: null, status: "retrying" as const, sequence: 1 };
  const syncPlan = { planId: conflict.planId, snapshotVersion: 0, expectedAccountRevision: conflict.expectedAccountRevision, highWatermark: 1, items: [syncPlanItem] };
  const beforeSyncState = setAccountSyncState({
    accountId: ACCOUNT,
    status: "conflict",
    blockingConflictCode: conflict.code,
    syncConflict: conflict,
    remoteAccountRevision: conflict.expectedAccountRevision,
    syncPlan,
    outbox: [outboxEntry],
    pendingMutationCount: 1,
    outboxSequence: 1,
    highWatermark: 1,
  });
  const beforeSync = readCanonicalEnvelope(STORAGE_KEYS.ACCOUNT_SYNC, (value): value is AccountSyncState => isCanonicalAccountSyncState(value));
  assert.ok(beforeSync);
  const afterSyncState = Object.freeze({ ...beforeSyncState, status: "offlinePending" as const, blockingConflictCode: null, syncConflict: null });
  const record = await buildMutationJournal({
    operation: "resolve_account_sync_conflict",
    conflictId: CONFLICT_ID,
    trackId: TRACK,
    identity: "focused-precondition-conflict-test",
    createdAt: NOW,
    writes: [{ kind: "resolve_account_sync_conflict", record: {
      conflictId: CONFLICT_ID,
      accountId: ACCOUNT,
      profileId: PROFILE,
      trackId: TRACK,
      resolution: "keep_local",
      expectedGoalRevision: null,
      expectedPlanStorageRevision: null,
      expectedSyncStateRevision: beforeSync.revision,
      afterGoalRevision: null,
      afterPlanStorageRevision: null,
      beforeGoal: null,
      beforePlan: null,
      beforeSyncState: beforeSync,
      afterGoal: null,
      afterPlan: null,
      afterSyncState,
    } }],
  });
  await persistMutationJournal(record);
  const goalBefore = storage.getString(STORAGE_KEYS.goal(TRACK));
  const planBefore = storage.getString(STORAGE_KEYS.learningPlan(TRACK));
  const journalBefore = storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL);

  assert.throws(() => readGoalPlanAcceptancePrecondition(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  assert.equal(storage.getString(STORAGE_KEYS.goal(TRACK)), goalBefore);
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), planBefore);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), journalBefore);
  assert.equal((await getActiveMutationJournal())?.operation, "resolve_account_sync_conflict");
});
