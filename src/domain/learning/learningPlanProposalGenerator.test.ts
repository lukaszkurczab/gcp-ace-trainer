import assert from "node:assert/strict";
import test from "node:test";
import {
  generateLearningPlanProposal,
  InvalidLearningPlanProposalInputError,
  type GeneratorInput,
  type PackageCompletionState,
} from "..";
import type { GoalRecord } from "../goals/goalContracts";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const CERTIFICATION_TRACK_ID = "google-cloud-associate-cloud-engineer";
const ARTIFACT_SHA256 = "a".repeat(64);

function snapshot(goalType: GoalRecord["goalType"], preferredDays: GoalRecord["preferredDays"] = ["mon", "wed", "sat"], targetDate?: string, trackId = TRACK_ID): GoalRecord {
  return Object.freeze({ goalType, preferredDays, status: "active", trackId, weeklySessionTarget: preferredDays.length, ...(targetDate === undefined ? {} : { targetDate }) });
}

function chapterCompletion(qualifyingAttemptCount: number, quality: number | null = null): PackageCompletionState {
  const requiredAttemptCount = 20;
  const completed = qualifyingAttemptCount >= requiredAttemptCount && quality !== null && quality >= 0.8;
  const reason = completed ? null : qualifyingAttemptCount < requiredAttemptCount ? "minimum_attempts_unmet" : "quality_unmet";
  const chapter = Object.freeze({ nodeId: "chapter", mentalUnitCount: 1, qualifyingAttemptCount, requiredAttemptCount, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality, status: completed ? "completed" as const : "in_progress" as const, reason });
  const remainingAttemptCount = Math.max(0, requiredAttemptCount - qualifyingAttemptCount);
  const common = { chapters: Object.freeze([chapter]), completedChapterCount: completed ? 1 : 0, requiredChapterCount: 1, qualifyingAttemptCount, requiredAttemptCount, remainingAttemptCount };
  return completed ? Object.freeze({ kind: "completed", ...common, remainingAttemptCount: 0 }) : Object.freeze({ kind: "in_progress", ...common });
}

function input(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    goalRecord: snapshot("build_foundations"),
    expectedGoalRevision: 7,
    minutesPerStudyDay: 60,
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: null, practice: { modeId: "coding-interview-learn-approach", requestedLength: 10 } },
    nextSession: { kind: "practice", modeId: "coding-interview-learn-approach", requestedLength: 10 },
    diagnosisStatus: "not_available",
    artifactSha256: ARTIFACT_SHA256,
    planningPolicyIdentity: { contentVersion: "policy-v1", artifactSha256: "b".repeat(64), policyVersion: "authored-v1" },
    contentVersion: "content-v1",
    primaryModeId: "coding-interview-learn-approach",
    requestedLength: 10,
    sessionCapacity: { kind: "exact", actualLength: 10 },
    completionState: chapterCompletion(2),
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
    const result = generateLearningPlanProposal(input({ goalRecord: snapshot(goalType, ["sat", "mon", "wed"], "2026-03-10") }));
    assert.deepEqual(result.slots.map((slot) => slot.slotId), ["proposal-slot:v1:mon:18-00", "proposal-slot:v1:wed:18-00", "proposal-slot:v1:sat:18-00"]);
    assert.deepEqual(result.slots.map((slot) => [slot.day, slot.localTime, slot.sessionLength]), [["mon", "18:00", 10], ["wed", "18:00", 10], ["sat", "18:00", 10]]);
    assert.equal(result.targetAssessment.kind, goalType === "learn_at_own_pace" ? "open_ended" : "minimum_volume_fits");
  }
  const certification = generateLearningPlanProposal(input({ goalRecord: snapshot("prepare_for_a_certification", ["mon"], "2026-03-10", CERTIFICATION_TRACK_ID) }));
  assert.equal(certification.targetAssessment.kind, "minimum_volume_fits");
});

test("uses due review priority, otherwise package scope, without item identifiers", () => {
  const review = generateLearningPlanProposal(input({ dueReviewCount: 2 }));
  assert.deepEqual(review.materialPriority, { kind: "due_review" });
  const primary = generateLearningPlanProposal(input({ primaryScopeLabel: "Node A" }));
  assert.deepEqual(primary.materialPriority, { kind: "package_primary_scope", label: "Node A" });
  assert.equal("itemIds" in primary.materialPriority, false);
});

