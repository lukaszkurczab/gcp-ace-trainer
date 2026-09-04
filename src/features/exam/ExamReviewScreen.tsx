import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { loadTrainingAttempts } from "../../application/learningReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { Button, EmptyState, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import { getTrackDisplay, type AttemptResultKind, type ContentItemRef, type TrainingAttempt } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { radius, spacing, typography, type AppColors } from "../../theme";
import type { CertificationQuestion } from "../../tracks/certification";
import type { DesignQuestion } from "../../tracks/design-interview";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import type { PracticeFeedback } from "../practice/practiceSessionPresentation";
import type { ContentReportSurfaceContext } from "../reports/ContentReportSheet";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;

type ReviewRow = Readonly<{
  id: string;
  occurrenceId: string;
  item: ContentItemRef;
  prompt: string;
  result: AttemptResultKind;
  feedback: PracticeFeedback;
  reportSurface: ContentReportSurfaceContext;
}>;

type ExamReviewReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; rows: readonly ReviewRow[] }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

function buildReviewRow(attempt: TrainingAttempt, prompt: string, feedback: Pick<PracticeFeedback, "details" | "reason">): ReviewRow {
  const result = attempt.result.kind;
  return {
    id: attempt.id,
    occurrenceId: attempt.occurrenceId,
    item: attempt.item,
    prompt,
    result,
    feedback: { details: feedback.details, reason: feedback.reason, result },
    reportSurface: { modeRoute: "answer_review", trackNode: null },
  };
}

async function resolveReviewRow(attempt: TrainingAttempt): Promise<ReviewRow> {
  const itemTrackId = attempt.item.trackId;
  if (attempt.trackId !== itemTrackId) throw new Error("Review attempt track does not match its immutable item.");
  const familyId = getTrackDisplay(itemTrackId).familyId;
  switch (familyId) {
    case "certification": {
      const question = await contentPackageRuntimeOwner.resolveItem<CertificationQuestion>(attempt.item);
      return buildReviewRow(attempt, question.question, question.feedback);
    }
    case "design_interview": {
      const question = await contentPackageRuntimeOwner.resolveItem<DesignQuestion>(attempt.item);
      return buildReviewRow(attempt, question.prompt, question.feedback);
    }
    case "coding_interview":
      throw new Error("Coding Interview attempts use their dedicated review surface.");
    default:
      throw new Error(`Review is unavailable for unsupported track family ${familyId}.`);
  }
}

function reviewResultLabel(result: AttemptResultKind): "Correct" | "Partial" | "Incorrect" {
  if (result === "correct") return "Correct";
  if (result === "partial") return "Partial";
  return "Incorrect";
}

export function ExamReviewScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ExamReviewReadState>({ kind: "pending", requestKey });

  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });

    void loadTrainingAttempts()
      .then(async ({ value }) => {
        if (!live) return;
        const rows = await Promise.all(value
          .filter((attempt) => attempt.sessionId === capturedRequestKey)
          .map((attempt) => resolveReviewRow(attempt)));
        if (!live) return;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, rows });
      })
      .catch((error) => {
        if (!live) return;
        setReadState({
          kind: "unavailable",
          requestKey: capturedRequestKey,
          reason: describeOperationalFailure(error, t("We couldn’t load your answers.")),
        });
      });

    return () => { live = false; };
  }, [requestKey, t]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    return <Screen><ExamReviewLoadingSkeleton /></Screen>;
  }
  if (readState.kind === "unavailable") {
    return (
      <Screen>
        <EmptyState
          title={t("Answer review is unavailable")}
          description={t(readState.reason)}
          actionLabel={t("Back to practice")}
          onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        />
      </Screen>
    );
  }
  const rows = readState.rows;
  if (!rows.length) return <Screen><EmptyState title={t("No submitted answers")} description={t("No answers were submitted in this session.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;

  return (
    <Screen style={styles.screen}>
      <Text testID={runtimeSelectors.examReview.root(route.params.sessionId)} />
      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          <Text key={`result:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.result, row.result === "correct" ? styles.correct : row.result === "partial" ? styles.partial : styles.incorrect]}>{t(reviewResultLabel(row.result))}</Text>
          <Text key={`prompt:${fontScale}`} maxFontSizeMultiplier={2} style={styles.prompt}>{row.prompt}</Text>
          <PracticeFeedbackBlock feedback={row.feedback} item={row.item} itemId={row.occurrenceId} reportSurface={row.reportSurface} />
        </View>
      ))}
      <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} testID={runtimeSelectors.examReview.backToPractice(route.params.sessionId)}>{t("Back to practice")}</Button>
    </Screen>
  );
}

export function ExamReviewLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading review…")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.examReviewLoading}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.examReviewLoadingShapes}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.examReviewLoadingRow}>
            <SkeletonShape motion={motion} style={[styles.examReviewLoadingResult, { height: 12 * textScale }]} />
            <View style={styles.examReviewLoadingPromptGroup}>
              <SkeletonShape motion={motion} style={[styles.examReviewLoadingPrompt, { height: 18 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.examReviewLoadingPromptShort, { height: 18 * textScale }]} />
            </View>
            <View style={styles.examReviewLoadingFeedbackCard}>
              <SkeletonShape motion={motion} style={[styles.examReviewLoadingFeedbackLine, styles.examReviewLoadingFeedbackLineLong, { height: 14 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.examReviewLoadingFeedbackLine, styles.examReviewLoadingFeedbackLineMedium, { height: 14 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.examReviewLoadingFeedbackLine, styles.examReviewLoadingFeedbackLineShort, { height: 14 * textScale }]} />
            </View>
          </View>
        ))}
        <SkeletonShape motion={motion} style={styles.examReviewLoadingReturn} />
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  examReviewLoading: { gap: spacing.lg, width: "100%" },
  examReviewLoadingShapes: { gap: spacing.lg, width: "100%" },
  examReviewLoadingRow: { gap: spacing.md },
  examReviewLoadingResult: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill, width: "24%" },
  examReviewLoadingPromptGroup: { gap: spacing.xs },
  examReviewLoadingPrompt: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill, width: "92%" },
  examReviewLoadingPromptShort: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill, width: "67%" },
  examReviewLoadingFeedbackCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  examReviewLoadingFeedbackLine: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill },
  examReviewLoadingFeedbackLineLong: { width: "92%" },
  examReviewLoadingFeedbackLineMedium: { width: "76%" },
  examReviewLoadingFeedbackLineShort: { width: "54%" },
  examReviewLoadingReturn: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.button, minHeight: 48, width: "100%" },
  screen: { gap: spacing.lg },
  row: { gap: spacing.md },
  result: { ...typography.small, fontWeight: "600" },
  correct: { ...typography.small, color: palette.success },
  partial: { ...typography.small, color: palette.warning },
  incorrect: { ...typography.small, color: palette.danger },
  prompt: { ...typography.bodyStrong, color: palette.textPrimary },
});
