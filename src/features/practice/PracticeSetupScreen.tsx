import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppShellHeader, Button, Card, ChoiceRow, EmptyState, Screen, ScreenHeader, SectionHeader, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID, getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
import { loadActiveTrackId as getActiveTrackId, loadTrainingAttempts as getTrainingAttempts } from "../../application/learningReadModels";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { radius, spacing, typography } from "../../theme";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, isAlgorithmModeId } from "../../tracks/coding-interview";
import { isCertificationPracticeModeId } from "../../tracks/certification";
import { isDesignInterviewModeId } from "../../tracks/design-interview";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import {
  buildTopicRoadmapNodes,
  resolvePracticeTopic as resolvePracticeTopicModel,
} from "./practiceFlowModel";
import {
  formatPracticeTopicDetail,
  formatPracticeTopicTitle,
} from "./practiceFlowPresentation";
import {
  buildPracticeSessionConfig,
  DEFAULT_FEEDBACK_MODE,
  DEFAULT_PRACTICE_SESSION_LENGTH,
  isCloudTopicId,
  type PracticeFeedbackMode,
  type PracticeSessionMode,
  type PracticeSessionLength,
} from "./sessionConfig";
import { getPracticeReviewBehaviorCopy } from "./practiceSetupModel";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";


type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

const STORED_TRACK_REQUEST_KEY = "stored-track" as const;
type PracticeSetupRequestKey = TrackId | typeof STORED_TRACK_REQUEST_KEY;
type PracticeSetupReadState =
  | Readonly<{ kind: "pending"; requestKey: PracticeSetupRequestKey }>
  | Readonly<{ kind: "ready"; requestKey: PracticeSetupRequestKey; activeTrackId: TrackId | null; trainingAttempts: readonly TrainingAttempt[] }>
  | Readonly<{ kind: "unavailable"; requestKey: PracticeSetupRequestKey; reason: string }>;

type PracticeSetupLoadingVariant =
  | "diagnostic"
  | "selector"
  | "lengthOnly"
  | "design"
  | "customCoding"
  | "lengthFeedbackReview"
  | "unknown";

function resolvePracticeSetupLoadingVariant(mode?: PracticeSessionMode): PracticeSetupLoadingVariant {
  if (!mode) return "unknown";
  if (mode === "certification-diagnostic-baseline") return "diagnostic";
  if (mode === "certification-focus-practice" || mode === "certification-scenario-practice") return "selector";
  if (mode === ALGORITHM_MODE_IDS.customPractice) return "customCoding";
  if (isDesignInterviewModeId(mode)) return "design";
  if (isAlgorithmModeId(mode)) return "lengthOnly";
  if (isCertificationPracticeModeId(mode) && mode === "certification-quick-review") return "lengthFeedbackReview";
  if (isCertificationPracticeModeId(mode)) return "lengthOnly";
  return "unknown";
}

