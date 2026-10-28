import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";
import { TrainingApplicationFailure } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { JsonValue } from "../../content/canonical";
import type { CanonicalSourceLink } from "../../application/canonical/canonicalSourceLinks";

export const REVIEW_CYCLE_CONFLICT_MESSAGE = "Your answer is saved, but no review credit was applied because the review cycle changed.";

export function describeSessionPreparationFailure(error: unknown, translate: (message: string) => string, fallback: string): string {
  if (error instanceof TrainingApplicationFailure) {
    if (error.code === "premium_entitlement_denied") return translate("Choose a free topic to continue.");
    if (error.code === "premium_entitlement_unavailable") return translate("Reconnect to verify Premium access, then try again.");
  }
  return describeOperationalFailure(error, fallback);
}

export type PracticeSurfacePhase = "preparing" | "submit_outcome_unknown" | PracticeDurableOperationState["kind"];

export const PRACTICE_ACTION_GESTURE_CARRY_OVER_MS = 400;

/** A queued UI event may mutate a response only while its captured item owner is current. */
export function isPracticeResponseOwnerCurrent(capturedOwner: string, currentOwner: string | null): boolean {
  return currentOwner !== null && capturedOwner === currentOwner;
}

export type PracticePrimaryActionActivation = Readonly<{
  identity: string;
  at: number;
}>;

/** Suppress only a fast tap carried across a primary-action transition. */
export function acceptPracticePrimaryActionActivation(
  previous: PracticePrimaryActionActivation | null,
  identity: string,
  at: number,
): Readonly<{ accepted: boolean; lastAccepted: PracticePrimaryActionActivation }> {
  if (previous && previous.identity !== identity && at - previous.at < PRACTICE_ACTION_GESTURE_CARRY_OVER_MS) {
    return { accepted: false, lastAccepted: previous };
  }
  return { accepted: true, lastAccepted: { identity, at } };
}

export function buildPracticePrimaryActionIdentity(input: Readonly<{
  sessionId?: string;
  itemId?: string;
  phase: PracticeSurfacePhase;
  actionLabel: string;
}>): string {
  return JSON.stringify([input.sessionId ?? null, input.itemId ?? null, input.phase, input.actionLabel]);
}

export type PracticeOptionState = "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct" | "not_selected";

export type PracticeChoiceControl = Readonly<{
  kind: "choice";
  interactionType: "choice_single" | "choice_multiple";
  options: readonly Readonly<{ id: string; state: PracticeOptionState; text: string }> [];
  selectionMode: "single" | "multiple";
  requiredSelectionCount?: number;
}>;

export type PracticeOrderingControl = Readonly<{
  elements: readonly Readonly<{ id: string; text: string }> [];
  interactionType: "ordering";
  kind: "ordering";
}>;

export type PracticeComplexityControl = Readonly<{
  dimensions: readonly Readonly<{
    id: string;
    label?: string;
    selectedValues?: readonly string[];
    values: readonly Readonly<{ id: string; text: string }>[];
  }> [];
  interactionType: "complexity" | "decision_matrix";
  kind: "complexity";
}>;

/** Opaque UI-facing response model. A feature binding owns its payload shape. */
export type PracticeResponseControl = Readonly<{ interactionType: string; model: unknown }>;

export type PracticeFeedback = Readonly<{
  details: JsonValue;
  reason: string;
  result: "correct" | "partial" | "incorrect" | "unanswered";
  sources?: readonly CanonicalSourceLink[];
  messages?: readonly Readonly<{ kind: string; targetId: string; text: string }>[];
}>;

/** Neutral handler output crosses into feature UI without a shared renderer union. */
export type PracticeInteractionRenderer = Readonly<{ interactionType: string; model: unknown }>;

type PracticeChoiceControlModel = PracticeChoiceControl;
type PracticeOrderingControlModel = PracticeOrderingControl;
type PracticeComplexityControlModel = PracticeComplexityControl;
type BuiltinPracticeControlModel = PracticeChoiceControlModel | PracticeOrderingControlModel | PracticeComplexityControlModel;
type BuiltinPracticeRendererModel =
  | Readonly<{ kind: "choice"; requiredSelectionCount?: number; options: readonly Readonly<{ id: string; selected: boolean; text: string }>[] }>
  | Readonly<{ kind: "ordering"; elements: readonly Readonly<{ id: string; text: string }>[] }>
  | Readonly<{ kind: "complexity"; dimensions: readonly Readonly<{ id: string; label?: string; selectedValues?: readonly string[]; values: readonly Readonly<{ id: string; text: string }>[] }>[] }>;

