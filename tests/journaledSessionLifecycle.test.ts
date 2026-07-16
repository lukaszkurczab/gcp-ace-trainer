import assert from "node:assert/strict";
import test from "node:test";
import { commitSessionAbandonment, commitSessionCompletion, recoverPendingMutation } from "../src/application/learningMutations";
import { createForegroundTimerState } from "../src/domain";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getTrainingSessions, saveActiveForegroundTimer, saveTrainingSession } from "../src/storage/repositories";
import { getActiveMutationJournal } from "../src/storage/repositories/mutationJournalRepository";
import { installMemoryStorage, session, timestamp } from "./journalTestSupport";

test("session completion persists completed session before clearing active pointer", async () => { const storage = installMemoryStorage(); await saveTrainingSession(session()); await commitSessionCompletion(session("completed"), timestamp); assert.equal((await getTrainingSessions()).value[0]?.status, "completed"); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false); });
test("session completion replay is idempotent", async () => { installMemoryStorage(); await saveTrainingSession(session()); await commitSessionCompletion(session("completed"), timestamp); await commitSessionCompletion(session("completed"), timestamp); assert.equal((await getTrainingSessions()).value.length, 1); });
test("session completion clear failure recovers safely", async () => { const storage = installMemoryStorage(); await saveTrainingSession(session()); storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION }); await assert.rejects(() => commitSessionCompletion(session("completed"), timestamp)); storage.setFailurePlan(null); await recoverPendingMutation(); assert.equal((await getTrainingSessions()).value[0]?.status, "completed"); assert.equal(await getActiveMutationJournal(), null); });
test("session abandonment persists abandoned session before clearing active pointer", async () => { const storage = installMemoryStorage(); await saveTrainingSession(session()); await commitSessionAbandonment(session("abandoned"), timestamp); assert.equal((await getTrainingSessions()).value[0]?.status, "abandoned"); assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false); });
test("session abandonment replay is idempotent", async () => { installMemoryStorage(); await saveTrainingSession(session()); await commitSessionAbandonment(session("abandoned"), timestamp); await commitSessionAbandonment(session("abandoned"), timestamp); assert.equal((await getTrainingSessions()).value.length, 1); });
test("abandonment recovers identically after every durable write boundary", async () => {
  const boundaries = [
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession("session-1") },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ] as const;
  for (const boundary of boundaries) {
    const storage = installMemoryStorage();
    await saveTrainingSession(session());
    await saveActiveForegroundTimer(createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "algorithms", sessionId: "session-1", trackId: "algorithms", accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: timestamp, running: false }), null);
    storage.setFailurePlan(boundary);
    const abandon = () => commitSessionAbandonment(session("abandoned"), timestamp);
    await assert.rejects(abandon());
    storage.setFailurePlan(null);
    if (boundary.key === STORAGE_KEYS.ACTIVE_JOURNAL && boundary.kind === "fail_on_key_write") await abandon();
    else await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(), null, boundary.key);
    assert.deepEqual((await getTrainingSessions()).value, [session("abandoned")], boundary.key);
  }
});
test("abandonment does not navigate before durability", async () => { const storage = installMemoryStorage(); await saveTrainingSession(session()); storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL }); await assert.rejects(() => commitSessionAbandonment(session("abandoned"), timestamp)); assert.equal((await getTrainingSessions()).value[0]?.status, "active"); });
