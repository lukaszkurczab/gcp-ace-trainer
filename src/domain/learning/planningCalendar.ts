import type { AcceptedTargetMeaning } from "./learningPlan";
import { GOAL_DAY_IDS, type GoalDay } from "../goals/goalContracts";

export type LegalSessionOption = Readonly<{ sessionLength: number; minMinutes: number; typicalMinutes: number; maxMinutes: number }>;
export type PlanningDueObligation = Readonly<{ id: string; dueAt: string; minMinutes: number; typicalMinutes: number; maxMinutes: number }>;
/** A forecast of selectable work in one real mode. It is an aggregate pool bound, not a list of future attempts. */
export type PlanningSessionDemand = Readonly<{ id: string; modeId: string; phase: "diagnosis" | "practice" | "review" | "quality_repair"; responseCount: number; legalOptions: readonly LegalSessionOption[]; canResumeAcrossWindows?: boolean; isExistingSession?: boolean;
  kind?: "continue_existing"; sessionId?: string; reviewEntryIds?: readonly string[] }>;
export type TodayActiveTime = Readonly<{ kind: "known"; minutes: number }> | Readonly<{ kind: "unknown"; reason: "session_started_before_today" | "active_interval_crosses_today_boundary" | "unavailable" }>;
export type PlanningCalendarDay = Readonly<{
  localDate: string;
  day: GoalDay;
  /** Null means today's used foreground time cannot be partitioned by civil date. */
  availableMinutes: number | null;
  reviewObligationIds: readonly string[];
  reviewMinutes: number;
  remainingMinutesForNewWork: number;
  reviewShortfallMinutes: number;
  selectedSession: LegalSessionOption | null;
  selectedWork: Readonly<{ demandId: string; modeId: string; phase: PlanningSessionDemand["phase"]; plannedMinutes: number; continuation: boolean; responsesRemaining: number }> | null;
  reason: "scheduled" | "no_planned_work" | "active_time_reduces_capacity" | "active_time_unknown" | "review_obligation_exceeds_budget" | "no_legal_session_fits";
}>;
export type PlanningCalendarResult = Readonly<{
  kind: "scheduled" | "shortfall" | "capacity_unknown" | "preview" | "open_ended" | "past_target";
  timezone: string;
  localToday: string;
  previewThrough: string;
  targetDate: string | null;
  targetMeaning: AcceptedTargetMeaning;
  availableDays: readonly PlanningCalendarDay[];
  noFitDays: readonly string[];
  totalAvailableMinutes: number;
  unknownCapacityDates: readonly string[];
  totalTypicalPlannedMinutes: number;
  unscheduledSessionCount: number;
  missingRequiredSessionCount: number | null;
  unknownRequiredSessionCount: number;
  unscheduledReviewObligationIds: readonly string[];
  unknownReviewObligationIds: readonly string[];
  unscheduledWorkDemandIds: readonly string[];
  unknownWorkDemandIds: readonly string[];
  unscheduledWorkResponses: number;
  unknownWorkResponses: number;
}>;

