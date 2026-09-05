import assert from "node:assert/strict";
import test, { before } from "node:test";

import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import type { ReviewQueueEntry } from "../domain";
import { loadPracticeReadData, type PracticeReadPorts } from "./practiceReadModels";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;

before(async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
});

test("explicit practice routes skip the stored-track read and do not load reviews for roadmap/setup", async () => {
  let activeTrackReads = 0;
  let trainingAttemptReads = 0;
  let reviewReads = 0;
  const ports: PracticeReadPorts = {
    getActiveTrackId: async () => {
      activeTrackReads += 1;
      return "google-cloud-associate-cloud-engineer";
    },
    getReviewQueueItems: async () => {
      reviewReads += 1;
      return { ok: true, value: [] };
    },
    getTrainingAttempts: async () => {
      trainingAttemptReads += 1;
      return { ok: true, value: [] };
    },
  };

  const data = await loadPracticeReadData({ requestedTrackId: TRACK_ID }, ports);

  assert.equal(data.activeTrackId, TRACK_ID);
  assert.deepEqual(data.trainingAttempts, []);
  assert.equal(data.hasReviewEvidence, false);
  assert.equal(activeTrackReads, 0);
  assert.equal(trainingAttemptReads, 1);
  assert.equal(reviewReads, 0);
});

test("Hub review evidence is limited to due entries for the active track and exact package pin", async () => {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  const item = {
    contentVersion: resolution.package.contentVersion,
    itemId: "practice-item",
    packagePin: resolution.package.packagePin,
    trackId: TRACK_ID,
  } as const;
  const dueReview: ReviewQueueEntry = {
    consecutiveAfterDueSuccesses: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    dueAt: "2026-01-01T00:00:00.000Z",
    id: "review-due",
    persistent: true,
    reasons: ["incorrect"],
    sourceAttemptId: "attempt-1",
    sourceItem: item,
    sourceSessionId: "session-1",
    taxonomyOrSkillRefs: [],
    trackId: TRACK_ID,
  };
  const futureReview: ReviewQueueEntry = { ...dueReview, dueAt: "2099-01-01T00:00:00.000Z", id: "review-future" };
  const staleReview: ReviewQueueEntry = {
    ...dueReview,
    id: "review-stale",
    sourceItem: { ...item, packagePin: { ...item.packagePin, contentReleaseId: `${item.packagePin.contentReleaseId}-stale` } },
  };
  const wrongTrackReview: ReviewQueueEntry = {
    ...dueReview,
    id: "review-wrong-track",
    trackId: "google-cloud-associate-cloud-engineer",
  };
  const ports: PracticeReadPorts = {
    getActiveTrackId: async () => TRACK_ID,
    getReviewQueueItems: async () => ({ ok: true, value: [futureReview, staleReview, dueReview] }),
    getTrainingAttempts: async () => ({ ok: true, value: [] }),
  };

  const excludedData = await loadPracticeReadData({ includeReviews: true, now: Date.parse("2026-01-02T00:00:00.000Z") }, {
    ...ports,
    getReviewQueueItems: async () => ({ ok: true, value: [futureReview, staleReview, wrongTrackReview] }),
  });
  assert.equal(excludedData.hasReviewEvidence, false);

  const data = await loadPracticeReadData({ includeReviews: true, now: Date.parse("2026-01-02T00:00:00.000Z") }, ports);

  assert.equal(data.hasReviewEvidence, true);
});

test("a missing stored track stays an explicit empty selection", async () => {
  const data = await loadPracticeReadData({}, {
    getActiveTrackId: async () => null,
    getReviewQueueItems: async () => ({ ok: true, value: [] }),
    getTrainingAttempts: async () => ({ ok: true, value: [] }),
  });

  assert.equal(data.activeTrackId, null);
  assert.equal(data.hasReviewEvidence, false);
  assert.deepEqual(data.trainingAttempts, []);
});

test("practice read surfaces storage issues instead of treating a partial read as empty", async () => {
  const ports: PracticeReadPorts = {
    getActiveTrackId: async () => TRACK_ID,
    getReviewQueueItems: async () => ({ ok: true, value: [] }),
    getTrainingAttempts: async () => ({
      ok: true,
      value: [],
      issues: [{ key: "training-attempts", message: "attempt index was incomplete", operation: "read" }],
    }),
  };

  await assert.rejects(
    loadPracticeReadData({ requestedTrackId: TRACK_ID }, ports),
    { name: "StorageReadError", message: "Unable to read training attempts." },
  );
});
