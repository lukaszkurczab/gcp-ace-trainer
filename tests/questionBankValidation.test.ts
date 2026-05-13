import assert from "node:assert/strict";
import test from "node:test";

import { validateQuestionBankFile } from "../scripts/validateQuestionBank";

test("foundation question bank satisfies strict seed validation", () => {
  const summary = validateQuestionBankFile();

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.total, 360);
  assert.deepEqual(summary.byDomain, {
    setup_environment: 82,
    planning_implementation: 114,
    operations: 90,
    access_security: 74
  });
  assert.deepEqual(summary.byDifficulty, {
    easy: 68,
    medium: 211,
    hard: 81
  });
  assert.deepEqual(summary.byType, {
    single: 278,
    multiple: 82
  });
});
