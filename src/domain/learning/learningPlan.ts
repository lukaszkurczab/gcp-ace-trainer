import type { GoalDay, GoalRecord } from "../goals/goalContracts";
import { GOAL_DAY_IDS, getTrackGoalTemplates, isGoalDay, isIsoDate } from "../goals/goalContracts";
import { projectGoalTargetDate } from "../goals/goalTargetDateSemantics";
import { deepFreeze } from "./familyEnvelope";
import { createContentPackagePin, contentPackagePinsEqual, type ContentPackagePin } from "./contentPackagePin";
import { createLearningPlanSlotId, type LearningPlanSlotId } from "./slotIdentity";
import type { TrackId } from "./trackIdentity";

export type AcceptedTargetMeaning = "event" | "deadline" | "checkpoint" | "none";

export type AcceptedTargetSnapshot = Readonly<{
  meaning: AcceptedTargetMeaning;
  targetDate: string | null;
}>;

export type LearningPlanStatus = "accepted" | "paused" | "completed";

export type PlanSlot = Readonly<{
  slotId: LearningPlanSlotId;
  day: GoalDay;
  localTime: string;
  sessionLength: number;
}>;

export type LearningPlan = Readonly<{
  schemaVersion: 1;
  planId: string;
  trackId: TrackId;
  goalRevision: number;
  status: LearningPlanStatus;
  timezone: string;
  contentVersion: string;
  contentPackagePin: ContentPackagePin;
  acceptedTarget: AcceptedTargetSnapshot;
  createdAt: string;
  updatedAt: string;
  planRevision: number;
  commandId: string;
  slots: readonly PlanSlot[];
}>;

export type LearningPlanSnapshot = Readonly<{
  plan: LearningPlan;
  revision: number;
}>;

export type LearningPlanValidationCode =
  | "invalid_shape"
  | "invalid_schema_version"
  | "invalid_identity"
  | "unknown_track"
  | "invalid_revision"
  | "invalid_status"
  | "invalid_timezone"
  | "invalid_package_pin"
  | "invalid_target"
  | "invalid_timestamp"
  | "invalid_slots";

