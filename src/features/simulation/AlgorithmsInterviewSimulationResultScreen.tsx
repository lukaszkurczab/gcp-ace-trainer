import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { getAlgorithmsPracticeResultProjection, type AlgorithmsSessionResultProjection } from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { AnswerOption, Button, EmptyState, Icon, IconButton, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { useReducedMotion } from "./navigator/SimulationQuestionNavigator";

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
  const { fontScale } = useWindowDimensions();
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
  const navigatorColumns = fontScale >= 1.8 ? 3 : fontScale >= 1.3 ? 4 : 6;
  const answeredOccurrences = new Set(result.answeredOccurrenceIds);
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
        styles={styles}
        testID={runtimeSelectors.summary.root(sessionId)}
        t={t}
      >
        <View style={styles.unavailableContent}>
          <View style={styles.unavailableIcon}><Icon color={styles.unavailableIconGlyph.color} name="warning" size={24} /></View>
          <Text style={styles.unavailableTitle}>{t("Result unavailable")}</Text>
          <Text style={styles.unavailableDescription}>{t("This question was added after your session completed. No answer was recorded.")}</Text>
        </View>
        <ReviewNavigator
          answeredOccurrences={answeredOccurrences}
          columns={navigatorColumns}
          currentOrdinal={unavailableOrdinal}
          onClose={() => setNavigatorVisible(false)}
          onSelect={chooseOrdinal}
          result={result}
          t={t}
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
      styles={styles}
      testID={runtimeSelectors.summary.root(sessionId)}
      t={t}
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
          <PracticeFeedbackBlock item={current.item} itemId={current.occurrenceId} feedback={{ details: current.details, reason: current.reason, result: current.correctness }} />
        </>
      ) : <EmptyState title={t("No answers in this view")} description={t("Switch filters to review the full simulation.")} />}
      <ReviewNavigator
        answeredOccurrences={answeredOccurrences}
        columns={navigatorColumns}
        currentOrdinal={current?.ordinal ?? 1}
        onClose={() => setNavigatorVisible(false)}
        onSelect={chooseOrdinal}
        result={result}
        t={t}
        visible={navigatorVisible}
      />
    </ReviewShell>
  );
}

type ReviewShellProps = Readonly<{
  children: ReactNode;
  contextLabel: string;
  filter: "all" | "missed";
  missedCount: number;
  nextDisabled: boolean;
  onBack: () => void;
  onFilterChange: (filter: "all" | "missed") => void;
  onNext: () => void;
  onNavigator: () => void;
  onPrevious: () => void;
  previousDisabled: boolean;
  styles: ReturnType<typeof createReviewStyles>;
  testID: string;
  totalOccurrences: number;
  t: (value: string) => string;
}>;

function ReviewShell({ children, contextLabel, filter, missedCount, nextDisabled, onBack, onFilterChange, onNext, onNavigator, onPrevious, previousDisabled, styles, testID, totalOccurrences, t }: ReviewShellProps) {
  return (
    <Screen edges={["top", "bottom"]} style={styles.screen} footer={(
      <View style={styles.footer}>
        <Button disabled={previousDisabled} onPress={onPrevious} variant="secondary">{t("Previous")}</Button>
        <Button disabled={nextDisabled} onPress={onNext}>{t("Next")}</Button>
      </View>
    )}>
      <View style={styles.headerBar} testID={testID}>
        <IconButton accessibilityLabel={t("Back to summary")} icon="chevron-left" onPress={onBack} />
        <Text maxFontSizeMultiplier={2} style={styles.headerTitle}>{t("Answer review")}</Text>
      </View>
      <View style={styles.contextRow}>
        <Text maxFontSizeMultiplier={2} style={styles.contextText}>{contextLabel}</Text>
        <Pressable accessibilityLabel={t("Open answer navigator")} accessibilityRole="button" onPress={onNavigator} style={styles.navigatorAction}>
          <Icon color={styles.navigatorLabel.color} name="grid" size={16} />
          <Text maxFontSizeMultiplier={2} style={styles.navigatorLabel}>{t("Navigator")}</Text>
        </Pressable>
      </View>
      <View accessibilityRole="tablist" style={styles.filterShell}>
        <FilterTab active={filter === "all"} label={`${t("All")} ${totalOccurrences}`} onPress={() => onFilterChange("all")} styles={styles} />
        <FilterTab active={filter === "missed"} label={`${t("Missed")} ${missedCount}`} onPress={() => onFilterChange("missed")} styles={styles} />
      </View>
      <View style={styles.scrollableContent}>{children}</View>
    </Screen>
  );
}

function FilterTab({ active, label, onPress, styles }: Readonly<{ active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createReviewStyles> }>) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterTab, active ? styles.filterTabActive : null]}><Text maxFontSizeMultiplier={2} style={[styles.filterTabLabel, active ? styles.filterTabLabelActive : null]}>{label}</Text></Pressable>;
}

