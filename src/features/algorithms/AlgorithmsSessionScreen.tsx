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
  TrainingSession,
} from "../../domain/training";
import type { RootStackParamList } from "../../navigation";
import type { PracticeSessionRouteParams } from "../practice/sessionConfig";
import {
  addTrainingAttempt,
  addReviewQueueItems,
  addTrainingSession,
  getReviewQueueItems,
  getTrainingSessions,
  getTrainingAttempts,
  removeReviewQueueItem,
  saveTrainingSessions,
  type LocalStorageIssue,
} from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import {
  ALGORITHM_ROADMAP,
  getActiveAlgorithmStaticMicroCheck,
  getFirstUsableAlgorithmRoadmapNode,
  getShuffledAlgorithmStaticCheckOptions,
  isAlgorithmRoadmapNodeSelectable,
  selectAlgorithmSessionItems,
  type AlgorithmRoadmapNode,
  type AlgorithmScoringStatus,
  type AlgorithmStaticCheckScore,
  type AlgorithmStaticMicroCheck,
  type AlgorithmTrainingItem,
} from "../../tracks/algorithms";
import { resetToPracticeHubAfterSession } from "../practice/practiceNavigation";
import { buildPracticeSessionConfig, type PracticeSessionMode } from "../practice/sessionConfig";
import {
  buildAlgorithmsImmediateFeedbackModel,
  buildAlgorithmsSummaryActions,
  buildAlgorithmsSessionSummary,
  getAlgorithmsSessionModeIdForRouteMode,
  buildAlgorithmsReviewQueueUpdate,
  buildAlgorithmsSubmission,
  formatAlgorithmItemType,
  formatAlgorithmStatus,
  getAlgorithmsFeedbackState,
  type AlgorithmsSubmission,
  type AlgorithmsSummaryAction,
  type AlgorithmsSessionSummary,
} from "./algorithmsSessionModel";

type AlgorithmsSessionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  nodeId?: string;
  sessionConfig?: PracticeSessionRouteParams;
};

type ComplexityDimension = "time" | "space";

const complexityChoices = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)"] as const;

