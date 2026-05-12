import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, ProgressBar, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { getAttempts, getQuestionReviewState, saveQuestionReviewState } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { AnswerRecord, AttemptSummary, Question, QuestionReviewState } from "../../types";

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
            <ProgressBar progress={attempt.scorePercent / 100} tone={attempt.passedTrainingThreshold ? "success" : "warning"} />
            <View style={styles.filterRow}>
              <FilterChip active={filter === "all"} label="All" onPress={() => setFilter("all")} tone="info" />
              <FilterChip active={filter === "incorrect"} label="Incorrect" onPress={() => setFilter("incorrect")} tone="danger" />
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
  const watchOutForItems = normalizeWatchOutFor(question.watchOutFor);

  return (
    <Card variant={!answer.isAnswered || !answer.isCorrect ? "warning" : "default"}>
      <SectionHeader
        title={`Question ${answer.questionNumber}`}
        subtitle={answer.isAnswered ? (answer.isCorrect ? "Correct" : "Incorrect") : "Unanswered"}
        action={<Badge label={needsReview ? "Needs Review" : answer.wasFlagged ? "Flagged" : answer.isCorrect ? "Correct" : "Review"} tone={needsReview ? "warning" : answer.isCorrect ? "success" : "danger"} />}
      />

      <View style={styles.badgeRow}>
        {answer.confidence ? <Badge label={`Confidence: ${formatLabel(answer.confidence)}`} tone="info" /> : null}
        {answer.mistakeReason ? <Badge label={`Reason: ${formatLabel(answer.mistakeReason)}`} tone="warning" /> : null}
        {answer.wasFlagged ? <Badge label="Flagged" tone="warning" /> : null}
      </View>

      <Text style={styles.questionText}>{question.question}</Text>

      <DiagnosticBlock label="Selected answer" tone={answer.isCorrect ? "neutral" : "danger"} value={selectedText || "No answer selected."} />

      <DiagnosticBlock label="Correct answer" tone="success" value={correctText} />

      <DiagnosticBlock label="Explanation" value={question.explanation} />

      {whyWrongEntries.length > 0 ? (
        <DiagnosticBlock label="Why other options are wrong">
          {whyWrongEntries.map(([optionId, reason]) => (
            <Text key={optionId} style={styles.detailText}>
              {optionId}: {reason}
            </Text>
          ))}
        </DiagnosticBlock>
      ) : null}

      {watchOutForItems.length > 0 ? (
        <DiagnosticBlock label="Watch out for">
          {watchOutForItems.map((item) => (
            <Text key={item} style={styles.detailText}>
              {item}
            </Text>
          ))}
        </DiagnosticBlock>
      ) : null}

      {question.examSignals && question.examSignals.length > 0 ? (
        <DiagnosticBlock label="Exam signals" value={question.examSignals.join(", ")} />
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

function normalizeWatchOutFor(value: Question["watchOutFor"]): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function DiagnosticBlock({
  children,
  label,
  tone = "neutral",
  value
}: {
  children?: ReactNode;
  label: string;
  tone?: "neutral" | "success" | "danger";
  value?: string;
}) {
  return (
    <View style={[styles.detailBlock, tone === "success" ? styles.successBlock : null, tone === "danger" ? styles.dangerBlock : null]}>
      <Text style={styles.detailLabel}>{label}</Text>
      {value ? <Text style={styles.detailText}>{value}</Text> : children}
    </View>
  );
}

function FilterChip({ active, label, onPress, tone }: { active: boolean; label: string; onPress: () => void; tone: "danger" | "info" }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, active ? styles[`${tone}FilterChip`] : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.filterChipText, active ? styles.activeFilterChipText : null]}>{label}</Text>
    </Pressable>
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  filterChip: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dangerFilterChip: {
    backgroundColor: colors.light.dangerSoft,
    borderColor: colors.light.danger
  },
  infoFilterChip: {
    backgroundColor: colors.light.infoSoft,
    borderColor: colors.light.info
  },
  filterChipText: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  activeFilterChipText: {
    color: colors.light.textPrimary
  },
  pressed: {
    opacity: 0.82
  },
  answerList: {
    gap: spacing.lg
  },
  questionText: {
    ...typography.heading,
    color: colors.light.textPrimary
  },
  detailBlock: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md
  },
  successBlock: {
    backgroundColor: colors.light.successSoft,
    borderColor: colors.light.successSoft
  },
  dangerBlock: {
    backgroundColor: colors.light.dangerSoft,
    borderColor: colors.light.dangerSoft
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  detailText: {
    ...typography.small,
    color: colors.light.textSecondary
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
