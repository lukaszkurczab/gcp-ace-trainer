import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  answerTrainingItem,
  completeTrainingSession,
  createReviewQueueItemsForAttempts,
  createTrainingSession,
  moveToNextSessionItem,
  moveToPreviousSessionItem,
  moveToSessionItem,
  scoreTrainingAttempt,
} from "../src/domain";
import type { TrainingAttempt, TrainingItem, TrainingSession } from "../src/domain/training";
import {
  ALGORITHM_TRAINING_ITEMS,
  createAlgorithmsScoringAdapter,
  createCloudCertificationContentAdapter,
  createCloudCertificationScoringAdapter,
  cloudCertificationReviewAdapter,
} from "../src/tracks";
import { makeQuestion } from "./fixtures";

test("creates a Cloud Certification session from mapped Cloud training items", () => {
  const questions = [
    makeQuestion({ id: "cloud-session-001", type: "single" }),
    makeQuestion({ id: "cloud-session-002", type: "multiple" }),
  ];
  const items = createCloudCertificationContentAdapter(questions).getItems();

  const session = createTrainingSession({
    id: "session-cloud-001",
    items,
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  });

  assert.equal(session.status, "active");
  assert.equal(session.currentItemIndex, 0);
  assert.deepEqual(session.itemRefs.map((itemRef) => itemRef.itemId), ["cloud-session-001", "cloud-session-002"]);
  assert.equal(session.modeId, "cloud-practice");
});

test("creates an Algorithms fixture session from fixture training items", () => {
  const item = makeAlgorithmsStrategyItem();

  const session = createTrainingSession({
    id: "session-algorithms-001",
    items: [item],
    modeId: "algorithms-pattern-drill",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: ALGORITHMS_TRACK_ID,
  });

  assert.equal(session.trackId, ALGORITHMS_TRACK_ID);
  assert.equal(session.itemRefs[0]?.itemType, "strategy_choice");
});

test("rejects empty sessions", () => {
  assert.throws(
    () =>
      createTrainingSession({
        items: [],
        modeId: "cloud-practice",
        startedAt: "2026-06-29T10:00:00.000Z",
        trackId: CLOUD_CERTIFICATION_TRACK_ID,
      }),
    /without items/,
  );
});

test("rejects item and session track mismatch", () => {
  assert.throws(
    () =>
      createTrainingSession({
        items: [makeAlgorithmsStrategyItem()],
        modeId: "cloud-practice",
        startedAt: "2026-06-29T10:00:00.000Z",
        trackId: CLOUD_CERTIFICATION_TRACK_ID,
      }),
    /does not belong to track cloud-certification/,
  );
});

test("navigates next and previous without mutating the original session", () => {
  const session = makeThreeItemSession();

  const next = moveToNextSessionItem(session);
  const previous = moveToPreviousSessionItem(next);

  assert.equal(session.currentItemIndex, 0);
  assert.equal(next.currentItemIndex, 1);
  assert.equal(previous.currentItemIndex, 0);
  assert.equal(next.trackId, session.trackId);
  assert.equal(next.modeId, session.modeId);
});

test("rejects out-of-bounds and inactive navigation", () => {
  const session = makeThreeItemSession();
  const completed: TrainingSession = {
    ...session,
    completedAt: "2026-06-29T11:00:00.000Z",
    status: "completed",
  };

  assert.throws(() => moveToSessionItem(session, 3), /out of bounds/);
  assert.throws(() => moveToSessionItem(completed, 1), /Cannot navigate a completed training session/);
});

