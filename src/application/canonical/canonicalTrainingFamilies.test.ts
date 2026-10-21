import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { canonicalTrainingFamilyResolver, createCanonicalTrainingFamilyRuntime, createTrainingCatalog, createTrainingInteractionPort } from "../canonicalTrainingFamilyComposition";
import { composeCanonicalFeedback } from "./canonicalInteractionPresentation";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalCodingInterviewSimulationProfile, CanonicalQuestionResponse, CanonicalSimulationProfile, Question } from "../../content/canonical/questionTypes";
import type { ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { createTrainingSession, createTrainingSessionDraft, getTrackRegistration } from "../../domain";
import type { TrainingFamilyRuntime, TrainingLifecyclePorts, TrainingCatalog, TrainingInteractionPort } from "../trainingLifecycle/contracts";
import { TrainingLifecycleUseCases } from "../trainingLifecycle/TrainingLifecycleUseCases";
import { createTrainingFamilyRuntimeResolver } from "../trainingFamilyRuntimeResolver";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import { getActiveMutationJournal, getActiveTrainingSession, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions } from "../../storage/repositories";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { commitTrainingOutcome } from "../learningMutations/commitTrainingOutcome";
import { commitTrainingSessionStart } from "../learningMutations/commitTrainingSessionStart";
import { recoverPendingMutation } from "../learningMutations/recoverPendingMutation";
import { createAttemptId } from "../learningMutations/identity";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createCanonicalAttempt, exactCanonicalQuestionRef } from "./canonicalFamilyMechanics";
import { buildCanonicalSessionPlan, prepareCanonicalPlanOccurrences, validateCanonicalSessionPlan } from "./canonicalSessionPlanMechanics";
import { prepareCanonicalOptionOrder } from "./canonicalOptionOrder";
import { qualifyPackageAttempts } from "../../domain/learning/packageCompletionRule";

const NOW = "2026-01-01T00:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();
afterEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
const responseFor = (question: Question): CanonicalQuestionResponse => question.answer;
const wrongResponse = (question: Question): CanonicalQuestionResponse => {
  if (question.interaction.type === "choice_single") { const q = question as Extract<Question, { interaction: { type: "choice_single" } }>; return { type: "choice_single", optionId: q.interaction.options.find((x) => x.optionId !== q.answer.optionId)!.optionId }; }
  if (question.interaction.type === "choice_multiple") { const q = question as Extract<Question, { interaction: { type: "choice_multiple" } }>; return { type: "choice_multiple", optionIds: [q.interaction.options.find((x) => !q.answer.optionIds.includes(x.optionId))!.optionId] }; }
  if (question.interaction.type === "ordering") { const q = question as Extract<Question, { interaction: { type: "ordering" } }>; return { type: "ordering", orderedElementIds: [...q.answer.orderedElementIds].reverse() }; }
  return { type: question.interaction.type, selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((d) => [d.dimensionId, [d.values[0]!.valueId]])) };
};
const itemRef = (track: { trackId: string; contentVersion: string; artifactSha256: string }, questionId: string) => ({ trackId: track.trackId, questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
const reviewFor = (item: TrainingAttempt<unknown>["item"], dueAt: string, sourceSessionId = "old"): ReviewQueueEntry => ({ id: "review:stable", trackId: item.trackId, sourceAttemptId: "old-attempt", sourceSessionId, sourceItem: item, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt, createdAt: NOW, consecutiveAfterDueSuccesses: 0, persistent: false });

test("real loader prepares all 29 modes across nine tracks", async () => {
  const catalog = await catalogPromise; let modes = 0;
  for (const trackId of catalog.tracks) for (const mode of catalog.getTrack(trackId).modes) {
    const track = catalog.getTrack(trackId); const question = track.getPool(mode.modeId)[0]!;
    const reviews = mode.selection.kind === "evidence_conditioned" ? [reviewFor(itemRef(track, question.questionId), NOW)] : [];
    const prepared = await createCanonicalTrainingFamilyRuntime(track).prepare({ trackId, modeId: mode.modeId, request: { sessionId: `${trackId}:${mode.modeId}`, requestedLength: mode.defaultRequestedLength, ...(mode.selection.kind === "evidence_conditioned" ? { reviewSource: "due_queue" } : {}) }, attempts: [], reviews, now: NOW });
    assert.ok(prepared.session.actualLength > 0); await createCanonicalTrainingFamilyRuntime(track).validateResume({ session: prepared.session, draft: null }); modes += 1;
  }
  assert.equal(modes, 29);
});

test("short evidence-conditioned sessions remain resumable below the node-mode minimum", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("claude-certified-architect-professional-certification");
  const mode = track.modes.find((candidate) => candidate.selection.kind === "evidence_conditioned")!;
  const question = track.getPool(mode.modeId)[0]!;
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId,
    request: { sessionId: "short-review-resume", requestedLength: mode.requestedLengths[0]!, reviewSource: "due_queue" },
    attempts: [], reviews: [reviewFor(itemRef(track, question.questionId), NOW)], now: NOW });
  assert.equal(prepared.session.actualLength, 1);
  assert.ok(prepared.session.actualLength < mode.minimumActualLength);
  await runtime.validateResume({ session: prepared.session, draft: null });
});

test("diagnostic recommendation prepares a pinned single-unit Focus pool and refuses out-of-scope resume", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const mode = track.getMode("certification-focus-practice");
  assert.equal(mode.selection.kind, "node");
  const nodeId = mode.selection.nodeId;
  const eligibleUnits = [...new Set(track.getPool(mode.modeId).filter((question) => question.nodeId === nodeId).map((question) => question.mentalUnitId))]
    .filter((mentalUnitId) => track.getPool(mode.modeId).filter((question) => question.nodeId === nodeId && question.mentalUnitId === mentalUnitId).length >= mode.requestedLengths[0]!);
  assert.ok(eligibleUnits.length >= 2, "the verified Focus pool must have at least two independently selectable units");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepare = (mentalUnitId: string) => runtime.prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: `diagnostic-target:${mentalUnitId}`, requestedLength: mode.requestedLengths[0]!, mentalUnitId, expectedContentVersion: track.contentVersion, expectedArtifactSha256: track.artifactSha256 },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const first = await prepare(eligibleUnits[0]!);
  const second = await prepare(eligibleUnits[1]!);
  for (const [mentalUnitId, prepared] of [[eligibleUnits[0]!, first], [eligibleUnits[1]!, second]] as const) {
    assert.equal(prepared.session.configurationSnapshot.mentalUnitId, mentalUnitId);
    assert.ok(prepared.session.itemOrder.length >= mode.minimumActualLength);
    assert.ok(prepared.session.itemOrder.every((occurrence) => {
      const question = track.getQuestion(occurrence.item.questionId);
      return occurrence.item.contentVersion === track.contentVersion && occurrence.item.artifactSha256 === track.artifactSha256 && question?.nodeId === nodeId && question.mentalUnitId === mentalUnitId;
    }));
    await runtime.validateResume({ session: prepared.session, draft: null });
  }
  assert.notDeepEqual(first.session.itemOrder.map((entry) => entry.item.questionId), second.session.itemOrder.map((entry) => entry.item.questionId));
  assert.notEqual(first.session.planFingerprint, second.session.planFingerprint);
  await assert.rejects(prepare("not-an-eligible-mental-unit"), /insufficient eligible content/i);
  await assert.rejects(runtime.prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "diagnostic-target-stale-pin", requestedLength: mode.requestedLengths[0]!, mentalUnitId: eligibleUnits[0], expectedContentVersion: "stale", expectedArtifactSha256: track.artifactSha256 },
    attempts: [], reviews: [], now: NOW,
  }), /content identity is unavailable/i);

  const otherUnitQuestion = track.getPool(mode.modeId).find((question) => question.nodeId === nodeId && question.mentalUnitId === eligibleUnits[1])!;
  const original = first.session;
  const occurrence = original.itemOrder[0]!;
  const changedOrder = [{ ...occurrence, item: itemRef(track, otherUnitQuestion.questionId) }, ...original.itemOrder.slice(1)];
  const changedOptions = { ...original.optionOrderByOccurrence, [occurrence.occurrenceId]: otherUnitQuestion.interaction.type === "choice_single" || otherUnitQuestion.interaction.type === "choice_multiple" ? otherUnitQuestion.interaction.options.map((option) => option.optionId) : [] };
  const tamperedBase = createTrainingSession({ ...original, itemOrder: changedOrder, optionOrderByOccurrence: changedOptions, planFingerprint: undefined, taxonomyVersion: undefined });
  const fingerprint = await createContentSessionPlanFingerprint({ ...tamperedBase, taxonomyVersion: "canonical-content-v1" });
  const tampered = createTrainingSession({ ...tamperedBase, taxonomyVersion: "canonical-content-v1", planFingerprint: fingerprint });
  await assert.rejects(runtime.validateResume({ session: tampered, draft: null }), /session scope or minimum length is invalid/i);
});

