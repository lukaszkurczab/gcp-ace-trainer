import assert from "node:assert/strict";
import test from "node:test";
import type { ReviewQueueItem, TrainingAttempt } from "../src/domain/training";
import {
  buildAlgorithmProgressFacts,
  getAlgorithmTrainingItemsForRoadmapNode,
  isRoadmapPrerequisiteSatisfied,
} from "../src/tracks/algorithms";

const complexityItems = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints");

test("ten correct attempts out of a large node are exposure, not mastery", () => {
  const node = buildAlgorithmProgressFacts(complexityItems.slice(0, 10).map(makeCorrectAttempt))
    .nodeProgress[0];

  assert.equal(node?.status, "initial_exposure");
  assert.equal(node?.eligibleForNext, false);
  assert.equal(node?.mastered, false);
});

test("eligible for next remains distinct from mastery while retention is pending", () => {
  const attempts = complexityItems.map(makeCorrectAttempt);
  const pendingRetention = complexityItems.map((item, index) =>
    makeRetentionItem(item.id, index));
  const facts = buildAlgorithmProgressFacts(
    attempts,
    undefined,
    undefined,
    pendingRetention,
    "2026-07-03T00:00:00.000Z",
  );
  const node = facts.nodeProgress[0];

  assert.equal(node?.eligibleForNext, true);
  assert.equal(node?.mastered, false);
  assert.equal(node?.status, "eligible_for_next");
  assert.equal(node?.nextRequiredAction, "retention_check");
  assert.equal(isRoadmapPrerequisiteSatisfied(node!.status), true);
  assert.notEqual(facts.activeRoadmapNode.id, node?.nodeId);
});

test("mastery requires passed retention evidence for every core skill atom", () => {
  const attempts = complexityItems.map(makeCorrectAttempt);
  const passedRetention = complexityItems.map((item, index) => ({
    ...makeRetentionItem(item.id, index),
    retentionPassedAt: "2026-07-03T00:00:00.000Z",
  }));
  const node = buildAlgorithmProgressFacts(
    attempts,
    undefined,
    undefined,
    passedRetention,
    "2026-07-03T00:00:00.000Z",
  ).nodeProgress[0];

  assert.equal(node?.retentionPassedCount, node?.coreSkillAtomCount);
  assert.equal(node?.mastered, true);
  assert.equal(node?.status, "mastered");
});

test("critical remediation blocks next-topic eligibility", () => {
  const attempts = complexityItems.map(makeCorrectAttempt);
  const due: ReviewQueueItem = {
    createdAt: "2026-07-01T00:00:00.000Z",
    dueAt: "2026-07-02T00:00:00.000Z",
    id: "review:critical",
    itemId: complexityItems[0]!.id,
    kind: "remediation",
    priority: "high",
    reasons: ["incorrect_attempt"],
    sourceAttemptId: "attempt:critical",
    trackId: "algorithms",
  };
  const node = buildAlgorithmProgressFacts(
    attempts,
    undefined,
    undefined,
    [due],
    "2026-07-03T00:00:00.000Z",
  ).nodeProgress[0];

  assert.equal(node?.criticalRemediationDueCount, 1);
  assert.equal(node?.eligibleForNext, false);
  assert.equal(node?.mastered, false);
  assert.equal(node?.nextRequiredAction, "remediate");
});

function makeCorrectAttempt(
  item: (typeof complexityItems)[number],
  index: number,
): TrainingAttempt {
  return {
    answeredAt: `2026-07-01T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
    id: `attempt:${item.id}`,
    itemId: item.id,
    itemType: item.type,
    modeId: "algorithms-practice",
    response: { kind: "option_selection", selectedOptionIds: [] },
    result: { isCorrect: true, kind: "correctness" },
    trackId: "algorithms",
  };
}

function makeRetentionItem(itemId: string, index: number): ReviewQueueItem {
  return {
    createdAt: "2026-07-01T00:00:00.000Z",
    dueAt: "2026-07-08T00:00:00.000Z",
    id: `review:retention:${index}`,
    itemId,
    kind: "retention",
    priority: "low",
    reasons: ["due_spacing"],
    sourceAttemptId: `attempt:retention:${index}`,
    trackId: "algorithms",
  };
}
