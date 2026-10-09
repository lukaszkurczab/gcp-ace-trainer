import assert from "node:assert/strict";
import test from "node:test";

import { LearningPlanEditorCoordinator, type LearningPlanEditorDependencies } from "./LearningPlanEditorCoordinator";
import type { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { createDefaultGoal, createProposalSlotId, normalizeLearningPlan, type GoalSnapshot, type LearningPlan, type LearningPlanPolicyIdentity, type ProposalOutcome } from "../../domain";
import { getKeyValueStorage, installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { getGoalSnapshot, getLearningPlanSnapshot, saveGoalSnapshot, saveLearningPlanAtomically, type LearningPlanSnapshot } from "../../storage/repositories";
import { goalPlanAcceptanceGoalRevision, readGoalPlanAcceptancePrecondition } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { LearningPlanMutationRuntimeCore } from "./learningPlanMutationRuntimeCore";
import type { PracticeReminderCopy } from "../notificationPreferences";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const OTHER_TRACK_ID = "google-cloud-associate-cloud-engineer";
const ARTIFACT_SHA256 = "a".repeat(64);
const PLANNING_POLICY_IDENTITY: LearningPlanPolicyIdentity = { contentVersion: "content-v1", artifactSha256: "b".repeat(64), policyVersion: "policy-v1" };

function proposal(goal: GoalSnapshot): ProposalOutcome {
  return {
    kind: "ready",
    identity: { trackId: TRACK_ID, goalRevision: goal.revision, contentVersion: "content-v1", artifactSha256: ARTIFACT_SHA256, planningPolicyIdentity: PLANNING_POLICY_IDENTITY, timezone: "Europe/Warsaw" },
    goal: goal.record,
    minutesPerStudyDay: 60,
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "coding-interview-guided-practice", requestedLength: 10 } },
    nextSession: { kind: "practice", modeId: "coding-interview-guided-practice", requestedLength: 10 },
    diagnosisStatus: "not_available",
    primaryModeId: "coding-interview-guided-practice",
    requestedLength: 10,
    sessionCapacity: { kind: "exact", actualLength: 10 },
    completionState: { kind: "unknown" },
    materialPriority: { kind: "package_primary_scope", label: "Core" },
    targetAssessment: { kind: "open_ended" },
    slots: [
      { slotId: createProposalSlotId("proposal-slot:v1:mon:18-00"), day: "mon", localTime: "18:00", sessionLength: 10 },
      { slotId: createProposalSlotId("proposal-slot:v1:wed:18-00"), day: "wed", localTime: "18:00", sessionLength: 10 },
    ],
  };
}

