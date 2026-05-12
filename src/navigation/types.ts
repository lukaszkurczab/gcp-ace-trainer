import { ROUTES } from "../constants/routes";
import type { ExamDomain } from "../types";

export type RootStackParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.EXAM]: { questionIndex?: number } | undefined;
  [ROUTES.EXAM_REVIEW]: undefined;
  [ROUTES.RESULT]: { attemptId?: string; autoSubmitted?: boolean } | undefined;
  [ROUTES.ANSWER_REVIEW]: { attemptId?: string; initialFilter?: "all" | "incorrect" } | undefined;
  [ROUTES.PRACTICE_SETUP]: undefined;
  [ROUTES.PRACTICE_SESSION]: { domain: ExamDomain; questionCount: 10 | 20 | "all" };
  [ROUTES.MISTAKES_REVIEW]: undefined;
  [ROUTES.ATTEMPT_HISTORY]: undefined;
  [ROUTES.ANALYTICS]: undefined;
  [ROUTES.SETTINGS]: undefined;
};
