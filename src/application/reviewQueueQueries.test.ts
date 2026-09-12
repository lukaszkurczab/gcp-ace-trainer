import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  buildTrackReviewQueueViewModel,
  loadTrackReviewQueueViewModel,
} from "./reviewQueueQueries";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import {
  createContentIdentityUnavailableReviewRecord,
  saveUnavailableReviewRecord,
} from "../storage/repositories/contentIdentityUnavailableRepository";
import type { ContentIdentityUnavailableReviewRecord } from "../storage/repositories/contentIdentityUnavailableRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("review view keeps unavailable entries separate and never makes them due", async () => {
  const record = unavailableReview("review-unavailable");
  const view = await buildTrackReviewQueueViewModel({
    now: "2026-08-23T12:00:00.000Z",
    reviewQueueItems: [],
    trackId: TRACK_ID,
    unavailableReviewRecords: [record],
  });

  assert.equal(view.totalItems, 1);
  assert.deepEqual(view.dueItems, []);
  assert.deepEqual(view.overdueItems, []);
  assert.deepEqual(view.upcomingItems, []);
  assert.equal(view.unavailableItems.length, 1);
  assert.equal(view.unavailableItems[0]?.kind, "unavailable");
  assert.equal(view.unavailableItems[0]?.isDue, false);
  assert.equal(view.unavailableItems[0]?.isOverdue, false);
  assert.equal(view.unavailableItems[0]?.prompt, undefined);
  assert.equal(view.unavailableItems[0]?.questionId, "question-1");
  assert.equal(view.unavailableItems[0]?.unavailableReason, "unknown_artifact_hash");
});

test("stored unavailable reviews are readable without resolving content metadata", async () => {
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(unavailableReview("stored-review")));

  const view = await loadTrackReviewQueueViewModel({
    now: "2026-08-23T12:00:00.000Z",
    trackId: TRACK_ID,
  });

  assert.deepEqual(view.dueItems, []);
  assert.deepEqual(view.upcomingItems, []);
  assert.deepEqual(view.unavailableItems.map((item) => item.id), ["stored-review"]);
});

function unavailableReview(reviewId: string): ContentIdentityUnavailableReviewRecord {
  return {
    schemaVersion: 1,
    kind: "unavailable_review",
    reviewId,
    review: {
      id: reviewId,
      trackId: TRACK_ID,
      sourceAttemptId: `${reviewId}:attempt`,
      sourceSessionId: `${reviewId}:session`,
      sourceItem: {
        kind: "unavailable_review",
        reviewId,
        trackId: TRACK_ID,
        questionId: "question-1",
        contentVersion: "content-v0",
        reason: "unknown_artifact_hash",
        migrationVersion: 1,
        legacyIdentityDigest: "a".repeat(64),
      },
      taxonomyOrSkillRefs: [{ axisId: "roadmap_node", nodeId: "complexity_and_constraints" }],
      reasons: ["incorrect"],
      dueAt: "2026-08-20T12:00:00.000Z",
      createdAt: "2026-08-19T12:00:00.000Z",
      persistent: true,
    },
  };
}
