import assert from "node:assert/strict";
import test from "node:test";

import {
  createAlgorithmsContentAdapter,
  selectAlgorithmSessionItems,
  selectAlgorithmSessionItemsForRoadmapNode,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";

const questions = Array.from({ length: 35 }, (_, index) =>
  makeQuestion(`selection-question-${index + 1}`),
);
const group: AlgorithmContentGroup = {
  id: "complexity_and_constraints",
  questions,
  roadmapNodeId: "complexity_and_constraints",
};
const adapter = createAlgorithmsContentAdapter([group]);

test("roadmap selection reads group membership without adding metadata to questions", () => {
  const selected = selectAlgorithmSessionItemsForRoadmapNode({
    contentAdapter: adapter,
    nodeId: group.roadmapNodeId,
    sessionLength: 5,
  });

  assert.equal(selected.length, 5);
  assert.equal(selected.every((question) => !("roadmapNodeId" in question)), true);
  assert.equal(selected.every((question) => group.questions.includes(question)), true);
});

test("session-miss review preserves requested canonical question order", () => {
  const selected = selectAlgorithmSessionItems({
    contentAdapter: adapter,
    mode: "review",
    nodeId: group.roadmapNodeId,
    reviewItemIds: [questions[2]!.id, questions[0]!.id, questions[2]!.id],
    reviewSource: "sessionMisses",
    sessionLength: 5,
  });

  assert.deepEqual(selected.map((question) => question.id), [
    questions[2]!.id,
    questions[0]!.id,
  ]);
});

test("Algorithms review projection explicitly has no item taxonomy", () => {
  assert.deepEqual(adapter.getReviewContent(questions[0]!.id), {
    prompt: questions[0]!.prompt,
    taxonomyRefs: [],
  });
});

function makeQuestion(id: string): AlgorithmQuestion {
  return {
    difficulty: "intro",
    feedbackModel: {
      decisionSignal: "Use the constraint.",
      mentalModelCorrection: "Reason from the contract.",
      mistakeTypes: ["selection_test_mistake"],
      nextAction: "Try another question.",
      result: "diagnostic",
    },
    id,
    learningStage: "foundations",
    options: [
      { id: "correct", isCorrect: true, text: "Correct" },
      { id: "incorrect", isCorrect: false, text: "Incorrect" },
    ],
    primarySkillAtomId: `skill_${id}`,
    prompt: `Prompt for ${id}`,
    type: "single_choice",
  };
}
