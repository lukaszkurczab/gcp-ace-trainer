import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalTrackRuntime } from "../../content/canonical";
import { createTrainingSessionDraft, getTrackRegistration, type ReviewQueueEntry, type TrainingSession } from "../../domain";
import { canonicalQuestionReviewEvidence } from "../canonical/canonicalFamilyMechanics";
import { createCanonicalTrainingFamilyComposition, createTrainingCatalog } from "../canonicalTrainingFamilyComposition";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import type { PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime } from "./contracts";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { addReviewQueueItems, getActiveMutationJournal, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult } from "../../storage/repositories";
import { recoverPendingMutation } from "../learningMutations";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { STORAGE_KEYS } from "../../storage/keys";
import { readReviewQueueFinalizationProofs } from "../../storage/repositories/reviewQueueRepository";
import { selectApproachChallengeProblems, confirmApproachChallengeShortening } from "../coding-interview/approachChallengeSelection";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";

const NOW = "2026-11-01T12:00:00.000Z";
const CODING = "coding-interview-dsa-problem-solving";
const catalogPromise = loadCanonicalRuntimeCatalog();

async function fixture(trackId: string, options: {
  historicalPin?: boolean;
  afterPractice?: (outcome: PracticeSubmission) => Promise<void>;
  afterSimulation?: (outcome: SimulationFinalization) => Promise<void>;
} = {}) {
  const storage = installMemoryStorage();
  const current = (await catalogPromise).getTrack(trackId);
  const track: CanonicalTrackRuntime = options.historicalPin
    ? { ...current, contentVersion: "historical-baseline-fixture", artifactSha256: "b".repeat(64) }
    : current;
  const composition = createCanonicalTrainingFamilyComposition(track);
  const runtime = new Proxy(composition.runtime, {
    get(target, key) {
      if (key === "submitPractice") return async (input: Parameters<TrainingFamilyRuntime["submitPractice"]>[0]) => {
        const outcome = await target.submitPractice(input);
        await options.afterPractice?.(outcome);
        return outcome;
      };
      if (key === "finalizeSimulation") return async (input: Parameters<TrainingFamilyRuntime["finalizeSimulation"]>[0]) => {
        const outcome = await target.finalizeSimulation(input);
        await options.afterSimulation?.(outcome);
        return outcome;
      };
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const resolution = { track: composition.catalog, runtime };
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => NOW },
    sessionIds: { async create() { return `baseline:${trackId}`; } },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
    packages: {
      async resolveForPreparation() { return resolution; },
      async resolveExactArtifact() { return resolution; },
      async resolveForDiscovery() { return resolution; },
    },
  });
  return { storage, track, lifecycle, runtime, catalog: composition.catalog };
}

function oldReview(track: CanonicalTrackRuntime, session: TrainingSession, id = "old-unit-review"): ReviewQueueEntry {
  const evidence = questionEvidence(track, session.itemOrder[0]!.item.questionId);
  return {
    ...evidence, sourceItem: { ...evidence.sourceItem, contentVersion: "previous-review-content", artifactSha256: "c".repeat(64) },
    id, trackId: track.trackId, sourceAttemptId: `${id}:attempt`, sourceSessionId: `${id}:session`,
    reasons: ["incorrect"], dueAt: NOW, createdAt: NOW, persistent: true, consecutiveAfterDueSuccesses: 0,
    policyVersion: "bizq04-v1", stage: "repair24", status: "active",
  };
}

function questionEvidence(track: CanonicalTrackRuntime, questionId: string) {
  const catalog = createTrainingCatalog(track);
  return canonicalQuestionReviewEvidence(catalog, catalog.getQuestion(questionId)!);
}

async function startPractice(f: Awaited<ReturnType<typeof fixture>>, due = false) {
  const mode = due ? f.track.modes.find(mode => mode.modeId.endsWith("weak-area-review"))!
    : f.track.modes.find(mode => mode.selection.kind === "node")!;
  assert.ok(mode);
  return f.lifecycle.startSession({ trackId: f.track.trackId, modeId: mode.modeId,
    request: { requestedLength: mode.defaultRequestedLength, ...(due ? { reviewSource: "due_queue" } : {}) } });
}

