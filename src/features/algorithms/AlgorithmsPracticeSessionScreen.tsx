import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import {
  createAlgorithmsImmediatePracticeController,
  type AlgorithmsImmediatePracticeControllerState,
  type AlgorithmsRuntimeState,
} from "../../application/algorithms";
import { Badge, Button, Card, EmptyState, ProgressBar, Screen, SectionHeader } from "../../components";
import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { colors, radius, spacing, typography } from "../../theme";
import {
  ALGORITHM_MODE_IDS,
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmModeId,
  isAlgorithmOrderingQuestion,
  resolveAlgorithmSessionNode,
  type AlgorithmQuestion,
  type AlgorithmResponse,
  type AlgorithmRoadmapNodeId,
} from "../../tracks/algorithms";
import type { PracticeSessionRouteParams } from "../practice/sessionConfig";
import { resetToPracticeHubAfterSession } from "../practice/practiceNavigation";
import { SessionPreparingShell } from "../practice/SessionPreparingShell";
import {
  ChoiceQuestionRenderer,
  ComplexityQuestionRenderer,
  OrderingQuestionRenderer,
} from "./interviewSimulation/renderers";

type Props = Readonly<{
  navigation: NativeStackNavigationProp<RootStackParamList>;
  nodeId?: string;
  sessionConfig: PracticeSessionRouteParams;
}>;

const INITIAL_STATE: AlgorithmsImmediatePracticeControllerState = {
  error: null,
  operation: { kind: "idle" },
  runtime: null,
  status: "preparing",
};

/**
 * Presentation-only session shell for every non-simulation Algorithms mode.
 * The controller owns all runtime and durability transitions; this component
 * contains only transient controls, foreground measurement, and layout.
 */
