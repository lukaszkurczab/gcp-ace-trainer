import type { ReviewQueueEntry } from "./reviewQueueEntry";
import type { TrainingAttempt } from "./trainingAttempt";
import type { TrainingSession } from "./trainingSession";
import type { TrainingSessionResult } from "./sessionResult";
import type { JournalOperationContract } from "./journalContracts";

export interface TrainingSessionRepository {
  getAll(): Promise<readonly TrainingSession[]>;
  getActive(): Promise<TrainingSession | null>;
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

export interface TrainingSessionResultRepository {
  getBySessionId(sessionId: string): Promise<TrainingSessionResult | null>;
  save(result: TrainingSessionResult): Promise<void>;
}

export interface MutationJournalRepository {
  getActive(): Promise<JournalOperationContract | null>;
  save(contract: JournalOperationContract): Promise<void>;
  clear(expectedCommandFingerprint: string): Promise<void>;
}
