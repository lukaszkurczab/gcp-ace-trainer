import assert from "node:assert/strict";
import test from "node:test";

import { createLearningPlanSlotId } from "../../domain/learning/slotIdentity";
import { normalizeLearningPlan, type GoalSnapshot, type LearningPlan } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { projectTargetDateGuidance, type TargetDateGuidanceInput } from "./targetDateGuidance";
import type { PaceForecast } from "../../domain/learning/paceForecast";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const PIN = TEST_CONTENT_PACKAGE_PIN;

function plan(overrides: Partial<LearningPlan> = {}): LearningPlan {
  return normalizeLearningPlan({
    schemaVersion: 1,
    planId: "plan:guidance",
    trackId: TRACK_ID,
    goalRevision: 3,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: PIN,
    acceptedTarget: { meaning: "deadline", targetDate: "2026-02-20" },
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:guidance",
    slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
    ...overrides,
  });
}

function goal(overrides: Partial<GoalSnapshot["record"]> = {}, revision = 3): GoalSnapshot {
  return {
    record: {
      goalType: "build_foundations",
      preferredDays: ["mon", "wed", "sat"],
      status: "active",
      trackId: TRACK_ID,
      weeklySessionTarget: 3,
      targetDate: "2026-02-20",
      ...overrides,
    },
    revision,
  };
}

function availableForecast(currentPlan: LearningPlan = plan(), overrides: Partial<Extract<PaceForecast, { kind: "available" }>> = {}): Extract<PaceForecast, { kind: "available" }> {
  return {
    kind: "available",
    source: {
      planId: currentPlan.planId,
      planRevision: currentPlan.planRevision,
      goalRevision: currentPlan.goalRevision,
      target: currentPlan.acceptedTarget,
      contentPackagePin: currentPlan.contentPackagePin,
    },
    requiredQuestionsPerSession: 2,
    requiredQuestionsPerWeek: 4,
    actualQuestionsPerWeek: 3.5,
    projectedCompletionDate: "2026-02-15",
    targetDate: currentPlan.acceptedTarget.targetDate ?? "2026-02-20",
    remainingRequiredAttempts: 4,
    remainingPlannedCapacity: 20,
    status: "on_track",
    trend: "stable",
    ...overrides,
  };
}

function input(overrides: Partial<TargetDateGuidanceInput> = {}): TargetDateGuidanceInput {
  const currentPlan = plan();
  return {
    currentGoal: goal(),
    acceptedPlan: currentPlan,
    currentVerifiedPackagePin: PIN,
    c3Result: "in_progress",
    today: "2026-02-01",
    completedFacts: { sessions: [], attempts: [] },
    paceForecast: availableForecast(currentPlan),
    ...overrides,
  };
}

test("applies no-goal, paused-goal, no-plan and freshness precedence", () => {
  assert.equal(projectTargetDateGuidance(input({ currentGoal: null, acceptedPlan: null })).state, "no_goal");
  assert.equal(projectTargetDateGuidance(input({ currentGoal: goal({ status: "paused" }), acceptedPlan: null })).state, "goal_paused");
  assert.equal(projectTargetDateGuidance(input({ acceptedPlan: null })).state, "no_plan");
  assert.equal(projectTargetDateGuidance(input({ currentGoal: goal({ targetDate: "2026-02-21" }) })).reason, "target_changed");
  assert.equal(projectTargetDateGuidance(input({ currentVerifiedPackagePin: { ...PIN, contentReleaseId: "other-release" } })).reason, "package_changed");
  assert.equal(projectTargetDateGuidance(input({ currentGoal: goal({}, 4) })).reason, "cadence_changed");
  const both = projectTargetDateGuidance(input({ currentGoal: goal({ targetDate: "2026-02-21" }, 4), currentVerifiedPackagePin: { ...PIN, contentReleaseId: "other-release" } }));
  assert.equal(both.reason, "target_changed");
});

