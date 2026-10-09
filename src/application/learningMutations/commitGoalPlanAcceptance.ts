import type { GoalRecord, GoalSnapshot, LearningPlan, LearningPlanSnapshot, TrackId } from "../../domain";
import { acceptedTargetFromGoal, normalizeLearningPlan } from "../../domain";
import { normalizeGoalRecord, isGoalRecordForTrack } from "../../domain/goals/goalContracts";
import { getActiveStorageProfile } from "../../storage/repositories/profileStorageRepository";
import { goalPlanAcceptanceGoalRevision, readGoalPlanAcceptancePrecondition } from "../../storage/repositories/goalPlanAcceptanceRepository";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutationAfterPreflight } from "./commitMutation";
import type { GoalPlanAcceptanceInterruptionHook } from "../../storage/repositories/goalPlanAcceptanceRepository";

export type GoalPlanAcceptanceInput = Readonly<{
  cause?: "proposal_acceptance" | "pause" | "resume";
  proposalId: string;
  trackId: TrackId;
  proposedGoal: GoalRecord;
  plan: LearningPlan;
  expectedGoalRevision: number | null;
  expectedPlanStorageRevision: number | null;
  identity: unknown;
  createdAt: string;
  revalidate(): void;
  beforePlanWrite?: GoalPlanAcceptanceInterruptionHook;
}>;

/** Persists one immutable, recoverable acceptance intent for the goal/plan pair. */
export async function commitGoalPlanAcceptance(input: GoalPlanAcceptanceInput): Promise<Readonly<{ goal: GoalSnapshot; plan: LearningPlanSnapshot }>> {
  const cause = input.cause ?? "proposal_acceptance";
  const proposedGoal = normalizeGoalRecord(input.proposedGoal);
  if (!isGoalRecordForTrack(proposedGoal, input.trackId)) throw new Error("Accepted goal must include at least one study day.");
  const proposedPlan = normalizeLearningPlan(input.plan);
  if (proposedPlan.trackId !== input.trackId || proposedPlan.schemaVersion !== 2) throw new Error("Accepted plans require v2 per-track availability.");
  if (proposedGoal.status !== (cause === "pause" ? "paused" : "active")) throw new Error("Goal-plan pair status does not match its transition cause.");
  if (JSON.stringify(proposedPlan.acceptedTarget) !== JSON.stringify(acceptedTargetFromGoal(proposedGoal))) throw new Error("Accepted plan target must match the proposed goal.");
  await commitMutationAfterPreflight(async () => {
    const profile = getActiveStorageProfile();
    const { goal: beforeGoal, plan: beforePlan } = readGoalPlanAcceptancePrecondition(input.trackId);
    const actualGoalRevision = beforeGoal?.revision ?? null;
    const actualPlanRevision = beforePlan?.revision ?? null;
    if (actualGoalRevision !== input.expectedGoalRevision || actualPlanRevision !== input.expectedPlanStorageRevision) throw new Error("Goal-plan proposal revisions are stale.");
    const goal = proposedGoal;
    const nextGoalRevision = goalPlanAcceptanceGoalRevision(actualGoalRevision, beforeGoal, goal);
    const plan = normalizeLearningPlan({
      ...proposedPlan,
      goalRevision: nextGoalRevision,
      planRevision: (actualPlanRevision ?? 0) + 1,
      status: cause === "pause" ? "paused" : "accepted",
    });
    return buildMutationJournal({
      operation: "accept_goal_plan",
      proposalId: input.proposalId,
      trackId: input.trackId,
      identity: [input.identity, profile.id, input.expectedGoalRevision, input.expectedPlanStorageRevision, goal, plan],
      createdAt: input.createdAt,
      writes: [{ kind: "accept_goal_plan", record: {
        cause,
        proposalId: input.proposalId,
        profileId: profile.id,
        trackId: input.trackId,
        expectedGoalRevision: actualGoalRevision,
        expectedPlanStorageRevision: actualPlanRevision,
        beforeGoal,
        beforePlan,
        goal,
        plan,
      } }],
    });
  }, input.revalidate, input.beforePlanWrite);
  const goal = readGoalSnapshot(input.trackId);
  const plan = getLearningPlanSnapshot(input.trackId);
  if (!goal || !plan || plan.plan.goalRevision !== goal.revision) throw new Error("Committed goal-plan pair could not be verified.");
  return Object.freeze({ goal, plan });
}
