import AsyncStorage from "@react-native-async-storage/async-storage";
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { submitActiveExamSession } from "../src/features/exam/examService";
import { savePracticeAnswer } from "../src/features/practice/practiceService";
import {
  getAttempts,
  getPracticeHistory,
  getStorageIssues,
  saveActiveExamSession,
  saveQuestions,
} from "../src/storage";
import { STORAGE_KEYS } from "../src/storage/keys";
import {
  getReviewQueueItems,
  getTrainingAttempts,
} from "../src/storage/repositories";
import {
  writeThroughAttemptSummary,
  writeThroughPracticeAnswerRecord,
} from "../src/tracks";
import { makeAttempt, makePracticeRecord, makeQuestion, makeSession } from "./fixtures";

const memoryStorage = new Map<string, string>();

beforeEach(() => {
  memoryStorage.clear();
  patchAsyncStorage();
});

test("practice save path writes legacy history and a canonical training attempt", async () => {
  const question = makeQuestion({
    correctOptionIds: ["a"],
    id: "practice-write-through-001",
    type: "single",
  });

  const record = await savePracticeAnswer({
    question,
    selectedOptionIds: ["a"],
  });

  const legacyHistory = await getPracticeHistory();
  const canonicalAttempts = await getTrainingAttempts();

  assert.equal(legacyHistory.length, 1);
  assert.equal(legacyHistory[0]?.id, record.id);
  assert.equal(canonicalAttempts.ok, true);
  assert.equal(canonicalAttempts.value.length, 1);
  assert.equal(canonicalAttempts.value[0]?.id, record.id);
  assert.equal(canonicalAttempts.value[0]?.modeId, "cloud-practice");
});

test("practice write-through creates and saves a review item for an incorrect answer", async () => {
  const record = makePracticeRecord({
    id: "practice-write-through-review-001",
    isCorrect: false,
    questionSnapshot: makeQuestion({
      correctOptionIds: ["a"],
      id: "practice-write-through-review-question-001",
      type: "single",
    }),
    selectedOptionIds: ["b"],
  });

  const result = await writeThroughPracticeAnswerRecord(record);
  const reviewQueueItems = await getReviewQueueItems();

  assert.equal(result.ok, true);
  assert.equal(result.attemptsWritten, 1);
  assert.equal(result.reviewQueueItemsWritten, 1);
  assert.equal(reviewQueueItems.value.length, 1);
  assert.equal(reviewQueueItems.value[0]?.sourceAttemptId, record.id);
  assert.deepEqual(reviewQueueItems.value[0]?.reasons, ["incorrect_attempt"]);
});

test("correct practice answer does not create a canonical review queue item", async () => {
  const question = makeQuestion({
    correctOptionIds: ["a"],
    id: "practice-write-through-correct-001",
    type: "single",
  });

  await savePracticeAnswer({
    question,
    selectedOptionIds: ["a"],
  });

  const reviewQueueItems = await getReviewQueueItems();

  assert.equal(reviewQueueItems.ok, true);
  assert.deepEqual(reviewQueueItems.value, []);
});

test("exam save path writes legacy attempt and canonical attempts for answered questions only", async () => {
  const firstQuestion = makeQuestion({
    correctOptionIds: ["a"],
    id: "exam-write-through-001",
    type: "single",
  });
  const secondQuestion = makeQuestion({
    correctOptionIds: ["a", "b"],
    id: "exam-write-through-002",
    type: "multiple",
  });
  const unansweredQuestion = makeQuestion({
    correctOptionIds: ["a"],
    id: "exam-write-through-003",
    type: "single",
  });
  const questions = [firstQuestion, secondQuestion, unansweredQuestion];
  const session = makeSession(questions, {
    [firstQuestion.id]: ["b"],
    [secondQuestion.id]: ["a"],
  });

  await saveQuestions(questions);
  await saveActiveExamSession(session);

  const summary = await submitActiveExamSession();
  const legacyAttempts = await getAttempts();
  const canonicalAttempts = await getTrainingAttempts();
  const reviewQueueItems = await getReviewQueueItems();

  assert.ok(summary);
  assert.equal(legacyAttempts.length, 1);
  assert.equal(legacyAttempts[0]?.id, summary.id);
  assert.equal(summary.answers.length, 3);
  assert.equal(canonicalAttempts.ok, true);
  assert.equal(canonicalAttempts.value.length, 2);
  assert.deepEqual(
    canonicalAttempts.value.map((attempt) => attempt.itemId).sort(),
    [firstQuestion.id, secondQuestion.id],
  );
  assert.deepEqual(
    canonicalAttempts.value.map((attempt) => attempt.sessionId),
    [summary.id, summary.id],
  );
  assert.equal(reviewQueueItems.ok, true);
  assert.equal(reviewQueueItems.value.length, 2);
  assert.deepEqual(
    reviewQueueItems.value.map((item) => item.reasons[0]).sort(),
    ["incorrect_attempt", "partial_credit"],
  );
});

