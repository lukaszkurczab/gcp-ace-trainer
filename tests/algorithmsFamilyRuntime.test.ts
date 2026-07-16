import assert from "node:assert/strict";
import test from "node:test";

import {
  AlgorithmsFamilyRuntime,
  assertCompleteAlgorithmResponse,
  createAlgorithmsRuntimeDependencies,
} from "../src/application/algorithms";
import { ALGORITHM_MODE_IDS, ALGORITHM_MODES, AlgorithmContentCatalog, type AlgorithmQuestion, type AlgorithmQuestionType } from "../src/tracks/algorithms";
import { addReviewQueueItems, getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveTrainingSession } from "../src/storage/repositories";
import { commitTrainingSessionFinalization, commitTrainingSessionStart, recoverPendingMutation } from "../src/application/learningMutations";
import { STORAGE_KEYS } from "../src/storage/keys";
import { writeCanonicalJson } from "../src/storage/repositories/canonicalRecordCodec";
import { installMemoryStorage } from "./journalTestSupport";

function choice(id: string, type: AlgorithmQuestionType = "single_choice", skill = `skill:${id}`): AlgorithmQuestion {
  return { contentVersion: "v1", difficulty: "core", feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: ["mistake"], nextAction: "next", result: "diagnostic" }, id, learningStage: "guided_application", options: [{ id: `${id}:correct`, isCorrect: true, text: "Correct" }, { id: `${id}:wrong`, isCorrect: false, text: "Wrong" }], primarySkillAtomId: skill, prompt: id, type };
}

