import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle } from "react-native";

import {
  getAlgorithmsPracticeSummaryProjection,
  type AlgorithmsSessionResultProjection,
} from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { EmptyState, Icon, Screen, SessionResultOverview, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { getAlgorithmMode } from "../../tracks/coding-interview/domain";
import { normalizeSessionResultDetails } from "../exam/sessionResultPresentation";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY>;
type SummaryReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; result: AlgorithmsSessionResultProjection }>
  | Readonly<{ kind: "unavailable"; reason: string; requestKey: string }>;

/** Renders only the immutable completed-session result addressed by the route. */
export function AlgorithmsPracticeSummaryScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<SummaryReadState>({ kind: "pending", requestKey });
  const [showReview, setShowReview] = useState(false);
  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    setShowReview(false);

    async function loadData() {
      try {
        const result = await getAlgorithmsPracticeSummaryProjection(capturedRequestKey);
        if (live) setReadState({ kind: "ready", requestKey: capturedRequestKey, result });
      } catch (error) {
        if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(error, t("We couldn’t load the session result.")) });
      }
    }

    void loadData();
    return () => { live = false; };
  }, [requestKey, t]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    return <Screen><PracticeResultLoadingSkeleton /></Screen>;
  }
  if (readState.kind === "unavailable") {
    return <Screen><EmptyState title={t("Session result unavailable")} description={t(readState.reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }

  const { result } = readState;
  const answeredCount = result.answeredOccurrenceIds.length;
  const totalOccurrences = result.configuration.actualLength;
  const unansweredCount = result.unansweredOccurrenceIds.length;
  const coverageIsConsistent = result.totalOccurrences === totalOccurrences && answeredCount + unansweredCount === totalOccurrences;
  const normalizedDetails = coverageIsConsistent ? normalizeSessionResultDetails(result.score, answeredCount) : { points: null, score: null };
  const feedbackAvailable = result.feedbackItems.length > 0;
  const configurationNote = result.completionKind === "abandoned"
    ? `${result.configuration.actualLength} ${t("items")} · ${t(result.configuration.feedbackTiming === "atSessionEnd" ? "Feedback at session end" : "Feedback after each answer")}`
    : undefined;
  const reviewContent = feedbackAvailable ? (
    <View style={styles.feedbackItems}>
      <ResultText selectable style={styles.feedbackTitle}>{t("Answer review")}</ResultText>
      {result.feedbackItems.map((item) => (
        <Pressable
          accessibilityRole="button"
          key={item.occurrenceId}
          onPress={() => navigation.navigate(ROUTES.ALGORITHMS_PRACTICE_REVIEW, { sessionId: result.sessionId, occurrenceId: item.occurrenceId })}
          style={({ pressed }) => [styles.feedbackItem, pressed ? styles.pressed : null]}
          testID={runtimeSelectors.summary.feedbackItem(result.sessionId, item.occurrenceId)}
        >
          <View style={styles.rowCopy}>
            <ResultText style={styles.feedbackPrompt}>{item.ordinal}. {item.prompt}</ResultText>
            <ResultText style={[styles.resultLabel, styles[item.correctness]]}>{t(item.correctness === "correct" ? "Correct" : item.correctness === "partial" ? "Partial" : "Incorrect")}</ResultText>
          </View>
          <Icon color={styles.feedbackPrompt.color} name="chevron-right" size={20} />
        </Pressable>
      ))}
    </View>
  ) : undefined;

  return (
    <Screen edges={["top", "bottom"]}>
      <SessionResultOverview
        activeTime={formatElapsed(result.elapsedForegroundMs)}
        answeredCount={answeredCount}
        backTestID={runtimeSelectors.summary.backToPractice(result.sessionId)}
        completion={result.completionKind === "completed" ? "completed" : "endedEarly"}
        configurationTestID={runtimeSelectors.summary.configuration(result.sessionId, result.configuration.actualLength, result.configuration.feedbackTiming)}
        context={{ modeLabel: t(getAlgorithmMode(result.modeId).title), trackLabel: t("Coding Interview") }}
        onBack={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        points={normalizedDetails.points ?? undefined}
        requestedCount={result.configuration.requestedLength}
        review={feedbackAvailable ? { content: reviewContent, expanded: showReview, onPress: () => setShowReview((current) => !current), testID: runtimeSelectors.summary.reviewAnswers(result.sessionId) } : undefined}
        rootTestID={runtimeSelectors.summary.root(result.sessionId)}
        score={normalizedDetails.score}
        secondaryNote={configurationNote ? { text: configurationNote } : undefined}
        totalOccurrences={totalOccurrences}
        unansweredCount={unansweredCount}
      />
    </Screen>
  );
}

export function PracticeResultLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading session result")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.practiceResultLoading}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.practiceResultLoadingShapes}>
        <View style={styles.practiceResultLoadingContext}>
          <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingContextPrimary, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingContextSecondary, { height: 12 * textScale }]} />
        </View>
        <View style={styles.practiceResultLoadingHeading}>
          <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingHeadingLine, { height: 24 * textScale }]} />
        </View>
        <View style={styles.practiceResultLoadingScoreCard}>
          <View style={styles.practiceResultLoadingScoreValue}>
            <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingScore, { height: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingTotal, { height: 24 * textScale }]} />
          </View>
          <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingScoreLabel, { height: 16 * textScale }]} />
        </View>
        <View style={styles.practiceResultLoadingOutcomeSection}>
          <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingSectionLabel, { height: 12 * textScale }]} />
          <View style={[styles.practiceResultLoadingOutcomeGrid, largeLayout ? styles.practiceResultLoadingOutcomeGridLarge : null]}>
            {[0, 1, 2, 3].map((outcome) => (
              <View key={outcome} style={[styles.practiceResultLoadingOutcome, largeLayout ? styles.practiceResultLoadingOutcomeLarge : null, { minHeight: 50 * textScale }]}>
                <SkeletonShape motion={motion} style={styles.practiceResultLoadingDot} />
                <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingOutcomeLabel, { height: 14 * textScale }]} />
                <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingOutcomeValue, { height: 16 * textScale }]} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.practiceResultLoadingMetrics}>
          {[0, 1].map((metric) => (
            <View key={metric} style={styles.practiceResultLoadingMetric}>
              <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingMetricLabel, { height: 16 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.practiceResultLoadingLine, styles.practiceResultLoadingMetricValue, { height: 16 * textScale }]} />
            </View>
          ))}
        </View>
        <SkeletonShape motion={motion} style={[styles.practiceResultLoadingAction, { minHeight: 48 * textScale }]} />
      </View>
    </View>
  );
}

