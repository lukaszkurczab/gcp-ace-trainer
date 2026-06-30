import assert from "node:assert/strict";
import test from "node:test";

import type { CloudCertificationProgressViewModel } from "../src/tracks";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import type { AnalyticsData } from "../src/features/analytics/analyticsService";

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
  assert.equal(model.reviewActionLabel, "Review unavailable until queue is verified");
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

test("Algorithms progress keeps the existing draft empty behavior", () => {
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
  assert.deepEqual(model.performanceScores, []);
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Completed exams", 0],
      ["Practice answers", 7],
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
