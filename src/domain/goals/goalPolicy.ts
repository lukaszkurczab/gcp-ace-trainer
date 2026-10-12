import type { TrackId } from "../learning/trackIdentity";

/** Product-neutral goal template vocabulary. */
export const GOAL_TEMPLATE_IDS = Object.freeze([
  "prepare_for_an_interview",
  "prepare_for_a_certification",
  "build_foundations",
  "refresh_and_maintain_skills",
  "learn_at_own_pace",
] as const);

export type GoalTemplateId = (typeof GOAL_TEMPLATE_IDS)[number];

export type GoalPolicy = Readonly<{
  trackId: TrackId;
  validGoalTemplateIds: readonly GoalTemplateId[];
}>;
export type GoalPolicyResolver = (trackId: string) => GoalPolicy | null;

export class GoalPolicyUnavailableError extends Error {
  constructor(readonly trackId: string) {
    super("No goal policy was provided for this track.");
    this.name = "GoalPolicyUnavailableError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Pure shape/identity check; product admission belongs to the injected resolver. */
export function isGoalPolicyForTrack(value: GoalPolicy, trackId: string): boolean;
export function isGoalPolicyForTrack(value: unknown, trackId: string): value is GoalPolicy {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).length !== 2 || !Object.hasOwn(candidate, "trackId") || !Object.hasOwn(candidate, "validGoalTemplateIds") ||
    candidate.trackId !== trackId || typeof candidate.trackId !== "string" || !Array.isArray(candidate.validGoalTemplateIds) ||
    candidate.validGoalTemplateIds.length === 0 || !candidate.validGoalTemplateIds.every((entry) => GOAL_TEMPLATE_IDS.includes(entry as GoalTemplateId))) return false;
  return new Set(candidate.validGoalTemplateIds).size === candidate.validGoalTemplateIds.length;
}

/** Resolve policy only from an explicitly supplied application-owned resolver. */
export function resolveGoalPolicy(resolver: GoalPolicyResolver, trackId: string): GoalPolicy {
  const resolved = resolver(trackId);
  if (resolved === null || !isGoalPolicyForTrack(resolved, trackId)) throw new GoalPolicyUnavailableError(trackId);
  return resolved;
}
