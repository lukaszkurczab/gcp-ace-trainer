import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { CertificationExamExpiredError, finalizeCertificationExam, getCertificationExamProjection, navigateCertificationExamTo, resumeExpectedCertificationExam, saveCertificationExamResponse, startCertificationExam, toggleCertificationExamFlag, type CertificationExamProjection } from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, Card, EmptyState, Screen, SettingsDialog, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { SimulationQuestionNavigator } from "../simulation/navigator/SimulationQuestionNavigator";
import { createExamReadOwner, type ExamReadOwner, type ExamReadOwnerOutcome, type ExamReadOwnerToken } from "./examReadOwner";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM>;

type ExamReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; projection: CertificationExamProjection }>
  | Readonly<{ kind: "error"; requestKey: string; reason: string }>;

export function ExamLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <Screen style={styles.loadingScreen}>
      <View
        accessibilityLabel={t("Preparing exam simulation…")}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.loadingRoot}
        testID="exam-loading-skeleton"
      >
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.loadingShapes}>
          <View style={styles.loadingContext} testID="exam-loading-context">
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingContextLine, { height: 15 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingContextLineShort, { height: 13 * textScale }]} />
          </View>
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingHeading, { height: 21 * textScale }]} />
          <View style={[styles.loadingQuestion, largeLayout ? styles.loadingQuestionLarge : null]} testID="exam-loading-question">
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionTitle, { height: 22 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionLine, { height: 17 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingQuestionLineShort, { height: 17 * textScale }]} />
          </View>
          <View style={styles.loadingResponse} testID="exam-loading-response">
            {[0, 1, 2].map((row) => <SkeletonShape key={row} motion={motion} style={[styles.loadingResponseRow, { minHeight: 48 * textScale }]} />)}
          </View>
          <View style={styles.loadingActions} testID="exam-loading-actions">
            <SkeletonShape motion={motion} style={[styles.loadingAction, { minHeight: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingAction, { minHeight: 48 * textScale }]} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

/** Canonical Cloud exam runner; navigation and responses are durably persisted through the shared lifecycle. */
export function ExamScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const requestKey = route.params?.expectedSessionId ?? "new-exam";
  const [readState, setReadState] = useState<ExamReadState>({ kind: "pending", requestKey });
  const [operationError, setOperationError] = useState<string | null>(null);
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const [finishVisible, setFinishVisible] = useState(false);
  const readOwnerRef = useRef<ExamReadOwner<CertificationExamProjection> | null>(null);
  if (!readOwnerRef.current) {
    readOwnerRef.current = createExamReadOwner<CertificationExamProjection>({
      expiredSessionId: (cause) => cause instanceof CertificationExamExpiredError ? cause.sessionId : null,
      getProjection: getCertificationExamProjection,
      resumeExpected: resumeExpectedCertificationExam,
      start: startCertificationExam,
    });
  }
  const readOwner = readOwnerRef.current;
  const activeTokenRef = useRef<ExamReadOwnerToken | null>(null);

  function publishReadOutcome(token: ExamReadOwnerToken, outcome: ExamReadOwnerOutcome<CertificationExamProjection>): void {
    if (!readOwner.isCurrent(token)) return;
    if (outcome.kind === "stale") return;
    if (outcome.kind === "ready") {
      setOperationError(null);
      setReadState({ kind: "ready", projection: outcome.projection, requestKey: token.requestKey });
      return;
    }
    if (outcome.kind === "active_session_conflict") {
      setReadState({ kind: "error", reason: "The expected Cloud exam is no longer the active session.", requestKey: token.requestKey });
      return;
    }
    if (outcome.kind === "expired") {
      readOwner.invalidate(token);
      navigation.replace(ROUTES.RESULT, { sessionId: outcome.sessionId });
      return;
    }
    const fallback = outcome.source === "expected"
      ? "The expected Cloud exam is unavailable."
      : outcome.source === "interval"
        ? "Exam refresh failed."
        : "Exam is unavailable.";
    const reason = describeOperationalFailure(outcome.cause, fallback);
    if (outcome.source === "interval") setOperationError(reason);
    else setReadState({ kind: "error", reason, requestKey: token.requestKey });
  }

  useEffect(() => {
    setReadState({ kind: "pending", requestKey });
    setOperationError(null);
    setNavigatorVisible(false);
    setFinishVisible(false);
    const token = readOwner.begin(requestKey);
    activeTokenRef.current = token;
    void readOwner.load(token, route.params?.expectedSessionId).then((outcome) => publishReadOutcome(token, outcome));
    return () => {
      readOwner.invalidate(token);
      if (activeTokenRef.current?.generation === token.generation) activeTokenRef.current = null;
    };
  }, [readOwner, requestKey, route.params?.expectedSessionId]);

  useEffect(() => {
    if (readState.requestKey !== requestKey || readState.kind !== "ready") return;
    const token = activeTokenRef.current;
    if (!token || !readOwner.isCurrent(token)) return;
    const interval = setInterval(() => {
      if (!readOwner.isCurrent(token)) return;
      void readOwner.refresh(token, "interval").then((outcome) => publishReadOutcome(token, outcome));
    }, 1_000);
    return () => clearInterval(interval);
  }, [readOwner, readState.kind, readState.requestKey, requestKey]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <ExamLoadingSkeleton />;
  if (readState.kind === "error" || operationError) {
    const reason = readState.kind === "error" ? readState.reason : operationError ?? "Exam is unavailable.";
    return <Screen><EmptyState title={t("Exam unavailable")} description={t(reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  const { projection } = readState;
  const deadline = projection.session.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") return <Screen><EmptyState title={t("Exam unavailable")} description={t("The immutable exam deadline is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  const remainingMs = Math.max(0, Date.parse(deadline) - Date.parse(projection.now)); const remainingMinutes = Math.floor(remainingMs / 60_000); const remainingSeconds = Math.floor((remainingMs % 60_000) / 1_000);
  const selected = new Set(projection.response?.selectedOptionIds ?? []); const multiple = projection.question.type === "multiple";
  const currentToken = () => {
    const token = activeTokenRef.current;
    return token && readOwner.isCurrent(token) ? token : null;
  };
  const select = async (id: string) => {
    const token = currentToken();
    if (!token) return;
    const ids = multiple ? (selected.has(id) ? [...selected].filter((value) => value !== id) : [...selected, id]) : [id];
    if (!ids.length) return;
    try {
      await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response: { kind: "option_selection", selectedOptionIds: ids } });
      if (!readOwner.isCurrent(token)) return;
      publishReadOutcome(token, await readOwner.refresh(token, "interval"));
    } catch (cause) {
      if (readOwner.isCurrent(token)) setOperationError(describeOperationalFailure(cause, "Answer could not be saved."));
    }
  };
  const go = async (index: number): Promise<"navigated" | "incomplete_response" | "save_failed"> => {
    const token = currentToken();
    if (!token) return "save_failed";
    try {
      await navigateCertificationExamTo(index);
      if (!readOwner.isCurrent(token)) return "save_failed";
      const outcome = await readOwner.refresh(token, "interval");
      if (outcome.kind === "stale") return "save_failed";
      publishReadOutcome(token, outcome);
      return outcome.kind === "ready" ? "navigated" : "save_failed";
    } catch (cause) {
      if (readOwner.isCurrent(token)) setOperationError(describeOperationalFailure(cause, "Exam navigation failed."));
      return "save_failed";
    }
  };
  const toggleFlag = async () => {
    const token = currentToken();
    if (!token) return;
    try {
      await toggleCertificationExamFlag(projection.occurrenceId);
      if (!readOwner.isCurrent(token)) return;
      publishReadOutcome(token, await readOwner.refresh(token, "interval"));
    } catch (cause) {
      if (readOwner.isCurrent(token)) setOperationError(describeOperationalFailure(cause, "Question flag could not be saved."));
    }
  };
  const finish = async () => {
    const token = currentToken();
    if (!token) return;
    try {
      const sessionId = await finalizeCertificationExam();
      if (!readOwner.isCurrent(token)) return;
      navigation.replace(ROUTES.RESULT, { sessionId });
      readOwner.invalidate(token);
    } catch (cause) {
      if (readOwner.isCurrent(token)) setOperationError(describeOperationalFailure(cause, "Exam finalization failed."));
    }
  };
  return <Screen style={styles.screen}><View testID={runtimeSelectors.simulation.root(projection.session.id)}>
    <Text maxFontSizeMultiplier={2} style={styles.progress} testID={runtimeSelectors.session.counter(projection.session.id, projection.ordinal, projection.total)}>{t("Question")} {projection.ordinal} {t("of")} {projection.total}</Text><Text maxFontSizeMultiplier={2} style={styles.progress} testID={runtimeSelectors.session.timer(projection.session.id)}>{t("Time remaining")}: {remainingMinutes}:{String(remainingSeconds).padStart(2, "0")}</Text><Text maxFontSizeMultiplier={2} style={styles.domain}>{t(projection.question.domain.replaceAll("_", " "))}</Text>
    <Card style={styles.card}><Text maxFontSizeMultiplier={2} style={styles.question} testID={runtimeSelectors.simulation.question(projection.question.id)}>{projection.question.question}</Text><View style={styles.options}>{projection.question.options.map((option) => <Pressable key={option.id} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected.has(option.id) }} onPress={() => void select(option.id)} style={[styles.option, selected.has(option.id) && styles.selected]} testID={runtimeSelectors.simulation.option(projection.question.id, option.id)}><Text maxFontSizeMultiplier={2} style={styles.optionText}>{option.text}</Text></Pressable>)}</View></Card>
    <View style={styles.navigationActions}><Button onPress={() => void go(Math.max(0, projection.ordinal - 2))} disabled={projection.ordinal === 1} testID={runtimeSelectors.simulation.action(projection.session.id, "previous")} variant="secondary">{t("Previous")}</Button><Button onPress={() => void go(Math.min(projection.total - 1, projection.ordinal))} disabled={projection.ordinal === projection.total} testID={runtimeSelectors.simulation.action(projection.session.id, "next")} variant="secondary">{t("Next")}</Button></View>
    <View style={styles.examActions}><Button onPress={() => setNavigatorVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "navigator")} variant="secondary">{t("Question navigator")}</Button><Button onPress={() => void toggleFlag()} testID={runtimeSelectors.simulation.action(projection.session.id, "flag")} variant="secondary">{t(projection.flaggedOccurrenceIds.includes(projection.occurrenceId) ? "Remove flag" : "Flag question")}</Button></View>
    <Button onPress={() => setFinishVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "finish")}>{t("Finish exam")}</Button>
  </View>
  <SimulationQuestionNavigator onDismiss={() => setNavigatorVisible(false)} onOccurrencePress={(occurrenceId) => go(projection.session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === occurrenceId))} positions={projection.session.itemOrder.map((occurrence, index) => ({ occurrenceId: occurrence.occurrenceId, state: index === projection.session.currentItemIndex ? "current" : projection.draft.responsesByOccurrenceId[occurrence.occurrenceId] ? "answered" : "unanswered", flagged: projection.flaggedOccurrenceIds.includes(occurrence.occurrenceId) }))} visible={navigatorVisible} />
  <SettingsDialog closeLabel={t("Continue simulation")} message={`${projection.total - Object.keys(projection.draft.responsesByOccurrenceId).length} ${t("unanswered")}. ${t("Unanswered questions receive zero points.")}`} onClose={() => setFinishVisible(false)} onPrimaryAction={() => { setFinishVisible(false); void finish(); }} primaryActionLabel={t("Finish exam")} secondaryActionLabel={t("Continue simulation")} title={t("Finish with unanswered questions?")} visible={finishVisible} />
  </Screen>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: spacing.md },
  progress: { ...typography.small, color: palette.textMuted },
  domain: { ...typography.caption, color: palette.primary, textTransform: "uppercase" },
  card: { gap: spacing.md },
  question: { ...typography.bodyStrong, color: palette.textPrimary },
  options: { gap: spacing.sm },
  option: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, padding: spacing.md },
  selected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  optionText: { ...typography.body, color: palette.textPrimary },
  navigationActions: { flexDirection: "row", gap: spacing.sm },
  examActions: { gap: spacing.sm },
  loadingAction: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, flex: 1 },
  loadingActions: { flexDirection: "row", gap: spacing.sm },
  loadingContext: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  loadingContextLine: { width: "58%" },
  loadingContextLineShort: { width: "36%" },
  loadingHeading: { width: "54%" },
  loadingLine: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1 },
  loadingQuestion: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  loadingQuestionLarge: { gap: spacing.md },
  loadingQuestionLine: { width: "92%" },
  loadingQuestionLineShort: { width: "66%" },
  loadingQuestionTitle: { width: "34%" },
  loadingResponse: { gap: spacing.sm },
  loadingResponseRow: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, width: "100%" },
  loadingRoot: { gap: spacing.xl },
  loadingScreen: { gap: spacing.md },
  loadingShapes: { gap: spacing.xl },
});
