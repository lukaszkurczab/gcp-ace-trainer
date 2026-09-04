import type { NavigationProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AnswerOption, EmptyState, ReviewLoadingSkeleton, ReviewNavigator, ReviewShell, ReviewUnavailableSurface, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { resolveSimulationResultResolution, type SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";
import { ReviewFeedbackBlock } from "../review/ReviewFeedbackBlock";
import { useSimulationResultRead } from "./simulationResultRead";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

export function AlgorithmsInterviewSimulationSummaryScreen({ navigation, route }: SummaryProps) {
  return <AlgorithmsInterviewSimulationResultSurface navigation={navigation} sessionId={route.params.sessionId} />;
}

export function AlgorithmsInterviewSimulationReviewScreen({ navigation, route }: ReviewProps) {
  return <AlgorithmsInterviewSimulationReviewSurface navigation={navigation} sessionId={route.params.sessionId} />;
}

function AlgorithmsInterviewSimulationResultSurface({ navigation, sessionId }: Readonly<{ navigation: NavigationProp<RootStackParamList>; sessionId: string }>) {
  const { retry, state } = useSimulationResultRead(sessionId);
  const result = state.kind === "ready" ? state.result : null;
  const failure = state.kind === "error" ? state.reason : null;
  const resolution = resolveSimulationResultResolution(result, failure);
  if (state.requestKey !== sessionId) return <SimulationResultLoadingSkeleton />;
  if (resolution === "pending") return <SimulationResultLoadingSkeleton />;

  const projection: SimulationSurfaceProjection = resolution === "verified" && result?.score
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
    : {
        state: "verification_failed",
        title: "Verified result unavailable",
        notice: { tone: "error", message: failure ?? "The session result is not available because verification did not complete." },
        actions: { primary: { id: "retry", label: "Try again", onPress: retry }, secondary: { id: "back-to-practice", label: "Back to practice", onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB), variant: "secondary" } },
      };
  return <SimulationSessionSurface projection={projection} />;
}

/** Keeps result anatomy visible while the verified summary read is in flight. */
export function SimulationResultLoadingSkeleton() {
  const styles = useThemedStyles(createResultLoadingStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();
  const message = t("Reading the verified session result.");

  return (
    <Screen edges={["top", "bottom"]} style={styles.screen}>
      <View
        accessibilityLabel={`${t("Loading session result")}. ${message}`}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.content}
        testID="simulation-result-loading-skeleton"
      >
        <Text accessible={false} maxFontSizeMultiplier={2} style={styles.message}>{message}</Text>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.shapes}>
          <View style={styles.context} testID="simulation-result-loading-context">
            <SkeletonShape motion={motion} style={[styles.line, styles.contextLine, { height: 16 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.contextLineShort, { height: 13 * textScale }]} />
          </View>
          <View style={styles.heading} testID="simulation-result-loading-heading">
            <SkeletonShape motion={motion} style={[styles.line, styles.headingLine, { height: 25 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.headingLineShort, { height: 16 * textScale }]} />
          </View>
          <View style={[styles.scoreCard, largeLayout ? styles.scoreCardLarge : null]} testID="simulation-result-loading-score">
            <SkeletonShape motion={motion} style={[styles.line, styles.scoreLine, { height: 32 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.scoreLineShort, { height: 15 * textScale }]} />
          </View>
          <View style={styles.outcomes} testID="simulation-result-loading-outcomes">
            {Array.from({ length: 3 }, (_, index) => <SkeletonShape key={index} motion={motion} style={[styles.line, styles.outcomeLine, { height: 18 * textScale }]} />)}
          </View>
          <View style={styles.metrics} testID="simulation-result-loading-metrics">
            {Array.from({ length: 2 }, (_, index) => <SkeletonShape key={index} motion={motion} style={[styles.line, styles.metricLine, { height: 18 * textScale }]} />)}
          </View>
          <View style={styles.actions} testID="simulation-result-loading-actions">
            <SkeletonShape motion={motion} style={[styles.line, styles.actionLine, { height: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.actionLine, { height: 48 * textScale }]} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function AlgorithmsInterviewSimulationReviewSurface({ navigation, sessionId }: Readonly<{ navigation: NavigationProp<RootStackParamList>; sessionId: string }>) {
  const styles = useThemedStyles(createReviewStyles);
  const { t } = useTranslation("common");
  const { state } = useSimulationResultRead(sessionId);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const [unavailableOrdinal, setUnavailableOrdinal] = useState<number | null>(null);
  useEffect(() => {
    setFilter("all");
    setSelectedIndex(0);
    setNavigatorVisible(false);
    setUnavailableOrdinal(null);
  }, [sessionId]);

  if (state.requestKey !== sessionId || state.kind === "pending") return <ReviewLoadingSkeleton onBack={() => navigation.goBack()} />;
  if (state.kind === "error") return <Screen><EmptyState title={t("Review unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  const result = state.result;
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
        contentVariant="unavailable"
        testID={runtimeSelectors.summary.root(sessionId)}
      >
        <View style={styles.unavailableContent}>
          <ReviewUnavailableSurface
            description={t("This question was added after your session completed. No answer was recorded.")}
            style={styles.unavailableSurface}
            title={t("Result unavailable")}
          />
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
            <Text maxFontSizeMultiplier={2} style={styles.questionEyebrow}>{t("Question").toUpperCase()}</Text>
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
          <ReviewFeedbackBlock item={current.item} feedback={{ details: current.details, reason: current.reason }} reportSurface={{ modeRoute: "answer_review", trackNode: null }} />
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

const createResultLoadingStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: 0, paddingBottom: 0 },
  content: { gap: spacing.lg, width: "100%" },
  message: { ...typography.body, color: palette.textSecondary, flexShrink: 1 },
  shapes: { gap: spacing.xl, width: "100%" },
  line: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1 },
  context: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  contextLine: { width: "54%" },
  contextLineShort: { width: "30%" },
  heading: { gap: spacing.sm },
  headingLine: { width: "68%" },
  headingLineShort: { width: "42%" },
  scoreCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  scoreCardLarge: { paddingVertical: spacing.xxl },
  scoreLine: { width: "38%" },
  scoreLineShort: { width: "24%" },
  outcomes: { gap: spacing.sm },
  outcomeLine: { width: "100%" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLine: { flex: 1, minWidth: 120 },
  actions: { gap: spacing.sm },
  actionLine: { width: "100%" },
});

const createReviewStyles = (palette: AppColors) => StyleSheet.create({
  questionBlock: { gap: spacing.xs },
  questionEyebrow: { color: palette.ambient.review, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 15, opacity: 0.5 },
  question: { color: palette.textPrimary, fontSize: 18, fontWeight: "600", lineHeight: 27 },
  options: { gap: spacing.sm },
  unavailableContent: { alignSelf: "stretch", flex: 1, position: "relative", width: "100%" },
  unavailableSurface: { alignItems: "center", backgroundColor: palette.effects.unavailableSurface, borderColor: palette.effects.subtleBorder, borderRadius: 18, borderWidth: 1, gap: spacing.lg, left: 20, paddingHorizontal: spacing.xxxl, paddingVertical: 28, position: "absolute", top: 185, width: 353 },
});