test("exam write-through helper maps and saves multiple canonical attempts", async () => {
  const firstQuestion = makeQuestion({
    correctOptionIds: ["a"],
    id: "exam-helper-write-through-001",
    type: "single",
  });
  const secondQuestion = makeQuestion({
    correctOptionIds: ["a", "b"],
    id: "exam-helper-write-through-002",
    type: "multiple",
  });
  const summary = makeAttempt({
    answers: [
      {
        answeredAt: "2026-06-29T10:00:00.000Z",
        correctOptionIds: ["a"],
        isAnswered: true,
        isCorrect: true,
        questionId: firstQuestion.id,
        questionNumber: 1,
        questionSnapshot: firstQuestion,
        selectedOptionIds: ["a"],
        wasFlagged: false,
      },
      {
        answeredAt: "2026-06-29T10:01:00.000Z",
        correctOptionIds: ["a", "b"],
        isAnswered: true,
        isCorrect: false,
        questionId: secondQuestion.id,
        questionNumber: 2,
        questionSnapshot: secondQuestion,
        selectedOptionIds: ["a"],
        wasFlagged: false,
      },
    ],
    id: "exam-helper-summary-001",
  });

  const result = await writeThroughAttemptSummary(summary);
  const canonicalAttempts = await getTrainingAttempts();
  const reviewQueueItems = await getReviewQueueItems();

  assert.equal(result.ok, true);
  assert.equal(result.attemptsWritten, 2);
  assert.equal(result.reviewQueueItemsWritten, 1);
  assert.equal(canonicalAttempts.value.length, 2);
  assert.deepEqual(
    canonicalAttempts.value.map((attempt) => attempt.id),
    [
      "attempt:exam-helper-summary-001:exam-helper-write-through-002",
      "attempt:exam-helper-summary-001:exam-helper-write-through-001",
    ],
  );
  assert.equal(reviewQueueItems.value[0]?.sourceAttemptId, "attempt:exam-helper-summary-001:exam-helper-write-through-002");
});

test("canonical write-through failure is observable and does not roll back legacy practice history", async () => {
  patchAsyncStorage({
    setItem: async (key: string, value: string) => {
      if (key === STORAGE_KEYS.TRAINING_ATTEMPTS) {
        throw new Error("canonical attempts unavailable");
      }

      memoryStorage.set(key, value);
    },
  });
  const question = makeQuestion({
    correctOptionIds: ["a"],
    id: "practice-write-through-failure-001",
    type: "single",
  });

  const record = await savePracticeAnswer({
    question,
    selectedOptionIds: ["a"],
  });
  const legacyHistory = await getPracticeHistory();
  const canonicalAttempts = await getTrainingAttempts();
  const issues = getStorageIssues();

  assert.equal(legacyHistory.length, 1);
  assert.equal(legacyHistory[0]?.id, record.id);
  assert.deepEqual(canonicalAttempts.value, []);
  assert.ok(issues.some((issue) => issue.key === STORAGE_KEYS.TRAINING_ATTEMPTS));
  assert.ok(issues.some((issue) => issue.message === "canonical attempts unavailable"));
});

function patchAsyncStorage(overrides: Partial<typeof AsyncStorage> = {}): void {
  Object.assign(AsyncStorage, {
    getItem: async (key: string) => memoryStorage.get(key) ?? null,
    removeItem: async (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: async (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    ...overrides,
  });
}
