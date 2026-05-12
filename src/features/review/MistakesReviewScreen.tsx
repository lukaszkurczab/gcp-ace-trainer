import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { getAttempts, getPracticeHistory, getQuestionReviewState, getQuestions, saveQuestionReviewState } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { AnswerRecord, ExamDomain, PracticeAnswerRecord, Question, QuestionReviewState } from "../../types";
import { getDomainLabel } from "../../utils";

type ReviewFilter = "incorrect" | "needs_review";

type MistakeReviewItem = {
  id: string;
  questionId: string;
  question: Question;
  source: "exam" | "practice" | "review";
  isIncorrect: boolean;
  needsReview: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  answeredAt?: string;
};

export function MistakesReviewScreen() {
  const [items, setItems] = useState<MistakeReviewItem[]>([]);
  const [reviewState, setReviewState] = useState<QuestionReviewState>({});
  const [filter, setFilter] = useState<ReviewFilter>("incorrect");
  const [domainFilter, setDomainFilter] = useState<ExamDomain | "all">("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewItems() {
        const [attempts, practiceHistory, savedReviewState, questions] = await Promise.all([
          getAttempts(),
          getPracticeHistory(),
          getQuestionReviewState(),
          getQuestions()
        ]);
        const nextItems = buildMistakeReviewItems(attempts.flatMap((attempt) => attempt.answers), practiceHistory, savedReviewState, questions);

        if (isActive) {
          setItems(nextItems);
          setReviewState(savedReviewState);
          setSelectedItemId(null);
        }
      }

      void loadReviewItems();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = filter === "incorrect" ? item.isIncorrect : item.needsReview;
      const matchesDomain = domainFilter === "all" || item.question.domain === domainFilter;
      return matchesStatus && matchesDomain;
    });
  }, [domainFilter, filter, items]);

  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? null;

  async function toggleNeedsReview(item: MistakeReviewItem) {
    const current = reviewState[item.questionId];
    const nextNeedsReview = !(current?.needsReview ?? item.needsReview);
    const nextReviewState: QuestionReviewState = {
      ...reviewState,
      [item.questionId]: {
        questionId: item.questionId,
        isFlagged: current?.isFlagged ?? false,
        needsReview: nextNeedsReview,
        confidence: current?.confidence,
        mistakeReason: current?.mistakeReason,
        notes: current?.notes,
        lastReviewedAt: current?.lastReviewedAt,
        updatedAt: new Date().toISOString()
      }
    };

    setReviewState(nextReviewState);
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.questionId === item.questionId ? { ...currentItem, needsReview: nextNeedsReview } : currentItem
      )
    );
    await saveQuestionReviewState(nextReviewState);
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Mistakes Review" subtitle="Review incorrect answers and questions marked Needs Review." />
        <View style={styles.filterRow}>
          <Button style={styles.filterButton} variant={filter === "incorrect" ? "primary" : "secondary"} onPress={() => setFilter("incorrect")}>
            Incorrect
          </Button>
          <Button
            style={styles.filterButton}
            variant={filter === "needs_review" ? "primary" : "secondary"}
            onPress={() => setFilter("needs_review")}
          >
            Needs Review
          </Button>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Domain Filter" />
        <View style={styles.domainList}>
          <Button style={styles.domainButton} variant={domainFilter === "all" ? "primary" : "secondary"} onPress={() => setDomainFilter("all")}>
            All Domains
          </Button>
          {(["setup_environment", "planning_implementation", "operations", "access_security"] as ExamDomain[]).map((domain) => (
            <Button
              key={domain}
              onPress={() => setDomainFilter(domain)}
              variant={domainFilter === domain ? "primary" : "secondary"}
            >
              {getDomainLabel(domain)}
            </Button>
          ))}
        </View>
      </Card>

      {visibleItems.length > 0 ? (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}
              style={({ pressed }) => [styles.listItem, pressed ? styles.pressed : null]}
            >
              <Text style={styles.itemTitle}>{item.question.question}</Text>
              <View style={styles.badgeRow}>
                <Badge label={formatLabel(item.source)} tone="neutral" />
                {item.isIncorrect ? <Badge label="Incorrect" tone="danger" /> : null}
                {item.needsReview ? <Badge label="Needs Review" tone="warning" /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card>
          <EmptyState title="No questions found" description="Complete practice or mark questions for review to build this list." />
        </Card>
      )}

      {selectedItem ? <MistakeDetail item={selectedItem} onToggleNeedsReview={() => void toggleNeedsReview(selectedItem)} /> : null}
    </Screen>
  );
}

