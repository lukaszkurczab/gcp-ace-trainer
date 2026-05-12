import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
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

  return (
    <Screen>
      <Card>
        <SectionHeader
          title={`Question ${currentIndex + 1} / ${questions.length}`}
          subtitle={`${getDomainLabel(currentQuestion.domain)} · ${chooseLabel}`}
        />
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

      <View style={styles.actions}>
        {isSubmitted ? (
          <>
            <Button variant={needsReview ? "primary" : "secondary"} onPress={() => void toggleNeedsReview()}>
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

  return (
    <Card>
      <SectionHeader
        title={isCorrect ? "Correct" : "Incorrect"}
        action={<Badge label={isCorrect ? "Correct" : "Review"} tone={isCorrect ? "success" : "warning"} />}
      />
      <Text style={styles.feedbackText}>Selected: {getOptionText(question, selectedOptionIds) || "No answer selected."}</Text>
      <Text style={styles.feedbackText}>Correct: {getOptionText(question, question.correctOptionIds)}</Text>
      <Text style={styles.feedbackText}>{question.explanation}</Text>

      {whyWrongEntries.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Why other options are wrong</Text>
          {whyWrongEntries.map(([optionId, reason]) => (
            <Text key={optionId} style={styles.feedbackText}>
              {optionId}: {reason}
            </Text>
          ))}
        </View>
      ) : null}

      {question.watchOutFor && question.watchOutFor.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Watch out for</Text>
          {question.watchOutFor.map((item) => (
            <Text key={item} style={styles.feedbackText}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}

      {question.examSignals && question.examSignals.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Exam signals</Text>
          <Text style={styles.feedbackText}>{question.examSignals.join(", ")}</Text>
        </View>
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

function getOptionText(question: Question, optionIds: readonly string[]): string {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]));
  return optionIds.map((optionId) => optionById.get(optionId) ?? optionId).join(", ");
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  questionText: {
    ...typography.heading,
    color: colors.light.text
  },
  options: {
    gap: spacing.md
  },
  optionCard: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  optionSelected: {
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.primary
  },
  optionCorrect: {
    borderColor: colors.light.success
  },
  optionIncorrect: {
    borderColor: colors.light.danger
  },
  optionPressed: {
    opacity: 0.82
  },
  optionText: {
    ...typography.body,
    color: colors.light.text
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
    ...typography.body,
    color: colors.light.textMuted
  },
  detailBlock: {
    gap: spacing.xs
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
