import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { getTrainingLifecycleUseCases, simulationHasReviewConflict } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, Card, EmptyState, Screen, SessionResultOverview, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import { getTrackDisplay } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, type AppColors } from "../../theme";
import { formatSessionTopic, normalizeSessionResultDetails } from "./sessionResultPresentation";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { getDesignModeTitle, isDesignInterviewModeId } from "../../tracks/design-interview";
import { isCertificationPracticeModeId } from "../../tracks/certification";
import { scoreCanonicalQuestion } from "../../content/canonical";
import { getCertificationExamReviewProjection, getCertificationPracticeReviewProjection } from "../../application/certification";
import { ReviewCycleConflictNotice } from "../practice/ReviewCycleConflictNotice";
import { ProfileReadFenceChangedError } from "../../application/profileReadFence";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import type { CertificationPracticeReviewProjection } from "../../application/certification/certificationPracticeReviewProjection";
type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.RESULT>;
export type Summary = Readonly<{
  certificationMaxPoints: number | null;
  certificationExam: CertificationExamReviewProjection | null;
  reviewConflict?: true;
  certificationPracticeOverallPoints?: number | null;
  certificationPracticeReview?: CertificationPracticeReviewProjection | null;
  certificationTopicId: string | null;
  designTopicId: string | null;
  result: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>>;
  session: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSessionRecord"]>>;
}>;
type ResultReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; summary: Summary }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function ResultScreen({ navigation, route, readSummary, fixtureNotice, onFixtureExit }: Props & Readonly<{ readSummary?: (sessionId: string) => Promise<Summary>; fixtureNotice?: ReactNode; onFixtureExit?: () => void }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ResultReadState>({ kind: "pending", requestKey });
  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    void (async () => {
      if (readSummary) return readSummary(capturedRequestKey);
      const useCases = getTrainingLifecycleUseCases();
      const [result, session] = await Promise.all([useCases.loadSummary(capturedRequestKey), useCases.loadSessionRecord(capturedRequestKey)]);
      if (session.modeId === "design-interview-simulation") {
        navigation.replace(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: session.id });
        return null;
      }
      const certificationExam = session.modeId === "certification-exam-simulation"
        ? await getCertificationExamReviewProjection(capturedRequestKey)
        : null;
      const simulationOperation = certificationExam ? await useCases.getSimulationOperationState(session) : null;
      const reviewConflict = simulationOperation ? simulationHasReviewConflict(simulationOperation) : false;
      let certificationPracticeOverallPoints: number | null = null;
      let certificationPracticeReview: CertificationPracticeReviewProjection | null = null;
      if (!certificationExam && isCertificationPracticeModeId(session.modeId)) {
        try {
          const practiceReview = await getCertificationPracticeReviewProjection(capturedRequestKey);
          certificationPracticeReview = practiceReview;
          certificationPracticeOverallPoints = practiceReview.overallPointsEarned;
        } catch (cause) {
          if (cause instanceof ProfileReadFenceChangedError) throw cause;
          // The practice count summary remains available when this optional exact-points projection is unavailable.
        }
      }
      const exact = !certificationExam && (isDesignInterviewModeId(session.modeId) || session.modeId.startsWith("certification-") || result.evidence.familyId === "certification")
        ? await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 })
        : null;
      if (!live) return null;
      const designTopicId = isDesignInterviewModeId(session.modeId) && exact ? exact.track.questions[0]?.nodeId ?? null : null;
      const certificationMode = exact && isCertificationPracticeModeId(session.modeId) ? exact.track.getMode(session.modeId) : null;
      const certificationTopicId = certificationMode?.selection.kind === "node"
        ? certificationMode.selection.nodeId
        : session.modeId === "certification-diagnostic-baseline" && exact ? exact.track.questions[0]?.nodeId ?? null : null;
      const certificationQuestions = result.evidence.familyId === "certification" && exact
        ? session.itemOrder.map((occurrence) => exact.track.getQuestion(occurrence.item.questionId))
        : [];
      const certificationMaxPoints = certificationExam?.maxPoints ?? (certificationQuestions.length === session.actualLength && certificationQuestions.every((question) => question !== undefined)
        ? certificationQuestions.reduce((sum, question) => sum + scoreCanonicalQuestion(question, question.answer).maxPoints, 0)
        : null);
      return { result, session, designTopicId, certificationTopicId, certificationMaxPoints, certificationExam, ...(reviewConflict ? { reviewConflict: true as const } : {}), certificationPracticeOverallPoints, certificationPracticeReview };
    })()
      .then((summary) => { if (live && summary) setReadState({ kind: "ready", requestKey: capturedRequestKey, summary }); })
      .catch((cause) => { if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(cause, t("We couldn’t load the session result.")) }); });
    return () => { live = false; };
  }, [navigation, readSummary, requestKey, t]);
  if (readState.requestKey !== requestKey || readState.kind === "pending") return <Screen>{fixtureNotice}<ExamResultLoadingSkeleton /></Screen>;
  if (readState.kind === "unavailable") return <Screen>{fixtureNotice}<EmptyState title={t("Session summary unavailable")} description={t(readState.reason)} /></Screen>;
  const summary = readState.summary;
  const { result, session } = summary;
  const design = isDesignInterviewModeId(session.modeId) && session.modeId !== "design-interview-simulation";
  const certificationExam = session.modeId === "certification-exam-simulation";
  const certificationPractice = isCertificationPracticeModeId(session.modeId);
  const answeredCount = certificationExam ? summary.certificationExam?.answeredCount ?? 0 : result.answeredOccurrenceIds.length;
  const actualCount = session.actualLength;
  const unansweredCount = certificationExam ? summary.certificationExam?.unansweredCount ?? actualCount : result.unansweredOccurrenceIds.length;
  const coverageIsConsistent = result.totalOccurrences === actualCount && answeredCount + unansweredCount === actualCount;
  const certificationCoverageIsExact = !certificationPractice || (
    unansweredCount === 0 &&
    JSON.stringify(result.answeredOccurrenceIds) === JSON.stringify(session.itemOrder.map((occurrence) => occurrence.occurrenceId))
  );
  const normalizedDetails = coverageIsConsistent
    ? normalizeSessionResultDetails(result.evidence.details, answeredCount, summary.certificationMaxPoints ?? undefined)
    : { points: null, score: null };
  if (certificationExam && !summary.certificationExam) {
    return <Screen><EmptyState title={t("Session summary unavailable")} description={t("The completed session evidence is incomplete.")} /></Screen>;
  }
  if (certificationPractice && (!coverageIsConsistent || !certificationCoverageIsExact || summary.certificationMaxPoints === null || normalizedDetails.points === null || normalizedDetails.score === null)) {
    return <Screen><EmptyState title={t("Session summary unavailable")} description={t("The completed session evidence is incomplete.")} /></Screen>;
  }
  const displayedPoints = certificationExam && summary.certificationExam
    ? { earned: summary.certificationExam.overallPointsEarned, max: summary.certificationExam.maxPoints }
    : certificationPractice && summary.certificationPracticeOverallPoints !== null && summary.certificationPracticeOverallPoints !== undefined && summary.certificationMaxPoints !== null
      ? { earned: summary.certificationPracticeOverallPoints, max: summary.certificationMaxPoints }
      : undefined;
  const domainPresentation = design
    ? formatSessionTopic(session.trackId, summary.designTopicId, t)
    : session.modeId === "certification-diagnostic-baseline"
    ? formatSessionTopic(session.trackId, summary.certificationTopicId, t)
    : session.modeId === "certification-focus-practice"
    ? formatSessionTopic(session.trackId, summary.certificationTopicId, t)
    : formatDomains(session.configurationSnapshot.sectionPresentation);
  const modeLabel = design
    ? t(getDesignModeTitle(session.modeId))
    : session.modeId === "certification-diagnostic-baseline"
    ? t("Diagnostic Baseline")
    : t(formatMode(session.modeId));
  return (
    <Screen>
      {fixtureNotice}
      {summary.reviewConflict ? <ReviewCycleConflictNotice /> : null}
      <SessionResultOverview
        activeTime={formatElapsed(session.activeForegroundMs)}
        answeredCount={answeredCount}
        backTestID={runtimeSelectors.summary.backToPractice(route.params.sessionId)}
        completion="completed"
        context={{ modeLabel, topicLabel: domainPresentation, trackLabel: t(getTrackDisplay(session.trackId).title) }}
        onBack={() => onFixtureExit ? onFixtureExit() : navigation.navigate(ROUTES.PRACTICE_HUB)}
        points={displayedPoints}
        requestedCount={session.requestedLength}
        configurationTestID={certificationPractice ? runtimeSelectors.summary.configuration(route.params.sessionId, session.actualLength, session.configurationSnapshot.feedbackMode === "atSessionEnd" ? "atSessionEnd" : "afterEachAnswer") : undefined}
        review={certificationPractice || certificationExam ? { onPress: () => navigation.navigate(ROUTES.EXAM_REVIEW, { sessionId: route.params.sessionId }), testID: runtimeSelectors.summary.reviewAnswers(route.params.sessionId) } : undefined}
        rootTestID={runtimeSelectors.summary.root(route.params.sessionId)}
        score={normalizedDetails.score}
        secondaryNote={certificationExam && summary.certificationExam
          ? { text: `${t("Points")}: ${summary.certificationExam.overallPointsEarned} / ${summary.certificationExam.maxPoints}` }
          : certificationPractice ? { text: t(session.configurationSnapshot.feedbackMode === "atSessionEnd" ? "Feedback at session end" : "Feedback after each answer") } : undefined}
        totalOccurrences={actualCount}
        unansweredCount={unansweredCount}
      />
      {certificationPractice && summary.certificationPracticeReview?.relatedPracticeLimitation
        ? <Card style={styles.diagnosticCard}>
            <Text style={styles.diagnosticTitle}>{t("Related practice")}</Text>
            <Text style={styles.diagnosticBody}>{t("A related question pair — a near variant or condition contrast — appears in this session or in an earlier recorded attempt using this exact content version. Treat it as related practice, not independent transfer evidence.")}</Text>
          </Card>
        : null}
      {session.trackId === "google-cloud-associate-cloud-engineer" && session.modeId === "certification-diagnostic-baseline"
        ? <CloudDiagnosticReportCard
            report={summary.certificationPracticeReview?.diagnosticReport ?? null}
            onRecommend={(target) => navigation.navigate(ROUTES.PRACTICE_SETUP, {
              expectedArtifactSha256: session.artifactSha256,
              expectedContentVersion: session.contentVersion,
              mentalUnitId: target.mentalUnitId,
              mode: "certification-focus-practice",
              source: "practiceHub",
              topicId: target.nodeId,
              trackId: session.trackId,
            })}
          />
        : null}
    </Screen>
  );
}

