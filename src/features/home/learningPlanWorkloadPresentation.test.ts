import assert from "node:assert/strict";
import test from "node:test";
import type { FullGoalTimeCapacity } from "../../application/learningPlan/fullGoalTimeCapacity";
import type { FullGoalWorkloadProjection } from "../../application/learningPlan/fullGoalWorkloadProjection";
import { buildLearningPlanWorkloadPresentation } from "./learningPlanWorkloadPresentation";

const availableCapacity = { kind: "range_within_available_time" } as FullGoalTimeCapacity;

test("completed required chapters are presented as complete with no zero-minute requirement or optional-practice claim hidden in the estimate", () => {
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "complete", chapters: [chapter("free", "complete", null)] }),
    capacity: availableCapacity,
    chapterTitles: new Map([["free", "Canonical free chapter"]]),
    freeNodeId: "free",
  });

  assert.equal(view.kind, "complete");
  assert.equal(view.completedChapterCount, 1);
  assert.equal(view.requiredChapterCount, 1);
  assert.equal(view.knownMinMinutes, null);
  assert.equal(view.knownTypicalMinutes, null);
  assert.equal(view.knownMaxMinutes, null);
  assert.deepEqual(view.chapters.map(({ title, status }) => ({ title, status })), [{ title: "Canonical free chapter", status: "complete" }]);
});

test("completed chapters with active reviews retain the scheduled review workload instead of claiming total completion", () => {
  const dueReview = { id: "due-after-completion", dueAt: "2026-10-10T10:00:00.000Z", nodeId: "free", scope: { nodeId: "free", mentalUnitId: "unit-1" }, modeId: "review", minMinutes: 4, typicalMinutes: 6, maxMinutes: 8, creditsTowardMinimum: false } as const;
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "estimated", chapters: [chapter("free", "complete", null)], dueReviews: [dueReview], requiredResponses: 0, dueReviewResponses: 0, newResponses: 0, knownMinMinutes: 4, knownTypicalMinutes: 6, knownMaxMinutes: 8 }),
    capacity: availableCapacity,
    chapterTitles: new Map([["free", "Canonical free chapter"]]),
    freeNodeId: "free",
  });

  assert.equal(view.kind, "reviews_due");
  assert.equal(view.allRequiredChaptersComplete, true);
  assert.equal(view.knownMinMinutes, 4);
  assert.equal(view.knownTypicalMinutes, 6);
  assert.equal(view.knownMaxMinutes, 8);
  assert.equal(view.dueReviewCount, 1);
});

test("incomplete projection preserves named canonical chapter and exact unavailable reason without inferring Premium entitlement", () => {
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "incomplete", chapters: [chapter("required-premium", "minimum_incomplete", "no_canonical_request")] }),
    capacity: { ...availableCapacity, kind: "uncertain" },
    chapterTitles: new Map([["required-premium", "Canonical required area"]]),
    freeNodeId: "free-node",
  });

  assert.equal(view.kind, "incomplete");
  assert.equal(view.uncertainChapterCount, 1);
  assert.deepEqual(view.chapters[0], {
    nodeId: "required-premium", title: "Canonical required area", premiumRequired: true, status: "minimum_incomplete",
    requiredResponses: 20, dueReviewResponses: 0, newResponses: 20, minMinutes: null, typicalMinutes: null, maxMinutes: null,
    reason: "no_canonical_request", qualityRepair: null,
  });
});

test("missing display metadata remains explicit and does not turn a source id into a fabricated chapter name", () => {
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "incomplete", chapters: [chapter("required-area-id", "minimum_incomplete", "missing_scope_cost")] }),
    capacity: { ...availableCapacity, kind: "uncertain" },
    chapterTitles: new Map(),
    freeNodeId: "free-node",
  });

  assert.equal(view.chapters[0]?.title, null);
  assert.equal(view.chapters[0]?.nodeId, "required-area-id");
  assert.equal(view.chapters[0]?.reason, "missing_scope_cost");
});

