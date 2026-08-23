import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  createDefaultGoal,
  getTrackGoalTemplates,
  isGoalRecordForTrack,
  TRACK_DENSITY_DESCRIPTORS,
} from "../src/domain";
import { installMemoryStorage } from "./journalTestSupport";
import { getGoal, saveGoal } from "../src/storage/repositories";

beforeEach(() => installMemoryStorage());

test("goal templates are sourced from every canonical track descriptor", () => {
  for (const descriptor of TRACK_DENSITY_DESCRIPTORS) {
    const templates = getTrackGoalTemplates(descriptor.trackId);
    assert.deepEqual(templates, descriptor.goalTemplates);
    assert.ok(templates.length >= 4);
  }
});

test("default goal is valid and keeps optional date unset", () => {
  const goal = createDefaultGoal("coding-interview-dsa-problem-solving");
  assert.equal(goal.goalType, "prepare_for_an_interview");
  assert.equal(goal.weeklySessionTarget, 3);
  assert.deepEqual(goal.preferredDays, ["mon", "wed", "sat"]);
  assert.equal(goal.targetDate, undefined);
  assert.equal(isGoalRecordForTrack(goal, goal.trackId), true);
});

test("goal persistence guard rejects invalid cadence, date, track template, and extra fields", () => {
  const goal = createDefaultGoal("coding-interview-dsa-problem-solving");
  assert.equal(isGoalRecordForTrack({ ...goal, weeklySessionTarget: 0 }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, targetDate: "2027-02-29" }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, targetDate: "2027-01-15" }, goal.trackId), true);
  assert.equal(isGoalRecordForTrack({ ...goal, goalType: "prepare_for_a_certification" }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, unsupported: true }, goal.trackId), false);
});

test("goal repository persists one canonical record per track", async () => {
  const goal = { ...createDefaultGoal("coding-interview-dsa-problem-solving"), targetDate: "2027-01-15" };
  await saveGoal(goal);
  assert.deepEqual(await getGoal(goal.trackId), goal);
  assert.equal(await getGoal("backend-system-design-interview"), null);
});
