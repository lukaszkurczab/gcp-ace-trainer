import {
  acceptedTargetFromGoal,
  contentPackagePinsEqual,
  createContentPackagePin,
  isIsoDate,
  normalizeGoalRecord,
  normalizeLearningPlan,
  type AcceptedTargetSnapshot,
  type ContentPackagePin,
  type GoalSnapshot,
  type LearningPlan,
} from "../../domain";
import type {
  C3Result,
  CompletedAttemptFact,
  CompletedSessionFact,
  ImmutableCompletedFacts,
  PaceForecast,
  PaceForecastUnavailableReason,
} from "../../domain/learning/paceForecast";

export type TargetDateGuidanceInput = Readonly<{
  currentGoal: GoalSnapshot | null;
  acceptedPlan: LearningPlan | null;
  currentVerifiedPackagePin: ContentPackagePin;
  c3Result: C3Result;
  today: string;
  completedFacts: ImmutableCompletedFacts;
  paceForecast: PaceForecast;
}>;

export type GuidanceFactUnavailableReason =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "update_required"
  | "plan_paused"
  | "completed"
  | PaceForecastUnavailableReason;

export type GuidanceFact =
  | Readonly<{ kind: "numeric"; value: number; unit: "questions_per_week" }>
  | Readonly<{ kind: "date"; value: string }>
  | Readonly<{ kind: "text"; value: "goal_complete" | "flexible" | "no_target_date" | "completed" }>
  | Readonly<{ kind: "unavailable"; reason: GuidanceFactUnavailableReason }>;

export type TargetDateGuidanceState =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "update_required"
  | "plan_paused"
  | "completed"
  | "overdue"
  | "unreachable"
  | "at_risk"
  | "on_track"
  | "open_ended"
  | "unavailable";

export type TargetDateGuidanceReason =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "target_changed"
  | "package_changed"
  | "cadence_changed"
  | "plan_paused"
  | "completed"
  | "overdue"
  | "insufficient_sessions"
  | "no_future_slots"
  | "at_risk"
  | "on_track"
  | "no_target"
  | PaceForecastUnavailableReason;

export type GuidanceAction =
  | Readonly<{ kind: "set_goal"; destination: "GoalCadence" }>
  | Readonly<{ kind: "adjust_goal"; destination: "GoalCadence" }>
  | Readonly<{ kind: "create_plan"; destination: "LearningPlanProposal" }>
  | Readonly<{ kind: "review_updated_plan"; destination: "LearningPlanProposal" }>
  | Readonly<{ kind: "resume_plan"; destination: "LearningPlanEditor" }>
  | Readonly<{ kind: "adjust_schedule"; destination: "LearningPlanEditor" }>
  | Readonly<{ kind: "view_progress"; destination: "Progress" }>
  | Readonly<{ kind: "start_next_session"; destination: "Practice" }>
  | Readonly<{ kind: "continue_plan"; destination: "Practice" }>
  | Readonly<{ kind: "try_again"; destination: "TargetDateGuidanceRecompute" }>;

export type GuidanceMessageKey =
  | "targetDateGuidance.noGoal"
  | "targetDateGuidance.goalPaused"
  | "targetDateGuidance.noPlan"
  | "targetDateGuidance.planPaused"
  | "targetDateGuidance.updateRequired.targetChanged"
  | "targetDateGuidance.updateRequired.packageChanged"
  | "targetDateGuidance.updateRequired.cadenceChanged"
  | "targetDateGuidance.completed"
  | "targetDateGuidance.overdue"
  | "targetDateGuidance.unreachable.insufficientSessions"
  | "targetDateGuidance.unreachable.noFutureSlots"
  | "targetDateGuidance.atRisk"
  | "targetDateGuidance.onTrack"
  | "targetDateGuidance.openEnded"
  | "targetDateGuidance.unavailable.unknownCompletionRule"
  | "targetDateGuidance.unavailable.insufficientElapsedEvidence"
  | "targetDateGuidance.unavailable.calculationError"
  | "targetDateGuidance.unavailable.noTarget";

