import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
import { DEFAULT_TRACK_ID, getTrackDefinition, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import {
  getActiveTrackId,
  getAttempts,
  getPracticeHistory,
  getTrainingAttempts,
} from "../../storage";
import { colors, spacing, typography } from "../../theme";
import {
  loadCloudCertificationProgressViewModel,
  type CloudCertificationProgressViewModel,
} from "../../tracks/cloud-certification";
import type { AttemptSummary, PracticeAnswerRecord } from "../../types";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { AppStackHeader } from "../navigation/AppStackHeader";
import {
  buildPracticeModes,
  buildPracticeStatsSummary,
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  type PracticeTopic,
} from "./practiceFlowModel";
import {
  buildPracticeSessionConfig,
  type PracticeSessionMode,
} from "./sessionConfig";

type PracticeHubScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_HUB
>;

type PracticeHubData = {
  attempts: AttemptSummary[];
  cloudProgress: CloudCertificationProgressViewModel | null;
  practiceHistory: PracticeAnswerRecord[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function PracticeHubScreen({ navigation, route }: PracticeHubScreenProps) {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(DEFAULT_TRACK_ID);
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
          setActiveTrackId(savedTrackId);
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

  const activeTrack = getTrackDefinition(activeTrackId);
  const analytics = useMemo(
    () => buildAnalyticsData(data.attempts, data.practiceHistory),
    [data.attempts, data.practiceHistory],
  );
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

  function startSession(mode: PracticeSessionMode = "default") {
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        feedbackMode: mode === "practice" ? "atSessionEnd" : "afterEachAnswer",
        mode,
        sessionLength: mode === "practice" ? 40 : 20,
        source: mode === "default" ? "practiceHub" : "modeShortcut",
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader
          navigation={navigation}
          showBack
          subtitle={activeTrack.title}
        />

        <Card style={styles.topicStrip}>
          <View style={styles.topicCopy}>
            <Text style={styles.eyebrow}>Next topic</Text>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.mutedText}>{topic.detail}</Text>
          </View>
          <Button
            onPress={() => navigation.navigate(ROUTES.TOPIC_ROADMAP, { topicId: topic.id })}
            style={styles.compactButton}
            variant="ghost"
          >
            Change topic
          </Button>
        </Card>

        <Card variant="tonal" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Continue practice</Text>
          <SectionHeader
            title={topic.title}
            subtitle={`Current track: ${activeTrack.title}`}
            tight
          />
          <View style={styles.heroActions}>
            <Button onPress={() => startSession("default")}>
              Start session
            </Button>
            <Button
              onPress={() =>
                navigation.navigate(
                  ROUTES.PRACTICE_SETUP,
                  buildPracticeSessionConfig({
                    mode: "default",
                    source: "practiceHub",
                    topicId: topic.id,
                    trackId: activeTrack.id,
                  }),
                )
              }
              variant="secondary"
            >
              Manage settings
            </Button>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Other practice modes" tight />
          {modes.map((mode) => (
            <ListRow
              detail={mode.unavailableReason ?? mode.detail}
              key={mode.mode}
              leading={<IconTile name={mode.icon} tone={mode.enabled ? mode.tone : "muted"} />}
              onPress={mode.enabled ? () => startSession(mode.mode) : undefined}
              style={mode.enabled ? undefined : styles.disabledRow}
              title={mode.title}
              trailing={
                mode.enabled ? (
                  <Icon color={colors.dark.textMuted} name="chevron-right" size={18} />
                ) : (
                  <Badge label="Unavailable" tone="neutral" />
                )
              }
            />
          ))}
        </View>

        <Card variant="tonal" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsCopy}>
              <Text style={styles.statsTitle}>{stats.title}</Text>
              <Text style={styles.mutedText}>{stats.detail}</Text>
            </View>
            <MetricCard
              label={stats.metricLabel}
              style={styles.statsMetric}
              tone="primary"
              value={stats.metricValue}
            />
          </View>
          <Button
            onPress={() => navigation.navigate(ROUTES.HOME, { initialTab: "progress" })}
            variant="secondary"
          >
            More stats
          </Button>
        </Card>
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
}

function resolvePracticeTopic(input: {
  activeTrack: ReturnType<typeof getTrackDefinition>;
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

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.dark.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
  topicStrip: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topicCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  topicTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  compactButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.dark.primary,
    textTransform: "uppercase",
  },
  heroActions: {
    gap: spacing.md,
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
    color: colors.dark.textPrimary,
  },
  statsMetric: {
    minWidth: 112,
  },
});
