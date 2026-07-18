import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  abandonAlgorithmsSession,
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeResultProjection,
  startAlgorithmsSession,
  type AlgorithmsPracticeProjection,
  type AlgorithmsSessionResultProjection,
  submitAlgorithmsPracticeResponse,
} from "../../application/algorithms";
import { TrainingApplicationFailure } from "../../application/trainingLifecycle";
import { Button, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { getAlgorithmMode, isAlgorithmModeId, type AlgorithmResponse } from "../../tracks/algorithms";
import { ALGORITHM_MODE_IDS } from "../../tracks/algorithms/domain";
import { colors, radius, spacing, typography } from "../../theme";
import { PracticeSessionSurface } from "./PracticeSessionSurface";
import {
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  type PracticeLocalResponse,
  type PracticeNotice,
  type PracticeSurfacePhase,
} from "./practiceSessionPresentation";
import type { PracticeSessionRouteParams } from "./sessionConfig";

type PracticeSessionScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;
type ViewState =
  | Readonly<{ kind: "session"; phase: PracticeSurfacePhase; projection: AlgorithmsPracticeProjection }>
  | Readonly<{ kind: "result"; result: AlgorithmsSessionResultProjection }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

/** Canonical Algorithms Practice runner. It renders application projections and sends only facade commands. */
export function PracticeSessionScreen({ navigation, route }: PracticeSessionScreenProps) {
  const [state, setState] = useState<ViewState | null>(null);
  const [localResponse, setLocalResponse] = useState<PracticeLocalResponse>(null);
  const [notice, setNotice] = useState<PracticeNotice | undefined>();
  const [exit, setExit] = useState<"none" | "leave" | "abandon_confirmation">("none");
  const permitRouteExit = useRef(false);

  const algorithmsMode = route.params.trackId === ALGORITHMS_TRACK_ID && isAlgorithmModeId(route.params.mode)
    ? route.params.mode
    : null;

  useEffect(() => {
    if (!algorithmsMode || algorithmsMode === ALGORITHM_MODE_IDS.interviewSimulation) return;
    let live = true;
    setState(null);
    setLocalResponse(null);
    setNotice(undefined);
    void loadOrStartAlgorithmsPractice(route.params, algorithmsMode)
      .then((projection) => {
        if (!live) return;
        setState({ kind: "session", phase: projection.feedback ? "feedback" : "unanswered", projection });
      })
      .catch((error) => {
        if (live) setState({ kind: "unavailable", reason: describePreparationFailure(error) });
      });
    return () => { live = false; };
  }, [algorithmsMode, route.params]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (permitRouteExit.current || state?.kind !== "session" || state.phase === "abandoning") return;
    event.preventDefault();
    setExit("leave");
  }), [navigation, state]);

  if (!algorithmsMode) {
    return <Screen><EmptyState title="Certification Practice unavailable" description="Certification has no approved bundled artifact yet. Algorithms sessions remain available." actionLabel="Back to practice" onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (algorithmsMode === ALGORITHM_MODE_IDS.interviewSimulation) {
    return <Screen><EmptyState title="Interview Simulation unavailable" description="Interview Simulation must start from its validated 40-item profile entry. No topic-based substitute session was created." actionLabel="Back to practice" onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }
  if (!state) return <PracticeSessionSurface exit={{ kind: "none" }} isFinalPosition={false} onAbandon={noop} onChoicePress={noop} onComplexityValuePress={noop} onConfirmLeave={noop} onDismissExit={noop} onOrderingMove={noop} onRequestAbandon={noop} onRequestLeave={noop} phase="preparing" />;
  if (state.kind === "unavailable") return <Screen><EmptyState title="Practice session unavailable" description={state.reason} actionLabel="Back to practice" onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (state.kind === "result") return <VerifiedPracticeResult result={state.result} onBack={() => navigation.navigate(ROUTES.PRACTICE_HUB)} />;

  const sessionState = state;
  const projection = sessionState.projection;
  const responseControl = buildPracticeResponseControl({
    choiceSelectionMode: projection.interaction.accessibility.controls[0]?.role === "checkbox" ? "multiple" : "single",
    feedbackControls: projection.feedback?.controls,
    localResponse,
    renderer: projection.interaction.renderer,
  });
  const primaryAction = sessionState.phase === "feedback" && notice?.tone === "error" && notice.message.startsWith("Your answer is saved")
    ? { enabled: true, label: "Retry opening next question", loading: false }
    : sessionState.phase === "feedback" && notice?.tone === "error" && notice.message.startsWith("Your final answer is saved")
      ? { enabled: true, label: "Retry verifying session result", loading: false }
    : getPracticePrimaryAction({ hasLocalResponse: localResponse !== null, isFinalPosition: projection.position.current === projection.position.total, phase: sessionState.phase });

  const setPhase = (phase: PracticeSurfacePhase) => setState({ kind: "session", phase, projection });
  const refresh = async (phase?: PracticeSurfacePhase) => {
    const next = await getAlgorithmsPracticeProjection();
    setLocalResponse(null);
    setState({ kind: "session", phase: phase ?? (next.feedback ? "feedback" : "unanswered"), projection: next });
  };

  async function submit() {
    if (!localResponse || sessionState.phase !== "unanswered") return;
    setPhase("submitting");
    setNotice({ message: "Saving your answer…", tone: "neutral" });
    try {
      await submitAlgorithmsPracticeResponse(localResponse);
      await refresh("feedback");
      setNotice(undefined);
    } catch (error) {
      setPhase("unanswered");
      setNotice({ message: isInvalidResponseFailure(error) ? "Complete the response before checking the answer." : "The answer was not saved. No submitted result or feedback was created.", tone: "error" });
    }
  }

  async function advanceOrFinish() {
    if (sessionState.phase !== "feedback") return;
    if (projection.position.current === projection.position.total) {
      setPhase("commit_pending");
      setNotice({ message: "Answer saved. Finishing the update…", tone: "success" });
      try {
        const result = await completeAlgorithmsPracticeSession();
        setState({ kind: "result", result });
        setNotice(undefined);
      } catch {
        setPhase("feedback");
        setNotice({ message: "Your final answer is saved, but the session result could not be verified.", tone: "error" });
      }
      return;
    }
    setPhase("advancing");
    setNotice(undefined);
    try {
      await advanceAlgorithmsPracticeSession();
      await refresh("unanswered");
    } catch {
      setPhase("feedback");
      setNotice({ message: "Your answer is saved, but the next question could not be opened.", tone: "error" });
    }
  }

  async function abandon() {
    setExit("none");
    setPhase("abandoning");
    setNotice({ message: "Abandoning session…", tone: "neutral" });
    try {
      await abandonAlgorithmsSession();
      permitRouteExit.current = true;
      navigation.navigate(ROUTES.PRACTICE_HUB);
    } catch {
      setPhase(projection.feedback ? "feedback" : "unanswered");
      setNotice({ message: "Abandonment did not complete. This session remains available to resume.", tone: "error" });
    }
  }

  function leave() {
    permitRouteExit.current = true;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.PRACTICE_HUB);
  }

  return (
    <PracticeSessionSurface
      exit={{ kind: exit }}
      feedback={projection.feedback ? { details: projection.feedback.details, reason: projection.feedback.reason } : undefined}
      isFinalPosition={projection.position.current === projection.position.total}
      modeLabel={getAlgorithmMode(algorithmsMode).title}
      notice={notice}
      onAbandon={() => void abandon()}
      onChoicePress={(optionId) => setLocalResponse((current) => toggleChoice(current, optionId, responseControl.kind === "choice" ? responseControl.selectionMode : "single"))}
      onComplexityValuePress={(dimensionId, value) => setLocalResponse((current) => setComplexityValue(current, dimensionId, value))}
      onConfirmLeave={leave}
      onDismissExit={() => setExit("none")}
      onOrderingMove={(elementId, direction) => setLocalResponse((current) => moveOrderingElement(current, elementId, direction, responseControl))}
      onPrimaryAction={() => void (notice?.message.startsWith("Your answer is saved") ? advanceOrFinish() : sessionState.phase === "unanswered" ? submit() : advanceOrFinish())}
      onRequestAbandon={() => setExit("abandon_confirmation")}
      onRequestLeave={() => setExit("leave")}
      phase={sessionState.phase}
      positionLabel={`${projection.position.current} of ${projection.position.total}`}
      primaryAction={primaryAction ?? undefined}
      progress={projection.position.current / projection.position.total}
      question={{ constraints: projection.constraints, prompt: projection.prompt, responseControl }}
      timerLabel={`Active time ${formatElapsed(projection.session.activeForegroundMs)}`}
    />
  );
}