async function practicePreview(f: Awaited<ReturnType<typeof fixture>>) {
  const mode = f.track.modes.find(mode => mode.selection.kind === "node")!;
  return f.runtime.prepare({ trackId: f.track.trackId, modeId: mode.modeId,
    request: { sessionId: "review-source-preview", requestedLength: mode.defaultRequestedLength }, attempts: [], reviews: [], now: NOW });
}

test("all nine track clients preserve an unchanged older unit row while saving new maintenance credit", async context => {
  const catalog = await catalogPromise;
  assert.equal(catalog.tracks.length, 9);
  const families = new Set<string>();
  for (const trackId of catalog.tracks) await context.test(trackId, async () => {
    const f = await fixture(trackId);
    families.add(getTrackRegistration(trackId).familyId);
    const { session } = await startPractice(f);
    const older = oldReview(f.track, session);
    await addReviewQueueItems([older], productionTrackAdmissionContext);
    const raw = f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id));
    const question = f.track.getQuestion(session.itemOrder[0]!.item.questionId)!;
    await f.lifecycle.submitPracticeResponse(question.answer);
    assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback" });
    const reviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
    assert.equal(reviews.length, 2);
    assert.equal(reviews.find(row => row.id !== older.id)?.stage, "retention7");
    assert.equal(f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id)), raw);
    await f.lifecycle.submitPracticeResponse(question.answer);
    await recoverPendingMutation();
    await recoverPendingMutation();
    assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, reviews);
  });
  assert.deepEqual([...families].sort(), ["certification", "coding_interview", "design_interview"]);
});

test("an ordinary incorrect answer in a retained older session creates repair credit without altering another version", async () => {
  const f = await fixture(CODING, { historicalPin: true });
  const { session } = await startPractice(f);
  const older = oldReview(f.track, session);
  await addReviewQueueItems([older], productionTrackAdmissionContext);
  const question = f.track.getQuestion(session.itemOrder[0]!.item.questionId)!;
  assert.equal(question.answer.type, "choice_single");
  assert.equal(question.interaction.type, "choice_single");
  if (question.answer.type !== "choice_single" || question.interaction.type !== "choice_single") throw new Error("Expected an authored single-choice fixture.");
  const answerId = question.answer.optionId;
  const optionId = question.interaction.options.find(option => option.optionId !== answerId)!.optionId;
  await f.lifecycle.submitPracticeResponse({ type: "choice_single", optionId });
  assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback" });
  const reviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  assert.deepEqual(reviews.find(row => row.id === older.id), older);
  assert.equal(reviews.find(row => row.id !== older.id)?.stage, "repair24");
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value[0]?.item.artifactSha256, session.artifactSha256);
});

test("a same-unit change after practice scoring retains the answer and protects the newer review", async () => {
  let concurrent!: ReviewQueueEntry;
  const f = await fixture(CODING, { afterPractice: async () => {
    await addReviewQueueItems([concurrent], productionTrackAdmissionContext);
  } });
  const { session } = await startPractice(f);
  const older = oldReview(f.track, session);
  concurrent = { ...older, dueAt: "2026-11-03T12:00:00.000Z" };
  await addReviewQueueItems([older], productionTrackAdmissionContext);
  await f.lifecycle.submitPracticeResponse(f.track.getQuestion(session.itemOrder[0]!.item.questionId)!.answer);
  assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback", reviewConflict: true });
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [concurrent]);
});

