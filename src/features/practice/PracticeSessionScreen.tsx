import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, StyleSheet } from "react-native";

import {
  abandonAlgorithmsSession,
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  enterAlgorithmsPracticeForeground,
  getAlgorithmsPracticeProjection,
  leaveAlgorithmsPracticeForeground,
  recoverAlgorithmsPracticeOperation,
  recoverAlgorithmsPracticeCompletion,
  recoverAlgorithmsPracticeCompletionCheckpoint,
  retryAlgorithmsPracticeCompletionCheckpoint,
  startAlgorithmsSession,
  subscribeAlgorithmsPracticeOperation,
  subscribeAlgorithmsPracticeProjectionRefresh,
  type AlgorithmsPracticeProjection,
  submitAlgorithmsPracticeResponse,
} from "../../application/coding-interview";
import { TrainingApplicationFailure, type PracticeDurableOperationState } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { loadActiveTrainingSession } from "../../application/learningReadModels";
import { AppShellHeader, Button, EmptyState, Screen } from "../../components";
import { getTrackRegistration } from "../../domain";
import { ROUTES } from "../../constants";
import { CODING_INTERVIEW_TRACK_ID, type TrainingSession } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { getAlgorithmMode, isAlgorithmModeId, type AlgorithmResponse } from "../../tracks/coding-interview";
import { ALGORITHM_MODE_IDS } from "../../tracks/coding-interview/domain";
import { spacing } from "../../theme";
import { PracticeSessionSurface } from "./PracticeSessionSurface";
import {
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  noticeForPracticeCompletionCheckpoint,
  noticeForPracticeOperation,
  resolvePracticeLocalResponse,
  type PracticeLocalResponse,
  type PracticeSurfacePhase,
} from "./practiceSessionPresentation";
import type { PracticeSessionRouteParams } from "./sessionConfig";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { CertificationPracticeSessionScreen } from "./CertificationPracticeSessionScreen";


type PracticeSessionScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;
type ViewState =
  | Readonly<{ kind: "session"; projection: AlgorithmsPracticeProjection }>
  | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>
  | Readonly<{ kind: "unavailable"; reason: string }>;
type CompletionFailure = Exclude<Awaited<ReturnType<typeof completeAlgorithmsPracticeSession>>, { kind: "verified" }>;

