import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, ProgressBar, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { colors, radius, spacing, typography } from "../../theme";
import type { Confidence, MistakeReason, Question } from "../../types";
import { areOptionSetsEqual, getDomainLabel } from "../../utils";
import {
  loadPracticeQuestions,
  savePracticeAnswer,
  setQuestionNeedsReview,
  updatePracticeAnswerMetadata
} from "./practiceService";

type PracticeSessionScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;

const confidenceOptions: Confidence[] = ["sure", "unsure", "guess"];
const mistakeReasons: MistakeReason[] = [
  "knowledge_gap",
  "misread_question",
  "confused_services",
  "iam_misunderstanding",
  "networking_misunderstanding",
  "rushed",
  "other"
];

export function PracticeSessionScreen({ navigation, route }: PracticeSessionScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [mistakeReason, setMistakeReason] = useState<MistakeReason | undefined>();
  const [needsReview, setNeedsReview] = useState(false);
  const [practiceRecordId, setPracticeRecordId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSessionQuestions() {
        const loadedQuestions = await loadPracticeQuestions(route.params.domain, route.params.questionCount);

        if (isActive) {
          setQuestions(loadedQuestions);
          resetQuestionState();
        }
      }

      void loadSessionQuestions();

      return () => {
        isActive = false;
      };
    }, [route.params.domain, route.params.questionCount])
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
    setConfidence(undefined);
    setMistakeReason(undefined);
    setNeedsReview(false);
    setPracticeRecordId(null);
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

    const record = await savePracticeAnswer({
      question: currentQuestion,
      selectedOptionIds,
      confidence,
      mistakeReason
    });
    setPracticeRecordId(record.id);
    setIsSubmitted(true);
  }

  async function handleConfidenceChange(nextConfidence: Confidence) {
    setConfidence(nextConfidence);

    if (practiceRecordId) {
      await updatePracticeAnswerMetadata(practiceRecordId, { confidence: nextConfidence });
    }
  }

  async function handleMistakeReasonChange(nextMistakeReason: MistakeReason) {
    setMistakeReason(nextMistakeReason);

    if (practiceRecordId) {
      await updatePracticeAnswerMetadata(practiceRecordId, { mistakeReason: nextMistakeReason });
    }
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
      navigation.navigate(ROUTES.PRACTICE_SETUP);
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
          description="Import questions for this domain or select another domain before starting practice."
          actionLabel="Choose Domain"
          onActionPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}
        />
      </Screen>
    );
  }

  const chooseLabel = currentQuestion.type === "single" ? "Choose one" : `Choose ${currentQuestion.correctOptionIds.length}`;
  const progress = (currentIndex + 1) / questions.length;

  return (
    <Screen
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
            <Button disabled={selectedOptionIds.length === 0} onPress={() => void submitAnswer()}>
              Submit Answer
            </Button>
          )}
        </View>
      }
    >
      <Card>
        <SectionHeader
          title={`Question ${currentIndex + 1} / ${questions.length}`}
          subtitle={getDomainLabel(currentQuestion.domain)}
          action={<Badge label={isSubmitted ? (isCorrect ? "Correct" : "Review") : "Practice"} tone={isSubmitted ? (isCorrect ? "success" : "warning") : "info"} />}
        />
        <ProgressBar progress={progress} tone={isSubmitted ? (isCorrect ? "success" : "warning") : "primary"} />
        <View style={styles.metaRow}>
          <Badge label={currentQuestion.type === "single" ? "Single choice" : "Multiple select"} tone="neutral" />
          <Badge label={chooseLabel} tone="info" />
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
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
                isSubmitted && isCorrectOption ? styles.optionCorrect : null,
                isSubmitted && isSelected && !isCorrectOption ? styles.optionIncorrect : null,
                pressed && !isSubmitted ? styles.optionPressed : null
              ]}
            >
              <OptionMarker
                correct={isSubmitted && isCorrectOption}
                incorrect={isSubmitted && isSelected && !isCorrectOption}
                selected={isSelected}
                type={currentQuestion.type}
              />
              <Text style={styles.optionText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <SectionHeader title="Confidence" subtitle="Optional, useful for analytics later." />
        <View style={styles.segmentRow}>
          {confidenceOptions.map((item) => (
            <Button
              key={item}
              onPress={() => void handleConfidenceChange(item)}
              style={styles.segmentButton}
              variant={confidence === item ? "primary" : "secondary"}
            >
              {formatLabel(item)}
            </Button>
          ))}
        </View>
      </Card>

      {isSubmitted && !isCorrect ? (
        <Card>
          <SectionHeader title="Mistake Reason" subtitle="Optional, only for incorrect answers." />
          <View style={styles.reasonList}>
            {mistakeReasons.map((reason) => (
              <Button
                key={reason}
                onPress={() => void handleMistakeReasonChange(reason)}
                variant={mistakeReason === reason ? "primary" : "secondary"}
              >
                {formatLabel(reason)}
              </Button>
            ))}
          </View>
        </Card>
      ) : null}

      {isSubmitted ? (
        <FeedbackCard question={currentQuestion} selectedOptionIds={selectedOptionIds} isCorrect={isCorrect} />
      ) : null}

    </Screen>
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

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  questionText: {
    ...typography.heading,
    color: colors.light.textPrimary
  },
  options: {
    gap: spacing.md
  },
  optionCard: {
    alignItems: "flex-start",
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.lg
  },
  optionSelected: {
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.primary
  },
  optionCorrect: {
    backgroundColor: colors.light.successSoft,
    borderColor: colors.light.success
  },
  optionIncorrect: {
    backgroundColor: colors.light.dangerSoft,
    borderColor: colors.light.danger
  },
  optionPressed: {
    opacity: 0.82
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.light.textPrimary
  },
  optionMarker: {
    alignItems: "center",
    borderColor: colors.light.borderStrong,
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
    borderColor: colors.light.primary
  },
  optionMarkerCorrect: {
    borderColor: colors.light.success
  },
  optionMarkerIncorrect: {
    borderColor: colors.light.danger
  },
  optionMarkerInner: {
    backgroundColor: colors.light.primary,
    borderRadius: radius.pill,
    height: 10,
    width: 10
  },
  optionMarkerInnerSquare: {
    borderRadius: radius.xs
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  segmentButton: {
    flex: 1
  },
  reasonList: {
    gap: spacing.md
  },
  actions: {
    gap: spacing.md
  },
  feedbackText: {
    ...typography.small,
    color: colors.light.textSecondary
  },
  diagnosticSection: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
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
    color: colors.light.textPrimary
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