test("due credit uses its pinned source exactly once with older unit siblings, while stale sources remain protected", async context => {
  for (const stale of [false, true]) await context.test(stale ? "stale source" : "unchanged pinned source", async () => {
    const f = await fixture(CODING);
    const preview = await practicePreview(f);
    const source = { ...oldReview(f.track, preview.session), sourceItem: preview.session.itemOrder[0]!.item };
    const sibling = oldReview(f.track, preview.session, "older-unit-sibling");
    await addReviewQueueItems([source, sibling], productionTrackAdmissionContext);
    const { session } = await startPractice(f, true);
    const occurrence = session.itemOrder[0]!;
    assert.equal(occurrence.reviewSourceSnapshot?.reviewEntryId, source.id);
    const concurrent = { ...source, dueAt: "2026-11-03T12:00:00.000Z" };
    if (stale) await addReviewQueueItems([concurrent], productionTrackAdmissionContext);
    await f.lifecycle.submitPracticeResponse(f.track.getQuestion(occurrence.item.questionId)!.answer);
    const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
    assert.equal(attempts.length, 1);
    const review = (await getReviewQueueItems(productionTrackAdmissionContext)).value.find(review => review.id === source.id);
    assert.ok(review);
    if (stale) {
      assert.deepEqual(review, concurrent);
      assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback", reviewConflict: true });
    } else {
      assert.deepEqual([review.id, review.sourceItem, review.sourceAttemptId, review.sourceSessionId], [source.id, source.sourceItem, source.sourceAttemptId, source.sourceSessionId]);
      assert.equal(review.stage, "repair7");
      assert.equal(review.consecutiveAfterDueSuccesses, 1);
      assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback" });
    }
    await recoverPendingMutation();
    await recoverPendingMutation();
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [review, sibling]);
  });
});

test("finalization evidence keeps exact refs and captures only their tracks in its complete concurrency baseline", async () => {
  const f = await fixture(CODING);
  const { session } = await startPractice(f);
  const older = oldReview(f.track, session);
  const exact = { ...older, id: "exact-review", sourceItem: session.itemOrder[0]!.item };
  const otherTrack = (await catalogPromise).getTrack("google-cloud-associate-cloud-engineer");
  const otherEvidence = questionEvidence(otherTrack, otherTrack.questions[0]!.questionId);
  const unrelated = { ...older, ...otherEvidence, id: "unrelated-track", trackId: otherTrack.trackId };
  await addReviewQueueItems([older, exact, unrelated], productionTrackAdmissionContext);
  const evidence = readReviewQueueFinalizationProofs([exact.sourceItem], productionTrackAdmissionContext);
  assert.deepEqual(evidence.entries, [exact]);
  assert.deepEqual(evidence.reviewBaseline, [older, exact]);
  assert.deepEqual(evidence.proofs.map(proof => proof.id), [exact.id]);
});

test("a concurrent unrelated-track change does not block ordinary credit", async () => {
  let concurrent!: ReviewQueueEntry;
  const f = await fixture(CODING, { afterPractice: async () => {
    await addReviewQueueItems([concurrent], productionTrackAdmissionContext);
  } });
  const { session } = await startPractice(f);
  const otherTrack = (await catalogPromise).getTrack("google-cloud-associate-cloud-engineer");
  const otherEvidence = questionEvidence(otherTrack, otherTrack.questions[0]!.questionId);
  const unrelated = { ...oldReview(f.track, session), ...otherEvidence, trackId: otherTrack.trackId };
  concurrent = { ...unrelated, dueAt: "2026-11-03T12:00:00.000Z" };
  await addReviewQueueItems([unrelated], productionTrackAdmissionContext);
  await f.lifecycle.submitPracticeResponse(f.track.getQuestion(session.itemOrder[0]!.item.questionId)!.answer);
  assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback" });
  const reviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  assert.deepEqual(reviews.find(review => review.id === concurrent.id), concurrent);
  assert.equal(reviews.filter(review => review.trackId === CODING).length, 1);
});