/** Canonical Algorithms Practice runner. It renders application projections and sends only facade commands. */
export function PracticeSessionScreen({ navigation, route }: PracticeSessionScreenProps) {
  if (getTrackRegistration(route.params.trackId).familyId === "certification" && (route.params.mode === "certification-diagnostic-baseline" || route.params.mode === "certification-focus-practice" || route.params.mode === "certification-scenario-practice" || route.params.mode === "certification-weak-area-review" || route.params.mode === "certification-mixed-practice" || route.params.mode === "certification-quick-review")) {
    return <CertificationPracticeSessionScreen navigation={navigation} route={route} />;
  }
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [state, setState] = useState<ViewState | null>(null);
  const [localResponse, setLocalResponse] = useState<PracticeLocalResponse>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completionFailure, setCompletionFailure] = useState<CompletionFailure | null>(null);
  const [completionOperation, setCompletionOperation] = useState<Extract<PracticeDurableOperationState, { kind: "completing" | "completion_failed" | "completed" }> | null>(null);
  const [exit, setExit] = useState<"none" | "leave">("none");
  const permitRouteExit = useRef(false);

  const algorithmsMode = route.params.trackId === CODING_INTERVIEW_TRACK_ID && isAlgorithmModeId(route.params.mode)
    ? route.params.mode
    : null;
  const requestedMode = algorithmsMode as Exclude<typeof ALGORITHM_MODE_IDS[keyof typeof ALGORITHM_MODE_IDS], typeof ALGORITHM_MODE_IDS.interviewSimulation>;
  const certificationUnavailableDescription = "Certification has no approved bundled artifact yet. Coding Interview sessions remain available.";

  useEffect(() => {
    if (!algorithmsMode || algorithmsMode === ALGORITHM_MODE_IDS.interviewSimulation) return;
    let live = true;
    setState(null);
    setLocalResponse(null);
    setSubmissionError(null);
    setCompletionFailure(null);
    setCompletionOperation(null);
    void loadOrStartAlgorithmsPractice(route.params, algorithmsMode)
      .then(async () => {
        await enterAlgorithmsPracticeForeground();
        return getAlgorithmsPracticeProjection();
      })
      .then((projection) => {
        if (!live) return;
        setState({ kind: "session", projection });
      })
      .catch((error) => {
        if (!live) return;
        setState(error instanceof ActiveAlgorithmsSessionConflict
          ? { kind: "active_session_conflict", session: error.session }
          : { kind: "unavailable", reason: describePreparationFailure(error) });
      });
    return () => {
      live = false;
      void leaveAlgorithmsPracticeForeground().catch(() => undefined);
    };
  }, [algorithmsMode, route.params]);

  useEffect(() => {
    if (state?.kind !== "session") return;
    const listener = AppState.addEventListener("change", (appState) => {
      void (appState === "active" ? enterAlgorithmsPracticeForeground() : leaveAlgorithmsPracticeForeground())
        .then(refresh)
        .catch(() => undefined);
    });
    return () => listener.remove();
  // refresh intentionally reads the latest canonical projection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.kind]);

  useEffect(() => {
    if (state?.kind !== "session") return;
    return subscribeAlgorithmsPracticeProjectionRefresh((event) => {
      if (event.sessionId === state.projection.session.id) void refresh();
    });
  // refresh intentionally reads the latest canonical projection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.kind, state?.kind === "session" ? state.projection.session.id : null]);

  useEffect(() => {
    if (state?.kind !== "session") return;
    return subscribeAlgorithmsPracticeOperation(state.projection.session.id, (operation) => {
      setCompletionOperation(operation.kind === "completing" || operation.kind === "completion_failed" || operation.kind === "completed" ? operation : null);
    });
  }, [state?.kind, state?.kind === "session" ? state.projection.session.id : null]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (permitRouteExit.current || state?.kind !== "session") return;
    event.preventDefault();
    setExit("leave");
  }), [navigation, state]);

  if (!algorithmsMode) {
    return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Certification Practice unavailable")} description={t(certificationUnavailableDescription)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (algorithmsMode === ALGORITHM_MODE_IDS.interviewSimulation) {
    return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Interview Simulation unavailable")} description={t("Interview Simulation must start from its validated 40-item profile entry. No topic-based substitute session was created.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (!state) return <PracticeSessionSurface exit={{ kind: "none" }} isFinalPosition={false} onAbandon={noop} onChoicePress={noop} onComplexityValuePress={noop} onConfirmLeave={noop} onDismissExit={noop} onOrderingMove={noop} onRequestLeave={noop} phase="preparing" />;
  if (state.kind === "active_session_conflict") {
    const activeModeLabel = isAlgorithmModeId(state.session.modeId) ? getAlgorithmMode(state.session.modeId).title : "another learning session";
    return (
      <Screen edges={["top", "bottom"]} style={styles.conflictScreen}>
        <AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} />
        <EmptyState
          title={t("Finish or leave the active session first")}
          description={`${t(activeModeLabel)} ${t("is active. Resume it, or explicitly abandon it before starting")} ${t(getAlgorithmMode(algorithmsMode).title)}.`}
          actionLabel={`${t("Resume")} ${t(activeModeLabel)}`}
          onActionPress={() => { void resumeConflictingSession(state.session); }}
        />
        <Button onPress={() => confirmReplacement(state.session)} variant="destructive">{t("Abandon and start")} {t(getAlgorithmMode(algorithmsMode).title)}</Button>
        <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button>
      </Screen>
    );
  }
  if (state.kind === "unavailable") return <Screen edges={["top", "bottom"]}><AppShellHeader backAction={{ onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} context={t("Practice Session")} /><EmptyState title={t("Practice session unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  const sessionState = state;
  const projection = sessionState.projection;
  const renderedCompletionOperation = completionFailure?.kind === "retry_completion" || completionFailure?.kind === "recover_completion" ? completionFailure.operation : completionOperation;
  const phase = toPracticeSurfacePhase(renderedCompletionOperation?.kind ?? projection.operation.kind);
  const notice = submissionError
    ? { tone: "error" as const, message: submissionError }
    : completionFailure?.kind === "retry_final_checkpoint"
      ? noticeForPracticeCompletionCheckpoint("retry")
      : completionFailure?.kind === "recover_final_checkpoint"
        ? noticeForPracticeCompletionCheckpoint("recover")
        : noticeForPracticeOperation(renderedCompletionOperation ?? projection.operation);
  const responseControl = buildPracticeResponseControl({
    choiceSelectionMode: projection.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single",
    feedbackControls: projection.session.configurationSnapshot.feedbackMode === "afterEachAnswer" ? projection.feedback?.controls : undefined,
    localResponse,
    renderer: projection.interaction.renderer,
  });
  const effectiveLocalResponse = resolvePracticeLocalResponse(localResponse, responseControl);
  const primaryAction = completionFailure ? null : getPracticePrimaryAction({ hasLocalResponse: effectiveLocalResponse !== null, isFinalPosition: projection.position.current === projection.position.total, phase });

  async function refresh() {
    const next = await getAlgorithmsPracticeProjection();
    if (next.operation.kind === "unanswered" || next.operation.kind === "submit_journal_failed") {
      // A pre-journal retry preserves the user-owned editable response. Every
      // committed response is supplied by the projection, never guessed here.
    } else setLocalResponse(null);
    setState({ kind: "session", projection: next });
  }

  async function submit() {
    if (!effectiveLocalResponse || (projection.operation.kind !== "unanswered" && projection.operation.kind !== "submit_journal_failed")) return;
    setSubmissionError(null);
    try { await submitAlgorithmsPracticeResponse(effectiveLocalResponse); }
    catch (error) { setSubmissionError(describePracticeSubmissionFailure(error)); }
    await refresh();
  }

  async function advanceOrFinish() {
    if (projection.operation.kind !== "feedback" && projection.operation.kind !== "advance_failed") return;
    if (projection.position.current === projection.position.total) {
      try {
        await applyCompletionResult(await completeAlgorithmsPracticeSession());
      } catch (error) { setSubmissionError(describeOperationalFailure(error, "The Finish state could not be verified.")); }
      return;
    }
    try { await advanceAlgorithmsPracticeSession(); }
    catch { /* The immutable committed outcome is described by the projection. */ }
    await refresh();
  }

  async function recover() {
    try { await recoverAlgorithmsPracticeOperation(); await refresh(); }
    catch (error) { setSubmissionError(describeOperationalFailure(error, "The answer recovery state could not be verified.")); }
  }

  async function applyCompletionResult(result: Awaited<ReturnType<typeof completeAlgorithmsPracticeSession>>) {
    if (result.kind !== "verified") { setCompletionFailure(result); return; }
    permitRouteExit.current = true;
    navigation.replace(ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: result.value.session.id });
  }

  async function retryOrRecoverCompletion() {
    if (!completionFailure) return;
    setSubmissionError(null);
    try {
      if (completionFailure.kind === "retry_final_checkpoint") {
        const next = await retryAlgorithmsPracticeCompletionCheckpoint(completionFailure.expectedSessionId);
        setCompletionFailure(null);
        setState({ kind: "session", projection: next });
        return;
      }
      if (completionFailure.kind === "recover_final_checkpoint") {
        const next = await recoverAlgorithmsPracticeCompletionCheckpoint(completionFailure.expectedSessionId);
        setCompletionFailure(null);
        setState({ kind: "session", projection: next });
        return;
      }
      if (completionFailure.kind === "recover_completion") {
        const result = await recoverAlgorithmsPracticeCompletion(completionFailure.expectedSessionId);
        permitRouteExit.current = true;
        navigation.replace(ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: result.session.id });
        return;
      }
      await applyCompletionResult(await completeAlgorithmsPracticeSession());
    } catch (error) { setSubmissionError(describeOperationalFailure(error, "The exact Finish retry could not be verified.")); }
  }

  async function abandon() {
    setExit("none");
    try {
      const abandoned = await abandonAlgorithmsSession();
      permitRouteExit.current = true;
      navigation.replace(ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: abandoned.id });
    } catch { await refresh(); }
  }

  async function replaceActiveSession() {
    try {
      await abandonAlgorithmsSession();
      const projection = await loadOrStartAlgorithmsPractice(route.params, requestedMode);
      setState({ kind: "session", projection });
    } catch (error) {
      setState(error instanceof ActiveAlgorithmsSessionConflict
        ? { kind: "active_session_conflict", session: error.session }
        : { kind: "unavailable", reason: describePreparationFailure(error) });
    }
  }

  function confirmReplacement(session: TrainingSession) {
    Alert.alert(
      "Abandon active session?",
      `This ends the active ${isAlgorithmModeId(session.modeId) ? getAlgorithmMode(session.modeId).title : "learning"} session. Its durable records stay available, but it cannot be resumed.`,
      [
        { text: "Keep session", style: "cancel" },
        { text: `Abandon and start ${getAlgorithmMode(requestedMode).title}`, style: "destructive", onPress: () => { void replaceActiveSession(); } },
      ],
    );
  }

  async function resumeConflictingSession(session: TrainingSession) {
    if (!isAlgorithmModeId(session.modeId)) {
      navigation.navigate(ROUTES.HOME);
      return;
    }
    if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) {
      const profileId = session.configurationSnapshot.simulationProfileId;
      if (typeof profileId !== "string") {
        setState({ kind: "unavailable", reason: "The active Interview Simulation profile is unavailable." });
        return;
      }
      navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION, { profileId });
      return;
    }
    navigation.replace(ROUTES.PRACTICE_SESSION, { ...route.params, mode: session.modeId });
  }

  function leave() {
    permitRouteExit.current = true;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.PRACTICE_HUB);
  }

  return (
    <PracticeSessionSurface
      allowLeave={!completionFailure}
      exit={{ kind: exit }}
      feedback={projection.session.configurationSnapshot.feedbackMode === "afterEachAnswer" && projection.feedback ? { details: projection.feedback.details, reason: projection.feedback.reason, result: projection.feedback.correctness } : undefined}
      feedbackItem={projection.item}
      isFinalPosition={projection.position.current === projection.position.total}
      modeLabel={t(getAlgorithmMode(algorithmsMode).title)}
      notice={notice}
      onAbandon={() => void abandon()}
      onChoicePress={(optionId) => { setSubmissionError(null); setLocalResponse((current) => toggleChoice(current, optionId, responseControl.kind === "choice" ? responseControl.selectionMode : "single")); }}
      onComplexityValuePress={(dimensionId, value) => { setSubmissionError(null); setLocalResponse((current) => setComplexityValue(current, dimensionId, value)); }}
      onConfirmLeave={leave}
      onDismissExit={() => setExit("none")}
      onOrderingMove={(elementId, direction) => { setSubmissionError(null); setLocalResponse((current) => moveOrderingElement(current, elementId, direction, responseControl)); }}
      onPrimaryAction={() => void ((phase === "unanswered" || phase === "submit_journal_failed") ? submit() : advanceOrFinish())}
      onRequestLeave={() => setExit("leave")}
      onRetry={completionFailure ? () => void retryOrRecoverCompletion() : "error" in projection.operation && projection.operation.error.allowedAction === "recover" ? () => void recover() : undefined}
      phase={phase}
      position={{ accessibilityLabel: `${t("Question")} ${projection.position.current} ${t("of")} ${projection.position.total}`, label: `${projection.position.current} ${t("of")} ${projection.position.total}` }}
      primaryAction={primaryAction ?? undefined}
      progress={projection.position.current / projection.position.total}
      question={{ constraints: projection.constraints, itemId: projection.item.itemId, prompt: projection.prompt, responseControl }}
      retryLabel={completionFailure ? completionFailure.kind === "retry_completion" ? "Finish session" : completionFailure.kind === "recover_completion" ? "Recover completion" : completionFailure.kind === "retry_final_checkpoint" ? "Retry final checkpoint" : "Recover final checkpoint" : "error" in projection.operation && projection.operation.error.allowedAction === "recover" ? "Recover session" : undefined}
      runtimeIdentity={{
        itemId: projection.item.itemId,
        actualLength: projection.session.actualLength,
        feedbackTiming: feedbackTiming(projection.session.configurationSnapshot.feedbackMode),
        modeId: projection.session.modeId,
        ordinal: projection.position.current,
        roadmapNodeId: projection.roadmapNodeId,
        sessionId: projection.session.id,
        trackId: projection.session.trackId,
      }}
      timer={{ accessibilityLabel: `${t("Active foreground time")} ${formatElapsed(projection.elapsedForegroundMs)}`, label: `${t("Active time")} ${formatElapsed(projection.elapsedForegroundMs)}` }}
    />
  );
}