export function PracticeSetupLoadingSkeleton({ mode }: Readonly<{ mode?: PracticeSessionMode }> = {}) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();
  const variant = resolvePracticeSetupLoadingVariant(mode);
  const compactCodingPractice = variant === "customCoding";
  const showIntro = variant !== "customCoding" && variant !== "unknown";
  const showLength = variant !== "diagnostic" && variant !== "unknown";
  const showSelector = variant === "selector";
  const showFeedback = variant === "customCoding" || variant === "lengthFeedbackReview";
  const showReview = variant === "lengthFeedbackReview";

  return (
    <View
      accessibilityLabel={t("Loading practice setup")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={[styles.practiceSetupLoading, compactCodingPractice ? styles.practiceSetupLoadingCompact : null]}
      testID="practice-setup-loading-skeleton"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.practiceSetupLoadingShapes}>
        {showIntro ? <View style={styles.practiceSetupLoadingIntro}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingTitle, { height: 21 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSubtitle, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSubtitleShort, { height: 13 * textScale }]} />
        </View> : null}

        {variant === "diagnostic" ? <View style={styles.practiceSetupLoadingDescriptionCard}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 13 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingDescriptionShort, { height: 13 * textScale }]} />
        </View> : null}

        {showSelector ? <View style={styles.practiceSetupLoadingSection}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 12 * textScale }]} />
          <View style={styles.practiceSetupLoadingPanelList}>
            {[0, 1].map((selector) => (
              <View key={selector} style={[styles.practiceSetupLoadingPanel, largeLayout ? styles.practiceSetupLoadingPanelLarge : null]}>
                <View style={styles.practiceSetupLoadingPanelCopy}>
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 15 * textScale }]} />
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 12 * textScale }]} />
                </View>
                <SkeletonShape motion={motion} style={styles.practiceSetupLoadingControl} />
              </View>
            ))}
          </View>
        </View> : null}

        {showLength ? <View style={[styles.practiceSetupLoadingSection, compactCodingPractice ? styles.practiceSetupLoadingCompactSection : null]}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 12 * textScale }]} />
          <View style={[styles.practiceSetupLoadingLengthGrid, compactCodingPractice ? styles.practiceSetupLoadingCompactLengthGrid : null]}>
            {[0, 1, 2].map((option) => (
              <View key={option} style={[styles.practiceSetupLoadingLengthOption, compactCodingPractice ? styles.practiceSetupLoadingCompactLengthOption : null, { minHeight: (compactCodingPractice ? 44 : 86) * textScale }]}>
                <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingLengthValue, { height: 17 * textScale }]} />
                <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingLengthMeta, { height: 11 * textScale }]} />
              </View>
            ))}
          </View>
        </View> : null}

        {variant === "design" ? <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingFeedbackStrip, { height: 14 * textScale }]} /> : null}

        {showFeedback ? <View style={[styles.practiceSetupLoadingSection, compactCodingPractice ? styles.practiceSetupLoadingCompactSection : null]}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingSectionTitle, { height: 12 * textScale }]} />
          <View style={styles.practiceSetupLoadingPanelList}>
            {[0, 1].map((panel) => (
              <View key={panel} style={[styles.practiceSetupLoadingPanel, compactCodingPractice ? styles.practiceSetupLoadingCompactPanel : null, largeLayout ? styles.practiceSetupLoadingPanelLarge : null]}>
                <View style={styles.practiceSetupLoadingPanelCopy}>
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 15 * textScale }]} />
                  <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 12 * textScale }]} />
                </View>
                <SkeletonShape motion={motion} style={styles.practiceSetupLoadingControl} />
              </View>
            ))}
          </View>
        </View> : null}

        {showReview ? <View style={styles.practiceSetupLoadingReviewCard}>
          <View style={styles.practiceSetupLoadingPanelCopy}>
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelTitle, { height: 15 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingPanelDetail, { height: 12 * textScale }]} />
          </View>
          <SkeletonShape motion={motion} style={styles.practiceSetupLoadingSwitch} />
        </View> : null}

        {variant === "unknown" ? <View style={styles.practiceSetupLoadingUnknown}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownTitle, { height: 16 * textScale }]} />
          <View style={styles.practiceSetupLoadingUnknownCard}>
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownLine, { height: 15 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingLine, styles.practiceSetupLoadingUnknownLineShort, { height: 12 * textScale }]} />
          </View>
        </View> : null}

        <View style={styles.practiceSetupLoadingActionSpace}>
          <SkeletonShape motion={motion} style={[styles.practiceSetupLoadingAction, { minHeight: 48 * textScale }]} />
        </View>
      </View>
    </View>
  );
}

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const requestKey: PracticeSetupRequestKey = route.params?.trackId ?? STORED_TRACK_REQUEST_KEY;
  const [readState, setReadState] = useState<PracticeSetupReadState>({ kind: "pending", requestKey });
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>(
    route.params?.sessionLength ?? DEFAULT_PRACTICE_SESSION_LENGTH,
  );
  const [feedbackMode, setFeedbackMode] = useState<PracticeFeedbackMode>(
    route.params?.feedbackMode ?? DEFAULT_FEEDBACK_MODE,
  );
  const [reviewBehaviorEnabled, setReviewBehaviorEnabled] = useState(
    route.params?.reviewBehaviorEnabled ?? false,
  );
  const [focusTopicId, setFocusTopicId] = useState<string | null>(() => isCloudTopicId(route.params?.topicId ?? "") ? route.params!.topicId! : null);
  const [scenarioCompetencyId, setScenarioCompetencyId] = useState<string | null>(route.params?.competencyId ?? null);
  const [setupError, setSetupError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const capturedRequestKey = requestKey;
      let isActive = true;
      setReadState({ kind: "pending", requestKey: capturedRequestKey });

      async function loadData() {
        try {
          const [savedTrackId, trainingAttemptsResult] = await Promise.all([
            getActiveTrackId(),
            getTrainingAttempts(),
          ]);

          if (isActive) {
            setReadState({
              kind: "ready",
              requestKey: capturedRequestKey,
              activeTrackId: capturedRequestKey === STORED_TRACK_REQUEST_KEY ? savedTrackId ?? null : capturedRequestKey,
              trainingAttempts: trainingAttemptsResult.value,
            });
          }
        } catch (error) {
          if (isActive) {
            setReadState({
              kind: "unavailable",
              requestKey: capturedRequestKey,
              reason: describeOperationalFailure(error, t("We couldn’t load the session settings.")),
            });
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [requestKey, t]),
  );

  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    const compactCodingPractice = route.params?.mode === ALGORITHM_MODE_IDS.customPractice;
    return (
      <Screen edges={["top", "bottom"]}>
        {compactCodingPractice ? <ScreenHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t("Practice")}
          description={t("Choose the length and feedback timing for this session.")}
          title={t("Practice settings")}
          titleTestID={runtimeSelectors.practice.customSetupTitle()}
          variant="practiceSetup"
        /> : <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} />}
        <PracticeSetupLoadingSkeleton mode={route.params?.mode} />
      </Screen>
    );
  }
  if (readState.kind === "unavailable") return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} /><EmptyState title={t("Practice setup is unavailable")} description={t(readState.reason)} /></Screen>;
  const { activeTrackId: resolvedTrackId, trainingAttempts } = readState;
  if (!resolvedTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(resolvedTrackId);
  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile;
  if (route.params?.topicId !== undefined && route.params.topicId !== packageProfile.freeNodeId) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} /><EmptyState title={t("Practice setup is unavailable")} description={t("This topic is not included in your free content.")} /></Screen>;
  const selectedMode = (route.params?.mode ?? packageProfile.primaryEntry.modeId) as PracticeSessionMode;
  packageProfile.getMode(selectedMode);
  const certificationTrack = activeTrack.familyId === "certification";
  const diagnosticBaseline = certificationTrack && selectedMode === "certification-diagnostic-baseline";
  const focusPractice = certificationTrack && selectedMode === "certification-focus-practice";
  const scenarioPractice = certificationTrack && selectedMode === "certification-scenario-practice";
  const weakAreaReview = certificationTrack && selectedMode === "certification-weak-area-review";
  const mixedPractice = certificationTrack && selectedMode === "certification-mixed-practice";
  const algorithmMode = activeTrack.id === CODING_INTERVIEW_TRACK_ID
    ? getAlgorithmMode(selectedMode)
    : null;
  const compactCodingPractice = algorithmMode?.id === ALGORITHM_MODE_IDS.customPractice;
  const selectedPackageMode = packageProfile.getMode(selectedMode);
  const configuredSessionLength = !selectedPackageMode.requestedLengths.includes(sessionLength)
    ? selectedPackageMode.defaultRequestedLength as PracticeSessionLength
    : sessionLength;
  const designMode = isDesignInterviewModeId(selectedMode);
  const reviewBehaviorCopy = getPracticeReviewBehaviorCopy(activeTrack.id);
  const topic = resolvePracticeTopicModel({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts,
  });
  const focusTopics = focusPractice
    ? buildTopicRoadmapNodes({ activeTrackId: activeTrack.id, trainingAttempts })
    : [];
  const selectedFocusTopicId = focusPractice
    ? focusTopicId ?? packageProfile.freeNodeId
    : null;
  const scenarioCompetencies: readonly Readonly<{ id: string; label: string; scenarioItemIds: readonly string[] }>[] = [];

  function startSession() {
    const mode = selectedMode;
    if (focusPractice && selectedFocusTopicId !== packageProfile.freeNodeId) {
      setSetupError("Choose an available topic to start practicing.");
      return;
    }
    if (scenarioPractice && !scenarioCompetencyId) {
      setSetupError("Choose a competency before starting Scenario Practice.");
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        ...(activeTrack.id === CODING_INTERVIEW_TRACK_ID
          ? {
              feedbackMode,
              reviewItemRefs: route.params?.reviewItemRefs,
              reviewSource: route.params?.reviewSource,
              sessionLength: configuredSessionLength,
            }
            : diagnosticBaseline ? {} : focusPractice || scenarioPractice || weakAreaReview || mixedPractice || designMode ? { sessionLength: configuredSessionLength } : { feedbackMode, reviewBehaviorEnabled, sessionLength: configuredSessionLength }),
        competencyId: scenarioPractice ? scenarioCompetencyId! : undefined,
        mode,
        source: "practiceSetup",
        topicId: diagnosticBaseline ? packageProfile.freeNodeId : focusPractice ? selectedFocusTopicId! : weakAreaReview || mixedPractice ? "" : topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.setupRoot()}>
      <Screen
        edges={["top", "bottom"]}
        footerVariant={compactCodingPractice || focusPractice ? "sticky" : "default"}
        footer={compactCodingPractice || focusPractice ? (
          <View style={styles.footerActions}>
            {setupError ? <Text key={`practice-setup-footer-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
            <Button onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
          </View>
        ) : undefined}
    >
        {compactCodingPractice ? <ScreenHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t("Practice")}
          description={t("Choose the length and feedback timing for this session.")}
          title={t("Practice settings")}
          titleTestID={runtimeSelectors.practice.customSetupTitle()}
          variant="practiceSetup"
        /> : <AppShellHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t(activeTrack.title)}
        />}

        {!compactCodingPractice ? <View style={styles.intro}>
          <Text
            key={`practice-setup-intro-title-${fontScale}`}
            maxFontSizeMultiplier={2}
            style={styles.title}
            testID={compactCodingPractice ? runtimeSelectors.practice.customSetupTitle() : undefined}
          >
            {t("Practice setup")}
          </Text>
          <Text key={`practice-setup-intro-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>
            {diagnosticBaseline ? t("Check your knowledge of {{topic}} with 40 questions.", { topic: formatPracticeTopicTitle(topic.title, t) }) : focusPractice ? t("Practice questions from one topic.") : scenarioPractice ? t("Choose the skill you want to practice.") : weakAreaReview ? t("Review questions that are ready to revisit.") : mixedPractice ? t("Practice a mix of topics in one session.") : t("Set up your session for {{topic}}.", { topic: formatPracticeTopicTitle(topic.title, t) })}
          </Text>
        </View> : null}

        {focusPractice ? <View style={styles.section}>
          <SectionHeader title={t("Topic")} subtitle={t("Choose a topic for this session.")} tight />
          {focusTopics.map((focusTopic) => <SelectablePanel key={focusTopic.id} disabled={focusTopic.status === "locked"} detail={focusTopic.status === "locked" ? `${t("Unavailable")}. ${formatPracticeTopicDetail(focusTopic.detail, t)}` : formatPracticeTopicDetail(focusTopic.detail, t)} label={focusTopic.title} onPress={() => { setFocusTopicId(focusTopic.id); setSetupError(null); }} selected={selectedFocusTopicId === focusTopic.id} testID={runtimeSelectors.practice.focusTopic(focusTopic.id)} />)}
        </View> : null}

        {scenarioPractice ? <View style={styles.section}>
          <SectionHeader title={t("Competency")} subtitle={t("Choose a skill for this session.")} tight />
          {scenarioCompetencies.map((competency) => <SelectablePanel key={competency.id} detail={t("Questions: {{count}}", { count: competency.scenarioItemIds.length })} label={t(competency.label)} onPress={() => { setScenarioCompetencyId(competency.id); setSetupError(null); }} selected={scenarioCompetencyId === competency.id} testID={runtimeSelectors.practice.scenarioCompetency(competency.id)} />)}
        </View> : null}

        {!diagnosticBaseline ? <View style={[styles.section, compactCodingPractice ? styles.compactSection : null]}>
          {compactCodingPractice ? <PracticeSetupSectionHeader title={t("Session length")} subtitle={t("Number of questions in this session.")} /> : <SectionHeader title={t("Session length")} tight />}
          <View style={[styles.lengthGrid, compactCodingPractice ? styles.compactLengthGrid : null]}>
            {selectedPackageMode.requestedLengths.map((length) => (
              <SelectableOption
                compact={compactCodingPractice}
                key={length}
                label={String(length)}
                meta={t("Questions")}
                onPress={() => setSessionLength(length)}
                selected={configuredSessionLength === length}
                testID={runtimeSelectors.practice.sessionLength(length)}
              />
            ))}
          </View>
        </View> : <Card style={styles.reviewCard}><View style={styles.reviewCopy}><Text key={`practice-setup-diagnostic-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t("Knowledge Check")}</Text><Text key={`practice-setup-diagnostic-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("40 questions on this topic. No time limit. Explanations after each answer.")}</Text></View></Card>}

        {designMode ? <Text key={`design-feedback-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t("Feedback is shown after each answer.")}</Text> : null}

        {!diagnosticBaseline && !focusPractice && !scenarioPractice && !weakAreaReview && !mixedPractice && !designMode && (!algorithmMode || algorithmMode.id === ALGORITHM_MODE_IDS.customPractice) ? (
          <View style={[styles.section, compactCodingPractice ? styles.compactSection : null]}>
            {compactCodingPractice ? <PracticeSetupSectionHeader title={t("Feedback mode")} subtitle={t("Choose when to see feedback on your answers.")} /> : <SectionHeader title={t("Feedback mode")} tight />}
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("See whether your answer is correct and read the explanation.")}
              label={t("After each answer")}
              onPress={() => setFeedbackMode("afterEachAnswer")}
              selected={feedbackMode === "afterEachAnswer"}
              testID={runtimeSelectors.practice.feedbackTiming("afterEachAnswer")}
            />
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("See your results and explanations when the session ends.")}
              label={t("At session end")}
              onPress={() => setFeedbackMode("atSessionEnd")}
              selected={feedbackMode === "atSessionEnd"}
              testID={runtimeSelectors.practice.feedbackTiming("atSessionEnd")}
            />
          </View>
        ) : null}

        {!diagnosticBaseline && !focusPractice && !scenarioPractice && !weakAreaReview && !mixedPractice && !algorithmMode && !designMode ? (
          <Card style={styles.reviewCard}>
            <View style={styles.reviewCopy}>
              <Text key={`practice-setup-review-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.reviewTitle}>{t(reviewBehaviorCopy.title)}</Text>
              <Text key={`practice-setup-review-detail-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{t(reviewBehaviorCopy.detail)}</Text>
            </View>
            {reviewBehaviorCopy.showToggle ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: reviewBehaviorEnabled }}
                onPress={() => setReviewBehaviorEnabled((current) => !current)}
                style={[styles.switchTrack, reviewBehaviorEnabled ? styles.switchTrackEnabled : null]}
              >
                <View style={[styles.switchThumb, reviewBehaviorEnabled ? styles.switchThumbEnabled : null]} />
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        {!compactCodingPractice && !focusPractice ? <View style={styles.actions}>
          {setupError ? <Text key={`practice-setup-actions-error-${fontScale}`} maxFontSizeMultiplier={2} accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
          <Button onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
        </View> : null}
      </Screen>
    </View>
  );
}

type SelectableOptionProps = {
  compact?: boolean;
  label: string;
  meta: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectableOption({ compact = false, label, meta, onPress, selected, testID }: SelectableOptionProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.lengthOption,
        compact ? styles.compactLengthOption : null,
        selected ? (compact ? styles.compactSelectedLengthOption : styles.selectedOption) : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <Text key={`practice-setup-session-length-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.lengthValue, compact ? styles.compactLengthValue : null, selected ? (compact ? styles.compactSelectedText : styles.selectedText) : null]}>{label}</Text>
      <Text key={`practice-setup-session-length-meta-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.optionMeta, compact ? styles.compactOptionMeta : null, selected && compact ? styles.compactSelectedMeta : null]}>{meta}</Text>
    </Pressable>
  );
}

type SelectablePanelProps = {
  compact?: boolean;
  disabled?: boolean;
  detail: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectablePanel({ compact = false, disabled = false, detail, label, onPress, selected, testID }: SelectablePanelProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  if (compact) {
    return <ChoiceRow accessibilityLabel={`${label}. ${detail}`} density="compact" detail={detail} disabled={disabled} onPress={onPress} selected={selected} testID={testID} title={label} />;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={compact ? `${label}. ${detail}` : undefined}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.panel,
        selected ? styles.selectedOption : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
      >
      <View style={styles.panelCopy}>
        <Text key={`practice-setup-panel-title-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.panelTitle, selected ? styles.selectedText : null]}>{label}</Text>
        <Text key={`practice-setup-panel-detail-${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{detail}</Text>
      </View>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: {
    backgroundColor: palette.background,
    flex: 1,
  },
  practiceSetupLoading: {
    gap: spacing.xl,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingCompact: {
    gap: spacing.lg,
  },
  practiceSetupLoadingShapes: {
    gap: spacing.xl,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingIntro: {
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  practiceSetupLoadingTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    maxWidth: 250,
    width: "68%",
  },
  practiceSetupLoadingSubtitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 440,
    width: "100%",
  },
  practiceSetupLoadingSubtitleShort: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 300,
    width: "72%",
  },
  practiceSetupLoadingSection: {
    gap: spacing.md,
  },
  practiceSetupLoadingCompactSection: {
    gap: spacing.sm,
  },
  practiceSetupLoadingSectionTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    maxWidth: 180,
    width: "42%",
  },
  practiceSetupLoadingDescriptionCard: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  practiceSetupLoadingDescriptionShort: {
    maxWidth: 260,
    width: "74%",
  },
  practiceSetupLoadingLengthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  practiceSetupLoadingCompactLengthGrid: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexWrap: "nowrap",
    gap: spacing.xs,
    minHeight: 54,
    padding: spacing.xs,
  },
  practiceSetupLoadingLengthOption: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 108,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  practiceSetupLoadingCompactLengthOption: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  practiceSetupLoadingLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
  },
  practiceSetupLoadingLengthValue: {
    maxWidth: 58,
    width: "44%",
  },
  practiceSetupLoadingLengthMeta: {
    maxWidth: 72,
    width: "60%",
  },
  practiceSetupLoadingPanelList: {
    gap: spacing.md,
  },
  practiceSetupLoadingPanel: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  practiceSetupLoadingPanelLarge: {
    minHeight: 132,
  },
  practiceSetupLoadingCompactPanel: {
    minHeight: 56,
    padding: spacing.md,
  },
  practiceSetupLoadingPanelCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  practiceSetupLoadingPanelTitle: {
    maxWidth: 220,
    width: "72%",
  },
  practiceSetupLoadingPanelDetail: {
    maxWidth: 360,
    width: "92%",
  },
  practiceSetupLoadingFeedbackStrip: {
    maxWidth: 360,
    width: "84%",
  },
  practiceSetupLoadingControl: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  practiceSetupLoadingReviewCard: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 92,
    padding: spacing.lg,
  },
  practiceSetupLoadingSwitch: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    height: 32,
    width: 56,
  },
  practiceSetupLoadingActionSpace: {
    gap: spacing.md,
    marginTop: spacing.xl,
    width: "100%",
  },
  practiceSetupLoadingAction: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    width: "100%",
  },
  practiceSetupLoadingUnknown: {
    gap: spacing.md,
  },
  practiceSetupLoadingUnknownTitle: {
    maxWidth: 230,
    width: "54%",
  },
  practiceSetupLoadingUnknownCard: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  practiceSetupLoadingUnknownLine: {
    maxWidth: 340,
    width: "88%",
  },
  practiceSetupLoadingUnknownLineShort: {
    maxWidth: 230,
    width: "64%",
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.small,
    color: palette.textSecondary,
  },
  error: {
    ...typography.small,
    color: palette.danger,
  },
  section: {
    gap: spacing.md,
  },
  compactSection: {
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  compactSectionHeader: {
    gap: spacing.xs,
  },
  compactSectionTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  compactSectionSubtitle: {
    color: palette.textMuted,
    fontSize: 12.5,
    lineHeight: 15,
  },
  lengthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  compactLengthGrid: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.xs,
    minHeight: 54,
    padding: spacing.xs,
  },
  lengthOption: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 92,
    minWidth: 108,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  compactLengthOption: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 0,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  compactSelectedLengthOption: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  selectedOption: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  lengthValue: {
    ...typography.heading,
    color: palette.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  compactLengthValue: {
    fontSize: 15,
    lineHeight: 18,
  },
  selectedText: {
    color: palette.textPrimary,
  },
  compactSelectedText: {
    color: palette.onPrimary,
  },
  compactSelectedMeta: {
    color: palette.onPrimary,
  },
  optionMeta: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  compactOptionMeta: {
    fontSize: 11,
    lineHeight: 15,
    textTransform: "none",
  },
  panel: {
    alignItems: "center",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  panelCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  panelTitle: {
    ...typography.bodyStrong,
    color: palette.textSecondary,
  },
  radio: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  radioSelected: {
    borderColor: palette.primary,
  },
  radioDot: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    height: 12,
    width: 12,
  },
  reviewCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  reviewTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  switchTrack: {
    backgroundColor: palette.borderStrong,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    padding: 4,
    width: 56,
  },
  switchTrackEnabled: {
    backgroundColor: palette.primary,
  },
  switchThumb: {
    backgroundColor: palette.textPrimary,
    borderRadius: radius.pill,
    height: 24,
    width: 24,
  },
  switchThumbEnabled: {
    transform: [{ translateX: 24 }],
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  footerActions: {
    gap: spacing.md,
  },
});

function PracticeSetupSectionHeader({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return <View style={styles.compactSectionHeader}><Text key={`practice-setup-section-title-${fontScale}`} maxFontSizeMultiplier={2} style={styles.compactSectionTitle}>{title.toUpperCase()}</Text><Text key={`practice-setup-section-subtitle-${fontScale}`} maxFontSizeMultiplier={2} style={styles.compactSectionSubtitle}>{subtitle}</Text></View>;
}
