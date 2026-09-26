import assert from "node:assert/strict";
import test from "node:test";

import { isLearningPlanRecoveryRetryDue, learningPlanRecoveryRetryDelayMs, nextLearningPlanRecoveryRetryAt } from "./learningPlanRecoveryRetryPolicy";

test("learning plan recovery uses capped exponential retry delays and an inclusive due boundary", () => {
  const now = new Date("2026-09-26T10:00:00.000Z");
  assert.equal(learningPlanRecoveryRetryDelayMs(1), 30_000);
  assert.equal(learningPlanRecoveryRetryDelayMs(2), 60_000);
  assert.equal(learningPlanRecoveryRetryDelayMs(100), 6 * 60 * 60 * 1_000);
  const dueAt = nextLearningPlanRecoveryRetryAt(1, now);
  assert.equal(dueAt, "2026-09-26T10:00:30.000Z");
  assert.equal(isLearningPlanRecoveryRetryDue(dueAt, now), false);
  assert.equal(isLearningPlanRecoveryRetryDue(dueAt, new Date(dueAt)), true);
  assert.equal(isLearningPlanRecoveryRetryDue("not-a-date", now), false);
  assert.throws(() => learningPlanRecoveryRetryDelayMs(0), RangeError);
});
