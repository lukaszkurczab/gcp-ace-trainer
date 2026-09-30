import assert from "node:assert/strict";
import test from "node:test";

import { createCertificationExamReviewFixture } from "../../testing/certificationExamReviewFixture";
import { createFamilyEnvelope, type TrainingAttempt, type TrainingSessionResult } from "../../domain";

test("completed exam review projects answered and unanswered items across the complete fixed plan", async () => {
  const { projection } = await createCertificationExamReviewFixture({ correctIndices: [0], incorrectIndices: [1] });
  assert.equal(projection.items.length, 50);
  assert.equal(projection.answeredCount, 2);
  assert.equal(projection.unansweredCount, 48);
  assert.equal(projection.items[0]?.answerState, "answered");
  assert.equal(projection.items[0]?.result, "correct");
  assert.ok(projection.items[0]?.selectedOptionIds.length);
  assert.equal(projection.items[1]?.answerState, "answered");
  assert.equal(projection.items[1]?.result, "incorrect");
  assert.ok(projection.items[1]?.selectedOptionIds.length);
  assert.equal(projection.items[2]?.answerState, "unanswered");
  assert.deepEqual(projection.items[2]?.selectedOptionIds, []);
  assert.equal(projection.items[2]?.result, "unanswered");
  assert.ok(projection.items[2]?.correctOptionIds.length);
  assert.ok(projection.items[2]?.reason);
  assert.ok(projection.maxPoints > 0);
});

test("fully unanswered completed exam projects all 50 items without creating attempts", async () => {
  const { attempts, projection } = await createCertificationExamReviewFixture({ correctIndices: [], incorrectIndices: [] });
  assert.equal(attempts.length, 0);
  assert.equal(projection.answeredCount, 0);
  assert.equal(projection.unansweredCount, 50);
  assert.equal(projection.items.every((item) => item.answerState === "unanswered" && item.result === "unanswered" && item.selectedOptionIds.length === 0 && item.correctOptionIds.length > 0), true);
});

test("exam result rejects tampered partition, attempt scores, and profile evidence", async () => {
  const { attempts, itemOrder, project, result, session } = await createCertificationExamReviewFixture({ correctIndices: [0], incorrectIndices: [] });
  const wrongPartition = { ...result, unansweredOccurrenceIds: result.unansweredOccurrenceIds.slice(1) } as TrainingSessionResult;
  await assert.rejects(project(wrongPartition), /coverage|partition/i);
  const badAttempt = { ...attempts[0]!, result: { ...attempts[0]!.result, earnedPoints: 0, kind: "incorrect" } } as TrainingAttempt<unknown>;
  await assert.rejects(project(result, [badAttempt]), /score|totals/i);
  const details = result.evidence.details as Record<string, unknown>;
  const badProfileResult = { ...result, evidence: createFamilyEnvelope({ familyId: "certification", details: { ...details, profileVersion: "other" } }) } as TrainingSessionResult;
  await assert.rejects(project(badProfileResult), /profile evidence/i);
  const foreignResult = { ...result, sessionId: "another-session" } as TrainingSessionResult;
  await assert.rejects(project(foreignResult), /completed session and simulation profile/i);
  const tamperedSession = { ...session, itemOrder: [{ ...itemOrder[0]!, item: { ...itemOrder[0]!.item, artifactSha256: "f".repeat(64) } }, ...itemOrder.slice(1)] } as typeof session;
  await assert.rejects(project(result, attempts, tamperedSession), /fingerprint/i);
});