async function loadOrStartAlgorithmsPractice(params: PracticeSessionRouteParams, modeId: Exclude<typeof ALGORITHM_MODE_IDS[keyof typeof ALGORITHM_MODE_IDS], typeof ALGORITHM_MODE_IDS.interviewSimulation>) {
  try {
    await startAlgorithmsSession({
      modeId,
      requestedLength: params.sessionLength,
      reviewItemRefs: params.reviewItemRefs,
      reviewSource: params.reviewSource,
      scope: resolveScope(params, modeId),
      source: params.source,
    });
  } catch (error) {
    if (!(error instanceof TrainingApplicationFailure) || error.code !== "active_session_conflict") throw error;
  }
  const projection = await getAlgorithmsPracticeProjection();
  if (projection.session.modeId !== modeId) throw new Error("A different active Algorithms session must be resumed or abandoned before starting this mode.");
  return projection;
}

function resolveScope(params: PracticeSessionRouteParams, modeId: string) {
  if (modeId === ALGORITHM_MODE_IDS.learnApproach || modeId === ALGORITHM_MODE_IDS.guidedPractice) return { roadmapNodeId: params.topicId };
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

function isInvalidResponseFailure(error: unknown): boolean {
  return error instanceof TrainingApplicationFailure && error.code === "invalid_response";
}

function describePreparationFailure(error: unknown): string {
  const detail = error instanceof Error ? error.message : "The session could not be prepared.";
  return `${detail} No substitute topic, item, or shortened fixed session was created.`;
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function noop() {}

function VerifiedPracticeResult({ onBack, result }: Readonly<{ onBack: () => void; result: AlgorithmsSessionResultProjection }>) {
  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.result}>
        <Text style={styles.resultTitle}>Session result</Text>
        <Text style={styles.resultText}>{result.answeredOccurrenceIds.length} answered · {result.unansweredOccurrenceIds.length} unanswered</Text>
        {result.score ? <Text style={styles.resultText}>{result.score.correctCount} correct · {result.score.partialCount} partial · {result.score.incorrectCount} incorrect · {result.score.pointsEarned} / {result.score.maxPoints} points</Text> : <Text style={styles.resultText}>Verified result details are unavailable.</Text>}
        <Button onPress={onBack}>Back to practice</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, margin: spacing.xl, padding: spacing.xl },
  resultText: { ...typography.body, color: colors.dark.textSecondary },
  resultTitle: { ...typography.heading, color: colors.dark.textPrimary },
});
