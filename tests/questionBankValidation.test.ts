import assert from "node:assert/strict";
import test from "node:test";

import { validateQuestionBankFile } from "../scripts/validateQuestionBank";

test("foundation question bank satisfies strict seed validation", () => {
  const summary = validateQuestionBankFile();

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.total, 240);
  assert.deepEqual(summary.byDomain, {
    setup_environment: 58,
    planning_implementation: 72,
    operations: 62,
    access_security: 48
  });
  assert.deepEqual(summary.byDifficulty, {
    easy: 60,
    medium: 132,
    hard: 48
  });
  assert.deepEqual(summary.byType, {
    single: 184,
    multiple: 56
  });
});
