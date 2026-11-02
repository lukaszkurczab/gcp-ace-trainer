import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { ApproachChallengeProblem } from "../../content/canonical/approachChallengeProblem";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import { addReviewQueueItems, addTrainingAttempt, getActiveMutationJournal, getActiveTrainingSession, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions } from "../../storage/repositories";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { applyRemoteAccountData, assertValidAccountDataRecords, buildAccountDataSnapshot } from "../../storage/repositories/accountDataRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import { isAccountWireState } from "../../domain/account/accountWireState";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createTrainingAttempt } from "../../domain";
import type { AlgorithmResponse } from "../../tracks/coding-interview/domain";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import { createCanonicalTrainingFamilyComposition } from "../canonicalTrainingFamilyComposition";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { loadActivitySessionRecords } from "../activityReadModels";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { ALGORITHM_MODE_IDS, classifyTrainingAttemptMode, type AlgorithmModeId } from "../../tracks/coding-interview/domain/algorithmModes";
import { advanceApproachChallengeStage, completeApproachChallengeSession, getApproachChallengeDetailedHistory, getApproachChallengeStageProjection, recoverApproachChallengeOperation, retryApproachChallengeStageSubmission, startApproachChallengeSession, submitApproachChallengeStage } from "./approachChallengeSessionFacade";
import { confirmApproachChallengeShortening, selectApproachChallengeProblems } from "./approachChallengeSelection";
import { APPROACH_CHALLENGE_MANIFEST_KEY, decodeApproachChallengeManifest, validateApproachChallengeManifest, isApproachChallengeStageOperationResolved, projectApproachChallengeMethodReveal } from "./approachChallengeSession";
import * as LegacyAlgorithms from "./codingInterviewSessionFacade";
import { endApproachChallengeSession, pauseApproachChallengeSession } from "./approachChallengeSessionExit";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getForegroundSessionTimerFacade, installForegroundSessionTimerFacade, installTrainingLifecycleUseCases, TrainingApplicationFailure, type ForegroundSessionTimerFacade, type TrainingLifecyclePorts } from "../trainingLifecycle";

const fixturePath = path.resolve(process.cwd(), "../patternly-content/tests/fixtures/approach-challenge/W01.json");
const accountWireFixturePath = path.resolve(process.cwd(), ".agent/private/acm5-20261030/account-wire-fixture.json");
const currentBankAccountWireFixturePath = path.resolve(process.cwd(), "../.agent/private/acm-close-contract-20261030/current-bank-account-wire-fixture.json");
const problem = JSON.parse(readFileSync(fixturePath, "utf8")) as ApproachChallengeProblem;
const now = "2026-10-30T12:00:00.000Z";

