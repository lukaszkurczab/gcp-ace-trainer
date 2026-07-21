import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  getTrackDisplays,
  type TrackDisplay,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadTrainingAttempts as getTrainingAttempts,
  selectActiveTrack as saveActiveTrackId,
} from "../../application/learningReadModels";
import { spacing, typography } from "../../theme";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/cloud-certification";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { AppStackHeader } from "../navigation/AppStackHeader";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";

import {
  buildTrackProgressPercent,
  getCurrentPracticeTopic,
  hasTrackProgress,
} from "../practice/practiceFlowModel";

type SelectTrackScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onboarding?: boolean;
  onTrackSelected?: (trackId: TrackId) => void;
};

type SelectTrackData = {
  attempts: CertificationExamSummaryViewModel[];
  practiceHistory: CertificationPracticeAnswerViewModel[];
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function SelectTrackScreen({ navigation, onboarding = false, onTrackSelected }: SelectTrackScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
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
          if (savedTrackId) setActiveTrackId(savedTrackId);
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

  async function selectTrack(track: TrackDisplay, destination: "home" | "roadmap") {
    if (track.status === "archived") {
      return;
    }

    await saveActiveTrackId(track.id);
    setActiveTrackId(track.id);

    if (destination === "home" && onTrackSelected) {
      onTrackSelected(track.id);
      return;
    }

    if (destination === "roadmap") {
      navigation.navigate(ROUTES.TOPIC_ROADMAP, { trackId: track.id });
      return;
    }

    navigation.navigate(ROUTES.HOME, { initialTab: "home" });
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader navigation={navigation} showBack={!onboarding} />

        {onboarding ? (
          <Card variant="tonal" style={styles.onboardingHero}>
            <IconTile name="grid" size={56} tone="primary" />
            <View style={styles.introCopy}>
              <Text style={styles.eyebrow}>{t("Welcome to Patternly")}</Text>
              <Text style={styles.onboardingTitle}>{t("Choose your learning path")}</Text>
              <Text style={styles.subtitle}>
                {t("Start with one path. You can switch whenever your goal changes.")}
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.intro}>
            <Text style={styles.title}>{t("Choose track")}</Text>
            <Text style={styles.subtitle}>
              Select the context for your next focused practice session.
            </Text>
          </View>
        )}

        <View style={styles.trackList}>
          {onboarding ? (
            <SectionHeader
              title={t("Available paths")}
              subtitle={t("Choose the kind of practice you want to begin with.")}
              tight
            />
          ) : null}
          {getTrackDisplays().map((track) => {
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
                    <Text style={styles.nextTopic}>{onboarding ? "Start with" : "Next"}: {topic.title}</Text>
                  </View>
                </View>
                {!onboarding ? (
                  <View style={styles.progressBlock}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{started ? "Progress" : "Not started"}</Text>
                      <Text style={styles.progressValue}>{progress}%</Text>
                    </View>
                    <ProgressBar progress={progress / 100} tone="primary" />
                  </View>
                ) : null}
                {onboarding ? (
                  <Button
                    disabled={track.status === "archived"}
                    onPress={() => void selectTrack(track, "home")}
                  >
                    Start {track.shortTitle}
                  </Button>
                ) : (
                  <View style={styles.actions}>
                    {!started ? (
                      <Button
                        onPress={() => void selectTrack(track, "roadmap")}
                        style={styles.actionButton}
                        variant="secondary"
                      >
                        {t("View track")}
                      </Button>
                    ) : null}
                    <Button
                      disabled={track.status === "archived"}
                      onPress={() => void selectTrack(track, "home")}
                      style={styles.actionButton}
                      variant={isActive ? "secondary" : "primary"}
                    >
                      {t(primaryLabel)}
                    </Button>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </Screen>
      <AppBottomNavigation activeId="home" navigation={navigation} />
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
  intro: {
    gap: spacing.sm,
  },
  onboardingHero: {
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  introCopy: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.primary,
    textTransform: "uppercase",
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  onboardingTitle: {
    ...typography.display,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
  },
  trackList: {
    gap: spacing.lg,
  },
  activeTrackCard: {
    borderColor: palette.primary,
  },
  trackAccent: {
    backgroundColor: palette.primary,
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
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  nextTopic: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
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
    color: palette.textSecondary,
  },
  progressValue: {
    ...typography.bodyStrong,
    color: palette.info,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
