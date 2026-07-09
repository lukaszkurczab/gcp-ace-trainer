import assert from "node:assert/strict";
import test from "node:test";

import { ALGORITHMS_TRACK_ID, createTrainingSession } from "../src/domain";
import {
  buildAlgorithmsImmediateFeedbackModel,
  buildAlgorithmsReviewQueueUpdate,
  buildAlgorithmsSummaryActions,
  buildAlgorithmsSessionSummary,
  buildAlgorithmsSubmission,
  getAlgorithmsSessionModeIdForRouteMode,
  getAlgorithmsFeedbackState,
  hasAlgorithmsFeedbackDetails,
  type AlgorithmsSessionSummary,
} from "../src/features/algorithms/algorithmsSessionModel";
import type { PracticeSessionRouteParams } from "../src/features/practice/sessionConfig";
import {
  ALGORITHM_TRAINING_ITEMS,
  getActiveAlgorithmStaticMicroCheck,
  type AlgorithmStaticCheckScore,
  type AlgorithmStaticMicroCheck,
  type AlgorithmTrainingItem,
} from "../src/tracks/algorithms";

test("Algorithms afterEachAnswer derives immediate feedback state after scoring", () => {
  const { check, item, session } = makeSubmissionFixture("single_choice");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: [String(check.correctAnswer)],
    session,
  });

  const state = getAlgorithmsFeedbackState("afterEachAnswer", submission.score);

  assert.equal(state.hasSubmittedAnswer, true);
  assert.equal(state.showImmediateFeedback, true);
});

test("Algorithms atSessionEnd suppresses immediate feedback after scoring", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const state = getAlgorithmsFeedbackState("atSessionEnd", submission.score);

  assert.equal(state.hasSubmittedAnswer, true);
  assert.equal(state.showImmediateFeedback, false);
});

test("Algorithms immediate collapsed feedback model includes answer, key signal, and rule", () => {
  const { check, item, session } = makeSubmissionFixture("single_choice");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: [String(check.correctAnswer)],
    session,
  });

  const feedback = buildAlgorithmsImmediateFeedbackModel({
    check,
    item,
    score: submission.score,
    selectedOptionIds: [String(check.correctAnswer)],
  });

  assert.equal(feedback.status, "correct");
  assert.equal(feedback.statusLabel, "Correct");
  assert.notEqual(feedback.answerSummary, "");
  assert.equal(feedback.answerSummary.includes("Expected:"), false);
  assert.notEqual(feedback.keySignal, "");
  assert.equal(feedback.rule, item.feedbackModel.mentalModelCorrection);
});

test("Algorithms immediate incorrect answer summary includes selected and expected answer", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const feedback = buildAlgorithmsImmediateFeedbackModel({
    check,
    item,
    score: submission.score,
    selectedOptionIds: ["not-the-correct-step"],
  });

  assert.equal(feedback.answerSummary.includes("Your answer:"), true);
  assert.equal(feedback.answerSummary.includes("Expected:"), true);
  assert.equal(feedback.reasoning.answerSummary, feedback.answerSummary);
});

test("Algorithms immediate details include trap and mistake type without exposing pattern labels", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const feedback = buildAlgorithmsImmediateFeedbackModel({
    check,
    item,
    score: submission.score,
    selectedOptionIds: ["not-the-correct-step"],
  });

  assert.notEqual(feedback.keySignal, "");
  assert.notEqual(feedback.rule, "");
  assert.notEqual(feedback.reasoning.commonTrap, "");
  assert.notEqual(feedback.reasoning.mistakeType, "");
  assert.ok(feedback.reasoning.weakerAnswerNotes.length > 0);
  assert.equal(feedback.nextAction, item.feedbackModel.nextAction);
});

test("Algorithms feedback details require secondary details beyond answer summary", () => {
  assert.equal(hasAlgorithmsFeedbackDetails({
    answerSummary: "Expected: Use lookup.",
    keySignal: "Prior membership is needed.",
    nextAction: "Try one lookup drill.",
    reasoning: {
      answerSummary: "Expected: Use lookup.",
      weakerAnswerNotes: [],
    },
    rule: "Use lookup when prior membership is needed.",
    status: "incorrect",
    statusLabel: "Incorrect",
  }), false);
  assert.equal(hasAlgorithmsFeedbackDetails({
    answerSummary: "Expected: Use lookup.",
    keySignal: "Prior membership is needed.",
    nextAction: "Try one lookup drill.",
    reasoning: {
      answerSummary: "Expected: Use lookup.",
      commonTrap: "Sorting hides the lookup signal.",
      weakerAnswerNotes: [],
    },
    rule: "Use lookup when prior membership is needed.",
    status: "incorrect",
    statusLabel: "Incorrect",
  }), true);
});

