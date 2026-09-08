import { isIsoDate } from "../goals/goalContracts";
import { normalizeLearningPlan, type AcceptedTargetSnapshot, type LearningPlan } from "./learningPlan";
import type { ContentPackagePin } from "./contentPackagePin";

/** The completion state already resolved by the package-owned C3 calculator. */
export type C3Result = "unknown" | "in_progress" | "completed";

export type PaceForecastUnavailableReason =
  | "unknown_completion_rule"
  | "no_target"
  | "no_future_slots"
  | "insufficient_elapsed_evidence"
  | "calculation_error";

export type ForecastTrend = "improving" | "stable" | "slowing";

export type ForecastSource = Readonly<{
  planId: string;
  planRevision: number;
  goalRevision: number;
  target: AcceptedTargetSnapshot;
  contentPackagePin: ContentPackagePin;
}>;

export type PaceForecast =
  | Readonly<{
      kind: "unavailable";
      reason: PaceForecastUnavailableReason;
    }>
  | Readonly<{
      kind: "available";
      source: ForecastSource;
      requiredQuestionsPerSession: number;
      requiredQuestionsPerWeek: number;
      actualQuestionsPerWeek: number;
      projectedCompletionDate: string;
      targetDate: string;
      remainingRequiredAttempts: number;
      remainingPlannedCapacity: number;
      status: "on_track" | "at_risk";
      trend: ForecastTrend;
    }>;

export type CompletedSessionFact = Readonly<{
  completedAt: string;
  completedQuestions: number;
  plannedQuestions: number;
}>;

export type CompletedAttemptFact = Readonly<{
  answeredAt: string;
  countsTowardCompletion: boolean;
}>;

export type ImmutableCompletedFacts = Readonly<{
  sessions: readonly CompletedSessionFact[];
  attempts: readonly CompletedAttemptFact[];
}>;

/** A pace calculation is deliberately fed a resolved C3 requirement. */
export type PaceForecastInput = Readonly<{
  acceptedPlan: LearningPlan;
  c3Result: C3Result;
  requiredAttemptCount: number;
  today: string;
  timezone: string;
  completedFacts: ImmutableCompletedFacts;
}>;

export type InvalidPaceForecastInputCode =
  | "invalid_shape"
  | "invalid_plan"
  | "invalid_today"
  | "invalid_timezone"
  | "invalid_completion_requirement"
  | "invalid_c3_result"
  | "invalid_fact"
  | "future_fact"
  | "inconsistent_fact";

