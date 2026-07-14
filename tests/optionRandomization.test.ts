import assert from "node:assert/strict";
import test from "node:test";

import { shuffleQuestionOptions } from "../src/features/practice/practiceService";
import { getShuffledAlgorithmQuestionOptions } from "../src/tracks/algorithms/algorithmOptionOrder";
import type { AlgorithmChoiceQuestion } from "../src/tracks/algorithms/algorithmQuestionTypes";
import { makeQuestion } from "./fixtures";

test("Cloud practice shuffles displayed options without changing scoring ids", () => {
  withFixedRandom(0, () => {
    const question = makeQuestion({
      correctOptionIds: ["a"],
      options: [
        { id: "a", text: "Correct" },
        { id: "b", text: "Wrong B" },
        { id: "c", text: "Wrong C" },
        { id: "d", text: "Wrong D" },
      ],
    });

    const shuffled = shuffleQuestionOptions(question);

    assert.notDeepEqual(
      shuffled.options.map((option) => option.id),
      question.options.map((option) => option.id),
    );
    assert.deepEqual(new Set(shuffled.options.map((option) => option.id)), new Set(["a", "b", "c", "d"]));
    assert.deepEqual(shuffled.correctOptionIds, ["a"]);
  });
});

test("Algorithms questions shuffle root options without changing authored correctness", () => {
  withFixedRandom(0, () => {
    const question: AlgorithmChoiceQuestion = {
      contentVersion: "algorithms-core",
      difficulty: "intro",
      feedbackModel: {
        decisionSignal: "Use the decision signal.",
        mentalModelCorrection: "Do not choose from surface wording.",
        mistakeTypes: ["wrong_approach"],
        nextAction: "Review the signal.",
        result: "diagnostic",
      },
      id: "algorithm-option-order-test",
      learningStage: "foundations",
      options: [
        { id: "expected_signal", isCorrect: true, text: "Correct" },
        { id: "wrong_1", isCorrect: false, text: "Wrong 1" },
        { id: "wrong_2", isCorrect: false, text: "Wrong 2" },
      ],
      primarySkillAtomId: "choose_lookup_key",
      prompt: "Choose the best signal.",
      type: "single_choice",
    };

    const shuffled = getShuffledAlgorithmQuestionOptions(question);

    assert.notDeepEqual(
      shuffled.map((option) => option.id),
      question.options.map((option) => option.id),
    );
    assert.deepEqual(new Set(shuffled.map((option) => option.id)), new Set(["expected_signal", "wrong_1", "wrong_2"]));
    assert.equal(question.options.find((option) => option.id === "expected_signal")?.isCorrect, true);
  });
});

function withFixedRandom<T>(value: number, callback: () => T): T {
  const originalRandom = Math.random;

  Math.random = () => value;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}