test("Algorithms immediate details deduplicate common trap and mistake type", () => {
  const { check, item } = makeSubmissionFixture("single_choice");
  const score: AlgorithmStaticCheckScore = {
    feedback: check.feedback,
    mistakeTypes: ["wrong_approach"],
    result: {
      isCorrect: false,
      kind: "correctness",
    },
    status: "incorrect",
  };
  const duplicateTrapItem: AlgorithmTrainingItem = {
    ...item,
    pitfalls: [
      {
        description: " Wrong Approach. ",
        id: "duplicate-review-signal",
        mistakeTypes: ["wrong_approach"],
      },
    ],
  };

  const feedback = buildAlgorithmsImmediateFeedbackModel({
    check,
    item: duplicateTrapItem,
    score,
  });

  assert.equal(feedback.reasoning.commonTrap, undefined);
  assert.equal(feedback.reasoning.mistakeType, "Wrong Approach");
});

test("Algorithms atSessionEnd summary includes per-item feedback data", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const summary = buildAlgorithmsSessionSummary([submission.attempt], [item], "Hash maps");
  const reviewItem = summary.reviewItems[0];

  assert.ok(reviewItem);
  assert.equal(reviewItem.selectedAnswer, "not-the-correct-step");
  assert.notEqual(reviewItem.correctAnswer, "");
  assert.equal(reviewItem.result, "incorrect");
  assert.equal(reviewItem.explanation, check.feedback);
  assert.notEqual(reviewItem.recognizedPattern, "");
  assert.notEqual(reviewItem.whyThisPattern, "");
  assert.notEqual(reviewItem.commonTrap, "");
  assert.equal(reviewItem.nextReviewTarget, item.feedbackModel.nextAction);
});

test("Algorithms session summary identifies the top weak pattern and next action", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const summary = buildAlgorithmsSessionSummary([submission.attempt], [item], "Hash maps");

  assert.equal(summary.mainIssue?.pattern, summary.reviewItems[0]?.recognizedPattern);
  assert.match(summary.mainIssue?.recommendedNextAction ?? "", /short .* drill before mixed practice/);
  assert.ok(summary.mainIssue?.explanation.includes(summary.mainIssue.pattern));
  assert.deepEqual(summary.mainIssue?.itemIds, [item.id]);
});

test("Algorithms session summary avoids unclassified mistake copy when no mistake refs exist", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T10:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });
  const attemptWithoutMistakeRefs = {
    ...submission.attempt,
    mistakeTypeRefs: undefined,
  };

  const summary = buildAlgorithmsSessionSummary([attemptWithoutMistakeRefs], [item], "Hash maps");

  assert.equal(summary.mainIssue?.mistakeType, undefined);
  assert.equal(summary.mainIssue?.explanation.includes("Unclassified mistake"), false);
  assert.equal(summary.mainIssue?.recommendedNextAction, item.feedbackModel.nextAction);
});

test("Algorithms review queue receives incorrect attempts in both feedback modes", () => {
  for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
    const { check, item, session } = makeSubmissionFixture("trace_next_step");
    const submission = buildAlgorithmsSubmission({
      answeredAt: `2026-07-03T10:00:0${feedbackMode === "afterEachAnswer" ? "1" : "2"}.000Z`,
      check,
      complexityAnswer: {},
      item,
      selectedOptionIds: ["not-the-correct-step"],
      session,
    });

    assert.equal(getAlgorithmsFeedbackState(feedbackMode, submission.score).hasSubmittedAnswer, true);
    assert.equal(submission.score.status, "incorrect");
    assert.equal(submission.reviewQueueItems.length, 1);
    assert.equal(submission.reviewQueueItems[0]?.sourceAttemptId, submission.attempt.id);
    assert.deepEqual(submission.reviewQueueItems[0]?.reasons, ["incorrect_attempt"]);
  }
});

