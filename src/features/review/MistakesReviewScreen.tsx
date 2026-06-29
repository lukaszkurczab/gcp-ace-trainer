import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, ListRow, Screen, SectionHeader } from "../../components";
import { getAttempts, getPracticeHistory, getQuestionReviewState, getQuestions, saveQuestionReviewState } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { AnswerRecord, Confidence, ExamDomain, MistakeReason, PracticeAnswerRecord, Question, QuestionReviewState } from "../../types";
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
  confidence?: Confidence;
  mistakeReason?: MistakeReason;
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
          <FilterChip active={filter === "incorrect"} label="Incorrect" onPress={() => setFilter("incorrect")} tone="danger" />
          <FilterChip active={filter === "needs_review"} label="Needs Review" onPress={() => setFilter("needs_review")} tone="warning" />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Domain Filter" tight />
        <View style={styles.filterRow}>
          <FilterChip active={domainFilter === "all"} label="All Domains" onPress={() => setDomainFilter("all")} tone="info" />
          {(["setup_environment", "planning_implementation", "operations", "access_security"] as ExamDomain[]).map((domain) => (
            <FilterChip
              active={domainFilter === domain}
              key={domain}
              label={getShortDomainLabel(domain)}
              onPress={() => setDomainFilter(domain)}
              tone="neutral"
            />
          ))}
        </View>
      </Card>

      {visibleItems.length > 0 ? (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <ListRow
              detail={getDomainLabel(item.question.domain)}
              key={item.id}
              onPress={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}
              title={item.question.question}
              trailing={
                <View style={styles.badgeRow}>
                  <Badge label={formatLabel(item.source)} tone="neutral" />
                  {item.isIncorrect ? <Badge label="Incorrect" tone="danger" /> : null}
                  {item.needsReview ? <Badge label="Needs Review" tone="warning" /> : null}
                  {item.confidence ? <Badge label={formatLabel(item.confidence)} tone="info" /> : null}
                  {item.mistakeReason ? <Badge label={formatLabel(item.mistakeReason)} tone="warning" /> : null}
                </View>
              }
            />
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
        confidence: answer.confidence,
        mistakeReason: answer.mistakeReason,
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
        confidence: record.confidence,
        mistakeReason: record.mistakeReason,
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
          correctOptionIds: question.correctOptionIds,
          confidence: item.confidence,
          mistakeReason: item.mistakeReason
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
  const watchOutForItems = normalizeWatchOutFor(item.question.watchOutFor);

  return (
    <Card>
      <SectionHeader title="Question Detail" subtitle={getDomainLabel(item.question.domain)} />
      <View style={styles.badgeRow}>
        <Badge label={formatLabel(item.source)} tone="neutral" />
        {item.isIncorrect ? <Badge label="Incorrect" tone="danger" /> : null}
        {item.needsReview ? <Badge label="Needs Review" tone="warning" /> : null}
        {item.confidence ? <Badge label={`Confidence: ${formatLabel(item.confidence)}`} tone="info" /> : null}
        {item.mistakeReason ? <Badge label={`Reason: ${formatLabel(item.mistakeReason)}`} tone="warning" /> : null}
      </View>
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

      {watchOutForItems.length > 0 ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Watch out for</Text>
          {watchOutForItems.map((value) => (
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

function getShortDomainLabel(domain: ExamDomain): string {
  switch (domain) {
    case "setup_environment":
      return "Setup";
    case "planning_implementation":
      return "Planning";
    case "operations":
      return "Operations";
    case "access_security":
      return "Access";
  }
}

function FilterChip({ active, label, onPress, tone }: { active: boolean; label: string; onPress: () => void; tone: "neutral" | "danger" | "warning" | "info" }) {
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

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  list: {
    gap: spacing.md
  },
  filterChip: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  neutralFilterChip: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.borderStrong
  },
  dangerFilterChip: {
    backgroundColor: colors.dark.dangerSoft,
    borderColor: colors.dark.danger
  },
  warningFilterChip: {
    backgroundColor: colors.dark.warningSoft,
    borderColor: colors.dark.warning
  },
  infoFilterChip: {
    backgroundColor: colors.dark.infoSoft,
    borderColor: colors.dark.info
  },
  filterChipText: {
    ...typography.caption,
    color: colors.dark.textSecondary
  },
  activeFilterChipText: {
    color: colors.dark.textPrimary
  },
  pressed: {
    opacity: 0.82
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  detailQuestion: {
    ...typography.heading,
    color: colors.dark.textPrimary
  },
  detailBlock: {
    gap: spacing.xs
  },
  detailLabel: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary
  },
  detailText: {
    ...typography.body,
    color: colors.dark.textSecondary
  }
});
