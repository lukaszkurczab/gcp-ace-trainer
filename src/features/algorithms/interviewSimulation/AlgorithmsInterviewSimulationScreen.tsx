import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import {
  createAlgorithmsInterviewSimulationController,
  type AlgorithmsInterviewSimulationControllerState,
} from "../../../application/algorithms";
import { Button, Card, EmptyState, Icon, Screen, SectionHeader } from "../../../components";
import { ROUTES } from "../../../constants";
import type { RootStackParamList } from "../../../navigation";
import { colors, radius, spacing, typography } from "../../../theme";
import {
  buildSimulationNavigatorItems,
  SimulationBottomActions,
  SimulationExitPanel,
  SimulationFinalizationPanel,
  SimulationFlagControl,
  SimulationNavigatorGrid,
  SimulationPersistenceErrorPanel,
  SimulationSubmissionPanel,
  SimulationTopBar,
  SimulationDraftIntentQueue,
  formatSimulationItemProgress,
  getSimulationProgress,
  getSimulationTimerTone,
  isSimulationPresentationBlocked,
  isSimulationQuestionRenderable,
} from ".";
import { SimulationQuestionPresentation } from "./SimulationQuestionPresentation";

type Props = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION
>;

type SimulationPanel = "active" | "exit" | "navigator" | "submit" | "finalizing";
type NavigatorFilter = "all" | "flagged" | "unanswered";

const INITIAL_STATE: AlgorithmsInterviewSimulationControllerState = {
  activeInspection: null,
  failure: null,
  operation: { kind: "idle" },
  runtime: null,
  status: "setup",
  terminal: null,
};

/**
 * The sole active-session presentation for the fixed Interview Simulation.
 * It owns only view state; every mutable session
 * operation crosses the application controller boundary first.
 */