export type PracticeLocalResponse =
  | Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>
  | Readonly<{ kind: "ordering"; orderedSubgoalIds: readonly string[] }>
  | Readonly<{ kind: "complexity"; selectedValuesByDimension: Readonly<Record<string, readonly string[]>> }>
  | null;

export type PracticeLocalResponseState = Readonly<{
  occurrenceId: string;
  response: Exclude<PracticeLocalResponse, null>;
  sessionId: string;
}>;

export function toggleDimensionSelection(current: Readonly<Record<string, readonly string[]>>, dimensionId: string, valueId: string): Readonly<Record<string, readonly string[]>> {
  const selected = current[dimensionId] ?? [];
  const next = selected.includes(valueId) ? selected.filter((candidate) => candidate !== valueId) : [...selected, valueId];
  return Object.freeze({ ...current, [dimensionId]: Object.freeze(next) });
}

export function reconcilePracticeLocalResponse(input: Readonly<{
  current: PracticeLocalResponseState | null;
  durableResponse: PracticeLocalResponse;
  editable: boolean;
  occurrenceId: string;
  sessionId: string;
}>): PracticeLocalResponseState | null {
  const owner = { occurrenceId: input.occurrenceId, sessionId: input.sessionId };
  if (input.durableResponse !== null) return Object.freeze({ ...owner, response: input.durableResponse });
  if (input.editable && input.current?.occurrenceId === input.occurrenceId && input.current.sessionId === input.sessionId) return input.current;
  return null;
}

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
  if (operation.kind === "feedback" && operation.reviewConflict) return { tone: "error", message: REVIEW_CYCLE_CONFLICT_MESSAGE };
  if (operation.kind === "submitting_before_journal") return { tone: "neutral", message: "Saving your answer…" };
  if (operation.kind === "submit_journal_failed" && operation.error.allowedAction === "reconcile") return { tone: "error", message: "We couldn't confirm whether your answer was saved. Check the saved response before continuing." };
  if (operation.kind === "submit_journal_failed") return { tone: "error", message: "We couldn't save your response. Your current answer is still here." };
  if (operation.kind === "commit_pending" || operation.kind === "commit_materialization_failed" || operation.kind === "commit_verification_failed" || operation.kind === "verified_pending_clear") return { tone: "error", message: "Your answer is saved on this device. Restore this question to continue." };
  if (operation.kind === "recovery_required") return { tone: "error", message: "Restore the session before submitting another answer." };
  if (operation.kind === "advancing") return { tone: "neutral", message: "Opening the next question…" };
  if (operation.kind === "advance_failed") return { tone: "error", message: "Your answer is saved. Try opening the next question again." };
  if (operation.kind === "completing") return { tone: "neutral", message: "Finishing this session…" };
  if (operation.kind === "completion_failed") return operation.error.allowedAction === "recover"
    ? { tone: "error", message: "We couldn't finish the session yet. Restore the session result before opening it." }
    : { tone: "error", message: "We couldn't finish the session. Try again." };
  return undefined;
}

export function noticeForPracticeCompletionCheckpoint(kind: "recover" | "retry"): PracticeNotice {
  return kind === "recover"
    ? { tone: "error", message: "We couldn't finish updating the session time. Restore it, then finish the session again." }
    : { tone: "error", message: "We couldn't save the session time. Try again, then finish the session." };
}

/**
 * Presentation guardrails. The runtime owns transitions, scoring, recovery and
 * feedback availability; these helpers prevent the renderer from disclosing or
 * enabling controls in a prohibited phase.
 */
export function allowsPracticeFeedback(phase: PracticeSurfacePhase): boolean {
  return phase === "feedback" || phase === "advancing" || phase === "advance_failed" || phase === "completion_failed" || phase === "completed";
}

export function allowsPracticeResponseEditing(phase: PracticeSurfacePhase): boolean {
  return phase === "unanswered" || phase === "submit_journal_failed";
}

export function isPracticeActionPending(phase: PracticeSurfacePhase): boolean {
  return phase === "submitting_before_journal" || phase === "commit_pending" || phase === "advancing" || phase === "completing" || phase === "abandoning";
}

export function practiceOptionCorrectnessValue(state: PracticeOptionState): string | undefined {
  if (state === "correct") return "Selected, correct";
  if (state === "incorrect") return "Selected, incorrect";
  if (state === "omitted_correct") return "Correct answer, not selected";
  if (state === "not_selected") return "Not selected";
  if (state === "selected") return "Selected";
  return undefined;
}

