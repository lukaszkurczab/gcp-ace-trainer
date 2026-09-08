import assert from "node:assert/strict";
import test from "node:test";
import {
  createContentPackagePin,
  generateLearningPlanProposal,
  InvalidLearningPlanProposalInputError,
  type GeneratorInput,
  type PackageCompletionState,
} from "..";
import type { GoalRecord, GoalSnapshot } from "../goals/goalContracts";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const CERTIFICATION_TRACK_ID = "google-cloud-associate-cloud-engineer";
const PIN = createContentPackagePin({ packageIdentity: "a".repeat(64), packageVersion: "1.0.0", contentReleaseId: "release-1" });

function snapshot(goalType: GoalRecord["goalType"], preferredDays: GoalRecord["preferredDays"] = ["mon", "wed", "sat"], targetDate?: string, trackId = TRACK_ID): GoalSnapshot {
  return Object.freeze({
    record: Object.freeze({ goalType, preferredDays, status: "active", trackId, weeklySessionTarget: preferredDays.length, ...(targetDate === undefined ? {} : { targetDate }) }),
    revision: 7,
  });
}

function input(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    goalSnapshot: snapshot("build_foundations"),
    packagePin: PIN,
    contentVersion: "content-v1",
    primaryModeId: "coding-interview-learn-approach",
    requestedLength: 10,
    sessionCapacity: { kind: "exact", actualLength: 10 },
    completionState: { kind: "in_progress", qualifyingAttemptCount: 2, requiredAttemptCount: 5, rollingWindowSize: 3 },
    dueReviewCount: 0,
    primaryScopeLabel: "Foundations",
    localToday: "2026-02-23",
    timezone: "Europe/Warsaw",
    ...overrides,
  };
}

function assertInvalid(value: unknown, code?: InvalidLearningPlanProposalInputError["code"]): void {
  assert.throws(() => generateLearningPlanProposal(value as GeneratorInput), (error: unknown) => {
    assert.ok(error instanceof InvalidLearningPlanProposalInputError);
    if (code !== undefined) assert.equal(error.code, code);
    return true;
  });
}

test("generates one stable 18:00 slot per normalized preferred day for every goal type", () => {
  const goalTypes: GoalRecord["goalType"][] = ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"];
  for (const goalType of goalTypes) {
    const result = generateLearningPlanProposal(input({ goalSnapshot: snapshot(goalType, ["sat", "mon", "wed"], goalType === "learn_at_own_pace" ? "2026-03-10" : "2026-03-10") }));
    assert.deepEqual(result.slots.map((slot) => slot.slotId), ["proposal-slot:v1:mon:18-00", "proposal-slot:v1:wed:18-00", "proposal-slot:v1:sat:18-00"]);
    assert.deepEqual(result.slots.map((slot) => [slot.day, slot.localTime, slot.sessionLength]), [["mon", "18:00", 10], ["wed", "18:00", 10], ["sat", "18:00", 10]]);
    assert.equal(result.targetAssessment.kind, goalType === "learn_at_own_pace" ? "open_ended" : "achievable");
  }
  const certification = generateLearningPlanProposal(input({ goalSnapshot: snapshot("prepare_for_a_certification", ["mon"], "2026-03-10", CERTIFICATION_TRACK_ID) }));
  assert.equal(certification.targetAssessment.kind, "achievable");
});

test("uses due review priority, otherwise package scope, without item identifiers", () => {
  const review = generateLearningPlanProposal(input({ dueReviewCount: 2 }));
  assert.deepEqual(review.materialPriority, { kind: "due_review" });
  const primary = generateLearningPlanProposal(input({ primaryScopeLabel: "Node A" }));
  assert.deepEqual(primary.materialPriority, { kind: "package_primary_scope", label: "Node A" });
  assert.equal("itemIds" in primary.materialPriority, false);
});

