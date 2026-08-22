import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  getAlgorithmsPracticeSummaryProjection,
  type AlgorithmsSessionResultProjection,
} from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, Icon, LoadingState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { PracticeFeedbackBlock } from "./PracticeFeedbackBlock";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY>;
type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; result: AlgorithmsSessionResultProjection }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

/** Renders only the immutable completed-session result addressed by the route. */
export function AlgorithmsPracticeSummaryScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [showReview, setShowReview] = useState(false);
  const sessionId = route.params.sessionId;
  const load = useCallback(async () => {
    try {
      setState({ kind: "ready", result: await getAlgorithmsPracticeSummaryProjection(sessionId) });
    } catch (error) {
      setState({ kind: "unavailable", reason: describeOperationalFailure(error, "The completed session result is unavailable.") });
    }
  }, [sessionId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (state.kind === "loading") {
    return <Screen><LoadingState title={t("Loading session result")} description={t("Reading the verified completed-session result.")} /></Screen>;
  }
  if (state.kind === "unavailable") {
    return <Screen><EmptyState title={t("Session result unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }

  const { result } = state;
  const missedCount = result.score ? result.score.partialCount + result.score.incorrectCount : null;
  const activeTime = formatElapsed(result.elapsedForegroundMs);
  const resultStateLabel = result.completionKind === "completed" ? "Session complete" : "Session ended early";
  const resultTitle = result.completionKind === "completed" ? "Session complete" : "Partial summary";
  return (
    <Screen edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.summaryShell}>
        <View accessibilityLabel={t(resultStateLabel)} style={styles.summaryHeaderBar}>
          <Text style={styles.eyebrow}>{t("Learn approach")}</Text>
          <Text style={styles.summaryMode}>{t("Coding Interview")}</Text>
        </View>
        <View style={styles.summaryContent}>
          <View style={styles.summaryHeader}>
            <Text style={styles.resultTitle} testID={runtimeSelectors.summary.root(result.sessionId)}>{t(resultTitle)}</Text>
            <Text style={styles.resultDescription}>{t(result.completionKind === "completed" ? "You completed this focused practice session." : "This session ended before every item was completed.")}</Text>
          </View>
          <View style={styles.statsCard}>
            <SummaryStat label={t("Completed items")} value={`${result.answeredOccurrenceIds.length} ${t("of")} ${result.totalOccurrences}`} />
            <SummaryStat label={t("Active time")} value={activeTime} />
            <Text style={styles.configuration} testID={runtimeSelectors.summary.configuration(result.sessionId, result.configuration.actualLength, result.configuration.feedbackTiming)}>{result.configuration.actualLength} {t("items")} · {t(result.configuration.feedbackTiming === "atSessionEnd" ? "Feedback at session end" : "Feedback after each answer")}</Text>
          </View>
          <View style={styles.outcomeSection}>
            <Text style={styles.sectionTitle}>{t("Results")}</Text>
            {result.score ? (
              <View style={styles.outcomeRow}>
                <OutcomeStat label={t("Correct")} value={result.score.correctCount} tone="success" />
                <OutcomeStat label={t("Partial")} value={result.score.partialCount} tone="warning" />
                <OutcomeStat label={t("Incorrect")} value={result.score.incorrectCount} tone="danger" />
              </View>
            ) : (
              <Text style={styles.resultText}>{result.completionKind === "abandoned" ? t("Score is shown only after a completed session.") : t("Verified result details are unavailable.")}</Text>
            )}
            {result.score ? <Text style={styles.scoreLine}>{result.score.correctCount} {t("correct")} · {missedCount} {t("Missed")} · {result.score.pointsEarned} / {result.score.maxPoints} {t("points")}</Text> : null}
          </View>
          {result.feedbackItems.length > 0 ? <View style={styles.reviewBanner}><Icon color={styles.reviewBannerText.color} name="clock-check" size={16} /><View style={styles.reviewBannerCopy}><Text style={styles.reviewBannerTitle}>{t("Answer review available")}</Text><Text style={styles.reviewBannerText}>{t("Review the saved explanations before leaving this session.")}</Text></View></View> : null}
          {showReview && result.feedbackItems.length > 0 ? (
            <View style={styles.feedbackItems}>
              <Text style={styles.feedbackTitle}>{t("Answer review")}</Text>
              {result.feedbackItems.map((item) => (
                <View key={item.occurrenceId} style={styles.feedbackItem} testID={runtimeSelectors.summary.feedbackItem(result.sessionId, item.occurrenceId)}>
                  <Text style={styles.feedbackPrompt}>{item.ordinal}. {item.prompt}</Text>
                  <PracticeFeedbackBlock item={item.item} itemId={item.occurrenceId} feedback={{ details: item.details, reason: item.reason, result: item.correctness }} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.summaryFooter}>
          {result.feedbackItems.length > 0 ? (
            <Button onPress={() => setShowReview((current) => !current)} testID={runtimeSelectors.summary.reviewAnswers(result.sessionId)} variant="primary">
              {t(showReview ? "Hide answer review" : "Review answers")}
            </Button>
          ) : null}
          <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} testID={runtimeSelectors.summary.backToPractice(result.sessionId)} variant="secondary">{t("Back to practice")}</Button>
        </View>
      </View>
    </Screen>
  );
}

function SummaryStat({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryStat}><Text style={styles.summaryStatLabel}>{label}</Text><Text style={styles.summaryStatValue}>{value}</Text></View>;
}

function OutcomeStat({ label, tone, value }: Readonly<{ label: string; tone: "danger" | "success" | "warning"; value: number }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.outcomeStat}><View style={[styles.outcomeDot, styles[`${tone}Dot`]]} /><Text style={styles.outcomeLabel}>{label}</Text><Text style={styles.outcomeValue}>{value}</Text></View>;
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { paddingBottom: 0, paddingHorizontal: 0, paddingTop: 0 },
  summaryShell: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xxl, borderWidth: 1, overflow: "hidden" },
  summaryHeaderBar: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: spacing.xl, paddingVertical: 18 },
  summaryHeader: { gap: spacing.sm },
  summaryMode: { ...typography.bodyStrong, color: palette.textSecondary },
  eyebrow: { ...typography.bodyStrong, color: palette.textPrimary, textTransform: "uppercase" },
  summaryContent: { gap: 28, padding: spacing.xxl },
  resultDescription: { ...typography.body, color: palette.textSecondary },
  statsCard: { gap: spacing.sm },
  summaryStat: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingBottom: spacing.md },
  summaryStatLabel: { ...typography.small, color: palette.textSecondary },
  summaryStatValue: { ...typography.bodyStrong, color: palette.textPrimary },
  configuration: { ...typography.caption, color: palette.textMuted },
  outcomeSection: { gap: spacing.md },
  sectionTitle: { color: palette.textSecondary, fontSize: 13, fontWeight: "700", lineHeight: 16 },
  outcomeRow: { gap: spacing.sm },
  outcomeStat: { alignItems: "center", backgroundColor: palette.surface, borderRadius: 10, flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  outcomeDot: { borderRadius: 4, height: 8, width: 8 },
  successDot: { backgroundColor: palette.success },
  warningDot: { backgroundColor: palette.warning },
  dangerDot: { backgroundColor: palette.danger },
  outcomeLabel: { ...typography.body, color: palette.textPrimary, flex: 1 },
  outcomeValue: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  scoreLine: { ...typography.small, color: palette.textSecondary },
  reviewBanner: { alignItems: "flex-start", backgroundColor: palette.success, borderColor: palette.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: 14 },
  reviewBannerCopy: { flex: 1, gap: spacing.xxs },
  reviewBannerTitle: { ...typography.bodyStrong, color: palette.onPrimary },
  reviewBannerText: { ...typography.small, color: palette.onPrimary },
  summaryFooter: { gap: spacing.sm, padding: spacing.xl },
  feedbackItem: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md, paddingTop: spacing.lg },
  feedbackItems: { gap: spacing.lg },
  feedbackPrompt: { ...typography.bodyStrong, color: palette.textPrimary },
  feedbackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  resultText: { ...typography.body, color: palette.textSecondary },
  resultTitle: { color: palette.textPrimary, fontSize: 32, fontWeight: "400", letterSpacing: -1, lineHeight: 39 },
});
