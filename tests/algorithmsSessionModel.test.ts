import assert from "node:assert/strict";
import test from "node:test";

import type { TrainingSession } from "../src/domain/training";
import type {
  AlgorithmChoiceQuestion,
  AlgorithmComplexityQuestion,
  AlgorithmOrderingQuestion,
} from "../src/tracks/algorithms/algorithmQuestionTypes";
import {
  buildAlgorithmsImmediateFeedbackModel,
  buildAlgorithmsReviewQueueUpdate,
  buildAlgorithmsSessionSummary,
  buildAlgorithmsSubmission,
  getAnswerOptionVisualState,
  getAlgorithmsCorrectAnswerText,
  getAlgorithmsFeedbackState,
} from "../src/features/algorithms/algorithmsSessionModel";

const answeredAt = "2026-07-10T10:05:00.000Z";

test("Algorithms submission scores a root choice and preserves attempt identity", () => {
  const question = makeChoiceQuestion();
  const submission = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["correct"],
    session: makeSession(question.id, question.type),
  });

  assert.equal(submission.score.status, "correct");
  assert.equal(submission.attempt.itemId, question.id);
  assert.equal(submission.attempt.itemType, question.type);
  assert.equal(submission.attempt.trackId, "algorithms");
  assert.deepEqual(submission.attempt.response, {
    kind: "option_selection",
    selectedOptionIds: ["correct"],
  });
});

test("Algorithms submission stores ordering and complexity in native response kinds", () => {
  const ordering = makeOrderingQuestion();
  const orderingSubmission = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question: ordering,
    selectedOptionIds: [...ordering.correctOrder],
    session: makeSession(ordering.id, ordering.type),
  });
  const complexity = makeComplexityQuestion();
  const complexitySubmission = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: { space: "O(1)", time: "O(n)" },
    question: complexity,
    selectedOptionIds: [],
    session: makeSession(complexity.id, complexity.type),
  });

  assert.equal(orderingSubmission.score.status, "correct");
  assert.deepEqual(orderingSubmission.attempt.response, {
    kind: "option_selection",
    selectedOptionIds: ["read", "repair", "record"],
  });
  assert.equal(complexitySubmission.score.status, "correct");
  assert.deepEqual(complexitySubmission.attempt.response, {
    kind: "complexity_check",
    selectedComplexityAnswer: { space: "O(1)", time: "O(n)" },
  });
});

test("Algorithms immediate feedback reads the question feedback model and root options", () => {
  const question = makeChoiceQuestion();
  const submission = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["wrong"],
    session: makeSession(question.id, question.type),
  });
  const feedback = buildAlgorithmsImmediateFeedbackModel({
    question,
    score: submission.score,
    selectedOptionIds: ["wrong"],
  });

  assert.equal(feedback.status, "incorrect");
  assert.equal(feedback.keySignal, question.feedbackModel.decisionSignal);
  assert.equal(feedback.rule, question.feedbackModel.mentalModelCorrection);
  assert.equal(feedback.nextAction, question.feedbackModel.nextAction);
  assert.match(feedback.answerSummary, /Your answer: Wrong/);
  assert.match(feedback.answerSummary, /Expected: Correct/);
});

test("Algorithms correct-answer text follows source interaction fields", () => {
  assert.equal(getAlgorithmsCorrectAnswerText(makeChoiceQuestion()), "Correct");
  assert.equal(
    getAlgorithmsCorrectAnswerText(makeOrderingQuestion()),
    "1. Read\n2. Repair\n3. Record",
  );
  assert.equal(
    getAlgorithmsCorrectAnswerText(makeComplexityQuestion()),
    "Time O(n), space O(1)",
  );
});

test("Algorithms session summary uses semantic type labels without an invented title", () => {
  const question = makeChoiceQuestion();
  const submission = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["wrong"],
    session: makeSession(question.id, question.type),
  });
  const summary = buildAlgorithmsSessionSummary(
    [submission.attempt],
    [question],
    "Complexity and constraints",
    { mode: "practice" },
  );

  assert.equal(summary.incorrect, 1);
  assert.equal(summary.reviewItems[0]?.title, "Single Choice");
  assert.equal(summary.reviewItems[0]?.correctAnswer, "Correct");
  assert.equal(summary.reviewItems[0]?.selectedAnswer, "Wrong");
  assert.equal(summary.reviewItems[0]?.explanation, question.feedbackModel.mentalModelCorrection);
});

