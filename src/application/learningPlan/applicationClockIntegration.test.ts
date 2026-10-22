import assert from "node:assert/strict";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import test from "node:test";

import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createDefaultGoal, type TrackId } from "../../domain";
import { homePlanSnapshotReader } from "../homePlanSnapshotReader";
import { learningPlanEditorCoordinator, learningPlanProposalCoordinator } from "./";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { composeTrainingLifecycleUseCases, createAdjustableWallClock } from "../bootstrap/trainingLifecycleComposition";
import { getApplicationCurrentTime } from "../trainingLifecycle/applicationLifecycle";
import {
  activatePreparedProfile,
  closeActiveProfileStorage,
  installKeyValueStorageForTests,
  getKeyValueStorage,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
} from "../../infrastructure/storage/mmkvClient";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { foregroundTimerPhysicalKey, openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { getActiveMutationJournal, getGoalSnapshot, getLearningPlanSnapshot, getReviewQueueItems } from "../../storage/repositories";
import { readLearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";
import { STORAGE_KEYS } from "../../storage/keys";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";


const TRACK: TrackId = "google-cloud-associate-cloud-engineer";
const START = "2026-10-01T12:00:00.000Z";
const DAY_MS = 24 * 60 * 60 * 1000;
const GUEST_ID = "00000000-0000-4000-8000-000000000731";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000732";

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

function incorrectResponse(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type === "choice_single") {
    const item = question as Extract<Question, { interaction: { type: "choice_single" } }>;
    return { type: "choice_single", optionId: item.interaction.options.find((option) => option.optionId !== item.answer.optionId)!.optionId };
  }
  if (question.interaction.type === "choice_multiple") {
    const item = question as Extract<Question, { interaction: { type: "choice_multiple" } }>;
    return { type: "choice_multiple", optionIds: item.interaction.options.filter((option) => !item.answer.optionIds.includes(option.optionId)).slice(0, 1).map((option) => option.optionId) };
  }
  if (question.interaction.type === "ordering") {
    const item = question as Extract<Question, { interaction: { type: "ordering" } }>;
    return { type: "ordering", orderedElementIds: [...item.answer.orderedElementIds].reverse() };
  }
  if (question.interaction.type === "complexity") {
    const dimension = question.interaction.dimensions[0]!;
    const answer = question.answer;
    if (!("selectedValueIdsByDimension" in answer)) throw new Error("Complexity question must expose its canonical selected-value answer.");
    const selectedValues = answer.selectedValueIdsByDimension[dimension.dimensionId] ?? [];
    const wrong = dimension.values.find((value) => !selectedValues.includes(value.valueId));
    return { type: "complexity", selectedValueIdsByDimension: { [dimension.dimensionId]: [wrong?.valueId ?? "deliberately-unselected"] } };
  }
  const dimension = question.interaction.dimensions[0]!;
  const answer = question.answer;
  if (!("selectedValueIdsByDimension" in answer)) throw new Error("Decision-matrix question must expose its canonical selected-value answer.");
  const selectedValues = answer.selectedValueIdsByDimension[dimension.dimensionId] ?? [];
  const wrong = dimension.values.find((value) => !selectedValues.includes(value.valueId));
  return { type: "decision_matrix", selectedValueIdsByDimension: { [dimension.dimensionId]: [wrong?.valueId ?? "deliberately-unselected"] } };
}

test("one lifecycle clock drives a real answer due time and proposal, editor, and Home projections", async () => {
  closeActiveProfileStorage();
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const identity = { async create() { return { installationId: INSTALLATION_ID, localDatasetId: GUEST_ID }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router,
    foregroundTimerCasForTests: (before, after) => base.applyForegroundTimerRaw(before, after, foregroundTimerPhysicalKey(GUEST_ID)),
  }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  try {
  await contentPackageRuntimeOwner.verifyBundledPackages();

  const clock = createAdjustableWallClock(() => START);
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: clock,
    sessionIds: { async create() { return "clock-integration-diagnostic"; } },
  });
  const goal = createDefaultGoal(requireGoalPolicy(TRACK));
  const initial = await learningPlanProposalCoordinator.create(TRACK, { goal, minutesPerStudyDay: 180 });
  assert.ok("proposal" in initial, "the canonical initial diagnosis proposal should be available");
  if (!("proposal" in initial)) return;
  const accepted = await learningPlanEditorCoordinator.acceptProposal(initial.proposal.proposalId, TRACK);
  assert.equal(accepted.kind, "accepted", `the initial ${initial.kind} proposal should persist through the canonical pair owner`);
  if (accepted.kind !== "accepted") return;

  const proposedSession = initial.proposal.outcome.nextSession;
  const prepared = await lifecycle.startSession({
    trackId: TRACK,
    modeId: proposedSession.modeId,
    source: "clock-integration-test",
    request: { requestedLength: proposedSession.requestedLength },
  });
  const first = prepared.session.itemOrder[0];
  assert.ok(first, "the real legal diagnosis must contain its first canonical item");
  const question = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK).getQuestion(first.item.questionId);
  assert.ok(question, "The exact shipped fixture resolves its authored response for this test setup.");
  const expectedDueAt = new Date(Date.parse(getApplicationCurrentTime()) + DAY_MS).toISOString();
  await lifecycle.submitPracticeResponse(incorrectResponse(question));

  const persistedReviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  const dueReview = persistedReviews.find((entry) => entry.sourceSessionId === prepared.session.id);
  assert.ok(dueReview, "the canonical incorrect answer must create its persisted repair review");
  assert.equal(dueReview.stage, "repair24");
  assert.equal(dueReview.dueAt, expectedDueAt);

  await lifecycle.abandonActiveSession();
  assert.equal(clock.advanceBy(DAY_MS), expectedDueAt);
  assert.equal(getApplicationCurrentTime(), expectedDueAt);

  const currentGoal = await getGoalSnapshot(TRACK, requireGoalPolicy(TRACK));
  assert.ok(currentGoal);
  const replanned = await learningPlanProposalCoordinator.create(TRACK, { goal: currentGoal.record, minutesPerStudyDay: 180 });
  assert.ok("proposal" in replanned, "the actual due review should keep proposal generation available");
  if (!("proposal" in replanned)) return;
  assert.equal(replanned.proposal.outcome.nextSession.kind, "review");
  assert.equal(replanned.proposal.outcome.nextSession.modeId, "certification-weak-area-review");

  const editor = await learningPlanEditorCoordinator.startProposalEdit(replanned.proposal.proposalId, TRACK);
  assert.equal(editor.kind, "ready", "the production editor must resolve the proposal using the same current lifecycle time");

  const home = await homePlanSnapshotReader.read({ trackId: TRACK, now: getApplicationCurrentTime(), premiumAccess: "denied" });
  assert.equal(home.kind, "ready");
  if (home.kind !== "ready") return;
  assert.equal(home.today, new Intl.DateTimeFormat("en-CA", { timeZone: home.identity.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(expectedDueAt)));
  assert.deepEqual(home.dueReviewIds, [dueReview.id]);
  assert.equal(home.session.modeId, replanned.proposal.outcome.nextSession.modeId);
  assert.equal(home.session.reviewSource, "due_queue");
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
});


test("an explicit shared twenty-minute split persists and reprojects each real track budget without borrowing minutes", async () => {
  closeActiveProfileStorage();
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const identity = { async create() { return { installationId: INSTALLATION_ID, localDatasetId: GUEST_ID }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  await router.selectExistingGuest(GUEST_ID);
  router = await openProfileStorageRouter(base, control, { identity });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router,
    foregroundTimerCasForTests: (before, after) => base.applyForegroundTimerRaw(before, after, foregroundTimerPhysicalKey(GUEST_ID)),
  }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  try {
    await contentPackageRuntimeOwner.verifyBundledPackages();
    composeTrainingLifecycleUseCases({ wallClock: createAdjustableWallClock(() => START) });
    assert.equal(getApplicationCurrentTime(), START);
    const tracks = [TRACK, "coding-interview-dsa-problem-solving"] as const;
    const storage = getKeyValueStorage();
    const rawPair = (trackId: TrackId) => ({
      goal: storage.getString(STORAGE_KEYS.goal(trackId)),
      plan: storage.getString(STORAGE_KEYS.learningPlan(trackId)),
    });
    assert.notEqual(STORAGE_KEYS.goal(tracks[0]), STORAGE_KEYS.goal(tracks[1]));
    assert.notEqual(STORAGE_KEYS.learningPlan(tracks[0]), STORAGE_KEYS.learningPlan(tracks[1]));

    // These are explicit human allocations, not a global budget input owned by the product.
    for (const allocation of [[10, 10], [7, 13]] as const) {
      for (const [index, trackId] of tracks.entries()) {
        const otherTrack = tracks[1 - index]!;
        const otherBefore = rawPair(otherTrack);
        const policy = requireGoalPolicy(trackId);
        const goal = { ...createDefaultGoal(policy), goalType: "build_foundations" as const,
          preferredDays: ["fri"] as const, weeklySessionTarget: 1, targetDate: "2026-10-02" };
        const created = await learningPlanProposalCoordinator.create(trackId, { goal, minutesPerStudyDay: allocation[index]! });
        assert.ok("proposal" in created, `the actual ${trackId} proposal must exist before acceptance`);
        if (!("proposal" in created)) throw new Error(`Missing actual proposal for ${trackId}.`);
        const accepted = await learningPlanEditorCoordinator.acceptProposal(created.proposal.proposalId, trackId);
        assert.equal(accepted.kind, "accepted", `the ${created.kind} proposal retains its separate time shortfall`);
        if (accepted.kind !== "accepted") throw new Error(`The actual ${trackId} pair was not accepted.`);
        assert.deepEqual(rawPair(otherTrack), otherBefore, "accepting one allocation cannot rewrite the other track's pair or revisions");
        assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);

        const persistedGoal = await getGoalSnapshot(trackId, policy);
        const persistedPlan = getLearningPlanSnapshot(trackId, policy);
        assert.ok(persistedGoal && persistedPlan, "both canonical records must be durable");
        if (!persistedGoal || !persistedPlan) throw new Error(`Missing durable pair for ${trackId}.`);
        const resolved = contentPackageRuntimeOwner.getPreparedDiscovery(trackId);
        const actualTrack = resolved.track;
        assert.equal(persistedGoal.record.trackId, trackId);
        assert.equal(persistedPlan.plan.trackId, trackId);
        assert.equal(persistedPlan.plan.schemaVersion, 2);
        if (persistedPlan.plan.schemaVersion !== 2) throw new Error("The explicit allocation requires a v2 plan.");
        assert.equal(persistedPlan.plan.minutesPerStudyDay, allocation[index]);
        assert.equal(persistedPlan.plan.goalRevision, persistedGoal.revision);
        assert.equal(persistedPlan.plan.contentVersion, actualTrack.contentVersion);
        assert.equal(persistedPlan.plan.artifactSha256, actualTrack.artifactSha256);
        assert.deepEqual(persistedPlan.plan.planningPolicyIdentity, resolved.planningPolicyIdentity);
        assert.ok(rawPair(trackId).goal && rawPair(trackId).plan);
      }

      const actualAvailable: number[] = [];
      for (const [index, trackId] of tracks.entries()) {
        // No draft: the producer must read the saved budget from this track's plan.
        const recreated = await learningPlanProposalCoordinator.create(trackId);
        assert.ok("proposal" in recreated);
        if (!("proposal" in recreated)) throw new Error(`The saved ${trackId} allocation cannot be reprojected.`);
        const proposal = recreated.proposal;
        const budget = allocation[index]!;
        assert.equal(proposal.outcome.minutesPerStudyDay, budget);
        assert.equal(proposal.outcome.nextSession.requestedLength, trackId === TRACK ? 40 : 10);
        const resolved = contentPackageRuntimeOwner.getPreparedDiscovery(trackId);
        const actualTrack = resolved.track;
        const modeId = trackId === TRACK ? "certification-diagnostic-baseline" : "coding-interview-guided-practice";
        const mode = actualTrack.getMode(modeId);
        assert.deepEqual(mode.requestedLengths, trackId === TRACK ? [40] : [10, 20, 40]);
        assert.equal(mode.minimumActualLength, trackId === TRACK ? 40 : 10);
        const authoredRates = resolved.planningPolicy!.workEstimates.filter(rate => rate.modeId === modeId);
        assert.ok(authoredRates.length > 0);
        assert.ok(authoredRates.every(rate => rate.minMinutesPerResponse === (trackId === TRACK ? 1 : 2)));
        assert.ok((trackId === TRACK ? 40 * 1 : 10 * 2) > budget, "the authored legal minimum independently exceeds this allocation");

        assert.equal(proposal.nextSessionCalendar.kind, "available");
        if (proposal.nextSessionCalendar.kind !== "available") throw new Error("The next-session calendar must expose its explicit shortfall.");
        const next = proposal.nextSessionCalendar.calendar;
        assert.deepEqual(next.availableDays.map(day => [day.localDate, day.availableMinutes]), [["2026-10-02", budget]]);
        assert.equal(next.totalAvailableMinutes, budget);
        assert.equal(next.kind, "shortfall");
        assert.deepEqual(next.noFitDays, ["2026-10-02"]);
        assert.equal(next.availableDays[0]!.reason, "no_legal_session_fits");
        assert.equal(next.availableDays[0]!.selectedSession, null);

        assert.equal(proposal.fullGoalCalendar.kind, "available");
        if (proposal.fullGoalCalendar.kind !== "available") throw new Error("The full-goal calendar must retain the allocated capacity.");
        const full = proposal.fullGoalCalendar.calendar;
        assert.deepEqual(full.availableDays.map(day => [day.localDate, day.availableMinutes]), [["2026-10-02", budget]]);
        assert.equal(full.totalAvailableMinutes, budget);
        assert.equal(full.kind, "shortfall");
        assert.ok(full.unscheduledWorkResponses > 0);
        assert.equal(proposal.fullGoalTimeCapacity.availableMinutes, budget);
        assert.equal(proposal.fullGoalTimeCapacity.kind, "minimum_exceeds_available_time");
        assert.ok(proposal.fullGoalTimeCapacity.workMinMinutes! > budget);
        assert.equal(proposal.fullGoalWorkload.kind, "incomplete");
        assert.ok(proposal.fullGoalWorkload.unknownChapterIds.length > 0, "required scopes outside the selectable pool cannot become a full-fit claim");
        actualAvailable.push(proposal.fullGoalTimeCapacity.availableMinutes!);
        const inputs = readLearningPlanInputSnapshot(trackId, requireGoalPolicy(trackId), productionTrackAdmissionContext);
        assert.deepEqual([inputs.sessions.length, inputs.attempts.length, inputs.reviews.length], [0, 0, 0]);
        assert.equal(inputs.activeSession, null);
      }
      assert.deepEqual(actualAvailable, allocation, "the asymmetric7/13 control detects borrowing the other track's budget");
      assert.equal(actualAvailable.reduce((sum, minutes) => sum + minutes, 0), 20, "actual persisted projections share only the explicitly allocated twenty minutes");
    }
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
});
