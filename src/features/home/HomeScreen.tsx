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
  DEFAULT_TRACK_ID,
  getTrackDefinition,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  getActiveTrackId,
  getAttempts,
  getPracticeHistory,
  getStorageIssues,
  getTrainingAttempts,
  type LocalStorageIssue,
} from "../../storage";
import { colors } from "../../theme";
import {
  loadCloudCertificationProgressViewModel,
  type CloudCertificationProgressViewModel,
} from "../../tracks/cloud-certification";
import type { AttemptSummary, PracticeAnswerRecord } from "../../types";
import type { TrainingAttempt } from "../../domain/training";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { buildPracticeSessionConfig } from "../practice/sessionConfig";
import { HomeTab } from "./tabs/HomeTab";
import { ProgressTab } from "./tabs/ProgressTab";
import { SettingsTab } from "./tabs/SettingsTab";
import {
  CLEAR_LOCAL_HISTORY_CONFIRMATION,
  clearPatternlyLocalHistory,
} from "./localReset";
import type { ShellTab } from "./types";

type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellData = {
  attempts: AttemptSummary[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  practiceHistory: PracticeAnswerRecord[];
  storageIssues: readonly LocalStorageIssue[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

type HomeShellTab = Exclude<ShellTab, "practice">;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<HomeShellTab>("home");
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(DEFAULT_TRACK_ID);
  const [data, setData] = useState<ShellData>({
    attempts: [],
    cloudProgress: null,
    practiceHistory: [],
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
        const [
          savedTrackId,
          savedAttempts,
          savedPracticeHistory,
          cloudProgress,
          trainingAttemptsResult,
        ] = await Promise.all([
          getActiveTrackId(),
          getAttempts(),
          getPracticeHistory(),
          loadCloudCertificationProgressViewModel(),
          getTrainingAttempts(),
        ]);

        if (isActive) {
          setActiveTrackId(savedTrackId);
          setData({
            attempts: savedAttempts,
            cloudProgress,
            practiceHistory: savedPracticeHistory,
            storageIssues: getStorageIssues(),
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

  const activeTrack = getTrackDefinition(activeTrackId);
  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );

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
            void clearPatternlyLocalHistory().then(() =>
              setData({
                attempts: [],
                cloudProgress: null,
                practiceHistory: [],
                storageIssues: getStorageIssues(),
                trainingAttempts: [],
              }),
            );
          },
        },
      ],
    );
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
            onChangeTrack={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            onStartLearning={(topicId) => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId })}
            onStartMode={(mode, topicId) =>
              navigation.navigate(
                ROUTES.PRACTICE_SESSION,
                buildPracticeSessionConfig({
                  mode,
                  source: "home",
                  topicId,
                  trackId: activeTrack.id,
                }),
              )
            }
            trainingAttempts={data.trainingAttempts}
          />
        ) : null}
        {activeTab === "progress" ? (
          <ProgressTab
            activeTrack={activeTrack}
            analytics={analytics}
            attempts={data.attempts}
            cloudProgress={data.cloudProgress}
            practiceHistory={data.practiceHistory}
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
