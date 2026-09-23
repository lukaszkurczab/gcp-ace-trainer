import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import type { ResolvedContentRef, ReviewQueueEntry } from "../../domain";
import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { UnsupportedStoredRecordError } from "../errors";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import {
  addReviewQueueItems,
  clearReviewQueueItems,
  getDueReviewQueueItems,
  getReviewQueueItems,
  removeReviewQueueEntry,
} from "./reviewQueueRepository";

const TRACK_ID = "google-cloud-associate-cloud-engineer" as const;
const QUESTION_ID = "gcp-ace-gcpace-n01-b02-002";
const OLD_SHA256 = "a".repeat(64);
const CURRENT_SHA256 = "b".repeat(64);
const TIMESTAMP = "2026-09-03T08:00:00.000Z";

function item(artifactSha256: string, contentVersion = "gcp-core-0006"): ResolvedContentRef {
  return { trackId: TRACK_ID, questionId: QUESTION_ID, contentVersion, artifactSha256 };
}

function review(id: string, sourceAttemptId: string, sourceSessionId: string, sourceItem: ResolvedContentRef): ReviewQueueEntry {
  return {
    id,
    trackId: TRACK_ID,
    sourceAttemptId,
    sourceSessionId,
    sourceItem,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: TIMESTAMP,
    createdAt: TIMESTAMP,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("keeps the same question distinct across immutable artifact SHA-256 values", async () => {
  const oldReview = review("review:gcp:0004", "attempt:gcp:0004", "session:gcp:0004", item(OLD_SHA256, "gcp-core-0004"));
  const currentReview = review("review:gcp:0006", "attempt:gcp:0006", "session:gcp:0006", item(CURRENT_SHA256));

  await addReviewQueueItems([oldReview]);
  await addReviewQueueItems([currentReview]);

  const stored = (await getReviewQueueItems()).value;
  assert.deepEqual(stored.map((entry) => entry.id), [oldReview.id, currentReview.id]);
  assert.deepEqual(stored.map((entry) => entry.sourceItem.artifactSha256), [OLD_SHA256, CURRENT_SHA256]);
});

test("preserves durable identity conflicts for one resolved content reference", async () => {
  const first = review("review:gcp:current", "attempt:gcp:current", "session:gcp:current", item(CURRENT_SHA256));
  await addReviewQueueItems([first]);

  await assert.rejects(
    () => addReviewQueueItems([{ ...first, id: "review:gcp:replacement", sourceAttemptId: "attempt:gcp:replacement" }]),
    /retain its durable resolved content identity/,
  );
  await assert.rejects(
    () => addReviewQueueItems([{ ...first, sourceAttemptId: "attempt:gcp:changed" }]),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems()).value, [first]);
});

test("rejects a durable ID rewrite across artifact identities before writing either entry", async () => {
  const oldReview = review("review:gcp:batch", "attempt:gcp:0004", "session:gcp:0004", item(OLD_SHA256, "gcp-core-0004"));
  const currentReview = review("review:gcp:batch", "attempt:gcp:0006", "session:gcp:0006", item(CURRENT_SHA256));

  await assert.rejects(
    () => addReviewQueueItems([oldReview, currentReview]),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("preserves index order while updating and removing canonical entries", async () => {
  const first = review("review:first", "attempt:first", "session:first", item(OLD_SHA256, "gcp-core-0004"));
  const second = review("review:second", "attempt:second", "session:second", item(CURRENT_SHA256));
  await addReviewQueueItems([first, second]);

  await addReviewQueueItems([{ ...first, dueAt: "2026-09-04T08:00:00.000Z" }]);
  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.id), [first.id, second.id]);
  assert.deepEqual((await getDueReviewQueueItems(TRACK_ID, "2026-09-05T09:00:00.000Z")).value.map((entry) => entry.id), [second.id, first.id]);

  await removeReviewQueueEntry(first.id);
  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.id), [second.id]);
});

test("rejects legacy identity fields, mixed records, tombstones, and non-lowercase artifact hashes", async () => {
  const canonical = review("review:canonical", "attempt:canonical", "session:canonical", item(CURRENT_SHA256));
  const legacy = {
    ...canonical,
    sourceItem: {
      trackId: TRACK_ID,
      itemId: QUESTION_ID,
      contentVersion: "gcp-core-0006",
      packagePin: { packageIdentity: CURRENT_SHA256, packageVersion: "gcp-core-0006", contentReleaseId: "release" },
    },
  };
  const mixed = { ...canonical, sourceItem: { ...canonical.sourceItem, itemId: QUESTION_ID } };
  const tombstone = {
    ...canonical,
    sourceItem: {
      kind: "unavailable_review",
      trackId: TRACK_ID,
      questionId: QUESTION_ID,
      contentVersion: "gcp-core-0006",
      reason: "unknown_artifact_hash",
      reviewId: canonical.id,
    },
  };
  const uppercase = { ...canonical, sourceItem: { ...canonical.sourceItem, artifactSha256: CURRENT_SHA256.toUpperCase() } };

  await assert.rejects(() => addReviewQueueItems([legacy as unknown as ReviewQueueEntry]), /invalid/);
  await assert.rejects(() => addReviewQueueItems([mixed as unknown as ReviewQueueEntry]), /invalid/);
  await assert.rejects(() => addReviewQueueItems([tombstone as unknown as ReviewQueueEntry]), /invalid/);
  await assert.rejects(() => addReviewQueueItems([uppercase as unknown as ReviewQueueEntry]), /invalid/);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("reads only strict canonical entries from durable storage", async () => {
  const canonical = review("review:stored", "attempt:stored", "session:stored", item(CURRENT_SHA256));
  const { sourceItem: _sourceItem, ...withoutSourceItem } = canonical;
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, [canonical.id]);
  writeCanonicalJson(STORAGE_KEYS.reviewEntry(canonical.id), {
    ...withoutSourceItem,
    sourceItem: { ...canonical.sourceItem, artifactSha256: CURRENT_SHA256.toUpperCase() },
  });

  await assert.rejects(() => getReviewQueueItems(), UnsupportedStoredRecordError);
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.REVIEW_INDEX) !== undefined, true);
});

test("clears all canonical review records and the index", async () => {
  await addReviewQueueItems([review("review:one", "attempt:one", "session:one", item(CURRENT_SHA256))]);
  await clearReviewQueueItems();
  assert.deepEqual((await getReviewQueueItems()).value, []);
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.REVIEW_INDEX), undefined);
});
