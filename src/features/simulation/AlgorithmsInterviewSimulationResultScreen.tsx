import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getAlgorithmsPracticeResultProjection, type AlgorithmsSessionResultProjection } from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

export function AlgorithmsInterviewSimulationSummaryScreen({ navigation, route }: SummaryProps) {
  return <AlgorithmsInterviewSimulationResultSurface navigation={navigation} sessionId={route.params.sessionId} />;
}

export function AlgorithmsInterviewSimulationReviewScreen({ navigation, route }: ReviewProps) {
  return <AlgorithmsInterviewSimulationReviewSurface navigation={navigation} sessionId={route.params.sessionId} />;
}

function AlgorithmsInterviewSimulationResultSurface({ navigation, sessionId }: Readonly<{ navigation: NavigationProp<RootStackParamList>; sessionId: string }>) {
  const [result, setResult] = useState<AlgorithmsSessionResultProjection | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const load = useCallback(async () => {
    setResult(null);
    setFailure(null);
    try { setResult(await getAlgorithmsPracticeResultProjection(sessionId)); }
    catch (error) { setFailure(messageFor(error)); }
  }, [sessionId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const projection: SimulationSurfaceProjection = result?.score
    ? {
        state: "completed",
        title: "Session complete",
        modeLabel: "Coding Interview",
        completion: {
          activeTime: formatElapsed(result.elapsedForegroundMs),
          answeredCount: result.answeredOccurrenceIds.length,
          configuration: `${result.configuration.actualLength} items · Feedback at session end`,
          unansweredCount: result.unansweredOccurrenceIds.length,
          correctCount: result.score.correctCount,
          partialCount: result.score.partialCount,
          incorrectCount: result.score.incorrectCount,
          earnedPoints: result.score.pointsEarned,
          maxPoints: result.score.maxPoints,
          reviewAvailable: result.feedbackItems.length > 0,
          reviewAction: { id: "review-session", label: "Review answers", onPress: () => navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW, { sessionId: result.sessionId }), variant: "primary" as const },
        },
        actions: { primary: { id: "back-to-practice", label: "Back to practice", onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB), variant: "secondary" } },
      }
    : failure ? {
        state: "verification_failed",
        title: "Verified result unavailable",
        notice: { tone: "error", message: failure },
        actions: { primary: { id: "retry", label: "Try again", onPress: () => { void load(); } }, secondary: { id: "back-to-practice", label: "Back to practice", onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB), variant: "secondary" } },
      } : {
        state: "preparing",
        title: "Preparing Interview Simulation result",
        notice: { tone: "neutral", message: "Reading the verified session result." },
      };
  return <SimulationSessionSurface projection={projection} />;
}

function AlgorithmsInterviewSimulationReviewSurface({ navigation, sessionId }: Readonly<{ navigation: NavigationProp<RootStackParamList>; sessionId: string }>) {
  const styles = useThemedStyles(createReviewStyles);
  const { t } = useAppPreferences();
  const [result, setResult] = useState<AlgorithmsSessionResultProjection | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const load = useCallback(async () => {
    setResult(null);
    setFailure(null);
    try { setResult(await getAlgorithmsPracticeResultProjection(sessionId)); }
    catch (error) { setFailure(messageFor(error)); }
  }, [sessionId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (failure) return <Screen><EmptyState title={t("Review unavailable")} description={t(failure)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!result) return <Screen><View accessibilityLabel={t("Loading review…")} accessibilityRole="progressbar" style={styles.pending}><Text style={styles.pendingText}>{t("Reading the verified simulation result.")}</Text></View></Screen>;
  const answers = filter === "missed" ? result.feedbackItems.filter((item) => item.correctness !== "correct") : result.feedbackItems;
  const currentIndex = answers.length ? Math.min(selectedIndex, answers.length - 1) : 0;
  const current = answers[currentIndex];
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={<View style={styles.footer}><Button onPress={() => navigation.goBack()} variant="secondary">{t("Back to summary")}</Button></View>}
    >
      <View style={styles.header} testID={runtimeSelectors.summary.root(sessionId)}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>{t("Answer review")}</Text><Text style={styles.title}>{t("Review your answers")}</Text></View>
        <Text style={styles.position}>{answers.length ? `${currentIndex + 1} ${t("of")} ${answers.length}` : "0"}</Text>
      </View>
      <View style={styles.scoreHeader}><View><Text style={styles.caption}>{t("Session score")}</Text><Text style={styles.score}>{result.score ? `${result.score.correctCount}/${result.totalOccurrences}` : "—"}</Text></View><Text style={styles.scorePercent}>{result.score ? `${Math.round((result.score.pointsEarned / Math.max(1, result.score.maxPoints)) * 100)}%` : "—"}</Text></View>
      <View style={styles.filterRow} accessibilityRole="tablist"><FilterButton active={filter === "all"} label={t("All")} onPress={() => { setFilter("all"); setSelectedIndex(0); }} /><FilterButton active={filter === "missed"} label={t("Missed")} onPress={() => { setFilter("missed"); setSelectedIndex(0); }} /></View>
      {current ? <View style={styles.answer}><Text style={styles.question}>{current.ordinal}. {current.prompt}</Text><PracticeFeedbackBlock item={current.item} itemId={current.occurrenceId} feedback={{ details: current.details, reason: current.reason, result: current.correctness }} /></View> : <EmptyState title={t("No answers in this view")} description={t("Switch filters to review the full simulation.")} />}
      {current ? <View style={styles.pager}><Button disabled={currentIndex === 0} onPress={() => setSelectedIndex((index) => Math.max(0, index - 1))} variant="secondary">{t("Previous")}</Button><Button disabled={currentIndex >= answers.length - 1} onPress={() => setSelectedIndex((index) => Math.min(answers.length - 1, index + 1))}>{t("Next")}</Button></View> : null}
    </Screen>
  );
}

function FilterButton({ active, label, onPress }: Readonly<{ active: boolean; label: string; onPress: () => void }>) {
  return <Button accessibilityState={{ selected: active }} onPress={onPress} variant={active ? "primary" : "secondary"}>{label}</Button>;
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createReviewStyles = (palette: AppColors) => StyleSheet.create({
  footer: { gap: spacing.sm },
  pending: { alignItems: "center", justifyContent: "center", minHeight: 180 },
  pendingText: { ...typography.body, color: palette.textSecondary },
  header: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { ...typography.caption, color: palette.primary, letterSpacing: 0.7, textTransform: "uppercase" },
  title: { ...typography.title, color: palette.textPrimary },
  position: { ...typography.bodyStrong, color: palette.textSecondary },
  scoreHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  score: { ...typography.display, color: palette.primary },
  scorePercent: { ...typography.heading, color: palette.primary },
  caption: { ...typography.caption, color: palette.textSecondary, textTransform: "uppercase" },
  filterRow: { flexDirection: "row", gap: spacing.sm },
  answer: { gap: spacing.lg },
  question: { ...typography.bodyStrong, color: palette.textPrimary },
  pager: { flexDirection: "row", gap: spacing.sm },
});

function messageFor(error: unknown): string { return describeOperationalFailure(error, "The session result is not available because verification did not complete."); }
