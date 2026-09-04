import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { getTrainingLifecycleUseCases } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { EmptyState, Screen, SessionResultOverview, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import { getTrackDisplay } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, type AppColors } from "../../theme";
import { formatSessionTopic, normalizeSessionResultDetails } from "./sessionResultPresentation";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { getDesignModeTitle, isDesignInterviewModeId } from "../../tracks/design-interview";
import { getCertificationQuestionMaxPoints, type CertificationQuestion } from "../../tracks/certification";
type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.RESULT>;
type Summary = Readonly<{
  certificationMaxPoints: number | null;
  certificationTopicId: string | null;
  designTopicId: string | null;
  result: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>>;
  session: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSessionRecord"]>>;
}>;
type ResultReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; summary: Summary }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function ResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ResultReadState>({ kind: "pending", requestKey });
  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    const useCases = getTrainingLifecycleUseCases();
    void Promise.all([useCases.loadSummary(capturedRequestKey), useCases.loadSessionRecord(capturedRequestKey)])
      .then(async ([result, session]) => {
        const exact = isDesignInterviewModeId(session.modeId) || session.modeId.startsWith("certification-") || result.evidence.familyId === "certification"
          ? await contentPackageRuntimeOwner.resolveExact(session.packagePin)
          : null;
        if (!live) return;
        const designTopicId = isDesignInterviewModeId(session.modeId) && exact ? exact.profile.freeNodeId : null;
        const certificationTopicId = session.modeId === "certification-diagnostic-baseline" && exact ? exact.package.freeNodeId : null;
        const certificationMaxPoints = result.evidence.familyId === "certification" && exact
          ? session.itemOrder.reduce((sum, occurrence) => sum + getCertificationQuestionMaxPoints(exact.profile.getItemById(occurrence.item.itemId) as CertificationQuestion), 0)
          : null;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, summary: { result, session, designTopicId, certificationTopicId, certificationMaxPoints } });
      })
      .catch((cause) => { if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(cause, t("We couldn’t load the session result.")) }); });
    return () => { live = false; };
  }, [requestKey, t]);
  if (readState.requestKey !== requestKey || readState.kind === "pending") return <Screen><ExamResultLoadingSkeleton /></Screen>;
  if (readState.kind === "unavailable") return <Screen><EmptyState title={t("Session summary unavailable")} description={t(readState.reason)} /></Screen>;
  const summary = readState.summary;
  const { result, session } = summary;
  const design = isDesignInterviewModeId(session.modeId);
  const answeredCount = result.answeredOccurrenceIds.length;
  const actualCount = session.actualLength;
  const unansweredCount = result.unansweredOccurrenceIds.length;
  const coverageIsConsistent = result.totalOccurrences === actualCount && answeredCount + unansweredCount === actualCount;
  const normalizedDetails = coverageIsConsistent
    ? normalizeSessionResultDetails(result.evidence.details, answeredCount, summary.certificationMaxPoints ?? undefined)
    : { points: null, score: null };
  const domainPresentation = design
    ? formatSessionTopic(session.trackId, summary.designTopicId, t)
    : session.modeId === "certification-diagnostic-baseline"
    ? formatSessionTopic(session.trackId, summary.certificationTopicId, t)
    : session.modeId === "certification-focus-practice"
    ? formatSessionTopic(session.trackId, session.configurationSnapshot.domain, t)
    : formatDomains(session.configurationSnapshot.sectionPresentation);
  const modeLabel = design
    ? t(getDesignModeTitle(session.modeId))
    : session.modeId === "certification-diagnostic-baseline"
    ? t("Diagnostic Baseline")
    : t(formatMode(session.modeId));
  return (
    <Screen>
      <SessionResultOverview
        activeTime={formatElapsed(session.activeForegroundMs)}
        answeredCount={answeredCount}
        backTestID={runtimeSelectors.summary.backToPractice(route.params.sessionId)}
        completion="completed"
        context={{ modeLabel, topicLabel: domainPresentation, trackLabel: t(getTrackDisplay(session.trackId).title) }}
        onBack={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        points={normalizedDetails.points ?? undefined}
        requestedCount={session.requestedLength}
        review={{ onPress: () => navigation.navigate(ROUTES.EXAM_REVIEW, { sessionId: route.params.sessionId }), testID: runtimeSelectors.summary.reviewAnswers(route.params.sessionId) }}
        rootTestID={runtimeSelectors.summary.root(route.params.sessionId)}
        score={normalizedDetails.score}
        totalOccurrences={actualCount}
        unansweredCount={unansweredCount}
      />
    </Screen>
  );
}

