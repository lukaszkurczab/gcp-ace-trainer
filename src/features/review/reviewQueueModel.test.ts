import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewQueueScreenModel } from "./reviewQueueModel";

test("review screen keeps unavailable rows out of due and upcoming sections", () => {
  const model = buildReviewQueueScreenModel({
    degraded: false,
    dueItems: [{
      dueAt: "2026-08-20T12:00:00.000Z",
      id: "due-review",
      isDue: true,
      isOverdue: true,
      kind: "available",
      questionId: "question-due",
      mistakeTypeRefs: [],
      prompt: "Available prompt",
      reasons: ["incorrect"],
      sourceAttemptId: "attempt-due",
      taxonomyRefs: [],
    }],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 2,
    trackTitle: "DSA & Problem Solving",
    unavailableItems: [{
      dueAt: "2026-08-19T12:00:00.000Z",
      id: "unavailable-review",
      isDue: false,
      isOverdue: false,
      kind: "unavailable",
      questionId: "question-unavailable",
      mistakeTypeRefs: [],
      reasons: ["incorrect"],
      sourceAttemptId: "attempt-unavailable",
      taxonomyRefs: [],
      unavailableReason: "unknown_artifact_hash",
    }],
    upcomingItems: [],
  });

  assert.deepEqual(model.dueRows.map((row) => row.id), ["due-review"]);
  assert.deepEqual(model.upcomingRows, []);
  assert.deepEqual(model.unavailableRows.map((row) => row.id), ["unavailable-review"]);
  assert.equal(model.unavailableRows[0]?.status, "unavailable");
  assert.equal(model.unavailableRows[0]?.unavailableReason, "unknown_artifact_hash");
  assert.equal(model.unavailableRows[0]?.promptPreview, "Content metadata is unavailable for this review item.");
});
