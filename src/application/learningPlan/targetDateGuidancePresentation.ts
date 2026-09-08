import i18n from "../../i18n";
import { isIsoDate } from "../../domain";
import type {
  GuidanceAction,
  GuidanceFact,
  GuidanceFactUnavailableReason,
  GuidanceMessageKey,
  TargetDateGuidance,
  TargetDateGuidanceReason,
  TargetDateGuidanceState,
} from "./targetDateGuidance";

export type TargetDateGuidanceLocale = "en" | "pl";

export type TargetDateGuidanceFactKey = "requiredPace" | "actualPace" | "forecast" | "target";

export type TargetDateGuidanceFactPresentation = Readonly<{
  key: TargetDateGuidanceFactKey;
  label: string;
  value: string;
}>;

export type TargetDateGuidancePresentation = Readonly<{
  state: TargetDateGuidanceState;
  reason: TargetDateGuidanceReason;
  tone: TargetDateGuidance["tone"];
  stateLabel: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  facts: readonly [
    TargetDateGuidanceFactPresentation,
    TargetDateGuidanceFactPresentation,
    TargetDateGuidanceFactPresentation,
    TargetDateGuidanceFactPresentation,
  ];
}>;

export type TargetDateGuidancePresentationInput = Readonly<{
  guidance: TargetDateGuidance;
  locale: TargetDateGuidanceLocale;
  timezone: string;
}>;

export type TargetDateGuidancePresentationErrorCode =
  | "invalid_input"
  | "invalid_locale"
  | "invalid_timezone"
  | "invalid_date"
  | "missing_translation"
  | "invalid_translation"
  | "unknown_state"
  | "unknown_reason"
  | "unknown_message_key"
  | "unknown_tone"
  | "unknown_action"
  | "unknown_action_destination"
  | "unknown_fact_kind"
  | "unknown_fact_unit"
  | "unknown_fact_text"
  | "unknown_fact_reason"
  | "invalid_fact"
  | "inconsistent_guidance";

