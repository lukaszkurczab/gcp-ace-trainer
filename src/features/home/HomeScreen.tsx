import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  AppShellHeader,
  EmptyState,
  InfoBlock,
  Screen,
} from "../../components";
import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { ROUTES } from "../../constants/routes";
import {
  CODING_INTERVIEW_TRACK_ID,
  getTrackDisplay,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadActiveTrainingSession,
  loadCodingInterviewDashboard,
  loadCloudCertificationProgress as loadCloudCertificationProgressViewModel,
  loadGoal,
  loadGoalOnboardingDismissed,
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadReviewQueueItems as getReviewQueueItems,
  loadTrainingAttempts as getTrainingAttempts,
  type StorageIssue,
  persistGoalOnboardingDismissal,
} from "../../application/learningReadModels";
import {
  homePlanSnapshotReader,
  type HomePlanSnapshot,
} from "../../application/homePlanSnapshotReader";
import {
  learningPlanEditorCoordinator,
  learningPlanProposalCoordinator,
  type GuidanceAction,
} from "../../application/learningPlan";
import { loadActivitySessionRecords, type ActivitySessionRecord } from "../../application/activityReadModels";
import { type CloudCertificationProgressViewModel } from "../../tracks/certification";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/certification";
import { type GoalRecord, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../../domain";
import type { CodingInterviewDashboard } from "../../application/coding-interview";
import { resumeActiveTrainingSession } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "./SelectTrackScreen";
import {
  buildPracticeSessionConfig,
  buildCertificationPracticeResumeRoute,
  buildDesignInterviewPracticeResumeRoute,
} from "../practice/sessionConfig";
import { HomeLoadingSkeleton, HomeTab } from "./tabs/HomeTab";
import type { HomeRecommendationAction } from "./tabs/homeTabModel";
import { ProgressLoadingSkeleton, ProgressTab } from "./tabs/ProgressTab";
import type { ProgressAction } from "./tabs/progressTabModel";
import { SettingsLoadingSkeleton, SettingsTab } from "./tabs/SettingsTab";
import { getSettingsAccountPresentation } from "./tabs/settingsAccountPresentation";
import type { ShellTab } from "./types";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { feedbackTimingFromDurableSession } from "./resumeFeedbackTiming";
import { navigateToActivityResult } from "./activityNavigation";
import { buildHomePlanPracticeSetupParams } from "./homePlanUiContract";


type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellData = {
  activityRecords: readonly ActivitySessionRecord[];
  algorithmsDashboard: CodingInterviewDashboard | null;
  algorithmsDashboardError: string | null;
  activeSession: TrainingSession | null;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  goal: GoalRecord | null;
  goalOnboardingDismissed: boolean;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  reviewQueueItems: ReviewQueueEntry[];
  storageIssues: readonly StorageIssue[];
  trainingAttempts: TrainingAttempt[];
  homePlan: HomePlanSnapshot | null;
};

type HomeShellTab = Exclude<ShellTab, "practice">;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { t: tLearningPlan } = useTranslation("learningPlan");
  const { t: tAccount } = useTranslation("account");
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const settingsAccount = getSettingsAccountPresentation(account.state);
  const accountResumeRequired = account.state.kind === "authenticated" && account.state.accountData.status === "resumeRequired";
  const [activeTab, setActiveTab] = useState<HomeShellTab>(route.params?.initialTab ?? "home");
  const initialRouteTabRef = useRef<HomeShellTab | null>(route.params?.initialTab ?? null);
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [hasLoadedActiveTrack, setHasLoadedActiveTrack] = useState(false);
  const [shellReload, setShellReload] = useState(0);
  const [shellReadError, setShellReadError] = useState<string | null>(null);
  const [data, setData] = useState<ShellData>({
    activityRecords: [],
    algorithmsDashboard: null,
    algorithmsDashboardError: null,
    activeSession: null,
    attempts: [],
    cloudProgress: null,
    goal: null,
    goalOnboardingDismissed: true,
    practiceHistory: [],
    reviewQueueItems: [],
    storageIssues: [],
    trainingAttempts: [],
    homePlan: null,
  });

  useEffect(() => {
    initialRouteTabRef.current = route.params?.initialTab ?? null;
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab !== "home" || (initialRouteTabRef.current !== null && initialRouteTabRef.current !== "home")) return undefined;
      const accountState = accountRef.current.state;
      if (accountState.kind !== "authenticated" || accountState.accountData.status === "resumeRequired") return undefined;
      void accountRef.current.retryPendingAccountSync();
      return undefined;
    }, [activeTab]),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setHasLoadedActiveTrack(false);
      setShellReadError(null);

      async function loadShellData() {
        try {
          const accountState = accountRef.current.state;
          const shouldRetryAccountSync = accountState.kind === "authenticated" && accountState.accountData.status === "resumeRequired";
          if (shouldRetryAccountSync) {
            const activeSessionForSync = await loadActiveTrainingSession();
            if (!activeSessionForSync) {
              await accountRef.current.retryAccountSync();
            }
          }
          const savedTrackId = await getActiveTrackId();
          const trainingAttemptsRead = getTrainingAttempts();
          const [
            savedAttempts,
            savedPracticeHistory,
            activeSession,
            cloudProgress,
            reviewQueueItemsResult,
            trainingAttemptsResult,
            activityRecords,
            homePlan,
          ] = await Promise.all([
            getAttempts(),
            getPracticeHistory(),
            loadActiveTrainingSession(),
            loadCloudCertificationProgressViewModel(),
            getReviewQueueItems(),
            trainingAttemptsRead,
            loadActivitySessionRecords({ getAttempts: () => trainingAttemptsRead }),
            savedTrackId ? homePlanSnapshotReader.read({ trackId: savedTrackId, now: new Date() }) : Promise.resolve(null),
          ]);
          const goal = savedTrackId ? await loadGoal(savedTrackId) : null;
          let goalOnboardingDismissed = true;
          if (savedTrackId) {
            try { goalOnboardingDismissed = loadGoalOnboardingDismissed(savedTrackId); }
            catch { goalOnboardingDismissed = true; }
          }
          let algorithmsDashboard: CodingInterviewDashboard | null = null;
          let algorithmsDashboardError: string | null = null;
          if (savedTrackId === CODING_INTERVIEW_TRACK_ID) {
            try { algorithmsDashboard = await loadCodingInterviewDashboard(); }
            catch (error) { algorithmsDashboardError = describeOperationalFailure(error, "Coding Interview recommendation is unavailable."); }
          }

          if (isActive) {
            setActiveTrackId(savedTrackId ?? null);
            setData({
              activityRecords,
              algorithmsDashboard,
              algorithmsDashboardError,
              activeSession,
              attempts: savedAttempts,
              cloudProgress,
              goal,
              goalOnboardingDismissed,
              practiceHistory: savedPracticeHistory,
              reviewQueueItems: reviewQueueItemsResult.value,
              storageIssues: [],
              trainingAttempts: trainingAttemptsResult.value,
              homePlan,
            });
            setHasLoadedActiveTrack(true);
          }
        } catch (error) {
          if (isActive) {
            setShellReadError("We couldn't load your Patternly data. Check your connection and try again.");
            setHasLoadedActiveTrack(true);
          }
        }
      }

      void loadShellData();

      return () => {
        isActive = false;
      };
    }, [shellReload]),
  );

  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );
  if (!hasLoadedActiveTrack) return (
    <View style={styles.shell}>
      <Screen
        edges={["top"]}
        key={`pending-${activeTab}`}
        style={[activeTab === "home" ? styles.homeScreenContent : null, activeTab === "progress" ? styles.progressScreenContent : null]}
      >
        {activeTab === "home" ? <HomeLoadingSkeleton /> : null}
        {activeTab === "progress" ? <ProgressLoadingSkeleton /> : null}
        {activeTab === "settings" ? <SettingsLoadingSkeleton /> : null}
      </Screen>
      <AppBottomNavigation activeId={activeTab} navigation={navigation} onHomeTabChange={handleHomeTabChange} />
    </View>
  );
  if (shellReadError) return <Screen edges={["top"]} scroll={false}><AppShellHeader /><EmptyState actionLabel={t("Try again")} description={t(shellReadError)} onActionPress={() => setShellReload((reload) => reload + 1)} title={t("Patternly is unavailable")} /></Screen>;
  if (!activeTrackId) {
    return (
      <SelectTrackScreen
        navigation={navigation}
        onboarding
        onTrackSelected={(trackId) => {
          setActiveTrackId(trackId);
          setShellReload((reload) => reload + 1);
        }}
      />
    );
  }
  const activeTrack = getTrackDisplay(activeTrackId);
  const selectedTrackId: TrackId = activeTrackId;

  function handleProgressAction(action: ProgressAction) {
    if (action.kind === "practiceSession") {
      navigation.navigate(ROUTES.PRACTICE_SESSION, action.params);
      return;
    }

    navigation.navigate(ROUTES.MISTAKES_REVIEW);
  }

  function handleHomeTabChange(tab: HomeShellTab) {
    initialRouteTabRef.current = null;
    setActiveTab(tab);
    navigation.setParams({ initialTab: tab });
  }

  async function handleRecommendationAction(action: HomeRecommendationAction) {
    if (action.kind === "unavailable") return;
    try {
      if (action.kind === "resume_certification_practice") {
        const session = await resumeActiveTrainingSession();
        if (!action.trackId && (session.id !== action.sessionId || session.trackId !== "google-cloud-associate-cloud-engineer" || session.modeId !== action.modeId)) {
          throw new Error("The active Certification Practice session changed before it could be resumed.");
        }
        if (action.trackId && (session.id !== action.sessionId || session.trackId !== action.trackId || session.modeId !== action.modeId)) {
          throw new Error("The active Certification Practice session changed before it could be resumed.");
        }
        navigation.navigate(ROUTES.PRACTICE_SESSION, buildCertificationPracticeResumeRoute(session));
        return;
      }
      if (action.kind === "resume_design_interview") {
        const session = await resumeActiveTrainingSession();
        if (session.id !== action.sessionId || session.trackId !== activeTrackId || session.modeId !== action.modeId) {
          throw new Error("The active Design Interview session changed before it could be resumed.");
        }
        navigation.navigate(ROUTES.PRACTICE_SESSION, buildDesignInterviewPracticeResumeRoute(session));
        return;
      }
      if (action.kind === "choose_declared_scope") {
        navigation.navigate(ROUTES.ALGORITHMS_SCOPE_SELECTION, {
          modeId: action.modeId,
          source: "home",
          targetMentalUnitId: action.targetMentalUnitId,
        });
        return;
      }
      if (action.kind === "resume_active_session") {
        const session = await resumeActiveTrainingSession();
        if (session.id !== action.sessionId || session.trackId !== CODING_INTERVIEW_TRACK_ID || session.modeId !== action.modeId) {
          throw new Error("The active Coding Interview session changed before it could be resumed.");
        }
        if (action.modeId === "coding-interview-simulation") {
          if (!action.simulationProfileId) throw new Error("The active Interview Simulation profile is unavailable.");
          navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: action.simulationProfileId });
          return;
        }
        if (action.modeId === "coding-interview-custom-practice") {
          navigation.navigate(
            ROUTES.PRACTICE_SESSION,
            buildPracticeSessionConfig({
              feedbackMode: feedbackTimingFromDurableSession(session),
              mode: action.modeId,
              source: "home",
              topicId: action.topicId,
              trackId: CODING_INTERVIEW_TRACK_ID,
            }),
          );
          return;
        }
      }
      navigation.navigate(
        ROUTES.PRACTICE_SESSION,
        buildPracticeSessionConfig({
          mode: action.modeId,
          reviewSource: action.kind === "start_practice" ? action.reviewSource : undefined,
          algorithmScope: action.kind === "start_practice" ? action.scope : undefined,
          source: "home",
          topicId: action.topicId,
          trackId: CODING_INTERVIEW_TRACK_ID,
        }),
      );
    } catch (error) {
      Alert.alert("Recommendation unavailable", describeOperationalFailure(error, "The recommended session could not be opened."));
    }
  }

  async function handleHomePlanAction(action: GuidanceAction, homePlan: HomePlanSnapshot, returnTo: "home" | "progress" = "home"): Promise<void> {
    if (action.kind === "try_again") {
      setShellReload((reload) => reload + 1);
      return;
    }
    if (action.kind === "set_goal" || action.kind === "adjust_goal") {
      navigation.navigate(ROUTES.GOAL_CADENCE, { returnTo, trackId: selectedTrackId });
      return;
    }
    if (action.kind === "view_progress") {
      if (returnTo === "progress") return;
      handleHomeTabChange("progress");
      return;
    }
    if (action.kind === "start_next_session" || action.kind === "continue_plan") {
      if (homePlan.kind !== "ready") return;
      navigation.navigate(ROUTES.PRACTICE_SETUP, buildHomePlanPracticeSetupParams(homePlan, selectedTrackId));
      return;
    }
    if (action.kind === "create_plan" || action.kind === "review_updated_plan") {
      const result = await learningPlanProposalCoordinator.create(selectedTrackId);
      if ("proposal" in result) {
        navigation.navigate(ROUTES.LEARNING_PLAN_PROPOSAL, { proposalId: result.proposal.proposalId, trackId: selectedTrackId });
        return;
      }
      Alert.alert(tLearningPlan("Recommendation unavailable"), tLearningPlan("The learning plan could not be opened. Try again."));
      return;
    }
    if (action.kind === "resume_plan" || action.kind === "adjust_schedule") {
      const result = await learningPlanEditorCoordinator.startExistingEdit(selectedTrackId);
      if (result.kind === "ready") {
        navigation.navigate(ROUTES.LEARNING_PLAN_EDITOR, { editorId: result.session.editorId, trackId: selectedTrackId });
        return;
      }
      Alert.alert(tLearningPlan("Recommendation unavailable"), tLearningPlan("The saved learning plan could not be opened. Try again."));
    }
  }

  function openAccount(): void {
    if (settingsAccount.status === "guest" || settingsAccount.status === "signedOut") {
      navigation.navigate(ROUTES.ACCOUNT_ENTRY, { initialMode: "signIn" });
      return;
    }
    navigation.navigate(ROUTES.ACCOUNT_ENTRY);
  }

  const homeActiveSession = data.homePlan?.kind === "ready" ? data.homePlan.activeSession : data.homePlan?.kind === "unavailable" ? null : data.activeSession;

  return (
    <View style={styles.shell}>
      <Screen
        key={activeTab}
        edges={["top"]}
        style={[activeTab === "home" ? styles.homeScreenContent : null, activeTab === "progress" ? styles.progressScreenContent : null]}
      >
        {activeTab === "home" ? (
          <>
            {accountResumeRequired ? (
              <InfoBlock
                body={tAccount("resumeRequiredDescription")}
                testID="home-account-resume-required"
                title={tAccount("resumeRequired")}
                tone="warning"
              />
            ) : null}
            <HomeTab
              activeSession={homeActiveSession}
              activeTrack={activeTrack}
              analytics={analytics}
              algorithmsDashboard={data.algorithmsDashboard}
              dashboardError={data.algorithmsDashboardError}
              onDismissGoalOnboarding={async () => {
                persistGoalOnboardingDismissal(activeTrack.id);
                setData((current) => ({ ...current, goalOnboardingDismissed: true }));
              }}
              onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
              onChooseTopic={() => navigation.navigate(ROUTES.TOPIC_ROADMAP, {
                trackId: activeTrack.id,
              })}
              onOpenActivity={() => navigation.navigate(ROUTES.ACTIVITY)}
              onOpenSettings={() => handleHomeTabChange("settings")}
              onSetGoal={() => navigation.navigate(ROUTES.GOAL_CADENCE, { returnTo: "home", trackId: activeTrack.id })}
              onRecommendationAction={(action) => { void handleRecommendationAction(action); }}
              onHomePlanAction={(action) => { void handleHomePlanAction(action, data.homePlan!, "home"); }}
              onRetryHomePlan={() => setShellReload((reload) => reload + 1)}
              onStartLearning={(topicId) => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId })}
              homePlan={data.homePlan}
              reviewQueueItems={data.reviewQueueItems}
              goalInvitationAudience={account.state.kind === "authenticated" ? "account" : "guest"}
              showGoalInvitation={(account.state.kind === "guest" || (account.state.kind === "authenticated"
                && account.state.accountData.status === "synced"
                && account.state.accountData.pendingMutationCount === 0
                && account.state.accountData.blockingConflictCode === null
                && account.state.accountData.lastFailureCode === null))
                && homeActiveSession === null && data.goal === null && !data.goalOnboardingDismissed}
              trainingAttempts={data.trainingAttempts}
            />
          </>
        ) : null}
        {activeTab === "progress" ? (
          <ProgressTab
            activeTrack={activeTrack}
            activityRecords={data.activityRecords}
            analytics={analytics}
            attempts={data.attempts}
            cloudProgress={data.cloudProgress}
            goal={data.goal}
            onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            onOpenActivity={() => navigation.navigate(ROUTES.ACTIVITY)}
            onOpenActivityItem={(item) => navigateToActivityResult(navigation, item)}
            onOpenPractice={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
            onOpenGoal={() => navigation.navigate(ROUTES.GOAL_CADENCE, { returnTo: "progress", trackId: activeTrack.id })}
            onHomePlanAction={(action) => { void handleHomePlanAction(action, data.homePlan!, "progress"); }}
            onRetryHomePlan={() => setShellReload((reload) => reload + 1)}
            onProgressAction={handleProgressAction}
            homePlan={data.homePlan}
            practiceHistory={data.practiceHistory}
            reviewQueueItems={data.reviewQueueItems}
            trainingAttempts={data.trainingAttempts}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsTab
            account={settingsAccount}
            onOpenAccount={openAccount}
            onOpenSecurity={(screen) => navigation.navigate(ROUTES.ACCOUNT_SECURITY, { screen })}
            onOpenAppearance={() => navigation.navigate(ROUTES.APPEARANCE_SETTINGS)}
            onOpenBackendDiagnostics={() => navigation.navigate(ROUTES.BACKEND_DIAGNOSTICS)}
            onOpenGoal={() => navigation.navigate(ROUTES.GOAL_CADENCE, { returnTo: "settings", trackId: activeTrack.id })}
            onOpenLanguage={() => navigation.navigate(ROUTES.LANGUAGE_SETTINGS)}
            onOpenLegalInformation={() => navigation.navigate(ROUTES.LEGAL_INFORMATION)}
            onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS, { source: "settings" })}
            onOpenPremium={() => navigation.navigate(ROUTES.PREMIUM_PURCHASE)}
            onOpenYourData={() => navigation.navigate(ROUTES.YOUR_DATA)}
            onSignOut={() => account.signOut()}
            storageIssues={data.storageIssues}
          />
        ) : null}
      </Screen>
      <AppBottomNavigation
        activeId={activeTab}
        navigation={navigation}
        onHomeTabChange={handleHomeTabChange}
      />
    </View>
  );
}


const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  homeScreenContent: {
    gap: 18,
    paddingTop: 12,
  },
  progressScreenContent: {
    paddingTop: 16,
  },
});
