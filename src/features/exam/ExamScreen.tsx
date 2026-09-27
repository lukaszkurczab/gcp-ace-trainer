import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  CertificationExamExpiredError,
  finalizeCertificationExam,
  getCertificationExamProjection,
  navigateCertificationExamTo,
  resumeExpectedCertificationExam,
  saveCertificationExamResponse,
  startCertificationExam,
  toggleCertificationExamFlag,
  type CertificationExamProjection,
} from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { AnswerOption, Button, EmptyState, Screen, SettingsDialog, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { PracticeQuestionCard } from "../practice/PracticeQuestionCard";
import { SessionShell } from "../coding-interview/session/SessionShell";
import { SimulationQuestionNavigator } from "../simulation/navigator/SimulationQuestionNavigator";
import type { SimulationNavigatorSelectionResult } from "../simulation/simulationProjection";
import { createExamActionLane, type ExamActionLane } from "./examActionLane";
import { settleCommittedExamNavigation } from "./examNavigationRefresh";
import { createExamReadOwner, type ExamReadOwner, type ExamReadOwnerOutcome, type ExamReadOwnerToken } from "./examReadOwner";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM>;
type ExamReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; projection: CertificationExamProjection }>
  | Readonly<{ kind: "conflict"; requestKey: string }>
  | Readonly<{ kind: "refresh_error"; requestKey: string; reason: string }>
  | Readonly<{ kind: "error"; requestKey: string; reason: string }>;

export function ExamLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();

  return (
    <Screen edges={["top", "bottom"]} style={styles.loadingScreen}>
      <View accessibilityLabel={t("Preparing exam simulation…")} accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityState={{ busy: true }} accessible style={styles.loadingRoot} testID="exam-loading-skeleton">
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.loadingShapes}>
          <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingHeading, { height: 21 * textScale }]} />
          <View style={styles.loadingQuestion} testID="exam-loading-question">
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

