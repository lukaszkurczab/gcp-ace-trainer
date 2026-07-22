import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import {
  abandonAlgorithmsSession, enterAlgorithmsSimulationForeground, finalizeAlgorithmsSimulation,
  getAlgorithmsSimulationScreenProjection, leaveAlgorithmsSimulationForeground,
  navigateAlgorithmsSimulationTo, saveAlgorithmsSimulationResponse, startAlgorithmsSession,
  subscribeAlgorithmsSimulationProjectionRefresh, type AlgorithmsSimulationProjection,
  type AlgorithmsSimulationScreenProjection,
} from "../../application/algorithms";
import { subscribeTrainingOperationProjection, type SimulationDurableOperationState } from "../../application/trainingLifecycle";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import type { SimulationQuestionProjection, SimulationResponseChange, SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";
import { willAnswerEverySimulationOccurrence } from "./simulationCompletion";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION>;
type SimulationResponse = Parameters<typeof saveAlgorithmsSimulationResponse>[0]["response"];
type Overlay = "none" | "finish" | "leave" | "abandon";

/** This route owns only selection and confirmation overlays. Durable state comes from the application projection. */
export function AlgorithmsInterviewSimulationScreen({ navigation, route }: Props) {
  const [screen, setScreen] = useState<AlgorithmsSimulationScreenProjection | null>(null);
  const [localResponse, setLocalResponse] = useState<SimulationResponse | null>(null);
  const [overlay, setOverlay] = useState<Overlay>("none");
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
      await startAlgorithmsSession({ modeId: "algorithms-interview-simulation", requestedLength: 40, scope: { simulationProfileId: route.params.profileId }, source: "algorithmsInterviewSimulation" });
      await enterAlgorithmsSimulationForeground();
    } catch { /* The projection maps canonical application failures. */ }
    await load();
  }
  async function save() {
    if (screen?.kind !== "ready") return;
    const projection = screen.projection;
    const response = localResponse ?? responseFromProjection(projection);
    if (!response) return;
    const occurrenceId = projection.session.itemOrder[projection.position.current - 1]?.occurrenceId;
    if (!occurrenceId) return;
    try {
      await saveAlgorithmsSimulationResponse({ occurrenceId, response });
      if (willAnswerEverySimulationOccurrence(projection.navigator, occurrenceId)) {
        await finalizeAlgorithmsSimulation();
        navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "manual", sessionId: projection.session.id });
        return;
      }
      const nextIndex = projection.position.current;
      if (nextIndex < projection.position.total) {
        await navigateAlgorithmsSimulationTo(nextIndex);
        setLocalResponse(null);
      }
    } catch { /* Durable state is published by lifecycle. */ }
    await load();
  }
  async function goTo(index: number) { try { await navigateAlgorithmsSimulationTo(index); setLocalResponse(null); } catch { /* projection retains recovery state */ } await load(); }
  async function finish() {
    if (screen?.kind !== "ready") return;
    try { await finalizeAlgorithmsSimulation(); navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "manual", sessionId: screen.projection.session.id }); } catch { await load(); }
  }
  async function abandon() { try { await abandonAlgorithmsSession(); navigation.goBack(); } catch { await load(); } }

  const surface = useMemo<SimulationSurfaceProjection>(() => {
    if (!screen) return { state: "preparing", title: "Preparing Interview Simulation", notice: { tone: "neutral", message: "Loading canonical session state…" } };
    if (screen.kind === "unavailable") return unavailableSurface(screen.operation, () => { void start(); }, () => navigation.goBack());
    const projection = screen.projection;
    const operation = projection.operation;
    const response = localResponse ?? responseFromProjection(projection);
    if (overlay === "finish" && operation.kind === "editable") return confirmationSurface(projection, "finish_confirmation", "Finish with unanswered questions?", `${projection.navigator.filter((item) => item.answered).length} answered. Unanswered questions receive zero points.`, () => setOverlay("none"), () => { void finish(); });
    if (overlay === "leave" && operation.kind === "editable") return confirmationSurface(projection, "leave_confirmation", "Leave and resume later?", "Leaving preserves the latest durable draft.", () => setOverlay("none"), () => navigation.goBack());
    if (overlay === "abandon" && operation.kind === "editable") return confirmationSurface(projection, "abandon_confirmation", "Abandon this simulation?", "Abandoning ends resumability. Durable records remain available.", () => setOverlay("none"), () => { void abandon(); });
    if (operation.kind !== "editable") return operationSurface(projection, operation, () => { void load(); });
    const hasDurableResponse = projection.navigator[projection.position.current - 1]?.answered === true;
    const changed = !hasDurableResponse || !sameResponse(response, responseFromProjection(projection));
    return {
      state: "editable", title: "Interview Simulation", modeLabel: "Interview Simulation", position: simulationPosition(projection),
      progress: projection.position.current / projection.position.total, timer: simulationTimer(projection.remainingForegroundMs),
      notice: { tone: changed ? "neutral" : "success", message: changed ? "Not saved yet" : response ? "Saved" : "No saved response" },
      question: question(projection, response), navigator: navigator(projection), runtimeIdentity: { itemId: projection.item.itemId, sessionId: projection.session.id },
      onOccurrencePress: (occurrenceId) => { const target = projection.navigator.find((item) => item.occurrenceId === occurrenceId); if (target) void goTo(target.index); },
      onResponseChange: (change) => setLocalResponse(applyResponseChange(response, projection, change)),
      actions: changed ? { primary: { id: "save-response", label: "Save and continue", disabled: !isComplete(response, projection), onPress: () => { void save(); } }, secondary: { id: "leave-session", label: "Leave and resume later", onPress: () => setOverlay("leave"), variant: "secondary" } } : { primary: { id: "finish-simulation", label: "Finish simulation", onPress: () => setOverlay("finish") }, secondary: { id: "leave-session", label: "Leave and resume later", onPress: () => setOverlay("leave"), variant: "secondary" } },
    };
  // UI callbacks intentionally refresh with the current application projection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localResponse, overlay, screen]);
  return <SimulationSessionSurface projection={surface} />;
}

function base(projection: AlgorithmsSimulationProjection) { return { title: "Interview Simulation", modeLabel: "Interview Simulation", position: simulationPosition(projection), progress: projection.position.current / projection.position.total, runtimeIdentity: { itemId: projection.item.itemId, sessionId: projection.session.id }, timer: simulationTimer(projection.remainingForegroundMs), navigator: frozenNavigator(projection) }; }
function operationSurface(projection: AlgorithmsSimulationProjection, operation: SimulationDurableOperationState, recover: () => void): SimulationSurfaceProjection {
  const state = operation.kind === "saving" ? "saving" : operation.kind === "stale_revision" ? "stale_revision" : operation.kind === "save_failed" ? "save_failed" : operation.kind === "frozen" ? "frozen" : operation.kind === "finalization_journal_pending" ? "finalization_journal_pending" : operation.kind === "finalization_journal_failed" ? "finalization_journal_failed" : operation.kind === "materializing" || operation.kind === "verifying" ? "finalizing" : operation.kind === "verification_failed" || operation.kind === "materialization_failed" || operation.kind === "verified_pending_clear" || operation.kind === "recovery_required" || operation.kind === "navigation_failed" || operation.kind === "abandonment_recovery_required" ? "recovering" : operation.kind === "abandoning" ? "abandoning" : operation.kind === "completed" ? "completed" : operation.kind === "timer_recovery_failed" ? "timer_recovery_failed" : operation.kind === "missing_draft" ? "missing_draft" : operation.kind === "version_mismatch" ? "version_mismatch" : "corrupt_state";
  const error = "error" in operation ? operation.error : null;
  return { ...base(projection), state, notice: { tone: error ? "error" : "neutral", message: error ? `Canonical operation requires ${error.allowedAction.replaceAll("_", " ")}.` : "Applying canonical operation…" }, ...(error?.allowedAction === "recover" ? { actions: { primary: { id: "recover", label: "Recover", onPress: recover } } } : {}) };
}
function unavailableSurface(operation: Extract<SimulationDurableOperationState, { error: unknown }>, retry: () => void, back: () => void): SimulationSurfaceProjection { return { state: operation.kind === "missing_draft" ? "missing_draft" : operation.kind === "version_mismatch" ? "version_mismatch" : operation.kind === "timer_recovery_failed" ? "timer_recovery_failed" : "corrupt_state", title: "Interview Simulation unavailable", notice: { tone: "error", message: "Canonical simulation state is unavailable." }, actions: { primary: { id: "retry", label: "Try again", onPress: retry }, secondary: { id: "back", label: "Back", onPress: back, variant: "secondary" } } }; }
function confirmationSurface(projection: AlgorithmsSimulationProjection, state: "finish_confirmation" | "leave_confirmation" | "abandon_confirmation", title: string, description: string, cancel: () => void, confirm: () => void): SimulationSurfaceProjection { return { ...base(projection), state, confirmation: { title, description, secondary: { id: "cancel-confirmation", label: "Keep working", onPress: cancel, variant: "secondary" }, primary: { id: `confirm:${state}`, label: state === "abandon_confirmation" ? "Abandon simulation" : state === "finish_confirmation" ? "Finish simulation" : "Leave and resume later", onPress: confirm, ...(state === "abandon_confirmation" ? { variant: "destructive" as const } : {}) } } }; }
function navigator(projection: AlgorithmsSimulationProjection) { return projection.navigator.map((item) => ({ occurrenceId: item.occurrenceId, state: item.current ? "current" as const : item.answered ? "answered" as const : "unanswered" as const })); }
function frozenNavigator(projection: AlgorithmsSimulationProjection) { return projection.navigator.map((item) => ({ occurrenceId: item.occurrenceId, state: "frozen" as const })); }
function question(projection: AlgorithmsSimulationProjection, response: SimulationResponse | null): SimulationQuestionProjection { const renderer = projection.interaction.renderer; if (renderer.kind === "choice") { const selected = response?.kind === "choice" ? new Set(response.selectedOptionIds) : new Set<string>(); return { prompt: projection.prompt, control: { kind: "choice", selectionMode: projection.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single", options: renderer.options.map((option) => ({ id: option.id, label: option.text, selected: selected.has(option.id) })) } }; } if (renderer.kind === "ordering") return { prompt: projection.prompt, control: { kind: "ordering", elements: renderer.elements.map((item) => ({ id: item.id, label: item.text })) } }; const selected = response?.kind === "complexity" ? response.selectedValuesByDimension : {}; return { prompt: projection.prompt, control: { kind: "complexity", dimensions: renderer.dimensions.map((item) => ({ id: item.id, label: item.id, selectedValue: selected[item.id], values: item.values })) } }; }
function responseFromProjection(projection: AlgorithmsSimulationProjection): SimulationResponse | null { const renderer = projection.interaction.renderer; if (renderer.kind === "choice") return renderer.options.some((item) => item.selected) ? { kind: "choice", selectedOptionIds: renderer.options.filter((item) => item.selected).map((item) => item.id) } : null; if (renderer.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: renderer.elements.map((item) => item.id) }; const selected = Object.fromEntries(renderer.dimensions.flatMap((item) => item.selectedValue ? [[item.id, item.selectedValue]] : [])); return Object.keys(selected).length ? { kind: "complexity", selectedValuesByDimension: selected } : null; }
function applyResponseChange(current: SimulationResponse | null, projection: AlgorithmsSimulationProjection, change: SimulationResponseChange): SimulationResponse { const fallback = responseFromProjection(projection); if (change.kind === "choice") { const selected = new Set((current?.kind === "choice" ? current : fallback?.kind === "choice" ? fallback : { selectedOptionIds: [] }).selectedOptionIds); if (projection.interaction.accessibility.controls[0]?.role === "checkbox") change.selected ? selected.add(change.optionId) : selected.delete(change.optionId); else { selected.clear(); if (change.selected) selected.add(change.optionId); } return { kind: "choice", selectedOptionIds: [...selected] }; } if (change.kind === "ordering") { const values = [...(current?.kind === "ordering" ? current.orderedSubgoalIds : fallback?.kind === "ordering" ? fallback.orderedSubgoalIds : [])]; const index = values.indexOf(change.elementId); const target = index + (change.movement === "up" ? -1 : 1); if (index >= 0 && target >= 0 && target < values.length) [values[index], values[target]] = [values[target]!, values[index]!]; return { kind: "ordering", orderedSubgoalIds: values }; } const values = current?.kind === "complexity" ? current.selectedValuesByDimension : fallback?.kind === "complexity" ? fallback.selectedValuesByDimension : {}; return { kind: "complexity", selectedValuesByDimension: { ...values, [change.dimensionId]: change.value } }; }
function isComplete(response: SimulationResponse | null, projection: AlgorithmsSimulationProjection): boolean { if (!response) return false; if (response.kind === "choice") return response.selectedOptionIds.length > 0; if (response.kind === "ordering") return projection.interaction.renderer.kind === "ordering" && response.orderedSubgoalIds.length === projection.interaction.renderer.elements.length; return projection.interaction.renderer.kind === "complexity" && projection.interaction.renderer.dimensions.every((item) => Boolean(response.selectedValuesByDimension[item.id])); }
function sameResponse(left: SimulationResponse | null, right: SimulationResponse | null) { return JSON.stringify(left) === JSON.stringify(right); }
function timerLabel(remainingMs: number) { const seconds = Math.max(0, Math.floor(remainingMs / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function simulationTimer(remainingMs: number) { const label = timerLabel(remainingMs); return { accessibilityLabel: `Time remaining ${label}`, label }; }
function simulationPosition(projection: AlgorithmsSimulationProjection) { const label = `${projection.position.current} of ${projection.position.total}`; return { accessibilityLabel: `Question ${label}`, label }; }
