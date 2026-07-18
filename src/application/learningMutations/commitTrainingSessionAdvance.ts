import type { TrainingSession } from "../../domain";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";

/** Persists exactly one already-validated active-session position transition. */
export async function commitTrainingSessionAdvance(session: TrainingSession, createdAt: string): Promise<void> {
  if (session.status !== "active") throw new Error("Training session advance requires an active session.");
  await commitMutation(await buildMutationJournal({
    operation: "advance_training_session",
    sessionId: session.id,
    trackId: session.trackId,
    identity: [session.id, session.currentItemIndex, session.activeForegroundMs],
    writes: [{ kind: "put_session", record: session }],
    createdAt,
  }));
}