export function AlgorithmsPracticeSessionScreen({ navigation, nodeId, sessionConfig }: Props) {
  const controllerRef = useRef<ReturnType<typeof createAlgorithmsImmediatePracticeController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createAlgorithmsImmediatePracticeController();
  const controller = controllerRef.current;
  const [state, setState] = useState<AlgorithmsImmediatePracticeControllerState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [response, setResponse] = useState<AlgorithmResponse | null>(null);
  const [displayElapsedMs, setDisplayElapsedMs] = useState(0);
  const foregroundStartedAt = useRef<number | null>(null);
  const foregroundFlush = useRef<Promise<AlgorithmsImmediatePracticeControllerState> | null>(null);

  const resolvedNodeId = resolveAlgorithmSessionNode(nodeId).id;
  const modeId = sessionConfig.mode;
  if (sessionConfig.trackId !== ALGORITHMS_TRACK_ID || !isAlgorithmModeId(modeId) || modeId === ALGORITHM_MODE_IDS.interviewSimulation) {
    throw new Error("Algorithms practice presentation accepts only non-simulation Algorithms routes.");
  }

  useEffect(() => controller.subscribe(setState), [controller]);

  const start = useCallback(async () => {
    await controller.start({
      modeId,
      nodeId: resolvedNodeId as AlgorithmRoadmapNodeId,
      reviewItemRefs: sessionConfig.reviewItemRefs,
      reviewSource: sessionConfig.reviewSource,
    });
  }, [controller, modeId, resolvedNodeId, sessionConfig.reviewItemRefs, sessionConfig.reviewSource]);

  useFocusEffect(
    useCallback(() => {
      void start();
      return undefined;
    }, [start]),
  );

  const flushForeground = useCallback(async (): Promise<AlgorithmsImmediatePracticeControllerState> => {
    if (foregroundFlush.current) return foregroundFlush.current;
    const startedAt = foregroundStartedAt.current;
    const runtime = stateRef.current.runtime;
    if (startedAt === null || !runtime || runtime.session.status !== "active") return stateRef.current;
    foregroundStartedAt.current = null;
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    const operation = controller.recordForegroundTime(elapsedMs)
      .then((next) => {
        if (next.status === "active" && AppState.currentState === "active") foregroundStartedAt.current = Date.now();
        return next;
      })
      .finally(() => { foregroundFlush.current = null; });
    foregroundFlush.current = operation;
    return operation;
  }, [controller]);

  useEffect(() => {
    const runtime = state.runtime;
    if (!runtime || runtime.session.status !== "active") {
      foregroundStartedAt.current = null;
      return undefined;
    }
    if (AppState.currentState === "active" && foregroundStartedAt.current === null) foregroundStartedAt.current = Date.now();
    setDisplayElapsedMs(runtime.session.activeForegroundMs);
    const interval = setInterval(() => {
      const startedAt = foregroundStartedAt.current;
      setDisplayElapsedMs(runtime.session.activeForegroundMs + (startedAt === null ? 0 : Math.max(0, Date.now() - startedAt)));
    }, 1000);
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        if (stateRef.current.status === "active") foregroundStartedAt.current = Date.now();
        return;
      }
      void flushForeground();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
      void flushForeground();
    };
  }, [
    flushForeground,
    state.runtime?.session.activeForegroundMs,
    state.runtime?.session.id,
    state.runtime?.session.status,
  ]);

  const runtime = state.runtime;
  const currentOccurrenceId = runtime?.session.itemOrder[runtime.session.currentItemIndex]?.occurrenceId;
  const persistedResponse = useMemo(
    () => runtime && currentOccurrenceId
      ? runtime.attempts.find((attempt) => attempt.occurrenceId === currentOccurrenceId)?.response ?? null
      : null,
    [currentOccurrenceId, runtime],
  );
  const visibleResponse = runtime?.feedback ? persistedResponse : response;

  useEffect(() => {
    setResponse(runtime?.feedback ? persistedResponse : null);
  }, [currentOccurrenceId, persistedResponse, runtime?.feedback]);

  function updateResponse(next: AlgorithmResponse | null): void {
    const nextState = controller.setResponse(next);
    if (nextState.status !== "active") return;
    setResponse(next);
  }

  async function withForeground(
    command: (foregroundElapsedMs: number) => Promise<AlgorithmsImmediatePracticeControllerState>,
  ): Promise<AlgorithmsImmediatePracticeControllerState> {
    const startedAt = foregroundStartedAt.current;
    foregroundStartedAt.current = null;
    const elapsedMs = startedAt === null ? 0 : Math.max(0, Date.now() - startedAt);
    const next = await command(elapsedMs);
    if (next.status === "active" && AppState.currentState === "active") foregroundStartedAt.current = Date.now();
    return next;
  }

  async function submit(): Promise<void> {
    await withForeground((elapsedMs) => controller.submit(elapsedMs));
  }

  async function continueSession(): Promise<void> {
    const next = await withForeground((elapsedMs) => controller.continue(elapsedMs));
    if (next.status === "active") setResponse(null);
  }

  if (state.status === "preparing" || (state.operation.kind === "recovering" || state.operation.kind === "starting") && state.operation.status === "pending") {
    return <SessionPreparingShell title="Preparing Algorithms session" description="Restoring your canonical session state." onClose={() => resetToPracticeHubAfterSession(navigation, resolvedNodeId)} />;
  }

  if (state.status === "error" || !runtime) {
    return (
      <Screen>
        <EmptyState
          title="Algorithms session unavailable"
          description={state.error ?? "The Algorithms session could not be prepared."}
          actionLabel={state.operation.kind === "starting" || state.operation.kind === "recovering" ? "Retry" : "Back to Practice"}
          onActionPress={() => state.operation.kind === "starting" || state.operation.kind === "recovering" ? void start() : resetToPracticeHubAfterSession(navigation, resolvedNodeId)}
        />
      </Screen>
    );
  }

  if (state.status === "completed") {
    return <ImmediatePracticeSummary navigation={navigation} nodeId={resolvedNodeId} runtime={runtime} />;
  }

  const question = runtime.currentQuestion;
  const feedback = runtime.feedback;
  const isPending = isOperationPending(state.operation);
  const isSubmitted = feedback !== null;
  const complete = isCompleteResponse(question, visibleResponse);
  const currentIndex = runtime.session.currentItemIndex;
  const orderedOptions = getOrderedOptionIds(runtime, question, currentOccurrenceId);

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        isSubmitted ? (
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.feedbackStatus}>{formatScoreStatus(feedback.score.status)}</Text>
              <Text style={styles.feedbackPoints}>{feedback.score.result.earnedPoints} / {feedback.score.result.maxPoints} points</Text>
            </View>
            <Button disabled={isPending} onPress={() => void continueSession()}>{currentIndex >= runtime.session.actualLength - 1 ? "Finish" : "Next"}</Button>
          </View>
        ) : <Button disabled={!complete || isPending} onPress={() => void submit()}>Check answer</Button>
      }
    >
      <View style={styles.topBar}>
        <Text style={styles.timer}>{formatElapsed(displayElapsedMs)}</Text>
        <Text style={styles.count}>{currentIndex + 1} OF {runtime.session.actualLength}</Text>
      </View>
      <ProgressBar progress={(currentIndex + 1) / runtime.session.actualLength} tone="primary" />
      <Card style={styles.questionCard}>
        <Text style={styles.eyebrow}>{runtime.mode.title}</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
        <View style={styles.badges}>
          <Badge label={question.roadmapNodeId ?? "Algorithms"} tone="primary" />
          <Badge label={formatQuestionType(question)} tone="neutral" />
        </View>
      </Card>
      <Card style={styles.answerCard}>
        <SectionHeader title="Answer" tight />
        <ImmediateQuestionRenderer disabled={isPending || isSubmitted} onChange={updateResponse} optionOrder={orderedOptions} question={question} response={visibleResponse} />
      </Card>
      {feedback ? <ImmediateFeedback question={question} runtime={runtime} /> : null}
      {isOperationFailed(state.operation) ? <Card variant="warning" style={styles.errorCard}><Text style={styles.errorText}>{state.error}</Text><Button onPress={() => isSubmitted ? void continueSession() : void submit()} variant="secondary">Retry</Button></Card> : null}
    </Screen>
  );
}

