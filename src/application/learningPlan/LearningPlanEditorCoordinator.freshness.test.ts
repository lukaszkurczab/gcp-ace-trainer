import assert from "node:assert/strict";
import test from "node:test";
import { LearningPlanEditorCoordinator } from "./LearningPlanEditorCoordinator";
import { LearningPlanMutationRuntimeCore } from "./learningPlanMutationRuntimeCore";
import { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { createDefaultGoal, normalizeLearningPlan, type TrainingAttempt } from "../../domain";
import { activatePreparedProfile, closeActiveProfileStorage, installKeyValueStorageForTests, MemoryKeyValueStorage, prepareProfileStorage, selectPreparedAccountProfile, setProfileStoragePreparationFactoryForTests } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { addTrainingAttempt, getGoalSnapshot, getLearningPlanSnapshot, saveGoalSnapshot, saveLearningPlanAtomically } from "../../storage/repositories";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { goalPlanAcceptanceGoalRevision, readGoalPlanAcceptancePrecondition } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { readLearningPlanInputSnapshot, readLearningPlanStorageScope } from "../../storage/repositories/learningPlanInputSnapshot";

const TRACK = "google-cloud-associate-cloud-engineer";
async function fixture(initialize = true) {
  if (initialize) installKeyValueStorageForTests(new MemoryKeyValueStorage());
  if (!readGoalSnapshot(TRACK)) await saveGoalSnapshot(createDefaultGoal(TRACK), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, "certification");
  if (!resolved.planningPolicyIdentity) throw new Error("The test track must resolve an exact planning policy identity.");
  const planningPolicyIdentity = resolved.planningPolicyIdentity;
  let now = "2026-10-02T12:00:00.000Z";
  let clockHook: (() => void) | null = null;
  let goalReadHook: (() => Promise<void>) | null = null;
  let saveCount = 0;
  let uncertain = false;
  let seq = 0;
  const proposals = new LearningPlanProposalCoordinator({
    createProposalId: () => `freshness:${++seq}`, getTimezone: () => "Europe/Warsaw",
    readInputs: readLearningPlanInputSnapshot, peekPackage: () => resolved,
    now: () => now, resolvePackage: async () => resolved, resolveTrackFamily: () => "certification",
  });
  const context = () => ({ contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, planningPolicyIdentity, timezone: "Europe/Warsaw" });
  const editor = new LearningPlanEditorCoordinator({
    proposalCoordinator: proposals, readStorageScope: readLearningPlanStorageScope,
    readGoalSnapshot, loadGoalSnapshot: async (trackId) => { const goal = await getGoalSnapshot(trackId); await goalReadHook?.(); return goal; },
    loadLearningPlanSnapshot: getLearningPlanSnapshot, loadContentContext: async () => context(), peekContentContext: context,
    createEditorId: () => `editor:freshness:${++seq}`, now: () => { clockHook?.(); return now; },
    saveLearningPlan: (input) => { saveCount++; const saved = saveLearningPlanAtomically(input); if (uncertain) { uncertain = false; throw new Error("response lost after durable write"); } return saved; },
    acceptGoalPlan: async (input) => {
      input.revalidate();
      const before = readGoalPlanAcceptancePrecondition(TRACK);
      if ((before.goal?.revision ?? null) !== input.expectedGoalRevision || (before.plan?.revision ?? null) !== input.expectedPlanStorageRevision) throw new Error("stale pair");
      saveCount++;
      const goalRevision = goalPlanAcceptanceGoalRevision(input.expectedGoalRevision, before.goal, input.proposedGoal);
      const goal = goalRevision === (before.goal?.revision ?? 0)
        ? readGoalSnapshot(TRACK)!
        : await saveGoalSnapshot(input.proposedGoal, input.expectedGoalRevision);
      const plan = normalizeLearningPlan({ ...input.plan, goalRevision, planRevision: (input.expectedPlanStorageRevision ?? 0) + 1, status: "accepted" });
      const savedPlan = saveLearningPlanAtomically({ plan, expectedGoalRevision: goalRevision, expectedPlanStorageRevision: input.expectedPlanStorageRevision });
      if (uncertain) { uncertain = false; throw new Error("response lost after pair commit"); }
      return Object.freeze({ goal, plan: savedPlan });
    },
  });
  async function create() { const result = await proposals.create(TRACK, { goal: readGoalSnapshot(TRACK)?.record ?? createDefaultGoal(TRACK), minutesPerStudyDay: 60 }); assert.equal(result.kind, "ready"); if (!("proposal" in result)) throw new Error("No proposal"); return result.proposal.proposalId; }
  const attempt: TrainingAttempt = { id: "freshness-attempt", sessionId: "freshness-session", trackId: TRACK, modeId: resolved.track.modes[0]!.modeId, occurrenceId: "freshness-occurrence", item: { trackId: TRACK, questionId: resolved.track.questions[0]!.questionId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256 }, response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: { trackId: TRACK, questionId: resolved.track.questions[0]!.questionId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256 }, taxonomyOrSkillRefs: [] }, answeredAt: now, committedAt: now };
  return { editor, proposals, create, attempt, saves: () => saveCount, setUncertain: () => { uncertain = true; }, setNow: (value: string) => { now = value; }, setClockHook: (hook: (() => void) | null) => { clockHook = hook; }, setGoalReadHook: (hook: (() => Promise<void>) | null) => { goalReadHook = hook; } };
}

