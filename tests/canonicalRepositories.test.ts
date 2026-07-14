import assert from "node:assert/strict";
import test from "node:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UnsupportedStoredRecordError } from "../src/domain";
import { STORAGE_KEYS, getActiveTrackRepositoryValue, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveActiveTrackRepositoryValue, saveReviewQueueItems, saveTrainingAttempts, saveTrainingSessions } from "../src/storage";
import { isReviewQueueEntryArray, isTrainingAttemptArray, isTrainingSessionArray } from "../src/storage/repositories/trainingModelGuards";

test("repository guards accept canonical envelopes and reject replaced record shapes", () => {
  const ref = { trackId: "algorithms", itemId: "i1", contentVersion: "v1" };
  const session = { id: "s1", trackId: "algorithms", modeId: "m1", requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [ref], optionOrderByItem: {}, activeForegroundMs: 0, contentVersion: "v1", status: "active", startedAt: "2026-01-01T00:00:00.000Z" };
  const attempt = { id: "a1", sessionId: "s1", trackId: "algorithms", modeId: "m1", item: ref, response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" };
  const review = { id: "r1", trackId: "algorithms", sourceAttemptId: "a1", sourceSessionId: "s1", reasons: ["incorrect"], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: ref, taxonomyOrSkillRefs: [] };
  assert.equal(isTrainingSessionArray([session]), true); assert.equal(isTrainingAttemptArray([attempt]), true); assert.equal(isReviewQueueEntryArray([review]), true);
  const { currentItemIndex: _currentItemIndex, ...oldSessionWithoutPosition } = session;
  assert.equal(isTrainingSessionArray([oldSessionWithoutPosition]), false);
  assert.equal(isTrainingSessionArray([{ ...session, status: "expired", itemRefs: [{ itemId: "i1" }] }]), false);
  assert.equal(isTrainingAttemptArray([{ ...attempt, confidence: "low", result: { kind: "correctness", isCorrect: true } }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, kind: "remediation" }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, retentionPassedAt: "2026-01-03T00:00:00.000Z" }]), false);
  assert.equal(isReviewQueueEntryArray([{ ...review, reasons: ["incorrect_attempt"] }]), false);
});

test("canonical repositories write and read session, attempt, review, and active track records", async (context) => {
  const memory = new Map<string, string>();
  context.mock.method(AsyncStorage, "getItem", async (key: string) => memory.get(key) ?? null);
  context.mock.method(AsyncStorage, "setItem", async (key: string, value: string) => { memory.set(key, value); });
  const ref = { trackId: "algorithms", itemId: "item", contentVersion: "v1" };
  const session = { id: "session", trackId: "algorithms", modeId: "guided", requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [ref], optionOrderByItem: {}, activeForegroundMs: 0, contentVersion: "v1", status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" };
  const attempt = { id: "attempt", sessionId: "session", trackId: "algorithms", modeId: "guided", item: ref, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" };
  const review = { id: "review", trackId: "algorithms", sourceAttemptId: "attempt", sourceSessionId: "session", reasons: ["scheduled_retrieval" as const], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: false, sourceItem: ref, taxonomyOrSkillRefs: [] };
  await saveTrainingSessions([session]); await saveTrainingAttempts([attempt]); await saveReviewQueueItems([review]); await saveActiveTrackRepositoryValue("algorithms");
  assert.deepEqual((await getTrainingSessions()).value, [session]);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.deepEqual((await getReviewQueueItems()).value, [review]);
  assert.equal((await getActiveTrackRepositoryValue()).value, "algorithms");
});

test("missing repository records expose explicit empty state and no default active track", async (context) => {
  context.mock.method(AsyncStorage, "getItem", async () => null);
  assert.deepEqual((await getTrainingSessions()).value, []);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.deepEqual((await getReviewQueueItems()).value, []);
  assert.equal((await getActiveTrackRepositoryValue()).value, null);
});

test("malformed JSON throws and cannot become an empty-array fallback", async (context) => {
  context.mock.method(AsyncStorage, "getItem", async () => "{");
  await assert.rejects(getTrainingSessions(), UnsupportedStoredRecordError);
  await assert.rejects(getTrainingAttempts(), UnsupportedStoredRecordError);
  await assert.rejects(getReviewQueueItems(), UnsupportedStoredRecordError);
});

test("repositories access only canonical keys without an old-key or dual path", async (context) => {
  const keys: string[] = [];
  context.mock.method(AsyncStorage, "getItem", async (key: string) => { keys.push(key); return null; });
  await getTrainingSessions(); await getTrainingAttempts(); await getReviewQueueItems(); await getActiveTrackRepositoryValue();
  assert.deepEqual(keys.sort(), [STORAGE_KEYS.ACTIVE_TRACK, STORAGE_KEYS.TRAINING_ATTEMPTS, STORAGE_KEYS.TRAINING_REVIEW_QUEUE, STORAGE_KEYS.TRAINING_SESSIONS].sort());
});

test("repositories reject invalid stored records instead of returning empty collections", async (context) => {
  context.mock.method(AsyncStorage, "getItem", async () => JSON.stringify([{ old: true }]));
  await assert.rejects(getTrainingSessions(), UnsupportedStoredRecordError);
  await assert.rejects(getTrainingAttempts(), UnsupportedStoredRecordError);
  await assert.rejects(getReviewQueueItems(), UnsupportedStoredRecordError);
});