test("ACM submit reads one attempt snapshot and duplicate or changed answers never reload reviews or write", async () => {
  const { lifecycle, problem, storage } = await startActualProductionBankSession("acm-read-snapshot");
  const repositories = (lifecycle as unknown as { ports: TrainingLifecyclePorts }).ports.repositories;
  const getAttempts = repositories.getAttempts.bind(repositories), getReviews = repositories.getReviews.bind(repositories);
  let attemptReads = 0, reviewReads = 0;
  repositories.getAttempts = async () => { attemptReads++; return getAttempts(); };
  repositories.getReviews = async () => { reviewReads++; return getReviews(); };
  const optionId = problem.approachQuestion.interaction.options[0]!.optionId;
  const response = { type: "approach_choice", optionId };
  await lifecycle.submitPracticeResponse(response);
  assert.equal(attemptReads, 1); assert.equal(reviewReads, 1);
  const durable = storage.snapshot();
  attemptReads = reviewReads = 0;
  await lifecycle.submitPracticeResponse(response);
  assert.equal(attemptReads, 1); assert.equal(reviewReads, 0);
  assert.deepEqual(storage.snapshot(), durable);
  attemptReads = reviewReads = 0;
  await assert.rejects(lifecycle.submitPracticeResponse({ ...response, optionId: problem.approachQuestion.interaction.options[1]!.optionId }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "invalid_response");
  assert.equal(attemptReads, 1); assert.equal(reviewReads, 0);
  assert.deepEqual(storage.snapshot(), durable);
  attemptReads = reviewReads = 0;
  (lifecycle as unknown as { ports: TrainingLifecyclePorts }).ports.packages.resolveExactArtifact = async () => { throw new Error("Exact artifact unavailable"); };
  await assert.rejects(lifecycle.submitPracticeResponse(response), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
  assert.equal(attemptReads, 0, "exact-pin validation precedes the reusable evidence snapshot");
  assert.equal(reviewReads, 0);
  assert.deepEqual(storage.snapshot(), durable, "artifact loss is explicit and cannot rewrite the accepted answer");
});

test("confirmed abandonment rejects a changed session inside its queued lane without writing", async () => {
  const { lifecycle, storage, prepared } = await startActualProductionBankSession("acm-confirmed-end-race");
  const internal = lifecycle as unknown as { ports: TrainingLifecyclePorts; serializeSessionMutation: (id: string, operation: () => Promise<void>) => Promise<void> };
  let unblock!: () => void, readInitial!: () => void;
  const gate = new Promise<void>((resolve) => { unblock = resolve; });
  const initialRead = new Promise<void>((resolve) => { readInitial = resolve; });
  const blocked = internal.serializeSessionMutation(prepared.session.id, () => gate);
  let visible = prepared.session;
  internal.ports.repositories.getActiveSession = async () => { readInitial(); return visible; };
  const before = storage.snapshot();
  const rejected = assert.rejects(lifecycle.abandonActiveSession({ sessionId: prepared.session.id }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "active_session_conflict");
  await initialRead;
  visible = { ...prepared.session, id: "another-active-session" };
  unblock();
  await Promise.all([blocked, rejected]);
  assert.equal(visible.status, "active");
  assert.deepEqual(storage.snapshot(), before, "neither session nor attempts nor a new journal may change");
});

test("confirmed abandonment checks its profile fence after asynchronous exact resolution", async () => {
  const { lifecycle, storage, prepared } = await startActualProductionBankSession("acm-confirmed-profile-race");
  const ports = (lifecycle as unknown as { ports: TrainingLifecyclePorts }).ports;
  const resolve = ports.packages.resolveExactArtifact.bind(ports.packages);
  let current = true;
  ports.packages.resolveExactArtifact = async (identity) => { const result = await resolve(identity); current = false; return result; };
  const before = storage.snapshot();
  await assert.rejects(lifecycle.abandonActiveSession({ sessionId: prepared.session.id, assertCurrent: () => { if (!current) throw Error("profile_changed"); } }), /profile_changed/);
  assert.deepEqual(storage.snapshot(), before);
});

test("expected checkpoint recovery rejects an active-session change before its queued recovery can run", async () => {
  const { lifecycle, storage, prepared } = await startActualProductionBankSession("acm-end-checkpoint-recovery-race");
  const internal = lifecycle as unknown as { ports: TrainingLifecyclePorts; serializeSessionMutation: (id: string, operation: () => Promise<void>) => Promise<void> };
  let unblock!: () => void, resolved!: () => void;
  const gate = new Promise<void>((resolve) => { unblock = resolve; });
  const resolution = new Promise<void>((resolve) => { resolved = resolve; });
  const blocked = internal.serializeSessionMutation(prepared.session.id, () => gate);
  const originalResolve = internal.ports.packages.resolveExactArtifact.bind(internal.ports.packages);
  internal.ports.packages.resolveExactArtifact = async (identity) => { const result = await originalResolve(identity); resolved(); return result; };
  let visible = prepared.session;
  internal.ports.repositories.getActiveSession = async () => visible;
  let recoveries = 0;
  internal.ports.mutations.recover = async () => { recoveries++; };
  const before = storage.snapshot();
  const rejected = assert.rejects(lifecycle.recoverActiveTrainingOperation(undefined, { sessionId: prepared.session.id }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "active_session_conflict");
  await resolution;
  visible = { ...prepared.session, id: "another-recovery-owner" };
  unblock();
  await Promise.all([blocked, rejected]);
  assert.equal(recoveries, 0, "cannot recover a global journal after the confirmed owner changed");
  assert.deepEqual(storage.snapshot(), before);
});

test("early end preserves an exact partial pair in Activity and permits an empty end without fabricating a result", async () => {
  for (const answered of [false, true]) {
    const { lifecycle, problem, prepared } = await startActualProductionBankSession(`acm-early-end-${answered}`);
    if (answered) {
      const option = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
      await submitApproachChallengeStage({ type: "approach_choice", optionId: option.optionId });
      await lifecycle.advancePracticeSession();
    }
    const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
    const timerCalls: string[] = [];
    installForegroundSessionTimerFacade({ async leaveForeground() { timerCalls.push("checkpoint"); }, releaseAfterVerifiedSessionEnd(id: string) { assert.equal(id, prepared.session.id); timerCalls.push("release"); } } as unknown as ForegroundSessionTimerFacade);
    const result = await endApproachChallengeSession(prepared.session.id);
    assert.equal(result.kind, "ended");
    assert.deepEqual(timerCalls, ["checkpoint", "release"]);
    assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
    assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, attempts);
    assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null, "early ending does not fabricate a completed score");
    const records = await loadActivitySessionRecords();
    assert.equal(records.some(({ session }) => session.id === prepared.session.id), answered, "only answered ended sessions belong in Activity");
    const detail = await getApproachChallengeDetailedHistory(prepared.session.id);
    assert.equal(detail.kind, "ready");
    if (detail.kind === "ready") {
      assert.equal(detail.status, "abandoned");
      assert.equal(detail.artifactSha256, prepared.session.artifactSha256);
      assert.equal(detail.problems[0]!.stages[0].result?.kind ?? null, answered ? "partial" : null);
      assert.equal(detail.problems[0]!.stages[1].response, null, "unfinished Q2 remains unanswered");
    }
  }
});

test("pause retains the exact active ACM session and its durable answer for ordinary resume", async () => {
  const { lifecycle, problem, prepared } = await startActualProductionBankSession("acm-shared-quiz-pause");
  await submitApproachChallengeStage({ type: "approach_choice", optionId: problem.approachQuestion.interaction.options[0]!.optionId });
  await lifecycle.advancePracticeSession();
  const sessionBefore = await getActiveTrainingSession(productionTrackAdmissionContext);
  const attemptsBefore = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  let checkpoints = 0;
  installForegroundSessionTimerFacade({ async leaveForeground() { checkpoints++; }, releaseAfterVerifiedSessionEnd() { throw Error("pause_must_not_release_terminal_state"); } } as unknown as ForegroundSessionTimerFacade);
  assert.equal((await pauseApproachChallengeSession(prepared.session.id)).kind, "paused");
  assert.equal(checkpoints, 1);
  assert.deepEqual(await getActiveTrainingSession(productionTrackAdmissionContext), sessionBefore);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, attemptsBefore);
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  const resumed = await getApproachChallengeStageProjection();
  assert.equal(resumed.kind, "ready");
  if (resumed.kind === "ready") {
    assert.equal(resumed.stage, "complexity");
    assert.equal(resumed.sessionId, prepared.session.id);
    assert.equal(resumed.accepted, false);
  }
});

test("a lost actual abandonment journal readback recovers without issuing another abandon command", async () => {
  const { lifecycle, storage, prepared } = await startActualProductionBankSession("acm-early-end-readback");
  installForegroundSessionTimerFacade({ async leaveForeground() {}, releaseAfterVerifiedSessionEnd() {} } as unknown as ForegroundSessionTimerFacade);
  const ports = (lifecycle as unknown as { ports: TrainingLifecyclePorts }).ports;
  const originalAbandon = ports.mutations.abandon.bind(ports.mutations);
  let commands = 0;
  ports.mutations.abandon = async (...args) => { commands++; return originalAbandon(...args); };
  const originalSet = storage.setString.bind(storage), originalGet = storage.getString.bind(storage);
  let awaitingReadback = false;
  storage.setString = (key, value) => { originalSet(key, value); if (key === STORAGE_KEYS.ACTIVE_JOURNAL) awaitingReadback = true; };
  storage.getString = (key) => {
    if (key === STORAGE_KEYS.ACTIVE_JOURNAL && awaitingReadback) { awaitingReadback = false; throw Error("injected_end_readback_failure"); }
    return originalGet(key);
  };
  const result = await endApproachChallengeSession(prepared.session.id);
  storage.setString = originalSet;
  storage.getString = originalGet;
  assert.equal(result.kind, "not_ended");
  if (result.kind !== "not_ended") throw Error("unverified_end_was_not_blocked");
  assert.equal(result.nextAction, "recover_abandonment");
  assert.equal(commands, 1);
  assert.equal((await endApproachChallengeSession(prepared.session.id, result.nextAction)).kind, "ended");
  assert.equal(commands, 1, "recovery reuses the actual immutable journal");
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
});

test("paired stages persist through the existing lifecycle journal, resume exact pins, and finalize without review writes", async () => {
  const storage = installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "11111111-1111-4111-8111-111111111111", localDatasetId: "22222222-2222-4222-8222-222222222222" }; } });
  const base = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const track = Object.freeze({ ...base, approachChallengeProblems: Object.freeze([problem]) });
  const composition = createCanonicalTrainingFamilyComposition(track);
  const resolution = Object.freeze({ track: composition.catalog, runtime: composition.runtime });
  let id = 0;
  let premiumAuthorizations = 0;
  const packages = {
    async resolveForPreparation() { return resolution; },
    async resolveForDiscovery() { return resolution; },
    async resolveExactArtifact(input: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string; modeId?: string }>) {
      assert.deepEqual(input, { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, modeId: APPROACH_CHALLENGE_MODE_ID });
      return resolution;
    },
  };
  const dependencies = {
    wallClock: { now: () => now },
    sessionIds: { create: async () => `acm-journal-${++id}` },
    packages,
    premiumSessionAdmission: { authorize: async () => { premiumAuthorizations += 1; return "allowed" as const; } },
  };
  const initialLifecycle = composeTrainingLifecycleUseCases(dependencies);
  installTrainingLifecycleUseCases(initialLifecycle);
  const timerEvents: Array<(event: { kind: "projection_refresh" | "expired"; sessionId: string }) => void> = [];
  installForegroundSessionTimerFacade({ subscribe(listener: (event: { kind: "projection_refresh" | "expired"; sessionId: string }) => void) { timerEvents.push(listener); return () => {}; } } as unknown as ForegroundSessionTimerFacade);
  const proposed = selectApproachChallengeProblems({
    sources: [{ problem }], contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as unknown as PackageCompletionState, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: [...problem.requiredFamilyIds] },
  });
  const selection = confirmApproachChallengeShortening(proposed, true);
  assert.equal(selection.status, "ready");
  const prepared = await initialLifecycle.startSession({ trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID, source: "approachChallenge", request: { selection } });
  assert.equal(premiumAuthorizations, 1, "paid paired artifacts request the existing session-start Premium authorization");
  await assertLegacyFacadeBlockedWhileActive(prepared.session.id, storage, timerEvents);

  const partial = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  const firstResponse = { type: "approach_choice", optionId: partial.optionId };
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 });
  await assert.rejects(initialLifecycle.submitPracticeResponse(firstResponse));
  storage.setFailurePlan(null);
  const q1Pending = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  assert.equal(q1Pending?.status, "journal_durable", "Q1 attempt materialized while the exact journal phase/ACK remains unresolved");
  const q1Interrupted = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(q1Interrupted.length, 1);
  const q1Operation = await initialLifecycle.getPracticeOperationState(prepared.session, true);
  assert.equal(q1Operation.kind, "commit_materialization_failed");
  assert.equal(isApproachChallengeStageOperationResolved(q1Operation), false, "unresolved Q1 cannot disclose feedback or its method");
  await assert.rejects(initialLifecycle.advancePracticeSession(), /unresolved/u);
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 0);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id).length, 1);
  await initialLifecycle.recoverActiveTrainingOperation();
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.equal(isApproachChallengeStageOperationResolved(await initialLifecycle.getPracticeOperationState(prepared.session, true)), true);
  const q1 = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(q1.length, 1);
  assert.equal(q1[0]?.result.kind, "partial");
  assert.equal(q1[0]?.result.earnedPoints, 0);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value.filter(({ sourceSessionId }) => sourceSessionId === prepared.session.id), []);

  const resumedLifecycle = composeTrainingLifecycleUseCases(dependencies);
  const resumed = await resumedLifecycle.resumeActiveSession();
  assert.equal(resumed.id, prepared.session.id);
  assert.deepEqual(resumed.itemOrder, prepared.session.itemOrder);
  assert.equal(premiumAuthorizations, 1, "exact ordinary resume retains the session-start grant without reauthorization");
  await resumedLifecycle.advancePracticeSession();
  assert.deepEqual(projectApproachChallengeMethodReveal(problem, true), {
    analyzedApproachId: problem.analyzedApproachId, methodReveal: problem.methodReveal,
  }, "the exact Q1 target and method remain visible after a cold restore into Q2");
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 });
  await assert.rejects(resumedLifecycle.submitPracticeResponse(problem.complexityQuestion.answer));
  storage.setFailurePlan(null);
  const q2Pending = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  assert.equal(q2Pending?.status, "journal_durable", "Q2 write remains under the exact durable journal until recovery");
  const q2Operation = await resumedLifecycle.getPracticeOperationState((await getActiveTrainingSession(productionTrackAdmissionContext))!, true);
  assert.equal(q2Operation.kind, "commit_materialization_failed");
  assert.equal(isApproachChallengeStageOperationResolved(q2Operation), false);
  await assert.rejects(resumedLifecycle.completeActivePracticeSession(prepared.session.id), /unresolved/u);
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  await resumedLifecycle.recoverActiveTrainingOperation();
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  await resumedLifecycle.completeActivePracticeSession(prepared.session.id);
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.deepEqual(attempts.map(({ occurrenceId, result }) => [occurrenceId, result.kind, result.earnedPoints]).sort((left, right) => String(left[0]).localeCompare(String(right[0]))), [
    [prepared.session.itemOrder[0]!.occurrenceId, "partial", 0],
    [prepared.session.itemOrder[1]!.occurrenceId, "correct", 1],
  ]);
  await resumedLifecycle.completeActivePracticeSession(prepared.session.id);
  await assertLegacyByIdReadsReject(prepared.session.id, "completed", storage);
  const result = await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext);
  assert.equal(result?.totalOccurrences, 2);
  const completedDetail = await getApproachChallengeDetailedHistory(prepared.session.id);
  assert.equal(completedDetail.kind, "unavailable", "a test-only paired fixture cannot be presented as the exact current production artifact");
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.equal(storage.getAllKeys().some((key) => key.includes("approach-challenge")), false, "ACM uses canonical session/attempt/result records rather than a parallel store");
  const snapshot = await buildAccountDataSnapshot(productionLearningDataAdmissionContext);
  assert.deepEqual(snapshot.records.filter((record) => !isAccountWireState(record.recordType, record.recordId, record.trackId, record.state)).map(({ recordType, recordId, trackId, state }) => ({ recordType, recordId, trackId, state })), [], "every retained ACM account record must satisfy the closed wire contract");
  const acmWireRecords = snapshot.records.filter(({ recordType, trackId, state }) => {
    if (trackId !== track.trackId) return false;
    if (recordType === "training_session_summary" || recordType === "training_attempt") return (state as Record<string, unknown>).modeId === APPROACH_CHALLENGE_MODE_ID;
    if (recordType === "training_session_result") return ((state as Record<string, any>).evidence?.details?.modeId === APPROACH_CHALLENGE_MODE_ID);
    return false;
  });
  const summaryRecord = acmWireRecords.find(({ recordType }) => recordType === "training_session_summary")!;
  const attemptRecords = acmWireRecords.filter(({ recordType }) => recordType === "training_attempt");
  const resultRecord = acmWireRecords.find(({ recordType }) => recordType === "training_session_result")!;
  assert.equal(acmWireRecords.length, 4, "the retained ACM fixture is one terminal summary, two stage attempts, and one result");
  assert.deepEqual(attemptRecords.map(({ state }) => [(state as Record<string, any>).response.type, (state as Record<string, any>).result.kind, (state as Record<string, any>).result.earnedPoints]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))), [
    ["approach_choice", "partial", 0], ["choice_single", "correct", 1],
  ]);
  assert.equal((summaryRecord!.state as Record<string, unknown>).status, "completed");
  assert.equal((resultRecord!.state as Record<string, any>).evidence.details.modeId, APPROACH_CHALLENGE_MODE_ID);
  if (process.env.ACM5_WRITE_ACCOUNT_WIRE_FIXTURE === "1") {
    mkdirSync(path.dirname(accountWireFixturePath), { recursive: true });
    writeFileSync(accountWireFixturePath, `${JSON.stringify({ schemaVersion: 1, source: "buildAccountDataSnapshot", records: acmWireRecords }, null, 2)}\n`, "utf8");
  }
  assertValidAccountDataRecords(snapshot.records, productionLearningDataAdmissionContext);
  const inbound = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(inbound);
  await provisionGuestInstallation({ async create() { return { installationId: "33333333-3333-4333-8333-333333333333", localDatasetId: "44444444-4444-4444-8444-444444444444" }; } });
  await applyRemoteAccountData(snapshot.records, productionLearningDataAdmissionContext);
  const restoredAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.deepEqual(restoredAttempts.map(({ modeId, occurrenceId, item, result }) => [modeId, occurrenceId, item.questionId, item.contentVersion, item.artifactSha256, result.kind, result.earnedPoints]).sort((left, right) => String(left[1]).localeCompare(String(right[1]))),
    attempts.map(({ modeId, occurrenceId, item, result }) => [modeId, occurrenceId, item.questionId, item.contentVersion, item.artifactSha256, result.kind, result.earnedPoints]).sort((left, right) => String(left[1]).localeCompare(String(right[1]))));
  const restoredSession = (await getTrainingSessions(productionTrackAdmissionContext)).value.find(({ id }) => id === prepared.session.id);
  assert.equal(restoredSession?.modeId, APPROACH_CHALLENGE_MODE_ID);
  assert.deepEqual(restoredSession?.itemOrder, prepared.session.itemOrder);
  const restoredResult = await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext);
  assert.equal((restoredResult?.evidence.details as Record<string, unknown>).modeId, APPROACH_CHALLENGE_MODE_ID);
  const abandonedPrepared = await resumedLifecycle.startSession({ trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID, source: "approachChallenge", request: { selection } });
  await resumedLifecycle.abandonActiveSession();
  await assertLegacyByIdReadsReject(abandonedPrepared.session.id, "abandoned", storage);
  const abandonedDetail = await getApproachChallengeDetailedHistory(abandonedPrepared.session.id);
  assert.equal(abandonedDetail.kind, "unavailable", "the test-only fixture is not the current exact production artifact");
});