test("Approach Challenge preserves an empty review mutation set and the ordinary queue", async () => {
  let mutationCount = -1;
  const f = await fixture(CODING, { afterPractice: async outcome => { mutationCount = outcome.reviewMutations.length; } });
  const preview = await practicePreview(f);
  const older = oldReview(f.track, preview.session);
  await addReviewQueueItems([older], productionTrackAdmissionContext);
  const problems = f.track.approachChallengeProblems!;
  const proposed = selectApproachChallengeProblems({ sources: problems.map(problem => ({ problem })),
    contentVersion: f.catalog.contentVersion, artifactSha256: f.catalog.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as unknown as PackageCompletionState, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: [...new Set(problems.flatMap(problem => problem.requiredFamilyIds))] } });
  const selection = confirmApproachChallengeShortening(proposed, true);
  const { session } = await f.lifecycle.startSession({ trackId: f.track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID, request: { selection } });
  const problem = problems.find(problem => problem.approachQuestion.questionId === session.itemOrder[0]!.item.questionId)!;
  const option = problem.approachQuestion.interaction.options[0]!;
  const response = { type: "approach_choice", optionId: option.optionId };
  const raw = f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id));
  await f.lifecycle.submitPracticeResponse(response);
  await f.lifecycle.submitPracticeResponse(response);
  assert.equal(mutationCount, 0);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [older]);
  assert.equal(f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id)), raw);
  assert.deepEqual(await f.lifecycle.getPracticeOperationState(session, true), { family: "practice", kind: "feedback" });
});

async function startSimulation(f: Awaited<ReturnType<typeof fixture>>) {
  const profile = f.track.simulationProfiles!.find(profile => profile.familyId !== "design_interview")!;
  const { session } = await f.lifecycle.startSession({ trackId: f.track.trackId, modeId: profile.modeId, request: { scope: { simulationProfileId: profile.profileId } } });
  const draft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
  assert.ok(draft);
  const occurrence = session.itemOrder[0]!;
  const response = f.track.getQuestion(occurrence.item.questionId)!.answer;
  const next = createTrainingSessionDraft({ ...draft, revision: draft.revision + 1,
    responsesByOccurrenceId: { [occurrence.occurrenceId]: response }, updatedAt: NOW });
  await f.lifecycle.saveSimulationDraft({ draft: next, expectedPreviousRevision: draft.revision });
  return session;
}

test("Coding and Certification finalization carry the complete baseline from the same scoring-proof snapshot", async context => {
  for (const trackId of [CODING, "google-cloud-associate-cloud-engineer", "claude-certified-architect-professional-certification"]) await context.test(trackId, async () => {
    const f = await fixture(trackId);
    const session = await startSimulation(f);
    const older = oldReview(f.track, session);
    await addReviewQueueItems([older], productionTrackAdmissionContext);
    const raw = f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id));
    await f.lifecycle.finalizeSimulation();
    assert.deepEqual(await f.lifecycle.getSimulationOperationState(session), { family: "simulation", kind: "completed" });
    assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
    assert.equal((await getReviewQueueItems(productionTrackAdmissionContext)).value.length, 2);
    assert.equal(f.storage.snapshot().get(STORAGE_KEYS.reviewEntry(older.id)), raw);
    assert.ok(await getTrainingSessionResult(session.id, productionTrackAdmissionContext));
    await recoverPendingMutation();
    await recoverPendingMutation();
    assert.equal((await getReviewQueueItems(productionTrackAdmissionContext)).value.length, 2);
  });
});

test("a same-unit change after finalization scoring cannot be appended to the baseline to hide a conflict", async () => {
  let concurrent!: ReviewQueueEntry;
  const f = await fixture(CODING, { afterSimulation: async () => {
    await addReviewQueueItems([concurrent], productionTrackAdmissionContext);
  } });
  const session = await startSimulation(f);
  const older = oldReview(f.track, session);
  concurrent = { ...older, dueAt: "2026-11-03T12:00:00.000Z" };
  await addReviewQueueItems([older], productionTrackAdmissionContext);
  await f.lifecycle.finalizeSimulation();
  assert.deepEqual(await f.lifecycle.getSimulationOperationState(session), { family: "simulation", kind: "completed", reviewConflict: true });
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [concurrent]);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
});
