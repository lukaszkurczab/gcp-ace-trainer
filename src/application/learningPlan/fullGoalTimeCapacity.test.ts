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

function dailyTwentyMinuteCalendar(targetDate: string, dueObligations: Parameters<typeof buildPlanningCalendar>[0]["dueObligations"] = []) {
  return buildPlanningCalendar({ localToday: "2026-10-22", timezone: "Europe/Warsaw", preferredDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], weeklySessionTarget: 7,
    dueObligations, targetDate, targetMeaning: "deadline", availableMinutesPerStudyDay: 20,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00",
    legalSessions: [{ sessionLength: 10, minMinutes: 20, typicalMinutes: 20, maxMinutes: 20 }], requiredSessionCount: 1 });
}

test("480 minutes of required work exceed twelve 20-minute dates by 240 minutes", () => {
  // Independent required-work oracle: 360 new + 90 real due review + 30 checks.
  const requiredMinimum = 360 + 90 + 30;
  const capacity = assessFullGoalTimeCapacity({ workload: workload(requiredMinimum, 600, 720), calendar: dailyTwentyMinuteCalendar("2026-11-02") });
  assert.equal(capacity.availableMinutes, 240);
  assert.deepEqual([capacity.workMinMinutes, capacity.workTypicalMinutes, capacity.workMaxMinutes], [480, 600, 720]);
  assert.equal(capacity.workMinMinutes! - capacity.availableMinutes!, 240);
  assert.equal(capacity.kind, "minimum_exceeds_available_time");
});

test("twenty-four 20-minute dates provide nominal 480-minute capacity without overriding a later due review", () => {
  const required = workload(480, 480, 480);
  const capacity = assessFullGoalTimeCapacity({ workload: required, calendar: dailyTwentyMinuteCalendar("2026-11-14") });
  assert.equal(capacity.availableMinutes, 480);
  assert.deepEqual([capacity.workMinMinutes, capacity.workTypicalMinutes, capacity.workMaxMinutes], [480, 480, 480]);
  assert.equal(capacity.kind, "range_within_available_time", "a time-range comparison is not a completion or legal-session guarantee");
  const lateReview = { id: "due-after-target", dueAt: "2026-11-15T08:00:00.000Z", minMinutes: 10, typicalMinutes: 10, maxMinutes: 10 };
  const before = JSON.stringify(lateReview);
  const withFutureDue = assessFullGoalTimeCapacity({ workload: required, calendar: dailyTwentyMinuteCalendar("2026-11-14", [lateReview]) });
  assert.equal(withFutureDue.availableMinutes, 480);
  assert.equal(withFutureDue.kind, "unscheduled_due_reviews");
  assert.deepEqual(withFutureDue.unscheduledReviewObligationIds, [lateReview.id]);
  assert.equal(JSON.stringify(lateReview), before);
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
