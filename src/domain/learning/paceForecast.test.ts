import assert from "node:assert/strict";
import test from "node:test";

import { normalizeLearningPlan, type LearningPlan } from "./learningPlan";
import { createLearningPlanSlotId } from "./slotIdentity";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import {
  calculatePaceForecast,
  InvalidPaceForecastInputError,
  type C3Result,
  type ImmutableCompletedFacts,
  type PaceForecastInput,
} from "./paceForecast";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const ZONE = "Europe/Warsaw";

function plan(overrides: Partial<LearningPlan> = {}): LearningPlan {
  const createdAt = overrides.createdAt ?? "2026-01-01T10:00:00.000Z";
  const updatedAt = overrides.updatedAt ?? createdAt;
  return normalizeLearningPlan({
    schemaVersion: 1,
    planId: "plan:forecast",
    trackId: TRACK_ID,
    goalRevision: 3,
    status: "accepted",
    timezone: ZONE,
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "deadline", targetDate: "2026-02-20" },
    createdAt,
    updatedAt,
    planRevision: 1,
    commandId: "command:forecast",
    slots: [
      { slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 },
      { slotId: createLearningPlanSlotId("slot:wed"), day: "wed", localTime: "18:00", sessionLength: 10 },
      { slotId: createLearningPlanSlotId("slot:sat"), day: "sat", localTime: "18:00", sessionLength: 10 },
    ],
    ...overrides,
  });
}

function facts(attemptDates: readonly string[] = [], nonQualifyingDates: readonly string[] = []): ImmutableCompletedFacts {
  return {
    sessions: [{ completedAt: "2026-01-05T10:00:00.000Z", completedQuestions: 2, plannedQuestions: 3 }],
    attempts: [
      ...attemptDates.map((date) => ({ answeredAt: `${date}T10:00:00.000Z`, countsTowardCompletion: true })),
      ...nonQualifyingDates.map((date) => ({ answeredAt: `${date}T10:00:00.000Z`, countsTowardCompletion: false })),
    ],
  };
}

function input(overrides: Partial<PaceForecastInput> = {}): PaceForecastInput {
  return {
    acceptedPlan: plan(),
    c3Result: "in_progress",
    requiredAttemptCount: 8,
    today: "2026-02-01",
    timezone: ZONE,
    completedFacts: facts(["2026-01-29", "2026-01-31"]),
    ...overrides,
  };
}

function dateMinus(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function assertInvalid(value: unknown, code: InvalidPaceForecastInputError["code"]): void {
  assert.throws(() => calculatePaceForecast(value as PaceForecastInput), (error: unknown) => error instanceof InvalidPaceForecastInputError && error.code === code);
}

test("uses the explicit formulas, includes today, and excludes an event target day", () => {
  const today = "2026-02-01";
  const deadline = calculatePaceForecast(input({
    acceptedPlan: plan({ acceptedTarget: { meaning: "deadline", targetDate: "2026-02-10" } }),
    today,
    requiredAttemptCount: 8,
  }));
  assert.equal(deadline.kind, "available");
  if (deadline.kind !== "available") return;
  assert.equal(deadline.remainingRequiredAttempts, 6);
  assert.equal(deadline.requiredQuestionsPerSession, 2);
  assert.equal(deadline.requiredQuestionsPerWeek, 4.2);
  assert.equal(deadline.actualQuestionsPerWeek, 0.5);
  assert.equal(deadline.remainingPlannedCapacity, 40);
  assert.equal(deadline.projectedCompletionDate, "2026-04-25");
  assert.equal(deadline.status, "at_risk");

  const event = calculatePaceForecast(input({
    acceptedPlan: plan({ acceptedTarget: { meaning: "event", targetDate: "2026-02-11" } }),
    today,
  }));
  assert.equal(event.kind, "available");
  if (event.kind === "available") assert.equal(event.remainingPlannedCapacity, 40);

  const checkpoint = calculatePaceForecast(input({
    acceptedPlan: plan({ acceptedTarget: { meaning: "checkpoint", targetDate: "2026-02-11" } }),
    today,
  }));
  assert.equal(checkpoint.kind, "available");
  if (checkpoint.kind === "available") assert.equal(checkpoint.remainingPlannedCapacity, 50);
});

test("minimum observation age is inclusive: six days gives seven days, five gives six", () => {
  const today = "2026-02-10";
  const ageSix = calculatePaceForecast(input({
    acceptedPlan: plan({ createdAt: "2026-02-04T10:00:00.000Z" }),
    today,
    completedFacts: facts([today]),
  }));
  assert.equal(ageSix.kind, "available");
  const ageSeven = calculatePaceForecast(input({
    acceptedPlan: plan({ createdAt: "2026-02-03T10:00:00.000Z" }),
    today,
    completedFacts: facts([today]),
  }));
  assert.equal(ageSeven.kind, "available");
  const ageEight = calculatePaceForecast(input({
    acceptedPlan: plan({ createdAt: "2026-02-02T10:00:00.000Z" }),
    today,
    completedFacts: facts([today]),
  }));
  assert.equal(ageEight.kind, "available");
  const ageFive = calculatePaceForecast(input({
    acceptedPlan: plan({ createdAt: "2026-02-05T10:00:00.000Z" }),
    today,
    completedFacts: facts([today]),
  }));
  assert.deepEqual(ageFive, { kind: "unavailable", reason: "insufficient_elapsed_evidence" });
});

test("trend starts at thirteen days and applies strict ten-percent boundaries", () => {
  const today = "2026-02-20";
  const previous = Array.from({ length: 10 }, (_, index) => dateMinus(today, 7 + (index % 7)));
  const boundary = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-01-01T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 100, completedFacts: facts([...previous, ...Array.from({ length: 11 }, (_, index) => dateMinus(today, index % 7))]) }));
  assert.equal(boundary.kind, "available");
  if (boundary.kind === "available") assert.equal(boundary.trend, "stable");

  const improving = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-01-01T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 100, completedFacts: facts([...previous, ...Array.from({ length: 12 }, (_, index) => dateMinus(today, index % 7))]) }));
  assert.equal(improving.kind, "available");
  if (improving.kind === "available") assert.equal(improving.trend, "improving");

  const slowing = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-01-01T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 100, completedFacts: facts([...previous, ...Array.from({ length: 8 }, (_, index) => dateMinus(today, index % 7))]) }));
  assert.equal(slowing.kind, "available");
  if (slowing.kind === "available") assert.equal(slowing.trend, "slowing");

  const ageThirteen = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-02-07T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 5, completedFacts: facts([today]) }));
  assert.equal(ageThirteen.kind, "available");
  if (ageThirteen.kind === "available") assert.equal(ageThirteen.trend, "improving");

  const ageTwelve = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-02-08T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 5, completedFacts: facts([today]) }));
  assert.equal(ageTwelve.kind, "available");
  if (ageTwelve.kind === "available") assert.equal(ageTwelve.trend, "stable");
});

