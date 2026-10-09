import type { GoalRecord, GoalSnapshot, LearningPlan, LearningPlanSnapshot, TrackId } from "../../domain";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { commitGoalPlanAcceptance } from "../learningMutations/commitGoalPlanAcceptance";

export type GoalPlanLifecycleResult = Readonly<{ goal: GoalSnapshot; plan: LearningPlanSnapshot }>;

/** Pause/resume the canonical goal and accepted plan as one journaled pair. */
export async function transitionGoalPlanStatus(trackId: TrackId, now = new Date().toISOString()): Promise<GoalPlanLifecycleResult> {
  const beforeGoal = readGoalSnapshot(trackId);
  const beforePlan = getLearningPlanSnapshot(trackId);
  if (!beforeGoal || !beforePlan || beforePlan.plan.schemaVersion !== 2 || beforePlan.plan.goalRevision !== beforeGoal.revision) {
    throw new Error("An accepted v2 goal and plan pair is required to change its status.");
  }
  if (beforePlan.plan.status === "completed") throw new Error("A completed learning plan cannot be paused or resumed.");
  const cause = beforeGoal.record.status === "active" && beforePlan.plan.status === "accepted" ? "pause"
    : beforeGoal.record.status === "paused" && beforePlan.plan.status === "paused" ? "resume" : null;
  if (!cause) throw new Error("Goal and plan status are inconsistent.");
  const proposedGoal: GoalRecord = Object.freeze({ ...beforeGoal.record, status: cause === "pause" ? "paused" : "active" });
  const plan: LearningPlan = Object.freeze({ ...beforePlan.plan, status: cause === "pause" ? "paused" : "accepted", updatedAt: now,
    commandId: `goal-plan:${cause}:${trackId}:${beforeGoal.revision}:${beforePlan.revision}:${now}` });
  const proposalId = plan.commandId;
  const unchanged = () => {
    const goal = readGoalSnapshot(trackId);
    const currentPlan = getLearningPlanSnapshot(trackId);
    if (!goal || !currentPlan || goal.revision !== beforeGoal.revision || currentPlan.revision !== beforePlan.revision ||
      JSON.stringify(goal.record) !== JSON.stringify(beforeGoal.record) || JSON.stringify(currentPlan.plan) !== JSON.stringify(beforePlan.plan)) {
      throw new Error("Goal or plan changed during the lifecycle transition.");
    }
  };
  return commitGoalPlanAcceptance({
    cause,
    proposalId,
    trackId,
    proposedGoal,
    plan,
    expectedGoalRevision: beforeGoal.revision,
    expectedPlanStorageRevision: beforePlan.revision,
    identity: { cause, trackId, goal: beforeGoal, plan: beforePlan },
    createdAt: now,
    revalidate: unchanged,
  });
}
