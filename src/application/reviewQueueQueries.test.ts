import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  buildTrackReviewQueueViewModel,
  loadTrackReviewQueueViewModel,
} from "./reviewQueueQueries";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { createResolvedContentRef, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, type ReviewQueueEntry } from "../domain";
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

test("a future manual request is available in the real review queue without being labeled due", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "certification");
  assert.ok(resolved.planningPolicyIdentity, "the policy successor pin is separate from the review source ref");
  const track = resolved.track;
  const question = track.getPool("certification-focus-practice")[0]!;
  const sourceItem = createResolvedContentRef({
    trackId: track.trackId,
    questionId: question.questionId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
  });
  const entry: ReviewQueueEntry = {
    id: "review:manual-request-query",
    trackId: track.trackId,
    sourceAttemptId: "attempt:manual-request-query",
    sourceSessionId: "session:manual-request-query",
    sourceItem,
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }],
    reasons: ["manual_mark"],
    manualRequestId: `manual:${"a".repeat(64)}`,
    dueAt: "2026-10-09T12:00:00.000Z",
    createdAt: "2026-10-08T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    policyVersion: "bizq04-v1",
    stage: "manual_requested",
    status: "active",
  };

  const view = await buildTrackReviewQueueViewModel({
    now: "2026-10-08T12:00:00.000Z",
    reviewQueueItems: [entry],
    trackId: track.trackId,
  });

  assert.equal(view.dueItems.length, 1);
  assert.equal(view.dueItems[0]?.id, entry.id);
  assert.equal(view.dueItems[0]?.isDue, false);
  assert.equal(view.dueItems[0]?.isManualRequest, true);
  assert.equal(view.upcomingItems.length, 0);
  assert.equal(view.dueItems[0]?.prompt, question.prompt);
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
      },
      taxonomyOrSkillRefs: [{ axisId: "roadmap_node", nodeId: "complexity_and_constraints" }],
      reasons: ["incorrect"],
      dueAt: "2026-08-20T12:00:00.000Z",
      createdAt: "2026-08-19T12:00:00.000Z",
      persistent: true,
    },
  };
}
