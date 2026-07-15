import assert from "node:assert/strict";
import test from "node:test";

import {
  CLEAR_LOCAL_HISTORY_DETAIL,
  CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE,
  CLEAR_LOCAL_HISTORY_OPERATION_NAMES,
  clearPatternlyLocalHistory,
  tryClearPatternlyLocalHistory,
  type ClearLocalHistoryOperations,
} from "../src/features/home/localReset";
import { recoverPendingMutation } from "../src/application/learningMutations";
import { addReviewQueueItems, addTrainingAttempt, clearReviewQueueItems, clearTrainingAttempts, clearTrainingSessions, getActiveMutationJournal, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, persistMutationJournal, saveTrainingSession } from "../src/storage/repositories";
import { STORAGE_KEYS } from "../src/storage/keys";
import { attempt, installMemoryStorage, journal, review, session } from "./journalTestSupport";

test("clear local history clears canonical local stores", async () => {
  const called: string[] = [];
  const operations = Object.fromEntries(
    CLEAR_LOCAL_HISTORY_OPERATION_NAMES.map((operationName) => [
      operationName,
      async () => {
        called.push(operationName);
      },
    ]),
  ) as ClearLocalHistoryOperations;

  await clearPatternlyLocalHistory(operations);

  assert.deepEqual(called.sort(), [...CLEAR_LOCAL_HISTORY_OPERATION_NAMES].sort());
});

test("clear local history copy covers progress and review data", () => {
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /practice/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /exams/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /review queue/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /progress/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /active sessions/);
});

test("clear local history removes a pending journal before it can resurrect cleared records", async () => {
  installMemoryStorage();
  await persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]));
  await clearPatternlyLocalHistory();
  assert.equal(await getActiveMutationJournal(), null);
  await recoverPendingMutation();
  assert.deepEqual((await getTrainingAttempts()).value, []);
});

test("clear local history reports an operation failure and stops later clears", async () => {
  const called: string[] = [];
  const operations = Object.fromEntries(CLEAR_LOCAL_HISTORY_OPERATION_NAMES.map((operationName) => [operationName, async () => {
    called.push(operationName);
    if (operationName === "clearTrainingSessions") throw new Error("injected reset failure");
  }])) as ClearLocalHistoryOperations;
  await assert.rejects(() => clearPatternlyLocalHistory(operations), /injected reset failure/);
  assert.deepEqual(called, ["clearMutationJournal", "clearCertificationExam", "clearTrainingSessions"]);
});

test("clear local history exposes a retryable failure result without reporting success", async () => {
  const operations = Object.fromEntries(CLEAR_LOCAL_HISTORY_OPERATION_NAMES.map((operationName) => [operationName, async () => {
    if (operationName === "clearCertificationExam") throw new Error("injected reset failure");
  }])) as ClearLocalHistoryOperations;

  const result = await tryClearPatternlyLocalHistory(operations);

  assert.deepEqual(result, { ok: false, message: CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE });
  assert.match(CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE, /Try again/);
});

test("repository clears retry after index removal fails", async () => {
  let storage = installMemoryStorage();
  await addTrainingAttempt(attempt());
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX });
  await assert.rejects(() => clearTrainingAttempts());
  storage.setFailurePlan(null);
  await assert.doesNotReject(() => clearTrainingAttempts());
  assert.deepEqual((await getTrainingAttempts()).value, []);

  storage = installMemoryStorage();
  await saveTrainingSession(session());
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.TRAINING_SESSION_INDEX });
  await assert.rejects(() => clearTrainingSessions());
  storage.setFailurePlan(null);
  await assert.doesNotReject(() => clearTrainingSessions());
  assert.deepEqual((await getTrainingSessions()).value, []);

  storage = installMemoryStorage();
  await addReviewQueueItems([review()]);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.REVIEW_INDEX });
  await assert.rejects(() => clearReviewQueueItems());
  storage.setFailurePlan(null);
  await assert.doesNotReject(() => clearReviewQueueItems());
  assert.deepEqual((await getReviewQueueItems()).value, []);
});