export type TargetDateGuidance = Readonly<{
  state: TargetDateGuidanceState;
  reason: TargetDateGuidanceReason;
  tone: "neutral" | "positive" | "warning" | "danger" | "muted";
  messageKey: GuidanceMessageKey;
  home: Readonly<{ primary: GuidanceAction }>;
  progress: Readonly<{ primary: GuidanceAction; secondary: GuidanceAction | null }>;
  facts: Readonly<{
    requiredPace: GuidanceFact;
    actualPace: GuidanceFact;
    forecast: GuidanceFact;
    target: GuidanceFact;
  }>;
}>;

type ValidatedForecast =
  | Readonly<{ kind: "available"; value: Extract<PaceForecast, { kind: "available" }> }>
  | Readonly<{ kind: "unavailable"; reason: PaceForecastUnavailableReason }>;

/**
 * Projects one already calculated forecast into the canonical Home/Progress
 * guidance matrix.  This function deliberately contains no pace formula.
 */
export function projectTargetDateGuidance(input: TargetDateGuidanceInput): TargetDateGuidance {
  if (input.currentGoal === null) return buildNoGoal();
  if (input.currentGoal.record.status === "paused") return buildGoalPaused();
  if (input.acceptedPlan === null) return buildNoPlan();

  let goalRecord: GoalSnapshot["record"];
  let plan: LearningPlan;
  try {
    goalRecord = normalizeGoalRecord(input.currentGoal.record);
    plan = normalizeLearningPlan(input.acceptedPlan);
  } catch {
    return buildCalculationError();
  }
  if (!isRecord(input.currentVerifiedPackagePin) || !hasOnlyKeys(input.currentVerifiedPackagePin, ["packageIdentity", "packageVersion", "contentReleaseId"])) return buildCalculationError(plan.acceptedTarget);
  try { createContentPackagePin(input.currentVerifiedPackagePin); } catch { return buildCalculationError(plan.acceptedTarget); }
  if (goalRecord.trackId !== plan.trackId) return buildCalculationError(plan.acceptedTarget);
  if (!isPositiveInteger(input.currentGoal.revision)) return buildCalculationError(plan.acceptedTarget);
  if (!isIsoDate(input.today)) return buildCalculationError(plan.acceptedTarget);
  if (input.c3Result !== "unknown" && input.c3Result !== "in_progress" && input.c3Result !== "completed") return buildCalculationError(plan.acceptedTarget);

  const currentTarget = acceptedTargetFromGoal(goalRecord);
  const freshnessReason = getFreshnessReason(input.currentGoal.revision, plan, currentTarget, input.currentVerifiedPackagePin);
  if (freshnessReason !== null) return buildUpdateRequired(freshnessReason);
  if (plan.status === "paused") return buildPlanPaused(plan.acceptedTarget);

  const targetDate = plan.acceptedTarget.targetDate;
  const hasTarget = targetDate !== null && plan.acceptedTarget.meaning !== "none";
  // A completed C3 result and an open-ended target do not need a forecast.
  // This also prevents an auxiliary stale forecast from masking their state.
  if (!hasTarget) {
    if (input.c3Result === "completed") return buildCompleted(plan.acceptedTarget);
    return buildOpenEnded();
  }

  const forecast = validateForecast(input.paceForecast, plan);
  if (forecast === null) return buildCalculationError(plan.acceptedTarget);
  if (input.c3Result === "completed") return buildCompleted(plan.acceptedTarget);

  if (isOverdue(plan.acceptedTarget, input.today)) return buildOverdue(forecast, targetDate);
  if (forecast.kind === "unavailable") {
    if (forecast.reason === "no_future_slots") return buildNoFutureSlots(targetDate);
    return buildUnavailable(forecast.reason, targetDate);
  }
  if (forecast.value.remainingPlannedCapacity < forecast.value.remainingRequiredAttempts) {
    return buildInsufficientSessions(forecast.value);
  }
  if (forecast.value.status === "at_risk") return buildAtRisk(forecast.value);
  return buildOnTrack(forecast.value);
}

function getFreshnessReason(
  currentGoalRevision: number,
  plan: LearningPlan,
  currentTarget: AcceptedTargetSnapshot,
  currentPin: ContentPackagePin,
): "target_changed" | "package_changed" | "cadence_changed" | null {
  if (plan.acceptedTarget.meaning !== currentTarget.meaning || plan.acceptedTarget.targetDate !== currentTarget.targetDate) return "target_changed";
  if (!contentPackagePinsEqual(plan.contentPackagePin, currentPin)) return "package_changed";
  if (currentGoalRevision !== plan.goalRevision) return "cadence_changed";
  return null;
}