export class TargetDateGuidancePresentationError extends Error {
  constructor(readonly code: TargetDateGuidancePresentationErrorCode, message = "Invalid target date guidance presentation input.") {
    super(message);
    this.name = "TargetDateGuidancePresentationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const GUIDANCE_MESSAGE_KEYS = [
  "targetDateGuidance.noGoal",
  "targetDateGuidance.goalPaused",
  "targetDateGuidance.noPlan",
  "targetDateGuidance.planPaused",
  "targetDateGuidance.updateRequired.targetChanged",
  "targetDateGuidance.updateRequired.packageChanged",
  "targetDateGuidance.updateRequired.cadenceChanged",
  "targetDateGuidance.completed",
  "targetDateGuidance.overdue",
  "targetDateGuidance.unreachable.insufficientSessions",
  "targetDateGuidance.unreachable.noFutureSlots",
  "targetDateGuidance.atRisk",
  "targetDateGuidance.onTrack",
  "targetDateGuidance.openEnded",
  "targetDateGuidance.unavailable.unknownCompletionRule",
  "targetDateGuidance.unavailable.insufficientElapsedEvidence",
  "targetDateGuidance.unavailable.calculationError",
  "targetDateGuidance.unavailable.noTarget",
] as const satisfies readonly GuidanceMessageKey[];

const GUIDANCE_STATES = [
  "no_goal",
  "goal_paused",
  "no_plan",
  "update_required",
  "plan_paused",
  "completed",
  "overdue",
  "unreachable",
  "at_risk",
  "on_track",
  "open_ended",
  "unavailable",
] as const satisfies readonly TargetDateGuidanceState[];

const GUIDANCE_REASONS = [
  "no_goal",
  "goal_paused",
  "no_plan",
  "target_changed",
  "package_changed",
  "cadence_changed",
  "plan_paused",
  "completed",
  "overdue",
  "insufficient_sessions",
  "no_future_slots",
  "at_risk",
  "on_track",
  "no_target",
  "unknown_completion_rule",
  "insufficient_elapsed_evidence",
  "calculation_error",
] as const satisfies readonly TargetDateGuidanceReason[];

const FACT_UNAVAILABLE_REASONS = [
  "no_goal",
  "goal_paused",
  "no_plan",
  "update_required",
  "plan_paused",
  "completed",
  "unknown_completion_rule",
  "no_target",
  "no_future_slots",
  "insufficient_elapsed_evidence",
  "calculation_error",
] as const satisfies readonly GuidanceFactUnavailableReason[];

const FORECAST_UNAVAILABLE_REASONS = [
  "unknown_completion_rule",
  "no_target",
  "no_future_slots",
  "insufficient_elapsed_evidence",
  "calculation_error",
] as const;

const FACT_KEYS = ["requiredPace", "actualPace", "forecast", "target"] as const satisfies readonly TargetDateGuidanceFactKey[];

const STATE_LABEL_KEYS = {
  no_goal: "targetDateGuidance.state.noGoal",
  goal_paused: "targetDateGuidance.state.goalPaused",
  no_plan: "targetDateGuidance.state.noPlan",
  update_required: "targetDateGuidance.state.updateRequired",
  plan_paused: "targetDateGuidance.state.planPaused",
  completed: "targetDateGuidance.state.completed",
  overdue: "targetDateGuidance.state.overdue",
  unreachable: "targetDateGuidance.state.unreachable",
  at_risk: "targetDateGuidance.state.atRisk",
  on_track: "targetDateGuidance.state.onTrack",
  open_ended: "targetDateGuidance.state.openEnded",
  unavailable: "targetDateGuidance.state.unavailable",
} as const satisfies Record<TargetDateGuidanceState, string>;

const REASON_LABEL_KEYS: Record<TargetDateGuidanceReason, string> = {
  no_goal: "targetDateGuidance.reason.noGoal",
  goal_paused: "targetDateGuidance.reason.goalPaused",
  no_plan: "targetDateGuidance.reason.noPlan",
  target_changed: "targetDateGuidance.reason.targetChanged",
  package_changed: "targetDateGuidance.reason.packageChanged",
  cadence_changed: "targetDateGuidance.reason.cadenceChanged",
  plan_paused: "targetDateGuidance.reason.planPaused",
  completed: "targetDateGuidance.reason.completed",
  overdue: "targetDateGuidance.reason.overdue",
  insufficient_sessions: "targetDateGuidance.reason.insufficientSessions",
  no_future_slots: "targetDateGuidance.reason.noFutureSlots",
  at_risk: "targetDateGuidance.reason.atRisk",
  on_track: "targetDateGuidance.reason.onTrack",
  no_target: "targetDateGuidance.reason.noTarget",
  unknown_completion_rule: "targetDateGuidance.reason.unknownCompletionRule",
  insufficient_elapsed_evidence: "targetDateGuidance.reason.insufficientElapsedEvidence",
  calculation_error: "targetDateGuidance.reason.calculationError",
};

const ACTION_LABEL_KEYS: Record<GuidanceAction["kind"], string> = {
  set_goal: "targetDateGuidance.action.setGoal",
  adjust_goal: "targetDateGuidance.action.adjustGoal",
  create_plan: "targetDateGuidance.action.createPlan",
  review_updated_plan: "targetDateGuidance.action.reviewUpdatedPlan",
  resume_plan: "targetDateGuidance.action.resumePlan",
  adjust_schedule: "targetDateGuidance.action.adjustSchedule",
  view_progress: "targetDateGuidance.action.viewProgress",
  start_next_session: "targetDateGuidance.action.startNextSession",
  continue_plan: "targetDateGuidance.action.continuePlan",
  try_again: "targetDateGuidance.action.tryAgain",
};

const ACTION_DESTINATIONS: Record<GuidanceAction["kind"], GuidanceAction["destination"]> = {
  set_goal: "GoalCadence",
  adjust_goal: "GoalCadence",
  create_plan: "LearningPlanProposal",
  review_updated_plan: "LearningPlanProposal",
  resume_plan: "LearningPlanEditor",
  adjust_schedule: "LearningPlanEditor",
  view_progress: "Progress",
  start_next_session: "Practice",
  continue_plan: "Practice",
  try_again: "TargetDateGuidanceRecompute",
};

const FACT_LABEL_KEYS: Record<TargetDateGuidanceFactKey, string> = {
  requiredPace: "targetDateGuidance.fact.requiredPace",
  actualPace: "targetDateGuidance.fact.actualPace",
  forecast: "targetDateGuidance.fact.forecast",
  target: "targetDateGuidance.fact.target",
};

const TEXT_FACT_LABEL_KEYS: Record<Extract<GuidanceFact, { kind: "text" }>["value"], string> = {
  goal_complete: "targetDateGuidance.fact.text.goalComplete",
  flexible: "targetDateGuidance.fact.text.flexible",
  no_target_date: "targetDateGuidance.fact.text.noTargetDate",
  completed: "targetDateGuidance.fact.text.completed",
};

const UNAVAILABLE_FACT_LABEL_KEYS: Record<GuidanceFactUnavailableReason, string> = {
  no_goal: "targetDateGuidance.fact.unavailable.noGoal",
  goal_paused: "targetDateGuidance.fact.unavailable.goalPaused",
  no_plan: "targetDateGuidance.fact.unavailable.noPlan",
  update_required: "targetDateGuidance.fact.unavailable.updateRequired",
  plan_paused: "targetDateGuidance.fact.unavailable.planPaused",
  completed: "targetDateGuidance.fact.unavailable.completed",
  unknown_completion_rule: "targetDateGuidance.fact.unavailable.unknownCompletionRule",
  no_target: "targetDateGuidance.fact.unavailable.noTarget",
  no_future_slots: "targetDateGuidance.fact.unavailable.noFutureSlots",
  insufficient_elapsed_evidence: "targetDateGuidance.fact.unavailable.insufficientElapsedEvidence",
  calculation_error: "targetDateGuidance.fact.unavailable.calculationError",
};

const TEXT_FACT_VALUES = ["goal_complete", "flexible", "no_target_date", "completed"] as const;

const EXPECTED_TONES: Record<TargetDateGuidanceState, TargetDateGuidance["tone"]> = {
  no_goal: "neutral",
  goal_paused: "muted",
  no_plan: "neutral",
  update_required: "warning",
  plan_paused: "muted",
  completed: "positive",
  overdue: "danger",
  unreachable: "danger",
  at_risk: "warning",
  on_track: "positive",
  open_ended: "neutral",
  unavailable: "neutral",
};

const EXPECTED_PRIMARY: Record<TargetDateGuidanceState, GuidanceAction["kind"]> = {
  no_goal: "set_goal",
  goal_paused: "adjust_goal",
  no_plan: "create_plan",
  update_required: "review_updated_plan",
  plan_paused: "resume_plan",
  completed: "view_progress",
  overdue: "adjust_goal",
  unreachable: "adjust_schedule",
  at_risk: "start_next_session",
  on_track: "start_next_session",
  open_ended: "continue_plan",
  unavailable: "adjust_goal",
};

const EXPECTED_MESSAGE_KEYS: Record<TargetDateGuidanceState, Partial<Record<TargetDateGuidanceReason, GuidanceMessageKey>>> = {
  no_goal: { no_goal: "targetDateGuidance.noGoal" },
  goal_paused: { goal_paused: "targetDateGuidance.goalPaused" },
  no_plan: { no_plan: "targetDateGuidance.noPlan" },
  update_required: {
    target_changed: "targetDateGuidance.updateRequired.targetChanged",
    package_changed: "targetDateGuidance.updateRequired.packageChanged",
    cadence_changed: "targetDateGuidance.updateRequired.cadenceChanged",
  },
  plan_paused: { plan_paused: "targetDateGuidance.planPaused" },
  completed: { completed: "targetDateGuidance.completed" },
  overdue: { overdue: "targetDateGuidance.overdue" },
  unreachable: {
    insufficient_sessions: "targetDateGuidance.unreachable.insufficientSessions",
    no_future_slots: "targetDateGuidance.unreachable.noFutureSlots",
  },
  at_risk: { at_risk: "targetDateGuidance.atRisk" },
  on_track: { on_track: "targetDateGuidance.onTrack" },
  open_ended: { no_target: "targetDateGuidance.openEnded" },
  unavailable: {
    unknown_completion_rule: "targetDateGuidance.unavailable.unknownCompletionRule",
    insufficient_elapsed_evidence: "targetDateGuidance.unavailable.insufficientElapsedEvidence",
    calculation_error: "targetDateGuidance.unavailable.calculationError",
    no_target: "targetDateGuidance.unavailable.noTarget",
  },
};

/**
 * Converts one already projected guidance result into localized UI text.
 * The projection owns state selection; this boundary only validates, maps and
 * formats its closed values.
 */
export function presentTargetDateGuidance(input: TargetDateGuidancePresentationInput): TargetDateGuidancePresentation;
export function presentTargetDateGuidance(guidance: TargetDateGuidance, locale: TargetDateGuidanceLocale, timezone: string): TargetDateGuidancePresentation;
export function presentTargetDateGuidance(
  inputOrGuidance: TargetDateGuidancePresentationInput | TargetDateGuidance,
  locale?: TargetDateGuidanceLocale,
  timezone?: string,
): TargetDateGuidancePresentation {
  const input = normalizeInput(inputOrGuidance, locale, timezone);
  assertLocale(input.locale);
  assertTimezone(input.timezone);
  assertGuidance(input.guidance);

  const stateLabel = translate(STATE_LABEL_KEYS[input.guidance.state], input.locale);
  translate(REASON_LABEL_KEYS[input.guidance.reason], input.locale);
  const message = translate(input.guidance.messageKey, input.locale);
  const primaryLabel = translate(ACTION_LABEL_KEYS[input.guidance.progress.primary.kind], input.locale);
  const secondaryLabel = input.guidance.progress.secondary === null
    ? null
    : translate(ACTION_LABEL_KEYS[input.guidance.progress.secondary.kind], input.locale);

  const fact = (key: TargetDateGuidanceFactKey): TargetDateGuidanceFactPresentation => Object.freeze({
    key,
    label: translate(FACT_LABEL_KEYS[key], input.locale),
    value: formatFact(input.guidance.facts[key], input.locale, input.timezone),
  });
  const facts: TargetDateGuidancePresentation["facts"] = Object.freeze([
    fact("requiredPace"),
    fact("actualPace"),
    fact("forecast"),
    fact("target"),
  ]);

  return Object.freeze({
    state: input.guidance.state,
    reason: input.guidance.reason,
    tone: input.guidance.tone,
    stateLabel,
    message,
    primaryLabel,
    secondaryLabel,
    facts: Object.freeze(facts),
  });
}

function normalizeInput(
  inputOrGuidance: TargetDateGuidancePresentationInput | TargetDateGuidance,
  locale: TargetDateGuidanceLocale | undefined,
  timezone: string | undefined,
): TargetDateGuidancePresentationInput {
  if (locale !== undefined || timezone !== undefined) {
    if (locale === undefined || timezone === undefined) throw new TargetDateGuidancePresentationError("invalid_input");
    return Object.freeze({ guidance: inputOrGuidance as TargetDateGuidance, locale, timezone });
  }
  if (!isRecord(inputOrGuidance) || !hasExactKeys(inputOrGuidance, ["guidance", "locale", "timezone"])) throw new TargetDateGuidancePresentationError("invalid_input");
  return inputOrGuidance as TargetDateGuidancePresentationInput;
}

function assertLocale(locale: unknown): asserts locale is TargetDateGuidanceLocale {
  if (locale !== "en" && locale !== "pl") throw new TargetDateGuidancePresentationError("invalid_locale");
}

function assertTimezone(timezone: unknown): asserts timezone is string {
  if (typeof timezone !== "string" || timezone.trim().length === 0) throw new TargetDateGuidancePresentationError("invalid_timezone");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new TargetDateGuidancePresentationError("invalid_timezone");
  }
}

