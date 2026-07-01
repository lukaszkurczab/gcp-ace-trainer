import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
} from "../src/domain";
import type { TrainingAttempt } from "../src/domain/training";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import type { AnalyticsData } from "../src/features/analytics/analyticsService";

test("Cloud Home model opens learning through the current topic", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID),
    analytics: makeAnalytics(),
    trainingAttempts: [],
  });

  assert.equal(model.focusTitle, "Cloud Certification");
  assert.equal(model.heroTitle, "IAM policies");
  assert.equal(model.primaryLabel, "Start learning");
  assert.equal(model.topicId, "access_security");
  assert.deepEqual(model.recommendations, []);
});

test("Cloud Home recommendations appear only after track progress", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID),
    analytics: makeAnalytics({
      totalPracticeQuestionsAnswered: 12,
    }),
    trainingAttempts: [],
  });

  assert.equal(model.primaryLabel, "Continue learning");
  assert.deepEqual(
    model.recommendations.map((item) => [item.title, item.mode, item.enabled]),
    [
      ["Review", "review", true],
      ["Weak area", "weakArea", true],
      ["Practice", "practice", true],
    ],
  );
});

test("Algorithms Home model does not expose Cloud-specific or development copy", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(ALGORITHMS_TRACK_ID),
    analytics: makeAnalytics(),
    trainingAttempts: [makeAlgorithmAttempt()],
  });

  assert.equal(model.focusTitle, "Algorithms");
  assert.equal(model.heroTitle, "Arrays and strings");
  assert.equal(model.primaryLabel, "Continue learning");
  assert.equal(model.heroSubtitle.includes("Cloud Certification"), false);
  assert.equal(model.heroSubtitle.includes("IAM"), false);
  assert.equal(JSON.stringify(model).includes("draft"), false);
  assert.deepEqual(
    model.recommendations.map((item) => [item.title, item.mode, item.enabled]),
    [
      ["Review", "review", true],
      ["Weak area", "weakArea", true],
      ["Practice", "practice", false],
    ],
  );
});

test("Algorithms Home model exposes no gamified progress fields", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(ALGORITHMS_TRACK_ID),
    analytics: makeAnalytics(),
    trainingAttempts: [],
  });

  assert.equal("readinessPercent" in model, false);
  assert.equal("retentionPercent" in model, false);
  assert.equal("examPassPrediction" in model, false);
  assert.equal("streak" in model, false);
  assert.equal("level" in model, false);
});

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

function makeAlgorithmAttempt(): TrainingAttempt {
  return {
    answeredAt: "2026-01-01T10:00:00.000Z",
    id: "attempt-1",
    itemId: "alg-complexity-constraint-pair-001",
    itemType: "complexity_check",
    modeId: "algorithms-roadmap-basics",
    response: {
      kind: "complexity_check",
      selectedComplexityAnswer: {
        space: "O(n)",
        time: "O(n)",
      },
    },
    result: {
      earnedPoints: 1,
      kind: "partial_credit",
      maxPoints: 1,
    },
    trackId: ALGORITHMS_TRACK_ID,
  };
}