export function ExamResultLoadingSkeleton() {
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
      style={styles.examResultLoading}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.examResultLoadingShapes}>
        <View style={styles.examResultLoadingContext}>
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingContextPrimary, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingContextSecondary, { height: 12 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingContextTertiary, { height: 12 * textScale }]} />
        </View>
        <View style={styles.examResultLoadingHeading}>
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingHeadingLine, { height: 24 * textScale }]} />
        </View>
        <View style={styles.examResultLoadingScoreCard}>
          <View style={styles.examResultLoadingScoreValue}>
            <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingScore, { height: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingTotal, { height: 24 * textScale }]} />
          </View>
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingScoreLabel, { height: 16 * textScale }]} />
        </View>
        <View style={styles.examResultLoadingOutcomeSection}>
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingSectionLabel, { height: 12 * textScale }]} />
          <View style={[styles.examResultLoadingOutcomeGrid, largeLayout ? styles.examResultLoadingOutcomeGridLarge : null]}>
            {[0, 1, 2, 3].map((outcome) => (
              <View key={outcome} style={[styles.examResultLoadingOutcome, largeLayout ? styles.examResultLoadingOutcomeLarge : null, { minHeight: 50 * textScale }]}>
                <SkeletonShape motion={motion} style={styles.examResultLoadingDot} />
                <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingOutcomeLabel, { height: 14 * textScale }]} />
                <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingOutcomeValue, { height: 16 * textScale }]} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.examResultLoadingMetrics}>
          {[0, 1].map((metric) => (
            <View key={metric} style={styles.examResultLoadingMetric}>
              <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingMetricLabel, { height: 16 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingMetricValue, { height: 16 * textScale }]} />
            </View>
          ))}
        </View>
        <View style={styles.examResultLoadingReview}>
          <SkeletonShape motion={motion} style={[styles.examResultLoadingLine, styles.examResultLoadingReviewHint, { height: 16 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.examResultLoadingAction, { minHeight: 48 * textScale }]} />
        </View>
        <SkeletonShape motion={motion} style={[styles.examResultLoadingAction, { minHeight: 48 * textScale }]} />
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  examResultLoading: { gap: spacing.xxl, width: "100%" },
  examResultLoadingShapes: { gap: spacing.xxl, width: "100%" },
  examResultLoadingLine: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill },
  examResultLoadingContext: { gap: spacing.xs },
  examResultLoadingContextPrimary: { width: "44%" },
  examResultLoadingContextSecondary: { width: "59%" },
  examResultLoadingContextTertiary: { width: "68%" },
  examResultLoadingHeading: { gap: spacing.sm },
  examResultLoadingHeadingLine: { width: "63%" },
  examResultLoadingScoreCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xxl, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  examResultLoadingScoreValue: { alignItems: "baseline", flexDirection: "row", gap: spacing.sm },
  examResultLoadingScore: { width: "23%" },
  examResultLoadingTotal: { width: "18%" },
  examResultLoadingScoreLabel: { width: "43%" },
  examResultLoadingOutcomeSection: { gap: spacing.md },
  examResultLoadingSectionLabel: { width: "52%" },
  examResultLoadingOutcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  examResultLoadingOutcomeGridLarge: { flexDirection: "column" },
  examResultLoadingOutcome: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexBasis: "45%", flexDirection: "row", flexGrow: 1, gap: spacing.sm, minWidth: 140, padding: spacing.md },
  examResultLoadingOutcomeLarge: { flexBasis: "auto", width: "100%" },
  examResultLoadingDot: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.xs, height: 8, width: 8 },
  examResultLoadingOutcomeLabel: { flex: 1, minWidth: 0 },
  examResultLoadingOutcomeValue: { width: "16%" },
  examResultLoadingMetrics: { gap: spacing.xs },
  examResultLoadingMetric: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", minHeight: 44 },
  examResultLoadingMetricLabel: { width: "32%" },
  examResultLoadingMetricValue: { width: "24%" },
  examResultLoadingReview: { gap: spacing.md },
  examResultLoadingReviewHint: { width: "88%" },
  examResultLoadingAction: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.button, width: "100%" },
});

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatMode(modeId: string): string {
  return modeId.replace(/^certification-/, "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDomains(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string")) return "Not recorded";
  return value.map((entry) => entry.replaceAll("_", " ")).join(", ");
}
