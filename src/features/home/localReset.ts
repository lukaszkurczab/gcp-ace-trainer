import {
  clearCertificationExam,
  clearAttempts,
  clearPracticeHistory,
  clearQuestions,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
} from "../../storage";

export const CLEAR_LOCAL_HISTORY_DETAIL =
  "Clears local practice, exams, review queue, progress, overrides, and active sessions.";

export const CLEAR_LOCAL_HISTORY_CONFIRMATION =
  "This deletes local practice, exams, review queue, progress, local question overrides, review marks, and active sessions. Built-in content remains available.";

export const CLEAR_LOCAL_HISTORY_OPERATION_NAMES = [
  "clearCertificationExam",
  "clearQuestions",
  "clearAttempts",
  "clearPracticeHistory",
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

const defaultClearOperations: ClearLocalHistoryOperations = {
  clearCertificationExam,
  clearAttempts,
  clearPracticeHistory,
  clearQuestions,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
};

export async function clearPatternlyLocalHistory(
  operations: ClearLocalHistoryOperations = defaultClearOperations,
): Promise<void> {
  await Promise.all(
    CLEAR_LOCAL_HISTORY_OPERATION_NAMES.map((operationName) =>
      operations[operationName](),
    ),
  );
}
