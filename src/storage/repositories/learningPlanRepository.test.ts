import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createDefaultGoal, createLearningPlanSlotId, type LearningPlan } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { saveGoalSnapshot } from "./goalRepository";
import {
  getLearningPlanSnapshot,
  LearningPlanCommandConflictError,
  saveLearningPlanAtomically,
  StaleLearningPlanStorageRevisionError,
} from "./learningPlanRepository";
import { STORAGE_KEYS } from "../keys";
import { withCanonicalWriteLocks } from "./canonicalRecordCodec";

const TRACK_ID = "coding-interview-dsa-problem-solving";

function plan(overrides: Partial<LearningPlan> = {}): LearningPlan {
  return {
    schemaVersion: 1,
    planId: "plan:one",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "event", targetDate: null },
    createdAt: "2027-01-01T10:00:00.000Z",
    updatedAt: "2027-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:one",
    slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
    ...overrides,
  };
}

let storage: MemoryKeyValueStorage;
beforeEach(async () => {
  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await saveGoalSnapshot(createDefaultGoal(TRACK_ID), null);
});

test("persistent plan read returns its canonical envelope revision", () => {
  const saved = saveLearningPlanAtomically({ plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  const read = getLearningPlanSnapshot(TRACK_ID);
  assert.deepEqual(read, saved);
  assert.equal(read?.revision, 1);
  assert.deepEqual(read?.plan, plan());
});

test("dual-key CAS rejects stale goal and plan revisions and accepts one idempotent command retry", () => {
  const first = saveLearningPlanAtomically({ plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  assert.throws(() => saveLearningPlanAtomically({ plan: plan(), expectedGoalRevision: 999, expectedPlanStorageRevision: 999 }), /Goal expected revision is stale/);
  assert.throws(() => saveLearningPlanAtomically({ plan: plan({ commandId: "command:other", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }), expectedGoalRevision: 1, expectedPlanStorageRevision: null }), StaleLearningPlanStorageRevisionError);
  assert.throws(() => saveLearningPlanAtomically({ plan: plan({ commandId: "command:third", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }), expectedGoalRevision: 2, expectedPlanStorageRevision: 1 }), /Goal expected revision is stale/);
  assert.throws(() => saveLearningPlanAtomically({ plan: plan({ commandId: "command:one", updatedAt: "2027-01-03T10:00:00.000Z" }), expectedGoalRevision: 1, expectedPlanStorageRevision: 1 }), LearningPlanCommandConflictError);
});

test("compound lock sorts and deduplicates keys and rejects reentrant acquisition", () => {
  const observed: string[] = [];
  withCanonicalWriteLocks(["plan", "goal", "plan"], () => {
    observed.push("inside");
    assert.throws(() => withCanonicalWriteLocks(["goal"], () => undefined), /already in progress/);
  });
  assert.deepEqual(observed, ["inside"]);
  assert.doesNotThrow(() => withCanonicalWriteLocks(["goal", "plan"], () => undefined));
});

test("write uncertainty can be retried by command id, while a failure before persistence is not a false success", () => {
  const planKey = STORAGE_KEYS.learningPlan(TRACK_ID);
  let uncertain = true;
  class UncertainStorage extends MemoryKeyValueStorage {
    override setString(key: string, value: string): void {
      super.setString(key, value);
      if (key === planKey && uncertain) {
        uncertain = false;
        throw new Error("response lost after write");
      }
    }
  }
  const uncertainStorage = new UncertainStorage();
  installKeyValueStorageForTests(uncertainStorage);
  // Recreate the expected goal in the replacement store.
  const goalKey = STORAGE_KEYS.goal(TRACK_ID);
  const previousGoal = storage.getString(goalKey);
  if (!previousGoal) throw new Error("test goal was not written");
  uncertainStorage.setString(goalKey, previousGoal);
  assert.throws(() => saveLearningPlanAtomically({ plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null }));
  assert.deepEqual(saveLearningPlanAtomically({ plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null }).plan, plan());

  const failed = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(failed);
  failed.setString(goalKey, previousGoal);
  failed.setFailurePlan({ kind: "fail_on_key_write", key: planKey });
  assert.throws(() => saveLearningPlanAtomically({ plan: plan({ commandId: "command:failure" }), expectedGoalRevision: 1, expectedPlanStorageRevision: null }));
  assert.equal(getLearningPlanSnapshot(TRACK_ID), null);
});