function validateForecast(forecast: PaceForecast, plan: LearningPlan): ValidatedForecast | null {
  if (!isRecord(forecast) || forecast.kind !== "available" && forecast.kind !== "unavailable") return null;
  if (forecast.kind === "unavailable") {
    if (!hasOnlyKeys(forecast, ["kind", "reason"]) || !isForecastReason(forecast.reason)) return null;
    return Object.freeze({ kind: "unavailable", reason: forecast.reason });
  }
  const keys = ["kind", "source", "requiredQuestionsPerSession", "requiredQuestionsPerWeek", "actualQuestionsPerWeek", "projectedCompletionDate", "targetDate", "remainingRequiredAttempts", "remainingPlannedCapacity", "status", "trend"] as const;
  if (!hasOnlyKeys(forecast, keys) || !isRecord(forecast.source)) return null;
  const source = forecast.source;
  if (!hasOnlyKeys(source, ["planId", "planRevision", "goalRevision", "target", "contentPackagePin"]) ||
    source.planId !== plan.planId || source.planRevision !== plan.planRevision || source.goalRevision !== plan.goalRevision ||
    !isTargetEqual(source.target, plan.acceptedTarget) || !isIsoDate(forecast.projectedCompletionDate) ||
    !isIsoDate(forecast.targetDate) || forecast.targetDate !== plan.acceptedTarget.targetDate ||
    !isNonNegativeInteger(forecast.requiredQuestionsPerSession) || !isNonNegativeNumber(forecast.requiredQuestionsPerWeek) ||
    !isNonNegativeNumber(forecast.actualQuestionsPerWeek) || !isNonNegativeInteger(forecast.remainingRequiredAttempts) ||
    !isNonNegativeInteger(forecast.remainingPlannedCapacity) ||
    (forecast.status !== "on_track" && forecast.status !== "at_risk") ||
    (forecast.trend !== "improving" && forecast.trend !== "stable" && forecast.trend !== "slowing")) return null;
  let sourcePin: ContentPackagePin;
  try {
    if (!isRecord(source.contentPackagePin) || !hasOnlyKeys(source.contentPackagePin, ["packageIdentity", "packageVersion", "contentReleaseId"])) return null;
    sourcePin = createContentPackagePin(source.contentPackagePin as ContentPackagePin);
  } catch { return null; }
  if (!contentPackagePinsEqual(sourcePin, plan.contentPackagePin)) return null;
  return Object.freeze({ kind: "available", value: Object.freeze({ ...forecast, source: Object.freeze({ ...source, target: Object.freeze({ ...source.target }), contentPackagePin: sourcePin }) }) as Extract<PaceForecast, { kind: "available" }> });
}

function isOverdue(target: AcceptedTargetSnapshot, today: string): boolean {
  if (target.targetDate === null || target.meaning === "none") return false;
  return target.meaning === "event" ? today >= target.targetDate : today > target.targetDate;
}

function buildNoGoal(): TargetDateGuidance {
  return buildGuidance("no_goal", "no_goal", "neutral", "targetDateGuidance.noGoal", action("set_goal", "GoalCadence"), null, unavailableFacts("no_goal"));
}

function buildGoalPaused(): TargetDateGuidance {
  return buildGuidance("goal_paused", "goal_paused", "muted", "targetDateGuidance.goalPaused", action("adjust_goal", "GoalCadence"), null, unavailableFacts("goal_paused"));
}

function buildNoPlan(): TargetDateGuidance {
  return buildGuidance("no_plan", "no_plan", "neutral", "targetDateGuidance.noPlan", action("create_plan", "LearningPlanProposal"), null, unavailableFacts("no_plan"));
}

function buildUpdateRequired(reason: "target_changed" | "package_changed" | "cadence_changed"): TargetDateGuidance {
  const key = reason === "target_changed" ? "targetDateGuidance.updateRequired.targetChanged" : reason === "package_changed" ? "targetDateGuidance.updateRequired.packageChanged" : "targetDateGuidance.updateRequired.cadenceChanged";
  return buildGuidance("update_required", reason, "warning", key, action("review_updated_plan", "LearningPlanProposal"), null, unavailableFacts("update_required"));
}

