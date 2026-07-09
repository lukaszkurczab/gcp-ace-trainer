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
  assert.deepEqual(model.performanceScores, []);
  assert.deepEqual(model.metrics, []);
  assert.deepEqual(model.activitySummary, {
    detail: "Current roadmap node: Complexity and constraints.",
    label: "Items practiced",
    value: 0,
  });
  assert.equal(model.algorithmsProgress?.priority.title, "Start your first Algorithms session");
  assert.deepEqual(
    model.algorithmsProgress?.diagnostics.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 0],
      ["Partial", 0],
      ["Incorrect", 0],
      ["Nodes started", 0],
      ["Nodes mastered", 0],
    ],
  );
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
    label: "Items practiced",
    value: 1,
  });
  assert.deepEqual(
    model.algorithmsProgress?.diagnostics.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 1],
      ["Partial", 0],
      ["Incorrect", 0],
      ["Nodes started", 1],
      ["Nodes mastered", 0],
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
  const complexityNode = model.algorithmsProgress?.roadmapSummary.allNodes.find(
    (node) => node.id === "complexity_and_constraints",
  );
  const hashNode = model.algorithmsProgress?.roadmapSummary.allNodes.find(
    (node) => node.id === "hash_map_and_set",
  );

  assert.ok((complexityNode?.progressPercent ?? 0) > 0);
  assert.ok((hashNode?.progressPercent ?? 0) > 0);
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
    model.algorithmsProgress?.diagnostics.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 1],
      ["Partial", 0],
      ["Incorrect", 1],
      ["Nodes started", 2],
      ["Nodes mastered", 0],
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

test("Algorithms progress does not advance from ten correct prerequisite attempts", () => {
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

  assert.equal(model.algorithmsProgress?.currentFocus.nodeId, "complexity_and_constraints");
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "First pass");
});

test("Algorithms progress promotes repeated mistakes into the learning priority", () => {
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

  assert.equal(model.algorithmsProgress?.priority.label, "Critical remediation");
  assert.match(model.algorithmsProgress?.priority.detail ?? "", /Hash map and set/);
  assert.match(model.algorithmsProgress?.priority.title ?? "", /Review 1 remediation item/);
  const criticalRequirement = model.algorithmsProgress?.nextTopic?.requirements.find(
    (requirement) => requirement.label === "Clear critical remediation",
  );
  assert.equal(criticalRequirement?.met, false);
  assert.equal(model.algorithmsProgress?.nextTopic?.state, "locked");
  assert.equal(
    model.algorithmsProgress?.roadmapSummary.nodes.find(
      (node) => node.id === model.algorithmsProgress?.nextTopic?.nodeId,
    )?.label,
    "Next · Locked",
  );
  assert.equal(
    model.algorithmsProgress?.nextTopic?.requirements
      .filter((requirement) => /remediation/i.test(requirement.label))
      .some((requirement) => requirement.met),
    false,
  );
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
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: false,
        kind: "correctness",
      }),
      makeAlgorithmAttempt(getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints")[1]!.id, {
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

  assert.equal(dueModel.algorithmsProgress?.priority.primaryActionMode, "review");
  assert.equal(weakModel.algorithmsProgress?.priority.primaryActionMode, "drill");
  assert.equal(weakModel.algorithmsProgress?.priority.title, "Build core-skill breadth");
  assert.equal(strongModel.algorithmsProgress?.priority.primaryActionMode, "drill");
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

test("Algorithms remediation is the top-level learning priority", () => {
  const attempts = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints")
    .slice(0, 10)
    .map((item) => makeAlgorithmAttempt(item.id, { isCorrect: true, kind: "correctness" }));
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-remediation-priority", attempts[0]!.itemId, {
        dueAt: "2026-07-03T09:00:00.000Z",
        kind: "remediation",
        priority: "normal",
      }),
    ],
    trainingAttempts: attempts,
  });

  assert.match(model.algorithmsProgress?.priority.title ?? "", /Review 1 remediation item/);
  assert.equal(model.algorithmsProgress?.priority.primaryActionLabel, "Review remediation");
  assert.equal(model.algorithmsProgress?.priority.tone, "warning");
  assert.match(
    model.algorithmsProgress?.priority.detail ?? "",
    /a mistake pattern that needs repair/,
  );
  assert.doesNotMatch(
    model.algorithmsProgress?.priority.detail ?? "",
    /a mistake that need repair/,
  );
  assert.equal(model.algorithmsProgress?.currentFocus.title, "Complexity and constraints");
  assert.deepEqual(
    model.algorithmsProgress?.diagnostics.metrics.slice(0, 3).map((metric) => metric.label),
    ["Correct", "Partial", "Incorrect"],
  );
});

