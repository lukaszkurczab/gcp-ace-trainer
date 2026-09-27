import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { getCertificationExamReviewProjection, getCertificationPracticeReviewProjection, type CertificationPracticeReviewProjection } from "../../application/certification";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import { getTrainingLifecycleUseCases } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, ReviewLoadingSkeleton, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { getCertificationMode, isCertificationPracticeModeId } from "../../tracks/certification";
import { spacing, typography, type AppColors } from "../../theme";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { PracticeQuestionCard } from "../practice/PracticeQuestionCard";
import { PracticeResponseControls } from "../practice/PracticeResponseControls";
import { buildCertificationReviewControl } from "./certificationPracticeReviewPresentation";
import { detailLines } from "../practice/feedbackDetails";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;
type ExamReviewReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; rows: CertificationPracticeReviewProjection | CertificationExamReviewProjection }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function ExamReviewLoadingSkeleton({ onBack = noop }: Readonly<{ onBack?: () => void }> = {}) {
  return <ReviewLoadingSkeleton onBack={onBack} />;
}

export function ExamReviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ExamReviewReadState>({ kind: "pending", requestKey });
  const [currentOccurrenceId, setCurrentOccurrenceId] = useState<string | null>(null);
  const backToResult = () => navigation.popTo(ROUTES.RESULT, { sessionId: requestKey });

  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });
    setCurrentOccurrenceId(null);
    void Promise.resolve().then(async (): Promise<CertificationPracticeReviewProjection | CertificationExamReviewProjection> => {
      const session = await getTrainingLifecycleUseCases().loadSessionRecord(capturedRequestKey);
      if (session.modeId === "certification-exam-simulation") return getCertificationExamReviewProjection(capturedRequestKey);
      if (isCertificationPracticeModeId(session.modeId)) return getCertificationPracticeReviewProjection(capturedRequestKey);
      throw new Error("The completed session is not a Certification Practice or Exam.");
    })
      .then((rows) => {
        if (!live) return;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, rows });
        setCurrentOccurrenceId(rows.items[0]?.occurrenceId ?? null);
      })
      .catch((cause) => {
        if (live) setReadState({ kind: "unavailable", requestKey: capturedRequestKey, reason: describeOperationalFailure(cause, t("We couldn’t load the session result.")) });
      });
    return () => { live = false; };
  }, [requestKey, t]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <ExamReviewLoadingSkeleton onBack={backToResult} />;
  if (readState.kind === "unavailable") return <Screen edges={["top", "bottom"]}><EmptyState title={t("Session result unavailable")} description={readState.reason} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;

  const projection = readState.rows;
  const index = Math.max(0, projection.items.findIndex((item) => item.occurrenceId === currentOccurrenceId));
  const item = projection.items[index];
  if (!item) return <Screen edges={["top", "bottom"]}><EmptyState title={t("Session result unavailable")} description={t("We couldn’t load the session result.")} actionLabel={t("Back to results")} onActionPress={backToResult} /></Screen>;
  const previous = projection.items[index - 1];
  const next = projection.items[index + 1];
  const isExam = projection.modeId === "certification-exam-simulation";
  const isUnanswered = item.result === "unanswered";
  const resultTone = item.result === "unanswered" ? "unanswered" : item.result;
  const headerAction = <Button onPress={backToResult} testID={runtimeSelectors.practiceReview.result()} variant="ghost">{t("Back to results")}</Button>;

  return (
    <SessionShell
      key={item.occurrenceId}
      actionBar={<View style={styles.actions}><Button disabled={!previous} onPress={() => previous && setCurrentOccurrenceId(previous.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.previous()} variant="secondary">{t("Back")}</Button><Button disabled={!next} onPress={() => next && setCurrentOccurrenceId(next.occurrenceId)} style={styles.action} testID={runtimeSelectors.practiceReview.next()}>{t("Next")}</Button></View>}
      headerAction={headerAction}
      modeLabel={t(isExam ? "Certification Exam Simulation" : getCertificationMode(projection.modeId).title)}
      position={{ label: `${item.ordinal} / ${projection.total}`, accessibilityLabel: `${t("Question")} ${item.ordinal} / ${projection.total}` }}
      progress={item.ordinal / projection.total}
      rootTestID={runtimeSelectors.practiceReview.root(projection.sessionId, item.occurrenceId)}
    >
      <PracticeQuestionCard question={{ constraints: item.constraints, itemId: item.questionId, prompt: item.prompt }} />
      <Text maxFontSizeMultiplier={2} style={[styles.result, styles[resultTone]]}>{t(isUnanswered ? "Unanswered" : item.result === "correct" ? "Correct" : item.result === "partial" ? "Partial" : "Incorrect")}</Text>
      <PracticeResponseControls control={buildCertificationReviewControl(item)} editable={false} itemId={item.questionId} onChoicePress={noop} onComplexityValuePress={noop} onOrderingMove={noop} />
      {item.result === "unanswered" ? <View style={styles.unansweredFeedback}>
        <Text maxFontSizeMultiplier={2} style={styles.feedbackLabel}>{t("Reason")}</Text>
        <Text accessibilityLabel={`${t("Answer explanation.")} ${item.reason}`} maxFontSizeMultiplier={2} style={styles.feedbackText}>{item.reason}</Text>
        {detailLines(item.details).map((line, lineIndex) => <Text key={`detail:${lineIndex}`} maxFontSizeMultiplier={2} style={styles.feedbackText}>{line}</Text>)}
      </View> : <PracticeFeedbackBlock feedback={{ details: item.details, reason: item.reason, result: item.result, sources: item.sources }} item={item.item} itemId={item.questionId} reportSurface={{ modeRoute: "answer_review", trackNode: null }} />}
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
  unansweredFeedback: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  feedbackLabel: { ...typography.bodyStrong, color: palette.textSecondary },
  feedbackText: { ...typography.body, color: palette.textSecondary },
  result: { ...typography.bodyStrong },
});
