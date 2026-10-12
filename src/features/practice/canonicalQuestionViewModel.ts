import type { Question, JsonValue } from "../../content/canonical";
import type { PracticeInteractionRenderer } from "./practiceSessionPresentation";
import type { PracticeLocalResponse } from "./practiceSessionPresentation";
import { buildCanonicalInteractionViewModel } from "../../application/canonical/canonicalInteractionPresentation";

export type CanonicalQuestionViewModel = Readonly<{
  itemId: string;
  prompt: string;
  constraints: readonly string[];
  interaction: PracticeInteractionRenderer;
}>;

/** Preserves the selected handler's presentation as an opaque feature binding input. */
export function toCanonicalQuestionViewModel(question: Pick<Question, "constraints" | "interaction" | "prompt" | "questionId">): CanonicalQuestionViewModel {
  const projected = buildCanonicalInteractionViewModel(question as Question, null);
  return Object.freeze({
    itemId: question.questionId,
    prompt: question.prompt,
    constraints: Object.freeze([...(question.constraints ?? [])]),
    interaction: projected satisfies PracticeInteractionRenderer,
  });
}

/** Details are intentionally rendered only when they are already textual. */
export function canonicalJsonValueText(value: JsonValue): string | null {
  if (typeof value === "string") return value;
  if (value === null || typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function canonicalResponseToPracticeLocalResponse(value: unknown): PracticeLocalResponse {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "choice_single" && typeof value.optionId === "string") return { kind: "choice", selectedOptionIds: [value.optionId] };
  if (value.type === "choice_multiple" && isStringArray(value.optionIds)) return { kind: "choice", selectedOptionIds: value.optionIds };
  if (value.type === "ordering" && isStringArray(value.orderedElementIds)) return { kind: "ordering", orderedSubgoalIds: value.orderedElementIds };
  if (value.type === "complexity" || value.type === "decision_matrix") {
    if (!isRecord(value.selectedValueIdsByDimension)) return null;
    const entries = Object.entries(value.selectedValueIdsByDimension);
    if (entries.some(([, values]) => !isStringArray(values))) return null;
    return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(entries.map(([key, values]) => [key, [...values as string[]]])) };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === "string"); }
