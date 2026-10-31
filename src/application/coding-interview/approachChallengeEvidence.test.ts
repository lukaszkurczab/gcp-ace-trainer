import assert from "node:assert/strict";
import test from "node:test";
import type { TrainingAttempt } from "../../domain";
import { projectCodingProgress } from "./codingProgressProjection";
import { scopeAttemptsToLearningTrack } from "../canonical/canonicalFamilyMechanics";
import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import type { LearningEvidenceProjection } from "../learningPlan/learningEvidenceProjection";

const trackId = "coding-interview-dsa-problem-solving";
const artifactSha256 = "a".repeat(64);
const question = { questionId: "legacy-question", trackId, nodeId: "arrays_and_strings", mentalUnitId: "sequence_shape", prompt: "Question", interactionType: "choice_single", difficulty: "easy" as const };

function attempt(id: string, modeId: string, questionId = question.questionId): TrainingAttempt<unknown> {
  const item = { trackId, questionId, contentVersion: "v1", artifactSha256 };
  return {
    id, sessionId: `session-${id}`, trackId, modeId, occurrenceId: `occurrence-${id}`, item, response: {},
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [
      { axisId: "node", nodeId: question.nodeId, role: "primary" },
      { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" },
    ] },
    answeredAt: "2026-10-30T10:00:00.000Z", committedAt: "2026-10-30T10:00:00.000Z",
  };
}

test("mode-aware family scope and Coding progress preserve the legacy baseline", () => {
  const legacy = attempt("legacy", "coding-interview-guided-practice");
  const approach = attempt("approach", "coding-interview-approach-challenge", "approach-question");
  const unknown = attempt("unknown", "coding-interview-unregistered-mode", "unknown-question");
  const catalog = {
    trackId, contentVersion: "v1", artifactSha256, contentReleaseId: "release-v1", questions: [question], modes: [],
    getQuestion: (id: string) => id === question.questionId ? question : undefined,
    getQuestionsForNode: () => [question], getQuestionsForMentalUnit: () => [question], getMode: () => { throw new Error("not used"); }, getPool: () => [question],
  } as unknown as TrainingCatalog;
  assert.deepEqual(scopeAttemptsToLearningTrack([legacy, approach, unknown], catalog), [legacy]);

  const evidence = (attempts: readonly TrainingAttempt<unknown>[]) => ({
    identity: { trackId, contentVersion: "v1", artifactSha256 }, capturedAt: "2026-10-30T10:01:00.000Z",
    activityAttempts: attempts, completion: { kind: "in_progress" }, attempts, reviews: [], recordedReviews: [], dueReviews: [],
    completedFacts: { sessions: [], attempts: attempts.map((record) => ({ answeredAt: record.answeredAt, countsTowardCompletion: true })) },
  }) as unknown as LearningEvidenceProjection;
  const withLegacy = projectCodingProgress(catalog, evidence([legacy]), "2026-10-30T10:01:00.000Z");
  const withSpecialModes = projectCodingProgress(catalog, evidence([legacy, approach, unknown]), "2026-10-30T10:01:00.000Z");
  assert.deepEqual(withSpecialModes, withLegacy);
});