function buildMistakeReviewItems(
  examAnswers: AnswerRecord[],
  practiceHistory: PracticeAnswerRecord[],
  reviewState: QuestionReviewState,
  questions: Question[]
): MistakeReviewItem[] {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const items = new Map<string, MistakeReviewItem>();

  examAnswers
    .filter((answer) => !answer.isCorrect)
    .forEach((answer) => {
      items.set(`exam-${answer.questionId}-${answer.answeredAt}`, {
        id: `exam-${answer.questionId}-${answer.answeredAt}`,
        questionId: answer.questionId,
        question: answer.questionSnapshot,
        source: "exam",
        isIncorrect: true,
        needsReview: reviewState[answer.questionId]?.needsReview ?? false,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: answer.correctOptionIds,
        answeredAt: answer.answeredAt
      });
    });

  practiceHistory
    .filter((record) => !record.isCorrect)
    .forEach((record) => {
      items.set(`practice-${record.id}`, {
        id: `practice-${record.id}`,
        questionId: record.questionId,
        question: record.questionSnapshot,
        source: "practice",
        isIncorrect: true,
        needsReview: reviewState[record.questionId]?.needsReview ?? false,
        selectedOptionIds: record.selectedOptionIds,
        correctOptionIds: record.correctOptionIds,
        answeredAt: record.answeredAt
      });
    });

  Object.values(reviewState)
    .filter((item) => item.needsReview)
    .forEach((item) => {
      const question = questionById.get(item.questionId);

      if (!question) {
        return;
      }

      const id = `review-${item.questionId}`;

      if (!items.has(id)) {
        items.set(id, {
          id,
          questionId: item.questionId,
          question,
          source: "review",
          isIncorrect: false,
          needsReview: true,
          selectedOptionIds: [],
          correctOptionIds: question.correctOptionIds
        });
      }
    });

  return [...items.values()].sort((left, right) => (right.answeredAt ?? "").localeCompare(left.answeredAt ?? ""));
}

type MistakeDetailProps = {
  item: MistakeReviewItem;
  onToggleNeedsReview: () => void;
};

function MistakeDetail({ item, onToggleNeedsReview }: MistakeDetailProps) {
  const whyWrongEntries = Object.entries(item.question.whyOthersAreWrong ?? {});

  return (
    <Card>
      <SectionHeader title="Question Detail" subtitle={getDomainLabel(item.question.domain)} />
      <Text style={styles.detailQuestion}>{item.question.question}</Text>
      <DetailBlock label="Selected answer" value={getOptionText(item.question, item.selectedOptionIds) || "No answer recorded."} />
      <DetailBlock label="Correct answer" value={getOptionText(item.question, item.correctOptionIds)} />
      <DetailBlock label="Explanation" value={item.question.explanation} />

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

      {item.question.watchOutFor && item.question.watchOutFor.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Watch out for</Text>
          {item.question.watchOutFor.map((value) => (
            <Text key={value} style={styles.detailText}>
              {value}
            </Text>
          ))}
        </View>
      ) : null}

      {item.question.examSignals && item.question.examSignals.length > 0 ? (
        <DetailBlock label="Exam signals" value={item.question.examSignals.join(", ")} />
      ) : null}

      {item.question.tags.length > 0 ? (
        <View style={styles.badgeRow}>
          {item.question.tags.map((tag) => (
            <Badge key={tag} label={tag} tone="neutral" />
          ))}
        </View>
      ) : null}

      <Button variant={item.needsReview ? "primary" : "secondary"} onPress={onToggleNeedsReview}>
        {item.needsReview ? "Marked Needs Review" : "Mark Needs Review"}
      </Button>
    </Card>
  );
}

type DetailBlockProps = {
  label: string;
  value: string;
};

function DetailBlock({ label, value }: DetailBlockProps) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}

function getOptionText(question: Question, optionIds: readonly string[]): string {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]));
  return optionIds.map((optionId) => optionById.get(optionId) ?? optionId).join(", ");
}

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  filterButton: {
    flex: 1
  },
  domainList: {
    gap: spacing.md
  },
  domainButton: {
    alignSelf: "stretch"
  },
  list: {
    gap: spacing.md
  },
  listItem: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  pressed: {
    opacity: 0.82
  },
  itemTitle: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  detailQuestion: {
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
  }
});
