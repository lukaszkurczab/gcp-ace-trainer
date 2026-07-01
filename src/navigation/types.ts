import { ROUTES } from "../constants/routes";
import type { PracticeSessionRouteParams } from "../features/practice/sessionConfig";
import type { ShellTab } from "../features/home/types";

export type RootStackParamList = {
  [ROUTES.HOME]: { initialTab?: Exclude<ShellTab, "practice"> } | undefined;
  [ROUTES.SELECT_TRACK]: undefined;
  [ROUTES.PRACTICE_HUB]: { topicId?: string } | undefined;
  [ROUTES.TOPIC_ROADMAP]: { topicId?: string } | undefined;
  [ROUTES.EXAM]: { questionIndex?: number } | undefined;
  [ROUTES.EXAM_REVIEW]: undefined;
  [ROUTES.RESULT]: { attemptId?: string; autoSubmitted?: boolean } | undefined;
  [ROUTES.ANSWER_REVIEW]: { attemptId?: string; initialFilter?: "all" | "incorrect" } | undefined;
  [ROUTES.PRACTICE_SETUP]: Partial<PracticeSessionRouteParams> | undefined;
  [ROUTES.PRACTICE_SESSION]: PracticeSessionRouteParams;
  [ROUTES.MISTAKES_REVIEW]: undefined;
};
