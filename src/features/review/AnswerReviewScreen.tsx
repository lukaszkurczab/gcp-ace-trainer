import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnswerOption, Button, EmptyState, ReviewLoadingSkeleton, ReviewNavigator, ReviewShell, ReviewUnavailableSurface, type ReviewFilter, Screen } from "../../components";
import { setQuestionNeedsReview } from "../../application/certification";
import { loadExamSummaries as getAttempts, loadReviewQueueItems as getReviewQueueItems } from "../../application/learningReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { contentPackagePinsEqual } from "../../domain";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import type { CertificationAnswerViewModel, CertificationExamSummaryViewModel } from "../../tracks/certification";
import { ReviewFeedbackBlock } from "./ReviewFeedbackBlock";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ANSWER_REVIEW>;

export function AnswerReviewScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const [attempt, setAttempt] = useState<CertificationExamSummaryViewModel | null>(null);
  const [hasLoadedReviewData, setHasLoadedReviewData] = useState(false);
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [updatingReviewIds, setUpdatingReviewIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ReviewFilter>(route.params?.initialFilter === "incorrect" ? "missed" : "all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [navigatorVisible, setNavigatorVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setReviewError(null);
    setHasLoadedReviewData(false);
    void Promise.all([getAttempts(), getReviewQueueItems()])
      .then(([attempts, reviews]) => {
        if (!active) return;
        const selected = attempts.find((item) => item.id === route.params?.attemptId) ?? attempts[0] ?? null;
        setAttempt(selected);
        setReviewIds(new Set(reviews.value
          .filter((entry) => selected?.answers.some((answer) => answer.item.itemId === entry.sourceItem.itemId && answer.item.contentVersion === entry.sourceItem.contentVersion && contentPackagePinsEqual(answer.item.packagePin, entry.sourceItem.packagePin)))
          .map((entry) => entry.sourceItem.itemId)));
        setSelectedIndex(0);
        setHasLoadedReviewData(true);
      })
      .catch((error) => {
        if (!active) return;
        setReviewError(describeOperationalFailure(error, "Review data could not be loaded locally."));
        setHasLoadedReviewData(true);
      });
    return () => { active = false; };
  }, [route.params?.attemptId]));

  const answers = useMemo(() => {
    return attempt ? filter === "missed" ? attempt.answers.filter((answer) => !answer.isCorrect) : attempt.answers : [];
  }, [attempt, filter]);
  const currentIndex = answers.length ? Math.min(selectedIndex, answers.length - 1) : 0;
  const currentAnswer = answers[currentIndex] ?? null;
  const missedCount = attempt?.answers.filter((answer) => !answer.isCorrect).length ?? 0;
  const navigatorItems = attempt?.answers.map((answer, index) => ({ answered: answer.isAnswered, id: answer.questionId, ordinal: index + 1 })) ?? [];
  const contextLabel = answers.length === 0
    ? `0 ${t("of")} 0`
    : filter === "missed" && currentAnswer
      ? `${t("Question")} ${currentAnswer.questionNumber} • ${currentIndex + 1} ${t("of")} ${answers.length}`
      : `${currentIndex + 1} ${t("of")} ${answers.length}`;

  async function toggle(answer: CertificationAnswerViewModel) {
    const marked = !reviewIds.has(answer.questionId);
    setReviewError(null);
    setUpdatingReviewIds((current) => new Set(current).add(answer.questionId));
    try {
      if (!attempt) throw new Error("The reviewed Certification session is unavailable.");
      await setQuestionNeedsReview({ question: answer.questionSnapshot, sourceAttemptId: answer.attemptId, sourceItem: answer.item, sourceSessionId: attempt.id }, marked);
      setReviewIds((current) => {
        const next = new Set(current);
        marked ? next.add(answer.questionId) : next.delete(answer.questionId);
        return next;
      });
    } catch (error) {
      setReviewError(describeOperationalFailure(error, "The review mark could not be saved locally."));
    } finally {
      setUpdatingReviewIds((current) => {
        const next = new Set(current);
        next.delete(answer.questionId);
        return next;
      });
    }
  }

  if (reviewError) return <Screen><EmptyState title={t("Review unavailable")} description={t(reviewError)} /></Screen>;
  if (!hasLoadedReviewData) return <ReviewLoadingSkeleton onBack={() => navigation.goBack()} />;
  if (!attempt) return <Screen><EmptyState title={t("No attempt found")} description={t("Submit an exam before reviewing answers.")} /></Screen>;

  return (
    <ReviewShell
      backLabel={t("Go back")}
      contextLabel={contextLabel}
      filter={filter}
      missedCount={missedCount}
      nextDisabled={!currentAnswer || currentIndex >= answers.length - 1}
      onBack={() => navigation.goBack()}
      onFilterChange={(nextFilter) => { setFilter(nextFilter); setSelectedIndex(0); }}
      onNavigator={() => setNavigatorVisible(true)}
      onNext={() => setSelectedIndex((index) => Math.min(answers.length - 1, index + 1))}
      onPrevious={() => setSelectedIndex((index) => Math.max(0, index - 1))}
      previousDisabled={!currentAnswer || currentIndex === 0}
      testID={`answer-review-${attempt.id}`}
      totalOccurrences={attempt.answers.length}
    >
      {currentAnswer ? (
        <AnswerReviewContent
          answer={currentAnswer}
          disabled={updatingReviewIds.has(currentAnswer.questionId)}
          needsReview={reviewIds.has(currentAnswer.questionId)}
          onToggle={() => { void toggle(currentAnswer); }}
        />
      ) : (
        <ReviewUnavailableSurface
          description={t("Switch filters to review the full attempt.")}
          style={styles.unavailableContent}
          title={t("No answers in this view")}
        />
      )}
      <ReviewNavigator
        currentOrdinal={currentAnswer?.questionNumber ?? 1}
        items={navigatorItems}
        onClose={() => setNavigatorVisible(false)}
        onSelect={(ordinal) => { setFilter("all"); setSelectedIndex(ordinal - 1); setNavigatorVisible(false); }}
        visible={navigatorVisible}
      />
    </ReviewShell>
  );
}

