import type { PlanningCalendarResult } from "../../domain/learning/planningCalendar";
import type { FullGoalWorkloadProjection } from "./fullGoalWorkloadProjection";

export type FullGoalTimeCapacity = Readonly<{
  kind: "minimum_exceeds_available_time" | "range_within_available_time" | "range_crosses_available_time" | "unscheduled_due_reviews" | "uncertain" | "open_ended_preview" | "unavailable";
  availableMinutes: number | null;
  workMinMinutes: number | null;
  workTypicalMinutes: number | null;
  workMaxMinutes: number | null;
  unknownCapacityDates: readonly string[];
  unscheduledReviewObligationIds: readonly string[];
  unknownReviewObligationIds: readonly string[];
}>;

/** Compares time ranges with civil-day budget only; this does not promise a legal session or completion. */
export function assessFullGoalTimeCapacity(input: Readonly<{
  workload: FullGoalWorkloadProjection;
  calendar: PlanningCalendarResult | null;
}>): FullGoalTimeCapacity {
  const unknownCapacityDates = input.calendar?.unknownCapacityDates ?? [];
  if (!input.calendar || input.workload.kind === "completion_unknown") return result("unavailable", null, input.workload, unknownCapacityDates, input.calendar);
  if (input.calendar.kind === "open_ended" || input.calendar.kind === "preview") return result("open_ended_preview", input.calendar.totalAvailableMinutes, input.workload, unknownCapacityDates, input.calendar);
  const available = input.calendar.totalAvailableMinutes;
  if (input.calendar.unscheduledReviewObligationIds.length > 0) return result("unscheduled_due_reviews", available, input.workload, unknownCapacityDates, input.calendar);
  if (unknownCapacityDates.length > 0 || input.calendar.unknownReviewObligationIds.length > 0 || input.workload.uncostedDueReviewIds.length > 0) return result("uncertain", available, input.workload, unknownCapacityDates, input.calendar);
  if (input.workload.knownMinMinutes > available) return result("minimum_exceeds_available_time", available, input.workload, unknownCapacityDates, input.calendar);
  if (input.workload.kind === "incomplete" || input.workload.knownMaxMinutes === null) {
    return result("uncertain", available, input.workload, unknownCapacityDates, input.calendar);
  }
  if (input.workload.knownMaxMinutes <= available) return result("range_within_available_time", available, input.workload, unknownCapacityDates, input.calendar);
  return result("range_crosses_available_time", available, input.workload, unknownCapacityDates, input.calendar);
}

function result(kind: FullGoalTimeCapacity["kind"], available: number | null, workload: FullGoalWorkloadProjection, unknownCapacityDates: readonly string[], calendar: PlanningCalendarResult | null): FullGoalTimeCapacity {
  return Object.freeze({ kind, availableMinutes: available, workMinMinutes: workload.kind === "completion_unknown" ? null : workload.knownMinMinutes,
    workTypicalMinutes: workload.kind === "completion_unknown" ? null : workload.knownTypicalMinutes,
    workMaxMinutes: workload.kind === "completion_unknown" ? null : workload.knownMaxMinutes,
    unknownCapacityDates: Object.freeze([...unknownCapacityDates]),
    unscheduledReviewObligationIds: Object.freeze([...(calendar?.unscheduledReviewObligationIds ?? [])]),
    unknownReviewObligationIds: Object.freeze([...new Set([...(calendar?.unknownReviewObligationIds ?? []), ...workload.uncostedDueReviewIds])]) });
}