function complexity(id: string, dimensions: readonly ("time" | "space")[]): AlgorithmQuestion {
  return { contentVersion: "v1", correctComplexity: { dimensions: dimensions.map((dimension) => ({ id: dimension, acceptedValues: [dimension === "time" ? "O(n)" : "O(1)"], values: [dimension === "time" ? "O(n)" : "O(1)", "O(n^2)"] })) }, difficulty: "core", feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" }, id, learningStage: "guided_application", primarySkillAtomId: `skill:${id}`, prompt: id, type: "complexity_check" };
}

function harness(questions: readonly AlgorithmQuestion[], overrides: Parameters<typeof createAlgorithmsRuntimeDependencies>[0] = {}) {
  let tick = Date.parse("2026-07-15T10:00:00.000Z");
  const catalog = new AlgorithmContentCatalog([{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions }]);
  return createAlgorithmsRuntimeDependencies({ catalog: () => catalog, createSessionId: () => "runtime-session", now: () => new Date(tick++).toISOString(), planOptionIds: (question) => "options" in question ? question.options!.map((option) => option.id) : "subgoals" in question ? question.subgoals!.map((subgoal) => subgoal.id) : [], select: (input) => questions.slice(0, input.sessionLength), ...overrides });
}

const correct = (question: AlgorithmQuestion) => ({ kind: "choice" as const, selectedOptionIds: [(question as Extract<AlgorithmQuestion, { options: unknown }>).options[0]!.id] });

test("all seven modes start without React and persist before exposure, with only Weak Area Review shortening", async () => {
  const typeByMode = new Map([
    [ALGORITHM_MODE_IDS.learnApproach, "approach_naming"], [ALGORITHM_MODE_IDS.guidedPractice, "single_choice"], [ALGORITHM_MODE_IDS.recognizePatterns, "single_choice"], [ALGORITHM_MODE_IDS.contrastPractice, "solution_comparison"], [ALGORITHM_MODE_IDS.weakAreaReview, "single_choice"], [ALGORITHM_MODE_IDS.independentPractice, "single_choice"], [ALGORITHM_MODE_IDS.interviewSimulation, "single_choice"],
  ] as const);
  for (const mode of ALGORITHM_MODES) {
    installMemoryStorage();
    const length = mode.id === ALGORITHM_MODE_IDS.weakAreaReview ? 3 : mode.profile.sessionLength;
    const questions = Array.from({ length }, (_, index) => choice(`${mode.id}:${index}`, typeByMode.get(mode.id)!));
    const runtime = new AlgorithmsFamilyRuntime(harness(questions, { select: () => questions }));
    const state = await runtime.start({ modeId: mode.id, nodeId: "arrays_and_strings", ...(mode.id === ALGORITHM_MODE_IDS.weakAreaReview ? { reviewSource: "session_misses" as const } : {}) });
    assert.equal(state.session.actualLength, length);
    assert.equal((await getActiveTrainingSession())?.id, state.session.id);
  }
});

test("simulation start journals session and empty draft atomically across force-close boundaries", async () => {
  const questions = Array.from({ length: 40 }, (_, index) => choice(`atomic-start:${index}`));
  const boundaries = [
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession("runtime-session") },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ] as const;
  for (const boundary of boundaries) {
    const storage = installMemoryStorage();
    const dependencies = harness(questions);
    const runtime = new AlgorithmsFamilyRuntime(dependencies);
    storage.setFailurePlan(boundary);
    await assert.rejects(runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" }));
    storage.setFailurePlan(null);
    if (boundary.key === STORAGE_KEYS.ACTIVE_JOURNAL && boundary.kind === "fail_on_key_write") {
      await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
    } else {
      assert.notEqual(await getActiveMutationJournal(), null);
      if (boundary.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT) {
        await assert.rejects(new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" }), /missing its atomically persisted draft/);
      }
      await recoverPendingMutation();
    }
    const active = await getActiveTrainingSession();
    const draft = await getActiveTrainingSessionDraft();
    assert.equal(active?.id, "runtime-session", boundary.key);
    assert.equal(draft?.sessionId, active?.id, boundary.key);
    assert.deepEqual(draft?.responsesByOccurrenceId, {}, boundary.key);
    assert.equal(await getActiveMutationJournal(), null, boundary.key);
  }
});

test("competing atomic starts leave the losing command unjournaled and preserve recoverable winner state", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`competing-start:${index}`));
  let releaseLosingStart!: () => void;
  let markLosingStartEntered!: () => void;
  const losingStartEntered = new Promise<void>((resolve) => { markLosingStartEntered = resolve; });
  const losingStartGate = new Promise<void>((resolve) => { releaseLosingStart = resolve; });
  const losingDependencies = harness(questions, {
    createSessionId: () => "losing-session",
    commitStart: async (input) => {
      markLosingStartEntered();
      await losingStartGate;
      await commitTrainingSessionStart(input);
    },
  });
  const winningDependencies = harness(questions, { createSessionId: () => "winning-session" });
  const losing = new AlgorithmsFamilyRuntime(losingDependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await losingStartEntered;
  const winner = await new AlgorithmsFamilyRuntime(winningDependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  releaseLosingStart();
  await assert.rejects(losing, /claimed before this start command/);
  assert.equal(await getActiveMutationJournal(), null);
  await recoverPendingMutation();
  assert.equal((await getActiveTrainingSession())?.id, winner.session.id);
  assert.equal((await getActiveTrainingSessionDraft())?.sessionId, winner.session.id);
});

test("immediate-feedback lifecycle journals before feedback, advances in plan order, and completes durably", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 10 }, (_, index) => choice(`learn:${index}`, "approach_naming"));
  const runtime = new AlgorithmsFamilyRuntime(harness(questions));
  let state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  for (let index = 0; index < questions.length; index += 1) {
    runtime.setTransientResponse(correct(state.currentQuestion));
    state = await runtime.submitCurrent(10);
    assert.equal(state.feedback?.questionId, questions[index]!.id);
    assert.equal((await getTrainingAttempts()).value.length, index + 1);
    state = await runtime.continueAfterFeedback(5);
  }
  assert.equal(state.session.status, "completed");
  assert.equal(state.summary?.completed, 10);
  assert.equal(await getActiveTrainingSession(), null);
});

