import type { GoalSnapshot, ReviewQueueEntry, TrackId, TrainingAttempt } from "../../domain";
import { getKeyValueStorage, isProfileTransitionActive } from "../../infrastructure/storage/mmkvClient";
import { readGoalSnapshot } from "./goalRepository";
import { getLearningPlanSnapshot, type LearningPlanSnapshot } from "./learningPlanRepository";
import { readActiveMutationJournal } from "./mutationJournalRepository";
import { readReviewQueueItems } from "./reviewQueueRepository";
import { readTrainingAttempts } from "./trainingAttemptRepository";

export type LearningPlanInputSnapshot = Readonly<{
  storageScope: object;
  goal: GoalSnapshot | null;
  plan: LearningPlanSnapshot | null;
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
}>;

/** Opaque published lease: callers may compare it, never read raw storage. */
export function readLearningPlanStorageScope(): object {
  if (isProfileTransitionActive()) throw new Error("Learning plan storage is transitioning.");
  return getKeyValueStorage();
}

/** No await between validated canonical reads; journaled materialization is not an empty history. */
export function readLearningPlanInputSnapshot(trackId: TrackId): LearningPlanInputSnapshot {
  const storageScope = readLearningPlanStorageScope();
  if (readActiveMutationJournal()) throw new Error("Learning plan evidence is being materialized.");
  const goal = readGoalSnapshot(trackId);
  const plan = getLearningPlanSnapshot(trackId);
  const attempts = readTrainingAttempts();
  const reviews = readReviewQueueItems();
  if (attempts.issues?.length || reviews.issues?.length) throw new Error("Learning plan evidence could not be read.");
  if (readLearningPlanStorageScope() !== storageScope) throw new Error("Learning plan storage scope changed.");
  return Object.freeze({ storageScope, goal, plan, attempts: Object.freeze(attempts.value), reviews: Object.freeze(reviews.value) });
}