export function AlgorithmsInterviewSimulationScreen({ navigation, route }: Props) {
  const controllerRef = useRef<ReturnType<typeof createAlgorithmsInterviewSimulationController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createAlgorithmsInterviewSimulationController();
  const controller = controllerRef.current;
  const [controllerState, setControllerState] = useState<AlgorithmsInterviewSimulationControllerState>(INITIAL_STATE);
  const stateRef = useRef(controllerState);
  stateRef.current = controllerState;
  const [panel, setPanel] = useState<SimulationPanel>("active");
  const [navigatorFilter, setNavigatorFilter] = useState<NavigatorFilter>("all");
  const [foregroundPaused, setForegroundPaused] = useState(AppState.currentState !== "active");
  const foregroundFlush = useRef<Promise<AlgorithmsInterviewSimulationControllerState> | null>(null);
  const timeoutStarted = useRef(false);
  const completionKind = useRef<"manual" | "timeout">("manual");
  const [retryAction, setRetryAction] = useState<(() => Promise<void>) | null>(null);
  const [, setDraftOverlayVersion] = useState(0);
  const draftQueueRef = useRef<SimulationDraftIntentQueue<unknown | null> | null>(null);
  if (!draftQueueRef.current) {
    draftQueueRef.current = new SimulationDraftIntentQueue({
      onChange: () => setDraftOverlayVersion((version) => version + 1),
      onLatestFailure: (occurrenceId, response) => beginRetry(async () => saveResponse(occurrenceId, response)),
    });
  }
  const draftQueue = draftQueueRef.current;

  useEffect(() => controller.subscribe(setControllerState), [controller]);

  const discover = useCallback(async () => {
    await controller.discover();
  }, [controller]);

  useFocusEffect(
    useCallback(() => {
      void discover();
      return undefined;
    }, [discover]),
  );

  const checkpointForeground = useCallback(async (): Promise<AlgorithmsInterviewSimulationControllerState> => {
    if (foregroundFlush.current) return foregroundFlush.current;
    if (stateRef.current.status !== "active") return stateRef.current;
    const operation = controller.checkpointForegroundTimer()
      .finally(() => {
        foregroundFlush.current = null;
      });
    foregroundFlush.current = operation;
    return operation;
  }, [controller]);

  const afterForegroundCheckpoint = useCallback(async (action: () => Promise<AlgorithmsInterviewSimulationControllerState>) => {
    const measured = await checkpointForeground();
    if (measured.status !== "active") return measured;
    return action();
  }, [checkpointForeground]);

  useEffect(() => {
    if (controllerState.status !== "active") {
      return undefined;
    }
    if (AppState.currentState === "active") void controller.enterForeground();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setForegroundPaused(false);
        void controller.enterForeground();
        return;
      }
      setForegroundPaused(true);
      void controller.leaveForeground();
    });
    const interval = setInterval(() => void checkpointForeground(), 1_000);
    return () => {
      clearInterval(interval);
      subscription.remove();
      void controller.leaveForeground();
    };
  }, [checkpointForeground, controller, controllerState.status]);

  const runtime = controllerState.runtime;
  const remainingMs = runtime?.remainingMs ?? 0;

  useEffect(() => {
    if (!runtime || controllerState.status !== "active" || remainingMs > 0 || timeoutStarted.current) return;
    timeoutStarted.current = true;
    completionKind.current = "timeout";
    setPanel("finalizing");
    void triggerTimeoutFinalization();
  }, [controllerState.status, remainingMs, runtime]);

  useEffect(() => {
    if (controllerState.status !== "terminal" || !controllerState.terminal) return;
    navigation.replace(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, {
      completionKind: completionKind.current,
      sessionId: controllerState.terminal.sessionId,
    });
  }, [controllerState.status, controllerState.terminal, navigation]);

  function beginRetry(action: () => Promise<void>): void {
    setRetryAction(() => action);
  }

  async function startSimulation(): Promise<void> {
    setRetryAction(null);
    setPanel("finalizing");
    const next = await controller.start(route.params.nodeId);
    if (next.status === "active") {
      completionKind.current = "manual";
      timeoutStarted.current = false;
      draftQueue.clear();
      setPanel("active");
      return;
    }
    beginRetry(startSimulation);
  }

  async function resumeSimulation(): Promise<void> {
    setRetryAction(null);
    setPanel("finalizing");
    const next = await controller.resume();
    if (next.status === "active") {
      completionKind.current = "manual";
      timeoutStarted.current = false;
      draftQueue.clear();
      setPanel("active");
      return;
    }
    beginRetry(resumeSimulation);
  }

  async function abandonAndStartNew(): Promise<void> {
    setPanel("finalizing");
    const abandoned = await afterForegroundCheckpoint(() => controller.abandon());
    if (abandoned.status !== "abandoned") {
      beginRetry(abandonAndStartNew);
      return;
    }
    await startSimulation();
  }

  function saveResponse(occurrenceId: string, response: unknown | null): void {
    setRetryAction(null);
    draftQueue.enqueue(occurrenceId, response, async () => {
      const next = await afterForegroundCheckpoint(() => controller.saveDraftResponse(occurrenceId, response as never));
      return next.status === "active" && !isOperationFailed(next);
    });
  }

  async function moveTo(index: number): Promise<void> {
    setRetryAction(null);
    const next = await afterForegroundCheckpoint(() => controller.moveToIndex(index));
    if (next.status !== "active") beginRetry(() => moveTo(index));
  }

  async function toggleFlag(): Promise<void> {
    if (!runtime) return;
    const occurrenceId = runtime.session.itemOrder[runtime.session.currentItemIndex]?.occurrenceId;
    if (!occurrenceId) return;
    const isFlagged = runtime.session.flaggedOccurrenceIds.includes(occurrenceId);
    setRetryAction(null);
    const next = await afterForegroundCheckpoint(() => controller.setFlag(occurrenceId, !isFlagged));
    if (next.status !== "active") beginRetry(toggleFlag);
  }

  async function submitSimulation(): Promise<void> {
    setPanel("finalizing");
    setRetryAction(null);
    const next = await afterForegroundCheckpoint(() => controller.finalize());
    if (next.status !== "terminal") beginRetry(submitSimulation);
  }

  async function triggerTimeoutFinalization(): Promise<void> {
    const next = await checkpointForeground();
    if (next.status === "terminal") return;
    beginRetry(retryTimeoutFinalization);
  }

  async function retryTimeoutFinalization(): Promise<void> {
    setPanel("finalizing");
    setRetryAction(null);
    const next = await controller.finalize();
    if (next.status !== "terminal") beginRetry(retryTimeoutFinalization);
  }

  async function abandonSimulation(): Promise<void> {
    setRetryAction(null);
    const next = await afterForegroundCheckpoint(() => controller.abandon());
    if (next.status === "abandoned") {
      navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] });
      return;
    }
    beginRetry(abandonSimulation);
  }

  if (controllerState.status === "setup") {
    if (controllerState.activeInspection === null || isOperationPending(controllerState)) {
      return <PreparationState />;
    }
    const active = controllerState.activeInspection;
    if (active?.kind === "resumable") {
      return <SimulationSetupScreen onAbandonAndStart={abandonAndStartNew} onContinue={resumeSimulation} pending={isOperationPending(controllerState)} resumable />;
    }
    return <SimulationSetupScreen onStart={startSimulation} pending={isOperationPending(controllerState)} />;
  }

  if (controllerState.status === "abandoned") {
    return <Screen><EmptyState title="Simulation abandoned" description="Your draft was discarded after it was saved as abandoned." actionLabel="Return home" onActionPress={() => navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] })} /></Screen>;
  }

  if (!runtime || controllerState.status === "error") {
    const detail = failureText(controllerState);
    return (
      <Screen>
        <EmptyState
          title="Interview Simulation unavailable"
          description={detail}
          actionLabel={retryAction ? "Retry" : "Return to practice"}
          onActionPress={() => {
            if (retryAction) void retryAction();
            else void discover();
          }}
        />
      </Screen>
    );
  }

  const currentIndex = runtime.session.currentItemIndex;
  const currentOccurrenceId = runtime.session.itemOrder[currentIndex]!.occurrenceId;
  const currentResponse = draftQueue.has(currentOccurrenceId)
    ? draftQueue.get(currentOccurrenceId)!.response
    : runtime.draftResponsesByOccurrenceId[currentOccurrenceId] ?? null;
  const isBlocked = isSimulationPresentationBlocked(controllerState.operation, remainingMs);
  const isCurrentQuestionRenderable = isSimulationQuestionRenderable(runtime.currentQuestion);
  const isAnswerInteractionBlocked = isBlocked || !isCurrentQuestionRenderable;
  const counts = {
    answered: runtime.navigator.counts.complete,
    flagged: runtime.navigator.counts.flagged,
    total: runtime.navigator.counts.total,
    unanswered: runtime.navigator.counts.total - runtime.navigator.counts.complete,
  };
  const persistenceFailure = operationFailure(controllerState);

  if (panel === "exit") {
    return (
      <Screen>
        <SimulationExitPanel
          disabled={isBlocked}
          onContinue={() => setPanel("active")}
          onLeave={() => void abandonSimulation()}
          pending={isOperationPending(controllerState)}
          remainingTimeLabel={formatCountdown(remainingMs)}
          title="Leave this simulation?"
        />
        {persistenceFailure ? <SimulationPersistenceErrorPanel detail={failureText(controllerState)} onRetry={retryAction ? () => void retryAction() : undefined} /> : null}
      </Screen>
    );
  }

  if (panel === "navigator") {
    const items = buildSimulationNavigatorItems(runtime.navigator.occurrences, {
      erroredIndices: persistenceFailure ? [currentIndex] : [],
      unavailableIndices: isCurrentQuestionRenderable ? [] : [currentIndex],
    }).filter((item) =>
      navigatorFilter === "all"
        || (navigatorFilter === "flagged" ? item.state === "flagged" : item.state === "unanswered"),
    );
    return (
      <Screen footer={<Button disabled={isBlocked} onPress={() => setPanel("submit")}>Submit simulation</Button>}>
        <SectionHeader title="All questions" subtitle={`${counts.answered} answered · ${counts.unanswered} unanswered · ${counts.flagged} flagged`} />
        <View accessibilityRole="tablist" style={styles.navigatorFilters}>
          <NavigatorFilterButton active={navigatorFilter === "all"} label="All" onPress={() => setNavigatorFilter("all")} />
          <NavigatorFilterButton active={navigatorFilter === "unanswered"} label="Unanswered" onPress={() => setNavigatorFilter("unanswered")} />
          <NavigatorFilterButton active={navigatorFilter === "flagged"} label="Flagged" onPress={() => setNavigatorFilter("flagged")} />
        </View>
        <SimulationNavigatorGrid currentIndex={currentIndex} items={items} onSelect={(index) => void moveTo(index).then(() => setPanel("active"))} />
        <Button onPress={() => setPanel("active")} variant="secondary">Return to current question</Button>
        {persistenceFailure ? <SimulationPersistenceErrorPanel detail={failureText(controllerState)} onRetry={retryAction ? () => void retryAction() : undefined} /> : null}
      </Screen>
    );
  }

  if (panel === "submit") {
    return (
      <Screen>
        <SimulationSubmissionPanel counts={counts} disabled={isBlocked} onReturn={() => setPanel("active")} onSubmit={() => void submitSimulation()} pending={isOperationPending(controllerState)} />
        {persistenceFailure ? <SimulationPersistenceErrorPanel detail={failureText(controllerState)} onRetry={retryAction ? () => void retryAction() : undefined} /> : null}
      </Screen>
    );
  }

  if (panel === "finalizing") {
    return (
      <Screen>
        <SimulationFinalizationPanel
          progress={finalizationProgress(controllerState.operation.kind)}
          steps={finalizationSteps(controllerState.operation.kind, isOperationFailed(controllerState))}
          title={remainingMs <= 0 ? "Time is up" : controllerState.operation.kind === "starting" || controllerState.operation.kind === "resuming" ? "Preparing simulation" : "Finalizing simulation"}
        />
        {persistenceFailure ? <SimulationPersistenceErrorPanel detail={failureText(controllerState)} onRetry={retryAction ? () => void retryAction() : undefined} title="Simulation progress could not be saved" /> : null}
      </Screen>
    );
  }

  return (
    <Screen
      compact
      footer={<SimulationBottomActions nextDisabled={isBlocked || currentIndex >= runtime.session.actualLength - 1} onNext={() => void moveTo(currentIndex + 1)} onPrevious={() => void moveTo(Math.max(currentIndex - 1, 0))} previousDisabled={isBlocked || currentIndex === 0} />}
    >
      <SimulationTopBar
        itemProgressLabel={formatSimulationItemProgress(currentIndex, runtime.session.actualLength)}
        progress={getSimulationProgress(currentIndex, runtime.session.actualLength)}
        remainingTimeLabel={foregroundPaused ? "Paused" : formatCountdown(remainingMs)}
        timerTone={foregroundPaused ? "paused" : getSimulationTimerTone(remainingMs)}
      />
      <View style={styles.questionHeader}>
        <Text style={styles.eyebrow}>{runtime.currentQuestion.roadmapNodeId ?? "Algorithms"}</Text>
        <Text accessibilityRole="header" style={styles.prompt}>{runtime.currentQuestion.prompt}</Text>
      </View>
      <SimulationQuestionPresentation disabled={isAnswerInteractionBlocked} onSave={(response) => saveResponse(currentOccurrenceId, response)} optionOrder={runtime.session.optionOrderByOccurrence[currentOccurrenceId] ?? []} question={runtime.currentQuestion} response={currentResponse} />
      <View style={styles.sessionActions}>
        <SimulationFlagControl disabled={isBlocked} isFlagged={runtime.session.flaggedOccurrenceIds.includes(currentOccurrenceId)} onPress={() => void toggleFlag()} pending={controllerState.operation.kind === "saving_flag" && isOperationPending(controllerState)} />
        <Pressable accessibilityLabel="Open session navigator" accessibilityRole="button" disabled={isBlocked} onPress={() => { setNavigatorFilter("all"); setPanel("navigator"); }} style={({ pressed }) => [styles.navigatorButton, isBlocked ? styles.disabled : null, pressed && !isBlocked ? styles.pressed : null]}>
          <Icon name="grid" size={18} />
          <Text style={styles.navigatorText}>Navigator</Text>
        </Pressable>
        <Pressable accessibilityLabel="Leave simulation" accessibilityRole="button" disabled={isBlocked} onPress={() => setPanel("exit")} style={({ pressed }) => [styles.navigatorButton, isBlocked ? styles.disabled : null, pressed && !isBlocked ? styles.pressed : null]}>
          <Text style={styles.navigatorText}>Exit</Text>
        </Pressable>
      </View>
      {persistenceFailure ? <SimulationPersistenceErrorPanel detail={failureText(controllerState)} onRetry={retryAction ? () => void retryAction() : undefined} /> : null}
      {controllerState.operation.kind === "saving_draft" && isOperationPending(controllerState) ? <Text accessibilityLiveRegion="polite" style={styles.savingText}>Saving response…</Text> : null}
    </Screen>
  );
}