/** Builds a civil-date calendar; no 24-hour duration assumption is made across DST. */
export function buildPlanningCalendar(input: Readonly<{
  localToday: string;
  timezone: string;
  preferredDays: readonly GoalDay[];
  weeklySessionTarget: number;
  dueObligations: readonly PlanningDueObligation[];
  sessionDemands?: readonly PlanningSessionDemand[];
  targetDate: string | null;
  targetMeaning: AcceptedTargetMeaning;
  availableMinutesPerStudyDay: number;
  todayActiveTime: TodayActiveTime;
  /** Existing proposal slots use this wall-clock time. Due instants are compared in the plan timezone. */
  sessionLocalTime: string;
  sessionLocalTimesByDay?: Partial<Readonly<Record<GoalDay, string>>>;
  currentLocalTime: string;
  legalSessions: readonly LegalSessionOption[];
  requiredSessionCount?: number;
  openEndedPreviewDays?: number;
}>): PlanningCalendarResult {
  validateInput(input);
  const previewDays = input.targetDate === null || input.targetMeaning === "none"
    ? Math.max(0, (input.openEndedPreviewDays ?? 28) - 1)
    : Math.max(0, daysBetween(input.localToday, input.targetDate) + (input.targetMeaning === "event" ? 0 : 1));
  const pastTarget = input.targetDate !== null && (input.targetDate < input.localToday || (input.targetMeaning === "event" && input.targetDate === input.localToday));
  const previewThrough = addCivilDays(input.localToday, previewDays);
  const result: PlanningCalendarDay[] = [];
  const noFitDays: string[] = [];
  let totalAvailableMinutes = 0;
  const unknownCapacityDates: string[] = [];
  let totalTypicalPlannedMinutes = 0;
  let selectedSessionCount = 0;
  let scheduledWorkResponses = 0;
  const scheduledResponsesByDemand = new Map<string, number>();
  const activeDemandSessions = new Map<string, { option: LegalSessionOption; elapsedTypicalMinutes: number }>();
  const scheduledPerWeek = new Map<string, number>();
  const obligationAssignments = new Map<string, Array<{ id: string; minMinutes: number; typicalMinutes: number; maxMinutes: number }>>();
  const candidateDates: string[] = [];

  for (let offset = 0; !pastTarget && offset <= previewDays; offset += 1) {
    const localDate = addCivilDays(input.localToday, offset);
    if (input.targetDate !== null && localDate >= input.targetDate && input.targetMeaning === "event") continue;
    const weekday = weekdayForCivilDate(localDate);
    const day = GOAL_DAY_IDS[weekday]!;
    if (localDate === input.localToday && input.currentLocalTime > sessionTimeForDate(input, localDate)) continue;
    if (!input.preferredDays.includes(day)) continue;
    const week = weekStart(localDate);
    if ((scheduledPerWeek.get(week) ?? 0) >= input.weeklySessionTarget) continue;
    scheduledPerWeek.set(week, (scheduledPerWeek.get(week) ?? 0) + 1);
    candidateDates.push(localDate);
  }

  const unscheduledReviewObligationIds: string[] = [];
  const unknownReviewObligationIds: string[] = [];
  const unscheduledWorkDemandIds: string[] = [];
  const unknownWorkDemandIds: string[] = [];
  const obligations = [...input.dueObligations].sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt) || left.id.localeCompare(right.id));
  const capacityForDate = (date: string): number | null => {
    if (date === input.localToday && input.todayActiveTime.kind === "unknown") return null;
    return input.availableMinutesPerStudyDay - (date === input.localToday && input.todayActiveTime.kind === "known" ? input.todayActiveTime.minutes : 0);
  };
  for (const obligation of obligations) {
    const earliest = localDateForInstant(obligation.dueAt, input.timezone);
    const eligibleDates = candidateDates.filter((date) => date >= earliest && (date !== earliest || localTimeForInstant(obligation.dueAt, input.timezone) <= sessionTimeForDate(input, date)));
    const assignedDate = eligibleDates.find((date) => {
      const capacity = capacityForDate(date);
      if (capacity === null) return false;
      const alreadyAssignedMax = (obligationAssignments.get(date) ?? []).reduce((sum, assigned) => sum + assigned.maxMinutes, 0);
      return alreadyAssignedMax + obligation.maxMinutes <= Math.max(0, capacity);
    });
    if (!assignedDate) {
      if (eligibleDates.some((date) => capacityForDate(date) === null)) unknownReviewObligationIds.push(obligation.id);
      else unscheduledReviewObligationIds.push(obligation.id);
      continue;
    }
    const assigned = obligationAssignments.get(assignedDate) ?? [];
    assigned.push(obligation);
    obligationAssignments.set(assignedDate, assigned);
  }

  for (const localDate of candidateDates) {
    const weekday = weekdayForCivilDate(localDate);
    const day = GOAL_DAY_IDS[weekday]!;
    const todayUnknown = localDate === input.localToday && input.todayActiveTime.kind === "unknown";
    const activeToday = localDate === input.localToday && input.todayActiveTime.kind === "known" ? input.todayActiveTime.minutes : 0;
    const availableMinutes = todayUnknown ? null : Math.max(0, input.availableMinutesPerStudyDay - activeToday);
    const assignedReviews = obligationAssignments.get(localDate) ?? [];
    const reviewMinutes = assignedReviews.reduce((sum, obligation) => sum + obligation.typicalMinutes, 0);
    const reviewMaxMinutes = assignedReviews.reduce((sum, obligation) => sum + obligation.maxMinutes, 0);
    const remainingMinutesForNewWork = availableMinutes === null ? 0 : Math.max(0, availableMinutes - reviewMaxMinutes);
    const reviewShortfallMinutes = availableMinutes === null ? 0 : Math.max(0, reviewMaxMinutes - availableMinutes);
    const workDemand = (input.sessionDemands ?? []).find((demand) => activeDemandSessions.has(demand.id))
      ?? (input.sessionDemands ?? []).find((demand) => (scheduledResponsesByDemand.get(demand.id) ?? 0) < demand.responseCount);
    const demandRemains = workDemand !== undefined || (input.requiredSessionCount !== undefined && selectedSessionCount < input.requiredSessionCount);
    const activeDemand = workDemand ? activeDemandSessions.get(workDemand.id) : undefined;
    const canResume = workDemand?.canResumeAcrossWindows === true;
    const options = workDemand?.legalOptions ?? input.legalSessions;
    const nextOption = activeDemand?.option ?? (demandRemains ? options
      .filter((session) => session.sessionLength <= (workDemand ? workDemand.responseCount - (scheduledResponsesByDemand.get(workDemand.id) ?? 0) : Number.MAX_SAFE_INTEGER) || workDemand?.isExistingSession === true)
      .filter((session) =>
        (canResume || session.maxMinutes <= remainingMinutesForNewWork))
      .sort((left, right) => right.sessionLength - left.sessionLength)[0] ?? null : null);
    const fitting = demandRemains && !todayUnknown && nextOption !== null &&
      (canResume ? remainingMinutesForNewWork > 0 : nextOption.maxMinutes <= remainingMinutesForNewWork) ? nextOption : null;
    const plannedMinutes = fitting
      ? canResume ? Math.min(remainingMinutesForNewWork, Math.max(0, fitting.typicalMinutes - (activeDemand?.elapsedTypicalMinutes ?? 0))) : fitting.typicalMinutes
      : 0;
    const responsesRemaining = fitting && workDemand ? Math.max(0, workDemand.responseCount - (scheduledResponsesByDemand.get(workDemand.id) ?? 0)) : 0;
    const selectedWork = fitting && workDemand ? Object.freeze({ demandId: workDemand.id, modeId: workDemand.modeId, phase: workDemand.phase,
      plannedMinutes, continuation: activeDemand !== undefined || workDemand.isExistingSession === true, responsesRemaining }) : null;
    if (availableMinutes === null) unknownCapacityDates.push(localDate);
    else totalAvailableMinutes += availableMinutes;
    if (!fitting && assignedReviews.length === 0 && demandRemains && !todayUnknown) {
      noFitDays.push(localDate);
    } else {
      totalTypicalPlannedMinutes += reviewMinutes + plannedMinutes;
      if (fitting) {
        selectedSessionCount += 1;
        if (workDemand) {
          if (canResume) {
            const elapsedTypicalMinutes = (activeDemand?.elapsedTypicalMinutes ?? 0) + plannedMinutes;
            if (elapsedTypicalMinutes >= fitting.typicalMinutes) {
              const completedResponses = Math.min(fitting.sessionLength, responsesRemaining);
              scheduledWorkResponses += completedResponses;
              scheduledResponsesByDemand.set(workDemand.id, (scheduledResponsesByDemand.get(workDemand.id) ?? 0) + completedResponses);
              activeDemandSessions.delete(workDemand.id);
            } else {
              activeDemandSessions.set(workDemand.id, { option: fitting, elapsedTypicalMinutes });
            }
          } else {
            const completedResponses = Math.min(fitting.sessionLength, responsesRemaining);
            scheduledWorkResponses += completedResponses;
            scheduledResponsesByDemand.set(workDemand.id, (scheduledResponsesByDemand.get(workDemand.id) ?? 0) + completedResponses);
          }
        }
      }
    }
    result.push(Object.freeze({
      localDate,
      day,
      availableMinutes,
      reviewObligationIds: Object.freeze(assignedReviews.map(({ id }) => id)),
      reviewMinutes,
      remainingMinutesForNewWork,
      reviewShortfallMinutes,
      selectedSession: fitting,
      selectedWork,
      reason: todayUnknown ? "active_time_unknown" : reviewShortfallMinutes > 0 ? "review_obligation_exceeds_budget" : fitting ? activeToday > 0 ? "active_time_reduces_capacity" : "scheduled" : assignedReviews.length > 0 ? "scheduled" : demandRemains ? "no_legal_session_fits" : "no_planned_work",
    }));
  }

  const missingRequiredSessionCount = input.requiredSessionCount === undefined ? null : Math.max(0, input.requiredSessionCount - selectedSessionCount);
  const totalWorkResponses = (input.sessionDemands ?? []).reduce((sum, demand) => sum + demand.responseCount, 0);
  const missingWorkResponses = Math.max(0, totalWorkResponses - scheduledWorkResponses);
  const remainingWork = (input.sessionDemands ?? []).filter((demand) => (scheduledResponsesByDemand.get(demand.id) ?? 0) < demand.responseCount);
  if (missingWorkResponses > 0) (unknownCapacityDates.length > 0 ? unknownWorkDemandIds : unscheduledWorkDemandIds).push(...remainingWork.map((demand) => demand.id));
  const unknownWorkResponses = unknownWorkDemandIds.length > 0 ? remainingWork.reduce((sum, demand) => sum + demand.responseCount - (scheduledResponsesByDemand.get(demand.id) ?? 0), 0) : 0;
  const unscheduledWorkResponses = unscheduledWorkDemandIds.length > 0 ? remainingWork.reduce((sum, demand) => sum + demand.responseCount - (scheduledResponsesByDemand.get(demand.id) ?? 0), 0) : 0;
  const hasUnknownFit = unknownCapacityDates.length > 0 && (unknownReviewObligationIds.length > 0 || (missingRequiredSessionCount ?? 0) > 0 || unknownWorkResponses > 0);
  const kind = pastTarget ? "past_target" as const
    : input.targetDate === null || input.targetMeaning === "none" ? "open_ended" as const
        : unscheduledReviewObligationIds.length > 0 ? "shortfall" as const
          : hasUnknownFit ? "capacity_unknown" as const
          : unknownReviewObligationIds.length > 0 ? "capacity_unknown" as const
          : (missingRequiredSessionCount ?? 0) > 0 || unscheduledWorkResponses > 0 ? "shortfall" as const : (input.sessionDemands?.length ?? 0) > 0 ? "scheduled" as const : input.requiredSessionCount !== undefined ? "scheduled" as const : "preview" as const;
  const unknownRequiredSessionCount = Math.min(missingRequiredSessionCount ?? 0, unknownCapacityDates.length);
  const unscheduledSessionCount = Math.max(0, (missingRequiredSessionCount ?? 0) - unknownRequiredSessionCount);
  return Object.freeze({
    kind,
    timezone: input.timezone,
    localToday: input.localToday,
    previewThrough,
    targetDate: input.targetDate,
    targetMeaning: input.targetMeaning,
    availableDays: Object.freeze(result),
    noFitDays: Object.freeze(noFitDays),
    totalAvailableMinutes,
    unknownCapacityDates: Object.freeze(unknownCapacityDates),
    totalTypicalPlannedMinutes,
    unscheduledSessionCount,
    missingRequiredSessionCount,
    unknownRequiredSessionCount,
    unscheduledReviewObligationIds: Object.freeze(unscheduledReviewObligationIds),
    unknownReviewObligationIds: Object.freeze(unknownReviewObligationIds),
    unscheduledWorkDemandIds: Object.freeze([...new Set(unscheduledWorkDemandIds)]),
    unknownWorkDemandIds: Object.freeze([...new Set(unknownWorkDemandIds)]),
    unscheduledWorkResponses,
    unknownWorkResponses,
  });
}

