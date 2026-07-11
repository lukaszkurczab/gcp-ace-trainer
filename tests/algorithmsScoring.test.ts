import assert from "node:assert/strict";
import test from "node:test";

import type {
  AlgorithmChoiceQuestion,
  AlgorithmComplexityQuestion,
  AlgorithmOrderingQuestion,
  AlgorithmQuestion,
} from "../src/tracks/algorithms/algorithmQuestionTypes";
import {
  createAlgorithmsScoringAdapter,
  scoreAlgorithmQuestion,
} from "../src/tracks/algorithms/algorithmsScoringAdapter";

test("Algorithms scores single and multiple choice from root options", () => {
  const single = makeChoiceQuestion();
  const multiple = makeChoiceQuestion({
    id: "multi",
    options: [
      { id: "a", isCorrect: true, text: "A" },
      { id: "b", isCorrect: true, text: "B" },
      { id: "c", isCorrect: false, text: "C" },
    ],
  });

  assert.equal(scoreOptions(single, ["a"]).status, "correct");
  assert.equal(scoreOptions(single, ["b"]).status, "incorrect");
  assert.equal(scoreOptions(multiple, ["a"]).status, "partial");
  assert.equal(scoreOptions(multiple, ["a", "b"]).status, "correct");
  assert.equal(scoreOptions(multiple, ["a", "c"]).status, "incorrect");
});

test("Algorithms scores ordering by root correctOrder", () => {
  const question = makeOrderingQuestion();

  assert.equal(scoreOptions(question, ["read", "repair", "record"]).status, "correct");
  assert.equal(scoreOptions(question, ["read", "record", "repair"]).status, "partial");
  assert.equal(scoreOptions(question, ["repair", "record", "read"]).status, "incorrect");
});

test("Algorithms scores time and space from root correctComplexity", () => {
  const question = makeComplexityQuestion();

  assert.equal(scoreComplexity(question, "O(n)", "O(1)").status, "correct");
  assert.equal(scoreComplexity(question, "O(n)", "O(n)").status, "partial");
  assert.equal(scoreComplexity(question, "O(n²)", "O(n)").status, "incorrect");
});

test("Algorithms incorrect results expose authored feedback and mistake types", () => {
  const question = makeChoiceQuestion();
  const score = scoreOptions(question, ["b"]);

  assert.equal(score.feedback, question.feedbackModel.mentalModelCorrection);
  assert.deepEqual(score.mistakeTypes, question.feedbackModel.mistakeTypes);
  assert.deepEqual(score.result, { isCorrect: false, kind: "correctness" });
});

test("Algorithms rejects a response kind that does not match source interaction fields", () => {
  assert.throws(
    () => scoreAlgorithmQuestion(makeChoiceQuestion(), {
      kind: "complexity_check",
      selectedComplexityAnswer: { space: "O(1)", time: "O(n)" },
    }),
    /expected option_selection/,
  );
  assert.throws(
    () => scoreAlgorithmQuestion(makeComplexityQuestion(), {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    }),
    /expected complexity_check/,
  );
});

test("Algorithms scoring adapter delegates directly to question scoring", () => {
  const result = createAlgorithmsScoringAdapter().scoreAttempt(makeChoiceQuestion(), {
    kind: "option_selection",
    selectedOptionIds: ["a"],
  });

  assert.deepEqual(result, { isCorrect: true, kind: "correctness" });
});

function scoreOptions(question: AlgorithmQuestion, selectedOptionIds: string[]) {
  return scoreAlgorithmQuestion(question, { kind: "option_selection", selectedOptionIds });
}

function scoreComplexity(question: AlgorithmQuestion, time: string, space: string) {
  return scoreAlgorithmQuestion(question, {
    kind: "complexity_check",
    selectedComplexityAnswer: { space, time },
  });
}

function makeChoiceQuestion(
  overrides: Partial<AlgorithmChoiceQuestion> = {},
): AlgorithmChoiceQuestion {
  return {
    ...makeBaseQuestion(),
    options: [
      { id: "a", isCorrect: true, text: "Correct" },
      { id: "b", isCorrect: false, text: "Wrong" },
    ],
    ...overrides,
  };
}

function makeOrderingQuestion(): AlgorithmOrderingQuestion {
  return {
    ...makeBaseQuestion(),
    correctOrder: ["read", "repair", "record"],
    subgoals: [
      { id: "read", text: "Read" },
      { id: "repair", text: "Repair" },
      { id: "record", text: "Record" },
    ],
    type: "subgoal_ordering",
  };
}

function makeComplexityQuestion(): AlgorithmComplexityQuestion {
  return {
    ...makeBaseQuestion(),
    correctComplexity: { space: "O(1)", time: "O(n)" },
    type: "complexity_check",
  };
}

function makeBaseQuestion() {
  return {
    difficulty: "intro" as const,
    feedbackModel: {
      decisionSignal: "Use the authored signal.",
      mentalModelCorrection: "Apply the invariant before choosing.",
      mistakeTypes: ["wrong_invariant"],
      nextAction: "Review the invariant.",
      result: "diagnostic" as const,
    },
    id: "choice",
    learningStage: "foundations" as const,
    primarySkillAtomId: "choose_invariant",
    prompt: "Choose.",
    type: "single_choice" as const,
  };
}