function buildPlanPaused(target: AcceptedTargetSnapshot): TargetDateGuidance {
  return buildGuidance("plan_paused", "plan_paused", "muted", "targetDateGuidance.planPaused", action("resume_plan", "LearningPlanEditor"), null, Object.freeze({ requiredPace: unavailableFact("plan_paused"), actualPace: unavailableFact("plan_paused"), forecast: unavailableFact("plan_paused"), target: targetFact(target, "no_target_date") }));
}

function buildCompleted(target: AcceptedTargetSnapshot): TargetDateGuidance {
  return buildGuidance("completed", "completed", "positive", "targetDateGuidance.completed", action("view_progress", "Progress"), null, Object.freeze({ requiredPace: unavailableFact("completed"), actualPace: unavailableFact("completed"), forecast: textFact("completed"), target: target.targetDate === null ? textFact("goal_complete") : dateFact(target.targetDate) }));
}

function buildOverdue(forecast: ValidatedForecast, targetDate: string): TargetDateGuidance {
  return buildGuidance("overdue", "overdue", "danger", "targetDateGuidance.overdue", action("adjust_goal", "GoalCadence"), null, Object.freeze({ ...forecastFacts(forecast), target: dateFact(targetDate) }));
}

function buildInsufficientSessions(forecast: Extract<PaceForecast, { kind: "available" }>): TargetDateGuidance {
  return buildGuidance("unreachable", "insufficient_sessions", "danger", "targetDateGuidance.unreachable.insufficientSessions", action("adjust_schedule", "LearningPlanEditor"), action("adjust_goal", "GoalCadence"), Object.freeze({ ...forecastFacts({ kind: "available", value: forecast }), target: dateFact(forecast.targetDate) }));
}

function buildNoFutureSlots(targetDate: string): TargetDateGuidance {
  return buildGuidance("unreachable", "no_future_slots", "danger", "targetDateGuidance.unreachable.noFutureSlots", action("adjust_schedule", "LearningPlanEditor"), action("adjust_goal", "GoalCadence"), Object.freeze({ requiredPace: unavailableFact("no_future_slots"), actualPace: unavailableFact("no_future_slots"), forecast: unavailableFact("no_future_slots"), target: dateFact(targetDate) }));
}

function buildAtRisk(forecast: Extract<PaceForecast, { kind: "available" }>): TargetDateGuidance {
  return buildGuidance("at_risk", "at_risk", "warning", "targetDateGuidance.atRisk", action("start_next_session", "Practice"), action("adjust_schedule", "LearningPlanEditor"), Object.freeze({ ...forecastFacts({ kind: "available", value: forecast }), target: dateFact(forecast.targetDate) }));
}

function buildOnTrack(forecast: Extract<PaceForecast, { kind: "available" }>): TargetDateGuidance {
  return buildGuidance("on_track", "on_track", "positive", "targetDateGuidance.onTrack", action("start_next_session", "Practice"), null, Object.freeze({ ...forecastFacts({ kind: "available", value: forecast }), target: dateFact(forecast.targetDate) }));
}

function buildOpenEnded(): TargetDateGuidance {
  const flexible = textFact("flexible");
  return buildGuidance("open_ended", "no_target", "neutral", "targetDateGuidance.openEnded", action("continue_plan", "Practice"), null, Object.freeze({ requiredPace: flexible, actualPace: flexible, forecast: flexible, target: textFact("no_target_date") }));
}

function buildUnavailable(reason: PaceForecastUnavailableReason, targetDate: string): TargetDateGuidance {
  if (reason === "calculation_error") return buildCalculationError(targetDate);
  if (reason === "insufficient_elapsed_evidence") {
    return buildGuidance("unavailable", reason, "neutral", unavailableMessageKey(reason), action("continue_plan", "Practice"), null, Object.freeze({ requiredPace: unavailableFact(reason), actualPace: unavailableFact(reason), forecast: unavailableFact(reason), target: dateFact(targetDate) }));
  }
  return buildGuidance("unavailable", reason, "neutral", unavailableMessageKey(reason), action("adjust_goal", "GoalCadence"), null, Object.freeze({ requiredPace: unavailableFact(reason), actualPace: unavailableFact(reason), forecast: unavailableFact(reason), target: dateFact(targetDate) }));
}

