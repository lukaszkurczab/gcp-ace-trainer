import assert from "node:assert/strict";
import test from "node:test";

import { createAlgorithmsFamilyRuntime } from "../src/application/algorithms";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { validateBundledContent } from "../src/content/application";
import { createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../src/domain";
import { createAlgorithmReviewEntry } from "../src/tracks/algorithms";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/algorithms/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/algorithms/domain";

const NOW = "2026-01-08T00:00:00.000Z";

function reviewFor(item: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItems"]>[number], index: number): ReviewQueueEntry {
  const ref = getAlgorithmContentCatalog().toContentItemRef(item);
  const attempt = createTrainingAttempt({
    id: `prior-${index}`,
    sessionId: `prior-session-${index}`,
    trackId: "algorithms",
    modeId: "algorithms-guided-practice",
    occurrenceId: `prior-occurrence-${index}`,
    item: ref,
    response: { kind: "choice", selectedOptionIds: ["wrong"] } as AlgorithmResponse,
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: item.taxonomy.primaryMentalUnitId, role: "primary" }] },
    answeredAt: "2026-01-01T00:00:00.000Z",
    committedAt: "2026-01-01T00:00:00.000Z",
  });
  return createAlgorithmReviewEntry(attempt, NOW);
}

function correctResponse(item: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported test item interaction.");
}

test("Algorithms runtime persists due_queue source and makes only that session eligible for review retention", async () => {
  await validateBundledContent();
  const catalog = getAlgorithmContentCatalog();
  const dueReviews = catalog.getItems().slice(0, 10).map(reviewFor);
  const runtime = createAlgorithmsFamilyRuntime();

  const preparedDue = await runtime.prepare({
    trackId: "algorithms",
    modeId: "algorithms-weak-area-review",
    request: { sessionId: "due-session", requestedLength: 10, reviewSource: "due_queue" },
    attempts: [],
    reviews: dueReviews,
    now: NOW,
  });
  assert.equal(preparedDue.session.configurationSnapshot.reviewSource, "due_queue");
  const dueOccurrence = preparedDue.session.itemOrder[0]!;
  const dueItem = catalog.getItemById(dueOccurrence.item.itemId);
  const dueOutcome = await runtime.submitPractice({ session: preparedDue.session, response: correctResponse(dueItem), attempts: [], reviews: dueReviews, now: NOW });
  const dueMutation = dueOutcome.reviewMutations[0];
  assert.equal(dueMutation?.kind, "upsert");
  if (dueMutation?.kind === "upsert") assert.equal(dueMutation.entry.consecutiveAfterDueSuccesses, 1);

  const ordinaryPrepared = await runtime.prepare({
    trackId: "algorithms",
    modeId: "algorithms-guided-practice",
    request: { sessionId: "ordinary-session", requestedLength: 10, scope: { roadmapNodeId: dueItem.taxonomy.roadmapNodeId } },
    attempts: [],
    reviews: [dueReviews.find((review) => review.sourceItem.itemId === dueOccurrence.item.itemId)!],
    now: NOW,
  });
  assert.equal(ordinaryPrepared.session.configurationSnapshot.reviewSource, undefined);
  const ordinaryOccurrence = ordinaryPrepared.session.itemOrder[0]!;
  const ordinaryItem = catalog.getItemById(ordinaryOccurrence.item.itemId);
  const ordinaryReview = reviewFor(ordinaryItem, 100);
  const ordinaryOutcome = await runtime.submitPractice({ session: ordinaryPrepared.session, response: correctResponse(ordinaryItem), attempts: [], reviews: [ordinaryReview], now: NOW });
  const ordinaryMutation = ordinaryOutcome.reviewMutations[0];
  assert.equal(ordinaryMutation?.kind, "upsert");
  if (ordinaryMutation?.kind === "upsert") assert.equal(ordinaryMutation.entry.consecutiveAfterDueSuccesses, 0);
});

test("Algorithms runtime rejects malformed review requests before selecting or persisting a session", async () => {
  await validateBundledContent();
  const runtime = createAlgorithmsFamilyRuntime();
  const input = {
    trackId: "algorithms",
    modeId: "algorithms-weak-area-review",
    attempts: [],
    reviews: [],
    now: NOW,
  } as const;

  await assert.rejects(
    runtime.prepare({ ...input, request: { sessionId: "invalid-source", requestedLength: 10, reviewSource: "unknown" } }),
    /review source must be due_queue or session_misses/,
  );
  await assert.rejects(
    runtime.prepare({ ...input, request: { sessionId: "invalid-refs", requestedLength: 10, reviewSource: "due_queue", reviewItemRefs: [] } }),
    /review item refs require the session_misses review source/,
  );
});