async function loadOrStartAlgorithmsPractice(params: PracticeSessionRouteParams, modeId: Exclude<typeof ALGORITHM_MODE_IDS[keyof typeof ALGORITHM_MODE_IDS], typeof ALGORITHM_MODE_IDS.interviewSimulation>) {
  const active = await loadActiveTrainingSession();
  if (active) {
    if (active.trackId !== CODING_INTERVIEW_TRACK_ID || active.modeId !== modeId) throw new ActiveAlgorithmsSessionConflict(active);
    return getAlgorithmsPracticeProjection();
  }
  try {
    await startAlgorithmsSession({
      feedbackMode: params.feedbackMode,
      modeId,
      requestedLength: params.sessionLength,
      reviewItemRefs: params.reviewItemRefs,
      reviewSource: params.reviewSource,
      scope: resolveScope(params, modeId),
      source: params.source,
    });
  } catch (error) {
    if (!(error instanceof TrainingApplicationFailure) || error.code !== "active_session_conflict") throw error;
    const conflicting = await loadActiveTrainingSession();
    if (conflicting) throw new ActiveAlgorithmsSessionConflict(conflicting);
    throw error;
  }
  const projection = await getAlgorithmsPracticeProjection();
  if (projection.session.modeId !== modeId) throw new Error("A different active Algorithms session must be resumed or abandoned before starting this mode.");
  return projection;
}

