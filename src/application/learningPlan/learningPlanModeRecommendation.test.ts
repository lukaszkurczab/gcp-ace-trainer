import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_MODE_CONFIGS } from "../../content/canonical/productModeConfig";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import { createResolvedContentRef, createTrainingSession } from "../../domain";

const modesFor = (trackId: string) => PRODUCT_MODE_CONFIGS.filter((mode) => mode.trackId === trackId);

test("certification schedules its canonical one-time diagnostic, then moves to practice", () => {
  const modes = modesFor("google-cloud-associate-cloud-engineer");
  const first = recommendLearningPlanMode({ familyId: "certification", trackId: "google-cloud-associate-cloud-engineer", modes, sessions: [], dueReviewCount: 0 });
  assert.equal(first.mode.modeId, "certification-diagnostic-baseline");
  assert.equal(first.phase, "diagnosis");
  assert.deepEqual(first.executionPolicy, { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: { modeId: "certification-diagnostic-baseline", requestedLength: 40 }, practice: { modeId: "certification-focus-practice", requestedLength: 10 } });
  const after = recommendLearningPlanMode({ familyId: "certification", trackId: "google-cloud-associate-cloud-engineer", modes, sessions: [{ trackId: "google-cloud-associate-cloud-engineer", modeId: first.mode.modeId, status: "completed" } as never], dueReviewCount: 0 });
  assert.equal(after.mode.modeId, "certification-focus-practice");
  assert.equal(after.phase, "practice");
  const diagnosticPool = first.mode.selection.kind === "exact_ordered_questions" ? first.mode.selection.questionIds : [];
  const activeSession = createTrainingSession({ id: "active-diagnostic", trackId: "google-cloud-associate-cloud-engineer", modeId: first.mode.modeId,
    configurationSnapshot: { kind: "diagnosis" }, requestedLength: first.mode.defaultRequestedLength, actualLength: diagnosticPool.length,
    currentItemIndex: 0, itemOrder: diagnosticPool.map((questionId, index) => ({ occurrenceId: `active-diagnostic:${index}`, item: createResolvedContentRef({
      trackId: "google-cloud-associate-cloud-engineer", questionId, contentVersion: "test-content",
      artifactSha256: "a".repeat(64),
    }) })), optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test-content", artifactSha256: "a".repeat(64), status: "active", startedAt: "2026-10-02T10:00:00.000Z" });
  const active = recommendLearningPlanMode({ familyId: "certification", trackId: "google-cloud-associate-cloud-engineer", modes,
    sessions: [activeSession], activeSession, dueReviewCount: 1 });
  assert.equal(active.mode.modeId, "certification-diagnostic-baseline", "an exact active one-off diagnostic resumes before another request");
  assert.equal(active.phase, "diagnosis");
  const abandoned = recommendLearningPlanMode({ familyId: "certification", trackId: "google-cloud-associate-cloud-engineer", modes, sessions: [{ trackId: "google-cloud-associate-cloud-engineer", modeId: first.mode.modeId, status: "abandoned" } as never], dueReviewCount: 0 });
  assert.equal(abandoned.mode.modeId, "certification-focus-practice");
  assert.equal(abandoned.diagnosis, "abandoned");
});

test("coding and design bind recurring sessions to their existing canonical practice modes", () => {
  const coding = modesFor("coding-interview-dsa-problem-solving");
  const codingPolicy = recommendLearningPlanMode({ familyId: "coding_interview", trackId: "coding-interview-dsa-problem-solving", modes: coding, sessions: [], dueReviewCount: 0 });
  assert.equal(codingPolicy.mode.modeId, "coding-interview-guided-practice");
  assert.equal(codingPolicy.executionPolicy.practice.requestedLength, 10);
  assert.equal(codingPolicy.executionPolicy.initialDiagnosis, null);
  const design = modesFor("backend-system-design-interview");
  assert.equal(recommendLearningPlanMode({ familyId: "design_interview", trackId: "backend-system-design-interview", modes: design, sessions: [], dueReviewCount: 0 }).mode.modeId, "design-interview-tradeoff-practice");
});

test("due reviews use an explicitly supported family review mode, never a made-up mode", () => {
  const coding = modesFor("coding-interview-dsa-problem-solving");
  const recommendation = recommendLearningPlanMode({ familyId: "coding_interview", trackId: "coding-interview-dsa-problem-solving", modes: coding, sessions: [], dueReviewCount: 1 });
  assert.equal(recommendation.mode.modeId, "coding-interview-weak-area-review");
  assert.equal(recommendation.phase, "review");
});
