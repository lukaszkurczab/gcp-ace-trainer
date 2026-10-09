import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { acceptedTargetFromGoal, createDefaultGoal, createLearningPlanSlotId, type LearningPlan } from "../../domain";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { getActiveMutationJournal, persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { recoverPendingMutation } from "./recoverPendingMutation";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { transitionGoalPlanStatus } from "../learningPlan/goalPlanLifecycle";
import { GoalPlanAcceptanceRecoveryRequiredError } from "../../storage/repositories/mutationJournalRepository";
import { MutationCommitFailure } from "../mutationBoundary";
import { commitGoalPlanAcceptance } from "./commitGoalPlanAcceptance";
import { buildAccountDataSnapshot } from "../../storage/repositories/accountDataRepository";
import { AccountDataFailure } from "../../storage/errors";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { STORAGE_KEYS } from "../../storage/keys";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import {
  activatePreparedProfile,
  closeActiveProfileStorage,
  getActiveStorageProfile,
  getKeyValueStorage,
  installKeyValueStorageForTests,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
} from "../../infrastructure/storage/mmkvClient";

const TRACK = "coding-interview-dsa-problem-solving";
const GUEST_ID = "00000000-0000-4000-8000-000000000131";
const ACCOUNT_ID = "00000000-0000-4000-8000-000000000132";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000133";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

afterEach(() => {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installGuestTestMemory();
});

function installGuestTestMemory() {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
}

test("a pending pair is isolated by the real profile router and resumes in its pinned guest profile", async () => {
  closeActiveProfileStorage();
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const newDatasetIds = [GUEST_ID, ACCOUNT_ID];
  let nextDatasetId = 0;
  const identity = { async create() { return { installationId: INSTALLATION_ID, localDatasetId: newDatasetIds[nextDatasetId++] ?? "00000000-0000-4000-8000-000000000134" }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  const guestProfile = await prepareProfileStorage();
  activatePreparedProfile(guestProfile.id, guestProfile.kind);

  const activeProfile = getActiveStorageProfile();
  const activeStorage = getKeyValueStorage();
  const beforeGoal = writeCanonicalJson(STORAGE_KEYS.goal(TRACK), createDefaultGoal(TRACK), null);
  const proposedGoal = { ...createDefaultGoal(TRACK), preferredDays: ["tue" as const], weeklySessionTarget: 1, targetDate: "2026-11-01" };
  const plan: LearningPlan = {
    schemaVersion: 2, minutesPerStudyDay: 25, executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "certification-focus-practice", requestedLength: 10 } }, planningPolicyIdentity: { contentVersion: "content-v1", artifactSha256: "a".repeat(64), policyVersion: "patternly-learning-planning-v1" }, planId: "router-plan", trackId: TRACK, goalRevision: 2, status: "accepted",
    timezone: "Europe/Warsaw", contentVersion: "content-v1", artifactSha256: "b".repeat(64), acceptedTarget: acceptedTargetFromGoal(proposedGoal),
    createdAt: "2026-10-08T12:00:00.000Z", updatedAt: "2026-10-08T12:00:00.000Z", planRevision: 1, commandId: "router-command",
    slots: [{ slotId: createLearningPlanSlotId("router-slot"), day: "tue", localTime: "18:00", sessionLength: 10 }],
  };
  const record = await buildMutationJournal({
    operation: "accept_goal_plan", proposalId: "router-proposal", trackId: TRACK, identity: "router-profile-pair", createdAt: "2026-10-08T12:00:00.000Z",
    writes: [{ kind: "accept_goal_plan", record: { proposalId: "router-proposal", profileId: activeProfile.id, trackId: TRACK, expectedGoalRevision: beforeGoal.revision,
      expectedPlanStorageRevision: null, beforeGoal, beforePlan: null, goal: proposedGoal, plan } }],
  });
  await persistMutationJournal(record);
  assert.equal(activeStorage.getString(STORAGE_KEYS.ACTIVE_JOURNAL) !== undefined, true);

  await router.selectAccount(ACCOUNT_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  const accountProfile = await prepareProfileStorage();
  activatePreparedProfile(accountProfile.id, accountProfile.kind);
  assert.equal(getActiveStorageProfile().kind, "account");
  assert.notEqual(getActiveStorageProfile().id, activeProfile.id);
  await recoverPendingMutation();
  assert.equal(readGoalSnapshot(TRACK), null);
  assert.equal(getLearningPlanSnapshot(TRACK), null);

  await router.selectExistingGuest(GUEST_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  const returningGuestProfile = await prepareProfileStorage();
  activatePreparedProfile(returningGuestProfile.id, returningGuestProfile.kind);
  await recoverPendingMutation();
  const goal = readGoalSnapshot(TRACK);
  const acceptedPlan = getLearningPlanSnapshot(TRACK);
  assert.equal(goal?.revision, 2);
  assert.equal(goal?.record.targetDate, "2026-11-01");
  assert.equal(acceptedPlan?.plan.goalRevision, goal?.revision);
  assert.equal(await getActiveMutationJournal(), null);

  base.setFailurePlan({ kind: "fail_on_key_write", key: `patternly:profile:v1:${activeProfile.id}:${encodeURIComponent(STORAGE_KEYS.learningPlan(TRACK))}` });
  await assert.rejects(() => transitionGoalPlanStatus(TRACK, "2026-10-08T13:00:00.000Z"), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization");
  assert.equal((await getActiveMutationJournal())?.operation, "accept_goal_plan");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  base.setFailurePlan(null);
  await recoverPendingMutation();
  const pausedGoal = readGoalSnapshot(TRACK);
  const pausedPlan = getLearningPlanSnapshot(TRACK);
  assert.equal(pausedGoal?.record.status, "paused");
  assert.equal(pausedPlan?.plan.status, "paused");
  assert.equal(pausedPlan?.plan.goalRevision, pausedGoal?.revision);

  const resumed = await transitionGoalPlanStatus(TRACK, "2026-10-08T14:00:00.000Z");
  assert.equal(resumed.goal.record.status, "active");
  assert.equal(resumed.plan.plan.status, "accepted");
  assert.equal(resumed.plan.plan.goalRevision, resumed.goal.revision);
  assert.equal(await getActiveMutationJournal(), null);
});

test("the actual acceptance path can stop after exact Goal readback and recover its durable pair", async () => {
  closeActiveProfileStorage();
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const identity = { async create() { return { installationId: INSTALLATION_ID, localDatasetId: GUEST_ID }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  const proposedGoal = { ...createDefaultGoal(TRACK), preferredDays: ["tue" as const], weeklySessionTarget: 1, targetDate: "2026-11-01" };
  const proposedPlan: LearningPlan = {
    schemaVersion: 2, minutesPerStudyDay: 25,
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "certification-focus-practice", requestedLength: 10 } },
    planningPolicyIdentity: { contentVersion: "content-v1", artifactSha256: "a".repeat(64), policyVersion: "patternly-learning-planning-v1" },
    planId: "interruption-plan", trackId: TRACK, goalRevision: 1, status: "accepted", timezone: "Europe/Warsaw",
    contentVersion: "content-v1", artifactSha256: "a".repeat(64), acceptedTarget: acceptedTargetFromGoal(proposedGoal),
    createdAt: "2026-10-09T12:00:00.000Z", updatedAt: "2026-10-09T12:00:00.000Z", planRevision: 1,
    commandId: "interruption-command", slots: [{ slotId: createLearningPlanSlotId("interruption-slot"), day: "tue", localTime: "18:00", sessionLength: 10 }],
  };
  let callbackCount = 0;
  await assert.rejects(() => commitGoalPlanAcceptance({
    proposalId: "interruption-proposal", trackId: TRACK, proposedGoal, plan: proposedPlan,
    expectedGoalRevision: null, expectedPlanStorageRevision: null, identity: "interruption-fingerprint",
    createdAt: proposedPlan.updatedAt, revalidate() {},
    beforePlanWrite: (context) => {
      callbackCount += 1;
      assert.equal(context.journal.operation, "accept_goal_plan");
      assert.equal(context.journal.proposalId, "interruption-proposal");
      assert.equal(context.journal.status, "journal_durable");
      assert.equal(context.record.cause, "proposal_acceptance");
      const decodedJournal = JSON.parse(JSON.stringify(context.journal)) as typeof context.journal;
      const decodedPair = decodedJournal.writes[0];
      assert.equal(decodedPair?.kind, "accept_goal_plan");
      if (decodedPair?.kind !== "accept_goal_plan") throw new Error("Expected the durable goal-plan pair.");
      assert.notEqual(context.record, decodedPair.record, "materialization context and re-decoded durable journal have separate object graphs");
      assert.equal(canonicalSerialize(context.record), canonicalSerialize(decodedPair.record), "the exact immutable pair record survives JSON decode");
      assert.notEqual(canonicalSerialize(context.record), canonicalSerialize({ ...decodedPair.record, plan: { ...decodedPair.record.plan, planRevision: 2 } }),
        "a changed immutable record must fail the exact canonical comparison");
      assert.equal(context.record.beforeGoal, null);
      assert.equal(context.record.beforePlan, null);
      assert.equal(context.goalEnvelope?.revision, 1);
      assert.deepEqual(context.goalEnvelope?.payload, proposedGoal);
      assert.equal(context.planEnvelope, null);
      throw new Error("controlled interruption after exact goal readback");
    },
  }), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization" && error.durableState === "journal_durable");
  assert.equal(callbackCount, 1);
  assert.equal((await getActiveMutationJournal())?.status, "journal_durable");
  assert.throws(() => readGoalSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  assert.throws(() => getLearningPlanSnapshot(TRACK), GoalPlanAcceptanceRecoveryRequiredError);
  await assert.rejects(() => buildAccountDataSnapshot(), (error: unknown) => error instanceof AccountDataFailure && error.code === "journal_recovery_required");
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.learningPlan(TRACK)), undefined);
  await recoverPendingMutation();
  const goal = readGoalSnapshot(TRACK);
  const plan = getLearningPlanSnapshot(TRACK);
  assert.deepEqual(goal?.record, proposedGoal);
  assert.deepEqual(plan?.plan, { ...proposedPlan, goalRevision: goal?.revision });
  assert.equal(plan?.plan.goalRevision, goal?.revision);
  assert.equal(await getActiveMutationJournal(), null);
});
