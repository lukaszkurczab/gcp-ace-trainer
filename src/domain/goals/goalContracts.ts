import type { TrackId } from "../learning/trackIdentity";
import {
  GOAL_TEMPLATE_IDS,
  GoalPolicyUnavailableError,
  isGoalPolicyForTrack,
  type GoalPolicy,
  type GoalTemplateId,
} from "./goalPolicy";

export { GOAL_TEMPLATE_IDS } from "./goalPolicy";
export type { GoalPolicy, GoalTemplateId } from "./goalPolicy";
export type { GoalPolicyResolver } from "./goalPolicy";
export { isGoalPolicyForTrack, GoalPolicyUnavailableError } from "./goalPolicy";

export const GOAL_DAY_IDS = Object.freeze(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const);
export type GoalDay = (typeof GOAL_DAY_IDS)[number];
export type GoalStatus = "active" | "paused";

export type GoalRecord = Readonly<{
  goalType: GoalTemplateId;
  preferredDays: readonly GoalDay[];
  status: GoalStatus;
  targetDate?: string;
  trackId: TrackId;
  weeklySessionTarget: number;
}>;

export type GoalSnapshot = Readonly<{
  record: GoalRecord;
  revision: number;
}>;

/** Structural validation is independent of track admission and track-specific goal policy. */
export function isGoalRecordShape(value: unknown): value is GoalRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => !["goalType", "preferredDays", "status", "targetDate", "trackId", "weeklySessionTarget"].includes(key)) || keys.length < 5 || keys.length > 6) return false;
  if (typeof record.trackId !== "string" || record.trackId.length === 0 || !isGoalTemplateId(record.goalType)) return false;
  if (!Array.isArray(record.preferredDays) || record.preferredDays.length > 7 || !record.preferredDays.every(isGoalDay) || new Set(record.preferredDays).size !== record.preferredDays.length) return false;
  const preferredDays = record.preferredDays;
  return Number.isSafeInteger(record.weeklySessionTarget) && Number(record.weeklySessionTarget) >= 0 && Number(record.weeklySessionTarget) <= 7 &&
    (record.weeklySessionTarget !== 0 || preferredDays.length === 0) &&
    (record.targetDate === undefined || isIsoDate(record.targetDate)) &&
    (record.status === "active" || record.status === "paused");
}
/** Semantic validation is a separate required step at every per-track boundary. */
export function isGoalRecordForPolicy(value: unknown, policy: GoalPolicy): value is GoalRecord {
  if (!isGoalRecordShape(value)) return false;
  return isGoalPolicyForTrack(policy, value.trackId) && policy.validGoalTemplateIds.includes(value.goalType);
}

export function createDefaultGoal(policy: GoalPolicy): GoalRecord {
  if (!isGoalPolicyForTrack(policy, policy.trackId)) throw new GoalPolicyUnavailableError(policy.trackId);
  const firstTemplate = policy.validGoalTemplateIds[0];
  if (!firstTemplate) throw new GoalPolicyUnavailableError(policy.trackId);
  return Object.freeze({
    goalType: firstTemplate,
    preferredDays: Object.freeze(["mon", "wed", "sat"] as const),
    status: "active" as const,
    trackId: policy.trackId,
    weeklySessionTarget: 3,
  });
}

export function normalizeGoalRecord(value: GoalRecord, policy: GoalPolicy): GoalRecord {
  if (!isGoalRecordShape(value)) throw new Error("Goal record is structurally invalid.");
  if (!isGoalPolicyForTrack(policy, value.trackId) || !policy.validGoalTemplateIds.includes(value.goalType)) throw new Error(`Goal record for ${value.trackId} is invalid.`);
  const preferredDays = GOAL_DAY_IDS.filter((day) => value.preferredDays.includes(day));
  const { targetDate, ...requiredFields } = value;
  return Object.freeze({
    ...requiredFields,
    ...(targetDate === undefined ? {} : { targetDate }),
    preferredDays: Object.freeze(preferredDays),
    weeklySessionTarget: preferredDays.length,
  });
}

export function isGoalRecordForTrack(value: unknown, policy: GoalPolicy): value is GoalRecord {
  return isGoalRecordForPolicy(value, policy) && value.preferredDays.length > 0 && value.weeklySessionTarget === value.preferredDays.length;
}

export function isGoalTemplateId(value: unknown): value is GoalTemplateId {
  return GOAL_TEMPLATE_IDS.includes(value as GoalTemplateId);
}

export function isGoalDay(value: unknown): value is GoalDay {
  return GOAL_DAY_IDS.includes(value as GoalDay);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
