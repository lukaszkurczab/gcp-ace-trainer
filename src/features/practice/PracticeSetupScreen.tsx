import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { DEFAULT_TRACK_ID, getTrackDefinition, type TrackId } from "../../domain";
import type { TrainingAttempt } from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import { getActiveTrackId, getTrainingAttempts } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import { AppBottomNavigation } from "../navigation/AppBottomNavigation";
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

type PracticeSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.PRACTICE_SETUP
>;

const sessionLengths: readonly PracticeSessionLength[] = [10, 20, 40];
const TAB_BAR_RESERVED_HEIGHT = 128;

export function PracticeSetupScreen({ navigation, route }: PracticeSetupScreenProps) {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>(
    route.params?.trackId ?? DEFAULT_TRACK_ID,
  );
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
          setActiveTrackId(route.params?.trackId ?? savedTrackId);
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

  const activeTrack = getTrackDefinition(route.params?.trackId ?? activeTrackId);
  const topic = resolvePracticeTopic({
    activeTrackId: activeTrack.id,
    routeTopicId: route.params?.topicId,
    trainingAttempts,
  });

  function startSession() {
    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        feedbackMode,
        mode: route.params?.mode ?? "default",
        reviewBehaviorEnabled,
        sessionLength,
        source: "practiceSetup",
        topicId: topic.id,
        trackId: activeTrack.id,
      }),
    );
  }

  return (
    <View style={styles.shell}>
      <Screen edges={["top"]} style={styles.screenContent}>
        <AppStackHeader
          navigation={navigation}
          showBack
          subtitle={activeTrack.title}
        />

        <View style={styles.intro}>
          <Text style={styles.title}>Practice setup</Text>
          <Text style={styles.subtitle}>
            Configure the next session for {topic.title}.
          </Text>
        </View>

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
            detail="Correctness and explanation are shown after every question."
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
              <Text style={styles.reviewTitle}>Review behavior</Text>
              <Text style={styles.subtitle}>
                Add missed items to an end-of-session correction pass. Extra review questions are tracked separately from normal stats.
              </Text>
            </View>
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
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button onPress={startSession}>Start session</Button>
          <Button onPress={() => navigation.goBack()} variant="secondary">
            Back
          </Button>
        </View>
      </Screen>
      <AppBottomNavigation activeId="practice" navigation={navigation} />
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
    getTrackDefinition(input.activeTrackId),
    input.trainingAttempts,
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
