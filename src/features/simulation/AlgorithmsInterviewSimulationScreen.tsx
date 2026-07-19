import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import {
  abandonAlgorithmsSession,
  enterAlgorithmsSimulationForeground,
  finalizeAlgorithmsSimulation,
  getAlgorithmsSimulationProjection,
  leaveAlgorithmsSimulationForeground,
  navigateAlgorithmsSimulationTo,
  saveAlgorithmsSimulationResponse,
  startAlgorithmsSession,
  subscribeAlgorithmsSimulationProjectionRefresh,
  type AlgorithmsSimulationProjection,
} from "../../application/algorithms";
import { TrainingApplicationFailure } from "../../application/trainingLifecycle";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import type { SimulationQuestionProjection, SimulationResponseChange, SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION>;
type SimulationResponse = Parameters<typeof saveAlgorithmsSimulationResponse>[0]["response"];
type Operation = "idle" | "saving" | "finalizing" | "abandoning";
type Overlay = "none" | "finish" | "leave" | "abandon";

/** Canonical route controller: it only requests projections and dispatches application commands. */
export function AlgorithmsInterviewSimulationScreen({ navigation, route }: Props) {
  const [projection, setProjection] = useState<AlgorithmsSimulationProjection | null>(null);
  const [localResponse, setLocalResponse] = useState<SimulationResponse | null>(null);
  const [operation, setOperation] = useState<Operation>("idle");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [failure, setFailure] = useState<string | null>(null);
  const [finalizationFailure, setFinalizationFailure] = useState<string | null>(null);
  const [abandonmentFailure, setAbandonmentFailure] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await getAlgorithmsSimulationProjection();
      setProjection(next);
      setFailure(null);
    } catch (error) {
      setFailure(messageFor(error));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void start();
    return () => { void leaveAlgorithmsSimulationForeground().catch(() => undefined); };
  // Foreground ownership is application-owned; this route only signals focus.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, route.params.profileId]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      const command = state === "active" ? enterAlgorithmsSimulationForeground : leaveAlgorithmsSimulationForeground;
      void command().then(() => load()).catch((error) => setFailure(messageFor(error)));
    });
    return () => subscription.remove();
  }, [load]);

  useEffect(() => subscribeAlgorithmsSimulationProjectionRefresh((event) => {
    if (event.kind === "expired") {
      navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "timeout", sessionId: event.sessionId });
      return;
    }
    void load();
  }), [load, navigation]);

  useEffect(() => {
    if (!projection || localResponse !== null) return;
    setLocalResponse(responseFromProjection(projection));
  }, [localResponse, projection]);

  const surface = useMemo<SimulationSurfaceProjection>(() => {
    if (!projection) {
      return {
        state: failure ? unavailableState(failure) : "preparing",
        title: failure ? "Interview Simulation unavailable" : "Preparing Interview Simulation",
        notice: { tone: failure ? "error" : "neutral", message: failure ?? "Checking the required 40 unique items and creating your draft." },
        actions: failure ? { primary: { label: "Try again", onPress: () => { void start(); } }, secondary: { label: "Back", onPress: () => navigation.goBack(), variant: "secondary" } } : undefined,
      };
    }

    const response = localResponse ?? responseFromProjection(projection);
    const changed = !sameResponse(response, responseFromProjection(projection));
    const currentOccurrenceId = projection.session.itemOrder[projection.position.current - 1]?.occurrenceId;
    const activeState = operation === "saving" ? "saving" : failure ? "save_failed" : "editable";
    const activeNotice = operation === "saving"
      ? { tone: "neutral" as const, message: "Saving…" }
      : failure
        ? { tone: "error" as const, message: "The response was not saved. Your last saved draft is unchanged." }
        : changed
          ? { tone: "neutral" as const, message: "Not saved yet" }
          : response === null
            ? { tone: "neutral" as const, message: "No saved response" }
            : { tone: "success" as const, message: "Saved" };

    if (operation === "finalizing") return {
      state: "finalizing",
      title: "Interview Simulation",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      navigator: frozenNavigator(projection),
      notice: { tone: "neutral", message: "Finalizing session…" },
    };

    if (finalizationFailure) return {
      state: "finalization_failed",
      title: "Finalization recovery required",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      navigator: frozenNavigator(projection),
      notice: { tone: "error", message: `Finalization did not complete. The frozen session can be retried safely. ${finalizationFailure}` },
      actions: { primary: { label: "Retry finalization", onPress: () => { void finish(); } } },
    };

    if (overlay === "finish") return {
      state: "finish_confirmation",
      title: "Finish Interview Simulation",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      navigator: navigator(projection),
      confirmation: {
        title: "Finish with unanswered questions?",
        description: `${projection.navigator.filter((position) => position.answered).length} answered. ${projection.navigator.filter((position) => !position.answered).length} unanswered questions receive zero points.`,
        secondary: { label: "Keep working", onPress: () => setOverlay("none"), variant: "secondary" },
        primary: { label: "Finish simulation", onPress: () => { void finish(); } },
      },
    };

    if (overlay === "leave") return {
      state: "leave_confirmation",
      title: "Leave Interview Simulation",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      confirmation: {
        title: "Leave and resume later?",
        description: "Leaving preserves this active session and its latest durable draft for resume.",
        secondary: { label: "Continue simulation", onPress: () => setOverlay("none"), variant: "secondary" },
        primary: { label: "Leave and resume later", onPress: () => navigation.goBack() },
      },
    };

    if (overlay === "abandon") return {
      state: operation === "abandoning" ? "abandoning" : "abandon_confirmation",
      title: "Abandon Interview Simulation",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      confirmation: {
        title: "Abandon this simulation?",
        description: "Abandoning ends resumability and discards unsaved local changes. Durable records remain unchanged.",
        secondary: { label: "Keep session", disabled: operation === "abandoning", onPress: () => { setOverlay("none"); setAbandonmentFailure(null); }, variant: "secondary" },
        primary: { label: "Abandon simulation", loading: operation === "abandoning", onPress: () => { void abandon(); }, variant: "destructive" },
      },
      ...(abandonmentFailure ? { notice: { tone: "error" as const, message: `Abandonment did not complete. The session remains resumable. ${abandonmentFailure}` } } : {}),
    };

    return {
      state: activeState,
      title: "Interview Simulation",
      modeLabel: "Interview Simulation",
      positionLabel: `${projection.position.current} of ${projection.position.total}`,
      progress: projection.position.current / projection.position.total,
      timerLabel: timerLabel(projection.remainingForegroundMs),
      notice: activeNotice,
      question: question(projection, response),
      navigator: navigator(projection),
      onOccurrencePress: (occurrenceId) => { void goTo(occurrenceId); },
      onResponseChange: (change) => setLocalResponse(applyResponseChange(response, projection, change)),
      actions: changed
        ? { primary: { label: "Save response", disabled: !isComplete(response, projection), loading: operation === "saving", onPress: () => { void save(); } }, secondary: { label: "Leave and resume later", onPress: () => setOverlay("leave"), variant: "secondary" } }
        : { primary: { label: "Finish simulation", onPress: () => setOverlay("finish") }, secondary: { label: "Leave and resume later", onPress: () => setOverlay("leave"), variant: "secondary" } },
    };
  // Commands and navigation intentionally change identity when projection reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abandonmentFailure, failure, finalizationFailure, localResponse, operation, overlay, projection]);

  async function start() {
    setFailure(null); setFinalizationFailure(null);
    try {
      await startAlgorithmsSession({
        modeId: "algorithms-interview-simulation",
        requestedLength: 40,
        scope: { simulationProfileId: route.params.profileId },
        source: "algorithmsInterviewSimulation",
      });
      await enterAlgorithmsSimulationForeground();
      await load();
    } catch (error) {
      if (error instanceof TrainingApplicationFailure && error.code === "active_session_conflict") {
        try {
          await enterAlgorithmsSimulationForeground();
          await load();
        } catch (resumeError) {
          setFailure(messageFor(resumeError));
        }
        return;
      }
      setFailure(messageFor(error));
    }
  }

  async function save() {
    if (!projection || !localResponse) return;
    const occurrenceId = projection.session.itemOrder[projection.position.current - 1]?.occurrenceId;
    if (!occurrenceId) return setFailure("The current simulation occurrence is unavailable.");
    setOperation("saving"); setFailure(null);
    try { await saveAlgorithmsSimulationResponse({ occurrenceId, response: localResponse }); await load(); }
    catch (error) { setFailure(messageFor(error)); }
    finally { setOperation("idle"); }
  }

  async function goTo(occurrenceId: string) {
    if (!projection) return;
    const position = projection.navigator.find((entry) => entry.occurrenceId === occurrenceId);
    if (!position) return;
    try { await navigateAlgorithmsSimulationTo(position.index); setLocalResponse(null); await load(); }
    catch (error) { setFailure(messageFor(error)); }
  }

  async function finish() {
    setOperation("finalizing"); setFailure(null); setFinalizationFailure(null);
    try {
      await finalizeAlgorithmsSimulation();
      if (projection) navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "manual", sessionId: projection.session.id });
    } catch (error) { setFinalizationFailure(messageFor(error)); setOverlay("none"); }
    finally { setOperation("idle"); }
  }

  async function abandon() {
    setOperation("abandoning"); setFailure(null); setAbandonmentFailure(null);
    try { await abandonAlgorithmsSession(); navigation.goBack(); }
    catch (error) { setAbandonmentFailure(messageFor(error)); setOverlay("abandon"); }
    finally { setOperation("idle"); }
  }

  return <SimulationSessionSurface projection={surface} />;
}

