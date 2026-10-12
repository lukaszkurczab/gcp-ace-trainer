import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test, { beforeEach } from "node:test";

import {
  createDefaultGoal as createDefaultGoalWithPolicy,
  GOAL_DAY_IDS,
  LAUNCH_TRACK_IDS,
  isGoalRecordShape,
  isGoalRecordForPolicy as isGoalRecordForPolicyWithPolicy,
  normalizeGoalRecord as normalizeGoalRecordWithPolicy,
  projectGoalTargetDate,
  TRACK_DENSITY_DESCRIPTORS,
  type GoalDay,
  type GoalRecord,
} from "../../domain";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import { TRACK_GOAL_POLICIES } from "../../domain/tracks/trackGoalPolicies";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { readCanonicalEnvelope, writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../../storage/errors";
import { STORAGE_KEYS } from "../../storage/keys";
import { getGoal as getGoalWithPolicy, saveGoal as saveGoalWithPolicy } from "../../storage/repositories";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";

beforeEach(() => installMemoryStorage());

const CODING_TRACK = "coding-interview-dsa-problem-solving" as const;
const codingPolicy = requireGoalPolicy(CODING_TRACK);
const createDefaultGoal = (trackId: string) => createDefaultGoalWithPolicy(requireGoalPolicy(trackId));
const normalizeGoalRecord = (value: GoalRecord) => normalizeGoalRecordWithPolicy(value, requireGoalPolicy(value.trackId));
const isGoalRecordForTrack = (value: unknown, trackId: string) => isGoalRecordForPolicyWithPolicy(value, requireGoalPolicy(trackId));
const getGoal = (trackId: string) => getGoalWithPolicy(trackId, requireGoalPolicy(trackId));
const saveGoal = (goal: GoalRecord) => saveGoalWithPolicy(goal, requireGoalPolicy(goal.trackId));

function goalWithDays(days: readonly GoalDay[], weeklySessionTarget: number): GoalRecord {
  return { ...createDefaultGoal(CODING_TRACK), preferredDays: days, weeklySessionTarget };
}

test("goal templates are sourced from every canonical track descriptor", () => {
  assert.deepEqual(TRACK_GOAL_POLICIES.map((policy) => policy.trackId), LAUNCH_TRACK_IDS);
  assert.deepEqual(TRACK_DENSITY_DESCRIPTORS.map((descriptor) => descriptor.trackId), LAUNCH_TRACK_IDS);
  for (const descriptor of TRACK_DENSITY_DESCRIPTORS) {
    const templates = requireGoalPolicy(descriptor.trackId).validGoalTemplateIds;
    assert.deepEqual(templates, descriptor.goalTemplates);
    assert.ok(templates.length >= 4);
  }
  const descriptorBytes = canonicalSerialize(TRACK_DENSITY_DESCRIPTORS);
  assert.equal(createHash("sha256").update(descriptorBytes).digest("hex"), "1e042fde65d262ca752c9bf57de4ed906b179b9b5fe4ff8ddee97e6157bbfe63");
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
  assert.equal(isGoalRecordShape(legacyTwoTarget), true);
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

test("goal normalizer omits an explicitly unset optional date from canonical records", () => {
  const goal = createDefaultGoal(CODING_TRACK);
  const explicitlyUnset = normalizeGoalRecord({ ...goal, targetDate: undefined });
  assert.equal(Object.hasOwn(explicitlyUnset, "targetDate"), false);
  assert.equal(canonicalSerialize(explicitlyUnset), canonicalSerialize(goal));

  const dated = normalizeGoalRecord({ ...goal, targetDate: "2027-01-15" });
  assert.equal(dated.targetDate, "2027-01-15");
  assert.equal(Object.hasOwn(dated, "targetDate"), true);
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
