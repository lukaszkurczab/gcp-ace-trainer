import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { ALGORITHMS_TRACK_ID, CLOUD_CERTIFICATION_TRACK_ID, getTrackDisplay, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { loadActiveTrackId as getActiveTrackId, loadTrainingAttempts as getTrainingAttempts } from "../../application/learningReadModels";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/algorithms";
import { colors, radius, spacing, typography } from "../../theme";
import { ALGORITHM_MODE_IDS, getAlgorithmMode } from "../../tracks/algorithms";
import { AppStackHeader } from "../navigation/AppStackHeader";
import {
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  type PracticeTopic,
} from "./practiceFlowModel";
import {
  buildPracticeSessionConfig,
  DEFAULT_FEEDBACK_MODE,
  DEFAULT_PRACTICE_SESSION_LENGTH,
  type PracticeFeedbackMode,
  type PracticeSessionLength,
} from "./sessionConfig";
import { getPracticeReviewBehaviorCopy } from "./practiceSetupModel";

type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

const sessionLengths: readonly PracticeSessionLength[] = [10, 20, 40];

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
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

  useEffect(() => {
    if (feedbackMode === "atSessionEnd") {
      setReviewBehaviorEnabled(false);
    }
  }, [feedbackMode]);

  const resolvedTrackId = route.params?.trackId ?? activeTrackId;
  if (!resolvedTrackId) return <Screen><EmptyState title="Choose a learning track" description="Session setup is unavailable until a track is selected." actionLabel="Choose track" onActionPress={() => navigation.navigate(ROUTES.SELECT_TRACK)} /></Screen>;
  const activeTrack = getTrackDisplay(resolvedTrackId);
  const algorithmMode = activeTrack.id === ALGORITHMS_TRACK_ID
    ? getAlgorithmMode(route.params?.mode ?? ALGORITHM_MODE_IDS.guidedPractice)
    : null;
  const reviewBehaviorCopy = getPracticeReviewBehaviorCopy(activeTrack.id);
  const topic = resolvePracticeTopic({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts,
  });

  function startSession() {
    const mode = route.params?.mode ?? (
      activeTrack.id === ALGORITHMS_TRACK_ID
        ? ALGORITHM_MODE_IDS.guidedPractice
        : "default"
    );
    if (activeTrack.id === ALGORITHMS_TRACK_ID && mode === ALGORITHM_MODE_IDS.interviewSimulation) {
      const entry = getAlgorithmsInterviewSimulationEntry();
      navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId: entry.profileId });
      return;
    }
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        ...(activeTrack.id === ALGORITHMS_TRACK_ID
          ? {
              reviewItemRefs: route.params?.reviewItemRefs,
              reviewSource: route.params?.reviewSource,
            }
          : { feedbackMode, reviewBehaviorEnabled, sessionLength }),
        mode,
        source: "practiceSetup",
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top", "bottom"]}>
        <AppStackHeader
          navigation={navigation}
          showBack
          subtitle={activeTrack.title}
        />

        <View style={styles.intro}>
          <Text style={styles.title}>Practice setup</Text>
          <Text style={styles.subtitle}>
            {algorithmMode
              ? `Review the fixed ${algorithmMode.title} profile for ${topic.title}.`
              : `Configure the next session for ${topic.title}.`}
          </Text>
        </View>

        {algorithmMode ? (
          <View style={styles.section}>
            <SectionHeader
              title="Fixed mode profile"
              subtitle="Algorithms session settings are owned by the selected mode."
              tight
            />
            <Card style={styles.reviewCard}>
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewTitle}>{algorithmMode.title}</Text>
                <Text style={styles.subtitle}>
                  {algorithmMode.profile.sessionLength} items · {algorithmMode.profile.feedbackMode === "afterEachAnswer" ? "Feedback after each answer" : "Feedback at session end"} · {algorithmMode.profile.timer.kind === "elapsedForeground" ? "Elapsed foreground timer" : "45-minute foreground countdown"} · {algorithmMode.profile.reinsertEnabled ? "Reinsert enabled" : "Reinsert disabled"}
                </Text>
              </View>
            </Card>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title="Session length" tight />
              <View style={styles.lengthGrid}>
                {sessionLengths.map((length) => (
                  <SelectableOption
                    key={length}
                    label={String(length)}
                    meta="Questions"
                    onPress={() => setSessionLength(length)}
                    selected={sessionLength === length}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Feedback mode" tight />
              <SelectablePanel
                detail="Correctness and explanation are shown after every item."
                label="After each answer"
                onPress={() => setFeedbackMode("afterEachAnswer")}
                selected={feedbackMode === "afterEachAnswer"}
              />
              <SelectablePanel
                detail="Correctness is hidden until the final summary and review."
                label="At session end"
                onPress={() => setFeedbackMode("atSessionEnd")}
                selected={feedbackMode === "atSessionEnd"}
              />
            </View>

            {feedbackMode === "afterEachAnswer" ? (
              <Card style={styles.reviewCard}>
                <View style={styles.reviewCopy}>
                  <Text style={styles.reviewTitle}>{reviewBehaviorCopy.title}</Text>
                  <Text style={styles.subtitle}>
                    {reviewBehaviorCopy.detail}
                  </Text>
                </View>
                {reviewBehaviorCopy.showToggle ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: reviewBehaviorEnabled }}
                    onPress={() => setReviewBehaviorEnabled((current) => !current)}
                    style={[
                      styles.switchTrack,
                      reviewBehaviorEnabled ? styles.switchTrackEnabled : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        reviewBehaviorEnabled ? styles.switchThumbEnabled : null,
                      ]}
                    />
                  </Pressable>
                ) : null}
              </Card>
            ) : null}
          </>
        )}

        <View style={styles.actions}>
          <Button onPress={startSession}>Start session</Button>
          <Button onPress={() => navigation.goBack()} variant="secondary">
            Back
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
};

function SelectableOption({ label, meta, onPress, selected }: SelectableOptionProps) {
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
};

function SelectablePanel({ detail, label, onPress, selected }: SelectablePanelProps) {
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

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.dark.background,
    flex: 1,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.small,
    color: colors.dark.textSecondary,
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
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 92,
    justifyContent: "center",
    padding: spacing.md,
  },
  selectedOption: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  lengthValue: {
    ...typography.heading,
    color: colors.dark.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  selectedText: {
    color: colors.dark.textPrimary,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  panel: {
    alignItems: "center",
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.borderStrong,
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
    color: colors.dark.textSecondary,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  radioSelected: {
    borderColor: colors.dark.primary,
  },
  radioDot: {
    backgroundColor: colors.dark.primary,
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
    color: colors.dark.textPrimary,
  },
  switchTrack: {
    backgroundColor: colors.dark.borderStrong,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    padding: 4,
    width: 56,
  },
  switchTrackEnabled: {
    backgroundColor: colors.dark.primary,
  },
  switchThumb: {
    backgroundColor: colors.dark.textPrimary,
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
