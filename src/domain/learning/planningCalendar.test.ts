import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanningCalendar } from "./planningCalendar";

const legalSessions = [
  { sessionLength: 10, minMinutes: 15, typicalMinutes: 20, maxMinutes: 25 },
  { sessionLength: 20, minMinutes: 30, typicalMinutes: 40, maxMinutes: 50 },
];

test("counts each preferred civil date once across the Europe/Warsaw DST transition", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-24", timezone: "Europe/Warsaw", preferredDays: ["sun"], weeklySessionTarget: 1, dueObligations: [], requiredSessionCount: 1,
    targetDate: "2026-10-26", targetMeaning: "deadline", availableMinutesPerStudyDay: 60,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });
  assert.deepEqual(result.availableDays.map(({ localDate, day }) => [localDate, day]), [["2026-10-25", "sun"]]);
  assert.equal(result.totalAvailableMinutes, 60);
});

test("subtracts today's active foreground time once without transferring a missed day", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri", "sat"], weeklySessionTarget: 3, dueObligations: [], requiredSessionCount: 3,
    targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 15 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions: [{ sessionLength: 10, minMinutes: 15, typicalMinutes: 20, maxMinutes: 25 }],
  });
  assert.deepEqual(result.availableDays.map((day) => [day.localDate, day.availableMinutes, day.selectedSession?.sessionLength]), [["2026-10-08", 25, 10], ["2026-10-09", 40, 10], ["2026-10-10", 40, 10]]);
  assert.equal(result.totalAvailableMinutes, 105);
});

test("keeps own-pace open ended and never creates a non-profile session length", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1, dueObligations: [],
    targetDate: null, targetMeaning: "none", availableMinutesPerStudyDay: 10,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });
  assert.equal(result.kind, "open_ended");
  assert.ok(result.availableDays.length > 0);
  assert.ok(result.availableDays.every(({ selectedSession }) => selectedSession === null));
});

test("excludes event day, includes checkpoint day, and reports no-fit shortfall", () => {
  const base = { localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2, dueObligations: [], availableMinutesPerStudyDay: 10, todayActiveTime: { kind: "known" as const, minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 2 } as const;
  const event = buildPlanningCalendar({ ...base, targetDate: "2026-10-09", targetMeaning: "event" });
  const checkpoint = buildPlanningCalendar({ ...base, targetDate: "2026-10-09", targetMeaning: "checkpoint" });
  assert.deepEqual(event.availableDays.map((day) => day.localDate), ["2026-10-08"]);
  assert.deepEqual(checkpoint.availableDays.map((day) => day.localDate), ["2026-10-08", "2026-10-09"]);
  assert.equal(checkpoint.kind, "shortfall");
  assert.deepEqual(checkpoint.noFitDays, ["2026-10-08", "2026-10-09"]);
  assert.equal(checkpoint.missingRequiredSessionCount, 2);
});

test("rejects unsafe availability, timezone and target values", () => {
  const valid = { localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"] as const, weeklySessionTarget: 1, dueObligations: [], targetDate: null, targetMeaning: "none" as const, availableMinutesPerStudyDay: 20, todayActiveTime: { kind: "known" as const, minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions };
  assert.throws(() => buildPlanningCalendar({ ...valid, availableMinutesPerStudyDay: 1441 }), RangeError);
  assert.throws(() => buildPlanningCalendar({ ...valid, timezone: "Not/AZone" }), RangeError);
  assert.throws(() => buildPlanningCalendar({ ...valid, localToday: "2026-02-30" }), RangeError);
});

test("does not call a partially fitting window a global shortfall without known required work", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2, dueObligations: [],
    targetDate: "2026-10-09", targetMeaning: "deadline", availableMinutesPerStudyDay: 20,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00",
    legalSessions: [{ sessionLength: 10, minMinutes: 15, typicalMinutes: 20, maxMinutes: 20 }],
  });
  assert.equal(result.kind, "preview");
  assert.equal(result.noFitDays.length, 0);
  assert.equal(result.missingRequiredSessionCount, null);
});

test("reports a past target explicitly and returns no new calendar slots", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1, dueObligations: [],
    targetDate: "2026-10-07", targetMeaning: "deadline", availableMinutesPerStudyDay: 20,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });
  assert.equal(result.kind, "past_target");
  assert.equal(result.availableDays.length, 0);
});