function navigator(projection: AlgorithmsSimulationProjection) {
  return projection.navigator.map((position) => ({ occurrenceId: position.occurrenceId, state: position.current ? "current" as const : position.answered ? "answered" as const : "unanswered" as const }));
}

function frozenNavigator(projection: AlgorithmsSimulationProjection) {
  return projection.navigator.map((position) => ({ occurrenceId: position.occurrenceId, state: "frozen" as const }));
}

function question(projection: AlgorithmsSimulationProjection, response: SimulationResponse | null): SimulationQuestionProjection {
  const renderer = projection.interaction.renderer;
  if (renderer.kind === "choice") {
    const selected = response?.kind === "choice" ? new Set(response.selectedOptionIds) : new Set<string>();
    return { prompt: projection.prompt, control: { kind: "choice", selectionMode: projection.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single", options: renderer.options.map((option) => ({ id: option.id, label: option.text, selected: selected.has(option.id) })) } };
  }
  if (renderer.kind === "ordering") return { prompt: projection.prompt, control: { kind: "ordering", elements: renderer.elements.map((element) => ({ id: element.id, label: element.text })) } };
  const selected = response?.kind === "complexity" ? response.selectedValuesByDimension : {};
  return { prompt: projection.prompt, control: { kind: "complexity", dimensions: renderer.dimensions.map((dimension) => ({ id: dimension.id, label: dimension.id, selectedValue: selected[dimension.id], values: dimension.values })) } };
}

function responseFromProjection(projection: AlgorithmsSimulationProjection): SimulationResponse | null {
  const renderer = projection.interaction.renderer;
  if (renderer.kind === "choice") return renderer.options.some((option) => option.selected) ? { kind: "choice", selectedOptionIds: renderer.options.filter((option) => option.selected).map((option) => option.id) } : null;
  if (renderer.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: renderer.elements.map((element) => element.id) };
  const selected = Object.fromEntries(renderer.dimensions.flatMap((dimension) => dimension.selectedValue ? [[dimension.id, dimension.selectedValue]] : []));
  return Object.keys(selected).length ? { kind: "complexity", selectedValuesByDimension: selected } : null;
}

function applyResponseChange(current: SimulationResponse | null, projection: AlgorithmsSimulationProjection, change: SimulationResponseChange): SimulationResponse {
  const fallback = responseFromProjection(projection);
  if (change.kind === "choice") {
    const selected = new Set((current?.kind === "choice" ? current : fallback?.kind === "choice" ? fallback : { selectedOptionIds: [] }).selectedOptionIds);
    const multiple = projection.interaction.accessibility.controls[0]?.role === "checkbox";
    if (multiple) change.selected ? selected.add(change.optionId) : selected.delete(change.optionId);
    else { selected.clear(); if (change.selected) selected.add(change.optionId); }
    return { kind: "choice", selectedOptionIds: [...selected] };
  }
  if (change.kind === "ordering") {
    const values = [...(current?.kind === "ordering" ? current.orderedSubgoalIds : fallback?.kind === "ordering" ? fallback.orderedSubgoalIds : [])];
    const index = values.indexOf(change.elementId); const target = index + (change.movement === "up" ? -1 : 1);
    if (index >= 0 && target >= 0 && target < values.length) [values[index], values[target]] = [values[target]!, values[index]!];
    return { kind: "ordering", orderedSubgoalIds: values };
  }
  const base = current?.kind === "complexity" ? current.selectedValuesByDimension : fallback?.kind === "complexity" ? fallback.selectedValuesByDimension : {};
  return { kind: "complexity", selectedValuesByDimension: { ...base, [change.dimensionId]: change.value } };
}

function isComplete(response: SimulationResponse | null, projection: AlgorithmsSimulationProjection): boolean {
  if (!response) return false;
  if (response.kind === "choice") return response.selectedOptionIds.length > 0;
  if (response.kind === "ordering") {
    return projection.interaction.renderer.kind === "ordering" && response.orderedSubgoalIds.length === projection.interaction.renderer.elements.length;
  }
  return projection.interaction.renderer.kind === "complexity" && projection.interaction.renderer.dimensions.every((dimension) => Boolean(response.selectedValuesByDimension[dimension.id]));
}

function sameResponse(left: SimulationResponse | null, right: SimulationResponse | null): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function timerLabel(remainingMs: number): string { const seconds = Math.max(0, Math.floor(remainingMs / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function messageFor(error: unknown): string { return error instanceof Error && error.message.trim() ? error.message : "The simulation could not continue safely."; }
function unavailableState(message: string): "insufficient_content" | "missing_draft" | "version_mismatch" | "corrupt_state" {
  const normalized = message.toLowerCase();
  if (normalized.includes("draft")) return "missing_draft";
  if (normalized.includes("version") || normalized.includes("fingerprint")) return "version_mismatch";
  if (normalized.includes("40") || normalized.includes("pool") || normalized.includes("content")) return "insufficient_content";
  return "corrupt_state";
}