test("production consumer composes the actual bank pair, durable feedback, completed history, and abandoned history", async () => {
  installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "55555555-5555-4555-8555-555555555555", localDatasetId: "66666666-6666-4666-8666-666666666666" }; } });
  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", modeId: APPROACH_CHALLENGE_MODE_ID });
  const track = resolved.track;
  const problem = track.approachChallengeProblems?.find((candidate) => candidate.problemId === "acm-b01-01");
  assert.ok(problem, "the current prepared bank contains the expected W01 production pair");
  let productionSessionId = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    premiumSessionAdmission: { authorize: async () => "allowed" },
    wallClock: { now: () => now }, sessionIds: { create: async () => `acm6-production-${++productionSessionId}` },
    packages: { async resolveForPreparation() { return resolved; }, async resolveForDiscovery() { return resolved; }, async resolveExactArtifact() { return resolved; } },
  });
  installTrainingLifecycleUseCases(lifecycle);
  installForegroundSessionTimerFacade({ subscribe() { return () => {}; }, async initialize() {}, async checkpointForResponseSave() {}, async completePracticeAfterCheckpoint(_session: unknown, complete: () => Promise<void>) { await complete(); } } as unknown as ForegroundSessionTimerFacade);
  const selection = selectApproachChallengeProblems({ sources: [{ problem }], contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as unknown as PackageCompletionState, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: [...problem.requiredFamilyIds] } });
  const prepared = await startApproachChallengeSession(confirmApproachChallengeShortening(selection, true));
  if ("kind" in prepared && prepared.kind === "unavailable") throw new Error("the production bank selection should start");
  if (!("session" in prepared)) throw new Error("the production bank selection should create a session");
  let stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind !== "ready") throw new Error("production Q1 prompt is unavailable");
  assert.equal((stage.interaction.model as any).diagnostics, undefined, "unanswered canonical projection contains no option grades");
  assert.equal(stage.feedback, null, "unanswered projection also withholds the best-approach explanation");
  assert.ok((stage.interaction.model as any).model.renderer.options.every((option: any) => !option.correct && !option.grade), "unanswered controls reveal no answer key");
  const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  await submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId });
  stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind !== "ready") throw new Error("production Q1 feedback is unavailable");
  assert.equal(stage.result?.kind, "partial");
  assert.equal(stage.feedback?.reason, partialOption.feedback, "Almost retains feedback about the selected approach");
  assert.deepEqual(stage.feedback?.approachExplanation, {
    reason: problem.approachQuestion.feedback.reason,
    options: problem.approachQuestion.interaction.options.filter(({ grade }) => grade === "correct")
      .map((option) => ({ id: option.optionId, text: option.text, reason: option.feedback })),
  }, "durable Almost also carries the exact pinned rationale for every optimal approach");
  assert.equal(((stage.interaction.model as any).diagnostics as readonly { id: string; state: string }[]).filter(({ state }) => state === "correct").length,
    problem.approachQuestion.interaction.options.filter(({ grade }) => grade === "correct").length, "durably saved Q1 reveals all equivalent correct approaches");
  assert.deepEqual(stage.methodReveal, problem.methodReveal);
  await lifecycle.advancePracticeSession();
  await submitApproachChallengeStage(problem.complexityQuestion.answer);
  stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind !== "ready") throw new Error("production Q2 feedback is unavailable");
  assert.equal(stage.result?.kind, "correct");
  assert.ok(stage.feedback?.details, "the full canonical Q2 explanation is durable before it is shown");
  assert.equal(stage.feedback?.approachExplanation, null, "Q2 keeps its own complexity explanation");
  await completeApproachChallengeSession();
  const detailed = await getApproachChallengeDetailedHistory(prepared.session.id);
  assert.equal(detailed.kind, "ready");
  if (detailed.kind === "ready") {
    const pair = detailed.problems[0]!;
    assert.equal(pair.contentVersion, track.contentVersion);
    assert.equal(pair.artifactSha256, track.artifactSha256);
    assert.deepEqual(pair.stages.map(({ stage, result }) => [stage, result?.kind]), [["approach", "partial"], ["complexity", "correct"]]);
    assert.equal(pair.stages[0].feedback?.reason, partialOption.feedback);
    assert.deepEqual(pair.stages[0].feedback?.approachExplanation, {
      reason: problem.approachQuestion.feedback.reason,
      options: problem.approachQuestion.interaction.options.filter(({ grade }) => grade === "correct")
        .map((option) => ({ id: option.optionId, text: option.text, reason: option.feedback })),
    }, "history gets full Q1 explanation only from its already verified exact problem");
    assert.equal(pair.stages[1].feedback?.approachExplanation, null);
    assert.deepEqual(pair.stages[1].feedback?.details, problem.complexityQuestion.feedback.details);
    const answers = pair.stages.map(({ interaction }) => ((interaction.model as any).model ?? interaction.model).renderer.options.find((option: any) => option.selected)?.text);
    assert.deepEqual(answers, [problem.approachQuestion.interaction.options.find(({ optionId }) => optionId === partialOption.optionId)?.text, problem.complexityQuestion.interaction.options.find(({ optionId }) => optionId === problem.complexityQuestion.answer.optionId)?.text]);
  }
  const abandoned = await lifecycle.startSession({ trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID, source: "approachChallenge", request: { selection: confirmApproachChallengeShortening(selection, true) } });
  await submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId });
  await lifecycle.abandonActiveSession();
  const abandonedDetail = await getApproachChallengeDetailedHistory(abandoned.session.id);
  assert.equal(abandonedDetail.kind, "ready");
  const sharedHistory = await loadActivitySessionRecords();
  assert.ok(sharedHistory.some(({ session }) => session.id === prepared.session.id), "completed ACM appears in common Activity history");
  assert.ok(sharedHistory.some(({ session }) => session.id === abandoned.session.id), "abandoned ACM with a committed answer appears in common Activity history");
  if (abandonedDetail.kind === "ready") {
    const stages = abandonedDetail.problems[0]!.stages;
    assert.deepEqual(stages.map((row) => row.stage), ["approach", "complexity"]);
    assert.equal(stages[0]?.result?.kind, "partial");
    assert.equal(stages[0]?.feedback?.reason, partialOption.feedback);
    assert.equal(stages[0]?.feedback?.approachExplanation?.reason, problem.approachQuestion.feedback.reason);
    assert.equal(stages[1]?.feedback, null, "unanswered Q2 never gains explanation through history enrichment");
    assert.notEqual(stages[0]?.response, null);
    assert.deepEqual(abandonedDetail.problems[0]?.methodReveal, problem.methodReveal);
    assert.equal(stages[1]?.response, null);
    assert.equal(stages[1]?.result, null);
  }
});

