import type { Question, CanonicalQuestionResponse, JsonValue } from "../../content/canonical";
import type { PracticeInteractionRenderer, PracticeResponseControl } from "./practiceSessionPresentation";
import type { PracticeLocalResponse } from "./practiceSessionPresentation";

export type CanonicalQuestionViewModel = Readonly<{
  itemId: string;
  prompt: string;
  constraints: readonly string[];
  interaction: PracticeInteractionRenderer;
}>;

/** Projects the canonical union into the one renderer contract owned by practice UI. */
export function toCanonicalQuestionViewModel(question: Question): CanonicalQuestionViewModel {
  const interaction = question.interaction;
  if (interaction.type === "choice_single" || interaction.type === "choice_multiple") {
    return Object.freeze({
      itemId: question.questionId,
      prompt: question.prompt,
      constraints: Object.freeze([...(question.constraints ?? [])]),
      interaction: Object.freeze({ kind: "choice", options: Object.freeze(interaction.options.map((option) => Object.freeze({ id: option.optionId, selected: false, text: option.text }))) }),
    });
  }
  if (interaction.type === "ordering") {
    return Object.freeze({
      itemId: question.questionId,
      prompt: question.prompt,
      constraints: Object.freeze([...(question.constraints ?? [])]),
      interaction: Object.freeze({ kind: "ordering", elements: Object.freeze(interaction.elements.map((element) => Object.freeze({ id: element.elementId, text: element.text }))) }),
    });
  }
  return Object.freeze({
    itemId: question.questionId,
    prompt: question.prompt,
    constraints: Object.freeze([...(question.constraints ?? [])]),
    interaction: Object.freeze({
      kind: "complexity",
      dimensions: Object.freeze(interaction.dimensions.map((dimension) => Object.freeze({
        id: dimension.dimensionId,
        label: dimension.label,
        values: Object.freeze(dimension.values.map((value) => value.text)),
      }))),
    }),
  });
}

export function responseToCanonicalQuestionResponse(question: Question, response: PracticeResponseControl): CanonicalQuestionResponse | null {
  if (response.kind === "choice") {
    const ids = response.options.filter((option) => option.state === "selected").map((option) => option.id);
    return response.selectionMode === "multiple" ? { type: "choice_multiple", optionIds: ids } : ids.length ? { type: "choice_single", optionId: ids[0]! } : null;
  }
  if (response.kind === "ordering") return { type: "ordering", orderedElementIds: response.elements.map((element) => element.id) };
  const selected = Object.fromEntries(response.dimensions.flatMap((dimension) => dimension.selectedValue ? [[dimension.id, [dimension.selectedValue]]] : []));
  if (!response.dimensions.every((dimension) => Boolean(dimension.selectedValue))) return null;
  return question.interaction.type === "decision_matrix"
    ? { type: "decision_matrix", selectedValueIdsByDimension: selected }
    : { type: "complexity", selectedValueIdsByDimension: selected };
}

/** Details are intentionally rendered only when they are already textual. */
export function canonicalJsonValueText(value: JsonValue): string | null {
  if (typeof value === "string") return value;
  if (value === null || typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function canonicalResponseToPracticeLocalResponse(response: CanonicalQuestionResponse | null): PracticeLocalResponse {
  if (!response) return null;
  if (response.type === "choice_single") return { kind: "choice", selectedOptionIds: [response.optionId] };
  if (response.type === "choice_multiple") return { kind: "choice", selectedOptionIds: response.optionIds };
  if (response.type === "ordering") return { kind: "ordering", orderedSubgoalIds: response.orderedElementIds };
  return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(Object.entries(response.selectedValueIdsByDimension).map(([key, values]) => [key, values[0] ?? ""])) };
}
