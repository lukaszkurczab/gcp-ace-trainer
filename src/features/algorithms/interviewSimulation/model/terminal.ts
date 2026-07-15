import type {
  AlgorithmsInterviewSimulationController,
  AlgorithmsInterviewSimulationControllerState,
  AlgorithmsInterviewSimulationReviewDetail,
  AlgorithmsInterviewSimulationReviewFilter,
  AlgorithmsInterviewSimulationReviewRow,
  AlgorithmsInterviewSimulationTerminalProjection,
} from "../../../../application/algorithms";

/** Terminal presentation is intentionally limited to the controller's read API. */
export type SimulationTerminalController = Pick<
  AlgorithmsInterviewSimulationController,
  "getState" | "getReviewDetail" | "getReviewRows"
>;

export type SimulationCompletionKind = "manual" | "timeout" | "unknown";

export const SIMULATION_REVIEW_FILTERS: readonly AlgorithmsInterviewSimulationReviewFilter[] = Object.freeze([
  "all",
  "incorrect",
  "partial",
  "unanswered",
  "flagged",
]);

export type SimulationTerminalRead<T> =
  | Readonly<{ kind: "ready"; value: T }>
  | Readonly<{ kind: "unavailable"; message: string }>;

/**
 * Never derives terminal data from active runtime state. A terminal screen has
 * no safe local fallback: an unavailable projection must stay visible as such.
 */
export function readSimulationTerminal(
  controller: SimulationTerminalController,
): SimulationTerminalRead<AlgorithmsInterviewSimulationTerminalProjection> {
  const state = controller.getState();
  if (state.status === "terminal" && state.terminal) return Object.freeze({ kind: "ready", value: state.terminal });
  return Object.freeze({ kind: "unavailable", message: terminalUnavailableMessage(state) });
}

export function readSimulationReviewRows(
  controller: SimulationTerminalController,
  filter: AlgorithmsInterviewSimulationReviewFilter,
): SimulationTerminalRead<readonly AlgorithmsInterviewSimulationReviewRow[]> {
  const terminal = readSimulationTerminal(controller);
  if (terminal.kind === "unavailable") return terminal;
  try {
    return Object.freeze({ kind: "ready", value: controller.getReviewRows(filter) });
  } catch (error) {
    return Object.freeze({ kind: "unavailable", message: readFailureMessage(error) });
  }
}

export function readSimulationReviewDetail(
  controller: SimulationTerminalController,
  occurrenceId: string,
): SimulationTerminalRead<AlgorithmsInterviewSimulationReviewDetail> {
  const terminal = readSimulationTerminal(controller);
  if (terminal.kind === "unavailable") return terminal;
  try {
    return Object.freeze({ kind: "ready", value: controller.getReviewDetail(occurrenceId) });
  } catch (error) {
    return Object.freeze({ kind: "unavailable", message: readFailureMessage(error) });
  }
}

export function simulationCompletionLabel(kind: SimulationCompletionKind): string {
  if (kind === "manual") return "Completed manually";
  if (kind === "timeout") return "Time expired — finalized automatically";
  return "Finalization completed";
}

function terminalUnavailableMessage(state: AlgorithmsInterviewSimulationControllerState): string {
  if (state.failure) {
    if (state.failure.disposition === "retryable") return "Finalized records could not be read yet. Retry after recovery completes.";
    if (state.failure.disposition === "blocking") return "This simulation cannot be shown until its durable records are available.";
    return "This simulation cannot be restored from its durable records.";
  }
  return "Submit and finalize the simulation before reviewing outcomes.";
}

function readFailureMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "The requested finalized answer record is unavailable.";
}
