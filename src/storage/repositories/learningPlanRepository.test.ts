import assert from "node:assert/strict";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import test, { beforeEach } from "node:test";

import { createDefaultGoal, createLearningPlanSlotId, type LearningPlan, type LearningPlanV1 } from "../../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { saveGoalSnapshot } from "./goalRepository";
import { UnsupportedStoredRecordError } from "../errors";
import {
  getLearningPlanSnapshot,
  LearningPlanCommandConflictError,
  saveLearningPlanAtomically,
  StaleLearningPlanStorageRevisionError,
} from "./learningPlanRepository";
import { STORAGE_KEYS } from "../keys";
import { withCanonicalWriteLocks, writeCanonicalJson } from "./canonicalRecordCodec";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const TEST_ARTIFACT_SHA256 = "a".repeat(64);

function plan(overrides: Partial<LearningPlanV1> = {}): LearningPlan {
  return {
    schemaVersion: 1,
    planId: "plan:one",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    artifactSha256: TEST_ARTIFACT_SHA256,
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
  await saveGoalSnapshot(createDefaultGoal(requireGoalPolicy(TRACK_ID)), null, requireGoalPolicy(TRACK_ID));
});

test("persistent plan read returns its canonical envelope revision", () => {
  const saved = saveLearningPlanAtomically({ policy: requireGoalPolicy(plan().trackId), plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  const read = getLearningPlanSnapshot(TRACK_ID, requireGoalPolicy(TRACK_ID));
  assert.deepEqual(read, saved);
  assert.equal(read?.revision, 1);
  assert.deepEqual(read?.plan, plan());
});

test("product repository rejects an unknown-track plan on read and write without rewriting its bytes", () => {
  const unknownPlan = plan({ trackId: "unknown-product-track" });
  const beforeWrite = storage.snapshot();

  assert.throws(() => saveLearningPlanAtomically({
    policy: requireGoalPolicy(TRACK_ID),
    plan: unknownPlan,
    expectedGoalRevision: 1,
    expectedPlanStorageRevision: null,
  }), /matching goal policy is required/);
  assert.deepEqual(storage.snapshot(), beforeWrite, "a policy mismatch must be rejected before any plan write");

  const key = STORAGE_KEYS.learningPlan(TRACK_ID);
  writeCanonicalJson(key, unknownPlan);
  const rawUnknownPlan = storage.getString(key);
  assert.throws(() => getLearningPlanSnapshot(TRACK_ID, requireGoalPolicy(TRACK_ID)), UnsupportedStoredRecordError);
  assert.equal(storage.getString(key), rawUnknownPlan, "a product read must preserve the unsupported plan envelope");
});

test("dual-key CAS rejects stale goal and plan revisions and accepts one idempotent command retry", () => {
  const first = saveLearningPlanAtomically({ policy: requireGoalPolicy(plan().trackId), plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null });
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan().trackId), plan: plan(), expectedGoalRevision: 999, expectedPlanStorageRevision: 999 }), /Goal expected revision is stale/);
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan({ commandId: "command:other", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }).trackId), plan: plan({ commandId: "command:other", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }), expectedGoalRevision: 1, expectedPlanStorageRevision: null }), StaleLearningPlanStorageRevisionError);
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan({ commandId: "command:third", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }).trackId), plan: plan({ commandId: "command:third", planRevision: 2, updatedAt: "2027-01-02T10:00:00.000Z" }), expectedGoalRevision: 2, expectedPlanStorageRevision: 1 }), /Goal expected revision is stale/);
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan({ commandId: "command:one", updatedAt: "2027-01-03T10:00:00.000Z" }).trackId), plan: plan({ commandId: "command:one", updatedAt: "2027-01-03T10:00:00.000Z" }), expectedGoalRevision: 1, expectedPlanStorageRevision: 1 }), LearningPlanCommandConflictError);
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
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan().trackId), plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null }));
  assert.deepEqual(saveLearningPlanAtomically({ policy: requireGoalPolicy(plan().trackId), plan: plan(), expectedGoalRevision: 1, expectedPlanStorageRevision: null }).plan, plan());

  const failed = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(failed);
  failed.setString(goalKey, previousGoal);
  failed.setFailurePlan({ kind: "fail_on_key_write", key: planKey });
  assert.throws(() => saveLearningPlanAtomically({ policy: requireGoalPolicy(plan({ commandId: "command:failure" }).trackId), plan: plan({ commandId: "command:failure" }), expectedGoalRevision: 1, expectedPlanStorageRevision: null }));
  assert.equal(getLearningPlanSnapshot(TRACK_ID, requireGoalPolicy(TRACK_ID)), null);
});
