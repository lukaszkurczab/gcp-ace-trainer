import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultGoal } from "../goals/goalContracts";
import { acceptedTargetFromGoal, InvalidLearningPlanError, isLearningPlanV1, normalizeLearningPlan, type LearningPlan } from "./learningPlan";
import { createLearningPlanSlotId } from "./slotIdentity";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";

const TRACK_ID = "coding-interview-dsa-problem-solving";

function plan(overrides: Partial<LearningPlan> = {}): LearningPlan {
  return {
    schemaVersion: 1,
    planId: "plan:one",
    trackId: TRACK_ID,
    goalRevision: 3,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "event", targetDate: "2027-03-15" },
    createdAt: "2027-01-01T10:00:00.000Z",
    updatedAt: "2027-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:one",
    slots: [
      { slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 },
      { slotId: createLearningPlanSlotId("slot:sat"), day: "sat", localTime: "09:30", sessionLength: 10 },
    ],
    ...overrides,
  };
}

test("LearningPlan v1 guard requires the complete strict shape and canonical slot order", () => {
  const valid = normalizeLearningPlan(plan());
  assert.equal(valid.schemaVersion, 1);
  assert.equal(Object.isFrozen(valid), true);
  assert.equal(Object.isFrozen(valid.slots), true);
  assert.equal(isLearningPlanV1({ ...plan(), slots: [{ ...plan().slots[0]!, day: "sat" }, { ...plan().slots[1]!, day: "mon" }] }), false);
  assert.equal(isLearningPlanV1({ ...plan(), slots: [{ ...plan().slots[0]!, day: "mon" }, { ...plan().slots[1]!, day: "mon" }] }), false);
  assert.equal(isLearningPlanV1({ ...plan(), slots: [{ ...plan().slots[0]!, localTime: "24:00" }, plan().slots[1]!] }), false);
  assert.equal(isLearningPlanV1({ ...plan(), acceptedTarget: { meaning: "none", targetDate: "2027-03-15" } }), false);
  assert.equal(isLearningPlanV1({ ...plan(), acceptedTarget: { meaning: "event", targetDate: "2027-02-29" } }), false);
  assert.equal(isLearningPlanV1({ ...plan(), commandId: "" }), false);
  assert.equal(isLearningPlanV1({ ...plan(), trackId: "unknown-track" }), false);
  assert.throws(() => normalizeLearningPlan({ ...plan(), trackId: "unknown-track" }), (error: unknown) => error instanceof InvalidLearningPlanError && error.code === "unknown_track");
  assert.equal(isLearningPlanV1({ ...plan(), extra: true }), false);
});

test("accepted target snapshot follows T4 goal meaning and canonical null dates", () => {
  const goal = createDefaultGoal(TRACK_ID);
  assert.deepEqual(acceptedTargetFromGoal(goal), { meaning: "event", targetDate: null });
  assert.deepEqual(acceptedTargetFromGoal({ ...goal, goalType: "learn_at_own_pace", targetDate: "2027-03-15" }), { meaning: "none", targetDate: null });
  assert.deepEqual(acceptedTargetFromGoal({ ...goal, goalType: "build_foundations", targetDate: "2027-03-15" }), { meaning: "deadline", targetDate: "2027-03-15" });
});