function assertGuidance(guidance: unknown): asserts guidance is TargetDateGuidance {
  if (!isRecord(guidance) || !hasExactKeys(guidance, ["state", "reason", "tone", "messageKey", "home", "progress", "facts"])) throw new TargetDateGuidancePresentationError("invalid_input");
  const typedGuidance = guidance as TargetDateGuidance;
  if (!isGuidanceState(guidance.state)) throw new TargetDateGuidancePresentationError("unknown_state");
  if (!isGuidanceReason(guidance.reason)) throw new TargetDateGuidancePresentationError("unknown_reason");
  if (!isGuidanceMessageKey(guidance.messageKey)) throw new TargetDateGuidancePresentationError("unknown_message_key");
  const expectedTone = guidance.state === "unavailable" && guidance.reason === "calculation_error" ? "warning" : EXPECTED_TONES[guidance.state];
  if (guidance.tone !== expectedTone) throw new TargetDateGuidancePresentationError("unknown_tone");

  const expectedMessageKey = EXPECTED_MESSAGE_KEYS[guidance.state][guidance.reason];
  if (expectedMessageKey !== guidance.messageKey) throw new TargetDateGuidancePresentationError("inconsistent_guidance");

  if (!isRecord(guidance.home) || !hasExactKeys(guidance.home, ["primary"])) throw new TargetDateGuidancePresentationError("invalid_input");
  if (!isRecord(guidance.progress) || !hasExactKeys(guidance.progress, ["primary", "secondary"])) throw new TargetDateGuidancePresentationError("invalid_input");
  assertAction(guidance.home.primary);
  assertAction(guidance.progress.primary);
  if (guidance.home.primary.kind !== guidance.progress.primary.kind || guidance.home.primary.destination !== guidance.progress.primary.destination) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
  if (guidance.progress.primary.kind !== expectedPrimaryKind(typedGuidance)) throw new TargetDateGuidancePresentationError("inconsistent_guidance");

  const expectedSecondary = expectedSecondaryKind(guidance.state);
  if (expectedSecondary === null) {
    if (guidance.progress.secondary !== null) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
  } else {
    if (guidance.progress.secondary === null) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
    assertAction(guidance.progress.secondary);
    if (guidance.progress.secondary.kind !== expectedSecondary) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
  }

  if (!isRecord(guidance.facts) || !hasExactKeys(guidance.facts, FACT_KEYS)) throw new TargetDateGuidancePresentationError("invalid_input");
  const facts = Object.fromEntries(FACT_KEYS.map((key) => [key, assertFact(typedGuidance.facts[key])])) as Record<TargetDateGuidanceFactKey, GuidanceFact>;
  assertFactsMatchGuidance(typedGuidance, facts);
}

