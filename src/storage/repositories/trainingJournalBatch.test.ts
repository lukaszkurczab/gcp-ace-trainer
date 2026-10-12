import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingAttempt } from "../../domain";
import { attempt, installMemoryStorage, review, timestamp } from "../../testing/journalTestSupport";
import { STORAGE_KEYS } from "../keys";
import { captureMutationPhysicalWrites } from "./mutationJournalRepository";
import { materializeReviewQueueBatch, addReviewQueueItems } from "./reviewQueueRepository";
import { materializeTrainingAttemptBatch } from "./trainingAttemptRepository";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";


function distinctAttempts() {
  return ["one", "two", "three"].map((part, index) => {
    const source = attempt(`attempt-${part}`);
    const item = { ...source.item, questionId: `question-${part}` };
    return createTrainingAttempt({ ...source, occurrenceId: `occurrence-${part}`, item, reviewEvidence: { ...source.reviewEvidence, sourceItem: item } });
  });
}

function distinctReviews() {
  return ["one", "two", "three"].map((part, index) => {
    const item = { ...attempt(`attempt-${part}`).item, questionId: `review-question-${part}` };
    return { ...review(`review-${part}`, `attempt-${part}`), sourceItem: item, createdAt: timestamp, dueAt: `2026-07-${16 + index}T10:00:00.000Z` };
  });
}

test("writes three attempts in journal order before one sequential-prepend index write", () => {
  const storage = installMemoryStorage();
  const attempts = distinctAttempts();
  const writes = attempts.map((record) => ({ kind: "put_attempt" as const, record }));
  const steps = captureMutationPhysicalWrites(writes, productionTrackAdmissionContext);
  storage.resetCounters();

  materializeTrainingAttemptBatch(attempts, steps, productionTrackAdmissionContext);

  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "write").map((entry) => entry.key), [
    STORAGE_KEYS.trainingAttempt("attempt-one"), STORAGE_KEYS.trainingAttempt("attempt-two"), STORAGE_KEYS.trainingAttempt("attempt-three"), STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
  ]);
  assert.deepEqual(JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload, ["attempt-three", "attempt-two", "attempt-one"]);
});

test("writes three review records, one derived index, then deletes in journal order", async () => {
  const storage = installMemoryStorage();
  const prior = review("review-delete", "old-attempt");
  await addReviewQueueItems([prior], productionTrackAdmissionContext);
  const puts = distinctReviews();
  const deletes = [prior];
  const writes = [
    ...puts.map((record) => ({ kind: "put_review_entry" as const, record })),
    ...deletes.map((record) => ({ kind: "delete_review_entry" as const, record })),
  ];
  const steps = captureMutationPhysicalWrites(writes, productionTrackAdmissionContext);
  storage.resetCounters();

  materializeReviewQueueBatch(puts, deletes, steps, productionTrackAdmissionContext);

  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "write").map((entry) => entry.key), [
    STORAGE_KEYS.reviewEntry("review-one"), STORAGE_KEYS.reviewEntry("review-two"), STORAGE_KEYS.reviewEntry("review-three"), STORAGE_KEYS.REVIEW_INDEX,
  ]);
  assert.deepEqual(storage.operations.filter((entry) => entry.kind === "remove").map((entry) => entry.key), [STORAGE_KEYS.reviewEntry("review-delete")]);
  assert.deepEqual(JSON.parse(storage.getString(STORAGE_KEYS.REVIEW_INDEX)!).payload, ["review-one", "review-two", "review-three"]);
});