test("actual MemoryKeyValueStorage first journal-write failures at Q1 and Q2 stay unknown and fail closed", async (t) => {
  await t.test("Q1 does not materialize, reveal, advance, complete, or issue a second journal write", async () => {
    const { storage, problem, lifecycle, prepared } = await startActualProductionBankSession("acm5-first-write-q1");
    const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
    storage.resetCounters();
    storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 1 });

    await assert.rejects(submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId }));
    const operation = await lifecycle.getPracticeOperationState(prepared.session, false);
    assert.equal(operation.kind, "submit_journal_failed");
    assert.equal("error" in operation ? operation.error.durableState : null, "unknown");
    assert.equal("error" in operation ? operation.error.allowedAction : null, "reconcile");
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
    assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id).length, 0);
    assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 0);
    assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });
    await assert.rejects(lifecycle.advancePracticeSession());
    await assert.rejects(lifecycle.completeActivePracticeSession(prepared.session.id));
    await assert.rejects(submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId }));
    assert.equal(storage.operations.filter(({ kind, key }) => kind === "write" && key === STORAGE_KEYS.ACTIVE_JOURNAL).length, 1,
      "the unresolved command forbids a second journal write; this is not proof that the first write was absent");
    assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  });

  await t.test("Q2 preserves accepted Q1 only and blocks feedback, progression, finalization, and retry", async () => {
    const { storage, problem, lifecycle, prepared } = await startActualProductionBankSession("acm5-first-write-q2");
    const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
    await submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId });
    await lifecycle.advancePracticeSession();
    const beforeQ2 = await getApproachChallengeStageProjection();
    assert.equal(beforeQ2.kind, "ready");
    if (beforeQ2.kind !== "ready") throw new Error("The accepted Q1 must resume at Q2.");
    assert.equal(beforeQ2.stage, "complexity");
    assert.deepEqual(beforeQ2.methodReveal, problem.methodReveal);

    storage.resetCounters();
    storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 1 });
    await assert.rejects(submitApproachChallengeStage(problem.complexityQuestion.answer));
    const active = (await getActiveTrainingSession(productionTrackAdmissionContext))!;
    const operation = await lifecycle.getPracticeOperationState(active, false);
    assert.equal(operation.kind, "submit_journal_failed");
    assert.equal("error" in operation ? operation.error.durableState : null, "unknown");
    assert.equal("error" in operation ? operation.error.allowedAction : null, "reconcile");
    assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
    const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
    assert.deepEqual(attempts.map(({ occurrenceId, result }) => [occurrenceId, result.kind]), [[prepared.session.itemOrder[0]!.occurrenceId, "partial"]]);
    assert.equal(active.currentItemIndex, 1);
    assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });
    await assert.rejects(lifecycle.advancePracticeSession());
    await assert.rejects(lifecycle.completeActivePracticeSession(prepared.session.id));
    await assert.rejects(lifecycle.retryPracticeSubmission());
    assert.equal(storage.operations.filter(({ kind, key }) => kind === "write" && key === STORAGE_KEYS.ACTIVE_JOURNAL).length, 1,
      "the unresolved command forbids retry; this is not proof that the first write was absent");
    assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  });
});

test("ACM Q1 and Q2 journal prewrite read failures preserve state and retry the exact frozen command once", async () => {
  const { storage, problem, lifecycle, prepared } = await startActualProductionBankSession("acm5-prewrite-q1-q2");
  const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  const q1Response = { type: "approach_choice", optionId: partialOption.optionId } as const;

  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 });
  await assert.rejects(submitApproachChallengeStage(q1Response));
  const q1BoundaryTrace = storage.operations.filter(({ key }) => key === STORAGE_KEYS.ACTIVE_JOURNAL);
  assert.deepEqual(q1BoundaryTrace, [
    { kind: "read", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "read", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ], "the pending check and persistence prewrite read fail before any journal setString call");
  assert.equal(q1BoundaryTrace.some(({ kind }) => kind === "write"), false);
  storage.setFailurePlan(null);

  const q1Operation = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal(q1Operation.kind, "submit_journal_failed");
  assert.ok("error" in q1Operation);
  if ("error" in q1Operation) {
    assert.equal(q1Operation.error.durableState, "not_durable");
    assert.equal(q1Operation.error.allowedAction, "retry_same_command");
  }
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id).length, 0);
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 0);
  assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  await assert.rejects(advanceApproachChallengeStage());
  await assert.rejects(completeApproachChallengeSession());

  await retryApproachChallengeStageSubmission();
  let q1Attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(q1Attempts.length, 1, "the frozen Q1 command materializes once after the production retry handler succeeds");
  assert.deepEqual(q1Attempts[0]?.response, q1Response);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  let stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind === "ready") assert.equal(stage.result?.kind, "partial", "Q1 feedback appears only after its retry ACK is verified");
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 0);

  await advanceApproachChallengeStage();
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 2 });
  await assert.rejects(submitApproachChallengeStage(problem.complexityQuestion.answer));
  const q2BoundaryTrace = storage.operations.filter(({ key }) => key === STORAGE_KEYS.ACTIVE_JOURNAL);
  assert.deepEqual(q2BoundaryTrace, [
    { kind: "read", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "read", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ], "Q2 reaches the same prewrite read boundary before any journal setString call");
  assert.equal(q2BoundaryTrace.some(({ kind }) => kind === "write"), false);
  storage.setFailurePlan(null);

  const q1BeforeQ2Retry = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.deepEqual(q1BeforeQ2Retry, q1Attempts, "the failed Q2 prewrite leaves the accepted Q1 record byte-equivalent");
  const q2Operation = await lifecycle.getPracticeOperationState((await getActiveTrainingSession(productionTrackAdmissionContext))!, true);
  assert.equal(q2Operation.kind, "submit_journal_failed");
  assert.ok("error" in q2Operation);
  if ("error" in q2Operation) {
    assert.equal(q2Operation.error.durableState, "not_durable");
    assert.equal(q2Operation.error.allowedAction, "retry_same_command");
  }
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 1);
  assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  await assert.rejects(advanceApproachChallengeStage());
  await assert.rejects(completeApproachChallengeSession());

  await retryApproachChallengeStageSubmission();
  const finalAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(finalAttempts.length, 2, "Q1 and frozen Q2 each materialize exactly once");
  assert.deepEqual(finalAttempts.find(({ occurrenceId }) => occurrenceId === prepared.session.itemOrder[1]!.occurrenceId)?.response, problem.complexityQuestion.answer);
  assert.deepEqual(finalAttempts.map(({ occurrenceId, result }) => [occurrenceId, result.kind, result.earnedPoints]).sort((left, right) => String(left[0]).localeCompare(String(right[0]))), [
    [prepared.session.itemOrder[0]!.occurrenceId, "partial", 0],
    [prepared.session.itemOrder[1]!.occurrenceId, "correct", 1],
  ]);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind === "ready") assert.equal(stage.result?.kind, "correct", "Q2 feedback appears after the exact retry is verified");
  await completeApproachChallengeSession();
  const result = await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext);
  assert.equal(result?.totalOccurrences, 2);
  assert.equal(storage.getAllKeys().filter((key) => key.includes("training-session-result")).length, 1);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
});

test("ACM Q1 lost journal readback recovers the exact durable command through a cold production lifecycle", async () => {
  const { storage, problem, lifecycle, prepared } = await startActualProductionBankSession("acm5-cold-readback-q1");
  const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  const q1Response = { type: "approach_choice", optionId: partialOption.optionId } as const;

  storage.resetCounters();
  const q1Trace = armNextJournalReadbackFailure(storage);
  await assert.rejects(submitApproachChallengeStage(q1Response));
  assert.match(q1Trace[0] ?? "", /^journal-set-returned:submit_training_outcome:/);
  assert.deepEqual(q1Trace.slice(1), ["journal-readback-threw"]);
  assert.equal(storage.operations.filter(({ kind, key }) => kind === "write" && key === STORAGE_KEYS.ACTIVE_JOURNAL).length, 1,
    "the journal writer completed before the injected readback failure");
  const uncertainQ1 = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal(uncertainQ1.kind, "commit_materialization_failed");
  assert.ok("error" in uncertainQ1);
  if ("error" in uncertainQ1) {
    assert.equal(uncertainQ1.error.durableState, "journal_durable");
    assert.equal(uncertainQ1.error.allowedAction, "recover");
  }
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id).length, 0);
  assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);

  installTrainingLifecycleUseCases(composeTrainingLifecycleUseCases({ wallClock: { now: () => now } }));
  await recoverApproachChallengeOperation();
  let attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(attempts.length, 1, "cold recovery materializes the exact Q1 journal once");
  assert.deepEqual(attempts[0]?.response, q1Response);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  let stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind === "ready") assert.equal(stage.result?.kind, "partial");
});

