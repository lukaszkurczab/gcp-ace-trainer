import assert from "node:assert/strict";
import test from "node:test";

import { validateQuestionBankFile } from "../scripts/validateQuestionBank";

test("foundation question bank satisfies strict seed validation", () => {
  const summary = validateQuestionBankFile();

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.total, 320);
  assert.deepEqual(summary.byDomain, {
    setup_environment: 78,
    planning_implementation: 92,
    operations: 82,
    access_security: 68
  });
  assert.deepEqual(summary.byDifficulty, {
    easy: 63,
    medium: 182,
    hard: 75
  });
  assert.deepEqual(summary.byType, {
    single: 240,
    multiple: 80
  });
});
