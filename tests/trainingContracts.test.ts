import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type ProgressEvidenceSignal,
  type ReviewQueueItem,
  type TrainingAttempt,
  type TrainingItem,
  type UserProgress,
} from "../src/domain";

test("Cloud Certification single-choice item can be represented as a TrainingItem", () => {
  const item: TrainingItem = {
    contentVersion: "ace-foundation-320",
    difficulty: "medium",
    estimatedTimeSeconds: 90,
    id: "cloud-single-001",
    learningObjective: "Choose the appropriate managed compute option.",
    prompt: "A team needs to run a stateless container without managing servers. What should they choose?",
    responseSpec: {
      kind: "option_selection",
      maxSelections: 1,
      minSelections: 1,
      options: [
        { id: "cloud-run", text: "Cloud Run" },
        { id: "compute-engine", text: "Compute Engine" },
      ],
    },
    taxonomyRefs: [
      {
        axisId: "cloud-domain",
        nodeId: "planning_implementation",
        role: "primary",
      },
    ],
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
    type: "single_choice_question",
  };

  assert.equal(item.trackId, "cloud-certification");
  assert.equal(item.type, "single_choice_question");
  assert.equal(item.responseSpec.kind, "option_selection");
  assert.equal(item.responseSpec.maxSelections, 1);
});

test("Cloud Certification multiple-choice item can be represented as a TrainingItem", () => {
  const item: TrainingItem = {
    contentVersion: "ace-foundation-320",
    id: "cloud-multiple-001",
    prompt: "Which services can store container images for deployment pipelines?",
    responseSpec: {
      kind: "option_selection",
      maxSelections: 2,
      minSelections: 1,
      options: [
        { id: "artifact-registry", text: "Artifact Registry" },
        { id: "container-registry", text: "Container Registry" },
        { id: "cloud-dns", text: "Cloud DNS" },
      ],
    },
    taxonomyRefs: [
      {
        axisId: "cloud-domain",
        nodeId: "setup_environment",
        role: "primary",
      },
    ],
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
    type: "multiple_choice_question",
  };

  assert.equal(item.type, "multiple_choice_question");
  assert.equal(item.responseSpec.kind, "option_selection");
  assert.equal(item.responseSpec.maxSelections, 2);
});

test("Algorithms pattern-identification item can be represented as a TrainingItem", () => {
  const item: TrainingItem = {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    estimatedTimeSeconds: 120,
    id: "algo-pattern-001",
    learningObjective: "Identify when a two-pointer scan fits a sorted-array problem.",
    prompt: "Given a sorted array, find whether two values sum to a target.",
    responseSpec: {
      kind: "pattern_selection",
      patterns: [
        { id: "two_pointers", text: "Two pointers" },
        { id: "dynamic_programming", text: "Dynamic programming" },
      ],
    },
    taxonomyRefs: [
      {
        axisId: "algorithm-pattern",
        nodeId: "two_pointers",
        role: "primary",
      },
    ],
    trackId: ALGORITHMS_TRACK_ID,
    type: "pattern_identification",
  };

  assert.equal(item.trackId, "algorithms");
  assert.equal(item.type, "pattern_identification");
  assert.equal(item.responseSpec.kind, "pattern_selection");
});

test("Algorithms static item attempt can store deterministic scoring", () => {
  const attempt: TrainingAttempt = {
    answeredAt: "2026-06-29T12:00:00.000Z",
    id: "attempt-algo-static-001",
    itemId: "alg-hash-map-primer-001",
    itemType: "approach_primer",
    modeId: "algorithms-roadmap-basics",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["check_complement_first"],
    },
    result: {
      isCorrect: true,
      kind: "correctness",
    },
    trackId: ALGORITHMS_TRACK_ID,
  };

  assert.equal(attempt.modeId, "algorithms-roadmap-basics");
  assert.equal(attempt.response.kind, "option_selection");
  assert.deepEqual(attempt.response.selectedOptionIds, ["check_complement_first"]);
  assert.equal(attempt.result?.kind, "correctness");
});