test("ACM Q2 lost journal readback recovers the exact durable command through a cold production lifecycle", async () => {
  const { storage, problem, prepared } = await startActualProductionBankSession("acm5-cold-readback-q2");
  const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  await submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId });
  const q1Attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(q1Attempts.length, 1);
  await advanceApproachChallengeStage();
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex, 1, "verified Q1 opens its exact Q2 checkpoint");
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, "the Q1-to-Q2 checkpoint completes before arming the Q2 readback fault");
  storage.resetCounters();
  const q2Trace = armNextJournalReadbackFailure(storage);
  await assert.rejects(submitApproachChallengeStage(problem.complexityQuestion.answer));
  assert.match(q2Trace[0] ?? "", /^journal-set-returned:submit_training_outcome:/);
  assert.deepEqual(q2Trace.slice(1), ["journal-readback-threw"]);
  assert.equal(storage.operations.filter(({ kind, key }) => kind === "write" && key === STORAGE_KEYS.ACTIVE_JOURNAL).length, 1,
    "the Q2 journal write occurred before its readback failed");
  const pendingQ2 = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  assert.equal(pendingQ2?.operation, "submit_training_outcome");
  const pendingQ2Attempt = pendingQ2?.writes.find((write) => write.kind === "put_attempt");
  assert.equal(pendingQ2Attempt?.kind, "put_attempt");
  if (pendingQ2Attempt?.kind === "put_attempt") assert.deepEqual(pendingQ2Attempt.record.response, problem.complexityQuestion.answer);
  const beforeColdQ2 = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(beforeColdQ2.length, 1, "only accepted Q1 exists before cold Q2 recovery");
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null);
  assert.deepEqual(await getApproachChallengeStageProjection(), { kind: "unavailable", reason: "operation_unresolved" });

  installTrainingLifecycleUseCases(composeTrainingLifecycleUseCases({ wallClock: { now: () => now } }));
  await recoverApproachChallengeOperation();
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null, "cold recovery clears the exact Q2 journal after verification");
  assert.equal(attempts.length, 2, "cold recovery materializes the exact Q2 journal once");
  assert.deepEqual(attempts.find(({ occurrenceId }) => occurrenceId === prepared.session.itemOrder[1]!.occurrenceId)?.response, problem.complexityQuestion.answer);
  assert.deepEqual(attempts.map(({ occurrenceId, result }) => [occurrenceId, result.kind, result.earnedPoints]).sort((left, right) => String(left[0]).localeCompare(String(right[0]))), [
    [prepared.session.itemOrder[0]!.occurrenceId, "partial", 0],
    [prepared.session.itemOrder[1]!.occurrenceId, "correct", 1],
  ]);
  assert.equal(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), null,
    "Q2 recovery does not leak finalization before the explicit completion handler");
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  const stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind === "ready") assert.equal(stage.result?.kind, "correct");
  await completeApproachChallengeSession();
  assert.equal((await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext))?.totalOccurrences, 2);
  assert.equal(storage.getAllKeys().filter((key) => key.includes("training-session-result")).length, 1);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
});

test("whole-mode Premium guards even former-Free ACM tasks before preparation and keeps admitted sessions usable", async () => {
  const base = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const freeProblem: ApproachChallengeProblem = Object.freeze({
    ...problem,
    problemId: "ACM-JOURNAL-FREE-01",
    primaryFamilyId: "complexity_and_constraints",
    requiredFamilyIds: Object.freeze(["complexity_and_constraints"]),
    approachQuestion: Object.freeze({ ...problem.approachQuestion, questionId: "ACM-JOURNAL-FREE-01-Q1", nodeId: "complexity_and_constraints" }),
    complexityQuestion: Object.freeze({ ...problem.complexityQuestion, questionId: "ACM-JOURNAL-FREE-01-Q2", nodeId: "complexity_and_constraints" }),
  });
  const track = Object.freeze({ ...base, approachChallengeProblems: Object.freeze([freeProblem]) });
  const composition = createCanonicalTrainingFamilyComposition(track);
  const resolution = Object.freeze({ track: composition.catalog, runtime: composition.runtime });
  const selection = selectApproachChallengeProblems({
    sources: [{ problem: freeProblem }], contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as unknown as PackageCompletionState, access: "free",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: ["complexity_and_constraints"] },
  });
  for (const decision of ["denied", "unavailable", "missing", "allowed"] as const) {
    const storage = installMemoryStorage();
    let ids = 0, preparations = 0, authorizations = 0;
    let currentAccess: "allowed" | "denied" | "unavailable" = decision === "missing" ? "unavailable" : decision;
    const dependencies = {
      wallClock: { now: () => now }, sessionIds: { create: async () => { ids++; return "acm-premium-session"; } },
      packages: {
        async resolveForPreparation() { preparations++; return resolution; },
        async resolveForDiscovery() { return resolution; },
        async resolveExactArtifact() { return resolution; },
      },
      ...(decision === "missing" ? {} : { premiumSessionAdmission: { authorize: async () => { authorizations++; return currentAccess; } } }),
    };
    const lifecycle = composeTrainingLifecycleUseCases(dependencies);
    const input = { trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID, request: { selection: confirmApproachChallengeShortening(selection, true) } };
    const before = storage.snapshot();
    if (decision !== "allowed") {
      await assert.rejects(lifecycle.startSession(input), (error: unknown) => error instanceof TrainingApplicationFailure
        && error.code === (decision === "denied" ? "premium_entitlement_denied" : "premium_entitlement_unavailable"));
      assert.equal(ids, 0); assert.equal(preparations, 0);
      assert.deepEqual(storage.snapshot(), before, "denied starts cannot write sessions, attempts or journals");
      continue;
    }
    const prepared = await lifecycle.startSession(input);
    assert.equal(prepared.session.actualLength, 2);
    assert.equal(ids, 1); assert.equal(preparations, 1); assert.equal(authorizations, 1);
    currentAccess = "denied";
    const cold = composeTrainingLifecycleUseCases(dependencies);
    assert.equal((await cold.resumeActiveSession()).id, prepared.session.id);
    await cold.submitPracticeResponse({ type: "approach_choice", optionId: freeProblem.approachQuestion.interaction.options.find(({ grade }) => grade === "correct")!.optionId });
    await cold.advancePracticeSession();
    currentAccess = "unavailable";
    assert.equal((await cold.resumeActiveSession()).currentItemIndex, 1);
    await cold.abandonActiveSession();
    assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
    assert.equal(authorizations, 1, "durable ACM sessions retain their original admission for continuation and abandonment");
  }
});

