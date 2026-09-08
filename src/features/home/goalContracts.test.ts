import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  createDefaultGoal,
  GOAL_DAY_IDS,
  getTrackGoalTemplates,
  isGoalRecordShapeForTrack,
  isGoalRecordForTrack,
  normalizeGoalRecord,
  projectGoalTargetDate,
  TRACK_DENSITY_DESCRIPTORS,
  type GoalDay,
  type GoalRecord,
} from "../../domain";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { readCanonicalEnvelope, writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../../storage/errors";
import { STORAGE_KEYS } from "../../storage/keys";
import { getGoal, saveGoal } from "../../storage/repositories";

beforeEach(() => installMemoryStorage());

const CODING_TRACK = "coding-interview-dsa-problem-solving" as const;

function goalWithDays(days: readonly GoalDay[], weeklySessionTarget: number): GoalRecord {
  return { ...createDefaultGoal(CODING_TRACK), preferredDays: days, weeklySessionTarget };
}

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
  const goal = createDefaultGoal(CODING_TRACK);
  assert.equal(isGoalRecordForTrack({ ...goal, weeklySessionTarget: 0 }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, targetDate: "2027-02-29" }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, targetDate: "2027-01-15" }, goal.trackId), true);
  assert.equal(isGoalRecordForTrack({ ...goal, goalType: "prepare_for_a_certification" }, goal.trackId), false);
  assert.equal(isGoalRecordForTrack({ ...goal, unsupported: true }, goal.trackId), false);
});

test("goal normalizer derives ordered cadence from legacy targets and every day count", () => {
  const goal = createDefaultGoal(CODING_TRACK);
  const legacyTwoTarget = goalWithDays(["sat", "mon", "wed"], 2);
  assert.equal(isGoalRecordShapeForTrack(legacyTwoTarget, CODING_TRACK), true);
  assert.deepEqual(normalizeGoalRecord(legacyTwoTarget), {
    ...goal,
    preferredDays: ["mon", "wed", "sat"],
    weeklySessionTarget: 3,
  });

  const legacyFourTarget = goalWithDays(["sun", "tue"], 4);
  assert.deepEqual(normalizeGoalRecord(legacyFourTarget), {
    ...goal,
    preferredDays: ["tue", "sun"],
    weeklySessionTarget: 2,
  });

  const cases: readonly (readonly [readonly GoalDay[], number])[] = [
    [["thu"], 7],
    [["sun", "mon", "fri"], 1],
    [GOAL_DAY_IDS, 4],
  ];
  for (const [days, legacyTarget] of cases) {
    const normalized = normalizeGoalRecord(goalWithDays(days, legacyTarget));
    assert.deepEqual(normalized.preferredDays, GOAL_DAY_IDS.filter((day) => days.includes(day)));
    assert.equal(normalized.weeklySessionTarget, days.length);
  }
});

test("goal repository normalizes legacy records on read without repairing storage", async () => {
  const storage = installMemoryStorage();
  const legacy = goalWithDays(["sat", "mon"], 4);
  const key = STORAGE_KEYS.goal(CODING_TRACK);
  writeCanonicalJson(key, legacy);
  const persistedBeforeRead = storage.getString(key);
  storage.resetCounters();

  assert.deepEqual(await getGoal(CODING_TRACK), {
    ...legacy,
    preferredDays: ["mon", "sat"],
    weeklySessionTarget: 2,
  });
  assert.equal(storage.operations.some((operation) => operation.kind === "write"), false);
  assert.equal(storage.getString(key), persistedBeforeRead);
  assert.deepEqual(readCanonicalEnvelope(key, (_value): _value is GoalRecord => true)?.payload, legacy);
});

test("empty legacy goals remain readable, but saving an empty selection is rejected without data loss", async () => {
  const storage = installMemoryStorage();
  const emptyLegacy = goalWithDays([], 4);
  const key = STORAGE_KEYS.goal(CODING_TRACK);
  writeCanonicalJson(key, emptyLegacy);
  const persistedBeforeSave = storage.getString(key);

  assert.deepEqual(await getGoal(CODING_TRACK), { ...emptyLegacy, weeklySessionTarget: 0 });
  await assert.rejects(() => saveGoal(emptyLegacy), /requires at least one preferred day/);
  assert.equal(storage.getString(key), persistedBeforeSave);
});

test("goal repository rejects a zero target with selected days without repairing the record", async () => {
  const storage = installMemoryStorage();
  const malformed = goalWithDays(["mon"], 0);
  const key = STORAGE_KEYS.goal(CODING_TRACK);
  writeCanonicalJson(key, malformed);
  const persistedBeforeRead = storage.getString(key);

  await assert.rejects(() => getGoal(CODING_TRACK), UnsupportedStoredRecordError);
  assert.equal(storage.getString(key), persistedBeforeRead);
});

test("saving a goal persists the normalized cadence while preserving other fields", async () => {
  const unsorted = {
    ...createDefaultGoal(CODING_TRACK),
    goalType: "build_foundations" as const,
    preferredDays: ["sun", "mon", "fri"] as const,
    weeklySessionTarget: 1,
    targetDate: "2027-01-15",
    status: "paused" as const,
  };
  await saveGoal(unsorted);
  assert.deepEqual(await getGoal(CODING_TRACK), {
    ...unsorted,
    preferredDays: ["mon", "fri", "sun"],
    weeklySessionTarget: 3,
  });
});

test("goal repository persists one canonical record per track", async () => {
  const goal = { ...createDefaultGoal(CODING_TRACK), targetDate: "2027-01-15" };
  await saveGoal(goal);
  assert.deepEqual(await getGoal(goal.trackId), goal);
  assert.equal(await getGoal("backend-system-design-interview"), null);
});

test("target-date projection follows goal type and explicit own-pace saves remove only legacy dates", async () => {
  const event = { ...createDefaultGoal(CODING_TRACK), targetDate: "2027-01-15" };
  assert.deepEqual(projectGoalTargetDate(event), { meaning: "event", targetDate: "2027-01-15", sessionBoundary: "strictly_before", completionBehavior: "attainability", availability: "present" });
  assert.deepEqual(projectGoalTargetDate({ ...event, goalType: "build_foundations" }), { meaning: "deadline", targetDate: "2027-01-15", sessionBoundary: "inclusive", completionBehavior: "attainability", availability: "present" });
  assert.deepEqual(projectGoalTargetDate({ ...event, goalType: "refresh_and_maintain_skills" }), { meaning: "checkpoint", targetDate: "2027-01-15", sessionBoundary: "inclusive", completionBehavior: "no_automatic_completion", availability: "present" });
  assert.deepEqual(projectGoalTargetDate({ ...event, goalType: "build_foundations", targetDate: undefined }), { meaning: "deadline", sessionBoundary: "inclusive", completionBehavior: "attainability", availability: "missing" });
  const ownPace = { ...event, goalType: "learn_at_own_pace" as const };
  assert.equal(projectGoalTargetDate(ownPace).availability, "ignored_legacy");
  await saveGoal(ownPace);
  assert.equal((await getGoal(CODING_TRACK))?.targetDate, undefined);
});