test("keeps one-time diagnostic request separate from the recurring practice schedule", () => {
  const result = generateLearningPlanProposal(input({
    goalRecord: snapshot("prepare_for_a_certification", ["mon"], undefined, CERTIFICATION_TRACK_ID),
    executionPolicy: { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: { modeId: "certification-diagnostic-baseline", requestedLength: 40 }, practice: { modeId: "certification-focus-practice", requestedLength: 10 } },
    primaryModeId: "certification-focus-practice", requestedLength: 10,
    nextSession: { kind: "diagnosis", modeId: "certification-diagnostic-baseline", requestedLength: 40 }, diagnosisStatus: "scheduled",
  }));
  assert.deepEqual(result.nextSession, { kind: "diagnosis", modeId: "certification-diagnostic-baseline", requestedLength: 40 });
  assert.deepEqual(result.executionPolicy.practice, { modeId: "certification-focus-practice", requestedLength: 10 });
  assert.equal(result.slots[0]?.sessionLength, 10);
});

test("event boundaries are strict-before while deadline and checkpoint are inclusive", () => {
  const eventDate = "2026-02-25"; // Wednesday: today is Monday, event-day session is excluded.
  for (const goalType of ["prepare_for_an_interview", "prepare_for_a_certification"] as const) {
    const result = generateLearningPlanProposal(input({ goalRecord: snapshot(goalType, ["mon", "wed"], eventDate, goalType === "prepare_for_a_certification" ? CERTIFICATION_TRACK_ID : TRACK_ID), completionState: chapterCompletion(0) }));
    assert.equal(result.targetAssessment.kind, "minimum_volume_exceeds_capacity");
    if (result.targetAssessment.kind === "minimum_volume_exceeds_capacity") assert.deepEqual(result.targetAssessment, { kind: "minimum_volume_exceeds_capacity", occurrences: 1, actualLength: 10, remainingAttempts: 20 });
  }
  for (const goalType of ["build_foundations", "refresh_and_maintain_skills"] as const) {
    const result = generateLearningPlanProposal(input({ goalRecord: snapshot(goalType, ["mon", "wed"], eventDate), completionState: chapterCompletion(0) }));
    assert.equal(result.targetAssessment.kind, "minimum_volume_fits");
    if (result.targetAssessment.kind === "minimum_volume_fits") assert.equal(result.targetAssessment.occurrences, 2);
  }
});

test("missing target date is open-ended before an unknown completion rule", () => {
  for (const goalType of ["prepare_for_an_interview", "prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills"] as const) {
    const result = generateLearningPlanProposal(input({ goalRecord: snapshot(goalType, undefined, undefined, goalType === "prepare_for_a_certification" ? CERTIFICATION_TRACK_ID : TRACK_ID), completionState: { kind: "unknown" } }));
    assert.deepEqual(result.targetAssessment, { kind: "open_ended" });
  }
});

test("C3 unknown is explicit with a target; in-progress uses remaining attempts and completed has no remaining work", () => {
  const unknown = generateLearningPlanProposal(input({ goalRecord: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: { kind: "unknown" } }));
  assert.deepEqual(unknown.targetAssessment, { kind: "unknown_completion_rule" });
  const inProgress = generateLearningPlanProposal(input({ goalRecord: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: chapterCompletion(20, 0.75) }));
  assert.deepEqual(inProgress.targetAssessment, { kind: "quality_requirement_unmet" });
  const completed = generateLearningPlanProposal(input({ goalRecord: snapshot("build_foundations", ["mon"], "2026-03-01"), completionState: chapterCompletion(20, 1) }));
  assert.deepEqual(completed.targetAssessment, { kind: "minimum_volume_fits", occurrences: 1, actualLength: 10, remainingAttempts: 0 });
});

test("S12 is the only capacity source and shortfall preserves all counts without slots or attainability", () => {
  const shortened = generateLearningPlanProposal(input({ goalRecord: snapshot("build_foundations", ["mon"], "2026-03-01"), requestedLength: 10, sessionCapacity: { kind: "shortened", actualLength: 4, requestedLength: 10 } }));
  assert.equal(shortened.slots[0]?.sessionLength, 4);
  assert.deepEqual(shortened.targetAssessment, { kind: "minimum_volume_exceeds_capacity", occurrences: 1, actualLength: 4, remainingAttempts: 18 });

  const shortfall = generateLearningPlanProposal(input({ sessionCapacity: { kind: "shortfall", requestedLength: 10, eligibleItemCount: 2, missingItemCount: 8 }, completionState: { kind: "unknown" } }));
  assert.deepEqual(shortfall.sessionCapacity, { kind: "shortfall", requestedLength: 10, eligibleItemCount: 2, missingItemCount: 8 });
  assert.deepEqual(shortfall.slots, []);
  assert.deepEqual(shortfall.targetAssessment, { kind: "unavailable_due_to_shortfall" });
});