test("legacy per-item mode guards and practice subscriptions retain the remaining registered product modes", async () => {
  const modes: readonly AlgorithmModeId[] = [
    ALGORITHM_MODE_IDS.customPractice,
    ALGORITHM_MODE_IDS.weakAreaReview,
  ];
  for (const [index, modeId] of modes.entries()) {
    const storage = installMemoryStorage();
    await provisionGuestInstallation({ async create() { return { installationId: "99999999-9999-4999-8999-999999999999", localDatasetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }; } });
    await contentPackageRuntimeOwner.verifyBundledPackages();
    const resolved = await contentPackageRuntimeOwner.resolveForDiscovery("coding-interview-dsa-problem-solving", "coding_interview");
    const mode = resolved.track.getMode(modeId);
    const questionSummary = resolved.track.getPool(modeId)[0];
    const question = questionSummary && resolved.track.getQuestion(questionSummary.questionId);
    assert.ok(question, `${modeId} must resolve an actual canonical question`);
    if (modeId === ALGORITHM_MODE_IDS.weakAreaReview) {
      const sourceItem = { trackId: resolved.track.trackId, questionId: question.questionId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256 };
      const exactSource = await contentPackageRuntimeOwner.resolveItem(sourceItem);
      const sourceResponse = LegacyAlgorithms.toCanonicalPracticeResponse(exactSource.question.interactionType, correctLegacyResponse(exactSource));
      const sourceEvaluation = exactSource.interactions.evaluate(exactSource.question.questionId, sourceResponse);
      assert.ok(sourceEvaluation.result, "the weak-area seed uses a complete canonical answer");
      const attemptId = "acm5-legacy-weak-area-due-source";
      await addTrainingAttempt(createTrainingAttempt({
        id: attemptId, sessionId: "acm5-legacy-weak-area-source", trackId: resolved.track.trackId,
        modeId: ALGORITHM_MODE_IDS.learnApproach, occurrenceId: "acm5-legacy-weak-area-source-occurrence",
        item: sourceItem, response: sourceResponse, result: sourceEvaluation.result,
        reviewEvidence: { sourceItem, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }] },
        answeredAt: "2026-10-29T12:00:00.000Z", committedAt: "2026-10-29T12:00:00.000Z",
      }), productionTrackAdmissionContext);
      await addReviewQueueItems([{
        id: "acm5-legacy-weak-area-due-review", trackId: resolved.track.trackId,
        sourceAttemptId: attemptId, sourceSessionId: "acm5-legacy-weak-area-source", sourceItem,
        taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }],
        reasons: ["scheduled_retrieval"], dueAt: now, createdAt: "2026-10-29T12:00:00.000Z",
        consecutiveAfterDueSuccesses: 0, persistent: false,
      }], productionTrackAdmissionContext);
    }

    const timerListeners: Array<(event: { kind: "projection_refresh" | "expired"; sessionId: string }) => void> = [];
    const sessionId = `acm5-legacy-mode-${index}`;
    const lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => now }, sessionIds: { create: async () => sessionId } });
    installTrainingLifecycleUseCases(lifecycle);
    const realTimer = getForegroundSessionTimerFacade();
    installForegroundSessionTimerFacade({
      capturePracticeResponseCheckpoint: realTimer.capturePracticeResponseCheckpoint.bind(realTimer),
      subscribe(listener: (event: { kind: "projection_refresh" | "expired"; sessionId: string }) => void) { timerListeners.push(listener); return () => {}; },
      async initialize() {},
      async projection() { return { elapsedForegroundMs: 0 }; },
      async checkpointForResponseSave() {},
    } as unknown as ForegroundSessionTimerFacade);
    const prepared = await LegacyAlgorithms.startAlgorithmsSession({ modeId, requestedLength: 10,
      ...(modeId === ALGORITHM_MODE_IDS.weakAreaReview ? { reviewSource: "due_queue" as const } : {}) });
    const projection = await LegacyAlgorithms.getAlgorithmsPracticeProjection();
    assert.equal(prepared.session.modeId, modeId);
    assert.equal(projection.session.modeId, modeId, "the ACM exclusion guard retains each exact declared legacy mode");

    const operationEvents: unknown[] = [];
    const refreshEvents: unknown[] = [];
    const unsubscribeOperation = LegacyAlgorithms.subscribeAlgorithmsPracticeOperation(sessionId, (event) => operationEvents.push(event));
    const unsubscribeRefresh = LegacyAlgorithms.subscribeAlgorithmsPracticeProjectionRefresh((event) => refreshEvents.push(event));
    for (const emit of timerListeners) emit({ kind: "projection_refresh", sessionId });
    const exactItem = await contentPackageRuntimeOwner.resolveItem(projection.item);
    await LegacyAlgorithms.submitAlgorithmsPracticeResponse(correctLegacyResponse(exactItem));
    await new Promise((resolve) => setImmediate(resolve));
    unsubscribeOperation(); unsubscribeRefresh();
    assert.equal(operationEvents.some((event) => (event as { family?: string }).family === "practice"), true,
      `${modeId} operation subscription must deliver its exact legacy practice operation`);
    assert.deepEqual(refreshEvents, [{ kind: "projection_refresh", sessionId }],
      `${modeId} practice timer refresh must pass the legacy session guard`);
    assert.equal(storage.snapshot().size > 0, true, "the positive control uses the existing durable APP session path");
    await realTimer.runLocalLearningReset(async () => {});
  }
});

test("declared-only Algorithms modes keep legacy stored-record classification without runtime activation", async () => {
  const storage = installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", localDatasetId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }; } });
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery("coding-interview-dsa-problem-solving", "coding_interview");
  const declaredOnlyModes = [ALGORITHM_MODE_IDS.recognizePatterns, ALGORITHM_MODE_IDS.contrastPractice, ALGORITHM_MODE_IDS.independentPractice] as const;

  for (const modeId of declaredOnlyModes) {
    assert.equal(classifyTrainingAttemptMode(resolved.track.trackId, modeId), "legacy",
      `${modeId} remains classified as a legacy persisted attempt discriminator`);
    assert.throws(() => resolved.track.getMode(modeId), /unavailable; restart to load canonical content/u,
      `${modeId} has no current canonical product runtime registration`);
  }

  assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.length, 0,
    "applicability was classified from source/catalog without activating any declared-only mode");
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 0);
  assert.deepEqual(storage.getAllKeys().filter((key) => key.includes("training-session")), []);
});

async function assertLegacyFacadeBlockedWhileActive(
  sessionId: string,
  storage: ReturnType<typeof installMemoryStorage>,
  timerEvents: Array<(event: { kind: "projection_refresh" | "expired"; sessionId: string }) => void>,
): Promise<void> {
  await contentPackageRuntimeOwner.resolveForDiscovery("coding-interview-dsa-problem-solving", "coding_interview");
  assert.equal(LegacyAlgorithms.getAlgorithmsInterviewSimulationEntry().profileId, "algorithms-interview-simulation-v1", "the inventory's static configuration lookup remains session-independent");
  assert.deepEqual(LegacyAlgorithms.toCanonicalPracticeResponse("choice_single", { kind: "choice", selectedOptionIds: ["legacy-option"] }),
    { type: "choice_single", optionId: "legacy-option" }, "the inventory's pure conversion keeps its legacy behavior");
  const legacyFacade = LegacyAlgorithms.createAlgorithmsPracticeFacade(contentPackageRuntimeOwner);
  const checks: readonly [string, () => unknown][] = [
    ["factory.getProjection", () => legacyFacade.getProjection()],
    ["factory.submitResponse", () => legacyFacade.submitResponse({ kind: "choice", selectedOptionIds: ["x"] })],
    ["factory.submitInteractionResponse", () => legacyFacade.submitInteractionResponse({ type: "approach_choice", optionId: "x" })],
    ["factory.isInteractionResponseComplete", () => legacyFacade.isInteractionResponseComplete({ type: "approach_choice", optionId: "x" })],
    ["start", () => LegacyAlgorithms.startAlgorithmsSession({ modeId: APPROACH_CHALLENGE_MODE_ID, requestedLength: 10 } as never)],
    ["practice projection", () => LegacyAlgorithms.getAlgorithmsPracticeProjection()],
    ["practice submit", () => LegacyAlgorithms.submitAlgorithmsPracticeResponse({ kind: "choice", selectedOptionIds: ["x"] })],
    ["interaction submit", () => LegacyAlgorithms.submitAlgorithmsPracticeInteractionResponse({ type: "approach_choice", optionId: "x" })],
    ["interaction completeness", () => LegacyAlgorithms.isAlgorithmsPracticeInteractionResponseComplete({ type: "approach_choice", optionId: "x" })],
    ["practice retry", () => LegacyAlgorithms.retryAlgorithmsPracticeResponse()],
    ["practice recovery", () => LegacyAlgorithms.recoverAlgorithmsPracticeOperation()],
    ["practice advance", () => LegacyAlgorithms.advanceAlgorithmsPracticeSession()],
    ["practice complete", () => LegacyAlgorithms.completeAlgorithmsPracticeSession()],
    ["checkpoint retry", () => LegacyAlgorithms.retryAlgorithmsPracticeCompletionCheckpoint(sessionId)],
    ["checkpoint recovery", () => LegacyAlgorithms.recoverAlgorithmsPracticeCompletionCheckpoint(sessionId)],
    ["completion recovery", () => LegacyAlgorithms.recoverAlgorithmsPracticeCompletion(sessionId)],
    ["simulation projection", () => LegacyAlgorithms.getAlgorithmsSimulationProjection()],
    ["simulation navigation", () => LegacyAlgorithms.navigateAlgorithmsSimulationTo(1)],
    ["simulation save and navigate", () => LegacyAlgorithms.saveAlgorithmsSimulationResponseAndNavigate({ occurrenceId: "x", response: { kind: "choice", selectedOptionIds: ["x"] }, targetIndex: 1 })],
    ["simulation save", () => LegacyAlgorithms.saveAlgorithmsSimulationResponse({ occurrenceId: "x", response: { kind: "choice", selectedOptionIds: ["x"] } })],
    ["simulation flag", () => LegacyAlgorithms.toggleAlgorithmsSimulationFlag("x")],
    ["simulation save and continue", () => LegacyAlgorithms.saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: "x", response: { kind: "choice", selectedOptionIds: ["x"] } })],
    ["simulation save recovery", () => LegacyAlgorithms.recoverAlgorithmsSimulationSaveAndContinue({ occurrenceId: "x" })],
    ["simulation edit resume", () => LegacyAlgorithms.resumeAlgorithmsSimulationEditingAfterSaveFailure()],
    ["simulation retry", () => LegacyAlgorithms.retryAlgorithmsSimulationSave()],
    ["simulation stale resume", () => LegacyAlgorithms.resumeAlgorithmsSimulationEditingAfterStaleConflict()],
    ["simulation reconcile", () => LegacyAlgorithms.reconcileAlgorithmsSimulationSave()],
    ["simulation operation recovery", () => LegacyAlgorithms.recoverAlgorithmsSimulationOperation()],
    ["simulation finalize", () => LegacyAlgorithms.finalizeAlgorithmsSimulation()],
    ["abandon", () => LegacyAlgorithms.abandonAlgorithmsSession()],
    ["simulation foreground enter", () => LegacyAlgorithms.enterAlgorithmsSimulationForeground()],
    ["simulation foreground leave", () => LegacyAlgorithms.leaveAlgorithmsSimulationForeground()],
    ["practice foreground enter", () => LegacyAlgorithms.enterAlgorithmsPracticeForeground()],
    ["practice foreground leave", () => LegacyAlgorithms.leaveAlgorithmsPracticeForeground()],
  ];
  const before = storage.snapshot();
  await assert.rejects(LegacyAlgorithms.getAlgorithmsPracticeProjection(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable", "ACM active session returns a typed legacy-facade unavailable result");
  for (const [name, check] of checks) await assert.rejects(Promise.resolve().then(check), (_error: unknown) => true, name);
  const screen = await LegacyAlgorithms.getAlgorithmsSimulationScreenProjection();
  assert.equal(screen.kind, "unavailable");
  const operationEvents: unknown[] = [];
  const unsubscribeOperation = LegacyAlgorithms.subscribeAlgorithmsPracticeOperation(sessionId, (event) => operationEvents.push(event));
  let timerEventsReceived = 0;
  const unsubscribePracticeTimer = LegacyAlgorithms.subscribeAlgorithmsPracticeProjectionRefresh(() => { timerEventsReceived += 1; });
  const unsubscribeSimulationTimer = LegacyAlgorithms.subscribeAlgorithmsSimulationProjectionRefresh(() => { timerEventsReceived += 1; });
  for (const emit of timerEvents) emit({ kind: "projection_refresh", sessionId });
  await new Promise((resolve) => setImmediate(resolve));
  unsubscribeOperation(); unsubscribePracticeTimer(); unsubscribeSimulationTimer();
  assert.deepEqual(operationEvents, []);
  assert.equal(timerEventsReceived, 0);
  assert.deepEqual(storage.snapshot(), before, "legacy active-session calls and subscriptions make no ACM storage changes");
}

function correctLegacyResponse(item: ResolvedInteractionItem): AlgorithmResponse {
  const review = item.interactions.presentReview(item.question.questionId, null);
  const model = review.model as { renderer: { kind: string; options?: readonly { id: string; selected: boolean }[]; elements?: readonly { id: string }[]; dimensions?: readonly { id: string; selectedValues: readonly string[] }[] } };
  if (model.renderer.kind === "choice") return { kind: "choice", selectedOptionIds: model.renderer.options!.filter((option) => option.selected).map((option) => option.id) };
  if (model.renderer.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: model.renderer.elements!.map((element) => element.id) };
  if (model.renderer.kind === "complexity") return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(model.renderer.dimensions!.map((dimension) => [dimension.id, [...dimension.selectedValues]])) };
  throw new Error(`Legacy positive control does not support renderer ${model.renderer.kind}.`);
}

