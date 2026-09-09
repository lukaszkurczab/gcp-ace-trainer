import assert from "node:assert/strict";
import test from "node:test";

import {
  createContentPackagePin,
  createDefaultGoal,
  createLearningPlanSlotId,
  createTrainingSession,
  normalizeLearningPlan,
  type GoalSnapshot,
  type LearningPlan,
  type TrackId,
} from "../../domain";
import { projectTargetDateGuidance } from "../../application/learningPlan";
import type { HomePlanReady, HomePlanSnapshot } from "../../application/homePlanSnapshotReader";
import { buildProgressPlanPresentationModel } from "./progressPlanPresentationModel";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const PIN = createContentPackagePin({ packageIdentity: "a".repeat(64), packageVersion: "1.0.0", contentReleaseId: "release-1" });

function plan(): LearningPlan {
  return normalizeLearningPlan({
    schemaVersion: 1,
    planId: "plan:progress-presentation",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: PIN,
    acceptedTarget: { meaning: "event", targetDate: null },
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:progress-presentation",
    slots: [{ slotId: createLearningPlanSlotId("progress:slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
}

function goal(status: "active" | "paused" = "active"): GoalSnapshot {
  return { record: { ...createDefaultGoal(TRACK_ID), status }, revision: 1 };
}

function guidanceFor(currentGoal: GoalSnapshot | null, acceptedPlan: LearningPlan | null, c3Result: "in_progress" | "completed" = "in_progress") {
  return projectTargetDateGuidance({
    currentGoal,
    acceptedPlan,
    currentVerifiedPackagePin: PIN,
    c3Result,
    today: "2026-09-09",
    completedFacts: { sessions: [], attempts: [] },
    paceForecast: { kind: "unavailable", reason: "no_target" },
  });
}

function ready(completion: HomePlanReady["completion"] = { kind: "in_progress", qualifyingAttemptCount: 8, requiredAttemptCount: 10, rollingWindowSize: 10 }): HomePlanReady {
  const acceptedPlan = plan();
  const currentGoal = goal();
  return {
    kind: "ready",
    trackId: TRACK_ID,
    identity: {
      trackId: TRACK_ID,
      goalRevision: 1,
      planId: acceptedPlan.planId,
      planRevision: acceptedPlan.planRevision,
      planStorageRevision: 2,
      contentVersion: acceptedPlan.contentVersion,
      contentPackagePin: acceptedPlan.contentPackagePin,
      timezone: acceptedPlan.timezone,
    },
    goal: currentGoal,
    plan: acceptedPlan,
    planSnapshot: { plan: acceptedPlan, revision: 2 },
    today: "2026-09-09",
    day: { date: "2026-09-09", day: "wed", status: "rest", slot: null, terminalSessionId: null },
    activeSession: null,
    dueReviewCount: 0,
    dueReviewIds: [],
    completion,
    session: { modeId: "learn", topicId: "complexity_and_constraints", sessionLength: 10, areaLabel: "Complexity and constraints" },
    paceForecast: { kind: "unavailable", reason: "no_target" },
    guidance: guidanceFor(currentGoal, acceptedPlan, completion.kind === "completed" ? "completed" : "in_progress"),
  };
}

test("Progress model presents canonical guidance and clamps C3 completion ratio", () => {
  const model = buildProgressPlanPresentationModel({ snapshot: ready(), activeTrackId: TRACK_ID, locale: "en" });
  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") return;
  assert.equal(model.completion.qualifyingAttemptCount, 8);
  assert.equal(model.completion.requiredAttemptCount, 10);
  assert.equal(model.completion.ratio, 0.8);
  assert.equal(model.guidance.facts.length, 4);
  assert.equal(model.session.sessionLength, 10);
  assert.equal(model.primaryAction?.kind, "continue_plan");
  assert.equal(Object.isFrozen(model), true);
});

test("Progress model never creates a self-link for completed guidance", () => {
  const snapshot = ready({ kind: "completed", qualifyingAttemptCount: 12, rollingWindowSize: 10, quality: 1 });
  const model = buildProgressPlanPresentationModel({ snapshot, activeTrackId: TRACK_ID, locale: "pl" });
  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") return;
  assert.equal(model.completion.ratio, 1);
  assert.equal(model.completion.qualifyingAttemptCount, 12);
  assert.equal(model.primaryAction, null);
});

test("Progress model does not offer a new plan session while one is active", () => {
  const snapshot = ready();
  const activeSession = createTrainingSession({
    id: "session:active",
    trackId: TRACK_ID,
    modeId: "learn",
    configurationSnapshot: { kind: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence:active", item: { trackId: TRACK_ID, itemId: "item:active", contentVersion: "content-v1", packagePin: PIN } }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "content-v1",
    packagePin: PIN,
    status: "active",
    startedAt: "2026-09-09T08:00:00.000Z",
  });
  const model = buildProgressPlanPresentationModel({
    snapshot: { ...snapshot, activeSession },
    activeTrackId: TRACK_ID,
    locale: "en",
  });
  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") return;
  assert.equal(model.activeSession?.id, "session:active");
  assert.equal(model.primaryAction, null);

  const targetedPlan = normalizeLearningPlan({
    ...snapshot.plan,
    acceptedTarget: { meaning: "deadline", targetDate: "2026-12-01" },
  });
  const targetedGoal = {
    record: { ...snapshot.goal.record, goalType: "build_foundations", targetDate: "2026-12-01" },
    revision: snapshot.goal.revision,
  } satisfies GoalSnapshot;
  const targetedGuidance = projectTargetDateGuidance({
    currentGoal: targetedGoal,
    acceptedPlan: targetedPlan,
    currentVerifiedPackagePin: PIN,
    c3Result: "in_progress",
    today: "2026-09-09",
    completedFacts: { sessions: [], attempts: [] },
    paceForecast: {
      kind: "available",
      source: {
        planId: targetedPlan.planId,
        planRevision: targetedPlan.planRevision,
        goalRevision: targetedPlan.goalRevision,
        target: targetedPlan.acceptedTarget,
        contentPackagePin: targetedPlan.contentPackagePin,
      },
      requiredQuestionsPerSession: 2,
      requiredQuestionsPerWeek: 4,
      actualQuestionsPerWeek: 4,
      projectedCompletionDate: "2026-11-20",
      targetDate: "2026-12-01",
      remainingRequiredAttempts: 4,
      remainingPlannedCapacity: 20,
      status: "on_track",
      trend: "stable",
    },
  });
  const targetedModel = buildProgressPlanPresentationModel({
    snapshot: {
      ...snapshot,
      goal: targetedGoal,
      plan: targetedPlan,
      planSnapshot: { ...snapshot.planSnapshot, plan: targetedPlan },
      activeSession,
      paceForecast: { kind: "unavailable", reason: "no_target" },
      guidance: targetedGuidance,
    },
    activeTrackId: TRACK_ID,
    locale: "en",
  });
  assert.equal(targetedModel.kind, "ready");
  if (targetedModel.kind !== "ready") return;
  assert.equal(targetedModel.guidance.state, "on_track");
  assert.equal(targetedModel.primaryAction, null);
});

test("Progress model keeps none guidance explicit for no goal, paused goal and no plan", () => {
  const noGoal = { kind: "none", trackId: TRACK_ID, goal: null, guidance: guidanceFor(null, null) } satisfies HomePlanSnapshot;
  const paused = { kind: "none", trackId: TRACK_ID, goal: goal("paused"), guidance: guidanceFor(goal("paused"), null) } satisfies HomePlanSnapshot;
  const noPlan = { kind: "none", trackId: TRACK_ID, goal: goal(), guidance: guidanceFor(goal(), null) } satisfies HomePlanSnapshot;

  const noGoalModel = buildProgressPlanPresentationModel({ snapshot: noGoal, activeTrackId: TRACK_ID, locale: "en" });
  const pausedModel = buildProgressPlanPresentationModel({ snapshot: paused, activeTrackId: TRACK_ID, locale: "en" });
  const noPlanModel = buildProgressPlanPresentationModel({ snapshot: noPlan, activeTrackId: TRACK_ID, locale: "en" });
  assert.equal(noGoalModel.kind, "none");
  assert.equal(pausedModel.kind, "none");
  assert.equal(noPlanModel.kind, "none");
  if (noGoalModel.kind === "none" && pausedModel.kind === "none" && noPlanModel.kind === "none") {
    assert.equal(noGoalModel.guidance.state, "no_goal");
    assert.equal(pausedModel.guidance.state, "goal_paused");
    assert.equal(noPlanModel.guidance.state, "no_plan");
    assert.equal(noPlanModel.primaryAction?.kind, "create_plan");
  }
});

test("Progress model fails closed for a foreign active track or unavailable snapshot", () => {
  const foreign = buildProgressPlanPresentationModel({ snapshot: ready(), activeTrackId: "cloud-fundamentals" as TrackId, locale: "en" });
  assert.deepEqual(foreign, { kind: "unavailable", trackId: "cloud-fundamentals", reason: "identity_mismatch" });
  const staleIdentity = ready();
  const mismatched = { ...staleIdentity, identity: { ...staleIdentity.identity, planRevision: staleIdentity.identity.planRevision + 1 } } satisfies HomePlanReady;
  assert.deepEqual(buildProgressPlanPresentationModel({ snapshot: mismatched, activeTrackId: TRACK_ID, locale: "en" }), { kind: "unavailable", trackId: TRACK_ID, reason: "identity_mismatch" });
  const unavailable = buildProgressPlanPresentationModel({ snapshot: { kind: "unavailable", trackId: TRACK_ID, reason: "concurrent_change" }, activeTrackId: TRACK_ID, locale: "en" });
  assert.deepEqual(unavailable, { kind: "unavailable", trackId: TRACK_ID, reason: "concurrent_change" });
});