test("leap-day and DST-neutral occurrence counting use calendar dates, not elapsed local milliseconds", () => {
  const leap = generateLearningPlanProposal(input({ localToday: "2024-02-28", timezone: "America/New_York", goalRecord: snapshot("build_foundations", ["thu", "fri", "sat"], "2024-03-01"), completionState: chapterCompletion(0) }));
  assert.equal(leap.targetAssessment.kind, "minimum_volume_fits");
  if (leap.targetAssessment.kind === "minimum_volume_fits") assert.equal(leap.targetAssessment.occurrences, 2);
  const dst = generateLearningPlanProposal(input({ localToday: "2024-03-08", timezone: "America/New_York", goalRecord: snapshot("build_foundations", ["sun", "mon"], "2024-03-11"), completionState: chapterCompletion(0) }));
  assert.equal(dst.targetAssessment.kind, "minimum_volume_fits");
  if (dst.targetAssessment.kind === "minimum_volume_fits") assert.equal(dst.targetAssessment.occurrences, 2);
});

test("does not mutate preferred day order or mutable input values and returns frozen output", () => {
  const days = ["sat", "mon"] as const;
  const goal = { goalType: "build_foundations" as const, preferredDays: [...days], status: "active" as const, trackId: TRACK_ID, weeklySessionTarget: 2 };
  const original = { ...input({ goalRecord: goal, expectedGoalRevision: 3 }) };
  const before = structuredClone(original);
  const result = generateLearningPlanProposal(original);
  assert.deepEqual(original, before);
  assert.deepEqual(result.slots.map((slot) => slot.day), ["mon", "sat"]);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.identity));
  assert.equal(result.identity.artifactSha256, ARTIFACT_SHA256);
  assert.ok(Object.isFrozen(result.slots));
  assert.ok(Object.isFrozen(result.slots[0]));
});

test("rejects malformed or inconsistent input with the one explicit error class", () => {
  const invalidCases: readonly [string, unknown, InvalidLearningPlanProposalInputError["code"]][] = [
    ["track", input({ goalRecord: { ...snapshot("build_foundations"), trackId: "unknown-track" } as GoalRecord }), "invalid_goal_snapshot"],
    ["artifact", input({ artifactSha256: "wrong" }), "invalid_artifact_sha256"],
    ["timezone", input({ timezone: "Mars/Olympus" }), "invalid_timezone"],
    ["local date", input({ localToday: "2024-02-30" }), "invalid_local_today"],
    ["target date", input({ goalRecord: snapshot("build_foundations", ["mon"], "2024-02-30") }), "invalid_goal_snapshot"],
    ["length", input({ requestedLength: 0 }), "invalid_requested_length"],
    ["capacity", input({ requestedLength: 10, sessionCapacity: { kind: "exact", actualLength: 9 } }), "invalid_session_capacity"],
    ["completion", input({ completionState: { kind: "in_progress", qualifyingAttemptCount: -1, requiredAttemptCount: 1, rollingWindowSize: 1 } as unknown as PackageCompletionState }), "invalid_completion_state"],
    ["empty days", input({ goalRecord: snapshot("build_foundations", []) }), "invalid_goal_snapshot"],
  ];
  for (const [name, value, code] of invalidCases) {
    assert.doesNotThrow(() => name);
    assertInvalid(value, code);
  }
  assertInvalid(input({ dueReviewCount: -1 }), "invalid_due_review_count");
  assertInvalid(input({ primaryScopeLabel: " " }), "invalid_primary_scope_label");
  assertInvalid(input({ primaryModeId: " " }), "invalid_mode");
  assertInvalid(input({ goalRecord: { ...snapshot("build_foundations"), status: "paused" } }), "invalid_goal_snapshot");
  assertInvalid({ ...input(), extra: true }, "invalid_input");
});