async function startActualProductionBankSession(sessionId: string) {
  const storage = installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "77777777-7777-4777-8777-777777777777", localDatasetId: "88888888-8888-4888-8888-888888888888" }; } });
  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", modeId: APPROACH_CHALLENGE_MODE_ID });
  const problem = resolved.track.approachChallengeProblems?.find((candidate) => candidate.problemId === "acm-b01-01");
  assert.ok(problem, "the actual canonical bank must contain the ACM.B01 W01 pair");
  const lifecycle = composeTrainingLifecycleUseCases({
    premiumSessionAdmission: { authorize: async () => "allowed" },
    wallClock: { now: () => now }, sessionIds: { create: async () => sessionId },
    packages: { async resolveForPreparation() { return resolved; }, async resolveForDiscovery() { return resolved; }, async resolveExactArtifact() { return resolved; } },
  });
  installTrainingLifecycleUseCases(lifecycle);
  installForegroundSessionTimerFacade({ subscribe() { return () => {}; }, async initialize() {}, async checkpointForResponseSave() {}, async completePracticeAfterCheckpoint(_session: unknown, complete: () => Promise<void>) { await complete(); } } as unknown as ForegroundSessionTimerFacade);
  const selection = selectApproachChallengeProblems({ sources: [{ problem }], contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as unknown as PackageCompletionState, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: [...problem.requiredFamilyIds] } });
  const prepared = await startApproachChallengeSession(confirmApproachChallengeShortening(selection, true));
  if (!("session" in prepared)) throw new Error("The actual canonical ACM.B01 pair should start.");
  return { storage, problem, lifecycle, prepared, track: resolved.track };
}

test("current canonical ACM.B01 bank exports and restores exact pinned account-wire records", async () => {
  const { problem, lifecycle, prepared, track } = await startActualProductionBankSession("acm-current-bank-account-wire");
  const canonicalSourceTrack = (await loadCanonicalRuntimeCatalog()).getTrack(track.trackId);
  assert.equal(canonicalSourceTrack.approachChallengeProblems?.length, 472, "the fixture producer must use the expanded canonical bank");
  assert.equal(track.artifactSha256, canonicalSourceTrack.artifactSha256, "ACM session records use the exact current raw bank artifact");
  assert.notEqual(track.artifactSha256, canonicalSourceTrack.trainingIdentity?.artifactSha256, "the ACM bank artifact remains separate from ordinary training identity");
  assert.equal(canonicalSourceTrack.contentVersion, track.contentVersion);
  assert.equal(problem.problemId, "acm-b01-01");
  assert.ok(canonicalSourceTrack.approachChallengeProblems?.some(({ problemId }) => problemId === problem.problemId));

  const partialOption = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  await submitApproachChallengeStage({ type: "approach_choice", optionId: partialOption.optionId });
  let stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind !== "ready") throw new Error("current-bank ACM Q1 feedback is unavailable");
  assert.equal(stage.result?.kind, "partial");
  assert.equal(stage.result?.earnedPoints, 0);

  await lifecycle.advancePracticeSession();
  await submitApproachChallengeStage(problem.complexityQuestion.answer);
  stage = await getApproachChallengeStageProjection();
  assert.equal(stage.kind, "ready");
  if (stage.kind !== "ready") throw new Error("current-bank ACM Q2 feedback is unavailable");
  assert.equal(stage.result?.kind, "correct");
  assert.equal(stage.result?.earnedPoints, 1);
  await completeApproachChallengeSession();

  const snapshot = await buildAccountDataSnapshot(productionLearningDataAdmissionContext);
  assertValidAccountDataRecords(snapshot.records, productionLearningDataAdmissionContext);
  const acmWireRecords = snapshot.records.filter(({ recordType, trackId, state }) => {
    if (trackId !== track.trackId) return false;
    if (recordType === "training_session_summary" || recordType === "training_attempt") return (state as Record<string, unknown>).modeId === APPROACH_CHALLENGE_MODE_ID;
    if (recordType === "training_session_result") return ((state as Record<string, any>).evidence?.details?.modeId === APPROACH_CHALLENGE_MODE_ID);
    return false;
  });
  assert.equal(acmWireRecords.length, 4, "current-bank export contains one summary, two attempts, and one session result");
  const attempts = acmWireRecords.filter(({ recordType }) => recordType === "training_attempt");
  assert.deepEqual(attempts.map(({ state }) => {
    const value = state as Record<string, any>;
    return [value.response.type, value.item.questionId, value.item.contentVersion, value.item.artifactSha256, value.result.kind, value.result.earnedPoints];
  }).sort((a, b) => String(a[0]).localeCompare(String(b[0]))), [
    ["approach_choice", problem.approachQuestion.questionId, track.contentVersion, track.artifactSha256, "partial", 0],
    ["choice_single", problem.complexityQuestion.questionId, track.contentVersion, track.artifactSha256, "correct", 1],
  ]);
  const producerAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  const producerAttemptProjection = producerAttempts.map(({ modeId, occurrenceId, item, result }) => [modeId, occurrenceId, item.questionId, item.contentVersion, item.artifactSha256, result.kind, result.earnedPoints])
    .sort((left, right) => String(left[1]).localeCompare(String(right[1])));

  const fixtureOutput = {
    schemaVersion: 1,
    source: "buildAccountDataSnapshot",
    producer: "current-canonical-bank-session",
    currentBank: { trackId: canonicalSourceTrack.trackId, contentVersion: canonicalSourceTrack.contentVersion, artifactSha256: canonicalSourceTrack.artifactSha256 },
    runtimeTrainingPin: { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    ordinaryTrainingIdentity: { trackId: canonicalSourceTrack.trackId, ...canonicalSourceTrack.trainingIdentity },
    records: acmWireRecords,
  };
  if (process.env.ACM_CURRENT_BANK_WRITE_ACCOUNT_WIRE_FIXTURE === "1") {
    mkdirSync(path.dirname(currentBankAccountWireFixturePath), { recursive: true });
    writeFileSync(currentBankAccountWireFixturePath, `${JSON.stringify(fixtureOutput, null, 2)}\n`, "utf8");
  }

  const inbound = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(inbound);
  await provisionGuestInstallation({ async create() { return { installationId: "99999999-9999-4999-8999-999999999999", localDatasetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }; } });
  await applyRemoteAccountData(snapshot.records, productionLearningDataAdmissionContext);
  const restoredAttempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(({ sessionId }) => sessionId === prepared.session.id);
  assert.deepEqual(restoredAttempts.map(({ modeId, occurrenceId, item, result }) => [modeId, occurrenceId, item.questionId, item.contentVersion, item.artifactSha256, result.kind, result.earnedPoints])
    .sort((left, right) => String(left[1]).localeCompare(String(right[1]))), producerAttemptProjection);
  assert.ok(restoredAttempts.every(({ item }) => item.contentVersion === track.contentVersion && item.artifactSha256 === track.artifactSha256));
  const restoredSession = (await getTrainingSessions(productionTrackAdmissionContext)).value.find(({ id }) => id === prepared.session.id);
  assert.equal(restoredSession?.modeId, APPROACH_CHALLENGE_MODE_ID);
  assert.deepEqual(restoredSession?.itemOrder, prepared.session.itemOrder);
  const restoredResult = await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext);
  assert.equal((restoredResult?.evidence.details as Record<string, unknown>).modeId, APPROACH_CHALLENGE_MODE_ID);
  const restoredExact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: track.trackId, contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256, modeId: APPROACH_CHALLENGE_MODE_ID });
  assert.equal(restoredExact.track.artifactSha256, track.artifactSha256, "exact resolution returns the artifact pinned by this session");
  const detailed = await getApproachChallengeDetailedHistory(prepared.session.id);
  assert.equal(detailed.kind, "ready");
  if (detailed.kind !== "ready") throw new Error("imported current-bank ACM history is unavailable");
  assert.equal(detailed.artifactSha256, track.artifactSha256);
  assert.equal(detailed.problems[0]?.stages[0].prompt, problem.approachQuestion.prompt);
});