async function fixture() {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const goal = Object.freeze({ record: createDefaultGoal(TRACK_ID), revision: 1 });
  await saveGoalSnapshot(goal.record, null);
  let currentGoal: GoalSnapshot | null = goal;
  let currentPlan: LearningPlanSnapshot | null = null;
  let sequence = 0;
  let removed = false;
  let saveCount = 0;
  let uncertainSave = false;
  let resolveGate: (() => void) | null = null;
  let resolutionGate: Promise<void> | null = null;
  let contentContext: { contentVersion: string; artifactSha256: string; planningPolicyIdentity: LearningPlanPolicyIdentity; timezone: string } = { contentVersion: "content-v1", artifactSha256: ARTIFACT_SHA256, planningPolicyIdentity: PLANNING_POLICY_IDENTITY, timezone: "Europe/Warsaw" };
  let outcome = proposal(goal);
  let proposalId = "proposal:one";
  const proposalCoordinator = {
    resolve: async (requestedProposalId: string, requestedTrackId: string) => {
      if (resolutionGate) await resolutionGate;
      return removed || requestedTrackId !== TRACK_ID || requestedProposalId !== proposalId
        ? { kind: "stale" as const }
        : { kind: "ready" as const, proposal: { proposalId, trackId: TRACK_ID, outcome } };
    },
    resolveForCommit: (requestedProposalId: string, requestedTrackId: string) => removed || requestedTrackId !== TRACK_ID || requestedProposalId !== proposalId
      ? { kind: "stale" as const } : { kind: "ready" as const, proposal: { proposalId, trackId: TRACK_ID, outcome } },
    updateSchedule: (_requestedProposalId: string, _requestedTrackId: string, slots: ProposalOutcome["slots"]) => { outcome = { ...outcome, slots }; return true; },
    remove: () => { removed = true; },
  } as unknown as LearningPlanProposalCoordinator;
  const dependencies: LearningPlanEditorDependencies = {
    proposalCoordinator,
    readStorageScope: getKeyValueStorage,
    readGoalSnapshot: () => currentGoal,
    peekContentContext: () => contentContext,
    loadGoalSnapshot: async () => currentGoal,
    loadLearningPlanSnapshot: () => currentPlan,
    loadContentContext: async () => contentContext,
    saveLearningPlan: (input) => {
      saveCount += 1;
      const saved = saveLearningPlanAtomically(input);
      currentPlan = saved;
      if (uncertainSave) {
        uncertainSave = false;
        throw new Error("response lost after write");
      }
      return saved;
    },
    acceptGoalPlan: async (input) => {
      input.revalidate();
      const before = readGoalPlanAcceptancePrecondition(TRACK_ID);
      if ((before.goal?.revision ?? null) !== input.expectedGoalRevision || (before.plan?.revision ?? null) !== input.expectedPlanStorageRevision) throw new Error("stale pair");
      saveCount += 1;
      const goalRevision = goalPlanAcceptanceGoalRevision(input.expectedGoalRevision, before.goal, input.proposedGoal);
      const nextGoal = goalRevision === (currentGoal?.revision ?? 0)
        ? currentGoal!
        : await saveGoalSnapshot(input.proposedGoal, input.expectedGoalRevision);
      const nextPlan = normalizeLearningPlan({ ...input.plan, goalRevision, planRevision: (currentPlan?.revision ?? 0) + 1, status: "accepted" });
      const savedPlan = saveLearningPlanAtomically({ plan: nextPlan, expectedGoalRevision: goalRevision, expectedPlanStorageRevision: input.expectedPlanStorageRevision });
      currentGoal = nextGoal;
      currentPlan = savedPlan;
      if (uncertainSave) { uncertainSave = false; throw new Error("response lost after pair commit"); }
      return Object.freeze({ goal: nextGoal, plan: savedPlan });
    },
    createEditorId: () => `editor-${++sequence}`,
    now: () => "2027-01-01T10:00:00.000Z",
  };
  return {
    coordinator: new LearningPlanEditorCoordinator(dependencies),
    goal,
    getGoal: () => currentGoal,
    outcome,
    getPlan: () => currentPlan,
    getOutcome: () => outcome,
    setGoal: (value: GoalSnapshot | null) => { currentGoal = value; },
    setPlan: (value: LearningPlanSnapshot | null) => { currentPlan = value; },
    setContentContext: (value: typeof contentContext) => { contentContext = value; },
    setUncertainSave: (value: boolean) => { uncertainSave = value; },
    saveCount: () => saveCount,
    restoreProposal: (nextProposalId = "proposal:replacement") => {
      proposalId = nextProposalId;
      removed = false;
      if (currentGoal) outcome = { ...outcome, identity: { ...outcome.identity, goalRevision: currentGoal.revision }, goal: currentGoal.record };
    },
    replaceProposal: (nextProposalId: string, nextOutcome: ProposalOutcome) => {
      proposalId = nextProposalId;
      outcome = nextOutcome;
      removed = false;
    },
    pauseResolution: () => {
      resolutionGate = new Promise<void>((resolve) => { resolveGate = resolve; });
    },
    releaseResolution: () => {
      resolveGate?.();
      resolveGate = null;
      resolutionGate = null;
    },
  };
}

