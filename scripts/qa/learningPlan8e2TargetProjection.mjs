// Run from APP with Node22: node --import tsx scripts/qa/learningPlan8e2TargetProjection.mjs
// Only a pure date projection: never create a proposal or access learner storage.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import targetSemantics from "../../src/domain/goals/goalTargetDateSemantics.ts";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const freeze = JSON.parse(read(".agent/private/8e2-20261028/oracle-freeze.json"));
const rawExpected = read(".agent/private/8e2-20261028/expected-before-actual.json");
assert.equal(createHash("sha256").update(rawExpected).digest("hex"), freeze.expected_sha256);
const expected = JSON.parse(rawExpected);
const handoff = JSON.parse(read(".agent/private/8e1-20261028/selected-native-handoff.json"));
assert.equal(expected.scope_id, handoff.execution_scope_id);
const { goalType, preferredDays, targetDate, weeklySessionTarget } = handoff.parameters;
// status is structurally required, ignored by this leaf; this is not a stored goal.
const input = { goalType, preferredDays, targetDate, weeklySessionTarget, trackId: handoff.trackId, status: "active" };
const actual = targetSemantics.projectGoalTargetDate(input);
const wanted = { meaning: expected.target.meaning, targetDate: expected.target.date,
  sessionBoundary: expected.target.sessionBoundary, completionBehavior: expected.target.completionBehavior,
  availability: expected.target.availability };
assert.deepEqual(actual, wanted);
console.log(JSON.stringify({ task_id: "8E.2", scope_id: expected.scope_id, sequence: 2,
  method: "Pure projectGoalTargetDate on explicit handoff fields, after independent oracle freeze",
  input, expected: wanted, actual, verdict: "PASS",
  expected_sha256: freeze.expected_sha256, generator_actual: null, native_actual: null,
  limitations: "No coordinator, generator, calendar, cost estimator, persistence or native case executed; no profile snapshot exists." }, null, 2));
