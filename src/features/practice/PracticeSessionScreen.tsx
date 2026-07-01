import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Icon, ProgressBar, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { colors, radius, spacing, typography } from "../../theme";
import type { Question } from "../../types";
import { areOptionSetsEqual } from "../../utils";
import { AlgorithmsSessionScreen } from "../algorithms/AlgorithmsSessionScreen";
import {
  loadPracticeQuestions,
  savePracticeAnswer,
  setQuestionNeedsReview,
} from "./practiceService";
import { canCheckAnswer } from "./practiceSessionModel";
import { getCloudDomainForTopicId } from "./sessionConfig";

type PracticeSessionScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;

export function PracticeSessionScreen({ navigation, route }: PracticeSessionScreenProps) {
  if (route.params.trackId === ALGORITHMS_TRACK_ID) {
    return (
      <AlgorithmsSessionScreen
        navigation={navigation}
        nodeId={route.params.topicId}
        sessionConfig={route.params}
      />
    );
  }

  return <CloudPracticeSessionScreen navigation={navigation} route={route} />;
}

function CloudPracticeSessionScreen({ navigation, route }: PracticeSessionScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [completedAnswers, setCompletedAnswers] = useState<CompletedAnswer[]>([]);
  const [isReviewPass, setIsReviewPass] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSessionQuestions() {
        const loadedQuestions = await loadPracticeQuestions(
          getCloudDomainForTopicId(route.params.topicId),
          route.params.sessionLength,
        );

        if (isActive) {
          setQuestions(loadedQuestions);
          setCurrentIndex(0);
          setCompletedAnswers([]);
          setIsReviewPass(false);
          setSessionComplete(false);
          resetQuestionState();
        }
      }

      void loadSessionQuestions();

      return () => {
        isActive = false;
      };
    }, [route.params.sessionLength, route.params.topicId])
  );

  const currentQuestion = questions[currentIndex];
  const isCorrect = useMemo(() => {
    if (!currentQuestion) {
      return false;
    }

    return areOptionSetsEqual(selectedOptionIds, currentQuestion.correctOptionIds);
  }, [currentQuestion, selectedOptionIds]);

  function resetQuestionState() {
    setSelectedOptionIds([]);
    setIsSubmitted(false);
    setNeedsReview(false);
  }

  function selectOption(optionId: string) {
    if (!currentQuestion || isSubmitted) {
      return;
    }

    if (currentQuestion.type === "single") {
      setSelectedOptionIds([optionId]);
      return;
    }

    setSelectedOptionIds((current) =>
      current.includes(optionId) ? current.filter((selectedId) => selectedId !== optionId) : [...current, optionId]
    );
  }

  async function submitAnswer() {
    if (!currentQuestion || selectedOptionIds.length === 0) {
      return;
    }

    const answer: CompletedAnswer = {
      isCorrect,
      question: currentQuestion,
      selectedOptionIds,
    };

    const nextCompletedAnswers = isReviewPass
      ? completedAnswers
      : [...completedAnswers, answer];

    if (!isReviewPass) {
      await savePracticeAnswer({
        question: currentQuestion,
        selectedOptionIds,
      });

      setCompletedAnswers(nextCompletedAnswers);
    }

    if (route.params.feedbackMode === "atSessionEnd") {
      if (currentIndex >= questions.length - 1) {
        setSessionComplete(true);
        return;
      }

      setCurrentIndex((current) => current + 1);
      resetQuestionState();
      return;
    }

    setIsSubmitted(true);
  }

  async function toggleNeedsReview() {
    if (!currentQuestion) {
      return;
    }

    const nextNeedsReview = !needsReview;
    setNeedsReview(nextNeedsReview);
    await setQuestionNeedsReview(currentQuestion.id, nextNeedsReview);
  }

  function goNext() {
    if (currentIndex >= questions.length - 1) {
      if (!isReviewPass && route.params.reviewBehaviorEnabled) {
        const missedQuestions = completedAnswers
          .filter((answer) => !answer.isCorrect)
          .map((answer) => answer.question);

        if (missedQuestions.length > 0) {
          setQuestions(missedQuestions);
          setCurrentIndex(0);
          setIsReviewPass(true);
          resetQuestionState();
          return;
        }
      }

      setSessionComplete(true);
      return;
    }

    setCurrentIndex((current) => current + 1);
    resetQuestionState();
  }

  if (!currentQuestion) {
    return (
      <Screen>
        <EmptyState
          title="No practice questions"
          description="No questions are available for this topic yet."
          actionLabel="Back to Practice"
          onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        />
      </Screen>
    );
  }

  if (sessionComplete) {
    return (
      <SessionSummary
        answers={completedAnswers}
        feedbackMode={route.params.feedbackMode}
        onBackToPractice={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: route.params.topicId })}
      />
    );
  }

  const chooseLabel = currentQuestion.type === "single" ? "Choose one" : `Choose ${currentQuestion.correctOptionIds.length}`;
  const progress = (currentIndex + 1) / questions.length;
  const immediateFeedback = route.params.feedbackMode === "afterEachAnswer";
  const canSubmit = immediateFeedback
    ? canCheckAnswer(selectedOptionIds, isSubmitted)
    : selectedOptionIds.length > 0;
  const primaryActionLabel = immediateFeedback
    ? "Check Answer"
    : currentIndex >= questions.length - 1
      ? "Finish Session"
      : "Next Question";

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <View style={styles.actions}>
          {isSubmitted ? (
            <>
              <Button variant={needsReview ? "primary" : "ghost"} onPress={() => void toggleNeedsReview()}>
                {needsReview ? "Marked Needs Review" : "Mark Needs Review"}
              </Button>
              <Button onPress={goNext}>{currentIndex >= questions.length - 1 ? "Finish Practice" : "Next Question"}</Button>
            </>
          ) : (
            <Button disabled={!canSubmit} onPress={() => void submitAnswer()}>
              {primaryActionLabel}
            </Button>
          )}
        </View>
      }
    >
      <View style={styles.sessionTopBar}>
        <Pressable
          accessibilityLabel="Close practice session"
          accessibilityRole="button"
          onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { topicId: route.params.topicId })}
          style={({ pressed }) => [styles.closeButton, pressed ? styles.optionPressed : null]}
        >
          <Icon name="close" size={18} />
        </Pressable>
        <Text style={styles.sessionBrand}>Patternly</Text>
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.itemCount}>Item {currentIndex + 1} of {questions.length}</Text>
        <ProgressBar progress={progress} tone={isSubmitted ? (isCorrect ? "success" : "warning") : "primary"} />
      </View>

      <Card style={styles.questionCard}>
        <View style={styles.questionAccent} />
        <Text style={styles.questionEyebrow}>
          {isReviewPass ? "Review behavior" : formatSessionMode(route.params.mode)}
        </Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        <View style={styles.metaRow}>
          <Badge label={currentQuestion.type === "single" ? "Single choice" : "Multiple select"} tone="neutral" />
          <Badge label={chooseLabel} tone="info" />
        </View>
      </Card>

      <View style={styles.options}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const isCorrectOption = currentQuestion.correctOptionIds.includes(option.id);

          return (
            <Pressable
              accessibilityRole={currentQuestion.type === "single" ? "radio" : "checkbox"}
              key={option.id}
              onPress={() => selectOption(option.id)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected ? styles.optionSelected : null,
                immediateFeedback && isSubmitted && isCorrectOption ? styles.optionCorrect : null,
                immediateFeedback && isSubmitted && isSelected && !isCorrectOption ? styles.optionIncorrect : null,
                pressed && !isSubmitted ? styles.optionPressed : null
              ]}
            >
              <OptionMarker
                correct={immediateFeedback && isSubmitted && isCorrectOption}
                incorrect={immediateFeedback && isSubmitted && isSelected && !isCorrectOption}
                selected={isSelected}
                type={currentQuestion.type}
              />
              <Text style={styles.optionText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {immediateFeedback && isSubmitted ? (
        <FeedbackCard question={currentQuestion} selectedOptionIds={selectedOptionIds} isCorrect={isCorrect} />
      ) : null}

    </Screen>
  );
}