function CloudDiagnosticReportCard({ report, onRecommend }: Readonly<{
  report: CertificationPracticeReviewProjection["diagnosticReport"] | null;
  onRecommend: (target: Readonly<{ mentalUnitId: string; nodeId: string }>) => void;
}>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  if (!report) return <Card style={styles.diagnosticCard} testID={runtimeSelectors.summary.diagnosticReport()}>
    <Text style={styles.diagnosticTitle}>{t("Diagnostic report unavailable")}</Text>
    <Text style={styles.diagnosticBody}>{t("The saved result is available, but its exact diagnostic sample could not be verified.")}</Text>
  </Card>;
  const recommendation = report.recommendation;
  const target = recommendation.kind === "unavailable" ? null : { mentalUnitId: recommendation.mentalUnitId, nodeId: recommendation.nodeId };
  return <Card style={styles.diagnosticCard} testID={runtimeSelectors.summary.diagnosticReport()}>
    <Text style={styles.diagnosticTitle}>{t("Diagnostic sample")}</Text>
    <Text style={styles.diagnosticBody}>{t("{{correct}} correct, {{partial}} partly correct, {{incorrect}} incorrect, and {{unanswered}} unanswered out of {{total}} questions.", { correct: report.correctCount, partial: report.partialCount, incorrect: report.incorrectCount, unanswered: report.unansweredCount, total: report.totalCount })}</Text>
    <Text style={styles.diagnosticBody}>{t("This report covers only the learning units sampled by this diagnostic. It does not establish transfer to unseen questions.")}</Text>
    <Text style={styles.diagnosticBody}>{t("Feedback was available after each answer, but this report cannot confirm it was read.")}</Text>
    <Text style={styles.diagnosticBody}>{report.exposureHistory === "available"
      ? t("Recorded exposures: {{first}} first recorded and {{repeat}} repeat questions.", { first: report.units.reduce((sum, unit) => sum + (unit.firstRecordedExposureCount ?? 0), 0), repeat: report.units.reduce((sum, unit) => sum + (unit.repeatExposureCount ?? 0), 0) })
      : t("Prior exposure history is unavailable, so first versus repeat is unknown.")}</Text>
    {report.units.map((unit) => <Text key={unit.mentalUnitId} style={styles.diagnosticBody}>
      {formatSessionTopic("google-cloud-associate-cloud-engineer", unit.nodeId, t)} — {t("Learning unit {{number}}", { number: unit.unitNumber })}: {t("{{correct}} correct, {{partial}} partly correct, {{incorrect}} incorrect, and {{unanswered}} unanswered from {{sampled}} sampled questions.", { correct: unit.correctCount, partial: unit.partialCount, incorrect: unit.incorrectCount, unanswered: unit.unansweredCount, sampled: unit.questionCount })}
    </Text>)}
    {report.unsampledMentalUnitCount > 0 ? <Text style={styles.diagnosticBody}>{t("{{count}} learning units were not sampled and have insufficient evidence.", { count: report.unsampledMentalUnitCount })}</Text> : null}
    {recommendation.kind === "observed_gap" ? <Text style={styles.diagnosticBody}>{t("Next practice: {{topic}} — learning unit {{number}}. This diagnostic sampled {{sampled}} of {{eligible}} Focus questions for this unit, with {{partial}} partly correct and {{incorrect}} incorrect answers.", { topic: formatSessionTopic("google-cloud-associate-cloud-engineer", recommendation.nodeId, t), number: recommendation.unitNumber, sampled: recommendation.sampledQuestionCount, eligible: recommendation.eligibleQuestionCount, partial: recommendation.partialCount, incorrect: recommendation.incorrectCount })}</Text>
      : recommendation.kind === "neutral_practice" ? <Text style={styles.diagnosticBody}>{t("All sampled answers were correct. Practice an unsampled unit as neutral practice; this is not a transfer or mastery claim.")}</Text>
        : <Text accessibilityRole="alert" style={styles.diagnosticBody}>{t(recommendation.reason === "unit_pool_below_minimum" ? "The recommended unit does not have enough questions for the existing Focus minimum." : "No eligible unsampled unit is available for neutral practice.")}</Text>}
    {target ? <Button onPress={() => onRecommend(target)} testID={runtimeSelectors.summary.diagnosticRecommendation()}>{t(recommendation.kind === "observed_gap" ? "Practice this learning unit" : "Practice an unsampled learning unit")}</Button> : null}
  </Card>;
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
  diagnosticCard: { gap: spacing.md, width: "100%" },
  diagnosticTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: "700" },
  diagnosticBody: { color: palette.textSecondary, fontSize: 15, lineHeight: 22 },
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
