import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultGoal, acceptedTargetFromGoal, createLearningPlanSlotId, type GoalRecord, type LearningPlan } from "../../domain";
import { GoalPlanAcceptanceRecoveryRequiredError, getActiveMutationJournal, persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { readGoalPlanAcceptancePrecondition, setGoalPlanAcceptanceProfileForTests } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { STORAGE_KEYS } from "../../storage/keys";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { buildAccountDataSnapshot } from "../../storage/repositories/accountDataRepository";
import { AccountDataFailure, JournalWriteError } from "../../storage/errors";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { recoverPendingMutation } from "./recoverPendingMutation";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { MutationCommitFailure } from "../mutationBoundary";
import { commitGoalPlanAcceptance } from "./commitGoalPlanAcceptance";
import { transitionGoalPlanStatus } from "../learningPlan/goalPlanLifecycle";

const TRACK = "coding-interview-dsa-problem-solving";
const NOW = "2026-10-08T10:00:00.000Z";
const POLICY_IDENTITY = { contentVersion: "content-v1", artifactSha256: "a".repeat(64), policyVersion: "patternly-learning-planning-v1" } as const;

async function acceptanceFixture() {
  const storage = installMemoryStorage();
  setGoalPlanAcceptanceProfileForTests("guest-test-profile");
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, {
    installationId: "123e4567-e89b-42d3-a456-426614174000",
    localDatasetId: "123e4567-e89b-42d3-a456-426614174001",
    bindingState: "guest", accountId: null,
  });
  const previousGoal = createDefaultGoal(TRACK);
  const beforeGoal = writeCanonicalJson(STORAGE_KEYS.goal(TRACK), previousGoal, null);
  const goal: GoalRecord = { ...previousGoal, preferredDays: ["tue", "thu"], weeklySessionTarget: 2, targetDate: "2026-12-01" };
  const plan: LearningPlan = {
    schemaVersion: 2, minutesPerStudyDay: 25, executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "certification-focus-practice", requestedLength: 10 } }, planningPolicyIdentity: POLICY_IDENTITY, planId: "proposal-plan", trackId: TRACK, goalRevision: 2, status: "accepted",
    timezone: "Europe/Warsaw", contentVersion: "content-v1", artifactSha256: "a".repeat(64), acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: NOW, updatedAt: NOW, planRevision: 1, commandId: "proposal-command",
    slots: [{ slotId: createLearningPlanSlotId("slot-tue"), day: "tue", localTime: "18:00", sessionLength: 10 }],
  };
  const record = await buildMutationJournal({
    operation: "accept_goal_plan", proposalId: "proposal-1", trackId: TRACK, identity: [goal, plan], createdAt: NOW,
    writes: [{ kind: "accept_goal_plan", record: {
      proposalId: "proposal-1", profileId: "guest-test-profile", trackId: TRACK, expectedGoalRevision: beforeGoal.revision,
      expectedPlanStorageRevision: null, beforeGoal, beforePlan: null, goal, plan,
    } }],
  });
  return { storage, record };
}

test("goal-plan acceptance recovery blocks readers and sync-visible half-pairs until roll-forward completes", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  assert.throws(() => readGoalPlanAcceptancePrecondition(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  assert.equal(JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!).revision, 1);
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.learningPlan(TRACK) });
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.operation, "accept_goal_plan");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  assert.throws(() => getLearningPlanSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  await assert.rejects(() => buildAccountDataSnapshot(), (error: unknown) => error instanceof AccountDataFailure && error.code === "journal_recovery_required");

  storage.setFailurePlan(null);
  await recoverPendingMutation();
  const goal = readGoalSnapshot(TRACK);
  const plan = getLearningPlanSnapshot(TRACK);
  assert.equal(goal?.record.targetDate, "2026-12-01");
  assert.equal(goal?.revision, 2);
  assert.equal(plan?.plan.goalRevision, goal?.revision);
  assert.equal(plan?.plan.schemaVersion, 2);
  if (plan?.plan.schemaVersion === 2) assert.equal(plan.plan.minutesPerStudyDay, 25);
  const goalRevision = goal?.revision;
  const planRevision = plan?.revision;
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK)?.revision, goalRevision);
  assert.equal(getLearningPlanSnapshot(TRACK)?.revision, planRevision);
  assert.equal(await getActiveMutationJournal(), null);
});

