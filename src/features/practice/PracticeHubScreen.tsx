import { getTrackIconName } from "../../components/trackIcon";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import {
  Badge,
  AppShellHeader,
  Button,
  Card,
  EmptyState,
  Icon,
  IconTile,
  InfoBlock,
  ListRow,
  Screen,
  SkeletonShape,
  useSkeletonGlassMotion,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import { FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, getTrackDisplay } from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
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
import { getTrackRoadmapCatalog } from "./trackRoadmapCatalog";
import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { resolveCertificationExamAccess } from "./certificationExamAccess";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { getProductSimulationModeConfig } from "../../content/canonical/productModeConfig";
import { isDesignInterviewModeId } from "../../tracks/design-interview";

import {
  buildPracticeModes,
  getCanonicalFreePracticeNodeId,
  resolvePracticeTopic,
} from "./practiceFlowModel";
import { usePracticeReadModel } from "./usePracticeReadModel";
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

export function PracticeHubLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Preparing practice")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.practiceHubLoading}
      testID="practice-hub-loading-skeleton"
    >
      <Text accessible={false} maxFontSizeMultiplier={2} style={styles.pageTitle}>{t("Practice")}</Text>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.practiceHubLoadingShapes}>
        <View style={styles.practiceHubLoadingIntro}>
          <View style={styles.practiceHubLoadingTrackContext}>
            <SkeletonShape motion={motion} style={styles.practiceHubLoadingTrackIcon} />
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingTrackTitle, { height: 18 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingTrackAction, { height: 13 * textScale }]} />
          </View>
          <View style={styles.practiceHubLoadingTopicContext}>
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingTopicLabel, { height: 12 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingTopicTitle, { height: 16 * textScale }]} />
          </View>
        </View>
        <View style={styles.practiceHubLoadingHeroCard}>
          <SkeletonShape motion={motion} style={styles.practiceHubLoadingRail} />
          <View style={styles.practiceHubLoadingHeroText}>
            <View style={[styles.practiceHubLoadingHeroHeading, largeLayout ? styles.practiceHubLoadingHeroHeadingLarge : null]}>
              <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingHeroTitle, { height: 21 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingHeroDetail, { height: 14 * textScale }]} />
          </View>
          <View style={styles.practiceHubLoadingHeroActions}>
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingAction, { minHeight: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingSettingsAction, { height: 16 * textScale }]} />
          </View>
        </View>
        <View style={styles.practiceHubLoadingSection}>
          <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingSectionTitle, { height: 13 * textScale }]} />
          <View style={styles.practiceHubLoadingModeList}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={[styles.practiceHubLoadingModeRow, largeLayout ? styles.practiceHubLoadingModeRowLarge : null]}>
                <SkeletonShape motion={motion} style={styles.practiceHubLoadingModeIcon} />
                <View style={styles.practiceHubLoadingModeCopy}>
                  <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingModeTitle, { height: 15 * textScale }]} />
                  <SkeletonShape motion={motion} style={[styles.practiceHubLoadingLine, styles.practiceHubLoadingModeDetail, { height: 12 * textScale }]} />
                </View>
                <SkeletonShape motion={motion} style={styles.practiceHubLoadingChevron} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function PracticeHubScreen({ navigation, route }: PracticeHubScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const account = usePatternlyAccount();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const examAdmissionPendingRef = useRef(false);
  const [examAdmissionPending, setExamAdmissionPending] = useState(false);
  const [examAccessUnavailable, setExamAccessUnavailable] = useState(false);
  const codingAdmissionPendingRef = useRef(false);
  const [codingAdmissionPending, setCodingAdmissionPending] = useState(false);
  const [codingAccessUnavailable, setCodingAccessUnavailable] = useState(false);
  const designAdmissionPendingRef = useRef(false);
  const [designAdmissionPending, setDesignAdmissionPending] = useState(false);
  const [designAccessUnavailable, setDesignAccessUnavailable] = useState(false);
  const [designAdmissionMode, setDesignAdmissionMode] = useState<PracticeSessionMode | null>(null);
  const { readState, requestKey, retry } = usePracticeReadModel({
    errorFallback: t("We couldn’t load your practice options."),
    includeReviews: true,
    requestedTrackId: route.params?.trackId,
  });

  function renderUnavailable(
    description: string,
    actionLabel = t("Back"),
    onActionPress = () => goBackOrHome(navigation),
    title = t("Practice is unavailable"),
  ) {
    return (
      <View style={styles.shell}>
        <Screen edges={["top"]} style={styles.screenContent}>
          <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice Hub")} />
          <EmptyState actionLabel={actionLabel} onActionPress={onActionPress} title={title} description={description} />
        </Screen>
        <AppBottomNavigation activeId="practice" navigation={navigation} />
      </View>
    );
  }

  if (readState.requestKey !== requestKey || readState.kind === "pending") return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice Hub")} />
        <PracticeHubLoadingSkeleton />
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
  if (readState.kind === "unavailable") return renderUnavailable(t(readState.reason), t("Try again"), retry);
  const { activeTrackId, hasReviewEvidence, trainingAttempts } = readState;
  if (!activeTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  let activeTrack: ReturnType<typeof getTrackDisplay>;
  let canonicalNodeId: string;
  try {
    activeTrack = getTrackDisplay(activeTrackId);
    canonicalNodeId = getCanonicalFreePracticeNodeId(activeTrack.id);
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("Practice data is unavailable.")));
  }
  if (route.params?.topicId !== undefined && route.params.topicId !== canonicalNodeId) {
    const requestedTopicTitle = getTrackRoadmapCatalog(activeTrack.id).find((topic) => topic.id === route.params?.topicId)?.title
      ?? route.params.topicId.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
    return renderUnavailable(
      t("This topic is not included in your free content."),
      t("Choose another topic"),
      () => navigation.navigate(ROUTES.TOPIC_ROADMAP, { topicId: canonicalNodeId, trackId: activeTrack.id }),
      requestedTopicTitle,
    );
  }
  const isCodingInterviewTrack = activeTrack.id === "coding-interview-dsa-problem-solving";
  const isDesignInterviewTrack = activeTrack.familyId === "design_interview";
  let topic: ReturnType<typeof resolvePracticeTopic>;
  let modes: ReturnType<typeof buildPracticeModes>;
  try {
    topic = resolvePracticeTopic({
      activeTrackId: activeTrack.id,
      routeTopicId: route.params?.topicId,
      trainingAttempts,
    });
    modes = buildPracticeModes(activeTrack, hasReviewEvidence);
  } catch (error) {
    return renderUnavailable(describeOperationalFailure(error, t("Practice data is unavailable.")));
  }
  const primaryMode = modes[0]!;
  const secondaryModes = modes.filter((mode) => mode.mode !== primaryMode.mode && mode.mode !== ALGORITHM_MODE_IDS.customPractice);
  const topicDetail = formatPracticeTopicDetail(topic.detail, t);
  function startSession(mode?: PracticeSessionMode | CertificationModeId, source: "practiceHub" | "modeShortcut" = mode === undefined ? "practiceHub" : "modeShortcut") {
    const resolvedMode = mode ?? primaryMode.mode;
    if (isCodingInterviewTrack && resolvedMode === ALGORITHM_MODE_IDS.customPractice) {
      navigation.navigate(ROUTES.PRACTICE_SETUP, {
        mode: resolvedMode,
        source,
        topicId: topic.id,
        trackId: activeTrack.id,
      });
      return;
    }
    if (isDesignInterviewTrack) {
      if (isDesignInterviewModeId(resolvedMode)) {
        if (designAdmissionPendingRef.current) return;
        designAdmissionPendingRef.current = true;
        setDesignAdmissionPending(true);
        setDesignAccessUnavailable(false);
        setDesignAdmissionMode(resolvedMode);
        void account.authorizePremiumSessionStart()
          .then((admission) => {
            switch (resolveCertificationExamAccess(admission)) {
              case "startExam": {
                if (resolvedMode !== "design-interview-simulation") {
                  navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, source, topicId: topic.id, trackId: activeTrack.id });
                  return;
                }
                const track = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).track;
                const { profile } = getProductSimulationModeConfig(activeTrack.id, track.simulationProfiles);
                navigation.navigate(ROUTES.DESIGN_INTERVIEW_SIMULATION, { trackId: activeTrack.id, profileId: profile.profileId });
                return;
              }
              case "purchasePremium":
                navigation.navigate(ROUTES.PREMIUM_PURCHASE);
                return;
              case "retryAdmission":
                setDesignAccessUnavailable(true);
                return;
            }
          })
          .catch(() => setDesignAccessUnavailable(true))
          .finally(() => { designAdmissionPendingRef.current = false; setDesignAdmissionPending(false); });
        return;
      }
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode as PracticeSessionMode, source, topicId: topic.id, trackId: activeTrack.id });
      return;
    }
    if (activeTrack.familyId === "certification" && resolvedMode === "certification-diagnostic-baseline") {
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, source: "modeShortcut", topicId: canonicalNodeId, trackId: activeTrack.id });
      return;
    }
    if (activeTrack.familyId === "certification" && (resolvedMode === "certification-focus-practice" || resolvedMode === "certification-scenario-practice" || resolvedMode === "certification-weak-area-review" || resolvedMode === "certification-mixed-practice")) {
      navigation.navigate(ROUTES.PRACTICE_SETUP, { mode: resolvedMode, source: "modeShortcut", topicId: topic.id, trackId: activeTrack.id,
        ...(resolvedMode === "certification-weak-area-review" && readState.kind === "ready" && readState.reviewSource ? { reviewSource: readState.reviewSource } : {}) });
      return;
    }
    if (activeTrack.familyId === "certification" && resolvedMode === "certification-quick-review") {
      navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ mode: resolvedMode, source: "modeShortcut", topicId: "", trackId: activeTrack.id,
        ...(readState.kind === "ready" && readState.reviewSource ? { reviewSource: readState.reviewSource } : {}) }));
      return;
    }
    if (activeTrack.familyId === "certification" && resolvedMode === "certification-exam-simulation") {
      if (examAdmissionPendingRef.current) return;
      examAdmissionPendingRef.current = true;
      setExamAdmissionPending(true);
      setExamAccessUnavailable(false);
      void account.authorizePremiumSessionStart()
        .then((admission) => {
          switch (resolveCertificationExamAccess(admission)) {
            case "startExam":
              navigation.navigate(ROUTES.EXAM);
              return;
            case "purchasePremium":
              navigation.navigate(ROUTES.PREMIUM_PURCHASE);
              return;
            case "retryAdmission":
              setExamAccessUnavailable(true);
              return;
          }
        })
        .catch(() => setExamAccessUnavailable(true))
        .finally(() => {
          examAdmissionPendingRef.current = false;
          setExamAdmissionPending(false);
        });
      return;
    }
    if (isCodingInterviewTrack && resolvedMode === ALGORITHM_MODE_IDS.interviewSimulation) {
      if (codingAdmissionPendingRef.current) return;
      codingAdmissionPendingRef.current = true;
      setCodingAdmissionPending(true);
      setCodingAccessUnavailable(false);
      void account.authorizePremiumSessionStart()
        .then((admission) => {
          switch (resolveCertificationExamAccess(admission)) {
            case "startExam": {
              const entry = getAlgorithmsInterviewSimulationEntry();
              navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: entry.profileId });
              return;
            }
            case "purchasePremium":
              navigation.navigate(ROUTES.PREMIUM_PURCHASE);
              return;
            case "retryAdmission":
              setCodingAccessUnavailable(true);
              return;
          }
        })
        .catch(() => setCodingAccessUnavailable(true))
        .finally(() => {
          codingAdmissionPendingRef.current = false;
          setCodingAdmissionPending(false);
        });
      return;
    }
    const practiceMode = resolvedMode as PracticeSessionMode;
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        mode: practiceMode,
        reviewSource: (readState.kind === "ready" ? readState.reviewSource : undefined) ?? getGeneralPracticeReviewSource(practiceMode),
        source,
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.hubRoot()}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <View style={styles.pageIntro}>
          <Text maxFontSizeMultiplier={2} style={styles.pageTitle}>{t("Practice")}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate(ROUTES.SELECT_TRACK)}
            style={({ pressed }) => [styles.trackContext, pressed ? styles.pressed : null]}
          >
            <View style={styles.trackContextCopy}>
              <IconTile name={activeTrack.id === FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID ? getTrackIconName(activeTrack.id) : isCodingInterviewTrack || isDesignInterviewTrack ? "code-brackets" : "cloud"} iconSize={22} size={32} tone="primary" />
              <Text maxFontSizeMultiplier={2} style={styles.trackContextTitle}>{t(activeTrack.shortTitle)}</Text>
            </View>
            <Text maxFontSizeMultiplier={2} style={styles.changeTrack}>{t("Change")}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${t("Active topic")}: ${formatPracticeTopicTitle(topic.title, t)}. ${topicDetail}. ${t("Change topic")}`}
            accessibilityRole="button"
            onPress={() => navigation.navigate(ROUTES.TOPIC_ROADMAP, { topicId: topic.id, trackId: activeTrack.id })}
            style={({ pressed }) => [styles.topicContext, pressed ? styles.pressed : null]}
          >
            <Text maxFontSizeMultiplier={2} style={styles.topicContextLabel}>{t("Active topic")}</Text>
            <View style={styles.topicContextRow}>
              <Text maxFontSizeMultiplier={2} style={styles.topicContextText}>{formatPracticeTopicTitle(topic.title, t)}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.changeTopic}>{t("Change topic")}</Text>
            </View>
          </Pressable>
        </View>

        <Card variant="layered" style={styles.heroCard}>
          <View style={styles.cardRail} />
          <View style={styles.heroText}>
            <View style={[styles.heroHeading, largeText ? styles.heroHeadingLargeText : null]}>
              <Text maxFontSizeMultiplier={2} style={styles.heroTitle}>
                {t(primaryMode.title)}
              </Text>
            </View>
            {primaryMode.detail ? <Text maxFontSizeMultiplier={2} style={styles.heroDetail}>{t(primaryMode.detail)}</Text> : null}
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
              onPress={() => {
                if (isCodingInterviewTrack) {
                  startSession(ALGORITHM_MODE_IDS.customPractice, "practiceHub");
                  return;
                }
                if (isDesignInterviewTrack) {
                  startSession(primaryMode.mode as PracticeSessionMode, "practiceHub");
                  return;
                }
                navigation.navigate(
                  ROUTES.PRACTICE_SETUP,
                  buildPracticeSessionConfig({
                    mode: isDesignInterviewTrack ? (modes[0]?.mode as PracticeSessionMode) : "certification-focus-practice",
                    source: "practiceHub",
                    topicId: topic.id,
                    trackId: activeTrack.id,
                  }),
                );
              }}
              style={({ pressed }) => [styles.settingsAction, pressed ? styles.settingsActionPressed : null]}
              testID={runtimeSelectors.practice.openSetup()}
            >
              <Text
                maxFontSizeMultiplier={2}
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
            <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("More ways to practice")}</Text>
          </View>
          <View style={styles.modeList}>
            {secondaryModes.map((mode, index) => (
              <ListRow
                detail={!mode.enabled && mode.unavailableReason ? t(mode.unavailableReason) : undefined}
                key={mode.mode}
                leading={<IconTile iconSize={24} name={mode.icon} size={32} tone={mode.enabled ? (isCodingInterviewTrack ? "settings" : mode.tone) : "muted"} />}
                onPress={mode.enabled ? () => startSession(mode.mode) : undefined}
                disabled={(mode.mode === "certification-exam-simulation" && examAdmissionPending) || (mode.mode === ALGORITHM_MODE_IDS.interviewSimulation && codingAdmissionPending) || (isDesignInterviewModeId(mode.mode) && designAdmissionPending)}
                style={[styles.modeRow, index === secondaryModes.length - 1 ? styles.modeRowLast : null, mode.enabled ? null : styles.disabledRow]}
                testID={runtimeSelectors.practice.modeCard(mode.mode)}
                title={t(mode.title)}
                titleNumberOfLines={0}
                trailing={
                  mode.mode === "certification-exam-simulation" || mode.mode === ALGORITHM_MODE_IDS.interviewSimulation || isDesignInterviewModeId(mode.mode) ? (
                    <View style={styles.examModeTrailing}>
                      <Badge label={t("Premium")} tone="info" />
                      {(mode.mode === "certification-exam-simulation" ? examAdmissionPending : mode.mode === ALGORITHM_MODE_IDS.interviewSimulation ? codingAdmissionPending : designAdmissionPending) ? (
                        <ActivityIndicator accessibilityLabel={t("Checking Premium access…")} size="small" color={palette.textMuted} />
                      ) : (
                        <Icon color={palette.textMuted} name="chevron-right" size={20} />
                      )}
                    </View>
                  ) : mode.enabled ? (
                    <Icon color={palette.textMuted} name="chevron-right" size={20} />
                  ) : (
                    <Badge label={t("Unavailable")} tone="neutral" />
                  )
                }
                variant="grouped"
              />
            ))}
          </View>
          {examAccessUnavailable ? (
            <View style={styles.examAccessError}>
              <InfoBlock
                accessibilityAlert
                body={t("We couldn't verify Premium access. Check your connection and try again.")}
                testID="practice-exam-access-error"
                title={t("Premium access unavailable")}
                tone="warning"
              />
              <Button
                onPress={() => startSession("certification-exam-simulation")}
                variant="ghost"
              >
                {t("Try again")}
              </Button>
            </View>
          ) : null}
          {codingAccessUnavailable ? (
            <View style={styles.examAccessError}>
              <InfoBlock
                accessibilityAlert
                body={t("We couldn't verify Premium access. Check your connection and try again.")}
                testID="practice-coding-mock-access-error"
                title={t("Premium access unavailable")}
                tone="warning"
              />
              <Button onPress={() => startSession(ALGORITHM_MODE_IDS.interviewSimulation)} variant="ghost">
                {t("Try again")}
              </Button>
            </View>
          ) : null}
          {designAccessUnavailable ? (
            <View style={styles.examAccessError}>
              <InfoBlock accessibilityAlert body={t("We couldn't verify Premium access. Check your connection and try again.")} testID="practice-design-simulation-access-error" title={t("Premium access unavailable")} tone="warning" />
              <Button onPress={() => designAdmissionMode && startSession(designAdmissionMode)} variant="ghost">{t("Try again")}</Button>
            </View>
          ) : null}
        </View>

      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  practiceHubLoading: {
    gap: spacing.lg,
    width: "100%",
  },
  practiceHubLoadingShapes: {
    gap: spacing.xl,
    width: "100%",
  },
  practiceHubLoadingIntro: {
    gap: spacing.lg,
  },
  practiceHubLoadingTrackContext: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 44,
  },
  practiceHubLoadingTrackIcon: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.md,
    height: 32,
    width: 32,
  },
  practiceHubLoadingLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
  },
  practiceHubLoadingTrackTitle: {
    flex: 1,
    width: "50%",
  },
  practiceHubLoadingTrackAction: {
    width: "18%",
  },
  practiceHubLoadingTopicContext: {
    gap: spacing.xxs,
  },
  practiceHubLoadingTopicLabel: {
    width: "24%",
  },
  practiceHubLoadingTopicTitle: {
    width: "72%",
  },
  practiceHubLoadingHeroCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    position: "relative",
  },
  practiceHubLoadingRail: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.xs,
    height: 44,
    left: -1,
    position: "absolute",
    top: 19,
    width: 3,
  },
  practiceHubLoadingHeroText: {
    gap: spacing.sm,
  },
  practiceHubLoadingHeroHeading: {
    minHeight: 24,
  },
  practiceHubLoadingHeroHeadingLarge: {
    minHeight: 48,
  },
  practiceHubLoadingHeroTitle: {
    width: "72%",
  },
  practiceHubLoadingHeroDetail: {
    width: "90%",
  },
  practiceHubLoadingHeroActions: {
    gap: spacing.lg,
  },
  practiceHubLoadingAction: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.button,
    width: "100%",
  },
  practiceHubLoadingSettingsAction: {
    alignSelf: "center",
    width: "35%",
  },
  practiceHubLoadingSection: {
    gap: spacing.sm,
  },
  practiceHubLoadingSectionTitle: {
    width: "48%",
  },
  practiceHubLoadingModeList: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  practiceHubLoadingModeRow: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  practiceHubLoadingModeRowLarge: {
    alignItems: "flex-start",
  },
  practiceHubLoadingModeIcon: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.md,
    height: 32,
    width: 32,
  },
  practiceHubLoadingModeCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  practiceHubLoadingModeTitle: {
    width: "66%",
  },
  practiceHubLoadingModeDetail: {
    width: "88%",
  },
  practiceHubLoadingChevron: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    height: 14,
    width: 14,
  },
  shell: {
    backgroundColor: "transparent",
    flex: 1,
  },
  screenContent: {
    gap: 18,
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
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 44,
  },
  trackContextCopy: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    flexShrink: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  trackContextTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  changeTrack: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  topicContext: {
    alignItems: "flex-start",
    gap: spacing.xxs,
    minWidth: 0,
    width: "100%",
  },
  topicContextRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    minWidth: 0,
  },
  topicContextLabel: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  topicContextText: {
    color: palette.textPrimary,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  changeTopic: {
    color: palette.primary,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
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
  examAccessError: {
    gap: spacing.xs,
  },
  examModeTrailing: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  disabledRow: {
    opacity: 0.62,
  },
});