test("proposal editor preserves retained slot IDs, drops removed IDs, sorts days, and saves revision one", async () => {
  const f = await fixture();
  const started = await f.coordinator.startProposalEdit("proposal:one", TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  const monId = started.session.slots.find((slot) => slot.day === "mon")?.slotId;
  const edited = f.coordinator.updateDays(started.session.editorId, TRACK_ID, ["sun", "mon"]);
  assert.equal(edited.kind, "updated");
  if (edited.kind !== "updated") return;
  assert.deepEqual(edited.session.slots.map((slot) => slot.day), ["mon", "sun"]);
  assert.equal(edited.session.slots.find((slot) => slot.day === "mon")?.slotId, monId);
  assert.ok(edited.session.slots.find((slot) => slot.day === "sun")?.slotId.includes(started.session.editorId));
  assert.equal(edited.session.slots.some((slot) => slot.day === "wed"), false);
  assert.equal(f.coordinator.updateSlotTime(started.session.editorId, TRACK_ID, "sun", "07:05").kind, "updated");
  assert.equal(f.coordinator.updateSlotTime(started.session.editorId, TRACK_ID, "sun", "25:00").kind, "validation_error");

  const saved = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.equal(saved.kind, "staged");
  if (saved.kind !== "staged") return;
  assert.equal(f.saveCount(), 0);
  assert.deepEqual(f.getOutcome().slots.map((slot) => slot.day), ["mon", "sun"]);
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
  assert.equal(f.getPlan(), null);
});

test("accepted plan edit explicitly reads a snapshot, increments plan revision, and stale sessions do not commit", async () => {
  const f = await fixture();
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  if (accepted.kind !== "accepted") return;
  const started = await f.coordinator.startExistingEdit(TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  const stalePlan: LearningPlan = { ...accepted.snapshot.plan, commandId: "other-command", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" };
  const replaced = Object.freeze({ plan: normalizeLearningPlan(stalePlan), revision: accepted.snapshot.revision + 1 });
  f.setPlan(replaced);
  const result = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(result, { kind: "stale", reason: "plan" });
  assert.deepEqual(await f.coordinator.commit("missing", TRACK_ID), { kind: "stale", reason: "missing_session" });
});

test("direct acceptance makes an already-open proposal editor stale", async () => {
  const f = await fixture();
  const started = await f.coordinator.startProposalEdit("proposal:one", TRACK_ID);
  assert.equal(started.kind, "ready");
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  if (started.kind !== "ready") return;
  assert.equal((await f.coordinator.commit(started.session.editorId, TRACK_ID)).kind, "stale");
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID) !== null, true);
});

test("parallel proposal acceptance shares one promise and one durable save", async () => {
  const f = await fixture();
  f.pauseResolution();
  const first = f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  const second = f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.strictEqual(first, second);
  f.releaseResolution();
  const [one, two] = await Promise.all([first, second]);
  assert.deepEqual(one, two);
  assert.equal(one.kind, "accepted");
  assert.equal(f.saveCount(), 1);
  const third = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.deepEqual(third, one);
  assert.equal(f.saveCount(), 1);
});

test("parallel acceptance for one proposal across tracks never shares the in-flight success", async () => {
  const f = await fixture();
  f.pauseResolution();
  const coding = f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  const certification = f.coordinator.acceptProposal("proposal:one", OTHER_TRACK_ID);
  assert.notStrictEqual(coding, certification);
  f.releaseResolution();
  const [codingResult, certificationResult] = await Promise.all([coding, certification]);
  assert.equal(codingResult.kind, "accepted");
  assert.deepEqual(certificationResult, { kind: "stale", reason: "proposal" });
  assert.equal(f.saveCount(), 1);
});

test("accepted result cache is scoped by proposal and track identity", async () => {
  const f = await fixture();
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  const otherTrack = await f.coordinator.acceptProposal("proposal:one", OTHER_TRACK_ID);
  assert.deepEqual(otherTrack, { kind: "stale", reason: "proposal" });
  assert.equal(f.saveCount(), 1);
});

test("pending acceptance retry is scoped by proposal and track identity", async () => {
  const f = await fixture();
  f.setUncertainSave(true);
  const first = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.deepEqual(first, { kind: "storage_error" });
  const otherTrack = await f.coordinator.acceptProposal("proposal:one", OTHER_TRACK_ID);
  assert.deepEqual(otherTrack, { kind: "stale", reason: "proposal" });
  assert.equal(f.saveCount(), 1);
});

test("proposal editor stages schedule changes without writing a goal or plan", async () => {
  const f = await fixture();
  const started = await f.coordinator.startProposalEdit("proposal:one", TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  const first = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(first, { kind: "staged", proposalId: "proposal:one" });
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
  assert.equal(f.saveCount(), 0);
  assert.equal(f.getPlan(), null);
});

test("accepted-plan retry reconciles its durable command before checking refreshed content context", async () => {
  const f = await fixture();
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  const started = await f.coordinator.startExistingEdit(TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;

  f.setUncertainSave(true);
  const first = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(first, { kind: "storage_error" });
  const durableAfterUncertainty = f.getPlan();
  assert.equal(durableAfterUncertainty?.plan.commandId, started.session.commandId);

  f.setContentContext({ contentVersion: "content-v2", artifactSha256: ARTIFACT_SHA256, planningPolicyIdentity: { contentVersion: "content-v2", artifactSha256: "c".repeat(64), policyVersion: "policy-v2" }, timezone: "Europe/Warsaw" });
  const retry = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.equal(retry.kind, "saved");
  assert.equal(f.saveCount(), 2);
  assert.equal(f.getPlan()?.revision, durableAfterUncertainty?.revision);
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
});

test("a replacement proposal stages an edited schedule and increments identity only when accepted", async () => {
  const f = await fixture();
  const first = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(first.kind, "accepted");
  if (first.kind !== "accepted") return;
  f.restoreProposal("proposal:replacement");
  const started = await f.coordinator.startProposalEdit("proposal:replacement", TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  const replaced = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(replaced, { kind: "staged", proposalId: "proposal:replacement" });
  assert.equal(f.getPlan()?.plan.planRevision, first.snapshot.plan.planRevision);
  const replacement = await f.coordinator.acceptProposal("proposal:replacement", TRACK_ID);
  assert.equal(replacement.kind, "accepted");
  if (replacement.kind !== "accepted") return;
  assert.equal(replacement.snapshot.plan.planRevision, first.snapshot.plan.planRevision + 1);
  assert.equal(replacement.snapshot.plan.planId, first.snapshot.plan.planId);
  assert.equal(replacement.snapshot.plan.createdAt, first.snapshot.plan.createdAt);
});

test("a target-date replacement remains explicit and atomically updates the accepted plan identity", async () => {
  const f = await fixture();
  const first = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(first.kind, "accepted");
  if (first.kind !== "accepted") return;

  const currentGoal = await getGoalSnapshot(TRACK_ID);
  assert.ok(currentGoal);
  const changedGoal = await saveGoalSnapshot(
    { ...f.goal.record, goalType: "build_foundations", targetDate: "2027-03-31" },
    currentGoal.revision,
  );
  f.setGoal(changedGoal);

  const beforeAcceptance = f.getPlan();
  assert.equal(beforeAcceptance?.plan.planId, first.snapshot.plan.planId);
  assert.equal(beforeAcceptance?.plan.planRevision, first.snapshot.plan.planRevision);
  assert.deepEqual(beforeAcceptance?.plan.acceptedTarget, first.snapshot.plan.acceptedTarget);

  const nextOutcome: ProposalOutcome = {
    ...f.outcome,
    identity: { ...f.outcome.identity, goalRevision: changedGoal.revision },
    goal: changedGoal.record,
    targetAssessment: { kind: "minimum_volume_fits", occurrences: 20, actualLength: 10, remainingAttempts: 100 },
  };
  f.replaceProposal("proposal:target-change", nextOutcome);
  const replacement = await f.coordinator.acceptProposal("proposal:target-change", TRACK_ID);
  assert.equal(replacement.kind, "accepted");
  if (replacement.kind !== "accepted") return;

  assert.equal(replacement.snapshot.plan.planId, first.snapshot.plan.planId);
  assert.equal(replacement.snapshot.plan.planRevision, first.snapshot.plan.planRevision + 1);
  assert.equal(replacement.snapshot.plan.goalRevision, changedGoal.revision);
  assert.deepEqual(replacement.snapshot.plan.acceptedTarget, { meaning: "deadline", targetDate: "2027-03-31" });
  assert.equal(replacement.snapshot.plan.artifactSha256, first.snapshot.plan.artifactSha256);
});

test("acceptance keeps an unchanged goal revision, increments a changed goal once, and reaches reminder reconciliation", async () => {
  const f = await fixture();
  const reconciled: string[] = [];
  const copy: PracticeReminderCopy = Object.freeze({ body: "body", title: "title" });
  const runtime = new LearningPlanMutationRuntimeCore({
    acceptProposal: (proposalId, trackId) => f.coordinator.acceptProposal(proposalId, trackId),
    commit: async () => ({ kind: "storage_error" }),
    reconcile: async (_copy, expected) => {
      const identity = "goalRevision" in expected ? expected : expected.identity;
      reconciled.push(`${identity.goalRevision}:${identity.planRevision}`);
      return { kind: "synced", status: "synced", identity: {} as never, schedules: [] };
    },
    retry: async () => ({ kind: "synced", status: "synced", identity: {} as never, schedules: [] }),
  });

  const initial = await runtime.acceptProposal("proposal:one", TRACK_ID, copy);
  assert.equal(initial.kind, "plan_saved_reminders_synced");
  if (initial.kind !== "plan_saved_reminders_synced") return;
  assert.equal(initial.snapshot.plan.goalRevision, 1);
  assert.equal(initial.snapshot.revision, 1);

  const beforeChange = f.getGoal();
  assert.ok(beforeChange);
  const changedOutcome: ProposalOutcome = {
    ...f.getOutcome(),
    identity: { ...f.getOutcome().identity, goalRevision: beforeChange.revision },
    goal: { ...beforeChange.record, goalType: "build_foundations", targetDate: "2027-03-31" },
  };
  f.replaceProposal("proposal:changed-goal", changedOutcome);
  const changed = await runtime.acceptProposal("proposal:changed-goal", TRACK_ID, copy);
  assert.equal(changed.kind, "plan_saved_reminders_synced");
  if (changed.kind !== "plan_saved_reminders_synced") return;
  assert.equal(changed.snapshot.plan.goalRevision, 2);
  assert.equal(changed.snapshot.revision, 2);

  f.restoreProposal("proposal:unchanged-goal");
  const unchanged = await runtime.acceptProposal("proposal:unchanged-goal", TRACK_ID, copy);
  assert.equal(unchanged.kind, "plan_saved_reminders_synced");
  if (unchanged.kind !== "plan_saved_reminders_synced") return;
  assert.equal(unchanged.snapshot.plan.goalRevision, 2);
  assert.equal(unchanged.snapshot.plan.planRevision, 3);
  assert.equal(unchanged.snapshot.revision, 3);
  assert.deepEqual(reconciled, ["1:1", "2:2", "2:3"]);
});

test("accepted plan freshness checks content version, artifact SHA, and timezone", async () => {
  const f = await fixture();
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  if (accepted.kind !== "accepted") return;
  f.setContentContext({ contentVersion: "content-v2", artifactSha256: ARTIFACT_SHA256, planningPolicyIdentity: { contentVersion: "content-v2", artifactSha256: "c".repeat(64), policyVersion: "policy-v2" }, timezone: "Europe/Warsaw" });
  assert.deepEqual(await f.coordinator.startExistingEdit(TRACK_ID), { kind: "stale", reason: "identity" });
});
