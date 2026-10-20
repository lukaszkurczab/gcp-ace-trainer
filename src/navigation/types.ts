import { ROUTES } from "../constants/routes";
import type { TrackId } from "../domain";
import type { PracticeSessionRouteParams } from "../features/practice/sessionConfig";
import type { ShellTab } from "../features/home/types";
import type { AlgorithmsDeclaredScopeMode } from "../application/coding-interview";

export type GoalCadenceReturnTo = "home" | "progress" | "settings";

export type NotificationSettingsRouteParams = { source: "settings" };

export type PracticeSetupRouteDraft = Partial<Pick<PracticeSessionRouteParams,
  "feedbackMode" | "mentalUnitId" | "mode" | "reviewBehaviorEnabled" | "reviewItemRefs" | "reviewSource" | "sessionLength" | "source" | "trackId" | "topicId"
>> & Readonly<{
  expectedArtifactSha256?: string;
  expectedContentVersion?: string;
  premiumOfferId?: string;
}>;

export type RootStackParamList = {
  [ROUTES.HOME]: { initialTab?: Exclude<ShellTab, "practice"> } | undefined;
  [ROUTES.ACTIVITY]: undefined;
  [ROUTES.APPEARANCE_SETTINGS]: undefined;
  [ROUTES.LANGUAGE_SETTINGS]: undefined;
  [ROUTES.LEGAL_INFORMATION]: undefined;
  [ROUTES.TERMS_OF_SERVICE]: { returnDestinationLabel?: string } | undefined;
  [ROUTES.PRIVACY_POLICY]: { returnDestinationLabel?: string } | undefined;
  [ROUTES.PREMIUM_PURCHASE]: undefined;
  [ROUTES.NOTIFICATION_SETTINGS]: NotificationSettingsRouteParams | undefined;
  [ROUTES.YOUR_DATA]: undefined;
  [ROUTES.PRIVACY_REQUESTS]: undefined;
  [ROUTES.LEGAL_REQUESTS]: { kind: "complaint" | "withdrawal" | "data_recovery" | "suspension_appeal" };
  [ROUTES.ACCOUNT_SECURITY]: { screen: "recovery" | "email" | "password" | "delete" | "export" | "privacy" };
  [ROUTES.ACCOUNT_EMAIL_CHANGE_PENDING]: { uid: string; requestedEmail: string };
  [ROUTES.ACCOUNT_ENTRY]: { initialMode?: "entry" | "register" | "signIn" | "recovery" | "resetPassword" } | undefined;
  [ROUTES.BACKEND_DIAGNOSTICS]: undefined;
  [ROUTES.SELECT_TRACK]: undefined;
  [ROUTES.GOAL_CADENCE]: { trackId?: TrackId; returnTo?: GoalCadenceReturnTo } | undefined;
  [ROUTES.LEARNING_PLAN_PROPOSAL]: { proposalId: string; trackId: TrackId };
  [ROUTES.LEARNING_PLAN_EDITOR]: { editorId: string; trackId: TrackId };
  [ROUTES.PRACTICE_HUB]: { topicId?: string; trackId?: TrackId } | undefined;
  [ROUTES.ALGORITHMS_SCOPE_SELECTION]: { modeId: AlgorithmsDeclaredScopeMode; source: "home"; targetMentalUnitId?: string };
  [ROUTES.TOPIC_ROADMAP]: { topicId?: string; trackId?: TrackId; returnToSetup?: boolean; setupDraft?: PracticeSetupRouteDraft } | undefined;
  [ROUTES.EXAM]: { trackId: TrackId; expectedSessionId?: string };
  [ROUTES.EXAM_REVIEW]: { sessionId: string };
  [ROUTES.RESULT]: { sessionId: string };
  [ROUTES.PRACTICE_SETUP]: PracticeSetupRouteDraft | undefined;
  [ROUTES.PRACTICE_SESSION]: PracticeSessionRouteParams;
  [ROUTES.ALGORITHMS_PRACTICE_REVIEW]: { sessionId: string; occurrenceId: string };
  [ROUTES.ALGORITHMS_PRACTICE_SUMMARY]: { sessionId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION]: { profileId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY]: { sessionId: string };
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW]: { sessionId: string };
  [ROUTES.DESIGN_INTERVIEW_SIMULATION]: { trackId: TrackId; profileId: string; expectedSessionId?: string };
  [ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT]: { sessionId: string };
  [ROUTES.DESIGN_INTERVIEW_SIMULATION_REVIEW]: { sessionId: string };
  [ROUTES.MISTAKES_REVIEW]: undefined;
};
