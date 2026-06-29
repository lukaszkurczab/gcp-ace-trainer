import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  AppShellHeader,
  Badge,
  BottomTabBar,
  Button,
  Card,
  EmptyState,
  ListRow,
  MetricCard,
  ProgressBar,
  Screen,
  SectionHeader,
  SettingsGroup,
  TrackCard,
  type BottomTabBarItem,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  DEFAULT_TRACK_ID,
  getTrackDefinition,
  getTrackDefinitions,
  type TrackDefinition,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  clearActiveExamSession,
  clearAttempts,
  clearPracticeHistory,
  clearQuestions,
  getActiveExamSession,
  getActiveTrackId,
  getAttempts,
  getPracticeHistory,
  getQuestions,
  removeLocalValue,
  saveActiveTrackId,
} from "../../storage";
import { STORAGE_KEYS } from "../../storage/keys";
import { colors, spacing, typography } from "../../theme";
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

type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.HOME
>;

type ShellTab = "home" | "practice" | "progress" | "settings";

type ShellData = {
  activeSession: ActiveExamSession | null;
  attempts: AttemptSummary[];
  practiceHistory: PracticeAnswerRecord[];
  questions: Question[];
};

const tabs: readonly BottomTabBarItem<ShellTab>[] = [
  { id: "home", label: "Home", icon: "H" },
  { id: "practice", label: "Practice", icon: ">" },
  { id: "progress", label: "Progress", icon: "#" },
  { id: "settings", label: "Settings", icon: "*" },
];

const TAB_BAR_RESERVED_HEIGHT = 128;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<ShellTab>("home");
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(DEFAULT_TRACK_ID);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [data, setData] = useState<ShellData>({
    activeSession: null,
    attempts: [],
    practiceHistory: [],
    questions: DEFAULT_QUESTION_BANK,
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
        ] = await Promise.all([
          getActiveTrackId(),
          getQuestions(),
          getActiveExamSession(),
          getAttempts(),
          getPracticeHistory(),
        ]);

        if (isActive) {
          setActiveTrackId(savedTrackId);
          setData({
            activeSession: savedSession,
            attempts: savedAttempts,
            practiceHistory: savedPracticeHistory,
            questions: savedQuestions,
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

    setData((current) => ({ ...current, activeSession: result.session }));
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
              setData((current) => ({ ...current, activeSession: null })),
            );
          },
        },
      ],
    );
  }

  function clearAllLocalData() {
    Alert.alert(
      "Clear all local data?",
      "This deletes local attempts, practice history, imported questions, review marks, settings, and active sessions. Built-in content remains available.",
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
              removeLocalValue(STORAGE_KEYS.QUESTION_REVIEW_STATE),
              removeLocalValue(STORAGE_KEYS.SETTINGS),
            ]).then(() =>
              setData({
                activeSession: null,
                attempts: [],
                practiceHistory: [],
                questions: DEFAULT_QUESTION_BANK,
              }),
            );
          },
        },
      ],
    );
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
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
            isStartingExam={isStartingExam}
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
            practiceHistory={data.practiceHistory}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsTab
            activeTrack={activeTrack}
            onClearAllLocalData={clearAllLocalData}
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

type HomeTabProps = {
  activeTrack: TrackDefinition;
  activeTrackId: TrackId;
  analytics: ReturnType<typeof buildAnalyticsData>;
  onSelectTrack: (trackId: TrackId) => Promise<void>;
};

