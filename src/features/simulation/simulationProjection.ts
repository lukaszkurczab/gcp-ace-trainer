import type { SessionMetricPresentation } from "../algorithms/session/sessionAccessibility";

/**
 * Presentation-only contract for the canonical Algorithms Interview
 * Simulation surface. The application lifecycle owns every transition,
 * mutation, timer value, response durability fact, and result.
 */
export type SimulationSurfaceState =
  | "preparing"
  | "insufficient_content"
  | "editable"
  | "saving"
  | "save_failed"
  | "stale_revision"
  | "finish_confirmation"
  | "leave_confirmation"
  | "abandon_confirmation"
  | "abandoning"
  | "abandon_failed"
  | "expired"
  | "frozen"
  | "finalization_journal_pending"
  | "finalization_journal_failed"
  | "finalizing"
  | "finalization_failed"
  | "verification_failed"
  | "recovering"
  | "recovered_finalizing"
  | "timer_recovery_failed"
  | "missing_draft"
  | "version_mismatch"
  | "corrupt_state"
  | "completed";

export type SimulationNavigatorPosition = Readonly<{
  occurrenceId: string;
  state: "current" | "answered" | "unanswered" | "frozen";
}>;

export type SimulationNotice = Readonly<{
  message: string;
  tone: "neutral" | "error" | "success";
}>;

export type SimulationAction = Readonly<{
  accessibilityLabel?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive";
}>;

/** Keeps response submission and final review/finish transitions in one screen action model. */
export function simulationPrimaryAction(input: Readonly<{ complete: boolean; finalOccurrence: boolean; responseChanged: boolean; onSave: () => void; onSaveAndContinue: () => void; onFinish: () => void }>): SimulationAction {
  if (!input.responseChanged) return { id: "finish-simulation", label: "Finish simulation", disabled: false, onPress: input.onFinish };
  return input.finalOccurrence
    ? { id: "save-response", label: "Save response", disabled: !input.complete, onPress: input.onSave }
    : { id: "save-and-continue", label: "Save and continue", disabled: !input.complete, onPress: input.onSaveAndContinue };
}

/** Formats the application-owned remaining foreground duration for the visible timer. */
export function simulationTimer(remainingMs: number) {
  const seconds = Math.max(0, Math.floor(remainingMs / 1_000));
  const label = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { accessibilityLabel: `Time remaining ${label}`, label };
}

export type SimulationChoiceControl = Readonly<{
  kind: "choice";
  options: readonly Readonly<{ id: string; label: string; selected: boolean }>[];
  selectionMode: "single" | "multiple";
}>;

export type SimulationOrderingControl = Readonly<{
  kind: "ordering";
  elements: readonly Readonly<{ id: string; label: string }>[];
}>;

export type SimulationComplexityControl = Readonly<{
  dimensions: readonly Readonly<{ id: string; label: string; selectedValue?: string; values: readonly string[] }>[];
  kind: "complexity";
}>;

export type SimulationResponseControl = SimulationChoiceControl | SimulationOrderingControl | SimulationComplexityControl;

export type SimulationQuestionProjection = Readonly<{
  code?: string;
  control: SimulationResponseControl;
  prompt: string;
}>;

export type SimulationResponseChange =
  | Readonly<{ kind: "choice"; optionId: string; selected: boolean }>
  | Readonly<{ kind: "ordering"; elementId: string; movement: "up" | "down" }>
  | Readonly<{ dimensionId: string; kind: "complexity"; value: string }>;

export type SimulationCompletionProjection = Readonly<{
  answeredCount: number;
  correctCount: number;
  earnedPoints: number;
  incorrectCount: number;
  maxPoints: number;
  partialCount: number;
  reviewAction?: SimulationAction;
  unansweredCount: number;
}>;

export type SimulationSurfaceProjection = Readonly<{
  actions?: Readonly<{ primary?: SimulationAction; secondary?: SimulationAction }>;
  completion?: SimulationCompletionProjection;
  confirmation?: Readonly<{
    description: string;
    primary: SimulationAction;
    secondary: SimulationAction;
    title: string;
  }>;
  modeLabel?: string;
  navigator?: readonly SimulationNavigatorPosition[];
  notice?: SimulationNotice;
  onOccurrencePress?: (occurrenceId: string) => void;
  onResponseChange?: (change: SimulationResponseChange) => void;
  position?: SessionMetricPresentation;
  progress?: number;
  question?: SimulationQuestionProjection;
  runtimeIdentity?: Readonly<{
    itemId?: string;
    sessionId: string;
  }>;
  state: SimulationSurfaceState;
  timer?: SessionMetricPresentation;
  title: string;
}>;