test("V3 unit target resolves a Premium chapter, selects a latest-noncorrect question and resumes under the exact pin", async () => {
  const catalog = await catalogPromise;
  const sourceTrack = catalog.getTrack("claude-certified-architect-professional-certification");
  const freeMode = sourceTrack.getMode("certification-focus-practice");
  assert.equal(freeMode.selection.kind, "node");
  const freeNodeId = freeMode.selection.nodeId;
  const targetQuestion = sourceTrack.questions.find((question) => question.nodeId !== freeNodeId)!;
  const targetUnitPool = sourceTrack.questions.filter((question) => question.nodeId === targetQuestion.nodeId && question.mentalUnitId === targetQuestion.mentalUnitId);
  assert.ok(targetUnitPool.length >= 4, "the required Premium unit must have four reachable source questions");
  const selectedUnitQuestions = targetUnitPool.slice(0, 4);
  const rule = {
    ruleVersion: 3 as const,
    chapters: [{ nodeId: targetQuestion.nodeId, mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const,
      units: [{ mentalUnitId: targetQuestion.mentalUnitId, requiredCorrectQuestionCount: 4 as const }] }],
  };
  const track = { ...sourceTrack, completionRule: rule } as typeof sourceTrack;
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const attempts = [
    ...selectedUnitQuestions.map((question, index) => ({
      id: `v3-correct-${index}`, sessionId: `v3-correct-${index}`, trackId: track.trackId, modeId: "prior", occurrenceId: `v3-correct-${index}:occurrence`,
      item: itemRef(track, question.questionId), response: question.answer, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
      reviewEvidence: { sourceItem: itemRef(track, question.questionId), taxonomyOrSkillRefs: [] }, answeredAt: NOW, committedAt: NOW,
    } as TrainingAttempt<unknown>)),
    {
      id: "v3-latest-wrong", sessionId: "v3-latest-wrong", trackId: track.trackId, modeId: "prior", occurrenceId: "v3-latest-wrong:occurrence",
      item: itemRef(track, selectedUnitQuestions[2]!.questionId), response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
      reviewEvidence: { sourceItem: itemRef(track, selectedUnitQuestions[2]!.questionId), taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-02T00:00:00.000Z", committedAt: "2026-01-02T00:00:00.000Z",
    } as TrainingAttempt<unknown>,
  ];
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: freeMode.modeId, request: {
    sessionId: "v3-premium-unit-target", requestedLength: freeMode.defaultRequestedLength, mentalUnitId: targetQuestion.mentalUnitId,
    expectedContentVersion: track.contentVersion, expectedArtifactSha256: track.artifactSha256,
  }, attempts, reviews: [], now: NOW });
  assert.equal(prepared.session.configurationSnapshot.mentalUnitId, targetQuestion.mentalUnitId);
  assert.equal(prepared.session.actualLength, Math.min(freeMode.defaultRequestedLength, targetUnitPool.length));
  assert.ok(prepared.session.actualLength >= 4);
  const latestByQuestion = new Map<string, TrainingAttempt<unknown>>();
  for (const attempt of qualifyPackageAttempts(track, attempts)) latestByQuestion.set(attempt.item.questionId, attempt);
  assert.notEqual(latestByQuestion.get(prepared.session.itemOrder[0]!.item.questionId)?.result.kind, "correct",
    "the first selected Premium-unit question must have no latest correct answer");
  assert.ok(prepared.session.itemOrder.every((occurrence) => track.getQuestion(occurrence.item.questionId)?.nodeId === targetQuestion.nodeId && track.getQuestion(occurrence.item.questionId)?.mentalUnitId === targetQuestion.mentalUnitId));
  await runtime.validateResume({ session: prepared.session, draft: null });
  await assert.rejects(runtime.prepare({ trackId: track.trackId, modeId: freeMode.modeId,
    request: { sessionId: "v3-stale-unit-pin", requestedLength: freeMode.defaultRequestedLength, mentalUnitId: targetQuestion.mentalUnitId, expectedContentVersion: "stale", expectedArtifactSha256: track.artifactSha256 },
    attempts, reviews: [], now: NOW }), /content identity is unavailable/i);
});

test("canonical dashboard independently counts due and future manual review entries", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const dueQuestion = track.questions[1]!;
  const manualQuestion = track.questions[0]!;
  const due: ReviewQueueEntry = {
    ...reviewFor(itemRef(track, dueQuestion.questionId), "2025-12-31T00:00:00.000Z"),
    id: "review:dashboard-mixed-due",
    reasons: ["scheduled_retrieval"],
    stage: "retention7",
    policyVersion: "bizq04-v1",
    status: "active",
  };
  const manual: ReviewQueueEntry = {
    ...reviewFor(itemRef(track, manualQuestion.questionId), "2026-01-08T00:00:00.000Z"),
    id: "review:dashboard-mixed-manual",
    reasons: ["scheduled_retrieval", "manual_mark"],
    stage: "retention7",
    policyVersion: "bizq04-v1",
    manualRequestId: `manual:${"c".repeat(64)}`,
    status: "active",
  };
  const dashboard = await createCanonicalTrainingFamilyRuntime(track).queryDashboard({
    activeSession: null,
    trackId: track.trackId,
    attempts: [],
    reviews: [due, manual],
    now: NOW,
  }) as { dueReviewCount: number; manualReviewCount: number };
  assert.deepEqual(
    { dueReviewCount: dashboard.dueReviewCount, manualReviewCount: dashboard.manualReviewCount },
    { dueReviewCount: 1, manualReviewCount: 1 },
  );
});

test("each production family scores its submitted answer once and reuses that result for feedback", async () => {
  const catalog = await catalogPromise; const seenFamilies = new Set<string>();
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    const familyId = getTrackRegistration(track.trackId).familyId;
    if (seenFamilies.has(familyId)) continue;
    const interactions = createTrainingInteractionPort(track); let evaluationCount = 0;
    const countedInteractions = Object.freeze({ ...interactions, evaluate(questionId: string, response: unknown) { evaluationCount += 1; return interactions.evaluate(questionId, response); } });
    const runtime = canonicalTrainingFamilyResolver.resolve(createTrainingCatalog(track), familyId, countedInteractions);
    const modeId = runtime.getPlanningModeBinding().practiceModeId;
    assert.ok(modeId, `${familyId} declares a practice planning mode`);
    const mode = track.getMode(modeId);
    const prepared = await runtime.prepare({ trackId, modeId, request: { sessionId: `family-submit:${trackId}`, requestedLength: mode.requestedLengths[0]! }, attempts: [], reviews: [], now: NOW });
    const current = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
    const response = responseFor(current);
    const submission = await runtime.submitPractice({ session: prepared.session, response, attempts: [], reviews: [], now: NOW });
    assert.equal(submission.attempt.result.kind, "correct");
    assert.equal(evaluationCount, 1, `${familyId} submission evaluates once`);
    assert.equal(composeCanonicalFeedback(current, response, submission.attempt.result).correctness, submission.attempt.result.kind);
    assert.equal(evaluationCount, 1, `${familyId} feedback reuses the submitted result without reevaluation`);
    seenFamilies.add(familyId);
  }
  assert.deepEqual([...seenFamilies].sort(), ["certification", "coding_interview", "design_interview"]);
});

