import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconTile,
  ListRow,
  MetricCard,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import { getTrackDisplay, type TrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadCloudCertificationProgress as loadCloudCertificationProgressViewModel,
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadTrainingAttempts as getTrainingAttempts,
} from "../../application/learningReadModels";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/algorithms";
import { spacing, typography } from "../../theme";
import {
  ALGORITHM_MODE_IDS,
} from "../../tracks/algorithms";
import { type CloudCertificationProgressViewModel } from "../../tracks/cloud-certification";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/cloud-certification";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { AppStackHeader } from "../navigation/AppStackHeader";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

import {
  buildPracticeModes,
  buildPracticeStatsSummary,
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  type PracticeTopic,
} from "./practiceFlowModel";
import {
  buildPracticeSessionConfig,
  getGeneralPracticeReviewSource,
  type PracticeSessionMode,
} from "./sessionConfig";

type PracticeHubScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_HUB
>;

type PracticeHubData = {
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function PracticeHubScreen({ navigation, route }: PracticeHubScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [data, setData] = useState<PracticeHubData>({
    attempts: [],
    cloudProgress: null,
    practiceHistory: [],
    trainingAttempts: [],
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        const [
          savedTrackId,
          savedAttempts,
          savedPracticeHistory,
          trainingAttemptsResult,
          cloudProgress,
        ] = await Promise.all([
          getActiveTrackId(),
          getAttempts(),
          getPracticeHistory(),
          getTrainingAttempts(),
          loadCloudCertificationProgressViewModel(),
        ]);

        if (isActive) {
          if (savedTrackId) setActiveTrackId(savedTrackId);
          setData({
            attempts: savedAttempts,
            cloudProgress,
            practiceHistory: savedPracticeHistory,
            trainingAttempts: trainingAttemptsResult.value,
          });
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );
  if (!activeTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(activeTrackId);
  const topic = resolvePracticeTopic({
    activeTrack,
    routeTopicId: route.params?.topicId,
    trainingAttempts: data.trainingAttempts,
  });
  const modes = buildPracticeModes(activeTrack);
  const stats = buildPracticeStatsSummary({
    activeTrack,
    analytics,
    cloudProgress: data.cloudProgress,
    trainingAttempts: data.trainingAttempts,
  });

  function startSession(mode?: PracticeSessionMode) {
    const resolvedMode = mode ?? (
      activeTrack.id === "algorithms"
        ? ALGORITHM_MODE_IDS.guidedPractice
        : "certification-diagnostic-baseline"
    );
    if (activeTrack.id === "cloud-certification" && resolvedMode === "cloud-exam-simulation") {
      navigation.navigate(ROUTES.EXAM);
      return;
    }
    if (activeTrack.id === "cloud-certification" && (resolvedMode === "certification-focus-practice" || resolvedMode === "certification-scenario-practice" || resolvedMode === "certification-weak-area-review")) {
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, sessionLength: 10, source: "modeShortcut", trackId: activeTrack.id });
      return;
    }
    if (activeTrack.id === "algorithms" && resolvedMode === ALGORITHM_MODE_IDS.interviewSimulation) {
      const entry = getAlgorithmsInterviewSimulationEntry();
      navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: entry.profileId });
      return;
    }
    if (activeTrack.id === "algorithms" && (
      resolvedMode === ALGORITHM_MODE_IDS.recognizePatterns ||
      resolvedMode === ALGORITHM_MODE_IDS.contrastPractice ||
      resolvedMode === ALGORITHM_MODE_IDS.independentPractice
    )) {
      navigation.navigate(ROUTES.ALGORITHMS_SCOPE_SELECTION, {
        modeId: resolvedMode,
        source: "practiceHub",
      });
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        mode: resolvedMode,
        reviewSource: getGeneralPracticeReviewSource(resolvedMode),
        source: mode === undefined ? "practiceHub" : "modeShortcut",
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.hubRoot()}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader
          navigation={navigation}
          showBack
          subtitle={t(activeTrack.title)}
        />

        <Card style={styles.topicStrip}>
          <View style={styles.topicCopy}>
            <Text style={styles.eyebrow}>{t("Next topic")}</Text>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.mutedText}>{topic.detail}</Text>
          </View>
          <Button
            onPress={() =>
              navigation.navigate(ROUTES.TOPIC_ROADMAP, {
                topicId: topic.id,
                trackId: activeTrack.id,
              })
            }
            style={styles.compactButton}
            variant="ghost"
          >
            {t("Change topic")}
          </Button>
        </Card>

        <Card variant="tonal" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>{t("Continue practice")}</Text>
          <SectionHeader
            title={topic.title}
            subtitle={`${t("Current track")}: ${t(activeTrack.title)}`}
            tight
          />
          <View style={styles.heroActions}>
            <Button
              onPress={() =>
                navigation.navigate(
                  ROUTES.PRACTICE_SETUP,
                  buildPracticeSessionConfig({
                    ...(activeTrack.id === "algorithms" ? { feedbackMode: "afterEachAnswer" as const, mode: ALGORITHM_MODE_IDS.guidedPractice } : { mode: "certification-diagnostic-baseline" as const }),
                    source: "practiceHub",
                    topicId: topic.id,
                    trackId: activeTrack.id,
                  }),
                )
              }
              testID={runtimeSelectors.practice.startSession()}
            >
              {t("Start session")}
            </Button>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate(
                  ROUTES.PRACTICE_SETUP,
                  buildPracticeSessionConfig({
                    ...(activeTrack.id === "algorithms" ? { feedbackMode: "afterEachAnswer" as const, mode: ALGORITHM_MODE_IDS.customPractice } : { mode: "certification-diagnostic-baseline" as const }),
                    source: "practiceHub",
                    topicId: topic.id,
                    trackId: activeTrack.id,
                  }),
                )
              }
              style={({ pressed }) => [styles.settingsAction, pressed ? styles.settingsActionPressed : null]}
              testID={runtimeSelectors.practice.openSetup()}
            >
              <Text
                style={styles.settingsActionText}
                testID={activeTrack.id === "algorithms" ? runtimeSelectors.practice.customEntry() : undefined}
              >
                {t(activeTrack.id === "algorithms" ? "Custom Practice" : "Manage settings")}
              </Text>
              <Icon color={palette.accentPurple} name="chevron-right" size={16} />
            </Pressable>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader title={t("Practice options")} tight />
          {modes.map((mode) => (
            <ListRow
              detail={t(mode.unavailableReason ?? mode.detail)}
              key={mode.mode}
              leading={<IconTile name={mode.icon} tone={mode.enabled ? mode.tone : "muted"} />}
              onPress={mode.enabled ? () => startSession(mode.mode) : undefined}
              style={mode.enabled ? undefined : styles.disabledRow}
              testID={runtimeSelectors.practice.modeCard(mode.mode)}
              title={t(mode.title)}
              trailing={
                mode.enabled ? (
                  <Icon color={palette.textMuted} name="chevron-right" size={18} />
                ) : (
                  <Badge label={t("Unavailable")} tone="neutral" />
                )
              }
            />
          ))}
        </View>

        <Card variant="tonal" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsCopy}>
              <Text style={styles.statsTitle}>{t(stats.title)}</Text>
              <Text style={styles.mutedText}>{t(stats.detail)}</Text>
            </View>
            <MetricCard
              label={t(stats.metricLabel)}
              style={styles.statsMetric}
              tone="primary"
              value={stats.metricValue}
            />
          </View>
          <Button
            onPress={() => navigation.navigate(ROUTES.HOME, { initialTab: "progress" })}
            variant="secondary"
          >
            {t("More stats")}
          </Button>
        </Card>
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
}