/** Every malformed or contradictory calculator input has one typed error. */
export class InvalidPaceForecastInputError extends Error {
  constructor(readonly code: InvalidPaceForecastInputCode = "invalid_shape") {
    super("Invalid pace forecast input.");
    this.name = "InvalidPaceForecastInputError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Calculates required pace, observed pace, projected completion and trend.
 *
 * All dates are calendar dates in the supplied IANA timezone.  No current
 * clock, locale timezone or rounded rate participates in the projection.
 */
export function calculatePaceForecast(input: PaceForecastInput): PaceForecast {
  const value = validateInput(input);
  const plan = value.acceptedPlan;
  const target = plan.acceptedTarget;

  if (target.targetDate === null || target.meaning === "none") {
    return unavailable("no_target");
  }
  if (value.c3Result === "unknown") {
    return unavailable("unknown_completion_rule");
  }

  const qualifyingAll = value.facts.attempts.filter((attempt) => attempt.countsTowardCompletion);
  const qualifying = value.facts.attempts.filter((attempt) => {
    if (value.observationStart === null) return false;
    const localDate = localDateForInstant(attempt.answeredAt, value.timezone);
    return attempt.countsTowardCompletion && localDate >= value.observationStart && localDate <= value.today;
  });
  const remaining = value.c3Result === "completed"
    ? 0
    : Math.max(0, value.requiredAttemptCount - qualifyingAll.length);

  const lastAllowedDate = target.meaning === "event" ? tryAddDays(target.targetDate, -1) : target.targetDate;
  if (lastAllowedDate === null) return unavailable("calculation_error");
  const occurrences = countFutureOccurrences(plan, value.today, lastAllowedDate);
  if (occurrences === null) return unavailable("calculation_error");
  if (remaining > 0 && occurrences.count === 0) return unavailable("no_future_slots");

  // A completed C3 result has no remaining work and therefore needs no
  // history to produce the canonical today/on-track result.
  if (remaining > 0) {
    if (value.observationStart === null) return unavailable("calculation_error");
    if (value.observationDays < 7 || qualifying.length === 0) return unavailable("insufficient_elapsed_evidence");
  }

  const inclusiveRemainingDays = Math.max(1, daysBetween(value.today, lastAllowedDate) + 1);
  const requiredQuestionsPerWeek = ceilToTwo(remaining * 7 / inclusiveRemainingDays);
  const requiredQuestionsPerSession = occurrences.count === 0 ? 0 : Math.ceil(remaining / occurrences.count);
  const actualUnroundedRate = qualifying.length === 0 ? 0 : qualifying.length * 7 / value.observationDays;
  const actualQuestionsPerWeek = roundToTwo(actualUnroundedRate);
  const projectedDayCount = remaining === 0 ? 0 : Math.ceil(remaining * 7 / actualUnroundedRate);
  if (!Number.isSafeInteger(projectedDayCount) || projectedDayCount < 0) return unavailable("calculation_error");
  const projectedCompletionDate = remaining === 0
    ? value.today
    : tryAddDays(value.today, Math.max(0, projectedDayCount - 1));
  if (projectedCompletionDate === null) return unavailable("calculation_error");
  const trend = remaining === 0 ? "stable" : calculateTrend(value);
  if (trend === null) return unavailable("calculation_error");
  const status = remaining === 0 || projectedCompletionDate <= lastAllowedDate ? "on_track" : "at_risk";

  return freezeAvailable({
    kind: "available",
    source: freezeSource(plan),
    requiredQuestionsPerSession,
    requiredQuestionsPerWeek,
    actualQuestionsPerWeek,
    projectedCompletionDate,
    targetDate: target.targetDate,
    remainingRequiredAttempts: remaining,
    remainingPlannedCapacity: occurrences.capacity,
    status,
    trend,
  });
}

type ValidatedFacts = ImmutableCompletedFacts;

type ValidatedInput = Readonly<{
  acceptedPlan: LearningPlan;
  c3Result: C3Result;
  requiredAttemptCount: number;
  today: string;
  timezone: string;
  facts: ImmutableCompletedFacts;
  observationStart: string | null;
  observationDays: number;
  ageDays: number;
}>;

function validateInput(input: PaceForecastInput): ValidatedInput {
  const value = asRecord(input, "invalid_shape");
  if (!hasOnlyKeys(value, ["acceptedPlan", "c3Result", "requiredAttemptCount", "today", "timezone", "completedFacts"])) fail("invalid_shape");
  const planValue = value.acceptedPlan;
  let acceptedPlan: LearningPlan;
  try {
    acceptedPlan = normalizeLearningPlan(planValue);
  } catch {
    fail("invalid_plan");
  }
  if (typeof value.c3Result !== "string" || !["unknown", "in_progress", "completed"].includes(value.c3Result)) fail("invalid_c3_result");
  const c3Result = value.c3Result as C3Result;
  const timezone = validateTimezone(value.timezone);
  if (acceptedPlan.timezone !== timezone) fail("invalid_timezone");
  const today = validateDate(value.today, "invalid_today");
  const createdLocalDate = localDateForInstant(acceptedPlan.createdAt, timezone);
  const ageDays = daysBetween(createdLocalDate, today);
  if (ageDays < 0) fail("inconsistent_fact");

  if (!isNonNegativeInteger(value.requiredAttemptCount)) fail("invalid_completion_requirement");
  const requiredAttemptCount = value.requiredAttemptCount;
  const facts = validateFacts(value.completedFacts, timezone, today);
  const observationWindowStart = tryAddDays(today, -27);
  const observationStart = observationWindowStart === null ? null : maxDate(createdLocalDate, observationWindowStart);
  const observationDays = observationStart === null ? 0 : daysBetween(observationStart, today) + 1;
  return Object.freeze({ acceptedPlan, c3Result, requiredAttemptCount, today, timezone, facts, observationStart, observationDays, ageDays });
}

function validateFacts(value: unknown, timezone: string, today: string): ValidatedFacts {
  const record = asRecord(value, "invalid_fact");
  if (!hasOnlyKeys(record, ["sessions", "attempts"]) || !Array.isArray(record.sessions) || !Array.isArray(record.attempts)) fail("invalid_fact");
  const sessions: CompletedSessionFact[] = [];
  for (const entry of record.sessions) {
    const session = asRecord(entry, "invalid_fact");
    if (!hasOnlyKeys(session, ["completedAt", "completedQuestions", "plannedQuestions"]) ||
      !isNonNegativeInteger(session.completedQuestions) || !isPositiveInteger(session.plannedQuestions) || session.completedQuestions > session.plannedQuestions) {
      fail("inconsistent_fact");
    }
    const completedAt = validateInstant(session.completedAt, "invalid_fact");
    if (localDateForInstant(completedAt, timezone) > today) fail("future_fact");
    sessions.push(Object.freeze({ completedAt, completedQuestions: session.completedQuestions, plannedQuestions: session.plannedQuestions }));
  }
  const attempts: CompletedAttemptFact[] = [];
  for (const entry of record.attempts) {
    const attempt = asRecord(entry, "invalid_fact");
    if (!hasOnlyKeys(attempt, ["answeredAt", "countsTowardCompletion"]) || typeof attempt.countsTowardCompletion !== "boolean") fail("invalid_fact");
    const answeredAt = validateInstant(attempt.answeredAt, "invalid_fact");
    const localDate = localDateForInstant(answeredAt, timezone);
    if (localDate > today) fail("future_fact");
    attempts.push(Object.freeze({ answeredAt, countsTowardCompletion: attempt.countsTowardCompletion }));
  }
  const facts = Object.freeze({ sessions: Object.freeze(sessions), attempts: Object.freeze(attempts) });
  return facts;
}

function countFutureOccurrences(plan: LearningPlan, today: string, lastAllowedDate: string): Readonly<{ count: number; capacity: number }> | null {
  if (lastAllowedDate < today) return Object.freeze({ count: 0, capacity: 0 });
  let count = 0;
  let capacity = 0;
  for (let date = today; date <= lastAllowedDate;) {
    const day = dayForDate(date);
    for (const slot of plan.slots) {
      if (slot.day === day) {
        count += 1;
        capacity += slot.sessionLength;
      }
    }
    if (date === lastAllowedDate) break;
    const nextDate = tryAddDays(date, 1);
    if (nextDate === null) return null;
    date = nextDate;
  }
  return Object.freeze({ count, capacity });
}

function calculateTrend(input: ValidatedInput): ForecastTrend | null {
  // Before two complete windows exist, neutral is the only honest trend.  It
  // does not classify a learner as improving or slowing prematurely.
  if (input.ageDays < 13) return "stable";
  const currentStart = tryAddDays(input.today, -6);
  const previousStart = tryAddDays(input.today, -13);
  const previousEnd = tryAddDays(input.today, -7);
  if (currentStart === null || previousStart === null || previousEnd === null) return null;
  const currentCount = input.facts.attempts.filter((attempt) => attempt.countsTowardCompletion && localDateForInstant(attempt.answeredAt, input.timezone) >= currentStart && localDateForInstant(attempt.answeredAt, input.timezone) <= input.today).length;
  const previousCount = input.facts.attempts.filter((attempt) => attempt.countsTowardCompletion && localDateForInstant(attempt.answeredAt, input.timezone) >= previousStart && localDateForInstant(attempt.answeredAt, input.timezone) <= previousEnd).length;
  if (previousCount === 0) return currentCount === 0 ? "stable" : "improving";
  if (currentCount === 0) return "slowing";
  const ratio = currentCount / previousCount;
  if (ratio > 1.1) return "improving";
  if (ratio < 0.9) return "slowing";
  return "stable";
}

function freezeAvailable(value: Extract<PaceForecast, { kind: "available" }>): Extract<PaceForecast, { kind: "available" }> {
  return Object.freeze(value);
}

function freezeSource(plan: LearningPlan): ForecastSource {
  return Object.freeze({
    planId: plan.planId,
    planRevision: plan.planRevision,
    goalRevision: plan.goalRevision,
    target: Object.freeze({ ...plan.acceptedTarget }),
    contentPackagePin: Object.freeze({ ...plan.contentPackagePin }),
  });
}

function unavailable(reason: PaceForecastUnavailableReason): Extract<PaceForecast, { kind: "unavailable" }> {
  return Object.freeze({ kind: "unavailable", reason });
}

function validateTimezone(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) fail("invalid_timezone");
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); } catch { fail("invalid_timezone"); }
  return value;
}

