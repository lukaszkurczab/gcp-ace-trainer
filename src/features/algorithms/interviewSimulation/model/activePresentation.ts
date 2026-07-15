import type { SimulationNavigatorItem } from "./types";

type NavigatorOccurrence = Readonly<{
  answerState: "unanswered" | "partial" | "complete";
  flagged: boolean;
  index: number;
}>;

export type SimulationNavigatorProjectionOptions = Readonly<{
  erroredIndices?: readonly number[];
  unavailableIndices?: readonly number[];
}>;

/**
 * Renderer availability is a presentation concern. It does not reinterpret
 * content: missing/corrupt planned items remain controller-level fatal errors.
 */
export function isSimulationQuestionRenderable(question: unknown): boolean {
  if (!question || typeof question !== "object") return false;
  const record = question as Readonly<Record<string, unknown>>;
  if (Array.isArray(record.options)) return true;
  if (Array.isArray(record.subgoals)) return true;
  const complexity = record.correctComplexity;
  return Boolean(complexity && typeof complexity === "object" && Array.isArray((complexity as Readonly<Record<string, unknown>>).dimensions));
}

/** Active-state projection only: it deliberately exposes no score or feedback. */
export function buildSimulationNavigatorItems(
  occurrences: readonly NavigatorOccurrence[],
  options: SimulationNavigatorProjectionOptions = {},
): readonly SimulationNavigatorItem[] {
  const errored = new Set(options.erroredIndices);
  const unavailable = new Set(options.unavailableIndices);
  return occurrences.map((occurrence) => ({
    index: occurrence.index,
    state: unavailable.has(occurrence.index)
      ? "unavailable"
      : errored.has(occurrence.index)
        ? "error"
        : occurrence.flagged
      ? "flagged"
      : occurrence.answerState === "complete"
        ? "answered"
        : "unanswered",
  }));
}

/** Pending and failed durable commands must block active progression. */
export function isSimulationPresentationBlocked(
  operation: Readonly<{ kind: string; status?: "pending" | "failed" }>,
  remainingMs: number,
): boolean {
  return remainingMs <= 0 || operation.status === "pending" || operation.status === "failed";
}
