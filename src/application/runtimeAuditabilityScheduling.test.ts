import { TEST_CONTENT_PACKAGE_PIN } from "../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test from "node:test";

import { createAdjustableWallClock } from "./bootstrap/trainingLifecycleComposition";
import { createTrainingAttempt, type TrainingAttempt } from "../domain";
import { createAlgorithmReviewEntry, updateAlgorithmReviewEntry } from "../tracks/coding-interview";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const item = { trackId: "coding-interview-dsa-problem-solving" as const, itemId: "alg-complexity-amortized-001", contentVersion: "algorithms-core-0002" , packagePin: TEST_CONTENT_PACKAGE_PIN};

function attempt(input: Readonly<{ id: string; kind: "correct" | "incorrect" | "partial"; sessionId: string; timestamp: string }>): TrainingAttempt<{ kind: "choice"; selectedOptionIds: readonly string[] }> {
  return createTrainingAttempt({
    id: input.id,
    sessionId: input.sessionId,
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-guided-practice",
    occurrenceId: `${input.sessionId}:occurrence:0`,
    item,
    response: { kind: "choice", selectedOptionIds: input.kind === "correct" ? ["accepted"] : ["wrong"] },
    result: { kind: input.kind, earnedPoints: input.kind === "correct" ? 1 : 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: "amortized_analysis", role: "primary" }] },
    answeredAt: input.timestamp,
    committedAt: input.timestamp,
  });
}

test("injected audit clock drives normal scheduling and both due retention outcomes without storage mutation", () => {
  const clock = createAdjustableWallClock(() => "2026-01-01T00:00:00.000Z");
  const normal = attempt({ id: "normal-correct", kind: "correct", sessionId: "normal", timestamp: clock.now() });
  const scheduled = createAlgorithmReviewEntry(normal);

  assert.deepEqual(scheduled.reasons, ["scheduled_retrieval"]);
  assert.equal(scheduled.dueAt, "2026-01-08T00:00:00.000Z");
  assert.equal(scheduled.persistent, false);

  clock.advanceBy(WEEK);
  const dueQueue = { eligibleForPersistentResolution: true } as const;
  const firstDueSuccess = updateAlgorithmReviewEntry(scheduled, attempt({ id: "first-due-success", kind: "correct", sessionId: "due-one", timestamp: clock.now() }), dueQueue);
  assert.equal(firstDueSuccess?.consecutiveAfterDueSuccesses, 1);
  assert.equal(updateAlgorithmReviewEntry(firstDueSuccess!, attempt({ id: "second-due-success", kind: "correct", sessionId: "due-two", timestamp: clock.now() }), dueQueue), undefined);

  const failedDue = updateAlgorithmReviewEntry(scheduled, attempt({ id: "failed-due", kind: "incorrect", sessionId: "due-failure", timestamp: clock.now() }), dueQueue);
  assert.deepEqual(failedDue?.reasons, ["incorrect"]);
  assert.equal(failedDue?.persistent, true);
  assert.equal(failedDue?.consecutiveAfterDueSuccesses, 0);
  assert.equal(updateAlgorithmReviewEntry(failedDue!, attempt({ id: "remediation-success", kind: "correct", sessionId: "remediation", timestamp: clock.now() }), dueQueue)?.consecutiveAfterDueSuccesses, 1);
});

test("injected audit clock rejects an advance outside the ISO date range without changing its offset", () => {
  const base = new Date(8_640_000_000_000_000 - 1).toISOString();
  const clock = createAdjustableWallClock(() => base);

  assert.throws(() => clock.advanceBy(2), /valid ISO date range/);
  assert.equal(clock.now(), base);
});