test("Algorithms incorrect attempts schedule remediation and correct attempts schedule retention", () => {
  const question = makeChoiceQuestion();
  const incorrect = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["wrong"],
    session: makeSession(question.id, question.type),
  });
  const correct = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["correct"],
    session: makeSession(question.id, question.type),
  });

  assert.equal(incorrect.reviewQueueItems[0]?.kind, "remediation");
  assert.equal(buildAlgorithmsReviewQueueUpdate(incorrect).action, "keep");
  assert.equal(correct.reviewQueueItems[0]?.kind, "retention");
  assert.equal(buildAlgorithmsReviewQueueUpdate(correct).action, "keep");
});

test("Algorithms feedback timing and option visual states remain explicit", () => {
  const question = makeChoiceQuestion();
  const score = buildAlgorithmsSubmission({
    answeredAt,
    complexityAnswer: {},
    question,
    selectedOptionIds: ["correct"],
    session: makeSession(question.id, question.type),
  }).score;

  assert.deepEqual(getAlgorithmsFeedbackState("afterEachAnswer", score), {
    hasSubmittedAnswer: true,
    showImmediateFeedback: true,
  });
  assert.deepEqual(getAlgorithmsFeedbackState("atSessionEnd", score), {
    hasSubmittedAnswer: true,
    showImmediateFeedback: false,
  });
  assert.equal(getAnswerOptionVisualState({ correct: true, selected: true, submitted: true }), "selected_correct");
  assert.equal(getAnswerOptionVisualState({ correct: true, selected: false, submitted: true }), "expected_correct");
});

function makeChoiceQuestion(): AlgorithmChoiceQuestion {
  return {
    ...makeBaseQuestion(),
    feedbackModel: {
      ...makeBaseQuestion().feedbackModel,
      distractorExplanations: { wrong: "It ignores the invariant." },
    },
    options: [
      { id: "correct", isCorrect: true, text: "Correct" },
      { id: "wrong", isCorrect: false, text: "Wrong" },
    ],
  };
}

function makeOrderingQuestion(): AlgorithmOrderingQuestion {
  return {
    ...makeBaseQuestion(),
    correctOrder: ["read", "repair", "record"],
    id: "ordering-question",
    subgoals: [
      { id: "read", text: "Read" },
      { id: "repair", text: "Repair" },
      { id: "record", text: "Record" },
    ],
    type: "subgoal_ordering",
  };
}

function makeComplexityQuestion(): AlgorithmComplexityQuestion {
  return {
    ...makeBaseQuestion(),
    correctComplexity: { space: "O(1)", time: "O(n)" },
    id: "complexity-question",
    type: "complexity_check",
  };
}

function makeBaseQuestion() {
  return {
    difficulty: "intro" as const,
    feedbackModel: {
      decisionSignal: "Preserve the invariant.",
      mentalModelCorrection: "Repair state before recording the answer.",
      mistakeTypes: ["records_before_repair"],
      nextAction: "Trace one more state transition.",
      result: "diagnostic" as const,
    },
    id: "choice-question",
    learningStage: "foundations" as const,
    primarySkillAtomId: "preserve_invariant",
    prompt: "Choose the correct action.",
    type: "single_choice" as const,
  };
}

function makeSession(itemId: string, itemType: TrainingSession["itemRefs"][number]["itemType"]): TrainingSession {
  return {
    currentItemIndex: 0,
    id: "session-algorithms-runtime",
    itemRefs: [{ itemId, itemType, trackId: "algorithms" }],
    modeId: "algorithms-roadmap-basics",
    startedAt: "2026-07-10T10:00:00.000Z",
    status: "active",
    trackId: "algorithms",
  };
}
