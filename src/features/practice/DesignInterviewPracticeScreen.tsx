import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  abandonDesignInterviewSession,
  advanceDesignInterviewPracticeSession,
  completeDesignInterviewPracticeSession,
  enterDesignInterviewPracticeForeground,
  getDesignInterviewPracticeProjection,
  leaveDesignInterviewPracticeForeground,
  openDesignInterviewPracticeSession,
  recoverDesignInterviewAbandonment,
  recoverDesignInterviewPracticeCompletion,
  recoverDesignInterviewPracticeCompletionCheckpoint,
  recoverDesignInterviewPracticeOperation,
  recoverDesignInterviewPreAbandonmentCheckpoint,
  retryDesignInterviewAbandonmentAfterCheckpointFailure,
  retryDesignInterviewPracticeCompletionCheckpoint,
  subscribeDesignInterviewPracticeOperation,
  subscribeDesignInterviewPracticeProjectionRefresh,
  submitDesignInterviewPracticeResponse,
  type DesignInterviewPracticeProjection,
} from "../../application/design-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";
import { AppShellHeader, Button, EmptyState, LoadingState, Screen } from "../../components";
import type { TrainingSession } from "../../domain";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { isDesignInterviewModeId, type DesignInterviewModeId } from "../../tracks/design-interview";
import type { DesignResponse } from "../../tracks/design-interview";
import { useAppPreferences } from "../../preferences";
import { PracticeSessionSurface } from "./PracticeSessionSurface";
import {
  allowsPracticeResponseEditing,
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  noticeForPracticeCompletionCheckpoint,
  noticeForPracticeOperation,
  resolvePracticeLocalResponse,
  type PracticeInteractionRenderer,
  type PracticeLocalResponse,
  type PracticeSurfacePhase,
} from "./practiceSessionPresentation";
import type { PracticeSessionRouteParams } from "./sessionConfig";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;
type CompletionFailure = Exclude<Awaited<ReturnType<typeof completeDesignInterviewPracticeSession>>, { kind: "verified" }>;
type ExitFailure = "pause" | "retry_abandon" | "retry_checkpoint" | "recover_abandon" | "recover_operation";

