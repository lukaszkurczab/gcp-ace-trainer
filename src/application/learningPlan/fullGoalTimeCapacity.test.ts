import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanningCalendar } from "../../domain/learning/planningCalendar";
import type { FullGoalWorkloadProjection } from "./fullGoalWorkloadProjection";
import { assessFullGoalTimeCapacity } from "./fullGoalTimeCapacity";

const legalSessions = [{ sessionLength: 10, minMinutes: 10, typicalMinutes: 20, maxMinutes: 30 }];
const workload = (min: number, typical: number, max: number): FullGoalWorkloadProjection => ({
  kind: "estimated", chapters: [], dueReviews: [], sessionDemands: [], activeContinuation: null, nextPractice: null, requiredResponses: 480, dueReviewResponses: 0, newResponses: 480,
  knownMinMinutes: min, knownTypicalMinutes: typical, knownMaxMinutes: max,
  unknownChapterIds: [], uncostedDueReviewIds: [], qualityUncertainChapterIds: [],
  distribution: "median_scope_typical_with_conservative_extremes", provenance: "authored", observationCount: 0,
});
function calendar(targetDate: string): ReturnType<typeof buildPlanningCalendar> {
  return buildPlanningCalendar({ localToday: "2026-10-09", timezone: "Europe/Warsaw", preferredDays: ["fri", "sat", "sun"], weeklySessionTarget: 3,
    dueObligations: [], targetDate, targetMeaning: "deadline", availableMinutesPerStudyDay: 120,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1 });
}

test("a known 480-minute lower bound exceeds a 240-minute target-window capacity", () => {
  const capacity = assessFullGoalTimeCapacity({ workload: workload(480, 600, 720), calendar: calendar("2026-10-09") });
  assert.equal(capacity.availableMinutes, 240);
  assert.equal(capacity.kind, "minimum_exceeds_available_time");
});

test("the same workload sees more civil-day capacity with a longer target horizon", () => {
  const short = assessFullGoalTimeCapacity({ workload: workload(480, 600, 720), calendar: calendar("2026-10-16") });
  const long = assessFullGoalTimeCapacity({ workload: workload(480, 600, 720), calendar: calendar("2026-12-08") });
  assert.equal(short.workTypicalMinutes, long.workTypicalMinutes);
  assert.ok((long.availableMinutes ?? 0) > (short.availableMinutes ?? 0));
});

test("unknown chapter cost or quality upper bound never becomes a full-fit claim", () => {
  const incomplete: FullGoalWorkloadProjection = { ...workload(100, 200, 300), kind: "incomplete", knownMaxMinutes: null, unknownChapterIds: ["premium"] };
  const capacity = assessFullGoalTimeCapacity({ workload: incomplete, calendar: calendar("2026-12-08") });
  assert.equal(capacity.kind, "uncertain");
  assert.equal(capacity.workMaxMinutes, null);
});

test("unknown today capacity cannot turn a partial known budget into a confirmed shortfall", () => {
  const withUnknownToday = buildPlanningCalendar({ localToday: "2026-10-09", timezone: "Europe/Warsaw", preferredDays: ["fri", "sat"], weeklySessionTarget: 2,
    dueObligations: [], targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "unknown", reason: "session_started_before_today" }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1 });
  const capacity = assessFullGoalTimeCapacity({ workload: workload(50, 55, 60), calendar: withUnknownToday });
  assert.deepEqual(capacity.unknownCapacityDates, ["2026-10-09"]);
  assert.equal(capacity.availableMinutes, 40);
  assert.equal(capacity.kind, "uncertain");
});

test("an actual due response after the deadline is surfaced as an unscheduled obligation", () => {
  const withLateReview = buildPlanningCalendar({ localToday: "2026-10-09", timezone: "Europe/Warsaw", preferredDays: ["fri", "sat"], weeklySessionTarget: 2,
    dueObligations: [{ id: "due-late", dueAt: "2026-10-11T08:00:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 240,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1 });
  const capacity = assessFullGoalTimeCapacity({ workload: workload(20, 30, 40), calendar: withLateReview });
  assert.equal(capacity.kind, "unscheduled_due_reviews");
  assert.deepEqual(capacity.unscheduledReviewObligationIds, ["due-late"]);
});
