import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  Button,
  Card,
  AppShellHeader,
  IconTile,
  ProgressBar,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  getTrackDisplays,
  type TrackDisplay,
  type TrackId,
} from "../../domain";
import type { TrainingAttempt } from "../../domain";
import { goBackOrHome, type RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadExamSummaries as getAttempts,
  loadPracticeHistory as getPracticeHistory,
  loadTrainingAttempts as getTrainingAttempts,
  selectActiveTrack as saveActiveTrackId,
} from "../../application/learningReadModels";
import { spacing, typography } from "../../theme";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../tracks/certification";
import { buildAnalyticsData } from "../analytics/analyticsService";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

import {
  buildTrackProgressPercent,
  getCurrentPracticeTopic,
  hasTrackProgress,
} from "../practice/practiceFlowModel";
import { formatPracticeTopicTitle } from "../practice/practiceFlowPresentation";

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
  const { fontScale } = useWindowDimensions();
  const { t } = useAppPreferences();
  const largeText = fontScale >= 1.3;
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
        <AppShellHeader backAction={onboarding ? undefined : { onPress: () => goBackOrHome(navigation) }} />

        <View style={styles.intro}>
          {onboarding ? <Text style={styles.eyebrow}>{t("Welcome to Patternly")}</Text> : null}
          <Text style={styles.title}>{t("Choose a track")}</Text>
          <Text style={styles.subtitle}>
            {t(onboarding
              ? "Start with one track. You can switch whenever your goal changes."
              : "Choose a track for your next focused practice session.")}
          </Text>
        </View>

        <View style={styles.trackList}>
          {onboarding ? (
            <SectionHeader
              title={t("Available tracks")}
              subtitle={t("Choose what you want to practice first.")}
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
            const isCertificationTrack = track.familyId === "certification";

            return (
              <Card
                key={track.id}
                style={isActive ? styles.activeTrackCard : undefined}
                variant="layered"
              >
                <View style={styles.trackAccent} />
                <SectionHeader
                  title={t(track.title)}
                  subtitle={t(track.description)}
                />
                <View style={[styles.trackMetaRow, largeText ? styles.trackMetaRowLargeText : null]}>
                  <IconTile
                    name={isCertificationTrack ? "cloud" : "route"}
                    tone={isCertificationTrack ? "info" : "primary"}
                  />
                  <View style={styles.trackMetaCopy}>
                    <Text style={styles.trackCategory}>{t(track.shortTitle)}</Text>
                    <Text style={styles.nextTopic}>{t(onboarding ? "Start with" : "Next")}: {formatPracticeTopicTitle(topic.title, t)}</Text>
                  </View>
                </View>
                {!onboarding ? (
                  <View style={styles.progressBlock}>
                    <View style={[styles.progressHeader, largeText ? styles.progressHeaderLargeText : null]}>
                      <Text style={styles.progressLabel}>{t(started ? "Progress" : "Not started")}</Text>
                      <Text style={styles.progressValue}>{progress}%</Text>
                    </View>
                    <ProgressBar progress={progress / 100} tone="primary" />
                  </View>
                ) : null}
                {onboarding ? (
                  <Button
                    disabled={track.status === "archived"}
                    onPress={() => void selectTrack(track, "home")}
                    testID={runtimeSelectors.home.selectTrack(track.id)}
                  >
                    {t("Start")} {t(track.shortTitle)}
                  </Button>
                ) : (
                  <View style={[styles.actions, largeText ? styles.actionsLargeText : null]}>
                    {!started ? (
                      <Button
                        onPress={() => void selectTrack(track, "roadmap")}
                        style={[styles.actionButton, largeText ? styles.actionButtonLargeText : null]}
                        variant="secondary"
                      >
                        {t("View track")}
                      </Button>
                    ) : null}
                    <Button
                      disabled={track.status === "archived"}
                      onPress={() => void selectTrack(track, "home")}
                      style={[styles.actionButton, largeText ? styles.actionButtonLargeText : null]}
                      testID={runtimeSelectors.home.selectTrack(track.id)}
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
  eyebrow: {
    ...typography.caption,
    color: palette.primary,
    textTransform: "uppercase",
  },
  title: {
    ...typography.title,
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
  trackMetaRowLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
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
  progressHeaderLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "flex-start",
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
  actionsLargeText: {
    flexDirection: "column",
  },
  actionButton: {
    flex: 1,
  },
  actionButtonLargeText: {
    flex: 0,
    width: "100%",
  },
});