/** Canonical Cloud exam runner; reads and durable actions stay owned by their application facades. */
export function ExamScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const requestKey = route.params?.expectedSessionId ?? "new-exam";
  const [readState, setReadState] = useState<ExamReadState>({ kind: "pending", requestKey });
  const [operationError, setOperationError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const [finishVisible, setFinishVisible] = useState(false);
  const readOwnerRef = useRef<ExamReadOwner<CertificationExamProjection> | null>(null);
  const actionLaneRef = useRef<ExamActionLane | null>(null);
  const activeTokenRef = useRef<ExamReadOwnerToken | null>(null);

  if (!readOwnerRef.current) {
    readOwnerRef.current = createExamReadOwner({
      expiredSessionId: (cause) => cause instanceof CertificationExamExpiredError ? cause.sessionId : null,
      getProjection: getCertificationExamProjection,
      resumeExpected: resumeExpectedCertificationExam,
      start: startCertificationExam,
    });
  }
  if (!actionLaneRef.current) actionLaneRef.current = createExamActionLane();
  const readOwner = readOwnerRef.current;
  const actionLane = actionLaneRef.current;

  function isCurrent(token: ExamReadOwnerToken) {
    return readOwner.isCurrent(token);
  }

  function publishReadOutcome(token: ExamReadOwnerToken, outcome: ExamReadOwnerOutcome<CertificationExamProjection>): void {
    if (!isCurrent(token) || outcome.kind === "stale") return;
    if (outcome.kind === "ready") {
      setOperationError(null);
      setReadState({ kind: "ready", projection: outcome.projection, requestKey: token.requestKey });
      return;
    }
    if (outcome.kind === "active_session_conflict") {
      setReadState({ kind: "conflict", requestKey: token.requestKey });
      return;
    }
    if (outcome.kind === "expired") {
      readOwner.invalidate(token);
      navigation.replace(ROUTES.RESULT, { sessionId: outcome.sessionId });
      return;
    }
    const reason = describeOperationalFailure(
      outcome.cause,
      outcome.source === "interval" ? t("Exam refresh failed.") : t("Exam is unavailable."),
    );
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
    if (!token || !isCurrent(token)) return;
    const interval = setInterval(() => {
      if (!isCurrent(token) || actionLane.isBusy()) return;
      void readOwner.refresh(token, "interval").then((outcome) => publishReadOutcome(token, outcome));
    }, 1_000);
    return () => clearInterval(interval);
  }, [actionLane, readOwner, readState.kind, readState.requestKey, requestKey]);

  useEffect(() => {
    if (readState.requestKey !== requestKey || readState.kind !== "ready") return;
    const token = activeTokenRef.current;
    if (!token || !isCurrent(token)) return;
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active" || actionLane.isBusy()) return;
      void readOwner.refresh(token, "interval").then((outcome) => publishReadOutcome(token, outcome));
    });
    return () => listener.remove();
  }, [actionLane, readOwner, readState.kind, readState.requestKey, requestKey]);

  async function performAction<Value>(action: () => Promise<Value>): Promise<Value | null> {
    setActionPending(true);
    try {
      const result = await actionLane.run(action);
      return result.kind === "completed" ? result.value : null;
    } finally {
      setActionPending(actionLane.isBusy());
    }
  }

  function currentToken(): ExamReadOwnerToken | null {
    const token = activeTokenRef.current;
    return token && isCurrent(token) ? token : null;
  }

  async function refreshAfterAction(token: ExamReadOwnerToken): Promise<ExamReadOwnerOutcome<CertificationExamProjection>> {
    const outcome = await readOwner.refresh(token, "interval");
    publishReadOutcome(token, outcome);
    if (outcome.kind === "unavailable" && isCurrent(token)) setOperationError(describeOperationalFailure(outcome.cause, t("The exam could not be refreshed.")));
    return outcome;
  }

  async function selectOption(optionId: string) {
    const token = currentToken();
    if (!token || readState.kind !== "ready") return;
    const projection = readState.projection;
    if (projection.question.interaction.type !== "choice_single") return;
    await performAction(async () => {
      setOperationError(null);
      try {
        await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response: { type: "choice_single", optionId } });
        if (isCurrent(token)) await refreshAfterAction(token);
      } catch (cause) {
        if (isCurrent(token)) setOperationError(describeOperationalFailure(cause, t("Answer could not be saved.")));
      }
    });
  }

  async function goToIndex(index: number): Promise<SimulationNavigatorSelectionResult> {
    const token = currentToken();
    if (!token || readState.kind !== "ready") return "save_failed";
    const targetIndex = Math.max(0, Math.min(readState.projection.total - 1, index));
    const result = await performAction(async (): Promise<SimulationNavigatorSelectionResult> => {
      setOperationError(null);
      try {
        await navigateCertificationExamTo(targetIndex);
        if (!isCurrent(token)) return "save_failed";
        const outcome = await readOwner.refresh(token, "interval");
        if (outcome.kind === "ready" || outcome.kind === "expired") {
          publishReadOutcome(token, outcome);
          return "navigated";
        }
        return settleCommittedExamNavigation(outcome, (failedRefresh) => {
          if (!isCurrent(token)) return;
          const detail = failedRefresh.kind === "unavailable"
            ? describeOperationalFailure(failedRefresh.cause, t("The exam could not be refreshed."))
            : t("The current exam question could not be confirmed.");
          setOperationError(null);
          setReadState({
            kind: "refresh_error",
            reason: `${t("Question navigation was saved, but the current exam question could not be loaded.")} ${detail}`,
            requestKey: token.requestKey,
          });
        });
      } catch (cause) {
        if (isCurrent(token)) setOperationError(describeOperationalFailure(cause, t("Exam navigation failed.")));
        return "save_failed";
      }
    });
    return result ?? "save_failed";
  }

  async function retryExamRefresh() {
    const token = currentToken();
    if (!token || readState.kind !== "refresh_error") return;
    await performAction(async () => {
      const outcome = await readOwner.refresh(token, "interval");
      if (outcome.kind === "ready" || outcome.kind === "expired") {
        publishReadOutcome(token, outcome);
        return;
      }
      if (!isCurrent(token)) return;
      const detail = outcome.kind === "unavailable"
        ? describeOperationalFailure(outcome.cause, t("The exam could not be refreshed."))
        : t("The current exam question could not be confirmed.");
      setReadState({
        kind: "refresh_error",
        reason: `${t("Question navigation was saved, but the current exam question could not be loaded.")} ${detail}`,
        requestKey: token.requestKey,
      });
    });
  }

  async function toggleFlag() {
    const token = currentToken();
    if (!token || readState.kind !== "ready") return;
    const occurrenceId = readState.projection.occurrenceId;
    await performAction(async () => {
      setOperationError(null);
      try {
        await toggleCertificationExamFlag(occurrenceId);
        if (isCurrent(token)) await refreshAfterAction(token);
      } catch (cause) {
        if (isCurrent(token)) setOperationError(describeOperationalFailure(cause, t("Question flag could not be saved.")));
      }
    });
  }

  async function finishExam() {
    const token = currentToken();
    if (!token) return;
    await performAction(async () => {
      setOperationError(null);
      try {
        const sessionId = await finalizeCertificationExam();
        if (!isCurrent(token)) return;
        readOwner.invalidate(token);
        navigation.replace(ROUTES.RESULT, { sessionId });
      } catch (cause) {
        if (!isCurrent(token)) return;
        const expiredSessionId = cause instanceof CertificationExamExpiredError ? cause.sessionId : null;
        if (expiredSessionId) {
          readOwner.invalidate(token);
          navigation.replace(ROUTES.RESULT, { sessionId: expiredSessionId });
        } else {
          setOperationError(describeOperationalFailure(cause, t("Exam finalization failed.")));
        }
      }
    });
  }

  if (readState.requestKey !== requestKey || readState.kind === "pending") return <ExamLoadingSkeleton />;
  if (readState.kind === "conflict") {
    return <Screen edges={["top", "bottom"]}><EmptyState title={t("Another session is active")} description={t("The expected Cloud exam is no longer the active session.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (readState.kind === "error") {
    return <Screen edges={["top", "bottom"]}><EmptyState title={t("Exam unavailable")} description={readState.reason} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (readState.kind === "refresh_error") {
    return <Screen edges={["top", "bottom"]}>
      <EmptyState title={t("Exam question could not be loaded")} description={readState.reason} actionLabel={t("Retry exam refresh")} onActionPress={() => void retryExamRefresh()} />
      <Button disabled={actionPending} onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button>
    </Screen>;
  }

  const { projection } = readState;
  const deadline = projection.session.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") {
    return <Screen edges={["top", "bottom"]}><EmptyState title={t("Exam unavailable")} description={t("The immutable exam deadline is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  const remainingMs = Math.max(0, Date.parse(deadline) - Date.parse(projection.now));
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1_000);
  const remainingLabel = `${remainingMinutes}:${String(remainingSeconds).padStart(2, "0")}`;
  const timer = {
    accessibilityLabel: `${t("Time remaining")}: ${remainingLabel}`,
    label: `${t("Time remaining")}: ${remainingLabel}`,
  };
  const selectedOptionId = projection.response?.type === "choice_single" ? projection.response.optionId : null;
  const answered = new Set(Object.keys(projection.draft.responsesByOccurrenceId));
  const unansweredCount = projection.session.itemOrder.filter((item) => !answered.has(item.occurrenceId)).length;
  const interaction = projection.question.interaction;
  if (interaction.type !== "choice_single") {
    return <Screen edges={["top", "bottom"]}><EmptyState title={t("Exam unavailable")} description={t("This exam question type is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }

  return (
    <>
      <SessionShell
        actionBar={(
          <View style={styles.actionBar}>
            <View style={styles.examActions}>
              <Button disabled={actionPending} onPress={() => setNavigatorVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "navigator")} variant="secondary">{t("Question navigator")}</Button>
              <Button disabled={actionPending} onPress={() => void toggleFlag()} testID={runtimeSelectors.simulation.action(projection.session.id, "flag")} variant="secondary">{t(projection.flaggedOccurrenceIds.includes(projection.occurrenceId) ? "Remove flag" : "Flag question")}</Button>
            </View>
            <View style={styles.navigationActions}>
              <Button disabled={actionPending || projection.ordinal === 1} onPress={() => void goToIndex(projection.ordinal - 2)} style={styles.navigationButton} testID={runtimeSelectors.simulation.action(projection.session.id, "previous")} variant="secondary">{t("Previous")}</Button>
              <Button disabled={actionPending || projection.ordinal === projection.total} onPress={() => void goToIndex(projection.ordinal)} style={styles.navigationButton} testID={runtimeSelectors.simulation.action(projection.session.id, "next")} variant="secondary">{t("Next")}</Button>
            </View>
            <Button disabled={actionPending} onPress={() => setFinishVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "finish")}>{t("Finish exam")}</Button>
          </View>
        )}
        layout="practice"
        modeLabel={t("Certification Exam Simulation")}
        position={{ accessibilityLabel: `${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`, label: `${projection.ordinal} / ${projection.total}` }}
        positionTestID={runtimeSelectors.session.counter(projection.session.id, projection.ordinal, projection.total)}
        progress={projection.ordinal / projection.total}
        rootTestID={runtimeSelectors.simulation.root(projection.session.id)}
        timer={timer}
        timerTestID={runtimeSelectors.session.timer(projection.session.id)}
      >
        {operationError ? <View accessible accessibilityLabel={operationError} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorNotice}><Text maxFontSizeMultiplier={2} style={styles.errorText}>{operationError}</Text></View> : null}
        <PracticeQuestionCard question={{ constraints: projection.question.constraints, itemId: projection.question.questionId, prompt: projection.question.prompt }} />
        <View style={styles.options}>
          {interaction.options.map((option, index) => {
            const selected = selectedOptionId === option.optionId;
            return <AnswerOption
              accessibilityLabel={option.text}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: actionPending }}
              disabled={actionPending}
              key={option.optionId}
              letter={String.fromCharCode(65 + index)}
              onPress={() => void selectOption(option.optionId)}
              state={selected ? "selected" : "default"}
              testID={runtimeSelectors.simulation.option(projection.question.questionId, option.optionId)}
              text={option.text}
            />;
          })}
        </View>
      </SessionShell>
      <SimulationQuestionNavigator
        onDismiss={() => setNavigatorVisible(false)}
        onOccurrencePress={(occurrenceId) => goToIndex(projection.session.itemOrder.findIndex((item) => item.occurrenceId === occurrenceId))}
        positions={projection.session.itemOrder.map((item, index) => ({
          occurrenceId: item.occurrenceId,
          answered: answered.has(item.occurrenceId),
          state: index === projection.session.currentItemIndex ? "current" : answered.has(item.occurrenceId) ? "answered" : "unanswered",
          flagged: projection.flaggedOccurrenceIds.includes(item.occurrenceId),
        }))}
        visible={navigatorVisible}
      />
      <SettingsDialog
        closeLabel={t("Continue simulation")}
        message={`${unansweredCount} ${t("unanswered")}. ${t("Unanswered questions receive zero points.")}`}
        onClose={() => setFinishVisible(false)}
        onPrimaryAction={() => { setFinishVisible(false); void finishExam(); }}
        primaryActionLabel={t("Finish exam")}
        secondaryActionLabel={t("Continue simulation")}
        title={t("Finish with unanswered questions?")}
        visible={finishVisible}
      />
    </>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actionBar: { gap: spacing.md },
  examActions: { gap: spacing.sm },
  errorNotice: { backgroundColor: palette.elevatedSurface, borderColor: palette.warning, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  errorText: { ...typography.small, color: palette.warning },
  loadingAction: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, flex: 1 },
  loadingActions: { flexDirection: "row", gap: spacing.sm },
  loadingHeading: { width: "54%" },
  loadingLine: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1 },
  loadingQuestion: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  loadingQuestionLine: { width: "92%" },
  loadingQuestionLineShort: { width: "66%" },
  loadingQuestionTitle: { width: "34%" },
  loadingResponse: { gap: spacing.sm },
  loadingResponseRow: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, width: "100%" },
  loadingRoot: { gap: spacing.xl },
  loadingScreen: { gap: spacing.md },
  loadingShapes: { gap: spacing.xl },
  navigationActions: { flexDirection: "row", gap: spacing.sm },
  navigationButton: { flex: 1 },
  options: { gap: spacing.sm },
});
