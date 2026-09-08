import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { CODING_INTERVIEW_TRACK_ID, createDefaultGoal } from "../../domain";
import { type KeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  StaleGoalRevisionError,
  getGoal,
  getGoalSnapshot,
  saveGoal,
  saveGoalSnapshot,
} from "./goalRepository";

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("goal snapshots expose canonical revisions and CAS advances them", async () => {
  const goal = createDefaultGoal(CODING_INTERVIEW_TRACK_ID);
  assert.equal(await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID), null);

  const created = await saveGoalSnapshot(goal, null);
  assert.equal(created.revision, 1);
  assert.deepEqual(await getGoal(CODING_INTERVIEW_TRACK_ID), goal);

  const updated = await saveGoalSnapshot({ ...goal, preferredDays: ["fri", "mon"], weeklySessionTarget: 2 }, created.revision);
  assert.equal(updated.revision, 2);
  assert.deepEqual(updated.record.preferredDays, ["mon", "fri"]);
  assert.deepEqual(await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID), updated);
});

test("goal snapshot CAS rejects stale create and update without changing durable data", async () => {
  const goal = createDefaultGoal(CODING_INTERVIEW_TRACK_ID);
  const created = await saveGoalSnapshot(goal, null);

  await assert.rejects(saveGoalSnapshot(goal, null), (error: unknown) =>
    error instanceof StaleGoalRevisionError && error.expectedRevision === null && error.actualRevision === 1);
  await assert.rejects(saveGoalSnapshot({ ...goal, status: "paused" }, 9), (error: unknown) =>
    error instanceof StaleGoalRevisionError && error.expectedRevision === 9 && error.actualRevision === 1);
  assert.deepEqual(await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID), created);
});

test("legacy goal access stays compatible and snapshot writes keep goal validation", async () => {
  const goal = createDefaultGoal(CODING_INTERVIEW_TRACK_ID);
  await saveGoal(goal);
  assert.equal((await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID))?.revision, 1);

  await saveGoal({ ...goal, status: "paused" });
  assert.equal((await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID))?.revision, 2);
  assert.equal((await getGoal(CODING_INTERVIEW_TRACK_ID))?.status, "paused");

  await assert.rejects(saveGoalSnapshot({ ...goal, preferredDays: [], weeklySessionTarget: 0 }, 2), /requires at least one preferred day/);
});

test("goal snapshot CAS rejects a reentrant create for the same canonical key", async () => {
  const memory = new MemoryKeyValueStorage();
  const goal = createDefaultGoal(CODING_INTERVIEW_TRACK_ID);
  let nested: Promise<unknown> | null = null;
  let triggered = false;
  const storage: KeyValueStorage = {
    contains: (key) => memory.contains(key),
    getAllKeys: () => memory.getAllKeys(),
    getString: (key) => {
      if (!triggered && key.includes("goal")) {
        triggered = true;
        nested = saveGoalSnapshot({ ...goal, status: "paused" }, null);
      }
      return memory.getString(key);
    },
    remove: (key) => memory.remove(key),
    setString: (key, value) => memory.setString(key, value),
  };
  installKeyValueStorageForTests(storage);

  const outer = saveGoalSnapshot(goal, null);
  const results = await Promise.allSettled([outer, nested!]);
  const fulfilled = results.filter((result): result is PromiseFulfilledResult<unknown> => result.status === "fulfilled");
  const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal((fulfilled[0]!.value as { revision: number }).revision, 1);
  assert.ok(rejected[0]!.reason instanceof StaleGoalRevisionError);
  assert.equal((rejected[0]!.reason as StaleGoalRevisionError).expectedRevision, null);
  assert.equal((rejected[0]!.reason as StaleGoalRevisionError).actualRevision, 1);
  assert.equal((await getGoalSnapshot(CODING_INTERVIEW_TRACK_ID))?.revision, 1);
});