export function practiceOptionIsSelected(state: PracticeOptionState): boolean {
  return state === "selected" || state === "correct" || state === "incorrect";
}

/**
 * Applies only UI-ephemeral selection or application-provided feedback states
 * to a renderer projection. It never reads accepted answers or scores.
 */
export type PracticeControlProjectionInput = Readonly<{
  choiceSelectionMode?: "single" | "multiple";
  feedbackControls?: readonly Readonly<{ id: string; state: PracticeOptionState }> [];
  localResponse: PracticeLocalResponse;
  renderer: PracticeInteractionRenderer;
}>;

export function buildPracticeResponseControl(input: PracticeControlProjectionInput & Readonly<{
  controlProjectors?: ReadonlyMap<string, PracticeControlProjector>;
}>): PracticeResponseControl {
  const project = (input.controlProjectors ?? PRACTICE_CONTROL_PROJECTORS).get(input.renderer.interactionType);
  if (!project) throw new Error(`Practice control binding is unavailable for ${input.renderer.interactionType}.`);
  return Object.freeze({ interactionType: input.renderer.interactionType, model: project(input) });
}

export type PracticeControlProjector = (input: PracticeControlProjectionInput) => unknown;
type ControlProjector = (input: PracticeControlProjectionInput) => BuiltinPracticeControlModel;
const PRACTICE_CONTROL_PROJECTORS: ReadonlyMap<string, ControlProjector> = new Map<string, ControlProjector>([
  ["choice_single", projectChoiceControl],
  ["choice_multiple", projectChoiceControl],
  ["ordering", projectOrderingControl],
  ["complexity", projectComplexityControl],
  ["decision_matrix", projectComplexityControl],
]);

export function hasBuiltinPracticeControlProjector(interactionType: string): boolean {
  return PRACTICE_CONTROL_PROJECTORS.has(interactionType);
}

function projectChoiceControl(input: PracticeControlProjectionInput): PracticeChoiceControl {
  const renderer = builtinRendererModel(input.renderer.model);
  if (!renderer || typeof renderer !== "object" || !("kind" in renderer) || renderer.kind !== "choice") throw new Error("Choice interaction presentation is invalid.");
  const feedbackById = new Map(input.feedbackControls?.map((control) => [control.id, control.state]));
  const selected = input.localResponse?.kind === "choice" ? new Set(input.localResponse.selectedOptionIds) : new Set<string>();
  return Object.freeze({
    kind: "choice",
    interactionType: input.renderer.interactionType as PracticeChoiceControl["interactionType"],
    selectionMode: input.choiceSelectionMode ?? "single",
    ...(renderer.requiredSelectionCount === undefined ? {} : { requiredSelectionCount: renderer.requiredSelectionCount }),
    options: Object.freeze(renderer.options.map((option) => Object.freeze({
      id: option.id,
      text: option.text,
      state: feedbackById.has(option.id)
        ? feedbackById.get(option.id) === "neutral" ? "not_selected" : feedbackById.get(option.id)!
        : selected.has(option.id) ? "selected" : "neutral",
    }))),
  });
}

function projectOrderingControl(input: PracticeControlProjectionInput): PracticeOrderingControl {
  const renderer = builtinRendererModel(input.renderer.model);
  if (!renderer || typeof renderer !== "object" || !("kind" in renderer) || renderer.kind !== "ordering") throw new Error("Ordering interaction presentation is invalid.");
  const ordered = input.localResponse?.kind === "ordering" ? input.localResponse.orderedSubgoalIds : renderer.elements.map((element) => element.id);
  const textById = new Map(renderer.elements.map((element) => [element.id, element.text]));
  return Object.freeze({
    kind: "ordering",
    interactionType: input.renderer.interactionType as PracticeOrderingControl["interactionType"],
    elements: Object.freeze(ordered.map((id) => Object.freeze({ id, text: textById.get(id) ?? id }))),
  });
}