function ResultText({ children, selectable = false, style }: Readonly<{ children: ReactNode; selectable?: boolean; style?: StyleProp<TextStyle> }>) {
  const { fontScale } = useWindowDimensions();
  return <Text key={fontScale} maxFontSizeMultiplier={2} selectable={selectable} style={style}>{children}</Text>;
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  practiceResultLoading: { gap: spacing.xxl, width: "100%" },
  practiceResultLoadingShapes: { gap: spacing.xxl, width: "100%" },
  practiceResultLoadingLine: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill },
  practiceResultLoadingContext: { gap: spacing.xs },
  practiceResultLoadingContextPrimary: { width: "44%" },
  practiceResultLoadingContextSecondary: { width: "59%" },
  practiceResultLoadingHeading: { gap: spacing.sm },
  practiceResultLoadingHeadingLine: { width: "63%" },
  practiceResultLoadingScoreCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xxl, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  practiceResultLoadingScoreValue: { alignItems: "baseline", flexDirection: "row", gap: spacing.sm },
  practiceResultLoadingScore: { width: "23%" },
  practiceResultLoadingTotal: { width: "18%" },
  practiceResultLoadingScoreLabel: { width: "43%" },
  practiceResultLoadingOutcomeSection: { gap: spacing.md },
  practiceResultLoadingSectionLabel: { width: "52%" },
  practiceResultLoadingOutcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  practiceResultLoadingOutcomeGridLarge: { flexDirection: "column" },
  practiceResultLoadingOutcome: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexBasis: "45%", flexDirection: "row", flexGrow: 1, gap: spacing.sm, minWidth: 140, padding: spacing.md },
  practiceResultLoadingOutcomeLarge: { flexBasis: "auto", width: "100%" },
  practiceResultLoadingDot: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.xs, height: 8, width: 8 },
  practiceResultLoadingOutcomeLabel: { flex: 1, minWidth: 0 },
  practiceResultLoadingOutcomeValue: { width: "16%" },
  practiceResultLoadingMetrics: { gap: spacing.xs },
  practiceResultLoadingMetric: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", minHeight: 44 },
  practiceResultLoadingMetricLabel: { width: "32%" },
  practiceResultLoadingMetricValue: { width: "24%" },
  practiceResultLoadingAction: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.button, width: "100%" },
  feedbackItem: { alignItems: "center", borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.md, minHeight: 64, paddingVertical: spacing.lg },
  rowCopy: { flex: 1, gap: spacing.sm },
  pressed: { opacity: 0.7 },
  resultLabel: { ...typography.small, fontWeight: "600" },
  correct: { color: palette.success },
  partial: { color: palette.warning },
  incorrect: { color: palette.danger },
  feedbackItems: { gap: spacing.xs },
  feedbackPrompt: { ...typography.bodyStrong, color: palette.textPrimary },
  feedbackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
});