test("immediate submission failure cannot expose feedback, an attempt, or an advanced position", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 10 }, (_, index) => choice(`failure:${index}`, "approach_naming"));
  const runtime = new AlgorithmsFamilyRuntime(harness(questions, {
    commitOutcome: async () => { throw new Error("injected outcome journal failure"); },
  }));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  runtime.setTransientResponse(correct(started.currentQuestion));

  await assert.rejects(runtime.submitCurrent(10), /injected outcome journal failure/);

  const state = runtime.getState();
  assert.equal(state.feedback, null);
  assert.equal(state.session.currentItemIndex, 0);
  assert.equal(state.session.activeForegroundMs, 0);
  assert.deepEqual(state.attempts, []);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.equal((await getActiveTrainingSession())?.currentItemIndex, 0);
});

test("immediate committed-current resume reconstructs feedback and cannot duplicate the occurrence attempt", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 10 }, (_, index) => choice(`resume:${index}`, "approach_naming"));
  const dependencies = harness(questions);
  const first = new AlgorithmsFamilyRuntime(dependencies);
  let state = await first.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  first.setTransientResponse(correct(state.currentQuestion));
  await first.submitCurrent();

  const resumed = new AlgorithmsFamilyRuntime(dependencies);
  state = await resumed.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  assert.equal(state.feedback?.questionId, questions[0]!.id);
  assert.equal(state.attempts.length, 1);
  assert.throws(() => resumed.setTransientResponse(correct(state.currentQuestion)), /immutable/);
  await assert.rejects(resumed.submitCurrent(), /already submitted/);
  state = await resumed.continueAfterFeedback();
  assert.equal(state.session.currentItemIndex, 1);
  assert.equal((await getTrainingAttempts()).value.length, 1);
});

test("complexity completeness follows authored dimensions, including time-only and space-only", () => {
  assert.doesNotThrow(() => assertCompleteAlgorithmResponse(complexity("time", ["time"]), { kind: "complexity", selectedValuesByDimension: { time: "O(n)" } }));
  assert.doesNotThrow(() => assertCompleteAlgorithmResponse(complexity("space", ["space"]), { kind: "complexity", selectedValuesByDimension: { space: "O(1)" } }));
  assert.throws(() => assertCompleteAlgorithmResponse(complexity("both", ["time", "space"]), { kind: "complexity", selectedValuesByDimension: { time: "O(n)" } }), /incomplete/);
});

test("Interview Simulation persists edits, free navigation, foreground timer, resume, and answered-only timeout finalization", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`simulation:${index}`));
  const dependencies = harness(questions);
  const first = new AlgorithmsFamilyRuntime(dependencies);
  let state = await first.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const firstOccurrence = state.session.itemOrder[0]!.occurrenceId;
  const lastOccurrence = state.session.itemOrder[39]!.occurrenceId;
  await first.saveSimulationResponse(firstOccurrence, correct(questions[0]!));
  await first.moveSimulationToIndex(39, 1_000);
  await first.saveSimulationResponse(lastOccurrence, correct(questions[39]!));
  await first.saveSimulationResponse(lastOccurrence, null);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.deepEqual((await getReviewQueueItems()).value, []);
  const resumed = new AlgorithmsFamilyRuntime(dependencies);
  state = await resumed.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  assert.equal(state.session.currentItemIndex, 39);
  assert.equal(state.remainingMs, 2_699_000);
  assert.ok(state.draftResponsesByOccurrenceId[firstOccurrence]);
  state = await resumed.recordForegroundTime(2_699_000);
  assert.equal(state.session.status, "completed");
  assert.equal(state.summary?.completed, 1);
  assert.equal(state.summary?.unansweredOccurrenceIds.length, 39);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal(await getActiveTrainingSessionDraft(), null);
});

