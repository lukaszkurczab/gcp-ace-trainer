import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  AppShellHeader,
  EmptyState,
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
import { colors } from "../../theme";
import { type CloudCertificationProgressViewModel } from "../../tracks/cloud-certification";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/cloud-certification";
import { type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import type { AlgorithmsRecommendationAction, AlgorithmsDashboard } from "../../application/algorithms";
import { resumeActiveTrainingSession } from "../../application/trainingLifecycle";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import {
  buildPracticeSessionConfig,
} from "../practice/sessionConfig";
import { HomeTab } from "./tabs/HomeTab";
import { ProgressTab } from "./tabs/ProgressTab";
import type { ProgressAction } from "./tabs/progressTabModel";
import { SettingsTab } from "./tabs/SettingsTab";
import {
  CLEAR_LOCAL_HISTORY_CONFIRMATION,
  tryClearPatternlyLocalHistory,
} from "./localReset";
import type { ShellTab } from "./types";

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
  const [activeTab, setActiveTab] = useState<HomeShellTab>("home");
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
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
          if (savedTrackId) setActiveTrackId(savedTrackId);
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
  if (!activeTrackId) return <Screen><EmptyState title="Choose a learning track" description="No active track is selected." actionLabel="Choose track" onActionPress={() => navigation.navigate(ROUTES.SELECT_TRACK)} /></Screen>;
  const activeTrack = getTrackDisplay(activeTrackId);

  function clearAllLocalData() {
    Alert.alert(
      "Clear all local data?",
      CLEAR_LOCAL_HISTORY_CONFIRMATION,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void runLocalHistoryReset();
          },
        },
      ],
    );
  }

  async function runLocalHistoryReset() {
    const result = await tryClearPatternlyLocalHistory();
    if (result.ok) {
      setData({
        algorithmsDashboard: null,
        algorithmsDashboardError: null,
        attempts: [],
        cloudProgress: null,
        practiceHistory: [],
        reviewQueueItems: [],
        storageIssues: [],
        trainingAttempts: [],
      });
      return;
    }
    Alert.alert(
      "Local data was not cleared",
      result.message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Try again", onPress: () => { void runLocalHistoryReset(); } },
      ],
    );
  }

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
      }
      navigation.navigate(
        ROUTES.PRACTICE_SESSION,
        buildPracticeSessionConfig({
          mode: action.modeId,
          reviewSource: action.kind === "start_practice" ? action.reviewSource : undefined,
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
            activeTrack={activeTrack}
            onClearAllLocalData={clearAllLocalData}
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

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.dark.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
});
