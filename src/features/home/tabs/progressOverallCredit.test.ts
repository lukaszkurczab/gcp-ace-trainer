import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import type { ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import { buildProgressTabModel } from "./progressTabModel";

function attempt(trackId: string, contentVersion: string, artifactSha256: string, questionId: string, index: number, kind: "correct" | "partial"): TrainingAttempt {
  const item = { trackId, contentVersion, artifactSha256, questionId };
  const score = { kind, earnedPoints: kind === "correct" ? 1 : 0.5, maxPoints: 1 } as const;
  const at = new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();
  return {
    id: `overall-credit:${trackId}:${index}`,
    sessionId: `overall-credit-session:${trackId}`,
    trackId: trackId as TrainingAttempt["trackId"],
    modeId: "practice",
    occurrenceId: `overall-credit-occurrence:${index}`,
    item,
    response: {},
    result: score,
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: at,
    committedAt: at,
  } as TrainingAttempt;
}

test("progress areas and Coding effectiveness exclude raw partial points from overall credit", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const design = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  const designQuestion = design.questions[0]!;
  const designAttempts = [
    attempt(design.trackId, design.contentVersion, design.artifactSha256, designQuestion.questionId, 1, "correct"),
    attempt(design.trackId, design.contentVersion, design.artifactSha256, designQuestion.questionId, 2, "partial"),
  ];
  const areaModel = buildProgressTabModel({
    activeTrackId: design.trackId,
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    trainingAttempts: designAttempts,
    now: "2026-01-01T01:00:00.000Z",
  });
  const area = areaModel.performanceScores[0];
  assert.ok(area);
  assert.equal(area.correct, 1);
  assert.equal(area.total, 2);
  assert.equal(area.detail, "1/2 points");
  assert.equal(area.percent, 50);

  const coding = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const codingQuestion = coding.questions[0]!;
  const codingAttempts = Array.from({ length: 20 }, (_, index) => attempt(
    coding.trackId,
    coding.contentVersion,
    coding.artifactSha256,
    codingQuestion.questionId,
    index,
    index < 10 ? "partial" : "correct",
  ));
  const codingModel = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    trainingAttempts: codingAttempts,
    now: "2026-01-01T01:00:00.000Z",
  });
  assert.equal(codingModel.algorithmsProgress?.evidenceSummary.currentFocus.percent, 50);
});

test("Progress uses the canonical copy for due reviews and future manual requests", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  const sourceItem = { trackId: track.trackId, questionId: track.questions[0]!.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  const review: ReviewQueueEntry = {
    id: "review:progress-manual-copy",
    trackId: track.trackId as ReviewQueueEntry["trackId"],
    sourceAttemptId: "attempt:progress-manual-copy",
    sourceSessionId: "session:progress-manual-copy",
    sourceItem,
    taxonomyOrSkillRefs: [],
    reasons: ["scheduled_retrieval", "manual_mark"],
    dueAt: "2026-01-08T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
    manualRequestId: `manual:${"a".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "retention7",
    status: "active",
  };
  const build = (entry: ReviewQueueEntry) => buildProgressTabModel({
    activeTrackId: "frontend-system-design-interview",
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    reviewQueueItems: [entry],
    trainingAttempts: [],
    now: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(build(review).reviewQueueCopy, "home.review.manualReady");
  assert.deepEqual(build(review).reviewQueueCopyParams, { count: 1 });
  assert.equal(build({ ...review, reasons: ["scheduled_retrieval"], manualRequestId: undefined, dueAt: "2025-12-31T00:00:00.000Z" }).reviewQueueCopy, "1 due review item.");
});

test("Progress counts a due item and a separate future manual request while preserving due-first action", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  const dueItem = track.questions[1]!;
  const due: ReviewQueueEntry = {
    id: "review:progress-mixed-due",
    trackId: track.trackId as ReviewQueueEntry["trackId"],
    sourceAttemptId: "attempt:progress-mixed-due",
    sourceSessionId: "session:progress-mixed-due",
    sourceItem: { trackId: track.trackId, questionId: dueItem.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [],
    reasons: ["scheduled_retrieval"],
    dueAt: "2025-12-31T00:00:00.000Z",
    createdAt: "2025-12-30T00:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
    policyVersion: "bizq04-v1",
    stage: "retention7",
    status: "active",
  };
  const manualItem = track.questions[0]!;
  const manual: ReviewQueueEntry = {
    id: "review:progress-mixed-manual",
    trackId: track.trackId as ReviewQueueEntry["trackId"],
    sourceAttemptId: "attempt:progress-mixed-manual",
    sourceSessionId: "session:progress-mixed-manual",
    sourceItem: { trackId: track.trackId, questionId: manualItem.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [],
    reasons: ["scheduled_retrieval", "manual_mark"],
    dueAt: "2026-01-08T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
    manualRequestId: `manual:${"b".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "retention7",
    status: "active",
  };
  const model = buildProgressTabModel({
    activeTrackId: track.trackId,
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    reviewQueueItems: [due, manual],
    trainingAttempts: [],
    now: "2026-01-01T00:00:00.000Z",
  });
  assert.deepEqual(model.metrics.filter(({ label }) => label === "Due review" || label === "Manual review ready").map(({ label, value }) => [label, value]), [
    ["Due review", 1],
    ["Manual review ready", 1],
  ]);
  assert.equal(model.reviewQueueCount, 2);
  assert.equal(model.reviewQueueCopy, "home.review.dueAndManual");
  assert.deepEqual(model.reviewQueueCopyParams, { dueCount: 1, manualCount: 1 });
});

test("Coding Progress copy includes manual requests alongside due work", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const dueQuestion = track.questions[1]!;
  const manualQuestion = track.questions[0]!;
  const entry = (id: string, questionId: string, dueAt: string, manual = false): ReviewQueueEntry => ({
    id: `review:${id}`,
    trackId: track.trackId as ReviewQueueEntry["trackId"],
    sourceAttemptId: `attempt:${id}`,
    sourceSessionId: `session:${id}`,
    sourceItem: { trackId: track.trackId, questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [],
    reasons: manual ? ["scheduled_retrieval", "manual_mark"] : ["scheduled_retrieval"],
    dueAt,
    createdAt: "2026-01-01T00:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
    ...(manual ? { manualRequestId: `manual:${"e".repeat(64)}` } : {}),
    policyVersion: "bizq04-v1",
    stage: "retention7",
    status: "active",
  } as ReviewQueueEntry);
  const model = buildProgressTabModel({
    activeTrackId: track.trackId,
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    reviewQueueItems: [
      entry("coding-mixed-due", dueQuestion.questionId, "2025-12-31T00:00:00.000Z"),
      entry("coding-mixed-manual", manualQuestion.questionId, "2026-01-08T00:00:00.000Z", true),
    ],
    trainingAttempts: [],
    now: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(model.reviewQueueCount, 2);
  assert.equal(model.reviewQueueCopy, "home.review.dueAndManual");
  assert.deepEqual(model.reviewQueueCopyParams, { dueCount: 1, manualCount: 1 });
  assert.equal(model.reviewAction?.kind, "practiceSession");
  if (model.reviewAction?.kind === "practiceSession") assert.equal(model.reviewAction.params.reviewSource, "due_queue");
});
