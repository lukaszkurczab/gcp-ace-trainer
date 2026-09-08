import assert from "node:assert/strict";
import test from "node:test";

import { LearningPlanEditorCoordinator, type LearningPlanEditorDependencies } from "./LearningPlanEditorCoordinator";
import type { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { createDefaultGoal, createProposalSlotId, type GoalSnapshot, type LearningPlan, type ProposalOutcome } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { getGoalSnapshot, getLearningPlanSnapshot, saveGoalSnapshot, saveLearningPlanAtomically, type LearningPlanSnapshot } from "../../storage/repositories";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const OTHER_TRACK_ID = "google-cloud-associate-cloud-engineer";

function proposal(goal: GoalSnapshot): ProposalOutcome {
  return {
    kind: "ready",
    identity: { trackId: TRACK_ID, goalRevision: goal.revision, contentVersion: "content-v1", packagePin: TEST_CONTENT_PACKAGE_PIN, timezone: "Europe/Warsaw" },
    goal: goal.record,
    primaryModeId: "guided",
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
  let contentContext = { contentVersion: "content-v1", contentPackagePin: TEST_CONTENT_PACKAGE_PIN, timezone: "Europe/Warsaw" };
  const outcome = proposal(goal);
  const proposalResult = { kind: "ready" as const, proposal: { proposalId: "proposal:one", trackId: TRACK_ID, outcome } };
  const proposalCoordinator = {
    resolve: async (_proposalId: string, requestedTrackId: string) => {
      if (resolutionGate) await resolutionGate;
      return removed || requestedTrackId !== TRACK_ID ? { kind: "stale" as const } : proposalResult;
    },
    remove: () => { removed = true; },
  } as unknown as LearningPlanProposalCoordinator;
  const dependencies: LearningPlanEditorDependencies = {
    proposalCoordinator,
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
    createEditorId: () => `editor-${++sequence}`,
    now: () => "2027-01-01T10:00:00.000Z",
  };
  return {
    coordinator: new LearningPlanEditorCoordinator(dependencies),
    goal,
    outcome,
    getPlan: () => currentPlan,
    setGoal: (value: GoalSnapshot | null) => { currentGoal = value; },
    setPlan: (value: LearningPlanSnapshot | null) => { currentPlan = value; },
    setContentContext: (value: typeof contentContext) => { contentContext = value; },
    setUncertainSave: (value: boolean) => { uncertainSave = value; },
    saveCount: () => saveCount,
    restoreProposal: () => { removed = false; },
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
  assert.equal(saved.kind, "saved");
  if (saved.kind !== "saved") return;
  assert.equal(saved.snapshot.plan.planRevision, 1);
  assert.equal(saved.snapshot.plan.slots.length, 2);
  assert.equal(saved.snapshot.plan.slots[1]?.localTime, "07:05");
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
  assert.equal(f.getPlan()?.plan.commandId, `learning-plan:${started.session.editorId}:commit`);
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
  const replaced = saveLearningPlanAtomically({ plan: stalePlan, expectedGoalRevision: 1, expectedPlanStorageRevision: accepted.snapshot.revision });
  f.setPlan(replaced);
  const result = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(result, { kind: "stale", reason: "plan" });
  assert.deepEqual(await f.coordinator.commit("missing", TRACK_ID), { kind: "stale", reason: "missing_session" });
});

test("direct accept and proposal editor share plan CAS and retry after idempotent success", async () => {
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

test("storage uncertainty keeps the editor session and retries through durable command reconciliation", async () => {
  const f = await fixture();
  const started = await f.coordinator.startProposalEdit("proposal:one", TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  f.setUncertainSave(true);
  const first = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.deepEqual(first, { kind: "storage_error" });
  assert.notEqual(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
  const retry = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.equal(retry.kind, "saved");
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
  assert.equal(f.saveCount(), 2);
  assert.equal(f.getPlan()?.revision, 1);
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

  f.setContentContext({ contentVersion: "content-v2", contentPackagePin: TEST_CONTENT_PACKAGE_PIN, timezone: "Europe/Warsaw" });
  const retry = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.equal(retry.kind, "saved");
  assert.equal(f.saveCount(), 3);
  assert.equal(f.getPlan()?.revision, durableAfterUncertainty?.revision);
  assert.equal(f.coordinator.getSession(started.session.editorId, TRACK_ID), null);
});

test("a replacement proposal keeps plan identity and increments plan revision", async () => {
  const f = await fixture();
  const first = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(first.kind, "accepted");
  if (first.kind !== "accepted") return;
  f.restoreProposal();
  const started = await f.coordinator.startProposalEdit("proposal:one", TRACK_ID);
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready") return;
  const replaced = await f.coordinator.commit(started.session.editorId, TRACK_ID);
  assert.equal(replaced.kind, "saved");
  if (replaced.kind !== "saved") return;
  assert.equal(replaced.snapshot.plan.planRevision, first.snapshot.plan.planRevision + 1);
  assert.equal(replaced.snapshot.plan.planId, first.snapshot.plan.planId);
  assert.equal(replaced.snapshot.plan.createdAt, first.snapshot.plan.createdAt);
});

test("accepted plan freshness checks content version, full package pin, and timezone", async () => {
  const f = await fixture();
  const accepted = await f.coordinator.acceptProposal("proposal:one", TRACK_ID);
  assert.equal(accepted.kind, "accepted");
  if (accepted.kind !== "accepted") return;
  f.setContentContext({ contentVersion: "content-v2", contentPackagePin: TEST_CONTENT_PACKAGE_PIN, timezone: "Europe/Warsaw" });
  assert.deepEqual(await f.coordinator.startExistingEdit(TRACK_ID), { kind: "stale", reason: "identity" });
});