/** Design Interview runner. The renderer handles all authored interaction types through the shared durable session surface. */
export function DesignInterviewPracticeScreen({ navigation, route }: Props) {
  const { t } = useAppPreferences();
  const [projection, setProjection] = useState<DesignInterviewPracticeProjection | null>(null);
  const [localResponse, setLocalResponse] = useState<PracticeLocalResponse>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<TrainingSession | null>(null);
  const [completionFailure, setCompletionFailure] = useState<CompletionFailure | null>(null);
  const [completionOperation, setCompletionOperation] = useState<Extract<PracticeDurableOperationState, { kind: "completing" | "completion_failed" | "completed" }> | null>(null);
  const [exit, setExit] = useState<"none" | "leave">("none");
  const [exitFailure, setExitFailure] = useState<ExitFailure | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const permitRouteExit = useRef(false);
  const mode = isDesignInterviewModeId(route.params.mode) ? route.params.mode : null;

  const applyProjection = (next: DesignInterviewPracticeProjection) => {
    setProjection(next);
    setLocalResponse(next.response ? designResponseToLocal(next.response.value) : null);
    setResponseError(null);
  };
  const refresh = async () => applyProjection(await getDesignInterviewPracticeProjection());

  useEffect(() => {
    if (!mode) return;
    let live = true;
    let foregroundEntered = false;
    setProjection(null);
    setConflict(null);
    setError(null);
    setCompletionFailure(null);
    setCompletionOperation(null);
    void (async () => {
      try {
        const opened = await openDesignInterviewPracticeSession({
          expectedSessionId: route.params.expectedSessionId,
          modeId: mode,
          requestedLength: route.params.sessionLength,
          source: route.params.source,
          trackId: route.params.trackId,
        });
        if (opened.kind === "active_session_conflict") {
          if (live) setConflict(opened.session);
          return;
        }
        await enterDesignInterviewPracticeForeground();
        foregroundEntered = true;
        if (live) applyProjection(opened.projection);
      } catch (cause) {
        if (live) setError(describeOperationalFailure(cause, "Design Interview practice is unavailable."));
      }
    })();
    return () => {
      live = false;
      if (foregroundEntered && !permitRouteExit.current) void leaveDesignInterviewPracticeForeground().catch(() => undefined);
    };
  }, [mode, route.params]);

  useEffect(() => {
    if (!projection) return;
    const listener = AppState.addEventListener("change", (state) => {
      void (state === "active" ? enterDesignInterviewPracticeForeground() : leaveDesignInterviewPracticeForeground())
        .then(refresh)
        .catch((cause: unknown) => setError(describeOperationalFailure(cause, "Design Interview timer is unavailable.")));
    });
    return () => listener.remove();
  }, [projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    return subscribeDesignInterviewPracticeProjectionRefresh((event) => {
      if (event.sessionId === projection.session.id) void refresh().catch((cause: unknown) => setError(describeOperationalFailure(cause, "Design Interview timer is unavailable.")));
    });
  }, [projection?.session.id]);

  useEffect(() => {
    if (!projection) return;
    return subscribeDesignInterviewPracticeOperation(projection.session.id, (operation) => {
      setCompletionOperation(operation.kind === "completing" || operation.kind === "completion_failed" || operation.kind === "completed" ? operation : null);
    });
  }, [projection?.session.id]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (permitRouteExit.current || !projection) return;
    event.preventDefault();
    setExit("leave");
  }), [navigation, projection?.session.id]);

  if (!mode) return <Unavailable navigation={navigation} title="Design Interview practice unavailable" description="This route is not a canonical Design Interview practice mode." />;
  if (conflict) {
    const conflictIsDesign = getDesignMode(conflict.modeId) !== null;
    return <Screen edges={["top", "bottom"]}>
      <AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} />
      <EmptyState
        title={t("Another session is active")}
        description={t("Continue the exact active session or return to Practice. The active session will not be replaced.")}
        actionLabel={t(conflictIsDesign ? "Continue active practice" : "Go home")}
        onActionPress={() => conflictIsDesign ? navigation.replace(ROUTES.PRACTICE_SESSION, { ...route.params, mode: conflict.modeId as PracticeSessionRouteParams["mode"], expectedSessionId: conflict.id }) : navigation.navigate(ROUTES.HOME)}
      />
      <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button>
    </Screen>;
  }
  if (error) return <Unavailable navigation={navigation} title="Design Interview practice unavailable" description={error} />;
  if (!projection) return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><LoadingState title={t("Preparing immutable Design Interview session…")} /></Screen>;

  const renderer = designRenderer(projection);
  const responseControl = buildPracticeResponseControl({ localResponse, renderer });
  const effectiveResponse = resolvePracticeLocalResponse(localResponse, responseControl);
  const renderedCompletionOperation = completionFailure?.kind === "retry_completion" || completionFailure?.kind === "recover_completion" ? completionFailure.operation : completionOperation;
  const phase: PracticeSurfacePhase = exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint"
    ? "abandonment_failed_before_journal"
    : exitFailure === "recover_abandon" || exitFailure === "recover_operation"
      ? "abandonment_recovery_required"
      : renderedCompletionOperation?.kind ?? projection.operation.kind;
  const editable = !exitFailure && !completionFailure && allowsPracticeResponseEditing(projection.operation.kind);
  const canSubmit = editable && hasCompleteDesignResponse(projection, effectiveResponse);
  const canRecover = !exitFailure && !completionFailure && "error" in projection.operation && projection.operation.error.allowedAction === "recover";
  const canAdvance = !exitFailure && !completionFailure && (projection.operation.kind === "feedback" || projection.operation.kind === "advance_failed");
  const operationNotice = noticeForPracticeOperation(renderedCompletionOperation ?? projection.operation);
  const notice = responseError
    ? { message: responseError, tone: "error" as const }
    : exitFailure === "pause"
      ? { message: "The session could not be paused. It remains active; try leaving again.", tone: "error" as const }
      : exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint"
        ? { message: "The end command must be retried for the exact active session.", tone: "error" as const }
        : exitFailure === "recover_abandon"
          ? { message: "The end command is durable and must be recovered before leaving.", tone: "error" as const }
          : exitFailure === "recover_operation"
            ? { message: "The timer checkpoint is durable and must be recovered before ending this session.", tone: "error" as const }
            : completionFailure?.kind === "retry_final_checkpoint"
              ? noticeForPracticeCompletionCheckpoint("retry")
              : completionFailure?.kind === "recover_final_checkpoint"
                ? noticeForPracticeCompletionCheckpoint("recover")
                : operationNotice;

  const submit = async () => {
    if (!canSubmit || !effectiveResponse) return;
    try { await submitDesignInterviewPracticeResponse(toDesignResponse(effectiveResponse)); }
    catch (cause) { setResponseError(describeOperationalFailure(cause, "The Design Interview answer could not be saved.")); }
    await refreshAfterCommand("The answer state could not be refreshed.");
  };
  const next = async () => {
    if (!canAdvance) return;
    if (projection.operation.kind === "advance_failed") {
      try { await advanceDesignInterviewPracticeSession(); } catch { /* Refresh shows the exact durable state. */ }
      await refreshAfterCommand("The next-question state could not be refreshed.");
      return;
    }
    if (projection.ordinal === projection.total) {
      try { await applyCompletionResult(await completeDesignInterviewPracticeSession()); }
      catch (cause) { setResponseError(describeOperationalFailure(cause, "The Finish state could not be verified.")); }
      return;
    }
    try { await advanceDesignInterviewPracticeSession(); } catch { /* Refresh shows the exact durable state. */ }
    await refreshAfterCommand("The next-question state could not be refreshed.");
  };
  const recover = async () => {
    if (!canRecover) return;
    try { await recoverDesignInterviewPracticeOperation(); } catch { /* Refresh shows the exact durable state. */ }
    await refreshAfterCommand("The recovery state could not be refreshed.");
  };
  const applyCompletionResult = async (result: Awaited<ReturnType<typeof completeDesignInterviewPracticeSession>>) => {
    if (result.kind !== "verified") { setCompletionFailure(result); return; }
    permitRouteExit.current = true;
    navigation.replace(ROUTES.RESULT, { sessionId: result.value.session.id });
  };
  const retryOrRecoverCompletion = async () => {
    if (!completionFailure) return;
    try {
      if (completionFailure.kind === "retry_final_checkpoint") { applyProjection(await retryDesignInterviewPracticeCompletionCheckpoint(completionFailure.expectedSessionId)); setCompletionFailure(null); return; }
      if (completionFailure.kind === "recover_final_checkpoint") { applyProjection(await recoverDesignInterviewPracticeCompletionCheckpoint(completionFailure.expectedSessionId)); setCompletionFailure(null); return; }
      if (completionFailure.kind === "recover_completion") { const result = await recoverDesignInterviewPracticeCompletion(completionFailure.expectedSessionId); permitRouteExit.current = true; navigation.replace(ROUTES.RESULT, { sessionId: result.session.id }); return; }
      await applyCompletionResult(await completeDesignInterviewPracticeSession());
    } catch (cause) { setResponseError(describeOperationalFailure(cause, "The exact Finish retry could not be verified.")); }
  };
  const pause = async () => {
    setExit("none");
    setExitFailure(null);
    try { await leaveDesignInterviewPracticeForeground(); } catch { setExitFailure("pause"); return; }
    leaveRunner();
  };
  const leaveRunner = () => {
    permitRouteExit.current = true;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.PRACTICE_HUB);
  };
  const endSession = async () => {
    setExit("none");
    setExitFailure(null);
    try {
      const result = await abandonDesignInterviewSession(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) { setError(describeOperationalFailure(cause, "The session end state could not be verified.")); }
  };
  const recoverAbandonment = async () => {
    try { await recoverDesignInterviewAbandonment(projection.session.id); } catch { setExitFailure("recover_abandon"); return; }
    permitRouteExit.current = true;
    navigation.replace(ROUTES.PRACTICE_HUB);
  };
  const recoverOperationBeforeAbandonment = async () => {
    try { await recoverDesignInterviewPreAbandonmentCheckpoint(projection.session.id); } catch { setExitFailure("recover_operation"); return; }
    setExitFailure(null);
    await refreshAfterCommand("The recovered timer state could not be refreshed.");
  };
  const retryCheckpointAndEnd = async () => {
    try {
      const result = await retryDesignInterviewAbandonmentAfterCheckpointFailure(projection.session.id);
      if (result.kind === "retry_same_command") { setExitFailure(result.retry === "foreground_checkpoint" ? "retry_checkpoint" : "retry_abandon"); return; }
      if (result.kind === "recovery_required") { setExitFailure(result.recovery === "abandonment" ? "recover_abandon" : "recover_operation"); return; }
      permitRouteExit.current = true;
      navigation.replace(ROUTES.PRACTICE_HUB);
    } catch (cause) { setError(describeOperationalFailure(cause, "The timer retry state could not be verified.")); }
  };
  const retry = exitFailure === "retry_abandon" ? endSession : exitFailure === "retry_checkpoint" ? retryCheckpointAndEnd : exitFailure === "recover_abandon" ? recoverAbandonment : exitFailure === "recover_operation" ? recoverOperationBeforeAbandonment : completionFailure ? retryOrRecoverCompletion : canRecover ? recover : undefined;
  const primaryAction = completionFailure ? undefined : editable
    ? { enabled: canSubmit, label: "Check answer", loading: false }
    : getPracticePrimaryAction({ hasLocalResponse: false, isFinalPosition: projection.ordinal === projection.total, phase }) ?? undefined;

  return <PracticeSessionSurface
    allowLeave={!completionFailure}
    exit={{ kind: exit }}
    feedback={projection.feedback ? { details: projection.feedback.details, reason: projection.feedback.reason, result: projection.feedback.result } : undefined}
    feedbackItem={projection.session.itemOrder[projection.session.currentItemIndex]?.item}
    isFinalPosition={projection.ordinal === projection.total}
    modeLabel={designModeLabel(mode)}
    notice={notice}
    onAbandon={() => void endSession()}
    onChoicePress={(optionId) => { setResponseError(null); setLocalResponse(toggleChoice(projection, effectiveResponse, optionId)); }}
    onComplexityValuePress={(dimensionId, value) => { setResponseError(null); setLocalResponse(updateMatrix(effectiveResponse, dimensionId, value)); }}
    onConfirmLeave={() => void pause()}
    onDismissExit={() => setExit("none")}
    onOrderingMove={(elementId, direction) => { setResponseError(null); setLocalResponse(moveOrdering(projection, effectiveResponse, elementId, direction)); }}
    onPrimaryAction={() => void (editable ? submit() : next())}
    onRequestLeave={() => setExit("leave")}
    onRetry={retry ? () => void retry() : undefined}
    phase={phase}
    position={{ accessibilityLabel: `${t("Question")} ${projection.ordinal} ${t("of")} ${projection.total}`, label: `${projection.ordinal} ${t("of")} ${projection.total}` }}
    primaryAction={primaryAction}
    progress={projection.ordinal / projection.total}
    question={{ constraints: [projection.question.taxonomy.primaryCompetencyId], itemId: projection.question.id, prompt: projection.question.prompt, responseControl }}
    retryLabel={exitFailure === "retry_abandon" || exitFailure === "retry_checkpoint" ? "Retry end session" : exitFailure === "recover_abandon" ? "Recover end session" : exitFailure === "recover_operation" ? "Recover timer checkpoint" : completionFailure ? completionFailure.kind === "retry_completion" ? "Finish session" : completionFailure.kind === "recover_completion" ? "Recover completion" : completionFailure.kind === "retry_final_checkpoint" ? "Retry final checkpoint" : "Recover final checkpoint" : canRecover ? "Continue recovery" : undefined}
    retryVariant={completionFailure || canRecover ? "primary" : "secondary"}
    runtimeIdentity={{ actualLength: projection.session.actualLength, feedbackTiming: "afterEachAnswer", itemId: projection.question.id, modeId: projection.session.modeId, ordinal: projection.ordinal, roadmapNodeId: projection.question.taxonomy.roadmapNodeId, sessionId: projection.session.id, trackId: projection.session.trackId }}
    timer={{ accessibilityLabel: `${t("Active foreground time")} ${formatElapsed(projection.elapsedForegroundMs)}`, label: formatElapsed(projection.elapsedForegroundMs) }}
  />;

  async function refreshAfterCommand(message: string) {
    try { await refresh(); } catch (cause) { setError(describeOperationalFailure(cause, message)); }
  }
}

