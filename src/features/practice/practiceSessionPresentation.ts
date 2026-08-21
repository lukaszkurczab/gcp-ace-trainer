import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";
import type { FeedbackDocument } from "../../content/contracts";
export type PracticeSurfacePhase = "preparing" | PracticeDurableOperationState["kind"];

export type PracticeOptionState = "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct";

export type PracticeChoiceControl = Readonly<{
  kind: "choice";
  options: readonly Readonly<{ id: string; state: PracticeOptionState; text: string }> [];
  selectionMode: "single" | "multiple";
}>;

export type PracticeOrderingControl = Readonly<{
  elements: readonly Readonly<{ id: string; text: string }> [];
  kind: "ordering";
}>;

export type PracticeComplexityControl = Readonly<{
  dimensions: readonly Readonly<{
    id: string;
    label?: string;
    selectedValue?: string;
    values: readonly string[];
  }> [];
  kind: "complexity";
}>;

export type PracticeResponseControl =
  | PracticeChoiceControl
  | PracticeOrderingControl
  | PracticeComplexityControl;

export type PracticeFeedback = Readonly<{
  details: FeedbackDocument;
  reason: string;
  result: "correct" | "partial" | "incorrect";
}>;

export type PracticeInteractionRenderer =
  | Readonly<{ kind: "choice"; options: readonly Readonly<{ id: string; selected: boolean; text: string }> [] }>
  | Readonly<{ kind: "ordering"; elements: readonly Readonly<{ id: string; text: string }> [] }>
  | Readonly<{ kind: "complexity"; dimensions: readonly Readonly<{ id: string; label?: string; selectedValue?: string; values: readonly string[] }> [] }>;

export type PracticeLocalResponse =
  | Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>
  | Readonly<{ kind: "ordering"; orderedSubgoalIds: readonly string[] }>
  | Readonly<{ kind: "complexity"; selectedValuesByDimension: Readonly<Record<string, string>> }>
  | null;

export type PracticeNotice = Readonly<{
  message: string;
  tone: "neutral" | "error" | "success";
}>;

export type PracticeChoiceSelection = Readonly<{
  occurrenceId: string;
  selectedOptionIds: readonly string[];
  sessionId: string;
}>;

export function reconcilePracticeChoiceSelection(input: Readonly<{
  current: PracticeChoiceSelection | null;
  durableSelectedOptionIds: readonly string[] | null;
  editable: boolean;
  occurrenceId: string;
  sessionId: string;
}>): PracticeChoiceSelection {
  const owner = { sessionId: input.sessionId, occurrenceId: input.occurrenceId };
  if (input.durableSelectedOptionIds) return Object.freeze({ ...owner, selectedOptionIds: Object.freeze([...input.durableSelectedOptionIds]) });
  if (input.editable && input.current?.sessionId === input.sessionId && input.current.occurrenceId === input.occurrenceId) return input.current;
  return Object.freeze({ ...owner, selectedOptionIds: Object.freeze([]) });
}

export function formatPracticeElapsedTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function noticeForPracticeOperation(operation: PracticeDurableOperationState): PracticeNotice | undefined {
  if (operation.kind === "submitting_before_journal") return { tone: "neutral", message: "Saving your answer…" };
  if (operation.kind === "submit_journal_failed") return { tone: "error", message: "The answer was not durably submitted. You can safely submit the same local response again." };
  if (operation.kind === "commit_pending" || operation.kind === "commit_materialization_failed" || operation.kind === "commit_verification_failed" || operation.kind === "verified_pending_clear") return { tone: "error", message: "Your response is immutable because a durable command exists. Recovery must replay that exact command." };
  if (operation.kind === "recovery_required") return { tone: "error", message: "A previous session update must be recovered before another answer can be submitted." };
  if (operation.kind === "advancing") return { tone: "neutral", message: "Opening the next question…" };
  if (operation.kind === "advance_failed") return { tone: "error", message: "Your answer remains committed. Retry opening the next question." };
  if (operation.kind === "completing") return { tone: "neutral", message: "Finishing this session…" };
  if (operation.kind === "completion_failed") return operation.error.allowedAction === "recover"
    ? { tone: "error", message: "The Finish command is durable and must be recovered before opening the result." }
    : { tone: "error", message: "The Finish command was not durably recorded. Retry Finish session." };
  return undefined;
}

export function noticeForPracticeCompletionCheckpoint(kind: "recover" | "retry"): PracticeNotice {
  return kind === "recover"
    ? { tone: "error", message: "The final timer checkpoint is durable. Recover it, then Finish the session again." }
    : { tone: "error", message: "The final timer checkpoint was not durable. Retry it, then Finish the session again." };
}

/**
 * Presentation guardrails. The runtime owns transitions, scoring, recovery and
 * feedback availability; these helpers prevent the renderer from disclosing or
 * enabling controls in a prohibited phase.
 */