export class InvalidLearningPlanError extends Error {
  constructor(readonly code: LearningPlanValidationCode = "invalid_shape") {
    super("Learning plan v1 is invalid.");
    this.name = "InvalidLearningPlanError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const PLAN_KEYS = [
  "schemaVersion", "planId", "trackId", "goalRevision", "status", "timezone",
  "contentVersion", "contentPackagePin", "acceptedTarget", "createdAt", "updatedAt", "planRevision", "commandId", "slots",
] as const;
const SLOT_KEYS = ["slotId", "day", "localTime", "sessionLength"] as const;
const TARGET_KEYS = ["meaning", "targetDate"] as const;
const PIN_KEYS = ["packageIdentity", "packageVersion", "contentReleaseId"] as const;

/** Builds the durable target snapshot from the current goal using T4 semantics. */
export function acceptedTargetFromGoal(goal: GoalRecord): AcceptedTargetSnapshot {
  const projection = projectGoalTargetDate(goal);
  return Object.freeze({ meaning: projection.meaning, targetDate: projection.targetDate ?? null });
}

export const createAcceptedTargetSnapshot = acceptedTargetFromGoal;

/** Strict runtime guard for the persisted LearningPlan v1 contract. */
export function isLearningPlanV1(value: unknown): value is LearningPlan {
  try {
    normalizeLearningPlan(value);
    return true;
  } catch {
    return false;
  }
}

export function isLearningPlanV1ForTrack(value: unknown, trackId: string): value is LearningPlan {
  return isLearningPlanV1(value) && value.trackId === trackId;
}

export const isLearningPlan = isLearningPlanV1;

/** Defensive clone/freeze used at the domain and persistence boundary. */
export function normalizeLearningPlan(value: unknown): LearningPlan {
  const plan = asRecord(value, "invalid_shape");
  if (!hasOnlyKeys(plan, PLAN_KEYS)) fail("invalid_shape");
  if (plan.schemaVersion !== 1) fail("invalid_schema_version");
  if (!nonEmpty(plan.planId) || !nonEmpty(plan.trackId) || !nonEmpty(plan.commandId)) fail("invalid_identity");
  try { getTrackGoalTemplates(plan.trackId); } catch { fail("unknown_track"); }
  if (!positiveInteger(plan.goalRevision) || !positiveInteger(plan.planRevision)) fail("invalid_revision");
  if (plan.status !== "accepted" && plan.status !== "paused" && plan.status !== "completed") fail("invalid_status");
  const timezone = validateTimezone(plan.timezone);
  const contentVersion = validateContentVersion(plan.contentVersion);
  const contentPackagePin = validatePin(plan.contentPackagePin);
  const acceptedTarget = validateTarget(plan.acceptedTarget);
  const createdAt = validateTimestamp(plan.createdAt);
  const updatedAt = validateTimestamp(plan.updatedAt);
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail("invalid_timestamp");
  const slots = validateSlots(plan.slots);
  return deepFreeze({
    schemaVersion: 1 as const,
    planId: plan.planId,
    trackId: plan.trackId,
    goalRevision: plan.goalRevision,
    status: plan.status,
    timezone,
    contentVersion,
    contentPackagePin,
    acceptedTarget,
    createdAt,
    updatedAt,
    planRevision: plan.planRevision,
    commandId: plan.commandId,
    slots,
  });
}

export function createLearningPlan(value: LearningPlan): LearningPlan {
  return normalizeLearningPlan(value);
}

export function learningPlansEqual(left: LearningPlan, right: LearningPlan): boolean {
  return left.schemaVersion === right.schemaVersion &&
    left.planId === right.planId &&
    left.trackId === right.trackId &&
    left.goalRevision === right.goalRevision &&
    left.status === right.status &&
    left.timezone === right.timezone &&
    left.contentVersion === right.contentVersion &&
    contentPackagePinsEqual(left.contentPackagePin, right.contentPackagePin) &&
    left.acceptedTarget.meaning === right.acceptedTarget.meaning &&
    left.acceptedTarget.targetDate === right.acceptedTarget.targetDate &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt &&
    left.planRevision === right.planRevision &&
    left.commandId === right.commandId &&
    left.slots.length === right.slots.length &&
    left.slots.every((slot, index) => {
      const other = right.slots[index];
      return other !== undefined && slot.slotId === other.slotId && slot.day === other.day && slot.localTime === other.localTime && slot.sessionLength === other.sessionLength;
    });
}

function validateTarget(value: unknown): AcceptedTargetSnapshot {
  const target = asRecord(value, "invalid_target");
  if (!hasOnlyKeys(target, TARGET_KEYS) || !isTargetMeaning(target.meaning)) fail("invalid_target");
  if (target.targetDate !== null && !isIsoDate(target.targetDate)) fail("invalid_target");
  if (target.meaning === "none" && target.targetDate !== null) fail("invalid_target");
  return Object.freeze({ meaning: target.meaning, targetDate: target.targetDate });
}

function validatePin(value: unknown): ContentPackagePin {
  const pin = asRecord(value, "invalid_package_pin");
  if (!hasOnlyKeys(pin, PIN_KEYS)) fail("invalid_package_pin");
  try { return createContentPackagePin(pin as ContentPackagePin); } catch { fail("invalid_package_pin"); }
}

function validateContentVersion(value: unknown): string {
  if (!nonEmpty(value)) fail("invalid_identity");
  return value;
}

function validateSlots(value: unknown): readonly PlanSlot[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > GOAL_DAY_IDS.length) fail("invalid_slots");
  const days = new Set<GoalDay>();
  const ids = new Set<string>();
  let previousDayIndex = -1;
  const slots = value.map((entry) => {
    const slot = asRecord(entry, "invalid_slots");
    if (!hasOnlyKeys(slot, SLOT_KEYS) || !nonEmpty(slot.slotId) || !isGoalDay(slot.day) || !isLocalTime(slot.localTime) || !positiveInteger(slot.sessionLength)) fail("invalid_slots");
    const dayIndex = GOAL_DAY_IDS.indexOf(slot.day);
    if (days.has(slot.day) || ids.has(slot.slotId) || dayIndex <= previousDayIndex) fail("invalid_slots");
    previousDayIndex = dayIndex;
    days.add(slot.day);
    ids.add(slot.slotId);
    return Object.freeze({ slotId: createLearningPlanSlotId(slot.slotId), day: slot.day, localTime: slot.localTime, sessionLength: slot.sessionLength });
  });
  return Object.freeze(slots);
}

function validateTimezone(value: unknown): string {
  if (!nonEmpty(value)) fail("invalid_timezone");
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); } catch { fail("invalid_timezone"); }
  return value;
}

function validateTimestamp(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value)) fail("invalid_timestamp");
  const instant = new Date(value);
  const canonical = value.includes(".") ? value : value.replace(/Z$/u, ".000Z");
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== canonical) fail("invalid_timestamp");
  return value;
}

function isTargetMeaning(value: unknown): value is AcceptedTargetMeaning {
  return value === "event" || value === "deadline" || value === "checkpoint" || value === "none";
}

function isLocalTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  if (!match) return false;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }

function asRecord(value: unknown, code: LearningPlanValidationCode): Record<string, any> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  return value as Record<string, any>;
}

function hasOnlyKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function fail(code: LearningPlanValidationCode): never { throw new InvalidLearningPlanError(code); }