function PreparationState() {
  return (
    <Screen>
      <SimulationFinalizationPanel
        progress={0.15}
        steps={[
          { id: "recovery", label: "Recovering saved session", state: "active" },
          { id: "content", label: "Validating content", state: "pending" },
          { id: "draft", label: "Loading persisted draft", state: "pending" },
        ]}
        title="Preparing simulation"
      />
    </Screen>
  );
}

function SimulationSetupScreen({ onAbandonAndStart, onContinue, onStart, pending, resumable = false }: Readonly<{
  onAbandonAndStart?: () => Promise<void>;
  onContinue?: () => Promise<void>;
  onStart?: () => Promise<void>;
  pending: boolean;
  resumable?: boolean;
}>) {
  return (
    <Screen>
      <View style={styles.setupCopy}>
        <Text accessibilityRole="header" style={styles.setupTitle}>{resumable ? "Active simulation found" : "Interview Simulation"}</Text>
        <Text style={styles.setupDetail}>{resumable ? "Your persisted item order, answers, flags, position, and foreground timer are ready to resume." : "A focused 45-minute decision-and-pattern-recognition session that simulates a real technical interview."}</Text>
      </View>
      <Card variant="tonal" style={styles.profileCard}>
        <ProfileLine label="40 questions" />
        <ProfileLine label="45 minutes" />
        <ProfileLine label="Free navigation" />
        <ProfileLine label="Answer changes allowed" />
        <ProfileLine label="Feedback after the session" />
        <ProfileLine label="Unanswered allowed" />
        <ProfileLine label="No same-session reinsert" />
      </Card>
      {resumable ? (
        <View style={styles.setupActions}>
          <Button loading={pending} onPress={() => void onContinue?.()}>Continue simulation</Button>
          <Button disabled={pending} onPress={() => void onAbandonAndStart?.()} variant="destructive">Abandon and start new</Button>
        </View>
      ) : <Button loading={pending} onPress={() => void onStart?.()}>Start simulation</Button>}
    </Screen>
  );
}