test("partial complexity drafts resume and finalize as unanswered without invalid attempts", async () => {
  installMemoryStorage();
  const questions = [complexity("partial", ["time", "space"]), ...Array.from({ length: 39 }, (_, index) => choice(`other:${index}`))];
  const dependencies = harness(questions);
  const first = new AlgorithmsFamilyRuntime(dependencies);
  const started = await first.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const occurrenceId = started.session.itemOrder[0]!.occurrenceId;
  await first.saveSimulationResponse(occurrenceId, { kind: "complexity", selectedValuesByDimension: { time: "O(n)" } });
  const resumed = new AlgorithmsFamilyRuntime(dependencies);
  assert.ok((await resumed.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" })).draftResponsesByOccurrenceId[occurrenceId]);
  const finalized = await resumed.finalizeSimulation();
  assert.equal(finalized.summary?.completed, 0);
  assert.equal(finalized.summary?.unansweredOccurrenceIds.length, 40);
  assert.deepEqual((await getTrainingAttempts()).value, []);
});

test("Interview Simulation navigator exposes persisted occurrence flags and scoring-blind answer states", async () => {
  installMemoryStorage();
  const questions = [complexity("navigator-partial", ["time", "space"]), ...Array.from({ length: 39 }, (_, index) => choice(`navigator:${index}`))];
  const dependencies = harness(questions);
  const first = new AlgorithmsFamilyRuntime(dependencies);
  const started = await first.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const partialOccurrence = started.session.itemOrder[0]!.occurrenceId;
  const completeOccurrence = started.session.itemOrder[1]!.occurrenceId;
  await first.saveSimulationResponse(partialOccurrence, { kind: "complexity", selectedValuesByDimension: { time: "O(n)" } });
  let state = await first.saveSimulationResponse(completeOccurrence, correct(questions[1]!));
  state = await first.setSimulationFlag(partialOccurrence);
  state = await first.setSimulationFlag(completeOccurrence, true);
  assert.deepEqual(state.navigator.occurrences.slice(0, 2), [
    { occurrenceId: partialOccurrence, index: 0, answerState: "partial", flagged: true },
    { occurrenceId: completeOccurrence, index: 1, answerState: "complete", flagged: true },
  ]);
  assert.deepEqual(state.navigator.counts, { total: 40, unanswered: 38, partial: 1, complete: 1, flagged: 2 });
  assert.equal(state.feedback, null);

  const resumed = await new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  assert.deepEqual(resumed.session.flaggedOccurrenceIds, [partialOccurrence, completeOccurrence]);
  assert.deepEqual(resumed.navigator.counts, { total: 40, unanswered: 38, partial: 1, complete: 1, flagged: 2 });

  const finalizer = new AlgorithmsFamilyRuntime(dependencies);
  await finalizer.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const terminal = await finalizer.finalizeSimulation();
  assert.deepEqual(terminal.session.flaggedOccurrenceIds, [partialOccurrence, completeOccurrence]);
  assert.deepEqual(terminal.navigator.counts, { total: 40, unanswered: 39, partial: 0, complete: 1, flagged: 2 });
  assert.deepEqual((await getTrainingSessions()).value.find((session) => session.id === terminal.session.id)?.flaggedOccurrenceIds, [partialOccurrence, completeOccurrence]);
});

test("one simulation mutation queue preserves concurrent drafts, flags, position, and foreground time through failure and retry", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`serialized:${index}`));
  const runtime = new AlgorithmsFamilyRuntime(harness(questions));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const firstOccurrence = started.session.itemOrder[0]!.occurrenceId;
  const secondOccurrence = started.session.itemOrder[1]!.occurrenceId;
  await Promise.all([
    runtime.saveSimulationResponse(firstOccurrence, correct(questions[0]!)),
    runtime.saveSimulationResponse(secondOccurrence, correct(questions[1]!)),
    runtime.setSimulationFlag(firstOccurrence, true),
    runtime.setSimulationFlag(secondOccurrence, true),
    runtime.moveSimulationToIndex(19, 1_000),
    runtime.recordForegroundTime(2_000),
  ]);
  const durable = runtime.getState();
  assert.equal(durable.session.currentItemIndex, 19);
  assert.equal(durable.session.activeForegroundMs, 3_000);
  assert.deepEqual(durable.session.flaggedOccurrenceIds, [firstOccurrence, secondOccurrence]);
  assert.ok(durable.draftResponsesByOccurrenceId[firstOccurrence]);
  assert.ok(durable.draftResponsesByOccurrenceId[secondOccurrence]);
  const resumed = await new AlgorithmsFamilyRuntime(harness(questions)).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  assert.equal(resumed.session.currentItemIndex, 19);
  assert.equal(resumed.session.activeForegroundMs, 3_000);
  assert.deepEqual(resumed.session.flaggedOccurrenceIds, [firstOccurrence, secondOccurrence]);
  assert.ok(resumed.draftResponsesByOccurrenceId[firstOccurrence]);
  assert.ok(resumed.draftResponsesByOccurrenceId[secondOccurrence]);
  const thirdOccurrence = started.session.itemOrder[2]!.occurrenceId;
  const queuedFlag = runtime.setSimulationFlag(thirdOccurrence, true);
  const finalization = runtime.finalizeSimulation();
  await queuedFlag;
  const finalized = await finalization;
  assert.deepEqual(finalized.session.flaggedOccurrenceIds, [firstOccurrence, secondOccurrence, thirdOccurrence]);

  installMemoryStorage();
  let failFirstFlagSave = true;
  const retrying = new AlgorithmsFamilyRuntime(harness(questions, {
    saveSession: async (session) => {
      if (failFirstFlagSave) {
        failFirstFlagSave = false;
        throw new Error("flag write failed");
      }
      await saveTrainingSession(session);
    },
  }));
  const retryStarted = await retrying.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const retryFirst = retryStarted.session.itemOrder[0]!.occurrenceId;
  const retrySecond = retryStarted.session.itemOrder[1]!.occurrenceId;
  const results = await Promise.allSettled([retrying.setSimulationFlag(retryFirst, true), retrying.setSimulationFlag(retrySecond, true)]);
  assert.deepEqual(results.map((result) => result.status), ["rejected", "fulfilled"]);
  assert.deepEqual(retrying.getState().session.flaggedOccurrenceIds, [retrySecond]);
  await retrying.setSimulationFlag(retryFirst, true);
  assert.deepEqual(retrying.getState().session.flaggedOccurrenceIds, [retrySecond, retryFirst]);
});

