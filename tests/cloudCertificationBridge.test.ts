import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCloudTrainingAttemptSummary,
  createCloudReviewQueueItemsFromTrainingAttempts,
  mapAttemptSummaryToTrainingAttempts,
  mapPracticeAnswerRecordToTrainingAttempt,
} from "../src/tracks";
import { makeAttempt, makePracticeRecord, makeQuestion } from "./fixtures";

test("maps a legacy Cloud practice answer record to a TrainingAttempt", () => {
  const question = makeQuestion({
    correctOptionIds: ["a"],
    domain: "access_security",
    id: "practice-map-001",
    tags: ["iam", "least-privilege"],
    type: "single",
  });
  const record = makePracticeRecord({
    answeredAt: "2026-06-29T10:00:00.000Z",
    confidence: "sure",
    id: "practice-record-001",
    isCorrect: true,
    questionSnapshot: question,
    selectedOptionIds: ["a"],
  });

  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  assert.equal(attempt.id, record.id);
  assert.equal(attempt.trackId, "cloud-certification");
  assert.equal(attempt.modeId, "cloud-practice");
  assert.equal(attempt.itemId, question.id);
  assert.equal(attempt.answeredAt, record.answeredAt);
  assert.equal(attempt.confidence, "high");
  assert.deepEqual(attempt.result, {
    isCorrect: true,
    kind: "correctness",
  });
});

test("maps single-choice Cloud questions to single_choice_question attempts", () => {
  const record = makePracticeRecord({
    questionSnapshot: makeQuestion({ id: "single-map-001", type: "single" }),
  });

  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  assert.equal(attempt.itemType, "single_choice_question");
});

test("maps multiple-choice Cloud questions to multiple_choice_question attempts", () => {
  const record = makePracticeRecord({
    questionSnapshot: makeQuestion({
      correctOptionIds: ["a", "b"],
      id: "multiple-map-001",
      type: "multiple",
    }),
    selectedOptionIds: ["a"],
  });

  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  assert.equal(attempt.itemType, "multiple_choice_question");
  assert.deepEqual(attempt.result, {
    earnedPoints: 1,
    isCorrect: false,
    kind: "partial_credit",
    maxPoints: 2,
  });
});

test("maps selected option ids into an option_selection response", () => {
  const record = makePracticeRecord({
    questionSnapshot: makeQuestion({ id: "option-response-001", type: "single" }),
    selectedOptionIds: ["b"],
  });

  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  assert.equal(attempt.response.kind, "option_selection");
  assert.deepEqual(attempt.response.selectedOptionIds, ["b"]);
});

test("maps legacy correctness into canonical attempt result", () => {
  const record = makePracticeRecord({
    isCorrect: false,
    questionSnapshot: makeQuestion({
      correctOptionIds: ["a"],
      id: "correctness-map-001",
      type: "single",
    }),
    selectedOptionIds: ["c"],
  });

  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  assert.deepEqual(attempt.result, {
    isCorrect: false,
    kind: "correctness",
  });
  assert.deepEqual(attempt.feedbackSignals, ["incorrect", "review_recommended"]);
});