test("Algorithms review queue receives partial attempts in both feedback modes", () => {
  for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
    const { check, item, session } = makeSubmissionFixture("multi_select");
    const correctAnswers = check.correctAnswer;

    assert.ok(Array.isArray(correctAnswers));

    const submission = buildAlgorithmsSubmission({
      answeredAt: `2026-07-03T10:01:0${feedbackMode === "afterEachAnswer" ? "1" : "2"}.000Z`,
      check,
      complexityAnswer: {},
      item,
      selectedOptionIds: [correctAnswers[0] ?? ""],
      session,
    });

    assert.equal(getAlgorithmsFeedbackState(feedbackMode, submission.score).hasSubmittedAnswer, true);
    assert.equal(submission.score.status, "partial");
    assert.equal(submission.reviewQueueItems.length, 1);
    assert.equal(submission.reviewQueueItems[0]?.sourceAttemptId, submission.attempt.id);
    assert.deepEqual(submission.reviewQueueItems[0]?.reasons, ["partial_credit"]);
  }
});

test("Algorithms correct review attempt replaces remediation with a retention check", () => {
  const { check, item, session } = makeSubmissionFixture("single_choice");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T11:00:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: [String(check.correctAnswer)],
    session,
  });

  const update = buildAlgorithmsReviewQueueUpdate(submission);
  const summary = buildAlgorithmsSessionSummary([submission.attempt], [item], "Hash maps", {
    mode: "review",
  });

  assert.equal(update.action, "keep");
  assert.equal(update.reviewQueueItems[0]?.kind, "retention");
  assert.deepEqual(update.reviewQueueItems[0]?.reasons, ["due_spacing"]);
  assert.equal(summary.reviewSession?.clearedItems, 1);
  assert.equal(summary.reviewSession?.stillNeedsReview, 0);
});

test("Algorithms partial review attempt stays in queue with review timestamp", () => {
  const { check, item, session } = makeSubmissionFixture("multi_select");
  const correctAnswers = check.correctAnswer;

  assert.ok(Array.isArray(correctAnswers));

  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T11:05:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: [correctAnswers[0] ?? ""],
    session,
  });

  const update = buildAlgorithmsReviewQueueUpdate(submission);

  assert.equal(update.action, "keep");
  assert.equal(update.reviewQueueItems[0]?.itemId, item.id);
  assert.equal(update.reviewQueueItems[0]?.lastReviewedAt, "2026-07-03T11:05:00.000Z");
  assert.equal(update.reviewQueueItems[0]?.priority, "normal");
  assert.deepEqual(update.reviewQueueItems[0]?.reasons, ["partial_credit"]);
});

test("Algorithms incorrect review attempt stays high priority with repeated mistake signal", () => {
  const { check, item, session } = makeSubmissionFixture("trace_next_step");
  const submission = buildAlgorithmsSubmission({
    answeredAt: "2026-07-03T11:10:00.000Z",
    check,
    complexityAnswer: {},
    item,
    selectedOptionIds: ["not-the-correct-step"],
    session,
  });

  const update = buildAlgorithmsReviewQueueUpdate(submission);

  assert.equal(update.action, "keep");
  assert.equal(update.reviewQueueItems[0]?.priority, "high");
  assert.deepEqual(update.reviewQueueItems[0]?.reasons, ["incorrect_attempt", "repeated_mistake"]);
  assert.deepEqual(
    update.reviewQueueItems[0]?.mistakeTypeRefs?.map((ref) => ref.nodeId),
    check.mistakeTypes,
  );
});

test("Algorithms summary review action carries session missed item ids without due queue state", () => {
  const actions = buildAlgorithmsSummaryActions(
    makeSummary({ incorrect: 1, reviewItems: [makeReviewItem("missed-item", "incorrect")] }),
    makeSessionConfig("practice"),
  );

  assert.equal(actions[0]?.kind, "reviewMissed");
  assert.equal(actions[0]?.priority, "primary");
  assert.deepEqual(actions[0]?.reviewItemIds, ["missed-item"]);
});

test("Algorithms summary review action is not shown for unrelated due queue state without session misses", () => {
  const actions = buildAlgorithmsSummaryActions(
    makeSummary({ completed: 1, correct: 1, reviewItems: [makeReviewItem("correct-item", "correct")] }),
    makeSessionConfig("practice"),
  );

  assert.equal(actions.some((action) => action.kind === "reviewMissed"), false);
});

test("Algorithms summary actions offer weak area after enough missed results", () => {
  const actions = buildAlgorithmsSummaryActions(
    makeSummary({ incorrect: 1, partial: 1 }),
    makeSessionConfig("drill"),
  );

  assert.ok(actions.some((action) => action.kind === "startWeakArea"));
  assert.equal(actions[0]?.kind, "startWeakArea");
  assert.equal(actions[0]?.label, "Practice weak area");
});

