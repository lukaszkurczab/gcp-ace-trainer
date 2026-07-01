import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackId,
} from "../src/domain";
import type { TrainingAttempt } from "../src/domain/training";
import {
  createAlgorithmsScoringAdapter,
  ALGORITHM_TRAINING_ITEMS,
  createCloudCertificationContentAdapter,
  createCloudCertificationReviewAdapter,
  createCloudCertificationScoringAdapter,
  getTrackAdapter,
} from "../src/tracks";
import { makeQuestion } from "./fixtures";

test("Cloud adapter maps a Cloud question to a TrainingItem", () => {
  const question = makeQuestion({
    difficulty: "medium",
    domain: "operations",
    id: "cloud-map-001",
    question: "Which service should run a stateless HTTP container?",
    tags: ["serverless", "containers"],
    type: "single",
  });
  const adapter = createCloudCertificationContentAdapter([question]);
  const item = adapter.getItemById(question.id);

  assert.ok(item);
  assert.equal(adapter.trackId, CLOUD_CERTIFICATION_TRACK_ID);
  assert.equal(item.id, question.id);
  assert.equal(item.prompt, question.question);
  assert.equal(item.type, "single_choice_question");
  assert.equal(item.trackId, CLOUD_CERTIFICATION_TRACK_ID);
  assert.equal(item.contentVersion, "ace-foundation-320");
  assert.equal(item.difficulty, "medium");
  assert.equal(item.responseSpec.kind, "option_selection");
  assert.deepEqual(
    item.taxonomyRefs.map((ref) => `${ref.axisId}:${ref.nodeId}`),
    ["cloud-domain:operations", "cloud-topic:serverless", "cloud-topic:containers"],
  );
});

test("Cloud scoring returns correct result for correct option selection", () => {
  const question = makeQuestion({
    correctOptionIds: ["a"],
    id: "cloud-score-correct-001",
    type: "single",
  });
  const item = createCloudCertificationContentAdapter([question]).getItemById(question.id);
  const scoring = createCloudCertificationScoringAdapter([question]);

  assert.ok(item);

  const result = scoring.scoreAttempt(item, {
    kind: "option_selection",
    selectedOptionIds: ["a"],
  });

  assert.deepEqual(result, {
    isCorrect: true,
    kind: "correctness",
  });
});

test("Cloud scoring returns incorrect result for wrong option selection", () => {
  const question = makeQuestion({
    correctOptionIds: ["a"],
    id: "cloud-score-wrong-001",
    type: "single",
  });
  const item = createCloudCertificationContentAdapter([question]).getItemById(question.id);
  const scoring = createCloudCertificationScoringAdapter([question]);

  assert.ok(item);

  const result = scoring.scoreAttempt(item, {
    kind: "option_selection",
    selectedOptionIds: ["b"],
  });

  assert.deepEqual(result, {
    isCorrect: false,
    kind: "correctness",
  });
});

test("Cloud review adapter creates a review queue item for an incorrect attempt", () => {
  const review = createCloudCertificationReviewAdapter();
  const attempt: TrainingAttempt = {
    answeredAt: "2026-06-29T12:00:00.000Z",
    confidence: "low",
    feedbackSignals: ["incorrect", "review_recommended"],
    id: "attempt-cloud-review-001",
    itemId: "cloud-score-wrong-001",
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
      selectedOptionIds: ["b"],
    },
    result: {
      isCorrect: false,
      kind: "correctness",
    },
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };

  const items = review.createReviewQueueItems(attempt, undefined, {
    dueAt: "2026-06-30T12:00:00.000Z",
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.sourceAttemptId, attempt.id);
  assert.equal(items[0]?.dueAt, "2026-06-30T12:00:00.000Z");
  assert.equal(items[0]?.priority, "high");
  assert.deepEqual(items[0]?.reasons, ["incorrect_attempt"]);
});

test("Algorithms adapter exists for algorithms", () => {
  const adapter = getTrackAdapter(ALGORITHMS_TRACK_ID);

  assert.equal(adapter.trackId, ALGORITHMS_TRACK_ID);
  assert.equal(adapter.content.trackId, ALGORITHMS_TRACK_ID);
  assert.equal(adapter.scoring.trackId, ALGORITHMS_TRACK_ID);
  assert.equal(adapter.review.trackId, ALGORITHMS_TRACK_ID);
  assert.equal(adapter.content.getItems().length, ALGORITHM_TRAINING_ITEMS.length);
});

test("Algorithms scoring can score an active static item", () => {
  const item = ALGORITHM_TRAINING_ITEMS.find((candidate) => candidate.id === "alg-hash-map-primer-001");
  const scoring = createAlgorithmsScoringAdapter();

  assert.ok(item);

  const result = scoring.scoreAttempt(item, {
    kind: "option_selection",
    selectedOptionIds: ["check_complement_first"],
  });

  assert.deepEqual(result, {
    isCorrect: true,
    kind: "correctness",
  });
});

test("adapter registry rejects an unknown track id", () => {
  assert.throws(
    () => getTrackAdapter("gcp-ace-trainer" as TrackId),
    /Unknown track adapter id: gcp-ace-trainer/,
  );
});
