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

test("manual requests appear in available-now rows with a distinct requested status", () => {
  const model = buildReviewQueueScreenModel({
    degraded: false,
    dueItems: [{
      dueAt: "2026-10-09T12:00:00.000Z",
      id: "manual-review",
      isDue: false,
      isManualRequest: true,
      isOverdue: false,
      kind: "available",
      questionId: "question-manual",
      mistakeTypeRefs: [],
      prompt: "Available on request",
      reasons: ["manual_mark"],
      sourceAttemptId: "attempt-manual",
      taxonomyRefs: [],
    }],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 1,
    trackTitle: "Cloud Engineering",
    unavailableItems: [],
    upcomingItems: [],
  });

  assert.equal(model.dueRows.length, 1);
  assert.equal(model.dueRows[0]?.id, "manual-review");
  assert.equal(model.dueRows[0]?.status, "requested");
  assert.deepEqual(model.upcomingRows, []);
});
