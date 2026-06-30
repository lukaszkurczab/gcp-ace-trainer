import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewQueueScreenModel } from "../src/features/review/reviewQueueModel";
import type {
  CloudCertificationReviewViewItem,
  CloudCertificationReviewViewModel,
} from "../src/tracks";

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

function makeReviewViewModel(
  overrides: Partial<CloudCertificationReviewViewModel> = {},
): CloudCertificationReviewViewModel {
  return {
    degraded: false,
    dueItems: [],
    highPriorityItems: [],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 0,
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
    priority?: CloudCertificationReviewViewItem["priority"];
    prompt?: string;
    reasons?: CloudCertificationReviewViewItem["reasons"];
    taxonomyNodeId?: string;
  } = {},
): CloudCertificationReviewViewItem {
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
