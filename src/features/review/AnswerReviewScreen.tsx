import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { getAttempts, getQuestionReviewState, saveQuestionReviewState } from "../../storage";
import { colors, spacing, typography } from "../../theme";
import type { AnswerRecord, AttemptSummary, QuestionReviewState } from "../../types";

type AnswerReviewScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ANSWER_REVIEW>;

type ReviewFilter = "all" | "incorrect";

export function AnswerReviewScreen({ route }: AnswerReviewScreenProps) {
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [reviewState, setReviewState] = useState<QuestionReviewState>({});
  const [filter, setFilter] = useState<ReviewFilter>(route.params?.initialFilter ?? "all");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewData() {
        const [attempts, savedReviewState] = await Promise.all([getAttempts(), getQuestionReviewState()]);
        const selectedAttempt = attempts.find((item) => item.id === route.params?.attemptId) ?? attempts[0] ?? null;

        if (isActive) {
          setAttempt(selectedAttempt);
          setReviewState(savedReviewState);
        }
      }

      void loadReviewData();

      return () => {
        isActive = false;
      };
    }, [route.params?.attemptId])
  );

  const answers = useMemo(() => {
    if (!attempt) {
      return [];
    }

    return filter === "incorrect" ? attempt.answers.filter((answer) => !answer.isCorrect) : attempt.answers;
  }, [attempt, filter]);

  async function toggleNeedsReview(questionId: string) {
    const current = reviewState[questionId];
    const nextReviewState: QuestionReviewState = {
      ...reviewState,
      [questionId]: {
        questionId,
        isFlagged: current?.isFlagged ?? false,
        needsReview: !(current?.needsReview ?? false),
        confidence: current?.confidence,
        mistakeReason: current?.mistakeReason,
        notes: current?.notes,
        lastReviewedAt: current?.lastReviewedAt,
        updatedAt: new Date().toISOString()
      }
    };

    setReviewState(nextReviewState);
    await saveQuestionReviewState(nextReviewState);
  }

  return (
    <Screen>
      {attempt ? (
        <>
          <Card>
            <SectionHeader
              title="Answer Review"
              subtitle={`${attempt.correctCount}/${attempt.questionCount} correct · ${attempt.scorePercent}%`}
            />
            <View style={styles.filterRow}>
              <Button variant={filter === "all" ? "primary" : "secondary"} style={styles.filterButton} onPress={() => setFilter("all")}>
                All
              </Button>
              <Button
                variant={filter === "incorrect" ? "primary" : "secondary"}
                style={styles.filterButton}
                onPress={() => setFilter("incorrect")}
              >
                Incorrect
              </Button>
            </View>
          </Card>

          {answers.length > 0 ? (
            <View style={styles.answerList}>
              {answers.map((answer) => (
                <AnswerCard
                  answer={answer}
                  key={answer.questionId}
                  needsReview={reviewState[answer.questionId]?.needsReview ?? false}
                  onToggleNeedsReview={() => void toggleNeedsReview(answer.questionId)}
                />
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState title="No answers in this view" description="Switch filters to review the full attempt." />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <EmptyState title="No attempt found" description="Submit an exam before reviewing answers." />
        </Card>
      )}
    </Screen>
  );
}

type AnswerCardProps = {
  answer: AnswerRecord;
  needsReview: boolean;
  onToggleNeedsReview: () => void;
};

function AnswerCard({ answer, needsReview, onToggleNeedsReview }: AnswerCardProps) {
  const question = answer.questionSnapshot;
  const selectedText = getOptionText(answer, answer.selectedOptionIds);
  const correctText = getOptionText(answer, answer.correctOptionIds);
  const whyWrongEntries = Object.entries(question.whyOthersAreWrong ?? {});

  return (
    <Card>
      <SectionHeader
        title={`Question ${answer.questionNumber}`}
        subtitle={answer.isAnswered ? (answer.isCorrect ? "Correct" : "Incorrect") : "Unanswered"}
        action={<Badge label={needsReview ? "Needs Review" : answer.wasFlagged ? "Flagged" : "Reviewed"} tone={needsReview ? "warning" : "neutral"} />}
      />

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Selected answer</Text>
        <Text style={styles.detailText}>{selectedText || "No answer selected."}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Correct answer</Text>
        <Text style={styles.detailText}>{correctText}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Explanation</Text>
        <Text style={styles.detailText}>{question.explanation}</Text>
      </View>

      {whyWrongEntries.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Why other options are wrong</Text>
          {whyWrongEntries.map(([optionId, reason]) => (
            <Text key={optionId} style={styles.detailText}>
              {optionId}: {reason}
            </Text>
          ))}
        </View>
      ) : null}

      {question.watchOutFor && question.watchOutFor.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Watch out for</Text>
          {question.watchOutFor.map((item) => (
            <Text key={item} style={styles.detailText}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}

      {question.examSignals && question.examSignals.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Exam signals</Text>
          <Text style={styles.detailText}>{question.examSignals.join(", ")}</Text>
        </View>
      ) : null}

      {question.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {question.tags.map((tag) => (
            <Badge key={tag} label={tag} tone="neutral" />
          ))}
        </View>
      ) : null}

      <Button variant={needsReview ? "primary" : "secondary"} onPress={onToggleNeedsReview}>
        {needsReview ? "Marked Needs Review" : "Mark Needs Review"}
      </Button>
    </Card>
  );
}

function getOptionText(answer: AnswerRecord, optionIds: readonly string[]): string {
  const optionById = new Map(answer.questionSnapshot.options.map((option) => [option.id, option.text]));

  return optionIds.map((optionId) => optionById.get(optionId) ?? optionId).join(", ");
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  filterButton: {
    flex: 1
  },
  answerList: {
    gap: spacing.lg
  },
  questionText: {
    ...typography.heading,
    color: colors.light.text
  },
  detailBlock: {
    gap: spacing.xs
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  detailText: {
    ...typography.body,
    color: colors.light.textMuted
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
