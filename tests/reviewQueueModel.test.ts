import assert from "node:assert/strict";
import test from "node:test";

import { ALGORITHMS_TRACK_ID } from "../src/domain";
import type { ReviewQueueItem } from "../src/domain/training";
import { buildReviewQueueScreenModel } from "../src/features/review/reviewQueueModel";
import { buildTrackReviewQueueViewModel } from "../src/features/review/reviewQueueService";
import type {
  ReviewQueueViewItem,
  ReviewQueueViewModel,
} from "../src/features/review/reviewQueueModel";
import { createAlgorithmsContentAdapter, ALGORITHM_TRAINING_ITEMS } from "../src/tracks/algorithms";

test("review queue model maps due canonical items into display rows", () => {
  const model = buildReviewQueueScreenModel(
    makeReviewViewModel({
      dueItems: [
        makeReviewItem("review-due-001", {
          dueAt: "2026-06-30T11:00:00.000Z",
          isDue: true,
          itemId: "question-001",
          mistakeTypeNodeId: "confused_services",
          priority: "high",
          prompt: "Which IAM role should be granted for least privilege?",
          reasons: ["incorrect_attempt", "repeated_mistake"],
          taxonomyNodeId: "access_security",
        }),
      ],
      highPriorityItems: [
        makeReviewItem("review-due-001", {
          dueAt: "2026-06-30T11:00:00.000Z",
          isDue: true,
          itemId: "question-001",
          mistakeTypeNodeId: "confused_services",
          priority: "high",
          prompt: "Which IAM role should be granted for least privilege?",
          reasons: ["incorrect_attempt", "repeated_mistake"],
          taxonomyNodeId: "access_security",
        }),
      ],
      totalItems: 1,
    }),
  );

  assert.equal(model.degraded, false);
  assert.equal(model.totalCount, 1);
  assert.equal(model.dueRows.length, 1);
  assert.equal(model.dueRows[0]?.status, "due");
  assert.equal(model.dueRows[0]?.title, "Which IAM role should be granted for least privilege?");
  assert.equal(model.dueRows[0]?.taxonomyLabel, "Configuring access and security");
  assert.deepEqual(model.dueRows[0]?.reasonLabels, ["Incorrect Attempt", "Repeated Mistake"]);
  assert.deepEqual(model.dueRows[0]?.mistakeTypeLabels, ["Confused Services"]);
});

test("review queue model maps missing content as an explicit unavailable row", () => {
  const model = buildReviewQueueScreenModel(
    makeReviewViewModel({
      dueItems: [
        makeReviewItem("review-missing-content-001", {
          isDue: true,
          prompt: undefined,
        }),
      ],
      totalItems: 1,
    }),
  );

  assert.equal(model.dueRows[0]?.status, "unavailable");
  assert.equal(model.dueRows[0]?.title, "Review item unavailable");
  assert.equal(
    model.dueRows[0]?.promptPreview,
    "Content metadata is unavailable for this review item.",
  );
});

test("review queue model exposes an honest empty state for an empty canonical queue", () => {
  const model = buildReviewQueueScreenModel(makeReviewViewModel());

  assert.equal(model.totalCount, 0);
  assert.deepEqual(model.dueRows, []);
  assert.deepEqual(model.upcomingRows, []);
  assert.equal(model.emptyTitle, "No review items yet");
  assert.match(model.emptyDescription, /local review queue/);
  assert.match(model.emptyDescription, /Cloud Certification/);
});

test("review queue model exposes degraded queue warnings without fake metrics", () => {
  const model = buildReviewQueueScreenModel(
    makeReviewViewModel({
      degraded: true,
      ok: false,
    }),
  );

  assert.equal(model.degraded, true);
  assert.equal(model.warning, "Some local review queue data may be incomplete.");
  assert.equal("readinessPercent" in model, false);
  assert.equal("streak" in model, false);
  assert.equal("level" in model, false);
});

test("track review queue view model joins Algorithms review items to Algorithms content", () => {
  const viewModel = buildTrackReviewQueueViewModel({
    contentAdapter: createAlgorithmsContentAdapter(ALGORITHM_TRAINING_ITEMS),
    now: "2026-06-30T12:00:00.000Z",
    reviewQueueItems: [
      makeAlgorithmsReviewQueueItem({
        dueAt: "2026-06-30T11:00:00.000Z",
        itemId: "alg-hash-map-primer-001",
        priority: "high",
      }),
    ],
    trackId: ALGORITHMS_TRACK_ID,
  });
  const model = buildReviewQueueScreenModel(viewModel);

  assert.equal(viewModel.trackTitle, "Algorithms");
  assert.equal(model.totalCount, 1);
  assert.equal(model.dueRows[0]?.status, "overdue");
  assert.equal(model.dueRows[0]?.title.length > 0, true);
  assert.notEqual(model.dueRows[0]?.taxonomyLabel, "Cloud Certification");
});

function makeReviewViewModel(
  overrides: Partial<ReviewQueueViewModel> = {},
): ReviewQueueViewModel {
  return {
    degraded: false,
    dueItems: [],
    highPriorityItems: [],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 0,
    trackTitle: "Cloud Certification",
    upcomingItems: [],
    ...overrides,
  };
}

function makeReviewItem(
  id: string,
  overrides: {
    dueAt?: string;
    isDue?: boolean;
    isOverdue?: boolean;
    itemId?: string;
    mistakeTypeNodeId?: string;
    priority?: ReviewQueueViewItem["priority"];
    prompt?: string;
    reasons?: ReviewQueueViewItem["reasons"];
    taxonomyNodeId?: string;
  } = {},
): ReviewQueueViewItem {
  return {
    dueAt: overrides.dueAt ?? "2026-06-30T12:00:00.000Z",
    id,
    isDue: overrides.isDue ?? false,
    isOverdue: overrides.isOverdue ?? false,
    itemId: overrides.itemId ?? "question-001",
    mistakeTypeRefs: overrides.mistakeTypeNodeId
      ? [
          {
            axisId: "cloud-mistake-type",
            nodeId: overrides.mistakeTypeNodeId,
            role: "mistake_type",
            trackId: "cloud-certification",
          },
        ]
      : [],
    priority: overrides.priority ?? "normal",
    prompt: overrides.prompt,
    reasons: overrides.reasons ?? ["incorrect_attempt"],
    sourceAttemptId: `attempt:${id}`,
    taxonomyRefs: overrides.taxonomyNodeId
      ? [
          {
            axisId: "cloud-domain",
            nodeId: overrides.taxonomyNodeId,
            role: "primary",
            trackId: "cloud-certification",
          },
        ]
      : [],
  };
}

function makeAlgorithmsReviewQueueItem(
  overrides: Partial<ReviewQueueItem> = {},
): ReviewQueueItem {
  return {
    createdAt: "2026-06-29T12:00:00.000Z",
    dueAt: "2026-06-30T12:00:00.000Z",
    id: "review:attempt-algorithms-review-001",
    itemId: "alg-hash-map-primer-001",
    mistakeTypeRefs: [
      {
        axisId: "mistake_type",
        nodeId: "wrong_approach",
        role: "mistake_type",
        trackId: ALGORITHMS_TRACK_ID,
      },
    ],
    priority: "normal",
    reasons: ["incorrect_attempt"],
    sourceAttemptId: "attempt-algorithms-review-001",
    trackId: ALGORITHMS_TRACK_ID,
    ...overrides,
  };
}
