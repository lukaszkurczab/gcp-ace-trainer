import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
} from "../src/domain";
import {
  buildHomeTabModel,
  isCloudHomePracticeAction,
} from "../src/features/home/tabs/homeTabModel";
import type { AnalyticsData } from "../src/features/analytics/analyticsService";

test("Cloud Home model keeps the Cloud practice setup CTA and copy", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID),
    analytics: makeAnalytics(),
  });

  assert.equal(model.focusTitle, "Cloud Certification");
  assert.equal(model.heroTitle, "IAM policies");
  assert.equal(model.primaryLabel, "Start learning");
  assert.equal(isCloudHomePracticeAction(model), true);
  assert.ok(model.heroSubtitle.includes("Cloud Certification"));
});

test("Algorithms Home model does not expose Cloud-specific copy or Cloud practice action", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(ALGORITHMS_TRACK_ID),
    analytics: makeAnalytics({
      totalPracticeQuestionsAnswered: 12,
    }),
  });

  assert.equal(model.focusTitle, "Algorithms");
  assert.equal(model.heroTitle, "Algorithms track");
  assert.equal(model.primaryLabel, "View draft modes");
  assert.equal(isCloudHomePracticeAction(model), false);
  assert.equal(model.heroSubtitle.includes("Cloud Certification"), false);
  assert.equal(model.heroSubtitle.includes("IAM"), false);
  assert.deepEqual(
    model.recommendations.map((item) => item.title),
    ["Pattern fundamentals", "Strategy recognition", "Complexity reasoning"],
  );
});

test("Algorithms Home model exposes no gamified progress fields", () => {
  const model = buildHomeTabModel({
    activeTrack: getTrackDefinition(ALGORITHMS_TRACK_ID),
    analytics: makeAnalytics(),
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