test("a separately registered family submits an exact pinned answer through the production journal and fresh recovery", async () => {
  const storage = installMemoryStorage();
  const track = (await catalogPromise).getTrack("coding-interview-dsa-problem-solving");
  const familyId = "registered_fixture_family";
  const resolver = createTrainingFamilyRuntimeResolver([{ familyId, create: (catalog, interactions) => registeredFixtureFamily(catalog, interactions) }]);
  const trainingCatalog = createTrainingCatalog(track);
  const resolveFixture = () => resolver.resolve(trainingCatalog, familyId, createTrainingInteractionPort(track));
  const sessionId = "arch04-registered-family-journal";
  const ports = (): TrainingLifecyclePorts => ({
    clock: { now: () => NOW },
    sessionIds: { async create() { return sessionId; } },
    tracks: { getTrackRegistration(trackId) { assert.equal(trackId, track.trackId); return { id: trackId, familyId }; } },
    packages: {
      async resolveForPreparation(input) { assert.equal(input.familyId, familyId); return { track: trainingCatalog, runtime: resolveFixture() }; },
      async resolveExactArtifact(input) { assert.equal(input.artifactSha256, track.artifactSha256); assert.equal(input.contentVersion, track.contentVersion); return { track: trainingCatalog, runtime: resolveFixture() }; },
      async resolveForDiscovery(trackId, requestedFamilyId) { assert.equal(trackId, track.trackId); assert.equal(requestedFamilyId, familyId); return { track: trainingCatalog, runtime: resolveFixture() }; },
    },
    repositories: {
      async getActiveSession() { return getActiveTrainingSession(productionTrackAdmissionContext); },
      async getSession(id) { return (await getTrainingSessions(productionTrackAdmissionContext)).value.find((entry) => entry.id === id) ?? null; },
      async getHistory() { return (await getTrainingSessions(productionTrackAdmissionContext)).value; },
      async getAttempts() { return (await getTrainingAttempts(productionTrackAdmissionContext)).value; },
      async getReviews() { return (await getReviewQueueItems(productionTrackAdmissionContext)).value; },
      async getDraft() { return null; },
      async getResult(id) { return getTrainingSessionResult(id, productionTrackAdmissionContext); },
      async getPendingMutation() {
        const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
        if (!journal || journal.operation === "accept_goal_plan" || journal.operation === "resolve_account_sync_conflict") return null;
        return Object.freeze({ operation: journal.operation, status: journal.status, sessionId: journal.sessionId, trackId: journal.trackId, commandFingerprint: journal.commandIdentity.fingerprint, planFingerprint: journal.planFingerprint });
      },
      captureDraftStorageLease() { return null; },
      async saveDraft() {},
    },
    mutations: {
      async start(prepared) { await commitTrainingSessionStart({ session: prepared.session, draft: prepared.draft, createdAt: prepared.session.startedAt }); },
      async submitPractice(outcome) {
        return commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session,
          reviews: outcome.reviewMutations.filter((entry) => entry.kind === "upsert").map((entry) => entry.entry),
          resolvedReviews: outcome.reviewMutations.filter((entry) => entry.kind === "remove").map((entry) => entry.entry),
          reviewBaseline: outcome.reviewBaseline, reviewSnapshotConflict: outcome.reviewSnapshotConflict, createdAt: outcome.attempt.committedAt });
      },
      async retryMutationCommand() { throw new Error("This acceptance path must recover the original journal, not create a retry command."); },
      async advance() { throw new Error("Unexpected advance in the single-answer acceptance path."); },
      async completeWithResult() { throw new Error("Unexpected completion in the single-answer acceptance path."); },
      async finalize() { throw new Error("Unexpected simulation finalization in the practice acceptance path."); },
      async abandon() { throw new Error("Unexpected abandonment in the practice acceptance path."); },
      async recover() { await recoverPendingMutation(); },
      async reset() { throw new Error("Unexpected reset in the single-answer acceptance path."); },
    },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
  });

  const productionFamily = getTrackRegistration(track.trackId).familyId;
  const lifecycle = new TrainingLifecycleUseCases(ports());
  const mode = track.getMode("coding-interview-guided-practice");
  const prepared = await lifecycle.startSession({ trackId: track.trackId, modeId: mode.modeId, request: { requestedLength: mode.requestedLengths[0] } });
  assert.equal(mode.minimumActualLength, 10, "the exact accepted Coding mode requires a real ten-item session for this extension proof");
  assert.equal(prepared.session.requestedLength, 10);
  assert.equal(prepared.session.actualLength, 10, "the fixture family may not collapse this accepted mode into a one-item recovery proof");
  assert.equal(prepared.session.itemOrder.length, 10);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  const response = responseFor(question);
  const occurrence = prepared.session.itemOrder[prepared.session.currentItemIndex]!;
  const expectedAttemptId = await createAttemptId(prepared.session.id, occurrence.occurrenceId, response);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(expectedAttemptId) });
  await assert.rejects(lifecycle.submitPracticeResponse(response), /did not reach a verified canonical outcome/u);
  const retained = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  assert.equal(retained?.operation, "submit_training_outcome", "a failed physical write leaves the exact production journal for recovery");
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.some((attempt) => attempt.sessionId === sessionId), false);
  storage.setFailurePlan(null);
  await lifecycle.recoverActiveTrainingOperation();
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter((attempt) => attempt.sessionId === sessionId);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0]!.id, expectedAttemptId);
  assert.equal(attempts[0]!.trackId, track.trackId);

  const freshTrack = (await loadCanonicalRuntimeCatalog()).getTrack(track.trackId);
  const freshLifecycle = new TrainingLifecycleUseCases(portsForFresh());
  const resumed = await freshLifecycle.resumeActiveSession();
  assert.equal(resumed.id, sessionId);
  assert.equal(resumed.contentVersion, freshTrack.contentVersion);
  assert.equal(resumed.artifactSha256, freshTrack.artifactSha256);
  const freshAttempt = (await getTrainingAttempts(productionTrackAdmissionContext)).value.find((attempt) => attempt.sessionId === sessionId)!;
  const freshQuestion = freshTrack.getQuestion(freshAttempt.item.questionId)!;
  assert.equal(composeCanonicalFeedback(freshQuestion, freshAttempt.response as CanonicalQuestionResponse, freshAttempt.result).correctness, freshAttempt.result.kind);
  assert.equal(getTrackRegistration(track.trackId).familyId, productionFamily, "test resolver registration does not change production track-family admission");

  function portsForFresh() {
    const freshCatalog = createTrainingCatalog(freshTrack);
    const freshRuntime = () => resolver.resolve(freshCatalog, familyId, createTrainingInteractionPort(freshTrack));
    return { ...ports(), packages: {
      async resolveForPreparation(input: Parameters<TrainingLifecyclePorts["packages"]["resolveForPreparation"]>[0]) { assert.equal(input.familyId, familyId); return { track: freshCatalog, runtime: freshRuntime() }; },
      async resolveExactArtifact(input: Parameters<TrainingLifecyclePorts["packages"]["resolveExactArtifact"]>[0]) { assert.equal(input.artifactSha256, freshTrack.artifactSha256); return { track: freshCatalog, runtime: freshRuntime() }; },
      async resolveForDiscovery() { return { track: freshCatalog, runtime: freshRuntime() }; },
    } } satisfies TrainingLifecyclePorts;
  }
});

function registeredFixtureFamily(catalog: TrainingCatalog, interactions: TrainingInteractionPort): TrainingFamilyRuntime {
  const modeId = "coding-interview-guided-practice";
  const buildPracticePlan = async (sessionId: string, requestedLength: number, now: string) => {
    const mode = catalog.getMode(modeId);
    if (!mode.requestedLengths.includes(requestedLength)) throw new Error("The fixture family received an unsupported requested length.");
    const questions = catalog.getPool(modeId).slice(0, requestedLength);
    if (questions.length < mode.minimumActualLength) throw new Error("The fixture's exact Coding package pool is too small.");
    const prepared = prepareCanonicalPlanOccurrences(catalog, interactions, sessionId, questions.map((question) => ({ item: exactCanonicalQuestionRef(catalog, question.questionId) })));
    return buildCanonicalSessionPlan(catalog, { sessionId, modeId,
      configurationSnapshot: { kind: "practice", timer: "elapsedForeground", feedbackMode: "afterEachAnswer", answerChanges: "none", submission: "perItem", reinsertEnabled: false },
      requestedLength, preparedOccurrences: prepared, conditionalReinsertSlots: [], startedAt: now });
  };
  return Object.freeze({
    familyId: "registered_fixture_family",
    interactions,
    getPlanningModeBinding: () => Object.freeze({ trackId: catalog.trackId, diagnosticModeId: null, practiceModeId: modeId, dueReviewModeId: null }),
    async prepare(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]) {
      if (input.trackId !== catalog.trackId || input.modeId !== modeId) throw new Error("The registered fixture family received a foreign track or mode.");
      const request = input.request as { sessionId?: unknown; requestedLength?: unknown };
      if (typeof request?.sessionId !== "string" || !request.sessionId.trim() || typeof request.requestedLength !== "number") throw new Error("The registered fixture family requires a session identity and length.");
      const session = await buildPracticePlan(request.sessionId, request.requestedLength, input.now);
      return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
    },
    async validateResume({ session, draft }: Parameters<TrainingFamilyRuntime["validateResume"]>[0]) {
      if (draft || session.trackId !== catalog.trackId || session.modeId !== modeId
        || JSON.stringify(session.configurationSnapshot) !== JSON.stringify({ kind: "practice", timer: "elapsedForeground", feedbackMode: "afterEachAnswer", answerChanges: "none", submission: "perItem", reinsertEnabled: false })) {
        throw new Error("The registered fixture family cannot resume this session shape.");
      }
      const mode = catalog.getMode(modeId);
      if (!mode.requestedLengths.includes(session.requestedLength) || session.actualLength < mode.minimumActualLength) throw new Error("The registered fixture family cannot resume an undersized session.");
      await validateCanonicalSessionPlan(catalog, interactions, session);
    },
    async submitPractice(input: Parameters<TrainingFamilyRuntime["submitPractice"]>[0]) {
      await this.validateResume({ session: input.session, draft: null });
      const occurrence = input.session.itemOrder[input.session.currentItemIndex]!;
      const question = catalog.getQuestion(occurrence.item.questionId);
      if (!question) throw new Error("The exact fixture question is unavailable.");
      const evaluation = interactions.evaluate(question.questionId, input.response);
      if (!evaluation.complete || !evaluation.result) throw new Error("The fixture response is incomplete or invalid.");
      const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: input.response, result: evaluation.result,
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }, answeredAt: input.now, committedAt: input.now });
      return Object.freeze({ attempt, session: input.session, reviewMutations: Object.freeze([]), reviewBaseline: input.reviews });
    },
    async finalizePractice() { throw new Error("The acceptance fixture does not finalize sessions."); },
    async finalizeSimulation() { throw new Error("The acceptance fixture does not run simulations."); },
    async validateDraftCommand() { throw new Error("The acceptance fixture does not write drafts."); },
    async queryDashboard() { throw new Error("The acceptance fixture does not serve dashboard queries."); },
    async queryReview() { throw new Error("The acceptance fixture does not serve review queries."); },
  });
}