test("creates an attempt for a Cloud item with modeId, sessionId, answeredAt, and option-selection response", () => {
  const question = makeQuestion({ correctOptionIds: ["a"], id: "cloud-answer-001", type: "single" });
  const item = getRequiredItem(createCloudCertificationContentAdapter([question]).getItems(), question.id);
  const session = createTrainingSession({
    id: "session-cloud-answer-001",
    items: [item],
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  });

  const attempt = answerTrainingItem({
    answeredAt: "2026-06-29T10:05:00.000Z",
    confidence: "high",
    id: "attempt-cloud-answer-001",
    item,
    response: {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    },
    session,
  });

  assert.equal(attempt.modeId, "cloud-practice");
  assert.equal(attempt.sessionId, "session-cloud-answer-001");
  assert.equal(attempt.answeredAt, "2026-06-29T10:05:00.000Z");
  assert.equal(attempt.response.kind, "option_selection");
});

test("creates an attempt for an Algorithms item without selected option ids", () => {
  const item = makeAlgorithmsStrategyItem();
  const session = createTrainingSession({
    id: "session-algorithms-answer-001",
    items: [item],
    modeId: "algorithms-pattern-drill",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: ALGORITHMS_TRACK_ID,
  });

  const attempt = answerTrainingItem({
    answeredAt: "2026-06-29T10:05:00.000Z",
    id: "attempt-algorithms-answer-001",
    item,
    response: {
      kind: "strategy_selection",
      selectedStrategyId: "two-pointers",
    },
    session,
  });

  assert.equal(attempt.response.kind, "strategy_selection");
  assert.equal("selectedOptionIds" in attempt.response, false);
});

test("scores a Cloud attempt through the Cloud adapter", () => {
  const question = makeQuestion({ correctOptionIds: ["a"], id: "cloud-score-engine-001", type: "single" });
  const item = getRequiredItem(createCloudCertificationContentAdapter([question]).getItems(), question.id);
  const session = createTrainingSession({
    id: "session-cloud-score-001",
    items: [item],
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  });
  const attempt = answerTrainingItem({
    answeredAt: "2026-06-29T10:05:00.000Z",
    id: "attempt-cloud-score-001",
    item,
    response: {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    },
    session,
  });

  const scored = scoreTrainingAttempt({
    adapter: {
      content: createCloudCertificationContentAdapter([question]),
      review: cloudCertificationReviewAdapter,
      scoring: createCloudCertificationScoringAdapter([question]),
      trackId: CLOUD_CERTIFICATION_TRACK_ID,
    },
    attempt,
    item,
    session,
  });

  assert.deepEqual(scored.result, {
    isCorrect: true,
    kind: "correctness",
  });
});

test("scores an Algorithms fixture attempt through the Algorithms adapter", () => {
  const item = getRequiredItem(ALGORITHM_TRAINING_ITEMS, "alg-hash-map-primer-001");
  const session = createTrainingSession({
    id: "session-algorithms-score-001",
    items: [item],
    modeId: "algorithms-roadmap-basics",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: ALGORITHMS_TRACK_ID,
  });
  const attempt = answerTrainingItem({
    answeredAt: "2026-06-29T10:05:00.000Z",
    id: "attempt-algorithms-score-001",
    item,
    response: {
      kind: "option_selection",
      selectedOptionIds: ["check_complement_first"],
    },
    session,
  });

  const scored = scoreTrainingAttempt({
    adapter: {
      content: {
        getContentVersion: () => "algorithms-core-draft",
        getItemById: (itemId) => (itemId === item.id ? item : undefined),
        getItems: () => [item],
        getItemsForMode: () => [item],
        trackId: ALGORITHMS_TRACK_ID,
      },
      review: {
        createReviewQueueItems: () => [],
        trackId: ALGORITHMS_TRACK_ID,
      },
      scoring: createAlgorithmsScoringAdapter(),
      trackId: ALGORITHMS_TRACK_ID,
    },
    attempt,
    item,
    session,
  });

  assert.deepEqual(scored.result, {
    isCorrect: true,
    kind: "correctness",
  });
});