type CompletedAnswer = {
  isCorrect: boolean;
  question: Question;
  selectedOptionIds: string[];
};

type SessionSummaryProps = {
  answers: readonly CompletedAnswer[];
  feedbackMode: string;
  onBackToPractice: () => void;
};

function SessionSummary({ answers, feedbackMode, onBackToPractice }: SessionSummaryProps) {
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const incorrectCount = answers.length - correctCount;

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={<Button onPress={onBackToPractice}>Back to Practice</Button>}
    >
      <View style={styles.sessionTopBar}>
        <Text style={styles.sessionBrand}>Patternly</Text>
      </View>

      <Card variant="tonal" style={styles.summaryCard}>
        <Text style={styles.questionEyebrow}>Session summary</Text>
        <SectionHeader
          title="Practice complete"
          subtitle={
            feedbackMode === "atSessionEnd"
              ? "Review correctness and explanations from this session."
              : "Review your session results."
          }
          tight
        />
        <View style={styles.summaryGrid}>
          <SummaryMetric label="Answered" value={answers.length} />
          <SummaryMetric label="Correct" value={correctCount} />
          <SummaryMetric label="Review" value={incorrectCount} />
        </View>
      </Card>

      {answers.map((answer, index) => (
        <Card key={`${answer.question.id}-${index}`} variant={answer.isCorrect ? "success" : "warning"}>
          <SectionHeader
            title={`Question ${index + 1}`}
            subtitle={answer.question.question}
            action={<Badge label={answer.isCorrect ? "Correct" : "Review"} tone={answer.isCorrect ? "success" : "warning"} />}
            tight
          />
          <DiagnosticSection label="Selected answer" value={getOptionText(answer.question, answer.selectedOptionIds)} />
          <DiagnosticSection label="Correct answer" value={getOptionText(answer.question, answer.question.correctOptionIds)} />
          <DiagnosticSection label="Explanation" value={answer.question.explanation} />
        </Card>
      ))}
    </Screen>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type FeedbackCardProps = {
  question: Question;
  selectedOptionIds: string[];
  isCorrect: boolean;
};

function FeedbackCard({ question, selectedOptionIds, isCorrect }: FeedbackCardProps) {
  const whyWrongEntries = Object.entries(question.whyOthersAreWrong ?? {});
  const watchOutForItems = normalizeWatchOutFor(question.watchOutFor);

  return (
    <Card variant={isCorrect ? "success" : "warning"}>
      <SectionHeader
        title={isCorrect ? "Correct answer" : "Needs review"}
        action={<Badge label={isCorrect ? "Correct" : "Review"} tone={isCorrect ? "success" : "warning"} />}
      />
      <DiagnosticSection label="Selected answer" value={getOptionText(question, selectedOptionIds) || "No answer selected."} />
      <DiagnosticSection label="Correct answer" value={getOptionText(question, question.correctOptionIds)} />
      <DiagnosticSection label="Explanation" value={question.explanation} />

      {whyWrongEntries.length > 0 ? (
        <DiagnosticSection label="Why other options are wrong">
          {whyWrongEntries.map(([optionId, reason]) => (
            <Text key={optionId} style={styles.feedbackText}>
              {optionId}: {reason}
            </Text>
          ))}
        </DiagnosticSection>
      ) : null}

      {watchOutForItems.length > 0 ? (
        <DiagnosticSection label="Watch out for">
          {watchOutForItems.map((item) => (
            <Text key={item} style={styles.feedbackText}>
              {item}
            </Text>
          ))}
        </DiagnosticSection>
      ) : null}

      {question.examSignals && question.examSignals.length > 0 ? (
        <DiagnosticSection label="Exam signals" value={question.examSignals.join(", ")} />
      ) : null}

      {question.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {question.tags.map((tag) => (
            <Badge key={tag} label={tag} tone="neutral" />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function DiagnosticSection({ children, label, value }: { children?: ReactNode; label: string; value?: string }) {
  return (
    <View style={styles.diagnosticSection}>
      <Text style={styles.detailLabel}>{label}</Text>
      {value ? <Text style={styles.feedbackText}>{value}</Text> : children}
    </View>
  );
}

function OptionMarker({
  correct,
  incorrect,
  selected,
  type
}: {
  correct: boolean;
  incorrect: boolean;
  selected: boolean;
  type: "single" | "multiple";
}) {
  return (
    <View
      style={[
        styles.optionMarker,
        type === "multiple" ? styles.optionMarkerSquare : null,
        selected ? styles.optionMarkerSelected : null,
        correct ? styles.optionMarkerCorrect : null,
        incorrect ? styles.optionMarkerIncorrect : null
      ]}
    >
      {selected || correct ? <View style={[styles.optionMarkerInner, type === "multiple" ? styles.optionMarkerInnerSquare : null]} /> : null}
    </View>
  );
}

function getOptionText(question: Question, optionIds: readonly string[]): string {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]));
  return optionIds.map((optionId) => optionById.get(optionId) ?? optionId).join(", ");
}

function normalizeWatchOutFor(value: Question["watchOutFor"]): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function formatSessionMode(value: string): string {
  if (value === "weakArea") {
    return "Weak area";
  }

  if (value === "default") {
    return "Practice";
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

const styles = StyleSheet.create({
  sessionTopBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 48,
  },
  closeButton: {
    alignItems: "center",
    borderColor: colors.dark.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  sessionBrand: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  itemCount: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  questionCard: {
    gap: spacing.lg,
    overflow: "hidden",
    paddingLeft: spacing.xxl,
  },
  questionAccent: {
    backgroundColor: colors.dark.primary,
    borderBottomRightRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    bottom: spacing.xl,
    left: 0,
    position: "absolute",
    top: spacing.xl,
    width: 3,
  },
  questionEyebrow: {
    ...typography.caption,
    color: colors.dark.accentPurple,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  questionText: {
    ...typography.title,
    color: colors.dark.textPrimary
  },
  options: {
    gap: spacing.md
  },
  optionCard: {
    alignItems: "flex-start",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.lg
  },
  optionSelected: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primary
  },
  optionCorrect: {
    backgroundColor: colors.dark.successSoft,
    borderColor: colors.dark.success
  },
  optionIncorrect: {
    backgroundColor: colors.dark.dangerSoft,
    borderColor: colors.dark.danger
  },
  optionPressed: {
    opacity: 0.82
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.dark.textPrimary
  },
  optionMarker: {
    alignItems: "center",
    borderColor: colors.dark.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    marginTop: spacing.xxs,
    width: 22
  },
  optionMarkerSquare: {
    borderRadius: radius.xs
  },
  optionMarkerSelected: {
    borderColor: colors.dark.primary
  },
  optionMarkerCorrect: {
    borderColor: colors.dark.success
  },
  optionMarkerIncorrect: {
    borderColor: colors.dark.danger
  },
  optionMarkerInner: {
    backgroundColor: colors.dark.primary,
    borderRadius: radius.pill,
    height: 10,
    width: 10
  },
  optionMarkerInnerSquare: {
    borderRadius: radius.xs
  },
  actions: {
    gap: spacing.md
  },
  feedbackText: {
    ...typography.small,
    color: colors.dark.textSecondary
  },
  diagnosticSection: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md
  },
  detailBlock: {
    gap: spacing.xs
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  summaryCard: {
    gap: spacing.lg
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  summaryMetric: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 96,
    padding: spacing.md
  },
  summaryValue: {
    ...typography.heading,
    color: colors.dark.textPrimary,
    fontVariant: ["tabular-nums"]
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.dark.textSecondary
  }
});