test("Simulation flag persistence failure leaves runtime state unchanged and abandonment atomically removes its draft", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`abandon:${index}`));
  const failing = new AlgorithmsFamilyRuntime(harness(questions, { saveSession: async () => { throw new Error("disk full"); } }));
  const started = await failing.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const occurrenceId = started.session.itemOrder[0]!.occurrenceId;
  await assert.rejects(failing.setSimulationFlag(occurrenceId), /disk full/);
  assert.deepEqual(failing.getState().session.flaggedOccurrenceIds, []);

  const storage = installMemoryStorage();
  const runtime = new AlgorithmsFamilyRuntime(harness(questions));
  const active = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(active.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  await runtime.setSimulationFlag(active.session.itemOrder[0]!.occurrenceId, true);
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_write_number", writeNumber: 2 });
  await assert.rejects(runtime.abandonSimulation());
  assert.equal(runtime.getState().session.status, "active");
  assert.ok(await getActiveMutationJournal());
  assert.ok(await getActiveTrainingSessionDraft());
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  const abandoned = (await getTrainingSessions()).value.find((session) => session.id === active.session.id)!;
  assert.equal(abandoned.status, "abandoned");
  assert.deepEqual(abandoned.flaggedOccurrenceIds, [active.session.itemOrder[0]!.occurrenceId]);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal((await getTrainingAttempts()).value.length, 0);
});

test("failed partial-draft finalization leaves the durable draft byte-for-byte unchanged", async () => {
  installMemoryStorage();
  const questions = [complexity("partial-failure", ["time", "space"]), ...Array.from({ length: 39 }, (_, index) => choice(`partial-tail:${index}`))];
  const runtime = new AlgorithmsFamilyRuntime(harness(questions, { commitFinalization: async () => { throw new Error("injected finalization failure"); } }));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const occurrenceId = started.session.itemOrder[0]!.occurrenceId;
  await runtime.saveSimulationResponse(occurrenceId, { kind: "complexity", selectedValuesByDimension: { time: "O(n)" } });
  const before = await getActiveTrainingSessionDraft();
  await assert.rejects(runtime.finalizeSimulation(), /injected/);
  assert.deepEqual(await getActiveTrainingSessionDraft(), before);
  assert.deepEqual(runtime.getState().draftResponsesByOccurrenceId, before?.responsesByOccurrenceId);
  assert.equal(await getActiveMutationJournal(), null);
});

