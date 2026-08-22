import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import {
  abandonAlgorithmsSession, enterAlgorithmsSimulationForeground, finalizeAlgorithmsSimulation,
  getAlgorithmsSimulationScreenProjection, leaveAlgorithmsSimulationForeground,
  navigateAlgorithmsSimulationTo, recoverAlgorithmsSimulationOperation, recoverAlgorithmsSimulationSaveAndContinue, resumeAlgorithmsSimulationEditingAfterSaveFailure, saveAlgorithmsSimulationResponse, saveAlgorithmsSimulationResponseAndContinue, saveAlgorithmsSimulationResponseAndNavigate, startAlgorithmsSession,
  subscribeAlgorithmsSimulationProjectionRefresh, type AlgorithmsSimulationProjection,
  type AlgorithmsSimulationScreenProjection,
} from "../../application/coding-interview";
import { subscribeTrainingOperationProjection, type SimulationDurableOperationState } from "../../application/trainingLifecycle";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { simulationPrimaryAction, simulationTimer, type SimulationAction, type SimulationOperationPresentation, type SimulationQuestionProjection, type SimulationResponseChange, type SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION>;
type SimulationResponse = Parameters<typeof saveAlgorithmsSimulationResponse>[0]["response"];
type Overlay = "none" | "finish" | "leave" | "abandon";

/** This route owns only selection and confirmation overlays. Durable state comes from the application projection. */
export function AlgorithmsInterviewSimulationScreen({ navigation, route }: Props) {
  const [screen, setScreen] = useState<AlgorithmsSimulationScreenProjection | null>(null);
  const [localResponse, setLocalResponse] = useState<SimulationResponse | null>(null);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [pendingNavigationIndex, setPendingNavigationIndex] = useState<number | null>(null);
  const load = useCallback(async () => setScreen(await getAlgorithmsSimulationScreenProjection()), []);

  useFocusEffect(useCallback(() => {
    void start();
    return () => { void leaveAlgorithmsSimulationForeground().catch(() => undefined); };
  // Start is intentionally owned by the validated application facade.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.profileId]));
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      void (state === "active" ? enterAlgorithmsSimulationForeground() : leaveAlgorithmsSimulationForeground()).then(load).catch(load);
    });
    return () => listener.remove();
  }, [load]);
  useEffect(() => subscribeAlgorithmsSimulationProjectionRefresh((event) => {
    if (event.kind === "expired") navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "timeout", sessionId: event.sessionId });
    else void load();
  }), [load, navigation]);
  const sessionId = screen?.kind === "ready" ? screen.projection.session.id : null;
  useEffect(() => sessionId ? subscribeTrainingOperationProjection(sessionId, () => { void load(); }) : undefined, [load, sessionId]);
  useEffect(() => {
    if (screen?.kind === "ready" && localResponse === null) setLocalResponse(responseFromProjection(screen.projection));
  }, [localResponse, screen]);

  async function start() {
    try {
      await startAlgorithmsSession({ modeId: "coding-interview-simulation", requestedLength: 40, scope: { simulationProfileId: route.params.profileId }, source: "algorithmsInterviewSimulation" });
      await enterAlgorithmsSimulationForeground();
    } catch { /* The projection maps canonical application failures. */ }
    await load();
  }
  async function save() {
    if (screen?.kind !== "ready" || !localResponse) return;
    const occurrenceId = screen.projection.session.itemOrder[screen.projection.position.current - 1]?.occurrenceId;
    if (!occurrenceId) return;
    try { await saveAlgorithmsSimulationResponse({ occurrenceId, response: localResponse }); } catch { /* Durable state is published by lifecycle. */ }
    await load();
  }
  async function saveAndContinue() {
    if (screen?.kind !== "ready" || !localResponse) return;
    const occurrenceId = screen.projection.session.itemOrder[screen.projection.position.current - 1]?.occurrenceId;
    if (!occurrenceId) return;
    try { await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId, response: localResponse }); setLocalResponse(null); } catch { /* Durable state is published by lifecycle. */ }
    await load();
  }
  async function goTo(index: number): Promise<"navigated" | "incomplete_response" | "save_failed"> {
    if (screen?.kind !== "ready") return "save_failed";
    const projection = screen.projection;
    const occurrenceId = projection.session.itemOrder[projection.position.current - 1]?.occurrenceId;
    const response = localResponse ?? responseFromProjection(projection);
    if (!occurrenceId) return "save_failed";
    const changed = !sameResponse(response, responseFromProjection(projection));
    if (changed && !isComplete(response, projection)) return "incomplete_response";
    setPendingNavigationIndex(index);
    try {
      if (sameResponse(response, responseFromProjection(projection))) await navigateAlgorithmsSimulationTo(index);
      else await saveAlgorithmsSimulationResponseAndNavigate({ occurrenceId, response, targetIndex: index });
      setLocalResponse(null);
      setPendingNavigationIndex(null);
    } catch {
      await load();
      return "save_failed";
    }
    await load();
    return "navigated";
  }
  async function finish() {
    if (screen?.kind !== "ready") return;
    try { await finalizeAlgorithmsSimulation(); navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "manual", sessionId: screen.projection.session.id }); } catch { await load(); }
  }
  async function abandon() { try { await abandonAlgorithmsSession(); navigation.goBack(); } catch { await load(); } }
  async function resumeEditingAfterSaveFailure() { try { await resumeAlgorithmsSimulationEditingAfterSaveFailure(); } catch { /* The application keeps the operation state when resume-editing is invalid. */ } await load(); }
  async function recoverOperation() { try { await recoverAlgorithmsSimulationOperation(); } catch { /* Recovery remains exclusively application-owned. */ } await load(); }
  async function continueAfterNavigationFailure(operation: SimulationDurableOperationState) {
    if (screen?.kind !== "ready") return;
    const occurrenceId = screen.projection.session.itemOrder[screen.projection.position.current - 1]?.occurrenceId;
    try {
      if (operation.kind === "save_and_continue_advance_recovery" && occurrenceId) await recoverAlgorithmsSimulationSaveAndContinue({ occurrenceId });
      else if ("error" in operation && operation.error.allowedAction === "retry_same_command" && pendingNavigationIndex !== null) await goTo(pendingNavigationIndex);
      else await recoverAlgorithmsSimulationOperation();
    } catch { /* The application projection retains the exact recovery state. */ }
    await load();
  }

  const surface = useMemo<SimulationSurfaceProjection>(() => {
    if (!screen) return { state: "preparing", title: "Preparing Interview Simulation", notice: { tone: "neutral", message: "Loading canonical session state…" } };
    if (screen.kind === "unavailable") return unavailableSurface(screen.operation, () => navigation.goBack());
    const projection = screen.projection;
    const operation = projection.operation;
    const response = localResponse ?? responseFromProjection(projection);
    if (overlay === "finish" && operation.kind === "editable") return confirmationSurface(projection, "finish_confirmation", "Finish with unanswered questions?", `${projection.navigator.filter((item) => item.answered).length} answered. Unanswered questions receive zero points.`, () => setOverlay("none"), () => { void finish(); });
    if (overlay === "leave" && operation.kind === "editable") return confirmationSurface(projection, "leave_confirmation", "Leave and resume later?", "Leaving preserves the latest durable draft.", () => setOverlay("none"), () => navigation.goBack());
    if (overlay === "abandon" && operation.kind === "editable") return confirmationSurface(projection, "abandon_confirmation", "Abandon this simulation?", "Abandoning ends resumability. Durable records remain available.", () => setOverlay("none"), () => { void abandon(); });
    if (operation.kind !== "editable") return operationSurface(projection, operation, {
      onClose: () => navigation.goBack(),
      onContinueNavigation: () => { void continueAfterNavigationFailure(operation); },
      onLeave: () => navigation.goBack(),
      onRecover: () => { void recoverOperation(); },
      onResumeEditing: () => { void resumeEditingAfterSaveFailure(); },
      onRetryFinalization: () => { void finish(); },
      onRetrySave: () => { void save(); },
    });
    const changed = !sameResponse(response, responseFromProjection(projection));
    return {
      state: "editable", title: "Interview Simulation", modeLabel: "Interview Simulation", position: simulationPosition(projection),
      progress: projection.position.current / projection.position.total, timer: simulationTimer(projection.remainingForegroundMs),
      notice: { tone: changed ? "neutral" : "success", message: changed ? "Not saved yet" : response ? "Saved" : "No saved response" },
      question: question(projection, response), navigator: navigator(projection), runtimeIdentity: { itemId: projection.item.itemId, sessionId: projection.session.id },
      onOccurrencePress: async (occurrenceId) => {
        const target = projection.navigator.find((item) => item.occurrenceId === occurrenceId);
        return target ? goTo(target.index) : "save_failed";
      },
      onResponseChange: (change) => setLocalResponse(applyResponseChange(response, projection, change)),
      actions: { primary: simulationPrimaryAction({ complete: isComplete(response, projection), finalOccurrence: projection.position.current === projection.position.total, responseChanged: changed, onSave: () => { void save(); }, onSaveAndContinue: () => { void saveAndContinue(); }, onFinish: () => setOverlay("finish") }), secondary: { accessibilityLabel: "Leave simulation. Opens confirmation to leave and resume later.", id: "leave-session", label: "Leave simulation", onPress: () => setOverlay("leave"), variant: "ghost" } },
    };
  // UI callbacks intentionally refresh with the current application projection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localResponse, overlay, pendingNavigationIndex, screen]);
  return <SimulationSessionSurface projection={surface} />;
}

function base(projection: AlgorithmsSimulationProjection) { return { title: "Interview Simulation", modeLabel: "Interview Simulation", position: simulationPosition(projection), progress: projection.position.current / projection.position.total, runtimeIdentity: { itemId: projection.item.itemId, sessionId: projection.session.id }, timer: simulationTimer(projection.remainingForegroundMs), navigator: frozenNavigator(projection) }; }
type SimulationActionHandlers = Readonly<{ onClose: () => void; onContinueNavigation: () => void; onLeave: () => void; onRecover: () => void; onResumeEditing: () => void; onRetryFinalization: () => void; onRetrySave: () => void }>;
function operationSurface(projection: AlgorithmsSimulationProjection, operation: SimulationDurableOperationState, callbacks: SimulationActionHandlers): SimulationSurfaceProjection {
  const lockedLeave: SimulationAction = { id: "simulation-leave-resumable", label: "Leave and resume later", disabled: true, onPress: noop, variant: "secondary" };
  if (operation.kind === "saving") return operationProjection(projection, "saving", savingOperation(), { primary: { id: "simulation-save", label: "Saving response…", disabled: true, loading: true, onPress: noop }, secondary: lockedLeave });
  if (operation.kind === "save_failed" || operation.kind === "stale_revision") return operationProjection(projection, operation.kind === "save_failed" ? "save_failed" : "stale_revision", saveFailureOperation(callbacks.onResumeEditing), { primary: { id: "simulation-save", label: "Try again", onPress: callbacks.onRetrySave, variant: "destructive" }, secondary: { id: "simulation-leave-resumable", label: "Leave and resume later", onPress: callbacks.onLeave, variant: "secondary" } });
  if (operation.kind === "navigation_failed" || operation.kind === "save_and_continue_advance_recovery") return operationProjection(projection, "recovering", navigationFailureOperation(operation.error.allowedAction === "recover"), { primary: { id: operation.error.allowedAction === "recover" ? "simulation-recover" : "simulation-navigator-jump", label: operation.error.allowedAction === "recover" ? "Resume navigation" : "Continue to next question", onPress: callbacks.onContinueNavigation }, secondary: { id: "simulation-leave-resumable", label: "Leave and resume later", onPress: callbacks.onLeave, variant: "secondary" } });
  if (["frozen", "finalization_journal_pending", "materializing", "verifying", "verified_pending_clear"].includes(operation.kind)) return operationProjection(projection, operation.kind === "frozen" ? "frozen" : "finalizing", finalizingOperation(), { secondary: lockedLeave });
  if (operation.kind === "finalization_journal_failed" || operation.kind === "materialization_failed" || operation.kind === "verification_failed" || operation.kind === "recovery_required") {
    const retry = operation.error.allowedAction === "retry_same_command" ? callbacks.onRetryFinalization : callbacks.onRecover;
    return operationProjection(projection, "recovering", finalizationRecoveryOperation(), { primary: { id: operation.error.allowedAction === "retry_same_command" ? "simulation-finish" : "simulation-recover", label: "Resume finalization", onPress: retry }, secondary: { id: "close", label: "Close", onPress: callbacks.onClose, variant: "secondary" } });
  }
  const state = operation.kind === "abandoning" ? "abandoning" : operation.kind === "completed" ? "completed" : operation.kind === "timer_recovery_failed" ? "timer_recovery_failed" : operation.kind === "missing_draft" ? "missing_draft" : operation.kind === "version_mismatch" ? "version_mismatch" : "corrupt_state";
  return { ...base(projection), state, notice: { tone: "error", message: "This simulation state is unavailable." }, actions: { secondary: { id: "close", label: "Close", onPress: callbacks.onClose, variant: "secondary" } } };
}
function operationProjection(projection: AlgorithmsSimulationProjection, state: SimulationSurfaceProjection["state"], operation: SimulationOperationPresentation, actions: NonNullable<SimulationSurfaceProjection["actions"]>): SimulationSurfaceProjection { return { ...base(projection), state, operation, actions, question: question(projection, responseFromProjection(projection)) }; }
function savingOperation(): SimulationOperationPresentation { return { kind: "saving-response", title: "Saving response", description: "Please wait while your response is saved.", lockMessage: "Editing and navigation are locked until save completes." }; }
function saveFailureOperation(onResumeEditing: () => void): SimulationOperationPresentation { return { kind: "save-failed", title: "Couldn't save this response.", description: "Your last saved response is unchanged.", lockMessage: "You can keep editing or save again.", auxiliaryAction: { id: "simulation-keep-editing", label: "Keep editing", onPress: onResumeEditing, variant: "secondary" } }; }
function navigationFailureOperation(recoveryRequired: boolean): SimulationOperationPresentation { return { kind: "response-saved-navigation-failed", title: "Response saved", description: recoveryRequired ? "Your response is safe. Resume the verified navigation." : "Your response is safe. Continue to open the next question.", lockMessage: "Answer editing is locked while navigation completes." }; }
function finalizingOperation(): SimulationOperationPresentation { return { kind: "finalizing", title: "Finalizing simulation", description: "Your saved responses are being processed. This may take a moment.", lockMessage: "You can't edit answers or navigate while finalization is in progress." }; }
function finalizationRecoveryOperation(): SimulationOperationPresentation { return { kind: "finalization-recovery-required", title: "Finalization incomplete", description: "Your session is frozen and saved responses are preserved.", lockMessage: "Resume finalization before any results are shown." }; }
function unavailableSurface(operation: Extract<SimulationDurableOperationState, { error: unknown }>, close: () => void): SimulationSurfaceProjection { return { state: operation.kind === "missing_draft" ? "missing_draft" : operation.kind === "version_mismatch" ? "version_mismatch" : operation.kind === "timer_recovery_failed" ? "timer_recovery_failed" : "corrupt_state", title: "Interview Simulation unavailable", notice: { tone: "error", message: "Canonical simulation state is unavailable." }, actions: { secondary: { id: "close", label: "Close", onPress: close, variant: "secondary" } } }; }
function noop() {}
function confirmationSurface(projection: AlgorithmsSimulationProjection, state: "finish_confirmation" | "leave_confirmation" | "abandon_confirmation", title: string, description: string, cancel: () => void, confirm: () => void): SimulationSurfaceProjection { return { ...base(projection), state, confirmation: { title, description, secondary: { id: "cancel-confirmation", label: "Keep working", onPress: cancel, variant: "secondary" }, primary: { id: `confirm:${state}`, label: state === "abandon_confirmation" ? "Abandon simulation" : state === "finish_confirmation" ? "Finish simulation" : "Leave and resume later", onPress: confirm, ...(state === "abandon_confirmation" ? { variant: "destructive" as const } : {}) } } }; }
function navigator(projection: AlgorithmsSimulationProjection) { return projection.navigator.map((item) => ({ occurrenceId: item.occurrenceId, state: item.current ? "current" as const : item.answered ? "answered" as const : "unanswered" as const })); }
function frozenNavigator(projection: AlgorithmsSimulationProjection) { return projection.navigator.map((item) => ({ occurrenceId: item.occurrenceId, state: "frozen" as const })); }
function question(projection: AlgorithmsSimulationProjection, response: SimulationResponse | null): SimulationQuestionProjection { const renderer = projection.interaction.renderer; if (renderer.kind === "choice") { const selected = response?.kind === "choice" ? new Set(response.selectedOptionIds) : new Set<string>(); return { prompt: projection.prompt, control: { kind: "choice", selectionMode: projection.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single", options: renderer.options.map((option) => ({ id: option.id, label: option.text, selected: selected.has(option.id) })) } }; } if (renderer.kind === "ordering") return { prompt: projection.prompt, control: { kind: "ordering", elements: renderer.elements.map((item) => ({ id: item.id, label: item.text })) } }; const selected = response?.kind === "complexity" ? response.selectedValuesByDimension : {}; return { prompt: projection.prompt, control: { kind: "complexity", dimensions: renderer.dimensions.map((item) => ({ id: item.id, label: item.id, selectedValue: selected[item.id], values: item.values })) } }; }
function responseFromProjection(projection: AlgorithmsSimulationProjection): SimulationResponse | null { const renderer = projection.interaction.renderer; if (renderer.kind === "choice") return renderer.options.some((item) => item.selected) ? { kind: "choice", selectedOptionIds: renderer.options.filter((item) => item.selected).map((item) => item.id) } : null; if (renderer.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: renderer.elements.map((item) => item.id) }; const selected = Object.fromEntries(renderer.dimensions.flatMap((item) => item.selectedValue ? [[item.id, item.selectedValue]] : [])); return Object.keys(selected).length ? { kind: "complexity", selectedValuesByDimension: selected } : null; }
function applyResponseChange(current: SimulationResponse | null, projection: AlgorithmsSimulationProjection, change: SimulationResponseChange): SimulationResponse { const fallback = responseFromProjection(projection); if (change.kind === "choice") { const selected = new Set((current?.kind === "choice" ? current : fallback?.kind === "choice" ? fallback : { selectedOptionIds: [] }).selectedOptionIds); if (projection.interaction.accessibility.controls[0]?.role === "checkbox") change.selected ? selected.add(change.optionId) : selected.delete(change.optionId); else { selected.clear(); if (change.selected) selected.add(change.optionId); } return { kind: "choice", selectedOptionIds: [...selected] }; } if (change.kind === "ordering") { const values = [...(current?.kind === "ordering" ? current.orderedSubgoalIds : fallback?.kind === "ordering" ? fallback.orderedSubgoalIds : [])]; const index = values.indexOf(change.elementId); const target = index + (change.movement === "up" ? -1 : 1); if (index >= 0 && target >= 0 && target < values.length) [values[index], values[target]] = [values[target]!, values[index]!]; return { kind: "ordering", orderedSubgoalIds: values }; } const values = current?.kind === "complexity" ? current.selectedValuesByDimension : fallback?.kind === "complexity" ? fallback.selectedValuesByDimension : {}; return { kind: "complexity", selectedValuesByDimension: { ...values, [change.dimensionId]: change.value } }; }
function isComplete(response: SimulationResponse | null, projection: AlgorithmsSimulationProjection): boolean { if (!response) return false; if (response.kind === "choice") return response.selectedOptionIds.length > 0; if (response.kind === "ordering") return projection.interaction.renderer.kind === "ordering" && response.orderedSubgoalIds.length === projection.interaction.renderer.elements.length; return projection.interaction.renderer.kind === "complexity" && projection.interaction.renderer.dimensions.every((item) => Boolean(response.selectedValuesByDimension[item.id])); }
function sameResponse(left: SimulationResponse | null, right: SimulationResponse | null) { return JSON.stringify(left) === JSON.stringify(right); }
function simulationPosition(projection: AlgorithmsSimulationProjection) { const label = `${projection.position.current} of ${projection.position.total}`; return { accessibilityLabel: `Question ${label}`, label }; }