export function AlgorithmsSessionScreen({ navigation, nodeId, sessionConfig }: AlgorithmsSessionScreenProps) {
  const reviewItemIdsKey = sessionConfig?.reviewItemIds?.join("|") ?? "";
  const [node, setNode] = useState<AlgorithmRoadmapNode>(() => getFirstUsableAlgorithmRoadmapNode());
  const [items, setItems] = useState<readonly AlgorithmTrainingItem[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [complexityAnswer, setComplexityAnswer] = useState<ComplexityAnswer>({});
  const [checkedScore, setCheckedScore] = useState<AlgorithmStaticCheckScore | null>(null);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);
  const [summary, setSummary] = useState<AlgorithmsSessionSummary | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      const nextNode = resolveSessionNode(nodeId);
      const startedAt = new Date().toISOString();
      setIsLoading(true);
      setStorageMessage(null);

      const [attemptsResult, reviewQueueResult] = await Promise.all([
        getTrainingAttempts(),
        getReviewQueueItems(),
      ]);

      if (!isActive) {
        return;
      }

      const nextItems = selectAlgorithmSessionItems({
        attempts: attemptsResult.value,
        mode: sessionConfig?.mode ?? "default",
        nodeId: nextNode.id,
        now: startedAt,
        reviewItemIds: sessionConfig?.reviewItemIds,
        reviewQueueItems: reviewQueueResult.value,
        reviewSource: sessionConfig?.reviewSource,
        sessionLength: sessionConfig?.sessionLength ?? 20,
      });
      const nextDisplayNode = resolveDisplayNode(nextItems, nextNode, sessionConfig?.mode ?? "default");
      const loadIssues = [
        ...(attemptsResult.issues ?? []),
        ...(reviewQueueResult.issues ?? []),
      ];

      if (loadIssues.length > 0) {
        setStorageMessage(formatStorageFailure("The session is using available local data, but some progress data could not be loaded", loadIssues));
      }

      if (nextItems.length === 0) {
        setNode(nextDisplayNode);
        setItems([]);
        setSession(null);
        setCurrentIndex(0);
        setAttempts([]);
        setSummary(null);
        resetAnswerState();
        setIsLoading(false);
        return;
      }

      const nextSession = createTrainingSession({
        itemRefs: nextItems.map((item) => ({
          itemId: item.id,
          itemType: item.type,
          trackId: ALGORITHMS_TRACK_ID,
        })),
        modeId: getAlgorithmsSessionModeIdForRouteMode(sessionConfig?.mode),
        startedAt,
        trackId: ALGORITHMS_TRACK_ID,
      });

      setNode(nextDisplayNode);
      setItems(nextItems);
      setSession(nextSession);
      setCurrentIndex(0);
      setAttempts([]);
      setSummary(null);
      resetAnswerState();
      setIsLoading(false);

      void addTrainingSession(nextSession).then((result) => {
        if (!result.ok) {
          setStorageMessage(formatStorageFailure("The session is running, but it was not saved locally", result.issues));
        }
      });
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [nodeId, reviewItemIdsKey, sessionConfig?.mode, sessionConfig?.reviewSource, sessionConfig?.sessionLength]);

  const currentItem = items[currentIndex];
  const currentCheck = useMemo(
    () => currentItem ? getActiveAlgorithmStaticMicroCheck(currentItem) : null,
    [currentItem],
  );
  const currentCheckOptions = useMemo(
    () => currentCheck ? getShuffledAlgorithmStaticCheckOptions(currentCheck) : [],
    [currentCheck?.id],
  );
  const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;
  const canCheck = currentCheck ? hasAnswer(currentCheck, selectedOptionIds, complexityAnswer) : false;
  const feedbackMode = sessionConfig?.feedbackMode ?? "afterEachAnswer";
  const feedbackState = getAlgorithmsFeedbackState(feedbackMode, checkedScore);
  const summaryActions = summary
    ? buildAlgorithmsSummaryActions(summary, sessionConfig)
    : [];

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
    if (!currentItem || !currentCheck || !session || !canCheck || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const answeredAt = new Date().toISOString();
    const submission = buildAlgorithmsSubmission({
      answeredAt,
      check: currentCheck,
      complexityAnswer,
      item: currentItem,
      selectedOptionIds,
      session,
    });
    const result = await addTrainingAttempt(submission.attempt);

    if (!result.ok) {
      setStorageMessage(formatStorageFailure("The answer was checked, but this attempt was not saved locally", result.issues));
    }

    if (sessionConfig?.mode === "review") {
      await saveReviewQueueUpdate(submission);
    } else if (submission.reviewQueueItems.length > 0) {
      const reviewResult = await addReviewQueueItems([...submission.reviewQueueItems]);

      if (!reviewResult.ok) {
        setStorageMessage(formatStorageFailure("The answer was checked, but review scheduling was not saved locally", reviewResult.issues));
      }
    }

    const nextAttempts = [submission.attempt, ...attempts];
    setAttempts(nextAttempts);

    if (feedbackMode === "atSessionEnd") {
      await goNext(nextAttempts);
      setIsSubmitting(false);
      return;
    }

    setCheckedScore(submission.score);
    setIsSubmitting(false);
  }

  async function goNext(nextAttempts = attempts) {
    if (!session) {
      return;
    }

    if (currentIndex >= items.length - 1) {
      const completedAt = new Date().toISOString();
      const completed = completeTrainingSession({
        attempts: nextAttempts,
        completedAt,
        session,
      });
      const sessionsResult = await getTrainingSessions();
      const nextSessions = [
        completed.session,
        ...sessionsResult.value.filter((candidate) => candidate.id !== session.id),
      ];
      const saveResult = await saveTrainingSessions(nextSessions);

      if (!saveResult.ok) {
        setStorageMessage(formatStorageFailure(
          "The summary is available, but session completion was not saved locally",
          saveResult.issues,
        ));
      }

      setSession(completed.session);
      setSummary(buildAlgorithmsSessionSummary(nextAttempts, items, node.label, {
        mode: sessionConfig?.mode ?? "default",
      }));
      return;
    }

    setCurrentIndex((current) => current + 1);
    resetAnswerState();
  }

  async function saveReviewQueueUpdate(submission: AlgorithmsSubmission) {
    const update = buildAlgorithmsReviewQueueUpdate(submission);

    if (update.action === "clear") {
      const reviewResult = await removeReviewQueueItem(update.trackId, update.itemId);

      if (!reviewResult.ok) {
        setStorageMessage(formatStorageFailure("The answer was checked, but review queue clearing was not saved locally", reviewResult.issues));
      }
      return;
    }

    if (update.action === "keep" && update.reviewQueueItems.length > 0) {
      const reviewResult = await addReviewQueueItems([...update.reviewQueueItems]);

      if (!reviewResult.ok) {
        setStorageMessage(formatStorageFailure("The answer was checked, but review scheduling was not saved locally", reviewResult.issues));
      }
    }
  }

  function handleSummaryAction(action: AlgorithmsSummaryAction) {
    if (action.kind === "viewProgress") {
      navigation.navigate(ROUTES.HOME, { initialTab: "progress" });
      return;
    }

    startSummarySession(getSummaryActionMode(action));
  }

  function startSummarySession(mode: PracticeSessionMode) {
    const reviewItemIds = mode === "review"
      ? summaryActions.find((action) => action.kind === "reviewMissed")?.reviewItemIds
      : undefined;

    navigation.navigate(
      ROUTES.PRACTICE_SESSION,
      buildPracticeSessionConfig({
        feedbackMode: mode === "practice" ? "atSessionEnd" : "afterEachAnswer",
        mode,
        reviewItemIds,
        reviewSource: mode === "review" ? "sessionMisses" : undefined,
        sessionLength: mode === "practice" ? 40 : 20,
        source: mode === "default" ? "practiceHub" : "modeShortcut",
        topicId: node.id,
        trackId: ALGORITHMS_TRACK_ID,
      }),
    );
  }

  if (summary) {
    return (
      <Screen edges={["top", "bottom"]}>
        <SessionTopBar onClose={() => resetToPracticeHubAfterSession(navigation, node.id)} />
        <Card variant="tonal" style={styles.summaryCard}>
          <Text style={styles.heroEyebrow}>Session summary</Text>
          <SectionHeader
            title="Algorithms session complete"
            subtitle={`Score: ${summary.correct}/${summary.completed} correct. Current roadmap node: ${summary.currentRoadmapNode}`}
            tight
          />
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Completed" value={summary.completed} />
            <SummaryMetric label="Correct" value={summary.correct} />
            <SummaryMetric label="Partial" value={summary.partial} />
            <SummaryMetric label="Incorrect" value={summary.incorrect} />
          </View>
        </Card>
        <Card style={styles.diagnosisCard}>
          <SectionHeader title="Next action" subtitle="Choose the next step from this result." tight />
          <View style={styles.summaryActions}>
            {summaryActions.map((action) => (
              <View key={action.kind} style={styles.summaryAction}>
                <Button
                  onPress={() => handleSummaryAction(action)}
                  variant={action.priority === "primary" ? "primary" : "secondary"}
                >
                  {action.label}
                </Button>
                <Text style={styles.summaryActionDetail}>{action.detail}</Text>
              </View>
            ))}
          </View>
        </Card>
        {summary.reviewSession ? (
          <Card style={styles.diagnosisCard}>
            <SectionHeader title="Review outcome" subtitle="Queue updates from this review session." tight />
            <View style={styles.summaryGrid}>
              <SummaryMetric label="Cleared items" value={summary.reviewSession.clearedItems} />
              <SummaryMetric label="Still needs review" value={summary.reviewSession.stillNeedsReview} />
            </View>
            <FeedbackSection title="Next suggested action" text={summary.reviewSession.nextSuggestedAction} />
          </Card>
        ) : null}
        <Card style={styles.diagnosisCard}>
          <SectionHeader title="Diagnosis" subtitle="Use this to choose the next review target." tight />
          <DiagnosticList title="Strong" items={summary.strong} emptyText="No strong pattern signal recorded yet." />
          <DiagnosticList title="Needs review" items={summary.needsReview} emptyText="No review target from this session." />
          <DiagnosticList title="Recommended next" items={summary.recommendedNext} emptyText="Continue with the current roadmap node." />
        </Card>
        {feedbackMode === "atSessionEnd" ? (
          <>
            <Card style={styles.diagnosisCard}>
              <SectionHeader
                title="Item review"
                subtitle="Review answers, key signals, rules, and traps from this session."
                tight
              />
            </Card>
            {summary.reviewItems.map((reviewItem, index) => (
              <Card
                key={`${reviewItem.itemId}-${index}`}
                variant={reviewItem.result === "correct" ? "success" : "warning"}
              >
                <SectionHeader
                  title={`Item ${index + 1}: ${reviewItem.title}`}
                  action={
                    <Badge
                      label={formatAlgorithmStatus(reviewItem.result)}
                      tone={reviewItem.result === "correct" ? "success" : "warning"}
                    />
                  }
                  tight
                />
                <FeedbackSection title="Selected answer" text={reviewItem.selectedAnswer} />
                <FeedbackSection title="Expected" text={reviewItem.correctAnswer} />
                <FeedbackSection title="Result" text={formatAlgorithmStatus(reviewItem.result)} />
                {shouldShowFeedbackText(reviewItem.explanation, reviewItem.correctAnswer) ? (
                  <FeedbackSection title="Rule" text={reviewItem.explanation} />
                ) : null}
                <FeedbackSection title="Key signal" text={reviewItem.whyThisPattern} />
                {reviewItem.complexity ? <FeedbackSection title="Complexity" text={reviewItem.complexity} /> : null}
                <FeedbackSection title="Common trap" text={reviewItem.commonTrap} />
              </Card>
            ))}
          </>
        ) : null}
        {storageMessage ? <StorageNotice message={storageMessage} /> : null}
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <EmptyState
          title="Preparing Algorithms session"
          description="Loading local progress and review items."
        />
      </Screen>
    );
  }

  if (!currentItem || !currentCheck) {
    const emptyState = getEmptySessionStateCopy(sessionConfig?.mode ?? "default");

    return (
      <Screen>
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          actionLabel="Back to Practice"
          onActionPress={() => resetToPracticeHubAfterSession(navigation, node.id)}
        />
        {storageMessage ? <StorageNotice message={storageMessage} /> : null}
      </Screen>
    );
  }

  return (
    <Screen
      edges={["top", "bottom"]}
      style={styles.sessionContent}
      footer={
        feedbackState.hasSubmittedAnswer ? (
          <Button onPress={() => void goNext()}>
            {currentIndex >= items.length - 1 ? "Finish Session" : "Next Item"}
          </Button>
        ) : (
          <Button disabled={!canCheck || isSubmitting} onPress={() => void checkAnswer()}>
            {feedbackMode === "atSessionEnd"
              ? currentIndex >= items.length - 1 ? "Finish Session" : "Next Item"
              : "Check Answer"}
          </Button>
        )
      }
    >
      <SessionTopBar onClose={() => resetToPracticeHubAfterSession(navigation, node.id)} />

      <View style={styles.progressBlock}>
        {sessionConfig?.mode === "practice" ? (
          <Text style={styles.itemCount}>Mixed practice</Text>
        ) : null}
        {sessionConfig?.mode === "weakArea" ? (
          <Text style={styles.itemCount}>Weak area: {node.label}</Text>
        ) : null}
        <Text style={styles.itemCount}>Item {currentIndex + 1} of {items.length}</Text>
        <ProgressBar
          progress={progress}
          tone={feedbackState.showImmediateFeedback && checkedScore ? getProgressTone(checkedScore.status) : "primary"}
        />
      </View>

      <Card style={styles.itemCard}>
        {currentCheck.type === "trace_next_step" ? (
          <TraceDrillPrompt check={currentCheck} item={currentItem} node={node} />
        ) : (
          <>
            <Text style={styles.heroEyebrow}>Algorithms</Text>
            <Text style={styles.itemTitle}>{currentItem.title}</Text>
            <Text style={styles.itemPrompt}>{currentItem.prompt}</Text>
            <View style={styles.itemBadgeRow}>
              <Badge label={node.label} tone="primary" />
              <Badge label={formatAlgorithmItemType(currentItem.type)} tone="neutral" />
              <Badge label={formatAlgorithmItemType(currentCheck.type)} tone="info" />
            </View>
          </>
        )}
      </Card>

      <Card style={styles.answerCard}>
        <SectionHeader title="Answer" subtitle={currentCheck.prompt} tight />
        <AnswerControl
          check={currentCheck}
          checkOptions={currentCheckOptions}
          complexityAnswer={complexityAnswer}
          onResetOrder={() => setSelectedOptionIds([])}
          onSelectComplexity={selectComplexity}
          onSelectOption={selectOption}
          selectedOptionIds={selectedOptionIds}
          submitted={feedbackState.hasSubmittedAnswer || isSubmitting}
        />
      </Card>

      {feedbackState.showImmediateFeedback && checkedScore ? (
        <FeedbackCard
          check={currentCheck}
          complexityAnswer={complexityAnswer}
          item={currentItem}
          score={checkedScore}
          selectedOptionIds={selectedOptionIds}
        />
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
      <Text style={styles.itemTitle}>Trace the Algorithm</Text>
      <Text style={styles.itemPrompt}>{item.prompt}</Text>
      <View style={styles.itemBadgeRow}>
        <Badge label={node.label} tone="primary" />
        <Badge label={formatAlgorithmItemType(item.type)} tone="neutral" />
        <Badge label={formatAlgorithmItemType(check.type)} tone="info" />
      </View>

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
  checkOptions: readonly NonNullable<AlgorithmStaticMicroCheck["options"]>[number][];
  complexityAnswer: ComplexityAnswer;
  onResetOrder: () => void;
  onSelectComplexity: (dimension: ComplexityDimension, value: string) => void;
  onSelectOption: (check: AlgorithmStaticMicroCheck, optionId: string) => void;
  selectedOptionIds: readonly string[];
  submitted: boolean;
};

function AnswerControl({
  check,
  checkOptions,
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
    const remainingOptions = checkOptions.filter((option) => !selectedOptionIds.includes(option.id));

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
      {checkOptions.map((option) => (
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
            <View style={[styles.choiceDot, selectedValue === choice ? styles.choiceDotSelected : null]} />
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
  complexityAnswer: ComplexityAnswer;
  item: AlgorithmTrainingItem;
  score: AlgorithmStaticCheckScore;
  selectedOptionIds: readonly string[];
};

function FeedbackCard({
  check,
  complexityAnswer,
  item,
  score,
  selectedOptionIds,
}: FeedbackCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const feedback = buildAlgorithmsImmediateFeedbackModel({
    check,
    complexityAnswer,
    item,
    score,
    selectedOptionIds,
  });
  const hasDetails = Boolean(feedback.reasoning.commonTrap || feedback.reasoning.mistakeType);

  return (
    <Card style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackTitle}>Feedback</Text>
        <Badge label={feedback.statusLabel} tone={getFeedbackStatusTone(feedback.status)} />
      </View>

      <View style={styles.feedbackRows}>
        <FeedbackRow title="Answer" text={feedback.answerSummary} />
        <FeedbackRow title="Key signal" text={feedback.keySignal} />
        <FeedbackRow title="Rule" text={feedback.rule} />
      </View>

      {hasDetails ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowDetails((current) => !current)}
          style={({ pressed }) => [styles.reasoningToggle, pressed ? styles.pressed : null]}
        >
          <Text style={styles.reasoningToggleText}>{showDetails ? "Hide details" : "Show details"}</Text>
        </Pressable>
      ) : null}

      {showDetails ? (
        <View style={styles.reasoningPanel}>
          {feedback.reasoning.commonTrap ? (
            <FeedbackRow title="Common trap" text={feedback.reasoning.commonTrap} />
          ) : null}
          {feedback.reasoning.mistakeType ? (
            <FeedbackRow title="Mistake type" text={feedback.reasoning.mistakeType} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

type FeedbackRowProps = {
  text: string;
  title: string;
};

function FeedbackRow({ text, title }: FeedbackRowProps) {
  return (
    <View style={styles.feedbackRow}>
      <Text style={styles.feedbackRowTitle}>{title}</Text>
      <Text style={styles.feedbackRowText}>{text}</Text>
    </View>
  );
}

type FeedbackSectionProps = {
  items?: readonly string[];
  text?: string;
  title: string;
};

function FeedbackSection({ items, text, title }: FeedbackSectionProps) {
  return (
    <View style={styles.feedbackSection}>
      <Text style={styles.feedbackSectionTitle}>{title}</Text>
      {items
        ? items.map((item) => (
            <Text key={item} style={styles.feedbackText}>{item}</Text>
          ))
        : <Text style={styles.feedbackText}>{text}</Text>}
    </View>
  );
}

function DiagnosticList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: readonly string[];
  title: string;
}) {
  return (
    <View style={styles.feedbackSection}>
      <Text style={styles.feedbackSectionTitle}>{title}</Text>
      {(items.length > 0 ? items : [emptyText]).map((item) => (
        <Text key={item} style={styles.feedbackText}>{item}</Text>
      ))}
    </View>
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

function formatStorageFailure(prefix: string, issues?: readonly LocalStorageIssue[]): string {
  const writeIssue = issues?.find((issue) => issue.operation === "write");
  const issue = writeIssue ?? issues?.[0];

  if (!issue) {
    return `${prefix}.`;
  }

  return `${prefix}: ${issue.operation} failed for ${issue.key}. ${issue.message}`;
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

function resolveDisplayNode(
  items: readonly AlgorithmTrainingItem[],
  fallbackNode: AlgorithmRoadmapNode,
  mode: PracticeSessionRouteParams["mode"],
): AlgorithmRoadmapNode {
  if (mode !== "weakArea") {
    return fallbackNode;
  }

  const selectedNodeId = items[0]?.roadmapNodeId;
  const selectedNode = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === selectedNodeId);

  return selectedNode && isAlgorithmRoadmapNodeSelectable(selectedNode) ? selectedNode : fallbackNode;
}

function getEmptySessionStateCopy(mode: PracticeSessionRouteParams["mode"]): {
  description: string;
  title: string;
} {
  if (mode === "review") {
    return {
      description: "No Algorithms review items are available for this review source right now.",
      title: "No review due",
    };
  }

  return {
    description: "No active training items are available for this mode and roadmap node.",
    title: "No Algorithms items",
  };
}

function getSummaryActionMode(action: AlgorithmsSummaryAction): PracticeSessionMode {
  if (action.kind === "reviewMissed") return "review";
  if (action.kind === "startWeakArea") return "weakArea";
  if (action.kind === "startMixedPractice") return "practice";
  return "default";
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

function getProgressTone(status: AlgorithmScoringStatus): "primary" | "success" | "warning" {
  return status === "correct" ? "success" : "warning";
}

function shouldShowFeedbackText(text: string, comparedWith: string): boolean {
  return normalizeDisplayText(text) !== normalizeDisplayText(comparedWith);
}

function normalizeDisplayText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "");
}

function getFeedbackStatusTone(status: AlgorithmScoringStatus): "success" | "warning" | "danger" {
  if (status === "correct") return "success";
  if (status === "partial") return "warning";
  return "danger";
}

function getOptionText(check: AlgorithmStaticMicroCheck, optionId: string): string {
  return check.options?.find((option) => option.id === optionId)?.text ?? optionId;
}

const styles = StyleSheet.create({
  sessionContent: {
    paddingBottom: spacing.xxxl,
  },
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
    gap: spacing.md,
  },
  answerCard: {
    gap: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.dark.primary,
    textTransform: "uppercase",
  },
  itemTitle: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  itemPrompt: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  itemBadgeRow: {
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
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primary,
    borderWidth: 2,
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
    alignItems: "center",
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceChipSelected: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primary,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
    paddingVertical: spacing.sm - 1,
  },
  choiceText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  choiceTextSelected: {
    color: colors.dark.textPrimary,
    fontWeight: "700",
  },
  choiceDot: {
    backgroundColor: "transparent",
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 8,
    width: 8,
  },
  choiceDotSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
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
  feedbackCard: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.borderStrong,
    gap: spacing.md,
    padding: spacing.lg,
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  feedbackTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  feedbackRows: {
    borderTopColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  feedbackRow: {
    gap: spacing.xs,
  },
  feedbackRowTitle: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  feedbackRowText: {
    ...typography.small,
    color: colors.dark.textPrimary,
  },
  reasoningToggle: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
  },
  reasoningToggleText: {
    ...typography.small,
    color: colors.dark.primary,
    fontWeight: "600",
  },
  reasoningPanel: {
    borderTopColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  feedbackText: {
    ...typography.body,
    color: colors.dark.textPrimary,
  },
  feedbackSection: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  feedbackSectionTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  summaryCard: {
    gap: spacing.xl,
  },
  diagnosisCard: {
    gap: spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  summaryActions: {
    gap: spacing.md,
  },
  summaryAction: {
    gap: spacing.xs,
  },
  summaryActionDetail: {
    ...typography.small,
    color: colors.dark.textSecondary,
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
