import {
  clearActiveExamSession,
  clearAttempts,
  clearPracticeHistory,
  clearQuestionReviewState,
  clearQuestions,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
  clearUserProgress,
} from "../../storage";

export const CLEAR_LOCAL_HISTORY_DETAIL =
  "Clears local practice, exams, review queue, progress, overrides, and active sessions.";

export const CLEAR_LOCAL_HISTORY_CONFIRMATION =
  "This deletes local practice, exams, review queue, progress, local question overrides, review marks, and active sessions. Built-in content remains available.";

export const CLEAR_LOCAL_HISTORY_OPERATION_NAMES = [
  "clearActiveExamSession",
  "clearQuestions",
  "clearAttempts",
  "clearPracticeHistory",
  "clearQuestionReviewState",
  "clearTrainingSessions",
  "clearTrainingAttempts",
  "clearReviewQueueItems",
  "clearUserProgress",
] as const;

export type ClearLocalHistoryOperationName =
  (typeof CLEAR_LOCAL_HISTORY_OPERATION_NAMES)[number];

export type ClearLocalHistoryOperations = Record<
  ClearLocalHistoryOperationName,
  () => Promise<unknown>
>;

const defaultClearOperations: ClearLocalHistoryOperations = {
  clearActiveExamSession,
  clearAttempts,
  clearPracticeHistory,
  clearQuestionReviewState,
  clearQuestions,
  clearReviewQueueItems,
  clearTrainingAttempts,
  clearTrainingSessions,
  clearUserProgress,
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
