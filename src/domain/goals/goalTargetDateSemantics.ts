import type { GoalRecord, GoalTemplateId } from "./goalContracts";

export type GoalTargetDateMeaning = "event" | "deadline" | "checkpoint" | "none";
export type GoalTargetDateProjection = Readonly<{
  meaning: GoalTargetDateMeaning;
  targetDate?: string;
  sessionBoundary: "strictly_before" | "inclusive" | "not_applicable";
  completionBehavior: "attainability" | "no_automatic_completion" | "not_applicable";
  availability: "present" | "missing" | "ignored_legacy" | "not_applicable";
}>;

const MEANINGS: Readonly<Record<GoalTemplateId, GoalTargetDateMeaning>> = Object.freeze({
  prepare_for_an_interview: "event",
  prepare_for_a_certification: "event",
  build_foundations: "deadline",
  refresh_and_maintain_skills: "checkpoint",
  learn_at_own_pace: "none",
});

/** Projects a stored goal without silently changing legacy self-paced data. */
export function projectGoalTargetDate(goal: GoalRecord): GoalTargetDateProjection {
  const meaning = MEANINGS[goal.goalType];
  if (meaning === "none") return Object.freeze({ meaning, sessionBoundary: "not_applicable", completionBehavior: "not_applicable", availability: goal.targetDate === undefined ? "not_applicable" : "ignored_legacy" });
  if (goal.targetDate === undefined) return Object.freeze({ meaning, sessionBoundary: meaning === "event" ? "strictly_before" : "inclusive", completionBehavior: meaning === "checkpoint" ? "no_automatic_completion" : "attainability", availability: "missing" });
  return Object.freeze({ meaning, targetDate: goal.targetDate, sessionBoundary: meaning === "event" ? "strictly_before" : "inclusive", completionBehavior: meaning === "checkpoint" ? "no_automatic_completion" : "attainability", availability: "present" });
}

/** Normalizes an explicit user save.  Only this path removes a legacy own-pace date. */
export function normalizeGoalForExplicitSave(goal: GoalRecord): GoalRecord {
  if (goal.goalType !== "learn_at_own_pace") return goal;
  const { targetDate: _legacyTargetDate, ...withoutTargetDate } = goal;
  return Object.freeze(withoutTargetDate);
}