class ActiveAlgorithmsSessionConflict extends Error {
  constructor(readonly session: TrainingSession) {
    super(`Active session ${session.id} must be resumed or abandoned first.`);
  }
}

function resolveScope(params: PracticeSessionRouteParams, modeId: string) {
  if (modeId === ALGORITHM_MODE_IDS.learnApproach || modeId === ALGORITHM_MODE_IDS.guidedPractice || modeId === ALGORITHM_MODE_IDS.customPractice) return { roadmapNodeId: params.topicId };
  if (modeId === ALGORITHM_MODE_IDS.weakAreaReview) return undefined;
  if (!params.algorithmScope) throw new Error("This Algorithms mode requires its declared content scope before a session can be prepared.");
  return params.algorithmScope;
}

function toggleChoice(current: PracticeLocalResponse, optionId: string, selectionMode: "single" | "multiple"): PracticeLocalResponse {
  const selected = current?.kind === "choice" ? current.selectedOptionIds : [];
  if (selectionMode === "single") return { kind: "choice", selectedOptionIds: selected[0] === optionId ? [] : [optionId] };
  return { kind: "choice", selectedOptionIds: selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId] };
}

function setComplexityValue(current: PracticeLocalResponse, dimensionId: string, value: string): PracticeLocalResponse {
  const selected = current?.kind === "complexity" ? current.selectedValuesByDimension : {};
  return { kind: "complexity", selectedValuesByDimension: { ...selected, [dimensionId]: value } };
}

