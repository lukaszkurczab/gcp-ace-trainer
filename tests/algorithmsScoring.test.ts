import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHM_TRAINING_ITEMS,
  scoreAlgorithmStaticMicroCheck,
  type AlgorithmStaticMicroCheck,
} from "../src/tracks/algorithms";

test("Algorithms static scoring supports required answer types", () => {
  assert.equal(scoreCheck("alg-check-hash-primer-001", "check_complement_first").status, "correct");
  assert.equal(scoreCheck("alg-check-array-naming-001", ["linear_scan"]).status, "partial");
  assert.equal(scoreCheck("alg-check-complexity-pair-001", { time: "O(n)", space: "O(1)" }).status, "partial");
  assert.equal(
    scoreCheck("alg-check-hash-pseudocode-order-001", [
      "create_lookup",
      "scan_values",
      "derive_complement",
      "check_lookup",
      "store_current",
      "return_none",
    ]).status,
    "correct",
  );
  assert.equal(scoreCheck("alg-check-two-pointers-line-001", "line-5").status, "correct");
  assert.equal(scoreCheck("alg-check-hash-trace-next-001", "store_7").status, "incorrect");
});

test("Algorithms static scoring returns static feedback and mistake types for incorrect answers", () => {
  const check = getCheck("alg-check-hash-trace-next-001");
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
  checkId: string,
  answer: Parameters<typeof scoreAlgorithmStaticMicroCheck>[1],
) {
  return scoreAlgorithmStaticMicroCheck(getCheck(checkId), answer);
}

function getCheck(checkId: string): AlgorithmStaticMicroCheck {
  const checks: AlgorithmStaticMicroCheck[] = [];

  for (const item of ALGORITHM_TRAINING_ITEMS) {
    for (const check of item.staticMicroChecks ?? []) {
      checks.push(check);
    }
  }

  const check = checks.find((candidate) => candidate.id === checkId);

  assert.ok(check, `Missing check ${checkId}`);
  assert.equal(check.status, "active");
  return check;
}
