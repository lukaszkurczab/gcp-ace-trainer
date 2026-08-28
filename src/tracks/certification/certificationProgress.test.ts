import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt, type ReviewQueueEntry } from "../../domain";
import { buildCloudCertificationProgressViewModel } from "./";
import { makeQuestion } from "../../testing/fixtures";

const question = makeQuestion({ id: "fixture-certification-progress" });
const ref = { trackId: "google-cloud-associate-cloud-engineer" as const, itemId: question.id, contentVersion: "fixture" , packagePin: TEST_CONTENT_PACKAGE_PIN};
function attempt(kind: "correct" | "partial" | "incorrect", id: string, modeId = "certification-focus-practice") { return createTrainingAttempt({ occurrenceId: "occurrence-1", id, sessionId: id, trackId: "google-cloud-associate-cloud-engineer", modeId, item: ref, response: { kind: "option_selection", selectedOptionIds: [] }, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }, { axisId: "mistake_type", nodeId: "confused_services" }] }, answeredAt: `2026-01-0${id.length}T00:00:00.000Z`, committedAt: `2026-01-0${id.length}T00:00:00.000Z` }); }
function review(): ReviewQueueEntry { return { id: "review", trackId: "google-cloud-associate-cloud-engineer", sourceAttemptId: "bad", sourceSessionId: "bad", reasons: ["repeated_mistake"], dueAt: "2026-01-01T00:00:00.000Z", createdAt: "2025-12-31T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: ref, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }] }; }

test("Certification progress derives practice, exam, outcome, taxonomy, review, and repeated-mistake signals", () => {
  const progress = buildCloudCertificationProgressViewModel({ attempts: [attempt("correct", "one"), attempt("incorrect", "three", "certification-exam-simulation")], packagePin: TEST_CONTENT_PACKAGE_PIN, reviewQueueItems: [review()], now: "2026-01-02T00:00:00.000Z" });
  assert.equal(progress.totalAttempts, 2);
  assert.equal(progress.practiceAttemptCount, 1);
  assert.equal(progress.examAttemptCount, 1);
  assert.equal(progress.correctCount, 1);
  assert.equal(progress.incorrectCount, 1);
  assert.equal(progress.dueReviewCount, 1);
  assert.equal(progress.repeatedMistakeTypes[0]?.taxonomyRef.nodeId, "confused_services");
  assert.equal(progress.taxonomyPerformance.some((node) => node.nodeId === question.domain), true);
});

test("Certification progress has explicit empty state and no synthetic learning metrics", () => {
  const progress = buildCloudCertificationProgressViewModel({ attempts: [], packagePin: TEST_CONTENT_PACKAGE_PIN });
  assert.equal(progress.totalAttempts, 0);
  assert.equal(progress.firstAttemptAccuracy.percent, 0);
  for (const field of ["confidence", "readinessPercent", "retentionPercent", "masteryPercent", "examPassPrediction"]) assert.equal(field in progress, false);
});

test("Certification progress ignores same-version evidence from another exact content package", () => {
  const foreignPin = { ...TEST_CONTENT_PACKAGE_PIN, packageIdentity: "e".repeat(64) };
  const foreignAttempt = {
    ...attempt("incorrect", "foreign"),
    item: { ...ref, packagePin: foreignPin },
    reviewEvidence: { sourceItem: { ...ref, packagePin: foreignPin }, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }] },
  };
  const foreignReview = { ...review(), sourceItem: { ...ref, packagePin: foreignPin } };
  const progress = buildCloudCertificationProgressViewModel({ attempts: [foreignAttempt], packagePin: TEST_CONTENT_PACKAGE_PIN, reviewQueueItems: [foreignReview] });
  assert.equal(progress.totalAttempts, 0);
  assert.equal(progress.dueReviewCount, 0);
});
