import assert from "node:assert/strict";
import test from "node:test";

import type { CloudCertificationProgressViewModel } from "../src/tracks";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import type { AnalyticsData } from "../src/features/analytics/analyticsService";
import type { TrainingAttempt } from "../src/domain/training";

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

test("Progress review action remains explicitly unavailable from Progress", () => {
  const model = buildProgressTabModel({
    activeTrackId: "cloud-certification",
    analytics: makeAnalytics(),
    attempts: [],
    cloudProgress: makeCloudProgress({
      dueReviewCount: 2,
    }),
    practiceHistory: [],
  });

  assert.equal(model.reviewActionEnabled, false);
  assert.equal(model.reviewActionLabel, "Review from Progress is not available yet.");
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
  assert.equal(model.reviewQueueCopy, "Algorithms review queue is not active for this MVP.");
  assert.equal(model.reviewActionLabel, "Algorithms review is not active for this MVP.");
  assert.equal(model.performanceSectionTitle, "Roadmap nodes");
  assert.equal(model.performanceScores[0]?.detail, "0/1 items completed");
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
    detail: "Active roadmap node: Complexity and constraints.",
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
    detail: "Active roadmap node: Arrays and strings.",
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
      ["Nodes completed", 1],
    ],
  );
});

test("Algorithms node completion is based on seeded item attempts", () => {
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
      makeAlgorithmAttempt("alg-hash-map-primer-001", {
        isCorrect: false,
        kind: "correctness",
      }),
    ],
  });
  const complexityNode = model.performanceScores.find((score) => score.id === "complexity_and_constraints");
  const hashNode = model.performanceScores.find((score) => score.id === "hash_map_and_set");

  assert.equal(complexityNode?.detail, "1/1 items completed");
  assert.equal(complexityNode?.percent, 100);
  assert.equal(hashNode?.detail, "1/3 items completed");
  assert.equal(hashNode?.percent, 33);
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Correct", 1],
      ["Partial", 0],
      ["Incorrect", 1],
      ["Nodes started", 2],
      ["Nodes completed", 1],
    ],
  );
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
