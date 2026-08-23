import { isRegisteredTrackId } from "../tracks/trackRegistry";
import { TRACK_DENSITY_DESCRIPTORS } from "../tracks/trackAdmission";
import type { TrackId } from "../learning";

export const GOAL_TEMPLATE_IDS = Object.freeze([
  "prepare_for_an_interview",
  "prepare_for_a_certification",
  "build_foundations",
  "refresh_and_maintain_skills",
  "learn_at_own_pace",
] as const);

export type GoalTemplateId = (typeof GOAL_TEMPLATE_IDS)[number];

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

export function getTrackGoalTemplates(trackId: TrackId): readonly GoalTemplateId[] {
  const descriptor = TRACK_DENSITY_DESCRIPTORS.find((candidate) => candidate.trackId === trackId);
  if (!descriptor) throw new Error(`No goal templates are declared for track ${trackId}.`);
  const templates = descriptor.goalTemplates.map((template) => {
    if (!isGoalTemplateId(template)) throw new Error(`Unsupported goal template ${template} for track ${trackId}.`);
    return template;
  });
  return Object.freeze(templates);
}

export function createDefaultGoal(trackId: TrackId): GoalRecord {
  const templates = getTrackGoalTemplates(trackId);
  const firstTemplate = templates[0];
  if (!firstTemplate) throw new Error(`Track ${trackId} has no selectable goal template.`);
  return Object.freeze({
    goalType: firstTemplate,
    preferredDays: Object.freeze(["mon", "wed", "sat"] as const),
    status: "active" as const,
    trackId,
    weeklySessionTarget: 3,
  });
}

export function isGoalRecordForTrack(value: unknown, trackId: string): value is GoalRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => !["goalType", "preferredDays", "status", "targetDate", "trackId", "weeklySessionTarget"].includes(key)) || keys.length < 5 || keys.length > 6) return false;
  if (record.trackId !== trackId || typeof record.trackId !== "string" || !isRegisteredTrackId(record.trackId)) return false;
  let templates: readonly GoalTemplateId[];
  try { templates = getTrackGoalTemplates(record.trackId); } catch { return false; }
  return templates.includes(record.goalType as GoalTemplateId) &&
    Number.isSafeInteger(record.weeklySessionTarget) && Number(record.weeklySessionTarget) >= 1 && Number(record.weeklySessionTarget) <= 7 &&
    Array.isArray(record.preferredDays) && record.preferredDays.length <= 7 &&
    record.preferredDays.every(isGoalDay) && new Set(record.preferredDays).size === record.preferredDays.length &&
    (record.targetDate === undefined || isIsoDate(record.targetDate)) &&
    (record.status === "active" || record.status === "paused");
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
