import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { ProductModeConfig } from "../../content/canonical/productModeConfig";
import { createResolvedContentRef, type ReviewQueueEntry } from "../../domain";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import { projectFullGoalWorkload } from "./fullGoalWorkloadProjection";

const TRACK = "track-a";
const SHA = "a".repeat(64);
const practice = { trackId: TRACK, modeId: "practice-a", selection: { kind: "node", nodeId: "chapter-a" }, requestedLengths: [2], defaultRequestedLength: 2, minimumActualLength: 1, timer: { kind: "elapsed_foreground" } } as unknown as ProductModeConfig;
const review = { trackId: TRACK, modeId: "review-a", selection: { kind: "evidence_conditioned", nodeId: "chapter-a", evidenceSources: ["due_queue"] } } as unknown as ProductModeConfig;
const questions = [question("q1", "chapter-a", "unit-a"), question("q2", "chapter-a", "unit-b"), question("q3", "chapter-premium", "unit-c")];
const track = {
  trackId: TRACK, contentVersion: "v2", artifactSha256: SHA, questions, modes: [practice, review],
  getPool: (modeId: string) => modeId === "practice-a" || modeId === "review-a" ? questions.filter((entry) => entry.nodeId === "chapter-a") : [],
  getMode: (modeId: string) => modeId === "practice-a" ? practice : review,
  getQuestion: (id: string) => questions.find((entry) => entry.questionId === id),
} as unknown as CanonicalTrackRuntime;
const policy: LearningPlanningPolicy = {
  schemaVersion: "patternly-learning-planning-policy-v1", policyVersion: "policy-v3", unavailableScopes: [],
  workEstimates: [
    estimate("practice-a-unit-a", "practice-a", "chapter-a", "unit-a", 1, 2, 3, 0.5, 1, 2),
    estimate("practice-a-unit-b", "practice-a", "chapter-a", "unit-b", 3, 4, 6, 0, 0, 0),
    estimate("review-a-unit-a", "review-a", "chapter-a", "unit-a", 2, 4, 7, 0, 0, 0),
    estimate("review-a-unit-b", "review-a", "chapter-a", "unit-b", 4, 6, 9, 0, 0, 0),
  ],
};
const planningPolicyIdentity = { contentVersion: "v2", artifactSha256: SHA, policyVersion: "policy-v3" } as const;

test("per-chapter workload credits eligible due responses once and keeps due/new costs distinct", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([
    chapter("chapter-a", 100, 80, "minimum_attempts_unmet"), chapter("chapter-premium", 80, 0, "minimum_attempts_unmet"),
  ]), sessions: [], attempts: [], reviews: [reviewEntry("due-1", "q1"), reviewEntry("due-2", "q2")], practiceMode: practice, reviewMode: review });
  const free = result.chapters.find((entry) => entry.nodeId === "chapter-a")!;
  const premium = result.chapters.find((entry) => entry.nodeId === "chapter-premium")!;
  assert.equal(free.requiredResponses, 20);
  assert.equal(free.dueReviewResponses, 2);
  assert.equal(free.newResponses, 18);
  assert.equal(free.unavailableReason, null);
  assert.ok(free.minMinutes !== null && free.maxMinutes !== null && free.minMinutes < free.typicalMinutes! && free.typicalMinutes! < free.maxMinutes);
  assert.deepEqual(result.dueReviews.map(({ id, creditsTowardMinimum }) => [id, creditsTowardMinimum]), [["due-1", true], ["due-2", true]]);
  assert.equal(premium.newResponses, 80);
  assert.equal(premium.unavailableReason, "no_canonical_request");
  assert.deepEqual(result.unknownChapterIds, ["chapter-premium"]);
  assert.equal(result.kind, "incomplete");
  assert.equal(result.dueReviewResponses, 2);
});

test("due review outside the existing review profile does not earn C3 credit or a fabricated cost", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]), sessions: [], attempts: [], reviews: [reviewEntry("wrong-chapter", "q3")], practiceMode: practice, reviewMode: review });
  const row = result.chapters[0]!;
  assert.equal(row.dueReviewResponses, 0);
  assert.equal(row.newResponses, 10);
  assert.equal(row.unavailableReason, null);
  assert.equal(result.dueReviews[0]?.minMinutes, null);
  assert.deepEqual(result.uncostedDueReviewIds, ["wrong-chapter"]);
  assert.equal(result.kind, "incomplete");
});

test("quality-unmet chapter estimates one real legal practice block and leaves future repair unbounded", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([{
    ...chapter("chapter-a", 20, 24, "quality_unmet"), quality: 0.75,
  }]), sessions: [], attempts: [], reviews: [], practiceMode: practice, reviewMode: review });
  const row = result.chapters[0]!;
  assert.equal(row.requiredResponses, 0);
  assert.deepEqual(row.qualityRepair, { nextLegalBlockResponses: 2, minMinutes: 4, typicalMinutes: 6, maxMinutes: 9, futureResponses: null, futureMaxMinutes: null });
  assert.equal(row.maxMinutes, null);
  assert.equal(row.unavailableReason, "quality_outcome_unbounded");
  assert.deepEqual(result.qualityUncertainChapterIds, ["chapter-a"]);
  assert.equal(result.knownMaxMinutes, null);
  assert.equal(result.kind, "incomplete");
});