function expectedPrimaryKind(guidance: TargetDateGuidance): GuidanceAction["kind"] {
  if (guidance.state !== "unavailable") return EXPECTED_PRIMARY[guidance.state];
  return guidance.reason === "calculation_error" ? "try_again" : guidance.reason === "insufficient_elapsed_evidence" ? "continue_plan" : "adjust_goal";
}

function expectedSecondaryKind(state: TargetDateGuidanceState): GuidanceAction["kind"] | null {
  if (state === "at_risk") return "adjust_schedule";
  if (state === "unreachable") return "adjust_goal";
  return null;
}

function assertAction(value: unknown): asserts value is GuidanceAction {
  if (!isRecord(value) || !hasExactKeys(value, ["kind", "destination"])) throw new TargetDateGuidancePresentationError("unknown_action");
  if (!isActionKind(value.kind)) throw new TargetDateGuidancePresentationError("unknown_action");
  if (value.destination !== ACTION_DESTINATIONS[value.kind]) throw new TargetDateGuidancePresentationError("unknown_action_destination");
}

function assertFact(value: unknown): GuidanceFact {
  if (!isRecord(value)) throw new TargetDateGuidancePresentationError("invalid_fact");
  if (value.kind === "numeric") {
    if (!hasExactKeys(value, ["kind", "value", "unit"]) || typeof value.value !== "number" || !Number.isFinite(value.value) || value.value < 0) throw new TargetDateGuidancePresentationError("invalid_fact");
    if (value.unit !== "questions_per_week") throw new TargetDateGuidancePresentationError("unknown_fact_unit");
    return value as GuidanceFact;
  }
  if (value.kind === "date") {
    if (!hasExactKeys(value, ["kind", "value"]) || !isIsoDate(value.value)) throw new TargetDateGuidancePresentationError("invalid_date");
    return value as GuidanceFact;
  }
  if (value.kind === "text") {
    if (!hasExactKeys(value, ["kind", "value"])) throw new TargetDateGuidancePresentationError("invalid_fact");
    if (!isTextFactValue(value.value)) throw new TargetDateGuidancePresentationError("unknown_fact_text");
    return value as GuidanceFact;
  }
  if (value.kind === "unavailable") {
    if (!hasExactKeys(value, ["kind", "reason"])) throw new TargetDateGuidancePresentationError("invalid_fact");
    if (!isFactUnavailableReason(value.reason)) throw new TargetDateGuidancePresentationError("unknown_fact_reason");
    return value as GuidanceFact;
  }
  throw new TargetDateGuidancePresentationError("unknown_fact_kind");
}