test("event boundaries are strict-before while deadline and checkpoint are inclusive", () => {
  const eventDate = "2026-02-25"; // Wednesday: today is Monday, event-day session is excluded.
  for (const goalType of ["prepare_for_an_interview", "prepare_for_a_certification"] as const) {
    const result = generateLearningPlanProposal(input({ goalSnapshot: snapshot(goalType, ["mon", "wed"], eventDate, goalType === "prepare_for_a_certification" ? CERTIFICATION_TRACK_ID : TRACK_ID), completionState: { kind: "in_progress", qualifyingAttemptCount: 0, requiredAttemptCount: 11, rollingWindowSize: 1 } }));
    assert.equal(result.targetAssessment.kind, "unreachable");
    if (result.targetAssessment.kind === "unreachable") assert.deepEqual(result.targetAssessment, { kind: "unreachable", occurrences: 1, actualLength: 10, remainingAttempts: 11 });
  }
  for (const goalType of ["build_foundations", "refresh_and_maintain_skills"] as const) {
    const result = generateLearningPlanProposal(input({ goalSnapshot: snapshot(goalType, ["mon", "wed"], eventDate), completionState: { kind: "in_progress", qualifyingAttemptCount: 0, requiredAttemptCount: 20, rollingWindowSize: 1 } }));
    assert.equal(result.targetAssessment.kind, "achievable");
    if (result.targetAssessment.kind === "achievable") assert.equal(result.targetAssessment.occurrences, 2);
  }
});

test("missing target date is open-ended before an unknown completion rule", () => {
  for (const goalType of ["prepare_for_an_interview", "prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills"] as const) {
    const result = generateLearningPlanProposal(input({ goalSnapshot: snapshot(goalType, undefined, undefined, goalType === "prepare_for_a_certification" ? CERTIFICATION_TRACK_ID : TRACK_ID), completionState: { kind: "unknown" } }));
    assert.deepEqual(result.targetAssessment, { kind: "open_ended" });
  }
});

test("C3 unknown is explicit with a target; in-progress uses remaining attempts and completed has no remaining work", () => {
  const unknown = generateLearningPlanProposal(input({ goalSnapshot: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: { kind: "unknown" } }));
  assert.deepEqual(unknown.targetAssessment, { kind: "unknown_completion_rule" });
  const inProgress = generateLearningPlanProposal(input({ goalSnapshot: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: { kind: "in_progress", qualifyingAttemptCount: 9, requiredAttemptCount: 5, rollingWindowSize: 1 } }));
  assert.deepEqual(inProgress.targetAssessment, { kind: "achievable", occurrences: 1, actualLength: 10, remainingAttempts: 0 });
  const completed = generateLearningPlanProposal(input({ goalSnapshot: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: { kind: "completed", qualifyingAttemptCount: 5, rollingWindowSize: 1, quality: 1 } }));
  assert.deepEqual(completed.targetAssessment, { kind: "achievable", occurrences: 1, actualLength: 10, remainingAttempts: 0 });
});

test("S12 is the only capacity source and shortfall preserves all counts without slots or attainability", () => {
  const shortened = generateLearningPlanProposal(input({ goalSnapshot: snapshot("build_foundations", ["mon"], "2026-03-01"), requestedLength: 10, sessionCapacity: { kind: "shortened", actualLength: 4, requestedLength: 10 } }));
  assert.equal(shortened.slots[0]?.sessionLength, 4);
  assert.equal(shortened.targetAssessment.kind, "achievable");

  const shortfall = generateLearningPlanProposal(input({ sessionCapacity: { kind: "shortfall", requestedLength: 10, eligibleItemCount: 2, missingItemCount: 8 }, completionState: { kind: "unknown" } }));
  assert.deepEqual(shortfall.sessionCapacity, { kind: "shortfall", requestedLength: 10, eligibleItemCount: 2, missingItemCount: 8 });
  assert.deepEqual(shortfall.slots, []);
  assert.deepEqual(shortfall.targetAssessment, { kind: "unavailable_due_to_shortfall" });
});

