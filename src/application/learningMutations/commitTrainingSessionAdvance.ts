import type { TrainingSession } from "../../domain";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation, commitMutationAfterPreflight, retainMutationRetryPreflight } from "./commitMutation";
import type { LocalTrainingMutationGuard } from "./commitTrainingOutcome";

/** Persists exactly one already-validated active-session position transition. */
export async function commitTrainingSessionAdvance(session: TrainingSession, createdAt: string, guard?: LocalTrainingMutationGuard): Promise<void> {
  if (session.status !== "active") throw new Error("Training session advance requires an active session.");
  const build = () => buildMutationJournal({
    operation: "advance_training_session",
    sessionId: session.id,
    trackId: session.trackId,
    identity: [session.id, session.currentItemIndex, session.activeForegroundMs, ...(session.caseState ? [session.caseState] : session.caseStates ? [session.caseStates] : [])],
    writes: [{ kind: "put_session", record: session }],
    createdAt,
  });
  if (!guard) { await commitMutation(await build()); return; }
  try {
    await commitMutationAfterPreflight(async () => {
      await guard.preflight();
      return build();
    }, guard.preflight, undefined, guard.expectedLease);
  } catch (error) { throw retainMutationRetryPreflight(error, guard.preflight); }
}
