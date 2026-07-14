import assert from "node:assert/strict";
import test from "node:test";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildExamSummaryViewModel, scoreExamSession } from "../src/features/exam/scoringService";
import { makeQuestion, makeSession } from "./fixtures";

test("analytics derives exam trend, raw score summaries, domain performance, and weak tags", () => {
  const questions = [makeQuestion({ id: "one", domain: "operations", tags: ["logging"] }), makeQuestion({ id: "two", domain: "operations", tags: ["logging"] }), makeQuestion({ id: "three", domain: "operations", tags: ["logging"] })];
  const runtime = makeSession(questions, { one: ["a"], two: ["b"], three: ["b"] });
  const score = scoreExamSession(runtime, questions, "2026-01-01T01:00:00.000Z");
  const summary = buildExamSummaryViewModel({ id: "exam", runtime, completedAt: "2026-01-01T01:00:00.000Z", durationSeconds: 60, score });
  const analytics = buildAnalyticsData([summary], []);
  assert.equal(analytics.summary.totalCompletedExams, 1);
  assert.equal(analytics.summary.averageExamScore, 33);
  assert.equal(analytics.domainPerformance.find((item) => item.id === "operations")?.percent, 33);
  assert.equal(analytics.weakestTags[0]?.id, "logging");
});

test("analytics empty state is explicit and exposes no confidence, readiness, retention, mastery, or pass-rate signal", () => {
  const analytics = buildAnalyticsData([], []);
  assert.equal(analytics.summary.totalCompletedExams, 0);
  assert.deepEqual(analytics.weaknessSummary, ["Complete exams and practice questions to build a weakness summary."]);
  const serialized = JSON.stringify(analytics);
  for (const term of ["confidence", "readiness", "retention", "mastery", "trainingPassRate"]) assert.equal(serialized.includes(term), false);
});