function ProfileLine({ label }: { label: string }) {
  return <View style={styles.profileLine}><Text style={styles.profileMark}>○</Text><Text style={styles.profileText}>{label}</Text></View>;
}

function NavigatorFilterButton({ active, label, onPress }: Readonly<{ active: boolean; label: string; onPress: () => void }>) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterButton, active ? styles.filterButtonActive : null, pressed ? styles.pressed : null]}>
      <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

function formatCountdown(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function failureText(state: AlgorithmsInterviewSimulationControllerState): string {
  const failure = state.failure ?? operationFailure(state);
  if (!failure) return "The simulation could not be prepared. Retry to continue.";
  const cause = failure.cause instanceof Error ? failure.cause.message : "";
  if (failure.disposition === "fatal") return cause || "The persisted simulation is corrupt and cannot be restored.";
  if (failure.disposition === "blocking") return cause || "This simulation cannot continue until its content or session state is resolved.";
  return cause || "Local persistence is temporarily unavailable. Retry before continuing.";
}

function isOperationPending(state: AlgorithmsInterviewSimulationControllerState): boolean {
  return "status" in state.operation && state.operation.status === "pending";
}

function isOperationFailed(state: AlgorithmsInterviewSimulationControllerState): boolean {
  return "status" in state.operation && state.operation.status === "failed";
}

function operationFailure(state: AlgorithmsInterviewSimulationControllerState) {
  return "failure" in state.operation && state.operation.status === "failed"
    ? state.operation.failure
    : null;
}

function finalizationProgress(kind: AlgorithmsInterviewSimulationControllerState["operation"]["kind"]): number {
  if (kind === "starting" || kind === "resuming") return 0.45;
  if (kind === "finalizing") return 0.72;
  return 0.2;
}

function finalizationSteps(kind: AlgorithmsInterviewSimulationControllerState["operation"]["kind"], failed: boolean) {
  const preparing = kind === "starting" || kind === "resuming";
  return [
    { id: "session", label: preparing ? "Creating session" : "Freezing draft responses", state: "complete" as const },
    { id: "plan", label: preparing ? "Preparing immutable item order" : "Building deterministic outcomes", state: failed ? "failed" as const : "active" as const },
    { id: "write", label: preparing ? "Persisting session" : "Saving finalization journal", state: "pending" as const },
    { id: "verify", label: preparing ? "Verifying content" : "Verifying submitted outcomes", state: "pending" as const },
  ];
}

const styles = StyleSheet.create({
  setupCopy: { gap: spacing.sm },
  setupTitle: { ...typography.title, color: colors.dark.textPrimary },
  setupDetail: { ...typography.small, color: colors.dark.textSecondary },
  profileCard: { gap: spacing.md },
  profileLine: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  profileMark: { ...typography.bodyStrong, color: colors.dark.primary },
  profileText: { ...typography.small, color: colors.dark.textPrimary },
  setupActions: { gap: spacing.sm },
  questionHeader: { gap: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.dark.textMuted, textTransform: "uppercase" },
  prompt: { ...typography.heading, color: colors.dark.textPrimary },
  sessionActions: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  navigatorFilters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterButton: { borderColor: colors.dark.border, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, minHeight: 38, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterButtonActive: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary },
  filterLabel: { ...typography.caption, color: colors.dark.textSecondary },
  filterLabelActive: { color: colors.dark.textPrimary },
  navigatorButton: { alignItems: "center", borderRadius: radius.sm, flexDirection: "row", gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.sm },
  navigatorText: { ...typography.small, color: colors.dark.textSecondary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.76 },
  savingText: { ...typography.caption, color: colors.dark.textSecondary },
});
