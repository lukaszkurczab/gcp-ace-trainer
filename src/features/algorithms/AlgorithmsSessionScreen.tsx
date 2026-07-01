import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  ProgressBar,
  Screen,
  SectionHeader,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  ALGORITHMS_TRACK_ID,
  completeTrainingSession,
  createTrainingSession,
} from "../../domain";
import type {
  ComplexityAnswer,
  TrainingAttempt,
  TrainingAttemptResponse,
  TrainingSession,
} from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import type { PracticeSessionRouteParams } from "../practice/sessionConfig";
import {
  addTrainingAttempt,
  addTrainingSession,
  getTrainingSessions,
  saveTrainingSessions,
} from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import {
  ALGORITHMS_SESSION_MODE_ID,
  ALGORITHM_ROADMAP,
  getActiveAlgorithmStaticMicroCheck,
  getAlgorithmAttemptStatus,
  getAlgorithmTrainingItemsForRoadmapNode,
  getFirstUsableAlgorithmRoadmapNode,
  isAlgorithmRoadmapNodeSelectable,
  scoreAlgorithmStaticMicroCheck,
  type AlgorithmRoadmapNode,
  type AlgorithmScoringStatus,
  type AlgorithmStaticCheckScore,
  type AlgorithmStaticMicroCheck,
  type AlgorithmTrainingItem,
} from "../../tracks/algorithms";

type AlgorithmsSessionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  nodeId?: string;
  sessionConfig?: PracticeSessionRouteParams;
};

type ComplexityDimension = "time" | "space";

type SessionSummary = {
  completed: number;
  correct: number;
  currentRoadmapNode: string;
  incorrect: number;
  partial: number;
};

const complexityChoices = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)"] as const;

