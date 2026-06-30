import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHM_TRAINING_ITEMS,
  scoreAlgorithmStaticMicroCheck,
  type AlgorithmStaticMicroCheck,
} from "../src/tracks/algorithms";

test("Algorithms static scoring supports required answer types", () => {
  assert.equal(scoreCheck("single_choice", "check_complement_first").status, "correct");
  assert.equal(scoreCheck("multi_select", ["linear_scan"]).status, "partial");
  assert.equal(scoreCheck("complexity_pair", { time: "O(n)", space: "O(1)" }).status, "partial");
  assert.equal(
    scoreCheck("order_steps", [
      "create_lookup",
      "scan_values",
      "derive_complement",
      "check_lookup",
      "store_current",
      "return_none",
    ]).status,
    "correct",
  );
  assert.equal(scoreCheck("select_pseudocode_line", "line-5").status, "correct");
  assert.equal(scoreCheck("trace_next_step", "store_7").status, "incorrect");
});

test("Algorithms static scoring returns static feedback and mistake types for incorrect answers", () => {
  const check = getCheck("trace_next_step");
  const score = scoreAlgorithmStaticMicroCheck(check, "store_7");

  assert.equal(score.status, "incorrect");
  assert.equal(score.feedback, check.feedback);
  assert.deepEqual(score.mistakeTypes, check.mistakeTypes);
  assert.deepEqual(score.result, {
    isCorrect: false,
    kind: "correctness",
  });
});

function scoreCheck(
  checkType: AlgorithmStaticMicroCheck["type"],
  answer: Parameters<typeof scoreAlgorithmStaticMicroCheck>[1],
) {
  return scoreAlgorithmStaticMicroCheck(getCheck(checkType), answer);
}

function getCheck(checkType: AlgorithmStaticMicroCheck["type"]): AlgorithmStaticMicroCheck {
  const checks: AlgorithmStaticMicroCheck[] = [];

  for (const item of ALGORITHM_TRAINING_ITEMS) {
    for (const check of item.staticMicroChecks ?? []) {
      checks.push(check);
    }
  }

  const check = checks.find((candidate) => candidate.type === checkType);

  assert.ok(check, `Missing check type ${checkType}`);
  assert.equal(check.status, "active");
  return check;
}
