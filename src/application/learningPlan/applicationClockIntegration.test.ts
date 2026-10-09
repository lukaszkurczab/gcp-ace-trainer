import assert from "node:assert/strict";
import test from "node:test";

import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
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
  MemoryKeyValueStorage,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
} from "../../infrastructure/storage/mmkvClient";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { getGoalSnapshot, getReviewQueueItems } from "../../storage/repositories";

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
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  try {
  await contentPackageRuntimeOwner.verifyBundledPackages();

  const clock = createAdjustableWallClock(() => START);
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: clock,
    sessionIds: { async create() { return "clock-integration-diagnostic"; } },
  });
  const goal = createDefaultGoal(TRACK);
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
  const question = await contentPackageRuntimeOwner.resolveItem(first.item);
  const expectedDueAt = new Date(Date.parse(getApplicationCurrentTime()) + DAY_MS).toISOString();
  await lifecycle.submitPracticeResponse(incorrectResponse(question));

  const persistedReviews = (await getReviewQueueItems()).value;
  const dueReview = persistedReviews.find((entry) => entry.sourceSessionId === prepared.session.id);
  assert.ok(dueReview, "the canonical incorrect answer must create its persisted repair review");
  assert.equal(dueReview.stage, "repair24");
  assert.equal(dueReview.dueAt, expectedDueAt);

  await lifecycle.abandonActiveSession();
  assert.equal(clock.advanceBy(DAY_MS), expectedDueAt);
  assert.equal(getApplicationCurrentTime(), expectedDueAt);

  const currentGoal = await getGoalSnapshot(TRACK);
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