function ReviewNavigator({ answeredOccurrences, columns, currentOrdinal, onClose, onSelect, result, t, visible }: Readonly<{ answeredOccurrences: ReadonlySet<string>; columns: number; currentOrdinal: number; onClose: () => void; onSelect: (ordinal: number) => void; result: AlgorithmsSessionResultProjection; t: (value: string) => string; visible: boolean }>) {
  const styles = useThemedStyles(createReviewStyles);
  const reduceMotion = useReducedMotion();
  return (
    <Modal animationType={reduceMotion ? "none" : "slide"} onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.navigatorBackdrop}>
        <Pressable accessibilityLabel={t("Close answer navigator")} accessibilityRole="button" onPress={onClose} style={styles.navigatorDismissArea} />
        <View accessibilityViewIsModal style={styles.navigatorSheet}>
          <View style={styles.navigatorHandle} />
          <View style={styles.navigatorHeader}>
            <Text maxFontSizeMultiplier={2} style={styles.navigatorTitle}>{t("Answer navigator")}</Text>
            <Pressable accessibilityLabel={t("Close answer navigator")} accessibilityRole="button" onPress={onClose} style={styles.navigatorClose}><Icon color={styles.navigatorCloseIcon.color} name="close" size={20} /></Pressable>
          </View>
          <View style={styles.navigatorSummary}><Text maxFontSizeMultiplier={2} style={styles.navigatorSummaryText}>{`${answeredOccurrences.size} ${t("answered")}`}</Text></View>
          <ScrollView contentContainerStyle={styles.navigatorGrid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: result.totalOccurrences }, (_, index) => {
              const ordinal = index + 1;
              const answer = result.feedbackItems.find((item) => item.ordinal === ordinal);
              const answered = answer ? answeredOccurrences.has(answer.occurrenceId) : false;
              const selected = ordinal === currentOrdinal;
              return <Pressable accessibilityLabel={`${t("Question")} ${ordinal}${answered ? `, ${t("answered")}` : `, ${t("unanswered")}`}`} accessibilityRole="button" accessibilityState={{ selected }} key={ordinal} onPress={() => onSelect(ordinal)} style={[styles.navigatorCell, { width: columns === 6 ? 48 : 64 }, answered ? styles.navigatorAnsweredCell : null, selected ? styles.navigatorCurrentCell : null]}><Text style={[styles.navigatorCellText, selected || answered ? styles.navigatorCellTextActive : null]}>{ordinal}</Text></Pressable>;
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createReviewStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: 0, paddingBottom: 0, paddingHorizontal: 0, paddingTop: 0 },
  pending: { alignItems: "center", justifyContent: "center", minHeight: 180 },
  pendingText: { ...typography.body, color: palette.textSecondary },
  headerBar: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  headerTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: "600", lineHeight: 18 },
  contextRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 64, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  contextText: { color: palette.textSecondary, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  navigatorAction: { alignItems: "center", flexDirection: "row", gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.xs },
  navigatorLabel: { color: palette.primary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  filterShell: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", minHeight: 44, marginHorizontal: spacing.xl, padding: 4 },
  filterTab: { alignItems: "center", borderRadius: 10, flex: 1, justifyContent: "center", minHeight: 34, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  filterTabActive: { backgroundColor: palette.primary, borderColor: palette.primary, borderWidth: 1 },
  filterTabLabel: { color: palette.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  filterTabLabelActive: { color: palette.onPrimary },
  scrollableContent: { flex: 1, gap: spacing.xl, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl, paddingLeft: spacing.xxl, paddingTop: spacing.xxl },
  questionBlock: { gap: spacing.xs },
  questionEyebrow: { color: palette.primary, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 15, opacity: 0.5 },
  question: { color: palette.textPrimary, fontSize: 18, fontWeight: "600", lineHeight: 27 },
  options: { gap: spacing.sm },
  footer: { borderTopWidth: 0, gap: spacing.sm, paddingBottom: 32, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  unavailableContent: { alignItems: "center", backgroundColor: "rgba(14,22,40,0.6)", borderColor: "rgba(255,255,255,0.05)", borderRadius: 18, gap: spacing.lg, marginTop: 101, paddingHorizontal: spacing.xxxl, paddingVertical: 28 },
  unavailableIcon: { alignItems: "center", backgroundColor: "rgba(30,41,59,0.5)", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  unavailableIconGlyph: { color: palette.warning },
  unavailableTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: "600", lineHeight: 21, textAlign: "center" },
  unavailableDescription: { color: palette.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 289, textAlign: "center" },
  navigatorBackdrop: { backgroundColor: "rgba(2,6,23,0.56)", flex: 1, justifyContent: "flex-end" },
  navigatorDismissArea: { ...StyleSheet.absoluteFill },
  navigatorSheet: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, gap: spacing.sm, maxHeight: "86%", paddingBottom: spacing.lg },
  navigatorHandle: { alignSelf: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, height: 4, marginVertical: 10, width: 36 },
  navigatorHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xl },
  navigatorTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  navigatorClose: { alignItems: "center", borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  navigatorCloseIcon: { color: palette.textPrimary },
  navigatorSummary: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
  navigatorSummaryText: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  navigatorGrid: { alignContent: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: 9, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  navigatorCell: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, height: 48, justifyContent: "center" },
  navigatorAnsweredCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  navigatorCurrentCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  navigatorCellText: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  navigatorCellTextActive: { color: palette.onPrimary },
});

function messageFor(error: unknown): string { return describeOperationalFailure(error, "The session result is not available because verification did not complete."); }
