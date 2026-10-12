import assert from "node:assert/strict";
import test from "node:test";
import { isGoalRecordForPolicy } from "../goals/goalContracts";
import { isGoalPolicyForTrack, resolveGoalPolicy, GoalPolicyUnavailableError, type GoalPolicy } from "../goals/goalPolicy";
import { isTrackAdmitted, type TrackAdmissionContext } from "./trackAdmissionContext";

test("an explicit neutral program context admits a non-product fixture without loading product policy", () => {
  const neutralAdmission: TrackAdmissionContext = Object.freeze({
    isAdmittedTrackId: (trackId) => trackId === "fixture-track",
  });
  const neutralPolicy: GoalPolicy = Object.freeze({
    trackId: "fixture-track",
    validGoalTemplateIds: Object.freeze(["build_foundations", "learn_at_own_pace"] as const),
  });
  const goal = {
    goalType: "build_foundations",
    preferredDays: ["mon"],
    status: "active",
    trackId: "fixture-track",
    weeklySessionTarget: 1,
  };

  assert.equal(isTrackAdmitted(neutralAdmission, "fixture-track"), true);
  assert.equal(isGoalPolicyForTrack(neutralPolicy, "fixture-track"), true);
  assert.equal(isGoalRecordForPolicy(goal, neutralPolicy), true);
  assert.equal(isTrackAdmitted(neutralAdmission, "unrelated-track"), false);
});

test("missing, throwing, or malformed admission and mismatched goal policies fail closed", () => {
  const throwingAdmission: TrackAdmissionContext = Object.freeze({ isAdmittedTrackId: () => { throw new Error("unavailable"); } });
  const malformedTruthyResult = { isAdmittedTrackId: () => "yes" };
  const policy: GoalPolicy = Object.freeze({ trackId: "fixture-track", validGoalTemplateIds: Object.freeze(["build_foundations"] as const) });

  assert.equal(Reflect.apply(isTrackAdmitted, undefined, [undefined, "fixture-track"]), false);
  assert.equal(isTrackAdmitted(throwingAdmission, "fixture-track"), false);
  assert.equal(Reflect.apply(isTrackAdmitted, undefined, [malformedTruthyResult, "fixture-track"]), false);
  assert.equal(isGoalPolicyForTrack(policy, "another-track"), false);
  assert.equal(Reflect.apply(isGoalPolicyForTrack, undefined, [{ ...policy, validGoalTemplateIds: ["unknown-template"] }, "fixture-track"]), false);
  assert.throws(() => resolveGoalPolicy(() => null, "fixture-track"), GoalPolicyUnavailableError);
  assert.throws(() => resolveGoalPolicy(() => ({ ...policy, trackId: "another-track" }), "fixture-track"), GoalPolicyUnavailableError);
});
