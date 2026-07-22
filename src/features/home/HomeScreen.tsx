import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  AppShellHeader,
  Screen,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  ALGORITHMS_TRACK_ID,
  getTrackDisplay,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadAlgorithmsDashboard,
  loadCloudCertificationProgress as loadCloudCertificationProgressViewModel,
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadReviewQueueItems as getReviewQueueItems,
  loadTrainingAttempts as getTrainingAttempts,
  type StorageIssue,
} from "../../application/learningReadModels";
import { type CloudCertificationProgressViewModel } from "../../tracks/cloud-certification";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/cloud-certification";
import { type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import type { AlgorithmsRecommendationAction, AlgorithmsDashboard } from "../../application/algorithms";
import { resumeActiveTrainingSession } from "../../application/trainingLifecycle";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "./SelectTrackScreen";
import {
  buildPracticeSessionConfig,
} from "../practice/sessionConfig";
import { HomeTab } from "./tabs/HomeTab";
import { ProgressTab } from "./tabs/ProgressTab";
import type { ProgressAction } from "./tabs/progressTabModel";
import { SettingsTab } from "./tabs/SettingsTab";
import type { ShellTab } from "./types";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { feedbackTimingFromDurableSession } from "./resumeFeedbackTiming";


type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellData = {
  algorithmsDashboard: AlgorithmsDashboard | null;
  algorithmsDashboardError: string | null;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  reviewQueueItems: ReviewQueueEntry[];
  storageIssues: readonly StorageIssue[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

type HomeShellTab = Exclude<ShellTab, "practice">;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState<HomeShellTab>("home");
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [hasLoadedActiveTrack, setHasLoadedActiveTrack] = useState(false);
  const [data, setData] = useState<ShellData>({
    algorithmsDashboard: null,
    algorithmsDashboardError: null,
    attempts: [],
    cloudProgress: null,
    practiceHistory: [],
    reviewQueueItems: [],
    storageIssues: [],
    trainingAttempts: [],
  });

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadShellData() {
        const savedTrackId = await getActiveTrackId();
        const [
          savedAttempts,
          savedPracticeHistory,
          cloudProgress,
          reviewQueueItemsResult,
          trainingAttemptsResult,
        ] = await Promise.all([
          getAttempts(),
          getPracticeHistory(),
          loadCloudCertificationProgressViewModel(),
          getReviewQueueItems(),
          getTrainingAttempts(),
        ]);
        let algorithmsDashboard: AlgorithmsDashboard | null = null;
        let algorithmsDashboardError: string | null = null;
        if (savedTrackId === ALGORITHMS_TRACK_ID) {
          try { algorithmsDashboard = await loadAlgorithmsDashboard(); }
          catch (error) { algorithmsDashboardError = error instanceof Error ? error.message : "Algorithms recommendation is unavailable."; }
        }

        if (isActive) {
          setActiveTrackId(savedTrackId ?? null);
          setHasLoadedActiveTrack(true);
          setData({
            algorithmsDashboard,
            algorithmsDashboardError,
            attempts: savedAttempts,
            cloudProgress,
            practiceHistory: savedPracticeHistory,
            reviewQueueItems: reviewQueueItemsResult.value,
            storageIssues: [],
            trainingAttempts: trainingAttemptsResult.value,
          });
        }
      }

      void loadShellData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );
  if (!hasLoadedActiveTrack) return <Screen scroll={false}><View /></Screen>;
  if (!activeTrackId) {
    return (
      <SelectTrackScreen
        navigation={navigation}
        onboarding
        onTrackSelected={setActiveTrackId}
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

  async function handleRecommendationAction(action: AlgorithmsRecommendationAction) {
    if (action.kind === "unavailable") return;
    try {
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
        if (session.id !== action.sessionId || session.trackId !== ALGORITHMS_TRACK_ID || session.modeId !== action.modeId) {
          throw new Error("The active Algorithms session changed before it could be resumed.");
        }
        if (action.modeId === "algorithms-interview-simulation") {
          if (!action.simulationProfileId) throw new Error("The active Interview Simulation profile is unavailable.");
          navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: action.simulationProfileId });
          return;
        }
        if (action.modeId === "algorithms-custom-practice") {
          navigation.navigate(
            ROUTES.PRACTICE_SESSION,
            buildPracticeSessionConfig({
              feedbackMode: feedbackTimingFromDurableSession(session),
              mode: action.modeId,
              source: "home",
              topicId: action.topicId,
              trackId: ALGORITHMS_TRACK_ID,
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
          trackId: ALGORITHMS_TRACK_ID,
        }),
      );
    } catch (error) {
      Alert.alert("Recommendation unavailable", error instanceof Error ? error.message : "The recommended session could not be opened.");
    }
  }

  return (
    <View style={styles.shell}>
      <Screen key={activeTab} edges={["top"]} style={styles.screenContent}>
        <AppShellHeader
          subtitle={activeTrack.title}
          title="Patternly"
        />
        {activeTab === "home" ? (
          <HomeTab
            activeTrack={activeTrack}
            analytics={analytics}
            algorithmsDashboard={data.algorithmsDashboard}
            dashboardError={data.algorithmsDashboardError}
            onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            onRecommendationAction={(action) => { void handleRecommendationAction(action); }}
            onStartLearning={(topicId) => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId })}
            trainingAttempts={data.trainingAttempts}
          />
        ) : null}
        {activeTab === "progress" ? (
          <ProgressTab
            activeTrack={activeTrack}
            analytics={analytics}
            attempts={data.attempts}
            cloudProgress={data.cloudProgress}
            onProgressAction={handleProgressAction}
            practiceHistory={data.practiceHistory}
            reviewQueueItems={data.reviewQueueItems}
            trainingAttempts={data.trainingAttempts}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsTab
            onOpenAppearance={() => navigation.navigate(ROUTES.APPEARANCE_SETTINGS)}
            onOpenLanguage={() => navigation.navigate(ROUTES.LANGUAGE_SETTINGS)}
            onOpenLegalInformation={() => navigation.navigate(ROUTES.LEGAL_INFORMATION)}
            onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS)}
            onOpenYourData={() => navigation.navigate(ROUTES.YOUR_DATA)}
            storageIssues={data.storageIssues}
          />
        ) : null}
      </Screen>
      <AppBottomNavigation
        activeId={activeTab}
        navigation={navigation}
        onHomeTabChange={setActiveTab}
      />
    </View>
  );
}


const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
});
