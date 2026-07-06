import assert from "node:assert/strict";
import test from "node:test";

import type { CloudCertificationProgressViewModel } from "../src/tracks";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import type { AnalyticsData } from "../src/features/analytics/analyticsService";
import type { ReviewQueueItem, TrainingAttempt } from "../src/domain/training";
import { getAlgorithmTrainingItemsForRoadmapNode } from "../src/tracks/algorithms";

test("canonical Cloud progress maps to ProgressTab metrics", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      examAttemptCount: 2,
      practiceAttemptCount: 3,
      totalAttempts: 5,
    }),
    practiceHistory: [],
  });

  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Total attempts", 5],
      ["Practice answers", 3],
      ["Exam answers", 2],
    ],
  );
  assert.equal(model.hasData, true);
  assert.equal(model.performanceSectionTitle, "Performance by domain");
  assert.equal(model.reviewActionEnabled, false);
  assert.equal(model.reviewActionLabel, "Review from Progress is not available yet.");
  assert.deepEqual(model.activitySummary, {
    detail: "3 practice answers and 2 exam answers recorded.",
    label: "Local attempts",
    value: 5,
  });
});

test("canonical due review count comes from the Cloud progress view model", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics({
      totalPracticeQuestionsAnswered: 99,
    }),
    attempts: [],
    cloudProgress: makeCloudProgress({
      dueReviewCount: 4,
      highPriorityReviewCount: 2,
    }),
    practiceHistory: [],
  });

  assert.equal(model.reviewQueueCount, 4);
  assert.equal(model.reviewQueueCopy, "4 due items, 2 high priority.");
});

test("Cloud Progress distinguishes scheduled review from due review", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      dueReviewCount: 0,
      scheduledReviewCount: 8,
    }),
    practiceHistory: [],
  });

  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.reviewQueueCopy, "8 scheduled items are not due yet.");
  assert.equal(model.reviewActionEnabled, false);
});

test("Progress review action opens when review queue has due items", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      dueReviewCount: 2,
    }),
    practiceHistory: [],
  });

  assert.equal(model.reviewActionEnabled, true);
  assert.equal(model.reviewActionLabel, "Open review queue");
  assert.deepEqual(model.reviewAction, { kind: "legacyMistakesReview" });
});

test("Cloud Certification due review keeps the legacy review action", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      dueReviewCount: 1,
    }),
    practiceHistory: [],
  });

  assert.equal(model.reviewAction?.kind, "legacyMistakesReview");
});

test("canonical domain performance maps into ProgressTab scores", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      taxonomyPerformance: [
        {
          axisId: "cloud-domain",
          correctCount: 1,
          incorrectCount: 1,
          label: "operations",
          nodeId: "operations",
          partialCount: 0,
          percent: 50,
          taxonomyRef: {
            axisId: "cloud-domain",
            nodeId: "operations",
            role: "primary",
            trackId: "cloud-certification",
          },
          totalAttempts: 2,
        },
        {
          axisId: "cloud-topic",
          correctCount: 0,
          incorrectCount: 1,
          label: "logging",
          nodeId: "logging",
          partialCount: 0,
          percent: 0,
          taxonomyRef: {
            axisId: "cloud-topic",
            nodeId: "logging",
            role: "secondary",
            trackId: "cloud-certification",
          },
          totalAttempts: 1,
        },
      ],
    }),
    practiceHistory: [],
  });

  assert.deepEqual(model.performanceScores, [
      {
        correct: 1,
        id: "operations",
      label: "Ensuring successful operation of a cloud solution",
        percent: 50,
        total: 2,
      },
  ]);
});

test("degraded canonical Cloud progress exposes a non-blocking warning state", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      degraded: true,
      ok: false,
    }),
    practiceHistory: [],
  });

  assert.equal(model.warning, "Some local progress data may be incomplete.");
});

test("mapped ProgressTab data does not expose readiness or retention fields", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress(),
    practiceHistory: [],
  });

  assert.equal("readinessPercent" in model, false);
  assert.equal("retentionPercent" in model, false);
  assert.equal("examPassPrediction" in model, false);
  assert.equal("streak" in model, false);
  assert.equal("level" in model, false);
});

test("Algorithms progress shows empty local facts before attempts", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics({
      totalPracticeQuestionsAnswered: 7,
    }),
    attempts: [],
    cloudProgress: makeCloudProgress({
      totalAttempts: 5,
    }),
    practiceHistory: [],
  });

  assert.equal(model.hasData, false);
  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.reviewQueueCopy, "No Algorithms review items right now.");
  assert.equal(model.reviewActionLabel, "Review from Progress is not available yet.");
  assert.equal(model.performanceSectionTitle, "Roadmap nodes");
  assert.equal(
    model.performanceScores[0]?.detail,
    `0/${getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints").length} items completed. Limited evidence.`,
  );
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 0],
      ["Partial", 0],
      ["Incorrect", 0],
      ["Nodes started", 0],
      ["Nodes completed", 0],
    ],
  );
  assert.deepEqual(model.activitySummary, {
    detail: "Current roadmap node: Complexity and constraints.",
    label: "Items completed",
    value: 0,
  });
});