test("Algorithms summary actions offer mixed practice after a strong session", () => {
  const actions = buildAlgorithmsSummaryActions(
    makeSummary({ completed: 4, correct: 4 }),
    makeSessionConfig("default"),
  );

  assert.deepEqual(actions.map((action) => action.kind), ["startMixedPractice", "viewProgress"]);
  assert.equal(actions[0]?.priority, "primary");
  assert.equal(actions[1]?.priority, "secondary");
});

test("Algorithms summary actions stay on implemented routes only", () => {
  const actions = buildAlgorithmsSummaryActions(
    makeSummary({ completed: 2, correct: 1, incorrect: 1 }),
    makeSessionConfig("default"),
  );

  assert.deepEqual(
    actions.map((action) => action.kind).sort(),
    ["continueRoadmap", "viewProgress"].sort(),
  );
});

test("Algorithms attempts preserve the route mode identity through session mode ids", () => {
  const { check, item } = makeSubmissionFixture("single_choice");
  const expectedModeIds: Record<PracticeSessionRouteParams["mode"], string> = {
    default: "algorithms-roadmap-basics",
    drill: "algorithms-drill",
    learn: "algorithms-learn",
    practice: "algorithms-mixed-practice",
    review: "algorithms-review",
    weakArea: "algorithms-weak-area",
  };

  for (const [mode, expectedModeId] of Object.entries(expectedModeIds) as [PracticeSessionRouteParams["mode"], string][]) {
    const session = createTrainingSession({
      id: `session-${mode}`,
      itemRefs: [
        {
          itemId: item.id,
          itemType: item.type,
          trackId: ALGORITHMS_TRACK_ID,
        },
      ],
      modeId: getAlgorithmsSessionModeIdForRouteMode(mode),
      startedAt: "2026-07-03T09:00:00.000Z",
      trackId: ALGORITHMS_TRACK_ID,
    });
    const submission = buildAlgorithmsSubmission({
      answeredAt: "2026-07-03T10:00:00.000Z",
      check,
      complexityAnswer: {},
      item,
      selectedOptionIds: [String(check.correctAnswer)],
      session,
    });

    assert.equal(session.modeId, expectedModeId);
    assert.equal(submission.attempt.modeId, expectedModeId);
  }
});

function makeSubmissionFixture(checkType: AlgorithmStaticMicroCheck["type"]): {
  check: AlgorithmStaticMicroCheck;
  item: AlgorithmTrainingItem;
  session: ReturnType<typeof createTrainingSession>;
} {
  for (const item of ALGORITHM_TRAINING_ITEMS) {
    const check = getActiveAlgorithmStaticMicroCheck(item);

    if (check.type === checkType) {
      const session = createTrainingSession({
        id: `session-${checkType}`,
        itemRefs: [
          {
            itemId: item.id,
            itemType: item.type,
            trackId: ALGORITHMS_TRACK_ID,
          },
        ],
        modeId: "algorithms-pattern-drill",
        startedAt: "2026-07-03T09:00:00.000Z",
        trackId: ALGORITHMS_TRACK_ID,
      });

      return { check, item, session };
    }
  }

  throw new Error(`Missing active Algorithms check type ${checkType}`);
}

function makeSummary(overrides: Partial<AlgorithmsSessionSummary> = {}): AlgorithmsSessionSummary {
  return {
    completed: 1,
    correct: 0,
    currentRoadmapNode: "Hash map and set",
    incorrect: 0,
    needsReview: [],
    partial: 0,
    recommendedNext: [],
    reviewItems: [],
    strong: [],
    ...overrides,
  };
}

function makeSessionConfig(mode: PracticeSessionRouteParams["mode"]): PracticeSessionRouteParams {
  return {
    feedbackMode: mode === "practice" ? "atSessionEnd" : "afterEachAnswer",
    mode,
    reviewBehaviorEnabled: false,
    sessionLength: mode === "practice" ? 40 : 20,
    source: mode === "default" ? "practiceHub" : "modeShortcut",
    topicId: "hash_map_and_set",
    trackId: ALGORITHMS_TRACK_ID,
  };
}

function makeReviewItem(
  itemId: string,
  result: AlgorithmsSessionSummary["reviewItems"][number]["result"],
): AlgorithmsSessionSummary["reviewItems"][number] {
  return {
    commonTrap: "Review the missed condition.",
    correctAnswer: "Correct answer",
    explanation: "Explanation",
    itemId,
    nextReviewTarget: "Try one related item.",
    recognizedPattern: "Hash map and set",
    result,
    selectedAnswer: "Selected answer",
    title: "Review item",
    whyThisPattern: "Lookup state is needed.",
  };
}