function moveOrderingElement(current: PracticeLocalResponse, elementId: string, direction: "up" | "down", control: ReturnType<typeof buildPracticeResponseControl>): PracticeLocalResponse {
  if (control.kind !== "ordering") return current;
  const order = current?.kind === "ordering" ? [...current.orderedSubgoalIds] : control.elements.map((element) => element.id);
  const index = order.indexOf(elementId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= order.length) return { kind: "ordering", orderedSubgoalIds: order };
  [order[index], order[target]] = [order[target]!, order[index]!];
  return { kind: "ordering", orderedSubgoalIds: order };
}

function toPracticeSurfacePhase(kind: AlgorithmsPracticeProjection["operation"]["kind"]): PracticeSurfacePhase {
  return kind;
}

function describePreparationFailure(error: unknown): string {
  return `${describeOperationalFailure(error, "The session could not be prepared.")} No substitute topic, item, or shortened fixed session was created.`;
}

function describePracticeSubmissionFailure(error: unknown): string {
  return describeOperationalFailure(error, "Your answer could not be submitted. Select an answer and try again.");
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function feedbackTiming(value: unknown): "afterEachAnswer" | "atSessionEnd" {
  if (value === "afterEachAnswer" || value === "atSessionEnd") return value;
  throw new Error("Algorithms practice session is missing its canonical feedback timing.");
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  conflictScreen: { gap: spacing.md },
});
