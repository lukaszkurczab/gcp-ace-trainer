import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";

/** Clears only canonical learning records; bundled content and settings are not journal targets. */
export async function commitLearningStateReset(createdAt: string): Promise<void> {
  await commitMutation(await buildMutationJournal({
    operation: "reset_learning_state",
    sessionId: "learning-state-reset",
    trackId: "algorithms",
    identity: ["learning-state-reset", createdAt],
    writes: [{ kind: "clear_learning_state" }],
    createdAt,
  }));
}