function ImmediatePracticeSummary({ navigation, nodeId, runtime }: Readonly<{ navigation: NativeStackNavigationProp<RootStackParamList>; nodeId: string; runtime: AlgorithmsRuntimeState }>) {
  const summary = runtime.summary;
  return (
    <Screen edges={["top", "bottom"]}>
      <Card variant="tonal" style={styles.summaryCard}>
        <Text style={styles.eyebrow}>Session complete</Text>
        <SectionHeader title="Algorithms practice complete" subtitle="Your submitted outcomes have been recorded." />
        <View style={styles.metrics}>
          <Metric label="Completed" value={summary?.completed ?? 0} />
          <Metric label="Correct" value={summary?.correct ?? 0} />
          <Metric label="Partial" value={summary?.partial ?? 0} />
          <Metric label="Incorrect" value={summary?.incorrect ?? 0} />
        </View>
      </Card>
      <Button onPress={() => resetToPracticeHubAfterSession(navigation, nodeId)}>Return to practice</Button>
    </Screen>
  );
}

function ImmediateQuestionRenderer({ disabled, onChange, optionOrder, question, response }: Readonly<{ disabled: boolean; onChange: (response: AlgorithmResponse | null) => void; optionOrder: readonly string[]; question: AlgorithmQuestion; response: AlgorithmResponse | null }>) {
  if (isAlgorithmChoiceQuestion(question)) {
    const selected = response?.kind === "choice" ? response.selectedOptionIds : [];
    const multiple = question.options.filter((option) => option.isCorrect).length > 1;
    const options = [...question.options]
      .sort((left, right) => optionOrder.indexOf(left.id) - optionOrder.indexOf(right.id))
      .map((option, index) => ({ id: option.id, label: String.fromCharCode(65 + index), text: option.text }));
    return <ChoiceQuestionRenderer disabled={disabled} multiple={multiple} onChange={(optionId) => onChange({ kind: "choice", selectedOptionIds: multiple ? selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId] : [optionId] })} options={options} selectedOptionIds={selected} />;
  }
  if (isAlgorithmOrderingQuestion(question)) {
    const ordered = response?.kind === "ordering" ? response.orderedSubgoalIds : question.subgoals.map((subgoal) => subgoal.id);
    const move = (stepId: string, direction: -1 | 1) => {
      const index = ordered.indexOf(stepId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
      const next = [...ordered];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      onChange({ kind: "ordering", orderedSubgoalIds: next });
    };
    return <OrderingQuestionRenderer disabled={disabled} onMoveDown={(id) => move(id, 1)} onMoveUp={(id) => move(id, -1)} onReset={() => onChange(null)} steps={ordered.map((id) => ({ id, text: question.subgoals.find((subgoal) => subgoal.id === id)?.text ?? id }))} />;
  }
  if (isAlgorithmComplexityQuestion(question)) {
    const selected = response?.kind === "complexity" ? response.selectedValuesByDimension : {};
    return <ComplexityQuestionRenderer disabled={disabled} dimensions={question.correctComplexity.dimensions.map((dimension) => ({ id: dimension.id, label: dimension.id === "time" ? "Time" : "Space", options: dimension.values }))} onChange={(dimensionId, value) => onChange({ kind: "complexity", selectedValuesByDimension: { ...selected, [dimensionId]: value } })} selectedValues={selected} />;
  }
  return null;
}