export function AlgorithmsSessionScreen({ navigation, nodeId }: AlgorithmsSessionScreenProps) {
  const [node, setNode] = useState<AlgorithmRoadmapNode>(() => getFirstUsableAlgorithmRoadmapNode());
  const [items, setItems] = useState<readonly AlgorithmTrainingItem[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [complexityAnswer, setComplexityAnswer] = useState<ComplexityAnswer>({});
  const [checkedScore, setCheckedScore] = useState<AlgorithmStaticCheckScore | null>(null);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextNode = resolveSessionNode(nodeId);
    const nextItems = getAlgorithmTrainingItemsForRoadmapNode(nextNode.id);
    const startedAt = new Date().toISOString();
    const nextSession = createTrainingSession({
      itemRefs: nextItems.map((item) => ({
        itemId: item.id,
        itemType: item.type,
        trackId: ALGORITHMS_TRACK_ID,
      })),
      modeId: ALGORITHMS_SESSION_MODE_ID,
      startedAt,
      trackId: ALGORITHMS_TRACK_ID,
    });

    setNode(nextNode);
    setItems(nextItems);
    setSession(nextSession);
    setCurrentIndex(0);
    setAttempts([]);
    setSummary(null);
    resetAnswerState();

    void addTrainingSession(nextSession).then((result) => {
      if (!result.ok) {
        setStorageMessage("The session is running, but local session storage reported an issue.");
      }
    });
  }, [nodeId]);

  const currentItem = items[currentIndex];
  const currentCheck = useMemo(
    () => currentItem ? getActiveAlgorithmStaticMicroCheck(currentItem) : null,
    [currentItem],
  );
  const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;
  const canCheck = currentCheck ? hasAnswer(currentCheck, selectedOptionIds, complexityAnswer) : false;

  function resetAnswerState() {
    setSelectedOptionIds([]);
    setComplexityAnswer({});
    setCheckedScore(null);
  }

  function selectOption(check: AlgorithmStaticMicroCheck, optionId: string) {
    if (checkedScore) {
      return;
    }

    if (check.type === "multi_select") {
      setSelectedOptionIds((current) =>
        current.includes(optionId)
          ? current.filter((selectedId) => selectedId !== optionId)
          : [...current, optionId],
      );
      return;
    }

    if (check.type === "order_steps") {
      setSelectedOptionIds((current) =>
        current.includes(optionId) ? current : [...current, optionId],
      );
      return;
    }

    setSelectedOptionIds([optionId]);
  }

  function selectComplexity(dimension: ComplexityDimension, value: string) {
    if (checkedScore) {
      return;
    }

    setComplexityAnswer((current) => ({
      ...current,
      [dimension]: value,
    }));
  }

  async function checkAnswer() {
    if (!currentItem || !currentCheck || !session || !canCheck) {
      return;
    }

    const answer = getSubmittedAnswer(currentCheck, selectedOptionIds, complexityAnswer);
    const score = scoreAlgorithmStaticMicroCheck(currentCheck, answer);
    const answeredAt = new Date().toISOString();
    const attempt: TrainingAttempt = {
      answeredAt,
      feedbackSignals: [score.status === "correct" ? "correct" : "review_recommended"],
      id: `attempt:${session.id}:${currentItem.id}:${answeredAt}`,
      itemId: currentItem.id,
      itemType: currentItem.type,
      mistakeTypeRefs: score.mistakeTypes.map((mistakeType) => ({
        axisId: "mistake_type",
        nodeId: mistakeType,
        role: "mistake_type",
        trackId: ALGORITHMS_TRACK_ID,
      })),
      modeId: session.modeId,
      response: buildTrainingAttemptResponse(currentCheck, selectedOptionIds, complexityAnswer),
      result: score.result,
      sessionId: session.id,
      trackId: ALGORITHMS_TRACK_ID,
    };
    const result = await addTrainingAttempt(attempt);

    if (!result.ok) {
      setStorageMessage("The answer was checked, but local attempt storage reported an issue.");
    }

    setAttempts((current) => [attempt, ...current]);
    setCheckedScore(score);
  }

  async function goNext() {
    if (!session) {
      return;
    }

    if (currentIndex >= items.length - 1) {
      const completedAt = new Date().toISOString();
      const completed = completeTrainingSession({
        attempts,
        completedAt,
        session,
      });
      const sessionsResult = await getTrainingSessions();
      const nextSessions = [
        completed.session,
        ...sessionsResult.value.filter((candidate) => candidate.id !== session.id),
      ];
      const saveResult = await saveTrainingSessions(nextSessions);

      if (!sessionsResult.ok || !saveResult.ok) {
        setStorageMessage("The summary is available, but local session completion storage reported an issue.");
      }

      setSession(completed.session);
      setSummary(buildSessionSummary(attempts, node.label));
      return;
    }

    setCurrentIndex((current) => current + 1);
    resetAnswerState();
  }

  if (summary) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={<Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: node.id })}>Back to Practice</Button>}
      >
        <SessionTopBar onClose={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: node.id })} />
        <Card variant="tonal" style={styles.summaryCard}>
          <Text style={styles.heroEyebrow}>Session summary</Text>
          <SectionHeader
            title="Algorithms session complete"
            subtitle={`Current roadmap node: ${summary.currentRoadmapNode}`}
            tight
          />
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Completed" value={summary.completed} />
            <SummaryMetric label="Correct" value={summary.correct} />
            <SummaryMetric label="Partial" value={summary.partial} />
            <SummaryMetric label="Incorrect" value={summary.incorrect} />
          </View>
        </Card>
        {storageMessage ? <StorageNotice message={storageMessage} /> : null}
      </Screen>
    );
  }

  if (!currentItem || !currentCheck) {
    return (
      <Screen>
        <EmptyState
          title="No Algorithms items"
          description="No static items are available for this roadmap node."
          actionLabel="Back to Practice"
          onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: node.id })}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        checkedScore ? (
          <Button onPress={() => void goNext()}>
            {currentIndex >= items.length - 1 ? "Finish Session" : "Next Item"}
          </Button>
        ) : (
          <Button disabled={!canCheck} onPress={() => void checkAnswer()}>
            Check Answer
          </Button>
        )
      }
    >
      <SessionTopBar onClose={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: node.id })} />

      <View style={styles.progressBlock}>
        <Text style={styles.itemCount}>Item {currentIndex + 1} of {items.length}</Text>
        <ProgressBar
          progress={progress}
          tone={checkedScore ? getProgressTone(checkedScore.status) : "primary"}
        />
      </View>

      <Card style={styles.itemCard}>
        {currentCheck.type === "trace_next_step" ? (
          <TraceDrillPrompt check={currentCheck} item={currentItem} node={node} />
        ) : (
          <>
            <Text style={styles.heroEyebrow}>Algorithms</Text>
            <SectionHeader
              title={currentItem.title}
              subtitle={currentItem.prompt}
              action={<Badge label={node.label} tone="primary" />}
              tight
            />
            <View style={styles.metaRow}>
              <Badge label={formatItemType(currentItem.type)} tone="neutral" />
              <Badge label={formatItemType(currentCheck.type)} tone="info" />
            </View>
          </>
        )}
      </Card>

      <Card style={styles.answerCard}>
        <SectionHeader title="Answer" subtitle={currentCheck.prompt} tight />
        <AnswerControl
          check={currentCheck}
          complexityAnswer={complexityAnswer}
          onResetOrder={() => setSelectedOptionIds([])}
          onSelectComplexity={selectComplexity}
          onSelectOption={selectOption}
          selectedOptionIds={selectedOptionIds}
          submitted={checkedScore !== null}
        />
      </Card>

      {checkedScore ? (
        <FeedbackCard check={currentCheck} item={currentItem} score={checkedScore} />
      ) : null}

      {storageMessage ? <StorageNotice message={storageMessage} /> : null}
    </Screen>
  );
}

