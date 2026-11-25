import type { GoalRecord } from "../../domain";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";

type PersistedPlanState = Readonly<{ revision: number; plan: Readonly<{ planRevision: number; status: string }> }>;

/**
 * Comparable identity of what the Goal screen last read from storage. When the
 * screen regains focus and this value differs (for example after a plan was
 * accepted on the proposal route), the screen reloads instead of keeping a
 * pre-acceptance draft; an unchanged value keeps the user's draft.
 */
export function goalScreenPersistedState(goal: GoalRecord | null, plan: PersistedPlanState | null): string {
  return canonicalSerialize({
    goal: goal ?? null,
    plan: plan ? { revision: plan.revision, planRevision: plan.plan.planRevision, status: plan.plan.status } : null,
  });
}
