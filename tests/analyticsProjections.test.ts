import assert from "node:assert/strict";
import test from "node:test";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildCertificationExamSummaries } from "../src/tracks/certification";
import { makeCompletedExamProjectionInputs, makeQuestion } from "./fixtures";

test("analytics derives exam trend, raw score summaries, domain performance, and weak tags", () => {
  const questions = [makeQuestion({ id: "one", domain: "operations", tags: ["logging"] }), makeQuestion({ id: "two", domain: "operations", tags: ["logging"] }), makeQuestion({ id: "three", domain: "operations", tags: ["logging"] })];
  const { session, attempts } = makeCompletedExamProjectionInputs(questions, { one: ["a"], two: ["b"], three: ["b"] });
  const summary = buildCertificationExamSummaries([session], attempts)[0]!;
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