function validateInput(input: Parameters<typeof buildPlanningCalendar>[0]): void {
  if (!isIsoDate(input.localToday) || (input.targetDate !== null && !isIsoDate(input.targetDate))) throw new RangeError("Planning calendar requires valid civil dates.");
  try { new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format(new Date("2026-01-01T00:00:00.000Z")); }
  catch { throw new RangeError("Planning calendar requires a supported timezone."); }
  if (!Number.isSafeInteger(input.availableMinutesPerStudyDay) || input.availableMinutesPerStudyDay < 1 || input.availableMinutesPerStudyDay > 1440 ||
    (input.todayActiveTime.kind === "known" && (!Number.isSafeInteger(input.todayActiveTime.minutes) || input.todayActiveTime.minutes < 0 || input.todayActiveTime.minutes > 1440)) ||
    (input.todayActiveTime.kind === "unknown" && !["session_started_before_today", "active_interval_crosses_today_boundary", "unavailable"].includes(input.todayActiveTime.reason))) throw new RangeError("Planning calendar availability is invalid.");
  if (input.preferredDays.length === 0 || new Set(input.preferredDays).size !== input.preferredDays.length || input.preferredDays.some((day) => !GOAL_DAY_IDS.includes(day))) throw new RangeError("Planning calendar needs unique study days.");
  if (!Number.isSafeInteger(input.weeklySessionTarget) || input.weeklySessionTarget < 1 || input.weeklySessionTarget > input.preferredDays.length) throw new RangeError("Weekly session target must fit the selected study days.");
  if (!input.legalSessions.length || input.legalSessions.some((session) => !Number.isSafeInteger(session.sessionLength) || session.sessionLength < 1 || !Number.isFinite(session.minMinutes) || !Number.isFinite(session.typicalMinutes) || !Number.isFinite(session.maxMinutes) || session.minMinutes < 0 || session.minMinutes > session.typicalMinutes || session.typicalMinutes > session.maxMinutes)) throw new RangeError("Planning calendar needs legal session estimates.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/u.test(input.sessionLocalTime)) throw new RangeError("Planning calendar session wall-clock time is invalid.");
  if (input.sessionLocalTimesByDay && Object.entries(input.sessionLocalTimesByDay).some(([day, time]) => !GOAL_DAY_IDS.includes(day as GoalDay) || typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/u.test(time))) throw new RangeError("Planning calendar per-day session wall-clock times are invalid.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/u.test(input.currentLocalTime)) throw new RangeError("Planning calendar current wall-clock time is invalid.");
  if (input.targetDate !== null && input.targetMeaning === "none") throw new RangeError("A targetless goal cannot carry a target date.");
  if (input.openEndedPreviewDays !== undefined && (!Number.isSafeInteger(input.openEndedPreviewDays) || input.openEndedPreviewDays < 0 || input.openEndedPreviewDays > 3660)) throw new RangeError("Open-ended preview horizon is invalid.");
  if (input.requiredSessionCount !== undefined && (!Number.isSafeInteger(input.requiredSessionCount) || input.requiredSessionCount < 0)) throw new RangeError("Required session count is invalid.");
  const demandIds = new Set<string>();
  for (const demand of input.sessionDemands ?? []) {
    if (!demand.id.trim() || !demand.modeId.trim() || demandIds.has(demand.id) || !Number.isSafeInteger(demand.responseCount) || demand.responseCount < 1 || !demand.legalOptions.length ||
      (demand.isExistingSession === true && demand.canResumeAcrossWindows !== true) ||
      (demand.kind === "continue_existing" && (demand.isExistingSession !== true || typeof demand.sessionId !== "string" || !demand.sessionId.trim())) ||
      (demand.reviewEntryIds !== undefined && (new Set(demand.reviewEntryIds).size !== demand.reviewEntryIds.length || demand.reviewEntryIds.some((id) => !id.trim()))) ||
      demand.legalOptions.some((option) => !Number.isSafeInteger(option.sessionLength) || option.sessionLength < 1 || (demand.isExistingSession !== true && option.sessionLength > demand.responseCount) || option.minMinutes < 0 || option.minMinutes > option.typicalMinutes || option.typicalMinutes > option.maxMinutes)) throw new RangeError("Planning session demand is invalid.");
    demandIds.add(demand.id);
  }
  const obligationIds = new Set<string>();
  for (const obligation of input.dueObligations) {
    if (!obligation.id.trim() || obligationIds.has(obligation.id) || !Number.isFinite(Date.parse(obligation.dueAt)) ||
      !Number.isFinite(obligation.minMinutes) || !Number.isFinite(obligation.typicalMinutes) || !Number.isFinite(obligation.maxMinutes) ||
      obligation.minMinutes < 0 || obligation.minMinutes > obligation.typicalMinutes || obligation.typicalMinutes > obligation.maxMinutes) throw new RangeError("Due review obligations must have unique identities, valid due instants and estimates.");
    obligationIds.add(obligation.id);
  }
}

function sessionTimeForDate(input: Parameters<typeof buildPlanningCalendar>[0], localDate: string): string {
  const day = GOAL_DAY_IDS[weekdayForCivilDate(localDate)]!;
  return input.sessionLocalTimesByDay?.[day] ?? input.sessionLocalTime;
}
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function addCivilDays(value: string, count: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
function daysBetween(from: string, to: string): number { return Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000); }
function weekdayForCivilDate(value: string): number { return new Date(`${value}T00:00:00.000Z`).getUTCDay() === 0 ? 6 : new Date(`${value}T00:00:00.000Z`).getUTCDay() - 1; }
function weekStart(value: string): string { return addCivilDays(value, -weekdayForCivilDate(value)); }
function localDateForInstant(value: string, timezone: string): string {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}
function localTimeForInstant(value: string, timezone: string): string {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.hour}:${fields.minute}`;
}
