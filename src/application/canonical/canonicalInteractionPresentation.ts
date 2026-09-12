import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";

export type CanonicalInteractionViewModel = Readonly<{
  accessibility: Readonly<{
    controls: readonly Readonly<{ checked?: boolean; id: string; label: string; role: "checkbox" | "radio" | "option" | "select" }>[];
    interactionKind: "choice" | "ordering" | "complexity";
    label: string;
  }>;
  renderer:
    | Readonly<{ kind: "choice"; options: readonly Readonly<{ id: string; selected: boolean; text: string }>[] }>
    | Readonly<{ kind: "ordering"; elements: readonly Readonly<{ id: string; text: string }>[] }>
    | Readonly<{ kind: "complexity"; dimensions: readonly Readonly<{ id: string; selectedValue?: string; values: readonly string[] }>[] }>;
}>;

export function buildCanonicalInteractionViewModel(question: Question, response: CanonicalQuestionResponse | null, displayOrder: readonly string[] = []): CanonicalInteractionViewModel {
  const interaction = question.interaction;
  if (interaction.type === "choice_single" || interaction.type === "choice_multiple") {
    const ids = interaction.options.map((option) => option.optionId);
    const order = displayOrder.length ? displayOrder : ids;
    if (order.length !== ids.length || new Set(order).size !== ids.length || order.some((id) => !ids.includes(id))) throw new Error(`Canonical display order is invalid for ${question.questionId}.`);
    const selected = response?.type === "choice_single" && interaction.type === "choice_single" ? new Set([response.optionId]) : response?.type === "choice_multiple" && interaction.type === "choice_multiple" ? new Set(response.optionIds) : new Set<string>();
    const options = Object.freeze(order.map((id) => { const option = interaction.options.find((candidate) => candidate.optionId === id)!; return Object.freeze({ id, selected: selected.has(id), text: option.text }); }));
    const role = interaction.type === "choice_multiple" ? "checkbox" as const : "radio" as const;
    return Object.freeze({ accessibility: Object.freeze({ controls: Object.freeze(options.map((option) => Object.freeze({ checked: option.selected, id: option.id, label: option.text, role }))), interactionKind: "choice", label: question.prompt }), renderer: Object.freeze({ kind: "choice", options }) });
  }
  if (interaction.type === "ordering") {
    const order = response?.type === "ordering" ? response.orderedElementIds : (displayOrder.length ? displayOrder : interaction.elements.map((element) => element.elementId));
    const elements = Object.freeze(order.map((id) => { const element = interaction.elements.find((candidate) => candidate.elementId === id); if (!element) throw new Error(`Canonical ordering element is invalid for ${question.questionId}.`); return Object.freeze({ id, text: element.text }); }));
    return Object.freeze({ accessibility: Object.freeze({ controls: Object.freeze(elements.map((entry) => Object.freeze({ id: entry.id, label: entry.text, role: "option" as const }))), interactionKind: "ordering", label: question.prompt }), renderer: Object.freeze({ kind: "ordering", elements }) });
  }
  const selected = response?.type === interaction.type ? response.selectedValueIdsByDimension : {};
  const dimensions = Object.freeze(interaction.dimensions.map((dimension) => Object.freeze({ id: dimension.dimensionId, ...(selected[dimension.dimensionId]?.[0] ? { selectedValue: selected[dimension.dimensionId]![0] } : {}), values: Object.freeze(dimension.values.map((value) => value.valueId)) })));
  return Object.freeze({ accessibility: Object.freeze({ controls: Object.freeze(dimensions.map((entry) => Object.freeze({ id: entry.id, label: entry.id, role: "select" as const }))), interactionKind: "complexity", label: question.prompt }), renderer: Object.freeze({ kind: "complexity", dimensions }) });
}

export function composeCanonicalFeedback(question: Question, response: CanonicalQuestionResponse) {
  return Object.freeze({ correctness: scoreCanonicalQuestion(question, response).kind, reason: question.feedback.reason, details: question.feedback.details });
}
