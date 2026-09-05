import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { loadActivitySessionRecords, createActivityReadOwner, type ActivitySessionRecord } from "./activityReadModels";
import { StorageReadError, CorruptStoredRecordError } from "../storage/errors";
import { addTrainingAttempt, saveTrainingSession } from "../storage/repositories";
import { STORAGE_KEYS } from "../storage/keys";
import { installMemoryStorage, attempt, session } from "../testing/journalTestSupport";

beforeEach(() => installMemoryStorage());

test("Activity read model keeps terminal history semantics and includes completed sessions without answers", async () => {
  const active = session("active", "active");
  const completedWithoutAnswers = session("completed", "completed-without-answers");
  const abandonedWithoutAnswers = session("abandoned", "abandoned-without-answers");
  const { completedAt: _completedAt, ...abandonedWithAttempt } = session("abandoned", "abandoned-with-attempt");

  await saveTrainingSession(active);
  await addTrainingAttempt(attempt("attempt-for-active", active.id));
  await saveTrainingSession(completedWithoutAnswers);
  await saveTrainingSession(abandonedWithoutAnswers);
  await saveTrainingSession(abandonedWithAttempt);
  await addTrainingAttempt(attempt("attempt-for-abandoned", abandonedWithAttempt.id));

  const records = await loadActivitySessionRecords();
  const recordsById = new Map(records.map((record) => [record.session.id, record]));

  assert.deepEqual([...recordsById.keys()].sort(), ["abandoned-with-attempt", "completed-without-answers"]);
  assert.equal(recordsById.get("completed-without-answers")?.attemptCount, 0);
  assert.equal(recordsById.get("completed-without-answers")?.result, null);
  assert.equal(recordsById.get("abandoned-with-attempt")?.attemptCount, 1);
});

test("Activity read model surfaces a corrupt canonical result instead of presenting an empty history", async () => {
  const completed = session("completed", "completed-with-corrupt-result");
  const storage = installMemoryStorage();
  await saveTrainingSession(completed);
  storage.setString(STORAGE_KEYS.trainingSessionResult(completed.id), "{");

  await assert.rejects(() => loadActivitySessionRecords(), CorruptStoredRecordError);
});

test("Activity read model treats repository issues as an explicit storage failure", async () => {
  await assert.rejects(
    () => loadActivitySessionRecords({
      getAttempts: async () => ({ ok: true, value: [] }),
      getResult: async () => null,
      getSessions: async () => ({
        ok: true,
        value: [],
        issues: [{ key: "patternly:canonical:v1:training-session-index", message: "read failed", operation: "read" }],
      }),
    }),
    StorageReadError,
  );
});

test("Activity read model reuses the caller's attempts read when supplied", async () => {
  const completed = session("completed", "activity-attempt-read-reuse");
  let attemptsReads = 0;

  const records = await loadActivitySessionRecords({
    getAttempts: async () => {
      attemptsReads += 1;
      return { ok: true, value: [] };
    },
    getResult: async () => null,
    getSessions: async () => ({ ok: true, value: [completed] }),
  });

  assert.equal(attemptsReads, 1);
  assert.equal(records[0]?.session.id, completed.id);
  assert.equal(records[0]?.attemptCount, 0);
});

test("Activity read owner invalidates late focus reads and lets the newest retry win", async () => {
  const first = deferred<readonly ActivitySessionRecord[]>();
  const retry = deferred<readonly ActivitySessionRecord[]>();
  const late = deferred<readonly ActivitySessionRecord[]>();
  let reads = 0;
  const owner = createActivityReadOwner(() => ++reads === 1 ? first.promise : reads === 2 ? retry.promise : late.promise);

  const firstToken = owner.begin();
  const firstRead = owner.resolve(firstToken);
  const retryToken = owner.begin();
  const retryRead = owner.resolve(retryToken);

  retry.resolve([]);
  first.resolve([]);

  assert.deepEqual(await retryRead, { kind: "ready", records: [] });
  assert.deepEqual(await firstRead, { kind: "stale" });

  const latestToken = owner.begin();
  const latestRead = owner.resolve(latestToken);
  owner.invalidate(latestToken);
  late.reject(new Error("late focus read"));
  assert.deepEqual(await latestRead, { kind: "stale" });
});

test("Activity read owner keeps current read failures explicit", async () => {
  const error = new Error("activity read failed");
  const owner = createActivityReadOwner(async () => { throw error; });
  const outcome = await owner.resolve(owner.begin());

  assert.deepEqual(outcome, { error, kind: "error" });
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}
