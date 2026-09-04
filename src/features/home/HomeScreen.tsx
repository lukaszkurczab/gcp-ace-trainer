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
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadReviewQueueItems as getReviewQueueItems,
  loadTrainingAttempts as getTrainingAttempts,
  type StorageIssue,
} from "../../application/learningReadModels";
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
import type { ShellTab } from "./types";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { feedbackTimingFromDurableSession } from "./resumeFeedbackTiming";


type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellData = {
  algorithmsDashboard: CodingInterviewDashboard | null;
  algorithmsDashboardError: string | null;
  activeSession: TrainingSession | null;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  goal: GoalRecord | null;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  reviewQueueItems: ReviewQueueEntry[];
  storageIssues: readonly StorageIssue[];
  trainingAttempts: TrainingAttempt[];
};

type HomeShellTab = Exclude<ShellTab, "practice">;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { t: tAccount } = useTranslation("account");
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const accountResumeRequired = account.state.kind === "authenticated" && account.state.accountData.status === "resumeRequired";
  const [activeTab, setActiveTab] = useState<HomeShellTab>(route.params?.initialTab ?? "home");
  const initialRouteTabRef = useRef<HomeShellTab | null>(route.params?.initialTab ?? null);
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [hasLoadedActiveTrack, setHasLoadedActiveTrack] = useState(false);
  const [shellReload, setShellReload] = useState(0);
  const [shellReadError, setShellReadError] = useState<string | null>(null);
  const [data, setData] = useState<ShellData>({
    algorithmsDashboard: null,
    algorithmsDashboardError: null,
    activeSession: null,
    attempts: [],
    cloudProgress: null,
    goal: null,
    practiceHistory: [],
    reviewQueueItems: [],
    storageIssues: [],
    trainingAttempts: [],
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
          const [
            savedAttempts,
            savedPracticeHistory,
            activeSession,
            cloudProgress,
            reviewQueueItemsResult,
            trainingAttemptsResult,
          ] = await Promise.all([
            getAttempts(),
            getPracticeHistory(),
            loadActiveTrainingSession(),
            loadCloudCertificationProgressViewModel(),
            getReviewQueueItems(),
            getTrainingAttempts(),
          ]);
          const goal = savedTrackId ? await loadGoal(savedTrackId) : null;
          let algorithmsDashboard: CodingInterviewDashboard | null = null;
          let algorithmsDashboardError: string | null = null;
          if (savedTrackId === CODING_INTERVIEW_TRACK_ID) {
            try { algorithmsDashboard = await loadCodingInterviewDashboard(); }
            catch (error) { algorithmsDashboardError = describeOperationalFailure(error, "Coding Interview recommendation is unavailable."); }
          }

          if (isActive) {
            setActiveTrackId(savedTrackId ?? null);
            setData({
              algorithmsDashboard,
              algorithmsDashboardError,
              activeSession,
              attempts: savedAttempts,
              cloudProgress,
              goal,
              practiceHistory: savedPracticeHistory,
              reviewQueueItems: reviewQueueItemsResult.value,
              storageIssues: [],
              trainingAttempts: trainingAttemptsResult.value,
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
              activeSession={data.activeSession}
              activeTrack={activeTrack}
              analytics={analytics}
              algorithmsDashboard={data.algorithmsDashboard}
              dashboardError={data.algorithmsDashboardError}
              onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
              onChooseTopic={() => navigation.navigate(ROUTES.TOPIC_ROADMAP, {
                trackId: activeTrack.id,
              })}
              onOpenActivity={() => navigation.navigate(ROUTES.ACTIVITY)}
              onOpenSettings={() => handleHomeTabChange("settings")}
              onRecommendationAction={(action) => { void handleRecommendationAction(action); }}
              onStartLearning={(topicId) => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId })}
              reviewQueueItems={data.reviewQueueItems}
              trainingAttempts={data.trainingAttempts}
            />
          </>
        ) : null}
        {activeTab === "progress" ? (
          <ProgressTab
            activeTrack={activeTrack}
            analytics={analytics}
            attempts={data.attempts}
            cloudProgress={data.cloudProgress}
            goal={data.goal}
            onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            onOpenActivity={() => navigation.navigate(ROUTES.ACTIVITY)}
            onOpenGoal={() => navigation.navigate(ROUTES.GOAL_CADENCE, { trackId: activeTrack.id })}
            onProgressAction={handleProgressAction}
            practiceHistory={data.practiceHistory}
            reviewQueueItems={data.reviewQueueItems}
            trainingAttempts={data.trainingAttempts}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsTab
            onOpenAccount={() => navigation.navigate(ROUTES.ACCOUNT_ENTRY)}
            onOpenAppearance={() => navigation.navigate(ROUTES.APPEARANCE_SETTINGS)}
            onOpenBackendDiagnostics={() => navigation.navigate(ROUTES.BACKEND_DIAGNOSTICS)}
            onOpenLegalInformation={() => navigation.navigate(ROUTES.LEGAL_INFORMATION)}
            onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS)}
            onOpenPracticeSettings={() => navigation.navigate(ROUTES.PRACTICE_SETUP, { trackId: activeTrack.id })}
            onOpenYourData={() => navigation.navigate(ROUTES.YOUR_DATA)}
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
