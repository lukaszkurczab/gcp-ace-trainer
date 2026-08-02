import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import {
  Badge,
  AppShellHeader,
  Button,
  Card,
  EmptyState,
  Icon,
  IconTile,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import { getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import { goBackOrHome, type RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadTrainingAttempts as getTrainingAttempts,
} from "../../application/learningReadModels";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/algorithms";
import { spacing, typography } from "../../theme";
import {
  ALGORITHM_MODE_IDS,
} from "../../tracks/algorithms";
import { type CertificationModeId } from "../../tracks/cloud-certification";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";

import {
  buildPracticeModes,
  resolvePracticeTopic,
} from "./practiceFlowModel";
import {
  formatPracticeTopicDetail,
  formatPracticeTopicTitle,
} from "./practiceFlowPresentation";
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
  trainingAttempts: TrainingAttempt[];
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function PracticeHubScreen({ navigation, route }: PracticeHubScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [data, setData] = useState<PracticeHubData>({
    trainingAttempts: [],
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setHasLoadedData(false);
      setReadError(null);

      async function loadData() {
        try {
          const [savedTrackId, trainingAttemptsResult] = await Promise.all([
            getActiveTrackId(),
            getTrainingAttempts(),
          ]);

          if (isActive) {
            setActiveTrackId(savedTrackId ?? null);
            setData({ trainingAttempts: trainingAttemptsResult.value });
            setHasLoadedData(true);
          }
        } catch (error) {
          if (isActive) {
            setReadError(describeOperationalFailure(error, "Practice data is unavailable."));
            setHasLoadedData(true);
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (!hasLoadedData) return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice Hub")} /><LoadingState title={t("Preparing practice")} /></Screen>;
  if (readError) return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice Hub")} /><EmptyState title={t("Practice is unavailable")} description={t(readError)} /></Screen>;
  if (!activeTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(activeTrackId);
  const topic = resolvePracticeTopic({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts: data.trainingAttempts,
  });
  const modes = buildPracticeModes(activeTrack);
  function startSession(mode?: PracticeSessionMode | CertificationModeId) {
    const resolvedMode = mode ?? (
      activeTrack.id === "algorithms"
        ? ALGORITHM_MODE_IDS.guidedPractice
        : "certification-diagnostic-baseline"
    );
    if (activeTrack.id === "cloud-certification" && (resolvedMode === "certification-focus-practice" || resolvedMode === "certification-scenario-practice" || resolvedMode === "certification-weak-area-review" || resolvedMode === "certification-mixed-practice")) {
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, sessionLength: 10, source: "modeShortcut", trackId: activeTrack.id });
      return;
    }
    if (activeTrack.id === "cloud-certification" && resolvedMode === "certification-quick-review") {
      navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ mode: resolvedMode, source: "modeShortcut", topicId: "", trackId: activeTrack.id }));
      return;
    }
    if (activeTrack.id === "cloud-certification" && resolvedMode === "certification-exam-simulation") {
      navigation.navigate(ROUTES.EXAM);
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
    const practiceMode = resolvedMode as PracticeSessionMode;
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        mode: practiceMode,
        reviewSource: getGeneralPracticeReviewSource(practiceMode),
        source: mode === undefined ? "practiceHub" : "modeShortcut",
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.hubRoot()}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppShellHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t(activeTrack.title)}
        />

        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>{t("Choose your practice")}</Text>
          <Text style={styles.pageSubtitle}>
            {t("Start with the recommended session or choose a different format.")}
          </Text>
        </View>

        <Card variant="layered" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>{t("Recommended session")}</Text>
          <View style={[styles.heroHeading, largeText ? styles.heroHeadingLargeText : null]}>
            <IconTile
              name={activeTrack.id === "algorithms" ? "route" : "cloud"}
              size={48}
              tone={activeTrack.id === "algorithms" ? "primary" : "info"}
            />
            <Text style={styles.heroTitle}>
              {formatPracticeTopicTitle(topic.title, t)}
            </Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.heroDetail}>
            {formatPracticeTopicDetail(topic.detail, t)}
          </Text>
          <View style={styles.heroActions}>
            <Button
              onPress={() => startSession()}
              testID={runtimeSelectors.practice.startSession()}
            >
              {t("Start session")}
            </Button>
            <View style={styles.alternativeDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orLabel}>{t("or")}</Text>
              <View style={styles.dividerLine} />
            </View>
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
          <SectionHeader
            title={t("Other practice formats")}
            subtitle={t("Choose a format when the recommendation does not fit your goal.")}
            tight
          />
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

      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
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
  pageIntro: {
    gap: spacing.sm,
  },
  pageTitle: {
    ...typography.title,
    color: palette.textPrimary,
  },
  pageSubtitle: {
    ...typography.body,
    color: palette.textSecondary,
  },
  heroCard: {
    gap: spacing.xl,
  },
  heroEyebrow: {
    ...typography.caption,
    color: palette.accentPurple,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  heroHeadingLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  heroTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    flex: 1,
  },
  heroDetail: {
    ...typography.body,
    color: palette.textSecondary,
  },
  divider: {
    backgroundColor: palette.border,
    height: StyleSheet.hairlineWidth,
  },
  heroActions: {
    gap: spacing.xl,
  },
  alternativeDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dividerLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  settingsAction: {
    alignItems: "center",
    alignSelf: "center",
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
});