test("completes a session with concrete summary metrics only", () => {
  const session = createTrainingSession({
    id: "session-summary-001",
    itemRefs: [
      { itemId: "summary-001", itemType: "single_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
      { itemId: "summary-002", itemType: "single_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
      { itemId: "summary-003", itemType: "multiple_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
    ],
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  });
  const attempts: TrainingAttempt[] = [
    makeAttemptResult(session, "summary-001", { isCorrect: true, kind: "correctness" }),
    makeAttemptResult(session, "summary-002", { isCorrect: false, kind: "correctness" }),
    makeAttemptResult(session, "summary-003", {
      earnedPoints: 1,
      isCorrect: false,
      kind: "partial_credit",
      maxPoints: 2,
    }),
  ];

  const result = completeTrainingSession({
    attempts,
    completedAt: "2026-06-29T11:00:00.000Z",
    session,
  });

  assert.equal(result.session.status, "completed");
  assert.deepEqual(result.summary, {
    answeredCount: 3,
    correctCount: 1,
    partialCount: 1,
    reviewCandidateCount: 2,
    totalItemCount: 3,
  });
  assert.equal("readinessPercent" in result.summary, false);
  assert.equal("retentionPercent" in result.summary, false);
});

test("creates review queue candidates through adapter review hooks", () => {
  const attempt: TrainingAttempt = {
    answeredAt: "2026-06-29T10:05:00.000Z",
    id: "attempt-review-hook-001",
    itemId: "cloud-review-hook-001",
    itemType: "single_choice_question",
    modeId: "cloud-practice",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["b"],
    },
    result: {
      isCorrect: false,
      kind: "correctness",
    },
    sessionId: "session-review-hook-001",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  const reviewItems = createReviewQueueItemsForAttempts({
    adapter: {
      content: createCloudCertificationContentAdapter([]),
      review: cloudCertificationReviewAdapter,
      scoring: createCloudCertificationScoringAdapter([]),
      trackId: CLOUD_CERTIFICATION_TRACK_ID,
    },
    attempts: [attempt],
    context: {
      dueAt: "2026-06-30T10:05:00.000Z",
      now: "2026-06-29T10:05:00.000Z",
    },
  });

  assert.equal(reviewItems.length, 1);
  assert.equal(reviewItems[0]?.sourceAttemptId, attempt.id);
  assert.equal(reviewItems[0]?.dueAt, "2026-06-30T10:05:00.000Z");
});

function makeThreeItemSession(): TrainingSession {
  return createTrainingSession({
    id: "session-navigation-001",
    itemRefs: [
      { itemId: "navigation-001", itemType: "single_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
      { itemId: "navigation-002", itemType: "single_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
      { itemId: "navigation-003", itemType: "single_choice_question", trackId: CLOUD_CERTIFICATION_TRACK_ID },
    ],
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  });
}

function makeAlgorithmsStrategyItem(): TrainingItem {
  return {
    contentVersion: "algorithms-core-draft",
    id: "algo-session-strategy-001",
    prompt: "Choose the best strategy for finding a pair sum in a sorted array.",
    responseSpec: {
      kind: "strategy_selection",
      strategies: [
        { id: "two-pointers", text: "Scan inward with two pointers." },
        { id: "nested-loop", text: "Check every pair." },
      ],
    },
    taxonomyRefs: [
      {
        axisId: "algorithm-pattern",
        nodeId: "two_pointers",
        role: "primary",
      },
    ],
    trackId: ALGORITHMS_TRACK_ID,
    type: "strategy_choice",
  };
}

function getRequiredItem(items: readonly TrainingItem[], itemId: string): TrainingItem {
  const item = items.find((candidate) => candidate.id === itemId);

  if (!item) {
    throw new Error(`Missing test item: ${itemId}`);
  }

  return item;
}

function makeAttemptResult(
  session: TrainingSession,
  itemId: string,
  result: TrainingAttempt["result"],
): TrainingAttempt {
  return {
    answeredAt: "2026-06-29T10:05:00.000Z",
    id: `attempt-${itemId}`,
    itemId,
    itemType: "single_choice_question",
    modeId: session.modeId,
    response: {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    },
    result,
    sessionId: session.id,
    trackId: session.trackId,
  };
}
