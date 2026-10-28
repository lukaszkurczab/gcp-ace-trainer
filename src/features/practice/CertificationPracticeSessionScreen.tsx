import type { CanonicalQuestionResponse } from "../../content/canonical";
import { builtinPracticeResponseRenderers } from "./PracticeResponseControls";
import { CertificationStatementControls } from "./CertificationStatementControls";
import { toggleExamOption } from "../exam/examResponseSelection";
import { beginStartupSpan, markStartup } from "../../infrastructure/diagnostics/startupTrace";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove, type NavigationAction } from "@react-navigation/native";
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
  reconcileCertificationPracticeResponse,
  reconcileCertificationPracticeAbandonment,
  recoverCertificationPreAbandonmentCheckpoint,
  retryCertificationAbandonmentAfterCheckpointFailure,
  retryCertificationAbandonmentCommand,
  retryCertificationPracticeCompletionCheckpoint,
  retryCertificationPracticeResponse,
  subscribeCertificationPracticeOperation,
  subscribeCertificationPracticeProjectionRefresh,
  submitCertificationPracticeResponse,
  type CertificationPracticeProjection,
} from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { isCertificationPracticeModeId } from "../../tracks/certification";
import type { TrainingSession } from "../../domain";
import { getTrackRegistration } from "../../domain";
import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";
import { hasReachedPracticeActionProjection, allowsPracticeResponseEditing, buildPracticeResponseControl, describeSessionPreparationFailure, formatPracticeElapsedTime, getPracticePrimaryAction, noticeForPracticeCompletionCheckpoint, noticeForPracticeOperation, reconcilePracticeChoiceSelection, type PracticeChoiceSelection, type PracticeSurfacePhase } from "./practiceSessionPresentation";
import { PracticeSessionLoadingSkeleton, PracticeSessionSurface } from "./PracticeSessionSurface";
import { getCertificationMode } from "../../tracks/certification";
import { toCertificationQuestionViewModel } from "./canonicalQuestionViewModel";
import { buildCertificationPracticeTarget } from "./sessionConfig";
import { captureProfileReadFence } from "../../application/profileReadFence";

const certificationResponseBindings = new Map([...builtinPracticeResponseRenderers, ["decision_matrix", CertificationStatementControls] as const]);

type PendingPracticeAction = { owner: object; sessionId: string; occurrenceId: string; ordinal: number; nextOccurrenceId: string | null; phase: "submitting_before_journal" | "advancing" | "completing"; assertProfile: () => void; };

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;
type CompletionFailure = Exclude<Awaited<ReturnType<typeof completeCertificationPracticeSession>>, { kind: "verified" }>;

