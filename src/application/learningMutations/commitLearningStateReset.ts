import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";
import { recoverPendingMutation } from "./recoverPendingMutation";

/** Clears only canonical learning records; bundled content and settings are not journal targets. */
export async function commitLearningStateReset(createdAt: string): Promise<void> {
  // Reset never overwrites an unresolved learner mutation. Recovery either
  // completes it deterministically or leaves the reset explicitly blocked.
  await recoverPendingMutation();
  await commitMutation(await buildMutationJournal({
    operation: "reset_learning_state",
    sessionId: "learning-state-reset",
    trackId: "coding-interview-dsa-problem-solving",
    identity: ["learning-state-reset", createdAt],
    writes: [{ kind: "clear_learning_state" }],
    createdAt,
  }));
}