test("manual and timeout finalization share one in-flight journaled command and retry safely", async () => {
  const storage = installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`concurrent:${index}`));
  const runtime = new AlgorithmsFamilyRuntime(harness(questions));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const occurrenceId = started.session.itemOrder[0]!.occurrenceId;
  await runtime.saveSimulationResponse(occurrenceId, correct(questions[0]!));
  const durableDraft = await getActiveTrainingSessionDraft();
  // Fail the first materialized write after the journal itself becomes durable.
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_write_number", writeNumber: 2 });
  const manual = runtime.finalizeSimulation();
  const timeout = runtime.recordForegroundTime(2_700_000);
  assert.equal(manual, timeout);
  await assert.rejects(runtime.saveSimulationResponse(occurrenceId, null), /in progress/);
  await assert.rejects(runtime.moveSimulationToIndex(1), /in progress/);
  const results = await Promise.allSettled([manual, timeout]);
  assert.deepEqual(results.map((result) => result.status), ["rejected", "rejected"]);
  const pending = await getActiveMutationJournal();
  assert.notEqual(pending, null);
  assert.deepEqual(await getActiveTrainingSessionDraft(), durableDraft);
  assert.equal(runtime.getState().session.activeForegroundMs, 0);
  await assert.rejects(runtime.moveSimulationToIndex(1), /pending recovery/);
  await assert.rejects(runtime.recordForegroundTime(1), /pending finalization/);
  assert.equal((await getActiveMutationJournal())?.commandFingerprint, pending?.commandFingerprint);
  storage.setFailurePlan(null);
  const completed = await runtime.finalizeSimulation();
  assert.equal(completed.session.status, "completed");
  assert.equal(completed.session.activeForegroundMs, 2_700_000);
  assert.equal(await getActiveMutationJournal(), null);
});

test("timeout elapsed joins manual finalization while asynchronous attempt preparation is still open", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`late-timeout:${index}`));
  let releaseAttemptId!: () => void;
  let markAttemptIdEntered!: () => void;
  const attemptIdEntered = new Promise<void>((resolve) => { markAttemptIdEntered = resolve; });
  const attemptIdGate = new Promise<void>((resolve) => { releaseAttemptId = resolve; });
  const dependencies = harness(questions, {
    createAttemptId: async (_sessionId, occurrenceId) => {
      markAttemptIdEntered();
      await attemptIdGate;
      return `blocked-attempt:${occurrenceId}`;
    },
  });
  const runtime = new AlgorithmsFamilyRuntime(dependencies);
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(started.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  const manual = runtime.finalizeSimulation();
  await attemptIdEntered;
  const timeout = runtime.recordForegroundTime(2_700_000);
  assert.equal(timeout, manual);
  releaseAttemptId();
  const completed = await manual;
  assert.equal(completed.session.status, "completed");
  assert.equal(completed.session.activeForegroundMs, 2_700_000);
  assert.equal((await getActiveTrainingSession()), null);
});

test("foreground time arriving after the durable payload cutoff is rejected instead of silently joining", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`cutoff:${index}`));
  let releaseCommit!: () => void;
  let markCommitEntered!: () => void;
  const commitEntered = new Promise<void>((resolve) => { markCommitEntered = resolve; });
  const commitGate = new Promise<void>((resolve) => { releaseCommit = resolve; });
  const dependencies = harness(questions, {
    commitFinalization: async (input) => {
      markCommitEntered();
      await commitGate;
      await commitTrainingSessionFinalization(input);
    },
  });
  const runtime = new AlgorithmsFamilyRuntime(dependencies);
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(started.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  const manual = runtime.finalizeSimulation();
  await commitEntered;
  await assert.rejects(runtime.recordForegroundTime(2_700_000), /payload cutoff/);
  releaseCommit();
  const completed = await manual;
  assert.equal(completed.session.activeForegroundMs, 0);
  assert.equal(completed.session.status, "completed");
});

