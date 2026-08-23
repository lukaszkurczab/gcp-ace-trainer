import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getAlgorithmsPracticeResultProjection, type AlgorithmsSessionResultProjection } from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { AnswerOption, EmptyState, Icon, ReviewNavigator, ReviewShell, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";
import { ReviewFeedbackBlock } from "../review/ReviewFeedbackBlock";

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
        title: "Simulation complete",
        modeLabel: "Coding Interview",
        completion: {
          activeTime: formatElapsed(result.elapsedForegroundMs),
          answeredCount: result.answeredOccurrenceIds.length,
          unansweredCount: result.unansweredOccurrenceIds.length,
          correctCount: result.score.correctCount,
          partialCount: result.score.partialCount,
          incorrectCount: result.score.incorrectCount,
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
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const [unavailableOrdinal, setUnavailableOrdinal] = useState<number | null>(null);
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
  const missedCount = result.feedbackItems.filter((item) => item.correctness !== "correct").length;
  const answeredOccurrences = new Set(result.answeredOccurrenceIds);
  const navigatorItems = Array.from({ length: result.totalOccurrences }, (_, index) => {
    const ordinal = index + 1;
    const answer = result.feedbackItems.find((item) => item.ordinal === ordinal);
    return { answered: answer ? answeredOccurrences.has(answer.occurrenceId) : false, id: answer?.occurrenceId ?? `unavailable-${ordinal}`, ordinal };
  });
  const currentOrdinal = current?.ordinal ?? unavailableOrdinal ?? 1;
  const contextLabel = filter === "missed"
    ? `${t("Question")} ${currentOrdinal} • ${currentIndex + 1} ${t("of")} ${answers.length}`
    : `${currentOrdinal} ${t("of")} ${result.totalOccurrences}`;
  const chooseOrdinal = (ordinal: number) => {
    const answerIndex = result.feedbackItems.findIndex((item) => item.ordinal === ordinal);
    setNavigatorVisible(false);
    if (answerIndex < 0) {
      setUnavailableOrdinal(ordinal);
      return;
    }
    setUnavailableOrdinal(null);
    setFilter("all");
    setSelectedIndex(answerIndex);
  };
  if (unavailableOrdinal !== null) {
    return (
      <ReviewShell
        contextLabel={`${t("Question")} ${unavailableOrdinal} • ${unavailableOrdinal} ${t("of")} ${result.totalOccurrences}`}
        filter={filter}
        missedCount={missedCount}
        totalOccurrences={result.totalOccurrences}
        onBack={() => navigation.goBack()}
        onFilterChange={(nextFilter) => { setUnavailableOrdinal(null); setFilter(nextFilter); setSelectedIndex(0); }}
        onNavigator={() => setNavigatorVisible(true)}
        onPrevious={() => setUnavailableOrdinal(Math.max(1, unavailableOrdinal - 1))}
        onNext={() => setUnavailableOrdinal(Math.min(result.totalOccurrences, unavailableOrdinal + 1))}
        previousDisabled={unavailableOrdinal === 1}
        nextDisabled={unavailableOrdinal === result.totalOccurrences}
        testID={runtimeSelectors.summary.root(sessionId)}
      >
        <View style={styles.unavailableContent}>
          <View style={styles.unavailableIcon}><Icon color={styles.unavailableIconGlyph.color} name="warning" size={24} /></View>
          <Text style={styles.unavailableTitle}>{t("Result unavailable")}</Text>
          <Text style={styles.unavailableDescription}>{t("This question was added after your session completed. No answer was recorded.")}</Text>
        </View>
        <ReviewNavigator
          currentOrdinal={unavailableOrdinal}
          items={navigatorItems}
          onClose={() => setNavigatorVisible(false)}
          onSelect={chooseOrdinal}
          visible={navigatorVisible}
        />
      </ReviewShell>
    );
  }
  return (
    <ReviewShell
      contextLabel={contextLabel}
      filter={filter}
      missedCount={missedCount}
      totalOccurrences={result.totalOccurrences}
      onBack={() => navigation.goBack()}
      onFilterChange={(nextFilter) => { setFilter(nextFilter); setSelectedIndex(0); }}
      onNavigator={() => setNavigatorVisible(true)}
      onPrevious={() => setSelectedIndex((index) => Math.max(0, index - 1))}
      onNext={() => setSelectedIndex((index) => Math.min(answers.length - 1, index + 1))}
      previousDisabled={!current || currentIndex === 0}
      nextDisabled={!current || currentIndex >= answers.length - 1}
      testID={runtimeSelectors.summary.root(sessionId)}
    >
      {current ? (
        <>
          <View style={styles.questionBlock}>
            <Text style={styles.questionEyebrow}>{t("Question").toUpperCase()}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.question}>{current.prompt}</Text>
          </View>
          {current.interaction.renderer.kind === "choice" ? (
            <View style={styles.options}>
              {current.interaction.renderer.options.map((option, index) => {
                const control = current.controls.find((candidate) => candidate.id === option.id);
                const state = control?.state ?? "neutral";
                return (
                  <AnswerOption
                    accessibilityLabel={option.text}
                    accessibilityRole={current.interaction.accessibility.controls[index]?.role === "checkbox" ? "checkbox" : "radio"}
                    accessibilityState={{ checked: state !== "neutral" }}
                    disabled
                    key={option.id}
                    letter={String.fromCharCode(65 + index)}
                    onPress={() => undefined}
                    state={state === "neutral" ? "default" : state}
                    text={option.text}
                  />
                );
              })}
            </View>
          ) : null}
          <ReviewFeedbackBlock item={current.item} feedback={{ details: current.details, reason: current.reason }} />
        </>
      ) : <EmptyState title={t("No answers in this view")} description={t("Switch filters to review the full simulation.")} />}
      <ReviewNavigator
        currentOrdinal={current?.ordinal ?? 1}
        items={navigatorItems}
        onClose={() => setNavigatorVisible(false)}
        onSelect={chooseOrdinal}
        visible={navigatorVisible}
      />
    </ReviewShell>
  );
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createReviewStyles = (palette: AppColors) => StyleSheet.create({
  pending: { alignItems: "center", justifyContent: "center", minHeight: 180 },
  pendingText: { ...typography.body, color: palette.textSecondary },
  questionBlock: { gap: spacing.xs },
  questionEyebrow: { color: palette.primary, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 15, opacity: 0.5 },
  question: { color: palette.textPrimary, fontSize: 18, fontWeight: "600", lineHeight: 27 },
  options: { gap: spacing.sm },
  unavailableContent: { alignItems: "center", backgroundColor: "rgba(14,22,40,0.6)", borderColor: "rgba(255,255,255,0.05)", borderRadius: 18, gap: spacing.lg, marginTop: 101, paddingHorizontal: spacing.xxxl, paddingVertical: 28 },
  unavailableIcon: { alignItems: "center", backgroundColor: "rgba(30,41,59,0.5)", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  unavailableIconGlyph: { color: palette.warning },
  unavailableTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: "600", lineHeight: 21, textAlign: "center" },
  unavailableDescription: { color: palette.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 289, textAlign: "center" },
});

function messageFor(error: unknown): string { return describeOperationalFailure(error, "The session result is not available because verification did not complete."); }