test("actual canonical proposal plus repositories: attempts arriving after async resolve cannot persist", async () => {
  const f = await fixture(); const id = await f.create();
  f.setGoalReadHook(async () => { f.setGoalReadHook(null); await addTrainingAttempt(f.attempt); });
  assert.deepEqual(await f.editor.acceptProposal(id, TRACK), { kind: "stale", reason: "proposal" });
  assert.equal(f.saves(), 0); assert.equal(getLearningPlanSnapshot(TRACK), null);
});

test("calendar changing during plan construction is checked immediately before CAS", async () => {
  const f = await fixture(); const id = await f.create();
  f.setClockHook(() => { f.setNow("2026-10-03T12:00:00.000Z"); });
  assert.deepEqual(await f.editor.acceptProposal(id, TRACK), { kind: "stale", reason: "proposal" });
  assert.equal(f.saves(), 0);
});

test("accepted-plan replacement after proposal creation cannot be overwritten", async () => {
  const f = await fixture(); const old = await f.create(); const current = await f.create();
  const accepted = await f.editor.acceptProposal(current, TRACK); assert.equal(accepted.kind, "accepted");
  const before = getLearningPlanSnapshot(TRACK);
  assert.deepEqual(await f.editor.acceptProposal(old, TRACK), { kind: "stale", reason: "proposal" });
  assert.deepEqual(getLearningPlanSnapshot(TRACK), before); assert.equal(f.saves(), 1);
});

test("evidence and calendar changes invalidate a proposal editor without writing", async () => {
  const f = await fixture(); const id = await f.create(); const started = await f.editor.startProposalEdit(id, TRACK);
  assert.equal(started.kind, "ready"); if (started.kind !== "ready") return;
  assert.equal("storageScope" in started.session, false);
  await addTrainingAttempt(f.attempt);
  assert.deepEqual(await f.editor.commit(started.session.editorId, TRACK), { kind: "stale", reason: "proposal" });
  assert.equal(f.saves(), 0);
});

test("same-scope uncertain accept acknowledges the exact durable pair without another write", async () => {
  const f = await fixture(); const id = await f.create(); f.setUncertain();
  assert.deepEqual(await f.editor.acceptProposal(id, TRACK), { kind: "storage_error" });
  const before = getLearningPlanSnapshot(TRACK);
  const retried = await f.editor.acceptProposal(id, TRACK); assert.equal(retried.kind, "accepted");
  if (retried.kind === "accepted") assert.deepEqual(retried.snapshot, before);
  assert.equal(f.saves(), 1); assert.deepEqual(getLearningPlanSnapshot(TRACK), before);
});