function resolvePracticeTopic(input: {
  activeTrack: TrackDisplay;
  routeTopicId?: string;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeTopic {
  if (input.routeTopicId) {
    const roadmapTopic = buildTopicRoadmapNodes({
      activeTrackId: input.activeTrack.id,
      trainingAttempts: input.trainingAttempts,
    }).find((node) => node.id === input.routeTopicId);

    if (roadmapTopic) {
      return {
        detail: roadmapTopic.detail,
        id: roadmapTopic.id,
        title: roadmapTopic.title,
      };
    }
  }

  return getCurrentPracticeTopic(input.activeTrack, input.trainingAttempts);
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
  topicStrip: {
    alignItems: "flex-start",
    gap: spacing.md,
  },
  topicCopy: {
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  topicTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  mutedText: {
    ...typography.small,
    color: palette.textSecondary,
  },
  compactButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: palette.primary,
    textTransform: "uppercase",
  },
  heroActions: {
    gap: spacing.md,
  },
  settingsAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  settingsActionPressed: {
    opacity: 0.78,
  },
  settingsActionText: {
    ...typography.small,
    color: palette.accentPurple,
    fontWeight: "600",
  },
  section: {
    gap: spacing.md,
  },
  disabledRow: {
    opacity: 0.62,
  },
  statsCard: {
    gap: spacing.lg,
  },
  statsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  statsCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  statsTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  statsMetric: {
    minWidth: 112,
  },
});
