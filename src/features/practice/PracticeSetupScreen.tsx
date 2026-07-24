import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { ALGORITHMS_TRACK_ID, CLOUD_CERTIFICATION_TRACK_ID, getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { loadActiveTrackId as getActiveTrackId, loadTrainingAttempts as getTrainingAttempts } from "../../application/learningReadModels";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/algorithms";
import { getCertificationContentCatalog } from "../../content/catalogRepository";
import { radius, spacing, typography } from "../../theme";
import { ALGORITHM_MODE_IDS, getAlgorithmMode } from "../../tracks/algorithms";
import { AppStackHeader } from "../navigation/AppStackHeader";
import { SelectTrackScreen } from "../home/SelectTrackScreen";
import {
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  type PracticeTopic,
} from "./practiceFlowModel";
import {
  buildPracticeSessionConfig,
  DEFAULT_FEEDBACK_MODE,
  DEFAULT_PRACTICE_SESSION_LENGTH,
  isCloudTopicId,
  type PracticeFeedbackMode,
  type PracticeSessionLength,
} from "./sessionConfig";
import { getPracticeReviewBehaviorCopy } from "./practiceSetupModel";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";


type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

const sessionLengths: readonly PracticeSessionLength[] = [10, 20, 40];

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(route.params?.trackId ?? null);
  const [trainingAttempts, setTrainingAttempts] = useState<TrainingAttempt[]>([]);
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
      let isActive = true;

      async function loadData() {
        const [savedTrackId, trainingAttemptsResult] = await Promise.all([
          getActiveTrackId(),
          getTrainingAttempts(),
        ]);

        if (isActive) {
          const nextTrackId = route.params?.trackId ?? savedTrackId;
          if (nextTrackId) setActiveTrackId(nextTrackId);
          setTrainingAttempts(trainingAttemptsResult.value);
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [route.params?.trackId]),
  );

  const resolvedTrackId = route.params?.trackId ?? activeTrackId;
  if (!resolvedTrackId) return <SelectTrackScreen navigation={navigation} onboarding />;
  const activeTrack = getTrackDisplay(resolvedTrackId);
  const diagnosticBaseline = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID && route.params?.mode === "certification-diagnostic-baseline";
  const focusPractice = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID && route.params?.mode === "certification-focus-practice";
  const scenarioPractice = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID && route.params?.mode === "certification-scenario-practice";
  const weakAreaReview = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID && route.params?.mode === "certification-weak-area-review";
  const mixedPractice = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID && route.params?.mode === "certification-mixed-practice";
  const algorithmMode = activeTrack.id === ALGORITHMS_TRACK_ID
    ? getAlgorithmMode(route.params?.mode ?? ALGORITHM_MODE_IDS.guidedPractice)
    : null;
  const configuredSessionLength = algorithmMode && !algorithmMode.profile.supportedLengths.includes(sessionLength)
    ? algorithmMode.profile.sessionLength
    : sessionLength;
  const reviewBehaviorCopy = getPracticeReviewBehaviorCopy(activeTrack.id);
  const topic = resolvePracticeTopic({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts,
  });
  const focusTopics = focusPractice
    ? buildTopicRoadmapNodes({ activeTrackId: CLOUD_CERTIFICATION_TRACK_ID, trainingAttempts })
    : [];
  const scenarioCompetencies = scenarioPractice ? getCertificationContentCatalog().getScenarioPractice().competencies : [];

  function startSession() {
    const mode = route.params?.mode ?? (
      activeTrack.id === ALGORITHMS_TRACK_ID
        ? ALGORITHM_MODE_IDS.guidedPractice
        : "certification-diagnostic-baseline"
    );
    if (activeTrack.id === ALGORITHMS_TRACK_ID && mode === ALGORITHM_MODE_IDS.interviewSimulation) {
      const entry = getAlgorithmsInterviewSimulationEntry();
      navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: entry.profileId });
      return;
    }
    if (focusPractice && !focusTopicId) {
      setSetupError("Choose a Cloud domain before starting Focus Practice.");
      return;
    }
    if (scenarioPractice && !scenarioCompetencyId) {
      setSetupError("Choose a competency before starting Scenario Practice.");
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        ...(activeTrack.id === ALGORITHMS_TRACK_ID
          ? {
              feedbackMode,
              reviewItemRefs: route.params?.reviewItemRefs,
              reviewSource: route.params?.reviewSource,
              sessionLength: configuredSessionLength,
            }
            : diagnosticBaseline || focusPractice || scenarioPractice || weakAreaReview || mixedPractice ? { sessionLength: configuredSessionLength } : { feedbackMode, reviewBehaviorEnabled, sessionLength: configuredSessionLength }),
        competencyId: scenarioPractice ? scenarioCompetencyId! : undefined,
        mode,
        source: "practiceSetup",
        topicId: focusPractice ? focusTopicId! : weakAreaReview || mixedPractice ? "" : topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell} testID={runtimeSelectors.practice.setupRoot()}>
      <Screen edges={["top", "bottom"]}>
        <AppStackHeader
          navigation={navigation}
          showBack
          subtitle={t(activeTrack.title)}
        />

        <View style={styles.intro}>
          <Text
            style={styles.title}
            testID={algorithmMode?.id === ALGORITHM_MODE_IDS.customPractice ? runtimeSelectors.practice.customSetupTitle() : undefined}
          >
            {t(algorithmMode?.id === ALGORITHM_MODE_IDS.customPractice ? "Custom Practice" : "Practice setup")}
          </Text>
          <Text style={styles.subtitle}>
            {focusPractice ? t("Choose one Cloud domain. The session never mixes domains.") : scenarioPractice ? t("Choose one competency. The session uses only its approved scenario questions.") : weakAreaReview ? t("Review only saved weak areas whose review time has arrived.") : mixedPractice ? t("Practice the approved interleaved Cloud question set.") : `${t("Configure the next session for")} ${t(topic.title)}.`}
          </Text>
        </View>

        {focusPractice ? <View style={styles.section}>
          <SectionHeader title={t("Cloud domain")} subtitle={t("Required for Focus Practice")} tight />
          {focusTopics.map((focusTopic) => <SelectablePanel key={focusTopic.id} detail={t(focusTopic.detail)} label={t(focusTopic.title)} onPress={() => { setFocusTopicId(focusTopic.id); setSetupError(null); }} selected={focusTopicId === focusTopic.id} testID={runtimeSelectors.practice.focusTopic(focusTopic.id)} />)}
        </View> : null}

        {scenarioPractice ? <View style={styles.section}>
          <SectionHeader title={t("Competency")} subtitle={t("Required for Scenario Practice")} tight />
          {scenarioCompetencies.map((competency) => <SelectablePanel key={competency.id} detail={t(`${competency.scenarioItemIds.length} approved scenario questions`)} label={t(competency.label)} onPress={() => { setScenarioCompetencyId(competency.id); setSetupError(null); }} selected={scenarioCompetencyId === competency.id} testID={runtimeSelectors.practice.scenarioCompetency(competency.id)} />)}
        </View> : null}

        {!diagnosticBaseline ? <View style={styles.section}>
          <SectionHeader title={t("Session length")} tight />
          <View style={styles.lengthGrid}>
            {(algorithmMode?.profile.supportedLengths ?? (weakAreaReview ? [10, 20] : sessionLengths)).map((length) => (
              <SelectableOption
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
          <View style={styles.section}>
            <SectionHeader title={t("Feedback mode")} tight />
            <SelectablePanel
              detail={t("Correctness and explanation are shown after every item.")}
              label={t("After each answer")}
              onPress={() => setFeedbackMode("afterEachAnswer")}
              selected={feedbackMode === "afterEachAnswer"}
              testID={runtimeSelectors.practice.feedbackTiming("afterEachAnswer")}
            />
            <SelectablePanel
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

        <View style={styles.actions}>
          {setupError ? <Text accessibilityRole="alert" style={styles.error}>{t(setupError)}</Text> : null}
          <Button onPress={startSession} testID={runtimeSelectors.practice.startSession()}>{t("Start session")}</Button>
          <Button onPress={() => navigation.goBack()} variant="secondary">
            {t("Back")}
          </Button>
        </View>
      </Screen>
    </View>
  );
}

type SelectableOptionProps = {
  label: string;
  meta: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectableOption({ label, meta, onPress, selected, testID }: SelectableOptionProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.lengthOption,
        selected ? styles.selectedOption : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.lengthValue, selected ? styles.selectedText : null]}>{label}</Text>
      <Text style={styles.optionMeta}>{meta}</Text>
    </Pressable>
  );
}

type SelectablePanelProps = {
  detail: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
};

function SelectablePanel({ detail, label, onPress, selected, testID }: SelectablePanelProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
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

function resolvePracticeTopic(input: {
  activeTrackId: TrackId;
  routeTopicId?: string;
  trainingAttempts: readonly TrainingAttempt[];
}): PracticeTopic {
  if (input.routeTopicId) {
    const node = buildTopicRoadmapNodes(input).find(
      (candidate) => candidate.id === input.routeTopicId,
    );

    if (node) {
      return {
        detail: node.detail,
        id: node.id,
        title: node.title,
      };
    }
  }

  return getCurrentPracticeTopic(
    getTrackDisplay(input.activeTrackId),
    input.trainingAttempts,
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
  lengthGrid: {
    flexDirection: "row",
    gap: spacing.md,
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
    justifyContent: "center",
    padding: spacing.md,
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
  selectedText: {
    color: palette.textPrimary,
  },
  optionMeta: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
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
});
