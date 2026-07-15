import assert from "node:assert/strict";
import test from "node:test";

import {
  AlgorithmsFamilyRuntime,
  AlgorithmsImmediatePracticeController,
  createAlgorithmsRuntimeDependencies,
} from "../src/application/algorithms";
import { AlgorithmContentCatalog, ALGORITHM_MODE_IDS, type AlgorithmQuestion } from "../src/tracks/algorithms";
import { getTrainingAttempts } from "../src/storage/repositories";
import { recoverPendingMutation } from "../src/application/learningMutations";
import { installMemoryStorage } from "./journalTestSupport";

function question(id: string): AlgorithmQuestion {
  return {
    contentVersion: "v1",
    difficulty: "core",
    feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    id,
    learningStage: "guided_application",
    options: [{ id: `${id}:correct`, isCorrect: true, text: "Correct" }, { id: `${id}:wrong`, isCorrect: false, text: "Wrong" }],
    primarySkillAtomId: `skill:${id}`,
    prompt: id,
    type: "approach_naming",
  };
}

test("immediate Algorithms controller exposes transient selection only until the runtime durably submits it", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 10 }, (_, index) => question(`controller:${index}`));
  const catalog = new AlgorithmContentCatalog([{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions }]);
  let tick = Date.parse("2026-07-15T12:00:00.000Z");
  const dependencies = createAlgorithmsRuntimeDependencies({
    catalog: () => catalog,
    createSessionId: () => "immediate-controller",
    now: () => new Date(tick++).toISOString(),
    planOptionIds: (item) => "options" in item ? item.options!.map((option) => option.id) : "subgoals" in item ? item.subgoals!.map((subgoal) => subgoal.id) : [],
    select: () => questions,
  });
  const controller = new AlgorithmsImmediatePracticeController({
    createRuntime: () => new AlgorithmsFamilyRuntime(dependencies),
    recoverPendingMutation,
  });

  let state = await controller.start({ modeId: ALGORITHM_MODE_IDS.learnApproach, nodeId: "arrays_and_strings" });
  assert.equal(state.status, "active");
  assert.equal(state.runtime?.feedback, null);
  state = controller.setResponse({ kind: "choice", selectedOptionIds: [questions[0]!.options![0]!.id] });
  assert.equal(state.runtime?.feedback, null);
  assert.equal((await getTrainingAttempts()).value.length, 0);

  state = await controller.submit(500);
  assert.equal(state.runtime?.feedback?.questionId, questions[0]!.id);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  state = await controller.continue(100);
  assert.equal(state.status, "active");
  assert.equal(state.runtime?.session.currentItemIndex, 1);
  assert.equal(state.runtime?.feedback, null);
});

test("immediate Algorithms controller rejects the Interview profile at its application boundary", async () => {
  const controller = new AlgorithmsImmediatePracticeController({
    createRuntime: () => { throw new Error("must not construct runtime"); },
    recoverPendingMutation: async () => undefined,
  });
  const state = await controller.start({
    modeId: ALGORITHM_MODE_IDS.interviewSimulation as never,
    nodeId: "arrays_and_strings",
  });
  assert.equal(state.status, "error");
  assert.match(state.error ?? "", /Interview Simulation/);
});