function buildCalculationError(target?: AcceptedTargetSnapshot | string): TargetDateGuidance {
  const targetDate = typeof target === "string" ? target : target?.targetDate;
  const targetFactValue = targetDate === undefined
    ? unavailableFact("calculation_error")
    : targetDate === null ? textFact("no_target_date") : dateFact(targetDate);
  return buildGuidance("unavailable", "calculation_error", "warning", "targetDateGuidance.unavailable.calculationError", action("try_again", "TargetDateGuidanceRecompute"), null, Object.freeze({ requiredPace: unavailableFact("calculation_error"), actualPace: unavailableFact("calculation_error"), forecast: unavailableFact("calculation_error"), target: targetFactValue }));
}

function buildGuidance(state: TargetDateGuidanceState, reason: TargetDateGuidanceReason, tone: TargetDateGuidance["tone"], messageKey: GuidanceMessageKey, primary: GuidanceAction, secondary: GuidanceAction | null, facts: TargetDateGuidance["facts"]): TargetDateGuidance {
  return Object.freeze({ state, reason, tone, messageKey, home: Object.freeze({ primary }), progress: Object.freeze({ primary, secondary }), facts });
}

function forecastFacts(forecast: ValidatedForecast): TargetDateGuidance["facts"] {
  if (forecast.kind === "unavailable") {
    const unavailable = unavailableFact(forecast.reason);
    return Object.freeze({ requiredPace: unavailable, actualPace: unavailable, forecast: unavailable, target: unavailable });
  }
  return Object.freeze({ requiredPace: numericFact(forecast.value.requiredQuestionsPerWeek), actualPace: numericFact(forecast.value.actualQuestionsPerWeek), forecast: dateFact(forecast.value.projectedCompletionDate), target: dateFact(forecast.value.targetDate) });
}

function unavailableFacts(reason: GuidanceFactUnavailableReason): TargetDateGuidance["facts"] {
  const fact = unavailableFact(reason);
  return Object.freeze({ requiredPace: fact, actualPace: fact, forecast: fact, target: fact });
}

function targetFact(target: AcceptedTargetSnapshot, missingValue: "no_target_date"): GuidanceFact {
  return target.targetDate === null ? textFact(missingValue) : dateFact(target.targetDate);
}

function unavailableFact(reason: GuidanceFactUnavailableReason): GuidanceFact { return Object.freeze({ kind: "unavailable", reason }); }
function numericFact(value: number): GuidanceFact { return Object.freeze({ kind: "numeric", value, unit: "questions_per_week" }); }
function dateFact(value: string): GuidanceFact { return Object.freeze({ kind: "date", value }); }
function textFact(value: "goal_complete" | "flexible" | "no_target_date" | "completed"): GuidanceFact { return Object.freeze({ kind: "text", value }); }

function action(kind: GuidanceAction["kind"], destination: GuidanceAction["destination"]): GuidanceAction {
  return Object.freeze({ kind, destination } as GuidanceAction);
}

function unavailableMessageKey(reason: PaceForecastUnavailableReason): GuidanceMessageKey {
  if (reason === "unknown_completion_rule") return "targetDateGuidance.unavailable.unknownCompletionRule";
  if (reason === "insufficient_elapsed_evidence") return "targetDateGuidance.unavailable.insufficientElapsedEvidence";
  if (reason === "no_target") return "targetDateGuidance.unavailable.noTarget";
  return "targetDateGuidance.unavailable.calculationError";
}

function isForecastReason(value: unknown): value is PaceForecastUnavailableReason {
  return value === "unknown_completion_rule" || value === "no_target" || value === "no_future_slots" || value === "insufficient_elapsed_evidence" || value === "calculation_error";
}

function isTargetEqual(left: unknown, right: AcceptedTargetSnapshot): boolean {
  return isRecord(left) && hasOnlyKeys(left, ["meaning", "targetDate"]) &&
    (left.meaning === "event" || left.meaning === "deadline" || left.meaning === "checkpoint" || left.meaning === "none") &&
    (left.targetDate === null || isIsoDate(left.targetDate)) &&
    left.meaning === right.meaning && left.targetDate === right.targetDate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// Keep these names in the public type graph: application callers can import
// the immutable fact contracts from this owner without reaching into domain.
export type { CompletedAttemptFact, CompletedSessionFact, ImmutableCompletedFacts };