function assertFactsMatchGuidance(guidance: TargetDateGuidance, facts: Record<TargetDateGuidanceFactKey, GuidanceFact>): void {
  const paceKeys: readonly TargetDateGuidanceFactKey[] = ["requiredPace", "actualPace", "forecast"];
  if (guidance.state === "no_goal" || guidance.state === "goal_paused" || guidance.state === "no_plan" || guidance.state === "update_required") {
    const reason = guidance.state === "no_goal" ? "no_goal" : guidance.state === "goal_paused" ? "goal_paused" : guidance.state === "no_plan" ? "no_plan" : "update_required";
    assertAllUnavailable(facts, reason);
    return;
  }
  if (guidance.state === "plan_paused") {
    assertAllUnavailableForKeys(facts, paceKeys, "plan_paused");
    assertTargetTextOrDate(facts.target, "no_target_date");
    return;
  }
  if (guidance.state === "completed") {
    assertAllUnavailableForKeys(facts, ["requiredPace", "actualPace"], "completed");
    assertFactText(facts.forecast, "completed");
    if (facts.target.kind !== "date" && !(facts.target.kind === "text" && facts.target.value === "goal_complete")) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
    return;
  }
  if (guidance.state === "open_ended") {
    assertAllText(facts, paceKeys, "flexible");
    assertFactText(facts.target, "no_target_date");
    return;
  }
  if (guidance.state === "unavailable") {
    assertAllUnavailableForKeys(facts, paceKeys, guidance.reason as GuidanceFactUnavailableReason);
    assertTargetTextOrDate(facts.target, "no_target_date");
    return;
  }
  if (guidance.state === "overdue") {
    const availableShape = facts.requiredPace.kind === "numeric" && facts.actualPace.kind === "numeric" && facts.forecast.kind === "date" && facts.target.kind === "date";
    if (availableShape) return;
    const unavailableShape = facts.requiredPace.kind === "unavailable" && facts.actualPace.kind === "unavailable" && facts.forecast.kind === "unavailable" && facts.requiredPace.reason === facts.actualPace.reason && facts.actualPace.reason === facts.forecast.reason && isForecastUnavailableReason(facts.requiredPace.reason) && facts.target.kind === "date";
    if (unavailableShape) return;
    throw new TargetDateGuidancePresentationError("inconsistent_guidance");
  }
  if (guidance.state === "unreachable" && guidance.reason === "no_future_slots") {
    assertAllUnavailableForKeys(facts, paceKeys, "no_future_slots");
    assertFactDate(facts.target);
    return;
  }
  assertNumeric(facts.requiredPace);
  assertNumeric(facts.actualPace);
  assertFactDate(facts.forecast);
  assertFactDate(facts.target);
}

