import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
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
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "../../tracks/algorithms/algorithmQuestionTypes";
import {
  addTrainingAttempt,
  addReviewQueueItems,
  addTrainingSession,
  getReviewQueueItems,
  getTrainingSessions,
  getTrainingAttempts,
  saveTrainingSessions,
  type LocalStorageIssue,
} from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import {
  ALGORITHM_ROADMAP,
  getAlgorithmContentGroupForItem,
  getFirstUsableAlgorithmRoadmapNode,
  getShuffledAlgorithmQuestionOptions,
  isAlgorithmRoadmapNodeSelectable,
  selectAlgorithmSessionItems,
  type AlgorithmQuestionDisplayOption,
  type AlgorithmQuestionScore,
  type AlgorithmRoadmapNode,
  type AlgorithmScoringStatus,
} from "../../tracks/algorithms";
import { resetToPracticeHubAfterSession } from "../practice/practiceNavigation";
import { SessionPreparingShell } from "../practice/SessionPreparingShell";
import { buildPracticeSessionConfig, type PracticeSessionMode } from "../practice/sessionConfig";
import {
  buildAlgorithmsImmediateFeedbackModel,
  buildAlgorithmsSummaryActions,
  buildAlgorithmsSessionSummary,
  getAlgorithmsSessionModeIdForRouteMode,
  buildAlgorithmsReviewQueueUpdate,
  buildAlgorithmsSubmission,
  formatElapsedTime,
  formatSessionItemCount,
  formatSubmittedSessionActionLabel,
  getAnswerOptionVisualState,
  getElapsedSessionSeconds,
  formatAlgorithmItemType,
  formatAlgorithmStatus,
  getAlgorithmsFeedbackState,
  hasAlgorithmsFeedbackDetails,
  type AnswerOptionVisualState,
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

export function AlgorithmsSessionScreen({ navigation, nodeId, sessionConfig }: AlgorithmsSessionScreenProps) {
  const reviewItemIdsKey = sessionConfig?.reviewItemIds?.join("|") ?? "";
  const [node, setNode] = useState<AlgorithmRoadmapNode>(() => getFirstUsableAlgorithmRoadmapNode());
  const [items, setItems] = useState<readonly AlgorithmQuestion[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [complexityAnswer, setComplexityAnswer] = useState<ComplexityAnswer>({});
  const [checkedScore, setCheckedScore] = useState<AlgorithmQuestionScore | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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
  const currentOptions = useMemo(
    () => currentItem ? getShuffledAlgorithmQuestionOptions(currentItem) : [],
    [currentItem?.id],
  );
  const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;
  const canCheck = currentItem ? hasAnswer(currentItem, selectedOptionIds, complexityAnswer) : false;
  const feedbackMode = sessionConfig?.feedbackMode ?? "afterEachAnswer";
  const feedbackState = getAlgorithmsFeedbackState(feedbackMode, checkedScore);
  const timerLabel = formatElapsedTime(elapsedSeconds);
  const itemCountLabel = formatSessionItemCount(currentIndex, items.length);
  const summaryActions = summary
    ? buildAlgorithmsSummaryActions(summary, sessionConfig)
    : [];

  useEffect(() => {
    if (!session || summary) {
      return;
    }

    setElapsedSeconds(getElapsedSessionSeconds(session.startedAt, Date.now()));

    const intervalId = setInterval(() => {
      setElapsedSeconds(getElapsedSessionSeconds(session.startedAt, Date.now()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session, summary]);

  function resetAnswerState() {
    setSelectedOptionIds([]);
    setComplexityAnswer({});
    setCheckedScore(null);
  }

  function selectOption(question: AlgorithmQuestion, optionId: string) {
    if (checkedScore) {
      return;
    }

    if (isAlgorithmChoiceQuestion(question) && question.options.filter((option) => option.isCorrect).length > 1) {
      setSelectedOptionIds((current) =>
        current.includes(optionId)
          ? current.filter((selectedId) => selectedId !== optionId)
          : [...current, optionId],
      );
      return;
    }

    if (isAlgorithmOrderingQuestion(question)) {
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
    if (!currentItem || !session || !canCheck || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const answeredAt = new Date().toISOString();
    const submission = buildAlgorithmsSubmission({
      answeredAt,
      complexityAnswer,
      question: currentItem,
      selectedOptionIds,
      session,
    });
    const result = await addTrainingAttempt(submission.attempt);

    if (!result.ok) {
      setStorageMessage(formatStorageFailure("The answer was checked, but this attempt was not saved locally", result.issues));
    }

    await saveReviewQueueUpdate(submission);

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
    const existingResult = await getReviewQueueItems();
    const existingItem = existingResult.value.find((item) =>
      item.trackId === ALGORITHMS_TRACK_ID &&
      item.itemId === submission.attempt.itemId
    );
    const update = buildAlgorithmsReviewQueueUpdate(submission, existingItem);

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
        <SummaryTopBar onExit={() => resetToPracticeHubAfterSession(navigation, node.id)} />
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
          {summary.mainIssue ? (
            <View style={styles.mainIssuePanel}>
              <FeedbackSection title="Main issue" text={summary.mainIssue.pattern} />
              {summary.mainIssue.mistakeType ? (
                <FeedbackSection title="Mistake pattern" text={summary.mainIssue.mistakeType} />
              ) : null}
              <FeedbackSection title="Why it matters" text={summary.mainIssue.explanation} />
              <FeedbackSection title="Recommended next" text={summary.mainIssue.recommendedNextAction} />
            </View>
          ) : null}
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
      <SessionPreparingShell
        title="Preparing Algorithms session"
        description="Loading local progress and review items."
        onClose={() => resetToPracticeHubAfterSession(navigation, node.id)}
      />
    );
  }

  if (!currentItem) {
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
          <SubmittedAnswerFooter
            buttonLabel={formatSubmittedSessionActionLabel(currentIndex >= items.length - 1)}
            correctCount={checkedScore?.result.kind === "partial_credit" ? checkedScore.result.earnedPoints : checkedScore?.status === "correct" ? 1 : 0}
            maxCount={checkedScore?.result.kind === "partial_credit" ? checkedScore.result.maxPoints : 1}
            onPress={() => void goNext()}
            statusLabel={checkedScore ? formatAlgorithmStatus(checkedScore.status) : ""}
          />
        ) : (
          <Button disabled={!canCheck || isSubmitting} onPress={() => void checkAnswer()}>
            Check Answer
          </Button>
        )
      }
    >
      <SessionTopBar itemCountLabel={itemCountLabel} timerLabel={timerLabel} />

      <View style={styles.progressBlock}>
        {sessionConfig?.mode === "practice" ? (
          <Text style={styles.sessionModeLabel}>Mixed practice</Text>
        ) : null}
        {sessionConfig?.mode === "weakArea" ? (
          <Text style={styles.sessionModeLabel}>Weak area: {node.label}</Text>
        ) : null}
        <ProgressBar
          progress={progress}
          tone={feedbackState.showImmediateFeedback && checkedScore ? getProgressTone(checkedScore.status) : "primary"}
        />
      </View>

      <Card style={styles.itemCard}>
        <Text style={styles.heroEyebrow}>Algorithms</Text>
        <Text style={styles.itemTitle}>{formatAlgorithmItemType(currentItem.type)}</Text>
        <Text style={styles.itemPrompt}>{currentItem.prompt}</Text>
        <View style={styles.itemBadgeRow}>
          <Badge label={node.label} tone="primary" />
          <Badge label={formatAlgorithmItemType(currentItem.type)} tone="neutral" />
        </View>
      </Card>

      <Card style={styles.answerCard}>
        <SectionHeader title="Answer" tight />
        <AnswerControl
          complexityAnswer={complexityAnswer}
          interactionDisabled={isSubmitting}
          onResetOrder={() => setSelectedOptionIds([])}
          onSelectComplexity={selectComplexity}
          onSelectOption={selectOption}
          options={currentOptions}
          question={currentItem}
          selectedOptionIds={selectedOptionIds}
          submitted={feedbackState.hasSubmittedAnswer}
        />
      </Card>

      {feedbackState.showImmediateFeedback && checkedScore ? (
        <FeedbackCard
          complexityAnswer={complexityAnswer}
          question={currentItem}
          score={checkedScore}
          selectedOptionIds={selectedOptionIds}
        />
      ) : null}

      {storageMessage ? <StorageNotice message={storageMessage} /> : null}
    </Screen>
  );
}

type SessionTopBarProps = {
  itemCountLabel: string;
  timerLabel: string;
};

function SessionTopBar({ itemCountLabel, timerLabel }: SessionTopBarProps) {
  return (
    <View style={styles.sessionTopBar}>
      <Text style={styles.sessionTimer}>{timerLabel}</Text>
      <Text style={styles.sessionItemCount}>{itemCountLabel}</Text>
    </View>
  );
}

function SummaryTopBar({ onExit }: { onExit: () => void }) {
  return (
    <View style={styles.summaryTopBar}>
      <Text style={styles.sessionBrand}>Patternly</Text>
      <Button onPress={onExit} variant="ghost">Exit</Button>
    </View>
  );
}

function SubmittedAnswerFooter({
  buttonLabel,
  correctCount,
  maxCount,
  onPress,
  statusLabel,
}: {
  buttonLabel: string;
  correctCount: number;
  maxCount: number;
  onPress: () => void;
  statusLabel: string;
}) {
  return (
    <View style={styles.submittedFooter}>
      <View style={styles.submittedFooterCopy}>
        <Text style={styles.submittedFooterStatus}>{statusLabel}</Text>
        <Text style={styles.submittedFooterDetail}>
          {correctCount} / {maxCount} correct
        </Text>
      </View>
      <Button onPress={onPress} style={styles.submittedFooterButton}>
        {buttonLabel}
      </Button>
    </View>
  );
}

type AnswerControlProps = {
  complexityAnswer: ComplexityAnswer;
  interactionDisabled: boolean;
  onResetOrder: () => void;
  onSelectComplexity: (dimension: ComplexityDimension, value: string) => void;
  onSelectOption: (question: AlgorithmQuestion, optionId: string) => void;
  options: readonly AlgorithmQuestionDisplayOption[];
  question: AlgorithmQuestion;
  selectedOptionIds: readonly string[];
  submitted: boolean;
};

function AnswerControl({
  complexityAnswer,
  interactionDisabled,
  onResetOrder,
  onSelectComplexity,
  onSelectOption,
  options,
  question,
  selectedOptionIds,
  submitted,
}: AnswerControlProps) {
  if (isAlgorithmComplexityQuestion(question)) {
    return (
      <View style={styles.complexityGroups}>
        {question.correctComplexity.dimensions.map((dimension) => (
          <ComplexityChoiceGroup
            acceptedValues={[...dimension.acceptedValues, ...(dimension.acceptedAliases ?? [])]}
            choices={dimension.values}
            interactionDisabled={interactionDisabled}
            key={dimension.id}
            label={dimension.id === "time" ? "Time" : "Space"}
            onSelect={(value) => onSelectComplexity(dimension.id, value)}
            selectedValue={complexityAnswer[dimension.id]}
            submitted={submitted}
          />
        ))}
      </View>
    );
  }

  if (isAlgorithmOrderingQuestion(question)) {
    const remainingOptions = options.filter((option) => !selectedOptionIds.includes(option.id));

    return (
      <View style={styles.options}>
        <View style={styles.selectedOrder}>
          {selectedOptionIds.length > 0 ? (
            selectedOptionIds.map((optionId, index) => (
              <Text key={`${optionId}-${index}`} style={styles.selectedOrderText}>
                {index + 1}. {getQuestionOptionText(question, optionId)}
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
            interactionDisabled={interactionDisabled}
            onPress={() => onSelectOption(question, option.id)}
            visualState={getAnswerOptionVisualState({
              correct: question.correctOrder.includes(option.id),
              selected: false,
              submitted,
            })}
          />
        ))}
        <Button disabled={submitted || interactionDisabled || selectedOptionIds.length === 0} onPress={onResetOrder} variant="secondary">
          Reset Order
        </Button>
      </View>
    );
  }

  if (isAlgorithmChoiceQuestion(question)) {
    return (
      <View style={styles.options}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            label={option.text}
            interactionDisabled={interactionDisabled}
            onPress={() => onSelectOption(question, option.id)}
            visualState={getAnswerOptionVisualState({
              correct: option.isCorrect === true,
              selected: selectedOptionIds.includes(option.id),
              submitted,
            })}
          />
        ))}
      </View>
    );
  }

  return assertUnreachableQuestion(question);
}

type ComplexityChoiceGroupProps = {
  acceptedValues: readonly string[];
  choices: readonly string[];
  interactionDisabled: boolean;
  label: string;
  onSelect: (value: string) => void;
  selectedValue?: string;
  submitted: boolean;
};

function ComplexityChoiceGroup({
  acceptedValues,
  choices,
  interactionDisabled,
  label,
  onSelect,
  selectedValue,
  submitted,
}: ComplexityChoiceGroupProps) {
  return (
    <View style={styles.complexityGroup}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.choiceWrap}>
        {choices.map((choice) => {
          const visualState = getAnswerOptionVisualState({
            correct: acceptedValues.includes(choice),
            selected: selectedValue === choice,
            submitted,
          });

          return (
            <Pressable
              accessibilityRole="button"
              disabled={submitted || interactionDisabled}
              key={`${label}-${choice}`}
              onPress={() => onSelect(choice)}
              style={({ pressed }) => [
                styles.choiceChip,
                getChoiceChipStyle(visualState),
                pressed && !submitted && !interactionDisabled ? styles.pressed : null,
              ]}
            >
              <View style={[styles.choiceDot, getChoiceDotStyle(visualState)]} />
              <Text style={[styles.choiceText, getChoiceTextStyle(visualState)]}>
                {choice}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type OptionButtonProps = {
  interactionDisabled: boolean;
  label: string;
  onPress: () => void;
  visualState: AnswerOptionVisualState;
};

function OptionButton({ interactionDisabled, label, onPress, visualState }: OptionButtonProps) {
  const submitted = visualState !== "idle" && visualState !== "selected";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={submitted || interactionDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        getOptionCardStyle(visualState),
        pressed && !submitted && !interactionDisabled ? styles.pressed : null,
      ]}
    >
      <View style={[styles.optionMarker, getOptionMarkerStyle(visualState)]} />
      <Text style={[styles.optionText, getOptionTextStyle(visualState)]}>{label}</Text>
    </Pressable>
  );
}

type FeedbackCardProps = {
  complexityAnswer: ComplexityAnswer;
  question: AlgorithmQuestion;
  score: AlgorithmQuestionScore;
  selectedOptionIds: readonly string[];
};

function FeedbackCard({
  complexityAnswer,
  question,
  score,
  selectedOptionIds,
}: FeedbackCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const feedback = buildAlgorithmsImmediateFeedbackModel({
    complexityAnswer,
    question,
    score,
    selectedOptionIds,
  });
  const hasDetails = hasAlgorithmsFeedbackDetails(feedback);

  return (
    <Card style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <Badge label={feedback.statusLabel} tone={getFeedbackStatusTone(feedback.status)} />
      </View>

      <View style={styles.feedbackRows}>
        <FeedbackRow title="Core reason" text={feedback.rule} />
        <FeedbackRow title="Recognition signal" text={feedback.keySignal} />
        <FeedbackRow title="Next action" text={feedback.nextAction} />
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
          <FeedbackRow title="Answer" text={feedback.reasoning.answerSummary} />
          {feedback.reasoning.correctAnswerExplanation ? (
            <FeedbackRow title="Explanation" text={feedback.reasoning.correctAnswerExplanation} />
          ) : null}
          {feedback.reasoning.complexity ? (
            <FeedbackRow title="Complexity" text={feedback.reasoning.complexity} />
          ) : null}
          {feedback.reasoning.weakerAnswerNotes.length > 0 ? (
            <FeedbackRow title="Why other options are weaker" text={feedback.reasoning.weakerAnswerNotes.join("\n")} />
          ) : null}
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
  questions: readonly AlgorithmQuestion[],
  defaultNode: AlgorithmRoadmapNode,
  mode: PracticeSessionRouteParams["mode"],
): AlgorithmRoadmapNode {
  if (mode !== "weakArea") {
    return defaultNode;
  }

  const selectedGroup = questions[0]
    ? getAlgorithmContentGroupForItem(questions[0].id)
    : undefined;
  const selectedNode = ALGORITHM_ROADMAP.nodes.find(
    (candidate) => candidate.id === selectedGroup?.roadmapNodeId,
  );

  if (selectedNode && isAlgorithmRoadmapNodeSelectable(selectedNode)) {
    return selectedNode;
  }

  return defaultNode;
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
  question: AlgorithmQuestion,
  selectedOptionIds: readonly string[],
  complexityAnswer: ComplexityAnswer,
): boolean {
  if (isAlgorithmComplexityQuestion(question)) {
    return Boolean(complexityAnswer.time && complexityAnswer.space);
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return selectedOptionIds.length === question.correctOrder.length;
  }

  if (isAlgorithmChoiceQuestion(question)) {
    return selectedOptionIds.length > 0;
  }

  return assertUnreachableQuestion(question);
}

function getQuestionOptionText(question: AlgorithmQuestion, optionId: string): string {
  if (isAlgorithmOrderingQuestion(question)) {
    const subgoal = question.subgoals.find((candidate) => candidate.id === optionId);

    if (!subgoal) {
      throw new Error(`Algorithms question ${question.id} has no subgoal ${optionId}.`);
    }

    return subgoal.text;
  }

  if (isAlgorithmChoiceQuestion(question)) {
    const option = question.options.find((candidate) => candidate.id === optionId);

    if (!option) {
      throw new Error(`Algorithms question ${question.id} has no option ${optionId}.`);
    }

    return option.text;
  }

  if (isAlgorithmComplexityQuestion(question)) {
    throw new Error(`Algorithms complexity question ${question.id} does not have selectable options.`);
  }

  return assertUnreachableQuestion(question);
}

function assertUnreachableQuestion(question: never): never {
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
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

function getOptionCardStyle(state: AnswerOptionVisualState) {
  if (state === "selected") return styles.optionSelected;
  if (state === "selected_correct" || state === "expected_correct") return styles.optionCorrect;
  if (state === "selected_incorrect") return styles.optionIncorrect;
  if (state === "disabled") return styles.optionDisabled;
  return null;
}

function getOptionMarkerStyle(state: AnswerOptionVisualState) {
  if (state === "selected") return styles.optionMarkerSelected;
  if (state === "selected_correct" || state === "expected_correct") return styles.optionMarkerCorrect;
  if (state === "selected_incorrect") return styles.optionMarkerIncorrect;
  if (state === "disabled") return styles.optionMarkerDisabled;
  return null;
}

function getOptionTextStyle(state: AnswerOptionVisualState) {
  if (state === "selected" || state === "selected_correct" || state === "expected_correct" || state === "selected_incorrect") {
    return styles.optionTextEmphasis;
  }

  if (state === "disabled") return styles.optionTextDisabled;
  return null;
}

function getChoiceChipStyle(state: AnswerOptionVisualState) {
  if (state === "selected") return styles.choiceChipSelected;
  if (state === "selected_correct" || state === "expected_correct") return styles.choiceChipCorrect;
  if (state === "selected_incorrect") return styles.choiceChipIncorrect;
  if (state === "disabled") return styles.choiceChipDisabled;
  return null;
}

function getChoiceDotStyle(state: AnswerOptionVisualState) {
  if (state === "selected") return styles.choiceDotSelected;
  if (state === "selected_correct" || state === "expected_correct") return styles.choiceDotCorrect;
  if (state === "selected_incorrect") return styles.choiceDotIncorrect;
  if (state === "disabled") return styles.choiceDotDisabled;
  return null;
}

function getChoiceTextStyle(state: AnswerOptionVisualState) {
  if (state === "selected" || state === "selected_correct" || state === "expected_correct" || state === "selected_incorrect") {
    return styles.choiceTextSelected;
  }

  if (state === "disabled") return styles.choiceTextDisabled;
  return null;
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
  sessionTimer: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  sessionItemCount: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.8,
  },
  sessionBrand: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  summaryTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pressed: {
    opacity: 0.82,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  sessionModeLabel: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  submittedFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  submittedFooterCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  submittedFooterStatus: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  submittedFooterDetail: {
    ...typography.small,
    color: colors.dark.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  submittedFooterButton: {
    minWidth: 120,
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
  optionCorrect: {
    backgroundColor: colors.dark.successSoft,
    borderColor: colors.dark.success,
    borderWidth: 2,
  },
  optionIncorrect: {
    backgroundColor: colors.dark.dangerSoft,
    borderColor: colors.dark.danger,
    borderWidth: 2,
  },
  optionDisabled: {
    opacity: 0.62,
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
  optionMarkerCorrect: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  optionMarkerIncorrect: {
    backgroundColor: colors.dark.danger,
    borderColor: colors.dark.danger,
  },
  optionMarkerDisabled: {
    borderColor: colors.dark.border,
  },
  optionText: {
    ...typography.body,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  optionTextEmphasis: {
    color: colors.dark.textPrimary,
    fontWeight: "700",
  },
  optionTextDisabled: {
    color: colors.dark.textMuted,
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
  choiceChipCorrect: {
    backgroundColor: colors.dark.successSoft,
    borderColor: colors.dark.success,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
    paddingVertical: spacing.sm - 1,
  },
  choiceChipIncorrect: {
    backgroundColor: colors.dark.dangerSoft,
    borderColor: colors.dark.danger,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
    paddingVertical: spacing.sm - 1,
  },
  choiceChipDisabled: {
    opacity: 0.62,
  },
  choiceText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  choiceTextSelected: {
    color: colors.dark.textPrimary,
    fontWeight: "700",
  },
  choiceTextDisabled: {
    color: colors.dark.textMuted,
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
  choiceDotCorrect: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  choiceDotIncorrect: {
    backgroundColor: colors.dark.danger,
    borderColor: colors.dark.danger,
  },
  choiceDotDisabled: {
    borderColor: colors.dark.border,
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
  mainIssuePanel: {
    gap: spacing.sm,
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