test("Algorithms priority uses grammatical copy for multiple remediation items", () => {
  const items = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints");
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-remediation-copy-1", items[0]!.id, {
        dueAt: "2026-07-03T09:00:00.000Z",
        kind: "remediation",
        priority: "normal",
      }),
      makeAlgorithmReviewQueueItem("review-remediation-copy-2", items[1]!.id, {
        dueAt: "2026-07-03T09:00:00.000Z",
        kind: "remediation",
        priority: "normal",
      }),
    ],
    trainingAttempts: items.slice(0, 10).map((item) =>
      makeAlgorithmAttempt(item.id, { isCorrect: true, kind: "correctness" })),
  });

  assert.match(model.algorithmsProgress?.priority.title ?? "", /Review 2 remediation items/);
  assert.match(
    model.algorithmsProgress?.priority.detail ?? "",
    /mistake patterns that need repair/,
  );
});

test("Algorithms retention priority is scheduled work, not missed work", () => {
  const items = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints");
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-retention-priority", items[0]!.id, {
        dueAt: "2026-07-03T09:00:00.000Z",
        kind: "retention",
        priority: "low",
        reasons: ["due_spacing"],
      }),
    ],
    trainingAttempts: items.map((item) =>
      makeAlgorithmAttempt(item.id, { isCorrect: true, kind: "correctness" })),
  });

  assert.equal(model.algorithmsProgress?.priority.title, "Retention check pending");
  assert.match(model.algorithmsProgress?.priority.detail ?? "", /does not block/);
  assert.equal(model.algorithmsProgress?.priority.primaryActionLabel, "Run retention check");
  assert.doesNotMatch(JSON.stringify(model.algorithmsProgress), /missed/i);
});

test("Algorithms progress uses practiced language and three current-focus metrics", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    practiceHistory: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: true,
        kind: "correctness",
      }),
    ],
  });
  const copy = JSON.stringify(model.algorithmsProgress);

  assert.doesNotMatch(copy, /Items completed|completed items/i);
  assert.equal(model.activitySummary.label, "Items practiced");
  assert.deepEqual(
    [
      ["Practiced", model.algorithmsProgress?.currentFocus.practicedLabel],
      ["Core skills", model.algorithmsProgress?.currentFocus.coreSkillsLabel],
      ["Score", model.algorithmsProgress?.currentFocus.scoreLabel],
    ].map(([label]) => label),
    ["Practiced", "Core skills", "Score"],
  );
  assert.equal("resultCounts" in (model.algorithmsProgress ?? {}), false);
});

test("Algorithms roadmap summary keeps inactive nodes compact", () => {
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    practiceHistory: [],
    trainingAttempts: [
      makeAlgorithmAttempt("alg-complexity-constraint-pair-001", {
        isCorrect: true,
        kind: "correctness",
      }),
    ],
  });
  const summary = model.algorithmsProgress?.roadmapSummary.nodes ?? [];
  const copy = JSON.stringify(summary);
  const currentNode = summary.find((node) => node.id === "complexity_and_constraints");
  const nextNode = summary.find((node) => node.label.includes("Next"));
  const laterNode = summary.find((node) => node.label === "Later");

  assert.ok(summary.length <= 4);
  assert.doesNotMatch(copy, /0\/\d+ practiced|Core skills:|Score:/);
  assert.equal(currentNode?.showProgress, true);
  assert.equal(nextNode?.progressPercent, 0);
  assert.equal(nextNode?.showProgress, false);
  assert.equal(laterNode?.progressPercent, 0);
  assert.equal(laterNode?.showProgress, false);
});

test("Algorithms next-topic readiness remains distinct from mastery", () => {
  const items = getAlgorithmTrainingItemsForRoadmapNode("complexity_and_constraints");
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: makeAnalytics(),
    attempts: [],
    now: "2026-07-03T10:00:00.000Z",
    practiceHistory: [],
    reviewQueueItems: [
      makeAlgorithmReviewQueueItem("review-retention-ready", items[0]!.id, {
        dueAt: "2026-07-03T09:00:00.000Z",
        kind: "retention",
        priority: "low",
        reasons: ["due_spacing"],
      }),
    ],
    trainingAttempts: items.map((item) =>
      makeAlgorithmAttempt(item.id, { isCorrect: true, kind: "correctness" })),
  });

  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Ready for next");
  assert.equal(model.algorithmsProgress?.nextTopic?.state, "available");
  assert.match(model.algorithmsProgress?.nextTopic?.detail ?? "", /can start this topic/i);
  assert.match(model.algorithmsProgress?.nextTopic?.detail ?? "", /mastery.*retention/i);
  assert.notEqual(model.algorithmsProgress?.currentFocus.statusLabel, "Mastered");
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