test("maps an exam attempt summary into multiple TrainingAttempt records", () => {
  const firstQuestion = makeQuestion({
    correctOptionIds: ["a"],
    id: "exam-map-001",
    type: "single",
  });
  const secondQuestion = makeQuestion({
    correctOptionIds: ["a", "b"],
    id: "exam-map-002",
    type: "multiple",
  });
  const summary = makeAttempt({
    id: "summary-map-001",
    answers: [
      {
        answeredAt: "2026-06-29T11:00:00.000Z",
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
        answeredAt: "2026-06-29T11:01:00.000Z",
        correctOptionIds: ["a", "b"],
        isAnswered: true,
        isCorrect: false,
        questionId: secondQuestion.id,
        questionNumber: 2,
        questionSnapshot: secondQuestion,
        selectedOptionIds: ["a"],
        wasFlagged: false,
      },
      {
        answeredAt: "2026-06-29T11:02:00.000Z",
        correctOptionIds: ["a"],
        isAnswered: false,
        isCorrect: false,
        questionId: "exam-map-unanswered",
        questionNumber: 3,
        questionSnapshot: makeQuestion({ id: "exam-map-unanswered" }),
        selectedOptionIds: [],
        wasFlagged: false,
      },
    ],
  });

  const attempts = mapAttemptSummaryToTrainingAttempts(summary);

  assert.equal(attempts.length, 2);
  assert.deepEqual(
    attempts.map((attempt) => attempt.id),
    ["attempt:summary-map-001:exam-map-001", "attempt:summary-map-001:exam-map-002"],
  );
  assert.deepEqual(
    attempts.map((attempt) => attempt.sessionId),
    ["summary-map-001", "summary-map-001"],
  );
  assert.deepEqual(
    attempts.map((attempt) => attempt.modeId),
    ["cloud-exam-simulation", "cloud-exam-simulation"],
  );
  assert.equal(attempts[1]?.response.kind, "option_selection");
  assert.deepEqual(attempts[1]?.result, {
    earnedPoints: 1,
    isCorrect: false,
    kind: "partial_credit",
    maxPoints: 2,
  });
});

test("creates review queue items from incorrect mapped attempts", () => {
  const record = makePracticeRecord({
    answeredAt: "2026-06-29T12:00:00.000Z",
    id: "practice-review-source-001",
    isCorrect: false,
    mistakeReason: "confused_services",
    questionSnapshot: makeQuestion({
      correctOptionIds: ["a"],
      id: "practice-review-001",
      type: "single",
    }),
    selectedOptionIds: ["b"],
  });
  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  const reviewItems = createCloudReviewQueueItemsFromTrainingAttempts([attempt], {
    dueAt: "2026-06-30T12:00:00.000Z",
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(reviewItems.length, 1);
  assert.equal(reviewItems[0]?.sourceAttemptId, attempt.id);
  assert.equal(reviewItems[0]?.itemId, attempt.itemId);
  assert.deepEqual(reviewItems[0]?.reasons, ["incorrect_attempt"]);
  assert.deepEqual(reviewItems[0]?.mistakeTypeRefs?.map((ref) => ref.nodeId), ["confused_services"]);
});

test("summary bridge produces concrete counts only", () => {
  const correctAttempt = mapPracticeAnswerRecordToTrainingAttempt(
    makePracticeRecord({
      isCorrect: true,
      questionSnapshot: makeQuestion({
        correctOptionIds: ["a"],
        id: "summary-correct-001",
        type: "single",
      }),
      selectedOptionIds: ["a"],
    }),
  );
  const incorrectAttempt = mapPracticeAnswerRecordToTrainingAttempt(
    makePracticeRecord({
      isCorrect: false,
      mistakeReason: "iam_misunderstanding",
      questionSnapshot: makeQuestion({
        correctOptionIds: ["a"],
        id: "summary-incorrect-001",
        type: "single",
      }),
      selectedOptionIds: ["b"],
    }),
  );
  const partialAttempt = mapPracticeAnswerRecordToTrainingAttempt(
    makePracticeRecord({
      isCorrect: false,
      questionSnapshot: makeQuestion({
        correctOptionIds: ["a", "b"],
        id: "summary-partial-001",
        type: "multiple",
      }),
      selectedOptionIds: ["a"],
    }),
  );

  const summary = buildCloudTrainingAttemptSummary([correctAttempt, incorrectAttempt, partialAttempt]);

  assert.deepEqual(summary, {
    attemptsByTaxonomy: [
      {
        count: 1,
        taxonomyRef: {
          axisId: "cloud-mistake-type",
          nodeId: "iam_misunderstanding",
          role: "mistake_type",
          trackId: "cloud-certification",
        },
      },
    ],
    correctCount: 1,
    incorrectCount: 1,
    partialCount: 1,
    reviewCandidateCount: 2,
    totalAttempts: 3,
  });
  assert.equal("readinessPercent" in summary, false);
  assert.equal("retentionPercent" in summary, false);
});