type TraceDrillPromptProps = {
  check: AlgorithmStaticMicroCheck;
  item: AlgorithmTrainingItem;
  node: AlgorithmRoadmapNode;
};

function TraceDrillPrompt({ check, item, node }: TraceDrillPromptProps) {
  const traceStep = item.stepByStepTrace?.[0];
  const stateLines = traceStep?.state ?? [];

  return (
    <>
      <Text style={styles.heroEyebrow}>TRACE DRILL</Text>
      <SectionHeader
        title="Trace the Algorithm"
        subtitle={item.prompt}
        action={<Badge label={node.label} tone="primary" />}
        tight
      />

      {stateLines.length > 0 ? (
        <View style={styles.tracePanel}>
          <Text style={styles.tracePanelLabel}>Current state</Text>
          <View style={styles.traceStateWrap}>
            {stateLines.map((line) => (
              <Text key={line} style={styles.traceStateChip}>{line}</Text>
            ))}
          </View>
          {traceStep?.description ? (
            <Text style={styles.traceDescription}>{traceStep.description}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.traceQuestion}>
        <Text style={styles.tracePanelLabel}>Question</Text>
        <Text style={styles.traceQuestionText}>{check.prompt || "What happens next?"}</Text>
      </View>
    </>
  );
}

type SessionTopBarProps = {
  onClose: () => void;
};

function SessionTopBar({ onClose }: SessionTopBarProps) {
  return (
    <View style={styles.sessionTopBar}>
      <Pressable
        accessibilityLabel="Close Algorithms session"
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
      >
        <Icon name="close" size={18} />
      </Pressable>
      <Text style={styles.sessionBrand}>Patternly</Text>
    </View>
  );
}

type AnswerControlProps = {
  check: AlgorithmStaticMicroCheck;
  complexityAnswer: ComplexityAnswer;
  onResetOrder: () => void;
  onSelectComplexity: (dimension: ComplexityDimension, value: string) => void;
  onSelectOption: (check: AlgorithmStaticMicroCheck, optionId: string) => void;
  selectedOptionIds: readonly string[];
  submitted: boolean;
};

function AnswerControl({
  check,
  complexityAnswer,
  onResetOrder,
  onSelectComplexity,
  onSelectOption,
  selectedOptionIds,
  submitted,
}: AnswerControlProps) {
  if (check.type === "complexity_pair") {
    return (
      <View style={styles.complexityGroups}>
        <ComplexityChoiceGroup
          label="Time"
          onSelect={(value) => onSelectComplexity("time", value)}
          selectedValue={complexityAnswer.time}
          submitted={submitted}
        />
        <ComplexityChoiceGroup
          label="Space"
          onSelect={(value) => onSelectComplexity("space", value)}
          selectedValue={complexityAnswer.space}
          submitted={submitted}
        />
      </View>
    );
  }

  if (check.type === "order_steps") {
    const remainingOptions = (check.options ?? []).filter((option) => !selectedOptionIds.includes(option.id));

    return (
      <View style={styles.options}>
        <View style={styles.selectedOrder}>
          {selectedOptionIds.length > 0 ? (
            selectedOptionIds.map((optionId, index) => (
              <Text key={`${optionId}-${index}`} style={styles.selectedOrderText}>
                {index + 1}. {getOptionText(check, optionId)}
              </Text>
            ))
          ) : (
            <Text style={styles.mutedText}>Tap steps below to build the order.</Text>
          )}
        </View>
        {remainingOptions.map((option) => (
          <OptionButton
            key={option.id}
            label={option.text}
            onPress={() => onSelectOption(check, option.id)}
            selected={false}
            submitted={submitted}
          />
        ))}
        <Button disabled={submitted || selectedOptionIds.length === 0} onPress={onResetOrder} variant="secondary">
          Reset Order
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.options}>
      {(check.options ?? []).map((option) => (
        <OptionButton
          key={option.id}
          label={option.text}
          onPress={() => onSelectOption(check, option.id)}
          selected={selectedOptionIds.includes(option.id)}
          submitted={submitted}
        />
      ))}
    </View>
  );
}

type ComplexityChoiceGroupProps = {
  label: string;
  onSelect: (value: string) => void;
  selectedValue?: string;
  submitted: boolean;
};

function ComplexityChoiceGroup({
  label,
  onSelect,
  selectedValue,
  submitted,
}: ComplexityChoiceGroupProps) {
  return (
    <View style={styles.complexityGroup}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.choiceWrap}>
        {complexityChoices.map((choice) => (
          <Pressable
            accessibilityRole="button"
            disabled={submitted}
            key={`${label}-${choice}`}
            onPress={() => onSelect(choice)}
            style={({ pressed }) => [
              styles.choiceChip,
              selectedValue === choice ? styles.choiceChipSelected : null,
              pressed && !submitted ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.choiceText, selectedValue === choice ? styles.choiceTextSelected : null]}>
              {choice}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type OptionButtonProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
  submitted: boolean;
};

function OptionButton({ label, onPress, selected, submitted }: OptionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={submitted}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected ? styles.optionSelected : null,
        pressed && !submitted ? styles.pressed : null,
      ]}
    >
      <View style={[styles.optionMarker, selected ? styles.optionMarkerSelected : null]} />
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

type FeedbackCardProps = {
  check: AlgorithmStaticMicroCheck;
  item: AlgorithmTrainingItem;
  score: AlgorithmStaticCheckScore;
};

function FeedbackCard({ check, item, score }: FeedbackCardProps) {
  return (
    <Card variant={score.status === "correct" ? "success" : "warning"}>
      <SectionHeader
        title={formatStatus(score.status)}
        action={<Badge label={formatStatus(score.status)} tone={score.status === "correct" ? "success" : "warning"} />}
        tight
      />
      <Text style={styles.feedbackText}>{score.feedback}</Text>
      {check.type === "trace_next_step" ? (
        <View style={styles.traceFeedback}>
          <Text style={styles.feedbackText}>{item.feedbackModel.decisionSignal}</Text>
          <Text style={styles.feedbackText}>{item.feedbackModel.nextAction}</Text>
        </View>
      ) : null}
      {score.mistakeTypes.length > 0 ? (
        <Text style={styles.feedbackText}>
          Review: {score.mistakeTypes.map(formatItemType).join(", ")}
        </Text>
      ) : null}
    </Card>
  );
}

type SummaryMetricProps = {
  label: string;
  value: number;
};

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StorageNotice({ message }: { message: string }) {
  return (
    <Card variant="warning">
      <Text style={styles.feedbackText}>{message}</Text>
    </Card>
  );
}

function resolveSessionNode(nodeId: string | undefined): AlgorithmRoadmapNode {
  if (!nodeId) {
    return getFirstUsableAlgorithmRoadmapNode();
  }

  const selectedNode = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === nodeId);

  if (selectedNode && isAlgorithmRoadmapNodeSelectable(selectedNode)) {
    return selectedNode;
  }

  return getFirstUsableAlgorithmRoadmapNode();
}

function hasAnswer(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): boolean {
  if (check.type === "complexity_pair") {
    return Boolean(complexityAnswer.time && complexityAnswer.space);
  }

  return selectedOptionIds.length > 0;
}

function getSubmittedAnswer(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
) {
  if (check.type === "complexity_pair") {
    return complexityAnswer;
  }

  if (check.type === "single_choice" || check.type === "select_pseudocode_line" || check.type === "trace_next_step") {
    return selectedOptionIds[0] ?? "";
  }

  return selectedOptionIds;
}

function buildTrainingAttemptResponse(
  check: AlgorithmStaticMicroCheck,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): TrainingAttemptResponse {
  if (check.type === "complexity_pair") {
    return {
      kind: "complexity_analysis",
      selectedComplexityAnswer: complexityAnswer,
    };
  }

  return {
    kind: "option_selection",
    selectedOptionIds: [...selectedOptionIds],
  };
}

function buildSessionSummary(
  attempts: readonly TrainingAttempt[],
  nodeLabel: string,
): SessionSummary {
  const statuses = attempts.map((attempt) => getAlgorithmAttemptStatus(attempt.result));

  return {
    completed: attempts.length,
    correct: statuses.filter((status) => status === "correct").length,
    currentRoadmapNode: nodeLabel,
    incorrect: statuses.filter((status) => status === "incorrect").length,
    partial: statuses.filter((status) => status === "partial").length,
  };
}

function getProgressTone(status: AlgorithmScoringStatus): "primary" | "success" | "warning" {
  return status === "correct" ? "success" : "warning";
}

function getOptionText(check: AlgorithmStaticMicroCheck, optionId: string): string {
  return check.options?.find((option) => option.id === optionId)?.text ?? optionId;
}

function formatItemType(value: string): string {
  return value.split("_").map(capitalize).join(" ");
}

function formatStatus(status: AlgorithmScoringStatus): string {
  if (status === "partial") {
    return "Partial";
  }

  return capitalize(status);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

const styles = StyleSheet.create({
  sessionTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sessionBrand: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  pressed: {
    opacity: 0.82,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  itemCount: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  itemCard: {
    gap: spacing.lg,
  },
  answerCard: {
    gap: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.dark.primary,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tracePanel: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.md,
  },
  tracePanelLabel: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  traceStateWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  traceStateChip: {
    ...typography.small,
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.dark.textPrimary,
    fontFamily: "monospace",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  traceDescription: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  traceQuestion: {
    gap: spacing.xs,
  },
  traceQuestionText: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.dark.primary,
  },
  optionMarker: {
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  optionMarkerSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  complexityGroups: {
    gap: spacing.lg,
  },
  complexityGroup: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceChipSelected: {
    borderColor: colors.dark.primary,
  },
  choiceText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  choiceTextSelected: {
    color: colors.dark.textPrimary,
  },
  selectedOrder: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  selectedOrderText: {
    ...typography.small,
    color: colors.dark.textPrimary,
  },
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  feedbackText: {
    ...typography.body,
    color: colors.dark.textPrimary,
  },
  traceFeedback: {
    gap: spacing.xs,
  },
  summaryCard: {
    gap: spacing.xl,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  summaryMetric: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 132,
    padding: spacing.md,
  },
  summaryValue: {
    ...typography.heading,
    color: colors.dark.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  summaryLabel: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
});
