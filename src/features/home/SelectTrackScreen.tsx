import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  IconTile,
  ProgressBar,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinitions,
  type TrackDefinition,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import {
  getActiveTrackId,
  getAttempts,
  getPracticeHistory,
  getTrainingAttempts,
  saveActiveTrackId,
} from "../../storage";
import { colors, spacing, typography } from "../../theme";
import type { AttemptSummary, PracticeAnswerRecord } from "../../types";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { AppStackHeader } from "../navigation/AppStackHeader";
import {
  buildTrackProgressPercent,
  getCurrentPracticeTopic,
  hasTrackProgress,
} from "../practice/practiceFlowModel";

type SelectTrackScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.SELECT_TRACK
>;

type SelectTrackData = {
  attempts: AttemptSummary[];
  practiceHistory: PracticeAnswerRecord[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function SelectTrackScreen({ navigation }: SelectTrackScreenProps) {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(CLOUD_CERTIFICATION_TRACK_ID);
  const [data, setData] = useState<SelectTrackData>({
    attempts: [],
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
        ] = await Promise.all([
          getActiveTrackId(),
          getAttempts(),
          getPracticeHistory(),
          getTrainingAttempts(),
        ]);

        if (isActive) {
          setActiveTrackId(savedTrackId);
          setData({
            attempts: savedAttempts,
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

  async function selectTrack(track: TrackDefinition, destination: "home" | "roadmap") {
    if (track.status === "archived") {
      return;
    }

    await saveActiveTrackId(track.id);
    setActiveTrackId(track.id);

    if (destination === "roadmap") {
      navigation.navigate(ROUTES.TOPIC_ROADMAP);
      return;
    }

    navigation.navigate(ROUTES.HOME, { initialTab: "home" });
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader navigation={navigation} showBack />

        <View style={styles.intro}>
          <Text style={styles.title}>Choose track</Text>
          <Text style={styles.subtitle}>
            Select the context for your next focused practice session.
          </Text>
        </View>

        <View style={styles.trackList}>
          {getTrackDefinitions().map((track) => {
            const isActive = track.id === activeTrackId;
            const progress = buildTrackProgressPercent({
              activeTrackId: track.id,
              analytics,
              trainingAttempts: data.trainingAttempts,
            });
            const started = hasTrackProgress({
              activeTrackId: track.id,
              analytics,
              trainingAttempts: data.trainingAttempts,
            });
            const topic = getCurrentPracticeTopic(track, data.trainingAttempts);
            const primaryLabel = isActive ? "Continue" : started ? "Select" : "Start track";

            return (
              <Card key={track.id} style={isActive ? styles.activeTrackCard : undefined}>
                <View style={styles.trackAccent} />
                <SectionHeader
                  title={track.title}
                  subtitle={track.description}
                />
                <View style={styles.trackMetaRow}>
                  <IconTile
                    name={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "cloud" : "route"}
                    tone={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "info" : "primary"}
                  />
                  <View style={styles.trackMetaCopy}>
                    <Text style={styles.trackCategory}>{track.subtitle}</Text>
                    <Text style={styles.nextTopic}>Next: {topic.title}</Text>
                  </View>
                </View>
                <View style={styles.progressBlock}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{started ? "Progress" : "Readiness"}</Text>
                    <Text style={styles.progressValue}>{progress}%</Text>
                  </View>
                  <ProgressBar progress={progress / 100} tone="primary" />
                </View>
                <View style={styles.actions}>
                  {!started ? (
                    <Button
                      onPress={() => void selectTrack(track, "roadmap")}
                      style={styles.actionButton}
                      variant="secondary"
                    >
                      View track
                    </Button>
                  ) : null}
                  <Button
                    disabled={track.status === "archived"}
                    onPress={() => void selectTrack(track, "home")}
                    style={styles.actionButton}
                    variant={isActive ? "secondary" : "primary"}
                  >
                    {primaryLabel}
                  </Button>
                </View>
              </Card>
            );
          })}
        </View>
      </Screen>
      <AppBottomNavigation activeId="home" navigation={navigation} />
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
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  trackList: {
    gap: spacing.lg,
  },
  activeTrackCard: {
    borderColor: colors.dark.primary,
  },
  trackAccent: {
    backgroundColor: colors.dark.primary,
    borderRadius: 999,
    height: 3,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg,
    top: 0,
  },
  trackMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  trackMetaCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  trackCategory: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  nextTopic: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  progressValue: {
    ...typography.bodyStrong,
    color: colors.dark.info,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