test("a plan-only replacement preserves the unchanged goal revision through journal recovery", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  setGoalPlanAcceptanceProfileForTests("guest-test-profile");
  const pair = record.writes[0];
  assert.equal(pair?.kind, "accept_goal_plan");
  if (pair?.kind !== "accept_goal_plan" || !pair.record.beforeGoal) throw new Error("Missing goal-plan pair fixture.");
  const goal = pair.record.beforeGoal.payload;
  const sameGoalPlan: LearningPlan = { ...pair.record.plan, goalRevision: pair.record.beforeGoal.revision, acceptedTarget: acceptedTargetFromGoal(goal) };
  const sameGoalRecord = await buildMutationJournal({
    operation: "accept_goal_plan", proposalId: "same-goal-proposal", trackId: TRACK, identity: "same-goal-fingerprint", createdAt: NOW,
    writes: [{ kind: "accept_goal_plan", record: { ...pair.record, proposalId: "same-goal-proposal", goal, plan: sameGoalPlan } }],
  });
  await persistMutationJournal(sameGoalRecord);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.learningPlan(TRACK) });
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.operation, "accept_goal_plan");
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK)?.revision, pair.record.beforeGoal.revision);
  const savedPlan = getLearningPlanSnapshot(TRACK);
  assert.equal(savedPlan?.plan.goalRevision, pair.record.beforeGoal.revision);
  assert.equal(savedPlan?.revision, 1);
  assert.equal(await getActiveMutationJournal(), null);
});

test("goal-plan acceptance rejects mismatched target before writing journal or changing either record", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const storage = installMemoryStorage();
  setGoalPlanAcceptanceProfileForTests("guest-test-profile");
  const goal = createDefaultGoal(TRACK);
  const beforeGoal = writeCanonicalJson(STORAGE_KEYS.goal(TRACK), goal, null);
  const mismatchedGoal = { ...goal, goalType: "build_foundations" as const, targetDate: "2026-12-01" };
  const plan: LearningPlan = {
    schemaVersion: 2, minutesPerStudyDay: 25, executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "certification-focus-practice", requestedLength: 10 } }, planningPolicyIdentity: POLICY_IDENTITY, planId: "proposal-plan", trackId: TRACK, goalRevision: 2, status: "accepted",
    timezone: "Europe/Warsaw", contentVersion: "content-v1", artifactSha256: "a".repeat(64), acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: NOW, updatedAt: NOW, planRevision: 1, commandId: "proposal-command",
    slots: [{ slotId: createLearningPlanSlotId("slot-tue"), day: "tue", localTime: "18:00", sessionLength: 10 }],
  };
  await assert.rejects(() => commitGoalPlanAcceptance({
    proposalId: "proposal-mismatch", trackId: TRACK, proposedGoal: mismatchedGoal, plan,
    expectedGoalRevision: beforeGoal.revision, expectedPlanStorageRevision: null,
    identity: "proposal-fingerprint", createdAt: NOW, revalidate() {},
  }), /target must match/u);
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual(readGoalSnapshot(TRACK)?.record, goal);
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
});

test("a third-state goal envelope is never overwritten and leaves readers blocked", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  const pairWrite = record.writes[0];
  assert.equal(pairWrite?.kind, "accept_goal_plan");
  if (pairWrite?.kind !== "accept_goal_plan") throw new Error("Missing pair write fixture.");
  const thirdState = { ...pairWrite.record.goal, preferredDays: ["fri" as const], weeklySessionTarget: 1, targetDate: "2027-01-01" };
  writeCanonicalJson(STORAGE_KEYS.goal(TRACK), thirdState);
  const thirdRevision = JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!).revision as number;
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  const retainedThirdState = JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!);
  assert.equal(retainedThirdState.revision, thirdRevision);
  assert.equal(retainedThirdState.payload.targetDate, "2027-01-01");
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
  assert.equal((await getActiveMutationJournal())?.operation, "accept_goal_plan");
});

test("a failed journal phase write after both records materialize replays without extra revisions", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 });
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.status, "journal_durable");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  const goalRevision = JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!).revision as number;
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK)?.revision, goalRevision);
  assert.equal((await getActiveMutationJournal()), null);
});