function projectComplexityControl(input: PracticeControlProjectionInput): PracticeComplexityControl {
  const renderer = builtinRendererModel(input.renderer.model);
  if (!renderer || typeof renderer !== "object" || !("kind" in renderer) || renderer.kind !== "complexity") throw new Error("Value interaction presentation is invalid.");
  const selectedValues = input.localResponse?.kind === "complexity" ? input.localResponse.selectedValuesByDimension : {};
  return Object.freeze({
    kind: "complexity",
    interactionType: input.renderer.interactionType as PracticeComplexityControl["interactionType"],
    dimensions: Object.freeze(renderer.dimensions.map((dimension) => Object.freeze({
      id: dimension.id,
      ...(dimension.label ? { label: dimension.label } : {}),
      values: dimension.values,
      ...(selectedValues[dimension.id]?.length ? { selectedValues: selectedValues[dimension.id] } : dimension.selectedValues?.length ? { selectedValues: dimension.selectedValues } : {}),
    }))),
  });
}

function builtinRendererModel(model: unknown): BuiltinPracticeRendererModel {
  if (!model || typeof model !== "object" || !("renderer" in model)) throw new Error("Builtin interaction presentation is invalid.");
  const renderer = (model as { renderer?: unknown }).renderer;
  if (!renderer || typeof renderer !== "object" || !("kind" in renderer)) throw new Error("Builtin interaction presentation is invalid.");
  return renderer as BuiltinPracticeRendererModel;
}

/** The visible ordering is itself a complete response, even before a move. */
export function resolvePracticeLocalResponse(
  localResponse: PracticeLocalResponse,
  control: PracticeResponseControl,
): PracticeLocalResponse {
  if (localResponse) return localResponse;
  if (control.interactionType !== "ordering") return null;
  const model = control.model as BuiltinPracticeControlModel;
  if (!model || typeof model !== "object" || !("kind" in model) || model.kind !== "ordering") return null;
  return Object.freeze({
    kind: "ordering",
    orderedSubgoalIds: Object.freeze(model.elements.map((element) => element.id)),
  });
}

export function practiceChoiceSelectionMode(control: PracticeResponseControl): "single" | "multiple" | null {
  if (control.interactionType !== "choice_single" && control.interactionType !== "choice_multiple") return null;
  const model = control.model as BuiltinPracticeControlModel;
  return model && typeof model === "object" && "kind" in model && model.kind === "choice" ? model.selectionMode : null;
}

export function practiceOrderingElementIds(control: PracticeResponseControl): readonly string[] | null {
  if (control.interactionType !== "ordering") return null;
  const model = control.model as BuiltinPracticeControlModel;
  return model && typeof model === "object" && "kind" in model && model.kind === "ordering"
    ? Object.freeze(model.elements.map((element) => element.id))
    : null;
}

export function getPracticePrimaryAction(input: Readonly<{
  feedbackTiming: "afterEachAnswer" | "atSessionEnd";
  hasLocalResponse: boolean;
  isFinalPosition: boolean;
  phase: PracticeSurfacePhase;
}>): Readonly<{ enabled: boolean; label: string; loading: boolean }> | null {
  if (input.phase === "unanswered") {
    return Object.freeze({ enabled: input.hasLocalResponse, label: input.feedbackTiming === "atSessionEnd" ? "Submit answer" : "Check answer", loading: false });
  }
  if (input.phase === "submitting_before_journal") return Object.freeze({ enabled: false, label: input.feedbackTiming === "atSessionEnd" ? "Saving your answer…" : "Checking answer…", loading: true });
  if (input.phase === "submit_journal_failed") return Object.freeze({ enabled: input.hasLocalResponse, label: "Try again", loading: false });
  if (input.phase === "commit_pending") return Object.freeze({ enabled: false, label: "Saving your answer…", loading: true });
  if (input.phase === "advancing") return Object.freeze({ enabled: false, label: "Loading next question…", loading: true });
  if (input.phase === "feedback") return Object.freeze({ enabled: true, label: input.isFinalPosition ? "Finish session" : "Next", loading: false });
  if (input.phase === "advance_failed") return Object.freeze({ enabled: true, label: "Try again", loading: false });
  if (input.phase === "completing") return Object.freeze({ enabled: false, label: "Finishing session…", loading: true });
  return null;
}

/** Timer refresh can replace an equal projection before React commits the command render. */
export function hasReachedPracticeActionProjection(pending: Readonly<{ session: { id: string }; occurrenceId: string; operation: { kind: string }; response: unknown }> | null, current: Readonly<{ session: { id: string }; occurrenceId: string; operation: { kind: string }; response: unknown }> | null): boolean {
  return !!pending && !!current && pending.session.id === current.session.id && pending.occurrenceId === current.occurrenceId && pending.operation.kind === current.operation.kind && Boolean(pending.response) === Boolean(current.response);
}