test("proposal editor schedule changes remain in memory until pair acceptance", async () => {
  const f = await fixture(); const id = await f.create(); const started = await f.editor.startProposalEdit(id, TRACK);
  if (started.kind !== "ready") throw new Error("No editor");
  assert.deepEqual(await f.editor.commit(started.session.editorId, TRACK), { kind: "staged", proposalId: id });
  assert.equal(f.saves(), 0); assert.equal(getLearningPlanSnapshot(TRACK), null);
});

test("a goal change after proposal-editor staging blocks acceptance without writing the pair", async () => {
  const f = await fixture(); const id = await f.create(); const started = await f.editor.startProposalEdit(id, TRACK);
  if (started.kind !== "ready") throw new Error("No editor");
  assert.deepEqual(await f.editor.commit(started.session.editorId, TRACK), { kind: "staged", proposalId: id });
  const before = readGoalSnapshot(TRACK)!;
  const changed = await saveGoalSnapshot({ ...before.record, weeklySessionTarget: 4 }, before.revision);

  assert.deepEqual(await f.editor.acceptProposal(id, TRACK), { kind: "stale", reason: "proposal" });
  assert.equal(f.saves(), 0);
  assert.equal(getLearningPlanSnapshot(TRACK), null);
  assert.deepEqual(readGoalSnapshot(TRACK), changed);
});

test("uncertain accepted result and editors do not leak into a replacement storage scope", async () => {
  const f = await fixture(); const pending = await f.create(); f.setUncertain();
  assert.equal((await f.editor.acceptProposal(pending, TRACK)).kind, "storage_error");
  const editor = await f.editor.startExistingEdit(TRACK); if (editor.kind !== "ready") throw new Error("No editor");
  installKeyValueStorageForTests(new MemoryKeyValueStorage()); await saveGoalSnapshot(createDefaultGoal(TRACK), null);
  assert.equal(f.editor.getSession(editor.session.editorId, TRACK), null);
  assert.equal((await f.editor.commit(editor.session.editorId, TRACK)).kind, "stale");
  assert.equal((await f.editor.acceptProposal(pending, TRACK)).kind, "stale"); assert.equal(f.saves(), 1);
  assert.equal(getLearningPlanSnapshot(TRACK), null);
});

test("actual profile router A/B/A republishes a new lease; old editor, in-flight and terminal result remain stale", async () => {
  const base = new MemoryKeyValueStorage(); const values = new Map<string, string>(); let identitySeq = 10;
  const control = { get: async (key: string) => values.get(key) ?? null, set: async (key: string, value: string) => { values.set(key, value); }, remove: async (key: string) => { values.delete(key); } };
  const identity = { create: async () => ({ installationId: "00000000-0000-4000-8000-000000000001", localDatasetId: `00000000-0000-4000-8000-${String(++identitySeq).padStart(12, "0")}` }) };
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router: await openProfileStorageRouter(base, control, { identity }) }));
  async function select(account: string) {
    closeActiveProfileStorage(); await prepareProfileStorage();
    const { profile } = await selectPreparedAccountProfile(account);
    return activatePreparedProfile(profile.id, profile.kind);
  }
  try {
    const leaseA = await select("account-a"); const f = await fixture(false);
    const acceptedId = await f.create(); assert.equal((await f.editor.acceptProposal(acceptedId, TRACK)).kind, "accepted");
    const editing = await f.editor.startExistingEdit(TRACK); if (editing.kind !== "ready") throw new Error("No editor");
    const pendingId = await f.create(); let release!: () => void; let entered!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; }); const ready = new Promise<void>((resolve) => { entered = resolve; });
    f.setGoalReadHook(async () => { entered(); await gate; });
    const inFlight = f.editor.acceptProposal(pendingId, TRACK); await ready;
    await select("account-b"); await saveGoalSnapshot(createDefaultGoal(TRACK), null);
    const bResult = f.editor.acceptProposal(pendingId, TRACK); assert.notStrictEqual(bResult, inFlight);
    release(); f.setGoalReadHook(null);
    assert.equal((await inFlight).kind, "stale"); assert.equal((await bResult).kind, "stale");
    assert.equal(getLearningPlanSnapshot(TRACK), null);
    const newLeaseA = await select("account-a"); assert.notStrictEqual(newLeaseA, leaseA);
    assert.equal(f.editor.getSession(editing.session.editorId, TRACK), null);
    assert.equal((await f.editor.acceptProposal(acceptedId, TRACK)).kind, "stale");
    assert.equal((await f.editor.commit(editing.session.editorId, TRACK)).kind, "stale");
    assert.equal(getLearningPlanSnapshot(TRACK)?.revision, 1); assert.equal(f.saves(), 1);
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});


