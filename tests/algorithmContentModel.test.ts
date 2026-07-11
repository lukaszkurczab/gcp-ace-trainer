import assert from "node:assert/strict";
import test from "node:test";

import { getTrackDefinition } from "../src/domain";
import {
  ALGORITHM_QUESTION_DIFFICULTIES,
  ALGORITHM_QUESTION_LEARNING_STAGES,
  ALGORITHM_QUESTION_TYPES,
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmContentGroup,
  type AlgorithmChoiceQuestion,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";
import {
  ALGORITHM_CONTENT_VERSION,
  algorithmContentGroups,
  algorithmContentItems,
  algorithmContentManifest,
  validateAlgorithmContentGroups,
} from "../src/tracks/algorithms/content";

const EXPECTED_QUESTION_COUNT = 1_751;
const EXPECTED_GROUP_COUNT = 26;

test("Algorithms content imports and validates as one canonical corpus", () => {
  assert.equal(algorithmContentItems.length, EXPECTED_QUESTION_COUNT);
  assert.equal(algorithmContentGroups.length, EXPECTED_GROUP_COUNT);
  assert.equal(algorithmContentManifest.trackId, "algorithms");
  assert.equal(algorithmContentManifest.contentVersion, ALGORITHM_CONTENT_VERSION);
  assert.equal(algorithmContentManifest.itemCount, EXPECTED_QUESTION_COUNT);
});

test("registry derives counts and order directly from typed groups", () => {
  const flattened = algorithmContentGroups.flatMap((group) => group.questions);

  assert.deepEqual(algorithmContentItems, flattened);
  assert.deepEqual(
    algorithmContentManifest.groups,
    algorithmContentGroups.map((group) => ({
      itemCount: group.questions.length,
      roadmapNodeId: group.roadmapNodeId,
    })),
  );
  assert.deepEqual(
    algorithmContentManifest.itemOrder,
    flattened.map((question) => question.id),
  );
});

test("groups own roadmap placement and question ids are globally unique", () => {
  const groupIds = algorithmContentGroups.map((group) => group.roadmapNodeId);
  const questionIds = algorithmContentItems.map((question) => question.id);

  assert.equal(new Set(groupIds).size, groupIds.length);
  assert.equal(new Set(questionIds).size, questionIds.length);
  assert.equal(algorithmContentGroups.every((group) => group.id === group.roadmapNodeId), true);
  assert.equal(algorithmContentGroups.every((group) => group.questions.length > 0), true);
  assert.equal(
    algorithmContentItems.every(
      (question) =>
        !("roadmapNodeId" in question) &&
        !("trackId" in question) &&
        !("contentVersion" in question),
    ),
    true,
  );
});

test("every question uses exactly one native response contract", () => {
  let choiceCount = 0;
  let orderingCount = 0;
  let complexityCount = 0;

  for (const question of algorithmContentItems) {
    const variants = [
      isAlgorithmChoiceQuestion(question),
      isAlgorithmOrderingQuestion(question),
      isAlgorithmComplexityQuestion(question),
    ];
    assert.equal(variants.filter(Boolean).length, 1, question.id);
    assert.equal(ALGORITHM_QUESTION_DIFFICULTIES.includes(question.difficulty), true, question.id);
    assert.equal(ALGORITHM_QUESTION_LEARNING_STAGES.includes(question.learningStage), true, question.id);
    assert.equal(ALGORITHM_QUESTION_TYPES.includes(question.type), true, question.id);

    if (isAlgorithmChoiceQuestion(question)) {
      choiceCount += 1;
      assert.ok(question.options.length >= 2, question.id);
      assert.equal(new Set(question.options.map((option) => option.id)).size, question.options.length, question.id);
      assert.ok(question.options.some((option) => option.isCorrect), question.id);
    } else if (isAlgorithmOrderingQuestion(question)) {
      orderingCount += 1;
      assert.deepEqual(
        new Set(question.correctOrder),
        new Set(question.subgoals.map((subgoal) => subgoal.id)),
        question.id,
      );
    } else if (isAlgorithmComplexityQuestion(question)) {
      complexityCount += 1;
      assert.ok(question.correctComplexity.time.length > 0, question.id);
      assert.ok(question.correctComplexity.space.length > 0, question.id);
    }
  }

  assert.deepEqual(
    { choiceCount, complexityCount, orderingCount },
    { choiceCount: 1_672, complexityCount: 59, orderingCount: 20 },
  );
});

test("enabled Algorithms modes collectively support every authored question type", () => {
  const track = getTrackDefinition("algorithms");
  const supportedTypes = new Set(
    track.sessionModes
      .filter((mode) => mode.enabled)
      .flatMap((mode) => mode.supportedItemTypes),
  );
  const authoredTypes = new Set(algorithmContentItems.map((question) => question.type));

  assert.deepEqual(new Set(track.contentManifest.supportedItemTypes), new Set(ALGORITHM_QUESTION_TYPES));
  for (const authoredType of authoredTypes) {
    assert.equal(supportedTypes.has(authoredType), true, authoredType);
  }
});

test("canonical validator rejects duplicate ids, empty groups, and invalid choices", () => {
  const validQuestion = makeQuestion("validator-question");
  const duplicateGroups: readonly AlgorithmContentGroup[] = [
    makeGroup([validQuestion]),
    makeGroup([validQuestion]),
  ];
  assert.throws(
    () => validateAlgorithmContentGroups(duplicateGroups),
    /duplicates group|duplicate question id/,
  );

  assert.throws(
    () => validateAlgorithmContentGroups([makeGroup([])]),
    /group has no questions/,
  );

  const noCorrectAnswer: AlgorithmQuestion = {
    ...makeQuestion("no-correct-answer"),
    options: [
      { id: "a", isCorrect: false, text: "A" },
      { id: "b", isCorrect: false, text: "B" },
    ],
  };
  assert.throws(
    () => validateAlgorithmContentGroups([makeGroup([noCorrectAnswer])]),
    /has no correct option/,
  );
});

function makeGroup(questions: readonly AlgorithmQuestion[]): AlgorithmContentGroup {
  return {
    id: "complexity_and_constraints",
    questions,
    roadmapNodeId: "complexity_and_constraints",
  };
}

function makeQuestion(id: string): AlgorithmChoiceQuestion {
  return {
    difficulty: "intro",
    feedbackModel: {
      decisionSignal: "Use the input constraint.",
      mentalModelCorrection: "Reason from the contract.",
      mistakeTypes: ["validator_mistake"],
      nextAction: "Try another question.",
      result: "diagnostic",
    },
    id,
    learningStage: "foundations",
    options: [
      { id: "correct", isCorrect: true, text: "Correct" },
      { id: "incorrect", isCorrect: false, text: "Incorrect" },
    ],
    primarySkillAtomId: "validator_skill",
    prompt: "Which answer is correct?",
    type: "single_choice",
  };
}
