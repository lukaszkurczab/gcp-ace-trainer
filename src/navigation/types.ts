import { ROUTES } from "../constants/routes";
import type { TrackId } from "../domain";
import type { PracticeSessionRouteParams } from "../features/practice/sessionConfig";
import type { ShellTab } from "../features/home/types";
import type { AlgorithmsDeclaredScopeMode } from "../application/algorithms";

export type RootStackParamList = {
  [ROUTES.HOME]: { initialTab?: Exclude<ShellTab, "practice"> } | undefined;
  [ROUTES.APPEARANCE_SETTINGS]: undefined;
  [ROUTES.LEGAL_INFORMATION]: undefined;
  [ROUTES.LANGUAGE_SETTINGS]: undefined;
  [ROUTES.NOTIFICATION_SETTINGS]: undefined;
  [ROUTES.YOUR_DATA]: undefined;
  [ROUTES.SELECT_TRACK]: undefined;
  [ROUTES.PRACTICE_HUB]: { topicId?: string } | undefined;
  [ROUTES.ALGORITHMS_SCOPE_SELECTION]: { modeId: AlgorithmsDeclaredScopeMode; source: "home" | "practiceHub"; targetMentalUnitId?: string };
  [ROUTES.TOPIC_ROADMAP]: { topicId?: string; trackId?: TrackId } | undefined;
  [ROUTES.EXAM]: { questionIndex?: number } | undefined;
  [ROUTES.EXAM_REVIEW]: undefined;
  [ROUTES.RESULT]: { attemptId?: string; autoSubmitted?: boolean } | undefined;
  [ROUTES.ANSWER_REVIEW]: { attemptId?: string; initialFilter?: "all" | "incorrect" } | undefined;
  [ROUTES.PRACTICE_SETUP]: Partial<PracticeSessionRouteParams> | undefined;
  [ROUTES.PRACTICE_SESSION]: PracticeSessionRouteParams;
  [ROUTES.ALGORITHMS_PRACTICE_SUMMARY]: { sessionId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION]: { profileId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY]: { completionKind: "manual" | "timeout"; sessionId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW]: { sessionId: string };
  [ROUTES.MISTAKES_REVIEW]: undefined;
};
