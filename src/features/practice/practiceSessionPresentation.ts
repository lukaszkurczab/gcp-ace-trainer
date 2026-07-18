export type PracticeSurfacePhase =
  | "preparing"
  | "unanswered"
  | "submitting"
  | "commit_pending"
  | "commit_recovery"
  | "feedback"
  | "advancing"
  | "completed"
  | "abandoning";

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
  details: string;
  reason: string;
}>;

export type PracticeInteractionRenderer =
  | Readonly<{ kind: "choice"; options: readonly Readonly<{ id: string; selected: boolean; text: string }> [] }>
  | Readonly<{ kind: "ordering"; elements: readonly Readonly<{ id: string; text: string }> [] }>
  | Readonly<{ kind: "complexity"; dimensions: readonly Readonly<{ id: string; selectedValue?: string; values: readonly string[] }> [] }>;

export type PracticeLocalResponse =
  | Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>
  | Readonly<{ kind: "ordering"; orderedSubgoalIds: readonly string[] }>
  | Readonly<{ kind: "complexity"; selectedValuesByDimension: Readonly<Record<string, string>> }>
  | null;

export type PracticeNotice = Readonly<{
  message: string;
  tone: "neutral" | "error" | "success";
}>;

/**
 * Presentation guardrails. The runtime owns transitions, scoring, recovery and
 * feedback availability; these helpers prevent the renderer from disclosing or
 * enabling controls in a prohibited phase.
 */
export function allowsPracticeFeedback(phase: PracticeSurfacePhase): boolean {
  return phase === "feedback" || phase === "commit_recovery" || phase === "advancing" || phase === "completed";
}

export function allowsPracticeResponseEditing(phase: PracticeSurfacePhase): boolean {
  return phase === "unanswered";
}

export function isPracticeActionPending(phase: PracticeSurfacePhase): boolean {
  return phase === "submitting" || phase === "commit_pending" || phase === "advancing" || phase === "abandoning";
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
      values: dimension.values,
      ...(selectedValues[dimension.id] ? { selectedValue: selectedValues[dimension.id] } : dimension.selectedValue ? { selectedValue: dimension.selectedValue } : {}),
    }))),
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
  if (input.phase === "submitting") return Object.freeze({ enabled: false, label: "Checking answer…", loading: true });
  if (input.phase === "commit_pending") return Object.freeze({ enabled: false, label: "Finishing the update…", loading: true });
  if (input.phase === "advancing") return Object.freeze({ enabled: false, label: "Loading next question…", loading: true });
  if (input.phase === "feedback") return Object.freeze({ enabled: true, label: input.isFinalPosition ? "View session result" : "Next", loading: false });
  if (input.phase === "completed") return Object.freeze({ enabled: true, label: "View session result", loading: false });
  return null;
}
