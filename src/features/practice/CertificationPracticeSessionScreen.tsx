import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  abandonCertificationSession,
  advanceCertificationPracticeSession,
  completeCertificationPracticeSession,
  enterCertificationPracticeForeground,
  getCertificationPracticeProjection,
  leaveCertificationPracticeForeground,
  openCertificationPracticeSession,
  recoverCertificationPracticeAbandonment,
  recoverCertificationPracticeCompletion,
  recoverCertificationPracticeCompletionCheckpoint,
  recoverCertificationPracticeOperation,
  recoverCertificationPreAbandonmentCheckpoint,
  retryCertificationAbandonmentAfterCheckpointFailure,
  retryCertificationPracticeCompletionCheckpoint,
  subscribeCertificationPracticeOperation,
  subscribeCertificationPracticeProjectionRefresh,
  submitCertificationPracticeResponse,
  type CertificationPracticeProjection,
} from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { AppShellHeader, Button, EmptyState, LoadingState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { isCertificationPracticeModeId } from "../../tracks/certification";
import { useAppPreferences } from "../../preferences";
import type { PracticeSessionRouteParams } from "./sessionConfig";
import type { TrainingSession } from "../../domain";
import { getTrackRegistration } from "../../domain";
import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";
import { allowsPracticeResponseEditing, formatPracticeElapsedTime, getPracticePrimaryAction, noticeForPracticeCompletionCheckpoint, noticeForPracticeOperation, reconcilePracticeChoiceSelection, type PracticeChoiceSelection, type PracticeSurfacePhase } from "./practiceSessionPresentation";
import { PracticeSessionSurface } from "./PracticeSessionSurface";
import { getCertificationMode } from "../../tracks/certification";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;
type CompletionFailure = Exclude<Awaited<ReturnType<typeof completeCertificationPracticeSession>>, { kind: "verified" }>;

/** Certification practice runner backed solely by the generic lifecycle facade. */
export function CertificationPracticeSessionScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const [projection, setProjection] = useState<CertificationPracticeProjection | null>(null);
  const [selection, setSelection] = useState<PracticeChoiceSelection | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<TrainingSession | null>(null);
  const [completionFailure, setCompletionFailure] = useState<CompletionFailure | null>(null);
  const [completionOperation, setCompletionOperation] = useState<Extract<PracticeDurableOperationState, { kind: "completing" | "completion_failed" | "completed" }> | null>(null);
  const [recoveryFailure, setRecoveryFailure] = useState<string | null>(null);
  const [exit, setExit] = useState<"none" | "leave">("none");
  const [exitFailure, setExitFailure] = useState<"pause" | "retry_abandon" | "retry_checkpoint" | "recover_abandon" | "recover_operation" | null>(null);
  const permitRouteExit = useRef(false);
  const recoveryInFlight = useRef(false);
  const mode = isCertificationPracticeModeId(route.params.mode) ? route.params.mode : null;

  const applyProjection = (next: CertificationPracticeProjection) => {
    setProjection(next);
    setSelection((current) => reconcilePracticeChoiceSelection({
      current,
      durableSelectedOptionIds: next.response?.value.selectedOptionIds ?? null,
      editable: allowsPracticeResponseEditing(next.operation.kind),
      occurrenceId: next.occurrenceId,
      sessionId: next.session.id,
    }));
    setSelectionError(null);
  };
  const refresh = async () => {
    const next = await getCertificationPracticeProjection();
    applyProjection(next);
  };
  useEffect(() => {
    if (!mode) return;
    let live = true;
    let foregroundEntered = false;
    setCompletionFailure(null);
    setCompletionOperation(null);
    setRecoveryFailure(null);
    void (async () => {
      try {
    const opened = await openCertificationPracticeSession(mode === "certification-diagnostic-baseline" || mode === "certification-quick-review" ? { modeId: mode, trackId: route.params.trackId, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : mode === "certification-scenario-practice" ? { modeId: mode, trackId: route.params.trackId, requestedLength: route.params.sessionLength, competency: route.params.competencyId, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : mode === "certification-weak-area-review" || mode === "certification-mixed-practice" ? { modeId: mode, trackId: route.params.trackId, requestedLength: route.params.sessionLength, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : { modeId: mode, trackId: route.params.trackId, requestedLength: route.params.sessionLength, domain: route.params.topicId as never, source: route.params.source, expectedSessionId: route.params.expectedSessionId });
        if (opened.kind === "active_session_conflict") { if (live) setConflict(opened.session); return; }
        await enterCertificationPracticeForeground();
        foregroundEntered = true;
        if (live) applyProjection(opened.projection);
      } catch (cause) { if (live) setError(describeOperationalFailure(cause, t("Cloud practice is unavailable."))); }
    })();
    return () => {
      live = false;
      if (foregroundEntered && !permitRouteExit.current) void leaveCertificationPracticeForeground().catch(() => undefined);
    };
  }, [mode, route.params]);

  useEffect(() => {
    if (!projection) return;
    const listener = AppState.addEventListener("change", (state) => {
      void (state === "active" ? enterCertificationPracticeForeground() : leaveCertificationPracticeForeground())
        .then(refresh)
        .catch((cause: unknown) => setError(describeOperationalFailure(cause, t("Cloud practice timer is unavailable."))));
    });
    return () => listener.remove();
  }, [projection?.session.id]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (permitRouteExit.current || !projection) return;
    event.preventDefault();
    setExit("leave");
  }), [navigation, projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    return subscribeCertificationPracticeProjectionRefresh((event) => {
      if (event.sessionId !== projection.session.id) return;
      void refresh().catch((cause: unknown) => setError(describeOperationalFailure(cause, t("Cloud practice timer is unavailable."))));
    });
  }, [projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    return subscribeCertificationPracticeOperation(projection.session.id, (operation) => {
      setCompletionOperation(operation.kind === "completing" || operation.kind === "completion_failed" || operation.kind === "completed" ? operation : null);
    });
  }, [projection?.session.id]);

  if (!mode) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Certification Practice unavailable")} description={t("This practice mode is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (conflict) {
    const ordinaryCertification = getTrackRegistration(conflict.trackId).familyId === "certification" && isCertificationPracticeModeId(conflict.modeId);
    const certificationExam = getTrackRegistration(conflict.trackId).familyId === "certification" && conflict.modeId === "certification-exam-simulation";
    const continueActive = () => {
      if (ordinaryCertification) navigation.replace(ROUTES.PRACTICE_SESSION, { ...route.params, mode: conflict.modeId, expectedSessionId: conflict.id });
      else if (certificationExam) navigation.replace(ROUTES.EXAM, { expectedSessionId: conflict.id });
      else navigation.navigate(ROUTES.HOME);
    };
    return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Another session is active")} description={t("Resume your active session, or return to Practice.")} actionLabel={t(ordinaryCertification ? "Continue active practice" : certificationExam ? "Continue active exam" : "Go home")} onActionPress={continueActive} /><Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button></Screen>;
  }
  if (error) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Cloud Practice unavailable")} description={t(error)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!projection) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><LoadingState title={t("Preparing session")} /></Screen>;
  const multiple = projection.question.type === "multiple";
  const feedback = projection.feedback;
  const renderedCompletionOperation = completionFailure?.kind === "retry_completion" || completionFailure?.kind === "recover_completion" ? completionFailure.operation : completionOperation;
  const phase: PracticeSurfacePhase = exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint"
    ? "abandonment_failed_before_journal"
    : exitFailure === "recover_abandon" || exitFailure === "recover_operation"
      ? "abandonment_recovery_required"
      : renderedCompletionOperation?.kind ?? projection.operation.kind;
  const editable = !exitFailure && !completionFailure && allowsPracticeResponseEditing(projection.operation.kind);
  const operationNotice = noticeForPracticeOperation(renderedCompletionOperation ?? projection.operation);
  const notice = recoveryFailure
    ? { message: recoveryFailure, tone: "error" as const }
    : selectionError
      ? { message: selectionError, tone: "error" as const }
    : exitFailure === "pause"
      ? { message: t("The session could not be paused. It remains active; try leaving again."), tone: "error" as const }
      : exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint"
        ? { message: t(exitFailure === "retry_checkpoint" ? "We couldn't save the session time. Try again to end the session." : "We couldn't end the session. Try again."), tone: "error" as const }
      : exitFailure === "recover_abandon"
          ? { message: t("We couldn't end the session yet. Restore the session to continue."), tone: "error" as const }
          : exitFailure === "recover_operation"
            ? { message: t("We couldn't finish updating the session time. Restore it before ending the session."), tone: "error" as const }
          : completionFailure?.kind === "retry_final_checkpoint"
            ? noticeForPracticeCompletionCheckpoint("retry")
            : completionFailure?.kind === "recover_final_checkpoint"
              ? noticeForPracticeCompletionCheckpoint("recover")
              : operationNotice;
  const canRecover = !exitFailure && !completionFailure && "error" in projection.operation && projection.operation.error.allowedAction === "recover";
  const canAdvance = !exitFailure && !completionFailure && (projection.operation.kind === "feedback" || projection.operation.kind === "advance_failed");
  const selected = selection?.sessionId === projection.session.id && selection.occurrenceId === projection.occurrenceId ? selection.selectedOptionIds : [];
  const toggle = (id: string) => setSelection((current) => {
    const currentIds = current?.sessionId === projection.session.id && current.occurrenceId === projection.occurrenceId ? current.selectedOptionIds : [];
    const selectedOptionIds = multiple ? (currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]) : [id];
    return Object.freeze({ sessionId: projection.session.id, occurrenceId: projection.occurrenceId, selectedOptionIds: Object.freeze(selectedOptionIds) });
  });
  const refreshAfterCommand = async (message: string) => {
    try { await refresh(); }
    catch (cause) { setError(describeOperationalFailure(cause, t(message))); }
  };
  const submit = async () => {
    if (!editable) return;
    if (!selected.length) { setSelectionError(t("Choose an answer before submitting.")); return; }
    try { await submitCertificationPracticeResponse({ kind: "option_selection", selectedOptionIds: selected }); }
    catch { await refreshAfterCommand("We couldn't display your answer. Try again."); return; }
    await refreshAfterCommand("We couldn't display your answer. Try again.");
  };
  const next = async () => {
    if (!canAdvance) return;
    if (projection.operation.kind === "advance_failed") {
      try { await advanceCertificationPracticeSession(); }
      catch { await refreshAfterCommand("We couldn't open the next question. Try again."); return; }
      await refreshAfterCommand("We couldn't open the next question. Try again.");
      return;
    }
    if (projection.ordinal === projection.total) {
      try {
        await applyCompletionResult(await completeCertificationPracticeSession());
      }
      catch (cause) { setSelectionError(describeOperationalFailure(cause, t("We couldn't finish the session. Try again."))); }
      return;
    }
    try { await advanceCertificationPracticeSession(); }
    catch { await refreshAfterCommand("We couldn't open the next question. Try again."); return; }
    await refreshAfterCommand("We couldn't open the next question. Try again.");
  };
  const recover = async () => {
    if (!canRecover || recoveryInFlight.current) return;
    recoveryInFlight.current = true;
    try {
      await recoverCertificationPracticeOperation();
      await refresh();
      setRecoveryFailure(null);
    } catch {
      setRecoveryFailure(t("Your answer is still saved on this device. We couldn't restore this question yet. Try recovery again."));
    } finally {
      recoveryInFlight.current = false;
    }
  };
  const applyCompletionResult = async (result: Awaited<ReturnType<typeof completeCertificationPracticeSession>>) => {
    if (result.kind !== "verified") { setCompletionFailure(result); return; }
    permitRouteExit.current = true;
    navigation.replace(ROUTES.RESULT, { sessionId: result.value.session.id });
  };
  const retryOrRecoverCompletion = async () => {
    if (!completionFailure) return;
    setSelectionError(null);
    try {
      if (completionFailure.kind === "retry_final_checkpoint") {
        applyProjection(await retryCertificationPracticeCompletionCheckpoint(completionFailure.expectedSessionId));
        setCompletionFailure(null);
        return;
      }
      if (completionFailure.kind === "recover_final_checkpoint") {
        applyProjection(await recoverCertificationPracticeCompletionCheckpoint(completionFailure.expectedSessionId));
        setCompletionFailure(null);
        return;
      }
      if (completionFailure.kind === "recover_completion") {
        const result = await recoverCertificationPracticeCompletion(completionFailure.expectedSessionId);
        permitRouteExit.current = true;
        navigation.replace(ROUTES.RESULT, { sessionId: result.session.id });
        return;
      }
      await applyCompletionResult(await completeCertificationPracticeSession());
    } catch (cause) { setSelectionError(describeOperationalFailure(cause, t("We couldn't finish the session. Try again."))); }
  };
  const leaveRunner = () => {
    permitRouteExit.current = true;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.PRACTICE_HUB);
  };
  const pause = async () => {
    setExit("none");
    setExitFailure(null);
    try { await leaveCertificationPracticeForeground(); }
    catch { setExitFailure("pause"); return; }
    leaveRunner();
  };
  const endSession = async () => {
    setExit("none");
    setExitFailure(null);
    try {
      const result = await abandonCertificationSession(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) {
      setError(describeOperationalFailure(cause, t("We couldn't end the session. Try again.")));
    }
  };
  const recoverAbandonment = async () => {
    try { await recoverCertificationPracticeAbandonment(projection.session.id); }
    catch { setExitFailure("recover_abandon"); return; }
    permitRouteExit.current = true;
    navigation.replace(ROUTES.PRACTICE_HUB);
  };
  const recoverActiveOperationBeforeAbandonment = async () => {
    try { await recoverCertificationPreAbandonmentCheckpoint(projection.session.id); }
    catch { setExitFailure("recover_operation"); return; }
    setExitFailure(null);
    await refreshAfterCommand("We couldn't display the updated session time. Try again.");
  };
  const retryCheckpointAndEnd = async () => {
    try {
      const result = await retryCertificationAbandonmentAfterCheckpointFailure(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) { setError(describeOperationalFailure(cause, t("We couldn't save the session time. Try again."))); }
  };
  const retry = exitFailure === "retry_abandon"
    ? endSession
    : exitFailure === "retry_checkpoint"
      ? retryCheckpointAndEnd
    : exitFailure === "recover_abandon"
      ? recoverAbandonment
      : exitFailure === "recover_operation"
        ? recoverActiveOperationBeforeAbandonment
      : completionFailure
        ? retryOrRecoverCompletion
      : canRecover
        ? recover
        : undefined;
  const primaryAction = completionFailure
    ? undefined
    : getPracticePrimaryAction({ feedbackTiming: "afterEachAnswer", hasLocalResponse: editable ? selected.length > 0 : false, isFinalPosition: projection.ordinal === projection.total, phase }) ?? undefined;
  return <PracticeSessionSurface
    allowLeave={!completionFailure}
    exit={{ kind: exit }}
    feedback={feedback ? { details: feedback.details, reason: feedback.reason, result: feedback.result } : undefined}
    feedbackItem={projection.session.itemOrder[projection.session.currentItemIndex]?.item}
    isFinalPosition={projection.ordinal === projection.total}
    modeLabel={t(getCertificationMode(mode).title)}
    notice={notice}
    onAbandon={() => void endSession()}
    onChoicePress={(optionId) => { setSelectionError(null); toggle(optionId); }}
    onComplexityValuePress={() => undefined}
    onConfirmLeave={() => void pause()}
    onDismissExit={() => setExit("none")}
    onOrderingMove={() => undefined}
    onPrimaryAction={() => void (editable ? submit() : next())}
    onRequestLeave={() => setExit("leave")}
    onRetry={retry ? () => void retry() : undefined}
    phase={phase}
    position={{ accessibilityLabel: `${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`, label: `${projection.ordinal} ${t("of")} ${projection.total}` }}
    primaryAction={primaryAction}
    progress={projection.ordinal / projection.total}
    question={{ itemId: projection.question.id, prompt: projection.question.question, responseControl: { kind: "choice", options: projection.question.options.map((option) => ({ id: option.id, state: selected.includes(option.id) ? "selected" : "neutral", text: option.text })), selectionMode: multiple ? "multiple" : "single" } }}
    retryLabel={exitFailure === "retry_abandon" ? "Try ending session again" : exitFailure === "retry_checkpoint" ? "Retry saving time" : exitFailure === "recover_abandon" ? "Restore session" : exitFailure === "recover_operation" ? "Restore session time" : completionFailure ? completionFailure.kind === "retry_completion" ? "Finish session" : completionFailure.kind === "recover_completion" ? "Restore session result" : completionFailure.kind === "retry_final_checkpoint" ? "Retry saving time" : "Restore session time" : canRecover ? "Restore session" : undefined}
    retryVariant={completionFailure || canRecover ? "primary" : "secondary"}
    runtimeIdentity={{ actualLength: projection.session.actualLength, feedbackTiming: "afterEachAnswer", itemId: projection.question.id, modeId: projection.session.modeId, ordinal: projection.ordinal, roadmapNodeId: projection.question.domain, sessionId: projection.session.id, trackId: projection.session.trackId }}
    timer={{ accessibilityLabel: `${t("Active foreground time")} ${formatPracticeElapsedTime(projection.elapsedForegroundMs)}`, label: formatPracticeElapsedTime(projection.elapsedForegroundMs) }}
  />;
}