function assertAllUnavailable(facts: Record<TargetDateGuidanceFactKey, GuidanceFact>, reason: GuidanceFactUnavailableReason): void {
  assertAllUnavailableForKeys(facts, FACT_KEYS, reason);
}

function assertAllUnavailableForKeys(facts: Record<TargetDateGuidanceFactKey, GuidanceFact>, keys: readonly TargetDateGuidanceFactKey[], reason: GuidanceFactUnavailableReason): void {
  for (const key of keys) {
    const fact = facts[key];
    if (fact.kind !== "unavailable" || fact.reason !== reason) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
  }
}

function assertAllText(facts: Record<TargetDateGuidanceFactKey, GuidanceFact>, keys: readonly TargetDateGuidanceFactKey[], value: Extract<GuidanceFact, { kind: "text" }>["value"]): void {
  for (const key of keys) assertFactText(facts[key], value);
}

function assertFactText(fact: GuidanceFact, value: Extract<GuidanceFact, { kind: "text" }>["value"]): void {
  if (fact.kind !== "text" || fact.value !== value) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
}

function assertTargetTextOrDate(fact: GuidanceFact, textValue: Extract<GuidanceFact, { kind: "text" }>["value"]): void {
  if (fact.kind !== "date" && !(fact.kind === "text" && fact.value === textValue)) throw new TargetDateGuidancePresentationError("inconsistent_guidance");
}