function Unavailable({ navigation, title, description }: Readonly<{ navigation: Props["navigation"]; title: string; description: string }>) {
  const { t } = useAppPreferences();
  return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t(title)} description={t(description)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
}

function designRenderer(projection: DesignInterviewPracticeProjection): PracticeInteractionRenderer {
  const interaction = projection.question.interaction;
  if (interaction.type === "choice") return { kind: "choice", options: interaction.options.map((option) => ({ id: option.id, selected: false, text: option.text })) };
  if (interaction.type === "ordering") return { kind: "ordering", elements: interaction.elements.map((element) => ({ id: element.id, text: element.text })) };
  return { kind: "complexity", dimensions: interaction.dimensions.map((dimension) => ({ id: dimension.dimensionId, label: dimension.label, values: dimension.values.map((value) => value.valueId) })) };
}

function designResponseToLocal(response: DesignResponse | null): PracticeLocalResponse {
  if (!response) return null;
  if (response.kind === "choice") return { kind: "choice", selectedOptionIds: response.selectedOptionIds };
  if (response.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: response.orderedElementIds };
  return { kind: "complexity", selectedValuesByDimension: response.selectedValueIdsByDimension };
}

function toDesignResponse(response: Exclude<PracticeLocalResponse, null>): import("../../tracks/design-interview").DesignResponse {
  if (response.kind === "choice") return response;
  if (response.kind === "ordering") return { kind: "ordering", orderedElementIds: response.orderedSubgoalIds };
  return { kind: "decision_matrix", selectedValueIdsByDimension: response.selectedValuesByDimension };
}

