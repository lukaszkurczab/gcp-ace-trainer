import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { makeAttempt, makePracticeRecord, makeQuestion } from "./fixtures";

test("builds empty analytics safely", () => {
  const analytics = buildAnalyticsData([], []);

  assert.equal(analytics.summary.totalCompletedExams, 0);
  assert.equal(analytics.summary.averageExamScore, 0);
  assert.equal(analytics.scoreTrend.length, 0);
  assert.ok(analytics.weaknessSummary[0]?.includes("Complete exams"));
});

test("builds score trend, domain performance, tag minimum sample, confidence, and mistake reasons", () => {
  const q1 = makeQuestion({ id: "q1", domain: "operations", tags: ["ops", "logging"] });
  const q2 = makeQuestion({ id: "q2", domain: "operations", tags: ["ops"] });
  const q3 = makeQuestion({ id: "q3", domain: "access_security", tags: ["iam"] });
  const attempts = [
    makeAttempt({ id: "a1", scorePercent: 50, completedAt: "2026-01-01T10:00:00.000Z" }),
    makeAttempt({ id: "a2", scorePercent: 80, completedAt: "2026-01-02T10:00:00.000Z" })
  ];
  const practice = [
    makePracticeRecord({ id: "p1", questionSnapshot: q1, domain: q1.domain, tags: q1.tags, isCorrect: false, confidence: "sure", mistakeReason: "misread_question" }),
    makePracticeRecord({ id: "p2", questionSnapshot: q2, domain: q2.domain, tags: q2.tags, isCorrect: true, confidence: "sure" }),
    makePracticeRecord({ id: "p3", questionSnapshot: q1, domain: q1.domain, tags: q1.tags, isCorrect: false, confidence: "sure", mistakeReason: "misread_question" }),
    makePracticeRecord({ id: "p4", questionSnapshot: q3, domain: q3.domain, tags: q3.tags, isCorrect: true, confidence: "guess" })
  ];
  const analytics = buildAnalyticsData(attempts, practice);

  assert.deepEqual(analytics.scoreTrend.map((point) => point.scorePercent), [50, 80]);
  assert.equal(analytics.summary.totalCompletedExams, 2);
  assert.equal(analytics.summary.bestExamScore, 80);
  assert.equal(analytics.domainPerformance.find((item) => item.id === "operations")?.total, 5);
  assert.equal(analytics.weakestTags.find((item) => item.id === "ops")?.total, 3);
  assert.equal(analytics.confidenceAccuracy.find((item) => item.confidence === "sure")?.percent, 33);
  assert.equal(analytics.mostCommonMistakeReason, "misread_question");
});
