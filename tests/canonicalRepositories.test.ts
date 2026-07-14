import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { addTrainingAttempt, addTrainingSession, getActiveTrackId, getTrainingAttempts, getTrainingSessions, saveActiveTrackId } from "../src/storage";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
test("canonical repositories use individual immutable records and one active session", async () => {
 const ref = { trackId: "algorithms", itemId: "i", contentVersion: "v" }; const session = { id: "s", trackId: "algorithms", modeId: "m", requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [ref], optionOrderByItem: {}, activeForegroundMs: 0, contentVersion: "v", status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" }; const attempt = { id: "a", sessionId: "s", trackId: "algorithms", modeId: "m", item: ref, response: {}, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: ref, taxonomyOrSkillRefs: [] }, answeredAt: session.startedAt, committedAt: session.startedAt };
 await saveActiveTrackId("algorithms"); await addTrainingSession(session); await addTrainingAttempt(attempt); await addTrainingAttempt(attempt);
 assert.equal(await getActiveTrackId(), "algorithms"); assert.equal((await getTrainingSessions()).value.length, 1); assert.equal((await getTrainingAttempts()).value.length, 1);
 await assert.rejects(addTrainingAttempt({ ...attempt, response: { changed: true } }));
});
