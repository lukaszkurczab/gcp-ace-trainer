import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";
import { recoverPendingMutation } from "./recoverPendingMutation";

export type LearningStateResetBarrier = (reset: () => Promise<void>) => Promise<void>;

let installedResetBarrier: LearningStateResetBarrier | null = null;

/** Installed by the canonical lifecycle composition before reset UI is available. */
export function installLearningStateResetBarrier(barrier: LearningStateResetBarrier): void {
  installedResetBarrier = barrier;
}

/** Runs exceptional reset work behind the same canonical runtime barrier. */
export async function runLearningStateResetBarrier(reset: () => Promise<void>): Promise<void> {
  if (!installedResetBarrier) throw new Error("The learning-state reset barrier is unavailable until application bootstrap has completed.");
  await installedResetBarrier(reset);
}

/** Clears only canonical learning records; bundled content and settings are not journal targets. */
export async function commitLearningStateReset(createdAt: string): Promise<void> {
  await runLearningStateResetBarrier(() => commitLearningStateResetDurably(createdAt));
}

async function commitLearningStateResetDurably(createdAt: string): Promise<void> {
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