test("assigns review only on or after its actual due instant in the plan timezone", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2,
    dueObligations: [{ id: "review-friday", dueAt: "2026-10-09T10:00:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-15", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions: [{ sessionLength: 10, minMinutes: 10, typicalMinutes: 15, maxMinutes: 20 }],
    requiredSessionCount: 3,
  });
  assert.deepEqual(result.availableDays.slice(0, 2).map(({ localDate, reviewObligationIds }) => [localDate, reviewObligationIds]), [["2026-10-08", []], ["2026-10-09", ["review-friday"]]]);
});

test("does not pull a not-yet-due review before an event deadline and reports its unscheduled identity", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2,
    dueObligations: [{ id: "review-after-event", dueAt: "2026-10-09T10:00:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-09", targetMeaning: "event", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 0,
  });
  assert.deepEqual(result.availableDays.map(({ localDate }) => localDate), ["2026-10-08"]);
  assert.deepEqual(result.unscheduledReviewObligationIds, ["review-after-event"]);
  assert.equal(result.kind, "shortfall");
});

test("keeps today's capacity unknown when cumulative foreground time crosses the civil-date boundary", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2, dueObligations: [],
    targetDate: "2026-10-09", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "unknown", reason: "active_interval_crosses_today_boundary" }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1,
  });
  assert.equal(result.availableDays[0]?.availableMinutes, null);
  assert.equal(result.availableDays[0]?.selectedSession, null);
  assert.equal(result.availableDays[0]?.reason, "active_time_unknown");
  assert.deepEqual(result.unknownCapacityDates, ["2026-10-08"]);
  assert.equal(result.availableDays[1]?.availableMinutes, 40);
  assert.equal(result.availableDays[1]?.selectedSession?.sessionLength, 10);
  assert.equal(result.kind, "scheduled");
});

test("does not schedule a same-day review before its due instant and fixed proposal time", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2,
    dueObligations: [{ id: "review-after-session-time", dueAt: "2026-10-08T18:30:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-09", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 0,
  });
  assert.deepEqual(result.availableDays[0]?.reviewObligationIds, []);
  assert.deepEqual(result.availableDays[1]?.reviewObligationIds, ["review-after-session-time"]);
});

test("does not offer a proposal slot whose fixed local start time has already passed today", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2, dueObligations: [],
    targetDate: "2026-10-09", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "19:01", legalSessions, requiredSessionCount: 1,
  });
  assert.deepEqual(result.availableDays.map(({ localDate }) => localDate), ["2026-10-09"]);
  assert.equal(result.availableDays[0]?.selectedSession?.sessionLength, 10);
});

test("does not claim a guaranteed shortfall when today's known capacity is unavailable", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1, dueObligations: [],
    targetDate: "2026-10-08", targetMeaning: "checkpoint", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "unknown", reason: "session_started_before_today" }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1,
  });
  assert.equal(result.kind, "capacity_unknown");
  assert.equal(result.missingRequiredSessionCount, 1);
  assert.deepEqual(result.unknownCapacityDates, ["2026-10-08"]);
  assert.deepEqual(result.noFitDays, []);
});

test("does not report a due review as a confirmed horizon shortfall when only unknown capacity could fit it", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1,
    dueObligations: [{ id: "due-today", dueAt: "2026-10-08T08:00:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-08", targetMeaning: "checkpoint", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "unknown", reason: "active_interval_crosses_today_boundary" }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 0,
  });
  assert.equal(result.kind, "capacity_unknown");
  assert.deepEqual(result.unscheduledReviewObligationIds, []);
  assert.deepEqual(result.unknownReviewObligationIds, ["due-today"]);
  assert.deepEqual(result.availableDays[0]?.reviewObligationIds, []);
});

test("keeps a session blocked by unknown time separate from an independently confirmed late review shortfall", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1,
    dueObligations: [{ id: "due-after-session", dueAt: "2026-10-08T18:30:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }],
    targetDate: "2026-10-08", targetMeaning: "checkpoint", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "unknown", reason: "active_interval_crosses_today_boundary" }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 1,
  });
  assert.equal(result.kind, "shortfall", "the review due after the only legal start is a confirmed horizon shortfall");
  assert.deepEqual(result.unscheduledReviewObligationIds, ["due-after-session"]);
  assert.deepEqual(result.unknownCapacityDates, ["2026-10-08"]);
  assert.equal(result.missingRequiredSessionCount, 1);
  assert.equal(result.unscheduledSessionCount, 0);
  assert.equal(result.unknownRequiredSessionCount, 1);
});

