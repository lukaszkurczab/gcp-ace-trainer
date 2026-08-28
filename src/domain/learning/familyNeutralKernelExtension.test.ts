import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test from "node:test";
import {
  createAttemptResult,
  createContentItemRef,
  createFamilyEnvelope,
  createReviewEvidence,
  createTrainingAttempt,
  type TrackFamilyId,
} from "..";

type TestReasoningPayload = Readonly<{ prompt: string; operands: readonly number[] }>;
type TestReasoningResponse = Readonly<{ orderedOperandIds: readonly string[] }>;
type TestReasoningEvidence = Readonly<{ concepts: readonly string[] }>;

test("a new family carries payload, response, result, and evidence without a global union", () => {
  const familyId: TrackFamilyId = "test-reasoning";
  const item = createContentItemRef({ trackId: "test-reasoning-track", itemId: "item-1", contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN});
  const payload: TestReasoningPayload = { prompt: "Order operands", operands: [1, 2] };
  const response: TestReasoningResponse = { orderedOperandIds: ["left", "right"] };
  const evidence: TestReasoningEvidence = { concepts: ["evaluation-order"] };
  const attempt = createTrainingAttempt({
    id: "attempt-1", sessionId: "session-1", trackId: item.trackId, modeId: "practice", occurrenceId: "occurrence-1", item,
    response,
    result: createAttemptResult({ kind: "correct", earnedPoints: 1, maxPoints: 1, details: createFamilyEnvelope({ familyId, details: { payload } }) }),
    reviewEvidence: createReviewEvidence({ sourceItem: item, taxonomyOrSkillRefs: [], evidence: createFamilyEnvelope({ familyId, details: evidence }) }),
    answeredAt: "2026-07-16T12:00:00.000Z", committedAt: "2026-07-16T12:00:00.000Z",
  });

  assert.equal(attempt.result.details?.familyId, familyId);
  assert.equal(attempt.reviewEvidence.evidence?.familyId, familyId);
  assert.equal(Object.isFrozen(attempt.response), true);
  assert.equal(Object.isFrozen((attempt.result.details?.details as { payload: TestReasoningPayload }).payload.operands), true);
});
