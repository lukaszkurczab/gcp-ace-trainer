import { commitLearningStateReset } from "../../application/learningMutations";

export const CLEAR_LOCAL_HISTORY_DETAIL =
  "Clears local practice, exams, review queue, progress, active sessions, and saved draft responses.";

export const CLEAR_LOCAL_HISTORY_CONFIRMATION =
  "This deletes local practice, exams, review queue, progress, review marks, active sessions, and saved draft responses.";

export type ClearLocalHistoryResult =
  | { ok: true }
  | { ok: false; message: string };

export const CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE =
  "Your local data could not be fully cleared. Some data may remain. Try again.";

export async function clearPatternlyLocalHistory(): Promise<void> {
  await commitLearningStateReset(new Date().toISOString());
}

export async function tryClearPatternlyLocalHistory(): Promise<ClearLocalHistoryResult> {
  try {
    await clearPatternlyLocalHistory();
    return { ok: true };
  } catch {
    return { ok: false, message: CLEAR_LOCAL_HISTORY_FAILURE_MESSAGE };
  }
}
