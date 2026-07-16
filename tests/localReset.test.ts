import assert from "node:assert/strict";
import test from "node:test";

import {
  CLEAR_LOCAL_HISTORY_DETAIL,
  CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE,
  clearPatternlyLocalHistory,
  tryClearPatternlyLocalHistory,
} from "../src/features/home/localReset";
import { recoverPendingMutation } from "../src/application/learningMutations";
import { createTrainingSessionDraft, type TrainingSessionDraft } from "../src/domain";
import {
  addReviewQueueItems,
  addTrainingAttempt,
  getActiveMutationJournal,
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  saveTrainingSession,
  saveTrainingSessionDraft as persistTrainingSessionDraft,
} from "../src/storage/repositories";
import { STORAGE_KEYS } from "../src/storage/keys";
import { attempt, installMemoryStorage, journal, review, session } from "./journalTestSupport";

async function saveTrainingSessionDraft(draft: TrainingSessionDraft) {
  return persistTrainingSessionDraft(draft, (await getActiveTrainingSessionDraft())?.revision ?? null);
}

test("clear local history is one journaled learning-state mutation", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "algorithms-interview-simulation", configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "algorithms", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: active.startedAt }));
  await addTrainingAttempt(attempt());
  await addReviewQueueItems([review()]);

  await clearPatternlyLocalHistory();

  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingSessions()).value, []);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.deepEqual((await getReviewQueueItems()).value, []);
  assert.equal(await getActiveTrainingSessionDraft(), null);
});

test("clear local history copy covers progress and review data", () => {
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /practice/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /exams/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /review queue/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /progress/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /active sessions/);
});

test("reset recovers a pending command before deleting its fully materialized learning state", async () => {
  installMemoryStorage();
  const { persistMutationJournal } = await import("../src/storage/repositories/mutationJournalRepository");
  await persistMutationJournal(journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]));

  await clearPatternlyLocalHistory();

  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingSessions()).value, []);
  assert.deepEqual((await getTrainingAttempts()).value, []);
});

test("reset failure remains an explicit pending journal until recovery verifies every deletion", async () => {
  const storage = installMemoryStorage();
  const active = { ...session(), modeId: "algorithms-interview-simulation", configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "algorithms", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: active.startedAt }));
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.TRAINING_SESSION_INDEX });

  const result = await tryClearPatternlyLocalHistory();

  assert.deepEqual(result, { ok: false, message: CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE });
  assert.notEqual(await getActiveMutationJournal(), null);
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual((await getTrainingSessions()).value, []);
  assert.equal(await getActiveTrainingSessionDraft(), null);
});
