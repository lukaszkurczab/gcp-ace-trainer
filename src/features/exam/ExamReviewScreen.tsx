import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { getCertificationExamReviewProjection, getCertificationPracticeReviewProjection, type CertificationPracticeReviewProjection } from "../../application/certification";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import { getTrainingLifecycleUseCases } from "../../application/trainingLifecycle";
import { setQuestionNeedsReview } from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { loadReviewQueueItems } from "../../application/learningReadModels";
import { captureProfileReadFence } from "../../application/profileReadFence";
import { Button, EmptyState, ReviewLoadingSkeleton, Screen } from "../../components";
import { ROUTES } from "../../constants";
import { isActiveReviewQueueEntry, resolvedContentRefsEqual, type ReviewQueueEntry } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { getCertificationMode, isCertificationPracticeModeId } from "../../tracks/certification";
import { spacing, typography, type AppColors } from "../../theme";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { PracticeQuestionCard } from "../practice/PracticeQuestionCard";
import { PracticeResponseControls } from "../practice/PracticeResponseControls";
import { buildCertificationReviewControl, commitManualReviewAndReadback } from "./certificationPracticeReviewPresentation";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;
type ReviewReader = (sessionId: string) => Promise<CertificationPracticeReviewProjection | CertificationExamReviewProjection>;
type ExamReviewReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; rows: CertificationPracticeReviewProjection | CertificationExamReviewProjection }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;
type ReviewMarkReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; entries: readonly ReviewQueueEntry[] }>
  | Readonly<{ kind: "unavailable"; requestKey: string }>;

export function ExamReviewLoadingSkeleton({ onBack = noop }: Readonly<{ onBack?: () => void }> = {}) {
  return <ReviewLoadingSkeleton onBack={onBack} />;
}

