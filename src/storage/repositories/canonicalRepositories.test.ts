import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { addReviewQueueItems, addTrainingAttempt, getActiveTrackId, getActiveTrainingSession, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, saveActiveTrackId, saveTrainingSession } from "..";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../errors";
import { createTrainingSession } from "../../domain";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
test("canonical repositories use individual immutable records and one active session", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN}; const session = createTrainingSession({ id: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }], optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" }); const attempt = { id: "a", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", occurrenceId: "occurrence-1", item: ref, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: session.startedAt, committedAt: session.startedAt };
 await saveActiveTrackId("coding-interview-dsa-problem-solving"); await saveTrainingSession(session); await addTrainingAttempt(attempt); await addTrainingAttempt(attempt);
 assert.equal(await getActiveTrackId(), "coding-interview-dsa-problem-solving"); assert.equal((await getTrainingSessions()).value.length, 1); assert.equal((await getTrainingAttempts()).value.length, 1);
 await assert.rejects(addTrainingAttempt({ ...attempt, response: { changed: true } }));
});

test("training sessions permit free navigation while rejecting regressing foreground time and missing active records", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN};
 const session = createTrainingSession({ id: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 2, actualLength: 2, currentItemIndex: 1, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }, { occurrenceId: "occurrence-2", item: { ...ref, itemId: "j" } }], optionOrderByOccurrence: {}, activeForegroundMs: 500, contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" });
  await saveTrainingSession(session);
 await assert.doesNotReject(() => saveTrainingSession({ ...session, currentItemIndex: 0 }));
 await saveTrainingSession({ ...session, currentItemIndex: 0 });
 await assert.rejects(() => saveTrainingSession({ ...session, activeForegroundMs: 499 }), /cannot decrease/);
 installKeyValueStorageForTests(new MemoryKeyValueStorage());
 writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, session.id);
 await assert.rejects(() => getActiveTrainingSession(), /references missing session/);
});

test("terminal sessions are immutable except for identical recovery replay", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN};
 const completed = createTrainingSession({ id: "done", trackId: "coding-interview-dsa-problem-solving", modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }], optionOrderByOccurrence: {}, activeForegroundMs: 500, contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "completed" as const, startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:01:00.000Z" });
 await saveTrainingSession(completed);
 await assert.doesNotReject(() => saveTrainingSession(completed));
 await assert.rejects(() => saveTrainingSession({ ...completed, activeForegroundMs: 501 }), /immutable/);
 await assert.rejects(() => saveTrainingSession({ ...completed, completedAt: "2026-01-01T00:02:00.000Z" }), /immutable/);
});

test("attempt persistence rejects item and review-evidence identity mismatches", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN};
 const base = { id: "a-invalid", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", occurrenceId: "occurrence-1", item: ref, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" };
 await assert.rejects(() => addTrainingAttempt({ ...base, item: { ...ref, trackId: "google-cloud-associate-cloud-engineer" } }), /invalid/);
 await assert.rejects(() => addTrainingAttempt({ ...base, reviewEvidence: { ...base.reviewEvidence, sourceItem: { ...ref, contentVersion: "other" , packagePin: TEST_CONTENT_PACKAGE_PIN} } }), /invalid/);
});

test("review persistence rejects hidden identity replacement", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN};
 const first = { id: "review-a", trackId: "coding-interview-dsa-problem-solving", sourceAttemptId: "a", sourceSessionId: "s", sourceItem: ref, taxonomyOrSkillRefs: [], reasons: ["incorrect" as const], dueAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true };
 await addReviewQueueItems([first]);
 await assert.rejects(() => addReviewQueueItems([{ ...first, id: "review-b", sourceAttemptId: "b" }]), /retain its durable review identity/);
});

test("strict codecs reject unpinned stored sessions, attempts, and reviews without inference", async () => {
 const ref = { trackId: "coding-interview-dsa-problem-solving" as const, itemId: "i", contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN };
 const validSession = createTrainingSession({ id: "unpinned-session", trackId: ref.trackId, modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }], optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
 const { packagePin: _sessionPin, ...sessionWithoutPin } = validSession;
 writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [validSession.id]);
 writeCanonicalJson(STORAGE_KEYS.trainingSession(validSession.id), sessionWithoutPin);
 await assert.rejects(() => getTrainingSessions(), UnsupportedStoredRecordError);

 installKeyValueStorageForTests(new MemoryKeyValueStorage());
 const validAttempt = { id: "unpinned-attempt", sessionId: validSession.id, trackId: ref.trackId, modeId: "m", occurrenceId: "occurrence-1", item: ref, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: validSession.startedAt, committedAt: validSession.startedAt };
 const { packagePin: _attemptPin, ...attemptItemWithoutPin } = validAttempt.item;
 writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, [validAttempt.id]);
 writeCanonicalJson(STORAGE_KEYS.trainingAttempt(validAttempt.id), { ...validAttempt, item: attemptItemWithoutPin });
 await assert.rejects(() => getTrainingAttempts(), UnsupportedStoredRecordError);

 installKeyValueStorageForTests(new MemoryKeyValueStorage());
 const validReview = { id: "unpinned-review", trackId: ref.trackId, sourceAttemptId: validAttempt.id, sourceSessionId: validSession.id, sourceItem: ref, taxonomyOrSkillRefs: [], reasons: ["incorrect" as const], dueAt: validSession.startedAt, createdAt: validSession.startedAt, consecutiveAfterDueSuccesses: 0, persistent: true };
 const { packagePin: _reviewPin, ...reviewItemWithoutPin } = validReview.sourceItem;
 writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, [validReview.id]);
 writeCanonicalJson(STORAGE_KEYS.reviewEntry(validReview.id), { ...validReview, sourceItem: reviewItemWithoutPin });
 await assert.rejects(() => getReviewQueueItems(), UnsupportedStoredRecordError);
});
