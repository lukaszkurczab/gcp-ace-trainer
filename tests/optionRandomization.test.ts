import assert from "node:assert/strict";
import test from "node:test";

import { shuffleQuestionOptions } from "../src/features/practice/practiceService";
import { getShuffledAlgorithmStaticCheckOptions } from "../src/tracks/algorithms";
import type { AlgorithmStaticMicroCheck } from "../src/tracks/algorithms";
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

test("Algorithms static checks shuffle displayed options without changing correct answer ids", () => {
  withFixedRandom(0, () => {
    const check: AlgorithmStaticMicroCheck = {
      correctAnswer: "expected_signal",
      feedback: "Use the decision signal, not the first visible answer.",
      id: "algorithm-option-order-test",
      mistakeTypes: ["wrong_approach"],
      options: [
        { id: "expected_signal", text: "Correct" },
        { id: "wrong_1", text: "Wrong 1" },
        { id: "wrong_2", text: "Wrong 2" },
      ],
      prompt: "Choose the best signal.",
      status: "active",
      testedSkillAtomIds: ["choose_lookup_key"],
      type: "single_choice",
    };

    const shuffled = getShuffledAlgorithmStaticCheckOptions(check);

    assert.notDeepEqual(
      shuffled.map((option) => option.id),
      check.options?.map((option) => option.id),
    );
    assert.deepEqual(new Set(shuffled.map((option) => option.id)), new Set(["expected_signal", "wrong_1", "wrong_2"]));
    assert.equal(check.correctAnswer, "expected_signal");
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