test("a failed pair readback retains intent and blocks account snapshot until retry verifies", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  const readsBefore = storage.operations.filter((operation) => operation.kind === "read").length;
  // Recovery reads the journal, both before envelopes, then both exact after envelopes.
  storage.setFailurePlan({ kind: "fail_on_read_number", readNumber: readsBefore + 5 });
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.status, "journal_durable");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  await assert.rejects(() => buildAccountDataSnapshot(), (error: unknown) => error instanceof AccountDataFailure && error.code === "journal_recovery_required");
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  const goal = readGoalSnapshot(TRACK);
  const plan = getLearningPlanSnapshot(TRACK);
  assert.equal(plan?.plan.goalRevision, goal?.revision);
  assert.equal(await getActiveMutationJournal(), null);
});

test("stale goal CAS refuses journal intent and preserves the intervening value", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  const pairWrite = record.writes[0];
  assert.equal(pairWrite?.kind, "accept_goal_plan");
  if (pairWrite?.kind !== "accept_goal_plan") throw new Error("Missing pair write fixture.");
  const changedGoal = { ...pairWrite.record.goal, preferredDays: ["fri" as const], weeklySessionTarget: 1 };
  writeCanonicalJson(STORAGE_KEYS.goal(TRACK), changedGoal);
  const before = storage.snapshot();
  await assert.rejects(() => persistMutationJournal(record), JournalWriteError);
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual(storage.snapshot(), before);
  assert.deepEqual(readGoalSnapshot(TRACK)?.record, changedGoal);
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
});

test("recovery is pinned to the originating profile and resumes only after that profile returns", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  setGoalPlanAcceptanceProfileForTests("different-profile");
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.operation, "accept_goal_plan");
  assert.equal(JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!).revision, 1);
  assert.equal(storage.getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
  setGoalPlanAcceptanceProfileForTests("guest-test-profile");
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK)?.revision, 2);
  assert.equal(getLearningPlanSnapshot(TRACK)?.plan.goalRevision, 2);
  assert.equal(await getActiveMutationJournal(), null);
});

test("pair intent excludes competing journal operations and clear failure retries without duplicate writes", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const { storage, record } = await acceptanceFixture();
  await persistMutationJournal(record);
  const competing = await buildMutationJournal({
    operation: "reset_learning_state", sessionId: "learning-state-reset", trackId: TRACK,
    identity: "other-command", createdAt: NOW, writes: [{ kind: "clear_learning_state" }],
  });
  await assert.rejects(() => persistMutationJournal(competing), JournalWriteError);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(() => recoverPendingMutation(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "journal_clear");
  assert.equal((await getActiveMutationJournal())?.status, "verified_pending_clear");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  const goalRevision = JSON.parse(storage.getString(STORAGE_KEYS.goal(TRACK))!).revision as number;
  const planRevision = JSON.parse(storage.getString(STORAGE_KEYS.learningPlan(TRACK))!).revision as number;
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK)?.revision, goalRevision);
  assert.equal(getLearningPlanSnapshot(TRACK)?.revision, planRevision);
  assert.equal(await getActiveMutationJournal(), null);
});

test("pause/resume rejects completed plan without changing the pair", async (t) => {
  t.after(() => setGoalPlanAcceptanceProfileForTests(null));
  const storage = installMemoryStorage();
  setGoalPlanAcceptanceProfileForTests("guest-test-profile");
  const goal = createDefaultGoal(TRACK);
  const goalEnvelope = writeCanonicalJson(STORAGE_KEYS.goal(TRACK), goal, null);
  const plan: LearningPlan = {
    schemaVersion: 2, minutesPerStudyDay: 25,
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "coding-interview-guided-practice", requestedLength: 10 } }, planningPolicyIdentity: POLICY_IDENTITY,
    planId: "completed-plan", trackId: TRACK, goalRevision: goalEnvelope.revision, status: "completed",
    timezone: "Europe/Warsaw", contentVersion: "content-v1", artifactSha256: "d".repeat(64), acceptedTarget: acceptedTargetFromGoal(goal),
    createdAt: NOW, updatedAt: NOW, planRevision: 1, commandId: "completed-command",
    slots: [{ slotId: createLearningPlanSlotId("completed-slot"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  };
  writeCanonicalJson(STORAGE_KEYS.learningPlan(TRACK), plan, null);
  const before = storage.snapshot();
  await assert.rejects(() => transitionGoalPlanStatus(TRACK, "2026-10-08T13:00:00.000Z"), /completed/u);
  assert.deepEqual(storage.snapshot(), before);
  assert.equal(await getActiveMutationJournal(), null);
});