test("Cloud attempt can carry mode, answer time, confidence, mistake refs, and feedback signals", () => {
  const attempt: TrainingAttempt = {
    answeredAt: "2026-06-29T12:00:00.000Z",
    confidence: "unsure",
    feedbackSignals: ["incorrect", "review_recommended"],
    id: "attempt-cloud-001",
    itemId: "cloud-single-001",
    itemType: "single_choice_question",
    mistakeTypeRefs: [
      {
        axisId: "cloud-mistake-type",
        nodeId: "confused_services",
        role: "mistake_type",
      },
    ],
    modeId: "cloud-practice",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["compute-engine"],
    },
    result: {
      isCorrect: false,
      kind: "correctness",
    },
    sessionId: "session-cloud-001",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  assert.equal(attempt.modeId, "cloud-practice");
  assert.equal(attempt.answeredAt, "2026-06-29T12:00:00.000Z");
  assert.equal(attempt.confidence, "unsure");
  assert.deepEqual(attempt.mistakeTypeRefs?.map((ref) => ref.nodeId), ["confused_services"]);
  assert.deepEqual(attempt.feedbackSignals, ["incorrect", "review_recommended"]);
});

test("review queue item references a source attempt and has a real dueAt", () => {
  const reviewItem: ReviewQueueItem = {
    createdAt: "2026-06-29T12:00:00.000Z",
    dueAt: "2026-07-01T12:00:00.000Z",
    id: "review-001",
    itemId: "cloud-single-001",
    mistakeTypeRefs: [
      {
        axisId: "cloud-mistake-type",
        nodeId: "confused_services",
        role: "mistake_type",
      },
    ],
    priority: "high",
    reasons: ["incorrect_attempt", "repeated_mistake"],
    sourceAttemptId: "attempt-cloud-001",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  assert.equal(reviewItem.sourceAttemptId, "attempt-cloud-001");
  assert.ok(Date.parse(reviewItem.dueAt) > Date.parse(reviewItem.createdAt));
});

test("progress model uses concrete evidence signals without readiness or retention percentages", () => {
  const evidenceSignals: ProgressEvidenceSignal[] = [
    {
      correct: 7,
      total: 10,
      type: "first_attempt_accuracy",
    },
    {
      count: 3,
      type: "due_review_count",
    },
    {
      evidenceLevel: "supported",
      taxonomyRef: {
        axisId: "algorithm-pattern",
        nodeId: "sliding_window",
        role: "primary",
      },
      type: "weak_taxonomy_node",
    },
  ];

  const progress: UserProgress = {
    completedSessionCount: 4,
    evidenceSignals,
    reviewQueue: {
      dueCount: 3,
      highPriorityDueCount: 1,
      nextDueAt: "2026-07-01T12:00:00.000Z",
      overdueCount: 0,
      upcomingCount: 2,
    },
    taxonomyProgress: [
      {
        attemptsCount: 12,
        dueReviewCount: 2,
        evidenceLevel: "emerging",
        firstAttemptCorrectCount: 7,
        firstAttemptTotalCount: 10,
        repeatedMistakeTypeRefs: [
          {
            axisId: "algorithm-mistake-type",
            nodeId: "missed_window_invariant",
            role: "mistake_type",
          },
        ],
        taxonomyRef: {
          axisId: "algorithm-pattern",
          nodeId: "sliding_window",
          role: "primary",
        },
        updatedAt: "2026-06-29T12:00:00.000Z",
      },
    ],
    trackId: ALGORITHMS_TRACK_ID,
    updatedAt: "2026-06-29T12:00:00.000Z",
    userId: "user-001",
  };

  assert.equal(progress.evidenceSignals[0]?.type, "first_attempt_accuracy");
  assert.equal("readinessPercent" in progress, false);
  assert.equal("retentionPercent" in progress, false);
});
