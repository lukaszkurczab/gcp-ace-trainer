import assert from "node:assert/strict";
import test from "node:test";

import { CodingInterviewFamilyRuntime, startAlgorithmsSession } from "../src/application/coding-interview";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { getCodingPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../src/domain";
import { createAlgorithmReviewEntry } from "../src/tracks/coding-interview";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/coding-interview/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/coding-interview/domain";
import { getActiveTrainingSession } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-01-08T00:00:00.000Z";

function reviewFor(item: ReturnType<ReturnType<typeof getCodingPackageTestCatalog>["getItems"]>[number], index: number): ReviewQueueEntry {
  const ref = getCodingPackageTestCatalog().toContentItemRef(item);
  const attempt = createTrainingAttempt({
    id: `prior-${index}`,
    sessionId: `prior-session-${index}`,
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-guided-practice",
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

function correctResponse(item: ReturnType<ReturnType<typeof getCodingPackageTestCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported test item interaction.");
}

test("Algorithms runtime persists due_queue source and makes only that session eligible for review retention", async () => {
  await prepareBundledTestPackages();
  const catalog = getCodingPackageTestCatalog();
  const dueReviews = catalog.getItems().slice(0, 10).map(reviewFor);
  const runtime = new CodingInterviewFamilyRuntime(catalog, undefined, "coding-interview-taxonomy-v2");

  const preparedDue = await runtime.prepare({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-weak-area-review",
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
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-guided-practice",
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

test("Algorithms Custom Practice persists its chosen timing while consuming the declared Guided blueprint", async () => {
  await prepareBundledTestPackages();
  const catalog = getCodingPackageTestCatalog();
  const runtime = new CodingInterviewFamilyRuntime(catalog, undefined, "coding-interview-taxonomy-v2");
  const topicId = catalog.getItems()[0]!.taxonomy.roadmapNodeId;
  const prepared = await runtime.prepare({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-custom-practice",
    request: { feedbackMode: "atSessionEnd", requestedLength: 10, scope: { roadmapNodeId: topicId }, sessionId: "custom-practice-session" },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  assert.equal(prepared.session.modeId, "coding-interview-custom-practice");
  assert.equal(prepared.session.configurationSnapshot.feedbackMode, "atSessionEnd");
  assert.match(String(prepared.session.configurationSnapshot.blueprintId), /guided/);
});

test("production lifecycle starts Custom Practice from the pinned Guided blueprint", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const catalog = getCodingPackageTestCatalog();
  const topicId = catalog.getItems()[0]!.taxonomy.roadmapNodeId;

  const prepared = await startAlgorithmsSession({
    feedbackMode: "atSessionEnd",
    modeId: "coding-interview-custom-practice",
    requestedLength: 10,
    scope: { roadmapNodeId: topicId },
  });

  assert.equal(prepared.session.modeId, "coding-interview-custom-practice");
  assert.equal(prepared.session.configurationSnapshot.feedbackMode, "atSessionEnd");
  assert.equal(prepared.session.actualLength, 10);
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
});

test("Algorithms runtime rejects malformed review requests before selecting or persisting a session", async () => {
  await prepareBundledTestPackages();
  const catalog = getCodingPackageTestCatalog();
  const runtime = new CodingInterviewFamilyRuntime(catalog, undefined, "coding-interview-taxonomy-v2");
  const input = {
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-weak-area-review",
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
  await assert.rejects(
    runtime.prepare({ ...input, request: { sessionId: "null-ref", requestedLength: 10, reviewSource: "session_misses", reviewItemRefs: [null] } }),
    /review item refs must contain only Algorithms content item references/,
  );
  await assert.rejects(
    runtime.prepare({ ...input, request: { sessionId: "invalid-ref", requestedLength: 10, reviewSource: "session_misses", reviewItemRefs: [{ trackId: "coding-interview-dsa-problem-solving", itemId: "", contentVersion: "algorithms-core-0002" }] } }),
    /review item refs must contain only Algorithms content item references/,
  );
});