export function ExamReviewScreen({ navigation, route, readReview, openSource, fixtureNotice }: Props & Readonly<{ readReview?: ReviewReader; openSource?: (url: string) => Promise<unknown>; fixtureNotice?: ReactNode }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ExamReviewReadState>({ kind: "pending", requestKey });
  const [reviewMarkState, setReviewMarkState] = useState<ReviewMarkReadState>({ kind: "pending", requestKey });
  const [pendingMarkOccurrenceId, setPendingMarkOccurrenceId] = useState<string | null>(null);
  const [reviewMarkError, setReviewMarkError] = useState<string | null>(null);
  const [currentOccurrenceId, setCurrentOccurrenceId] = useState<string | null>(null);
  const manualReviewOperation = useRef(0);
  const currentRequestKey = useRef(requestKey);
  const currentOccurrence = useRef<string | null>(currentOccurrenceId);
  currentRequestKey.current = requestKey;
  currentOccurrence.current = currentOccurrenceId;

  const selectOccurrence = (occurrenceId: string) => {
    manualReviewOperation.current += 1;
    currentOccurrence.current = occurrenceId;
    setPendingMarkOccurrenceId(null);
    setReviewMarkError(null);
    setCurrentOccurrenceId(occurrenceId);
  };
  const backToResult = () => {
    manualReviewOperation.current += 1;
    navigation.popTo(ROUTES.RESULT, { sessionId: requestKey });
  };

  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    manualReviewOperation.current += 1;
    currentOccurrence.current = null;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    setReviewMarkState({ kind: "pending", requestKey: capturedRequestKey });
    setPendingMarkOccurrenceId(null);
    setReviewMarkError(null);
    setCurrentOccurrenceId(null);
    void Promise.resolve().then(async (): Promise<CertificationPracticeReviewProjection | CertificationExamReviewProjection> => {
      if (readReview) return readReview(capturedRequestKey);
      const session = await getTrainingLifecycleUseCases().loadSessionRecord(capturedRequestKey);
      if (session.modeId === "certification-exam-simulation") return getCertificationExamReviewProjection(capturedRequestKey);
      if (isCertificationPracticeModeId(session.modeId)) return getCertificationPracticeReviewProjection(capturedRequestKey);
      throw new Error("The completed session is not a Certification Practice or Exam.");
    })
      .then((rows) => {
        if (!live) return;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, rows });
        currentOccurrence.current = rows.items[0]?.occurrenceId ?? null;
        setCurrentOccurrenceId(rows.items[0]?.occurrenceId ?? null);
      })
      .catch((cause) => {
        if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(cause, t("We couldn’t load the session result.")) });
      });
    void loadReviewQueueItems()
      .then((snapshot) => {
        if (!live) return;
        if ((snapshot.issues?.length ?? 0) > 0) {
          setReviewMarkState({ kind: "unavailable", requestKey: capturedRequestKey });
          return;
        }
        setReviewMarkState({ kind: "ready", requestKey: capturedRequestKey, entries: snapshot.value });
      })
      .catch(() => {
        if (live) setReviewMarkState({ kind: "unavailable", requestKey: capturedRequestKey });
      });
    return () => {
      live = false;
      manualReviewOperation.current += 1;
    };
  }, [readReview, requestKey, t]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <ExamReviewLoadingSkeleton onBack={backToResult} />;
  if (readState.kind === "unavailable") return <Screen edges={["top", "bottom"]}>{fixtureNotice}<EmptyState title={t("Session result unavailable")} description={readState.reason} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;

  const projection = readState.rows;
  const index = Math.max(0, projection.items.findIndex((item) => item.occurrenceId === currentOccurrenceId));
  const item = projection.items[index];
  if (!item) return <Screen edges={["top", "bottom"]}>{fixtureNotice}<EmptyState title={t("Session result unavailable")} description={t("We couldn’t load the session result.")} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  const previous = projection.items[index - 1];
  const next = projection.items[index + 1];
  const isExam = projection.modeId === "certification-exam-simulation";
  const isUnanswered = item.result === "unanswered";
  const resultTone = item.result === "unanswered" ? "unanswered" : item.result;
  const markState = reviewMarkState.requestKey === requestKey ? reviewMarkState : { kind: "pending" as const, requestKey };
  const canMarkForReview = item.result !== "unanswered" && item.sourceAttemptId !== undefined && item.item.trackId === "google-cloud-associate-cloud-engineer";
  const isMarkedForReview = markState.kind === "ready" && markState.entries.some((entry) =>
    isActiveReviewQueueEntry(entry) && entry.reasons.includes("manual_mark") && resolvedContentRefsEqual(entry.sourceItem, item.item));
  const isMarkPending = pendingMarkOccurrenceId === item.occurrenceId;
  const markUnavailable = !canMarkForReview;
  const headerAction = <Button onPress={backToResult} testID={runtimeSelectors.practiceReview.result()} variant="ghost">{t("Back to results")}</Button>;
  const sourceOpener = openSource;

  const toggleManualReview = async () => {
    if (!canMarkForReview || markState.kind !== "ready" || !item.sourceAttemptId || pendingMarkOccurrenceId !== null) return;
    const operation = ++manualReviewOperation.current;
    const capturedRequestKey = requestKey;
    const capturedOccurrenceId = item.occurrenceId;
    const assertCurrentProfile = captureProfileReadFence();
    const isRouteCurrent = () => manualReviewOperation.current === operation &&
      currentRequestKey.current === capturedRequestKey && currentOccurrence.current === capturedOccurrenceId;
    const isCurrent = () => {
      if (!isRouteCurrent()) return false;
      try { assertCurrentProfile(); return true; } catch { return false; }
    };
    setPendingMarkOccurrenceId(item.occurrenceId);
    setReviewMarkError(null);
    try {
      const result = await commitManualReviewAndReadback({
        commit: () => setQuestionNeedsReview({ sourceAttemptId: item.sourceAttemptId!, sourceItem: item.item, sourceSessionId: projection.sessionId }, !isMarkedForReview),
        onCommitted: () => { if (isCurrent()) setReviewMarkState({ kind: "pending", requestKey: capturedRequestKey }); },
        readback: loadReviewQueueItems,
        isCurrent,
      });
      if (!isRouteCurrent()) return;
      if (result.kind === "stale") {
        setReviewMarkState({ kind: "unavailable", requestKey: capturedRequestKey });
        return;
      }
      if (result.kind === "commit_failed") {
        setReviewMarkError(t("The review mark could not be saved locally."));
      } else if (result.kind === "unavailable" || (result.value.issues?.length ?? 0) > 0) {
        setReviewMarkState({ kind: "unavailable", requestKey: capturedRequestKey });
      } else {
        setReviewMarkState({ kind: "ready", requestKey: capturedRequestKey, entries: result.value.value });
      }
    } finally {
      if (isRouteCurrent()) setPendingMarkOccurrenceId(null);
    }
  };

  return (
    <SessionShell
      key={item.occurrenceId}
      actionBar={<View style={styles.actions}><Button disabled={!previous} onPress={() => previous && selectOccurrence(previous.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.previous()} variant="secondary">{t("Previous")}</Button><Button disabled={!next} onPress={() => next && selectOccurrence(next.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.next()}>{t("Next")}</Button></View>}
      headerAction={headerAction}
      modeLabel={t(isExam ? "Certification Exam Simulation" : getCertificationMode(projection.modeId).title)}
      position={{ label: `${item.ordinal} / ${projection.total}`, accessibilityLabel: `${t("Question")} ${item.ordinal} / ${projection.total}` }}
      progress={item.ordinal / projection.total}
      rootTestID={runtimeSelectors.practiceReview.root(projection.sessionId, item.occurrenceId)}
    >
      {fixtureNotice}
      <PracticeQuestionCard question={{ constraints: item.constraints, itemId: item.questionId, prompt: item.prompt }} />
      <Text maxFontSizeMultiplier={2} style={[styles.result, styles[resultTone]]}>{t(isUnanswered ? "Unanswered" : item.result === "correct" ? "Correct" : item.result === "partial" ? "Partial" : "Incorrect")}</Text>
      <PracticeResponseControls control={buildCertificationReviewControl(item)} editable={false} itemId={item.questionId} onChoicePress={noop} onComplexityValuePress={noop} onOrderingMove={noop} />
      <PracticeFeedbackBlock feedback={{ details: item.details, messages: item.messages, reason: item.reason, result: item.result, sources: item.sources }} initiallyExpanded={isUnanswered} showReport={!isUnanswered} openSource={sourceOpener} item={item.item} itemId={item.questionId} reportSurface={{ modeRoute: "answer_review", trackNode: null }} />
      <View style={styles.reviewMark}>
        {canMarkForReview && markState.kind === "ready" ? (
          <Button
            accessibilityLabel={t(isMarkedForReview ? "Marked Needs Review" : "Mark Needs Review")}
            accessibilityState={{ selected: isMarkedForReview }}
            disabled={pendingMarkOccurrenceId !== null}
            loading={isMarkPending}
            onPress={() => { void toggleManualReview(); }}
            testID={runtimeSelectors.practiceReview.manualMark(requestKey, item.occurrenceId)}
            variant="secondary"
          >{t(isMarkedForReview ? "Marked Needs Review" : "Mark Needs Review")}</Button>
        ) : (
          <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={styles.reviewMarkStatus}>
            {markState.kind === "pending" ? t("Checking review status") : markState.kind === "unavailable" ? t("Review status could not be loaded") : markUnavailable ? t("Manual review is unavailable for this answer") : t("Review status could not be loaded")}
          </Text>
        )}
        {reviewMarkError ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={styles.reviewMarkError}>{reviewMarkError}</Text> : null}
      </View>
    </SessionShell>
  );
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  action: { flex: 1 },
  actions: { flexDirection: "row", gap: spacing.md },
  correct: { color: palette.success },
  incorrect: { color: palette.danger },
  partial: { color: palette.warning },
  unanswered: { color: palette.textSecondary },
  result: { ...typography.bodyStrong },
  reviewMark: { gap: spacing.sm, paddingTop: spacing.md },
  reviewMarkError: { ...typography.caption, color: palette.danger, textAlign: "center" },
  reviewMarkStatus: { ...typography.caption, color: palette.textSecondary, textAlign: "center" },
});