test("leap-day and DST-neutral occurrence counting use calendar dates, not elapsed local milliseconds", () => {
  const leap = generateLearningPlanProposal(input({ localToday: "2024-02-28", timezone: "America/New_York", goalSnapshot: snapshot("build_foundations", ["thu", "fri", "sat"], "2024-03-01"), completionState: { kind: "in_progress", qualifyingAttemptCount: 0, requiredAttemptCount: 3, rollingWindowSize: 1 } }));
  assert.equal(leap.targetAssessment.kind, "achievable");
  if (leap.targetAssessment.kind === "achievable") assert.equal(leap.targetAssessment.occurrences, 2);
  const dst = generateLearningPlanProposal(input({ localToday: "2024-03-08", timezone: "America/New_York", goalSnapshot: snapshot("build_foundations", ["sun", "mon"], "2024-03-11"), completionState: { kind: "in_progress", qualifyingAttemptCount: 0, requiredAttemptCount: 20, rollingWindowSize: 1 } }));
  assert.equal(dst.targetAssessment.kind, "achievable");
  if (dst.targetAssessment.kind === "achievable") assert.equal(dst.targetAssessment.occurrences, 2);
});

test("does not mutate preferred day order or mutable input values and returns frozen output", () => {
  const days = ["sat", "mon"] as const;
  const goal = { goalType: "build_foundations" as const, preferredDays: [...days], status: "active" as const, trackId: TRACK_ID, weeklySessionTarget: 2 };
  const original = { ...input({ goalSnapshot: { record: goal, revision: 3 } }) };
  const before = structuredClone(original);
  const result = generateLearningPlanProposal(original);
  assert.deepEqual(original, before);
  assert.deepEqual(result.slots.map((slot) => slot.day), ["mon", "sat"]);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.identity));
  assert.ok(Object.isFrozen(result.identity.packagePin));
  assert.ok(Object.isFrozen(result.slots));
  assert.ok(Object.isFrozen(result.slots[0]));
});

test("rejects malformed or inconsistent input with the one explicit error class", () => {
  const invalidCases: readonly [string, unknown, InvalidLearningPlanProposalInputError["code"]][] = [
    ["track", input({ goalSnapshot: { record: { ...snapshot("build_foundations").record, trackId: "unknown-track" }, revision: 7 } as GoalSnapshot }), "invalid_goal_snapshot"],
    ["pin", input({ packagePin: { packageIdentity: "wrong", packageVersion: "1", contentReleaseId: "r" } }), "invalid_package_pin"],
    ["timezone", input({ timezone: "Mars/Olympus" }), "invalid_timezone"],
    ["local date", input({ localToday: "2024-02-30" }), "invalid_local_today"],
    ["target date", input({ goalSnapshot: snapshot("build_foundations", ["mon"], "2024-02-30") }), "invalid_goal_snapshot"],
    ["length", input({ requestedLength: 0 }), "invalid_requested_length"],
    ["capacity", input({ requestedLength: 10, sessionCapacity: { kind: "exact", actualLength: 9 } }), "invalid_session_capacity"],
    ["completion", input({ completionState: { kind: "in_progress", qualifyingAttemptCount: -1, requiredAttemptCount: 1, rollingWindowSize: 1 } as PackageCompletionState }), "invalid_completion_state"],
    ["empty days", input({ goalSnapshot: snapshot("build_foundations", []) }), "invalid_goal_snapshot"],
  ];
  for (const [name, value, code] of invalidCases) {
    assert.doesNotThrow(() => name);
    assertInvalid(value, code);
  }
  assertInvalid(input({ dueReviewCount: -1 }), "invalid_due_review_count");
  assertInvalid(input({ primaryScopeLabel: " " }), "invalid_primary_scope_label");
  assertInvalid(input({ primaryModeId: " " }), "invalid_mode");
  assertInvalid(input({ goalSnapshot: { record: { ...snapshot("build_foundations").record, status: "paused" }, revision: 7 } }), "invalid_goal_snapshot");
  assertInvalid({ ...input(), extra: true }, "invalid_input");
});