function ImmediateFeedback({ question, runtime }: Readonly<{ question: AlgorithmQuestion; runtime: AlgorithmsRuntimeState }>) {
  const feedback = runtime.feedback;
  if (!feedback) return null;
  return (
    <Card variant={feedback.score.status === "correct" ? "success" : "warning"} style={styles.feedbackCard}>
      <Badge label={formatScoreStatus(feedback.score.status)} tone={feedback.score.status === "correct" ? "success" : "warning"} />
      <Text style={styles.feedbackTitle}>Core reason</Text>
      <Text style={styles.feedbackText}>{feedback.score.feedback}</Text>
      <Text style={styles.feedbackTitle}>Recognition signal</Text>
      <Text style={styles.feedbackText}>{question.feedbackModel.decisionSignal}</Text>
      <Text style={styles.feedbackTitle}>Next action</Text>
      <Text style={styles.feedbackText}>{question.feedbackModel.nextAction}</Text>
    </Card>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function getOrderedOptionIds(runtime: AlgorithmsRuntimeState, question: AlgorithmQuestion, occurrenceId?: string): readonly string[] {
  if (!isAlgorithmChoiceQuestion(question) || !occurrenceId) return [];
  return runtime.session.optionOrderByOccurrence[occurrenceId] ?? question.options.map((option) => option.id);
}

function isCompleteResponse(question: AlgorithmQuestion, response: AlgorithmResponse | null): boolean {
  if (!response) return false;
  if (isAlgorithmChoiceQuestion(question)) return response.kind === "choice" && response.selectedOptionIds.length > 0;
  if (isAlgorithmOrderingQuestion(question)) return response.kind === "ordering" && response.orderedSubgoalIds.length === question.subgoals.length;
  return response.kind === "complexity" && question.correctComplexity.dimensions.every((dimension) => Boolean(response.selectedValuesByDimension[dimension.id]));
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatScoreStatus(status: "correct" | "partial" | "incorrect"): string {
  return status === "correct" ? "Correct" : status === "partial" ? "Partially correct" : "Incorrect";
}

function formatQuestionType(question: AlgorithmQuestion): string {
  if (isAlgorithmChoiceQuestion(question)) return "Choice";
  if (isAlgorithmOrderingQuestion(question)) return "Ordering";
  return "Complexity";
}

function isOperationPending(operation: AlgorithmsImmediatePracticeControllerState["operation"]): boolean {
  return "status" in operation && operation.status === "pending";
}

function isOperationFailed(operation: AlgorithmsImmediatePracticeControllerState["operation"]): boolean {
  return "status" in operation && operation.status === "failed";
}

const styles = StyleSheet.create({
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  timer: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  count: { ...typography.caption, color: colors.dark.textSecondary, textTransform: "uppercase" },
  questionCard: { gap: spacing.md, marginTop: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.dark.textMuted, textTransform: "uppercase" },
  prompt: { ...typography.heading, color: colors.dark.textPrimary },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  answerCard: { gap: spacing.md, marginTop: spacing.md },
  footerRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  feedbackStatus: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  feedbackPoints: { ...typography.caption, color: colors.dark.textSecondary },
  feedbackCard: { gap: spacing.sm, marginTop: spacing.md },
  feedbackTitle: { ...typography.caption, color: colors.dark.textMuted, marginTop: spacing.xs, textTransform: "uppercase" },
  feedbackText: { ...typography.small, color: colors.dark.textPrimary },
  errorCard: { gap: spacing.sm, marginTop: spacing.md },
  errorText: { ...typography.small, color: colors.dark.danger },
  summaryCard: { gap: spacing.md },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: { backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, minWidth: "45%", padding: spacing.md },
  metricValue: { ...typography.title, color: colors.dark.textPrimary },
  metricLabel: { ...typography.caption, color: colors.dark.textSecondary },
});