export function allowsPracticeFeedback(phase: PracticeSurfacePhase): boolean {
  return phase === "feedback" || phase === "advancing" || phase === "advance_failed" || phase === "completing" || phase === "completion_failed" || phase === "completed";
}

export function allowsPracticeResponseEditing(phase: PracticeSurfacePhase): boolean {
  return phase === "unanswered" || phase === "submit_journal_failed";
}

export function isPracticeActionPending(phase: PracticeSurfacePhase): boolean {
  return phase === "submitting_before_journal" || phase === "commit_pending" || phase === "advancing" || phase === "completing" || phase === "abandoning";
}

export function practiceOptionCorrectnessValue(state: PracticeOptionState): string | undefined {
  if (state === "correct" || state === "omitted_correct") return "Correct response";
  if (state === "incorrect") return "Incorrect response";
  return undefined;
}

/**
 * Applies only UI-ephemeral selection or application-provided feedback states
 * to a renderer projection. It never reads accepted answers or scores.
 */
export function buildPracticeResponseControl(input: Readonly<{
  choiceSelectionMode?: "single" | "multiple";
  feedbackControls?: readonly Readonly<{ id: string; state: PracticeOptionState }> [];
  localResponse: PracticeLocalResponse;
  renderer: PracticeInteractionRenderer;
}>): PracticeResponseControl {
  if (input.renderer.kind === "choice") {
    const feedbackById = new Map(input.feedbackControls?.map((control) => [control.id, control.state]));
    const selected = input.localResponse?.kind === "choice" ? new Set(input.localResponse.selectedOptionIds) : new Set<string>();
    return Object.freeze({
      kind: "choice",
      selectionMode: input.choiceSelectionMode ?? "single",
      options: Object.freeze(input.renderer.options.map((option) => Object.freeze({
        id: option.id,
        text: option.text,
        state: feedbackById.get(option.id) ?? (selected.has(option.id) ? "selected" : "neutral"),
      }))),
    });
  }
  if (input.renderer.kind === "ordering") {
    const ordered = input.localResponse?.kind === "ordering" ? input.localResponse.orderedSubgoalIds : input.renderer.elements.map((element) => element.id);
    const textById = new Map(input.renderer.elements.map((element) => [element.id, element.text]));
    return Object.freeze({
      kind: "ordering",
      elements: Object.freeze(ordered.map((id) => Object.freeze({ id, text: textById.get(id) ?? id }))),
    });
  }
  const selectedValues = input.localResponse?.kind === "complexity" ? input.localResponse.selectedValuesByDimension : {};
  return Object.freeze({
    kind: "complexity",
    dimensions: Object.freeze(input.renderer.dimensions.map((dimension) => Object.freeze({
      id: dimension.id,
      ...(dimension.label ? { label: dimension.label } : {}),
      values: dimension.values,
      ...(selectedValues[dimension.id] ? { selectedValue: selectedValues[dimension.id] } : dimension.selectedValue ? { selectedValue: dimension.selectedValue } : {}),
    }))),
  });
}

/** The visible ordering is itself a complete response, even before a move. */
export function resolvePracticeLocalResponse(
  localResponse: PracticeLocalResponse,
  control: PracticeResponseControl,
): PracticeLocalResponse {
  if (localResponse) return localResponse;
  if (control.kind !== "ordering") return null;
  return Object.freeze({
    kind: "ordering",
    orderedSubgoalIds: Object.freeze(control.elements.map((element) => element.id)),
  });
}

export function getPracticePrimaryAction(input: Readonly<{
  hasLocalResponse: boolean;
  isFinalPosition: boolean;
  phase: PracticeSurfacePhase;
}>): Readonly<{ enabled: boolean; label: string; loading: boolean }> | null {
  if (input.phase === "unanswered") {
    return Object.freeze({ enabled: input.hasLocalResponse, label: "Check answer", loading: false });
  }
  if (input.phase === "submitting_before_journal") return Object.freeze({ enabled: false, label: "Checking answer…", loading: true });
  if (input.phase === "submit_journal_failed") return Object.freeze({ enabled: input.hasLocalResponse, label: "Check answer", loading: false });
  if (input.phase === "commit_pending") return Object.freeze({ enabled: false, label: "Finishing the update…", loading: true });
  if (input.phase === "advancing") return Object.freeze({ enabled: false, label: "Loading next question…", loading: true });
  if (input.phase === "feedback") return Object.freeze({ enabled: true, label: input.isFinalPosition ? "Finish session" : "Next", loading: false });
  if (input.phase === "advance_failed") return Object.freeze({ enabled: true, label: "Retry next question", loading: false });
  if (input.phase === "completing") return Object.freeze({ enabled: false, label: "Finishing session…", loading: true });
  return null;
}
