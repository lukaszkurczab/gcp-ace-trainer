import type { TrackId } from "../learning/trackIdentity";
import { GoalPolicyUnavailableError, type GoalPolicy, type GoalPolicyResolver } from "../goals/goalPolicy";

/** Canonical product policy declaration consumed by track descriptors and application owners. */
export const TRACK_GOAL_POLICIES: readonly GoalPolicy[] = Object.freeze([
  policy("coding-interview-dsa-problem-solving", ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("backend-system-design-interview", ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("object-oriented-design-interview", ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("frontend-system-design-interview", ["prepare_for_an_interview", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("google-cloud-associate-cloud-engineer", ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("aws-certified-solutions-architect-associate", ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("microsoft-azure-administrator-associate-az-104", ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("microsoft-azure-ai-fundamentals-ai-901", ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
  policy("claude-certified-architect-professional-certification", ["prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]),
]);

const byTrack = new Map(TRACK_GOAL_POLICIES.map((entry) => [entry.trackId, entry]));

export const getGoalPolicy: GoalPolicyResolver = (trackId) => byTrack.get(trackId) ?? null;

export function requireGoalPolicy(trackId: string): GoalPolicy {
  const resolved = getGoalPolicy(trackId);
  if (!resolved) throw new GoalPolicyUnavailableError(trackId);
  return resolved;
}

function policy(trackId: TrackId, validGoalTemplateIds: GoalPolicy["validGoalTemplateIds"]): GoalPolicy {
  return Object.freeze({ trackId, validGoalTemplateIds: Object.freeze([...validGoalTemplateIds]) });
}