test("carries due-first obligations into later legal windows when one day cannot hold them", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri", "sat"], weeklySessionTarget: 3,
    dueObligations: [
      { id: "oldest", dueAt: "2026-10-08T08:00:00.000Z", minMinutes: 10, typicalMinutes: 20, maxMinutes: 25 },
      { id: "second", dueAt: "2026-10-08T09:00:00.000Z", minMinutes: 10, typicalMinutes: 20, maxMinutes: 25 },
      { id: "third", dueAt: "2026-10-08T10:00:00.000Z", minMinutes: 10, typicalMinutes: 20, maxMinutes: 25 },
    ],
    targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions, requiredSessionCount: 0,
  });
  assert.deepEqual(result.availableDays.map(({ localDate, reviewObligationIds }) => [localDate, reviewObligationIds]), [
    ["2026-10-08", ["oldest"]], ["2026-10-09", ["second"]], ["2026-10-10", ["third"]],
  ]);
  assert.deepEqual(result.unscheduledReviewObligationIds, []);
  assert.equal(result.kind, "scheduled");
});

test("schedules typed diagnosis then legal practice work after due reviews without inventing session lengths", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri", "sat"], weeklySessionTarget: 3,
    dueObligations: [{ id: "due-first", dueAt: "2026-10-08T08:00:00.000Z", minMinutes: 5, typicalMinutes: 10, maxMinutes: 10 }],
    sessionDemands: [
      { id: "diagnosis", modeId: "canonical-diagnostic", phase: "diagnosis", responseCount: 20, legalOptions: [{ sessionLength: 20, minMinutes: 10, typicalMinutes: 15, maxMinutes: 20 }] },
      { id: "practice", modeId: "canonical-practice", phase: "practice", responseCount: 20, legalOptions: [{ sessionLength: 10, minMinutes: 5, typicalMinutes: 10, maxMinutes: 15 }, { sessionLength: 20, minMinutes: 10, typicalMinutes: 20, maxMinutes: 25 }] },
    ],
    targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 40,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });
  assert.deepEqual(result.availableDays.map(({ localDate, reviewObligationIds, selectedWork, selectedSession }) => [localDate, reviewObligationIds, selectedWork?.phase, selectedSession?.sessionLength]), [
    ["2026-10-08", ["due-first"], "diagnosis", 20],
    ["2026-10-09", [], "practice", 20],
    ["2026-10-10", [], undefined, undefined],
  ]);
  assert.equal(result.kind, "scheduled");
  assert.deepEqual(result.unscheduledWorkDemandIds, []);
  assert.equal(result.unscheduledWorkResponses, 0);
});

test("continues one real elapsed-foreground session across daily budgets without inventing response blocks", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri", "sat"], weeklySessionTarget: 3, dueObligations: [],
    sessionDemands: [{ id: "fixed-diagnostic", modeId: "canonical-diagnostic", phase: "diagnosis", responseCount: 40,
      legalOptions: [{ sessionLength: 40, minMinutes: 40, typicalMinutes: 160, maxMinutes: 640 }], canResumeAcrossWindows: true }],
    targetDate: "2026-10-10", targetMeaning: "deadline", availableMinutesPerStudyDay: 20,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });

  assert.deepEqual(result.availableDays.map(({ localDate, selectedSession, selectedWork }) => [localDate, selectedSession?.sessionLength, selectedWork?.plannedMinutes, selectedWork?.continuation]), [
    ["2026-10-08", 40, 20, false], ["2026-10-09", 40, 20, true], ["2026-10-10", 40, 20, true],
  ]);
  assert.equal(result.totalTypicalPlannedMinutes, 60);
  assert.deepEqual(result.unscheduledWorkDemandIds, ["fixed-diagnostic"]);
  assert.equal(result.unscheduledWorkResponses, 40, "partial elapsed time does not count as completed diagnostic responses");
  assert.equal(result.kind, "shortfall");
});

test("does not split a non-resumable fixed-duration work item into daily fragments", () => {
  const result = buildPlanningCalendar({
    localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu", "fri"], weeklySessionTarget: 2, dueObligations: [],
    sessionDemands: [{ id: "fixed-duration", modeId: "fixed-deadline-mode", phase: "practice", responseCount: 40,
      legalOptions: [{ sessionLength: 40, minMinutes: 40, typicalMinutes: 160, maxMinutes: 640 }], canResumeAcrossWindows: false }],
    targetDate: "2026-10-09", targetMeaning: "deadline", availableMinutesPerStudyDay: 20,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions,
  });
  assert.ok(result.availableDays.every((day) => day.selectedWork === null));
  assert.deepEqual(result.unscheduledWorkDemandIds, ["fixed-duration"]);
  assert.equal(result.totalTypicalPlannedMinutes, 0);
});
