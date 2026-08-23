import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShellHeader, Button, Card, ChoiceRow, EmptyState, LoadingState, Screen, ScreenHeader, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID, getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import { goBackOrHome, type RootStackParamList } from "../../navigation";
import { loadActiveTrackId as getActiveTrackId, loadTrainingAttempts as getTrainingAttempts } from "../../application/learningReadModels";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { radius, spacing, typography } from "../../theme";
import { ALGORITHM_MODE_IDS, getAlgorithmMode } from "../../tracks/coding-interview";
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
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";


type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

const sessionLengths: readonly PracticeSessionLength[] = [10, 20, 40];
const STORED_TRACK_REQUEST_KEY = "stored-track" as const;
type PracticeSetupRequestKey = TrackId | typeof STORED_TRACK_REQUEST_KEY;
type PracticeSetupReadState =
  | Readonly<{ kind: "pending"; requestKey: PracticeSetupRequestKey }>
  | Readonly<{ kind: "ready"; requestKey: PracticeSetupRequestKey; activeTrackId: TrackId | null; trainingAttempts: readonly TrainingAttempt[] }>
  | Readonly<{ kind: "unavailable"; requestKey: PracticeSetupRequestKey; reason: string }>;

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
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
              reason: describeOperationalFailure(error, "Practice setup data is unavailable."),
            });
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [requestKey]),
  );

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} /><LoadingState title={t("Preparing practice")} /></Screen>;
  if (readState.kind === "unavailable") return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} /><EmptyState title={t("Practice setup is unavailable")} description={t(readState.reason)} /></Screen>;
  const { activeTrackId: resolvedTrackId, trainingAttempts } = readState;
  if (!resolvedTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(resolvedTrackId);
  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(activeTrack.id).profile;
  if (route.params?.topicId !== undefined && route.params.topicId !== packageProfile.freeNodeId) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Practice setup")} /><EmptyState title={t("Practice setup is unavailable")} description={t("This topic is not available in the installed Free package.")} /></Screen>;
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
    if (focusPractice && !selectedFocusTopicId) {
      setSetupError("Choose the installed Free node before starting Focus Practice.");
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
            : diagnosticBaseline || focusPractice || scenarioPractice || weakAreaReview || mixedPractice || designMode ? { sessionLength: configuredSessionLength } : { feedbackMode, reviewBehaviorEnabled, sessionLength: configuredSessionLength }),
        competencyId: scenarioPractice ? scenarioCompetencyId! : undefined,
        mode,
        source: "practiceSetup",
        topicId: focusPractice ? selectedFocusTopicId! : weakAreaReview || mixedPractice ? "" : topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.setupRoot()}>
      <Screen
        edges={["top", "bottom"]}
        footerVariant={compactCodingPractice ? "sticky" : "default"}
        footer={compactCodingPractice ? (
          <View style={styles.footerActions}>
            {setupError ? <Text accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
            <Button onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
          </View>
        ) : undefined}
    >
        {compactCodingPractice ? <ScreenHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t("Practice")}
          description={t("Adjust your default practice. Session size and feedback apply across tracks.")}
          title={t("Practice settings")}
          titleTestID={runtimeSelectors.practice.customSetupTitle()}
          variant="practiceSetup"
        /> : <AppShellHeader
          backAction={{ onPress: () => goBackOrHome(navigation) }}
          context={t(activeTrack.title)}
        />}

        {!compactCodingPractice ? <View style={styles.intro}>
          <Text
            style={styles.title}
            testID={compactCodingPractice ? runtimeSelectors.practice.customSetupTitle() : undefined}
          >
            {t("Practice setup")}
          </Text>
          <Text style={styles.subtitle}>
            {focusPractice ? t("Choose one Cloud domain. The session never mixes domains.") : scenarioPractice ? t("Choose one competency. The session uses only its approved scenario questions.") : weakAreaReview ? t("Review only saved weak areas whose review time has arrived.") : mixedPractice ? t("Practice the approved interleaved Cloud question set.") : `${t("Configure the next session for")} ${formatPracticeTopicTitle(topic.title, t)}.`}
          </Text>
        </View> : null}

        {focusPractice ? <View style={styles.section}>
          <SectionHeader title={t("Cloud domain")} subtitle={t("Required for Focus Practice")} tight />
          {focusTopics.map((focusTopic) => <SelectablePanel key={focusTopic.id} detail={formatPracticeTopicDetail(focusTopic.detail, t)} label={focusTopic.title} onPress={() => { setFocusTopicId(focusTopic.id); setSetupError(null); }} selected={selectedFocusTopicId === focusTopic.id} testID={runtimeSelectors.practice.focusTopic(focusTopic.id)} />)}
        </View> : null}

        {scenarioPractice ? <View style={styles.section}>
          <SectionHeader title={t("Competency")} subtitle={t("Required for Scenario Practice")} tight />
          {scenarioCompetencies.map((competency) => <SelectablePanel key={competency.id} detail={t(`${competency.scenarioItemIds.length} approved scenario questions`)} label={t(competency.label)} onPress={() => { setScenarioCompetencyId(competency.id); setSetupError(null); }} selected={scenarioCompetencyId === competency.id} testID={runtimeSelectors.practice.scenarioCompetency(competency.id)} />)}
        </View> : null}

        {!diagnosticBaseline ? <View style={[styles.section, compactCodingPractice ? styles.compactSection : null]}>
          {compactCodingPractice ? <PracticeSetupSectionHeader title={t("Session length")} subtitle={t("Number of items in your primary practice session.")} /> : <SectionHeader title={t("Session length")} tight />}
          <View style={[styles.lengthGrid, compactCodingPractice ? styles.compactLengthGrid : null]}>
            {(algorithmMode?.profile.supportedLengths ?? selectedPackageMode.requestedLengths ?? (weakAreaReview ? [10, 20] : sessionLengths)).map((length) => (
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
        </View> : <Card style={styles.reviewCard}><View style={styles.reviewCopy}><Text style={styles.reviewTitle}>{t("40-question Diagnostic Baseline")}</Text><Text style={styles.subtitle}>{t("Fixed Cloud-domain scope, elapsed timer, and feedback after each saved answer.")}</Text></View></Card>}

        {!diagnosticBaseline && !focusPractice && !scenarioPractice && !weakAreaReview && !mixedPractice && (!algorithmMode || algorithmMode.id === ALGORITHM_MODE_IDS.customPractice) ? (
          <View style={[styles.section, compactCodingPractice ? styles.compactSection : null]}>
            {compactCodingPractice ? <PracticeSetupSectionHeader title={t("Feedback mode")} subtitle={t("Choose when authored feedback becomes available.")} /> : <SectionHeader title={t("Feedback mode")} tight />}
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("Correctness and explanation are shown after every item.")}
              label={t("After each answer")}
              onPress={() => setFeedbackMode("afterEachAnswer")}
              selected={feedbackMode === "afterEachAnswer"}
              testID={runtimeSelectors.practice.feedbackTiming("afterEachAnswer")}
            />
            <SelectablePanel
              compact={compactCodingPractice}
              detail={t("Correctness is hidden until the final summary and review.")}
              label={t("At session end")}
              onPress={() => setFeedbackMode("atSessionEnd")}
              selected={feedbackMode === "atSessionEnd"}
              testID={runtimeSelectors.practice.feedbackTiming("atSessionEnd")}
            />
          </View>
        ) : null}

        {!diagnosticBaseline && !focusPractice && !scenarioPractice && !weakAreaReview && !mixedPractice && !algorithmMode ? (
          <Card style={styles.reviewCard}>
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewTitle}>{t(reviewBehaviorCopy.title)}</Text>
              <Text style={styles.subtitle}>{t(reviewBehaviorCopy.detail)}</Text>
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

        {!compactCodingPractice ? <View style={styles.actions}>
          {setupError ? <Text accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
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
      <Text style={[styles.lengthValue, compact ? styles.compactLengthValue : null, selected ? (compact ? styles.compactSelectedText : styles.selectedText) : null]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.optionMeta, compact ? styles.compactOptionMeta : null, selected && compact ? styles.compactSelectedMeta : null]}>{meta}</Text>
    </Pressable>
  );
}

type SelectablePanelProps = {
  compact?: boolean;
  detail: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectablePanel({ compact = false, detail, label, onPress, selected, testID }: SelectablePanelProps) {
  const styles = useThemedStyles(createStyles);
  if (compact) {
    return <ChoiceRow accessibilityLabel={`${label}. ${detail}`} density="compact" detail={detail} onPress={onPress} selected={selected} testID={testID} title={label} />;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={compact ? `${label}. ${detail}` : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.panel,
        selected ? styles.selectedOption : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
      >
      <View style={styles.panelCopy}>
        <Text style={[styles.panelTitle, selected ? styles.selectedText : null]}>{label}</Text>
        <Text style={styles.subtitle}>{detail}</Text>
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
    color: palette.textPrimary,
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
  return <View style={styles.compactSectionHeader}><Text style={styles.compactSectionTitle}>{title.toUpperCase()}</Text><Text style={styles.compactSectionSubtitle}>{subtitle}</Text></View>;
}