test("actual Design runtime rejects a sparse ordering response before creating an outcome", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const question = track.getQuestion("fesd-n01-b01-i003")!;
  assert.ok(question && question.interaction.type === "ordering");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: "design-interview-learn-framework",
    request: { sessionId: "design-sparse-response", requestedLength: 10 },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const first = prepared.session.itemOrder[0]!;
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, first.item),
  };
  const base = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
  await runtime.validateResume({ session, draft: null });
  const sparse = [...(question as Extract<Question, { interaction: { type: "ordering" } }>).answer.orderedElementIds];
  delete sparse[1];
  await assert.rejects(() => runtime.submitPractice({ session, response: { type: "ordering", orderedElementIds: sparse }, attempts: [], reviews: [], now: NOW }), /incomplete or invalid/u);
});

test("evidence permits one item and multi-source Coding review requires an explicit source", async () => {
  const catalog = await catalogPromise; const gcp = catalog.getTrack("google-cloud-associate-cloud-engineer"); const mode = gcp.modes.find((x) => x.selection.kind === "evidence_conditioned")!; const question = gcp.getPool(mode.modeId)[0]!;
  const prepared = await createCanonicalTrainingFamilyRuntime(gcp).prepare({ trackId: gcp.trackId, modeId: mode.modeId, request: { sessionId: "evidence", requestedLength: 20 }, attempts: [], reviews: [reviewFor(itemRef(gcp, question.questionId), NOW)], now: NOW }); assert.equal(prepared.session.actualLength, 1);
  const coding = catalog.getTrack("coding-interview-dsa-problem-solving"); const codingMode = coding.getMode("coding-interview-weak-area-review"); const codingQuestion = coding.getPool(codingMode.modeId)[0]!;
  const miss = { id: "miss", sessionId: "old", occurrenceId: "old:0", trackId: coding.trackId, modeId: "old", item: itemRef(coding, codingQuestion.questionId), response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: itemRef(coding, codingQuestion.questionId), taxonomyOrSkillRefs: [] }, answeredAt: NOW, committedAt: NOW } as TrainingAttempt<unknown>;
  await assert.rejects(createCanonicalTrainingFamilyRuntime(coding).prepare({ trackId: coding.trackId, modeId: codingMode.modeId, request: { sessionId: "coding-evidence", requestedLength: 20 }, attempts: [miss], reviews: [], now: NOW }), /explicit source/);
});

test("coding due review binds the exact cycle snapshot and advances one policy interval per qualified answer", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("coding-interview-dsa-problem-solving"); const runtime = createCanonicalTrainingFamilyRuntime(track); const mode = track.getMode("coding-interview-learn-approach"); const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "review", requestedLength: 10 }, attempts: [], reviews: [], now: NOW }); const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  const bad = await runtime.submitPractice({ session: prepared.session, response: wrongResponse(question), attempts: [], reviews: [], now: NOW }); assert.notEqual(bad.attempt.result.kind, "correct"); assert.equal(bad.reviewMutations[0]?.kind, "upsert"); if (bad.reviewMutations[0]?.kind !== "upsert") return; assert.equal(bad.reviewMutations[0].entry.stage, "repair24"); assert.equal(bad.reviewMutations[0].entry.dueAt, "2026-01-02T00:00:00.000Z");
  const priorDue = bad.reviewMutations[0].entry;
  const dueMode = track.getMode("coding-interview-weak-area-review");
  const dueSession = await runtime.prepare({ trackId: track.trackId, modeId: dueMode.modeId, request: { sessionId: "review-due", requestedLength: dueMode.requestedLengths[0]!, reviewSource: "due_queue" }, attempts: [], reviews: [priorDue], now: priorDue.dueAt! });
  const dueOccurrence = dueSession.session.itemOrder[0]!;
  assert.equal(dueOccurrence.reviewSourceSnapshot?.reviewEntryId, priorDue.id);
  const first = await runtime.submitPractice({ session: dueSession.session, response: responseFor(question), attempts: [], reviews: [priorDue], now: "2026-01-02T00:00:00.000Z" });
  assert.equal(first.reviewMutations[0]?.kind, "upsert"); if (first.reviewMutations[0]?.kind !== "upsert") return;
  assert.equal(first.reviewMutations[0].entry.id, priorDue.id); assert.equal(first.reviewMutations[0].entry.stage, "repair7"); assert.equal(first.reviewMutations[0].entry.dueAt, "2026-01-09T00:00:00.000Z");
  const stale = { ...first.reviewMutations[0].entry, dueAt: "2026-01-10T00:00:00.000Z" };
  const staleAnswer = await runtime.submitPractice({ session: dueSession.session, response: responseFor(question), attempts: [], reviews: [stale], now: "2026-01-11T00:00:00.000Z" });
  assert.deepEqual(staleAnswer.reviewMutations, [], "a changed due cycle cannot inherit credit from the frozen occurrence");
  assert.equal(staleAnswer.reviewSnapshotConflict, true);
});

test("a standalone manual request starts retention at seven days and an incorrect result starts repair at 24 hours", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const item = itemRef(track, question.questionId);
  const manual: ReviewQueueEntry = {
    ...reviewFor(item, NOW),
    reasons: ["manual_mark"],
    persistent: true,
    policyVersion: "bizq04-v1",
    stage: "manual_requested",
    manualRequestId: `manual:${"a".repeat(64)}`,
    status: "active",
  };
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "manual-review-correct", requestedLength: 1, reviewSource: "due_queue" }, attempts: [], reviews: [manual], now: NOW });
  const correct = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [manual], now: NOW });
  const correctMutation = correct.reviewMutations[0];
  assert.equal(correctMutation?.kind, "upsert");
  if (correctMutation?.kind !== "upsert") return;
  assert.equal(correctMutation.entry.stage, "retention7");
  assert.equal(correctMutation.entry.dueAt, "2026-01-08T00:00:00.000Z");
  assert.deepEqual(correctMutation.entry.reasons, ["scheduled_retrieval"]);
  assert.equal(correctMutation.entry.persistent, false);
  assert.equal(correctMutation.entry.manualRequestId, undefined);

  const wrongSession = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "manual-review-wrong", requestedLength: 1, reviewSource: "due_queue" }, attempts: [], reviews: [manual], now: NOW });
  const incorrect = await runtime.submitPractice({ session: wrongSession.session, response: wrongResponse(question), attempts: [], reviews: [manual], now: NOW });
  const incorrectMutation = incorrect.reviewMutations[0];
  assert.equal(incorrectMutation?.kind, "upsert");
  if (incorrectMutation?.kind !== "upsert") return;
  assert.equal(incorrectMutation.entry.stage, "repair24");
  assert.equal(incorrectMutation.entry.dueAt, "2026-01-02T00:00:00.000Z");
  assert.deepEqual(incorrectMutation.entry.reasons, ["incorrect"]);
});

test("due-queue snapshots bind the identity of a manual request overlay", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const item = itemRef(track, question.questionId);
  const manual: ReviewQueueEntry = {
    ...reviewFor(item, NOW), reasons: ["manual_mark"], persistent: true, manualRequestId: `manual:${"b".repeat(64)}`,
    policyVersion: "bizq04-v1", stage: "manual_requested", status: "active",
  };
  const prepared = await createCanonicalTrainingFamilyRuntime(track).prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "manual-review-source-snapshot", requestedLength: 1, reviewSource: "due_queue" },
    attempts: [],
    reviews: [manual],
    now: NOW,
  });
  assert.deepEqual(prepared.session.itemOrder[0]?.reviewSourceSnapshot, {
    source: "due_queue",
    reviewEntryId: manual.id,
    sourceAttemptId: manual.sourceAttemptId,
    manualRequestId: manual.manualRequestId,
    dueAt: manual.dueAt,
    policyVersion: "bizq04-v1",
    stage: "manual_requested",
  });
  await createCanonicalTrainingFamilyRuntime(track).validateResume({ session: prepared.session, draft: null });
});

