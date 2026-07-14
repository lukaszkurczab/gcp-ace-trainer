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
  algorithmContentGroups,
  algorithmContentItems,
  algorithmContentManifest,
  validateAlgorithmContentGroups,
  validateAlgorithmQuestion,
} from "../src/tracks/algorithms/content";
import { ALGORITHM_CONTENT_VERSION } from "../src/tracks/algorithms/algorithmContentTypes";

const EXPECTED_QUESTION_COUNT = 1_683;
const EXPECTED_GROUP_COUNT = 27;

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
        question.contentVersion === ALGORITHM_CONTENT_VERSION,
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
      assert.ok(question.correctComplexity.dimensions.length > 0, question.id);
    }
  }

  assert.deepEqual(
    { choiceCount, complexityCount, orderingCount },
    { choiceCount: 1_664, complexityCount: 0, orderingCount: 19 },
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

test("correctOptionId conversion uses one exact stable option id", () => {
  const options = [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ];
  assert.deepEqual(convertCorrectOptionId(options, "b"), [
    { id: "a", isCorrect: false, text: "A" },
    { id: "b", isCorrect: true, text: "B" },
  ]);
  assert.throws(() => convertCorrectOptionId(options, "missing"), /exactly one option/);
  assert.throws(
    () => convertCorrectOptionId([...options, { id: "b", text: "Duplicate" }], "b"),
    /duplicate option id/,
  );
});

test("flattened micro-checks preserve stable ids, inherited metadata, and child fields", () => {
  const extracted = algorithmContentItems.find((question) => question.id === "alg-prod-array-string-002-check");
  assert.ok(extracted && isAlgorithmChoiceQuestion(extracted));
  assert.equal(algorithmContentItems.some((question) => question.id === "alg-prod-array-string-002"), false);
  assert.equal(extracted.contentVersion, ALGORITHM_CONTENT_VERSION);
  assert.equal(extracted.difficulty, "medium");
  assert.equal(extracted.primarySkillAtomId, "distinguish_output_contract");
  assert.equal(extracted.prompt, "Choose the deciding constraint.");
  assert.match(extracted.instruction ?? "", /Two solutions both preserve the order/);
  assert.match(extracted.answerFeedback ?? "", /in-place mutation/);
  assert.equal(algorithmContentManifest.itemCount, algorithmContentItems.length);
});

test("canonical validator rejects every obsolete, mixed, or unknown response shape", () => {
  for (const obsoleteField of ["staticMicroChecks", "correctOptionId", "responseSpec", "correctAnswerId"]) {
    assert.throws(
      () => validateAlgorithmQuestion({ ...makeQuestion(`obsolete-${obsoleteField}`), [obsoleteField]: {} }),
      new RegExp(`obsolete response field ${obsoleteField}`),
    );
  }
  assert.throws(
    () => validateAlgorithmQuestion({ ...makeQuestion("choice-and-order"), correctOrder: ["a", "b"], subgoals: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
    /exactly one root response contract/,
  );
  assert.throws(
    () => validateAlgorithmQuestion({ ...makeQuestion("unknown-response"), answerKey: "correct" }),
    /unknown field answerKey/,
  );
});

test("canonical validator covers multiple choice, ordering, and content-defined complexity", () => {
  validateAlgorithmQuestion({
    ...makeQuestion("multi-correct"),
    options: [
      { id: "a", isCorrect: true, text: "A" },
      { id: "b", isCorrect: true, text: "B" },
      { id: "c", isCorrect: false, text: "C" },
    ],
  });
  assert.throws(
    () => validateAlgorithmQuestion({ ...makeQuestion("duplicate-choice"), options: [{ id: "a", isCorrect: true, text: "A" }, { id: "a", isCorrect: false, text: "B" }] }),
    /duplicate option id/,
  );
  assert.throws(
    () => validateAlgorithmQuestion({ ...withoutOptions(makeQuestion("short-order")), correctOrder: ["a"], subgoals: [{ id: "a", text: "A" }] }),
    /at least two unique ids/,
  );
  assert.throws(
    () => validateAlgorithmQuestion({ ...withoutOptions(makeQuestion("missing-order-id")), correctOrder: ["a", "missing"], subgoals: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
    /every subgoal id exactly once/,
  );
  validateAlgorithmQuestion({
    ...withoutOptions(makeQuestion("time-only-complexity")),
    correctComplexity: {
      dimensions: [{ id: "time", values: ["O(1)", "O(n)"], acceptedValues: ["O(n)"], acceptedAliases: ["linear"] }],
    },
    type: "complexity_check",
  });
});

function makeGroup(questions: readonly AlgorithmQuestion[]): AlgorithmContentGroup {
  return {
    id: "complexity_and_constraints",
    questions,
    roadmapNodeId: "complexity_and_constraints",
  };
}

function convertCorrectOptionId(
  options: readonly { id: string; text: string }[],
  correctOptionId: string,
) {
  if (new Set(options.map((option) => option.id)).size !== options.length) {
    throw new Error("duplicate option id");
  }
  if (options.filter((option) => option.id === correctOptionId).length !== 1) {
    throw new Error("correctOptionId must match exactly one option");
  }
  return options.map((option) => ({ ...option, isCorrect: option.id === correctOptionId }));
}

function withoutOptions(question: AlgorithmChoiceQuestion) {
  const { options: _options, ...base } = question;
  return base;
}

function makeQuestion(id: string): AlgorithmChoiceQuestion {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
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
