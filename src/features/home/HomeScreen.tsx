import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  AppShellHeader,
  Badge,
  BottomTabBar,
  Screen,
  type BottomTabBarItem,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  DEFAULT_TRACK_ID,
  getTrackDefinition,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  clearActiveExamSession,
  clearAttempts,
  clearPracticeHistory,
  clearQuestionReviewState,
  clearQuestions,
  getActiveExamSession,
  getActiveTrackId,
  getAttempts,
  getPracticeHistory,
  getQuestions,
  getStorageIssues,
  saveActiveTrackId,
  type LocalStorageIssue,
} from "../../storage";
import { colors } from "../../theme";
import {
  loadCloudCertificationProgressViewModel,
  type CloudCertificationProgressViewModel,
} from "../../tracks/cloud-certification";
import type {
  ActiveExamSession,
  AttemptSummary,
  PracticeAnswerRecord,
  Question,
} from "../../types";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { createExamSession } from "../exam/examService";
import { DEFAULT_QUESTION_BANK } from "../questions/defaultQuestionBank";
import { buildQuestionBankSummary } from "../questions/questionBankStats";
import { HomeTab } from "./tabs/HomeTab";
import { PracticeTab } from "./tabs/PracticeTab";
import { ProgressTab } from "./tabs/ProgressTab";
import { SettingsTab } from "./tabs/SettingsTab";
import type { ShellTab } from "./types";

type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellData = {
  activeSession: ActiveExamSession | null;
  attempts: AttemptSummary[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  practiceHistory: PracticeAnswerRecord[];
  questions: Question[];
  storageIssues: readonly LocalStorageIssue[];
};

const tabs: readonly BottomTabBarItem<ShellTab>[] = [
  { icon: "home", id: "home", label: "Home" },
  { icon: "practice", id: "practice", label: "Practice" },
  { icon: "progress", id: "progress", label: "Progress" },
  { icon: "settings", id: "settings", label: "Settings" },
];

const TAB_BAR_RESERVED_HEIGHT = 128;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<ShellTab>("home");
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(DEFAULT_TRACK_ID);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [data, setData] = useState<ShellData>({
    activeSession: null,
    attempts: [],
    cloudProgress: null,
    practiceHistory: [],
    questions: DEFAULT_QUESTION_BANK,
    storageIssues: [],
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadShellData() {
        const [
          savedTrackId,
          savedQuestions,
          savedSession,
          savedAttempts,
          savedPracticeHistory,
          cloudProgress,
        ] = await Promise.all([
          getActiveTrackId(),
          getQuestions(),
          getActiveExamSession(),
          getAttempts(),
          getPracticeHistory(),
          loadCloudCertificationProgressViewModel(),
        ]);

        if (isActive) {
          setActiveTrackId(savedTrackId);
          setData({
            activeSession: savedSession,
            attempts: savedAttempts,
            cloudProgress,
            practiceHistory: savedPracticeHistory,
            questions: savedQuestions,
            storageIssues: getStorageIssues(),
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
  const bankSummary = buildQuestionBankSummary(data.questions);
  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );

  async function selectTrack(trackId: TrackId) {
    await saveActiveTrackId(trackId);
    setActiveTrackId(trackId);
    setData((current) => ({
      ...current,
      storageIssues: getStorageIssues(),
    }));
  }

  async function startExam() {
    if (!bankSummary.examReady || isStartingExam) {
      return;
    }

    setIsStartingExam(true);
    const result = await createExamSession();
    setIsStartingExam(false);

    if (!result.ok) {
      Alert.alert("Exam not ready", result.reason);
      return;
    }

    setData((current) => ({
      ...current,
      activeSession: result.session,
      storageIssues: getStorageIssues(),
    }));
    navigation.navigate(ROUTES.EXAM);
  }

  function discardActiveExam() {
    Alert.alert(
      "Discard active exam?",
      "This removes the in-progress Cloud Certification exam session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            void clearActiveExamSession().then(() =>
              setData((current) => ({
                ...current,
                activeSession: null,
                storageIssues: getStorageIssues(),
              })),
            );
          },
        },
      ],
    );
  }

  function clearAllLocalData() {
    Alert.alert(
      "Clear all local data?",
      "This deletes local attempts, practice history, local question overrides, review marks, and active sessions. Built-in content remains available.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void Promise.all([
              clearActiveExamSession(),
              clearQuestions(),
              clearAttempts(),
              clearPracticeHistory(),
              clearQuestionReviewState(),
            ]).then(() =>
              setData({
                activeSession: null,
                attempts: [],
                cloudProgress: null,
                practiceHistory: [],
                questions: DEFAULT_QUESTION_BANK,
                storageIssues: getStorageIssues(),
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
          action={<Badge label="Local" tone="info" />}
          subtitle={`${activeTrack.shortTitle} workspace`}
          title="Patternly"
        />
        {activeTab === "home" ? (
          <HomeTab
            activeTrack={activeTrack}
            activeTrackId={activeTrackId}
            analytics={analytics}
            onSelectTrack={selectTrack}
          />
        ) : null}
        {activeTab === "practice" ? (
          <PracticeTab
            activeSession={data.activeSession}
            activeTrack={activeTrack}
            bankReady={bankSummary.examReady}
            navigation={navigation}
            onDiscardExam={discardActiveExam}
            onStartExam={startExam}
          />
        ) : null}
        {activeTab === "progress" ? (
          <ProgressTab
            activeTrack={activeTrack}
            analytics={analytics}
            attempts={data.attempts}
            cloudProgress={data.cloudProgress}
            practiceHistory={data.practiceHistory}
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
      <BottomTabBar
        activeId={activeTab}
        items={tabs}
        onChange={setActiveTab}
        testID="main-tab-bar"
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
