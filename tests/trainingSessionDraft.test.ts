import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSessionDraft } from "../src/domain";
import { clearPatternlyLocalHistory } from "../src/features/home/localReset";
import {
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  saveTrainingSession,
  saveTrainingSessionDraft,
} from "../src/storage/repositories";
import { installMemoryStorage, session, timestamp } from "./journalTestSupport";

const draftConfiguration = { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "algorithms", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } as const;

test("an occurrence-keyed draft persists, edits, and resumes without learning side effects", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "algorithms-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const first = createTrainingSessionDraft({
    sessionId: active.id,
    trackId: active.trackId,
    responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["a"] } },
    updatedAt: timestamp,
  });
  await saveTrainingSessionDraft(first);
  const edited = createTrainingSessionDraft({
    ...first,
    responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["b"] } },
    updatedAt: "2026-07-15T10:01:00.000Z",
  });
  await saveTrainingSessionDraft(edited);
  await assert.doesNotReject(saveTrainingSessionDraft(edited));
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({ ...edited, responsesByOccurrenceId: {}, updatedAt: edited.updatedAt })), /already persisted update time/);

  const resumed = await getActiveTrainingSessionDraft();
  assert.deepEqual(resumed, edited);
  assert.ok(Object.isFrozen(resumed));
  assert.ok(Object.isFrozen(resumed?.responsesByOccurrenceId["occurrence-1"]));
  const removed = createTrainingSessionDraft({
    ...edited,
    responsesByOccurrenceId: {},
    updatedAt: "2026-07-15T10:02:00.000Z",
  });
  await saveTrainingSessionDraft(removed);
  assert.deepEqual(await getActiveTrainingSessionDraft(), removed);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("draft persistence rejects unknown occurrences and mismatched session scope", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "algorithms-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({
    sessionId: active.id,
    trackId: active.trackId,
    responsesByOccurrenceId: { "unknown-occurrence": { selectedOptionIds: ["a"] } },
    updatedAt: timestamp,
  })), /outside the active session plan/);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({
    sessionId: "other-session",
    trackId: active.trackId,
    responsesByOccurrenceId: {},
    updatedAt: timestamp,
  })), /does not match the active session/);
});

test("immediate-feedback sessions cannot persist draft responses", async () => {
  installMemoryStorage();
  const active = session();
  await saveTrainingSession(active);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp })), /does not permit persisted draft/);
});

test("clear local history removes the resumable draft", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "algorithms-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp }));
  await clearPatternlyLocalHistory();
  assert.equal(await getActiveTrainingSessionDraft(), null);
});
