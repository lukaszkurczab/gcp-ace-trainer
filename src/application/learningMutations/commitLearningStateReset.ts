import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";
import { recoverPendingMutation } from "./recoverPendingMutation";
import { captureLearningStateResetTargetPlan } from "../../storage/repositories/learningStateResetRepository";
import { withLocalLearningWriteOperation } from "./localLearningWriteOperation";

export type LearningStateResetBarrier = (reset: () => Promise<void>) => Promise<void>;

export class LearningStateResetPreflightError extends Error {
  constructor() { super("Local learning history cannot be reset because stored data failed integrity checks."); this.name = "LearningStateResetPreflightError"; }
}

let installedResetBarrier: LearningStateResetBarrier | null = null;

/** Read-only startup assertion for the isolated PERSIST-13 fixture entry point. */
export function isPersist13ResetBarrierCold(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE !== undefined && installedResetBarrier === null;
}

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

/** Account reset uses this before persisting its reset guard; it resolves prior work and proves the current namespace is intact. */
export async function preflightLearningStateReset(): Promise<void> {
  try {
    await withLocalLearningWriteOperation(async () => {
      await recoverPendingMutation();
      captureLearningStateResetTargetPlan();
    });
  } catch {
    throw new LearningStateResetPreflightError();
  }
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
    writes: [{ kind: "clear_learning_state", targetPlan: captureLearningStateResetTargetPlan() }],
    createdAt,
  }));
}