test("Algorithms progress uses only Algorithms training attempts", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics({
      totalPracticeQuestionsAnswered: 11,
    }),
    attempts: [],
    cloudProgress: makeCloudProgress({
      totalAttempts: 9,
    }),
    practiceHistory: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: true,
        kind: "correctness",
      }),
      {
        ...makeAlgorithmAttempt("alg-array-string-naming-001", {
          isCorrect: true,
          kind: "correctness",
        }),
        trackId: "cloud-certification",
      },
    ],
  });

  assert.equal(model.hasData, true);
  assert.deepEqual(model.activitySummary, {
    detail: "Current roadmap node: Complexity and constraints.",
    label: "Items completed",
    value: 1,
  });
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 1],
      ["Partial", 0],
      ["Incorrect", 0],
      ["Nodes started", 1],
      ["Nodes completed", 0],
    ],
  );
});

test("Algorithms node completion is based on active roadmap item attempts", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-algorithms-progress-001", "alg-hash-map-primer-001"),
    ],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: true,
        kind: "correctness",
      }),
      makeAlgorithmAttempt("alg-hash-map-primer-001", {
        isCorrect: false,
        kind: "correctness",
      }),
    ],
  });
  const complexityNode = model.performanceScores.find((score) => score.id === "complexity_and_constraints");
  const hashNode = model.performanceScores.find((score) => score.id === "hash_map_and_set");

  const complexityItemCount = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints").length;
  const hashItemCount = getAlgorithmTrainingItemsForRoadmapNode("hash_map_and_set").length;

  assert.equal(complexityNode?.detail, `1/${complexityItemCount} items completed. Strong recent signal.`);
  assert.equal(complexityNode?.percent, Math.round((1 / complexityItemCount) * 100));
  assert.equal(hashNode?.detail, `1/${hashItemCount} items completed. Needs review.`);
  assert.equal(hashNode?.percent, Math.round((1 / hashItemCount) * 100));
  assert.equal(model.reviewQueueCount, 1);
  assert.equal(model.reviewQueueCopy, "1 due Algorithms item needs review.");
  assert.equal(model.reviewActionEnabled, true);
  assert.equal(model.reviewActionLabel, "Open review queue");
  assert.deepEqual(model.reviewAction, {
    kind: "practiceSession",
    params: {
      feedbackMode: "afterEachAnswer",
      mode: "review",
      reviewBehaviorEnabled: false,
      reviewItemIds: undefined,
      reviewSource: "dueQueue",
      sessionLength: 20,
      source: "modeShortcut",
      topicId: "complexity_and_constraints",
      trackId: "algorithms",
    },
  });
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 1],
      ["Partial", 0],
      ["Incorrect", 1],
      ["Nodes started", 2],
      ["Nodes completed", 0],
    ],
  );
});

test("Algorithms due review action routes to an Algorithms review practice session", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-algorithms-action-001", "alg-hash-map-primer-001", {
        dueAt: "2026-07-03T09:00:00.000Z",
      }),
    ],
    trainingAttempts: [],
  });

  assert.equal(model.reviewAction?.kind, "practiceSession");
  assert.equal(model.reviewAction?.params.trackId, "algorithms");
  assert.equal(model.reviewAction?.params.mode, "review");
  assert.equal(model.reviewAction?.params.reviewSource, "dueQueue");
  assert.equal(model.reviewAction?.params.feedbackMode, "afterEachAnswer");
});

test("Algorithms progress selects the active roadmap node from completed prerequisites", () => {
  const completedComplexityAttempts = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints")
    .slice(0, 10)
    .map((item) => makeAlgorithmAttempt(item.id, {
      isCorrect: true,
      kind: "correctness",
    }));
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    trainingAttempts: completedComplexityAttempts,
  });

  assert.equal(model.algorithmsProgress?.currentRoadmapNode.id, "arrays_and_strings");
  assert.equal(model.algorithmsProgress?.currentRoadmapNode.label, "Arrays and strings");
});

