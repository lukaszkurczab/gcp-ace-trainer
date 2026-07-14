import type { ReviewQueueEntry } from "./reviewQueueEntry";
import type { TrainingAttempt } from "./trainingAttempt";
import type { TrainingSession } from "./trainingSession";

export interface TrainingSessionRepository {
  getAll(): Promise<readonly TrainingSession[]>;
  save(session: TrainingSession): Promise<void>;
}

export interface TrainingAttemptRepository {
  getAll(): Promise<readonly TrainingAttempt<unknown>[]>;
  save(attempt: TrainingAttempt<unknown>): Promise<void>;
}

export interface ReviewQueueRepository {
  getAll(): Promise<readonly ReviewQueueEntry[]>;
  save(entry: ReviewQueueEntry): Promise<void>;
}
