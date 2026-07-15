import {
  clearCertificationExam,
  clearMutationJournal,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
  clearTrainingSessionDrafts,
} from "../../storage";

export const CLEAR_LOCAL_HISTORY_DETAIL =
  "Clears local practice, exams, review queue, progress, active sessions, and saved draft responses.";

export const CLEAR_LOCAL_HISTORY_CONFIRMATION =
  "This deletes local practice, exams, review queue, progress, review marks, active sessions, and saved draft responses.";

export const CLEAR_LOCAL_HISTORY_OPERATION_NAMES = [
  "clearMutationJournal",
  "clearCertificationExam",
  "clearTrainingSessionDrafts",
  "clearTrainingSessions",
  "clearTrainingAttempts",
  "clearReviewQueueItems",
] as const;

export type ClearLocalHistoryOperationName =
  (typeof CLEAR_LOCAL_HISTORY_OPERATION_NAMES)[number];

export type ClearLocalHistoryOperations = Record<
  ClearLocalHistoryOperationName,
  () => Promise<unknown>
>;

export type ClearLocalHistoryResult =
  | { ok: true }
  | { ok: false; message: string };

export const CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE =
  "Your local data could not be fully cleared. Some data may remain. Try again.";

const defaultClearOperations: ClearLocalHistoryOperations = {
  clearCertificationExam,
  clearMutationJournal,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
  clearTrainingSessionDrafts,
};

export async function clearPatternlyLocalHistory(
  operations: ClearLocalHistoryOperations = defaultClearOperations,
): Promise<void> {
  for (const operationName of CLEAR_LOCAL_HISTORY_OPERATION_NAMES) {
    await operations[operationName]();
  }
}

export async function tryClearPatternlyLocalHistory(
  operations: ClearLocalHistoryOperations = defaultClearOperations,
): Promise<ClearLocalHistoryResult> {
  try {
    await clearPatternlyLocalHistory(operations);
    return { ok: true };
  } catch {
    return { ok: false, message: CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE };
  }
}