test("Algorithms progress detects weak roadmap and repeated mistake signals", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-repeated-mistake-001", "alg-hash-map-primer-001", {
        reasons: ["incorrect_attempt", "repeated_mistake"],
      }),
    ],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-hash-map-primer-001", {
        isCorrect: false,
        kind: "correctness",
      }),
    ],
  });

  assert.ok(model.algorithmsProgress?.signals.some((signal) =>
    signal.label === "Repeated mistake" &&
    signal.detail.includes("repeated mistake"),
  ));
  assert.ok(model.algorithmsProgress?.signals.some((signal) =>
    signal.label === "Needs review" &&
    signal.detail.includes("Hash map and set"),
  ));
});

test("Algorithms progress counts due review items only", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-due-001", "alg-hash-map-primer-001", {
        dueAt: "2026-07-03T09:00:00.000Z",
      }),
      makeAlgorithmReviewQueueItem("review-future-001", "alg-array-string-naming-001", {
        dueAt: "2026-07-04T09:00:00.000Z",
      }),
    ],
  });

  assert.equal(model.algorithmsProgress?.dueReviewCount, 1);
  assert.equal(model.reviewQueueCount, 1);
  assert.equal(model.reviewQueueCopy, "1 due Algorithms item needs review.");
  assert.equal(model.reviewActionEnabled, true);
});

test("Algorithms progress recommends the next useful mode from evidence", () => {
  const dueModel = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-due-001", "alg-hash-map-primer-001"),
    ],
  });
  const weakModel = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-hash-map-primer-001", {
        isCorrect: false,
        kind: "correctness",
      }),
      makeAlgorithmAttempt("alg-array-string-naming-001", {
        earnedPoints: 1,
        isCorrect: false,
        kind: "partial_credit",
        maxPoints: 2,
      }),
    ],
  });
  const strongModel = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: true,
        kind: "correctness",
      }),
    ],
  });

  assert.equal(dueModel.algorithmsProgress?.recommendation.mode, "review");
  assert.equal(weakModel.algorithmsProgress?.recommendation.mode, "weakArea");
  assert.equal(weakModel.algorithmsProgress?.recommendation.label, "Practice weak area");
  assert.equal(strongModel.algorithmsProgress?.recommendation.mode, "practice");
});

test("Algorithms review count uses the canonical review queue, not inferred misses", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-hash-map-primer-001", {
        isCorrect: false,
        kind: "correctness",
      }),
    ],
  });

  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.reviewActionEnabled, false);
  assert.equal(model.reviewQueueCopy, "No Algorithms review items right now.");
});

function makeCloudProgress(
  overrides: Partial<CloudCertificationProgressViewModel> = {},
): CloudCertificationProgressViewModel {
  return {
    correctCount: 0,
    degraded: false,
    dueReviewCount: 0,
    examAttemptCount: 0,
    firstAttemptAccuracy: {
      correct: 0,
      percent: 0,
      total: 0,
    },
    highPriorityReviewCount: 0,
    incorrectCount: 0,
    issues: [],
    ok: true,
    partialCount: 0,
    practiceAttemptCount: 0,
    recentAccuracy: {
      correct: 0,
      percent: 0,
      total: 0,
      windowAttemptCount: 10,
    },
    repeatedMistakeTypes: [],
    scheduledReviewCount: 0,
    taxonomyPerformance: [],
    totalAttempts: 0,
    weakTaxonomyNodes: [],
    ...overrides,
  };
}

function makeAnalytics(
  overrides: Partial<AnalyticsData["summary"]> = {},
): AnalyticsData {
  return {
    confidenceAccuracy: [],
    domainPerformance: [],
    mistakeReasons: [],
    scoreTrend: [],
    summary: {
      averageExamScore: 0,
      bestExamScore: 0,
      totalCompletedExams: 0,
      totalPracticeQuestionsAnswered: 0,
      trainingPassRate: 0,
      ...overrides,
    },
    weakestTags: [],
    weaknessSummary: [],
  };
}

function makeAlgorithmAttempt(
  itemId: string,
  result: TrainingAttempt["result"],
): TrainingAttempt {
  return {
    answeredAt: `2026-06-29T12:00:00.000Z:${itemId}`,
    id: `attempt-${itemId}`,
    itemId,
    itemType: "approach_primer",
    modeId: "algorithms-roadmap-basics",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["fixture"],
    },
    result,
    trackId: "algorithms",
  };
}

function makeAlgorithmReviewQueueItem(
  id: string,
  itemId: string,
  overrides: Partial<ReviewQueueItem> = {},
): ReviewQueueItem {
  return {
    createdAt: "2026-01-01T10:00:00.000Z",
    dueAt: "2026-01-02T10:00:00.000Z",
    id,
    itemId,
    priority: "high",
    reasons: ["incorrect_attempt"],
    sourceAttemptId: `attempt:${id}`,
    trackId: "algorithms",
    ...overrides,
  };
}
