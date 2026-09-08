import type { GoalDay, GoalRecord, GoalSnapshot } from "../goals/goalContracts";
import { GOAL_DAY_IDS, isGoalDay, isGoalRecordForTrack, normalizeGoalRecord } from "../goals/goalContracts";
import { projectGoalTargetDate } from "../goals/goalTargetDateSemantics";
import type { ContentPackagePin } from "./contentPackagePin";
import { contentPackagePinsEqual, createContentPackagePin } from "./contentPackagePin";
import type { PackageCompletionState } from "./packageCompletionRule";
import type { TrackId } from "./trackIdentity";

export type ProposalSessionCapacity =
  | Readonly<{ kind: "exact"; actualLength: number }>
  | Readonly<{ kind: "shortened"; actualLength: number; requestedLength: number }>
  | Readonly<{ kind: "shortfall"; requestedLength: number; eligibleItemCount: number; missingItemCount: number }>;

/** A stable, recurring local-time slot in a generated proposal. */
export type ProposalSlot = Readonly<{
  slotId: string;
  day: GoalDay;
  localTime: "18:00";
  sessionLength: number;
}>;

/** The context that must remain equal before a proposal can be consumed. */
export type ProposalIdentity = Readonly<{
  trackId: TrackId;
  goalRevision: number;
  contentVersion: string;
  packagePin: ContentPackagePin;
  timezone: string;
}>;

/** Material selection is a semantic scope, never a list of content item IDs. */
export type MaterialPriority =
  | Readonly<{ kind: "due_review" }>
  | Readonly<{ kind: "package_primary_scope"; label: string }>;

export type TargetAssessment =
  | Readonly<{ kind: "unavailable_due_to_shortfall" }>
  | Readonly<{ kind: "open_ended" }>
  | Readonly<{ kind: "unknown_completion_rule" }>
  | Readonly<{
      kind: "achievable" | "unreachable";
      occurrences: number;
      actualLength: number;
      remainingAttempts: number;
    }>;

/** All facts needed by the proposal screen and by the future coordinator. */
export type ProposalOutcome = Readonly<{
  kind: "ready" | "shortened" | "shortfall";
  identity: ProposalIdentity;
  goal: GoalRecord;
  primaryModeId: string;
  requestedLength: number;
  sessionCapacity: ProposalSessionCapacity;
  completionState: PackageCompletionState;
  materialPriority: MaterialPriority;
  targetAssessment: TargetAssessment;
  slots: readonly ProposalSlot[];
}>;

/** Inputs are read-only by contract; the generator defensively clones every value it returns. */
export type GeneratorInput = Readonly<{
  goalSnapshot: GoalSnapshot;
  packagePin: ContentPackagePin;
  contentVersion: string;
  primaryModeId: string;
  requestedLength: number;
  sessionCapacity: ProposalSessionCapacity;
  completionState: PackageCompletionState;
  dueReviewCount: number;
  primaryScopeLabel: string;
  localToday: string;
  timezone: string;
}>;

export type InvalidLearningPlanProposalInputCode =
  | "invalid_input"
  | "invalid_goal_snapshot"
  | "invalid_track_identity"
  | "invalid_package_pin"
  | "invalid_content_version"
  | "invalid_mode"
  | "invalid_requested_length"
  | "invalid_session_capacity"
  | "invalid_completion_state"
  | "invalid_due_review_count"
  | "invalid_primary_scope_label"
  | "invalid_local_today"
  | "invalid_target_date"
  | "invalid_timezone";

/** All generator validation failures use this one machine-readable error type. */
export class InvalidLearningPlanProposalInputError extends Error {
  readonly code: InvalidLearningPlanProposalInputCode;