test("ordinary wrong and partial work preserve an unrelated manual overlay", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const reviewMode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(reviewMode.modeId).find((entry) => entry.interaction.type === "choice_multiple" && entry.answer.type === "choice_multiple" && entry.answer.optionIds.length > 1)!;
  if (question.interaction.type !== "choice_multiple" || question.answer.type !== "choice_multiple") throw new Error("Expected a multi-select question for a partial-scoring practice fixture.");
  const mode = track.modes.find((entry) => entry.selection.kind !== "evidence_conditioned" && !entry.modeId.endsWith("-simulation") && track.getPool(entry.modeId).some((candidate) => candidate.questionId === question.questionId))!;
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "manual-overlay-partial-ordinary", requestedLength: mode.requestedLengths[0]! }, attempts: [], reviews: [], now: NOW });
  const first = prepared.session.itemOrder[0]!;
  const item = itemRef(track, question.questionId);
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0 ? { ...entry, item } : entry);
  const optionOrderByOccurrence = { ...prepared.session.optionOrderByOccurrence, [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, item) };
  const base = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
  const response: CanonicalQuestionResponse = { type: "choice_multiple", optionIds: question.answer.optionIds.slice(0, -1) };
  const occurrence = session.itemOrder[0]!;
  assert.equal(occurrence.item.questionId, question.questionId);
  const reviewItem = occurrence.item;
  const manualOverlay: ReviewQueueEntry = {
    ...reviewFor(reviewItem, NOW),
    reasons: ["incorrect", "manual_mark"],
    persistent: true,
    consecutiveAfterDueSuccesses: 0,
    manualRequestId: `manual:${"e".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "repair24",
    status: "active",
  };
  const submitted = await runtime.submitPractice({ session, response, attempts: [], reviews: [manualOverlay], now: NOW });
  assert.equal(submitted.attempt.result.kind, "partial");
  const mutation = submitted.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.deepEqual(mutation.entry.reasons, ["partial", "manual_mark"]);
  assert.equal(mutation.entry.manualRequestId, manualOverlay.manualRequestId);
  assert.equal(mutation.entry.stage, "repair24");
});

test("a wrong answer from the exact due snapshot consumes only its captured manual overlay", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const overlay: ReviewQueueEntry = {
    ...reviewFor(itemRef(track, question.questionId), NOW),
    reasons: ["incorrect", "manual_mark"],
    persistent: true,
    consecutiveAfterDueSuccesses: 1,
    manualRequestId: `manual:${"f".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "repair7",
    status: "active",
  };
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "due-wrong-consumes-exact-manual", requestedLength: 1, reviewSource: "due_queue" }, attempts: [], reviews: [overlay], now: NOW });
  const submitted = await runtime.submitPractice({ session: prepared.session, response: wrongResponse(question), attempts: [], reviews: [overlay], now: NOW });
  const mutation = submitted.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.deepEqual(mutation.entry.reasons, ["incorrect"]);
  assert.equal(mutation.entry.manualRequestId, undefined);
  assert.deepEqual([mutation.entry.stage, mutation.entry.dueAt, mutation.entry.consecutiveAfterDueSuccesses], ["repair24", "2026-01-02T00:00:00.000Z", 0]);
});