/** Certification practice runner backed solely by the generic lifecycle facade. */
export function CertificationPracticeSessionScreen({ navigation, route }: Props) {
  const { t } = useTranslation("common");
  const [projection, setProjection] = useState<CertificationPracticeProjection | null>(null);
  const [selection, setSelection] = useState<PracticeChoiceSelection | null>(null);
  const [statementSelection, setStatementSelection] = useState<Readonly<{ sessionId: string; occurrenceId: string; values: Readonly<Record<string, readonly string[]>> }> | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<TrainingSession | null>(null);
  const [completionFailure, setCompletionFailure] = useState<CompletionFailure | null>(null);
  const [completionOperation, setCompletionOperation] = useState<Extract<PracticeDurableOperationState, { kind: "completing" | "completion_failed" | "completed" }> | null>(null);
  const [recoveryFailure, setRecoveryFailure] = useState<string | null>(null);
  const [exit, setExit] = useState<"none" | "leave">("none");
  const [exitFailure, setExitFailure] = useState<"pause" | "retry_abandon" | "retry_checkpoint" | "recover_abandon" | "recover_operation" | "reconcile_abandon" | null>(null);
  const permitRouteExit = useRef(false);
  const pendingRouteAction = useRef<NavigationAction | null>(null);
  const actionPending = useRef(false);
  const [pendingAction, setPendingAction] = useState<PendingPracticeAction | null>(null);
  const actionToken = useRef<PendingPracticeAction | null>(null);
  const pendingActionProjection = useRef<{ token: PendingPracticeAction; projection: CertificationPracticeProjection } | null>(null);
  const routeOwner = useRef({ params: route.params, key: route.key });
  const projectionRef = useRef(projection);
  const projectionFence = useRef<(() => void) | null>(null);
  const refreshEpoch = useRef(0);
  if (routeOwner.current.params !== route.params || routeOwner.current.key !== route.key) {
    routeOwner.current = { params: route.params, key: route.key };
    actionToken.current = null;
    actionPending.current = false;
    pendingActionProjection.current = null;
    refreshEpoch.current += 1;
  }
  projectionRef.current = projection;
  const owner = routeOwner.current;
  const matchesActionPosition = (token: PendingPracticeAction, current: CertificationPracticeProjection | null) =>
    current?.session.id === token.sessionId && (
      (current.ordinal === token.ordinal && current.occurrenceId === token.occurrenceId)
      || (token.phase === "advancing" && current.ordinal === token.ordinal + 1 && current.occurrenceId === token.nextOccurrenceId)
    );
  const isCurrentAction = (token: PendingPracticeAction) => {
    if (routeOwner.current !== token.owner || actionToken.current !== token) return false;
    try { token.assertProfile(); } catch { return false; }
    return matchesActionPosition(token, projectionRef.current);
  };
  const clearAction = (token: PendingPracticeAction) => {
    if (!isCurrentAction(token)) return;
    actionToken.current = null;
    pendingActionProjection.current = null;
    actionPending.current = false;
    setPendingAction(null);
  };
  const recoveryInFlight = useRef(false);
  const mode = isCertificationPracticeModeId(route.params.mode) ? route.params.mode : null;

  usePreventRemove(!permitRouteExit.current && projection !== null, ({ data }) => {
    if (permitRouteExit.current) {
      navigation.dispatch(data.action);
      return;
    }
    pendingRouteAction.current = data.action;
    setExit("leave");
  });

  const applyProjection = (next: CertificationPracticeProjection) => {
    projectionFence.current = captureProfileReadFence();
    setProjection(next);
    setSelection((current) => reconcilePracticeChoiceSelection({
      current,
      durableSelectedOptionIds: next.response?.value.type === "choice_multiple" ? next.response.value.optionIds : next.response?.value.type === "choice_single" ? [next.response.value.optionId] : null,
      editable: allowsPracticeResponseEditing(next.operation.kind),
      occurrenceId: next.occurrenceId,
      sessionId: next.session.id,
    }));
    setStatementSelection((current) => {
      const durable = next.response?.value;
      if (durable?.type === "decision_matrix") return { sessionId: next.session.id, occurrenceId: next.occurrenceId, values: durable.selectedValueIdsByDimension };
      return current?.sessionId === next.session.id && current.occurrenceId === next.occurrenceId ? current : null;
    });
    setSelectionError(null);
  };
  const refresh = async () => {
    const assertProfile = captureProfileReadFence();
    const epoch = refreshEpoch.current;
    const sessionId = projectionRef.current?.session.id;
    try {
      const next = await getCertificationPracticeProjection();
      try { assertProfile(); } catch { return; }
      if (routeOwner.current !== owner || epoch !== refreshEpoch.current || (sessionId && next.session.id !== sessionId)) return;
      applyProjection(next);
    } catch (cause) {
      try { assertProfile(); } catch { return; }
      if (routeOwner.current === owner && epoch === refreshEpoch.current) throw cause;
    }
  };
  useEffect(() => {
    const pending = pendingActionProjection.current;
    if (pending && hasReachedPracticeActionProjection(pending.projection, projection)) clearAction(pending.token);
  }, [projection]);
  useEffect(() => {
    if (!mode) return;
    let live = true;
    let foregroundEntered = false;
    const assertProfile = captureProfileReadFence();
    const isLive = () => {
      if (!live || routeOwner.current !== owner) return false;
      try { assertProfile(); return true; } catch { return false; }
    };
    setProjection(null);
    setCompletionFailure(null);
    setCompletionOperation(null);
    setRecoveryFailure(null);
    void (async () => {
      try {
    const opened = await openCertificationPracticeSession(mode === "certification-diagnostic-baseline" || mode === "certification-quick-review" ? { modeId: mode, trackId: route.params.trackId, feedbackMode: route.params.feedbackMode, reviewSource: mode === "certification-quick-review" && (route.params.reviewSource === "due_queue" || route.params.reviewSource === "manual_request") ? route.params.reviewSource : undefined, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : mode === "certification-scenario-practice" ? { modeId: mode, trackId: route.params.trackId, requestedLength: route.params.sessionLength, competency: route.params.competencyId, feedbackMode: route.params.feedbackMode, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : mode === "certification-weak-area-review" || mode === "certification-mixed-practice" ? { modeId: mode, trackId: route.params.trackId, requestedLength: route.params.sessionLength, feedbackMode: route.params.feedbackMode, reviewSource: mode === "certification-weak-area-review" && (route.params.reviewSource === "due_queue" || route.params.reviewSource === "manual_request") ? route.params.reviewSource : undefined, source: route.params.source, expectedSessionId: route.params.expectedSessionId } : { modeId: mode, ...(route.params.preset ? { preset: route.params.preset, caseId: route.params.caseId } : {}), trackId: route.params.trackId, requestedLength: route.params.sessionLength, ...buildCertificationPracticeTarget(route.params.topicId, route.params.nodeId), ...(mode === "certification-focus-practice" && route.params.mentalUnitId ? { mentalUnitId: route.params.mentalUnitId, expectedContentVersion: route.params.expectedContentVersion, expectedArtifactSha256: route.params.expectedArtifactSha256 } : {}), feedbackMode: route.params.feedbackMode, source: route.params.source, expectedSessionId: route.params.expectedSessionId });
        if (opened.kind === "active_session_conflict") { if (isLive()) setConflict(opened.session); return; }
        if (!isLive()) return;
        await enterCertificationPracticeForeground();
        foregroundEntered = true;
        if (isLive()) applyProjection(opened.projection);
      } catch (cause) { if (isLive()) setError(describeSessionPreparationFailure(cause, (message) => t(message), t("Cloud practice is unavailable."))); }
    })();
    return () => {
      live = false;
      if (routeOwner.current === owner) {
        actionToken.current = null;
        actionPending.current = false;
        pendingActionProjection.current = null;
        refreshEpoch.current += 1;
      }
      if (foregroundEntered && !permitRouteExit.current) void leaveCertificationPracticeForeground().catch(() => undefined);
    };
  }, [mode, route.params]);

  useEffect(() => {
    if (!projection) return;
    const listener = AppState.addEventListener("change", (state) => {
      void (state === "active" ? enterCertificationPracticeForeground() : leaveCertificationPracticeForeground("app_background"))
        .then(refresh)
        .catch((cause: unknown) => setError(describeOperationalFailure(cause, t("Cloud practice timer is unavailable."))));
    });
    return () => listener.remove();
  }, [projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    return subscribeCertificationPracticeProjectionRefresh((event) => {
      if (event.sessionId !== projection.session.id) return;
      void refresh().catch((cause: unknown) => setError(describeOperationalFailure(cause, t("Cloud practice timer is unavailable."))));
    });
  }, [projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    const assertProfile = captureProfileReadFence();
    return subscribeCertificationPracticeOperation(projection.session.id, (operation) => {
      try { assertProfile(); } catch { return; }
      if (routeOwner.current !== owner) return;
      setCompletionOperation(operation.kind === "completing" || operation.kind === "completion_failed" || operation.kind === "completed" ? operation : null);
    });
  }, [projection?.session.id]);

  if (!mode) return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}><EmptyState title={t("Certification Practice unavailable")} description={t("This practice mode is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (conflict) {
    const ordinaryCertification = getTrackRegistration(conflict.trackId).familyId === "certification" && isCertificationPracticeModeId(conflict.modeId);
    const certificationExam = getTrackRegistration(conflict.trackId).familyId === "certification" && conflict.modeId === "certification-exam-simulation";
    const continueActive = () => {
      if (ordinaryCertification) navigation.replace(ROUTES.PRACTICE_SESSION, { ...route.params, mode: conflict.modeId, expectedSessionId: conflict.id });
      else if (certificationExam) navigation.replace(ROUTES.EXAM, { trackId: conflict.trackId, expectedSessionId: conflict.id });
      else navigation.navigate(ROUTES.HOME);
    };
    return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}><EmptyState title={t("Another session is active")} description={t("Resume your active session, or return to Practice.")} actionLabel={t(ordinaryCertification ? "Continue active practice" : certificationExam ? "Continue active exam" : "Go home")} onActionPress={continueActive} /><Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button></Screen>;
  }
  if (error) return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}><EmptyState title={t("Cloud Practice unavailable")} description={t(error)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!projection) return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}><PracticeSessionLoadingSkeleton /></Screen>;
  const questionView = toCertificationQuestionViewModel(projection.question);
  const feedbackTiming = projection.session.configurationSnapshot.feedbackMode === "atSessionEnd" ? "atSessionEnd" : "afterEachAnswer";
  const multiple = projection.question.interaction.type === "choice_multiple";
  const matrix = projection.question.interaction.type === "decision_matrix" ? projection.question.interaction : null;
  const statementValues = statementSelection?.sessionId === projection.session.id && statementSelection.occurrenceId === projection.occurrenceId ? statementSelection.values : {};
  const matrixComplete = matrix ? matrix.dimensions.every((row) => statementValues[row.dimensionId]?.length === 1) : false;
  const requiredSelectionCount = projection.question.interaction.type === "choice_multiple" ? projection.question.interaction.requiredSelectionCount : undefined;
  const feedback = projection.feedback;
  const renderedCompletionOperation = completionFailure?.kind === "retry_completion" || completionFailure?.kind === "recover_completion" ? completionFailure.operation : completionOperation;
  const uncertainResponse = projection.operation.kind === "submit_journal_failed" && projection.operation.error.allowedAction === "reconcile";
  const retryFrozenResponse = projection.operation.kind === "submit_journal_failed" && projection.operation.error.allowedAction === "retry_same_command";
  const frozenPracticeResponse = projection.operation.kind === "submit_journal_failed" && projection.operation.error.allowedAction !== "submit_again";
  const localPending = pendingAction?.owner === owner && actionToken.current === pendingAction ? pendingAction : null;
  const canonicalPhase = renderedCompletionOperation?.kind ?? projection.operation.kind;
  const transientPhase = localPending && !pendingActionProjection.current
    && (canonicalPhase === "unanswered" || canonicalPhase === "feedback" || canonicalPhase === "advance_failed" || (retryFrozenResponse && canonicalPhase === "submit_journal_failed"))
    ? localPending.phase : canonicalPhase;
  const phase: PracticeSurfacePhase = exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint"
    ? "abandonment_failed_before_journal"
    : exitFailure === "recover_abandon" || exitFailure === "recover_operation"
      ? "abandonment_recovery_required"
      : uncertainResponse ? "submit_outcome_unknown" : transientPhase;
  const editable = !localPending && !exitFailure && !completionFailure && !frozenPracticeResponse && allowsPracticeResponseEditing(phase);
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
      : exitFailure === "reconcile_abandon"
        ? { message: t("The session ending is not confirmed. Check its status before continuing."), tone: "error" as const }
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
    const selectedOptionIds = multiple ? toggleExamOption(currentIds, id, requiredSelectionCount) : currentIds.includes(id) ? [] : [id];
    return Object.freeze({ sessionId: projection.session.id, occurrenceId: projection.occurrenceId, selectedOptionIds: Object.freeze(selectedOptionIds) });
  });
  const refreshAfterCommand = async (message: string, token?: PendingPracticeAction) => {
    const assertProfile = token?.assertProfile ?? captureProfileReadFence();
    if (token && !isCurrentAction(token)) return;
    refreshEpoch.current += 1;
    const endProjection = beginStartupSpan("practice_command_projection");
    try {
      const next = await getCertificationPracticeProjection();
      try { assertProfile(); } catch { return; }
      if (routeOwner.current !== owner || (token && !isCurrentAction(token))) return;
      if (token && !matchesActionPosition(token, next)) return;
      refreshEpoch.current += 1;
      if (token) pendingActionProjection.current = { token, projection: next };
      applyProjection(next);
    } catch (cause) {
      try { assertProfile(); } catch { return; }
      if (routeOwner.current !== owner || (token && !isCurrentAction(token))) return;
      if (token) clearAction(token);
      setError(describeOperationalFailure(cause, t(message)));
    } finally { endProjection(); }
  };
  const isCurrentQuestion = () => {
    if (routeOwner.current !== owner || !hasReachedPracticeActionProjection(projection, projectionRef.current)) return false;
    try { projectionFence.current?.(); return true; } catch { return false; }
  };
  const beginAction = (phase: PendingPracticeAction["phase"]) => {
    const token: PendingPracticeAction = { owner, sessionId: projection.session.id, occurrenceId: projection.occurrenceId, ordinal: projection.ordinal, nextOccurrenceId: phase === "advancing" ? projection.session.itemOrder[projection.session.currentItemIndex + 1]?.occurrenceId ?? null : null, phase, assertProfile: projectionFence.current ?? captureProfileReadFence() };
    actionPending.current = true;
    actionToken.current = token;
    setPendingAction(token);
    return token;
  };
  const submit = async () => {
    if (!isCurrentQuestion() || actionPending.current || (!editable && !retryFrozenResponse)) return;
    if (matrix ? !matrixComplete : !selected.length || (requiredSelectionCount !== undefined && selected.length !== requiredSelectionCount)) { setSelectionError(t("Choose an answer before submitting.")); return; }
    const token = beginAction("submitting_before_journal");
    const endHandler = beginStartupSpan("practice_submit_handler");
    try {
      try {
        if (retryFrozenResponse) await retryCertificationPracticeResponse();
        else await submitCertificationPracticeResponse(matrix ? { type: "decision_matrix", selectedValueIdsByDimension: statementValues } : projection.question.interaction.type === "choice_multiple" ? { type: "choice_multiple", optionIds: selected } : { type: "choice_single", optionId: selected[0]! });
      } catch { /* Canonical projection determines the allowed retry/recovery action. */ }
      await refreshAfterCommand("We couldn't display your answer. Try again.", token);
    } finally { endHandler(); }
  };
  const next = async () => {
    if (!isCurrentQuestion() || actionPending.current || !canAdvance) return;
    const finishing = projection.operation.kind !== "advance_failed" && projection.ordinal === projection.total;
    const token = beginAction(finishing ? "completing" : "advancing");
    const endHandler = beginStartupSpan("practice_advance_handler");
    try {
      if (finishing) {
        try {
          const result = await completeCertificationPracticeSession();
          if (!isCurrentAction(token)) return;
          if ((result.kind === "verified" ? result.value.session.id : result.expectedSessionId) !== token.sessionId) return;
          await applyCompletionResult(result);
          if (result.kind !== "verified") clearAction(token);
        } catch (cause) {
          if (!isCurrentAction(token)) return;
          clearAction(token);
          setSelectionError(describeOperationalFailure(cause, t("We couldn't finish the session. Try again.")));
        }
        return;
      }
      try { await advanceCertificationPracticeSession(); }
      catch { /* Canonical projection determines the allowed retry/recovery action. */ }
      await refreshAfterCommand("We couldn't open the next question. Try again.", token);
    } finally { endHandler(); }
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
  const reconcileResponse = async () => {
    try {
      const result = await reconcileCertificationPracticeResponse();
      if (result !== "verified") { setRecoveryFailure(t("The saved response could not be confirmed.")); return; }
      await refresh();
      setRecoveryFailure(null);
    } catch (cause) { setRecoveryFailure(describeOperationalFailure(cause, t("The saved response could not be confirmed."))); }
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
    const action = pendingRouteAction.current;
    pendingRouteAction.current = null;
    if (action) navigation.dispatch(action);
    else if (navigation.canGoBack()) navigation.goBack();
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
      if (result.kind === "reconcile_required") { setExitFailure("reconcile_abandon"); return; }
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
  const reconcileAbandonment = async () => {
    try {
      const result = await reconcileCertificationPracticeAbandonment(projection.session.id);
      if (result === "verified") {
        permitRouteExit.current = true;
        navigation.replace(ROUTES.PRACTICE_HUB);
        return;
      }
      setExitFailure("reconcile_abandon");
      await refreshAfterCommand("The session ending is not confirmed. Check its status before continuing.");
    } catch {
      setExitFailure("reconcile_abandon");
    }
  };
  const retryCheckpointAndEnd = async () => {
    try {
      const result = await retryCertificationAbandonmentAfterCheckpointFailure(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      if (result.kind === "reconcile_required") { setExitFailure("reconcile_abandon"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) { setError(describeOperationalFailure(cause, t("We couldn't save the session time. Try again."))); }
  };
  const retryFrozenAbandonment = async () => {
    try {
      const result = await retryCertificationAbandonmentCommand(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      if (result.kind === "reconcile_required") { setExitFailure("reconcile_abandon"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) {
      setExitFailure(null);
      setError(describeOperationalFailure(cause, t("We couldn't end the session. Try again.")));
    }
  };
  const retry = exitFailure === "retry_abandon"
    ? retryFrozenAbandonment
    : exitFailure === "retry_checkpoint"
      ? retryCheckpointAndEnd
    : exitFailure === "recover_abandon"
      ? recoverAbandonment
      : exitFailure === "recover_operation"
        ? recoverActiveOperationBeforeAbandonment
      : exitFailure === "reconcile_abandon"
        ? reconcileAbandonment
      : completionFailure
        ? retryOrRecoverCompletion
      : uncertainResponse
        ? reconcileResponse
      : canRecover
        ? recover
        : undefined;
  const primaryAction = completionFailure
    ? undefined
    : getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: editable || retryFrozenResponse ? matrix ? matrixComplete : selected.length > 0 && (requiredSelectionCount === undefined || selected.length === requiredSelectionCount) : false, isFinalPosition: projection.ordinal === projection.total, phase }) ?? undefined;
  return <PracticeSessionSurface
    onFirstPromptLayout={projection.questionPresentation.variant === "structuredCertificationPrompt" ? () => markStartup("claude_prompt_layout") : undefined}
    allowLeave={!completionFailure}
    exit={{ kind: exit }}
    feedback={feedback ? { details: feedback.details, messages: feedback.messages, reason: feedback.reason, result: feedback.result, sources: feedback.sources } : undefined}
    interactionResponse={feedback?.statementRows ? { statementRows: feedback.statementRows } : null}
    feedbackItem={projection.session.itemOrder[projection.session.currentItemIndex]?.item}
    isFinalPosition={projection.ordinal === projection.total}
    modeLabel={t(getCertificationMode(mode).title)}
    notice={notice}
    onAbandon={() => void endSession()}
    onChoicePress={(optionId) => { if (actionPending.current || !isCurrentQuestion() || !editable) return; setSelectionError(null); toggle(optionId); }}
    onComplexityValuePress={() => undefined}
    onConfirmLeave={() => void pause()}
    onDismissExit={() => { pendingRouteAction.current = null; setExit("none"); }}
    onOrderingMove={() => undefined}
    onPrimaryAction={() => void (retryFrozenResponse ? submit() : frozenPracticeResponse ? undefined : editable ? submit() : next())}
    onRequestLeave={() => { pendingRouteAction.current = null; setExit("leave"); }}
    onRetry={retry ? () => void retry() : undefined}
    phase={phase}
    position={{ accessibilityLabel: `${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`, label: `${projection.ordinal} ${t("of")} ${projection.total}` }}
    primaryAction={primaryAction}
    progress={projection.ordinal / projection.total}
    question={{ itemId: questionView.itemId, prompt: questionView.prompt, presentation: projection.questionPresentation, responseControl: buildPracticeResponseControl({ choiceSelectionMode: multiple ? "multiple" : "single", feedbackControls: feedback?.controls, localResponse: matrix ? { kind: "complexity", selectedValuesByDimension: statementValues } : selected.length ? { kind: "choice", selectedOptionIds: selected } : null, renderer: questionView.interaction }) }}
    responseRendererBindings={certificationResponseBindings}
    onInteractionResponseChange={(value) => {
      if (!editable || !isCurrentQuestion()) return;
      const response = value as CanonicalQuestionResponse | null;
      if (response !== null && response.type !== "decision_matrix") return;
      setStatementSelection({ sessionId: projection.session.id, occurrenceId: projection.occurrenceId, values: response?.selectedValueIdsByDimension ?? {} });
    }}
    responseEditable={editable}
    retryLabel={exitFailure === "retry_abandon" ? "Try ending session again" : exitFailure === "retry_checkpoint" ? "Retry saving time" : exitFailure === "recover_abandon" ? "Restore session" : exitFailure === "recover_operation" ? "Restore session time" : exitFailure === "reconcile_abandon" ? "Check session status" : completionFailure ? completionFailure.kind === "retry_completion" ? "Finish session" : completionFailure.kind === "recover_completion" ? "Restore session result" : completionFailure.kind === "retry_final_checkpoint" ? "Retry saving time" : "Restore session time" : uncertainResponse ? "Check saved response" : canRecover ? "Restore session" : undefined}
    retryVariant={completionFailure || canRecover ? "primary" : "secondary"}
    runtimeIdentity={{ actualLength: projection.session.actualLength, feedbackTiming, itemId: questionView.itemId, modeId: projection.session.modeId, ordinal: projection.ordinal, roadmapNodeId: projection.question.nodeId, sessionId: projection.session.id, trackId: projection.session.trackId }}
    timer={{ accessibilityLabel: `${t("Active foreground time")} ${formatPracticeElapsedTime(projection.elapsedForegroundMs)}`, label: formatPracticeElapsedTime(projection.elapsedForegroundMs) }}
  />;
}