function hasCompleteDesignResponse(projection: DesignInterviewPracticeProjection, response: PracticeLocalResponse): response is Exclude<PracticeLocalResponse, null> {
  if (!response) return false;
  if (projection.question.interaction.type === "choice") return response.kind === "choice" && response.selectedOptionIds.length > 0;
  if (projection.question.interaction.type === "ordering") return response.kind === "ordering" && response.orderedSubgoalIds.length === projection.question.interaction.elements.length;
  return response.kind === "complexity" && projection.question.interaction.dimensions.every((dimension) => typeof response.selectedValuesByDimension[dimension.dimensionId] === "string");
}

function toggleChoice(projection: DesignInterviewPracticeProjection, current: PracticeLocalResponse, optionId: string): PracticeLocalResponse {
  const ids = current?.kind === "choice" ? current.selectedOptionIds : [];
  const next = projection.question.interaction.type === "choice" && projection.question.interaction.selectionMode === "multiple"
    ? ids.includes(optionId) ? ids.filter((id) => id !== optionId) : [...ids, optionId]
    : [optionId];
  return { kind: "choice", selectedOptionIds: Object.freeze(next) };
}

function moveOrdering(projection: DesignInterviewPracticeProjection, current: PracticeLocalResponse, elementId: string, direction: "up" | "down"): PracticeLocalResponse {
  const source = current?.kind === "ordering" ? [...current.orderedSubgoalIds] : projection.question.interaction.type === "ordering" ? projection.question.interaction.elements.map((element) => element.id) : [];
  const index = source.indexOf(elementId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= source.length) return { kind: "ordering", orderedSubgoalIds: Object.freeze(source) };
  [source[index], source[target]] = [source[target]!, source[index]!];
  return { kind: "ordering", orderedSubgoalIds: Object.freeze(source) };
}

function updateMatrix(current: PracticeLocalResponse, dimensionId: string, value: string): PracticeLocalResponse {
  return { kind: "complexity", selectedValuesByDimension: Object.freeze({ ...(current?.kind === "complexity" ? current.selectedValuesByDimension : {}), [dimensionId]: value }) };
}

function getDesignMode(value: string): DesignInterviewModeId | null { return isDesignInterviewModeId(value) ? value : null; }
function designModeLabel(mode: DesignInterviewModeId): string { return mode === "design-interview-learn-framework" ? "Learn the framework" : mode === "design-interview-tradeoff-practice" ? "Tradeoff practice" : "Weak Area Review"; }
function formatElapsed(milliseconds: number): string { const seconds = Math.max(0, Math.floor(milliseconds / 1_000)); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
