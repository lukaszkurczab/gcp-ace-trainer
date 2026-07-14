import assert from "node:assert/strict";
import test from "node:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UnsupportedStoredRecordError } from "../src/domain";
import { getTrainingAttempts, getTrainingSessions, getReviewQueueItems } from "../src/storage";
import { isReviewQueueEntryArray, isTrainingAttemptArray, isTrainingSessionArray } from "../src/storage/repositories/trainingModelGuards";

test("repository guards accept canonical envelopes and reject replaced record shapes", () => {
  const ref = { trackId: "algorithms", itemId: "i1", contentVersion: "v1" };
  const session = { id: "s1", trackId: "algorithms", modeId: "m1", requestedLength: 1, actualLength: 1, itemOrder: [ref], optionOrderByItem: {}, activeForegroundMs: 0, contentVersion: "v1", status: "active", startedAt: "2026-01-01T00:00:00.000Z" };
  const attempt = { id: "a1", sessionId: "s1", trackId: "algorithms", modeId: "m1", item: ref, response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" };
  const review = { id: "r1", trackId: "algorithms", sourceAttemptId: "a1", reasons: ["incorrect"], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: ref, taxonomyOrSkillRefs: [] };
  assert.equal(isTrainingSessionArray([session]), true); assert.equal(isTrainingAttemptArray([attempt]), true); assert.equal(isReviewQueueEntryArray([review]), true);
  assert.equal(isTrainingSessionArray([{ ...session, status: "expired", itemRefs: [{ itemId: "i1" }] }]), false);
  assert.equal(isTrainingAttemptArray([{ ...attempt, confidence: "low", result: { kind: "correctness", isCorrect: true } }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, kind: "remediation" }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, retentionPassedAt: "2026-01-03T00:00:00.000Z" }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, reasons: ["incorrect_attempt"] }]), false);
});

test("repositories reject invalid stored records instead of returning empty collections", async (context) => {
  context.mock.method(AsyncStorage, "getItem", async () => JSON.stringify([{ old: true }]));
  await assert.rejects(getTrainingSessions(), UnsupportedStoredRecordError);
  await assert.rejects(getTrainingAttempts(), UnsupportedStoredRecordError);
  await assert.rejects(getReviewQueueItems(), UnsupportedStoredRecordError);
});