test("duplicate-content simulation outcomes journal one consolidated new review as a put", async () => {
  installMemoryStorage();
  const duplicate = choice("duplicate-simulation");
  const questions = [duplicate, duplicate, ...Array.from({ length: 38 }, (_, index) => choice(`duplicate-tail:${index}`))];
  const runtime = new AlgorithmsFamilyRuntime(harness(questions));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  for (const occurrence of started.session.itemOrder.slice(0, 2)) {
    await runtime.saveSimulationResponse(occurrence.occurrenceId, { kind: "choice", selectedOptionIds: ["duplicate-simulation:wrong"] });
  }
  const completed = await runtime.finalizeSimulation();
  assert.equal(completed.attempts.length, 2);
  const reviews = (await getReviewQueueItems()).value;
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]!.sourceAttemptId, completed.attempts[0]!.id);
});

test("finalization failure exposes no feedback or summary and Interview requires exactly 40 items", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`failure:${index}`));
  const runtime = new AlgorithmsFamilyRuntime(harness(questions, { commitFinalization: async () => { throw new Error("injected finalization failure"); } }));
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(started.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  await assert.rejects(runtime.finalizeSimulation(), /injected/);
  assert.equal(runtime.getState().summary, null);
  assert.equal(runtime.getState().feedback, null);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  installMemoryStorage();
  const short = questions.slice(0, 39);
  await assert.rejects(new AlgorithmsFamilyRuntime(harness(short, { select: () => short })).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" }), /exactly 40/);
});

test("resume rejects terminal active slots, corrupt simulation length, and full configuration mismatch", async () => {
  let storage = installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`resume-guard:${index}`));
  let dependencies = harness(questions);
  let runtime = new AlgorithmsFamilyRuntime(dependencies);
  let state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const shortened = { ...state.session, actualLength: 39, itemOrder: state.session.itemOrder.slice(0, 39), optionOrderByOccurrence: Object.fromEntries(state.session.itemOrder.slice(0, 39).map((occurrence) => [occurrence.occurrenceId, state.session.optionOrderByOccurrence[occurrence.occurrenceId]!])) };
  writeCanonicalJson(STORAGE_KEYS.trainingSession(state.session.id), shortened);
  await assert.rejects(new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" }), /exactly 40/);

  storage = installMemoryStorage();
  dependencies = harness(questions);
  runtime = new AlgorithmsFamilyRuntime(dependencies);
  state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  const terminal = { ...state.session, currentItemIndex: 39, status: "completed", completedAt: "2026-07-15T11:00:00.000Z" };
  writeCanonicalJson(STORAGE_KEYS.trainingSession(state.session.id), terminal);
  await assert.rejects(new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" }), /terminal session/);

  storage = installMemoryStorage();
  const immediateQuestions = Array.from({ length: 10 }, (_, index) => choice(`config:${index}`, "approach_naming"));
  dependencies = harness(immediateQuestions);
  runtime = new AlgorithmsFamilyRuntime(dependencies);
  await runtime.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  await assert.rejects(new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings", reviewItemRefs: [{ trackId: "algorithms", itemId: immediateQuestions[0]!.id, contentVersion: "v1" }] }), /configuration/);
});

test("resume rejects corrupt response, result, and canonical review evidence", async () => {
  const mutations = [
    (attempt: any) => ({ ...attempt, response: { kind: "choice", selectedOptionIds: ["unknown-option"] } }),
    (attempt: any) => ({ ...attempt, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } }),
    (attempt: any) => ({ ...attempt, reviewEvidence: { ...attempt.reviewEvidence, taxonomyOrSkillRefs: [] } }),
  ];
  for (const mutate of mutations) {
    const storage = installMemoryStorage();
    const questions = Array.from({ length: 10 }, (_, index) => choice(`corrupt:${index}`, "approach_naming"));
    const dependencies = harness(questions);
    const runtime = new AlgorithmsFamilyRuntime(dependencies);
    const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
    runtime.setTransientResponse(correct(started.currentQuestion));
    await runtime.submitCurrent();
    const durable = (await getTrainingAttempts()).value[0]!;
    writeCanonicalJson(STORAGE_KEYS.trainingAttempt(durable.id), mutate(durable));
    await assert.rejects(new AlgorithmsFamilyRuntime(dependencies).start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" }));
  }
});

test("reinsert decisions preserve plan order and same-session correction cannot resolve persistent review", async () => {
  installMemoryStorage();
  const source = choice("source", "single_choice", "shared");
  const questions = [source, choice("one"), choice("two"), choice("three"), source, ...Array.from({ length: 15 }, (_, index) => choice(`tail:${index}`))];
  const dependencies = harness(questions);
  let runtime = new AlgorithmsFamilyRuntime(dependencies);
  let state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: "arrays_and_strings" });
  runtime.setTransientResponse({ kind: "choice", selectedOptionIds: ["source:wrong"] });
  state = await runtime.submitCurrent();
  const sourceReview = (await getReviewQueueItems()).value[0]!;
  await addReviewQueueItems([{ ...sourceReview, dueAt: "2026-07-15T09:00:00.000Z" }]);
  state = await runtime.continueAfterFeedback();
  for (const expectedIndex of [1, 2, 3]) {
    assert.equal(state.session.currentItemIndex, expectedIndex);
    runtime.setTransientResponse(correct(state.currentQuestion));
    state = await runtime.submitCurrent();
    state = await runtime.continueAfterFeedback();
  }
  assert.equal(state.session.currentItemIndex, 4);
  runtime = new AlgorithmsFamilyRuntime(dependencies);
  state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: "arrays_and_strings" });
  assert.equal(state.session.currentItemIndex, 4);
  assert.equal(Object.keys(runtime.getScheduledReinsertAssignments()).length, 1);
  runtime.setTransientResponse(correct(state.currentQuestion));
  state = await runtime.submitCurrent();
  const durableSourceReview = (await getReviewQueueItems()).value.find((entry) => entry.id === sourceReview.id)!;
  assert.equal(durableSourceReview.persistent, true);
  assert.equal(durableSourceReview.consecutiveAfterDueSuccesses, 0);
});