function AnswerReviewContent({ answer, disabled, needsReview, onToggle }: Readonly<{ answer: CertificationAnswerViewModel; disabled: boolean; needsReview: boolean; onToggle: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const selected = new Set(answer.selectedOptionIds);
  const correct = new Set(answer.correctOptionIds);
  return (
    <View style={styles.answerContent}>
      <View style={styles.questionBlock}>
        <Text maxFontSizeMultiplier={2} style={styles.questionEyebrow}>{t("Question").toUpperCase()}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.question}>{answer.questionSnapshot.question}</Text>
      </View>
      <View style={styles.questionOptionsSpacer} />
      <View style={styles.options}>
        {answer.questionSnapshot.options.map((option, index) => (
          <AnswerOption
            accessibilityLabel={option.text}
            accessibilityRole={answer.questionSnapshot.type === "multiple" ? "checkbox" : "radio"}
            accessibilityState={{ checked: selected.has(option.id), disabled: true }}
            disabled
            key={option.id}
            letter={String.fromCharCode(65 + index)}
            onPress={() => undefined}
            state={answerOptionState(selected.has(option.id), correct.has(option.id))}
            text={option.text}
          />
        ))}
      </View>
      <View style={styles.optionsFeedbackSpacer} />
      {answer.isAnswered ? <ReviewFeedbackBlock feedback={answer.questionSnapshot.feedback} item={answer.item} reportSurface={{ modeRoute: "answer_review", trackNode: answer.questionSnapshot.domain }} /> : <Text maxFontSizeMultiplier={2} style={styles.unanswered}>{t("Unanswered")}</Text>}
      <Button disabled={disabled} onPress={onToggle} style={styles.markAction} variant="ghost">{t(needsReview ? "Marked Needs Review" : "Mark Needs Review")}</Button>
    </View>
  );
}

function answerOptionState(selected: boolean, correct: boolean) {
  if (correct && selected) return "correct" as const;
  if (correct) return "omitted_correct" as const;
  if (selected) return "incorrect" as const;
  return "default" as const;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answerContent: { gap: 0 },
  options: { gap: spacing.sm },
  question: { color: palette.textPrimary, fontSize: 18, fontWeight: "600", lineHeight: 27 },
  questionBlock: { gap: 6 },
  questionEyebrow: { color: palette.ambient.review, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, opacity: 0.5 },
  markAction: { marginTop: spacing.xl },
  optionsFeedbackSpacer: { height: 28 },
  questionOptionsSpacer: { height: 22 },
  unavailableContent: { alignItems: "center", backgroundColor: palette.effects.unavailableSurface, borderColor: palette.effects.subtleBorder, borderRadius: 18, gap: spacing.lg, marginTop: 101, paddingHorizontal: spacing.xxxl, paddingVertical: 28 },
  unanswered: { ...typography.bodyStrong, color: palette.textMuted },
});
