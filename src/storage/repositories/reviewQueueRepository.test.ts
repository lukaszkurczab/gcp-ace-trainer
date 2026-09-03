import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { recoverPendingMutation } from "../../application/learningMutations";
import { buildMutationJournal } from "../../application/learningMutations/mutationJournalBuilder";
import { createTrainingAttempt, createTrainingSession, type ContentPackagePin, type ReviewQueueEntry } from "../../domain";
import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import {
  addReviewQueueItems,
  applyRemoteAccountData,
  buildAccountDataSnapshot,
  getActiveMutationJournal,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  persistMutationJournal,
} from "..";
import { provisionGuestInstallation } from "./guestInstallationRepository";

const trackId = "google-cloud-associate-cloud-engineer" as const;
const itemId = "gcp-ace-gcpace-n01-b02-002";
const oldPin: ContentPackagePin = Object.freeze({
  packageIdentity: "a".repeat(64),
  packageVersion: "gcp-free-node-0004",
  contentReleaseId: "gcp-release-0004",
});
const currentPin: ContentPackagePin = Object.freeze({
  packageIdentity: "b".repeat(64),
  packageVersion: "gcp-free-node-0006",
  contentReleaseId: "gcp-release-0006",
});
const oldItem = { trackId, itemId, contentVersion: "gcp-core-0004", packagePin: oldPin };
const currentItem = { trackId, itemId, contentVersion: "gcp-core-0006", packagePin: currentPin };
const timestamp = "2026-09-03T08:00:00.000Z";

function review(id: string, sourceAttemptId: string, sourceSessionId: string, sourceItem: typeof oldItem | typeof currentItem): ReviewQueueEntry {
  return {
    id,
    trackId,
    sourceAttemptId,
    sourceSessionId,
    sourceItem,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: timestamp,
    createdAt: timestamp,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("keeps same item reviews from distinct immutable content packages", async () => {
  const oldReview = review("review:gcp:0004", "attempt:gcp:0004", "session:gcp:0004", oldItem);
  const currentReview = review("review:gcp:0006", "attempt:gcp:0006", "session:gcp:0006", currentItem);

  await addReviewQueueItems([oldReview]);
  await addReviewQueueItems([currentReview]);

  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.id), [oldReview.id, currentReview.id]);
  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.sourceItem.packagePin.packageVersion), [oldPin.packageVersion, currentPin.packageVersion]);
});

test("still rejects a same package durable ID replacement and immutable evidence change", async () => {
  const first = review("review:gcp:current", "attempt:gcp:current", "session:gcp:current", currentItem);
  await addReviewQueueItems([first]);

  await assert.rejects(
    () => addReviewQueueItems([{ ...first, id: "review:gcp:replacement", sourceAttemptId: "attempt:gcp:replacement" }]),
    /retain its durable review identity/,
  );
  await assert.rejects(
    () => addReviewQueueItems([{ ...first, sourceAttemptId: "attempt:gcp:changed" }]),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems()).value, [first]);
});

test("rejects a same durable ID across packages within one batch before writing", async () => {
  const oldReview = review("review:gcp:batch", "attempt:gcp:0004", "session:gcp:0004", oldItem);
  const currentReview = review("review:gcp:batch", "attempt:gcp:0006", "session:gcp:0006", currentItem);

  await assert.rejects(
    () => addReviewQueueItems([oldReview, currentReview]),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("rejects an immutable source attempt rewrite for one durable ID within a batch before writing", async () => {
  const first = review("review:gcp:batch", "attempt:gcp:one", "session:gcp:batch", currentItem);
  const conflicting = { ...first, sourceAttemptId: "attempt:gcp:two" };

  await assert.rejects(
    () => addReviewQueueItems([first, conflicting]),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("replays a pending journal after a cross package review write failure without duplicating either review", async () => {
  const oldReview = review("review:gcp:0004", "attempt:gcp:0004", "session:gcp:0004", oldItem);
  await addReviewQueueItems([oldReview]);

  const session = createTrainingSession({
    id: "session:gcp:0006",
    trackId,
    modeId: "certification-diagnostic-baseline",
    configurationSnapshot: { kind: "certificationPractice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "session:gcp:0006:occurrence:0", item: currentItem }],
    optionOrderByOccurrence: { "session:gcp:0006:occurrence:0": ["a", "b"] },
    activeForegroundMs: 0,
    contentVersion: currentItem.contentVersion,
    packagePin: currentPin,
    status: "active",
    startedAt: timestamp,
  });
  const attempt = createTrainingAttempt({
    id: "attempt:gcp:0006",
    sessionId: session.id,
    trackId,
    modeId: session.modeId,
    occurrenceId: session.itemOrder[0]!.occurrenceId,
    item: currentItem,
    response: { selectedOptionIds: ["a"] },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: currentItem, taxonomyOrSkillRefs: [] },
    answeredAt: timestamp,
    committedAt: timestamp,
  });
  const currentReview = review("review:gcp:0006", attempt.id, session.id, currentItem);
  const journal = await buildMutationJournal({
    operation: "submit_training_outcome",
    sessionId: session.id,
    trackId,
    identity: attempt.response,
    writes: [
      { kind: "put_attempt", record: attempt },
      { kind: "put_review_entry", record: currentReview },
      { kind: "put_session", record: session },
    ],
    createdAt: timestamp,
  });
  await persistMutationJournal(journal);

  const storage = getKeyValueStorage() as MemoryKeyValueStorage;
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry(currentReview.id) });
  await assert.rejects(() => recoverPendingMutation(), /materializ/i);
  assert.equal((await getActiveMutationJournal())?.status, "journal_durable");
  storage.setFailurePlan(null);

  await recoverPendingMutation();
  await recoverPendingMutation();
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingAttempts()).value.map((entry) => entry.id), [attempt.id]);
  assert.deepEqual((await getTrainingSessions()).value.map((entry) => entry.id), [session.id]);
  assert.deepEqual((await getReviewQueueItems()).value.map((entry) => entry.id), [oldReview.id, currentReview.id]);
});

test("roundtrips same item reviews from distinct packages through account data replacement", async () => {
  await provisionGuestInstallation({
    async create() {
      return {
        installationId: "11111111-1111-4111-8111-111111111111",
        localDatasetId: "22222222-2222-4222-8222-222222222222",
      };
    },
  });
  const oldReview = review("review:gcp:0004", "attempt:gcp:0004", "session:gcp:0004", oldItem);
  const currentReview = review("review:gcp:0006", "attempt:gcp:0006", "session:gcp:0006", currentItem);
  await addReviewQueueItems([oldReview, currentReview]);

  const snapshot = await buildAccountDataSnapshot();
  const reviewRecords = snapshot.records.filter((record) => record.recordType === "review_queue_entry");
  assert.equal(reviewRecords.length, 2);
  await applyRemoteAccountData(snapshot.records);

  assert.deepEqual((await getReviewQueueItems()).value, [oldReview, currentReview]);
  assert.deepEqual(reviewRecords.map((record) => (record.state as ReviewQueueEntry).sourceItem.packagePin.packageVersion), [oldPin.packageVersion, currentPin.packageVersion]);
});