test("two failed sources cannot claim the same immutable reinsert target", async () => {
  installMemoryStorage();
  const source = choice("collision-source", "single_choice", "shared");
  const questions = [source, source, choice("middle-a"), choice("middle-b"), source, choice("after-a"), choice("after-b"), choice("after-c"), source, ...Array.from({ length: 11 }, (_, index) => choice(`collision-tail:${index}`))];
  const dependencies = harness(questions);
  let runtime = new AlgorithmsFamilyRuntime(dependencies);
  let state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: "arrays_and_strings" });
  for (const index of [0, 1, 2, 3]) {
    assert.equal(state.session.currentItemIndex, index);
    runtime.setTransientResponse(index < 2 ? { kind: "choice", selectedOptionIds: ["collision-source:wrong"] } : correct(state.currentQuestion));
    state = await runtime.submitCurrent();
    state = await runtime.continueAfterFeedback();
  }
  const assignments = runtime.getScheduledReinsertAssignments();
  assert.equal(Object.keys(assignments).length, 1);
  assert.equal(Object.values(assignments)[0], state.session.itemOrder[0]!.occurrenceId);
  assert.equal(state.session.currentItemIndex, 4);
  runtime.setTransientResponse(correct(state.currentQuestion));
  state = await runtime.submitCurrent();
  state = await runtime.continueAfterFeedback();
  assert.equal(state.session.currentItemIndex, 5);
  runtime = new AlgorithmsFamilyRuntime(dependencies);
  state = await runtime.start({ modeId: ALGORITHM_MODE_IDS.guidedPractice, nodeId: "arrays_and_strings" });
  const resumedAssignments = runtime.getScheduledReinsertAssignments();
  assert.equal(resumedAssignments[state.session.itemOrder[8]!.occurrenceId], state.session.itemOrder[1]!.occurrenceId);
  assert.equal(Object.keys(resumedAssignments).length, 1);
});