test("real due reviews, unbounded quality work and estimate provenance stay available to the details view", () => {
  const dueReview = { id: "due-1", dueAt: "2026-10-10T10:00:00.000Z", nodeId: "quality-area", scope: { nodeId: "quality-area", mentalUnitId: "unit-1" }, modeId: null, minMinutes: null, typicalMinutes: null, maxMinutes: null, creditsTowardMinimum: false } as const;
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "incomplete", chapters: [chapter("quality-area", "quality_unmet", "quality_outcome_unbounded")], dueReviews: [dueReview], uncostedDueReviewIds: ["due-1"], qualityUncertainChapterIds: ["quality-area"], provenance: "observed", observationCount: 6 }),
    capacity: { ...availableCapacity, kind: "uncertain" },
    chapterTitles: new Map([["quality-area", "Canonical quality area"]]),
    freeNodeId: "free-node",
  });

  assert.equal(view.dueReviewCount, 1);
  assert.equal(view.uncostedDueReviewCount, 1);
  assert.equal(view.estimateSource, "observed");
  assert.equal(view.observationCount, 6);
  assert.equal(view.chapters[0]?.reason, "quality_outcome_unbounded");
  assert.equal(view.dueReviews[0]?.dueAt, dueReview.dueAt);
});

test("one bounded next practice stage remains separate from C3 response credits", () => {
  const nextPractice = { kind: "estimated", modeId: "canonical-practice", responseCount: 10, minMinutes: 8, typicalMinutes: 12, maxMinutes: 20, provenance: "authored", observationCount: 0 } as const;
  const view = buildLearningPlanWorkloadPresentation({
    workload: workload({ kind: "incomplete", chapters: [chapter("free", "minimum_incomplete", null)], nextPractice,
      requiredResponses: 20, dueReviewResponses: 0, newResponses: 0, knownMinMinutes: 8, knownTypicalMinutes: 12, knownMaxMinutes: 20 }),
    capacity: { ...availableCapacity, kind: "uncertain" },
    chapterTitles: new Map([["free", "Canonical free chapter"]]),
    freeNodeId: "free",
  });

  assert.deepEqual(view.nextPractice, nextPractice);
  assert.equal(view.chapters[0]?.newResponses, 20, "the forecasted post-diagnosis practice block does not falsely credit C3 completion");
});

function chapter(nodeId: string, completion: "complete" | "minimum_incomplete" | "quality_unmet", reason: FullGoalWorkloadProjection["chapters"][number]["unavailableReason"]): FullGoalWorkloadProjection["chapters"][number] {
  return { nodeId, completion, requiredResponses: completion === "complete" ? 0 : 20, dueReviewResponses: 0, newResponses: completion === "complete" ? 0 : 20, diagnosticResponses: 0,
    qualityRepair: completion === "quality_unmet" ? { nextLegalBlockResponses: 10, minMinutes: 20, typicalMinutes: 30, maxMinutes: 40, futureResponses: null, futureMaxMinutes: null } : null,
    minMinutes: completion === "complete" ? 0 : reason === "missing_scope_cost" || reason === "no_canonical_request" ? null : 20,
    typicalMinutes: completion === "complete" ? 0 : reason === "missing_scope_cost" || reason === "no_canonical_request" ? null : 30,
    maxMinutes: completion === "complete" ? 0 : reason === "missing_scope_cost" || reason === "no_canonical_request" ? null : reason === "quality_outcome_unbounded" ? null : 40,
    provenance: "authored", observationCount: 0, scopeRefs: [], unavailableReason: reason };
}

function workload(overrides: Partial<FullGoalWorkloadProjection>): FullGoalWorkloadProjection {
  return {
    kind: "estimated", chapters: [], dueReviews: [], sessionDemands: [], nextPractice: null, requiredResponses: 0, dueReviewResponses: 0, newResponses: 0,
    knownMinMinutes: 0, knownTypicalMinutes: 0, knownMaxMinutes: 0, unknownChapterIds: [], uncostedDueReviewIds: [],
    qualityUncertainChapterIds: [], distribution: "median_scope_typical_with_conservative_extremes", provenance: "authored", observationCount: 0,
    ...overrides,
    activeContinuation: overrides.activeContinuation ?? null,
  };
}
