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
  ScreenHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import { contentPackagePinsEqual, getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import { goBackOrHome, type RootStackParamList } from "../../navigation";
import {
  loadActiveTrackId as getActiveTrackId,
  loadTrainingAttempts as getTrainingAttempts,
  loadReviewQueueItems,
} from "../../application/learningReadModels";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/coding-interview";
import { colorWithOpacity, radius, spacing, typography } from "../../theme";
import {
  ALGORITHM_MODE_IDS,
} from "../../tracks/coding-interview";
import { type CertificationModeId } from "../../tracks/certification";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";

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
  hasReviewEvidence: boolean;
};

const TAB_BAR_RESERVED_HEIGHT = 128;

export function PracticeHubScreen({ navigation, route }: PracticeHubScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colorMode, colors: palette, t } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [data, setData] = useState<PracticeHubData>({
    trainingAttempts: [],
    hasReviewEvidence: false,
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setHasLoadedData(false);
      setReadError(null);

      async function loadData() {
        try {
          const [savedTrackId, trainingAttemptsResult, reviewResult] = await Promise.all([
            getActiveTrackId(),
            getTrainingAttempts(),
            loadReviewQueueItems(),
          ]);

          if (isActive) {
            const packagePin = savedTrackId
              ? contentPackageRuntimeOwner.getPreparedDiscovery(savedTrackId).package.packagePin
              : null;
            const now = Date.now();
            setActiveTrackId(savedTrackId ?? null);
            setData({
              trainingAttempts: trainingAttemptsResult.value,
              hasReviewEvidence: packagePin !== null && reviewResult.value.some((entry) =>
                entry.trackId === savedTrackId &&
                contentPackagePinsEqual(entry.sourceItem.packagePin, packagePin) &&
                Date.parse(entry.dueAt) <= now
              ),
            });
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
  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile;
  if (route.params?.topicId !== undefined && route.params.topicId !== packageProfile.freeNodeId) return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice Hub")} /><EmptyState title={t("Practice is unavailable")} description={t("This topic is not available in the installed Free package.")} /></Screen>;
  const isCodingInterviewTrack = activeTrack.id === "coding-interview-dsa-problem-solving";
  const isDesignInterviewTrack = activeTrack.familyId === "design_interview";
  const topic = resolvePracticeTopic({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts: data.trainingAttempts,
  });
  const modes = buildPracticeModes(activeTrack, data.hasReviewEvidence);
  const primaryMode = modes[0]!;
  const topicDetail = formatPracticeTopicDetail(topic.detail, t);
  function startSession(mode?: PracticeSessionMode | CertificationModeId) {
    const resolvedMode = mode ?? (
      isCodingInterviewTrack
        ? ALGORITHM_MODE_IDS.learnApproach
        : isDesignInterviewTrack
          ? packageProfile.primaryEntry.modeId as PracticeSessionMode
          : "certification-focus-practice"
    );
    if (isDesignInterviewTrack) {
      navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ mode: resolvedMode as PracticeSessionMode, source: mode === undefined ? "practiceHub" : "modeShortcut", topicId: topic.id, trackId: activeTrack.id }));
      return;
    }
    if (activeTrack.familyId === "certification" && (resolvedMode === "certification-focus-practice" || resolvedMode === "certification-scenario-practice" || resolvedMode === "certification-weak-area-review" || resolvedMode === "certification-mixed-practice")) {
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, sessionLength: 10, source: "modeShortcut", topicId: topic.id, trackId: activeTrack.id });
      return;
    }
    if (activeTrack.familyId === "certification" && resolvedMode === "certification-quick-review") {
      navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ mode: resolvedMode, source: "modeShortcut", topicId: "", trackId: activeTrack.id }));
      return;
    }
    if (activeTrack.familyId === "certification" && resolvedMode === "certification-exam-simulation") {
      navigation.navigate(ROUTES.EXAM);
      return;
    }
    if (isCodingInterviewTrack && resolvedMode === ALGORITHM_MODE_IDS.interviewSimulation) {
      const entry = getAlgorithmsInterviewSimulationEntry();
      navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: entry.profileId });
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
      <Screen ambient={colorMode === "dark"} edges={["top"]} style={styles.screenContent}>
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>{t("Practice")}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            style={({ pressed }) => [styles.trackContext, pressed ? styles.pressed : null]}
          >
            <View style={styles.trackContextCopy}>
              <IconTile name={isCodingInterviewTrack || isDesignInterviewTrack ? "code-brackets" : "cloud"} size={22} tone="primary" />
              <Text style={styles.trackContextTitle}>{t(activeTrack.shortTitle)}</Text>
            </View>
            <Text style={styles.changeTrack}>{t("Change")}</Text>
          </Pressable>
          <View accessibilityLabel={topicDetail} style={styles.topicContext}>
            <View style={styles.topicDot} />
            <Text style={styles.topicContextText}>{formatPracticeTopicTitle(topic.title, t)}</Text>
          </View>
        </View>

        <Card variant="layered" style={styles.heroCard}>
          <View style={styles.cardRail} />
          <View style={styles.heroText}>
            <View style={[styles.heroHeading, largeText ? styles.heroHeadingLargeText : null]}>
              <Text style={styles.heroTitle}>
                {t(primaryMode.title)}
              </Text>
            </View>
            <Text style={styles.heroDetail}>
              {t(primaryMode.detail)}
            </Text>
          </View>
          <View style={styles.heroActions}>
            <Button
              onPress={() => startSession()}
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
                    ...(isCodingInterviewTrack ? { feedbackMode: "afterEachAnswer" as const, mode: ALGORITHM_MODE_IDS.customPractice } : isDesignInterviewTrack ? { mode: packageProfile.primaryEntry.modeId as PracticeSessionMode } : { mode: "certification-focus-practice" as const }),
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
                testID={isCodingInterviewTrack ? runtimeSelectors.practice.customEntry() : undefined}
              >
                {t(isCodingInterviewTrack ? "Custom Practice" : "Manage settings")}
              </Text>
            </Pressable>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("More ways to practice")}</Text>
          </View>
          <View style={styles.modeList}>
            {modes.map((mode, index) => (
              <ListRow
                detail={t(mode.unavailableReason ?? mode.detail)}
                key={mode.mode}
                leading={<IconTile iconSize={24} name={mode.icon} size={32} tone={mode.enabled ? (isCodingInterviewTrack ? "settings" : mode.tone) : "muted"} />}
                onPress={mode.enabled ? () => startSession(mode.mode) : undefined}
                style={[styles.modeRow, index === modes.length - 1 ? styles.modeRowLast : null, mode.enabled ? null : styles.disabledRow]}
                testID={runtimeSelectors.practice.modeCard(mode.mode)}
                title={t(mode.title)}
                trailing={
                  mode.enabled ? (
                    <Icon color={palette.textMuted} name="chevron-right" size={20} />
                  ) : (
                    <Badge label={t("Unavailable")} tone="neutral" />
                  )
                }
                variant="grouped"
              />
            ))}
          </View>
        </View>

      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: "transparent",
    flex: 1,
  },
  screenContent: {
    gap: 18,
    paddingBottom: TAB_BAR_RESERVED_HEIGHT,
  },
  pageIntro: {
    gap: 18,
  },
  pageTitle: {
    ...typography.title,
    color: palette.textPrimary,
  },
  trackContext: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  trackContextCopy: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  trackContextTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  changeTrack: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  topicContext: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  topicDot: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  topicContextText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderColor: colorWithOpacity(palette.primary, 0.28),
    borderRadius: 22,
    elevation: 0,
    gap: spacing.lg,
    padding: spacing.xl,
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    position: "relative",
  },
  cardRail: {
    backgroundColor: palette.primary,
    borderRadius: 2,
    height: 44,
    left: -1,
    position: "absolute",
    top: 19,
    width: 3,
  },
  heroText: {
    gap: 6,
  },
  heroHeading: {
    minHeight: 24,
  },
  heroHeadingLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  heroTitle: {
    color: palette.textPrimary,
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  heroDetail: {
    color: palette.textSecondary,
    fontSize: 13.5,
    fontWeight: "400",
    lineHeight: 19,
  },
  heroActions: {
    gap: spacing.lg,
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
    color: palette.primary,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 16,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    paddingTop: 6,
  },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  modeList: {
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: palette.elevatedSurface,
    overflow: "hidden",
  },
  modeRow: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 0,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  modeRowLast: {
    borderBottomWidth: 0,
  },
  disabledRow: {
    opacity: 0.62,
  },
});