test("replay of a terminal acceptance after a later edit cannot reconcile old reminders", async () => {
  const f = await fixture(); let reconciles = 0;
  const runtime = new LearningPlanMutationRuntimeCore({
    acceptProposal: (id, trackId) => f.editor.acceptProposal(id, trackId),
    commit: (id, trackId) => f.editor.commit(id, trackId),
    reconcile: async () => { reconciles++; return { kind: "disabled", status: "disabled" }; },
    retry: async () => ({ kind: "disabled", status: "disabled" }),
  });
  const copy = { title: "practice", body: "practice" }; const id = await f.create();
  assert.equal((await runtime.acceptProposal(id, TRACK, copy)).kind, "plan_saved_reminders_synced");
  const editing = await f.editor.startExistingEdit(TRACK); if (editing.kind !== "ready") throw new Error("No editor");
  assert.equal(f.editor.updateSlotTime(editing.session.editorId, TRACK, "mon", "09:15").kind, "updated");
  assert.equal((await runtime.commit(editing.session.editorId, TRACK, copy)).kind, "plan_saved_reminders_synced");
  const before = getLearningPlanSnapshot(TRACK);
  assert.deepEqual(await runtime.acceptProposal(id, TRACK, copy), { kind: "stale", reason: "plan" });
  assert.equal(reconciles, 2); assert.deepEqual(getLearningPlanSnapshot(TRACK), before);
});

test("goal changes after an uncertain durable pair cannot acknowledge stale state or reconcile reminders", async () => {
    const f = await fixture(); let reconciles = 0;
    const runtime = new LearningPlanMutationRuntimeCore({
      acceptProposal: (id, trackId) => f.editor.acceptProposal(id, trackId),
      commit: (id, trackId) => f.editor.commit(id, trackId),
      reconcile: async () => { reconciles++; return { kind: "disabled", status: "disabled" }; },
      retry: async () => ({ kind: "disabled", status: "disabled" }),
    });
    const copy = { title: "practice", body: "practice" }; const id = await f.create();
    f.setUncertain(); assert.deepEqual(await runtime.acceptProposal(id, TRACK, copy), { kind: "storage_error" });
    const beforePlan = getLearningPlanSnapshot(TRACK); const beforeGoal = readGoalSnapshot(TRACK)!;
    const nextGoal = await saveGoalSnapshot({ ...beforeGoal.record, weeklySessionTarget: 4 }, beforeGoal.revision);
    assert.deepEqual(await runtime.acceptProposal(id, TRACK, copy), { kind: "stale", reason: "goal" });
    assert.equal(reconciles, 0); assert.equal(f.saves(), 1);
    assert.deepEqual(getLearningPlanSnapshot(TRACK), beforePlan); assert.deepEqual(readGoalSnapshot(TRACK), nextGoal);
});