test("maps plan paused, completed, overdue boundaries and open-ended targets", () => {
  const paused = projectTargetDateGuidance(input({ acceptedPlan: plan({ status: "paused" }) }));
  assert.deepEqual(paused, { ...paused, state: "plan_paused", reason: "plan_paused" });
  assert.equal(paused.home.primary.kind, "resume_plan");

  const completed = projectTargetDateGuidance(input({ c3Result: "completed" }));
  assert.equal(completed.state, "completed");
  assert.deepEqual(completed.facts, {
    requiredPace: { kind: "unavailable", reason: "completed" },
    actualPace: { kind: "unavailable", reason: "completed" },
    forecast: { kind: "text", value: "completed" },
    target: { kind: "date", value: "2026-02-20" },
  });

  const eventPlan = plan({ acceptedTarget: { meaning: "event", targetDate: "2026-02-01" } });
  const eventGoal = goal({ goalType: "prepare_for_an_interview", targetDate: "2026-02-01" });
  const overdueEvent = projectTargetDateGuidance(input({ acceptedPlan: eventPlan, currentGoal: eventGoal, today: "2026-02-01", paceForecast: { kind: "unavailable", reason: "no_future_slots" } }));
  assert.equal(overdueEvent.state, "overdue");
  const deadlineEqual = projectTargetDateGuidance(input({ today: "2026-02-20", paceForecast: { kind: "unavailable", reason: "no_future_slots" } }));
  assert.equal(deadlineEqual.state, "unreachable");

  const openPlan = plan({ acceptedTarget: { meaning: "none", targetDate: null } });
  const openGoal = goal({ goalType: "learn_at_own_pace", targetDate: undefined });
  const open = projectTargetDateGuidance(input({ acceptedPlan: openPlan, currentGoal: openGoal, paceForecast: { kind: "unavailable", reason: "unknown_completion_rule" } }));
  assert.equal(open.state, "open_ended");
  assert.equal(open.reason, "no_target");
  assert.deepEqual(open.facts.requiredPace, { kind: "text", value: "flexible" });
});

test("maps capacity, typed forecast status and all unavailable reasons without recomputing", () => {
  const shortfall = projectTargetDateGuidance(input({ paceForecast: availableForecast(plan(), { remainingPlannedCapacity: 3, remainingRequiredAttempts: 4 }) }));
  assert.equal(shortfall.state, "unreachable");
  assert.equal(shortfall.reason, "insufficient_sessions");
  assert.equal(shortfall.progress.secondary?.kind, "adjust_goal");

  const exactCapacity = projectTargetDateGuidance(input({ paceForecast: availableForecast(plan(), { remainingPlannedCapacity: 4, remainingRequiredAttempts: 4 }) }));
  assert.equal(exactCapacity.state, "on_track");

  const risk = projectTargetDateGuidance(input({ paceForecast: availableForecast(plan(), { status: "at_risk", projectedCompletionDate: "2026-02-21" }) }));
  assert.equal(risk.state, "at_risk");
  assert.equal(risk.progress.secondary?.kind, "adjust_schedule");

  const onTrack = projectTargetDateGuidance(input({ paceForecast: availableForecast() }));
  assert.equal(onTrack.state, "on_track");
  assert.deepEqual(onTrack.facts.requiredPace, { kind: "numeric", value: 4, unit: "questions_per_week" });
  assert.equal(onTrack.home.primary.kind, "start_next_session");

  const reasons = ["unknown_completion_rule", "insufficient_elapsed_evidence", "calculation_error", "no_target"] as const;
  for (const reason of reasons) {
    const guidance = projectTargetDateGuidance(input({ paceForecast: { kind: "unavailable", reason } }));
    assert.equal(guidance.state, "unavailable");
    assert.equal(guidance.reason, reason);
    assert.deepEqual(guidance.facts.requiredPace, { kind: "unavailable", reason });
    if (reason === "insufficient_elapsed_evidence") assert.equal(guidance.home.primary.kind, "continue_plan");
    else if (reason === "calculation_error") assert.equal(guidance.home.primary.kind, "try_again");
    else assert.equal(guidance.home.primary.kind, "adjust_goal");
  }
  assert.equal(projectTargetDateGuidance(input({ paceForecast: { kind: "unavailable", reason: "no_future_slots" } })).state, "unreachable");
});

test("requires full forecast identity and maps malformed foreign forecasts to calculation_error", () => {
  const currentPlan = plan();
  const mismatchedPlanId = availableForecast(currentPlan, { source: { ...availableForecast(currentPlan).source, planId: "other-plan" } });
  const guidance = projectTargetDateGuidance(input({ paceForecast: mismatchedPlanId }));
  assert.equal(guidance.state, "unavailable");
  assert.equal(guidance.reason, "calculation_error");
  assert.equal(guidance.home.primary.kind, "try_again");
  assert.deepEqual(guidance.facts.target, { kind: "date", value: "2026-02-20" });

  const mismatchedPin = availableForecast(currentPlan, { source: { ...availableForecast(currentPlan).source, contentPackagePin: { ...PIN, packageVersion: "other-version" } } });
  assert.equal(projectTargetDateGuidance(input({ paceForecast: mismatchedPin })).reason, "calculation_error");
  assert.equal(projectTargetDateGuidance(input({ paceForecast: { kind: "available", source: {} } as unknown as PaceForecast })).reason, "calculation_error");
});

test("returns frozen, typed presentation values and ignores immutable fact arrays", () => {
  const facts = { sessions: [], attempts: [] };
  const before = structuredClone(facts);
  const result = projectTargetDateGuidance(input({ completedFacts: facts }));
  assert.deepEqual(facts, before);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.facts), true);
  assert.equal(Object.isFrozen(result.home), true);
  assert.equal(Object.isFrozen(result.progress), true);
  assert.equal(Object.isFrozen(result.facts.requiredPace), true);
});