  constructor(code: InvalidLearningPlanProposalInputCode) {
    super("Invalid learning plan proposal input.");
    this.name = "InvalidLearningPlanProposalInputError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Builds a deterministic proposal from already-resolved package and C3 facts.
 *
 * No current time, random value, locale, or device timezone is consulted. Date
 * arithmetic is performed on UTC-midnight values solely as a calendar-day
 * representation, so daylight-saving transitions cannot change the result.
 */
export function generateLearningPlanProposal(input: GeneratorInput): ProposalOutcome {
  try {
    return generate(input);
  } catch (error) {
    if (error instanceof InvalidLearningPlanProposalInputError) throw error;
    throw new InvalidLearningPlanProposalInputError("invalid_input");
  }
}

function generate(input: GeneratorInput): ProposalOutcome {
  const value = asRecord(input);
  if (!hasOnlyKeys(value, ["goalSnapshot", "packagePin", "contentVersion", "primaryModeId", "requestedLength", "sessionCapacity", "completionState", "dueReviewCount", "primaryScopeLabel", "localToday", "timezone"])) fail("invalid_input");
  const goalSnapshot = validateGoalSnapshot(value.goalSnapshot);
  const normalizedPin = validatePackagePin(value.packagePin);
  const contentVersion = validateNonEmptyText(value.contentVersion, "invalid_content_version");
  const primaryModeId = validateNonEmptyText(value.primaryModeId, "invalid_mode");
  const requestedLength = validatePositiveInteger(value.requestedLength, "invalid_requested_length");
  const sessionCapacity = validateSessionCapacity(value.sessionCapacity, requestedLength);
  const completionState = validateCompletionState(value.completionState);
  const dueReviewCount = validateNonNegativeInteger(value.dueReviewCount, "invalid_due_review_count");
  const primaryScopeLabel = validateNonEmptyText(value.primaryScopeLabel, "invalid_primary_scope_label");
  const localToday = validateIsoDate(value.localToday, "invalid_local_today");
  const timezone = validateTimezone(value.timezone);

  // GoalRecord validation already checks targetDate shape. Keeping this check
  // separate gives callers one explicit code for a malformed legacy snapshot.
  const targetDateValue = goalSnapshot.record.targetDate;
  if (targetDateValue !== undefined && !isStrictIsoDate(targetDateValue)) fail("invalid_target_date");

  const identity: ProposalIdentity = Object.freeze({
    trackId: goalSnapshot.record.trackId,
    goalRevision: goalSnapshot.revision,
    contentVersion,
    packagePin: normalizedPin,
    timezone,
  });

  const materialPriority: MaterialPriority = dueReviewCount > 0
    ? Object.freeze({ kind: "due_review" })
    : Object.freeze({ kind: "package_primary_scope", label: primaryScopeLabel });

  const resolution = resolveCapacity(sessionCapacity);
  const targetAssessment = buildTargetAssessment(goalSnapshot.record, completionState, localToday, resolution);
  const slots = resolution.kind === "shortfall"
    ? Object.freeze([] as readonly ProposalSlot[])
    : createSlots(goalSnapshot.record.preferredDays, resolution.actualLength);

  return Object.freeze({
    kind: sessionCapacity.kind === "shortfall" ? "shortfall" : sessionCapacity.kind === "shortened" ? "shortened" : "ready",
    identity,
    goal: Object.freeze({ ...goalSnapshot.record, preferredDays: Object.freeze([...goalSnapshot.record.preferredDays]) }),
    primaryModeId,
    requestedLength,
    sessionCapacity: cloneCapacity(sessionCapacity),
    completionState: cloneCompletionState(completionState),
    materialPriority,
    targetAssessment,
    slots,
  });
}

function validateGoalSnapshot(value: unknown): GoalSnapshot {
  const snapshot = asRecord(value, "invalid_goal_snapshot");
  if (!hasOnlyKeys(snapshot, ["record", "revision"]) || !positiveInteger(snapshot.revision)) fail("invalid_goal_snapshot");
  const record = asRecord(snapshot.record, "invalid_goal_snapshot");
  if (typeof record.trackId !== "string" || !record.trackId.trim()) fail("invalid_track_identity");

  let normalized: GoalRecord;
  try {
    normalized = normalizeGoalRecord(record as GoalRecord);
  } catch {
    fail("invalid_goal_snapshot");
  }
  // The generator requires a usable normalized goal. In particular, a legacy
  // empty-day record cannot silently become a proposal with no slots.
  if (!isGoalRecordForTrack(normalized, normalized.trackId) || normalized.preferredDays.length === 0 || normalized.status !== "active") fail("invalid_goal_snapshot");
  if (normalized.preferredDays.some((day) => !isGoalDay(day))) fail("invalid_goal_snapshot");
  return Object.freeze({ record: normalized, revision: snapshot.revision });
}

function validatePackagePin(value: unknown): ContentPackagePin {
  const pin = asRecord(value, "invalid_package_pin") as ContentPackagePin;
  let normalized: ContentPackagePin;
  try {
    normalized = createContentPackagePin(pin);
    if (!contentPackagePinsEqual(pin, normalized)) fail("invalid_package_pin");
  } catch {
    fail("invalid_package_pin");
  }
  return normalized;
}

function validateSessionCapacity(value: unknown, requestedLength: number): ProposalSessionCapacity {
  const capacity = asRecord(value, "invalid_session_capacity");
  if (capacity.kind === "exact") {
    if (!hasOnlyKeys(capacity, ["kind", "actualLength"]) || !positiveInteger(capacity.actualLength) || capacity.actualLength !== requestedLength) fail("invalid_session_capacity");
    return Object.freeze({ kind: "exact", actualLength: capacity.actualLength });
  }
  if (capacity.kind === "shortened") {
    if (!hasOnlyKeys(capacity, ["kind", "actualLength", "requestedLength"]) || !positiveInteger(capacity.actualLength) || !positiveInteger(capacity.requestedLength) || capacity.requestedLength !== requestedLength || capacity.actualLength >= capacity.requestedLength) fail("invalid_session_capacity");
    return Object.freeze({ kind: "shortened", actualLength: capacity.actualLength, requestedLength: capacity.requestedLength });
  }
  if (capacity.kind === "shortfall") {
    if (!hasOnlyKeys(capacity, ["kind", "requestedLength", "eligibleItemCount", "missingItemCount"]) || !positiveInteger(capacity.requestedLength) || capacity.requestedLength !== requestedLength || !nonNegativeInteger(capacity.eligibleItemCount) || !nonNegativeInteger(capacity.missingItemCount) || capacity.eligibleItemCount >= capacity.requestedLength || capacity.missingItemCount !== capacity.requestedLength - capacity.eligibleItemCount) fail("invalid_session_capacity");
    return Object.freeze({ kind: "shortfall", requestedLength: capacity.requestedLength, eligibleItemCount: capacity.eligibleItemCount, missingItemCount: capacity.missingItemCount });
  }
  fail("invalid_session_capacity");
}

function validateCompletionState(value: unknown): PackageCompletionState {
  const completion = asRecord(value, "invalid_completion_state");
  if (completion.kind === "unknown") {
    if (!hasOnlyKeys(completion, ["kind"])) fail("invalid_completion_state");
    return Object.freeze({ kind: "unknown" });
  }
  if (completion.kind === "in_progress") {
    if (!hasOnlyKeys(completion, ["kind", "qualifyingAttemptCount", "requiredAttemptCount", "rollingWindowSize"]) || !nonNegativeInteger(completion.qualifyingAttemptCount) || !positiveInteger(completion.requiredAttemptCount) || !positiveInteger(completion.rollingWindowSize)) fail("invalid_completion_state");
    return Object.freeze({ kind: "in_progress", qualifyingAttemptCount: completion.qualifyingAttemptCount, requiredAttemptCount: completion.requiredAttemptCount, rollingWindowSize: completion.rollingWindowSize });
  }
  if (completion.kind === "completed") {
    if (!hasOnlyKeys(completion, ["kind", "qualifyingAttemptCount", "rollingWindowSize", "quality"]) || !nonNegativeInteger(completion.qualifyingAttemptCount) || !positiveInteger(completion.rollingWindowSize) || typeof completion.quality !== "number" || !Number.isFinite(completion.quality) || completion.quality < 0 || completion.quality > 1) fail("invalid_completion_state");
    return Object.freeze({ kind: "completed", qualifyingAttemptCount: completion.qualifyingAttemptCount, rollingWindowSize: completion.rollingWindowSize, quality: completion.quality });
  }
  fail("invalid_completion_state");
}

function buildTargetAssessment(record: GoalRecord, completion: PackageCompletionState, localToday: string, capacity: ResolvedCapacity): TargetAssessment {
  if (capacity.kind === "shortfall") return Object.freeze({ kind: "unavailable_due_to_shortfall" });

  const target = projectGoalTargetDate(record);
  // No target takes precedence over C3 unknown and over a legacy own-pace date.
  if (target.targetDate === undefined || target.meaning === "none") return Object.freeze({ kind: "open_ended" });
  if (completion.kind === "unknown") return Object.freeze({ kind: "unknown_completion_rule" });

  const remainingAttempts = completion.kind === "completed"
    ? 0
    : Math.max(0, completion.requiredAttemptCount - completion.qualifyingAttemptCount);
  const boundary = target.sessionBoundary === "strictly_before"
    ? addCalendarDays(target.targetDate, -1)
    : target.targetDate;
  const occurrences = countPreferredDayOccurrences(localToday, boundary, record.preferredDays);
  const achievable = occurrences * capacity.actualLength >= remainingAttempts;
  return Object.freeze({ kind: achievable ? "achievable" : "unreachable", occurrences, actualLength: capacity.actualLength, remainingAttempts });
}

type ResolvedCapacity =
  | Readonly<{ kind: "exact" | "shortened"; actualLength: number }>
  | Readonly<{ kind: "shortfall" }>;

function resolveCapacity(capacity: ProposalSessionCapacity): ResolvedCapacity {
  if (capacity.kind === "shortfall") return Object.freeze({ kind: "shortfall" });
  return Object.freeze({ kind: capacity.kind, actualLength: capacity.actualLength });
}

function createSlots(days: readonly GoalDay[], actualLength: number): readonly ProposalSlot[] {
  return Object.freeze(days.map((day) => Object.freeze({ slotId: `proposal-slot:v1:${day}:18-00`, day, localTime: "18:00" as const, sessionLength: actualLength })));
}

function cloneCapacity(capacity: ProposalSessionCapacity): ProposalSessionCapacity {
  return capacity.kind === "exact"
    ? Object.freeze({ kind: "exact", actualLength: capacity.actualLength })
    : capacity.kind === "shortened"
      ? Object.freeze({ kind: "shortened", actualLength: capacity.actualLength, requestedLength: capacity.requestedLength })
      : Object.freeze({ kind: "shortfall", requestedLength: capacity.requestedLength, eligibleItemCount: capacity.eligibleItemCount, missingItemCount: capacity.missingItemCount });
}

function cloneCompletionState(state: PackageCompletionState): PackageCompletionState {
  return state.kind === "unknown"
    ? Object.freeze({ kind: "unknown" })
    : state.kind === "in_progress"
      ? Object.freeze({ kind: "in_progress", qualifyingAttemptCount: state.qualifyingAttemptCount, requiredAttemptCount: state.requiredAttemptCount, rollingWindowSize: state.rollingWindowSize })
      : Object.freeze({ kind: "completed", qualifyingAttemptCount: state.qualifyingAttemptCount, rollingWindowSize: state.rollingWindowSize, quality: state.quality });
}

function validateIsoDate(value: unknown, code: InvalidLearningPlanProposalInputCode): string {
  if (!isStrictIsoDate(value)) fail(code);
  return value;
}

function isStrictIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = utcMidnight(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function addCalendarDays(value: string, amount: number): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) fail("invalid_target_date");
  const date = utcMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}

function countPreferredDayOccurrences(startValue: string, endValue: Date | string, preferredDays: readonly GoalDay[]): number {
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(startValue);
  if (!startMatch) fail("invalid_local_today");
  const start = utcMidnight(Number(startMatch[1]), Number(startMatch[2]) - 1, Number(startMatch[3]));
  const end = typeof endValue === "string"
    ? parseDate(endValue, "invalid_target_date")
    : endValue;
  const daySpan = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (daySpan <= 0) return 0;

  const selected = new Set<GoalDay>(preferredDays);
  const fullWeeks = Math.floor(daySpan / 7);
  const remainder = daySpan % 7;
  let count = fullWeeks * selected.size;
  const startDay = utcDayToGoalDay(start.getUTCDay());
  for (let offset = 0; offset < remainder; offset += 1) {
    const day = GOAL_DAY_IDS[(GOAL_DAY_IDS.indexOf(startDay) + offset) % GOAL_DAY_IDS.length]!;
    if (selected.has(day)) count += 1;
  }
  return count;
}

function parseDate(value: string, code: InvalidLearningPlanProposalInputCode): Date {
  if (!isStrictIsoDate(value)) fail(code);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value)!;
  return utcMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function utcMidnight(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, monthIndex, day);
  return date;
}

function utcDayToGoalDay(day: number): GoalDay {
  const values: readonly GoalDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return values[day] ?? "sun";
}

function validateTimezone(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) fail("invalid_timezone");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
  } catch {
    fail("invalid_timezone");
  }
  return value;
}

function validateNonEmptyText(value: unknown, code: InvalidLearningPlanProposalInputCode): string {
  if (typeof value !== "string" || !value.trim()) fail(code);
  return value;
}

function validatePositiveInteger(value: unknown, code: InvalidLearningPlanProposalInputCode): number {
  if (!positiveInteger(value)) fail(code);
  return value;
}

function validateNonNegativeInteger(value: unknown, code: InvalidLearningPlanProposalInputCode): number {
  if (!nonNegativeInteger(value)) fail(code);
  return value;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function asRecord(value: unknown, code: InvalidLearningPlanProposalInputCode = "invalid_input"): Record<string, any> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  return value as Record<string, any>;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function fail(code: InvalidLearningPlanProposalInputCode): never {
  throw new InvalidLearningPlanProposalInputError(code);
}

const DAY_MS = 86_400_000;
