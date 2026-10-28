import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  CertificationExamExpiredError,
  finalizeCertificationExam,
  getCertificationExamProjection,
  recoverCertificationExamOperation,
  reconcileCertificationExamOperation,
  retryCertificationExamDraftSave,
  navigateCertificationExamTo,
  resumeExpectedCertificationExam,
  saveCertificationExamResponse,
  startCertificationExam,
  toggleCertificationExamFlag,
  type CertificationExamProjection,
} from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { certificationQuestionPresentation } from "../../application/certification/certificationQuestionPresentation";
import { Button, EmptyState, Icon, Screen, SettingsDialog, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants";
import type { CanonicalQuestionResponse } from "../../content/canonical";
import { ExamFormatFamiliarization } from "./ExamFormatFamiliarization";
import { ExamResponseControls, type ExamResponseRenderer } from "./ExamResponseControls";
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
import { shouldClearPendingExamWrite, type PendingExamWrite } from "./examPendingWrite";

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
  const requestKey = `${route.params.trackId}:${route.params?.expectedSessionId ?? "new-exam"}`;
  const trackIdRef = useRef(route.params.trackId);
  trackIdRef.current = route.params.trackId;
  const [formatsAcknowledgedFor, setFormatsAcknowledgedFor] = useState<string | null>(null);
  const formatsReady = route.params.trackId !== "claude-certified-architect-professional-certification" || Boolean(route.params.expectedSessionId) || formatsAcknowledgedFor === route.params.trackId;
  const [readState, setReadState] = useState<ExamReadState>({ kind: "pending", requestKey });
  const [operationError, setOperationError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const [finishVisible, setFinishVisible] = useState(false);
  const [pendingExamWrite, setPendingExamWrite] = useState<PendingExamWrite | null>(null);
  const readOwnerRef = useRef<ExamReadOwner<CertificationExamProjection> | null>(null);
  const actionLaneRef = useRef<ExamActionLane | null>(null);
  const activeTokenRef = useRef<ExamReadOwnerToken | null>(null);

  if (!readOwnerRef.current) {
    readOwnerRef.current = createExamReadOwner({
      expiredSessionId: (cause) => cause instanceof CertificationExamExpiredError ? cause.sessionId : null,
      getProjection: () => getCertificationExamProjection(trackIdRef.current),
      resumeExpected: (sessionId) => resumeExpectedCertificationExam(trackIdRef.current, sessionId),
      start: () => startCertificationExam(trackIdRef.current),
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
      if (pendingExamWrite && shouldClearPendingExamWrite(pendingExamWrite, outcome)) setPendingExamWrite(null);
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
    if (!formatsReady) return;
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
  }, [formatsReady, readOwner, requestKey, route.params?.expectedSessionId]);

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

  async function changeResponse(response: CanonicalQuestionResponse | null) {
    const token = currentToken();
    if (!token || readState.kind !== "ready" || isExamResolutionRequired(readState.projection)) return;
    const projection = readState.projection;
    const attempted: PendingExamWrite = { kind: "response", occurrenceId: projection.occurrenceId, response };
    setPendingExamWrite(attempted);
    await performAction(async () => {
      setOperationError(null);
      try {
        await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response });
        setPendingExamWrite(null);
        if (isCurrent(token)) await refreshAfterAction(token);
      } catch (cause) {
        if (isCurrent(token)) {
          const refreshed = await readOwner.refresh(token, "interval");
          publishReadOutcome(token, refreshed);
          if (shouldClearPendingExamWrite(attempted, refreshed)) setPendingExamWrite(null);
          setOperationError(describeOperationalFailure(cause, t("Answer could not be saved.")));
        }
      }
    });
  }

  async function goToIndex(index: number): Promise<SimulationNavigatorSelectionResult> {
    const token = currentToken();
    if (!token || readState.kind !== "ready" || isExamResolutionRequired(readState.projection)) return "save_failed";
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
    if (!token || readState.kind !== "ready" || isExamResolutionRequired(readState.projection)) return;
    const occurrenceId = readState.projection.occurrenceId;
    const attempted: PendingExamWrite = { kind: "flag", occurrenceId, flagged: !readState.projection.flaggedOccurrenceIds.includes(occurrenceId) };
    setPendingExamWrite(attempted);
    await performAction(async () => {
      setOperationError(null);
      try {
        await toggleCertificationExamFlag(occurrenceId);
        setPendingExamWrite(null);
        if (isCurrent(token)) await refreshAfterAction(token);
      } catch (cause) {
        if (isCurrent(token)) {
          const refreshed = await readOwner.refresh(token, "interval");
          publishReadOutcome(token, refreshed);
          if (shouldClearPendingExamWrite(attempted, refreshed)) setPendingExamWrite(null);
          setOperationError(describeOperationalFailure(cause, t("Question flag could not be saved.")));
        }
      }
    });
  }

  async function finishExam() {
    const token = currentToken();
    if (!token || (readState.kind === "ready" && isExamResolutionRequired(readState.projection))) return;
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

  async function reconcileExamSave() {
    const token = currentToken();
    if (!token || readState.kind !== "ready" || !isExamOperationUnconfirmed(readState.projection)) return;
    await performAction(async () => {
      const outcome = await reconcileCertificationExamOperation();
      if (!isCurrent(token)) return;
      if (outcome !== "verified") {
        setOperationError(t("The saved response could not be confirmed."));
        return;
      }
      const refreshed = await readOwner.refresh(token, "interval");
      if (refreshed.kind === "ready" && pendingExamWrite) {
        if (shouldClearPendingExamWrite(pendingExamWrite, refreshed)) setPendingExamWrite(null);
        else {
          setOperationError(t("The saved response could not be confirmed."));
          publishReadOutcome(token, refreshed);
          return;
        }
      }
      publishReadOutcome(token, refreshed);
    });
  }

  async function retryExamSave() {
    const token = currentToken();
    if (!token || readState.kind !== "ready" || !pendingExamWrite || readState.projection.operation.kind !== "save_failed" || readState.projection.operation.error.allowedAction !== "retry_same_command") return;
    await performAction(async () => {
      try {
        await retryCertificationExamDraftSave();
        setPendingExamWrite(null);
        if (isCurrent(token)) await refreshAfterAction(token);
      } catch (cause) {
        if (isCurrent(token)) {
          const refreshed = await readOwner.refresh(token, "interval");
          publishReadOutcome(token, refreshed);
          setOperationError(describeOperationalFailure(cause, t("Answer could not be saved.")));
        }
      }
    });
  }

  async function recoverExamOperation() {
    const token = currentToken();
    if (!token || readState.kind !== "ready") return;
    await performAction(async () => {
      const completedSessionId = await recoverCertificationExamOperation();
      if (!isCurrent(token)) return;
      if (completedSessionId) {
        readOwner.invalidate(token);
        navigation.replace(ROUTES.RESULT, { sessionId: completedSessionId });
        return;
      }
      await refreshAfterAction(token);
    });
  }

  const headerProjection = readState.requestKey === requestKey && readState.kind === "ready" ? readState.projection : null;
  const headerFlagged = headerProjection ? (pendingExamWrite?.kind === "flag" && pendingExamWrite.occurrenceId === headerProjection.occurrenceId ? pendingExamWrite.flagged : headerProjection.flaggedOccurrenceIds.includes(headerProjection.occurrenceId)) : false;
  const headerFlagDisabled = actionPending || !headerProjection || isExamResolutionRequired(headerProjection);
  useLayoutEffect(() => { navigation.setOptions({ title: "", headerRight: undefined }); }, [navigation]);
  const flagAction = headerProjection ? <Pressable
    accessibilityLabel={t(headerFlagged ? "Remove flag" : "Flag question")}
    accessibilityRole="button"
    accessibilityState={{ selected: headerFlagged, disabled: headerFlagDisabled }}
    disabled={headerFlagDisabled}
    onPress={() => void toggleFlag()}
    style={({ pressed }) => [styles.flagAction, pressed && !headerFlagDisabled ? styles.pressed : null]}
    testID={runtimeSelectors.simulation.action(headerProjection.session.id, "flag")}
  ><Icon color={headerFlagDisabled ? styles.flagDisabled.color : headerFlagged ? styles.flagSelected.color : styles.flagDefault.color} name="flag" size={18} /></Pressable> : null;

  if (!formatsReady) return <ExamFormatFamiliarization key={route.params.trackId} onStart={() => setFormatsAcknowledgedFor(route.params.trackId)} trackId={route.params.trackId} />;
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
  const questionPresentation = certificationQuestionPresentation(projection.session.trackId);
  const saveUnconfirmed = isExamSaveUnconfirmed(projection);
  const resolutionRequired = isExamResolutionRequired(projection);
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
    label: `${t("Time remaining")}\n${remainingLabel}`,
  };
  const response = pendingExamWrite?.kind === "response" && pendingExamWrite.occurrenceId === projection.occurrenceId ? pendingExamWrite.response : projection.response as CanonicalQuestionResponse | null;
  const completion = projection.responseCompletionByOccurrenceId;
  const answered = new Set(Object.entries(completion).filter(([, state]) => state === "complete").map(([id]) => id));
  const incompleteCount = Object.values(completion).filter((state) => state === "incomplete").length;
  const unansweredCount = projection.total - answered.size;
  const renderer = (projection.interaction.model as { renderer?: ExamResponseRenderer }).renderer;
  if (!renderer || !["choice_single", "choice_multiple", "decision_matrix"].includes(projection.interaction.interactionType)) {
    return <Screen edges={["top", "bottom"]}><EmptyState title={t("Exam unavailable")} description={t("This exam question type is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }

  return (
    <>
      <SessionShell
        actionBar={(
          <View style={styles.navigationActions}>
            <Button disabled={actionPending || resolutionRequired || projection.ordinal === 1} onPress={() => void goToIndex(projection.ordinal - 2)} style={styles.navigationButton} testID={runtimeSelectors.simulation.action(projection.session.id, "previous")} variant="secondary">{t("Previous")}</Button>
            {projection.ordinal === projection.total ? (
              <Button disabled={actionPending || resolutionRequired} onPress={() => setFinishVisible(true)} style={styles.navigationButton} testID={runtimeSelectors.simulation.action(projection.session.id, "finish")}>{t("Finish exam")}</Button>
            ) : (
              <Button disabled={actionPending || resolutionRequired} onPress={() => void goToIndex(projection.ordinal)} style={styles.navigationButton} testID={runtimeSelectors.simulation.action(projection.session.id, "next")}>{t("Next")}</Button>
            )}
          </View>
        )}
        layout="exam"
        onPositionPress={() => setNavigatorVisible(true)}
        positionDisabled={actionPending || resolutionRequired}
        positionAccessibilityLabel={`${t("Question navigator")}, ${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`}
        position={{ accessibilityLabel: `${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`, label: `${projection.ordinal} / ${projection.total}` }}
        positionTestID={runtimeSelectors.session.counter(projection.session.id, projection.ordinal, projection.total)}
        progress={projection.ordinal / projection.total}
        rootTestID={runtimeSelectors.simulation.root(projection.session.id)}
        timer={timer}
        timerTestID={runtimeSelectors.session.timer(projection.session.id)}
      >
        {isExamOperationUnconfirmed(projection) ? <View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorNotice}><Text maxFontSizeMultiplier={2} style={styles.errorText}>{t(saveUnconfirmed ? "The saved response could not be confirmed." : "The saved exam action could not be confirmed.")}</Text><Button disabled={actionPending} onPress={() => void reconcileExamSave()} variant="secondary">{t(saveUnconfirmed ? "Check saved response" : "Check saved exam action")}</Button></View> : null}
        {projection.operation.kind === "save_failed" && projection.operation.error.allowedAction === "retry_same_command" && pendingExamWrite ? <View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorNotice}><Text maxFontSizeMultiplier={2} style={styles.errorText}>{t("Couldn't save this response. Your current answer is still here.")}</Text><Button disabled={actionPending} onPress={() => void retryExamSave()} variant="secondary">{t("Retry save")}</Button></View> : null}
        {!isExamOperationUnconfirmed(projection) && resolutionRequired ? <View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorNotice}><Text maxFontSizeMultiplier={2} style={styles.errorText}>{t("The saved exam action needs to be restored before continuing.")}</Text><Button disabled={actionPending} onPress={() => void recoverExamOperation()} variant="secondary">{t("Restore saved exam action")}</Button></View> : null}
        {operationError && !saveUnconfirmed ? <View accessible accessibilityLabel={operationError} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorNotice}><Text maxFontSizeMultiplier={2} style={styles.errorText}>{operationError}</Text></View> : null}
        <PracticeQuestionCard question={{ itemId: projection.question.questionId, prompt: projection.question.prompt }} presentation={questionPresentation} questionLabelAction={flagAction} />
        <ExamResponseControls disabled={actionPending || resolutionRequired} interactionType={projection.interaction.interactionType} itemId={projection.question.questionId} onChange={(value) => void changeResponse(value)} renderer={renderer} requiredSelectionCount={projection.requiredSelectionCount} response={response} />
      </SessionShell>
      <SimulationQuestionNavigator
        finishAction={{
          disabled: actionPending || resolutionRequired,
          onPress: () => { setNavigatorVisible(false); setFinishVisible(true); },
          testID: runtimeSelectors.simulation.action(projection.session.id, "finish"),
        }}
        onDismiss={() => setNavigatorVisible(false)}
        onOccurrencePress={(occurrenceId) => goToIndex(projection.session.itemOrder.findIndex((item) => item.occurrenceId === occurrenceId))}
        positions={projection.session.itemOrder.map((item, index) => ({
          occurrenceId: item.occurrenceId,
          answered: answered.has(item.occurrenceId),
          state: index === projection.session.currentItemIndex ? "current" : answered.has(item.occurrenceId) ? "answered" : "unanswered",
          incomplete: completion[item.occurrenceId] === "incomplete",
          flagged: projection.flaggedOccurrenceIds.includes(item.occurrenceId),
        }))}
        visible={navigatorVisible && !resolutionRequired}
      />
      <SettingsDialog
        closeLabel={t("Continue simulation")}
        message={`${unansweredCount} ${t("unanswered")} (${incompleteCount} ${t("incomplete")}). ${t("Unanswered questions receive zero points.")}`}
        onClose={() => setFinishVisible(false)}
        onPrimaryAction={() => { setFinishVisible(false); void finishExam(); }}
        primaryActionLabel={t("Finish exam")}
        secondaryActionLabel={t("Continue simulation")}
        title={t("Finish with unanswered questions?")}
        visible={finishVisible && !resolutionRequired}
      />
    </>
  );
}

function isExamSaveUnconfirmed(projection: CertificationExamProjection): boolean {
  return projection.operation.kind === "save_failed" && projection.operation.error.allowedAction === "reconcile";
}

function isExamOperationUnconfirmed(projection: CertificationExamProjection): boolean {
  return "error" in projection.operation && projection.operation.error.allowedAction === "reconcile";
}

function isExamResolutionRequired(projection: CertificationExamProjection): boolean {
  if (isExamOperationUnconfirmed(projection)) return true;
  if ("error" in projection.operation && projection.operation.error.allowedAction === "recover") return true;
  return projection.operation.kind === "materializing" || projection.operation.kind === "verifying" || projection.operation.kind === "verified_pending_clear" || projection.operation.kind === "frozen";
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  flagAction: { alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 },
  flagDefault: { color: palette.textSecondary },
  flagSelected: { color: palette.danger },
  flagDisabled: { color: palette.textMuted },
  pressed: { opacity: 0.65 },
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
});