test("a legal due-pool response is costed even when it cannot credit a minimum that is already met", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([{
    ...chapter("chapter-a", 20, 20, "quality_unmet"), quality: 0.75,
  }]), sessions: [], attempts: [], reviews: [reviewEntry("due-no-credit", "q1")], practiceMode: practice, reviewMode: review });
  assert.equal(result.dueReviewResponses, 0);
  assert.equal(result.dueReviews[0]?.creditsTowardMinimum, false);
  assert.equal(result.dueReviews[0]?.minMinutes, 2);
  assert.equal(result.uncostedDueReviewIds.length, 0);
});

test("exact duplicate review records are counted once and conflicting ids fail closed", () => {
  const reviewRecord = reviewEntry("same-review", "q1");
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]),
    sessions: [], attempts: [], reviews: [reviewRecord, reviewRecord], practiceMode: practice, reviewMode: review });
  assert.equal(result.dueReviews.length, 1);
  assert.throws(() => projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]),
    sessions: [], attempts: [], reviews: [reviewRecord, { ...reviewRecord, dueAt: "2026-10-06T00:00:00.000Z" }], practiceMode: practice, reviewMode: review }));
});

test("completed chapters add no new work or quality repair", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 20, null, "completed")]), sessions: [], attempts: [], reviews: [], practiceMode: practice, reviewMode: review });
  assert.equal(result.kind, "complete");
  assert.equal(result.requiredResponses, 0);
  assert.equal(result.newResponses, 0);
  assert.equal(result.chapters[0]?.minMinutes, 0);
  assert.equal(result.chapters[0]?.qualityRepair, null);
});

function question(questionId: string, nodeId: string, mentalUnitId: string) { return { questionId, nodeId, mentalUnitId, trackId: TRACK, contentVersion: "v2", artifactSha256: SHA } as const; }
function estimate(estimateId: string, modeId: string, nodeId: string, mentalUnitId: string, min: number, typical: number, max: number, reserveMin: number, reserveTypical: number, reserveMax: number): LearningPlanningPolicy["workEstimates"][number] {
  return { estimateId, modeId, scopeRefs: [{ nodeId, mentalUnitId }], minMinutesPerResponse: min, typicalMinutesPerResponse: typical, maxMinutesPerResponse: max, provenance: "authored", observationCount: 0,
    rationale: "Authored planning hypothesis", reviewReserve: { kind: "authored_estimate", minAdditionalResponsesPerNewResponse: reserveMin, typicalAdditionalResponsesPerNewResponse: reserveTypical, maxAdditionalResponsesPerNewResponse: reserveMax, provenance: "authored", observationCount: 0, rationale: "Scoped forecast reserve" } };
}
function chapter(nodeId: string, requiredAttemptCount: number, qualifyingAttemptCount: number, reason: "minimum_attempts_unmet" | "quality_unmet" | null, status: "in_progress" | "completed" = "in_progress") {
  return { nodeId, mentalUnitCount: 1, qualifyingAttemptCount, requiredAttemptCount, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: reason === "quality_unmet" ? 0.75 : status === "completed" ? 1 : null, status, reason };
}
function completion(chapters: ReturnType<typeof chapter>[]): PackageCompletionState {
  const completedChapterCount = chapters.filter((entry) => entry.status === "completed").length;
  const requiredAttemptCount = chapters.reduce((sum, entry) => sum + entry.requiredAttemptCount, 0);
  const qualifyingAttemptCount = chapters.reduce((sum, entry) => sum + entry.qualifyingAttemptCount, 0);
  const remainingAttemptCount = chapters.reduce((sum, entry) => sum + Math.max(0, entry.requiredAttemptCount - entry.qualifyingAttemptCount), 0);
  return { kind: completedChapterCount === chapters.length ? "completed" : "in_progress", chapters, completedChapterCount, requiredChapterCount: chapters.length, requiredAttemptCount, qualifyingAttemptCount, remainingAttemptCount } as PackageCompletionState;
}
function reviewEntry(id: string, questionId: string): ReviewQueueEntry {
  const sourceItem = createResolvedContentRef({ trackId: TRACK, questionId, contentVersion: "v2", artifactSha256: SHA });
  return { id, trackId: TRACK as never, sourceAttemptId: `attempt-${id}`, sourceSessionId: `session-${id}`, sourceItem, taxonomyOrSkillRefs: [], reasons: ["incorrect"], createdAt: "2026-10-01T00:00:00.000Z", dueAt: "2026-10-05T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, status: "active", policyVersion: "bizq04-v1", stage: "retention7" };
}