function armNextJournalReadbackFailure(storage: MemoryKeyValueStorage): string[] {
  const trace: string[] = [];
  const originalGetString = storage.getString.bind(storage);
  const originalSetString = storage.setString.bind(storage);
  let armed = true;
  let readbackPending = false;
  storage.setString = (key, value) => {
    originalSetString(key, value);
    if (armed && key === STORAGE_KEYS.ACTIVE_JOURNAL) {
      armed = false;
      readbackPending = true;
      const operation = (JSON.parse(value) as { payload?: { operation?: string } }).payload?.operation ?? "unknown-operation";
      const caller = new Error().stack?.split("\n")[2]?.trim() ?? "unknown-caller";
      trace.push(`journal-set-returned:${operation}:${caller}`);
    }
  };
  storage.getString = (key) => {
    if (readbackPending && key === STORAGE_KEYS.ACTIVE_JOURNAL) {
      readbackPending = false;
      trace.push("journal-readback-threw");
      throw new Error("Injected test-only readback interruption after the journal write returned.");
    }
    return originalGetString(key);
  };
  return trace;
}

async function assertLegacyByIdReadsReject(sessionId: string, status: "completed" | "abandoned", storage: ReturnType<typeof installMemoryStorage>): Promise<void> {
  const before = storage.snapshot();
  for (const [name, check] of [
    ["result", () => LegacyAlgorithms.getAlgorithmsPracticeResultProjection(sessionId)],
    ["review", () => LegacyAlgorithms.getAlgorithmsPracticeReviewProjection(sessionId, "any-occurrence")],
    ["summary", () => LegacyAlgorithms.getAlgorithmsPracticeSummaryProjection(sessionId)],
  ] as const) await assert.rejects(Promise.resolve().then(check), (_error: unknown) => true, `${status} ${name}`);
  let timerReleases = 0;
  installForegroundSessionTimerFacade({ releaseAfterVerifiedPracticeCompletion() { timerReleases += 1; } } as unknown as ForegroundSessionTimerFacade);
  await assert.rejects(LegacyAlgorithms.recoverAlgorithmsPracticeCompletion(sessionId), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable", `${status} ACM completion recovery`);
  assert.equal(timerReleases, 0, `${status} ACM completion recovery cannot release a timer`);
  assert.deepEqual(storage.snapshot(), before, `${status} by-ID legacy reads must not mutate or synthesize ACM history`);
}

test("exact ACM history metadata and authored Q1 details stay read-only across live, completed and early-ended reads", async () => {
  const { storage, problem, lifecycle, prepared } = await startActualProductionBankSession("acm-summary-projection");
  const manifest = decodeApproachChallengeManifest(prepared.session.configurationSnapshot[APPROACH_CHALLENGE_MANIFEST_KEY], prepared.session);
  const entry = manifest.entries[0]!;
  assert.throws(() => validateApproachChallengeManifest({ ...manifest, actualProblemCount: 2,
    entries: [entry, { ...entry, approachOccurrenceId: "duplicate-problem-approach", complexityOccurrenceId: "duplicate-problem-complexity" }] }, prepared.session), /duplicate task or occurrence IDs/u,
    "production manifests reject duplicate problem identity even with distinct occurrences");
  const beforeWrongCompletion = storage.snapshot();
  await assert.rejects(completeApproachChallengeSession("different-session"), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "no_active_session");
  assert.deepEqual(storage.snapshot(), beforeWrongCompletion);
  const selected = problem.approachQuestion.interaction.options.find(option => option.grade === "partial")!;
  await submitApproachChallengeStage({ type: "approach_choice", optionId: selected.optionId });
  const resolve = contentPackageRuntimeOwner.resolveExactArtifact.bind(contentPackageRuntimeOwner);
  let authored: any = "An authored lesson with option-like literal ID acm-example-01.";
  // The provider is modeled here to vary only teaching text, never the pinned scoring contract.
  contentPackageRuntimeOwner.resolveExactArtifact = async (input) => {
    const exact = await resolve(input);
    return { ...exact, track: { ...exact.track, approachChallengeProblems: exact.track.approachChallengeProblems!.map(candidate => candidate.problemId === problem.problemId
      ? { ...candidate, approachQuestion: { ...candidate.approachQuestion, feedback: { ...candidate.approachQuestion.feedback, details: authored } } }
      : candidate) } };
  };
  try {
    for (const details of ["String lesson", ["First lesson", "Second lesson"], { expectedApproachId: "legacy-internal-id", blocks: [{ type: "paragraph", text: "Object lesson acm-literal-01" }] }, {}, { expectedApproachId: "legacy-internal-id" }]) {
      authored = details;
      const before = storage.snapshot();
      const live = await getApproachChallengeStageProjection();
      assert.equal(live.kind, "ready");
      if (live.kind !== "ready") throw Error("live projection unavailable");
      const expected = typeof details === "object" && !Array.isArray(details) ? Object.fromEntries(Object.entries(details).filter(([key]) => key !== "expectedApproachId")) : details;
      assert.deepEqual(live.feedback?.details, expected);
      assert.equal(live.feedback?.reason, selected.feedback, "selected partial Reason stays independent of authored Details");
      assert.deepEqual(storage.snapshot(), before);
    }
    authored = { text: "Historical authored lesson" };
    await lifecycle.advancePracticeSession();
    await submitApproachChallengeStage(problem.complexityQuestion.answer);
    await completeApproachChallengeSession();
    const before = storage.snapshot();
    const completed = await getApproachChallengeDetailedHistory(prepared.session.id);
    assert.equal(completed.kind, "ready");
    if (completed.kind !== "ready") throw Error("completed projection unavailable");
    assert.deepEqual(completed.problems[0]!.stages[0].feedback?.details, authored);
    assert.deepEqual(completed.problems[0]!.stages[1].feedback?.details, problem.complexityQuestion.feedback.details);
    assert.deepEqual(completed.summary.score, { correctCount: 1, partialCount: 1, incorrectCount: 0 });
    assert.equal(completed.summary.answeredCount, 2);
    assert.equal(completed.summary.unansweredCount, 0);
    assert.equal(completed.summary.totalOccurrences, 2);
    assert.equal(completed.summary.requestedLength, prepared.session.requestedLength);
    assert.deepEqual(storage.snapshot(), before);
    const active = await startActualProductionBankSession("acm-summary-early");
    await submitApproachChallengeStage({ type: "approach_choice", optionId: selected.optionId });
    await active.lifecycle.abandonActiveSession();
    const earlyBefore = active.storage.snapshot();
    const early = await getApproachChallengeDetailedHistory(active.prepared.session.id);
    assert.equal(early.kind, "ready");
    if (early.kind !== "ready") throw Error("early projection unavailable");
    assert.equal(early.summary.answeredCount, 1);
    assert.equal(early.summary.unansweredCount, 1);
    assert.deepEqual(early.problems[0]!.stages[0].feedback?.details, authored);
    assert.equal(early.problems[0]!.stages[1].response, null);
    const unansweredStage = early.problems[0]!.stages[1];
    assert.deepEqual((unansweredStage.interaction.model as any).renderer.options.map((option: any) => option.id),
      active.prepared.session.optionOrderByOccurrence[unansweredStage.occurrenceId], "neutral unanswered controls keep the exact saved option order");
    assert.ok((unansweredStage.interaction.model as any).renderer.options.every((option: any) => !option.selected));
    assert.deepEqual(active.storage.snapshot(), earlyBefore);
    const empty = await startActualProductionBankSession("acm-summary-empty");
    await empty.lifecycle.abandonActiveSession();
    const emptyDetail = await getApproachChallengeDetailedHistory(empty.prepared.session.id);
    assert.equal(emptyDetail.kind, "ready");
    if (emptyDetail.kind !== "ready") throw Error("empty projection unavailable");
    assert.equal(emptyDetail.summary.answeredCount, 0);
    assert.equal(emptyDetail.summary.unansweredCount, 2);
    assert.equal(emptyDetail.summary.score, null);
    assert.equal(emptyDetail.summary.points, null);
    const missingBefore = empty.storage.snapshot();
    contentPackageRuntimeOwner.resolveExactArtifact = async () => { throw Error("modeled_exact_artifact_missing"); };
    assert.deepEqual(await getApproachChallengeDetailedHistory(empty.prepared.session.id), { kind: "unavailable", reason: "artifact_unavailable" });
    assert.deepEqual(empty.storage.snapshot(), missingBefore);
  } finally { contentPackageRuntimeOwner.resolveExactArtifact = resolve; }
});
