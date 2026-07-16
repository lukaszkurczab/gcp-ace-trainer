import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  AlgorithmsFamilyRuntime,
  AlgorithmsInterviewSimulationController,
  createAlgorithmsRuntimeDependencies,
  type AlgorithmsInterviewSimulationControllerDependencies,
} from "../src/application/algorithms";
import type { TrainingAttempt, TrainingSession } from "../src/domain";
import {
  ALGORITHM_MODE_IDS,
  AlgorithmContentCatalog,
  isAlgorithmChoiceQuestion,
  type AlgorithmChoiceQuestion,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getTrainingAttempts,
  getTrainingSessions,
} from "../src/storage/repositories";
import { recoverPendingMutation } from "../src/application/learningMutations";
import { installMemoryStorage } from "./journalTestSupport";

function choice(id: string): AlgorithmChoiceQuestion {
  return {
    contentVersion: "v1",
    difficulty: "core",
    feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    id,
    learningStage: "guided_application",
    options: [{ id: `${id}:correct`, isCorrect: true, text: "Correct" }, { id: `${id}:wrong`, isCorrect: false, text: "Wrong" }],
    primarySkillAtomId: `skill:${id}`,
    prompt: `prompt:${id}`,
    roadmapNodeId: "arrays_and_strings",
    type: "single_choice",
  };
}

function answer(question: AlgorithmChoiceQuestion) {
  return { kind: "choice" as const, selectedOptionIds: [question.options[0]!.id] };
}

function harness(questions: readonly AlgorithmQuestion[]): AlgorithmsInterviewSimulationControllerDependencies {
  let tick = Date.parse("2026-07-15T10:00:00.000Z");
  const catalog = new AlgorithmContentCatalog([{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions }]);
  const runtimeDependencies = createAlgorithmsRuntimeDependencies({
    catalog: () => catalog,
    createSessionId: () => "controller-session",
    now: () => new Date(tick++).toISOString(),
    planOptionIds: (question) => isAlgorithmChoiceQuestion(question) ? question.options.map((option) => option.id) : [],
    select: () => questions,
  });
  return {
    catalog: () => catalog,
    createRuntime: () => new AlgorithmsFamilyRuntime(runtimeDependencies),
    getActiveDraft: getActiveTrainingSessionDraft,
    getActiveSession: getActiveTrainingSession,
    getAttempts: async (): Promise<readonly TrainingAttempt<unknown>[]> => (await getTrainingAttempts()).value,
    getSessionById: async (sessionId: string): Promise<TrainingSession | null> => (await getTrainingSessions()).value.find((session) => session.id === sessionId) ?? null,
    recoverPendingMutation,
  };
}

test("controller discovers, starts, persists draft/flag/navigation, and exposes only durable terminal projections", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`controller:${index}`));
  const controller = new AlgorithmsInterviewSimulationController(harness(questions));

  let state = await controller.discover();
  assert.equal(state.status, "setup");
  assert.deepEqual(state.activeInspection, { kind: "none" });

  state = await controller.start("arrays_and_strings");
  assert.equal(state.status, "active");
  assert.equal(state.runtime?.session.actualLength, 40);
  assert.equal(state.terminal, null);
  const occurrenceId = state.runtime!.session.itemOrder[0]!.occurrenceId;

  state = await controller.saveDraftResponse(occurrenceId, answer(questions[0]!));
  state = await controller.setFlag(occurrenceId, true);
  state = await controller.moveToIndex(11);
  assert.equal(state.runtime?.session.currentItemIndex, 11);
  assert.equal(state.runtime?.session.activeForegroundMs, 0);
  assert.equal(state.runtime?.navigator.counts.complete, 1);
  assert.equal(state.runtime?.navigator.counts.flagged, 1);
  assert.equal(state.runtime?.feedback, null);
  assert.equal((await getTrainingAttempts()).value.length, 0);

  state = await controller.finalize();
  assert.equal(state.status, "terminal");
  assert.equal(state.terminal?.outcomes.correct, 1);
  assert.equal(state.terminal?.outcomes.unanswered, 39);
  assert.equal(controller.getReviewRows("unanswered").length, 39);
  assert.equal(controller.getReviewDetail(occurrenceId).result, "correct");

  const unavailable = await controller.loadTerminal("missing-terminal-session");
  assert.equal(unavailable.status, "error");
  assert.equal(unavailable.terminal, null);
});

test("controller resume uses the exact discovered session and start refuses to replace it", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`resume-controller:${index}`));
  const dependencies = harness(questions);
  const first = new AlgorithmsInterviewSimulationController(dependencies);
  const started = await first.start("arrays_and_strings");
  const occurrenceId = started.runtime!.session.itemOrder[3]!.occurrenceId;
  await first.saveDraftResponse(occurrenceId, answer(questions[3]!));
  await first.setFlag(occurrenceId, true);
  await first.moveToIndex(3);

  const replacement = new AlgorithmsInterviewSimulationController(dependencies);
  const refused = await replacement.start("arrays_and_strings");
  assert.equal(refused.status, "error");
  assert.equal(refused.failure?.kind, "session_conflict");
  assert.equal((await getActiveTrainingSession())?.id, started.runtime?.session.id);

  const resumed = await replacement.resume();
  assert.equal(resumed.status, "active");
  assert.equal(resumed.runtime?.session.id, started.runtime?.session.id);
  assert.equal(resumed.runtime?.session.currentItemIndex, 3);
  assert.equal(resumed.runtime?.session.activeForegroundMs, 0);
  assert.ok(resumed.runtime?.draftResponsesByOccurrenceId[occurrenceId]);
  assert.equal(resumed.runtime?.session.flaggedOccurrenceIds.includes(occurrenceId), true);
});

test("foreground timeout loads a terminal projection after durable runtime finalization", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`timeout-controller:${index}`));
  const controller = new AlgorithmsInterviewSimulationController(harness(questions));
  const started = await controller.start("arrays_and_strings");
  await controller.saveDraftResponse(started.runtime!.session.itemOrder[0]!.occurrenceId, answer(questions[0]!));

  const timedOut = await controller.finalize();
  assert.equal(timedOut.status, "terminal");
  assert.equal(timedOut.terminal?.outcomes.correct, 1);
  assert.equal(timedOut.terminal?.outcomes.unanswered, 39);
});

test("controller is presentation-safe and the Interview Simulation presentation has no repository imports", () => {
  const controllerSource = readFileSync("src/application/algorithms/AlgorithmsInterviewSimulationController.ts", "utf8");
  assert.doesNotMatch(controllerSource, /from\s+["'][^"']*(?:react|features|storage|repositories)[^"']*["']/);

  for (const file of filesUnder("src/features/algorithms/interviewSimulation")) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:storage|repositories)[^"']*["']/);
  }
});

function filesUnder(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}