function validateDate(value: unknown, code: InvalidPaceForecastInputCode): string {
  if (!isIsoDate(value)) fail(code);
  return value;
}

function validateInstant(value: unknown, code: InvalidPaceForecastInputCode): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value)) fail(code);
  const instant = new Date(value);
  const canonical = value.includes(".") ? value : value.replace(/Z$/u, ".000Z");
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== canonical) fail(code);
  return value;
}

function localDateForInstant(value: string, timezone: string): string {
  const instant = new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new InvalidPaceForecastInputError("invalid_timezone");
  const date = `${year}-${month}-${day}`;
  if (!isIsoDate(date)) throw new InvalidPaceForecastInputError("invalid_timezone");
  return date;
}

function dayForDate(value: string): "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" {
  const day = new Date(`${value}T00:00:00.000Z`).getUTCDay();
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[day]!;
}

function tryAddDays(value: string, amount: number): string | null {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  if (Number.isNaN(date.getTime())) return null;
  const result = date.toISOString().slice(0, 10);
  return isIsoDate(result) ? result : null;
}

function daysBetween(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.round((endMs - startMs) / 86_400_000);
}

function maxDate(left: string, right: string): string { return left >= right ? left : right; }
function ceilToTwo(value: number): number { return value === 0 ? 0 : Math.ceil((value - Number.EPSILON) * 100) / 100; }
function roundToTwo(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function isPositiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }

function asRecord(value: unknown, code: InvalidPaceForecastInputCode): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  return value as Record<string, unknown>;
}

function hasOnlyKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.every((key) => expected.includes(key)) && keys.length === new Set(keys).size;
}

function fail(code: InvalidPaceForecastInputCode): never { throw new InvalidPaceForecastInputError(code); }