test("trend handles zero-to-zero, zero-to-positive, and positive-to-zero windows after age fourteen", () => {
  const today = "2026-02-20";
  const base = { acceptedPlan: plan({ createdAt: "2026-02-06T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2026-03-20" } }), today, requiredAttemptCount: 100 };
  const zeroToZero = calculatePaceForecast(input({ ...base, completedFacts: facts([]) }));
  assert.equal(zeroToZero.kind, "unavailable");
  // No current qualifying attempt remains an honest business absence even
  // though the two-window trend itself would be stable.
  assert.equal(zeroToZero.reason, "insufficient_elapsed_evidence");

  const zeroToPositive = calculatePaceForecast(input({ ...base, completedFacts: facts([today]) }));
  assert.equal(zeroToPositive.kind, "available");
  if (zeroToPositive.kind === "available") assert.equal(zeroToPositive.trend, "improving");

  const positiveToZero = calculatePaceForecast(input({ ...base, completedFacts: facts([dateMinus(today, 7)]) }));
  assert.equal(positiveToZero.kind, "available");
  if (positiveToZero.kind === "available") assert.equal(positiveToZero.trend, "slowing");
});

test("completed work is zero work even without future occurrences or observations", () => {
  const result = calculatePaceForecast(input({
    acceptedPlan: plan({ acceptedTarget: { meaning: "event", targetDate: "2026-01-31" }, slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }] }),
    today: "2026-02-01",
    c3Result: "completed",
    requiredAttemptCount: 8,
    completedFacts: { sessions: [], attempts: [] },
  }));
  assert.equal(result.kind, "available");
  if (result.kind === "available") {
    assert.equal(result.remainingRequiredAttempts, 0);
    assert.equal(result.requiredQuestionsPerSession, 0);
    assert.equal(result.requiredQuestionsPerWeek, 0);
    assert.equal(result.projectedCompletionDate, "2026-02-01");
    assert.equal(result.status, "on_track");
    assert.equal(result.trend, "stable");
  }
});

