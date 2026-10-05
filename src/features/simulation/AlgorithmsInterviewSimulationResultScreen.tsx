import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, Screen, SessionResultOverview } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { PracticeQuestionCard } from "../practice/PracticeQuestionCard";
import { PracticeResponseControls } from "../practice/PracticeResponseControls";
import { PracticeResultLoadingSkeleton } from "../practice/AlgorithmsPracticeSummaryScreen";
import { buildPracticeResponseControl } from "../practice/practiceSessionPresentation";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { useSimulationResultRead } from "./simulationResultRead";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

export function AlgorithmsInterviewSimulationSummaryScreen({ navigation, route }: SummaryProps) {
  const { t } = useTranslation("common");
  const { retry, state } = useSimulationResultRead(route.params.sessionId);
  if (state.requestKey !== route.params.sessionId || state.kind === "pending") return <Screen><PracticeResultLoadingSkeleton /></Screen>;
  if (state.kind === "error") return <Screen><EmptyState title={t("Session summary unavailable")} description={state.reason} actionLabel={t("Try again")} onActionPress={retry} /></Screen>;

  const result = state.result;
  const score = result.score;
  if (result.modeId !== "coding-interview-simulation" || result.completionKind !== "completed" || result.totalOccurrences !== 40 || result.feedbackItems.length !== 40 || !score || result.overallPointsEarned === null) {
    return <Screen><EmptyState title={t("Session summary unavailable")} description={t("The completed session evidence is incomplete.")} /></Screen>;
  }
  const answeredCount = result.answeredOccurrenceIds.length;
  return (
    <Screen>
      <SessionResultOverview
        activeTime={formatElapsed(result.elapsedForegroundMs)}
        answeredCount={answeredCount}
        backTestID={runtimeSelectors.summary.backToPractice(result.sessionId)}
        completion="completed"
        context={{ modeLabel: t("Coding Mock Interview"), trackLabel: t("Coding Interview") }}
        onBack={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        points={{ earned: result.overallPointsEarned, max: score.maxPoints }}
        requestedCount={result.configuration.requestedLength}
        review={{ onPress: () => navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW, { sessionId: result.sessionId }), testID: runtimeSelectors.summary.reviewAnswers(result.sessionId) }}
        rootTestID={runtimeSelectors.summary.root(result.sessionId)}
        score={{ correctCount: score.correctCount, incorrectCount: score.incorrectCount, partialCount: score.partialCount }}
        secondaryNote={{ text: t("Feedback at session end") }}
        totalOccurrences={result.totalOccurrences}
        unansweredCount={result.unansweredOccurrenceIds.length}
      />
    </Screen>
  );
}

export function AlgorithmsInterviewSimulationReviewScreen({ navigation, route }: ReviewProps) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const { retry, state } = useSimulationResultRead(route.params.sessionId);
  const [currentOccurrenceId, setCurrentOccurrenceId] = useState<string | null>(null);
  const backToResult = () => navigation.popTo(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { sessionId: route.params.sessionId });

  if (state.requestKey !== route.params.sessionId || state.kind === "pending") return <Screen><PracticeResultLoadingSkeleton /></Screen>;
  if (state.kind === "error") return <Screen><EmptyState title={t("Session result unavailable")} description={state.reason} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;

  const result = state.result;
  if (result.modeId !== "coding-interview-simulation" || result.completionKind !== "completed" || result.feedbackItems.length !== 40) {
    return <Screen><EmptyState title={t("Session result unavailable")} description={t("The completed session evidence is incomplete.")} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  }
  const requestedIndex = currentOccurrenceId ? result.feedbackItems.findIndex((item) => item.occurrenceId === currentOccurrenceId) : 0;
  const index = Math.max(0, requestedIndex);
  const item = result.feedbackItems[index];
  if (!item) return <Screen><EmptyState title={t("Session result unavailable")} description={t("We couldn’t load the session result.")} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  const previous = result.feedbackItems[index - 1];
  const next = result.feedbackItems[index + 1];
  const headerAction = <Button onPress={backToResult} testID={runtimeSelectors.practiceReview.result()} variant="ghost">{t("Back to results")}</Button>;
  const outcome = item.correctness;

  return (
    <SessionShell
      key={item.occurrenceId}
      headerAction={headerAction}
      modeLabel={t("Coding Mock Interview")}
      position={{ label: `${item.ordinal} / ${result.totalOccurrences}`, accessibilityLabel: `${t("Question")} ${item.ordinal} / ${result.totalOccurrences}` }}
      progress={item.ordinal / result.totalOccurrences}
      rootTestID={runtimeSelectors.practiceReview.root(result.sessionId, item.occurrenceId)}
      actionBar={(
        <View style={styles.actions}>
          <Button disabled={!previous} onPress={() => previous && setCurrentOccurrenceId(previous.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.previous()} variant="secondary">{t("Back")}</Button>
          <Button disabled={!next} onPress={() => next && setCurrentOccurrenceId(next.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.next()}>{t("Next")}</Button>
        </View>
      )}
    >
      <PracticeQuestionCard question={{ constraints: item.constraints, itemId: item.questionId, prompt: item.prompt }} />
      <Text maxFontSizeMultiplier={2} style={[styles.result, styles[outcome]]}>{t(outcome === "unanswered" ? "Unanswered" : outcome === "correct" ? "Correct" : outcome === "partial" ? "Partial" : "Incorrect")}</Text>
      <PracticeResponseControls
        control={buildPracticeResponseControl({
          choiceSelectionMode: item.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single",
          feedbackControls: item.controls,
          localResponse: null,
          renderer: item.interaction.renderer,
        })}
        editable={false}
        itemId={item.questionId}
        onChoicePress={noop}
        onComplexityValuePress={noop}
        onOrderingMove={noop}
      />
      <PracticeFeedbackBlock feedback={{ details: item.details, messages: item.messages, reason: item.reason, result: outcome, sources: item.sources }} item={item.item} itemId={item.questionId} reportSurface={{ modeRoute: "answer_review", trackNode: null }} />
    </SessionShell>
  );
}

export function SimulationResultLoadingSkeleton() { return <PracticeResultLoadingSkeleton />; }
function noop() {}
function formatElapsed(milliseconds: number): string { const seconds = Math.max(0, Math.floor(milliseconds / 1_000)); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

const createStyles = (palette: AppColors) => StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
  result: { ...typography.bodyStrong },
  correct: { color: palette.success },
  partial: { color: palette.warning },
  incorrect: { color: palette.danger },
  unanswered: { color: palette.textSecondary },
});