test("qualified due success promotes a manual-overlaid repair without carrying a ghost marker", async () => {
  const track = (await catalogPromise).getTrack("coding-interview-dsa-problem-solving");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const mode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const overlay: ReviewQueueEntry = {
    ...reviewFor(itemRef(track, question.questionId), NOW),
    reasons: ["incorrect", "manual_mark"],
    persistent: true,
    consecutiveAfterDueSuccesses: 0,
    manualRequestId: `manual:${"9".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "repair24",
    status: "active",
  };
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "due-success-consumes-repair-overlay", requestedLength: mode.requestedLengths[0]!, reviewSource: "due_queue" }, attempts: [], reviews: [overlay], now: NOW });
  const submitted = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [overlay], now: NOW });
  const mutation = submitted.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.deepEqual([mutation.entry.stage, mutation.entry.dueAt, mutation.entry.consecutiveAfterDueSuccesses, mutation.entry.persistent], ["repair7", "2026-01-08T00:00:00.000Z", 1, true]);
  assert.deepEqual(mutation.entry.reasons, ["incorrect"]);
  assert.equal(mutation.entry.manualRequestId, undefined);

  const legacy: ReviewQueueEntry = {
    ...reviewFor(itemRef(track, question.questionId), NOW),
    id: "review:legacy-error-manual-overlay",
    sourceAttemptId: "attempt:legacy-error-manual-overlay",
    reasons: ["incorrect", "manual_mark"],
    persistent: true,
    consecutiveAfterDueSuccesses: 1,
  };
  const legacyPrepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "legacy-due-success-consumes-manual-overlay", requestedLength: mode.requestedLengths[0]!, reviewSource: "due_queue" }, attempts: [], reviews: [legacy], now: NOW });
  assert.match(legacyPrepared.session.itemOrder[0]?.reviewSourceSnapshot?.manualRequestId ?? "", /^legacy-manual:/u);
  const legacySubmitted = await runtime.submitPractice({ session: legacyPrepared.session, response: responseFor(question), attempts: [], reviews: [legacy], now: NOW });
  const legacyMutation = legacySubmitted.reviewMutations[0];
  assert.equal(legacyMutation?.kind, "upsert");
  if (legacyMutation?.kind !== "upsert") return;
  assert.deepEqual([legacyMutation.entry.stage, legacyMutation.entry.consecutiveAfterDueSuccesses, legacyMutation.entry.reasons, legacyMutation.entry.manualRequestId], ["repair7", 1, ["incorrect"], undefined]);
});

test("future manual request is selectable now and a correct answer consumes only the overlay", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const item = itemRef(track, question.questionId);
  const original: ReviewQueueEntry = {
    ...reviewFor(item, "2026-01-08T00:00:00.000Z"),
    reasons: ["scheduled_retrieval", "manual_mark"],
    manualRequestId: `manual:${"c".repeat(64)}`,
    persistent: false,
    policyVersion: "bizq04-v1",
    stage: "retention7",
    status: "active",
  };
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "future-manual-request", requestedLength: 1, reviewSource: "manual_request" },
    attempts: [], reviews: [original], now: NOW,
  });
  const snapshot = prepared.session.itemOrder[0]?.reviewSourceSnapshot;
  assert.deepEqual(snapshot, {
    source: "manual_request", reviewEntryId: original.id, sourceAttemptId: original.sourceAttemptId,
    manualRequestId: original.manualRequestId, dueAt: original.dueAt, policyVersion: original.policyVersion, stage: original.stage,
  });
  const result = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [original], now: "2026-01-01T01:00:00.000Z" });
  const mutation = result.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.deepEqual(mutation.entry.reasons, ["scheduled_retrieval"]);
  assert.equal(mutation.entry.manualRequestId, undefined);
  assert.equal(mutation.entry.dueAt, original.dueAt);
  assert.equal(mutation.entry.stage, original.stage);
  assert.equal(mutation.entry.consecutiveAfterDueSuccesses, original.consecutiveAfterDueSuccesses);
  assert.equal(mutation.entry.persistent, original.persistent);
});

test("due queue wins after its date and stale off→on manual identity gets no credit", async () => {
  const track = (await catalogPromise).getTrack("frontend-system-design-interview");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const item = itemRef(track, question.questionId);
  const original: ReviewQueueEntry = {
    ...reviewFor(item, "2026-01-08T00:00:00.000Z"),
    reasons: ["scheduled_retrieval", "manual_mark"], manualRequestId: `manual:${"d".repeat(64)}`,
    persistent: false, policyVersion: "bizq04-v1", stage: "retention7", status: "active",
  };
  const preparedManual = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "manual-before-due", requestedLength: 1, reviewSource: "manual_request" }, attempts: [], reviews: [original], now: NOW });
  const changedRequest = { ...original, manualRequestId: `manual:${"e".repeat(64)}` };
  const stale = await runtime.submitPractice({ session: preparedManual.session, response: responseFor(question), attempts: [], reviews: [changedRequest], now: "2026-01-01T01:00:00.000Z" });
  assert.deepEqual(stale.reviewMutations, []);
  assert.equal(stale.reviewSnapshotConflict, true);

  const preparedDue = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "due-after-manual", requestedLength: 1, reviewSource: "due_queue" }, attempts: [], reviews: [original], now: original.dueAt! });
  assert.equal(preparedDue.session.itemOrder[0]?.reviewSourceSnapshot?.source, "due_queue");
  const due = await runtime.submitPractice({ session: preparedDue.session, response: responseFor(question), attempts: [], reviews: [original], now: original.dueAt! });
  const mutation = due.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.equal(mutation.entry.stage, "retention14");
  assert.equal(mutation.entry.manualRequestId, undefined);
  assert.deepEqual(mutation.entry.reasons, ["scheduled_retrieval"]);
});

test("new correct per-item work seeds seven-day retention for every declared non-review mode", async () => {
  const catalog = await catalogPromise;
  let checked = 0;
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    const runtime = createCanonicalTrainingFamilyRuntime(track);
    const perItemModes = track.modes.filter((mode) => mode.selection.kind !== "evidence_conditioned" && !mode.modeId.endsWith("-simulation"));
    for (const mode of perItemModes) {
      const prepared = await runtime.prepare({
        trackId,
        modeId: mode.modeId,
        request: { sessionId: `retention-seed:${trackId}:${mode.modeId}`, requestedLength: mode.requestedLengths[0] },
        attempts: [], reviews: [], now: NOW,
      });
      const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
      const submitted = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [], now: NOW });
      assert.equal(submitted.attempt.result.kind, "correct", `${trackId}/${mode.modeId} fixture must be a graded correct answer`);
      assert.equal(submitted.reviewMutations.length, 1, `${trackId}/${mode.modeId} correct work creates one maintenance cycle`);
      const mutation = submitted.reviewMutations[0]!;
      assert.equal(mutation.kind, "upsert");
      if (mutation.kind !== "upsert") continue;
      assert.equal(mutation.entry.sourceAttemptId, submitted.attempt.id);
      assert.equal(mutation.entry.stage, "retention7");
      assert.equal(mutation.entry.dueAt, "2026-01-08T00:00:00.000Z");
      checked += 1;
    }
  }
  const expectedModes = catalog.tracks.reduce((total, trackId) => total + catalog.getTrack(trackId).modes.filter((mode) => mode.selection.kind !== "evidence_conditioned" && !mode.modeId.endsWith("-simulation")).length, 0);
  assert.equal(checked, expectedModes, "every declared per-item mode must apply the same initial-retention policy");
});

test("only declared due-queue modes can advance a scheduled cycle across all families", async () => {
  const catalog = await catalogPromise;
  const cases = [
    ["google-cloud-associate-cloud-engineer", "certification-weak-area-review"],
    ["google-cloud-associate-cloud-engineer", "certification-quick-review"],
    ["coding-interview-dsa-problem-solving", "coding-interview-weak-area-review"],
    ["backend-system-design-interview", "design-interview-weak-area-review"],
    ["frontend-system-design-interview", "design-interview-weak-area-review"],
    ["object-oriented-design-interview", "design-interview-weak-area-review"],
  ] as const;

  for (const [trackId, modeId] of cases) {
    const track = catalog.getTrack(trackId);
    const mode = track.getMode(modeId);
    const runtime = createCanonicalTrainingFamilyRuntime(track);
    const question = track.getPool(modeId)[0]!;
    const sourceItem = itemRef(track, question.questionId);
    const existing: ReviewQueueEntry = {
      ...reviewFor(sourceItem, NOW), reasons: ["scheduled_retrieval"], persistent: false,
      policyVersion: "bizq04-v1", stage: "retention7", status: "active",
    };
    const prepared = await runtime.prepare({
      trackId, modeId,
      request: { sessionId: `due-mode-matrix:${trackId}:${modeId}`, requestedLength: mode.requestedLengths[0], reviewSource: "due_queue" },
      attempts: [], reviews: [existing], now: NOW,
    });
    assert.deepEqual(prepared.session.itemOrder[0]?.item, sourceItem, `${trackId}/${modeId} must select the exact due reference`);
    assert.equal(prepared.session.itemOrder[0]?.reviewSourceSnapshot?.source, "due_queue");
    const submitted = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [existing], now: NOW });
    assert.equal(submitted.attempt.result.kind, "correct");
    assert.equal(submitted.reviewMutations.length, 1);
    const mutation = submitted.reviewMutations[0]!;
    assert.equal(mutation.kind, "upsert");
    if (mutation.kind === "upsert") {
      assert.equal(mutation.entry.id, existing.id);
      assert.equal(mutation.entry.stage, "retention14");
      assert.equal(mutation.entry.dueAt, "2026-01-15T00:00:00.000Z");
      assert.equal(mutation.entry.completedAt, undefined);
    }
  }
});

test("resume rejects tampering while review queries retain due rows with historical source pins", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("google-cloud-associate-cloud-engineer"); const runtime = createCanonicalTrainingFamilyRuntime(track); const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "certification-diagnostic-baseline", request: { sessionId: "guard", requestedLength: 40 }, attempts: [], reviews: [], now: NOW });
  const tampered = { ...prepared.session, configurationSnapshot: { ...prepared.session.configurationSnapshot, feedbackMode: "atSessionEnd" } }; await assert.rejects(runtime.validateResume({ session: tampered, draft: null }));
  await assert.rejects(runtime.finalizePractice({ session: prepared.session, attempts: [], now: NOW })); await assert.rejects(runtime.queryReview({ trackId: "foreign", reviews: [], now: NOW }));
  const old = reviewFor(prepared.session.itemOrder[0]!.item, NOW); const view = await runtime.queryReview({ trackId: track.trackId, reviews: [old, { ...old, id: "old-artifact", sourceItem: { ...old.sourceItem, artifactSha256: "f".repeat(64) } }], now: NOW }); assert.equal((view as { due: readonly ReviewQueueEntry[] }).due.length, 2);
});

test("Claude Focus persists selectable feedback, scores single and multi-select, and finalizes complete evidence", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("claude-certified-architect-professional-certification");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepare = (sessionId: string, feedbackTiming?: "after_each_durable_submit" | "after_session_completion") => runtime.prepare({
    trackId: track.trackId,
    modeId: "certification-focus-practice",
    request: { sessionId, requestedLength: 40, mentalUnitId: "CCARP-D01-O03", ...(feedbackTiming ? { feedbackTiming } : {}) },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const immediate = await prepare("claude-focus-immediate", "after_each_durable_submit");
  let deferred = await prepare("claude-focus-deferred", "after_session_completion");
  const multiSelect = track.getPool("certification-focus-practice").find((question) => question.interaction.type === "choice_multiple" && question.mentalUnitId === "CCARP-D01-O03");
  if (multiSelect && !deferred.session.itemOrder.some((entry) => entry.item.questionId === multiSelect.questionId)) {
    const singleIndex = deferred.session.itemOrder.findIndex((entry) => track.getQuestion(entry.item.questionId)?.interaction.type === "choice_single");
    if (singleIndex >= 0) {
      const itemOrder = [...deferred.session.itemOrder];
      const occurrence = itemOrder[singleIndex]!;
      itemOrder[singleIndex] = { ...occurrence, item: itemRef(track, multiSelect.questionId) };
      const optionOrderByOccurrence = { ...deferred.session.optionOrderByOccurrence, [occurrence.occurrenceId]: (multiSelect.interaction as Extract<Question["interaction"], { type: "choice_multiple" }>).options.map((option) => option.optionId) };
      const base = createTrainingSession({ ...deferred.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
      const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" });
      deferred = { ...deferred, session: createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint }) };
    }
  }
  assert.equal(immediate.session.configurationSnapshot.feedbackMode, "afterEachAnswer");
  assert.equal(deferred.session.configurationSnapshot.feedbackMode, "atSessionEnd");
  await runtime.validateResume({ session: immediate.session, draft: null });
  await runtime.validateResume({ session: deferred.session, draft: null });

  const sessionAt = async (index: number) => {
    const base = createTrainingSession({ ...deferred.session, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined });
    const fingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" });
    return createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: fingerprint });
  };
  const attempts: TrainingAttempt<unknown>[] = [];
  let singleCount = 0;
  let multipleCount = 0;
  for (let index = 0; index < deferred.session.itemOrder.length; index += 1) {
    const occurrence = deferred.session.itemOrder[index]!;
    const question = track.getQuestion(occurrence.item.questionId)!;
    if (question.interaction.type === "choice_single") singleCount += 1;
    if (question.interaction.type === "choice_multiple") multipleCount += 1;
    const response = question.interaction.type === "choice_multiple" && multipleCount === 1 ? wrongResponse(question) : responseFor(question);
    const submission = await runtime.submitPractice({ session: await sessionAt(index), response, attempts, reviews: [], now: NOW });
    attempts.push(submission.attempt);
  }
  assert.ok(singleCount > 0);
  assert.ok(multipleCount > 0);
  const finalization = await runtime.finalizePractice({ session: await sessionAt(deferred.session.itemOrder.length - 1), attempts, now: NOW });
  assert.equal(finalization.session.status, "completed");
  assert.deepEqual(finalization.result.evidence.details, {
    activeForegroundMs: 0,
    correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length,
    partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length,
    incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length,
    pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0),
    maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0),
  });
  assert.equal(attempts.filter((attempt) => attempt.result.kind !== "correct").length, 1);

  const fixedTrack = catalog.getTrack("google-cloud-associate-cloud-engineer");
  await assert.rejects(createCanonicalTrainingFamilyRuntime(fixedTrack).prepare({
    trackId: fixedTrack.trackId,
    modeId: "certification-focus-practice",
    request: { sessionId: "gcp-focus-deferred", requestedLength: 10, feedbackTiming: "after_session_completion" },
    attempts: [],
    reviews: [],
    now: NOW,
  }), /fixed feedback timing/);
});

test("reinsert resolves exact branch after three durable intervening submissions and preserves ordinary branch on correct", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("coding-interview-dsa-problem-solving"); const runtime = createCanonicalTrainingFamilyRuntime(track); const mode = track.getMode("coding-interview-guided-practice");
  const prepare = (id: string) => runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: id, requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const advance = async (session: TrainingAttempt<unknown>["item"] extends never ? never : Awaited<ReturnType<typeof prepare>>["session"], index: number) => { const base = createTrainingSession({ ...session, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined }); const fingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }); return createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: fingerprint }); };
  const run = async (sourceResponse: CanonicalQuestionResponse, id: string) => { let prepared = await prepare(id); const initialFingerprint = prepared.session.planFingerprint; const originalOrder = prepared.session.itemOrder; const attempts: TrainingAttempt<unknown>[] = []; const source = track.getQuestion(originalOrder[0]!.item.questionId)!; let submitted = await runtime.submitPractice({ session: prepared.session, response: sourceResponse, attempts, reviews: [], now: NOW }); attempts.push(submitted.attempt); prepared = { ...prepared, session: await advance(submitted.session, 1) };
    for (let index = 1; index <= 3; index += 1) { const q = track.getQuestion(prepared.session.itemOrder[index]!.item.questionId)!; submitted = await runtime.submitPractice({ session: prepared.session, response: responseFor(q), attempts, reviews: [], now: NOW }); attempts.push(submitted.attempt); prepared = { ...prepared, session: await advance(submitted.session, index + 1) }; }
    return { originalOrder, submitted, attempts, initialFingerprint };
  };
  const badRun = await run(wrongResponse(track.getQuestion((await prepare("bad")).session.itemOrder[0]!.item.questionId)!), "bad"); const badSession = badRun.submitted.session; assert.equal(badSession.itemOrder[4]!.item.questionId, badRun.originalOrder[0]!.item.questionId); assert.notEqual(badSession.itemOrder[4]!.occurrenceId, badRun.originalOrder[4]!.occurrenceId); assert.notEqual(badSession.planFingerprint, badRun.initialFingerprint); await runtime.validateResume({ session: badSession, draft: null });
  const correctRun = await run(responseFor(track.getQuestion((await prepare("correct")).session.itemOrder[0]!.item.questionId)!), "correct"); assert.equal(correctRun.submitted.session.itemOrder[4]!.occurrenceId, correctRun.originalOrder[4]!.occurrenceId); assert.equal(correctRun.submitted.session.planFingerprint, correctRun.initialFingerprint);
});

test("GCP simulation prepares the profile-weighted immutable 50-item plan and exact snapshot", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const input = { trackId: track.trackId, modeId: "certification-exam-simulation", request: { sessionId: "gcp-simulation-stable" }, attempts: [], reviews: [], now: NOW };
  const prepared = await runtime.prepare(input);
  const repeated = await runtime.prepare(input);
  assert.equal(prepared.session.actualLength, 50);
  assert.deepEqual(prepared.session.itemOrder, repeated.session.itemOrder);
  assert.equal(prepared.session.planFingerprint, repeated.session.planFingerprint);
  assert.equal(new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId)).size, 50);
  assert.deepEqual(prepared.session.configurationSnapshot, {
    kind: "certificationSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free",
    submission: "manualOrForegroundTimeout", timer: "absoluteDeadline", timerDurationMs: 7_200_000,
    timerDeadlineAt: "2026-01-01T02:00:00.000Z", simulationProfileId: "google-cloud-associate-cloud-engineer-certification-exam-v1",
    simulationProfileVersion: "1", simulationPolicyId: "patternly-certification-simulation-v1", simulationPolicyVersion: "1",
    flagging: "available", navigator: "available", sectionIds: ["domain-1", "domain-2", "domain-3", "domain-4"],
  });
  const counts = new Map<string, number>();
  for (const occurrence of prepared.session.itemOrder) {
    const question = track.getQuestion(occurrence.item.questionId)!;
    counts.set(question.contentDomainId!, (counts.get(question.contentDomainId!) ?? 0) + 1);
  }
  assert.deepEqual([...counts.values()], [10, 15, 15, 10]);
  const profile = track.simulationProfiles?.find((candidate): candidate is CanonicalSimulationProfile => candidate.profileId === "google-cloud-associate-cloud-engineer-certification-exam-v1");
  assert.ok(profile);
  if (!profile || profile.familyConfig.blueprint.kind !== "weighted_sections") throw new Error("Expected the canonical weighted GCP exam profile.");
  const expectedQuestionIds = profile.familyConfig.blueprint.sections.flatMap((section) => track.questions
    .filter((question) => question.contentDomainId === section.contentDomainId && profile.familyConfig.nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0)
    .slice()
    .sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0)
    .slice(0, counts.get(section.contentDomainId))
    .map((question) => question.questionId));
  assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId), expectedQuestionIds);
  assert.equal(prepared.draft?.revision, 1);
  assert.equal(Object.isFrozen(prepared.session.itemOrder), true);
  await runtime.validateResume({ session: prepared.session, draft: prepared.draft });

  const badSnapshot = { ...prepared.session, configurationSnapshot: { ...prepared.session.configurationSnapshot, timerDeadlineAt: "2026-01-01T02:00:01.000Z" } };
  await assert.rejects(runtime.validateResume({ session: badSnapshot, draft: prepared.draft }), /snapshot or deadline/);
  await assert.rejects(createCanonicalTrainingFamilyRuntime({ ...track, simulationProfiles: [] }).prepare(input), /unavailable/);
});

test("GCP simulation fails explicitly for an undersized required domain instead of reallocating items", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const undersizedTrack = { ...track, questions: track.questions.filter((question) => question.contentDomainId !== "gcp-ace-standard-domain-1") };
  const runtime = createCanonicalTrainingFamilyRuntime(undersizedTrack);
  await assert.rejects(runtime.prepare({
    trackId: track.trackId,
    modeId: "certification-exam-simulation",
    request: { sessionId: "gcp-simulation-undersized-required-domain" },
    attempts: [],
    reviews: [],
    now: NOW,
  }), /Certification simulation source pool gcp-ace-standard-domain-1 requires 10 unique items but has 0\./);
});

test("GCP simulation validates draft occurrence keys, completeness, flags, revision, and deadline", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "certification-exam-simulation", request: { sessionId: "gcp-simulation-draft" }, attempts: [], reviews: [], now: NOW });
  const occurrence = prepared.session.itemOrder[0]!;
  const question = track.getQuestion(occurrence.item.questionId)!;
  const draft = createTrainingSessionDraft({
    sessionId: prepared.session.id, trackId: track.trackId, familyId: "certification", revision: 2,
    responsesByOccurrenceId: { [occurrence.occurrenceId]: responseFor(question) }, flaggedOccurrenceIds: [occurrence.occurrenceId], updatedAt: "2026-01-01T00:30:00.000Z",
  });
  await runtime.validateDraftCommand({ session: prepared.session, draft, expectedPreviousRevision: 1 });
  await assert.rejects(runtime.validateDraftCommand({ session: prepared.session, draft, expectedPreviousRevision: 0 }), /revision|identity or state/);
  await assert.rejects(runtime.validateDraftCommand({ session: prepared.session, draft: prepared.draft!, expectedPreviousRevision: 0 }), /previous draft revision|identity or state/);
  const foreignOccurrence = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: { foreign: responseFor(question) }, flaggedOccurrenceIds: ["foreign"] });
  await assert.rejects(runtime.validateResume({ session: prepared.session, draft: foreignOccurrence }), /unknown occurrence/);
  const atDeadline = createTrainingSessionDraft({ ...draft, revision: 3, updatedAt: "2026-01-01T02:00:00.000Z" });
  await assert.rejects(runtime.validateDraftCommand({ session: prepared.session, draft: atDeadline, expectedPreviousRevision: 2 }), /immutable deadline/);
  const afterDeadline = createTrainingSessionDraft({ ...draft, revision: 3, updatedAt: "2026-01-01T02:00:00.001Z" });
  await assert.rejects(runtime.validateDraftCommand({ session: prepared.session, draft: afterDeadline, expectedPreviousRevision: 2 }), /deadline/);
});

test("GCP simulation finalization scores only complete responses and partitions all 50 occurrences", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "certification-exam-simulation", request: { sessionId: "gcp-simulation-finalize" }, attempts: [], reviews: [], now: NOW });
  const answeredOccurrences = prepared.session.itemOrder.slice(0, 2);
  const answeredQuestions = answeredOccurrences.map((occurrence) => track.getQuestion(occurrence.item.questionId)!);
  const responses = {
    [answeredOccurrences[0]!.occurrenceId]: wrongResponse(answeredQuestions[0]!),
    [answeredOccurrences[1]!.occurrenceId]: responseFor(answeredQuestions[1]!),
  };
  const draft = createTrainingSessionDraft({ sessionId: prepared.session.id, trackId: track.trackId, familyId: "certification", revision: 2, responsesByOccurrenceId: responses, flaggedOccurrenceIds: [prepared.session.itemOrder[2]!.occurrenceId], updatedAt: "2026-01-01T01:00:00.000Z" });
  const malformedDraft = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: { ...responses, [answeredOccurrences[0]!.occurrenceId]: {} } });
  await assert.rejects(runtime.finalizeSimulation({ session: prepared.session, draft: malformedDraft, attempts: [], reviews: [], now: "2026-01-01T01:30:00.000Z" }), /response is incomplete/);
  const priorReview = reviewFor(answeredOccurrences[0]!.item, NOW);
  const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [priorReview], now: "2026-01-01T01:30:00.000Z" });
  assert.equal(finalized.session.status, "completed");
  assert.equal(finalized.attempts.length, 2);
  assert.deepEqual(finalized.result.answeredOccurrenceIds, answeredOccurrences.map((occurrence) => occurrence.occurrenceId));
  assert.deepEqual(finalized.result.unansweredOccurrenceIds, prepared.session.itemOrder.slice(2).map((occurrence) => occurrence.occurrenceId));
  assert.equal(new Set([...finalized.result.answeredOccurrenceIds, ...finalized.result.unansweredOccurrenceIds]).size, 50);
  assert.notEqual(finalized.attempts[0]!.result.kind, "correct");
  assert.equal(finalized.reviewMutations[0]?.kind, "upsert");
  if (finalized.reviewMutations[0]?.kind === "upsert") {
    assert.equal(finalized.reviewMutations[0].entry.id, priorReview.id);
    assert.deepEqual(finalized.reviewMutations[0].entry.reasons, [finalized.attempts[0]!.result.kind]);
  }
  const correctAttempt = finalized.attempts.find((attempt) => attempt.result.kind === "correct")!;
  const seededCorrectReview = finalized.reviewMutations.find((mutation) => mutation.kind === "upsert" && mutation.entry.sourceAttemptId === correctAttempt.id);
  assert.ok(seededCorrectReview?.kind === "upsert");
  assert.equal(seededCorrectReview.entry.stage, "retention7", "a correct item finalized from a graded simulation seeds maintenance");
  assert.equal(seededCorrectReview.entry.dueAt, "2026-01-08T01:00:00.000Z");
  assert.equal(finalized.result.evidence.familyId, "certification");
  assert.equal((finalized.result.evidence.details as { profileId: string }).profileId, "google-cloud-associate-cloud-engineer-certification-exam-v1");
  assert.equal(finalized.frozenDraft, draft);
  await assert.rejects(runtime.finalizeSimulation({ session: finalized.session, draft, attempts: finalized.attempts, reviews: [], now: "2026-01-01T01:31:00.000Z" }), /Only an active Certification simulation/);
  await assert.rejects(runtime.validateDraftCommand({ session: finalized.session, draft, expectedPreviousRevision: 1 }), /identity or state/);
});

test("Coding Mock consumes its exact ordered 40-question profile with foreground timer and shared draft runtime", async () => {
  const catalog = await catalogPromise;
  const baseTrack = catalog.getTrack("coding-interview-dsa-problem-solving");
  const profile: CanonicalCodingInterviewSimulationProfile = {
    schemaVersion: "patternly-simulation-profile-envelope-v1",
    profileId: "algorithms-interview-simulation-v1",
    profileVersion: "1",
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
    familyConfig: {
      schemaVersion: "patternly-coding-interview-simulation-config-v1",
      blueprintId: "coding-interview-interview-simulation-v1",
      blueprintVersion: "1",
      requestedLength: 40,
      actualLength: 40,
      shorteningPolicy: "prohibited",
      uniqueItemsRequired: 40,
      timerKind: "foreground_countdown",
      durationMinutes: 45,
      navigationPolicy: "free_navigation",
      answerChangePolicy: "editable_until_finalization",
      reinsertPolicy: "disabled",
      feedbackTiming: "after_verified_finalization",
      learningStages: ["simulation"],
      selectionPolicy: {
        requireUniqueItemIds: true, requireDeclaredSimulationEligibility: true, requireMultipleMentalUnits: true,
        requireMultiplePatternFamilies: true, requireEveryActiveInteractionTypeRepresented: true,
        prohibitConsecutiveSameMentalUnitWhenAlternativeExists: true, prohibitDuplicateContentIdentity: true,
        prohibitTaxonomyWidening: true, prohibitFallbackItems: true,
      },
      poolId: "algorithms-interview-simulation-v1",
      poolVersion: "1",
      eligibleQuestionIds: baseTrack.questions.slice(0, 40).map((question) => question.questionId),
    },
  };
  const track = { ...baseTrack, simulationProfiles: [profile] };
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: "coding-interview-simulation",
    request: { sessionId: "coding-mock-profile", scope: { simulationProfileId: profile.profileId } },
    attempts: [], reviews: [], now: NOW,
  });
  assert.equal(prepared.session.actualLength, 40);
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.questionId), profile.familyConfig.eligibleQuestionIds);
  assert.deepEqual(prepared.session.configurationSnapshot, {
    kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
    navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 2_700_000,
    simulationProfileId: profile.profileId, simulationProfileVersion: "1", simulationBlueprintId: profile.familyConfig.blueprintId,
    simulationBlueprintVersion: "1", simulationPoolId: profile.familyConfig.poolId, simulationPoolVersion: "1",
  });
  await runtime.validateResume({ session: prepared.session, draft: prepared.draft });
  await assert.rejects(runtime.prepare({
    trackId: track.trackId, modeId: "coding-interview-simulation",
    request: { sessionId: "coding-mock-wrong-profile", scope: { simulationProfileId: "other-profile" } },
    attempts: [], reviews: [], now: NOW,
  }), /exact profile identity/);
  await assert.rejects(runtime.validateResume({
    session: { ...prepared.session, configurationSnapshot: { ...prepared.session.configurationSnapshot, simulationProfileId: "other-profile" } },
    draft: prepared.draft,
  }), /plan fingerprint/);

  const firstOccurrence = prepared.session.itemOrder[0]!;
  const firstQuestion = track.getQuestion(firstOccurrence.item.questionId)!;
  const completedDraft = createTrainingSessionDraft({
    sessionId: prepared.session.id,
    trackId: track.trackId,
    familyId: "coding_interview",
    revision: 1,
    responsesByOccurrenceId: { [firstOccurrence.occurrenceId]: responseFor(firstQuestion) },
    flaggedOccurrenceIds: [],
    updatedAt: NOW,
  });
  const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft: completedDraft, attempts: [], reviews: [], now: NOW });
  assert.equal(finalized.attempts[0]?.result.kind, "correct");
  const firstReview = finalized.reviewMutations.find((mutation) => mutation.kind === "upsert" && mutation.entry.sourceAttemptId === finalized.attempts[0]?.id);
  assert.ok(firstReview?.kind === "upsert");
  assert.equal(firstReview.entry.stage, "retention7", "a committed Coding simulation item seeds retention from its graded answer");
  assert.equal(firstReview.entry.dueAt, "2026-01-08T00:00:00.000Z");
});

test("Design Interview Simulation uses each exact track profile, resumes durable stage text, and finalizes completeness only", async () => {
  const catalog = await catalogPromise;
  const tracks = ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"] as const;
  for (const trackId of tracks) {
    const track = catalog.getTrack(trackId);
    const profile = track.simulationProfiles?.[0];
    assert.ok(profile && profile.familyId === "design_interview" && profile.modeId === "design-interview-simulation");
    const runtime = createCanonicalTrainingFamilyRuntime(track);
    await assert.rejects(runtime.prepare({ trackId, modeId: profile.modeId, request: { sessionId: `${trackId}:wrong`, scope: { simulationProfileId: "foreign-profile" } }, attempts: [], reviews: [], now: NOW }));
    const prepared = await runtime.prepare({ trackId, modeId: profile.modeId, request: { sessionId: `${trackId}:design-sim`, scope: { simulationProfileId: profile.profileId } }, attempts: [], reviews: [], now: NOW });
    assert.equal(prepared.session.actualLength, 1);
    assert.equal(prepared.session.itemOrder.length, 1);
    assert.equal(prepared.session.configurationSnapshot.timer, "absoluteDeadline");
    assert.equal(prepared.session.configurationSnapshot.timerDeadlineAt, "2026-01-01T00:45:00.000Z");
    assert.equal(prepared.session.configurationSnapshot.simulationProfileId, profile.profileId);
    const occurrenceId = prepared.session.itemOrder[0]!.occurrenceId;
    const response = { requirements: "Users need reliable delivery.", architecture: "Durable queue and bounded workers.", tradeoffs: "Duplicates are possible; use idempotency.", final_answer: "Start with a measured delivery SLO." };
    const draft = createTrainingSessionDraft({ sessionId: prepared.session.id, trackId, familyId: "design_interview", revision: 2, responsesByOccurrenceId: { [occurrenceId]: response }, flaggedOccurrenceIds: [], updatedAt: "2026-01-01T00:10:00.000Z" });
    await runtime.validateResume({ session: prepared.session, draft });
    const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [], now: "2026-01-01T00:11:00.000Z" });
    assert.equal(finalized.attempts?.length, 0);
    const details = finalized.result.evidence.details as Record<string, unknown>;
    assert.equal(details.profileId, profile.profileId);
    assert.deepEqual(details.responsesByStage, response);
    assert.deepEqual(details.stageCompleteness, { requirements: true, architecture: true, tradeoffs: true, final_answer: true });
    assert.equal("score" in details, false);
    assert.deepEqual(finalized.reviewMutations, []);
  }
});

test("Design Interview Simulation timeout can finalize a partial draft without assigning semantic correctness", async () => {
  const designTrack = (await catalogPromise).getTrack("backend-system-design-interview");
  const profile = designTrack.simulationProfiles?.[0];
  assert.ok(profile && profile.familyId === "design_interview");
  const runtime = createCanonicalTrainingFamilyRuntime(designTrack);
  const prepared = await runtime.prepare({ trackId: designTrack.trackId, modeId: "design-interview-simulation", request: { sessionId: "design-partial", scope: { simulationProfileId: profile.profileId } }, attempts: [], reviews: [], now: NOW });
  const occurrenceId = prepared.session.itemOrder[0]!.occurrenceId;
  const partial = { requirements: "Clarify latency.", architecture: "", tradeoffs: "", final_answer: "" };
  const draft = createTrainingSessionDraft({ sessionId: prepared.session.id, trackId: designTrack.trackId, familyId: "design_interview", responsesByOccurrenceId: { [occurrenceId]: partial }, flaggedOccurrenceIds: [], updatedAt: NOW });
  const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [], now: "2026-01-01T00:46:00.000Z" });
  const details = finalized.result.evidence.details as Record<string, unknown>;
  assert.deepEqual(details.stageCompleteness, { requirements: true, architecture: false, tradeoffs: false, final_answer: false });
  assert.equal(finalized.result.answeredOccurrenceIds.length, 0);
  assert.equal(finalized.result.unansweredOccurrenceIds.length, 1);
  assert.equal(finalized.attempts?.length, 0);
});