test("returns each honest unavailable business reason", () => {
  assert.deepEqual(calculatePaceForecast(input({ acceptedPlan: plan({ acceptedTarget: { meaning: "none", targetDate: null } }) })), { kind: "unavailable", reason: "no_target" });
  assert.deepEqual(calculatePaceForecast(input({ c3Result: "unknown" })), { kind: "unavailable", reason: "unknown_completion_rule" });
  assert.deepEqual(calculatePaceForecast(input({ acceptedPlan: plan({ acceptedTarget: { meaning: "deadline", targetDate: "2026-01-20" } }) })), { kind: "unavailable", reason: "no_future_slots" });
  assert.deepEqual(calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2026-01-28T10:00:00.000Z" }), today: "2026-02-01", completedFacts: facts([]) })), { kind: "unavailable", reason: "insufficient_elapsed_evidence" });
});

test("requires a concrete non-negative completion requirement", () => {
  const missing = { ...input() } as Record<string, unknown>;
  delete missing.requiredAttemptCount;
  assertInvalid(missing, "invalid_completion_requirement");
  assertInvalid({ ...input(), requiredAttemptCount: undefined }, "invalid_completion_requirement");
  assertInvalid({ ...input(), requiredAttemptCount: null }, "invalid_completion_requirement");
  assertInvalid(input({ requiredAttemptCount: -1 }), "invalid_completion_requirement");
  assertInvalid({ ...input(), completionRule: { minimumAttemptCount: 1 } }, "invalid_shape");
});

test("returns calculation_error when the projected calendar date is not representable", () => {
  const result = calculatePaceForecast(input({
    requiredAttemptCount: 1_000_000_000,
    completedFacts: facts(["2026-01-31"]),
  }));
  assert.deepEqual(result, { kind: "unavailable", reason: "calculation_error" });
});

test("uses full immutable facts and does not double-count session questions", () => {
  const mutableFacts = { sessions: [{ completedAt: "2026-01-20T10:00:00.000Z", completedQuestions: 10, plannedQuestions: 10 }], attempts: [{ answeredAt: "2026-01-20T10:00:00.000Z", countsTowardCompletion: true }] } satisfies ImmutableCompletedFacts;
  const before = structuredClone(mutableFacts);
  const result = calculatePaceForecast(input({ requiredAttemptCount: 5, completedFacts: mutableFacts }));
  assert.deepEqual(mutableFacts, before);
  assert.equal(result.kind, "available");
  if (result.kind === "available") assert.equal(result.remainingRequiredAttempts, 4);
  assert.equal(Object.isFrozen(result), true);
  if (result.kind === "available") {
    assert.equal(Object.isFrozen(result.source), true);
    assert.equal(Object.isFrozen(result.source.target), true);
    assert.equal(Object.isFrozen(result.source.contentPackagePin), true);
  }
});

test("handles DST, leap-day calendar arithmetic, and today occurrences without elapsed milliseconds", () => {
  const dstPlan = plan({ timezone: "America/New_York", createdAt: "2024-02-20T12:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2024-03-12" }, slots: [
    { slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 3 },
    { slotId: createLearningPlanSlotId("slot:sun"), day: "sun", localTime: "18:00", sessionLength: 3 },
  ] });
  const result = calculatePaceForecast(input({ acceptedPlan: dstPlan, timezone: "America/New_York", today: "2024-03-10", requiredAttemptCount: 2, completedFacts: { sessions: [], attempts: [{ answeredAt: "2024-03-10T04:30:00.000Z", countsTowardCompletion: true }] } }));
  assert.equal(result.kind, "available");
  if (result.kind === "available") assert.equal(result.remainingPlannedCapacity, 6);

  const leap = calculatePaceForecast(input({ acceptedPlan: plan({ createdAt: "2024-02-20T10:00:00.000Z", acceptedTarget: { meaning: "deadline", targetDate: "2024-03-03" }, slots: [{ slotId: createLearningPlanSlotId("slot:thu"), day: "thu", localTime: "18:00", sessionLength: 2 }, { slotId: createLearningPlanSlotId("slot:fri"), day: "fri", localTime: "18:00", sessionLength: 2 }] }), today: "2024-02-28", requiredAttemptCount: 2, completedFacts: { sessions: [], attempts: [{ answeredAt: "2024-02-28T10:00:00.000Z", countsTowardCompletion: true }] } }));
  assert.equal(leap.kind, "available");
  if (leap.kind === "available") assert.equal(leap.remainingPlannedCapacity, 4);
});

test("rejects malformed numbers, dates, timezones, future facts, and inconsistent sessions", () => {
  assertInvalid(input({ today: "2026-02-30" }), "invalid_today");
  assertInvalid(input({ timezone: "Mars/Olympus" }), "invalid_timezone");
  assertInvalid(input({ requiredAttemptCount: -1 }), "invalid_completion_requirement");
  assertInvalid(input({ completedFacts: { sessions: [], attempts: [{ answeredAt: "2026-02-02T10:00:00.000Z", countsTowardCompletion: true }] } }), "future_fact");
  assertInvalid(input({ completedFacts: { sessions: [{ completedAt: "2026-01-20T10:00:00.000Z", completedQuestions: 4, plannedQuestions: 3 }], attempts: [] } }), "inconsistent_fact");
  assertInvalid(input({ acceptedPlan: { ...plan(), trackId: "not-a-track" } }), "invalid_plan");
});