function assertFactDate(fact: GuidanceFact): void {
  if (fact.kind !== "date") throw new TargetDateGuidancePresentationError("inconsistent_guidance");
}

function assertNumeric(fact: GuidanceFact): void {
  if (fact.kind !== "numeric") throw new TargetDateGuidancePresentationError("inconsistent_guidance");
}

function formatFact(fact: GuidanceFact, locale: TargetDateGuidanceLocale, timezone: string): string {
  if (fact.kind === "numeric") return translatePlural("targetDateGuidance.fact.questionsPerWeek", fact.value, locale);
  if (fact.kind === "date") return formatCivilDate(fact.value, locale, timezone);
  if (fact.kind === "text") return translate(TEXT_FACT_LABEL_KEYS[fact.value], locale);
  return translate(UNAVAILABLE_FACT_LABEL_KEYS[fact.reason], locale);
}

function formatCivilDate(value: string, locale: TargetDateGuidanceLocale, timezone: string): string {
  if (!isIsoDate(value)) throw new TargetDateGuidancePresentationError("invalid_date");
  const candidate = civilDateAtLocalNoon(value, timezone);
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(candidate);
  } catch {
    throw new TargetDateGuidancePresentationError("invalid_timezone");
  }
}

function civilDateAtLocalNoon(value: string, timezone: string): Date {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  let candidate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = localCivilDate(candidate, timezone);
    const difference = civilDayDifference(local, value);
    if (difference === 0) return candidate;
    candidate = new Date(candidate.getTime() + difference * 86_400_000);
  }
  throw new TargetDateGuidancePresentationError("invalid_date");
}

function localCivilDate(value: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new TargetDateGuidancePresentationError("invalid_timezone");
  return `${year}-${month}-${day}`;
}

function civilDayDifference(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.round((endMs - startMs) / 86_400_000);
}

function translate(key: string, locale: TargetDateGuidanceLocale, values?: Readonly<Record<string, string | number>>, lookupKey = key): string {
  if (!i18n.exists(lookupKey, { lng: locale, ns: "learningPlan", fallbackLng: false })) throw new TargetDateGuidancePresentationError("missing_translation", lookupKey);
  const value = i18n.t(lookupKey, { lng: locale, ns: "learningPlan", fallbackLng: false, ...(values ?? {}) });
  if (typeof value !== "string" || value.trim().length === 0 || value === key || /\{\{\s*[\w.-]+\s*\}\}/u.test(value)) throw new TargetDateGuidancePresentationError("invalid_translation", key);
  return value;
}

function translatePlural(key: string, count: number, locale: TargetDateGuidanceLocale): string {
  const suffix = i18n.services?.pluralResolver?.getSuffix(locale, count);
  if (typeof suffix !== "string" || !i18n.exists(`${key}${suffix}`, { lng: locale, ns: "learningPlan", fallbackLng: false })) throw new TargetDateGuidancePresentationError("missing_translation", `${key}${suffix ?? ""}`);
  return translate(key, locale, { count }, `${key}${suffix}`);
}

function isGuidanceState(value: unknown): value is TargetDateGuidanceState { return (GUIDANCE_STATES as readonly unknown[]).includes(value); }
function isGuidanceReason(value: unknown): value is TargetDateGuidanceReason { return (GUIDANCE_REASONS as readonly unknown[]).includes(value); }
function isGuidanceMessageKey(value: unknown): value is GuidanceMessageKey { return (GUIDANCE_MESSAGE_KEYS as readonly unknown[]).includes(value); }
function isFactUnavailableReason(value: unknown): value is GuidanceFactUnavailableReason { return (FACT_UNAVAILABLE_REASONS as readonly unknown[]).includes(value); }
function isForecastUnavailableReason(value: unknown): boolean { return (FORECAST_UNAVAILABLE_REASONS as readonly unknown[]).includes(value); }
function isTextFactValue(value: unknown): value is Extract<GuidanceFact, { kind: "text" }>["value"] { return (TEXT_FACT_VALUES as readonly unknown[]).includes(value); }
function isActionKind(value: unknown): value is GuidanceAction["kind"] { return typeof value === "string" && Object.prototype.hasOwnProperty.call(ACTION_LABEL_KEYS, value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}