function HomeTab({
  activeTrack,
  activeTrackId,
  analytics,
  onSelectTrack,
}: HomeTabProps) {
  const hasPractice = analytics.summary.totalPracticeQuestionsAnswered > 0;
  const hasExams = analytics.summary.totalCompletedExams > 0;

  return (
    <>
      <Card variant="elevated" style={styles.hero}>
        <SectionHeader
          title={getHomeTitle(activeTrackId)}
          subtitle={getHomeSubtitle(activeTrackId)}
          action={<Badge label={activeTrack.status === "active" ? "Ready" : "Draft"} tone={activeTrack.status === "active" ? "ready" : "warning"} />}
        />
        <Button onPress={() => void onSelectTrack(activeTrack.id)}>
          {activeTrack.nextActionLabel}
        </Button>
      </Card>

      <Card>
        <SectionHeader
          title="Tracks"
          subtitle="Choose the context before starting a session."
          tight
        />
        <View style={styles.trackList}>
          {getTrackDefinitions().map((track) => (
            <TrackCard
              isActive={track.id === activeTrackId}
              key={track.id}
              onPress={() => void onSelectTrack(track.id)}
              progress={track.id === CLOUD_CERTIFICATION_TRACK_ID ? 0.72 : 0}
              progressLabel={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "Readiness" : "Progress"}
              track={track}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Recommended today" tight />
        <View style={styles.actionList}>
          <ListRow
            detail={getRecommendationDetail(activeTrackId, hasPractice, hasExams)}
            title={getRecommendationTitle(activeTrackId)}
            trailing={<Text style={styles.arrow}>{">"}</Text>}
          />
          <ListRow
            detail="Items and weak areas become richer as track-aware attempts are added."
            meta={String(analytics.summary.totalPracticeQuestionsAnswered)}
            title="Review queue"
            trailing={<Badge label="Local" tone="info" />}
          />
        </View>
      </Card>
    </>
  );
}

type PracticeTabProps = {
  activeSession: ActiveExamSession | null;
  activeTrack: TrackDefinition;
  bankReady: boolean;
  isStartingExam: boolean;
  navigation: HomeScreenProps["navigation"];
  onDiscardExam: () => void;
  onStartExam: () => Promise<void>;
};

function PracticeTab({
  activeSession,
  activeTrack,
  bankReady,
  isStartingExam,
  navigation,
  onDiscardExam,
  onStartExam,
}: PracticeTabProps) {
  const isCloud = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID;

  return (
    <>
      <TrackCard isActive progress={isCloud ? 0.72 : 0} track={activeTrack} />

      {isCloud ? (
        <>
          <Card variant="elevated">
            <SectionHeader
              title={activeSession ? "Exam in progress" : "Cloud practice"}
              subtitle={
                activeSession
                  ? "Resume or discard the saved assessment session."
                  : "Start from focused practice before using exam simulation."
              }
              action={<Badge label={activeSession ? "Active" : "Ready"} tone="ready" />}
            />
            {activeSession ? (
              <>
                <Button onPress={() => navigation.navigate(ROUTES.EXAM)}>
                  Resume Exam
                </Button>
                <Button variant="destructive" onPress={onDiscardExam}>
                  Discard Active Exam
                </Button>
              </>
            ) : (
              <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}>
                Start focused practice
              </Button>
            )}
          </Card>

          <Card>
            <SectionHeader title="Other modes" tight />
            <View style={styles.actionList}>
              <ListRow
                detail="Work through one domain with immediate feedback."
                onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}
                title="Practice by domain"
                trailing={<Text style={styles.arrow}>{">"}</Text>}
              />
              <ListRow
                detail="Full assessment-style session with feedback after submit."
                onPress={() => void onStartExam()}
                title="Exam simulation"
                trailing={
                  <Badge
                    label={bankReady ? "Ready" : "Locked"}
                    tone={bankReady ? "ready" : "warning"}
                  />
                }
              />
              <ListRow
                detail="Revisit missed and marked questions."
                onPress={() => navigation.navigate(ROUTES.MISTAKES_REVIEW)}
                title="Review missed items"
                trailing={<Text style={styles.arrow}>{">"}</Text>}
              />
            </View>
          </Card>
        </>
      ) : (
        <Card>
          <SectionHeader
            title="Algorithms is registered"
            subtitle="Pattern Drill and Strategy Practice stay disabled until original content and scoring are implemented."
            action={<Badge label="Draft" tone="warning" />}
          />
          <EmptyState
            title="No algorithm sessions yet"
            description="The next implementation slice should add original algorithm items, scoring, and feedback."
          />
        </Card>
      )}
    </>
  );
}

type ProgressTabProps = {
  activeTrack: TrackDefinition;
  analytics: ReturnType<typeof buildAnalyticsData>;
  attempts: AttemptSummary[];
  practiceHistory: PracticeAnswerRecord[];
};

function ProgressTab({
  activeTrack,
  analytics,
  attempts,
  practiceHistory,
}: ProgressTabProps) {
  const hasData = attempts.length > 0 || practiceHistory.length > 0;

  return (
    <>
      <Card variant="elevated">
        <SectionHeader
          title="Focus overview"
          subtitle={`Track-aware progress for ${activeTrack.title}.`}
          action={<Badge label={hasData ? "Local data" : "No data"} tone={hasData ? "info" : "neutral"} />}
        />
        <View style={styles.metricRow}>
          <MetricCard
            label="Completed exams"
            tone="info"
            value={analytics.summary.totalCompletedExams}
          />
          <MetricCard
            label="Practice answers"
            tone="primary"
            value={analytics.summary.totalPracticeQuestionsAnswered}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Review queue" subtitle="Review becomes track-aware as session records are migrated." />
        <View style={styles.reviewMetric}>
          <Text style={styles.largeNumber}>
            {analytics.summary.totalPracticeQuestionsAnswered}
          </Text>
          <Text style={styles.mutedText}>local practice records available</Text>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Performance by topic" tight />
        {activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID ? (
          <View style={styles.actionList}>
            {analytics.domainPerformance.map((score) => (
              <View key={score.id} style={styles.performanceRow}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceTitle}>{score.label}</Text>
                  <Text style={styles.performanceValue}>{score.percent}%</Text>
                </View>
                <ProgressBar progress={score.percent / 100} tone="primary" />
                <Text style={styles.mutedText}>
                  {score.correct}/{score.total} correct
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No algorithm progress yet"
            description="Pattern, strategy, and complexity metrics will appear after Algorithms sessions are implemented."
          />
        )}
      </Card>
    </>
  );
}

function SettingsTab({
  activeTrack,
  onClearAllLocalData,
}: {
  activeTrack: TrackDefinition;
  onClearAllLocalData: () => void;
}) {
  return (
    <>
      <Card variant="elevated">
        <SectionHeader
          title="Settings"
          subtitle="Local-first workspace controls."
          action={<Badge label={activeTrack.shortTitle} tone="info" />}
        />
      </Card>

      <SettingsGroup title="Learning preferences">
        <ListRow detail={activeTrack.title} title="Active track" />
        <ListRow detail="20 questions" title="Default session length" />
        <ListRow detail="Weak areas first" title="Review priority" />
      </SettingsGroup>

      <SettingsGroup title="Data and privacy">
        <ListRow detail="No account, backend, or sync in MVP." title="Local-only data" />
        <ListRow
          detail="Google and LeetCode references are independent study context only."
          title="Legal safety"
        />
        <ListRow
          detail="Deletes local progress and imported content."
          onPress={onClearAllLocalData}
          title="Clear all local data"
          trailing={<Badge label="Destructive" tone="danger" />}
        />
      </SettingsGroup>
    </>
  );
}

function getHomeTitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Algorithm Patterns"
    : "Cloud Certification";
}

function getHomeSubtitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Recognize patterns, compare strategies, and reason about complexity."
    : "Resume certification practice or review weak cloud domains.";
}

function getRecommendationTitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Prepare Pattern Drill"
    : "Review cloud weak areas";
}

function getRecommendationDetail(
  trackId: TrackId,
  hasPractice: boolean,
  hasExams: boolean,
): string {
  if (trackId === ALGORITHMS_TRACK_ID) {
    return "Algorithms is visible as a draft track; content and scoring are next.";
  }

  if (hasPractice || hasExams) {
    return "Suggested from local attempts and practice records.";
  }

  return "Start a practice session to build diagnostics.";
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.light.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
  hero: {
    gap: spacing.lg,
  },
  trackList: {
    gap: spacing.md,
  },
  actionList: {
    gap: spacing.md,
  },
  arrow: {
    ...typography.heading,
    color: colors.light.textMuted,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  reviewMetric: {
    gap: spacing.xs,
  },
  largeNumber: {
    ...typography.display,
    color: colors.light.primary,
    fontVariant: ["tabular-nums"],
  },
  mutedText: {
    ...typography.small,
    color: colors.light.textSecondary,
  },
  performanceRow: {
    gap: spacing.sm,
  },
  performanceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  performanceTitle: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary,
  },
  performanceValue: {
    ...typography.bodyStrong,
    color: colors.light.primary,
    fontVariant: ["tabular-nums"],
  },
});
