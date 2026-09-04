import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { getAlgorithmsPracticeReviewProjection, type AlgorithmsSessionResultProjection } from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { spacing, typography, type AppColors } from "../../theme";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { PracticeFeedbackBlock } from "./PracticeFeedbackBlock";
import { PracticeQuestionCard } from "./PracticeQuestionCard";
import { PracticeResponseControls } from "./PracticeResponseControls";
import { buildPracticeResponseControl } from "./practiceSessionPresentation";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_PRACTICE_REVIEW>;
type ReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; result: AlgorithmsSessionResultProjection }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function AlgorithmsPracticeReviewLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading review…")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.loadingRoot}
      testID="algorithms-practice-review-loading-skeleton"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.loadingShapes}>
        <View style={styles.loadingQuestion} testID="algorithms-practice-review-loading-question">
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionTitle, { height: 20 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionLine, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionLineShort, { height: 16 * textScale }]} />
        </View>
        <View style={[styles.loadingResponse, largeLayout ? styles.loadingResponseLarge : null]} testID="algorithms-practice-review-loading-response">
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingResponseTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingResponseLine, { height: 48 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingResponseLine, { height: 48 * textScale }]} />
        </View>
        <View style={styles.loadingFeedback} testID="algorithms-practice-review-loading-feedback">
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingFeedbackTitle, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingFeedbackLine, { height: 14 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingFeedbackLineShort, { height: 14 * textScale }]} />
        </View>
      </View>
    </View>
  );
}

export function AlgorithmsPracticeReviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const { sessionId, occurrenceId } = route.params;
  const requestKey = JSON.stringify([sessionId, occurrenceId]);
  const [readState, setReadState] = useState<ReadState>({ kind: "pending", requestKey });
  const [currentOccurrenceId, setCurrentOccurrenceId] = useState(occurrenceId);

  useEffect(() => {
    let live = true;
    setReadState({ kind: "pending", requestKey });
    setCurrentOccurrenceId(occurrenceId);
    void getAlgorithmsPracticeReviewProjection(sessionId, occurrenceId)
      .then((result) => { if (live) setReadState({ kind: "ready", requestKey, result }); })
      .catch((error) => {
        if (live) setReadState({ kind: "unavailable", requestKey, reason: describeOperationalFailure(error, t("We couldn’t load the session result.")) });
      });
    return () => { live = false; };
  }, [sessionId, occurrenceId, requestKey, t]);

  const backToResult = () => navigation.popTo(ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId });
  const headerAction = <Button onPress={backToResult} testID={runtimeSelectors.practiceReview.result()} variant="ghost">{t("Back to results")}</Button>;
  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    return <SessionShell headerAction={headerAction} modeLabel={t("Answer review")}><AlgorithmsPracticeReviewLoadingSkeleton /></SessionShell>;
  }
  if (readState.kind === "unavailable") {
    return <Screen edges={["top", "bottom"]} header={headerAction}><EmptyState title={t("Session result unavailable")} description={readState.reason} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  }

  const { result } = readState;
  const index = result.feedbackItems.findIndex((item) => item.occurrenceId === currentOccurrenceId);
  const item = result.feedbackItems[index];
  if (!item) {
    return <Screen edges={["top", "bottom"]} header={headerAction}><EmptyState title={t("Session result unavailable")} description={t("We couldn’t load the session result.")} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  }
  const previous = result.feedbackItems[index - 1];
  const next = result.feedbackItems[index + 1];

  return (
    <SessionShell
      key={item.occurrenceId}
      headerAction={headerAction}
      modeLabel={t("Answer review")}
      position={{ label: `${item.ordinal} / ${result.totalOccurrences}`, accessibilityLabel: `${t("Question")} ${item.ordinal} / ${result.totalOccurrences}` }}
      progress={item.ordinal / result.totalOccurrences}
      rootTestID={runtimeSelectors.practiceReview.root(sessionId, item.occurrenceId)}
      actionBar={(
        <View style={styles.actions}>
          <Button disabled={!previous} onPress={() => { if (previous) setCurrentOccurrenceId(previous.occurrenceId); }} style={styles.action} testID={runtimeSelectors.practiceReview.previous()} variant="secondary">{t("Back")}</Button>
          <Button disabled={!next} onPress={() => { if (next) setCurrentOccurrenceId(next.occurrenceId); }} style={styles.action} testID={runtimeSelectors.practiceReview.next()}>{t("Next")}</Button>
        </View>
      )}
    >
      <PracticeQuestionCard question={{ constraints: item.constraints, itemId: item.occurrenceId, prompt: item.prompt }} />
      <Text maxFontSizeMultiplier={2} style={[styles.result, styles[item.correctness]]}>{t(item.correctness === "correct" ? "Correct" : item.correctness === "partial" ? "Partial" : "Incorrect")}</Text>
      <PracticeResponseControls
        control={buildPracticeResponseControl({
          choiceSelectionMode: item.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single",
          feedbackControls: item.controls,
          localResponse: null,
          renderer: item.interaction.renderer,
        })}
        editable={false}
        itemId={item.occurrenceId}
        onChoicePress={noop}
        onComplexityValuePress={noop}
        onOrderingMove={noop}
      />
      <PracticeFeedbackBlock feedback={{ details: item.details, reason: item.reason, result: item.correctness }} item={item.item} itemId={item.occurrenceId} reportSurface={{ modeRoute: "answer_review", trackNode: null }} />
    </SessionShell>
  );
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
  loadingFeedback: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 18, gap: spacing.sm, padding: spacing.lg },
  loadingFeedbackLine: { width: "83%" },
  loadingFeedbackLineShort: { width: "61%" },
  loadingFeedbackTitle: { width: "34%" },
  loadingLine: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: spacing.sm, borderWidth: 1 },
  loadingQuestion: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 18, gap: spacing.sm, padding: spacing.lg },
  loadingQuestionLine: { width: "91%" },
  loadingQuestionLineShort: { width: "69%" },
  loadingQuestionTitle: { width: "27%" },
  loadingResponse: { gap: spacing.sm },
  loadingResponseLarge: { gap: spacing.md },
  loadingResponseLine: { backgroundColor: palette.surfaceInput, borderRadius: spacing.sm, flex: 1 },
  loadingResponseTitle: { width: "35%" },
  loadingRoot: { gap: spacing.xl },
  loadingShapes: { gap: spacing.xl },
  result: { ...typography.bodyStrong },
  correct: { color: palette.success },
  partial: { color: palette.warning },
  incorrect: { color: palette.danger },
});
